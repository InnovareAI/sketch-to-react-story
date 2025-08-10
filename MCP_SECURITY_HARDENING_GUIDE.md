# MCP Integration Security Hardening Guide

**Sam AI Multi-Tenant System**  
**Critical for Production Deployment**

---

## 🛡️ MCP Security Architecture

The Model Context Protocol (MCP) integrations in Sam AI must maintain strict tenant boundaries to prevent data leakage between customer workspaces.

### Security Requirements
- **Tenant Isolation**: MCP operations must be scoped to specific workspaces
- **API Key Isolation**: External service credentials per workspace
- **Data Flow Security**: No cross-tenant data in MCP pipelines
- **Audit Trail**: Complete logging of MCP operations per tenant

---

## 🔧 MCP Configuration Security

### 1. Workspace-Scoped MCP Connections

**Current MCP Config:** `/mcp-configs/claude-desktop-sam-ai.json`

```json
{
  "mcpServers": {
    "supabase-sam-ai": {
      "command": "npx",
      "args": [
        "@supabase/mcp-server",
        "--db-url", "postgresql://postgres:password@host:5432/postgres",
        "--schema-path", "./COMPLETE_SAM_AI_SCHEMA.sql"
      ],
      "env": {
        "WORKSPACE_ID": "{{CURRENT_WORKSPACE_ID}}",
        "ENFORCE_RLS": "true",
        "TENANT_MODE": "strict"
      }
    }
  }
}
```

**Security Hardening Required:**
```json
{
  "mcpServers": {
    "supabase-sam-ai": {
      "command": "npx", 
      "args": [
        "@supabase/mcp-server",
        "--db-url", "postgresql://postgres:[SECURE_PASSWORD]@[HOST]:5432/[DATABASE]",
        "--schema-path", "./COMPLETE_SAM_AI_SCHEMA.sql",
        "--row-level-security", "enforce",
        "--tenant-isolation", "workspace_id"
      ],
      "env": {
        "SUPABASE_URL": "https://latxadqrvrrrcvkktrog.supabase.co",
        "SUPABASE_SERVICE_KEY": "{{SERVICE_KEY_WITH_RLS_BYPASS}}",
        "WORKSPACE_ISOLATION": "strict",
        "AUDIT_LOGGING": "enabled",
        "MCP_SECURITY_MODE": "production"
      }
    }
  }
}
```

### 2. MCP Server Security Middleware

Create MCP security middleware to enforce tenant boundaries:

```javascript
// mcp-security-middleware.js
export class MCPSecurityMiddleware {
    constructor(workspaceId, supabaseClient) {
        this.workspaceId = workspaceId;
        this.supabase = supabaseClient;
    }
    
    async validateWorkspaceAccess(operation, entityId) {
        // Validate that user can access this workspace
        const { data, error } = await this.supabase
            .from('profiles')
            .select('workspace_id')
            .eq('id', auth.uid())
            .eq('workspace_id', this.workspaceId)
            .single();
            
        if (error || !data) {
            throw new Error('Access denied - invalid workspace');
        }
        
        return true;
    }
    
    async filterQueryByWorkspace(query, table) {
        // Automatically add workspace_id filter to all queries
        return {
            ...query,
            where: {
                ...query.where,
                workspace_id: this.workspaceId
            }
        };
    }
}
```

---

## 🔐 API Key and Credentials Security

### 1. Workspace-Scoped Integration Credentials

**Database Schema for Secure Credential Storage:**
```sql
-- Integrations table with workspace-scoped credentials
CREATE TABLE integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK (provider IN ('apify', 'unipile', 'hubspot', 'salesforce', 'n8n')),
    credentials JSONB DEFAULT '{}', -- Encrypted credentials
    settings JSONB DEFAULT '{}',
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policy for credentials isolation
CREATE POLICY "workspace_credentials_isolation" ON integrations
FOR ALL USING (
    workspace_id IN (
        SELECT workspace_id FROM profiles 
        WHERE profiles.id = auth.uid()
    )
);
```

### 2. Encrypted Credential Storage

