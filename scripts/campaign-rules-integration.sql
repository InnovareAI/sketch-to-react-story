-- Campaign Rules Integration Schema
-- Adapted for existing SAM AI database structure

-- Add campaign rule fields to existing campaigns table
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'connection_request' CHECK (type IN ('connection_request', 'direct_message', 'inmail', 'email', 'multi_channel')),
ADD COLUMN IF NOT EXISTS target_audience VARCHAR(50) DEFAULT 'general',
ADD COLUMN IF NOT EXISTS connection_required BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS premium_required BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS email_required BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS phone_required BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS min_mutual_connections INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_connection_degree VARCHAR(10) CHECK (max_connection_degree IN ('1st', '2nd', '3rd')),
ADD COLUMN IF NOT EXISTS min_profile_completeness INTEGER DEFAULT 0 CHECK (min_profile_completeness >= 0 AND min_profile_completeness <= 100),
ADD COLUMN IF NOT EXISTS excluded_industries TEXT[],
ADD COLUMN IF NOT EXISTS excluded_titles TEXT[],
ADD COLUMN IF NOT EXISTS allowed_search_sources TEXT[] DEFAULT ARRAY['basic_search', 'sales_navigator', 'post_engagement', 'csv_upload'],
ADD COLUMN IF NOT EXISTS max_leads_per_day INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS max_leads_total INTEGER,
ADD COLUMN IF NOT EXISTS current_leads_today INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_leads_total INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_sent INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_responses INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_connections INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS success_rate DECIMAL(5,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}';

-- Lead profiles table adapted for existing structure
CREATE TABLE IF NOT EXISTS lead_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
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
    search_id UUID,
    source_url TEXT,
    
    -- Enrichment data
    enrichment_status VARCHAR(20) DEFAULT 'pending' CHECK (enrichment_status IN ('pending', 'completed', 'failed', 'not_needed')),
    enriched_at TIMESTAMP WITH TIME ZONE,
    enrichment_provider VARCHAR(50),
    
    -- Profile quality scoring
    quality_score DECIMAL(3,2) DEFAULT 0.00 CHECK (quality_score >= 0.00 AND quality_score <= 1.00),
    data_completeness DECIMAL(3,2) DEFAULT 0.00 CHECK (data_completeness >= 0.00 AND data_completeness <= 1.00),
    
    -- Tracking and metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_contacted TIMESTAMP WITH TIME ZONE,
    
    -- Additional data as JSONB for flexibility
    additional_data JSONB DEFAULT '{}',
    
    CONSTRAINT unique_linkedin_url_per_tenant UNIQUE(tenant_id, linkedin_url)
);

-- Enhanced campaign assignments table
CREATE TABLE IF NOT EXISTS enhanced_campaign_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES lead_profiles(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_lead_profiles_tenant ON lead_profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_lead_profiles_linkedin_url ON lead_profiles(linkedin_url);
CREATE INDEX IF NOT EXISTS idx_lead_profiles_search_source ON lead_profiles(search_source);
CREATE INDEX IF NOT EXISTS idx_lead_profiles_quality_score ON lead_profiles(quality_score);
CREATE INDEX IF NOT EXISTS idx_enhanced_campaign_assignments_campaign_status ON enhanced_campaign_assignments(campaign_id, status);
CREATE INDEX IF NOT EXISTS idx_enhanced_campaign_assignments_tenant ON enhanced_campaign_assignments(tenant_id);

-- Row Level Security (RLS) Policies
ALTER TABLE lead_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE enhanced_campaign_assignments ENABLE ROW LEVEL SECURITY;

-- Lead profiles policies (using tenant_id)
CREATE POLICY "Users can access lead profiles in their tenant" ON lead_profiles
    FOR ALL USING (tenant_id = (
        SELECT tenant_id FROM users WHERE id = auth.uid()
    ));

-- Enhanced campaign assignments policies
CREATE POLICY "Users can access campaign assignments in their tenant" ON enhanced_campaign_assignments
    FOR ALL USING (tenant_id = (
        SELECT tenant_id FROM users WHERE id = auth.uid()
    ));

-- Functions for campaign management
CREATE OR REPLACE FUNCTION reset_daily_campaign_counters()
RETURNS void AS $$
BEGIN
    UPDATE campaigns 
    SET current_leads_today = 0,
        updated_at = NOW()
    WHERE status = 'active';
END;
$$ LANGUAGE plpgsql;

-- Insert some sample data for testing
INSERT INTO lead_profiles (
    tenant_id, name, title, company, location, email, linkedin_url,
    connection_degree, premium_account, profile_completeness, 
    mutual_connections, search_source, quality_score
) VALUES 
(
    (SELECT id FROM tenants LIMIT 1),
    'Sarah Johnson', 'Marketing Manager', 'TechCorp Inc', 'San Francisco, CA',
    'sarah.johnson@techcorp.com', 'https://linkedin.com/in/sarahjohnson',
    '2nd', false, 85, 15, 'basic_search', 0.82
),
(
    (SELECT id FROM tenants LIMIT 1),
    'Michael Chen', 'Senior Developer', 'StartupXYZ', 'Austin, TX',
    null, 'https://linkedin.com/in/michaelchen',
    '3rd', true, 90, 8, 'sales_navigator', 0.75
)
ON CONFLICT (tenant_id, linkedin_url) DO NOTHING;

-- Update campaign with rules data
UPDATE campaigns 
SET 
    type = 'connection_request',
    target_audience = 'general',
    connection_required = false,
    premium_required = false,
    max_leads_per_day = 100,
    allowed_search_sources = ARRAY['basic_search', 'sales_navigator', 'post_engagement'],
    min_profile_completeness = 50
WHERE name IS NOT NULL
LIMIT 3;