-- Drop existing RLS policies
DROP POLICY IF EXISTS "Users can manage own inbox conversations" ON public.inbox_conversations;
DROP POLICY IF EXISTS "Users can manage inbox messages" ON public.inbox_messages;

-- Disable RLS completely for now (for testing)
ALTER TABLE public.inbox_conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.inbox_messages DISABLE ROW LEVEL SECURITY;

-- Alternative: Create permissive policies that allow all operations
-- ALTER TABLE public.inbox_conversations ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.inbox_messages ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "Allow all operations on inbox_conversations" ON public.inbox_conversations
--   FOR ALL USING (true) WITH CHECK (true);

-- CREATE POLICY "Allow all operations on inbox_messages" ON public.inbox_messages
--   FOR ALL USING (true) WITH CHECK (true);

-- Grant full permissions to authenticated and anon users
GRANT ALL ON public.inbox_conversations TO anon;
GRANT ALL ON public.inbox_messages TO anon;
GRANT ALL ON public.inbox_conversations TO authenticated;
GRANT ALL ON public.inbox_messages TO authenticated;