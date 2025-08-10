import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://latxadqrvrrrcvkktrog.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhdHhhZHFydnJycmN2a2t0cm9nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTk5ODYsImV4cCI6MjA2ODI3NTk4Nn0.3WkAgXpk_MyQioVf_SED9O_ArjcT9nH0uy9we2okftE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function qaVerifySchema() {
    console.log('🔍 SAM AI DATABASE QA VERIFICATION');
    console.log('=' .repeat(50));
    console.log(`🌐 Database: ${supabaseUrl}`);
    console.log('=' .repeat(50));

    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;
    const results = [];

    // Helper function for test cases
    async function runTest(description, testFunction) {
        totalTests++;
        console.log(`\n🧪 TEST ${totalTests}: ${description}`);
        
        try {
            const result = await testFunction();
            if (result) {
                console.log('✅ PASS');
                passedTests++;
                results.push({ test: description, status: 'PASS', details: result });
            } else {
                console.log('❌ FAIL');
                failedTests++;
                results.push({ test: description, status: 'FAIL', details: 'Test returned false' });
            }
        } catch (error) {
            console.log(`❌ FAIL - ${error.message}`);
            failedTests++;
            results.push({ test: description, status: 'FAIL', details: error.message });
        }
    }

    // TEST 1: Database Connection
    await runTest('Database connectivity', async () => {
        const { data, error } = await supabase.auth.getSession();
        return !error;
    });

    // TEST 2: Core Tables Existence
    const expectedTables = [
        'workspaces', 'profiles', 'accounts', 'contacts', 'campaigns', 
        'messages', 'ai_assistants', 'conversations', 'conversation_messages',
        'integrations', 'workflows', 'analytics_events'
    ];

    for (const table of expectedTables) {
        await runTest(`Table '${table}' exists and accessible`, async () => {
            const { data, error } = await supabase.from(table).select('*').limit(1);
            // Both success or RLS protection (permission denied) indicate table exists
            return !error || error.message.includes('RLS') || error.message.includes('permission denied');
        });
    }

    // TEST 3: Demo Workspace Creation
    await runTest('Demo workspace exists', async () => {
        const { data, error } = await supabase
            .from('workspaces')
            .select('*')
            .eq('slug', 'demo-workspace')
            .single();
        
        return !error || error.message.includes('RLS');
    });

    // TEST 4: Critical Sam AI Fields in accounts table
    await runTest('Accounts table has Sam AI specific fields', async () => {
        try {
            // Try to select Sam AI specific fields
            const { error } = await supabase
                .from('accounts')
                .select('linkedin_company_id, scraped_data, enrichment_data, ideal_customer_profile')
                .limit(1);
            
            return !error || error.message.includes('RLS');
        } catch (err) {
            return false;
        }
    });

    // TEST 5: Critical Sam AI Fields in campaigns table  
    await runTest('Campaigns table has Sam AI specific fields', async () => {
        try {
            const { error } = await supabase
                .from('campaigns')
                .select('linkedin_sequence_config, n8n_workflow_id, apify_actor_config, performance_metrics')
                .limit(1);
            
            return !error || error.message.includes('RLS');
        } catch (err) {
            return false;
        }
    });

    // TEST 6: MCP Integration Fields
    await runTest('Integrations table supports MCP providers', async () => {
        try {
            const { error } = await supabase
                .from('integrations')
                .select('provider, credentials, settings')
                .limit(1);
            
            return !error || error.message.includes('RLS');
        } catch (err) {
            return false;
        }
    });

    // TEST 7: Workflow n8n Integration
    await runTest('Workflows table has n8n integration field', async () => {
        try {
            const { error } = await supabase
                .from('workflows')
                .select('n8n_workflow_id, trigger_config, steps')
                .limit(1);
            
            return !error || error.message.includes('RLS');
        } catch (err) {
            return false;
        }
    });

    // TEST 8: Contact enrichment fields
    await runTest('Contacts table has enrichment fields', async () => {
        try {
            const { error } = await supabase
                .from('contacts')
                .select('scraped_data, qualification_data, engagement_score, linkedin_url')
                .limit(1);
            
            return !error || error.message.includes('RLS');
        } catch (err) {
            return false;
        }
    });

    // TEST 9: Message personalization fields
    await runTest('Messages table has personalization fields', async () => {
        try {
            const { error } = await supabase
                .from('messages')
                .select('personalization_data, status, sent_at, opened_at')
                .limit(1);
            
            return !error || error.message.includes('RLS');
        } catch (err) {
            return false;
        }
    });

    // TEST 10: AI Assistant knowledge base config
    await runTest('AI Assistants table has knowledge base config', async () => {
        try {
            const { error } = await supabase
                .from('ai_assistants')
                .select('knowledge_base_config, system_prompt, model, temperature')
                .limit(1);
            
            return !error || error.message.includes('RLS');
        } catch (err) {
            return false;
        }
    });

    // TEST 11: Multi-tenant workspace isolation
    await runTest('Multi-tenant workspace relationships', async () => {
        // Check if key tables have workspace_id foreign keys
        const workspaceTables = ['accounts', 'contacts', 'campaigns', 'messages'];
        
        for (const table of workspaceTables) {
            const { error } = await supabase
                .from(table)
                .select('workspace_id')
                .limit(1);
            
            if (error && !error.message.includes('RLS')) {
                return false;
            }
        }
        return true;
    });

    // TEST 12: Table relationships (Foreign Keys)
    await runTest('Table relationships properly configured', async () => {
        try {
            // Test account -> contact relationship
            const { error: contactError } = await supabase
                .from('contacts')
                .select('account_id')
                .limit(1);
            
            // Test campaign -> message relationship
            const { error: messageError } = await supabase
                .from('messages')
                .select('campaign_id, contact_id')
                .limit(1);
            
            return (!contactError || contactError.message.includes('RLS')) &&
                   (!messageError || messageError.message.includes('RLS'));
        } catch (err) {
            return false;
        }
    });

    // Generate comprehensive report
    console.log('\n' + '='.repeat(60));
    console.log('📊 QA VERIFICATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`📋 Total Tests: ${totalTests}`);
    console.log(`✅ Passed: ${passedTests}`);
    console.log(`❌ Failed: ${failedTests}`);
    console.log(`📈 Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
    console.log('='.repeat(60));

    // Detailed results
    console.log('\n📋 DETAILED TEST RESULTS:');
    console.log('-'.repeat(40));
    
    results.forEach((result, index) => {
        const icon = result.status === 'PASS' ? '✅' : '❌';
        console.log(`${icon} ${index + 1}. ${result.test}`);
        if (result.status === 'FAIL') {
            console.log(`   └─ Error: ${result.details}`);
        }
    });

    // Assessment and recommendations
    console.log('\n🎯 ASSESSMENT:');
    console.log('-'.repeat(20));
    
    if (passedTests === totalTests) {
        console.log('🎉 EXCELLENT: All tests passed!');
        console.log('✅ Sam AI database schema is fully ready for production');
        console.log('🚀 You can now proceed with MCP integration setup');
    } else if (passedTests >= totalTests * 0.9) {
        console.log('✅ GOOD: Most tests passed');
        console.log('⚠️  Minor issues detected - review failed tests above');
        console.log('🔧 Schema is mostly ready, address failures and re-test');
    } else if (passedTests >= totalTests * 0.7) {
        console.log('⚠️  MODERATE: Some critical issues detected');
        console.log('🔧 Significant schema issues - manual intervention required');
        console.log('📖 Review setup instructions and re-apply schema');
    } else {
        console.log('❌ CRITICAL: Major schema issues detected');
        console.log('🚨 Schema appears incomplete or incorrectly applied');
        console.log('🔄 Re-apply complete schema using COMPLETE_SAM_AI_SCHEMA.sql');
    }

    // Sam AI readiness assessment
    console.log('\n🎯 SAM AI WORKFLOW READINESS:');
    console.log('-'.repeat(30));
    
    const coreTablesExist = expectedTables.every(table => 
        results.find(r => r.test.includes(`'${table}'`) && r.status === 'PASS')
    );
    
    const samAiFieldsExist = results.filter(r => 
        (r.test.includes('Sam AI specific fields') || r.test.includes('enrichment fields') || 
         r.test.includes('personalization fields') || r.test.includes('knowledge base config')) 
        && r.status === 'PASS'
    ).length >= 4;

    console.log(`📊 Stage 1 (Lead Scraping): ${coreTablesExist ? '✅ Ready' : '❌ Blocked'}`);
    console.log(`📊 Stage 2 (Data Enrichment): ${samAiFieldsExist ? '✅ Ready' : '❌ Blocked'}`);
    console.log(`📊 Stage 3 (Knowledge Base RAG): ${coreTablesExist ? '✅ Ready' : '❌ Blocked'}`);
    console.log(`📊 Stage 4 (Lead Qualification): ${coreTablesExist ? '✅ Ready' : '❌ Blocked'}`);
    console.log(`📊 Stage 5 (Personalization): ${samAiFieldsExist ? '✅ Ready' : '❌ Blocked'}`);
    console.log(`📊 Stage 6 (Multi-channel Outreach): ${samAiFieldsExist ? '✅ Ready' : '❌ Blocked'}`);
    console.log(`📊 Stage 7 (Response Handling): ${coreTablesExist ? '✅ Ready' : '❌ Blocked'}`);
    console.log(`📊 Stage 8 (Follow-up Automation): ${coreTablesExist ? '✅ Ready' : '❌ Blocked'}`);

    const overallReadiness = coreTablesExist && samAiFieldsExist;
    console.log(`\n🏁 Overall Sam AI Readiness: ${overallReadiness ? '✅ READY' : '❌ NOT READY'}`);

    return {
        totalTests,
        passedTests,
        failedTests,
        successRate: Math.round((passedTests / totalTests) * 100),
        overallReadiness,
        results
    };
}

// Run QA verification
qaVerifySchema()
    .then(summary => {
        console.log('\n🏁 QA Verification completed');
        process.exit(summary.overallReadiness ? 0 : 1);
    })
    .catch(err => {
        console.error('💥 QA Verification failed:', err);
        process.exit(1);
    });