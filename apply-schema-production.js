#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';

// Production Supabase Configuration
const supabaseUrl = 'https://latxadqrvrrrcvkktrog.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhdHhhZHFydnJycmN2a2t0cm9nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTk5ODYsImV4cCI6MjA2ODI3NTk4Nn0.3WkAgXpk_MyQioVf_SED9O_ArjcT9nH0uy9we2okftE';

console.log('🚀 Applying Sam AI Database Schema to Production Database');
console.log('='.repeat(70));
console.log(`🌐 Target: ${supabaseUrl}`);
console.log(`📄 Schema: COMPLETE_SAM_AI_SCHEMA.sql`);
console.log('='.repeat(70));

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function applySchemaToProduction() {
    try {
        console.log('\n📖 Reading complete schema file...');
        const schemaContent = await fs.readFile('COMPLETE_SAM_AI_SCHEMA.sql', 'utf8');
        console.log(`✅ Schema file loaded (${(schemaContent.length / 1024).toFixed(2)} KB)`);

        console.log('\n🔍 Checking current database state...');
        
        // Test basic connection
        const { data: testData, error: testError } = await supabase
            .from('information_schema.tables')
            .select('table_name')
            .limit(1);
        
        if (testError) {
            console.error('❌ Database connection failed:', testError.message);
            return false;
        }
        
        console.log('✅ Database connection successful');

        // Check existing tables
        const { data: existingTables, error: tablesError } = await supabase.rpc('sql', {
            query: `SELECT table_name FROM information_schema.tables 
                   WHERE table_schema = 'public' 
                   AND table_name IN ('workspaces', 'profiles', 'accounts', 'contacts', 'campaigns', 'messages', 'ai_assistants', 'conversations', 'conversation_messages', 'integrations', 'workflows', 'analytics_events')
                   ORDER BY table_name;`
        });

        if (tablesError) {
            console.log('ℹ️  Cannot check existing tables with anon key (expected)');
        } else {
            console.log(`📊 Found ${existingTables?.length || 0} existing Sam AI tables`);
        }

        console.log('\n⚠️  MANUAL SCHEMA APPLICATION REQUIRED');
        console.log('Due to security constraints, the schema must be applied manually.');
        console.log('\n📋 STEP-BY-STEP INSTRUCTIONS:');
        console.log('─'.repeat(50));
        
        console.log('\n1. 🌐 Open Supabase SQL Editor:');
        console.log('   https://supabase.com/dashboard/project/latxadqrvrrrcvkktrog/sql/new');
        
        console.log('\n2. 📋 Copy the complete schema from:');
        console.log('   COMPLETE_SAM_AI_SCHEMA.sql');
        
        console.log('\n3. ▶️  Paste and execute the schema');
        
        console.log('\n4. ✅ Verify success with:');
        console.log('   node check-database-status.js');

        // Create a minimal verification script
        const verificationScript = `#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

const supabase = createClient('${supabaseUrl}', '${supabaseAnonKey}');

async function verifySchema() {
    console.log('🔍 Verifying Sam AI Database Schema...');
    
    const requiredTables = [
        'workspaces', 'profiles', 'accounts', 'contacts', 'campaigns', 
        'messages', 'ai_assistants', 'conversations', 'conversation_messages', 
        'integrations', 'workflows', 'analytics_events'
    ];
    
    let foundTables = 0;
    
    for (const table of requiredTables) {
        try {
            const { data, error } = await supabase.from(table).select('*').limit(1);
            if (!error) {
                console.log(\`✅ \${table} - OK\`);
                foundTables++;
            } else {
                console.log(\`❌ \${table} - Missing or no access\`);
            }
        } catch (e) {
            console.log(\`❌ \${table} - Error: \${e.message}\`);
        }
    }
    
    console.log(\`\\n📊 Result: \${foundTables}/\${requiredTables.length} tables verified\`);
    
    if (foundTables === requiredTables.length) {
        console.log('🎉 Sam AI Database Schema: 100% Complete!');
        return true;
    } else {
        console.log('⚠️  Schema incomplete. Please apply the complete schema.');
        return false;
    }
}

verifySchema().catch(console.error);`;

        await fs.writeFile('verify-schema.js', verificationScript);
        console.log('\n💾 Created verification script: verify-schema.js');

        console.log('\n📊 SCHEMA COMPONENTS TO BE APPLIED:');
        console.log('• 🏗️  12 core tables for Sam AI workflow');
        console.log('• 🔐 Complete Row Level Security (RLS) policies');
        console.log('• ⚡ Performance indexes for all tables');
        console.log('• 🔄 Automatic updated_at triggers');
        console.log('• 🏢 Demo workspace for testing');
        console.log('• 🎯 Multi-tenant workspace isolation');

        console.log('\n📋 SAM AI 8-STAGE WORKFLOW SUPPORT:');
        console.log('• Stage 1: Lead Scraping (contacts table)');
        console.log('• Stage 2: Data Enrichment (accounts table)');
        console.log('• Stage 3: Knowledge Base RAG (ai_assistants table)');
        console.log('• Stage 4: ICP Matching (qualification data in contacts)');
        console.log('• Stage 5: Personalization (messages table)');
        console.log('• Stage 6: Multi-channel Outreach (campaigns table)');
        console.log('• Stage 7: Response Handling (conversations table)');
        console.log('• Stage 8: Follow-up Automation (workflows table)');

        return true;
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        return false;
    }
}

// Run the function
applySchemaToProduction()
    .then(success => {
        console.log('\n🏁 Schema Application Preparation Complete');
        console.log(success ? '✅ Instructions provided for manual application' : '❌ Setup failed');
        console.log('\n🔄 Next Steps:');
        console.log('1. Apply schema manually in Supabase SQL Editor');
        console.log('2. Run: node verify-schema.js');
        console.log('3. Test with: node check-database-status.js');
    })
    .catch(console.error);