-- SAM AI Complete Database Schema
-- Comprehensive schema for RAG knowledge base and all interactions

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ==============================================
-- WORKSPACE & USER MANAGEMENT
-- ==============================================

-- Workspaces (multi-tenant support)
CREATE TABLE IF NOT EXISTS workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    domain TEXT,
    settings JSONB DEFAULT '{}',
    subscription_tier TEXT DEFAULT 'free',
    subscription_status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Profiles (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    role TEXT DEFAULT 'member', -- admin, member
    avatar_url TEXT,
    settings JSONB DEFAULT '{}',
    onboarding_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(workspace_id, email)
);

-- ==============================================
-- RAG KNOWLEDGE BASE SYSTEM
-- ==============================================

-- Knowledge Base Documents (per workspace)
CREATE TABLE IF NOT EXISTS kb_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    created_by UUID REFERENCES profiles(id),
    
    -- Document metadata
    title TEXT NOT NULL,
    description TEXT,
    document_type TEXT NOT NULL, -- 'website', 'pdf', 'youtube', 'manual_upload', 'conversation'
    source_url TEXT, -- Original URL if scraped
    file_path TEXT, -- Storage path for uploaded files
    mime_type TEXT,
    file_size BIGINT,
    
    -- Processing status
    processing_status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    processing_error TEXT,
    processed_at TIMESTAMP WITH TIME ZONE,
    
    -- Content and metadata
    raw_content TEXT, -- Original text content
    structured_content JSONB, -- Processed/structured content
    metadata JSONB DEFAULT '{}', -- Source-specific metadata
    
    -- Search and indexing
    content_hash TEXT, -- For deduplication
    word_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Knowledge Base Chunks (vector embeddings)
