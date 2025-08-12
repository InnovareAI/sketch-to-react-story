-- Missing Core Tables for SAM AI
-- Execute this in Supabase SQL Editor

-- Create message_templates table
CREATE TABLE IF NOT EXISTS message_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('email', 'linkedin_connection', 'linkedin_message', 'cold_call_script')),
    subject TEXT,
    content TEXT NOT NULL,
    variables JSONB DEFAULT '[]',
    tags TEXT[] DEFAULT '{}',
    usage_count INTEGER DEFAULT 0,
    performance_metrics JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create prospect_searches table
CREATE TABLE IF NOT EXISTS prospect_searches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    search_criteria JSONB NOT NULL DEFAULT '{}',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    results_count INTEGER DEFAULT 0,
    brightdata_job_id TEXT,
    brightdata_status TEXT,
    search_results JSONB DEFAULT '[]',
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create linkedin_accounts table
CREATE TABLE IF NOT EXISTS linkedin_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    linkedin_user_id TEXT UNIQUE,
    profile_url TEXT,
    access_token TEXT,
    refresh_token TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    profile_data JSONB DEFAULT '{}',
    account_status TEXT DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'rate_limited', 'disconnected')),
    daily_connection_limit INTEGER DEFAULT 50,
    daily_message_limit INTEGER DEFAULT 100,
    last_activity TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create n8n_workflows table
CREATE TABLE IF NOT EXISTS n8n_workflows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    n8n_workflow_id TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('prospect_scraping', 'linkedin_outreach', 'email_sequence', 'lead_qualification', 'data_enrichment')),
    workflow_config JSONB DEFAULT '{}',
    status TEXT DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'error')),
    trigger_config JSONB DEFAULT '{}',
    webhook_url TEXT,
    last_execution TIMESTAMP WITH TIME ZONE,
    execution_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create brightdata_logs table
CREATE TABLE IF NOT EXISTS brightdata_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    prospect_search_id UUID REFERENCES prospect_searches(id) ON DELETE CASCADE,
    job_id TEXT NOT NULL,
    operation_type TEXT NOT NULL CHECK (operation_type IN ('linkedin_search', 'profile_scraping', 'company_search')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    request_payload JSONB DEFAULT '{}',
    response_data JSONB DEFAULT '{}',
    error_message TEXT,
    execution_time_ms INTEGER,
    cost_credits DECIMAL(10,4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create message_queue table
CREATE TABLE IF NOT EXISTS message_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    linkedin_account_id UUID REFERENCES linkedin_accounts(id),
    message_type TEXT NOT NULL CHECK (message_type IN ('connection_request', 'direct_message', 'email', 'follow_up')),
    template_id UUID REFERENCES message_templates(id),
    content TEXT NOT NULL,
    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'sending', 'sent', 'delivered', 'failed', 'cancelled')),
    sent_at TIMESTAMP WITH TIME ZONE,
    delivery_status TEXT,
    error_message TEXT,
    n8n_execution_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create n8n_executions table
CREATE TABLE IF NOT EXISTS n8n_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    workflow_id UUID NOT NULL REFERENCES n8n_workflows(id) ON DELETE CASCADE,
    n8n_execution_id TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('running', 'success', 'failed', 'cancelled')),
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    finished_at TIMESTAMP WITH TIME ZONE,
    execution_data JSONB DEFAULT '{}',
    error_data JSONB DEFAULT '{}',
    webhook_response JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_message_templates_workspace ON message_templates(workspace_id);
CREATE INDEX IF NOT EXISTS idx_message_templates_type ON message_templates(type);

CREATE INDEX IF NOT EXISTS idx_prospect_searches_workspace ON prospect_searches(workspace_id);
CREATE INDEX IF NOT EXISTS idx_prospect_searches_status ON prospect_searches(status);

CREATE INDEX IF NOT EXISTS idx_linkedin_accounts_workspace ON linkedin_accounts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_linkedin_accounts_user ON linkedin_accounts(user_id);

CREATE INDEX IF NOT EXISTS idx_n8n_workflows_workspace ON n8n_workflows(workspace_id);
CREATE INDEX IF NOT EXISTS idx_n8n_workflows_campaign ON n8n_workflows(campaign_id);

CREATE INDEX IF NOT EXISTS idx_brightdata_logs_workspace ON brightdata_logs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_brightdata_logs_search ON brightdata_logs(prospect_search_id);

CREATE INDEX IF NOT EXISTS idx_message_queue_workspace ON message_queue(workspace_id);
CREATE INDEX IF NOT EXISTS idx_message_queue_campaign ON message_queue(campaign_id);
CREATE INDEX IF NOT EXISTS idx_message_queue_scheduled ON message_queue(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_message_queue_status ON message_queue(status);

CREATE INDEX IF NOT EXISTS idx_n8n_executions_workspace ON n8n_executions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_n8n_executions_workflow ON n8n_executions(workflow_id);

-- Enable RLS (Row Level Security) for all tables
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospect_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE linkedin_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE n8n_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE brightdata_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE n8n_executions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for workspace isolation
CREATE POLICY "Workspace isolation" ON message_templates
    FOR ALL USING (workspace_id IN (SELECT id FROM workspaces WHERE id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid())));

CREATE POLICY "Workspace isolation" ON prospect_searches
    FOR ALL USING (workspace_id IN (SELECT id FROM workspaces WHERE id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid())));

CREATE POLICY "Workspace isolation" ON linkedin_accounts
    FOR ALL USING (workspace_id IN (SELECT id FROM workspaces WHERE id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid())));

CREATE POLICY "Workspace isolation" ON n8n_workflows
    FOR ALL USING (workspace_id IN (SELECT id FROM workspaces WHERE id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid())));

CREATE POLICY "Workspace isolation" ON brightdata_logs
    FOR ALL USING (workspace_id IN (SELECT id FROM workspaces WHERE id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid())));

CREATE POLICY "Workspace isolation" ON message_queue
    FOR ALL USING (workspace_id IN (SELECT id FROM workspaces WHERE id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid())));

CREATE POLICY "Workspace isolation" ON n8n_executions
    FOR ALL USING (workspace_id IN (SELECT id FROM workspaces WHERE id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid())));

-- Update triggers for all tables
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add update triggers
CREATE TRIGGER update_message_templates_updated_at BEFORE UPDATE ON message_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prospect_searches_updated_at BEFORE UPDATE ON prospect_searches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_linkedin_accounts_updated_at BEFORE UPDATE ON linkedin_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_n8n_workflows_updated_at BEFORE UPDATE ON n8n_workflows
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_brightdata_logs_updated_at BEFORE UPDATE ON brightdata_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_message_queue_updated_at BEFORE UPDATE ON message_queue
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();