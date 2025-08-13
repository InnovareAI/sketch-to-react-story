-- Add CL as admin with ability to see and manage all accounts
-- This ensures CL can see your account and all other team members

-- First, get the workspace ID
WITH workspace_info AS (
  SELECT id as workspace_id
  FROM workspaces
  WHERE name ILIKE '%innovare%' 
     OR slug ILIKE '%innovare%'
     OR id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid
  LIMIT 1
)
-- Add CL as admin/owner
INSERT INTO profiles (
  id,
  workspace_id,
  email,
  full_name,
  role,
  settings,
  created_at,
  updated_at
) 
SELECT
  'c1000000-0000-0000-0000-000000000001'::uuid, -- Fixed UUID for CL
  workspace_id,
  'cl@innovareai.com',
  'CL - InnovareAI',
  'owner', -- Owner role to see everything
  jsonb_build_object(
    'department', 'Leadership',
    'linkedin_url', 'https://linkedin.com/in/cl-innovareai',
    'is_managed', false,
    'can_manage_all', true,
    'permissions', jsonb_build_array('manage_team', 'view_all_accounts', 'manage_campaigns', 'admin_access')
  ),
  NOW(),
  NOW()
FROM workspace_info
ON CONFLICT (workspace_id, email) 
DO UPDATE SET 
  role = 'owner',
  settings = profiles.settings || jsonb_build_object(
    'can_manage_all', true,
    'permissions', jsonb_build_array('manage_team', 'view_all_accounts', 'manage_campaigns', 'admin_access')
  ),
  updated_at = NOW();

-- Add TL as admin
WITH workspace_info AS (
  SELECT id as workspace_id
  FROM workspaces
  WHERE name ILIKE '%innovare%' 
     OR slug ILIKE '%innovare%'
     OR id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid
  LIMIT 1
)
INSERT INTO profiles (
  id,
  workspace_id,
  email,
  full_name,
  role,
  settings,
  created_at,
  updated_at
) 
SELECT
  'c1000000-0000-0000-0000-000000000002'::uuid, -- Fixed UUID for TL
  workspace_id,
  'tl@innovareai.com',
  'TL - InnovareAI',
  'admin',
  jsonb_build_object(
    'department', 'Technology',
    'linkedin_url', 'https://linkedin.com/in/tl-innovareai',
    'is_managed', false,
    'can_manage_all', true
  ),
  NOW(),
  NOW()
FROM workspace_info
ON CONFLICT (workspace_id, email) 
DO UPDATE SET 
  role = 'admin',
  settings = profiles.settings || jsonb_build_object('can_manage_all', true),
  updated_at = NOW();

-- Add CS as member
WITH workspace_info AS (
  SELECT id as workspace_id
  FROM workspaces
  WHERE name ILIKE '%innovare%' 
     OR slug ILIKE '%innovare%'
     OR id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid
  LIMIT 1
)
INSERT INTO profiles (
  id,
  workspace_id,
  email,
  full_name,
  role,
  settings,
  created_at,
  updated_at
) 
SELECT
  'c1000000-0000-0000-0000-000000000003'::uuid, -- Fixed UUID for CS
  workspace_id,
  'cs@innovareai.com',
  'CS - InnovareAI',
  'member',
  jsonb_build_object(
    'department', 'Customer Success',
    'linkedin_url', 'https://linkedin.com/in/cs-innovareai',
    'is_managed', true,
    'managed_by', 'c1000000-0000-0000-0000-000000000001'
  ),
  NOW(),
  NOW()
FROM workspace_info
ON CONFLICT (workspace_id, email) 
DO UPDATE SET 
  role = 'member',
  settings = profiles.settings || jsonb_build_object(
    'is_managed', true,
    'managed_by', 'c1000000-0000-0000-0000-000000000001'
  ),
  updated_at = NOW();

-- Verify all team members are in the same workspace
SELECT 
  p.email,
  p.full_name,
  p.role,
  p.settings->>'department' as department,
  p.settings->>'can_manage_all' as can_manage_all,
  w.name as workspace_name,
  w.id as workspace_id
FROM profiles p
JOIN workspaces w ON w.id = p.workspace_id
WHERE p.email IN ('cl@innovareai.com', 'tl@innovareai.com', 'cs@innovareai.com')
ORDER BY 
  CASE p.role 
    WHEN 'owner' THEN 1
    WHEN 'admin' THEN 2
    WHEN 'member' THEN 3
    ELSE 4
  END,
  p.email;
