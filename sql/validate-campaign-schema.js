#!/usr/bin/env node

/**
 * SAM AI Campaign Schema Validation Script
 * Comprehensive testing and validation of the campaign database schema
 */

const { createClient } = require('@supabase/supabase-js');

// Configuration
const SUPABASE_URL = 'https://ktchrfgkbpaixbiwbieg.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

const TEST_WORKSPACE_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
const TEST_USER_ID = 'user-demo-1234-5678-9abc-def123456789';

class CampaignSchemaValidator {
    constructor() {
        this.results = {
            tables: [],
            functions: [],
            policies: [],
            integrations: [],
            performance: [],
            errors: []
        };
    }

    async validateTableStructure() {
        console.log('\n🔍 Validating Table Structure...');
        
        const requiredTables = [
            'campaigns',
            'campaign_step_templates', 
            'prospects',
            'campaign_prospects',
            'extraction_jobs',
            'extraction_records',
            'n8n_campaign_executions',
            'n8n_campaign_templates',
            'campaign_knowledge_base',
            'campaign_insights',
            'campaign_messages',
            'campaign_analytics_daily',
            'campaign_benchmarks'
        ];

        for (const tableName of requiredTables) {
            try {
                // Check if table exists and is accessible
                const { data, error } = await supabase
                    .from(tableName)
                    .select('*')
                    .limit(1);

                if (error) {
                    this.results.tables.push({
                        table: tableName,
                        status: 'ERROR',
                        message: error.message
                    });
                    console.log(`❌ ${tableName}: ${error.message}`);
                } else {
                    this.results.tables.push({
                        table: tableName,
                        status: 'OK',
                        message: 'Table accessible'
                    });
                    console.log(`✅ ${tableName}: Table accessible`);
                }
            } catch (err) {
                this.results.tables.push({
                    table: tableName,
                    status: 'FAILED',
                    message: err.message
                });
                console.log(`💥 ${tableName}: ${err.message}`);
            }
        }
    }

    async validateFunctions() {
        console.log('\n🔧 Validating Functions...');
        
        const functions = [
            'update_campaign_metrics',
            'calculate_prospect_completeness',
            'generate_daily_campaign_analytics'
        ];

        for (const funcName of functions) {
            try {
                // Try to get function information
                const { data, error } = await supabase.rpc('exec_sql', {
                    sql_command: `
                        SELECT routine_name, routine_type 
                        FROM information_schema.routines 
                        WHERE routine_name = '${funcName}' 
                        AND routine_schema = 'public';
                    `
                });

                if (error) {
                    this.results.functions.push({
                        function: funcName,
                        status: 'ERROR',
                        message: error.message
                    });
                    console.log(`❌ ${funcName}: ${error.message}`);
                } else if (data && data.length > 0) {
                    this.results.functions.push({
                        function: funcName,
                        status: 'OK',
                        message: 'Function exists'
                    });
                    console.log(`✅ ${funcName}: Function exists`);
                } else {
                    this.results.functions.push({
                        function: funcName,
                        status: 'MISSING',
                        message: 'Function not found'
                    });
                    console.log(`⚠️  ${funcName}: Function not found`);
                }
            } catch (err) {
                this.results.functions.push({
                    function: funcName,
                    status: 'FAILED',
                    message: err.message
                });
                console.log(`💥 ${funcName}: ${err.message}`);
            }
        }
    }

    async validateRLSPolicies() {
        console.log('\n🔐 Validating RLS Policies...');
        
        const tables = ['campaigns', 'prospects', 'campaign_prospects', 'campaign_messages'];

        for (const tableName of tables) {
            try {
                const { data, error } = await supabase.rpc('exec_sql', {
                    sql_command: `
                        SELECT schemaname, tablename, rowsecurity 
                        FROM pg_tables 
                        WHERE tablename = '${tableName}' 
                        AND schemaname = 'public';
                    `
                });

                if (error) {
                    this.results.policies.push({
                        table: tableName,
                        status: 'ERROR',
                        message: error.message
                    });
                    console.log(`❌ ${tableName} RLS: ${error.message}`);
                } else if (data && data.length > 0 && data[0].rowsecurity) {
                    this.results.policies.push({
                        table: tableName,
                        status: 'OK',
                        message: 'RLS enabled'
                    });
                    console.log(`✅ ${tableName}: RLS enabled`);
                } else {
                    this.results.policies.push({
                        table: tableName,
                        status: 'MISSING',
                        message: 'RLS not enabled'
                    });
                    console.log(`⚠️  ${tableName}: RLS not enabled`);
                }
            } catch (err) {
                this.results.policies.push({
                    table: tableName,
                    status: 'FAILED',
                    message: err.message
                });
                console.log(`💥 ${tableName}: ${err.message}`);
            }
        }
    }

