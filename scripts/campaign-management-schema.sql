-- Campaign Management and Rules Engine Database Schema
-- Supports SAM AI campaign assignment rules and lead validation

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Campaigns table - stores all campaign configurations
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    workspace_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL CHECK (type IN ('connection_request', 'direct_message', 'inmail', 'email', 'multi_channel')),
    target_audience VARCHAR(50) DEFAULT 'general',
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'archived')),
    
    -- Campaign requirements
    connection_required BOOLEAN DEFAULT false,
    premium_required BOOLEAN DEFAULT false,
    email_required BOOLEAN DEFAULT false,
    phone_required BOOLEAN DEFAULT false,
    min_mutual_connections INTEGER DEFAULT 0,
    max_connection_degree VARCHAR(10) CHECK (max_connection_degree IN ('1st', '2nd', '3rd')),
    min_profile_completeness INTEGER DEFAULT 0 CHECK (min_profile_completeness >= 0 AND min_profile_completeness <= 100),
    
    -- Restrictions
    excluded_industries TEXT[], -- Array of excluded industry names
    excluded_titles TEXT[], -- Array of excluded job title keywords
    allowed_search_sources TEXT[] DEFAULT ARRAY['basic_search', 'sales_navigator', 'post_engagement', 'csv_upload'],
    
    -- Limits and quotas
    max_leads_per_day INTEGER DEFAULT 100,
    max_leads_total INTEGER,
    current_leads_today INTEGER DEFAULT 0,
    current_leads_total INTEGER DEFAULT 0,
    
    -- Tracking
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Performance metrics
    total_sent INTEGER DEFAULT 0,
    total_responses INTEGER DEFAULT 0,
    total_connections INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 0.00,
    
    -- Campaign settings as JSONB for flexibility
    settings JSONB DEFAULT '{}',
    
    UNIQUE(workspace_id, name)
);

-- Campaign rules table - stores custom validation rules per campaign
CREATE TABLE IF NOT EXISTS campaign_rules (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    rule_type VARCHAR(50) NOT NULL,
    rule_name VARCHAR(255) NOT NULL,
    rule_config JSONB NOT NULL, -- Rule configuration parameters
    priority INTEGER DEFAULT 1, -- 1=critical, 2=high, 3=medium, 4=low
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lead profiles table - enhanced with validation data
CREATE TABLE IF NOT EXISTS lead_profiles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    workspace_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Basic profile info
    name VARCHAR(255) NOT NULL,
    title VARCHAR(255),
    company VARCHAR(255),
    location VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    linkedin_url TEXT,
    
    -- LinkedIn specific data for validation
    connection_degree VARCHAR(20) DEFAULT 'unknown' CHECK (connection_degree IN ('1st', '2nd', '3rd', 'out_of_network', 'unknown')),
    premium_account BOOLEAN DEFAULT false,
    open_to_work BOOLEAN DEFAULT false,
    profile_visibility VARCHAR(20) DEFAULT 'public' CHECK (profile_visibility IN ('public', 'limited', 'private')),
    last_activity TIMESTAMP WITH TIME ZONE,
    profile_completeness INTEGER DEFAULT 0 CHECK (profile_completeness >= 0 AND profile_completeness <= 100),
    mutual_connections INTEGER DEFAULT 0,
    follower_count INTEGER DEFAULT 0,
    has_company_page BOOLEAN DEFAULT false,
    industry VARCHAR(255),
    seniority_level VARCHAR(50),
    
    -- Data source tracking
    search_source VARCHAR(50) NOT NULL CHECK (search_source IN ('basic_search', 'sales_navigator', 'recruiter_search', 'post_engagement', 'csv_upload')),
    search_id UUID, -- Reference to the search that found this lead
    source_url TEXT, -- Original LinkedIn URL or search URL
    
    -- Enrichment data
    enrichment_status VARCHAR(20) DEFAULT 'pending' CHECK (enrichment_status IN ('pending', 'completed', 'failed', 'not_needed')),
    enriched_at TIMESTAMP WITH TIME ZONE,
    enrichment_provider VARCHAR(50), -- 'bright_data', 'apollo', 'zoominfo', etc.
    
    -- Profile quality scoring
    quality_score DECIMAL(3,2) DEFAULT 0.00 CHECK (quality_score >= 0.00 AND quality_score <= 1.00),
    data_completeness DECIMAL(3,2) DEFAULT 0.00 CHECK (data_completeness >= 0.00 AND data_completeness <= 1.00),
    
    -- Tracking and metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_contacted TIMESTAMP WITH TIME ZONE,
    
    -- Additional data as JSONB for flexibility
    additional_data JSONB DEFAULT '{}',
    
    CONSTRAINT unique_linkedin_url_per_workspace UNIQUE(workspace_id, linkedin_url)
);

