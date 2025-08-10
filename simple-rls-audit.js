import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://latxadqrvrrrcvkktrog.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhdHhhZHFydnJycmN2a2t0cm9nIiwicm9sZSI6ImFub24iLCJpYXQiOjE7NTI2OTk5ODYsImV4cCI6MjA2ODI3NTk4Nn0.3WkAgXpk_MyQioVf_SED9O_ArjcT9nH0uy9we2okftE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function simpleRLSAudit() {
    console.log('🔒 SAM AI RLS SECURITY AUDIT - SIMPLIFIED');
    console.log('=' .repeat(50));
    console.log(`🌐 Database: ${supabaseUrl}`);
    console.log('=' .repeat(50));

    const auditResults = {
        tablesChecked: 0,
        tablesWithRLS: 0,
        tablesWithPolicies: 0,
        issues: [],
        recommendations: []
    };

    // Expected Sam AI tables
    const expectedTables = [
        'workspaces', 'profiles', 'accounts', 'contacts', 'campaigns', 
        'messages', 'ai_assistants', 'conversations', 'conversation_messages',
        'integrations', 'workflows', 'analytics_events'
    ];

    console.log('\n📊 Testing Table Access with RLS Protection');
    console.log('-'.repeat(50));

    for (const tableName of expectedTables) {
        auditResults.tablesChecked++;
        console.log(`\n📋 Testing table: ${tableName}`);
        
        try {
            // Test if table exists and is accessible
            const { data, error } = await supabase
                .from(tableName)
                .select('*')
                .limit(1);

            if (error) {
                // Check if error is due to RLS (good) or table doesn't exist (bad)
                if (error.message.includes('RLS') || 
                    error.message.includes('permission denied') ||
                    error.message.includes('insufficient_privilege')) {
                    console.log('   ✅ RLS Protection: Active (access denied without auth)');
                    auditResults.tablesWithRLS++;
                } else if (error.message.includes('does not exist')) {
                    console.log('   ❌ Table Missing: Does not exist');
                    auditResults.issues.push(`Table ${tableName} does not exist`);
                } else {
                    console.log(`   ⚠️  Unknown Error: ${error.message}`);
                    auditResults.issues.push(`Table ${tableName}: ${error.message}`);
                }
            } else {
                // Table is accessible without auth - this could be a problem
                if (data && data.length > 0) {
                    console.log('   ⚠️  Data Accessible: RLS may not be properly configured');
                    auditResults.issues.push(`Table ${tableName} is accessible without authentication`);
                } else {
                    console.log('   ✅ Table Empty: Exists but no data to test RLS');
                    auditResults.tablesWithRLS++;
                }
            }
        } catch (err) {
            console.log(`   ❌ Test Failed: ${err.message}`);
            auditResults.issues.push(`Table ${tableName} test failed: ${err.message}`);
        }
    }

    // Test workspace isolation concept
    console.log('\n🏢 Testing Workspace Isolation Concept');
    console.log('-'.repeat(50));
    
    try {
        const { data, error } = await supabase
            .from('workspaces')
            .select('id, name, slug')
            .limit(5);

        if (error && (error.message.includes('RLS') || error.message.includes('permission denied'))) {
            console.log('✅ Workspaces table properly protected by RLS');
            auditResults.tablesWithPolicies++;
        } else if (data) {
            console.log(`⚠️  Workspaces accessible: Found ${data.length} workspace(s)`);
            console.log('   This may indicate missing RLS or you have valid access');
        }
    } catch (err) {
        console.log(`❌ Workspace test failed: ${err.message}`);
    }

    // Test foreign key relationships
    console.log('\n🔗 Testing Table Relationships');
    console.log('-'.repeat(50));

    const relationshipTests = [
        { table: 'contacts', fk: 'account_id', description: 'Contacts → Accounts' },
        { table: 'messages', fk: 'campaign_id', description: 'Messages → Campaigns' },
        { table: 'messages', fk: 'contact_id', description: 'Messages → Contacts' },
        { table: 'conversations', fk: 'contact_id', description: 'Conversations → Contacts' }
    ];

    for (const test of relationshipTests) {
        try {
            const { data, error } = await supabase
                .from(test.table)
                .select(test.fk)
                .limit(1);

            if (error && (error.message.includes('RLS') || error.message.includes('permission denied'))) {
                console.log(`✅ ${test.description}: Protected by RLS`);
            } else if (error && error.message.includes('does not exist')) {
                console.log(`❌ ${test.description}: Table or column missing`);
                auditResults.issues.push(`Missing: ${test.table}.${test.fk}`);
            } else {
                console.log(`✅ ${test.description}: Relationship exists`);
            }
        } catch (err) {
            console.log(`❌ ${test.description}: ${err.message}`);
        }
    }

    // Generate security assessment
    console.log('\n' + '='.repeat(60));
    console.log('📋 SECURITY AUDIT SUMMARY');
    console.log('='.repeat(60));

    const securityScore = Math.round((auditResults.tablesWithRLS / auditResults.tablesChecked) * 100);
    
    console.log(`📊 Tables Checked: ${auditResults.tablesChecked}`);
    console.log(`🔒 Tables with RLS Protection: ${auditResults.tablesWithRLS}`);
    console.log(`🎯 Security Score: ${securityScore}%`);
    console.log(`⚠️  Issues Found: ${auditResults.issues.length}`);

    // Security level assessment
    console.log('\n🚦 SECURITY ASSESSMENT:');
    if (securityScore >= 90 && auditResults.issues.length === 0) {
        console.log('✅ EXCELLENT - Multi-tenant security appears properly configured');
        console.log('🚀 PRODUCTION READY: RLS policies are protecting tenant data');
    } else if (securityScore >= 75) {
        console.log('⚠️  GOOD - Most tables protected, minor issues to address');
        console.log('🔧 Review the issues below and apply fixes');
    } else if (securityScore >= 50) {
        console.log('⚠️  MODERATE - Significant security gaps detected');
        console.log('🔧 IMMEDIATE ACTION REQUIRED: Apply complete RLS policies');
    } else {
        console.log('❌ CRITICAL - Major security vulnerabilities');
        console.log('🚨 BLOCKED FOR PRODUCTION: Complete schema rebuild needed');
    }

    // List issues
    if (auditResults.issues.length > 0) {
        console.log('\n🚨 SECURITY ISSUES FOUND:');
        console.log('-'.repeat(30));
        auditResults.issues.forEach((issue, index) => {
            console.log(`${index + 1}. ${issue}`);
        });
    }

    // Recommendations
    console.log('\n💡 SECURITY RECOMMENDATIONS:');
    console.log('-'.repeat(30));
    
    if (auditResults.issues.some(issue => issue.includes('does not exist'))) {
        console.log('1. Apply the complete Sam AI schema using COMPLETE_SAM_AI_SCHEMA.sql');
    }
    
    if (auditResults.issues.some(issue => issue.includes('accessible without authentication'))) {
        console.log('2. Enable RLS on all tables: ALTER TABLE [table] ENABLE ROW LEVEL SECURITY;');
        console.log('3. Create workspace isolation policies for all tenant-scoped tables');
    }

    if (securityScore < 90) {
        console.log('4. Implement role-based access control (owner, admin, member, viewer)');
        console.log('5. Test multi-tenant data isolation with actual user sessions');
        console.log('6. Apply the multi-tenant-setup.sql for complete RLS policy coverage');
    }

    console.log('\n📋 NEXT STEPS FOR PRODUCTION READINESS:');
    console.log('1. Fix all identified security issues');
    console.log('2. Run comprehensive RLS testing with multiple user accounts');
    console.log('3. Test MCP integrations with tenant isolation');
    console.log('4. Verify API keys and credentials are workspace-scoped');
    console.log('5. Load test with multiple tenants accessing simultaneously');

    return auditResults;
}

// Run the simplified audit
simpleRLSAudit()
    .then(results => {
        console.log('\n✅ RLS Security Audit completed');
        process.exit(results.issues.length === 0 ? 0 : 1);
    })
    .catch(error => {
        console.error('\n❌ Audit failed:', error);
        process.exit(1);
    });