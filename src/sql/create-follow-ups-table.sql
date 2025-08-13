-- Create follow_ups table for storing follow-up messages
CREATE TABLE IF NOT EXISTS follow_ups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  conversation_id UUID NOT NULL,
  content TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'sent', 'failed', 'cancelled')),
  tags TEXT[] DEFAULT '{}',
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  reminder_enabled BOOLEAN DEFAULT true,
  notes TEXT,
  contact_info JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_follow_ups_workspace ON follow_ups(workspace_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_conversation ON follow_ups(conversation_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_status ON follow_ups(status);
CREATE INDEX IF NOT EXISTS idx_follow_ups_scheduled ON follow_ups(scheduled_at);

-- Add RLS policies
ALTER TABLE follow_ups ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users on their workspace data
CREATE POLICY "Users can manage their workspace follow-ups" ON follow_ups
  FOR ALL
  USING (workspace_id IN (
    SELECT id FROM workspaces WHERE id = workspace_id
  ))
  WITH CHECK (workspace_id IN (
    SELECT id FROM workspaces WHERE id = workspace_id
  ));

-- Create function to update updated_at
CREATE OR REPLACE FUNCTION update_follow_ups_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_follow_ups_updated_at
  BEFORE UPDATE ON follow_ups
  FOR EACH ROW
  EXECUTE FUNCTION update_follow_ups_updated_at();