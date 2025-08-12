-- Add cl@innovareai.com as workspace admin

-- First, add to team_members table
INSERT INTO public.team_members (
  id,
  workspace_id,
  email,
  full_name,
  role,
  department,
  status,
  permissions
) VALUES (
  'a1b2c3d4-3333-3333-3333-333333333333',
  'df5d730f-1915-4269-bd5a-9534478b17af',
  'cl@innovareai.com',
  'CL InnovareAI',
  'Workspace Admin',
  'Management',
  'active',
  jsonb_build_object(
    'can_send_messages', true,
    'can_manage_campaigns', true,
    'can_view_analytics', true,
    'can_manage_team', true,
    'can_manage_workspace', true,
    'is_admin', true
  )
) ON CONFLICT (workspace_id, email) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  permissions = EXCLUDED.permissions,
  updated_at = NOW();

-- Add to profiles table for authentication
INSERT INTO public.profiles (
  id,
  email,
  full_name,
  role,
  workspace_id,
  avatar_url
) VALUES (
  'a1b2c3d4-3333-3333-3333-333333333333',
  'cl@innovareai.com',
  'CL InnovareAI',
  'admin',
  'df5d730f-1915-4269-bd5a-9534478b17af',
  null
) ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  updated_at = NOW();

-- Verify the user was added
SELECT 
  'Added CL as Admin:' as status,
  email,
  full_name,
  role
FROM team_members 
WHERE email = 'cl@innovareai.com';

SELECT 
  'Profile Created:' as status,
  email,
  full_name,
  role
FROM profiles 
WHERE email = 'cl@innovareai.com';