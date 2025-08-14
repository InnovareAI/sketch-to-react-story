-- Fix missing prospect and campaign-related tables
-- These had syntax errors in the original schema

-- =============================================
-- PROSPECT MANAGEMENT TABLES
-- =============================================

-- Core prospects table (LinkedIn profiles)
CREATE TABLE IF NOT EXISTS prospects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    
    -- Profile Identity
    linkedin_profile_id TEXT UNIQUE,
    linkedin_url TEXT,
    full_name TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    phone TEXT,
    
    -- Professional Information
    current_title TEXT,
    current_company TEXT,
    headline TEXT,
    industry TEXT,
    location TEXT,
    profile_image_url TEXT,
    
    -- Experience and Background
    experience JSONB DEFAULT '[]'::jsonb,
    education JSONB DEFAULT '[]'::jsonb,
    skills TEXT[],
    certifications JSONB DEFAULT '[]'::jsonb,
    languages TEXT[],
    
    -- LinkedIn Metrics
    connections_count INTEGER DEFAULT 0,
    mutual_connections INTEGER DEFAULT 0,
    followers_count INTEGER DEFAULT 0,
    posts_count INTEGER DEFAULT 0,
    engagement_rate DECIMAL(5,2) DEFAULT 0.0,
    
    -- Data Quality and Enrichment
    data_completeness_score INTEGER DEFAULT 0,
    data_quality_score DECIMAL(5,2) DEFAULT 0.0,
    enrichment_status TEXT DEFAULT 'pending' CHECK (enrichment_status IN ('pending', 'processing', 'completed', 'failed', 'skipped')),
    enrichment_source TEXT DEFAULT 'unipile',
    last_enriched_at TIMESTAMP WITH TIME ZONE,
    
    -- Engagement History  
    engagement_score INTEGER DEFAULT 0,
    last_activity_date TIMESTAMP WITH TIME ZONE,
    interaction_count INTEGER DEFAULT 0,
    response_history JSONB DEFAULT '[]'::jsonb,
    
    -- Metadata
    tags TEXT[],
    notes TEXT,
    custom_fields JSONB DEFAULT '{}'::jsonb,
    source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'csv', 'linkedin', 'search', 'referral', 'import', 'api')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id)
);

-- Campaign-Prospect relationship table
CREATE TABLE IF NOT EXISTS campaign_prospects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    prospect_id UUID NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,
    
    -- Campaign-specific status
    status TEXT DEFAULT 'pending_review' CHECK (status IN (
        'pending_review', 'approved', 'rejected', 'contacted', 
        'responded', 'converted', 'bounced', 'unsubscribed', 'blocked'
    )),
    
    -- Review and Approval
    review_score INTEGER CHECK (review_score >= 1 AND review_score <= 10),
    review_notes TEXT,
    approved_by UUID REFERENCES profiles(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    
    -- Campaign Execution
    step_progress INTEGER DEFAULT 0,
    current_step_id TEXT,
    next_action_at TIMESTAMP WITH TIME ZONE,
    contact_attempts INTEGER DEFAULT 0,
    successful_contacts INTEGER DEFAULT 0,
    last_contacted_at TIMESTAMP WITH TIME ZONE,
    last_response_at TIMESTAMP WITH TIME ZONE,
    
    -- Performance Metrics
    opens INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    replies INTEGER DEFAULT 0,
    positive_replies INTEGER DEFAULT 0,
    conversion_events INTEGER DEFAULT 0,
    
    -- Campaign Context
    personalization_data JSONB DEFAULT '{}'::jsonb,
    custom_variables JSONB DEFAULT '{}'::jsonb,
    exclusion_reasons TEXT[],
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(campaign_id, prospect_id)
);

