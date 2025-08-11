-- Core Prospect Search Tables - Simplified Schema
-- Fix the missing tables from the previous attempt

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- PROSPECT PROFILES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS prospect_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL,
    search_configuration_id UUID,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    full_name VARCHAR(512),
    email VARCHAR(255),
    phone VARCHAR(50),
    linkedin_profile_url TEXT,
    linkedin_profile_id VARCHAR(255),
    title VARCHAR(255),
    company VARCHAR(255),
    company_linkedin_url TEXT,
    location VARCHAR(255),
    industry VARCHAR(255),
    experience_level VARCHAR(50),
    profile_summary TEXT,
    mutual_connections INTEGER DEFAULT 0,
    profile_completeness_score DECIMAL(5,2) DEFAULT 0.00,
    lead_score DECIMAL(5,2) DEFAULT 0.00,
    last_activity_date DATE,
    profile_picture_url TEXT,
    background_picture_url TEXT,
    verification_status VARCHAR(50) DEFAULT 'unverified',
    metadata JSONB DEFAULT '{}',
    scraped_at TIMESTAMP WITH TIME ZONE,
    enriched_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- SEARCH RESULTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS search_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    search_history_id UUID NOT NULL,
    prospect_profile_id UUID NOT NULL,
    search_rank INTEGER,
    relevance_score DECIMAL(5,2),
    match_criteria JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- CSV UPLOAD SESSIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS csv_upload_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL,
    user_id UUID NOT NULL,
    filename VARCHAR(255) NOT NULL,
    total_rows INTEGER NOT NULL,
    processed_rows INTEGER DEFAULT 0,
    valid_rows INTEGER DEFAULT 0,
    error_rows INTEGER DEFAULT 0,
    field_mappings JSONB NOT NULL,
    validation_errors JSONB DEFAULT '[]',
    processing_status VARCHAR(50) DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    processing_started_at TIMESTAMP WITH TIME ZONE,
    processing_completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- PROSPECT CAMPAIGN ASSIGNMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS prospect_campaign_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL,
    prospect_profile_id UUID NOT NULL,
    campaign_id UUID NOT NULL,
    assigned_by UUID NOT NULL,
    assignment_status VARCHAR(50) DEFAULT 'active' CHECK (assignment_status IN ('active', 'paused', 'completed', 'cancelled')),
    sequence_position INTEGER DEFAULT 1,
    last_contact_date TIMESTAMP WITH TIME ZONE,
    next_contact_date TIMESTAMP WITH TIME ZONE,
    response_status VARCHAR(50) DEFAULT 'pending' CHECK (response_status IN ('pending', 'replied', 'bounced', 'unsubscribed', 'no_response')),
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- ENRICHMENT QUEUE TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS enrichment_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL,
    prospect_profile_id UUID NOT NULL,
    enrichment_type VARCHAR(100) NOT NULL CHECK (enrichment_type IN ('linkedin_profile', 'company_data', 'contact_info', 'social_profiles', 'work_history', 'full_profile')),
    priority INTEGER DEFAULT 50 CHECK (priority BETWEEN 1 AND 100),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'skipped')),
    provider VARCHAR(100),
    request_data JSONB DEFAULT '{}',
    response_data JSONB DEFAULT '{}',
    error_message TEXT,
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    cost_cents INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- BRIGHT DATA ANALYTICS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS bright_data_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL,
    date DATE NOT NULL,
    total_requests INTEGER DEFAULT 0,
    successful_requests INTEGER DEFAULT 0,
    failed_requests INTEGER DEFAULT 0,
    total_cost_cents INTEGER DEFAULT 0,
    avg_response_time_ms INTEGER DEFAULT 0,
    data_points_collected INTEGER DEFAULT 0,
    proxy_usage_gb DECIMAL(10,3) DEFAULT 0.000,
    rate_limit_hits INTEGER DEFAULT 0,
    error_summary JSONB DEFAULT '{}',
    performance_metrics JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(workspace_id, date)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Prospect profiles indexes
CREATE INDEX IF NOT EXISTS idx_prospect_profiles_workspace ON prospect_profiles(workspace_id);
CREATE INDEX IF NOT EXISTS idx_prospect_profiles_email ON prospect_profiles(email);
CREATE INDEX IF NOT EXISTS idx_prospect_profiles_linkedin ON prospect_profiles(linkedin_profile_id);
CREATE INDEX IF NOT EXISTS idx_prospect_profiles_company ON prospect_profiles(company);
CREATE INDEX IF NOT EXISTS idx_prospect_profiles_search_config ON prospect_profiles(search_configuration_id);

-- Search results indexes  
CREATE INDEX IF NOT EXISTS idx_search_results_history ON search_results(search_history_id);
CREATE INDEX IF NOT EXISTS idx_search_results_prospect ON search_results(prospect_profile_id);

-- CSV upload sessions indexes
CREATE INDEX IF NOT EXISTS idx_csv_upload_workspace ON csv_upload_sessions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_csv_upload_user ON csv_upload_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_csv_upload_status ON csv_upload_sessions(processing_status);

