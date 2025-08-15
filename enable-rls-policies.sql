-- Enable RLS and set proper policies for tenant access

-- Enable RLS on key tables
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE inbox_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE inbox_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_metadata ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "workspace_isolation_contacts" ON contacts;
DROP POLICY IF EXISTS "Users can manage own inbox conversations" ON inbox_conversations;
DROP POLICY IF EXISTS "Users can manage inbox messages" ON inbox_messages;
DROP POLICY IF EXISTS "Allow all operations on sync_metadata" ON sync_metadata;

-- Create workspace-based policies for contacts
CREATE POLICY "contacts_workspace_access" ON contacts
FOR ALL
USING (
  workspace_id IN (
    SELECT workspace_id 
    FROM profiles 
    WHERE id = auth.uid()
  )
);

-- Create workspace-based policies for inbox_conversations
CREATE POLICY "inbox_conversations_workspace_access" ON inbox_conversations
FOR ALL
USING (
  workspace_id IN (
    SELECT workspace_id 
    FROM profiles 
    WHERE id = auth.uid()
  )
);

-- Create workspace-based policies for inbox_messages (through conversations)
CREATE POLICY "inbox_messages_workspace_access" ON inbox_messages
FOR ALL
USING (
  conversation_id IN (
    SELECT ic.id 
    FROM inbox_conversations ic
    JOIN profiles p ON p.workspace_id = ic.workspace_id
    WHERE p.id = auth.uid()
  )
);

-- Create workspace-based policies for sync_metadata
CREATE POLICY "sync_metadata_workspace_access" ON sync_metadata
FOR ALL
USING (
  workspace_id IN (
    SELECT workspace_id 
    FROM profiles 
    WHERE id = auth.uid()
  )
);

-- Verify policies are created
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  permissive
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN ('contacts', 'inbox_conversations', 'inbox_messages', 'sync_metadata')
ORDER BY tablename, policyname;