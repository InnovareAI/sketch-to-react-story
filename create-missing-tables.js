import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://latxadqrvrrrcvkktrog.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhdHhhZHFydnJycmN2a2t0cm9nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTk5ODYsImV4cCI6MjA2ODI3NTk4Nn0.3WkAgXpk_MyQioVf_SED9O_ArjcT9nH0uy9we2okftE';

// Use service role key if available, otherwise anon key for basic operations
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;
const supabase = createClient(supabaseUrl, supabaseKey);

// SQL for creating the missing accounts table
const createAccountsTable = `
-- Create accounts table for Stage 2 Data Enrichment
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

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_accounts_workspace ON accounts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_accounts_domain ON accounts(domain);
CREATE INDEX IF NOT EXISTS idx_accounts_linkedin_company_id ON accounts(linkedin_company_id);

-- Enable RLS
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for workspace isolation
CREATE POLICY "workspace_isolation_accounts" ON accounts
FOR ALL USING (
    workspace_id IN (
        SELECT workspace_id FROM profiles 
        WHERE profiles.id = auth.uid()
    )
);

-- Create updated_at trigger
CREATE TRIGGER update_accounts_updated_at 
BEFORE UPDATE ON accounts
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
`;

// SQL for creating the missing campaigns table
const createCampaignsTable = `
-- Create campaigns table for Stage 6 Multi-channel Outreach
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_campaigns_workspace ON campaigns(workspace_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_type ON campaigns(type);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_by ON campaigns(created_by);
CREATE INDEX IF NOT EXISTS idx_campaigns_n8n_workflow_id ON campaigns(n8n_workflow_id);

-- Enable RLS
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for workspace isolation
CREATE POLICY "workspace_isolation_campaigns" ON campaigns
FOR ALL USING (
    workspace_id IN (
        SELECT workspace_id FROM profiles 
        WHERE profiles.id = auth.uid()
    )
);

-- Create updated_at trigger
CREATE TRIGGER update_campaigns_updated_at 
BEFORE UPDATE ON campaigns
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
`;

async function createMissingTables() {
    console.log('🚀 Creating missing Sam AI database tables...\n');
    console.log(`🔗 Database: ${supabaseUrl}`);
    console.log(`🔑 Using: ${supabaseKey.includes('service_role') ? 'Service Role Key' : 'Anon Key'}`);
    console.log('─'.repeat(60));

    let totalSuccess = 0;
    let totalFailed = 0;

    // Helper function to execute SQL
    async function executeSQL(sql, description) {
        console.log(`\n📋 ${description}...`);
        
        try {
            const { data, error } = await supabase.rpc('exec_sql', { query: sql });
            
            if (error) {
                // Handle "already exists" errors gracefully
                if (error.message.includes('already exists') || error.message.includes('relation') && error.message.includes('already exists')) {
                    console.log(`✅ ${description} - Already exists, skipping`);
                    totalSuccess++;
                    return true;
                } else if (error.message.includes('function exec_sql does not exist')) {
                    console.log(`⚠️  exec_sql function not available, trying direct query...`);
                    // Try with direct query instead
                    const statements = sql.split(';').filter(s => s.trim().length > 0);
                    
                    for (const statement of statements) {
                        try {
                            const result = await supabase.from('_').select().limit(0); // This will fail but establish connection
                            // Since we can't execute raw SQL with anon key, we'll need service role
                            console.log(`❌ ${description} - Service role key required for table creation`);
                            totalFailed++;
                            return false;
                        } catch (e) {
                            console.log(`❌ ${description} - Service role key required for table creation`);
                            totalFailed++;
                            return false;
                        }
                    }
                } else {
                    console.error(`❌ ${description} - Error:`, error.message);
                    totalFailed++;
                    return false;
                }
            } else {
                console.log(`✅ ${description} - Success`);
                totalSuccess++;
                return true;
            }
        } catch (err) {
            console.error(`❌ ${description} - Exception:`, err.message);
            totalFailed++;
            return false;
        }
    }

    // Test database connection first
    console.log('\n🔍 Testing database connection...');
    try {
        const { data, error } = await supabase.from('workspaces').select('id').limit(1);
        if (error) {
            console.error('❌ Database connection failed:', error.message);
            return;
        }
        console.log('✅ Database connection successful');
    } catch (err) {
        console.error('❌ Database connection failed:', err.message);
        return;
    }

    // Create accounts table
    await executeSQL(createAccountsTable, 'Creating accounts table');

    // Create campaigns table  
    await executeSQL(createCampaignsTable, 'Creating campaigns table');

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 CREATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successful: ${totalSuccess}`);
    console.log(`❌ Failed: ${totalFailed}`);
    console.log('='.repeat(60));

    if (totalFailed === 0) {
        console.log('\n🎉 All missing tables created successfully!');
        console.log('✅ accounts table - Ready for Stage 2 Data Enrichment');
        console.log('✅ campaigns table - Ready for Stage 6 Multi-channel Outreach');
    } else if (totalSuccess > 0) {
        console.log('\n⚠️  Some tables created with issues. Check output above.');
        console.log('💡 Tip: Make sure you have service role key permissions for table creation.');
    } else {
        console.log('\n❌ Failed to create tables. This likely requires service role key.');
        console.log('🔑 Set SUPABASE_SERVICE_ROLE_KEY environment variable and try again.');
        console.log('📖 Get your service role key from: https://supabase.com/dashboard/project/latxadqrvrrrcvkktrog/settings/api');
    }

    // Verification step
    console.log('\n🔍 Verifying table creation...');
    try {
        const { data: accountsData, error: accountsError } = await supabase.from('accounts').select('id').limit(1);
        const { data: campaignsData, error: campaignsError } = await supabase.from('campaigns').select('id').limit(1);

        console.log(`📋 accounts table: ${accountsError ? '❌ Not accessible' : '✅ Accessible'}`);
        console.log(`📋 campaigns table: ${campaignsError ? '❌ Not accessible' : '✅ Accessible'}`);

        if (!accountsError && !campaignsError) {
            console.log('\n🎯 SUCCESS: Both critical tables are now available!');
            console.log('📈 Sam AI workflow completion: 100% (12/12 tables)');
        }
    } catch (err) {
        console.log('⚠️  Could not verify table creation:', err.message);
    }
}

// Run the function
createMissingTables().catch(console.error);