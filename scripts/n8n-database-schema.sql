-- N8N Integration Database Schema
-- Creates tables for logging and tracking N8N workflow executions

-- N8N Workflow Executions Table
CREATE TABLE IF NOT EXISTS n8n_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    workflow_id TEXT NOT NULL,
    execution_id TEXT,
    status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'success', 'error', 'waiting')),
    data JSONB,
    response JSONB,
    error TEXT,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    execution_time_ms INTEGER GENERATED ALWAYS AS (
        CASE 
            WHEN completed_at IS NOT NULL 
            THEN EXTRACT(EPOCH FROM (completed_at - started_at)) * 1000
            ELSE NULL 
        END
    ) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- N8N Campaign Workflows Table
CREATE TABLE IF NOT EXISTS n8n_campaign_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    n8n_workflow_id TEXT NOT NULL,
    workflow_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'error')),
    workflow_data JSONB NOT NULL,
    message_sequence JSONB NOT NULL DEFAULT '[]'::jsonb,
    settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    prospect_progress JSONB NOT NULL DEFAULT '{}'::jsonb,
    execution_stats JSONB NOT NULL DEFAULT '{
        "total_executions": 0,
        "successful_executions": 0,
        "failed_executions": 0,
        "last_execution": null
    }'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- N8N Workflow Templates Table
CREATE TABLE IF NOT EXISTS n8n_workflow_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_key TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL, -- 'outbound', 'inbound', 'unified'
    workflow_type TEXT NOT NULL, -- 'linkedin', 'email', 'multi_channel', 'ai_processing'
    template_data JSONB NOT NULL,
    default_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    variables JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- N8N Workflow Variables Table (for storing encrypted API keys and configs)
CREATE TABLE IF NOT EXISTS n8n_workflow_variables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    variable_key TEXT NOT NULL,
    variable_value TEXT, -- Encrypted value
    variable_type TEXT NOT NULL CHECK (variable_type IN ('api_key', 'config', 'credential', 'setting')),
    is_encrypted BOOLEAN NOT NULL DEFAULT true,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, variable_key)
);

-- N8N Integration Logs Table
CREATE TABLE IF NOT EXISTS n8n_integration_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    log_level TEXT NOT NULL CHECK (log_level IN ('debug', 'info', 'warn', 'error')),
    event_type TEXT NOT NULL, -- 'webhook_trigger', 'execution_start', 'execution_complete', 'error'
    message TEXT NOT NULL,
    context_data JSONB,
    workflow_id TEXT,
    execution_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_n8n_executions_tenant_id ON n8n_executions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_n8n_executions_user_id ON n8n_executions(user_id);
CREATE INDEX IF NOT EXISTS idx_n8n_executions_workflow_id ON n8n_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_n8n_executions_status ON n8n_executions(status);
CREATE INDEX IF NOT EXISTS idx_n8n_executions_started_at ON n8n_executions(started_at DESC);

CREATE INDEX IF NOT EXISTS idx_n8n_campaign_workflows_campaign_id ON n8n_campaign_workflows(campaign_id);
CREATE INDEX IF NOT EXISTS idx_n8n_campaign_workflows_tenant_id ON n8n_campaign_workflows(tenant_id);
CREATE INDEX IF NOT EXISTS idx_n8n_campaign_workflows_status ON n8n_campaign_workflows(status);

CREATE INDEX IF NOT EXISTS idx_n8n_workflow_templates_category ON n8n_workflow_templates(category);
CREATE INDEX IF NOT EXISTS idx_n8n_workflow_templates_workflow_type ON n8n_workflow_templates(workflow_type);
CREATE INDEX IF NOT EXISTS idx_n8n_workflow_templates_is_active ON n8n_workflow_templates(is_active);

CREATE INDEX IF NOT EXISTS idx_n8n_workflow_variables_tenant_id ON n8n_workflow_variables(tenant_id);
CREATE INDEX IF NOT EXISTS idx_n8n_workflow_variables_type ON n8n_workflow_variables(variable_type);

CREATE INDEX IF NOT EXISTS idx_n8n_integration_logs_tenant_id ON n8n_integration_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_n8n_integration_logs_level ON n8n_integration_logs(log_level);
CREATE INDEX IF NOT EXISTS idx_n8n_integration_logs_event_type ON n8n_integration_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_n8n_integration_logs_created_at ON n8n_integration_logs(created_at DESC);

-- Enable RLS (Row Level Security) for multi-tenant isolation
ALTER TABLE n8n_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE n8n_campaign_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE n8n_workflow_variables ENABLE ROW LEVEL SECURITY;
ALTER TABLE n8n_integration_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for n8n_executions
CREATE POLICY "Users can view their tenant's n8n executions" ON n8n_executions
    FOR SELECT USING (tenant_id IN (
        SELECT organization_id FROM users WHERE auth.uid() = users.id
    ));

CREATE POLICY "Users can insert n8n executions for their tenant" ON n8n_executions
    FOR INSERT WITH CHECK (tenant_id IN (
        SELECT organization_id FROM users WHERE auth.uid() = users.id
    ));

