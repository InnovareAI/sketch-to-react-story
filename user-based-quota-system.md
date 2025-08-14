# User-Based Quota System Design

## 🎯 System Architecture: 3,000 Contacts per User per Month

### **Key Requirements:**
- **Individual user quotas**: 3,000 contacts/month per user
- **Organization-wide API**: Centralized Apollo integration
- **Usage tracking**: Real-time quota monitoring per user
- **Workspace sharing**: Users across workspaces access same system

## 📊 Database Schema Updates

### **1. User Quota Tracking Table**
```sql
CREATE TABLE user_quota_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  month_year TEXT NOT NULL, -- Format: "2025-01"
  contacts_extracted INTEGER DEFAULT 0,
  contacts_remaining INTEGER DEFAULT 3000,
  last_extraction_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, month_year)
);

-- Index for performance
CREATE INDEX idx_user_quota_month ON user_quota_usage(user_id, month_year);
```

### **2. Organization API Keys Table**
```sql
CREATE TABLE organization_api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_name TEXT NOT NULL,
  apify_api_token TEXT NOT NULL,
  monthly_budget_usd DECIMAL(10,2) DEFAULT 0,
  current_month_spend DECIMAL(10,2) DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **3. Extraction Audit Log**
```sql
CREATE TABLE extraction_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  workspace_id UUID REFERENCES workspaces(id),
  extraction_type TEXT NOT NULL, -- 'apollo', 'linkedin', 'simulation'
  search_url TEXT,
  contacts_requested INTEGER,
  contacts_delivered INTEGER,
  cost_usd DECIMAL(8,4),
  apify_run_id TEXT,
  processing_time_ms INTEGER,
  status TEXT DEFAULT 'completed', -- 'pending', 'completed', 'failed'
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🏗 Organization API Layer

### **1. Quota Management Service**
```typescript
// src/services/organizationQuotaService.ts
export class OrganizationQuotaService {
  async getUserQuota(userId: string): Promise<{
    totalQuota: number;
    used: number;
    remaining: number;
    resetDate: Date;
  }> {
    const currentMonth = new Date().toISOString().slice(0, 7); // "2025-01"
    
    const { data: quota } = await supabase
      .from('user_quota_usage')
      .select('*')
      .eq('user_id', userId)
      .eq('month_year', currentMonth)
      .single();
    
    if (!quota) {
      // Create new quota for this month
      await this.initializeUserQuota(userId, currentMonth);
      return { totalQuota: 3000, used: 0, remaining: 3000, resetDate: this.getNextResetDate() };
    }
    
    return {
      totalQuota: 3000,
      used: quota.contacts_extracted,
      remaining: quota.contacts_remaining,
      resetDate: this.getNextResetDate()
    };
  }
  
  async canExtractContacts(userId: string, requestedCount: number): Promise<{
    allowed: boolean;
    availableCount: number;
    reason?: string;
  }> {
    const quota = await this.getUserQuota(userId);
    
    if (requestedCount > quota.remaining) {
      return {
        allowed: false,
        availableCount: quota.remaining,
        reason: `Request for ${requestedCount} exceeds remaining quota of ${quota.remaining}`
      };
    }
    
    return { allowed: true, availableCount: requestedCount };
  }
  
  async recordExtraction(userId: string, workspaceId: string, extractionDetails: {
    contactsDelivered: number;
    costUsd: number;
    extractionType: string;
    searchUrl: string;
    apifyRunId?: string;
    processingTimeMs: number;
  }): Promise<void> {
    const currentMonth = new Date().toISOString().slice(0, 7);
    
    // Update user quota
    await supabase.rpc('increment_user_quota_usage', {
      p_user_id: userId,
      p_month_year: currentMonth,
      p_contacts_used: extractionDetails.contactsDelivered
    });
    
    // Log extraction
    await supabase
      .from('extraction_audit_log')
      .insert({
        user_id: userId,
        workspace_id: workspaceId,
        extraction_type: extractionDetails.extractionType,
        search_url: extractionDetails.searchUrl,
        contacts_requested: extractionDetails.contactsDelivered, // Assuming all requested were delivered
        contacts_delivered: extractionDetails.contactsDelivered,
        cost_usd: extractionDetails.costUsd,
        apify_run_id: extractionDetails.apifyRunId,
        processing_time_ms: extractionDetails.processingTimeMs
      });
  }
}
```

