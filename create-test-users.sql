-- Create Test User Accounts for InnovareAI
-- Execute this in Supabase SQL Editor

-- First ensure the default workspace exists
INSERT INTO workspaces (id, name, slug, subscription_tier) 
VALUES ('df5d730f-1915-4269-bd5a-9534478b17af', 'InnovareAI', 'innovareai', 'pro')
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name,
    subscription_tier = EXCLUDED.subscription_tier;

-- Create test users through auth.users table
-- Note: In production, users should be created through the sign-up flow
-- These passwords match the email prefixes for easy login

-- User 1: tl@innovareai.com (password: tl@innovareai.com)
INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    aud,
    role
) VALUES (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'tl@innovareai.com',
    crypt('tl@innovareai.com', gen_salt('bf')),
    now(),
    now(),
    now(),
    'authenticated',
    'authenticated'
) ON CONFLICT (email) DO NOTHING;

-- User 2: cl@innovareai.com (password: cl@innovareai.com)
INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    aud,
    role
) VALUES (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'cl@innovareai.com',
    crypt('cl@innovareai.com', gen_salt('bf')),
    now(),
    now(),
    now(),
    'authenticated',
    'authenticated'
) ON CONFLICT (email) DO NOTHING;

-- User 3: cs@innovareai.com (password: cs@innovareai.com)
INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    aud,
    role
) VALUES (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'cs@innovareai.com',
    crypt('cs@innovareai.com', gen_salt('bf')),
    now(),
    now(),
    now(),
    'authenticated',
    'authenticated'
) ON CONFLICT (email) DO NOTHING;

-- Create profiles for the test users
INSERT INTO profiles (
    id,
    workspace_id,
    email,
    full_name,
    role
) 
SELECT 
    au.id,
    'df5d730f-1915-4269-bd5a-9534478b17af',
    au.email,
    CASE 
        WHEN au.email = 'tl@innovareai.com' THEN 'Team Lead'
        WHEN au.email = 'cl@innovareai.com' THEN 'Client Lead'
        WHEN au.email = 'cs@innovareai.com' THEN 'Customer Success'
    END,
    'admin'
FROM auth.users au 
WHERE au.email IN ('tl@innovareai.com', 'cl@innovareai.com', 'cs@innovareai.com')
ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role;

-- Verify the users were created
SELECT 
    p.email,
    p.full_name,
    p.role,
    w.name as workspace_name
FROM profiles p
JOIN workspaces w ON p.workspace_id = w.id
WHERE p.email IN ('tl@innovareai.com', 'cl@innovareai.com', 'cs@innovareai.com');