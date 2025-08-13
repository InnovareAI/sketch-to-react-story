-- Create sync_metadata table for tracking sync statistics
CREATE TABLE IF NOT EXISTS sync_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  sync_type VARCHAR(50) NOT NULL, -- 'preview_sync', 'smart_sync', 'whisper_sync', etc.
  full_conversations INTEGER DEFAULT 0,
  preview_conversations INTEGER DEFAULT 0,
  total_conversations INTEGER DEFAULT 0,
  storage_mb DECIMAL(10, 2) DEFAULT 0,
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Create index for faster lookups
  CONSTRAINT idx_sync_metadata_workspace_type UNIQUE (workspace_id, sync_type, synced_at)
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_sync_metadata_workspace_id ON sync_metadata(workspace_id);
CREATE INDEX IF NOT EXISTS idx_sync_metadata_synced_at ON sync_metadata(synced_at DESC);

-- Enable RLS
ALTER TABLE sync_metadata ENABLE ROW LEVEL SECURITY;

-- Create RLS policy to allow all operations for now (adjust as needed)
CREATE POLICY "Allow all operations on sync_metadata" ON sync_metadata
  FOR ALL USING (true);

-- Grant permissions
GRANT ALL ON sync_metadata TO authenticated;
GRANT ALL ON sync_metadata TO anon;