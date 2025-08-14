-- Organization-Wide Apollo Integration with User Quotas
-- Implements 3,000 contacts per user per month across all workspaces

-- 1. User Quota Tracking Table
CREATE TABLE IF NOT EXISTS user_quota_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  month_year TEXT NOT NULL, -- Format: "2025-01"
  contacts_extracted INTEGER DEFAULT 0,
  contacts_remaining INTEGER DEFAULT 3000,
  last_extraction_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, month_year)
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_user_quota_month ON user_quota_usage(user_id, month_year);
CREATE INDEX IF NOT EXISTS idx_workspace_quota ON user_quota_usage(workspace_id, month_year);

-- 2. Organization API Keys Table
CREATE TABLE IF NOT EXISTS organization_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_name TEXT NOT NULL,
  apify_api_token TEXT NOT NULL,
  monthly_budget_usd DECIMAL(10,2) DEFAULT 0,
  current_month_spend DECIMAL(10,2) DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Extraction Audit Log
CREATE TABLE IF NOT EXISTS extraction_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  workspace_id UUID REFERENCES workspaces(id),
  extraction_type TEXT NOT NULL, -- 'apollo', 'linkedin', 'simulation'
  search_url TEXT,
  contacts_requested INTEGER,
  contacts_delivered INTEGER,
  cost_usd DECIMAL(8,4),
  apify_run_id TEXT,
  processing_time_ms INTEGER,
  status TEXT DEFAULT 'completed', -- 'pending', 'completed', 'failed'
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for audit queries
CREATE INDEX IF NOT EXISTS idx_audit_user_date ON extraction_audit_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_workspace_date ON extraction_audit_log(workspace_id, created_at DESC);

-- 4. Function to increment user quota usage
CREATE OR REPLACE FUNCTION increment_user_quota_usage(
  p_user_id UUID,
  p_month_year TEXT,
  p_contacts_used INTEGER
) RETURNS VOID AS $$
BEGIN
  INSERT INTO user_quota_usage (user_id, month_year, contacts_extracted, contacts_remaining, last_extraction_at)
  VALUES (p_user_id, p_month_year, p_contacts_used, 3000 - p_contacts_used, NOW())
  ON CONFLICT (user_id, month_year) 
  DO UPDATE SET 
    contacts_extracted = user_quota_usage.contacts_extracted + p_contacts_used,
    contacts_remaining = GREATEST(0, user_quota_usage.contacts_remaining - p_contacts_used),
    last_extraction_at = NOW(),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- 5. Initialize organization API key (InnovareAI)
-- Note: API token will be managed via environment variables in production
-- INSERT INTO organization_api_keys (
--   organization_name,
--   apify_api_token,
--   monthly_budget_usd,
--   active
-- ) VALUES (
--   'InnovareAI',
--   '[API_TOKEN_FROM_ENV]',
--   200.00, -- $200/month budget for STARTER plan
--   true
-- ) ON CONFLICT DO NOTHING;

-- 6. Enable RLS on new tables
ALTER TABLE user_quota_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE extraction_audit_log ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies for user_quota_usage
CREATE POLICY "Users can view their own quota usage" ON user_quota_usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own quota usage" ON user_quota_usage
  FOR UPDATE USING (auth.uid() = user_id);

-- 8. RLS Policies for extraction_audit_log
CREATE POLICY "Users can view their own extraction logs" ON extraction_audit_log
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own extraction logs" ON extraction_audit_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 9. RLS Policies for organization_api_keys (admin only)
CREATE POLICY "Only authenticated users can view org keys" ON organization_api_keys
  FOR SELECT USING (auth.role() = 'authenticated');