-- Campaign assignments indexes
CREATE INDEX IF NOT EXISTS idx_campaign_assignments_workspace ON prospect_campaign_assignments(workspace_id);
CREATE INDEX IF NOT EXISTS idx_campaign_assignments_prospect ON prospect_campaign_assignments(prospect_profile_id);
CREATE INDEX IF NOT EXISTS idx_campaign_assignments_campaign ON prospect_campaign_assignments(campaign_id);

-- Enrichment queue indexes
CREATE INDEX IF NOT EXISTS idx_enrichment_queue_workspace ON enrichment_queue(workspace_id);
CREATE INDEX IF NOT EXISTS idx_enrichment_queue_prospect ON enrichment_queue(prospect_profile_id);
CREATE INDEX IF NOT EXISTS idx_enrichment_queue_status ON enrichment_queue(status);

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_bright_data_analytics_workspace ON bright_data_analytics(workspace_id);
CREATE INDEX IF NOT EXISTS idx_bright_data_analytics_date ON bright_data_analytics(date);

-- ============================================================================
-- FOREIGN KEY CONSTRAINTS
-- ============================================================================

-- Add foreign key constraints where the referenced tables exist
ALTER TABLE search_results ADD CONSTRAINT fk_search_results_history 
    FOREIGN KEY (search_history_id) REFERENCES search_history(id) ON DELETE CASCADE;

ALTER TABLE search_results ADD CONSTRAINT fk_search_results_prospect 
    FOREIGN KEY (prospect_profile_id) REFERENCES prospect_profiles(id) ON DELETE CASCADE;

ALTER TABLE prospect_profiles ADD CONSTRAINT fk_prospect_profiles_search_config 
    FOREIGN KEY (search_configuration_id) REFERENCES search_configurations(id) ON DELETE SET NULL;

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE prospect_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE csv_upload_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospect_campaign_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrichment_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE bright_data_analytics ENABLE ROW LEVEL SECURITY;

-- Prospect profiles policies
CREATE POLICY "Users can access prospect profiles in their workspace" ON prospect_profiles
    FOR ALL USING (workspace_id IN (
        SELECT workspace_id FROM user_workspaces 
        WHERE user_id = auth.uid()
    ));

-- Search results policies  
CREATE POLICY "Users can access search results in their workspace" ON search_results
    FOR ALL USING (search_history_id IN (
        SELECT id FROM search_history 
        WHERE workspace_id IN (
            SELECT workspace_id FROM user_workspaces 
            WHERE user_id = auth.uid()
        )
    ));

-- CSV upload sessions policies
CREATE POLICY "Users can access CSV uploads in their workspace" ON csv_upload_sessions
    FOR ALL USING (workspace_id IN (
        SELECT workspace_id FROM user_workspaces 
        WHERE user_id = auth.uid()
    ));

-- Campaign assignments policies
CREATE POLICY "Users can access campaign assignments in their workspace" ON prospect_campaign_assignments
    FOR ALL USING (workspace_id IN (
        SELECT workspace_id FROM user_workspaces 
        WHERE user_id = auth.uid()
    ));

-- Enrichment queue policies
CREATE POLICY "Users can access enrichment queue in their workspace" ON enrichment_queue
    FOR ALL USING (workspace_id IN (
        SELECT workspace_id FROM user_workspaces 
        WHERE user_id = auth.uid()
    ));

-- Analytics policies
CREATE POLICY "Users can access analytics in their workspace" ON bright_data_analytics
    FOR ALL USING (workspace_id IN (
        SELECT workspace_id FROM user_workspaces 
        WHERE user_id = auth.uid()
    ));

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

-- Function to update prospect profile completeness score
CREATE OR REPLACE FUNCTION update_prospect_completeness_score()
RETURNS TRIGGER AS $$
BEGIN
    NEW.profile_completeness_score := (
        CASE WHEN NEW.first_name IS NOT NULL THEN 10 ELSE 0 END +
        CASE WHEN NEW.last_name IS NOT NULL THEN 10 ELSE 0 END +
        CASE WHEN NEW.email IS NOT NULL THEN 20 ELSE 0 END +
        CASE WHEN NEW.phone IS NOT NULL THEN 15 ELSE 0 END +
        CASE WHEN NEW.linkedin_profile_url IS NOT NULL THEN 20 ELSE 0 END +
        CASE WHEN NEW.title IS NOT NULL THEN 10 ELSE 0 END +
        CASE WHEN NEW.company IS NOT NULL THEN 10 ELSE 0 END +
        CASE WHEN NEW.location IS NOT NULL THEN 5 ELSE 0 END
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for prospect profile completeness
CREATE TRIGGER trigger_update_prospect_completeness
    BEFORE INSERT OR UPDATE ON prospect_profiles
    FOR EACH ROW EXECUTE FUNCTION update_prospect_completeness_score();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to all tables
CREATE TRIGGER trigger_prospect_profiles_updated_at
    BEFORE UPDATE ON prospect_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_csv_upload_sessions_updated_at
    BEFORE UPDATE ON csv_upload_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_prospect_campaign_assignments_updated_at
    BEFORE UPDATE ON prospect_campaign_assignments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_enrichment_queue_updated_at
    BEFORE UPDATE ON enrichment_queue
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_bright_data_analytics_updated_at
    BEFORE UPDATE ON bright_data_analytics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Success message
SELECT 'Core prospect search tables created successfully!' AS status;