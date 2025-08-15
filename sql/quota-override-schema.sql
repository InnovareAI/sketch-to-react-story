-- Quota Override System
-- Allows admins to grant additional quota or unlimited access to specific users

-- 1. Create quota overrides table
CREATE TABLE IF NOT EXISTS quota_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  override_type TEXT NOT NULL CHECK (override_type IN ('unlimited', 'additional', 'multiplier')),
  -- For 'unlimited': quota_value is ignored
  -- For 'additional': quota_value is added to base quota (e.g., +5000 contacts)
  -- For 'multiplier': quota_value multiplies base quota (e.g., 2x = 6000 contacts)
  quota_value INTEGER DEFAULT 0,
  reason TEXT,
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE, -- NULL means no expiration
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  active BOOLEAN DEFAULT true,
  
  UNIQUE(user_id, active) -- Only one active override per user
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_quota_override_user ON quota_overrides(user_id, active);
CREATE INDEX IF NOT EXISTS idx_quota_override_validity ON quota_overrides(valid_from, valid_until);

-- 2. Create admin quota settings table (global settings)
CREATE TABLE IF NOT EXISTS quota_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings
INSERT INTO quota_settings (setting_key, setting_value, description) VALUES
  ('default_monthly_quota', '3000', 'Default monthly contact extraction quota per user'),
  ('hard_limit', '10000', 'Maximum contacts per month even with overrides'),
  ('auto_reset', 'true', 'Automatically reset quotas on the 1st of each month')
ON CONFLICT (setting_key) DO NOTHING;

-- 3. Function to calculate effective quota for a user
CREATE OR REPLACE FUNCTION get_effective_quota(
  p_user_id UUID,
  p_base_quota INTEGER DEFAULT 3000
) RETURNS TABLE (
  effective_quota INTEGER,
  override_type TEXT,
  override_reason TEXT,
  is_unlimited BOOLEAN
) AS $$
DECLARE
  v_override RECORD;
BEGIN
  -- Check for active override
  SELECT * INTO v_override
  FROM quota_overrides
  WHERE user_id = p_user_id
    AND active = true
    AND (valid_from IS NULL OR valid_from <= NOW())
    AND (valid_until IS NULL OR valid_until >= NOW())
  LIMIT 1;
  
  IF v_override IS NULL THEN
    -- No override, return base quota
    RETURN QUERY SELECT 
      p_base_quota,
      NULL::TEXT,
      NULL::TEXT,
      false;
  ELSE
    -- Apply override based on type
    IF v_override.override_type = 'unlimited' THEN
      RETURN QUERY SELECT 
        999999, -- Effectively unlimited
        v_override.override_type,
        v_override.reason,
        true;
    ELSIF v_override.override_type = 'additional' THEN
      RETURN QUERY SELECT 
        p_base_quota + v_override.quota_value,
        v_override.override_type,
        v_override.reason,
        false;
    ELSIF v_override.override_type = 'multiplier' THEN
      RETURN QUERY SELECT 
        p_base_quota * v_override.quota_value,
        v_override.override_type,
        v_override.reason,
        false;
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 4. Function to grant quota override
CREATE OR REPLACE FUNCTION grant_quota_override(
  p_user_id UUID,
  p_user_email TEXT,
  p_override_type TEXT,
  p_quota_value INTEGER,
  p_reason TEXT,
  p_valid_until TIMESTAMP WITH TIME ZONE,
  p_created_by UUID
) RETURNS UUID AS $$
DECLARE
  v_override_id UUID;
BEGIN
  -- Deactivate any existing override
  UPDATE quota_overrides
  SET active = false,
      updated_at = NOW()
  WHERE user_id = p_user_id AND active = true;
  
  -- Create new override
  INSERT INTO quota_overrides (
    user_id,
    user_email,
    override_type,
    quota_value,
    reason,
    valid_until,
    created_by,
    active
  ) VALUES (
    p_user_id,
    p_user_email,
    p_override_type,
    p_quota_value,
    p_reason,
    p_valid_until,
    p_created_by,
    true
  ) RETURNING id INTO v_override_id;
  
  RETURN v_override_id;
END;
$$ LANGUAGE plpgsql;