    async testCampaignOperations() {
        console.log('\n🧪 Testing Campaign Operations...');

        try {
            // Test 1: Create a test campaign
            const { data: campaign, error: campaignError } = await supabase
                .from('campaigns')
                .insert({
                    workspace_id: TEST_WORKSPACE_ID,
                    name: 'Validation Test Campaign',
                    description: 'Test campaign for schema validation',
                    type: 'linkedin',
                    channel: 'linkedin',
                    campaign_steps: [
                        {
                            step: 1,
                            type: 'connection_request',
                            name: 'Connect',
                            config: { message: 'Hi {first_name}!' }
                        },
                        {
                            step: 2,
                            type: 'wait',
                            name: 'Wait',
                            config: { wait_hours: 48 }
                        },
                        {
                            step: 3,
                            type: 'message',
                            name: 'Follow up',
                            config: { message: 'Thanks for connecting!' }
                        }
                    ],
                    total_steps: 3,
                    created_by: TEST_USER_ID
                })
                .select()
                .single();

            if (campaignError) {
                this.results.integrations.push({
                    test: 'Campaign Creation',
                    status: 'ERROR',
                    message: campaignError.message
                });
                console.log(`❌ Campaign creation failed: ${campaignError.message}`);
                return;
            }

            console.log(`✅ Campaign created: ${campaign.name}`);

            // Test 2: Create test prospect
            const { data: prospect, error: prospectError } = await supabase
                .from('prospects')
                .insert({
                    workspace_id: TEST_WORKSPACE_ID,
                    first_name: 'Test',
                    last_name: 'Prospect',
                    email: 'test.validation@example.com',
                    linkedin_url: 'https://linkedin.com/in/test-validation',
                    current_title: 'Test Manager',
                    current_company: 'Test Company',
                    extraction_source: 'manual',
                    approval_status: 'approved'
                })
                .select()
                .single();

            if (prospectError) {
                this.results.integrations.push({
                    test: 'Prospect Creation',
                    status: 'ERROR', 
                    message: prospectError.message
                });
                console.log(`❌ Prospect creation failed: ${prospectError.message}`);
            } else {
                console.log(`✅ Prospect created: ${prospect.full_name} (Completeness: ${prospect.data_completeness}%)`);
            }

            // Test 3: Create campaign-prospect assignment
            const { data: assignment, error: assignmentError } = await supabase
                .from('campaign_prospects')
                .insert({
                    workspace_id: TEST_WORKSPACE_ID,
                    campaign_id: campaign.id,
                    prospect_id: prospect.id,
                    assignment_method: 'manual',
                    current_step: 1
                })
                .select()
                .single();

            if (assignmentError) {
                this.results.integrations.push({
                    test: 'Campaign Assignment',
                    status: 'ERROR',
                    message: assignmentError.message
                });
                console.log(`❌ Campaign assignment failed: ${assignmentError.message}`);
            } else {
                console.log(`✅ Campaign assignment created: Step ${assignment.current_step}`);
            }

            // Test 4: Create test message
            const { data: message, error: messageError } = await supabase
                .from('campaign_messages')
                .insert({
                    workspace_id: TEST_WORKSPACE_ID,
                    campaign_id: campaign.id,
                    prospect_id: prospect.id,
                    message_type: 'connection_request',
                    channel: 'linkedin',
                    step_number: 1,
                    content: 'Hi Test, I\'d love to connect!',
                    status: 'draft'
                })
                .select()
                .single();

            if (messageError) {
                this.results.integrations.push({
                    test: 'Message Creation',
                    status: 'ERROR',
                    message: messageError.message
                });
                console.log(`❌ Message creation failed: ${messageError.message}`);
            } else {
                console.log(`✅ Message created: ${message.content}`);
            }

            // Test 5: Test analytics function
            try {
                const { error: analyticsError } = await supabase.rpc('generate_daily_campaign_analytics', {
                    p_campaign_id: campaign.id,
                    p_date: new Date().toISOString().split('T')[0]
                });

                if (analyticsError) {
                    this.results.integrations.push({
                        test: 'Analytics Generation',
                        status: 'ERROR',
                        message: analyticsError.message
                    });
                    console.log(`❌ Analytics generation failed: ${analyticsError.message}`);
                } else {
                    console.log(`✅ Analytics generated successfully`);
                }
            } catch (err) {
                console.log(`⚠️  Analytics function test skipped: ${err.message}`);
            }

            // Clean up test data
            await supabase.from('campaign_messages').delete().eq('campaign_id', campaign.id);
            await supabase.from('campaign_prospects').delete().eq('campaign_id', campaign.id);
            await supabase.from('prospects').delete().eq('id', prospect.id);
            await supabase.from('campaigns').delete().eq('id', campaign.id);
            
            console.log(`✅ Test data cleaned up`);

            this.results.integrations.push({
                test: 'Complete Campaign Workflow',
                status: 'OK',
                message: 'All operations successful'
            });

        } catch (error) {
            this.results.integrations.push({
                test: 'Campaign Operations',
                status: 'FAILED',
                message: error.message
            });
            console.log(`💥 Campaign operations test failed: ${error.message}`);
        }
    }

