-- N8N Integration Schema
-- Data structures to bridge SAM AI Supabase data with N8N workflows

-- ==============================================
-- N8N WORKFLOW INTEGRATION TABLES
-- ==============================================

-- N8N Workflow Registry (track available workflows)
CREATE TABLE IF NOT EXISTS n8n_workflows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    
    -- N8N workflow identification
    n8n_workflow_id TEXT NOT NULL,
    n8n_workflow_name TEXT NOT NULL,
    workflow_type TEXT NOT NULL, -- 'lead_research', 'campaign_management', 'content_creation', etc.
    
    -- Workflow metadata
    description TEXT,
    version TEXT DEFAULT '1.0',
    tags TEXT[] DEFAULT '{}',
    
    -- Configuration
    input_schema JSONB DEFAULT '{}', -- Expected input format
    output_schema JSONB DEFAULT '{}', -- Expected output format
    webhook_url TEXT, -- Webhook trigger URL
    api_endpoint TEXT, -- Alternative API endpoint
    
    -- Status and capabilities
    is_active BOOLEAN DEFAULT true,
    supports_streaming BOOLEAN DEFAULT false,
    estimated_duration_seconds INTEGER DEFAULT 60,
    
    -- Usage tracking
    execution_count INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 0.0,
    last_executed_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(workspace_id, n8n_workflow_id)
);

-- Workflow Queue (manage workflow execution requests)
CREATE TABLE IF NOT EXISTS workflow_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    workflow_id UUID NOT NULL REFERENCES n8n_workflows(id),
    
    -- Request details
    priority INTEGER DEFAULT 5, -- 1 (highest) to 10 (lowest)
    status TEXT DEFAULT 'queued', -- 'queued', 'processing', 'completed', 'failed', 'cancelled'
    
    -- Input/Output data
    input_data JSONB NOT NULL DEFAULT '{}',
    output_data JSONB DEFAULT '{}',
    error_data JSONB DEFAULT '{}',
    
    -- Context and relationships
    triggered_by TEXT NOT NULL, -- 'conversation', 'quick_action', 'automation', 'api'
    source_session_id UUID REFERENCES conversation_sessions(id),
    source_message_id UUID REFERENCES conversation_messages(id),
    related_campaign_id UUID REFERENCES campaigns(id),
    related_contact_ids UUID[] DEFAULT '{}',
    
    -- Execution tracking
    queued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    
    -- N8N execution tracking
    n8n_execution_id TEXT,
    n8n_webhook_response JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- DATA SYNC TABLES (Supabase <-> N8N)
-- ==============================================

-- Sync Status (track data synchronization)
CREATE TABLE IF NOT EXISTS sync_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    
    -- Sync identification
    sync_type TEXT NOT NULL, -- 'contacts', 'campaigns', 'knowledge_base', 'conversations'
    entity_type TEXT NOT NULL, -- 'contact', 'campaign', 'document', 'message'
    entity_id UUID NOT NULL, -- ID of the synced entity
    
    -- N8N side tracking
    n8n_entity_id TEXT, -- ID in N8N system (if applicable)
    n8n_workflow_id TEXT, -- Workflow that processed this entity
    
    -- Sync details
    sync_direction TEXT NOT NULL, -- 'to_n8n', 'from_n8n', 'bidirectional'
    sync_status TEXT DEFAULT 'pending', -- 'pending', 'synced', 'failed', 'partial'
    
    -- Data and metadata
    synced_data JSONB DEFAULT '{}',
    sync_errors JSONB DEFAULT '[]',
    last_sync_attempt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_successful_sync TIMESTAMP WITH TIME ZONE,
    
    -- Version control
    local_version INTEGER DEFAULT 1,
    remote_version INTEGER DEFAULT 1,
    conflict_resolution TEXT, -- 'local_wins', 'remote_wins', 'manual'
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(workspace_id, sync_type, entity_type, entity_id)
);

-- ==============================================
-- WORKFLOW-SPECIFIC DATA TABLES
-- ==============================================

