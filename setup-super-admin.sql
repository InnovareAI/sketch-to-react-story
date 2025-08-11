-- =============================================
-- SUPER ADMIN SETUP for InnovareAI
-- Execute this in Supabase SQL Editor
-- https://supabase.com/dashboard/project/latxadqrvrrrcvkktrog/sql/new
-- =============================================

-- Step 1: Ensure profiles table has role column
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'member' CHECK (role IN ('super_admin', 'admin', 'member'));

-- Step 2: Create InnovareAI workspace if it doesn't exist
INSERT INTO workspaces (id, name, slug, subscription_tier, subscription_status)
VALUES (
    'a0000000-0000-0000-0000-000000000000',
    'InnovareAI',
    'innovareai',
    'enterprise',
    'active'
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    subscription_tier = EXCLUDED.subscription_tier,
    subscription_status = EXCLUDED.subscription_status;

-- Step 3: Instructions for creating super admin user
-- NOTE: You need to create the user through Supabase Auth first!
-- 
-- 1. Go to: https://supabase.com/dashboard/project/latxadqrvrrrcvkktrog/auth/users
-- 2. Click "Invite user"
-- 3. Enter email: admin@innovareai.com
-- 4. Send invitation
-- 5. Complete signup with a secure password
-- 6. Then run the following SQL to make them super admin:

/*
-- Step 4: Update the user's profile to super admin (run after user signup)
-- Replace 'USER_ID_HERE' with the actual user ID from auth.users table

UPDATE profiles 
SET 
    role = 'super_admin',
    workspace_id = 'a0000000-0000-0000-0000-000000000000',
    full_name = 'InnovareAI Administrator'
WHERE id = 'USER_ID_HERE';

-- To find the user ID, use:
SELECT id, email FROM auth.users WHERE email = 'admin@innovareai.com';
*/

-- Step 5: Row Level Security Policies for super admin access
-- Allow super admins to see all workspaces
CREATE POLICY IF NOT EXISTS "Super admins can see all workspaces"
ON workspaces FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'super_admin'
    )
);

-- Allow super admins to see all profiles
CREATE POLICY IF NOT EXISTS "Super admins can see all profiles"
ON profiles FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid()
        AND p.role = 'super_admin'
    )
    OR profiles.id = auth.uid()
);

-- Enable RLS on tables if not already enabled
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Verification queries
SELECT 
    'Workspaces' as table_name,
    COUNT(*) as count
FROM workspaces
UNION ALL
SELECT 
    'Profiles' as table_name,
    COUNT(*) as count
FROM profiles
UNION ALL
SELECT 
    'Super Admins' as table_name,
    COUNT(*) as count
FROM profiles WHERE role = 'super_admin';

-- Display instructions
SELECT '🔐 Super Admin Setup Instructions:' as message
UNION ALL
SELECT '1. Create user at: https://supabase.com/dashboard/project/latxadqrvrrrcvkktrog/auth/users'
UNION ALL
SELECT '2. Email: admin@innovareai.com'
UNION ALL
SELECT '3. After signup, update their profile role to super_admin'
UNION ALL  
SELECT '4. Access at: https://sameaisalesassistant.netlify.app/admin/login'
UNION ALL
SELECT '5. Only works from innovareai.com domain in production!';