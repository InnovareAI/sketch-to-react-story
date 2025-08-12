-- Workspace Provisioning Tables for Automated Unipile Setup

-- 1. Workspace Unipile Configuration
CREATE TABLE IF NOT EXISTS public.workspace_unipile_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL,
  api_key TEXT NOT NULL, -- Should be encrypted in production
  api_secret TEXT,
  webhook_secret TEXT,
  linkedin_enabled BOOLEAN DEFAULT false,
  email_enabled BOOLEAN DEFAULT true,
  calendar_enabled BOOLEAN DEFAULT false,
  whatsapp_enabled BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'error', 'suspended')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_workspace_unipile UNIQUE (workspace_id)
);

-- 2. LinkedIn Configuration per Workspace
CREATE TABLE IF NOT EXISTS public.linkedin_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  max_accounts INTEGER DEFAULT 1,
  daily_connection_limit INTEGER DEFAULT 20,
  daily_message_limit INTEGER DEFAULT 50,
  features JSONB DEFAULT '{}'::jsonb,
  safety_settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_workspace_linkedin UNIQUE (workspace_id)
);

-- 3. Email Configuration per Workspace
CREATE TABLE IF NOT EXISTS public.email_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  max_accounts INTEGER DEFAULT 2,
  daily_send_limit INTEGER DEFAULT 100,
  providers TEXT[] DEFAULT ARRAY['gmail', 'outlook'],
  features JSONB DEFAULT '{}'::jsonb,
  smtp_settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_workspace_email UNIQUE (workspace_id)
);

-- 4. Calendar Configuration per Workspace
CREATE TABLE IF NOT EXISTS public.calendar_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  max_accounts INTEGER DEFAULT 2,
  providers TEXT[] DEFAULT ARRAY['google', 'outlook'],
  features JSONB DEFAULT '{}'::jsonb,
  default_settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_workspace_calendar UNIQUE (workspace_id)
);

-- 5. WhatsApp Configuration per Workspace (Enterprise only)
CREATE TABLE IF NOT EXISTS public.whatsapp_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  phone_number TEXT,
  business_account_id TEXT,
  features JSONB DEFAULT '{}'::jsonb,
  limits JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_workspace_whatsapp UNIQUE (workspace_id)
);

-- 6. Workspace Integrations Status
CREATE TABLE IF NOT EXISTS public.workspace_integrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  integrations JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_workspace_integrations UNIQUE (workspace_id)
);

-- 7. Workspace Preferences
CREATE TABLE IF NOT EXISTS public.workspace_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  campaign_defaults JSONB DEFAULT '{}'::jsonb,
  ai_settings JSONB DEFAULT '{}'::jsonb,
  notification_preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_workspace_preferences UNIQUE (workspace_id)
);

-- 8. Provisioning Errors Log
CREATE TABLE IF NOT EXISTS public.provisioning_errors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  error_message TEXT NOT NULL,
  error_details JSONB,
  retry_count INTEGER DEFAULT 0,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add provisioning columns to workspaces table if not exists
ALTER TABLE public.workspaces 
ADD COLUMN IF NOT EXISTS provisioning_status TEXT DEFAULT 'pending' CHECK (provisioning_status IN ('pending', 'in_progress', 'completed', 'error')),
ADD COLUMN IF NOT EXISTS provisioned_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS unipile_account_id TEXT,
ADD COLUMN IF NOT EXISTS provisioning_error TEXT;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_workspace_unipile_workspace_id ON public.workspace_unipile_config(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_unipile_status ON public.workspace_unipile_config(status);
CREATE INDEX IF NOT EXISTS idx_linkedin_config_workspace_id ON public.linkedin_config(workspace_id);
CREATE INDEX IF NOT EXISTS idx_email_config_workspace_id ON public.email_config(workspace_id);
CREATE INDEX IF NOT EXISTS idx_calendar_config_workspace_id ON public.calendar_config(workspace_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_config_workspace_id ON public.whatsapp_config(workspace_id);
CREATE INDEX IF NOT EXISTS idx_provisioning_errors_workspace_id ON public.provisioning_errors(workspace_id);
CREATE INDEX IF NOT EXISTS idx_provisioning_errors_resolved ON public.provisioning_errors(resolved);

-- Enable RLS
ALTER TABLE public.workspace_unipile_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.linkedin_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provisioning_errors ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (workspace members can view their workspace config)
CREATE POLICY "Workspace members can view unipile config" ON public.workspace_unipile_config
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace admins can update unipile config" ON public.workspace_unipile_config
  FOR UPDATE USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Similar policies for other tables
CREATE POLICY "Workspace members can view linkedin config" ON public.linkedin_config
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace members can view email config" ON public.email_config
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace members can view calendar config" ON public.calendar_config
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace members can view whatsapp config" ON public.whatsapp_config
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members 
      WHERE user_id = auth.uid()
    )
  );

-- Function to trigger provisioning on workspace creation
CREATE OR REPLACE FUNCTION trigger_workspace_provisioning()
RETURNS TRIGGER AS $$
BEGIN
  -- Call the edge function to provision the workspace
  PERFORM
    net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/provision-workspace',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key')
      ),
      body := jsonb_build_object(
        'workspaceId', NEW.id,
        'workspaceName', NEW.name,
        'ownerEmail', NEW.owner_email,
        'userId', NEW.created_by,
        'plan', COALESCE(NEW.plan, 'free')
      )
    );
  
  -- Update provisioning status
  UPDATE public.workspaces 
  SET provisioning_status = 'in_progress'
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic provisioning
CREATE TRIGGER provision_new_workspace
  AFTER INSERT ON public.workspaces
  FOR EACH ROW
  EXECUTE FUNCTION trigger_workspace_provisioning();

-- Function to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create update triggers for all new tables
CREATE TRIGGER update_workspace_unipile_config_updated_at
  BEFORE UPDATE ON public.workspace_unipile_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_linkedin_config_updated_at
  BEFORE UPDATE ON public.linkedin_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_config_updated_at
  BEFORE UPDATE ON public.email_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_config_updated_at
  BEFORE UPDATE ON public.calendar_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_config_updated_at
  BEFORE UPDATE ON public.whatsapp_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE public.workspace_unipile_config IS 'Stores Unipile API configuration for each workspace';
COMMENT ON TABLE public.linkedin_config IS 'LinkedIn integration settings per workspace';
COMMENT ON TABLE public.email_config IS 'Email integration settings per workspace';
COMMENT ON TABLE public.calendar_config IS 'Calendar integration settings per workspace';
COMMENT ON TABLE public.whatsapp_config IS 'WhatsApp Business API settings per workspace (Enterprise only)';
COMMENT ON TABLE public.workspace_integrations IS 'Overall integration status for each workspace';
COMMENT ON TABLE public.workspace_preferences IS 'Default preferences and settings for workspace operations';
COMMENT ON TABLE public.provisioning_errors IS 'Log of provisioning errors for debugging and retry';