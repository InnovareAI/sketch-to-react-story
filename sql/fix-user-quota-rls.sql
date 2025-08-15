-- Fix RLS policies for user_quota_usage table
-- This resolves the "new row violates row-level security policy" error

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own quota usage" ON user_quota_usage;
DROP POLICY IF EXISTS "Users can update their own quota usage" ON user_quota_usage;
DROP POLICY IF EXISTS "Users can insert their own quota usage" ON user_quota_usage;

-- Create comprehensive RLS policies for user_quota_usage

-- 1. Users can view their own quota usage
CREATE POLICY "Users can view their own quota usage" 
ON user_quota_usage
FOR SELECT 
USING (auth.uid() = user_id);

-- 2. Users can insert their own quota usage (CRITICAL - this was missing!)
CREATE POLICY "Users can insert their own quota usage" 
ON user_quota_usage
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 3. Users can update their own quota usage
CREATE POLICY "Users can update their own quota usage" 
ON user_quota_usage
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. Service role can manage all quota usage (for backend operations)
CREATE POLICY "Service role can manage all quota usage" 
ON user_quota_usage
FOR ALL 
USING (auth.jwt()->>'role' = 'service_role');

-- Also ensure workspace_id can be NULL for user-based quotas
ALTER TABLE user_quota_usage 
ALTER COLUMN workspace_id DROP NOT NULL;

-- Add a comment to clarify the table's purpose
COMMENT ON TABLE user_quota_usage IS 'Tracks monthly contact extraction quota (3000 per user per month) across all workspaces';
COMMENT ON COLUMN user_quota_usage.workspace_id IS 'Optional - can be NULL for organization-wide user quotas';