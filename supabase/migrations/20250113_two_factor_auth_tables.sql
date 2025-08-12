-- Two-Factor Authentication Tables Migration
-- Comprehensive 2FA system for workspace and user security

-- User 2FA settings table
CREATE TABLE IF NOT EXISTS public.user_two_factor (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  secret TEXT NOT NULL, -- Encrypted TOTP secret
  enabled BOOLEAN DEFAULT false,
  verified BOOLEAN DEFAULT false,
  enabled_at TIMESTAMP WITH TIME ZONE,
  disabled_at TIMESTAMP WITH TIME ZONE,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Backup codes table
CREATE TABLE IF NOT EXISTS public.user_backup_codes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  used BOOLEAN DEFAULT false,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- OAuth states for CSRF protection
CREATE TABLE IF NOT EXISTS public.oauth_states (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  state TEXT NOT NULL UNIQUE,
  provider TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workspace 2FA policies
CREATE TABLE IF NOT EXISTS public.workspace_2fa_policies (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE UNIQUE,
  enforced BOOLEAN DEFAULT false,
  enforcement_level TEXT CHECK (enforcement_level IN ('optional', 'required', 'role_based')) DEFAULT 'optional',
  required_roles TEXT[] DEFAULT '{}',
  grace_period_days INTEGER DEFAULT 7,
  exempt_users UUID[] DEFAULT '{}',
  settings JSONB DEFAULT '{
    "allowBackupCodes": true,
    "allowSMS": false,
    "allowAuthenticatorApp": true,
    "sessionTimeout": 1440,
    "requireReauthForSensitive": true
  }'::jsonb,
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2FA exemptions table
CREATE TABLE IF NOT EXISTS public.two_factor_exemptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  granted_by UUID REFERENCES auth.users(id),
  reason TEXT NOT NULL,
  revoked BOOLEAN DEFAULT false,
  revoked_by UUID REFERENCES auth.users(id),
  revoked_at TIMESTAMP WITH TIME ZONE,
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2FA audit log
CREATE TABLE IF NOT EXISTS public.two_factor_audit_log (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event TEXT NOT NULL,
  metadata JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workspace audit log for policy changes
CREATE TABLE IF NOT EXISTS public.workspace_audit_log (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workspace LinkedIn accounts (for OAuth tracking)
CREATE TABLE IF NOT EXISTS public.workspace_linkedin_accounts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL,
  name TEXT,
  email TEXT,
  profile_url TEXT,
  profile_data JSONB,
  status TEXT CHECK (status IN ('active', 'expired', 'disconnected')) DEFAULT 'active',
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  disconnected_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB
);

-- Workspace members table (if not exists)
CREATE TABLE IF NOT EXISTS public.workspace_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('workspace_manager', 'admin', 'user', 'co_worker')) DEFAULT 'user',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(workspace_id, user_id)
);

-- User notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_user_two_factor_user_id ON public.user_two_factor(user_id);
CREATE INDEX idx_user_backup_codes_user_id ON public.user_backup_codes(user_id);
CREATE INDEX idx_user_backup_codes_code ON public.user_backup_codes(code);
CREATE INDEX idx_oauth_states_workspace_id ON public.oauth_states(workspace_id);
CREATE INDEX idx_oauth_states_state ON public.oauth_states(state);
CREATE INDEX idx_workspace_2fa_policies_workspace_id ON public.workspace_2fa_policies(workspace_id);
CREATE INDEX idx_two_factor_exemptions_workspace_user ON public.two_factor_exemptions(workspace_id, user_id);
CREATE INDEX idx_two_factor_audit_log_user_id ON public.two_factor_audit_log(user_id);
CREATE INDEX idx_workspace_audit_log_workspace_id ON public.workspace_audit_log(workspace_id);
CREATE INDEX idx_workspace_linkedin_accounts_workspace_id ON public.workspace_linkedin_accounts(workspace_id);
CREATE INDEX idx_workspace_members_workspace_id ON public.workspace_members(workspace_id);
CREATE INDEX idx_workspace_members_user_id ON public.workspace_members(user_id);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);

