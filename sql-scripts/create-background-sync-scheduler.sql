-- Create table to track sync schedules
CREATE TABLE IF NOT EXISTS sync_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL,
  account_id TEXT NOT NULL,
  sync_enabled BOOLEAN DEFAULT true,
  sync_interval_minutes INTEGER DEFAULT 30,
  last_sync_at TIMESTAMPTZ,
  next_sync_at TIMESTAMPTZ,
  sync_type TEXT DEFAULT 'both', -- 'contacts', 'messages', or 'both'
  max_items_per_sync INTEGER DEFAULT 500,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, account_id)
);

-- Create or update sync_metadata table if needed
CREATE TABLE IF NOT EXISTS sync_metadata (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL,
  sync_type TEXT NOT NULL,
  last_sync_at TIMESTAMPTZ,
  contacts_synced INTEGER DEFAULT 0,
  messages_synced INTEGER DEFAULT 0,
  first_degree_contacts INTEGER DEFAULT 0,
  errors TEXT[],
  duration_ms INTEGER,
  status TEXT, -- 'success', 'partial', 'failed'
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, sync_type)
);

-- Function to trigger background sync
CREATE OR REPLACE FUNCTION trigger_linkedin_background_sync()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  schedule_record RECORD;
  sync_result JSONB;
BEGIN
  -- Get all enabled sync schedules that are due
  FOR schedule_record IN 
    SELECT * FROM sync_schedules 
    WHERE sync_enabled = true 
    AND (next_sync_at IS NULL OR next_sync_at <= NOW())
  LOOP
    BEGIN
      -- Call the edge function
      SELECT 
        net.http_post(
          url := current_setting('app.supabase_url') || '/functions/v1/linkedin-background-sync',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || current_setting('app.supabase_anon_key')
          ),
          body := jsonb_build_object(
            'workspace_id', schedule_record.workspace_id,
            'account_id', schedule_record.account_id,
            'sync_type', schedule_record.sync_type,
            'limit', schedule_record.max_items_per_sync
          )
        ) INTO sync_result;
      
      -- Update the schedule with next sync time
      UPDATE sync_schedules 
      SET 
        last_sync_at = NOW(),
        next_sync_at = NOW() + (schedule_record.sync_interval_minutes || ' minutes')::INTERVAL,
        updated_at = NOW()
      WHERE id = schedule_record.id;
      
      RAISE NOTICE 'Background sync triggered for workspace %', schedule_record.workspace_id;
      
    EXCEPTION WHEN OTHERS THEN
      -- Log error but continue with other schedules
      RAISE WARNING 'Error triggering sync for workspace %: %', schedule_record.workspace_id, SQLERRM;
      
      -- Still update next sync time to prevent infinite retries
      UPDATE sync_schedules 
      SET 
        next_sync_at = NOW() + (schedule_record.sync_interval_minutes || ' minutes')::INTERVAL,
        updated_at = NOW()
      WHERE id = schedule_record.id;
    END;
  END LOOP;
END;
$$;

-- Create a cron job using pg_cron (requires pg_cron extension)
-- This will run every 5 minutes to check for due syncs
-- Note: pg_cron must be enabled in Supabase dashboard
DO $$
BEGIN
  -- Check if pg_cron is available
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Remove existing job if it exists
    PERFORM cron.unschedule('linkedin-background-sync-scheduler');
    
    -- Schedule the job to run every 5 minutes
    PERFORM cron.schedule(
      'linkedin-background-sync-scheduler',
      '*/5 * * * *', -- Every 5 minutes
      'SELECT trigger_linkedin_background_sync();'
    );
    
    RAISE NOTICE 'Background sync cron job scheduled';
  ELSE
    RAISE NOTICE 'pg_cron extension not available. Manual triggering will be required.';
  END IF;
END $$;

-- Alternative: Create a trigger-based approach using NOTIFY/LISTEN
-- This can be used if pg_cron is not available

-- Function to check and trigger due syncs (can be called manually or via external scheduler)
CREATE OR REPLACE FUNCTION check_and_trigger_syncs()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  syncs_triggered INTEGER := 0;
BEGIN
  -- Trigger the sync function
  PERFORM trigger_linkedin_background_sync();
  
  -- Count how many syncs were due
  SELECT COUNT(*) INTO syncs_triggered
  FROM sync_schedules 
  WHERE sync_enabled = true 
  AND (next_sync_at IS NULL OR next_sync_at <= NOW());
  
  RETURN syncs_triggered;
END;
$$;

-- Create a helper function to enable/disable sync for a workspace
CREATE OR REPLACE FUNCTION set_linkedin_sync_schedule(
  p_workspace_id UUID,
  p_account_id TEXT,
  p_enabled BOOLEAN DEFAULT true,
  p_interval_minutes INTEGER DEFAULT 30,
  p_sync_type TEXT DEFAULT 'both'
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
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
    CASE WHEN p_enabled THEN NOW() ELSE NULL END
  )
  ON CONFLICT (workspace_id, account_id) 
  DO UPDATE SET
    sync_enabled = EXCLUDED.sync_enabled,
    sync_interval_minutes = EXCLUDED.sync_interval_minutes,
    sync_type = EXCLUDED.sync_type,
    next_sync_at = CASE 
      WHEN EXCLUDED.sync_enabled THEN COALESCE(sync_schedules.next_sync_at, NOW())
      ELSE NULL 
    END,
    updated_at = NOW();
END;
$$;

-- Grant necessary permissions
GRANT ALL ON sync_schedules TO authenticated;
GRANT ALL ON sync_metadata TO authenticated;
GRANT EXECUTE ON FUNCTION trigger_linkedin_background_sync() TO authenticated;
GRANT EXECUTE ON FUNCTION check_and_trigger_syncs() TO authenticated;
GRANT EXECUTE ON FUNCTION set_linkedin_sync_schedule TO authenticated;

-- Add RLS policies
ALTER TABLE sync_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_metadata ENABLE ROW LEVEL SECURITY;

-- Policy for sync_schedules
CREATE POLICY "Users can manage their workspace sync schedules" ON sync_schedules
  FOR ALL
  USING (workspace_id IN (
    SELECT workspace_id FROM profiles WHERE id = auth.uid()
  ));

-- Policy for sync_metadata
CREATE POLICY "Users can view their workspace sync metadata" ON sync_metadata
  FOR SELECT
  USING (workspace_id IN (
    SELECT workspace_id FROM profiles WHERE id = auth.uid()
  ));

-- Insert a comment explaining how to use this
COMMENT ON FUNCTION set_linkedin_sync_schedule IS 'Enable or configure background LinkedIn sync for a workspace. 
Usage: SELECT set_linkedin_sync_schedule(''workspace-uuid'', ''account-id'', true, 30, ''both'');
Parameters:
- workspace_id: The workspace UUID
- account_id: The LinkedIn account ID from Unipile
- enabled: Whether sync is enabled (default true)
- interval_minutes: How often to sync in minutes (default 30)
- sync_type: What to sync - ''contacts'', ''messages'', or ''both'' (default ''both'')';

COMMENT ON FUNCTION check_and_trigger_syncs IS 'Manually trigger all due background syncs. Returns the number of syncs that were triggered.
This can be called from an external scheduler if pg_cron is not available.
Usage: SELECT check_and_trigger_syncs();';