import { createClient } from '@supabase/supabase-js';

// Use environment variables or hardcode for testing
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://mvpgnfnwlxgqtbvxgtka.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12cGduZm53bHhncXRidnhndGthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM5NzI4NDksImV4cCI6MjA0OTU0ODg0OX0.fK8M-d8EEpwYaL0zj8zWsNaEOPIAMfgN5bIlgRHPJZ0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testVoucherSetup() {
  console.log('🔍 Testing voucher codes table...');
  
  try {
    // Test if voucher_codes table exists
    const { data: voucherData, error: voucherError } = await supabase
      .from('voucher_codes')
      .select('*')
      .limit(1);
      
    if (voucherError) {
      console.log('❌ Voucher codes table does not exist:', voucherError.message);
      return false;
    }
    
    console.log('✅ Voucher codes table exists');
    
    // Test if owner_id column exists in workspaces
    const { data: workspaceData, error: workspaceError } = await supabase
      .from('workspaces')
      .select('owner_id')
      .limit(1);
      
    if (workspaceError) {
      console.log('❌ owner_id column missing from workspaces:', workspaceError.message);
      return false;
    }
    
    console.log('✅ Workspaces table has owner_id column');
    
    // Test if voucher_code_used column exists in profiles
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('voucher_code_used')
      .limit(1);
      
    if (profileError) {
      console.log('❌ voucher_code_used column missing from profiles:', profileError.message);
      return false;
    }
    
    console.log('✅ Profiles table has voucher_code_used column');
    
    // Check if we have sample voucher codes
    const { data: sampleVouchers, error: sampleError } = await supabase
      .from('voucher_codes')
      .select('*');
      
    if (sampleError) {
      console.log('❌ Error querying voucher codes:', sampleError.message);
      return false;
    }
    
    console.log(`✅ Found ${sampleVouchers.length} voucher codes in database`);
    console.log('Sample vouchers:', sampleVouchers.map(v => `${v.code} (${v.email})`));
    
    return true;
    
  } catch (err) {
    console.error('❌ Test failed:', err);
    return false;
  }
}

async function runMigrationIfNeeded() {
  const schemaReady = await testVoucherSetup();
  
  if (!schemaReady) {
    console.log('🚀 Schema not ready, attempting to apply migration...');
    
    // Try to create the voucher_codes table directly
    try {
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS public.voucher_codes (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          code TEXT UNIQUE NOT NULL,
          email TEXT NOT NULL,
          description TEXT,
          max_uses INTEGER DEFAULT 1,
          used_count INTEGER DEFAULT 0,
          is_active BOOLEAN DEFAULT TRUE,
          expires_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `;
      
      const { error: createError } = await supabase.rpc('exec_sql', { 
        sql: createTableSQL 
      });
      
      if (createError) {
        console.log('❌ Failed to create table with exec_sql:', createError.message);
        
        // Try alternative approach - use a Supabase function
        const { error: insertError } = await supabase
          .from('voucher_codes')
          .insert([
            { code: 'BETA-TL-2025', email: 'tl@innovareai.com', description: 'Beta access for TL' },
            { code: 'CLIENT-DEMO-001', email: 'demo@client1.com', description: 'Demo access for client 1' }
          ]);
          
        if (insertError) {
          console.log('❌ Table creation failed completely:', insertError.message);
        } else {
          console.log('✅ Voucher codes table created and populated');
        }
      } else {
        console.log('✅ Table created successfully');
      }
      
    } catch (err) {
      console.error('❌ Migration failed:', err);
    }
  } else {
    console.log('✅ Database schema is ready!');
  }
}

runMigrationIfNeeded();