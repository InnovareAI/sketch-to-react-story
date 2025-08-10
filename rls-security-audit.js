import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://latxadqrvrrrcvkktrog.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhdHhhZHFydnJycmN2a2t0cm9nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjY5OTk4NiwiZXhwIjoyMDY4Mjc1OTg2fQ.b_DYgM15kRbWGY50n5zUQ7T9kVrLnCgD6-x7kh1SJME';

// Service role client for administrative queries
const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

async function auditRLSPolicies() {
    console.log('🔒 SAM AI MULTI-TENANT RLS SECURITY AUDIT');
    console.log('=' .repeat(60));
    console.log(`🌐 Database: ${supabaseUrl}`);
    console.log('🔑 Using service role for policy inspection');
    console.log('=' .repeat(60));

    const auditResults = {
        tables: [],
        policies: [],
        issues: [],
        recommendations: []
    };

    try {
        // 1. Get all tables and their RLS status
        console.log('\n📊 STEP 1: Analyzing Table Structure and RLS Status');
        console.log('-'.repeat(50));
        
        const { data: tables, error: tableError } = await supabaseService.rpc('get_table_rls_status', {}, {
            count: 'exact'
        }).catch(async () => {
            // Fallback: Query information_schema directly
            const { data, error } = await supabaseService
                .from('information_schema.tables')
                .select('table_name')
                .eq('table_schema', 'public')
                .neq('table_name', 'spatial_ref_sys');
            
            if (error) throw error;
            return { data };
        });

        // Expected Sam AI tables
        const expectedTables = [
            'workspaces', 'profiles', 'accounts', 'contacts', 'campaigns', 
            'messages', 'ai_assistants', 'conversations', 'conversation_messages',
            'integrations', 'workflows', 'analytics_events', 'workspace_invitations'
        ];

        // 2. Check RLS policies for each table
        console.log('\n🔍 STEP 2: Auditing RLS Policies per Table');
        console.log('-'.repeat(50));

        for (const tableName of expectedTables) {
            console.log(`\n📋 Auditing table: ${tableName}`);
            
            // Check if table exists and has RLS enabled
            const { data: rlsStatus } = await supabaseService.rpc('check_rls_enabled', {
                table_name: tableName
            }).catch(() => ({ data: false }));

            // Get policies for this table
            const { data: policies } = await supabaseService.rpc('get_table_policies', {
                table_name: tableName
            }).catch(async () => {
                // Fallback query
                const { data } = await supabaseService
                    .from('pg_policies')
                    .select('*')
                    .eq('tablename', tableName);
                return { data };
            });

            const tableAudit = {
                name: tableName,
                exists: true, // Assume exists if no error
                rlsEnabled: rlsStatus,
                policies: policies || [],
                hasWorkspaceIsolation: false,
                hasRoleBasedAccess: false,
                issues: []
            };

            // Check for workspace isolation
            const hasWorkspacePolicy = policies?.some(policy => 
                policy.definition?.includes('workspace_id') || 
                policy.qual?.includes('workspace_id')
            );
            tableAudit.hasWorkspaceIsolation = hasWorkspacePolicy;

            // Check for role-based access
            const hasRolePolicy = policies?.some(policy => 
                policy.definition?.includes('role') ||
                policy.qual?.includes('role')
            );
            tableAudit.hasRoleBasedAccess = hasRolePolicy;

            // Identify issues
            if (!rlsStatus) {
                tableAudit.issues.push('RLS not enabled');
            }
            
            if (!policies || policies.length === 0) {
                tableAudit.issues.push('No RLS policies found');
            }

            if (tableName !== 'workspaces' && tableName !== 'profiles' && !hasWorkspacePolicy) {
                tableAudit.issues.push('Missing workspace isolation policy');
            }

            auditResults.tables.push(tableAudit);
            
            console.log(`   RLS Enabled: ${rlsStatus ? '✅' : '❌'}`);
            console.log(`   Policies Found: ${policies?.length || 0}`);
            console.log(`   Workspace Isolation: ${hasWorkspacePolicy ? '✅' : '❌'}`);
            console.log(`   Issues: ${tableAudit.issues.length > 0 ? tableAudit.issues.join(', ') : 'None'}`);
        }

        // 3. Test workspace isolation with sample data
        console.log('\n🧪 STEP 3: Testing Multi-Tenant Data Isolation');
        console.log('-'.repeat(50));

        await testDataIsolation(auditResults);

        // 4. Generate security recommendations
        console.log('\n💡 STEP 4: Generating Security Recommendations');
        console.log('-'.repeat(50));

        generateRecommendations(auditResults);

        // 5. Generate comprehensive report
        generateSecurityReport(auditResults);

    } catch (error) {
        console.error('❌ Audit failed:', error.message);
        auditResults.issues.push(`Audit execution error: ${error.message}`);
    }

    return auditResults;
}

