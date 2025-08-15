-- Temporarily disable RLS for demo purposes while keeping policies intact
-- This allows the app to work without authentication while maintaining security structure

-- Disable RLS on key tables for demo
ALTER TABLE contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE inbox_conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE inbox_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns DISABLE ROW LEVEL SECURITY;
ALTER TABLE sync_metadata DISABLE ROW LEVEL SECURITY;

-- Note: Policies remain in place, just not enforced
-- This allows the demo to work while keeping the security framework ready

-- Verify RLS status
SELECT 
  tablename,
  rowsecurity as rls_enabled,
  (SELECT COUNT(*) FROM pg_policies WHERE pg_policies.tablename = pg_tables.tablename) as policy_count
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN ('contacts', 'inbox_conversations', 'inbox_messages', 'campaigns', 'sync_metadata')
ORDER BY tablename;