-- Bulk extraction jobs tracking  
CREATE TABLE IF NOT EXISTS extraction_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    
    -- Job Configuration
    job_type TEXT DEFAULT 'prospect_extraction' CHECK (job_type IN ('prospect_extraction', 'enrichment', 'validation', 'export')),
    source_type TEXT DEFAULT 'linkedin' CHECK (source_type IN ('linkedin', 'csv', 'api', 'search', 'manual')),
    
    -- Progress Tracking
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'paused')),
    total_records INTEGER NOT NULL DEFAULT 0,
    processed_records INTEGER DEFAULT 0,
    successful_records INTEGER DEFAULT 0,
    failed_records INTEGER DEFAULT 0,
    skipped_records INTEGER DEFAULT 0,
    
    -- Cost and Billing
    estimated_cost DECIMAL(10,2) DEFAULT 0.0,
    actual_cost DECIMAL(10,2) DEFAULT 0.0,
    credits_used INTEGER DEFAULT 0,
    
    -- Timing
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    estimated_completion TIMESTAMP WITH TIME ZONE,
    
    -- Configuration and Results
    extraction_config JSONB DEFAULT '{}'::jsonb,
    results_summary JSONB DEFAULT '{}'::jsonb,
    error_log JSONB DEFAULT '[]'::jsonb,
    
    -- Metadata
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Individual extraction records for detailed tracking
CREATE TABLE IF NOT EXISTS extraction_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    extraction_job_id UUID NOT NULL REFERENCES extraction_jobs(id) ON DELETE CASCADE,
    prospect_id UUID REFERENCES prospects(id) ON DELETE CASCADE,
    
    -- Record Details
    linkedin_profile_id TEXT,
    linkedin_url TEXT,
    extraction_status TEXT DEFAULT 'pending' CHECK (extraction_status IN ('pending', 'processing', 'completed', 'failed', 'skipped')),
    
    -- Data Quality
    data_completeness DECIMAL(5,2) DEFAULT 0.0,
    confidence_score DECIMAL(5,2) DEFAULT 0.0,
    validation_status TEXT DEFAULT 'pending',
    
    -- Extraction Results
    extracted_data JSONB DEFAULT '{}'::jsonb,
    raw_response JSONB DEFAULT '{}'::jsonb,
    
    -- Error Handling
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    last_retry_at TIMESTAMP WITH TIME ZONE,
    
    -- Timing
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- CAMPAIGN INTELLIGENCE TABLES  
-- =============================================

-- Campaign knowledge base for RAG
CREATE TABLE IF NOT EXISTS campaign_knowledge_base (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    
    -- Content
    content_type TEXT DEFAULT 'insight' CHECK (content_type IN ('insight', 'template', 'research', 'competitor', 'market_data', 'best_practice')),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    summary TEXT,
    
    -- Categorization
    category TEXT,
    tags TEXT[],
    priority INTEGER DEFAULT 3 CHECK (priority >= 1 AND priority <= 5),
    
    -- RAG Support (would need vector extension enabled)
    -- embedding_vector VECTOR(1536), -- Uncomment when vector extension available
    content_hash TEXT,
    
    -- Usage Tracking
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMP WITH TIME ZONE,
    effectiveness_score DECIMAL(5,2) DEFAULT 0.0,
    
    -- Metadata
    source TEXT DEFAULT 'manual',
    external_id TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Campaign insights and recommendations
CREATE TABLE IF NOT EXISTS campaign_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    
    -- Insight Details
    insight_type TEXT DEFAULT 'performance' CHECK (insight_type IN ('performance', 'optimization', 'audience', 'content', 'timing', 'competitive')),
    title TEXT NOT NULL,
    description TEXT,
    recommendation TEXT,
    
    -- Impact Assessment
    impact_level TEXT DEFAULT 'medium' CHECK (impact_level IN ('low', 'medium', 'high', 'critical')),
    confidence_score DECIMAL(5,2) DEFAULT 0.0,
    expected_improvement DECIMAL(5,2),
    
    -- Implementation
    implementation_status TEXT DEFAULT 'pending' CHECK (implementation_status IN ('pending', 'in_progress', 'implemented', 'dismissed')),
    implementation_notes TEXT,
    
    -- Analytics
    supporting_data JSONB DEFAULT '{}'::jsonb,
    metrics_before JSONB DEFAULT '{}'::jsonb,
    metrics_after JSONB DEFAULT '{}'::jsonb,
    
    -- Metadata
    generated_by TEXT DEFAULT 'system',
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Campaign messages and communication history
CREATE TABLE IF NOT EXISTS campaign_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    prospect_id UUID NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,
    
    -- Message Details
    step_number INTEGER NOT NULL,
    step_name TEXT,
    message_type TEXT DEFAULT 'linkedin_message' CHECK (message_type IN ('linkedin_connection', 'linkedin_message', 'linkedin_inmail', 'email', 'sms', 'call')),
    
    -- Content
    subject TEXT,
    message_content TEXT NOT NULL,
    personalized_content TEXT,
    template_used TEXT,
    variables_used JSONB DEFAULT '{}'::jsonb,
    
    -- Delivery Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'queued', 'sent', 'delivered', 'opened', 'clicked', 'replied', 'bounced', 'failed', 'cancelled')),
    platform_message_id TEXT,
    platform_thread_id TEXT,
    
    -- Timing
    scheduled_for TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    opened_at TIMESTAMP WITH TIME ZONE,
    replied_at TIMESTAMP WITH TIME ZONE,
    
    -- Analytics
    open_count INTEGER DEFAULT 0,
    click_count INTEGER DEFAULT 0,
    response_sentiment TEXT,
    response_content TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Prospects indexes
