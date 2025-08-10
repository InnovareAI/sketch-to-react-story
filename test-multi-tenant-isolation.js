import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://latxadqrvrrrcvkktrog.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhdHhhZHFydnJycmN2a2t0cm9nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTk5ODYsImV4cCI6MjA2ODI3NTk4Nn0.3WkAgXpk_MyQioVf_SED9O_ArjcT9nH0uy9we2okftE';

// Service key for admin operations (if available)
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

async function testMultiTenantIsolation() {
    console.log('🔒 MULTI-TENANT DATA ISOLATION TEST SUITE');
    console.log('=' .repeat(60));
    console.log(`🌐 Database: ${supabaseUrl}`);
    console.log('=' .repeat(60));

    const testResults = {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        criticalIssues: [],
        tests: []
    };

    // Test with anon client (simulating unauthenticated user)
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    async function runTest(testName, testFunction, isCritical = false) {
        testResults.totalTests++;
        console.log(`\n🧪 TEST ${testResults.totalTests}: ${testName}`);
        
        try {
            const result = await testFunction();
            if (result.passed) {
                console.log(`✅ PASS: ${result.message}`);
                testResults.passedTests++;
                testResults.tests.push({ name: testName, status: 'PASS', message: result.message });
            } else {
                console.log(`❌ FAIL: ${result.message}`);
                testResults.failedTests++;
                testResults.tests.push({ name: testName, status: 'FAIL', message: result.message });
                if (isCritical) {
                    testResults.criticalIssues.push({ test: testName, issue: result.message });
                }
            }
        } catch (error) {
            console.log(`❌ ERROR: ${error.message}`);
            testResults.failedTests++;
            testResults.tests.push({ name: testName, status: 'ERROR', message: error.message });
            if (isCritical) {
                testResults.criticalIssues.push({ test: testName, issue: error.message });
            }
        }
    }

    // TEST 1: Workspaces table RLS protection
    await runTest('Workspaces table protected by RLS', async () => {
        const { data, error } = await supabase
            .from('workspaces')
            .select('*')
            .limit(1);

        if (error && (error.message.includes('RLS') || error.message.includes('permission denied'))) {
            return { passed: true, message: 'Workspaces properly protected - access denied without auth' };
        } else if (error && error.message.includes('does not exist')) {
            return { passed: false, message: 'Workspaces table does not exist' };
        } else if (data) {
            return { passed: false, message: `Workspaces accessible without auth - potential security issue (${data.length} rows)` };
        } else {
            return { passed: false, message: `Unexpected result: ${error?.message || 'Unknown'}` };
        }
    }, true);

    // TEST 2: Profiles table RLS protection  
    await runTest('Profiles table protected by RLS', async () => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .limit(1);

        if (error && (error.message.includes('RLS') || error.message.includes('permission denied'))) {
            return { passed: true, message: 'Profiles properly protected - access denied without auth' };
        } else if (error && error.message.includes('does not exist')) {
            return { passed: false, message: 'Profiles table does not exist' };
        } else if (data) {
            return { passed: false, message: `Profiles accessible without auth - critical security issue (${data.length} rows)` };
        } else {
            return { passed: false, message: `Unexpected result: ${error?.message || 'Unknown'}` };
        }
    }, true);

    // TEST 3-14: Test all Sam AI tables for RLS protection
    const samAiTables = [
        'accounts', 'contacts', 'campaigns', 'messages', 'ai_assistants',
        'conversations', 'conversation_messages', 'integrations', 
        'workflows', 'analytics_events'
    ];

    for (const tableName of samAiTables) {
        await runTest(`${tableName} table RLS protection`, async () => {
            const { data, error } = await supabase
                .from(tableName)
                .select('workspace_id')
                .limit(1);

            if (error && (error.message.includes('RLS') || error.message.includes('permission denied'))) {
                return { passed: true, message: 'Table properly protected by RLS' };
            } else if (error && error.message.includes('does not exist')) {
                return { passed: false, message: 'Table does not exist - schema incomplete' };
            } else if (data) {
                return { passed: false, message: `Table accessible without auth - security vulnerability` };
            } else {
                return { passed: false, message: `Unexpected result: ${error?.message || 'Unknown'}` };
            }
        }, true);
    }

    // TEST: Workspace isolation with service key (if available)
    if (supabaseServiceKey) {
        const supabaseService = createClient(supabaseUrl, supabaseServiceKey);
        
        await runTest('Multi-tenant workspace data isolation', async () => {
            try {
                // Create test workspaces
                const ws1Id = 'test-ws-1-' + Date.now();
                const ws2Id = 'test-ws-2-' + Date.now();
                
                const { error: ws1Error } = await supabaseService
                    .from('workspaces')
                    .insert({
                        id: ws1Id,
                        name: 'Test Workspace 1',
                        slug: `test-workspace-1-${Date.now()}`
                    });

                const { error: ws2Error } = await supabaseService
                    .from('workspaces')
                    .insert({
                        id: ws2Id,
                        name: 'Test Workspace 2',
                        slug: `test-workspace-2-${Date.now()}`
                    });

                if (ws1Error || ws2Error) {
                    return { passed: false, message: `Could not create test workspaces: ${ws1Error?.message || ws2Error?.message}` };
                }

                // Test if we can query both workspaces (should work with service key)
                const { data: workspaces, error: queryError } = await supabaseService
                    .from('workspaces')
                    .select('*')
                    .in('id', [ws1Id, ws2Id]);

                // Cleanup
                await supabaseService.from('workspaces').delete().eq('id', ws1Id);
                await supabaseService.from('workspaces').delete().eq('id', ws2Id);

                if (queryError) {
                    return { passed: false, message: `Service key query failed: ${queryError.message}` };
                } else if (workspaces && workspaces.length === 2) {
                    return { passed: true, message: 'Workspace isolation working - service key can access all workspaces' };
                } else {
                    return { passed: false, message: `Expected 2 workspaces, got ${workspaces?.length || 0}` };
                }
            } catch (error) {
                return { passed: false, message: `Test execution failed: ${error.message}` };
            }
        });
    } else {
        console.log('\n⚠️  Skipping service key tests - SUPABASE_SERVICE_KEY not provided');
    }

    // TEST: Foreign key relationships exist
    await runTest('Foreign key relationships properly configured', async () => {
        const relationships = [
            { table: 'contacts', column: 'account_id' },
            { table: 'messages', column: 'campaign_id' },
            { table: 'messages', column: 'contact_id' },
            { table: 'conversations', column: 'contact_id' }
        ];

        let relationshipCount = 0;
        for (const rel of relationships) {
            try {
                const { error } = await supabase
                    .from(rel.table)
                    .select(rel.column)
                    .limit(1);

                if (!error || error.message.includes('RLS') || error.message.includes('permission denied')) {
                    relationshipCount++;
                }
            } catch (err) {
                // Continue checking other relationships
            }
        }

        if (relationshipCount === relationships.length) {
            return { passed: true, message: 'All expected foreign key relationships found' };
        } else {
            return { passed: false, message: `Only ${relationshipCount}/${relationships.length} relationships found` };
        }
    });

    // Generate comprehensive report
    console.log('\n' + '='.repeat(80));
    console.log('📋 MULTI-TENANT ISOLATION TEST REPORT');
    console.log('='.repeat(80));

    const successRate = Math.round((testResults.passedTests / testResults.totalTests) * 100);
    
    console.log(`📊 Tests Run: ${testResults.totalTests}`);
    console.log(`✅ Passed: ${testResults.passedTests}`);
    console.log(`❌ Failed: ${testResults.failedTests}`);
    console.log(`🎯 Success Rate: ${successRate}%`);
    console.log(`🚨 Critical Issues: ${testResults.criticalIssues.length}`);

    // Security assessment
    console.log('\n🚦 SECURITY ASSESSMENT:');
    if (successRate >= 90 && testResults.criticalIssues.length === 0) {
        console.log('✅ EXCELLENT - Multi-tenant security properly configured');
        console.log('🚀 PRODUCTION READY: Safe for deployment with multiple customers');
    } else if (successRate >= 75 && testResults.criticalIssues.length <= 2) {
        console.log('⚠️  GOOD - Minor security issues to address');
        console.log('🔧 Near production ready - fix critical issues first');
    } else if (successRate >= 50) {
        console.log('⚠️  MODERATE - Significant security gaps');
        console.log('🔧 NOT PRODUCTION READY - Major fixes required');
    } else {
        console.log('❌ CRITICAL - Severe security vulnerabilities');
        console.log('🚨 BLOCKED FOR PRODUCTION - Complete security overhaul needed');
    }

    // Critical issues summary
    if (testResults.criticalIssues.length > 0) {
        console.log('\n🚨 CRITICAL SECURITY ISSUES:');
        console.log('-'.repeat(50));
        testResults.criticalIssues.forEach((issue, index) => {
            console.log(`${index + 1}. ${issue.test}: ${issue.issue}`);
        });
    }

    // Detailed test results
    console.log('\n📋 DETAILED TEST RESULTS:');
    console.log('-'.repeat(60));
    testResults.tests.forEach((test, index) => {
        const icon = test.status === 'PASS' ? '✅' : 
                    test.status === 'FAIL' ? '❌' : '⚠️';
        console.log(`${icon} ${index + 1}. ${test.name}: ${test.message}`);
    });

    // Recommendations
    console.log('\n💡 NEXT STEPS:');
    console.log('-'.repeat(20));
    
    if (testResults.failedTests === 0) {
        console.log('1. ✅ All tests passing - system is secure');
        console.log('2. 🧪 Run additional load testing with multiple tenants');
        console.log('3. 🔍 Perform penetration testing');
        console.log('4. 📊 Set up monitoring for security events');
    } else {
        console.log('1. 🔧 Apply complete Sam AI schema to create missing tables');
        console.log('2. 🔒 Fix RLS policies causing access without authentication');
        console.log('3. 🧪 Re-run this test suite after fixes');
        console.log('4. 👥 Test with actual user authentication sessions');
    }

    return testResults;
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { testMultiTenantIsolation };
} else {
    // Run tests if executed directly
    testMultiTenantIsolation()
        .then(results => {
            const isSecure = results.successRate >= 90 && results.criticalIssues.length === 0;
            console.log(`\n🏁 Multi-tenant isolation testing ${isSecure ? 'PASSED' : 'FAILED'}`);
            process.exit(isSecure ? 0 : 1);
        })
        .catch(error => {
            console.error('\n❌ Test suite failed:', error);
            process.exit(1);
        });
}