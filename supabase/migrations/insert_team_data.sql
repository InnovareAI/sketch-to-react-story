-- Insert 2 team members
INSERT INTO public.team_members (id, workspace_id, email, full_name, role, department, status) VALUES
  ('a1b2c3d4-1111-1111-1111-111111111111', 'df5d730f-1915-4269-bd5a-9534478b17af', 'sarah.johnson@innovareai.com', 'Sarah Johnson', 'Marketing Manager', 'Marketing', 'active'),
  ('a1b2c3d4-2222-2222-2222-222222222222', 'df5d730f-1915-4269-bd5a-9534478b17af', 'michael.chen@innovareai.com', 'Michael Chen', 'Sales Director', 'Sales', 'active')
ON CONFLICT (workspace_id, email) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  department = EXCLUDED.department,
  updated_at = NOW();

-- Insert 10 LinkedIn accounts (5 for Sarah, 5 for Michael)
INSERT INTO public.linkedin_accounts (workspace_id, team_member_id, account_name, email, profile_url, account_type, status, daily_limit, weekly_limit, proxy_location) VALUES
  -- Sarah's LinkedIn accounts
  ('df5d730f-1915-4269-bd5a-9534478b17af', 'a1b2c3d4-1111-1111-1111-111111111111', 'Sarah Main Account', 'sarah.johnson@innovareai.com', 'https://linkedin.com/in/sarah-johnson', 'sales_navigator', 'active', 100, 500, 'US'),
  ('df5d730f-1915-4269-bd5a-9534478b17af', 'a1b2c3d4-1111-1111-1111-111111111111', 'Sarah Marketing', 'sarah.marketing@innovareai.com', 'https://linkedin.com/in/sarahjmarketing', 'personal', 'active', 50, 250, 'US'),
  ('df5d730f-1915-4269-bd5a-9534478b17af', 'a1b2c3d4-1111-1111-1111-111111111111', 'Sarah Outreach', 'sarah.outreach@innovareai.com', 'https://linkedin.com/in/sjoutreach', 'personal', 'active', 50, 250, 'DE'),
  ('df5d730f-1915-4269-bd5a-9534478b17af', 'a1b2c3d4-1111-1111-1111-111111111111', 'Sarah Events', 'sarah.events@innovareai.com', 'https://linkedin.com/in/sarah-events', 'personal', 'active', 50, 250, 'AT'),
  ('df5d730f-1915-4269-bd5a-9534478b17af', 'a1b2c3d4-1111-1111-1111-111111111111', 'Sarah Network', 'sarah.network@innovareai.com', 'https://linkedin.com/in/sarahnetwork', 'sales_navigator', 'active', 100, 500, 'PH'),
  
  -- Michael's LinkedIn accounts
  ('df5d730f-1915-4269-bd5a-9534478b17af', 'a1b2c3d4-2222-2222-2222-222222222222', 'Michael Primary', 'michael.chen@innovareai.com', 'https://linkedin.com/in/michael-chen', 'sales_navigator', 'active', 100, 500, 'US'),
  ('df5d730f-1915-4269-bd5a-9534478b17af', 'a1b2c3d4-2222-2222-2222-222222222222', 'Michael Sales', 'michael.sales@innovareai.com', 'https://linkedin.com/in/mchen-sales', 'sales_navigator', 'active', 100, 500, 'US'),
  ('df5d730f-1915-4269-bd5a-9534478b17af', 'a1b2c3d4-2222-2222-2222-222222222222', 'Michael Outbound', 'michael.outbound@innovareai.com', 'https://linkedin.com/in/michael-outbound', 'personal', 'active', 50, 250, 'DE'),
  ('df5d730f-1915-4269-bd5a-9534478b17af', 'a1b2c3d4-2222-2222-2222-222222222222', 'Michael Connect', 'michael.connect@innovareai.com', 'https://linkedin.com/in/mchen-connect', 'personal', 'active', 50, 250, 'AT'),
  ('df5d730f-1915-4269-bd5a-9534478b17af', 'a1b2c3d4-2222-2222-2222-222222222222', 'Michael Network', 'michael.network@innovareai.com', 'https://linkedin.com/in/michael-network', 'personal', 'active', 50, 250, 'PH');

-- Add metadata to some accounts for variety
UPDATE linkedin_accounts 
SET metadata = jsonb_build_object(
  'headline', 'Marketing Manager at InnovareAI',
  'connections_count', 2500,
  'location', 'San Francisco, CA',
  'industry', 'Technology'
)
WHERE account_name = 'Sarah Main Account';

UPDATE linkedin_accounts 
SET metadata = jsonb_build_object(
  'headline', 'Sales Director - AI Solutions',
  'connections_count', 3800,
  'location', 'New York, NY',
  'industry', 'Enterprise Software'
)
WHERE account_name = 'Michael Primary';

-- Insert default rotation rules
INSERT INTO public.account_rotation_rules (workspace_id, rotation_type, max_daily_per_account, cooldown_minutes, prioritize_warm_accounts, avoid_rate_limited)
VALUES ('df5d730f-1915-4269-bd5a-9534478b17af', 'round_robin', 50, 30, true, true)
ON CONFLICT DO NOTHING;

-- Add some email accounts for the team members
INSERT INTO public.email_accounts (workspace_id, team_member_id, account_name, email, provider, purpose, status, warmup_status) VALUES
  ('df5d730f-1915-4269-bd5a-9534478b17af', 'a1b2c3d4-1111-1111-1111-111111111111', 'Sarah Gmail', 'sarah.johnson@innovareai.com', 'gmail', 'both', 'active', 'warm'),
  ('df5d730f-1915-4269-bd5a-9534478b17af', 'a1b2c3d4-2222-2222-2222-222222222222', 'Michael Gmail', 'michael.chen@innovareai.com', 'gmail', 'both', 'active', 'hot');