-- Row Level Security (RLS) Policies

-- User 2FA settings: Users can only manage their own 2FA
ALTER TABLE public.user_two_factor ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own 2FA settings" ON public.user_two_factor
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own 2FA settings" ON public.user_two_factor
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own 2FA settings" ON public.user_two_factor
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Backup codes: Users can only manage their own codes
ALTER TABLE public.user_backup_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own backup codes" ON public.user_backup_codes
  FOR ALL USING (auth.uid() = user_id);

-- Workspace 2FA policies: Managers can manage, all members can view
ALTER TABLE public.workspace_2fa_policies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Workspace members can view 2FA policy" ON public.workspace_2fa_policies
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_members.workspace_id = workspace_2fa_policies.workspace_id
      AND workspace_members.user_id = auth.uid()
    )
  );
CREATE POLICY "Workspace managers can manage 2FA policy" ON public.workspace_2fa_policies
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_members.workspace_id = workspace_2fa_policies.workspace_id
      AND workspace_members.user_id = auth.uid()
      AND workspace_members.role IN ('workspace_manager', 'admin')
    )
  );

-- Exemptions: Managers can manage, affected users can view
ALTER TABLE public.two_factor_exemptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own exemptions" ON public.two_factor_exemptions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Workspace managers can manage exemptions" ON public.two_factor_exemptions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_members.workspace_id = two_factor_exemptions.workspace_id
      AND workspace_members.user_id = auth.uid()
      AND workspace_members.role IN ('workspace_manager', 'admin')
    )
  );

-- Audit logs: Users can view their own, managers can view workspace logs
ALTER TABLE public.two_factor_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own audit logs" ON public.two_factor_audit_log
  FOR SELECT USING (auth.uid() = user_id);

ALTER TABLE public.workspace_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Workspace members can view audit logs" ON public.workspace_audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_members.workspace_id = workspace_audit_log.workspace_id
      AND workspace_members.user_id = auth.uid()
    )
  );

-- Functions for 2FA management

-- Function to check if user requires 2FA
CREATE OR REPLACE FUNCTION check_user_requires_2fa(p_workspace_id UUID, p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_policy workspace_2fa_policies;
  v_member workspace_members;
  v_result JSONB;
BEGIN
  -- Get workspace policy
  SELECT * INTO v_policy FROM workspace_2fa_policies WHERE workspace_id = p_workspace_id;
  
  -- If no policy or not enforced, 2FA is optional
  IF v_policy IS NULL OR NOT v_policy.enforced THEN
    RETURN jsonb_build_object('required', false);
  END IF;
  
  -- Check if user is exempt
  IF p_user_id = ANY(v_policy.exempt_users) THEN
    RETURN jsonb_build_object('required', false, 'reason', 'User has exemption');
  END IF;
  
  -- Get user's role
  SELECT * INTO v_member FROM workspace_members 
  WHERE workspace_id = p_workspace_id AND user_id = p_user_id;
  
  -- Check enforcement level
  IF v_policy.enforcement_level = 'required' THEN
    RETURN jsonb_build_object(
      'required', true,
      'reason', 'Workspace requires 2FA for all users',
      'graceEndDate', (v_member.joined_at + (v_policy.grace_period_days || ' days')::interval)
    );
  ELSIF v_policy.enforcement_level = 'role_based' THEN
    IF v_member.role = ANY(v_policy.required_roles) THEN
      RETURN jsonb_build_object(
        'required', true,
        'reason', format('2FA required for %s role', v_member.role),
        'graceEndDate', (v_member.joined_at + (v_policy.grace_period_days || ' days')::interval)
      );
    END IF;
  END IF;
  
  RETURN jsonb_build_object('required', false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION check_user_requires_2fa TO authenticated;