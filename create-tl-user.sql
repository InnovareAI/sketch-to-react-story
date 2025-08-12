-- Create user account for tl@innovareai.com
-- Run this in your Supabase SQL Editor at:
-- https://supabase.com/dashboard/project/latxadqrvrrrcvkktrog/sql/new

-- Step 1: Create the default workspace if it doesn't exist
INSERT INTO workspaces (
  id,
  name,
  slug,
  subscription_tier,
  settings,
  created_at,
  updated_at
) VALUES (
  'df5d730f-1915-4269-bd5a-9534478b17af',
  'InnovareAI',
  'innovareai',
  'pro',
  jsonb_build_object(
    'website', 'https://innovareai.com',
    'industry', 'Technology',
    'companySize', '10-50',
    'description', 'AI-powered sales automation platform',
    'phone', '',
    'email', 'tl@innovareai.com',
    'address', '',
    'timezone', 'UTC-5'
  ),
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  updated_at = NOW();

-- Step 2: Create a function to create users (since we can't directly insert into auth.users)
CREATE OR REPLACE FUNCTION create_user_account(
  user_email text,
  user_password text,
  user_full_name text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_user_id uuid;
  result json;
BEGIN
  -- Create the auth user
  -- Note: This requires using Supabase Admin API or Dashboard
  -- We'll create the profile assuming the user will be created via dashboard
  
  -- For now, let's prepare the profile data
  -- You'll need to create the auth user via Supabase Dashboard > Authentication > Users > Invite User
  
  -- Generate a UUID for the user (you'll use this when creating via dashboard)
  new_user_id := gen_random_uuid();
  
  -- Return instructions
  result := json_build_object(
    'user_id', new_user_id,
    'instructions', 'Please create the user via Supabase Dashboard:',
    'step1', 'Go to Authentication > Users',
    'step2', 'Click "Invite User"',
    'step3', 'Enter email: ' || user_email,
    'step4', 'After user is created, run the profile creation SQL below',
    'profile_sql', format(
      'INSERT INTO profiles (id, email, full_name, role, workspace_id, created_at, updated_at) VALUES (''%s'', ''%s'', ''%s'', ''owner'', ''df5d730f-1915-4269-bd5a-9534478b17af'', NOW(), NOW());',
      new_user_id,
      user_email,
      user_full_name
    )
  );
  
  RETURN result;
END;
$$;

-- Step 3: Call the function to get instructions
SELECT create_user_account(
  'tl@innovareai.com',
  'tl@innovareai.com',
  'TL InnovareAI'
);

-- Step 4: After creating the user in the dashboard, get their UUID and run this:
-- IMPORTANT: Replace 'USER_UUID_HERE' with the actual UUID from the created user

/*
-- Uncomment and run this after creating the user via dashboard:

INSERT INTO profiles (
  id,
  email,
  full_name,
  role,
  workspace_id,
  created_at,
  updated_at
) VALUES (
  'USER_UUID_HERE', -- Replace with actual user UUID from auth.users
  'tl@innovareai.com',
  'TL InnovareAI',
  'owner',
  'df5d730f-1915-4269-bd5a-9534478b17af',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  workspace_id = EXCLUDED.workspace_id,
  updated_at = NOW();
*/

-- Alternative: Direct approach using Supabase Dashboard
-- 1. Go to: https://supabase.com/dashboard/project/latxadqrvrrrcvkktrog/auth/users
-- 2. Click "Invite User"
-- 3. Enter email: tl@innovareai.com
-- 4. The user will receive an invite email to set their password
-- 5. Or use "Create User" if available to set password directly

-- Check if profiles table exists and has the right structure
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM 
  information_schema.columns
WHERE 
  table_name = 'profiles'
ORDER BY 
  ordinal_position;