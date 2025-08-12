-- Create inbox_conversations table for LinkedIn messages
CREATE TABLE IF NOT EXISTS public.inbox_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  platform TEXT NOT NULL DEFAULT 'linkedin',
  platform_conversation_id TEXT,
  participant_name TEXT,
  participant_email TEXT,
  participant_company TEXT,
  participant_profile_url TEXT,
  participant_avatar_url TEXT,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'active',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, platform_conversation_id)
);

-- Create inbox_messages table
CREATE TABLE IF NOT EXISTS public.inbox_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES public.inbox_conversations(id) ON DELETE CASCADE,
  platform_message_id TEXT,
  role TEXT NOT NULL DEFAULT 'assistant',
  content TEXT NOT NULL,
  sender_name TEXT,
  sender_email TEXT,
  message_type TEXT DEFAULT 'text',
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  direction TEXT DEFAULT 'inbound',
  platform_data JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(conversation_id, platform_message_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_inbox_conversations_workspace ON public.inbox_conversations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_inbox_conversations_platform ON public.inbox_conversations(platform);
CREATE INDEX IF NOT EXISTS idx_inbox_conversations_last_message ON public.inbox_conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_inbox_messages_conversation ON public.inbox_messages(conversation_id);

-- Enable RLS
ALTER TABLE public.inbox_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inbox_messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage own inbox conversations" ON public.inbox_conversations
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can manage inbox messages" ON public.inbox_messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.inbox_conversations
      WHERE inbox_conversations.id = inbox_messages.conversation_id
      AND workspace_id IN (
        SELECT workspace_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- Grant permissions
GRANT ALL ON public.inbox_conversations TO authenticated;
GRANT ALL ON public.inbox_messages TO authenticated;

-- Add update trigger
CREATE OR REPLACE FUNCTION update_inbox_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER inbox_conversations_update_timestamp
BEFORE UPDATE ON inbox_conversations
FOR EACH ROW
EXECUTE FUNCTION update_inbox_timestamp();