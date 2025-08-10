#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://latxadqrvrrrcvkktrog.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhdHhhZHFydnJycmN2a2t0cm9nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTk5ODYsImV4cCI6MjA2ODI3NTk4Nn0.3WkAgXpk_MyQioVf_SED9O_ArjcT9nH0uy9we2okftE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('🔍 Checking Sam AI Tables Status');
console.log('=================================\n');

const samAiTables = [
  'workspaces', 'profiles', 'accounts', 'contacts',
  'campaigns', 'messages', 'ai_assistants', 'conversations',
  'conversation_messages', 'integrations', 'workflows', 'analytics_events'
];

async function checkTable(tableName) {
  try {
    const { data, error, count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });
      
    if (error) {
      if (error.message.includes('does not exist') || 
          error.message.includes('relation') && error.message.includes('does not exist')) {
        return { exists: false, error: 'Table does not exist' };
      } else if (error.message.includes('permission denied')) {
        return { exists: true, error: 'Permission denied (RLS active)', accessible: false };
      } else {
        return { exists: false, error: error.message };
      }
    }
    
    return { exists: true, accessible: true, count: count || 0 };
  } catch (err) {
    return { exists: false, error: err.message };
  }
}

async function main() {
  const results = {};
  
  for (const tableName of samAiTables) {
    console.log(`Checking ${tableName}...`);
    const result = await checkTable(tableName);
    results[tableName] = result;
    
    if (result.exists && result.accessible) {
      console.log(`✅ ${tableName}: EXISTS (${result.count} rows)`);
    } else if (result.exists && !result.accessible) {
      console.log(`🔒 ${tableName}: EXISTS but not accessible (${result.error})`);
    } else {
      console.log(`❌ ${tableName}: MISSING (${result.error})`);
    }
  }
  
  console.log('\n📊 Summary:');
  const existing = Object.values(results).filter(r => r.exists).length;
  const accessible = Object.values(results).filter(r => r.exists && r.accessible).length;
  const missing = Object.values(results).filter(r => !r.exists).length;
  
  console.log(`✅ Existing: ${existing}/12`);
  console.log(`🔓 Accessible: ${accessible}/12`);
  console.log(`❌ Missing: ${missing}/12`);
  
  // List missing tables
  const missingTables = samAiTables.filter(table => !results[table].exists);
  if (missingTables.length > 0) {
    console.log('\n❌ Missing tables:');
    missingTables.forEach(table => console.log(`   - ${table}`));
  }
  
  // List inaccessible tables
  const inaccessibleTables = samAiTables.filter(table => results[table].exists && !results[table].accessible);
  if (inaccessibleTables.length > 0) {
    console.log('\n🔒 Tables with RLS restrictions:');
    inaccessibleTables.forEach(table => console.log(`   - ${table}`));
  }
  
  if (missing === 0) {
    console.log('\n🎉 All Sam AI tables exist!');
    if (accessible < existing) {
      console.log('⚠️  Some tables have RLS enabled - this is expected for security');
    }
  } else {
    console.log(`\n⚠️  ${missing} tables need to be created`);
  }
}

main().catch(console.error);