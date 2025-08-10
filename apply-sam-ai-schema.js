#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase configuration (matches React app)
const supabaseUrl = 'https://latxadqrvrrrcvkktrog.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhdHhhZHFydnJycmN2a2t0cm9nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTk5ODYsImV4cCI6MjA2ODI3NTk4Nn0.3WkAgXpk_MyQioVf_SED9O_ArjcT9nH0uy9we2okftE';

// Try to use service role key if available, otherwise use anon key
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;
const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🚀 Sam AI Database Schema Application');
console.log('=====================================\n');
console.log(`🔗 Target: ${supabaseUrl}`);
console.log(`🔑 Using: ${supabaseKey.includes('service_role') ? 'Service Role Key' : 'Anon Key'}`);
console.log(`📁 Schema: ${path.join(__dirname, 'COMPLETE_SAM_AI_SCHEMA.sql')}\n`);

async function checkCurrentTables() {
  console.log('🔍 Checking existing tables...');
  
  try {
    const { data, error } = await supabase.rpc('exec_sql', {
      query: `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN (
          'workspaces', 'profiles', 'accounts', 'contacts', 
          'campaigns', 'messages', 'ai_assistants', 'conversations', 
          'conversation_messages', 'integrations', 'workflows', 'analytics_events'
        )
        ORDER BY table_name;
      `
    });

    if (error) {
      console.log('❌ Could not check tables with RPC. Trying direct query...');
      
      // Fallback: try direct table query
      const { data: workspaces, error: wsError } = await supabase
        .from('workspaces')
        .select('count', { count: 'exact', head: true });
        
      if (!wsError) {
        console.log('✅ Some Sam AI tables already exist');
        return true;
      }
      
      console.log('📝 No Sam AI tables found - proceeding with full schema application');
      return false;
    }

    const existingTables = data.map(row => row.table_name);
    console.log(`📊 Found ${existingTables.length}/12 Sam AI tables:`);
    existingTables.forEach(table => console.log(`   ✅ ${table}`));
    
    const allTables = ['workspaces', 'profiles', 'accounts', 'contacts', 'campaigns', 'messages', 
                      'ai_assistants', 'conversations', 'conversation_messages', 'integrations', 
                      'workflows', 'analytics_events'];
    const missingTables = allTables.filter(table => !existingTables.includes(table));
    
    if (missingTables.length > 0) {
      console.log(`❓ Missing ${missingTables.length} tables:`);
      missingTables.forEach(table => console.log(`   ❌ ${table}`));
    }
    
    return existingTables.length === 12;
  } catch (err) {
    console.log('⚠️  Could not check existing tables:', err.message);
    return false;
  }
}

