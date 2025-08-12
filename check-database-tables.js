import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://latxadqrvrrrcvkktrog.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhdHhhZHFydnJycmN2a2t0cm9nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTk5ODYsImV4cCI6MjA2ODI3NTk4Nn0.3WkAgXpk_MyQioVf_SED9O_ArjcT9nH0uy9we2okftE'
);

console.log('🔍 Checking SAM AI Database Table Status...\n');

const tables = [
  'workspaces',
  'campaigns', 
  'contacts',
  'campaign_analytics',
  'message_templates',
  'prospect_searches',
  'linkedin_accounts',
  'n8n_workflows',
  'saved_searches',
  'brightdata_logs',
  'message_queue',
  'campaign_rules',
  'n8n_executions'
];

const existingTables = [];
const missingTables = [];

for (const table of tables) {
  try {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (!error) {
      existingTables.push(table);
      console.log(`✅ ${table}: EXISTS`);
    } else {
      missingTables.push(table);
      console.log(`❌ ${table}: MISSING - ${error.message}`);
    }
  } catch (err) {
    missingTables.push(table);
    console.log(`❌ ${table}: ERROR - ${err.message}`);
  }
}

console.log('\n' + '='.repeat(50));
console.log('📊 DATABASE STATUS SUMMARY');
console.log('='.repeat(50));
console.log(`✅ Existing Tables: ${existingTables.length}/${tables.length}`);
console.log(`❌ Missing Tables: ${missingTables.length}/${tables.length}`);
console.log(`📈 Database Coverage: ${Math.round((existingTables.length / tables.length) * 100)}%`);

if (existingTables.length > 0) {
  console.log('\n✅ EXISTING TABLES:');
  existingTables.forEach(table => console.log(`  - ${table}`));
}

if (missingTables.length > 0) {
  console.log('\n❌ MISSING TABLES:');
  missingTables.forEach(table => console.log(`  - ${table}`));
  
  console.log('\n💡 RECOMMENDATION:');
  console.log('Run the complete schema application script to create missing tables.');
}

console.log('\n='.repeat(50));