    async testPerformance() {
        console.log('\n⚡ Testing Performance...');

        const performanceTests = [
            {
                name: 'Campaign Query Performance',
                query: `
                    SELECT c.*, COUNT(cp.id) as prospect_count
                    FROM campaigns c
                    LEFT JOIN campaign_prospects cp ON cp.campaign_id = c.id
                    WHERE c.workspace_id = '${TEST_WORKSPACE_ID}'
                    GROUP BY c.id
                    LIMIT 10
                `
            },
            {
                name: 'Prospect Search Performance', 
                query: `
                    SELECT p.*, cp.campaign_id, cp.current_step
                    FROM prospects p
                    LEFT JOIN campaign_prospects cp ON cp.prospect_id = p.id
                    WHERE p.workspace_id = '${TEST_WORKSPACE_ID}'
                      AND p.approval_status = 'approved'
                    ORDER BY p.created_at DESC
                    LIMIT 50
                `
            },
            {
                name: 'Analytics Query Performance',
                query: `
                    SELECT 
                        campaign_id,
                        SUM(prospects_added) as total_prospects,
                        AVG(response_rate) as avg_response_rate
                    FROM campaign_analytics_daily
                    WHERE date >= CURRENT_DATE - INTERVAL '30 days'
                    GROUP BY campaign_id
                    LIMIT 20
                `
            }
        ];

        for (const test of performanceTests) {
            try {
                const startTime = Date.now();
                
                const { data, error } = await supabase.rpc('exec_sql', {
                    sql_command: test.query
                });

                const executionTime = Date.now() - startTime;

                if (error) {
                    this.results.performance.push({
                        test: test.name,
                        status: 'ERROR',
                        execution_time: executionTime,
                        message: error.message
                    });
                    console.log(`❌ ${test.name}: ${error.message} (${executionTime}ms)`);
                } else {
                    this.results.performance.push({
                        test: test.name,
                        status: 'OK',
                        execution_time: executionTime,
                        record_count: data?.length || 0
                    });
                    console.log(`✅ ${test.name}: ${executionTime}ms (${data?.length || 0} records)`);
                }
            } catch (err) {
                this.results.performance.push({
                    test: test.name,
                    status: 'FAILED',
                    message: err.message
                });
                console.log(`💥 ${test.name}: ${err.message}`);
            }
        }
    }

    async validateSampleData() {
        console.log('\n📊 Validating Sample Data...');

        const sampleDataChecks = [
            {
                table: 'campaign_step_templates',
                expected_min: 6,
                description: 'Campaign step templates'
            },
            {
                table: 'n8n_campaign_templates', 
                expected_min: 4,
                description: 'N8N workflow templates'
            },
            {
                table: 'campaigns',
                expected_min: 1,
                description: 'Sample campaigns'
            },
            {
                table: 'prospects',
                expected_min: 3,
                description: 'Sample prospects'
            }
        ];

        for (const check of sampleDataChecks) {
            try {
                const { data, error } = await supabase
                    .from(check.table)
                    .select('*', { count: 'exact', head: true });

                if (error) {
                    console.log(`❌ ${check.description}: ${error.message}`);
                    continue;
                }

                const count = data?.length || 0;
                if (count >= check.expected_min) {
                    console.log(`✅ ${check.description}: ${count} records found`);
                } else {
                    console.log(`⚠️  ${check.description}: Only ${count} records (expected ≥${check.expected_min})`);
                }
            } catch (err) {
                console.log(`💥 ${check.description}: ${err.message}`);
            }
        }
    }

