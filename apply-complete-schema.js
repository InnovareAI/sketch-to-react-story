import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';

const supabaseUrl = 'https://latxadqrvrrrcvkktrog.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhdHhhZHFydnJycmN2a2t0cm9nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTk5ODYsImV4cCI6MjA2ODI3NTk4Nn0.3WkAgXpk_MyQioVf_SED9O_ArjcT9nH0uy9we2okftE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function applyCompleteSchema() {
    console.log('🚀 Applying Complete Sam AI Database Schema');
    console.log('='.repeat(60));
    console.log(`🌐 Database: ${supabaseUrl}`);
    console.log(`📄 Schema: staging-schema.sql`);
    console.log('='.repeat(60));

    try {
        // Read the staging schema file
        const schemaContent = await fs.readFile('staging-schema.sql', 'utf8');
        console.log(`✅ Schema file read successfully (${(schemaContent.length / 1024).toFixed(2)} KB)`);

        // Since we can't execute raw SQL with anon key, we'll create a comprehensive
        // output that shows what needs to be done manually
        console.log('\n⚠️  IMPORTANT: Anon key cannot create tables directly.');
        console.log('🔑 Service role key required for schema creation.');
        console.log('\n📋 MANUAL SETUP INSTRUCTIONS:');
        console.log('─'.repeat(40));
        
        console.log('1. Go to Supabase SQL Editor:');
        console.log('   https://supabase.com/dashboard/project/latxadqrvrrrcvkktrog/sql/new');
        console.log('');
        
        console.log('2. Copy and paste this complete schema:');
        console.log('─'.repeat(40));
        
        // Output the complete schema with Sam AI specific enhancements
        const enhancedSchema = `
-- =============================================
-- SAM AI COMPLETE DATABASE SCHEMA
-- Execute this in Supabase SQL Editor
-- =============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create workspaces table (multi-tenant foundation)
CREATE TABLE IF NOT EXISTS workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    settings JSONB DEFAULT '{}',
    subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'starter', 'pro', 'enterprise')),
    subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'past_due', 'canceled', 'trialing')),
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create profiles table (user profiles)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
    avatar_url TEXT,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(workspace_id, email)
);

-- Create accounts table (STAGE 2 - Data Enrichment)
CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    domain TEXT,
    industry TEXT,
    company_size TEXT CHECK (company_size IN ('1-10', '11-50', '51-200', '201-500', '501-1000', '1000+')),
    annual_revenue TEXT,
    linkedin_company_id TEXT,
    scraped_data JSONB DEFAULT '{}',
    enrichment_data JSONB DEFAULT '{}',
    ideal_customer_profile JSONB DEFAULT '{}',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create contacts table (STAGE 1 - Lead Scraping)
CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    title TEXT,
    department TEXT,
    phone TEXT,
    linkedin_url TEXT,
    engagement_score INTEGER DEFAULT 0 CHECK (engagement_score >= 0 AND engagement_score <= 100),
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    scraped_data JSONB DEFAULT '{}',
    qualification_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(workspace_id, email)
);

-- Create campaigns table (STAGE 6 - Multi-channel Outreach)
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'email' CHECK (type IN ('email', 'linkedin', 'cold_call', 'sms', 'multi_channel')),
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'active', 'paused', 'completed', 'archived')),
    objective TEXT,
    target_audience JSONB DEFAULT '{}',
    linkedin_sequence_config JSONB DEFAULT '{}',
    n8n_workflow_id TEXT,
    apify_actor_config JSONB DEFAULT '{}',
    personalization_settings JSONB DEFAULT '{}',
    scheduling_config JSONB DEFAULT '{}',
    performance_metrics JSONB DEFAULT '{
        "sent": 0,
        "delivered": 0,
        "opened": 0,
        "clicked": 0,
        "replied": 0,
        "converted": 0
    }',
    budget DECIMAL(10, 2) CHECK (budget >= 0),
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    settings JSONB DEFAULT '{}',
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CHECK (end_date IS NULL OR end_date > start_date)
);

-- Create messages table (STAGE 5 - Personalization)
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
    subject TEXT,
    content TEXT,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sent', 'delivered', 'opened', 'clicked', 'replied', 'bounced', 'failed')),
    sent_at TIMESTAMP WITH TIME ZONE,
    opened_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE,
    replied_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    personalization_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ai_assistants table (STAGE 3 - Knowledge Base RAG)
CREATE TABLE IF NOT EXISTS ai_assistants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'sales' CHECK (type IN ('sales', 'support', 'marketing', 'custom')),
    model TEXT DEFAULT 'gpt-4',
    system_prompt TEXT,
    temperature DECIMAL(3,2) DEFAULT 0.7 CHECK (temperature >= 0 AND temperature <= 2),
    max_tokens INTEGER DEFAULT 2000 CHECK (max_tokens > 0 AND max_tokens <= 32000),
    settings JSONB DEFAULT '{}',
    knowledge_base_config JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create conversations table (STAGE 7 - Response Handling)
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    assistant_id UUID REFERENCES ai_assistants(id) ON DELETE SET NULL,
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'archived')),
    context JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create conversation_messages table
CREATE TABLE IF NOT EXISTS conversation_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create integrations table
CREATE TABLE IF NOT EXISTS integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK (provider IN ('apify', 'unipile', 'hubspot', 'salesforce', 'pipedrive', 'gmail', 'outlook', 'linkedin', 'slack', 'zapier', 'webhook', 'n8n')),
    type TEXT NOT NULL,
    credentials JSONB DEFAULT '{}',
    settings JSONB DEFAULT '{}',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error', 'expired')),
    last_sync_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(workspace_id, provider)
);

-- Create workflows table (STAGE 8 - Follow-up Automation)
CREATE TABLE IF NOT EXISTS workflows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('automation', 'sequence', 'trigger', 'scheduled')),
    trigger_type TEXT,
    trigger_config JSONB DEFAULT '{}',
    steps JSONB DEFAULT '[]',
    status TEXT DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'paused', 'error')),
    last_run_at TIMESTAMP WITH TIME ZONE,
    next_run_at TIMESTAMP WITH TIME ZONE,
    n8n_workflow_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create analytics_events table (Performance Tracking)
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    entity_type TEXT,
    entity_id UUID,
    properties JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_profiles_workspace ON profiles(workspace_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_accounts_workspace ON accounts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_accounts_domain ON accounts(domain);
CREATE INDEX IF NOT EXISTS idx_accounts_linkedin_company_id ON accounts(linkedin_company_id);
CREATE INDEX IF NOT EXISTS idx_contacts_workspace ON contacts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_contacts_account ON contacts(account_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_linkedin_url ON contacts(linkedin_url);
CREATE INDEX IF NOT EXISTS idx_campaigns_workspace ON campaigns(workspace_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_type ON campaigns(type);
CREATE INDEX IF NOT EXISTS idx_campaigns_n8n_workflow_id ON campaigns(n8n_workflow_id);
CREATE INDEX IF NOT EXISTS idx_messages_campaign ON messages(campaign_id);
CREATE INDEX IF NOT EXISTS idx_messages_contact ON messages(contact_id);
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);
CREATE INDEX IF NOT EXISTS idx_conversations_contact ON conversations(contact_id);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_conversation ON conversation_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_integrations_workspace ON integrations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_integrations_provider ON integrations(provider);
CREATE INDEX IF NOT EXISTS idx_workflows_workspace ON workflows(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workflows_n8n_workflow_id ON workflows(n8n_workflow_id);
CREATE INDEX IF NOT EXISTS idx_analytics_workspace ON analytics_events(workspace_id);
CREATE INDEX IF NOT EXISTS idx_analytics_created ON analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workspace_slug ON workspaces(slug);

-- Enable Row Level Security on all tables
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_assistants ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for workspaces
CREATE POLICY "Users can view their workspace" ON workspaces
    FOR SELECT USING (
        id IN (
            SELECT workspace_id FROM profiles 
            WHERE profiles.id = auth.uid()
        )
    );

CREATE POLICY "Workspace owners can update" ON workspaces
    FOR UPDATE USING (
        id IN (
            SELECT workspace_id FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND role IN ('owner', 'admin')
        )
    );

-- Create RLS policies for profiles
CREATE POLICY "View workspace profiles" ON profiles
    FOR SELECT USING (
        workspace_id IN (
            SELECT workspace_id FROM profiles p
            WHERE p.id = auth.uid()
        )
    );

CREATE POLICY "Update own profile" ON profiles
    FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Create profile on signup" ON profiles
    FOR INSERT WITH CHECK (id = auth.uid());

-- Create workspace isolation policies for all workspace-scoped tables
CREATE POLICY "workspace_isolation_accounts" ON accounts
    FOR ALL USING (
        workspace_id IN (
            SELECT workspace_id FROM profiles 
            WHERE profiles.id = auth.uid()
        )
    );

CREATE POLICY "workspace_isolation_contacts" ON contacts
    FOR ALL USING (
        workspace_id IN (
            SELECT workspace_id FROM profiles 
            WHERE profiles.id = auth.uid()
        )
    );

CREATE POLICY "workspace_isolation_campaigns" ON campaigns
    FOR ALL USING (
        workspace_id IN (
            SELECT workspace_id FROM profiles 
            WHERE profiles.id = auth.uid()
        )
    );

CREATE POLICY "workspace_isolation_messages" ON messages
    FOR ALL USING (
        workspace_id IN (
            SELECT workspace_id FROM profiles 
            WHERE profiles.id = auth.uid()
        )
    );

CREATE POLICY "workspace_isolation_ai_assistants" ON ai_assistants
    FOR ALL USING (
        workspace_id IN (
            SELECT workspace_id FROM profiles 
            WHERE profiles.id = auth.uid()
        )
    );

CREATE POLICY "workspace_isolation_conversations" ON conversations
    FOR ALL USING (
        workspace_id IN (
            SELECT workspace_id FROM profiles 
            WHERE profiles.id = auth.uid()
        )
    );

CREATE POLICY "workspace_isolation_integrations" ON integrations
    FOR ALL USING (
        workspace_id IN (
            SELECT workspace_id FROM profiles 
            WHERE profiles.id = auth.uid()
        )
    );

CREATE POLICY "workspace_isolation_workflows" ON workflows
    FOR ALL USING (
        workspace_id IN (
            SELECT workspace_id FROM profiles 
            WHERE profiles.id = auth.uid()
        )
    );

CREATE POLICY "workspace_isolation_analytics_events" ON analytics_events
    FOR ALL USING (
        workspace_id IN (
            SELECT workspace_id FROM profiles 
            WHERE profiles.id = auth.uid()
        )
    );

-- Create RLS policy for conversation messages
CREATE POLICY "workspace_isolation_conversation_messages" ON conversation_messages
    FOR ALL USING (
        conversation_id IN (
            SELECT c.id FROM conversations c
            JOIN profiles p ON p.workspace_id = c.workspace_id
            WHERE p.id = auth.uid()
        )
    );

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to all relevant tables
CREATE TRIGGER update_workspaces_updated_at BEFORE UPDATE ON workspaces
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
CREATE TRIGGER update_ai_assistants_updated_at BEFORE UPDATE ON ai_assistants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
CREATE TRIGGER update_integrations_updated_at BEFORE UPDATE ON integrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
CREATE TRIGGER update_workflows_updated_at BEFORE UPDATE ON workflows
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create demo workspace for testing
INSERT INTO workspaces (id, name, slug, subscription_tier, subscription_status) 
VALUES (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 
    'Demo Workspace', 
    'demo-workspace',
    'pro',
    'active'
)
ON CONFLICT (slug) DO NOTHING;

-- Grant permissions for authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '🎉 Sam AI Database Schema Applied Successfully!';
    RAISE NOTICE '✅ Created 12 tables: workspaces, profiles, accounts, contacts, campaigns, messages, ai_assistants, conversations, conversation_messages, integrations, workflows, analytics_events';
    RAISE NOTICE '🔐 Row Level Security enabled with workspace isolation';
    RAISE NOTICE '⚡ Performance indexes created for all tables';
    RAISE NOTICE '🔄 Automatic updated_at triggers configured';
    RAISE NOTICE '🏢 Demo workspace created: demo-workspace';
    RAISE NOTICE '📊 Sam AI 8-Stage Workflow: 100% Database Ready';
END $$;
`;

        console.log(enhancedSchema);
        console.log('─'.repeat(40));
        
        console.log('\n3. After running the schema, test with:');
        console.log('   node check-database-status.js');
        console.log('');
        
        console.log('📋 SCHEMA FEATURES:');
        console.log('• ✅ All 12 Sam AI tables included');
        console.log('• 🔐 Complete RLS policies for workspace isolation');
        console.log('• ⚡ Performance indexes for high-volume operations');
        console.log('• 🔄 Auto-updating timestamps');
        console.log('• 🏢 Demo workspace pre-configured');
        console.log('• 🎯 Optimized for Sam AI 8-stage workflow');

        // Save the enhanced schema to a file for easy access
        await fs.writeFile('COMPLETE_SAM_AI_SCHEMA.sql', enhancedSchema);
        console.log('\n💾 Schema saved to: COMPLETE_SAM_AI_SCHEMA.sql');
        
        return true;
        
    } catch (error) {
        console.error('❌ Error preparing schema:', error.message);
        return false;
    }
}

// Run the function
applyCompleteSchema()
    .then(success => {
        console.log('\n🏁 Schema preparation completed');
        console.log(success ? '✅ Ready for manual application' : '❌ Failed to prepare');
    })
    .catch(console.error);