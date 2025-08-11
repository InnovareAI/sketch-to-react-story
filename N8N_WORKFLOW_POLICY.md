# n8n Workflow Management Policy for SAM AI

## 📁 MANDATORY FOLDER STRUCTURE

### ⚠️ CRITICAL POLICY
**ALL SAM AI workflows MUST be saved in the designated folder:**

- **n8n Instance**: https://workflows.innovareai.com
- **Project ID**: `E9Xq0Sqn9jUGEbhJ`
- **Folder ID**: `SnksL8ALgkPaT9yw`
- **Folder URL**: https://workflows.innovareai.com/projects/E9Xq0Sqn9jUGEbhJ/folders/SnksL8ALgkPaT9yw/workflows

## 📋 Workflow Organization Rules

### 1. **Folder Structure** (REQUIRED)
```
SAM AI Folder (SnksL8ALgkPaT9yw)/
├── Core Workflows/
│   ├── SAM (Main Orchestrator)
│   ├── SAM AI Master Workflow
│   └── SAM AI Multi-Tenant Hub
├── Mode Workflows/
│   ├── Outbound/
│   │   ├── Lead Discovery
│   │   ├── Campaign Automation
│   │   └── LinkedIn Outreach
│   ├── Inbound/
│   │   ├── Email Triage
│   │   └── Auto Response
│   └── Unified/
│       ├── Multi-Channel Sync
│       └── AI Processing
├── Utility Workflows/
│   ├── Health Monitor
│   ├── Error Handler
│   └── Performance Monitor
└── Integration Workflows/
    ├── Supabase Sync
    ├── OpenRouter AI
    └── Unipile/Bright Data
```

### 2. **Naming Convention**
All new SAM workflows must follow this naming pattern:
- **Core**: `SAM - [Function Name]`
- **Mode**: `SAM [Mode] - [Function]`
- **Utility**: `SAM Util - [Function]`
- **Integration**: `SAM Int - [Service Name]`

Examples:
- ✅ `SAM - Main Orchestrator`
- ✅ `SAM Outbound - Lead Discovery`
- ✅ `SAM Util - Health Monitor`
- ✅ `SAM Int - OpenRouter`
- ❌ `My workflow` (Wrong)
- ❌ `Test workflow` (Wrong)

### 3. **Workflow Creation Process**

When creating new workflows:

1. **Navigate to the folder first**:
   ```
   https://workflows.innovareai.com/projects/E9Xq0Sqn9jUGEbhJ/folders/SnksL8ALgkPaT9yw
   ```

2. **Create workflow IN the folder**:
   - Click "Add Workflow" while in the folder view
   - DO NOT create in root and move later

3. **Set proper metadata**:
   - Add descriptive tags: `sam-ai`, `outbound`, `inbound`, `utility`, etc.
   - Add description explaining the workflow's purpose
   - Set proper error handling

### 4. **Workflow Standards**

Every SAM workflow must have:
- [ ] **Webhook trigger** or **Cron trigger** as first node
- [ ] **Error handling** node for failures
- [ ] **Logging** node for execution tracking
- [ ] **Response** node to return results
- [ ] **Proper credentials** configured
- [ ] **Test data** for validation

### 5. **Version Control**

- **Never delete** old versions - rename with date suffix
- **Duplicate before major changes**: `SAM - Feature v2`
- **Archive unused workflows** but keep in folder
- **Document changes** in workflow description

## 🔧 Development Workflow

### Creating New SAM Workflows:

```javascript
// 1. Always start with the webhook node
Webhook Node:
- Path: /webhook/sam-[feature-name]
- Method: POST
- Authentication: Header Auth (if needed)

// 2. Add validation
Code Node: "Validate Input"
- Check required fields
- Validate tenant_id
- Verify user permissions

// 3. Main logic
[Your workflow nodes here]

// 4. Error handling
Error Trigger Node:
- Log errors to Supabase
- Send alerts if critical

// 5. Return response
Respond to Webhook Node:
- Return success/error status
- Include execution data
```

## 📊 Workflow Categories

### Required Workflows for SAM AI:

| Category | Workflow Name | Status | Location |
|----------|--------------|--------|----------|
| **Core** | SAM - Main Orchestrator | Required | In Folder |
| **Outbound** | SAM Outbound - Lead Discovery | Required | In Folder |
| **Outbound** | SAM Outbound - Campaign Manager | Required | In Folder |
| **Outbound** | SAM Outbound - LinkedIn Outreach | Required | In Folder |
| **Inbound** | SAM Inbound - Email Triage | Required | In Folder |
| **Inbound** | SAM Inbound - Auto Response | Required | In Folder |
| **Unified** | SAM Unified - Multi-Channel | Required | In Folder |
| **Utility** | SAM Util - Error Handler | Required | In Folder |
| **Utility** | SAM Util - Health Monitor | Required | In Folder |
| **Integration** | SAM Int - Supabase | Required | In Folder |

## 🚨 Compliance Checklist

Before deploying any SAM workflow:

- [ ] Workflow is saved in folder `SnksL8ALgkPaT9yw`
- [ ] Follows naming convention `SAM - [Name]`
- [ ] Has webhook/trigger configured
- [ ] Includes error handling
- [ ] Has been tested with sample data
- [ ] Documentation added to description
- [ ] Tagged appropriately
- [ ] Credentials configured
- [ ] Response nodes configured
- [ ] Logging implemented

## 📝 Enforcement

### Workflow Audit Schedule:
- **Weekly**: Check for workflows outside the folder
- **Monthly**: Review naming conventions
- **Quarterly**: Archive unused workflows

### Non-Compliance:
- Workflows outside the folder will be moved immediately
- Incorrectly named workflows will be renamed
- Incomplete workflows will be marked for completion

## 🔗 Quick Links

- **SAM Folder**: [Open Folder](https://workflows.innovareai.com/projects/E9Xq0Sqn9jUGEbhJ/folders/SnksL8ALgkPaT9yw/workflows)
- **Main SAM Workflow**: [Open Workflow](https://workflows.innovareai.com/workflow/aR0ADfWS0ynkR6Gm)
- **n8n Dashboard**: [Open Dashboard](https://workflows.innovareai.com)

---

**Policy Effective Date**: January 30, 2025
**Last Updated**: January 30, 2025
**Policy Owner**: SAM AI Development Team

## ⚠️ REMEMBER
**ALL SAM workflows MUST be in folder SnksL8ALgkPaT9yw - NO EXCEPTIONS!**