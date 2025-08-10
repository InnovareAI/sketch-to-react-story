#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://latxadqrvrrrcvkktrog.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhdHhhZHFydnJycmN2a2t0cm9nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTk5ODYsImV4cCI6MjA2ODI3NTk4Nn0.3WkAgXpk_MyQioVf_SED9O_ArjcT9nH0uy9we2okftE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('🚀 Creating Missing Sam AI Tables');
console.log('==================================\n');

// SQL for accounts table
const accountsTableSQL = `
CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
);`;

// SQL for campaigns table  
const campaignsTableSQL = `
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
);`;

// SQL for indexes
const indexSQL = `
CREATE INDEX IF NOT EXISTS idx_accounts_workspace ON accounts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_accounts_domain ON accounts(domain);
CREATE INDEX IF NOT EXISTS idx_accounts_linkedin_company_id ON accounts(linkedin_company_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_workspace ON campaigns(workspace_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_type ON campaigns(type);
CREATE INDEX IF NOT EXISTS idx_campaigns_n8n_workflow_id ON campaigns(n8n_workflow_id);`;

// SQL for RLS policies
const rlsSQL = `
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspace_isolation_accounts" ON accounts
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
    );`;

// SQL for updated_at triggers
const triggersSQL = `
CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();`;

async function executeSQL(description, sql) {
  console.log(`📝 ${description}...`);
  
  try {
    // Try to create edge function approach
    const response = await fetch(`${supabaseUrl}/functions/v1/execute-sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`
      },
      body: JSON.stringify({ sql })
    });
    
    if (response.ok) {
      console.log(`✅ ${description} - Success via Edge Function`);
      return true;
    } else {
      console.log(`⚠️  ${description} - Edge Function not available, trying direct approach`);
    }
  } catch (err) {
    console.log(`⚠️  ${description} - Edge Function failed: ${err.message}`);
  }
  
  // If edge function doesn't work, we need to guide user to manual creation
  console.log(`📋 ${description} - SQL ready for manual execution`);
  return false;
}

async function createTables() {
  console.log('🏗️  Creating missing tables...\n');
  
  const success = await Promise.all([
    executeSQL('Creating accounts table', accountsTableSQL),
    executeSQL('Creating campaigns table', campaignsTableSQL),
    executeSQL('Creating indexes', indexSQL),
    executeSQL('Enabling RLS and policies', rlsSQL),
    executeSQL('Creating triggers', triggersSQL)
  ]);
  
  const successCount = success.filter(s => s).length;
  
  if (successCount === success.length) {
    console.log('\n🎉 All missing tables created successfully!');
    return true;
  } else {
    console.log(`\n⚠️  Automatic creation failed. Manual SQL execution required.`);
    return false;
  }
}

async function generateManualSQL() {
  console.log('\n📋 MANUAL SQL EXECUTION REQUIRED');
  console.log('='.repeat(50));
  console.log('Please execute the following SQL in your Supabase SQL Editor:');
  console.log('(Dashboard → SQL Editor → New Query → Paste and Run)');
  console.log('='.repeat(50));
  
  const fullSQL = `
-- Sam AI Missing Tables Creation
-- Execute this in Supabase SQL Editor

-- Create accounts table
${accountsTableSQL}

-- Create campaigns table  
${campaignsTableSQL}

-- Create performance indexes
${indexSQL}

-- Enable Row Level Security and create policies
${rlsSQL}

-- Create updated_at triggers
${triggersSQL}

-- Verify creation
SELECT 'accounts' as table_name, count(*) as rows FROM accounts
UNION ALL
SELECT 'campaigns' as table_name, count(*) as rows FROM campaigns;
`;
  
  console.log(fullSQL);
  console.log('='.repeat(50));
  console.log('After running the SQL, run: node check-missing-tables.js');
  console.log('='.repeat(50));
}

async function main() {
  const success = await createTables();
  
  if (!success) {
    await generateManualSQL();
    
    console.log('\n🔗 Supabase SQL Editor URL:');
    console.log(`https://supabase.com/dashboard/project/${supabaseUrl.split('//')[1].split('.')[0]}/sql/new`);
    
    console.log('\n📝 Steps to complete setup:');
    console.log('1. Copy the SQL above');
    console.log('2. Open Supabase Dashboard → SQL Editor → New Query');
    console.log('3. Paste and execute the SQL');
    console.log('4. Run: node check-missing-tables.js to verify');
  } else {
    console.log('\n✅ Running verification...');
    
    // Import and run the check script
    const { execSync } = await import('child_process');
    try {
      execSync('node check-missing-tables.js', { stdio: 'inherit' });
    } catch (err) {
      console.log('⚠️  Verification script not found, please run manually');
    }
  }
}

main().catch(console.error);