CREATE POLICY "Users can update their tenant's n8n executions" ON n8n_executions
    FOR UPDATE USING (tenant_id IN (
        SELECT organization_id FROM users WHERE auth.uid() = users.id
    ));

-- RLS Policies for n8n_campaign_workflows
CREATE POLICY "Users can view their tenant's campaign workflows" ON n8n_campaign_workflows
    FOR SELECT USING (tenant_id IN (
        SELECT organization_id FROM users WHERE auth.uid() = users.id
    ));

CREATE POLICY "Users can manage their tenant's campaign workflows" ON n8n_campaign_workflows
    FOR ALL USING (tenant_id IN (
        SELECT organization_id FROM users WHERE auth.uid() = users.id
    ));

-- RLS Policies for n8n_workflow_variables
CREATE POLICY "Users can view their tenant's workflow variables" ON n8n_workflow_variables
    FOR SELECT USING (tenant_id IN (
        SELECT organization_id FROM users WHERE auth.uid() = users.id
    ));

CREATE POLICY "Users can manage their tenant's workflow variables" ON n8n_workflow_variables
    FOR ALL USING (tenant_id IN (
        SELECT organization_id FROM users WHERE auth.uid() = users.id
    ));

-- RLS Policies for n8n_integration_logs
CREATE POLICY "Users can view their tenant's integration logs" ON n8n_integration_logs
    FOR SELECT USING (tenant_id IN (
        SELECT organization_id FROM users WHERE auth.uid() = users.id
    ));

CREATE POLICY "Service role can insert integration logs" ON n8n_integration_logs
    FOR INSERT WITH CHECK (true);

-- Insert default workflow templates
INSERT INTO n8n_workflow_templates (template_key, name, description, category, workflow_type, template_data) VALUES
    ('sam_main', 'SAM AI Main Workflow', 'Main SAM AI orchestration workflow', 'unified', 'orchestration', '{"workflow_id": "fV8rgC2kbzSmeHBN", "webhook_path": "sam-ai-main"}'),
    ('linkedin_connector', 'LinkedIn Connection Campaign', 'Automated LinkedIn connection requests', 'outbound', 'linkedin', '{}'),
    ('linkedin_outreach', 'LinkedIn Outreach Campaign', 'LinkedIn messaging and follow-up automation', 'outbound', 'linkedin', '{}'),
    ('email_triage', 'Email Triage & Classification', 'Classify and prioritize incoming emails', 'inbound', 'email', '{}'),
    ('auto_response', 'Intelligent Auto-Response', 'Generate contextual automatic responses', 'inbound', 'email', '{}'),
    ('multi_channel_sync', 'Multi-Channel Synchronization', 'Sync data across email, LinkedIn, and CRM', 'unified', 'multi_channel', '{}'),
    ('ai_processing', 'AI Content Processing', 'Process content with AI models', 'unified', 'ai_processing', '{}')
ON CONFLICT (template_key) DO NOTHING;

-- Create function to update execution stats
CREATE OR REPLACE FUNCTION update_n8n_campaign_workflow_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update execution stats when a new execution is recorded
    UPDATE n8n_campaign_workflows 
    SET 
        execution_stats = jsonb_set(
            jsonb_set(
                jsonb_set(
                    execution_stats,
                    '{total_executions}',
                    ((execution_stats->>'total_executions')::integer + 1)::text::jsonb
                ),
                '{last_execution}',
                to_jsonb(NEW.started_at)
            ),
            CASE 
                WHEN NEW.status = 'success' THEN '{successful_executions}'
                WHEN NEW.status = 'error' THEN '{failed_executions}'
                ELSE '{total_executions}'
            END,
            ((execution_stats->>CASE 
                WHEN NEW.status = 'success' THEN 'successful_executions'
                WHEN NEW.status = 'error' THEN 'failed_executions'
                ELSE 'total_executions'
            END)::integer + 1)::text::jsonb
        ),
        updated_at = NOW()
    WHERE n8n_workflow_id = NEW.workflow_id
      AND tenant_id = NEW.tenant_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update stats
CREATE TRIGGER update_campaign_workflow_stats_trigger
    AFTER INSERT ON n8n_executions
    FOR EACH ROW
    EXECUTE FUNCTION update_n8n_campaign_workflow_stats();

-- Create function to clean up old execution logs (optional - for maintenance)
CREATE OR REPLACE FUNCTION cleanup_old_n8n_executions(days_to_keep INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM n8n_executions 
    WHERE started_at < (NOW() - INTERVAL '1 day' * days_to_keep)
      AND status IN ('success', 'error'); -- Keep pending/running executions
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    INSERT INTO n8n_integration_logs (tenant_id, user_id, log_level, event_type, message, context_data)
    VALUES (NULL, NULL, 'info', 'cleanup', 'Cleaned up old N8N executions', 
            jsonb_build_object('deleted_count', deleted_count, 'days_kept', days_to_keep));
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT ALL ON n8n_executions TO authenticated, service_role;
GRANT ALL ON n8n_campaign_workflows TO authenticated, service_role;
GRANT ALL ON n8n_workflow_templates TO authenticated, service_role;
GRANT ALL ON n8n_workflow_variables TO authenticated, service_role;
GRANT ALL ON n8n_integration_logs TO authenticated, service_role;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;