**Implementation in MCP Operations:**
```javascript
// Secure credential retrieval
export async function getWorkspaceCredentials(workspaceId, provider) {
    const { data, error } = await supabase
        .from('integrations')
        .select('credentials')
        .eq('workspace_id', workspaceId)
        .eq('provider', provider)
        .eq('status', 'active')
        .single();
        
    if (error) {
        throw new Error(`No credentials found for ${provider} in workspace ${workspaceId}`);
    }
    
    // Decrypt credentials before use
    return decryptCredentials(data.credentials);
}

// Usage in MCP operations
async function executeMCPOperation(workspaceId, operation) {
    // Validate workspace access first
    await validateWorkspaceAccess(workspaceId);
    
    // Get workspace-scoped credentials
    const credentials = await getWorkspaceCredentials(workspaceId, operation.provider);
    
    // Execute with workspace isolation
    return await operation.execute(credentials, { workspaceId });
}
```

---

## 🔒 n8n Workflow Security

### 1. Workspace-Scoped Workflow Execution

**Database Integration:**
```sql
-- Workflows table with workspace isolation
CREATE TABLE workflows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    n8n_workflow_id TEXT,
    settings JSONB DEFAULT '{}',
    -- Ensure all workflows are workspace-scoped
    CONSTRAINT workspace_workflow_unique UNIQUE(workspace_id, n8n_workflow_id)
);
```

**MCP n8n Integration Security:**
```javascript
// Secure n8n workflow execution
export async function executeN8nWorkflow(workspaceId, workflowId, inputData) {
    // Validate workspace ownership of workflow
    const { data: workflow, error } = await supabase
        .from('workflows')
        .select('n8n_workflow_id, settings')
        .eq('workspace_id', workspaceId)
        .eq('id', workflowId)
        .single();
        
    if (error) {
        throw new Error('Workflow not found or access denied');
    }
    
    // Add workspace context to n8n execution
    const executionData = {
        ...inputData,
        __workspace_id: workspaceId,
        __tenant_context: {
            workspace: workspaceId,
            isolation_mode: 'strict'
        }
    };
    
    return await n8nClient.executeWorkflow(workflow.n8n_workflow_id, executionData);
}
```

### 2. n8n Webhook Security

**Secure Webhook Endpoints:**
```javascript
// n8n webhook with workspace validation
app.post('/webhook/n8n/:workspaceId/:workflowId', async (req, res) => {
    const { workspaceId, workflowId } = req.params;
    
    // Validate workspace and workflow ownership
    const isValid = await validateWorkspaceWorkflow(workspaceId, workflowId);
    if (!isValid) {
        return res.status(403).json({ error: 'Access denied' });
    }
    
    // Add workspace context to webhook payload
    const payload = {
        ...req.body,
        __workspace_id: workspaceId,
        __security_context: 'webhook_validated'
    };
    
    // Process webhook with workspace isolation
    await processWebhookWithIsolation(workspaceId, payload);
    res.json({ status: 'processed' });
});
```

---

## 🧪 MCP Security Testing

### 1. Tenant Isolation Tests

**Test Suite for MCP Security:**
```javascript
// test-mcp-security.js
import { testMCPTenantIsolation } from './mcp-security-tests.js';

async function runMCPSecurityTests() {
    const tests = [
        {
            name: 'MCP operations respect workspace boundaries',
            test: async () => {
                const workspace1 = 'ws1-test-id';
                const workspace2 = 'ws2-test-id';
                
                // Create data in workspace1
                await mcpClient.createContact(workspace1, { name: 'Test Contact' });
                
                // Try to access from workspace2 (should fail)
                const contacts = await mcpClient.getContacts(workspace2);
                return contacts.length === 0;
            }
        },
        {
            name: 'API credentials are workspace-isolated',
            test: async () => {
                const workspace1Creds = await getWorkspaceCredentials('ws1', 'hubspot');
                const workspace2Creds = await getWorkspaceCredentials('ws2', 'hubspot');
                
                return workspace1Creds.api_key !== workspace2Creds.api_key;
            }
        },
        {
            name: 'n8n workflows cannot access other workspace data',
            test: async () => {
                // Execute workflow with workspace1 context
                const result = await executeN8nWorkflow('ws1', 'workflow-id', {
                    action: 'get_contacts'
                });
                
                // Verify only workspace1 contacts returned
                return result.contacts.every(c => c.workspace_id === 'ws1');
            }
        }
    ];
    
    return runSecurityTestSuite(tests);
}
```

