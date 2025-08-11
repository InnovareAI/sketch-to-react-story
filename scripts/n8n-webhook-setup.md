# n8n Webhook Configuration Guide

## Required Webhooks for SAM AI Platform

### 1. LinkedIn Sync Webhook
**Endpoint**: `/webhook/linkedin-sync`
**Method**: POST
**Purpose**: Sync LinkedIn account data and connections

#### Workflow Setup:
1. Create new workflow in n8n
2. Add **Webhook** node:
   - HTTP Method: `POST`
   - Path: `/linkedin-sync`
   - Response Mode: `Immediately`
   - Response Code: `200`

3. Add **Set** node to extract data:
   - Extract account_id, user_id, sync_type from body

4. Add **Supabase** node:
   - Operation: Update
   - Table: team_accounts
   - Update last_sync timestamp

5. Save and activate workflow
6. Copy webhook URL: `https://workflows.innovareai.com/webhook/linkedin-sync`

---

### 2. Campaign Processing Webhook
**Endpoint**: `/webhook/process-campaign`
**Method**: POST
**Purpose**: Process campaign messages and automation

#### Workflow Setup:
1. Create new workflow
2. Add **Webhook** node:
   - HTTP Method: `POST`
   - Path: `/process-campaign`
   - Response Mode: `Immediately`

3. Add **Set** node for campaign data
4. Add **Loop** node for message processing
5. Add **HTTP Request** node for Unipile API calls
6. Add **Supabase** node to update message status

7. Save and activate workflow
8. Copy webhook URL: `https://workflows.innovareai.com/webhook/process-campaign`

---

### 3. User Invite Email Webhook
**Endpoint**: `/webhook/send-invite`
**Method**: POST
**Purpose**: Send invitation emails to new users

#### Workflow Setup:
1. Create new workflow
2. Add **Webhook** node:
   - HTTP Method: `POST`
   - Path: `/send-invite`

3. Add **Email** node (configure with your email service):
   - To: `{{$json["email"]}}`
   - Subject: `Invitation to join {{$json["workspace_name"]}} on SAM AI`
   - HTML Template with invite link

4. Add **Supabase** node:
   - Update user_invites table
   - Set status to 'sent'

5. Save and activate
6. Copy webhook URL: `https://workflows.innovareai.com/webhook/send-invite`

---

### 4. AI Processing Webhook
**Endpoint**: `/webhook/ai-process`
**Method**: POST
**Purpose**: Process messages with AI models

#### Workflow Setup:
1. Create new workflow
2. Add **Webhook** node:
   - HTTP Method: `POST`
   - Path: `/ai-process`

3. Add **Switch** node for model selection:
   - Route to OpenAI or Anthropic based on model parameter

4. Add **OpenAI** node:
   - Model: GPT-4
   - Temperature: 0.7

5. Add **Anthropic** node:
   - Model: Claude 3.5 Sonnet
   - Temperature: 0.7

6. Add **Supabase** node to save results

7. Save and activate
8. Copy webhook URL: `https://workflows.innovareai.com/webhook/ai-process`

---

## Environment Variables to Add

After creating these webhooks, add to your `.env.local`:

```env
# n8n Webhook URLs
VITE_N8N_LINKEDIN_SYNC_URL=https://workflows.innovareai.com/webhook/linkedin-sync
VITE_N8N_CAMPAIGN_PROCESS_URL=https://workflows.innovareai.com/webhook/process-campaign
VITE_N8N_INVITE_EMAIL_URL=https://workflows.innovareai.com/webhook/send-invite
VITE_N8N_AI_PROCESS_URL=https://workflows.innovareai.com/webhook/ai-process
```

## Testing Webhooks

### Test LinkedIn Sync:
```bash
curl -X POST https://workflows.innovareai.com/webhook/linkedin-sync \
  -H "Content-Type: application/json" \
  -d '{"account_id": "test-123", "user_id": "user-456", "sync_type": "connections"}'
```

### Test Campaign Processing:
```bash
curl -X POST https://workflows.innovareai.com/webhook/process-campaign \
  -H "Content-Type: application/json" \
  -d '{"campaign_id": "camp-789", "messages": [{"id": "msg-1", "content": "Hello"}]}'
```

### Test Invite Email:
```bash
curl -X POST https://workflows.innovareai.com/webhook/send-invite \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "workspace_name": "Test Workspace", "invite_link": "https://app.example.com/invite/abc123"}'
```

### Test AI Processing:
```bash
curl -X POST https://workflows.innovareai.com/webhook/ai-process \
  -H "Content-Type: application/json" \
  -d '{"model": "claude", "prompt": "Write a LinkedIn message", "temperature": 0.7}'
```

## Security Notes

1. **Add API Key Authentication** to webhooks if needed:
   - In n8n Webhook node, enable "Authentication"
   - Choose "Header Auth"
   - Set header name: `X-API-Key`
   - Store key in n8n credentials

2. **Rate Limiting**: Configure in n8n settings to prevent abuse

3. **Error Handling**: Add Error Trigger nodes to handle failures

4. **Monitoring**: Use n8n's execution history to monitor webhook usage

## Support

- n8n Documentation: https://docs.n8n.io
- n8n Community: https://community.n8n.io
- Webhook Best Practices: https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/