# SAM AI Campaign Schema Deployment Guide

## Quick Start Deployment

### Prerequisites
- Node.js installed
- Supabase Service Role Key
- Access to your Supabase project at `ktchrfgkbpaixbiwbieg.supabase.co`

### Step 1: Set Environment Variable
```bash
export SUPABASE_SERVICE_ROLE_KEY="your_service_role_key_here"
```

### Step 2: Deploy the Schema
```bash
# Navigate to project directory
cd /Users/tvonlinz/Dev_Master/InnovareAI/sketch-to-react-story

# Install dependencies (if needed)
npm install @supabase/supabase-js

# Apply the comprehensive campaign schema
node sql/apply-campaign-schema.js
```

### Step 3: Load Sample Data (Optional)
```bash
# Load sample data for testing
psql -h db.ktchrfgkbpaixbiwbieg.supabase.co -U postgres -d postgres -f sql/campaign-sample-data.sql
```

### Step 4: Validate Deployment
```bash
# Run validation tests
node sql/validate-campaign-schema.js
```

## What Gets Deployed

### 🗄️ Database Tables (13 tables)
- **campaigns** - Dynamic campaign management with 1-10+ steps
- **campaign_step_templates** - Reusable step configurations  
- **prospects** - Enhanced prospect profiles with approval workflow
- **campaign_prospects** - Campaign assignments with step tracking
- **extraction_jobs** - Bulk prospect extraction monitoring
- **extraction_records** - Individual extraction results
- **n8n_campaign_executions** - N8N workflow execution tracking
- **n8n_campaign_templates** - N8N workflow templates
- **campaign_knowledge_base** - RAG context and intelligence data
- **campaign_insights** - AI-generated insights and recommendations
- **campaign_messages** - Multi-channel message tracking
- **campaign_analytics_daily** - Daily performance metrics
- **campaign_benchmarks** - Industry performance benchmarks

### 🔧 Functions & Triggers
- **update_campaign_metrics()** - Auto-update campaign performance
- **calculate_prospect_completeness()** - Data quality scoring
- **generate_daily_campaign_analytics()** - Analytics generation
- **update_prospect_completeness_trigger** - Auto-calculate data completeness

### 🔐 Security & RLS
- Row Level Security enabled on all tables
- Workspace isolation policies
- Multi-tenant data protection

### ⚡ Performance Optimizations
- 25+ indexes for query optimization
- JSON field indexing for campaign steps
- Analytics query optimization

## Key Features Enabled

### ✅ Dynamic Campaign Steps
- Configure 1-10+ campaign steps dynamically
- Support for all step types: connection_request, message, email, wait, ai_action, condition
- Conditional logic and branching workflows
- Step template system for reusability

### ✅ Advanced Prospect Management
- Approval workflow (pending → approved/rejected)
- Data quality scoring and completeness tracking
- Multi-source extraction support
- Enrichment status tracking

### ✅ N8N Integration
- Full workflow execution tracking
- Template-based workflow deployment
- Error handling and retry logic
- Performance monitoring

### ✅ Campaign Intelligence
- RAG-based knowledge management
- AI-generated insights and recommendations
- Performance prediction and optimization
- Automated personalization scoring

### ✅ Multi-Channel Messaging
- LinkedIn, email, SMS support
- Message status tracking
- Response analysis and sentiment scoring
- Automated follow-up sequences

### ✅ Comprehensive Analytics
- Daily performance metrics
- Real-time campaign monitoring
- Industry benchmarking
- ROI and conversion tracking

## React Component Integration

### Campaign Creation
```typescript
// Use the new campaigns table structure
const campaignData = {
  name: 'LinkedIn Outreach Q1',
  type: 'linkedin',
  campaign_steps: [
    { step: 1, type: 'connection_request', name: 'Connect', config: {...} },
    { step: 2, type: 'wait', name: 'Wait 48h', config: {wait_hours: 48} },
    { step: 3, type: 'message', name: 'Follow up', config: {...} }
  ],
  total_steps: 3,
  ai_settings: {
    personalization_enabled: true,
    sentiment_analysis: true
  }
};
```

