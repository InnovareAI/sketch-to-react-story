import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://latxadqrvrrrcvkktrog.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhdHhhZHFydnJycmN2a2t0cm9nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTk5ODYsImV4cCI6MjA2ODI3NTk4Nn0.3WkAgXpk_MyQioVf_SED9O_ArjcT9nH0uy9we2okftE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkDatabaseStatus() {
    console.log('🔍 Sam AI Database Status Check');
    console.log('='.repeat(50));
    console.log(`🌐 URL: ${supabaseUrl}`);
    console.log(`🔑 Key: ${supabaseAnonKey.substring(0, 20)}...`);
    console.log('='.repeat(50));

    // List of tables to check
    const expectedTables = [
        'workspaces',
        'profiles',
        'accounts',      // Missing
        'contacts',
        'campaigns',     // Missing
        'messages',
        'ai_assistants',
        'conversations',
        'conversation_messages',
        'integrations',
        'workflows',
        'analytics_events'
    ];

    console.log('\n📊 Checking table existence...\n');

    let existingTables = 0;
    let missingTables = 0;

    for (const tableName of expectedTables) {
        try {
            const { data, error } = await supabase.from(tableName).select('*').limit(1);
            
            if (error) {
                if (error.message.includes('does not exist')) {
                    console.log(`❌ ${tableName.padEnd(20)} - Does not exist`);
                    missingTables++;
                } else if (error.message.includes('permission denied') || error.message.includes('RLS')) {
                    console.log(`🔒 ${tableName.padEnd(20)} - Exists (RLS protected)`);
                    existingTables++;
                } else {
                    console.log(`⚠️  ${tableName.padEnd(20)} - Error: ${error.message}`);
                }
            } else {
                const recordCount = data ? data.length : 0;
                console.log(`✅ ${tableName.padEnd(20)} - Exists (${recordCount} records)`);
                existingTables++;
            }
        } catch (err) {
            console.log(`💥 ${tableName.padEnd(20)} - Exception: ${err.message}`);
        }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📈 DATABASE SUMMARY');
    console.log('='.repeat(50));
    console.log(`✅ Existing tables: ${existingTables}/${expectedTables.length}`);
    console.log(`❌ Missing tables: ${missingTables}/${expectedTables.length}`);
    console.log(`📊 Completion: ${Math.round((existingTables / expectedTables.length) * 100)}%`);
    console.log('='.repeat(50));

    if (missingTables === 0) {
        console.log('\n🎉 All required tables exist! Database is ready for Sam AI.');
    } else {
        console.log(`\n⚠️  ${missingTables} critical tables are missing.`);
        console.log('🛠️  Run the schema creation script to complete setup.');
    }

    // Test basic connection
    console.log('\n🔗 Testing basic connectivity...');
    try {
        const { data, error } = await supabase.auth.getSession();
        console.log('✅ Supabase client initialized successfully');
        console.log(`🔐 Auth state: ${data.session ? 'Authenticated' : 'Anonymous'}`);
    } catch (err) {
        console.log('❌ Supabase client error:', err.message);
    }

    return {
        existingTables,
        missingTables,
        totalTables: expectedTables.length,
        completionPercentage: Math.round((existingTables / expectedTables.length) * 100)
    };
}

// Run the check
checkDatabaseStatus()
    .then(result => {
        console.log('\n🏁 Check completed.');
        process.exit(result.missingTables > 0 ? 1 : 0);
    })
    .catch(err => {
        console.error('💥 Check failed:', err);
        process.exit(1);
    });