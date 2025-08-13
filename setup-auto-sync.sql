-- Setup Auto-Sync for LinkedIn Contacts and Messages
-- This runs in the background even when you're not on the page

-- Create sync schedules table if not exists
CREATE TABLE IF NOT EXISTS sync_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL,
  sync_enabled BOOLEAN DEFAULT true,
  sync_interval_minutes INTEGER DEFAULT 30,
  sync_type TEXT DEFAULT 'both' CHECK (sync_type IN ('contacts', 'messages', 'both')),
  last_sync_at TIMESTAMP WITH TIME ZONE,
  next_sync_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(workspace_id, account_id)
);

-- Create sync history table
CREATE TABLE IF NOT EXISTS sync_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL,
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  contacts_synced INTEGER DEFAULT 0,
  messages_synced INTEGER DEFAULT 0,
  status TEXT CHECK (status IN ('success', 'partial', 'failed')),
  duration_ms INTEGER,
  errors TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create a function to trigger sync via Edge Function
CREATE OR REPLACE FUNCTION trigger_linkedin_sync()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  sync_record RECORD;
BEGIN
  -- Find all enabled sync schedules that need to run
  FOR sync_record IN 
    SELECT * FROM sync_schedules 
    WHERE sync_enabled = true 
    AND (next_sync_at IS NULL OR next_sync_at <= NOW())
  LOOP
    -- Call the Edge Function (this happens asynchronously)
    PERFORM net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/linkedin-background-sync',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.supabase_anon_key')
      ),
      body := jsonb_build_object(
        'workspace_id', sync_record.workspace_id,
        'account_id', sync_record.account_id,
        'sync_type', sync_record.sync_type,
        'limit', 500
      )
    );
    
    -- Update next sync time
    UPDATE sync_schedules 
    SET 
      last_sync_at = NOW(),
      next_sync_at = NOW() + (sync_interval_minutes || ' minutes')::INTERVAL,
      updated_at = NOW()
    WHERE id = sync_record.id;
  END LOOP;
END;
$$;

-- Create a simpler function that can be called manually or via RPC
CREATE OR REPLACE FUNCTION enable_auto_sync(
  p_workspace_id UUID,
  p_account_id TEXT,
  p_interval_minutes INTEGER DEFAULT 30
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  result JSONB;
BEGIN
  -- Insert or update sync schedule
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
    true,
    p_interval_minutes,
    'both',
    NOW()
  )
  ON CONFLICT (workspace_id, account_id) 
  DO UPDATE SET 
    sync_enabled = true,
    sync_interval_minutes = p_interval_minutes,
    next_sync_at = NOW(),
    updated_at = NOW();
  
  -- Trigger immediate sync
  PERFORM net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/linkedin-background-sync',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.supabase_anon_key')
    ),
    body := jsonb_build_object(
      'workspace_id', p_workspace_id,
      'account_id', p_account_id,
      'sync_type', 'both',
      'limit', 500
    )
  );
  
  result := jsonb_build_object(
    'success', true,
    'message', 'Auto-sync enabled successfully',
    'interval_minutes', p_interval_minutes,
    'next_sync', NOW() + (p_interval_minutes || ' minutes')::INTERVAL
  );
  
  RETURN result;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION enable_auto_sync TO authenticated;
GRANT EXECUTE ON FUNCTION trigger_linkedin_sync TO service_role;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sync_schedules_next_sync ON sync_schedules(next_sync_at) WHERE sync_enabled = true;
CREATE INDEX IF NOT EXISTS idx_sync_history_workspace ON sync_history(workspace_id, synced_at DESC);

-- Add helpful comment
COMMENT ON FUNCTION enable_auto_sync IS 'Enable automatic LinkedIn sync for a workspace. Syncs run every interval_minutes even when user is offline.';