### Prospect Approval
```typescript
// Query prospects awaiting approval
const { data: pendingProspects } = await supabase
  .from('prospects')
  .select('*')
  .eq('approval_status', 'pending')
  .eq('workspace_id', workspaceId);

// Approve prospect
await supabase
  .from('prospects')
  .update({ 
    approval_status: 'approved',
    approved_by: userId,
    approved_at: new Date().toISOString()
  })
  .eq('id', prospectId);
```

### Campaign Analytics
```typescript
// Get campaign performance
const { data: analytics } = await supabase
  .from('campaign_analytics_daily')
  .select('*')
  .eq('campaign_id', campaignId)
  .gte('date', startDate)
  .order('date');

// Get AI insights
const { data: insights } = await supabase
  .from('campaign_insights')
  .select('*')
  .eq('campaign_id', campaignId)
  .eq('implementation_status', 'pending')
  .order('confidence_score', { ascending: false });
```

## N8N Workflow Templates

The schema includes 4 pre-built N8N workflow templates:

1. **linkedin_outreach_basic** - Basic LinkedIn outreach automation
2. **email_sequence_basic** - Email sequence automation
3. **prospect_extraction_linkedin** - LinkedIn prospect extraction
4. **ai_response_handler** - AI-powered response handling

Access templates:
```sql
SELECT * FROM n8n_campaign_templates WHERE is_active = true;
```

## Sample Data Included

### 📊 2 Sample Campaigns
- LinkedIn Sales Outreach (8-step workflow)
- Multi-Channel Product Launch (5-step workflow)

### 👥 5 Sample Prospects
- Various industries and seniority levels
- Different approval statuses for testing

### 🔧 8 Campaign Step Templates
- Connection requests, follow-ups, emails
- AI actions and wait steps
- Personalization configurations

### 📈 Historical Analytics
- 7 days of sample performance data
- Response rates and engagement metrics

## Troubleshooting

### Common Issues

1. **Permission Errors**
   ```bash
   # Ensure you're using the service role key
   echo $SUPABASE_SERVICE_ROLE_KEY
   ```

2. **Table Already Exists**
   - The schema uses `CREATE TABLE IF NOT EXISTS`
   - Existing data is preserved with `ON CONFLICT DO NOTHING`

3. **Function Errors**
   ```sql
   -- Check if functions exist
   SELECT routine_name FROM information_schema.routines 
   WHERE routine_schema = 'public';
   ```

4. **RLS Policy Issues**
   ```sql
   -- Verify RLS is enabled
   SELECT tablename, rowsecurity FROM pg_tables 
   WHERE schemaname = 'public' AND tablename LIKE 'campaign%';
   ```

### Performance Issues

1. **Slow Queries**
   ```sql
   -- Check index usage
   SELECT schemaname, tablename, indexname 
   FROM pg_indexes 
   WHERE tablename LIKE 'campaign%';
   ```

2. **Analytics Generation**
   ```sql
   -- Manually trigger analytics
   SELECT generate_daily_campaign_analytics('campaign-id', CURRENT_DATE);
   ```

## Next Steps

1. **Update React Components** - Integrate with new schema structure
2. **Configure N8N Workflows** - Deploy provided workflow templates
3. **Set Up Extraction Jobs** - Configure Bright Data integration
4. **Enable AI Features** - Connect GPT-4 for insights and personalization
5. **Monitor Performance** - Use provided analytics and monitoring tools

## Support

- **Documentation**: `/docs/CAMPAIGN_DATABASE_INTEGRATION_GUIDE.md`
- **Schema File**: `/sql/comprehensive-campaign-schema.sql`
- **Sample Data**: `/sql/campaign-sample-data.sql`
- **Validation**: `/sql/validate-campaign-schema.js`

The comprehensive campaign schema provides a solid foundation for the SAM AI platform's advanced campaign management, prospect handling, and intelligence features.