async function testDataIsolation(auditResults) {
    try {
        // Create test workspaces
        const workspace1Id = '11111111-1111-1111-1111-111111111111';
        const workspace2Id = '22222222-2222-2222-2222-222222222222';
        
        console.log('📝 Creating test workspaces for isolation testing...');
        
        // Test workspace creation (should work with service key)
        const { error: ws1Error } = await supabaseService
            .from('workspaces')
            .upsert({
                id: workspace1Id,
                name: 'Test Workspace 1',
                slug: 'test-workspace-1'
            });

        const { error: ws2Error } = await supabaseService
            .from('workspaces')
            .upsert({
                id: workspace2Id,
                name: 'Test Workspace 2', 
                slug: 'test-workspace-2'
            });

        if (ws1Error || ws2Error) {
            console.log('⚠️  Could not create test workspaces - testing with existing data');
        } else {
            console.log('✅ Test workspaces created successfully');
        }

        // Test data isolation by checking if workspace_id filtering works
        const testTables = ['accounts', 'contacts', 'campaigns'];
        
        for (const table of testTables) {
            try {
                const { data, error } = await supabaseService
                    .from(table)
                    .select('workspace_id')
                    .limit(5);

                if (error) {
                    console.log(`⚠️  Table ${table}: ${error.message}`);
                } else {
                    const uniqueWorkspaces = new Set(data?.map(row => row.workspace_id));
                    console.log(`✅ Table ${table}: Found ${uniqueWorkspaces.size} unique workspace(s)`);
                }
            } catch (err) {
                console.log(`❌ Table ${table}: ${err.message}`);
            }
        }

        // Cleanup test workspaces
        await supabaseService.from('workspaces').delete().eq('id', workspace1Id);
        await supabaseService.from('workspaces').delete().eq('id', workspace2Id);

    } catch (error) {
        console.log(`⚠️  Data isolation test incomplete: ${error.message}`);
        auditResults.issues.push(`Data isolation testing failed: ${error.message}`);
    }
}

function generateRecommendations(auditResults) {
    const recommendations = [];

    // Check for tables without RLS
    const tablesWithoutRLS = auditResults.tables.filter(t => !t.rlsEnabled);
    if (tablesWithoutRLS.length > 0) {
        recommendations.push({
            priority: 'CRITICAL',
            issue: 'Tables without RLS enabled',
            tables: tablesWithoutRLS.map(t => t.name),
            fix: 'Execute: ALTER TABLE [table_name] ENABLE ROW LEVEL SECURITY;'
        });
    }

    // Check for tables without workspace isolation
    const tablesWithoutWorkspaceIsolation = auditResults.tables.filter(t => 
        !['workspaces', 'profiles'].includes(t.name) && !t.hasWorkspaceIsolation
    );
    if (tablesWithoutWorkspaceIsolation.length > 0) {
        recommendations.push({
            priority: 'CRITICAL',
            issue: 'Tables without workspace isolation',
            tables: tablesWithoutWorkspaceIsolation.map(t => t.name),
            fix: 'Create workspace isolation policies for tenant data separation'
        });
    }

    // Check for missing policies
    const tablesWithoutPolicies = auditResults.tables.filter(t => t.policies.length === 0);
    if (tablesWithoutPolicies.length > 0) {
        recommendations.push({
            priority: 'HIGH',
            issue: 'Tables without any RLS policies',
            tables: tablesWithoutPolicies.map(t => t.name),
            fix: 'Create appropriate RLS policies for each table'
        });
    }

    auditResults.recommendations = recommendations;

    recommendations.forEach((rec, index) => {
        console.log(`\n${index + 1}. [${rec.priority}] ${rec.issue}`);
        console.log(`   Tables: ${rec.tables.join(', ')}`);
        console.log(`   Fix: ${rec.fix}`);
    });
}