CREATE TABLE IF NOT EXISTS kb_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES kb_documents(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    
    -- Chunk content
    chunk_index INTEGER NOT NULL, -- Position in document
    content TEXT NOT NULL,
    content_type TEXT DEFAULT 'text', -- 'text', 'code', 'table', 'list'
    
    -- Vector embeddings (using pgvector)
    embedding VECTOR(1536), -- OpenAI ada-002 dimensions
    embedding_model TEXT DEFAULT 'text-embedding-ada-002',
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    token_count INTEGER,
    
    -- Context and relationships
    section_title TEXT,
    parent_chunk_id UUID REFERENCES kb_chunks(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Knowledge Extraction (structured data from documents)
CREATE TABLE IF NOT EXISTS kb_extractions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES kb_documents(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    
    -- Extraction details
    extraction_type TEXT NOT NULL, -- 'company_info', 'icp', 'methodology', 'pain_points', 'solutions', 'tone_voice'
    key_field TEXT NOT NULL, -- Structured field name
    value_text TEXT,
    value_json JSONB,
    confidence_score DECIMAL(3,2) DEFAULT 0.0, -- 0.0 to 1.0
    
    -- Source tracking
    source_chunk_id UUID REFERENCES kb_chunks(id),
    extraction_method TEXT DEFAULT 'llm', -- 'llm', 'rule_based', 'manual'
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- CONVERSATIONAL SYSTEM
-- ==============================================

-- Conversation Sessions (SAM chat sessions)
CREATE TABLE IF NOT EXISTS conversation_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id),
    
    -- Session metadata
    session_name TEXT,
    session_type TEXT DEFAULT 'chat', -- 'chat', 'onboarding', 'campaign_setup'
    status TEXT DEFAULT 'active', -- 'active', 'completed', 'archived'
    
    -- Context and state
    context JSONB DEFAULT '{}', -- Session context and variables
    state JSONB DEFAULT '{}', -- Current conversation state
    user_profile JSONB DEFAULT '{}', -- User profile data for this session
    
    -- Analytics
    message_count INTEGER DEFAULT 0,
    total_tokens_used INTEGER DEFAULT 0,
    
    -- Timing
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversation Messages
CREATE TABLE IF NOT EXISTS conversation_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES conversation_sessions(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    
    -- Message details
    role TEXT NOT NULL, -- 'user', 'assistant', 'system'
    content TEXT NOT NULL,
    content_type TEXT DEFAULT 'text', -- 'text', 'markdown', 'json'
    
    -- AI processing details
    model_used TEXT,
    tokens_used INTEGER,
    processing_time_ms INTEGER,
    confidence_score DECIMAL(3,2),
    
    -- Intent and classification
    intent TEXT, -- Extracted intent
    intent_confidence DECIMAL(3,2),
    entities JSONB DEFAULT '[]', -- Extracted entities
    
    -- Agent routing
    routed_to_agent TEXT,
    agent_trace JSONB DEFAULT '[]', -- Agent processing trace
    
    -- Context and memory
    memory_references JSONB DEFAULT '[]', -- KB chunks referenced
    context_used JSONB DEFAULT '{}', -- Context passed to AI
    
    -- Feedback and quality
    user_feedback INTEGER, -- 1-5 rating
    feedback_note TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SAM Memory System (persistent context)
CREATE TABLE IF NOT EXISTS sam_memory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    
    -- Memory classification
    memory_type TEXT NOT NULL, -- 'product', 'audience', 'company', 'campaign', 'conversation', 'preference'
    category TEXT NOT NULL, -- 'business', 'technical', 'strategy', 'performance'
    
    -- Memory content
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    structured_data JSONB DEFAULT '{}',
    
    -- Source and confidence
    source TEXT NOT NULL, -- 'user_input', 'document_upload', 'conversation', 'analysis'
    confidence DECIMAL(3,2) DEFAULT 0.0,
    
    -- Usage and relevance
    access_count INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    relevance_score DECIMAL(3,2) DEFAULT 0.0,
    
    -- Metadata and relationships
    tags TEXT[] DEFAULT '{}',
    related_memory_ids UUID[] DEFAULT '{}',
    source_document_id UUID REFERENCES kb_documents(id),
    source_message_id UUID REFERENCES conversation_messages(id),
    
    -- Lifecycle
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- CAMPAIGN & PROSPECT MANAGEMENT
-- ==============================================

-- Campaigns
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    created_by UUID REFERENCES profiles(id),
    
    -- Campaign details
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL DEFAULT 'outbound', -- 'outbound', 'inbound', 'nurture'
    channel TEXT NOT NULL DEFAULT 'multi', -- 'email', 'linkedin', 'multi'
    status TEXT DEFAULT 'draft', -- 'draft', 'active', 'paused', 'completed'
    
    -- Campaign configuration
    target_audience JSONB DEFAULT '{}', -- ICP criteria
    campaign_steps JSONB DEFAULT '[]', -- Sequence steps
    settings JSONB DEFAULT '{}', -- Campaign settings
    
    -- Performance tracking
    total_prospects INTEGER DEFAULT 0,
    active_prospects INTEGER DEFAULT 0,
    response_rate DECIMAL(5,2) DEFAULT 0.0,
    conversion_rate DECIMAL(5,2) DEFAULT 0.0,
    
    -- Timing and scheduling
    scheduled_start TIMESTAMP WITH TIME ZONE,
    scheduled_end TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Prospects and Contacts
CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    
    -- Contact information
    email TEXT,
    first_name TEXT,
    last_name TEXT,
    full_name TEXT,
    title TEXT,
    company TEXT,
    department TEXT,
    
    -- Social profiles
    linkedin_url TEXT,
    twitter_url TEXT,
    other_profiles JSONB DEFAULT '{}',
    
    -- Contact details
    phone TEXT,
    address JSONB DEFAULT '{}',
    timezone TEXT,
    
    -- Enrichment data
    company_size INTEGER,
    industry TEXT,
    seniority_level TEXT,
    technologies JSONB DEFAULT '[]',
    
    -- Engagement tracking
    engagement_score INTEGER DEFAULT 0,
    last_engagement_at TIMESTAMP WITH TIME ZONE,
    interaction_count INTEGER DEFAULT 0,
    
    -- Classification and status
    contact_status TEXT DEFAULT 'prospect', -- 'prospect', 'lead', 'customer', 'unqualified'
    lead_score INTEGER DEFAULT 0,
    tags TEXT[] DEFAULT '{}',
    
    -- Data sources and quality
    source TEXT, -- 'manual', 'import', 'scraping', 'api'
    data_quality_score DECIMAL(3,2) DEFAULT 0.0,
    last_enriched_at TIMESTAMP WITH TIME ZONE,
    
    -- Privacy and compliance
    opted_out BOOLEAN DEFAULT false,
    do_not_contact BOOLEAN DEFAULT false,
    gdpr_consent BOOLEAN,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(workspace_id, email)
);

-- Campaign Prospects (many-to-many with additional data)
CREATE TABLE IF NOT EXISTS campaign_prospects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    
    -- Prospect status in campaign
    status TEXT DEFAULT 'pending', -- 'pending', 'active', 'responded', 'unqualified', 'completed'
    current_step INTEGER DEFAULT 1,
    
    -- Personalization data
    personalization_data JSONB DEFAULT '{}',
    custom_variables JSONB DEFAULT '{}',
    
    -- Performance tracking
    messages_sent INTEGER DEFAULT 0,
    messages_opened INTEGER DEFAULT 0,
    messages_clicked INTEGER DEFAULT 0,
    responses_received INTEGER DEFAULT 0,
    
    -- Timing
    added_to_campaign_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_contact_at TIMESTAMP WITH TIME ZONE,
    next_contact_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(campaign_id, contact_id)
);

-- ==============================================
-- MESSAGING & COMMUNICATIONS
-- ==============================================

-- Message Templates
CREATE TABLE IF NOT EXISTS message_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    created_by UUID REFERENCES profiles(id),
    
    -- Template details
    name TEXT NOT NULL,
    description TEXT,
    channel TEXT NOT NULL, -- 'email', 'linkedin', 'sms'
    template_type TEXT NOT NULL, -- 'connection', 'follow_up', 'response', 'nurture'
    
    -- Template content
    subject TEXT, -- For emails
    content TEXT NOT NULL,
    variables JSONB DEFAULT '[]', -- Available variables for personalization
    
    -- Performance and testing
    usage_count INTEGER DEFAULT 0,
    performance_metrics JSONB DEFAULT '{}',
    a_b_test_group TEXT, -- 'A', 'B', 'control'
    
    -- Status and lifecycle
    status TEXT DEFAULT 'active', -- 'active', 'testing', 'archived'
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sent Messages (all outbound communications)
CREATE TABLE IF NOT EXISTS sent_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES campaigns(id),
    contact_id UUID NOT NULL REFERENCES contacts(id),
    template_id UUID REFERENCES message_templates(id),
    
    -- Message details
    channel TEXT NOT NULL, -- 'email', 'linkedin', 'sms'
    message_type TEXT NOT NULL, -- 'connection', 'follow_up', 'response'
    
    -- Content (as sent)
    subject TEXT,
    content TEXT NOT NULL,
    personalization_data JSONB DEFAULT '{}',
    
    -- Delivery tracking
    status TEXT DEFAULT 'draft', -- 'draft', 'scheduled', 'sent', 'delivered', 'failed'
    external_id TEXT, -- ID from email/LinkedIn service
    
    -- Human approval workflow
    approval_status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'auto_approved'
    approved_by UUID REFERENCES profiles(id),
    approval_note TEXT,
    approved_at TIMESTAMP WITH TIME ZONE,
    
    -- Scheduling
    scheduled_send_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    
    -- Engagement tracking
    opened_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE,
    responded_at TIMESTAMP WITH TIME ZONE,
    
    -- Error handling
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Received Messages (inbound communications)
CREATE TABLE IF NOT EXISTS received_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id),
    
    -- Message source
    channel TEXT NOT NULL, -- 'email', 'linkedin', 'form'
    external_id TEXT, -- ID from source system
    thread_id TEXT, -- Conversation thread ID
    
    -- Message content
    subject TEXT,
    content TEXT NOT NULL,
    raw_content TEXT, -- Original message with headers
    attachments JSONB DEFAULT '[]',
    
    -- Classification and processing
    message_type TEXT, -- 'response', 'inquiry', 'objection', 'meeting_request'
    intent TEXT, -- Classified intent
    sentiment TEXT, -- 'positive', 'negative', 'neutral'
    priority INTEGER DEFAULT 0,
    
    -- AI processing
    ai_summary TEXT, -- AI-generated summary
    ai_suggested_response TEXT, -- AI-suggested response
    entities_extracted JSONB DEFAULT '{}',
    
    -- Status and workflow
    status TEXT DEFAULT 'new', -- 'new', 'read', 'responded', 'archived'
    assigned_to UUID REFERENCES profiles(id),
    
    -- Response tracking
    requires_response BOOLEAN DEFAULT true,
    response_deadline TIMESTAMP WITH TIME ZONE,
    responded_at TIMESTAMP WITH TIME ZONE,
    response_message_id UUID REFERENCES sent_messages(id),
    
    received_at TIMESTAMP WITH TIME ZONE NOT NULL,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- WORKFLOW & AUTOMATION
