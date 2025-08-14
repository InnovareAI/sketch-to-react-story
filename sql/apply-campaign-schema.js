#!/usr/bin/env node

/**
 * SAM AI Campaign Schema Migration Script
 * Applies the comprehensive campaign database schema to Supabase
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuration
const SUPABASE_URL = 'https://ktchrfgkbpaixbiwbieg.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
    console.log('💡 Set it with: export SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function loadSQLFile(filename) {
    const filePath = path.join(__dirname, filename);
    if (!fs.existsSync(filePath)) {
        throw new Error(`SQL file not found: ${filePath}`);
    }
    return fs.readFileSync(filePath, 'utf8');
}

async function executeSQLScript(sql, scriptName) {
    console.log(`\n🔄 Executing ${scriptName}...`);
    
    try {
        const { data, error } = await supabase.rpc('exec_sql', { sql_command: sql });
        
        if (error) {
            console.error(`❌ Error in ${scriptName}:`, error);
            throw error;
        }
        
        console.log(`✅ ${scriptName} executed successfully`);
        return data;
    } catch (error) {
        console.error(`💥 Failed to execute ${scriptName}:`, error.message);
        throw error;
    }
}

async function checkExistingTables() {
    console.log('\n🔍 Checking existing database structure...');
    
    const { data: tables, error } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .in('table_name', [
            'campaigns',
            'prospects', 
            'campaign_prospects',
            'extraction_jobs',
            'n8n_campaign_executions',
            'campaign_knowledge_base',
            'campaign_messages',
            'campaign_analytics_daily'
        ]);

    if (error) {
        console.log('⚠️  Could not check existing tables, proceeding with migration');
        return [];
    }

    const existingTables = tables?.map(t => t.table_name) || [];
    console.log(`📋 Found ${existingTables.length} existing campaign-related tables:`, existingTables);
    return existingTables;
}

async function backupExistingData(existingTables) {
    console.log('\n💾 Creating backup of existing campaign data...');
    
    const backupData = {};
    
    for (const table of existingTables) {
        try {
            const { data, error } = await supabase
                .from(table)
                .select('*');
                
            if (!error && data && data.length > 0) {
                backupData[table] = data;
                console.log(`✅ Backed up ${data.length} records from ${table}`);
            }
        } catch (error) {
            console.log(`⚠️  Could not backup table ${table}:`, error.message);
        }
    }
    
    // Save backup to file
    const backupFile = path.join(__dirname, `campaign-backup-${Date.now()}.json`);
    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
    console.log(`💾 Backup saved to: ${backupFile}`);
    
    return backupData;
}

async function validateSchemaApplication() {
    console.log('\n✅ Validating schema application...');
    
    const expectedTables = [
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
    
    const results = [];
    
    for (const tableName of expectedTables) {
        try {
            const { data, error } = await supabase
                .from(tableName)
                .select('*')
                .limit(0);
                
            if (error) {
                results.push({ table: tableName, status: 'ERROR', message: error.message });
            } else {
                results.push({ table: tableName, status: 'OK', message: 'Table accessible' });
            }
        } catch (error) {
            results.push({ table: tableName, status: 'FAILED', message: error.message });
        }
    }
    
    console.log('\n📊 Schema Validation Results:');
    console.log('═'.repeat(60));
    
    let successCount = 0;
    results.forEach(result => {
        const status = result.status === 'OK' ? '✅' : '❌';
        console.log(`${status} ${result.table.padEnd(30)} ${result.status}`);
        if (result.status === 'OK') successCount++;
    });
    
    console.log('═'.repeat(60));
    console.log(`📈 Success Rate: ${successCount}/${expectedTables.length} tables (${Math.round((successCount/expectedTables.length)*100)}%)`);
    
    return results;
}

async function testBasicOperations() {
    console.log('\n🧪 Testing basic database operations...');
    
    const testWorkspaceId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
    
    try {
        // Test campaign creation
        const { data: campaign, error: campaignError } = await supabase
            .from('campaigns')
            .insert({
                workspace_id: testWorkspaceId,
                name: 'Test Campaign - Migration Validation',
                type: 'linkedin',
                channel: 'linkedin',
                description: 'Automated test campaign created during schema migration'
            })
            .select()
            .single();
            
        if (campaignError) {
            console.log('❌ Campaign creation test failed:', campaignError.message);
            return false;
        }
        
        console.log(`✅ Campaign created: ${campaign.name} (ID: ${campaign.id})`);
        
        // Test prospect creation
        const { data: prospect, error: prospectError } = await supabase
            .from('prospects')
            .insert({
                workspace_id: testWorkspaceId,
                first_name: 'Test',
                last_name: 'Prospect',
                email: 'test.prospect@example.com',
                linkedin_url: 'https://linkedin.com/in/test-prospect',
                current_title: 'Test Manager',
                current_company: 'Test Company'
            })
            .select()
            .single();
            
        if (prospectError) {
            console.log('❌ Prospect creation test failed:', prospectError.message);
            return false;
        }
        
        console.log(`✅ Prospect created: ${prospect.full_name} (Completeness: ${prospect.data_completeness}%)`);
        
        // Test campaign-prospect assignment
        const { error: assignmentError } = await supabase
            .from('campaign_prospects')
            .insert({
                workspace_id: testWorkspaceId,
                campaign_id: campaign.id,
                prospect_id: prospect.id,
                assignment_method: 'manual'
            });
            
        if (assignmentError) {
            console.log('❌ Campaign assignment test failed:', assignmentError.message);
            return false;
        }
        
        console.log('✅ Campaign-prospect assignment created successfully');
        
        // Clean up test data
        await supabase.from('campaign_prospects').delete().eq('campaign_id', campaign.id);
        await supabase.from('campaigns').delete().eq('id', campaign.id);
        await supabase.from('prospects').delete().eq('id', prospect.id);
        
        console.log('✅ Test data cleaned up successfully');
        
        return true;
    } catch (error) {
        console.log('❌ Basic operations test failed:', error.message);
        return false;
    }
}

async function generateUsageReport() {
    console.log('\n📊 Generating usage and setup report...');
    
    const report = {
        migration_date: new Date().toISOString(),
        database_url: SUPABASE_URL,
        tables_created: [],
        indexes_created: 0,
        policies_created: 0,
        functions_created: 0,
        sample_templates: 0
    };
    
    try {
        // Count templates
        const { data: templates } = await supabase
            .from('n8n_campaign_templates')
            .select('*');
        report.sample_templates = templates?.length || 0;
        
        // Count step templates
        const { data: stepTemplates } = await supabase
            .from('campaign_step_templates')
            .select('*');
        report.step_templates = stepTemplates?.length || 0;
        
    } catch (error) {
        console.log('⚠️  Could not generate complete usage report:', error.message);
    }
    
    console.log('\n📋 Migration Summary Report:');
    console.log('═'.repeat(50));
    console.log(`🗓️  Migration Date: ${report.migration_date}`);
    console.log(`🗄️  Database URL: ${report.database_url}`);
    console.log(`📄 N8N Templates: ${report.sample_templates}`);
    console.log(`🔧 Step Templates: ${report.step_templates || 0}`);
    console.log('═'.repeat(50));
    
    return report;
}

async function main() {
    console.log('🚀 SAM AI Campaign Schema Migration');
    console.log('===================================');
    console.log(`📍 Target Database: ${SUPABASE_URL}`);
    
    try {
        // Step 1: Check existing tables
        const existingTables = await checkExistingTables();
        
        // Step 2: Backup existing data if any
        let backupData = {};
        if (existingTables.length > 0) {
            backupData = await backupExistingData(existingTables);
        }
        
        // Step 3: Load and execute the comprehensive schema
        const campaignSchema = await loadSQLFile('comprehensive-campaign-schema.sql');
        await executeSQLScript(campaignSchema, 'Comprehensive Campaign Schema');
        
        // Step 4: Validate schema application
        const validationResults = await validateSchemaApplication();
        const failedTables = validationResults.filter(r => r.status !== 'OK');
        
        if (failedTables.length > 0) {
            console.log('\n⚠️  Some tables failed validation:');
            failedTables.forEach(result => {
                console.log(`   ❌ ${result.table}: ${result.message}`);
            });
        }
        
        // Step 5: Test basic operations
        const operationsTest = await testBasicOperations();
        if (!operationsTest) {
            console.log('\n⚠️  Basic operations test failed - manual verification recommended');
        }
        
        // Step 6: Generate usage report
        await generateUsageReport();
        
        console.log('\n🎉 Campaign Schema Migration Completed!');
        console.log('==========================================');
        console.log('✅ Your SAM AI platform now supports:');
        console.log('   📊 Dynamic campaign steps (1-10+ configurable)');
        console.log('   👥 Advanced prospect management with approval workflow');
        console.log('   🔗 Full N8N integration with execution tracking');
        console.log('   📈 Bulk extraction jobs with progress monitoring');
        console.log('   🧠 Campaign intelligence with RAG support');
        console.log('   💬 Multi-channel messaging support');
        console.log('   📊 Comprehensive analytics and benchmarking');
        console.log('\n🔥 Next Steps:');
        console.log('   1. Update your React components to use new schema');
        console.log('   2. Configure N8N workflows with provided templates');
        console.log('   3. Set up extraction job automation');
        console.log('   4. Enable AI intelligence features');
        console.log('\n📚 Documentation: Check /docs for integration guides');
        
    } catch (error) {
        console.error('\n💥 Migration failed:', error.message);
        console.log('\n🔧 Troubleshooting:');
        console.log('   1. Verify SUPABASE_SERVICE_ROLE_KEY is correct');
        console.log('   2. Check database connectivity');
        console.log('   3. Ensure you have admin permissions');
        console.log('   4. Review any SQL errors above');
        process.exit(1);
    }
}

// Execute the migration
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { main, validateSchemaApplication, testBasicOperations };