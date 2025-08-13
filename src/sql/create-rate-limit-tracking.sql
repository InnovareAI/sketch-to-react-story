-- Create table for tracking LinkedIn rate limit events
CREATE TABLE IF NOT EXISTS linkedin_rate_limit_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id TEXT NOT NULL,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  limit_type TEXT NOT NULL CHECK (limit_type IN ('daily', 'weekly', 'connection_request', 'message', 'search')),
  current_count INTEGER NOT NULL,
  max_limit INTEGER NOT NULL,
  reset_time TIMESTAMPTZ,
  paused_until TIMESTAMPTZ,
  message TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_rate_limit_events_account ON linkedin_rate_limit_events(account_id);
CREATE INDEX idx_rate_limit_events_workspace ON linkedin_rate_limit_events(workspace_id);
CREATE INDEX idx_rate_limit_events_created ON linkedin_rate_limit_events(created_at DESC);
CREATE INDEX idx_rate_limit_events_unresolved ON linkedin_rate_limit_events(resolved_at) WHERE resolved_at IS NULL;

-- Create table for tracking LinkedIn usage metrics
CREATE TABLE IF NOT EXISTS linkedin_usage_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id TEXT NOT NULL,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL,
  messages_sent INTEGER DEFAULT 0,
  connection_requests_sent INTEGER DEFAULT 0,
  searches_performed INTEGER DEFAULT 0,
  messages_received INTEGER DEFAULT 0,
  connections_accepted INTEGER DEFAULT 0,
  profile_views INTEGER DEFAULT 0,
  last_activity_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(account_id, metric_date)
);

-- Create index for usage metrics
CREATE INDEX idx_usage_metrics_account_date ON linkedin_usage_metrics(account_id, metric_date DESC);
CREATE INDEX idx_usage_metrics_workspace ON linkedin_usage_metrics(workspace_id);

-- Function to update usage metrics
CREATE OR REPLACE FUNCTION update_linkedin_usage_metrics(
  p_account_id TEXT,
  p_workspace_id UUID,
  p_metric_type TEXT,
  p_increment INTEGER DEFAULT 1
) RETURNS VOID AS $$
BEGIN
  INSERT INTO linkedin_usage_metrics (
    account_id,
    workspace_id,
    metric_date,
    messages_sent,
    connection_requests_sent,
    searches_performed,
    last_activity_at
  ) VALUES (
    p_account_id,
    p_workspace_id,
    CURRENT_DATE,
    CASE WHEN p_metric_type = 'message' THEN p_increment ELSE 0 END,
    CASE WHEN p_metric_type = 'connection_request' THEN p_increment ELSE 0 END,
    CASE WHEN p_metric_type = 'search' THEN p_increment ELSE 0 END,
    NOW()
  )
  ON CONFLICT (account_id, metric_date) DO UPDATE SET
    messages_sent = linkedin_usage_metrics.messages_sent + 
      CASE WHEN p_metric_type = 'message' THEN p_increment ELSE 0 END,
    connection_requests_sent = linkedin_usage_metrics.connection_requests_sent + 
      CASE WHEN p_metric_type = 'connection_request' THEN p_increment ELSE 0 END,
    searches_performed = linkedin_usage_metrics.searches_performed + 
      CASE WHEN p_metric_type = 'search' THEN p_increment ELSE 0 END,
    last_activity_at = NOW(),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically track message sending
CREATE OR REPLACE FUNCTION track_message_usage() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.platform = 'linkedin' AND NEW.status = 'sent' AND OLD.status != 'sent' THEN
    PERFORM update_linkedin_usage_metrics(
      NEW.account_id,
      NEW.workspace_id,
      'message',
      1
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER track_linkedin_message_usage
  AFTER UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION track_message_usage();

-- RLS policies
ALTER TABLE linkedin_rate_limit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE linkedin_usage_metrics ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own rate limit events
CREATE POLICY "Users can view own rate limit events" ON linkedin_rate_limit_events
  FOR SELECT USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE tenant_id = auth.uid()
    )
  );

-- Allow users to insert rate limit events for their workspace
CREATE POLICY "Users can insert rate limit events" ON linkedin_rate_limit_events
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT id FROM workspaces WHERE tenant_id = auth.uid()
    )
  );

-- Allow users to view their own usage metrics
CREATE POLICY "Users can view own usage metrics" ON linkedin_usage_metrics
  FOR SELECT USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE tenant_id = auth.uid()
    )
  );

-- Allow users to manage their usage metrics
CREATE POLICY "Users can manage usage metrics" ON linkedin_usage_metrics
  FOR ALL USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE tenant_id = auth.uid()
    )
  );