-- ==============================================

-- N8N Workflow Integration
CREATE TABLE IF NOT EXISTS workflow_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    
    -- Workflow identification
    n8n_execution_id TEXT,
    n8n_workflow_id TEXT NOT NULL,
    workflow_name TEXT,
    workflow_type TEXT, -- 'lead_research', 'campaign_management', 'content_creation', etc.
    
    -- Execution details
    status TEXT DEFAULT 'running', -- 'running', 'success', 'error', 'waiting'
    trigger_type TEXT, -- 'manual', 'webhook', 'cron', 'api'
    triggered_by UUID REFERENCES profiles(id),
    
    -- Input and output
    input_data JSONB DEFAULT '{}',
    output_data JSONB DEFAULT '{}',
    error_data JSONB DEFAULT '{}',
    
    -- Related entities
    related_campaign_id UUID REFERENCES campaigns(id),
    related_contact_ids UUID[] DEFAULT '{}',
    related_message_ids UUID[] DEFAULT '{}',
    
    -- Performance metrics
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    nodes_executed INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Automation Rules
CREATE TABLE IF NOT EXISTS automation_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    created_by UUID REFERENCES profiles(id),
    
    -- Rule definition
    name TEXT NOT NULL,
    description TEXT,
    rule_type TEXT NOT NULL, -- 'trigger', 'condition', 'action'
    
    -- Trigger conditions
    triggers JSONB NOT NULL DEFAULT '[]', -- Event triggers
    conditions JSONB DEFAULT '[]', -- Additional conditions
    actions JSONB NOT NULL DEFAULT '[]', -- Actions to execute
    
    -- Status and lifecycle
    is_active BOOLEAN DEFAULT true,
    execution_count INTEGER DEFAULT 0,
    last_executed_at TIMESTAMP WITH TIME ZONE,
    
    -- Error handling
    max_retries INTEGER DEFAULT 3,
    failure_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- ANALYTICS & REPORTING
