-- Setup existing LinkedIn connection for the workspace
-- This migrates your existing LinkedIn account to the new centralized system

-- First, let's check if you have a real Unipile account ID stored anywhere
-- If not, we'll use the test account for now

-- Update the main workspace with Thorsten Linz's LinkedIn connection
UPDATE workspaces 
SET 
  unipile_account_id = 'https://www.linkedin.com/in/thorstenlinz/', -- Using LinkedIn URL as account ID
  unipile_api_key = 'TE3VJJ3-N3E63ND-MWXM462-RBPCWYQ', -- Your Unipile API key
  unipile_dsn = 'api6.unipile.com:13443',
  unipile_dedicated_ip = NULL, -- Add if you have a dedicated IP
  integrations = jsonb_build_object(
    'linkedin', jsonb_build_object(
      'connected', true,
      'account_id', 'https://www.linkedin.com/in/thorstenlinz/',
      'connected_at', NOW(),
      'profile', jsonb_build_object(
        'name', 'Thorsten Linz',
        'email', 'thorsten@innovareai.com'
      )
    ),
    'email', jsonb_build_object(
      'connected', false,
      'provider', null,
      'account_id', null
    ),
    'calendar', jsonb_build_object(
      'connected', false,
      'provider', null,
      'account_id', null
    )
  )
WHERE id = 'df5d730f-1915-4269-bd5a-9534478b17af'; -- InnovareAI workspace

-- Create an entry in the integrations table for tracking
INSERT INTO integrations (
  id,
  workspace_id,
  provider,
  type,
  credentials,
  settings,
  status,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'df5d730f-1915-4269-bd5a-9534478b17af',
  'unipile',
  'linkedin',
  jsonb_build_object(
    'account_id', 'https://www.linkedin.com/in/thorstenlinz/',
    'api_key', 'TE3VJJ3-N3E63ND-MWXM462-RBPCWYQ'
  ),
  jsonb_build_object(
    'sync_interval', 30,
    'sync_enabled', true,
    'sync_contacts', true,
    'sync_messages', true
  ),
  'active',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Verify the setup
SELECT 
  name,
  unipile_account_id,
  integrations->'linkedin'->>'connected' as linkedin_connected,
  integrations->'linkedin'->>'account_id' as linkedin_account
FROM workspaces 
WHERE id = 'df5d730f-1915-4269-bd5a-9534478b17af';