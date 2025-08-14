# SAM AI Campaign Database Integration Guide

## Overview

This guide provides comprehensive documentation for integrating with the new SAM AI Campaign Database Schema. The schema supports dynamic campaign management, prospect handling, N8N integration, extraction jobs, and campaign intelligence with RAG support.

## Table of Contents

1. [Database Schema Overview](#database-schema-overview)
2. [Core Tables](#core-tables)
3. [React Integration Examples](#react-integration-examples)
4. [N8N Workflow Integration](#n8n-workflow-integration)
5. [Campaign Step Configuration](#campaign-step-configuration)
6. [Prospect Management Workflow](#prospect-management-workflow)
7. [Analytics and Reporting](#analytics-and-reporting)
8. [API Endpoints Examples](#api-endpoints-examples)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)

## Database Schema Overview

The comprehensive campaign schema includes 13 main tables organized into these functional areas:

### Core Campaign Management
- `campaigns` - Main campaign configurations
- `campaign_step_templates` - Reusable step templates
- `campaign_prospects` - Campaign-prospect assignments with step tracking

### Prospect Management
- `prospects` - Enhanced prospect profiles with approval workflow
- `extraction_jobs` - Bulk prospect extraction monitoring
- `extraction_records` - Individual extraction records

### N8N Integration
- `n8n_campaign_executions` - Workflow execution tracking
- `n8n_campaign_templates` - Workflow templates

### Campaign Intelligence
- `campaign_knowledge_base` - RAG context and research data
- `campaign_insights` - AI-generated insights and recommendations

### Communication & Analytics
- `campaign_messages` - Multi-channel message tracking
- `campaign_analytics_daily` - Daily performance metrics
- `campaign_benchmarks` - Industry benchmarks

## Core Tables

### campaigns

The main campaigns table supports dynamic step configuration (1-10+ steps):

```sql
-- Key fields for dynamic campaigns
campaign_steps JSONB -- Array of step configurations
current_step INTEGER -- Current execution step
total_steps INTEGER -- Total configured steps
step_configuration JSONB -- Step-specific settings
n8n_workflow_id TEXT -- Associated N8N workflow
ai_settings JSONB -- AI and personalization settings
metrics JSONB -- Real-time performance metrics
```

### prospects

Enhanced prospect management with approval workflow:

```sql
-- Approval workflow fields
approval_status TEXT -- 'pending', 'approved', 'rejected', 'under_review'
approved_by UUID -- Who approved the prospect
approved_at TIMESTAMP -- When approved
rejection_reason TEXT -- Why rejected

-- Data quality fields
data_completeness DECIMAL(5,2) -- Calculated completeness score
verification_status TEXT -- Data verification status
data_quality_score DECIMAL(5,2) -- Overall quality score
```

### campaign_prospects

Campaign-prospect assignments with step tracking:

```sql
-- Step tracking fields
current_step INTEGER -- Current step in campaign
completed_steps INTEGER[] -- Array of completed steps
step_history JSONB -- Historical step execution data
next_step_scheduled_at TIMESTAMP -- When next step should execute
```

## React Integration Examples

### 1. Campaign Creation Component

```typescript
// components/campaigns/CampaignCreation.tsx
interface CampaignStep {
  step: number;
  type: 'connection_request' | 'message' | 'email' | 'wait' | 'ai_action' | 'condition';
  name: string;
  template_id?: string;
  config: Record<string, any>;
}

interface CampaignData {
  name: string;
  description: string;
  type: 'linkedin' | 'email' | 'multi_channel';
  campaign_steps: CampaignStep[];
  total_steps: number;
  target_audience: Record<string, any>;
  ai_settings: {
    personalization_enabled: boolean;
    sentiment_analysis: boolean;
    response_prediction: boolean;
    auto_qualification: boolean;
  };
  daily_limit: number;
}

const CampaignCreation: React.FC = () => {
  const [campaignData, setCampaignData] = useState<CampaignData>({
    name: '',
    description: '',
    type: 'linkedin',
    campaign_steps: [],
    total_steps: 0,
    target_audience: {},
    ai_settings: {
      personalization_enabled: true,
      sentiment_analysis: true,
      response_prediction: true,
      auto_qualification: false
    },
    daily_limit: 50
  });

  const createCampaign = async () => {
    const { data, error } = await supabase
      .from('campaigns')
      .insert({
        workspace_id: currentWorkspace.id,
        ...campaignData,
        created_by: user.id
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  // ... component implementation
};
```

### 2. Prospect Approval Workflow

```typescript
// components/prospects/ProspectApproval.tsx
const ProspectApprovalQueue: React.FC = () => {
  const [pendingProspects, setPendingProspects] = useState([]);

  const loadPendingProspects = async () => {
    const { data, error } = await supabase
      .from('prospects')
      .select(`
        *,
        enriched_data,
        extraction_job:extraction_jobs(job_name, job_type)
      `)
      .eq('workspace_id', currentWorkspace.id)
      .eq('approval_status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;
    setPendingProspects(data);
  };

  const approveProspect = async (prospectId: string) => {
    const { error } = await supabase
      .from('prospects')
      .update({
        approval_status: 'approved',
        approved_by: user.id,
        approved_at: new Date().toISOString()
      })
      .eq('id', prospectId);

    if (error) throw error;
    await loadPendingProspects(); // Refresh list
  };

  const rejectProspect = async (prospectId: string, reason: string) => {
    const { error } = await supabase
      .from('prospects')
      .update({
        approval_status: 'rejected',
        rejection_reason: reason,
        approved_by: user.id,
        approved_at: new Date().toISOString()
      })
      .eq('id', prospectId);

    if (error) throw error;
    await loadPendingProspects(); // Refresh list
  };

  // ... component implementation
};
```

### 3. Campaign Step Execution Monitor

```typescript
// components/campaigns/CampaignStepMonitor.tsx
const CampaignStepMonitor: React.FC<{ campaignId: string }> = ({ campaignId }) => {
  const [stepProgress, setStepProgress] = useState([]);

  const loadStepProgress = async () => {
    const { data, error } = await supabase
      .from('campaign_prospects')
      .select(`
        id,
        current_step,
        completed_steps,
        status,
        next_step_scheduled_at,
        prospects(first_name, last_name, current_company),
        step_history
      `)
      .eq('campaign_id', campaignId)
      .order('last_activity_at', { ascending: false });

    if (error) throw error;
    setStepProgress(data);
  };

  const executeNextStep = async (campaignProspectId: string) => {
    // Trigger N8N workflow execution
    const { data, error } = await supabase
      .from('n8n_campaign_executions')
      .insert({
        workspace_id: currentWorkspace.id,
        campaign_id: campaignId,
        n8n_workflow_id: 'campaign_step_executor',
        execution_type: 'campaign_step',
        input_data: {
          campaign_prospect_id: campaignProspectId,
          action: 'execute_next_step'
        }
      });

    if (error) throw error;
    await loadStepProgress(); // Refresh progress
  };

  // ... component implementation
};
```

### 4. Real-time Analytics Dashboard

```typescript
// components/analytics/CampaignAnalytics.tsx
const CampaignAnalyticsDashboard: React.FC<{ campaignId: string }> = ({ campaignId }) => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [insights, setInsights] = useState([]);

  const loadAnalytics = async () => {
    // Load daily analytics for the past 30 days
    const { data: dailyAnalytics, error } = await supabase
      .from('campaign_analytics_daily')
      .select('*')
      .eq('campaign_id', campaignId)
      .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (error) throw error;

    // Load AI insights
    const { data: campaignInsights } = await supabase
      .from('campaign_insights')
      .select('*')
      .eq('campaign_id', campaignId)
      .eq('implementation_status', 'pending')
      .order('confidence_score', { ascending: false });

    setAnalyticsData(dailyAnalytics);
    setInsights(campaignInsights || []);
  };

  const implementInsight = async (insightId: string) => {
    const { error } = await supabase
      .from('campaign_insights')
      .update({
        implementation_status: 'in_progress',
        implemented_at: new Date().toISOString(),
        implemented_by: user.id
      })
      .eq('id', insightId);

    if (error) throw error;
    await loadAnalytics();
  };

  // ... component implementation with charts and insights display
};
```

## N8N Workflow Integration

### 1. Campaign Step Executor Workflow

Create an N8N workflow that handles campaign step execution:

```json
{
  "name": "Campaign Step Executor",
  "nodes": [
    {
      "name": "Webhook Trigger",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "path": "campaign-step-execute",
        "httpMethod": "POST"
      }
    },
    {
      "name": "Get Campaign Prospect",
      "type": "n8n-nodes-base.supabase",
      "parameters": {
        "operation": "get",
        "table": "campaign_prospects",
        "id": "={{$json.campaign_prospect_id}}"
      }
    },
    {
      "name": "Get Campaign Configuration",
      "type": "n8n-nodes-base.supabase",
      "parameters": {
        "operation": "get",
        "table": "campaigns",
        "id": "={{$node[\"Get Campaign Prospect\"].json.campaign_id}}"
      }
    },
    {
      "name": "Determine Next Step",
      "type": "n8n-nodes-base.code",
      "parameters": {
        "jsCode": "// Logic to determine and execute next step"
      }
    }
  ]
}
```

### 2. Prospect Extraction Workflow

```json
{
  "name": "Prospect Extraction",
  "nodes": [
    {
      "name": "Start Extraction Job",
      "type": "n8n-nodes-base.webhook"
    },
    {
      "name": "LinkedIn Search via Bright Data",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "https://api.brightdata.com/linkedin-search",
        "method": "POST"
      }
    },
    {
      "name": "Process Results",
      "type": "n8n-nodes-base.code"
    },
    {
      "name": "Create Prospects",
      "type": "n8n-nodes-base.supabase",
      "parameters": {
        "operation": "insert",
        "table": "prospects"
      }
    },
    {
      "name": "Update Extraction Job",
      "type": "n8n-nodes-base.supabase",
      "parameters": {
        "operation": "update",
        "table": "extraction_jobs"
      }
    }
  ]
}
```

## Campaign Step Configuration

### Step Types and Configuration Examples

#### 1. Connection Request Step
```json
{
  "step": 1,
  "type": "connection_request",
  "name": "LinkedIn Connection",
  "template_id": "linkedin_connection_sales",
  "config": {
    "message": "Hi {first_name}, I'd love to connect!",
    "personalization_enabled": true,
    "max_length": 200,
    "success_condition": "connection_accepted",
    "failure_action": "skip_to_step_5"
  }
}
```

#### 2. AI Action Step
```json
{
  "step": 2,
  "type": "ai_action",
  "name": "Research Prospect",
  "config": {
    "action_type": "research",
    "ai_model": "gpt-4",
    "research_points": [
      "company_news",
      "recent_posts", 
      "mutual_connections",
      "industry_trends"
    ],
    "output_format": "json",
    "store_in_knowledge_base": true
  }
}
```

#### 3. Conditional Step
```json
{
  "step": 4,
  "type": "condition",
  "name": "Check Response",
  "config": {
    "condition": "message_replied",
    "condition_check": {
      "field": "replied_at",
      "operator": "is_not_null"
    },
    "true_next_step": 5,
    "false_next_step": 7,
    "timeout_hours": 72
  }
}
```

#### 4. Wait Step
```json
{
  "step": 3,
  "type": "wait",
  "name": "Wait 48 Hours",
  "config": {
    "wait_hours": 48,
    "business_days_only": true,
    "respect_timezone": true,
    "max_wait_hours": 120
  }
}
```

## Prospect Management Workflow

### 1. Extraction to Approval Process

```sql
-- 1. Create extraction job
INSERT INTO extraction_jobs (
    workspace_id, job_name, job_type, extraction_config, created_by
) VALUES (
    $1, $2, $3, $4, $5
) RETURNING id;

-- 2. Process extraction results
INSERT INTO prospects (
    workspace_id, first_name, last_name, email, linkedin_url,
    current_title, current_company, extraction_source, 
    extraction_job_id, approval_status
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending'
);

-- 3. Queue for approval
SELECT * FROM prospects 
WHERE workspace_id = $1 
  AND approval_status = 'pending'
  AND extraction_job_id = $2;

-- 4. Approve prospects
UPDATE prospects 
SET approval_status = 'approved',
    approved_by = $1,
    approved_at = NOW()
WHERE id = ANY($2);
```

### 2. Campaign Assignment Process

```sql
-- Auto-assign approved prospects to campaigns
INSERT INTO campaign_prospects (
    workspace_id, campaign_id, prospect_id, 
    assignment_method, current_step
)
SELECT 
    p.workspace_id,
    $1, -- campaign_id
    p.id,
    'auto',
    1
FROM prospects p
WHERE p.workspace_id = $2
  AND p.approval_status = 'approved'
  AND p.id NOT IN (
    SELECT prospect_id FROM campaign_prospects 
    WHERE campaign_id = $1
  )
  AND p.current_title = ANY($3); -- target titles
```

## Analytics and Reporting

### 1. Daily Analytics Generation

```sql
-- Function to generate/update daily analytics
CREATE OR REPLACE FUNCTION update_campaign_daily_analytics(
    p_campaign_id UUID,
    p_date DATE DEFAULT CURRENT_DATE
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO campaign_analytics_daily (
        workspace_id, campaign_id, date,
        prospects_added, prospects_contacted, messages_sent,
        messages_replied, response_rate
    )
    SELECT 
        c.workspace_id,
        c.id,
        p_date,
        COUNT(*) FILTER (WHERE cp.assigned_at::date = p_date),
        COUNT(*) FILTER (WHERE cm.sent_at::date = p_date),
        COUNT(*) FILTER (WHERE cm.status = 'sent' AND cm.sent_at::date = p_date),
        COUNT(*) FILTER (WHERE cm.replied_at::date = p_date),
        CASE 
            WHEN COUNT(*) FILTER (WHERE cm.status = 'sent' AND cm.sent_at::date = p_date) > 0
            THEN COUNT(*) FILTER (WHERE cm.replied_at::date = p_date) * 100.0 / 
                 COUNT(*) FILTER (WHERE cm.status = 'sent' AND cm.sent_at::date = p_date)
            ELSE 0
        END
    FROM campaigns c
    LEFT JOIN campaign_prospects cp ON cp.campaign_id = c.id
    LEFT JOIN campaign_messages cm ON cm.campaign_id = c.id
    WHERE c.id = p_campaign_id
    GROUP BY c.workspace_id, c.id
    ON CONFLICT (campaign_id, date) DO UPDATE SET
        prospects_added = EXCLUDED.prospects_added,
        prospects_contacted = EXCLUDED.prospects_contacted,
        messages_sent = EXCLUDED.messages_sent,
        messages_replied = EXCLUDED.messages_replied,
        response_rate = EXCLUDED.response_rate;
END;
$$ LANGUAGE plpgsql;
```

### 2. Performance Queries

```sql
-- Campaign performance summary
SELECT 
    c.name,
    c.status,
    c.type,
    (c.metrics->>'prospects_added')::integer as prospects_added,
    (c.metrics->>'prospects_contacted')::integer as prospects_contacted,
    (c.metrics->>'response_rate')::decimal as response_rate,
    COUNT(cp.id) as total_assignments,
    COUNT(cp.id) FILTER (WHERE cp.status = 'completed') as completed_assignments,
    AVG(cm.personalization_score) as avg_personalization_score
FROM campaigns c
LEFT JOIN campaign_prospects cp ON cp.campaign_id = c.id
LEFT JOIN campaign_messages cm ON cm.campaign_id = c.id
WHERE c.workspace_id = $1
GROUP BY c.id, c.name, c.status, c.type, c.metrics;

-- Top performing prospects
SELECT 
    p.first_name || ' ' || p.last_name as full_name,
    p.current_company,
    p.current_title,
    COUNT(cm.id) as messages_sent,
    COUNT(cm.id) FILTER (WHERE cm.replied_at IS NOT NULL) as responses,
    AVG(cm.sentiment_score) as avg_sentiment,
    cp.status as campaign_status
FROM prospects p
JOIN campaign_prospects cp ON cp.prospect_id = p.id
LEFT JOIN campaign_messages cm ON cm.prospect_id = p.id
WHERE cp.campaign_id = $1
GROUP BY p.id, p.first_name, p.last_name, p.current_company, 
         p.current_title, cp.status
ORDER BY responses DESC, messages_sent DESC;
```

## API Endpoints Examples

### 1. Campaign Management Endpoints

```typescript
// POST /api/campaigns - Create new campaign
app.post('/api/campaigns', async (req, res) => {
  const { name, description, type, campaign_steps, target_audience } = req.body;
  
  const { data, error } = await supabase
    .from('campaigns')
    .insert({
      workspace_id: req.user.workspace_id,
      name,
      description,
      type,
      campaign_steps,
      total_steps: campaign_steps.length,
      target_audience,
      created_by: req.user.id
    })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// PUT /api/campaigns/:id/steps - Update campaign steps
app.put('/api/campaigns/:id/steps', async (req, res) => {
  const { campaign_steps } = req.body;
  
  const { data, error } = await supabase
    .from('campaigns')
    .update({
      campaign_steps,
      total_steps: campaign_steps.length,
      updated_at: new Date().toISOString()
    })
    .eq('id', req.params.id)
    .eq('workspace_id', req.user.workspace_id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});
```

### 2. Prospect Management Endpoints

```typescript
// GET /api/prospects/pending-approval - Get prospects awaiting approval
app.get('/api/prospects/pending-approval', async (req, res) => {
  const { data, error } = await supabase
    .from('prospects')
    .select(`
      *,
      extraction_jobs(job_name, job_type)
    `)
    .eq('workspace_id', req.user.workspace_id)
    .eq('approval_status', 'pending')
    .order('created_at', { ascending: false });

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// POST /api/prospects/:id/approve - Approve prospect
app.post('/api/prospects/:id/approve', async (req, res) => {
  const { error } = await supabase
    .from('prospects')
    .update({
      approval_status: 'approved',
      approved_by: req.user.id,
      approved_at: new Date().toISOString()
    })
    .eq('id', req.params.id)
    .eq('workspace_id', req.user.workspace_id);

  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});
```

## Best Practices

### 1. Campaign Design
- Keep campaigns focused with 3-7 steps for optimal performance
- Always include wait steps between outreach attempts
- Use conditional logic to handle different response scenarios
- Implement proper fallback mechanisms

### 2. Prospect Management
- Implement approval workflows for quality control
- Use data completeness scores to prioritize prospects
- Regularly clean up and deduplicate prospect data
- Track extraction sources for compliance

### 3. Performance Optimization
- Use proper indexing on frequently queried fields
- Implement pagination for large result sets
- Cache analytics data for dashboards
- Monitor N8N workflow execution performance

### 4. Security
- Always verify workspace isolation in queries
- Use RLS policies for data access control
- Encrypt sensitive prospect data
- Audit campaign access and modifications

## Troubleshooting

### Common Issues

#### 1. Campaign Steps Not Executing
```sql
-- Check N8N execution status
SELECT * FROM n8n_campaign_executions 
WHERE campaign_id = $1 
  AND status = 'error'
ORDER BY started_at DESC;

-- Check campaign prospect status
SELECT cp.*, p.first_name, p.last_name, c.name
FROM campaign_prospects cp
JOIN prospects p ON p.id = cp.prospect_id
JOIN campaigns c ON c.id = cp.campaign_id
WHERE cp.campaign_id = $1
  AND cp.status = 'failed';
```

#### 2. Prospects Not Being Approved
```sql
-- Check approval status distribution
SELECT approval_status, COUNT(*) 
FROM prospects 
WHERE workspace_id = $1 
GROUP BY approval_status;

-- Check data quality issues
SELECT 
  AVG(data_completeness) as avg_completeness,
  COUNT(*) FILTER (WHERE data_completeness < 50) as low_quality_count
FROM prospects 
WHERE workspace_id = $1;
```

#### 3. Analytics Not Updating
```sql
-- Manually trigger analytics update
SELECT generate_daily_campaign_analytics($1, CURRENT_DATE);

-- Check for missing analytics records
SELECT c.name, 
       COUNT(cad.id) as analytics_days_count,
       MAX(cad.date) as last_analytics_date
FROM campaigns c
LEFT JOIN campaign_analytics_daily cad ON cad.campaign_id = c.id
WHERE c.workspace_id = $1
GROUP BY c.id, c.name;
```

### Performance Monitoring

```sql
-- Campaign execution performance
SELECT 
    c.name,
    COUNT(nce.id) as total_executions,
    COUNT(nce.id) FILTER (WHERE nce.status = 'success') as successful_executions,
    COUNT(nce.id) FILTER (WHERE nce.status = 'error') as failed_executions,
    AVG(nce.execution_time_ms) as avg_execution_time_ms
FROM campaigns c
LEFT JOIN n8n_campaign_executions nce ON nce.campaign_id = c.id
WHERE c.workspace_id = $1
  AND nce.started_at > NOW() - INTERVAL '7 days'
GROUP BY c.id, c.name
ORDER BY failed_executions DESC;
```

## Support and Documentation

For additional support:

1. **Schema Documentation**: Review the comprehensive SQL schema file
2. **Sample Data**: Use the provided sample data for testing
3. **Integration Examples**: Follow the React component examples
4. **N8N Templates**: Use the provided workflow templates
5. **Performance Monitoring**: Implement the suggested monitoring queries

The schema is designed to be extensible and supports the full SAM AI campaign management workflow from prospect extraction to conversion tracking.