-- Campaign assignments table - tracks which leads are assigned to campaigns
CREATE TABLE IF NOT EXISTS campaign_assignments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES lead_profiles(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Assignment details
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by UUID REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'assigned' CHECK (status IN ('assigned', 'contacted', 'responded', 'connected', 'unqualified', 'bounced', 'opted_out')),
    priority INTEGER DEFAULT 1,
    
    -- Outreach tracking
    first_contact_at TIMESTAMP WITH TIME ZONE,
    last_contact_at TIMESTAMP WITH TIME ZONE,
    response_at TIMESTAMP WITH TIME ZONE,
    connection_at TIMESTAMP WITH TIME ZONE,
    total_messages INTEGER DEFAULT 0,
    
    -- Validation results at time of assignment
    validation_passed BOOLEAN DEFAULT true,
    validation_warnings TEXT[],
    validation_suggestions TEXT[],
    estimated_success_rate DECIMAL(5,2),
    
    -- Custom fields for campaign-specific data
    custom_fields JSONB DEFAULT '{}',
    
    UNIQUE(campaign_id, lead_id)
);

-- Validation results cache table - caches expensive validation computations
CREATE TABLE IF NOT EXISTS validation_cache (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    lead_id UUID NOT NULL REFERENCES lead_profiles(id) ON DELETE CASCADE,
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    
    -- Cached validation result
    can_assign BOOLEAN NOT NULL,
    blocked_reasons TEXT[],
    warnings TEXT[],
    suggestions TEXT[],
    estimated_success_rate DECIMAL(5,2),
    
    -- Cache metadata
    computed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 hour'),
    computation_time_ms INTEGER,
    
    UNIQUE(lead_id, campaign_id)
);

-- Campaign performance analytics table
CREATE TABLE IF NOT EXISTS campaign_analytics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Daily metrics
    leads_assigned INTEGER DEFAULT 0,
    messages_sent INTEGER DEFAULT 0,
    responses_received INTEGER DEFAULT 0,
    connections_made INTEGER DEFAULT 0,
    bounces INTEGER DEFAULT 0,
    opt_outs INTEGER DEFAULT 0,
    
    -- Calculated rates
    response_rate DECIMAL(5,2) DEFAULT 0.00,
    connection_rate DECIMAL(5,2) DEFAULT 0.00,
    bounce_rate DECIMAL(5,2) DEFAULT 0.00,
    
    -- Cost tracking
    cost_per_lead DECIMAL(10,2) DEFAULT 0.00,
    total_cost DECIMAL(10,2) DEFAULT 0.00,
    
    -- Performance scores
    quality_score DECIMAL(3,2) DEFAULT 0.00,
    engagement_score DECIMAL(3,2) DEFAULT 0.00,
    
    UNIQUE(campaign_id, date)
);