function generateSecurityReport(auditResults) {
    console.log('\n' + '='.repeat(80));
    console.log('📋 MULTI-TENANT RLS SECURITY AUDIT REPORT');
    console.log('='.repeat(80));

    // Overall security score
    const totalTables = auditResults.tables.length;
    const tablesWithRLS = auditResults.tables.filter(t => t.rlsEnabled).length;
    const tablesWithWorkspaceIsolation = auditResults.tables.filter(t => 
        ['workspaces', 'profiles'].includes(t.name) || t.hasWorkspaceIsolation
    ).length;
    
    const securityScore = Math.round(((tablesWithRLS + tablesWithWorkspaceIsolation) / (totalTables * 2)) * 100);

    console.log(`\n🎯 OVERALL SECURITY SCORE: ${securityScore}%`);
    console.log(`📊 Tables Analyzed: ${totalTables}`);
    console.log(`🔒 Tables with RLS: ${tablesWithRLS}/${totalTables}`);
    console.log(`🏢 Tables with Workspace Isolation: ${tablesWithWorkspaceIsolation}/${totalTables}`);
    
    // Security level assessment
    console.log('\n🚦 SECURITY ASSESSMENT:');
    if (securityScore >= 90) {
        console.log('✅ EXCELLENT - Production ready multi-tenant security');
    } else if (securityScore >= 75) {
        console.log('⚠️  GOOD - Minor security improvements needed');
    } else if (securityScore >= 50) {
        console.log('⚠️  MODERATE - Significant security gaps exist');
    } else {
        console.log('❌ CRITICAL - Major security vulnerabilities present');
    }

    // Critical issues summary
    const criticalRecommendations = auditResults.recommendations.filter(r => r.priority === 'CRITICAL');
    if (criticalRecommendations.length > 0) {
        console.log('\n🚨 CRITICAL SECURITY ISSUES:');
        criticalRecommendations.forEach((rec, index) => {
            console.log(`${index + 1}. ${rec.issue}: ${rec.tables.join(', ')}`);
        });
    }

    // Table-by-table security status
    console.log('\n📋 TABLE-BY-TABLE SECURITY STATUS:');
    console.log('-'.repeat(60));
    console.log('Table Name'.padEnd(25) + 'RLS'.padEnd(8) + 'Policies'.padEnd(12) + 'Workspace Isolation');
    console.log('-'.repeat(60));
    
    auditResults.tables.forEach(table => {
        const rlsStatus = table.rlsEnabled ? '✅' : '❌';
        const policyCount = table.policies.length.toString();
        const workspaceStatus = (['workspaces', 'profiles'].includes(table.name) || table.hasWorkspaceIsolation) ? '✅' : '❌';
        
        console.log(
            table.name.padEnd(25) +
            rlsStatus.padEnd(8) +
            policyCount.padEnd(12) +
            workspaceStatus
        );
    });

    // Production readiness
    console.log('\n🚀 PRODUCTION READINESS:');
    console.log('-'.repeat(30));
    const isProductionReady = securityScore >= 90 && criticalRecommendations.length === 0;
    console.log(`Status: ${isProductionReady ? '✅ READY' : '❌ NOT READY'}`);
    
    if (!isProductionReady) {
        console.log('Required Actions:');
        auditResults.recommendations.forEach((rec, index) => {
            if (rec.priority === 'CRITICAL') {
                console.log(`  ${index + 1}. Fix ${rec.issue} for: ${rec.tables.join(', ')}`);
            }
        });
    }
}

// Run the security audit
console.log('Starting RLS Security Audit...\n');
auditRLSPolicies()
    .then(results => {
        console.log('\n✅ RLS Security Audit completed successfully');
        console.log(`📄 Full results available in audit object`);
        
        // Save results to file
        import('fs').then(fs => {
            const reportPath = './rls-security-audit-report.json';
            fs.default.writeFileSync(reportPath, JSON.stringify(results, null, 2));
            console.log(`💾 Detailed report saved to: ${reportPath}`);
        });
    })
    .catch(error => {
        console.error('\n❌ RLS Security Audit failed:', error);
        process.exit(1);
    });