### 2. MCP Audit Logging

**Implementation:**
```javascript
// mcp-audit-logger.js
export class MCPAuditLogger {
    constructor(workspaceId, supabaseClient) {
        this.workspaceId = workspaceId;
        this.supabase = supabaseClient;
    }
    
    async logMCPOperation(operation, entityType, entityId, metadata = {}) {
        await this.supabase
            .from('analytics_events')
            .insert({
                workspace_id: this.workspaceId,
                event_type: `mcp_${operation}`,
                entity_type: entityType,
                entity_id: entityId,
                properties: {
                    ...metadata,
                    user_id: auth.uid(),
                    timestamp: new Date().toISOString(),
                    mcp_security_context: 'enforced'
                }
            });
    }
}

// Usage in MCP operations
const auditLogger = new MCPAuditLogger(workspaceId, supabase);

await auditLogger.logMCPOperation('read', 'contacts', contactId, {
    query: queryParams,
    result_count: results.length
});
```

---

## 🚨 Security Incident Response

### 1. MCP Security Monitoring

**Real-time Security Monitoring:**
```sql
-- Create security monitoring view
CREATE VIEW mcp_security_events AS
SELECT 
    ae.*,
    p.email as user_email,
    w.name as workspace_name
FROM analytics_events ae
JOIN profiles p ON ae.properties->>'user_id' = p.id::text
JOIN workspaces w ON ae.workspace_id = w.id
WHERE ae.event_type LIKE 'mcp_%'
AND ae.created_at > NOW() - INTERVAL '24 hours';

-- Alert on suspicious MCP activity
CREATE OR REPLACE FUNCTION check_mcp_security_violations()
RETURNS TRIGGER AS $$
BEGIN
    -- Alert on cross-workspace access attempts
    IF NEW.properties->>'error' LIKE '%access denied%workspace%' THEN
        INSERT INTO security_alerts (
            workspace_id, 
            alert_type, 
            severity, 
            details
        ) VALUES (
            NEW.workspace_id,
            'mcp_cross_tenant_access_attempt',
            'high',
            jsonb_build_object(
                'user_id', NEW.properties->>'user_id',
                'attempted_operation', NEW.event_type,
                'timestamp', NEW.created_at
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 2. Emergency Response Procedures

**MCP Security Incident Response:**
1. **Immediate Actions:**
   - Disable affected MCP integrations
   - Block suspicious API keys
   - Audit all recent MCP operations

2. **Investigation:**
   - Review MCP audit logs
   - Check credential access patterns
   - Verify tenant data boundaries

3. **Recovery:**
   - Rotate compromised credentials
   - Update MCP security configurations
   - Re-enable services with enhanced monitoring

---

## 📋 MCP Security Checklist

### Pre-Production Validation
- [ ] All MCP operations respect workspace boundaries
- [ ] API credentials properly isolated per workspace
- [ ] n8n workflows cannot access cross-tenant data
- [ ] MCP audit logging captures all operations
- [ ] Security monitoring alerts on violations
- [ ] Incident response procedures documented
- [ ] Regular security testing scheduled

### Production Hardening
- [ ] MCP servers run with minimal privileges
- [ ] All credentials encrypted at rest
- [ ] Network access restricted to required services
- [ ] Regular credential rotation implemented
- [ ] Security patch management in place
- [ ] Staff training on MCP security completed

---

## 🎯 Implementation Timeline

### Week 1: Core MCP Security
- Days 1-2: Implement workspace-scoped credential storage
- Days 3-4: Add MCP security middleware
- Day 5: Test basic tenant isolation

### Week 2: Advanced Security
- Days 1-2: Implement MCP audit logging
- Days 3-4: Add security monitoring and alerts
- Day 5: Create incident response procedures

### Week 3: Production Readiness
- Days 1-3: Comprehensive security testing
- Days 4-5: Documentation and training
- Day 5: Final security review and deployment

---

*This guide ensures that Sam AI's MCP integrations maintain strict multi-tenant security boundaries, protecting customer data and maintaining regulatory compliance.*