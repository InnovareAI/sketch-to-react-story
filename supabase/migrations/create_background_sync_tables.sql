-- Create sync schedules table for background sync management
CREATE TABLE IF NOT EXISTS public.sync_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL,
  account_id TEXT NOT NULL,
  sync_enabled BOOLEAN DEFAULT true,
  sync_interval_minutes INTEGER DEFAULT 30,
  sync_type TEXT DEFAULT 'both' CHECK (sync_type IN ('contacts', 'messages', 'both')),
  batch_size INTEGER DEFAULT 100, -- Process in smaller batches for large datasets
  max_items_per_sync INTEGER DEFAULT 500, -- Limit items per sync cycle
  last_sync_at TIMESTAMP WITH TIME ZONE,
  next_sync_at TIMESTAMP WITH TIME ZONE,
  last_sync_cursor TEXT, -- Pagination cursor for incremental sync
  total_items_synced INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(workspace_id, account_id)
);

-- Create sync history table
CREATE TABLE IF NOT EXISTS public.sync_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL,
  account_id TEXT NOT NULL,
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  contacts_synced INTEGER DEFAULT 0,
  messages_synced INTEGER DEFAULT 0,
  status TEXT CHECK (status IN ('success', 'partial', 'failed')),
  duration_ms INTEGER,
  errors JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create or replace sync metadata table
CREATE TABLE IF NOT EXISTS public.sync_metadata (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL,
  sync_type TEXT NOT NULL,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(workspace_id, sync_type)
);

-- Create RPC function to set sync schedule
CREATE OR REPLACE FUNCTION set_linkedin_sync_schedule(
  p_workspace_id UUID,
  p_account_id TEXT,
  p_enabled BOOLEAN,
  p_interval_minutes INTEGER,
  p_sync_type TEXT
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO sync_schedules (
    workspace_id,
    account_id,
    sync_enabled,
    sync_interval_minutes,
    sync_type,
    next_sync_at
  ) VALUES (
    p_workspace_id,
    p_account_id,
    p_enabled,
    p_interval_minutes,
    p_sync_type,
    CASE 
      WHEN p_enabled THEN NOW() + (p_interval_minutes || ' minutes')::INTERVAL
      ELSE NULL
    END
  )
  ON CONFLICT (workspace_id, account_id)
  DO UPDATE SET
    sync_enabled = EXCLUDED.sync_enabled,
    sync_interval_minutes = EXCLUDED.sync_interval_minutes,
    sync_type = EXCLUDED.sync_type,
    next_sync_at = CASE 
      WHEN EXCLUDED.sync_enabled THEN NOW() + (EXCLUDED.sync_interval_minutes || ' minutes')::INTERVAL
      ELSE NULL
    END,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Create function to get sync status
CREATE OR REPLACE FUNCTION get_sync_status(p_workspace_id UUID)
RETURNS TABLE (
  is_enabled BOOLEAN,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  next_sync_at TIMESTAMP WITH TIME ZONE,
  interval_minutes INTEGER,
  sync_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.sync_enabled,
    s.last_sync_at,
    s.next_sync_at,
    s.sync_interval_minutes,
    s.sync_type
  FROM sync_schedules s
  WHERE s.workspace_id = p_workspace_id
  ORDER BY s.updated_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Create function to record sync completion
CREATE OR REPLACE FUNCTION record_sync_completion(
  p_workspace_id UUID,
  p_account_id TEXT,
  p_contacts_synced INTEGER,
  p_messages_synced INTEGER,
  p_status TEXT,
  p_duration_ms INTEGER,
  p_errors JSONB
)
RETURNS VOID AS $$
BEGIN
  -- Insert into history
  INSERT INTO sync_history (
    workspace_id,
    account_id,
    contacts_synced,
    messages_synced,
    status,
    duration_ms,
    errors
  ) VALUES (
    p_workspace_id,
    p_account_id,
    p_contacts_synced,
    p_messages_synced,
    p_status,
    p_duration_ms,
    p_errors
  );
  
  -- Update schedule
  UPDATE sync_schedules
  SET 
    last_sync_at = NOW(),
    next_sync_at = NOW() + (sync_interval_minutes || ' minutes')::INTERVAL
  WHERE workspace_id = p_workspace_id 
    AND account_id = p_account_id
    AND sync_enabled = true;
    
  -- Update metadata
  INSERT INTO sync_metadata (
    workspace_id,
    sync_type,
    last_sync_at,
    metadata
  ) VALUES (
    p_workspace_id,
    'background_linkedin',
    NOW(),
    jsonb_build_object(
      'contacts_synced', p_contacts_synced,
      'messages_synced', p_messages_synced,
      'status', p_status
    )
  )
  ON CONFLICT (workspace_id, sync_type)
  DO UPDATE SET
    last_sync_at = NOW(),
    metadata = EXCLUDED.metadata,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sync_schedules_workspace ON sync_schedules(workspace_id);
CREATE INDEX IF NOT EXISTS idx_sync_schedules_next_sync ON sync_schedules(next_sync_at) WHERE sync_enabled = true;
CREATE INDEX IF NOT EXISTS idx_sync_history_workspace ON sync_history(workspace_id);
CREATE INDEX IF NOT EXISTS idx_sync_metadata_workspace ON sync_metadata(workspace_id);

-- Enable RLS
ALTER TABLE sync_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_metadata ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their workspace sync schedules" ON sync_schedules
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their workspace sync schedules" ON sync_schedules
  FOR ALL USING (true);

CREATE POLICY "Users can view their sync history" ON sync_history
  FOR SELECT USING (true);

CREATE POLICY "Users can view their sync metadata" ON sync_metadata
  FOR SELECT USING (true);