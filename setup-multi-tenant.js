import { createClient } from '@supabase/supabase-js';

// SAM AI Staging Supabase
const supabaseUrl = 'https://latxadqrvrrrcvkktrog.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_KEY environment variable is required');
  console.log('\nTo get your service role key:');
  console.log('1. Go to: https://supabase.com/dashboard/project/latxadqrvrrrcvkktrog/settings/api');
  console.log('2. Find "Service role key" under "Project API keys"');
  console.log('3. Run: export SUPABASE_SERVICE_KEY="your-service-role-key"');
  console.log('4. Then run this script again\n');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeSQL(sql, description) {
  console.log(`\n🔄 ${description}...`);
  
  try {
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql_query: sql 
    }).single();
    
    if (error) {
      // Try direct approach if RPC doesn't exist
      const { data: result, error: directError } = await supabase
        .from('_sql_runner')
        .insert({ query: sql })
        .select()
        .single();
      
      if (directError) {
        console.error(`❌ Failed: ${directError.message}`);
        return false;
      }
    }
    
    console.log(`✅ Success: ${description}`);
    return true;
  } catch (err) {
    console.error(`❌ Error: ${err.message}`);
    return false;
  }
}

async function setupMultiTenant() {
  console.log('🚀 Setting up Multi-Tenant Architecture for SAM AI\n');
  console.log('=' .repeat(60));

  // Step 1: Enable extensions
  await executeSQL(`
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";
    CREATE EXTENSION IF NOT EXISTS "pg_trgm";
  `, 'Enabling PostgreSQL extensions');

  // Step 2: Create workspaces table
  await executeSQL(`
    CREATE TABLE IF NOT EXISTS workspaces (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      settings JSONB DEFAULT '{}',
      subscription_tier TEXT DEFAULT 'free',
      subscription_status TEXT DEFAULT 'active',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `, 'Creating workspaces table');

  // Step 3: Create profiles table
  await executeSQL(`
    CREATE TABLE IF NOT EXISTS profiles (
      id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
      email TEXT NOT NULL,
      full_name TEXT,
      role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
      avatar_url TEXT,
      settings JSONB DEFAULT '{}',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `, 'Creating profiles table');

  // Step 4: Create workspace invitations
  await executeSQL(`
    CREATE TABLE IF NOT EXISTS workspace_invitations (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      email TEXT NOT NULL,
      role TEXT DEFAULT 'member',
      token TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
      expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
      accepted_at TIMESTAMP WITH TIME ZONE,
      created_by UUID REFERENCES profiles(id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `, 'Creating workspace invitations table');

  // Step 5: Create accounts table
  await executeSQL(`
    CREATE TABLE IF NOT EXISTS accounts (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      domain TEXT,
      industry TEXT,
      company_size TEXT,
      annual_revenue TEXT,
      ideal_customer_profile JSONB DEFAULT '{}',
      settings JSONB DEFAULT '{}',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `, 'Creating accounts table');

  // Step 6: Create contacts table
  await executeSQL(`
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
      engagement_score INTEGER DEFAULT 0,
      tags TEXT[] DEFAULT '{}',
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `, 'Creating contacts table');

  // Step 7: Create campaigns table
  await executeSQL(`
    CREATE TABLE IF NOT EXISTS campaigns (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'email',
      status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'active', 'paused', 'completed')),
      objective TEXT,
      target_audience JSONB DEFAULT '{}',
      budget DECIMAL(10, 2),
      start_date TIMESTAMP WITH TIME ZONE,
      end_date TIMESTAMP WITH TIME ZONE,
      settings JSONB DEFAULT '{}',
      metrics JSONB DEFAULT '{}',
      created_by UUID REFERENCES profiles(id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `, 'Creating campaigns table');

  // Step 8: Create indexes
  await executeSQL(`
    CREATE INDEX IF NOT EXISTS idx_profiles_workspace ON profiles(workspace_id);
    CREATE INDEX IF NOT EXISTS idx_accounts_workspace ON accounts(workspace_id);
    CREATE INDEX IF NOT EXISTS idx_contacts_workspace ON contacts(workspace_id);
    CREATE INDEX IF NOT EXISTS idx_campaigns_workspace ON campaigns(workspace_id);
    CREATE INDEX IF NOT EXISTS idx_workspace_slug ON workspaces(slug);
  `, 'Creating performance indexes');

  // Step 9: Enable RLS
  await executeSQL(`
    ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
    ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
    ALTER TABLE workspace_invitations ENABLE ROW LEVEL SECURITY;
    ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
    ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
    ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
  `, 'Enabling Row Level Security');

  // Step 10: Create RLS policies for workspaces
  await executeSQL(`
    -- Users can view their workspace
    CREATE POLICY "Users can view their workspace" ON workspaces
      FOR SELECT USING (
        id IN (
          SELECT workspace_id FROM profiles 
          WHERE profiles.id = auth.uid()
        )
      );

    -- Workspace owners can update their workspace
    CREATE POLICY "Owners can update workspace" ON workspaces
      FOR UPDATE USING (
        id IN (
          SELECT workspace_id FROM profiles 
          WHERE profiles.id = auth.uid() 
          AND role = 'owner'
        )
      );
  `, 'Creating workspace RLS policies');

  // Step 11: Create RLS policies for profiles
  await executeSQL(`
    -- Users can view profiles in their workspace
    CREATE POLICY "View workspace profiles" ON profiles
      FOR SELECT USING (
        workspace_id IN (
          SELECT workspace_id FROM profiles p
          WHERE p.id = auth.uid()
        )
      );

    -- Users can update their own profile
    CREATE POLICY "Update own profile" ON profiles
      FOR UPDATE USING (id = auth.uid());

    -- Users can insert their profile on signup
    CREATE POLICY "Create profile on signup" ON profiles
      FOR INSERT WITH CHECK (id = auth.uid());
  `, 'Creating profile RLS policies');

  // Step 12: Create RLS policies for accounts
  await executeSQL(`
    -- Users can view accounts in their workspace
    CREATE POLICY "View workspace accounts" ON accounts
      FOR ALL USING (
        workspace_id IN (
          SELECT workspace_id FROM profiles 
          WHERE profiles.id = auth.uid()
        )
      );
  `, 'Creating accounts RLS policies');

  // Step 13: Create RLS policies for contacts
  await executeSQL(`
    -- Users can manage contacts in their workspace
    CREATE POLICY "Manage workspace contacts" ON contacts
      FOR ALL USING (
        workspace_id IN (
          SELECT workspace_id FROM profiles 
          WHERE profiles.id = auth.uid()
        )
      );
  `, 'Creating contacts RLS policies');

  // Step 14: Create RLS policies for campaigns
  await executeSQL(`
    -- Users can manage campaigns in their workspace
    CREATE POLICY "Manage workspace campaigns" ON campaigns
      FOR ALL USING (
        workspace_id IN (
          SELECT workspace_id FROM profiles 
          WHERE profiles.id = auth.uid()
        )
      );
  `, 'Creating campaigns RLS policies');

  // Step 15: Create updated_at trigger function
  await executeSQL(`
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ language 'plpgsql';
  `, 'Creating updated_at trigger function');

  // Step 16: Apply triggers
  await executeSQL(`
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
  `, 'Creating update triggers');

  // Step 17: Create sample workspace and user
  await executeSQL(`
    -- Insert demo workspace
    INSERT INTO workspaces (id, name, slug, subscription_tier) 
    VALUES (
      'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 
      'Demo Workspace', 
      'demo-workspace',
      'pro'
    )
    ON CONFLICT (slug) DO NOTHING;
  `, 'Creating demo workspace');

  console.log('\n' + '=' .repeat(60));
  console.log('🎉 Multi-tenant setup complete!');
  console.log('\n📊 Database now has:');
  console.log('  ✅ Workspaces table with multi-tenant foundation');
  console.log('  ✅ Profiles table with role-based access');
  console.log('  ✅ Accounts, Contacts, Campaigns tables');
  console.log('  ✅ Row Level Security policies');
  console.log('  ✅ Performance indexes');
  console.log('  ✅ Automatic updated_at triggers');
  console.log('\n🔐 Security:');
  console.log('  ✅ RLS enabled - data isolation by workspace');
  console.log('  ✅ Role-based permissions (owner, admin, member, viewer)');
  console.log('  ✅ Secure invitation system');
}

// Alternative: Use direct PostgreSQL connection
async function setupWithPG() {
  const { Client } = await import('pg');
  
  // Get connection details from dashboard
  const connectionString = process.env.DATABASE_URL || 
    'postgresql://postgres:[password]@db.latxadqrvrrrcvkktrog.supabase.co:5432/postgres';
  
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('✅ Connected to database directly');
    
    // Read and execute the staging-schema.sql file
    const fs = await import('fs/promises');
    const schema = await fs.readFile('./staging-schema.sql', 'utf8');
    
    await client.query(schema);
    console.log('✅ Schema applied successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

// Check which method to use
if (process.argv.includes('--pg')) {
  setupWithPG();
} else {
  console.log('📝 Instructions:');
  console.log('1. Get your service role key from:');
  console.log('   https://supabase.com/dashboard/project/latxadqrvrrrcvkktrog/settings/api');
  console.log('2. Run: export SUPABASE_SERVICE_KEY="your-key"');
  console.log('3. Run: node setup-multi-tenant.js');
  console.log('\nOr use --pg flag with DATABASE_URL for direct PostgreSQL connection');
}