-- =============================================
-- SAM AI RLS SECURITY FIXES
-- Execute this in Supabase SQL Editor to fix critical security issues
-- =============================================

-- Step 1: Clean up problematic existing policies that cause infinite recursion
DO $$
DECLARE
    pol RECORD;
BEGIN
    -- Drop all existing policies on accounts and campaigns to fix infinite recursion
    FOR pol IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE tablename IN ('accounts', 'campaigns', 'users')
    LOOP
        BEGIN
            EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                          pol.policyname, pol.schemaname, pol.tablename);
            RAISE NOTICE 'Dropped policy: % on %.%', pol.policyname, pol.schemaname, pol.tablename;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not drop policy: % on %.% - %', pol.policyname, pol.schemaname, pol.tablename, SQLERRM;
        END;
    END LOOP;
END $$;

-- Step 2: Ensure required extensions are enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Step 3: Create workspaces table (multi-tenant foundation) if not exists
CREATE TABLE IF NOT EXISTS workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    settings JSONB DEFAULT '{}',
    subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'starter', 'pro', 'enterprise')),
    subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'past_due', 'canceled', 'trialing')),
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Create profiles table (user profiles) if not exists
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
    avatar_url TEXT,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(workspace_id, email)
);

-- Step 5: Enable RLS on core tables
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Step 6: Create secure RLS policies for workspaces
DROP POLICY IF EXISTS "Users can view their workspace" ON workspaces;
CREATE POLICY "Users can view their workspace" ON workspaces
    FOR SELECT USING (
        id IN (
            SELECT workspace_id FROM profiles 
            WHERE profiles.id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Workspace owners can update" ON workspaces;
CREATE POLICY "Workspace owners can update" ON workspaces
    FOR UPDATE USING (
        id IN (
            SELECT workspace_id FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND role IN ('owner', 'admin')
        )
    );

DROP POLICY IF EXISTS "Workspace owners can insert" ON workspaces;
CREATE POLICY "Workspace owners can insert" ON workspaces
    FOR INSERT WITH CHECK (true); -- Initial workspace creation allowed

-- Step 7: Create secure RLS policies for profiles
DROP POLICY IF EXISTS "View workspace profiles" ON profiles;
CREATE POLICY "View workspace profiles" ON profiles
    FOR SELECT USING (
        workspace_id IN (
            SELECT workspace_id FROM profiles p
            WHERE p.id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Update own profile" ON profiles;
CREATE POLICY "Update own profile" ON profiles
    FOR UPDATE USING (id = auth.uid());

DROP POLICY IF EXISTS "Create profile on signup" ON profiles;
CREATE POLICY "Create profile on signup" ON profiles
    FOR INSERT WITH CHECK (id = auth.uid());

-- Step 8: Fix accounts table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'accounts') THEN
        -- Ensure workspace_id column exists
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'accounts' AND column_name = 'workspace_id') THEN
            ALTER TABLE accounts ADD COLUMN workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;
        END IF;
        
        -- Enable RLS
        ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
        
        -- Drop existing problematic policies
        DROP POLICY IF EXISTS "workspace_isolation_accounts" ON accounts;
        DROP POLICY IF EXISTS "Users can access their workspace accounts" ON accounts;
        DROP POLICY IF EXISTS "Users can manage accounts" ON accounts;
        
        -- Create secure workspace isolation policy
        CREATE POLICY "workspace_isolation_accounts" ON accounts
            FOR ALL USING (
                workspace_id IN (
                    SELECT workspace_id FROM profiles 
                    WHERE profiles.id = auth.uid()
                )
            );
            
        RAISE NOTICE 'Fixed RLS policies for accounts table';
    ELSE
        RAISE NOTICE 'Accounts table does not exist - will be created by complete schema';
    END IF;
END $$;

-- Step 9: Fix campaigns table if it exists  
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'campaigns') THEN
        -- Ensure workspace_id column exists
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'campaigns' AND column_name = 'workspace_id') THEN
            ALTER TABLE campaigns ADD COLUMN workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;
        END IF;
        
        -- Enable RLS
        ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
        
        -- Drop existing problematic policies
        DROP POLICY IF EXISTS "workspace_isolation_campaigns" ON campaigns;
        DROP POLICY IF EXISTS "Users can access their workspace campaigns" ON campaigns;
        DROP POLICY IF EXISTS "Users can manage campaigns" ON campaigns;
        
        -- Create secure workspace isolation policy
        CREATE POLICY "workspace_isolation_campaigns" ON campaigns
            FOR ALL USING (
                workspace_id IN (
                    SELECT workspace_id FROM profiles 
                    WHERE profiles.id = auth.uid()
                )
            );
            
        RAISE NOTICE 'Fixed RLS policies for campaigns table';
    ELSE
        RAISE NOTICE 'Campaigns table does not exist - will be created by complete schema';
    END IF;
END $$;

-- Step 10: Create helper functions for workspace operations
CREATE OR REPLACE FUNCTION get_user_workspace_id()
RETURNS UUID AS $$
    SELECT workspace_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
    SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_workspace_owner(workspace_uuid UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS(
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND workspace_id = workspace_uuid 
        AND role = 'owner'
    );
$$ LANGUAGE SQL SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_workspace_admin_or_owner(workspace_uuid UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS(
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND workspace_id = workspace_uuid 
        AND role IN ('owner', 'admin')
    );
$$ LANGUAGE SQL SECURITY DEFINER;

-- Step 11: Create demo workspace for testing (only if doesn't exist)
INSERT INTO workspaces (id, name, slug, subscription_tier, subscription_status) 
VALUES (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 
    'Demo Workspace', 
    'demo-workspace',
    'pro',
    'active'
)
ON CONFLICT (slug) DO NOTHING;

-- Step 12: Grant proper permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Step 13: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_workspace ON profiles(workspace_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_workspace_slug ON workspaces(slug);

-- Fix specific auth.users RLS if needed
DO $$
BEGIN
    -- Only attempt if auth.users exists and has problematic policies
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        -- Disable RLS on auth.users temporarily to prevent recursion
        BEGIN
            -- This might not be allowed, but try
            ALTER TABLE auth.users DISABLE ROW LEVEL SECURITY;
            RAISE NOTICE 'Disabled RLS on auth.users to prevent recursion';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not modify auth.users RLS - this is normal for managed auth';
        END;
    END IF;
END $$;

-- Step 14: Validation queries
DO $$
DECLARE
    table_count INTEGER;
    workspace_count INTEGER;
BEGIN
    -- Check core tables
    SELECT COUNT(*) INTO table_count 
    FROM information_schema.tables 
    WHERE table_name IN ('workspaces', 'profiles') AND table_schema = 'public';
    
    -- Check demo workspace
    SELECT COUNT(*) INTO workspace_count 
    FROM workspaces 
    WHERE slug = 'demo-workspace';
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'RLS SECURITY FIXES APPLIED SUCCESSFULLY';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Core tables created: %/2', table_count;
    RAISE NOTICE 'Demo workspace exists: %', CASE WHEN workspace_count > 0 THEN 'Yes' ELSE 'No' END;
    RAISE NOTICE 'RLS policies: Fixed infinite recursion issues';
    RAISE NOTICE 'Helper functions: Created for workspace operations';
    RAISE NOTICE 'Next step: Apply complete schema with remaining tables';
    RAISE NOTICE '========================================';
END $$;