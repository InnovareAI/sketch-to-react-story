-- Create team_members table
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL DEFAULT 'df5d730f-1915-4269-bd5a-9534478b17af',
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(100) NOT NULL,
  department VARCHAR(100),
  avatar_url TEXT,
  status VARCHAR(50) DEFAULT 'active',
  permissions JSONB DEFAULT '{"can_send_messages": true, "can_manage_campaigns": true, "can_view_analytics": true}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, email)
);

-- Create linkedin_accounts table
CREATE TABLE IF NOT EXISTS public.linkedin_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL DEFAULT 'df5d730f-1915-4269-bd5a-9534478b17af',
  team_member_id UUID REFERENCES team_members(id) ON DELETE CASCADE,
  account_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  profile_url TEXT,
  linkedin_id VARCHAR(255),
  account_type VARCHAR(50) DEFAULT 'personal', -- personal or sales_navigator
  status VARCHAR(50) DEFAULT 'active', -- active, inactive, rate_limited, suspended
  daily_limit INTEGER DEFAULT 50,
  weekly_limit INTEGER DEFAULT 250,
  daily_used INTEGER DEFAULT 0,
  weekly_used INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  proxy_location VARCHAR(10),
  credentials JSONB, -- encrypted OAuth tokens
  metadata JSONB DEFAULT '{}'::jsonb,
  tags TEXT[],
  assigned_campaigns UUID[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create email_accounts table
CREATE TABLE IF NOT EXISTS public.email_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL DEFAULT 'df5d730f-1915-4269-bd5a-9534478b17af',
  team_member_id UUID REFERENCES team_members(id) ON DELETE CASCADE,
  account_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  provider VARCHAR(50) DEFAULT 'gmail', -- gmail, outlook, smtp, other
  purpose VARCHAR(50) DEFAULT 'both', -- outbound, inbound, both
  status VARCHAR(50) DEFAULT 'active',
  daily_limit INTEGER DEFAULT 200,
  daily_used INTEGER DEFAULT 0,
  warmup_status VARCHAR(50) DEFAULT 'cold', -- cold, warming, warm, hot
  reputation INTEGER DEFAULT 100,
  credentials JSONB, -- encrypted SMTP/OAuth details
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create account_rotation_rules table
CREATE TABLE IF NOT EXISTS public.account_rotation_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL DEFAULT 'df5d730f-1915-4269-bd5a-9534478b17af',
  rotation_type VARCHAR(50) DEFAULT 'round_robin', -- round_robin, least_used, best_performance, manual
  max_daily_per_account INTEGER DEFAULT 50,
  cooldown_minutes INTEGER DEFAULT 30,
  prioritize_warm_accounts BOOLEAN DEFAULT TRUE,
  avoid_rate_limited BOOLEAN DEFAULT TRUE,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_linkedin_accounts_workspace ON linkedin_accounts(workspace_id);
CREATE INDEX idx_linkedin_accounts_team_member ON linkedin_accounts(team_member_id);
CREATE INDEX idx_linkedin_accounts_status ON linkedin_accounts(status);
CREATE INDEX idx_email_accounts_workspace ON email_accounts(workspace_id);
CREATE INDEX idx_email_accounts_team_member ON email_accounts(team_member_id);
CREATE INDEX idx_team_members_workspace ON team_members(workspace_id);

-- Enable Row Level Security
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE linkedin_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_rotation_rules ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allowing all operations for now - adjust based on your auth needs)
CREATE POLICY "Allow all operations on team_members" ON team_members FOR ALL USING (true);
CREATE POLICY "Allow all operations on linkedin_accounts" ON linkedin_accounts FOR ALL USING (true);
CREATE POLICY "Allow all operations on email_accounts" ON email_accounts FOR ALL USING (true);
CREATE POLICY "Allow all operations on account_rotation_rules" ON account_rotation_rules FOR ALL USING (true);

-- Function to reset daily usage (run via cron job)
CREATE OR REPLACE FUNCTION reset_daily_usage()
RETURNS void AS $$
BEGIN
  UPDATE linkedin_accounts SET daily_used = 0 WHERE daily_used > 0;
  UPDATE email_accounts SET daily_used = 0 WHERE daily_used > 0;
END;
$$ LANGUAGE plpgsql;

-- Function to reset weekly usage (run via cron job)
CREATE OR REPLACE FUNCTION reset_weekly_usage()
RETURNS void AS $$
BEGIN
  UPDATE linkedin_accounts SET weekly_used = 0 WHERE weekly_used > 0;
END;
$$ LANGUAGE plpgsql;