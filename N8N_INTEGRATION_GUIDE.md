# SAM AI - n8n Integration Guide

## 🌐 n8n Instance Configuration

### Production n8n Instance
- **URL**: https://workflows.innovareai.com
- **Main SAM Workflow**: https://workflows.innovareai.com/workflow/aR0ADfWS0ynkR6Gm
- **Workflow ID**: `aR0ADfWS0ynkR6Gm`

## 📋 Webhook URLs

All webhooks follow the pattern: `https://workflows.innovareai.com/webhook/{path}`

### Main SAM Workflow
```
https://workflows.innovareai.com/webhook/sam-ai-main
```

### Mode-Specific Webhooks

#### Outbound Mode
```
https://workflows.innovareai.com/webhook/sam-ai/lead-discovery
https://workflows.innovareai.com/webhook/sam-ai/campaign
https://workflows.innovareai.com/webhook/sam-ai/linkedin
```

#### Inbound Mode
```
https://workflows.innovareai.com/webhook/sam-ai/email-triage
https://workflows.innovareai.com/webhook/sam-ai/auto-response
```

#### Unified Mode
```
https://workflows.innovareai.com/webhook/sam-ai/multi-channel
https://workflows.innovareai.com/webhook/sam-ai/ai-process
```

## 🔧 Integration Usage

### 1. Trigger Main SAM Workflow

```typescript
import { n8nService } from '@/services/n8n/N8nIntegrationService';

// Trigger the main SAM workflow
const result = await n8nService.triggerMainSAMWorkflow(
  'outbound',  // mode: 'inbound' | 'outbound' | 'unified'
  'lead_discovery',  // action/stage
  {
    criteria: 'SaaS companies',
    location: 'San Francisco',
    industry: 'Technology'
  }
);
```

### 2. Trigger Specific Workflows

```typescript
// Lead Discovery
await n8nService.triggerWorkflow('leadDiscovery', {
  mode: 'outbound',
  data: {
    search_criteria: 'B2B SaaS',
    max_results: 50
  }
});

// Email Triage
await n8nService.triggerWorkflow('emailTriage', {
  mode: 'inbound',
  data: {
    emails: emailArray,
    auto_categorize: true
  }
});

// AI Processing
await n8nService.executeAIWorkflow(
  'Generate a sales email for...',
  'generate'
);
```

### 3. Mode-Based Workflow Execution

```typescript
// Execute workflow based on current mode
await n8nService.executeModeWorkflow(
  'outbound',  // current mode
  'campaign',  // stage/action
  {
    campaign_name: 'Q1 Outreach',
    targets: leadsList
  }
);
```

## 📊 Payload Structure

All webhooks receive this standard payload:

```json
{
  "tenant_id": "organization-uuid",
  "user_id": "user-uuid",
  "campaign_id": "campaign-uuid",
  "workflow_stage": "lead_discovery",
  "mode": "outbound",
  "data": {
    // Custom data for the workflow
    "workflow_id": "aR0ADfWS0ynkR6Gm",
    "workflow_name": "SAM",
    "triggered_at": "2025-01-30T12:00:00Z",
    "source": "sam-ai-platform",
    // Your custom fields here
  },
  "tenant_config": {
    "supabase_url": "https://...",
    "api_keys": {},
    "rate_limits": {
      "concurrent": 5,
      "per_minute": 100
    },
    "allowed_platforms": ["email", "linkedin"]
  }
}
```

## 🔐 Security & Multi-Tenancy

### Tenant Isolation
- Each workflow execution includes `tenant_id` for data isolation
- Workflows should validate tenant context before processing
- Results are stored with tenant association

### API Authentication
- Add API key to environment: `VITE_N8N_API_KEY`
- Or configure through Supabase Edge Functions
- API key sent as `Authorization: Bearer {key}` header

## 🎯 Workflow Templates

### Available Templates in Code

| Template ID | Name | Mode | Purpose |
|------------|------|------|---------|
| `samMain` | SAM AI Main Workflow | All | Main orchestration |
| `leadDiscovery` | Lead Discovery & Research | Outbound | Find prospects |
| `campaignAutomation` | Campaign Automation | Outbound | Manage campaigns |
| `linkedInOutreach` | LinkedIn Outreach | Outbound | LinkedIn automation |
| `emailTriage` | Email Triage | Inbound | Classify emails |
| `autoResponse` | Auto-Response | Inbound | Generate replies |
| `multiChannelSync` | Multi-Channel Sync | Unified | Sync platforms |
| `aiProcessing` | AI Processing | Unified | AI content ops |

## 🚀 Setting Up Webhooks in n8n

1. **Open n8n**: https://workflows.innovareai.com
2. **Edit the SAM workflow**: https://workflows.innovareai.com/workflow/aR0ADfWS0ynkR6Gm
3. **Add Webhook Trigger**:
   - Add a **Webhook** node
   - Set HTTP Method: `POST`
   - Set Path: `sam-ai-main` (or specific path)
   - Enable "Raw Body" if needed
4. **Process the payload**:
   - Extract `tenant_id`, `mode`, `workflow_stage`
   - Route to appropriate sub-workflows
   - Return results

## 📈 Monitoring & Logs

### View Executions
- **UI Component**: Add `<N8nWorkflowManager />` to any page
- **Execution History**: Stored in Supabase `n8n_executions` table
- **n8n Dashboard**: https://workflows.innovareai.com/executions

### Health Check
```typescript
const health = await n8nService.checkWorkflowHealth();
console.log('Connected:', health.connected);
console.log('Active Workflows:', health.activeWorkflows);
```

## 🔄 Environment Variables

Add to `.env.local`:

```env
# n8n Configuration
VITE_N8N_URL=https://workflows.innovareai.com
VITE_N8N_SAM_WORKFLOW_ID=aR0ADfWS0ynkR6Gm
VITE_N8N_API_KEY=your-api-key-if-required
```

## 📝 Next Steps

1. **Configure webhook nodes** in the SAM workflow at n8n
2. **Test the integration** using the UI component
3. **Monitor executions** through the dashboard
4. **Add sub-workflows** for specific tasks
5. **Set up error handling** and retry logic

## 🆘 Troubleshooting

### Connection Issues
- Verify n8n instance is accessible
- Check CORS settings in n8n
- Ensure webhook paths match

### Execution Failures
- Check n8n execution logs
- Verify payload structure
- Check tenant/user context

### Missing Workflows
- Create webhook nodes with correct paths
- Activate workflows in n8n
- Test with manual webhook trigger first

---

Last Updated: January 2025
SAM AI Platform - n8n Integration v1.0