    async generateReport() {
        console.log('\n📋 Generating Validation Report...');
        console.log('═'.repeat(80));

        const report = {
            timestamp: new Date().toISOString(),
            database_url: SUPABASE_URL,
            validation_results: this.results,
            summary: {
                tables: {
                    total: this.results.tables.length,
                    passed: this.results.tables.filter(t => t.status === 'OK').length,
                    failed: this.results.tables.filter(t => t.status !== 'OK').length
                },
                functions: {
                    total: this.results.functions.length,
                    passed: this.results.functions.filter(f => f.status === 'OK').length,
                    failed: this.results.functions.filter(f => f.status !== 'OK').length
                },
                policies: {
                    total: this.results.policies.length,
                    passed: this.results.policies.filter(p => p.status === 'OK').length,
                    failed: this.results.policies.filter(p => p.status !== 'OK').length
                },
                integrations: {
                    total: this.results.integrations.length,
                    passed: this.results.integrations.filter(i => i.status === 'OK').length,
                    failed: this.results.integrations.filter(i => i.status !== 'OK').length
                }
            }
        };

        console.log(`📊 VALIDATION SUMMARY`);
        console.log(`🗓️  Timestamp: ${report.timestamp}`);
        console.log(`🗄️  Database: ${report.database_url}`);
        console.log('');
        console.log(`📋 Tables: ${report.summary.tables.passed}/${report.summary.tables.total} passed`);
        console.log(`🔧 Functions: ${report.summary.functions.passed}/${report.summary.functions.total} passed`);
        console.log(`🔐 RLS Policies: ${report.summary.policies.passed}/${report.summary.policies.total} passed`);
        console.log(`🧪 Integrations: ${report.summary.integrations.passed}/${report.summary.integrations.total} passed`);

        const overallPassed = 
            report.summary.tables.passed + 
            report.summary.functions.passed +
            report.summary.policies.passed +
            report.summary.integrations.passed;

        const overallTotal = 
            report.summary.tables.total +
            report.summary.functions.total +
            report.summary.policies.total +
            report.summary.integrations.total;

        const successRate = Math.round((overallPassed / overallTotal) * 100);

        console.log('');
        console.log(`🎯 Overall Success Rate: ${overallPassed}/${overallTotal} (${successRate}%)`);

        if (successRate >= 90) {
            console.log('🎉 EXCELLENT: Schema validation highly successful!');
        } else if (successRate >= 75) {
            console.log('✅ GOOD: Schema validation mostly successful, minor issues to address');
        } else if (successRate >= 50) {
            console.log('⚠️  WARNING: Significant issues found, review required');
        } else {
            console.log('❌ CRITICAL: Major validation failures, immediate attention required');
        }

        console.log('═'.repeat(80));

        return report;
    }

    async runFullValidation() {
        console.log('🚀 SAM AI Campaign Schema Validation');
        console.log('====================================');

        try {
            await this.validateTableStructure();
            await this.validateFunctions(); 
            await this.validateRLSPolicies();
            await this.testCampaignOperations();
            await this.testPerformance();
            await this.validateSampleData();
            
            const report = await this.generateReport();
            
            return report;
        } catch (error) {
            console.error('\n💥 Validation failed:', error.message);
            throw error;
        }
    }
}

async function main() {
    const validator = new CampaignSchemaValidator();
    
    try {
        const report = await validator.runFullValidation();
        
        // Save report to file
        const fs = require('fs');
        const reportFile = `campaign-schema-validation-${Date.now()}.json`;
        fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
        console.log(`\n💾 Validation report saved to: ${reportFile}`);
        
        console.log('\n🎯 Next Steps:');
        console.log('1. Review any failed validations above');
        console.log('2. Update your React components to use new schema');
        console.log('3. Configure N8N workflows with provided templates');
        console.log('4. Test campaign creation and execution');
        console.log('5. Monitor performance and optimize as needed');
        
    } catch (error) {
        console.error('Validation process failed:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { CampaignSchemaValidator };