-- ==============================================

-- Analytics Events
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id),
    
    -- Event details
    event_type TEXT NOT NULL, -- 'message_sent', 'message_opened', 'campaign_created', etc.
    event_category TEXT NOT NULL, -- 'engagement', 'conversion', 'workflow', 'ui'
    event_data JSONB DEFAULT '{}',
    
    -- Related entities
    campaign_id UUID REFERENCES campaigns(id),
    contact_id UUID REFERENCES contacts(id),
    message_id UUID REFERENCES sent_messages(id),
    
    -- Metrics
    value DECIMAL(10,2), -- Numeric value for aggregation
    metadata JSONB DEFAULT '{}',
    
    -- Timing
    event_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance Metrics (aggregated data)
CREATE TABLE IF NOT EXISTS performance_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    
    -- Metric identification
    metric_type TEXT NOT NULL, -- 'campaign_performance', 'contact_engagement', 'workflow_efficiency'
    entity_type TEXT NOT NULL, -- 'campaign', 'contact', 'workflow', 'workspace'
    entity_id UUID, -- Related entity ID
    
    -- Time period
    period_type TEXT NOT NULL, -- 'daily', 'weekly', 'monthly'
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Metrics data
    metrics JSONB NOT NULL DEFAULT '{}', -- All metric values
    
    -- Metadata
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(workspace_id, metric_type, entity_type, entity_id, period_type, period_start)
);