### **2. Organization Apollo Service**
```typescript
// src/services/organizationApolloService.ts
export class OrganizationApolloService extends ApifyMcpService {
  private quotaService = new OrganizationQuotaService();
  
  async extractProspectsForUser(
    userId: string,
    workspaceId: string,
    searchUrl: string,
    maxResults: number = 100
  ): Promise<ExtractionResult & { quotaInfo: any }> {
    
    // 1. Check user quota
    const quotaCheck = await this.quotaService.canExtractContacts(userId, maxResults);
    if (!quotaCheck.allowed) {
      return {
        success: false,
        prospects: [],
        method_used: 'quota_exceeded',
        data_quality: 'poor',
        errors: [quotaCheck.reason || 'Quota exceeded'],
        warnings: [`You can extract up to ${quotaCheck.availableCount} more contacts this month`],
        extractedCount: 0,
        failedCount: 0,
        processing_time_ms: 0,
        quotaInfo: await this.quotaService.getUserQuota(userId)
      };
    }
    
    // 2. Perform extraction (limited to available quota)
    const actualMaxResults = Math.min(maxResults, quotaCheck.availableCount);
    const startTime = Date.now();
    
    const result = await this.extractLinkedInProfiles(searchUrl, {
      maxResults: actualMaxResults,
      extractEmails: true,
      extractPhones: false
    });
    
    const processingTime = Date.now() - startTime;
    
    // 3. Record usage if successful
    if (result.success && result.data.length > 0) {
      const prospects = this.convertToProspects(result.data);
      const estimatedCost = prospects.length * 0.0012; // $1.20 per 1000
      
      await this.quotaService.recordExtraction(userId, workspaceId, {
        contactsDelivered: prospects.length,
        costUsd: estimatedCost,
        extractionType: 'apollo',
        searchUrl,
        apifyRunId: result.runId,
        processingTimeMs: processingTime
      });
      
      return {
        success: true,
        prospects,
        method_used: 'apollo',
        data_quality: 'excellent',
        errors: result.errors,
        warnings: result.errors.length > 0 ? [`${result.errors.length} profiles had extraction issues`] : [],
        extractedCount: prospects.length,
        failedCount: result.data.length - prospects.length,
        processing_time_ms: processingTime,
        cost_estimate: estimatedCost,
        quotaInfo: await this.quotaService.getUserQuota(userId)
      };
    }
    
    // 4. Return failure with quota info
    return {
      ...result,
      prospects: [],
      quotaInfo: await this.quotaService.getUserQuota(userId)
    };
  }
}
```

## 🎯 Integration with Current System

### **1. Update AddPeopleTab Component**
```typescript
// Show user quota in UI
const [userQuota, setUserQuota] = useState(null);

useEffect(() => {
  loadUserQuota();
}, []);

const loadUserQuota = async () => {
  const quota = await organizationApolloService.getUserQuota();
  setUserQuota(quota);
};

// Update extraction function
const extractFromSearchUrl = useCallback(async () => {
  const result = await organizationApolloService.extractProspectsForUser(
    currentUser.id,
    currentWorkspace.id,
    searchUrl,
    maxResults
  );
  
  // Update quota display
  setUserQuota(result.quotaInfo);
  
  // Handle results...
}, []);
```

### **2. Quota Display Component**
```typescript
function UserQuotaDisplay({ quota }: { quota: any }) {
  const percentageUsed = (quota.used / quota.totalQuota) * 100;
  
  return (
    <div className="bg-muted p-4 rounded-lg">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium">Monthly Quota</span>
        <span className="text-sm text-muted-foreground">
          {quota.used.toLocaleString()} / {quota.totalQuota.toLocaleString()}
        </span>
      </div>
      <div className="w-full bg-background rounded-full h-2">
        <div 
          className={`h-2 rounded-full ${percentageUsed > 90 ? 'bg-destructive' : percentageUsed > 70 ? 'bg-warning' : 'bg-primary'}`}
          style={{ width: `${percentageUsed}%` }}
        />
      </div>
      <div className="text-xs text-muted-foreground mt-1">
        Resets on {quota.resetDate.toLocaleDateString()}
      </div>
    </div>
  );
}
```

## 🚀 Deployment Benefits

### **Individual User Management:**
- ✅ **3,000 contacts per user per month**
- ✅ **Real-time quota tracking and warnings**
- ✅ **Automatic monthly resets**
- ✅ **Usage audit trail**

### **Organization Efficiency:**
- ✅ **Centralized Apollo API management**
- ✅ **Bulk pricing negotiations possible**
- ✅ **Usage analytics across all users**
- ✅ **Cost optimization opportunities**

### **Scalable Business Model:**
- ✅ **User-based pricing**: $X per user per month
- ✅ **Predictable costs**: 3000 × users × $0.0012 = max monthly cost
- ✅ **Overage options**: Extra quota packages available
- ✅ **Enterprise tiers**: Higher quotas for premium users

This architecture provides **individual user quotas** while maintaining **centralized cost efficiency** through shared organization APIs!