CREATE INDEX IF NOT EXISTS idx_prospects_workspace_id ON prospects(workspace_id);
CREATE INDEX IF NOT EXISTS idx_prospects_linkedin_profile_id ON prospects(linkedin_profile_id) WHERE linkedin_profile_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_prospects_email ON prospects(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_prospects_company ON prospects(current_company) WHERE current_company IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_prospects_enrichment_status ON prospects(enrichment_status);
CREATE INDEX IF NOT EXISTS idx_prospects_data_quality ON prospects(data_completeness_score, data_quality_score);

-- Campaign prospects indexes
CREATE INDEX IF NOT EXISTS idx_campaign_prospects_campaign_id ON campaign_prospects(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_prospects_prospect_id ON campaign_prospects(prospect_id);
CREATE INDEX IF NOT EXISTS idx_campaign_prospects_status ON campaign_prospects(status);
CREATE INDEX IF NOT EXISTS idx_campaign_prospects_next_action ON campaign_prospects(next_action_at) WHERE next_action_at IS NOT NULL;

-- Extraction jobs indexes
CREATE INDEX IF NOT EXISTS idx_extraction_jobs_workspace_id ON extraction_jobs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_extraction_jobs_campaign_id ON extraction_jobs(campaign_id) WHERE campaign_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_extraction_jobs_status ON extraction_jobs(status);
CREATE INDEX IF NOT EXISTS idx_extraction_jobs_created_at ON extraction_jobs(created_at);

-- Campaign messages indexes
CREATE INDEX IF NOT EXISTS idx_campaign_messages_campaign_id ON campaign_messages(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_messages_prospect_id ON campaign_messages(prospect_id);
CREATE INDEX IF NOT EXISTS idx_campaign_messages_status ON campaign_messages(status);
CREATE INDEX IF NOT EXISTS idx_campaign_messages_scheduled ON campaign_messages(scheduled_for) WHERE scheduled_for IS NOT NULL;

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

-- Enable RLS
ALTER TABLE prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_prospects ENABLE ROW LEVEL SECURITY;  
ALTER TABLE extraction_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE extraction_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_messages ENABLE ROW LEVEL SECURITY;

-- Workspace isolation policies
CREATE POLICY workspace_isolation_prospects ON prospects
    FOR ALL USING (workspace_id IN (
        SELECT workspace_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY workspace_isolation_campaign_prospects ON campaign_prospects
    FOR ALL USING (EXISTS (
        SELECT 1 FROM campaigns c 
        JOIN profiles p ON c.workspace_id = p.workspace_id 
        WHERE c.id = campaign_prospects.campaign_id AND p.id = auth.uid()
    ));

CREATE POLICY workspace_isolation_extraction_jobs ON extraction_jobs
    FOR ALL USING (workspace_id IN (
        SELECT workspace_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY workspace_isolation_extraction_records ON extraction_records
    FOR ALL USING (EXISTS (
        SELECT 1 FROM extraction_jobs e
        JOIN profiles p ON e.workspace_id = p.workspace_id
        WHERE e.id = extraction_records.extraction_job_id AND p.id = auth.uid()
    ));

CREATE POLICY workspace_isolation_campaign_knowledge_base ON campaign_knowledge_base
    FOR ALL USING (workspace_id IN (
        SELECT workspace_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY workspace_isolation_campaign_insights ON campaign_insights
    FOR ALL USING (workspace_id IN (
        SELECT workspace_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY workspace_isolation_campaign_messages ON campaign_messages
    FOR ALL USING (EXISTS (
        SELECT 1 FROM campaigns c
        JOIN profiles p ON c.workspace_id = p.workspace_id
        WHERE c.id = campaign_messages.campaign_id AND p.id = auth.uid()
    ));

-- Success notification
DO $$
BEGIN
    RAISE NOTICE '✅ Missing campaign tables created successfully!';
    RAISE NOTICE '📊 Created: prospects, campaign_prospects, extraction_jobs, extraction_records';  
    RAISE NOTICE '🧠 Created: campaign_knowledge_base, campaign_insights, campaign_messages';
    RAISE NOTICE '⚡ Added performance indexes and RLS policies';
    RAISE NOTICE '🚀 Campaign database schema is now complete!';
END $$;