-- ==============================================
-- INDEXES FOR PERFORMANCE
-- ==============================================

-- Knowledge Base indexes
CREATE INDEX IF NOT EXISTS idx_kb_documents_workspace_type ON kb_documents(workspace_id, document_type);
CREATE INDEX IF NOT EXISTS idx_kb_documents_processing_status ON kb_documents(processing_status);
CREATE INDEX IF NOT EXISTS idx_kb_chunks_document ON kb_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_kb_chunks_workspace ON kb_chunks(workspace_id);
CREATE INDEX IF NOT EXISTS idx_kb_extractions_document ON kb_extractions(document_id);
CREATE INDEX IF NOT EXISTS idx_kb_extractions_type ON kb_extractions(extraction_type);

-- Conversation indexes
CREATE INDEX IF NOT EXISTS idx_conversation_sessions_workspace ON conversation_sessions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_session ON conversation_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_created_at ON conversation_messages(created_at DESC);

-- Memory indexes
CREATE INDEX IF NOT EXISTS idx_sam_memory_workspace ON sam_memory(workspace_id);
CREATE INDEX IF NOT EXISTS idx_sam_memory_type ON sam_memory(memory_type);
CREATE INDEX IF NOT EXISTS idx_sam_memory_last_accessed ON sam_memory(last_accessed_at DESC);