-- 5. View for easy override management
CREATE OR REPLACE VIEW active_quota_overrides AS
SELECT 
  qo.id,
  qo.user_id,
  qo.user_email,
  qo.override_type,
  qo.quota_value,
  CASE 
    WHEN qo.override_type = 'unlimited' THEN 'Unlimited'
    WHEN qo.override_type = 'additional' THEN '+' || qo.quota_value::TEXT || ' contacts'
    WHEN qo.override_type = 'multiplier' THEN qo.quota_value::TEXT || 'x base quota'
  END as override_display,
  qo.reason,
  qo.valid_from,
  qo.valid_until,
  qo.created_by,
  creator.email as created_by_email,
  qo.created_at,
  CASE 
    WHEN qo.valid_until IS NULL THEN 'No expiration'
    WHEN qo.valid_until < NOW() THEN 'Expired'
    ELSE 'Active until ' || to_char(qo.valid_until, 'Mon DD, YYYY')
  END as status
FROM quota_overrides qo
LEFT JOIN auth.users creator ON qo.created_by = creator.id
WHERE qo.active = true
  AND (qo.valid_from IS NULL OR qo.valid_from <= NOW())
  AND (qo.valid_until IS NULL OR qo.valid_until >= NOW());

-- 6. RLS Policies for quota_overrides
ALTER TABLE quota_overrides ENABLE ROW LEVEL SECURITY;

-- Admins can view all overrides
CREATE POLICY "Admins can view all quota overrides" ON quota_overrides
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Admins can create overrides
CREATE POLICY "Admins can create quota overrides" ON quota_overrides
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Admins can update overrides
CREATE POLICY "Admins can update quota overrides" ON quota_overrides
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Users can view their own overrides
CREATE POLICY "Users can view their own quota overrides" ON quota_overrides
  FOR SELECT USING (user_id = auth.uid());

-- 7. RLS Policies for quota_settings
ALTER TABLE quota_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can view settings
CREATE POLICY "All users can view quota settings" ON quota_settings
  FOR SELECT USING (true);

-- Only admins can update settings
CREATE POLICY "Admins can update quota settings" ON quota_settings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- 8. Audit log for quota override changes
CREATE TABLE IF NOT EXISTS quota_override_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL, -- 'granted', 'revoked', 'expired', 'modified'
  override_id UUID REFERENCES quota_overrides(id),
  user_id UUID,
  user_email TEXT,
  override_details JSONB,
  performed_by UUID REFERENCES auth.users(id),
  performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for audit queries
CREATE INDEX IF NOT EXISTS idx_quota_audit_user ON quota_override_audit(user_id, performed_at DESC);

-- 9. Trigger to log override changes
CREATE OR REPLACE FUNCTION log_quota_override_change() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO quota_override_audit (
      action,
      override_id,
      user_id,
      user_email,
      override_details,
      performed_by
    ) VALUES (
      'granted',
      NEW.id,
      NEW.user_id,
      NEW.user_email,
      jsonb_build_object(
        'type', NEW.override_type,
        'value', NEW.quota_value,
        'reason', NEW.reason,
        'valid_until', NEW.valid_until
      ),
      NEW.created_by
    );
  ELSIF TG_OP = 'UPDATE' AND OLD.active = true AND NEW.active = false THEN
    INSERT INTO quota_override_audit (
      action,
      override_id,
      user_id,
      user_email,
      override_details,
      performed_by
    ) VALUES (
      'revoked',
      NEW.id,
      NEW.user_id,
      NEW.user_email,
      jsonb_build_object(
        'type', NEW.override_type,
        'value', NEW.quota_value,
        'reason', 'Override deactivated'
      ),
      auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER quota_override_audit_trigger
AFTER INSERT OR UPDATE ON quota_overrides
FOR EACH ROW EXECUTE FUNCTION log_quota_override_change();

-- Comments for documentation
COMMENT ON TABLE quota_overrides IS 'Manages quota overrides for individual users, allowing admins to grant additional or unlimited quotas';
COMMENT ON COLUMN quota_overrides.override_type IS 'Type of override: unlimited (no limit), additional (+X contacts), multiplier (Nx base quota)';
COMMENT ON TABLE quota_settings IS 'Global quota configuration settings';
COMMENT ON TABLE quota_override_audit IS 'Audit log tracking all quota override changes for compliance and history';