-- Lead Research Requests (input for N8N lead research workflow)
CREATE TABLE IF NOT EXISTS lead_research_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    queue_id UUID REFERENCES workflow_queue(id),
    
    -- Search criteria (input to N8N)
    company_criteria JSONB NOT NULL DEFAULT '{}', -- Industry, size, location, etc.
    role_criteria JSONB NOT NULL DEFAULT '{}', -- Titles, seniority, departments
    additional_filters JSONB DEFAULT '{}', -- Technologies, recent news, etc.
    
    -- Search configuration
    max_results INTEGER DEFAULT 100,
    data_sources TEXT[] DEFAULT '{"linkedin", "apollo", "zoominfo"}',
    enrichment_level TEXT DEFAULT 'standard', -- 'basic', 'standard', 'premium'
    
    -- Results (output from N8N)
    prospects_found INTEGER DEFAULT 0,
    prospects_data JSONB DEFAULT '[]',
    search_metadata JSONB DEFAULT '{}',
    
    -- Processing status
    status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    processing_started_at TIMESTAMP WITH TIME ZONE,
    processing_completed_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content Generation Requests (input for N8N content creation workflow)
CREATE TABLE IF NOT EXISTS content_generation_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    queue_id UUID REFERENCES workflow_queue(id),
    
    -- Content requirements (input to N8N)
    content_type TEXT NOT NULL, -- 'email', 'linkedin_message', 'follow_up', 'objection_handler'
    target_audience JSONB NOT NULL DEFAULT '{}',
    personalization_data JSONB DEFAULT '{}',
    content_guidelines JSONB DEFAULT '{}', -- Tone, length, style
    
    -- Knowledge base context
    kb_context_ids UUID[] DEFAULT '{}', -- Related KB documents
    conversation_context_id UUID REFERENCES conversation_sessions(id),
    
    -- Generated content (output from N8N)
    generated_content JSONB DEFAULT '{}', -- Multiple variations
    content_metadata JSONB DEFAULT '{}', -- Quality scores, etc.
    
    -- A/B testing
    variants_requested INTEGER DEFAULT 1,
    variants_generated INTEGER DEFAULT 0,
    
    -- Processing status
    status TEXT DEFAULT 'pending',
    processing_started_at TIMESTAMP WITH TIME ZONE,
    processing_completed_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Campaign Orchestration (complex multi-step workflow requests)
CREATE TABLE IF NOT EXISTS campaign_orchestration_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES campaigns(id),
    
    -- Orchestration configuration
    workflow_steps JSONB NOT NULL DEFAULT '[]', -- Ordered list of steps
    current_step INTEGER DEFAULT 1,
    step_dependencies JSONB DEFAULT '{}', -- Dependencies between steps
    
    -- Step execution tracking
    step_executions JSONB DEFAULT '[]', -- Execution details for each step
    parallel_executions UUID[] DEFAULT '{}', -- Parallel workflow queue IDs
    
    -- Overall status
    orchestration_status TEXT DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed', 'paused'
    completion_percentage INTEGER DEFAULT 0,
    
    -- Timing
    started_at TIMESTAMP WITH TIME ZONE,
    estimated_completion_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- REAL-TIME WORKFLOW STATUS TRACKING
-- ==============================================

-- Workflow Status Updates (real-time status from N8N)
CREATE TABLE IF NOT EXISTS workflow_status_updates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    queue_id UUID REFERENCES workflow_queue(id),
    
    -- Status update details
    n8n_execution_id TEXT NOT NULL,
    n8n_node_name TEXT, -- Current node being executed
    status_type TEXT NOT NULL, -- 'started', 'progress', 'node_completed', 'completed', 'error'
    
    -- Progress information
    progress_percentage INTEGER DEFAULT 0,
    current_step TEXT,
    total_steps INTEGER,
    
    -- Status data
    status_message TEXT,
    status_data JSONB DEFAULT '{}',
    error_details JSONB DEFAULT '{}',
    
    -- Timing
    n8n_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- N8N WEBHOOK RECEIVERS
-- ==============================================

