-- SAM AI Platform - Supabase Database Setup
-- Run this script in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create workspaces table if not exists
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  owner_id UUID REFERENCES auth.users(id),
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create profiles table if not exists
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  workspace_id UUID REFERENCES workspaces(id),
  role TEXT DEFAULT 'member',
  department TEXT,
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user invites table
CREATE TABLE IF NOT EXISTS user_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id),
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  role TEXT DEFAULT 'member',
  department TEXT,
  permissions JSONB DEFAULT '{}',
  invite_link TEXT,
  expires_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending',
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create team accounts table for LinkedIn
CREATE TABLE IF NOT EXISTS team_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  workspace_id UUID REFERENCES workspaces(id),
  provider TEXT DEFAULT 'LINKEDIN',
  email TEXT,
  name TEXT,
  profile_url TEXT,
  profile_picture TEXT,
  status TEXT DEFAULT 'active',
  unipile_account_id TEXT,
  metadata JSONB DEFAULT '{}',
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  last_sync TIMESTAMPTZ,
  disconnected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create linkedin_connections table
CREATE TABLE IF NOT EXISTS linkedin_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID REFERENCES team_accounts(id),
  linkedin_id TEXT UNIQUE,
  name TEXT,
  headline TEXT,
  profile_url TEXT,
  profile_picture TEXT,
  location TEXT,
  company TEXT,
  connection_degree INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'draft',
  settings JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES campaigns(id),
  account_id UUID REFERENCES team_accounts(id),
  recipient_id UUID REFERENCES linkedin_connections(id),
  message_type TEXT DEFAULT 'linkedin',
  content TEXT,
  status TEXT DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create templates table
CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id),
  name TEXT NOT NULL,
  category TEXT,
  content TEXT,
  variables JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create analytics_events table
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id),
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security on all tables
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE linkedin_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies

-- Workspaces policies
CREATE POLICY "Users can view their workspace" ON workspaces
  FOR SELECT USING (
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.workspace_id = workspaces.id
      AND profiles.id = auth.uid()
    )
  );

CREATE POLICY "Owners can update their workspace" ON workspaces
  FOR UPDATE USING (owner_id = auth.uid());

-- Profiles policies
CREATE POLICY "Users can view profiles in their workspace" ON profiles
  FOR SELECT USING (
    id = auth.uid() OR
    workspace_id IN (
      SELECT workspace_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (id = auth.uid());

-- Team accounts policies
CREATE POLICY "Users can view team accounts in their workspace" ON team_accounts
  FOR SELECT USING (
    user_id = auth.uid() OR
    workspace_id IN (
      SELECT workspace_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their own accounts" ON team_accounts
  FOR ALL USING (user_id = auth.uid());

-- User invites policies
CREATE POLICY "Admins can manage invites" ON user_invites
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'owner')
    )
  );

-- Campaigns policies
CREATE POLICY "Users can view campaigns in their workspace" ON campaigns
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create campaigns" ON campaigns
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Campaign creators can update their campaigns" ON campaigns
  FOR UPDATE USING (created_by = auth.uid());

-- Messages policies
CREATE POLICY "Users can view messages in their workspace" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM campaigns
      WHERE campaigns.id = messages.campaign_id
      AND campaigns.workspace_id IN (
        SELECT workspace_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- Templates policies
CREATE POLICY "Users can view templates in their workspace" ON templates
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create templates" ON templates
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Analytics events policies
CREATE POLICY "Users can view analytics in their workspace" ON analytics_events
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create analytics events" ON analytics_events
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_workspace_id ON profiles(workspace_id);
CREATE INDEX IF NOT EXISTS idx_team_accounts_user_id ON team_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_team_accounts_workspace_id ON team_accounts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_workspace_id ON campaigns(workspace_id);
CREATE INDEX IF NOT EXISTS idx_messages_campaign_id ON messages(campaign_id);
CREATE INDEX IF NOT EXISTS idx_messages_account_id ON messages(account_id);
CREATE INDEX IF NOT EXISTS idx_templates_workspace_id ON templates(workspace_id);
CREATE INDEX IF NOT EXISTS idx_analytics_workspace_id ON analytics_events(workspace_id);

-- Create functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_workspaces_updated_at BEFORE UPDATE ON workspaces
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_accounts_updated_at BEFORE UPDATE ON team_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_linkedin_connections_updated_at BEFORE UPDATE ON linkedin_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for demo (optional)
-- Uncomment if you want demo data

/*
-- Create demo workspace
INSERT INTO workspaces (id, name, owner_id, settings)
VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'Demo Workspace',
  auth.uid(),
  '{"features": {"linkedin": true, "email": true, "ai": true}}'
);

-- Create demo profile
INSERT INTO profiles (id, email, first_name, last_name, workspace_id, role)
VALUES (
  auth.uid(),
  (SELECT email FROM auth.users WHERE id = auth.uid()),
  'Demo',
  'User',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'admin'
);
*/

-- Grant permissions to authenticated users
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Database setup completed successfully!';
END $$;