-- Campaign and contact indexes
CREATE INDEX IF NOT EXISTS idx_campaigns_workspace ON campaigns(workspace_id);
CREATE INDEX IF NOT EXISTS idx_contacts_workspace ON contacts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_campaign_prospects_campaign ON campaign_prospects(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_prospects_contact ON campaign_prospects(contact_id);

-- Message indexes
CREATE INDEX IF NOT EXISTS idx_sent_messages_workspace ON sent_messages(workspace_id);
CREATE INDEX IF NOT EXISTS idx_sent_messages_campaign ON sent_messages(campaign_id);
CREATE INDEX IF NOT EXISTS idx_sent_messages_contact ON sent_messages(contact_id);
CREATE INDEX IF NOT EXISTS idx_sent_messages_sent_at ON sent_messages(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_received_messages_workspace ON received_messages(workspace_id);
CREATE INDEX IF NOT EXISTS idx_received_messages_received_at ON received_messages(received_at DESC);

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_analytics_events_workspace ON analytics_events(workspace_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON analytics_events(event_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_workspace ON performance_metrics(workspace_id);

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_kb_documents_content_gin ON kb_documents USING gin(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(raw_content, '')));
CREATE INDEX IF NOT EXISTS idx_kb_chunks_content_gin ON kb_chunks USING gin(to_tsvector('english', content));
CREATE INDEX IF NOT EXISTS idx_contacts_search_gin ON contacts USING gin(to_tsvector('english', coalesce(full_name, '') || ' ' || coalesce(company, '') || ' ' || coalesce(title, '')));

-- ==============================================
-- ROW LEVEL SECURITY POLICIES
-- ==============================================

-- Enable RLS on all tables
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_extractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE sam_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE sent_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE received_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;

-- Workspace-based policies (users can only access data from their workspace)
CREATE POLICY "Users can access their workspace data" ON workspaces
    FOR ALL USING (
        id IN (
            SELECT workspace_id 
            FROM profiles 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can access their workspace profiles" ON profiles
    FOR ALL USING (
        workspace_id IN (
            SELECT workspace_id 
            FROM profiles 
            WHERE id = auth.uid()
        )
    );

-- Apply workspace-based policies to all tables
DO $$
DECLARE
    table_name text;
    tables text[] := ARRAY[
        'kb_documents', 'kb_chunks', 'kb_extractions',
        'conversation_sessions', 'conversation_messages', 'sam_memory',
        'campaigns', 'contacts', 'campaign_prospects',
        'message_templates', 'sent_messages', 'received_messages',
        'workflow_executions', 'automation_rules',
        'analytics_events', 'performance_metrics'
    ];
BEGIN
    FOREACH table_name IN ARRAY tables
    LOOP
        EXECUTE format('
            CREATE POLICY "Users can access their workspace data" ON %I
                FOR ALL USING (
                    workspace_id IN (
                        SELECT workspace_id 
                        FROM profiles 
                        WHERE id = auth.uid()
                    )
                )
        ', table_name);
    END LOOP;
END
$$;

-- ==============================================
-- FUNCTIONS AND TRIGGERS
-- ==============================================

-- Function to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to relevant tables
DO $$
DECLARE
    table_name text;
    tables text[] := ARRAY[
        'workspaces', 'profiles', 'kb_documents', 'kb_extractions',
        'conversation_sessions', 'conversation_messages', 'sam_memory',
        'campaigns', 'contacts', 'campaign_prospects',
        'message_templates', 'sent_messages', 'automation_rules'
    ];
BEGIN
    FOREACH table_name IN ARRAY tables
    LOOP
        EXECUTE format('
            CREATE OR REPLACE TRIGGER update_%I_updated_at
                BEFORE UPDATE ON %I
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column()
        ', table_name, table_name);
    END LOOP;
END
$$;

-- Function to automatically update memory access tracking
CREATE OR REPLACE FUNCTION update_memory_access()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE sam_memory 
    SET 
        access_count = access_count + 1,
        last_accessed_at = NOW()
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to create default workspace for new users
CREATE OR REPLACE FUNCTION create_user_workspace()
RETURNS TRIGGER AS $$
DECLARE
    workspace_uuid UUID;
BEGIN
    -- Create a default workspace for the user
    INSERT INTO workspaces (name)
    VALUES (COALESCE(NEW.raw_user_meta_data->>'full_name', 'My Workspace') || '''s Workspace')
    RETURNING id INTO workspace_uuid;
    
    -- Create the user profile
    INSERT INTO profiles (id, workspace_id, email, full_name)
    VALUES (
        NEW.id,
        workspace_uuid,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
    );
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to create workspace for new users
CREATE OR REPLACE TRIGGER create_user_workspace_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_user_workspace();

-- ==============================================
-- SAMPLE DATA FOR TESTING
-- ==============================================

-- Insert sample workspace and profile (for development)
INSERT INTO workspaces (id, name, domain) 
VALUES (
    'df5d730f-1915-4269-bd5a-9534478b17af'::uuid,
    'SAM AI Demo Workspace',
    'demo.sameai.com'
) ON CONFLICT (id) DO NOTHING;

-- Insert sample user profile
INSERT INTO profiles (id, workspace_id, email, full_name, role, onboarding_completed)
VALUES (
    'cc000000-0000-0000-0000-000000000002'::uuid,
    'df5d730f-1915-4269-bd5a-9534478b17af'::uuid,
    'demo@sameai.com',
    'SAM AI Demo User',
    'admin',
    true
) ON CONFLICT (workspace_id, email) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    onboarding_completed = EXCLUDED.onboarding_completed;

COMMENT ON SCHEMA public IS 'SAM AI Complete Database Schema - RAG Knowledge Base and All Interactions';