-- Webhook Events (incoming data from N8N workflows)
CREATE TABLE IF NOT EXISTS n8n_webhook_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    
    -- Webhook details
    webhook_type TEXT NOT NULL, -- 'workflow_completed', 'status_update', 'data_sync', 'error'
    source_workflow_id TEXT,
    n8n_execution_id TEXT,
    
    -- Payload data
    raw_payload JSONB NOT NULL,
    processed_payload JSONB DEFAULT '{}',
    
    -- Processing status
    processing_status TEXT DEFAULT 'pending', -- 'pending', 'processed', 'failed'
    processing_error TEXT,
    processed_at TIMESTAMP WITH TIME ZONE,
    
    -- Routing and handling
    target_queue_id UUID REFERENCES workflow_queue(id),
    handler_function TEXT, -- Function that should process this webhook
    
    received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- KNOWLEDGE BASE TO N8N SYNC
-- ==============================================

-- KB Documents staged for N8N processing
CREATE TABLE IF NOT EXISTS kb_documents_n8n_staging (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES kb_documents(id) ON DELETE CASCADE,
    
    -- N8N processing configuration
    processing_type TEXT NOT NULL, -- 'embedding_generation', 'content_analysis', 'extraction', 'summarization'
    processing_priority INTEGER DEFAULT 5,
    
    -- Processing status
    status TEXT DEFAULT 'staged', -- 'staged', 'processing', 'completed', 'failed'
    n8n_workflow_id TEXT,
    n8n_execution_id TEXT,
    
    -- Input data for N8N
    input_data JSONB NOT NULL DEFAULT '{}',
    processing_config JSONB DEFAULT '{}',
    
    -- Output data from N8N
    output_data JSONB DEFAULT '{}',
    processing_errors JSONB DEFAULT '[]',
    
    -- Timing
    staged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processing_started_at TIMESTAMP WITH TIME ZONE,
    processing_completed_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- INDEXES FOR N8N INTEGRATION
-- ==============================================

-- Workflow queue indexes
CREATE INDEX IF NOT EXISTS idx_workflow_queue_status ON workflow_queue(status);
CREATE INDEX IF NOT EXISTS idx_workflow_queue_priority ON workflow_queue(priority, queued_at);
CREATE INDEX IF NOT EXISTS idx_workflow_queue_workspace ON workflow_queue(workspace_id);

-- Sync status indexes
CREATE INDEX IF NOT EXISTS idx_sync_status_workspace ON sync_status(workspace_id);
CREATE INDEX IF NOT EXISTS idx_sync_status_type ON sync_status(sync_type, entity_type);
CREATE INDEX IF NOT EXISTS idx_sync_status_entity ON sync_status(entity_id);

-- Workflow status updates indexes
CREATE INDEX IF NOT EXISTS idx_workflow_status_queue ON workflow_status_updates(queue_id);
CREATE INDEX IF NOT EXISTS idx_workflow_status_execution ON workflow_status_updates(n8n_execution_id);
CREATE INDEX IF NOT EXISTS idx_workflow_status_timestamp ON workflow_status_updates(n8n_timestamp DESC);

-- Webhook events indexes
CREATE INDEX IF NOT EXISTS idx_webhook_events_type ON n8n_webhook_events(webhook_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_status ON n8n_webhook_events(processing_status);
CREATE INDEX IF NOT EXISTS idx_webhook_events_received ON n8n_webhook_events(received_at DESC);

-- KB staging indexes
CREATE INDEX IF NOT EXISTS idx_kb_staging_status ON kb_documents_n8n_staging(status);
CREATE INDEX IF NOT EXISTS idx_kb_staging_document ON kb_documents_n8n_staging(document_id);
CREATE INDEX IF NOT EXISTS idx_kb_staging_priority ON kb_documents_n8n_staging(processing_priority, staged_at);

-- ==============================================
-- FUNCTIONS FOR N8N INTEGRATION
-- ==============================================

-- Function to queue workflow execution
CREATE OR REPLACE FUNCTION queue_n8n_workflow(
    p_workspace_id UUID,
    p_workflow_type TEXT,
    p_input_data JSONB,
    p_priority INTEGER DEFAULT 5,
    p_triggered_by TEXT DEFAULT 'api'
) RETURNS UUID AS $$
DECLARE
    workflow_rec RECORD;
    queue_id UUID;
BEGIN
    -- Find the appropriate workflow
    SELECT * INTO workflow_rec
    FROM n8n_workflows
    WHERE workspace_id = p_workspace_id
      AND workflow_type = p_workflow_type
      AND is_active = true
    LIMIT 1;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'No active workflow found for type: %', p_workflow_type;
    END IF;
    
    -- Create queue entry
    INSERT INTO workflow_queue (
        workspace_id,
        workflow_id,
        priority,
        input_data,
        triggered_by
    ) VALUES (
        p_workspace_id,
        workflow_rec.id,
        p_priority,
        p_input_data,
        p_triggered_by
    ) RETURNING id INTO queue_id;
    
    RETURN queue_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to process webhook events
CREATE OR REPLACE FUNCTION process_n8n_webhook(
    p_webhook_type TEXT,
    p_payload JSONB
) RETURNS BOOLEAN AS $$
DECLARE
    workspace_uuid UUID;
    queue_uuid UUID;
    execution_id TEXT;
BEGIN
    -- Extract workspace ID from payload
    workspace_uuid := (p_payload->>'workspace_id')::UUID;
    execution_id := p_payload->>'execution_id';
    
    -- Find related queue item
    SELECT id INTO queue_uuid
    FROM workflow_queue
    WHERE n8n_execution_id = execution_id
    LIMIT 1;
    
    -- Process based on webhook type
    CASE p_webhook_type
        WHEN 'workflow_completed' THEN
            -- Update queue status and output data
            UPDATE workflow_queue
            SET status = 'completed',
                output_data = p_payload->'output',
                completed_at = NOW()
            WHERE id = queue_uuid;
            
        WHEN 'workflow_failed' THEN
            -- Update queue with error information
            UPDATE workflow_queue
            SET status = 'failed',
                error_data = p_payload->'error',
                completed_at = NOW()
            WHERE id = queue_uuid;
            
        WHEN 'status_update' THEN
            -- Insert status update
            INSERT INTO workflow_status_updates (
                workspace_id,
                queue_id,
                n8n_execution_id,
                status_type,
                progress_percentage,
                status_message,
                status_data,
                n8n_timestamp
            ) VALUES (
                workspace_uuid,
                queue_uuid,
                execution_id,
                p_payload->>'status_type',
                (p_payload->>'progress')::INTEGER,
                p_payload->>'message',
                p_payload->'data',
                (p_payload->>'timestamp')::TIMESTAMP WITH TIME ZONE
            );
    END CASE;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail
        INSERT INTO n8n_webhook_events (
            workspace_id,
            webhook_type,
            raw_payload,
            processing_status,
            processing_error
        ) VALUES (
            workspace_uuid,
            p_webhook_type,
            p_payload,
            'failed',
            SQLERRM
        );
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to stage KB documents for N8N processing
CREATE OR REPLACE FUNCTION stage_kb_document_for_n8n(
    p_document_id UUID,
    p_processing_type TEXT
) RETURNS UUID AS $$
DECLARE
    doc_rec RECORD;
    staging_id UUID;
BEGIN
    -- Get document details
    SELECT * INTO doc_rec
    FROM kb_documents
    WHERE id = p_document_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Document not found: %', p_document_id;
    END IF;
    
    -- Create staging entry
    INSERT INTO kb_documents_n8n_staging (
        workspace_id,
        document_id,
        processing_type,
        input_data
    ) VALUES (
        doc_rec.workspace_id,
        p_document_id,
        p_processing_type,
        jsonb_build_object(
            'document_id', p_document_id,
            'title', doc_rec.title,
            'content', doc_rec.raw_content,
            'document_type', doc_rec.document_type,
            'metadata', doc_rec.metadata
        )
    ) RETURNING id INTO staging_id;
    
    RETURN staging_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- RLS POLICIES FOR N8N INTEGRATION TABLES
-- ==============================================

ALTER TABLE n8n_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_research_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_generation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_orchestration_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_status_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE n8n_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_documents_n8n_staging ENABLE ROW LEVEL SECURITY;

-- Apply workspace-based policies
DO $$
DECLARE
    table_name text;
    tables text[] := ARRAY[
        'n8n_workflows', 'workflow_queue', 'sync_status',
        'lead_research_requests', 'content_generation_requests', 'campaign_orchestration_requests',
        'workflow_status_updates', 'n8n_webhook_events', 'kb_documents_n8n_staging'
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

COMMENT ON SCHEMA public IS 'SAM AI N8N Integration Schema - Data flow between Supabase and N8N workflows';