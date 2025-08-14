-- LinkedIn Sync Schema Enhancement
-- Add necessary columns for LinkedIn contact and message sync

-- Add missing columns to contacts table for LinkedIn sync
ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS connection_degree TEXT,
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS company TEXT,
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP WITH TIME ZONE;

-- Create indexes for the new columns to improve query performance
CREATE INDEX IF NOT EXISTS idx_contacts_connection_degree ON contacts(connection_degree);
CREATE INDEX IF NOT EXISTS idx_contacts_company ON contacts(company);
CREATE INDEX IF NOT EXISTS idx_contacts_source ON contacts(source);
CREATE INDEX IF NOT EXISTS idx_contacts_last_synced ON contacts(last_synced_at);

-- Update existing records to have better full names where missing
UPDATE contacts 
SET full_name = TRIM(CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, '')))
WHERE full_name IS NULL 
  AND (first_name IS NOT NULL OR last_name IS NOT NULL)
  AND TRIM(CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, ''))) != '';

-- Ensure inbox_conversations table exists for message sync
CREATE TABLE IF NOT EXISTS inbox_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    platform TEXT NOT NULL DEFAULT 'linkedin',
    platform_conversation_id TEXT NOT NULL,
    participant_name TEXT,
    participant_company TEXT,
    participant_avatar_url TEXT,
    participant_title TEXT,
    status TEXT DEFAULT 'active',
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique conversations per workspace
    UNIQUE(workspace_id, platform_conversation_id)
);

-- Ensure inbox_messages table exists for message sync
CREATE TABLE IF NOT EXISTS inbox_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES inbox_conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Prevent duplicate messages
    UNIQUE(conversation_id, created_at)
);

-- Create indexes for inbox tables
CREATE INDEX IF NOT EXISTS idx_inbox_conversations_workspace ON inbox_conversations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_inbox_conversations_platform ON inbox_conversations(platform, platform_conversation_id);
CREATE INDEX IF NOT EXISTS idx_inbox_conversations_last_message ON inbox_conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_inbox_messages_conversation ON inbox_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_inbox_messages_created_at ON inbox_messages(created_at DESC);

-- Add RLS policies for inbox tables
ALTER TABLE inbox_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE inbox_messages ENABLE ROW LEVEL SECURITY;

-- RLS policy for conversations - users can only see their workspace conversations
CREATE POLICY IF NOT EXISTS "workspace_isolation_conversations"
ON inbox_conversations
USING (workspace_id IN (
    SELECT profiles.workspace_id 
    FROM profiles 
    WHERE profiles.id = auth.uid()
));

-- RLS policy for messages - users can only see messages from their workspace conversations
CREATE POLICY IF NOT EXISTS "workspace_isolation_messages"
ON inbox_messages
USING (conversation_id IN (
    SELECT ic.id 
    FROM inbox_conversations ic
    JOIN profiles p ON p.workspace_id = ic.workspace_id
    WHERE p.id = auth.uid()
));

-- Update triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add update trigger to inbox_conversations
DROP TRIGGER IF EXISTS update_inbox_conversations_updated_at ON inbox_conversations;
CREATE TRIGGER update_inbox_conversations_updated_at
    BEFORE UPDATE ON inbox_conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE inbox_conversations IS 'LinkedIn conversations synced from Unipile API';
COMMENT ON TABLE inbox_messages IS 'Individual messages within LinkedIn conversations';
COMMENT ON COLUMN contacts.connection_degree IS 'LinkedIn connection degree (1st, 2nd, 3rd)';
COMMENT ON COLUMN contacts.source IS 'How the contact was added (manual, linkedin, import, etc.)';
COMMENT ON COLUMN contacts.last_synced_at IS 'When this contact was last synced from external source';