-- Search configurations table - links to prospect search functionality
CREATE TABLE IF NOT EXISTS search_campaign_configs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    search_configuration_id UUID REFERENCES search_configurations(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Auto-assignment settings
    auto_assign_enabled BOOLEAN DEFAULT false,
    auto_assign_limit INTEGER DEFAULT 50,
    validation_threshold DECIMAL(3,2) DEFAULT 0.70, -- Minimum validation score for auto-assignment
    
    -- Filter settings for auto-assignment
    min_profile_completeness INTEGER DEFAULT 50,
    max_daily_assignments INTEGER DEFAULT 25,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_campaigns_workspace_status ON campaigns(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_campaigns_type ON campaigns(type);
CREATE INDEX IF NOT EXISTS idx_campaign_rules_campaign_active ON campaign_rules(campaign_id, is_active);
CREATE INDEX IF NOT EXISTS idx_lead_profiles_workspace ON lead_profiles(workspace_id);
CREATE INDEX IF NOT EXISTS idx_lead_profiles_linkedin_url ON lead_profiles(linkedin_url);
CREATE INDEX IF NOT EXISTS idx_lead_profiles_search_source ON lead_profiles(search_source);
CREATE INDEX IF NOT EXISTS idx_lead_profiles_quality_score ON lead_profiles(quality_score);
CREATE INDEX IF NOT EXISTS idx_campaign_assignments_campaign_status ON campaign_assignments(campaign_id, status);
CREATE INDEX IF NOT EXISTS idx_campaign_assignments_workspace ON campaign_assignments(workspace_id);
CREATE INDEX IF NOT EXISTS idx_validation_cache_expires ON validation_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_campaign_analytics_campaign_date ON campaign_analytics(campaign_id, date);

-- Row Level Security (RLS) Policies
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE validation_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_campaign_configs ENABLE ROW LEVEL SECURITY;

-- Campaigns policies
CREATE POLICY "Users can access campaigns in their workspace" ON campaigns
    FOR ALL USING (workspace_id IN (
        SELECT workspace_id FROM user_workspaces WHERE user_id = auth.uid()
    ));

-- Campaign rules policies
CREATE POLICY "Users can access campaign rules in their workspace" ON campaign_rules
    FOR ALL USING (campaign_id IN (
        SELECT id FROM campaigns WHERE workspace_id IN (
            SELECT workspace_id FROM user_workspaces WHERE user_id = auth.uid()
        )
    ));

-- Lead profiles policies
CREATE POLICY "Users can access lead profiles in their workspace" ON lead_profiles
    FOR ALL USING (workspace_id IN (
        SELECT workspace_id FROM user_workspaces WHERE user_id = auth.uid()
    ));

-- Campaign assignments policies
CREATE POLICY "Users can access campaign assignments in their workspace" ON campaign_assignments
    FOR ALL USING (workspace_id IN (
        SELECT workspace_id FROM user_workspaces WHERE user_id = auth.uid()
    ));

-- Validation cache policies
CREATE POLICY "Users can access validation cache for their leads" ON validation_cache
    FOR ALL USING (lead_id IN (
        SELECT id FROM lead_profiles WHERE workspace_id IN (
            SELECT workspace_id FROM user_workspaces WHERE user_id = auth.uid()
        )
    ));

-- Analytics policies
CREATE POLICY "Users can access analytics for their campaigns" ON campaign_analytics
    FOR ALL USING (campaign_id IN (
        SELECT id FROM campaigns WHERE workspace_id IN (
            SELECT workspace_id FROM user_workspaces WHERE user_id = auth.uid()
        )
    ));

-- Search campaign configs policies
CREATE POLICY "Users can access search campaign configs in their workspace" ON search_campaign_configs
    FOR ALL USING (workspace_id IN (
        SELECT workspace_id FROM user_workspaces WHERE user_id = auth.uid()
    ));

-- Functions for automated tasks
CREATE OR REPLACE FUNCTION reset_daily_campaign_counters()
RETURNS void AS $$
BEGIN
    UPDATE campaigns 
    SET current_leads_today = 0,
        updated_at = NOW()
    WHERE status = 'active';
END;
$$ LANGUAGE plpgsql;

-- Trigger to update campaign performance metrics
CREATE OR REPLACE FUNCTION update_campaign_metrics()
RETURNS TRIGGER AS $$
BEGIN
    -- Update campaign totals when assignment status changes
    IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
        UPDATE campaigns 
        SET 
            total_responses = (
                SELECT COUNT(*) FROM campaign_assignments 
                WHERE campaign_id = NEW.campaign_id AND status = 'responded'
            ),
            total_connections = (
                SELECT COUNT(*) FROM campaign_assignments 
                WHERE campaign_id = NEW.campaign_id AND status = 'connected'
            ),
            success_rate = (
                SELECT CASE WHEN COUNT(*) > 0 THEN 
                    ROUND((COUNT(CASE WHEN status IN ('responded', 'connected') THEN 1 END) * 100.0) / COUNT(*), 2)
                ELSE 0 END
                FROM campaign_assignments WHERE campaign_id = NEW.campaign_id
            ),
            updated_at = NOW()
        WHERE id = NEW.campaign_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_campaign_metrics
    AFTER UPDATE ON campaign_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_campaign_metrics();

-- Function to clean expired validation cache
CREATE OR REPLACE FUNCTION clean_expired_validation_cache()
RETURNS void AS $$
BEGIN
    DELETE FROM validation_cache WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Sample campaign templates
INSERT INTO campaigns (
    workspace_id, name, description, type, target_audience,
    connection_required, premium_required, email_required, phone_required,
    max_connection_degree, min_profile_completeness, max_leads_per_day,
    allowed_search_sources, status
) VALUES 
-- General Connection Requests Template
((SELECT id FROM tenants LIMIT 1), 'General Connection Requests', 'Standard LinkedIn connection requests for broad outreach', 'connection_request', 'general', 
 false, false, false, false, '3rd', 50, 100, 
 ARRAY['basic_search', 'sales_navigator', 'post_engagement'], 'draft'),

-- Sales Outreach Premium Template  
((SELECT id FROM tenants LIMIT 1), 'Sales Outreach (Premium)', 'Targeted sales outreach for premium LinkedIn members', 'direct_message', 'sales_professionals',
 true, true, false, false, '2nd', 70, 50,
 ARRAY['sales_navigator', 'recruiter_search'], 'draft'),

-- Email Campaign Template
((SELECT id FROM tenants LIMIT 1), 'Email Marketing Campaign', 'Direct email outreach campaign', 'email', 'general',
 false, false, true, false, null, 30, 500,
 ARRAY['csv_upload', 'basic_search'], 'draft'),

-- Recruiter Outreach Template
((SELECT id FROM tenants LIMIT 1), 'Recruiter Outreach', 'Professional recruiting outreach with InMail', 'inmail', 'recruiters',
 false, false, false, false, '3rd', 80, 25,
 ARRAY['recruiter_search', 'basic_search'], 'draft')
ON CONFLICT (workspace_id, name) DO NOTHING;