async function applySchema() {
  try {
    // Read the schema file
    const schemaPath = path.join(__dirname, 'COMPLETE_SAM_AI_SCHEMA.sql');
    const schema = await fs.readFile(schemaPath, 'utf8');
    
    console.log('📄 Schema file loaded successfully');
    console.log(`📏 Size: ${(schema.length / 1024).toFixed(2)} KB\n`);
    
    // Split into statements and filter out comments
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && 
                   !s.startsWith('--') && 
                   !s.match(/^\s*\/\*/) &&
                   !s.includes('\\echo'));
    
    console.log(`🔢 Processing ${statements.length} SQL statements...\n`);
    
    let successful = 0;
    let failed = 0;
    let skipped = 0;
    
    // Process statements in batches for better error handling
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim() + ';';
      const shortStatement = statement.substring(0, 50).replace(/\s+/g, ' ');
      
      try {
        // Try RPC method first (requires service role)
        const { data, error } = await supabase.rpc('exec_sql', {
          query: statement
        });
        
        if (error) {
          // Check if it's an "already exists" error (not a real failure)
          if (error.message.includes('already exists') || 
              error.message.includes('duplicate key') ||
              error.message.includes('relation') && error.message.includes('already exists')) {
            console.log(`⏭️  [${i + 1}/${statements.length}] Exists: ${shortStatement}...`);
            skipped++;
          } else if (error.message.includes('permission denied') || 
                    error.message.includes('insufficient_privilege')) {
            console.log(`🔒 [${i + 1}/${statements.length}] Permission denied - using anon key`);
            console.log('💡 Set SUPABASE_SERVICE_ROLE_KEY for full schema application');
            failed++;
          } else {
            console.error(`❌ [${i + 1}/${statements.length}] Error: ${error.message}`);
            failed++;
          }
        } else {
          console.log(`✅ [${i + 1}/${statements.length}] Applied: ${shortStatement}...`);
          successful++;
        }
      } catch (err) {
        console.error(`💥 [${i + 1}/${statements.length}] Exception: ${err.message}`);
        failed++;
      }
      
      // Add small delay to avoid rate limiting
      if (i % 10 === 0 && i > 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    // Final summary
    console.log('\n' + '='.repeat(70));
    console.log('📊 SCHEMA APPLICATION SUMMARY');
    console.log('='.repeat(70));
    console.log(`✅ Successful:  ${successful}`);
    console.log(`❌ Failed:      ${failed}`);
    console.log(`⏭️  Skipped:     ${skipped}`);
    console.log(`📝 Total:       ${statements.length}`);
    console.log('='.repeat(70));
    
    if (failed === 0) {
      console.log('\n🎉 Sam AI database schema applied successfully!');
      console.log('📋 Next steps:');
      console.log('   1. Verify tables were created');
      console.log('   2. Test multi-tenant isolation');
      console.log('   3. Create initial test data');
    } else if (successful > 0) {
      console.log('\n⚠️  Schema partially applied. Some statements failed.');
      console.log('💡 Try running with SUPABASE_SERVICE_ROLE_KEY for full access.');
    } else {
      console.log('\n❌ Schema application failed. Check permissions and connection.');
    }
    
  } catch (error) {
    console.error('\n💥 Critical error during schema application:');
    console.error(error);
    process.exit(1);
  }
}

async function verifySchema() {
  console.log('\n🔍 Verifying schema application...');
  
  const samAiTables = [
    'workspaces', 'profiles', 'accounts', 'contacts',
    'campaigns', 'messages', 'ai_assistants', 'conversations',
    'conversation_messages', 'integrations', 'workflows', 'analytics_events'
  ];
  
  let verifiedTables = 0;
  
  for (const tableName of samAiTables) {
    try {
      const { error } = await supabase
        .from(tableName)
        .select('count', { count: 'exact', head: true });
        
      if (!error) {
        console.log(`✅ Table verified: ${tableName}`);
        verifiedTables++;
      } else {
        console.log(`❌ Table missing: ${tableName}`);
      }
    } catch (err) {
      console.log(`❓ Table check failed: ${tableName} (${err.message})`);
    }
  }
  
  console.log(`\n📊 Schema verification: ${verifiedTables}/${samAiTables.length} tables confirmed`);
  
  if (verifiedTables === samAiTables.length) {
    console.log('🎉 All Sam AI tables are present and accessible!');
    return true;
  } else {
    console.log('⚠️  Some tables are missing or inaccessible.');
    return false;
  }
}

// Main execution
async function main() {
  try {
    // Check current state
    const hasAllTables = await checkCurrentTables();
    
    if (hasAllTables) {
      console.log('✅ All Sam AI tables already exist. Skipping schema application.');
      const verified = await verifySchema();
      if (verified) {
        console.log('\n🎉 Sam AI database is ready for use!');
        process.exit(0);
      }
    }
    
    console.log('\n🚀 Applying Sam AI schema...');
    await applySchema();
    
    console.log('\n🔍 Final verification...');
    await verifySchema();
    
  } catch (error) {
    console.error('\n💥 Application failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { applySchema, verifySchema, checkCurrentTables };