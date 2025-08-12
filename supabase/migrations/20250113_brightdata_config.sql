-- Bright Data Configuration for LinkedIn Scraping and IP Rotation

-- 1. Workspace Bright Data Configuration
CREATE TABLE IF NOT EXISTS public.workspace_brightdata_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  customer_id TEXT NOT NULL,
  zone_id TEXT NOT NULL,
  password TEXT NOT NULL, -- Should be encrypted in production
  residential_proxy TEXT NOT NULL,
  datacenter_proxy TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'error')),
  bandwidth_used_gb DECIMAL(10, 2) DEFAULT 0,
  bandwidth_limit_gb DECIMAL(10, 2) DEFAULT 10,
  last_rotation_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_workspace_brightdata UNIQUE (workspace_id)
);

-- 2. IP Rotation Log for tracking proxy usage
CREATE TABLE IF NOT EXISTS public.ip_rotation_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  ip_address TEXT NOT NULL,
  ip_type TEXT CHECK (ip_type IN ('residential', 'datacenter')),
  geo_location TEXT,
  used_for TEXT, -- 'profile_view', 'connection_request', 'message_send', etc.
  linkedin_account_id TEXT,
  success BOOLEAN DEFAULT true,
  response_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. LinkedIn Scraping Sessions
CREATE TABLE IF NOT EXISTS public.linkedin_scraping_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  proxy_used TEXT,
  profiles_scraped INTEGER DEFAULT 0,
  companies_scraped INTEGER DEFAULT 0,
  jobs_scraped INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed', 'rate_limited')),
  error_details JSONB
);

-- 4. Proxy Health Monitoring
CREATE TABLE IF NOT EXISTS public.proxy_health (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  proxy_type TEXT CHECK (proxy_type IN ('residential', 'datacenter')),
  health_score DECIMAL(3, 2) DEFAULT 1.00, -- 0.00 to 1.00
  success_rate DECIMAL(5, 2),
  avg_response_time_ms INTEGER,
  total_requests INTEGER DEFAULT 0,
  failed_requests INTEGER DEFAULT 0,
  last_check_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update linkedin_config table to include proxy settings
ALTER TABLE public.linkedin_config 
ADD COLUMN IF NOT EXISTS daily_profile_views INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS scraping_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS proxy_rotation_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS residential_proxy_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ip_rotation JSONB DEFAULT '{}'::jsonb;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_workspace_brightdata_workspace_id ON public.workspace_brightdata_config(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_brightdata_status ON public.workspace_brightdata_config(status);
CREATE INDEX IF NOT EXISTS idx_ip_rotation_log_workspace_id ON public.ip_rotation_log(workspace_id);
CREATE INDEX IF NOT EXISTS idx_ip_rotation_log_created_at ON public.ip_rotation_log(created_at);
CREATE INDEX IF NOT EXISTS idx_linkedin_scraping_sessions_workspace_id ON public.linkedin_scraping_sessions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_linkedin_scraping_sessions_status ON public.linkedin_scraping_sessions(status);
CREATE INDEX IF NOT EXISTS idx_proxy_health_workspace_id ON public.proxy_health(workspace_id);

-- Enable RLS
ALTER TABLE public.workspace_brightdata_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ip_rotation_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.linkedin_scraping_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proxy_health ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Workspace members can view Bright Data config" ON public.workspace_brightdata_config
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace admins can update Bright Data config" ON public.workspace_brightdata_config
  FOR UPDATE USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Workspace members can view IP rotation logs" ON public.ip_rotation_log
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace members can view scraping sessions" ON public.linkedin_scraping_sessions
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace members can view proxy health" ON public.proxy_health
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members 
      WHERE user_id = auth.uid()
    )
  );

-- Function to rotate IP address
CREATE OR REPLACE FUNCTION rotate_ip_address(p_workspace_id UUID, p_ip_type TEXT)
RETURNS TEXT AS $$
DECLARE
  v_new_ip TEXT;
  v_proxy_config RECORD;
BEGIN
  -- Get proxy configuration
  SELECT * INTO v_proxy_config
  FROM workspace_brightdata_config
  WHERE workspace_id = p_workspace_id
  AND status = 'active';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No active Bright Data configuration found for workspace';
  END IF;
  
  -- Generate new IP (in production, this would call Bright Data API)
  v_new_ip := CASE 
    WHEN p_ip_type = 'residential' THEN 
      'res-' || substr(md5(random()::text), 1, 8) || '.proxy.brightdata.com'
    ELSE 
      'dc-' || substr(md5(random()::text), 1, 8) || '.proxy.brightdata.com'
  END;
  
  -- Log the rotation
  INSERT INTO ip_rotation_log (
    workspace_id,
    ip_address,
    ip_type,
    geo_location,
    created_at
  ) VALUES (
    p_workspace_id,
    v_new_ip,
    p_ip_type,
    'auto',
    NOW()
  );
  
  -- Update last rotation time
  UPDATE workspace_brightdata_config
  SET last_rotation_at = NOW()
  WHERE workspace_id = p_workspace_id;
  
  RETURN v_new_ip;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check proxy health
CREATE OR REPLACE FUNCTION check_proxy_health(p_workspace_id UUID)
RETURNS VOID AS $$
DECLARE
  v_success_rate DECIMAL(5, 2);
  v_avg_response_time INTEGER;
  v_total_requests INTEGER;
  v_failed_requests INTEGER;
BEGIN
  -- Calculate metrics from recent logs
  SELECT 
    COUNT(*) AS total,
    COUNT(*) FILTER (WHERE success = false) AS failed,
    AVG(response_time_ms) AS avg_time,
    (COUNT(*) FILTER (WHERE success = true)::DECIMAL / NULLIF(COUNT(*), 0)) * 100 AS success_pct
  INTO v_total_requests, v_failed_requests, v_avg_response_time, v_success_rate
  FROM ip_rotation_log
  WHERE workspace_id = p_workspace_id
  AND created_at > NOW() - INTERVAL '1 hour';
  
  -- Update or insert proxy health record
  INSERT INTO proxy_health (
    workspace_id,
    proxy_type,
    health_score,
    success_rate,
    avg_response_time_ms,
    total_requests,
    failed_requests,
    last_check_at
  ) VALUES (
    p_workspace_id,
    'residential',
    CASE 
      WHEN v_success_rate >= 95 THEN 1.00
      WHEN v_success_rate >= 90 THEN 0.90
      WHEN v_success_rate >= 80 THEN 0.80
      ELSE 0.50
    END,
    v_success_rate,
    v_avg_response_time,
    v_total_requests,
    v_failed_requests,
    NOW()
  )
  ON CONFLICT (workspace_id, proxy_type) DO UPDATE
  SET 
    health_score = EXCLUDED.health_score,
    success_rate = EXCLUDED.success_rate,
    avg_response_time_ms = EXCLUDED.avg_response_time_ms,
    total_requests = EXCLUDED.total_requests,
    failed_requests = EXCLUDED.failed_requests,
    last_check_at = NOW(),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update bandwidth usage
CREATE OR REPLACE FUNCTION update_bandwidth_usage()
RETURNS TRIGGER AS $$
BEGIN
  -- Update bandwidth used (simplified - in production would calculate actual usage)
  UPDATE workspace_brightdata_config
  SET bandwidth_used_gb = bandwidth_used_gb + 0.001 -- 1MB per request estimate
  WHERE workspace_id = NEW.workspace_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_bandwidth_on_rotation
  AFTER INSERT ON ip_rotation_log
  FOR EACH ROW
  EXECUTE FUNCTION update_bandwidth_usage();

-- Comments for documentation
COMMENT ON TABLE public.workspace_brightdata_config IS 'Bright Data proxy configuration for LinkedIn scraping';
COMMENT ON TABLE public.ip_rotation_log IS 'Log of IP address rotations for proxy usage tracking';
COMMENT ON TABLE public.linkedin_scraping_sessions IS 'LinkedIn scraping session tracking';
COMMENT ON TABLE public.proxy_health IS 'Proxy health monitoring and metrics';
COMMENT ON FUNCTION rotate_ip_address IS 'Rotates IP address for a workspace and logs the change';
COMMENT ON FUNCTION check_proxy_health IS 'Checks and updates proxy health metrics';