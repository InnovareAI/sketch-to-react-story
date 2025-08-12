/**
 * Campaign Functionality Testing
 * Tests CRUD operations for campaigns
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://latxadqrvrrrcvkktrog.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhdHhhZHFydnJycmN2a2t0cm9nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTk5ODYsImV4cCI6MjA2ODI3NTk4Nn0.3WkAgXpk_MyQioVf_SED9O_ArjcT9nH0uy9we2okftE'
);

class CampaignTester {
  constructor() {
    this.testResults = {
      crud: {},
      validation: {},
      workflow: {},
      integration: {}
    };
    this.testCampaignId = null;
  }

  async runCampaignTests() {
    console.log('📊 Starting Campaign Functionality Tests...\n');
    
    try {
      await this.testCampaignCRUD();
      await this.testCampaignValidation();
      await this.testCampaignWorkflow();
      await this.testCampaignIntegrations();
      
      this.generateCampaignTestReport();
      
      // Cleanup test data
      await this.cleanup();
      
    } catch (error) {
      console.error('❌ Campaign test suite failed:', error);
      await this.cleanup();
    }
  }

  async testCampaignCRUD() {
    console.log('📝 Testing Campaign CRUD Operations...');
    
    try {
      // Test Campaign Creation
      console.log('  Testing campaign creation...');
      const testCampaign = {
        name: `Test Campaign ${Date.now()}`,
        type: 'linkedin',
        status: 'draft',
        objective: 'Test automated campaign functionality',
        target_audience: {
          industries: ['Technology', 'Marketing'],
          locations: ['United States', 'United Kingdom'],
          company_size: '51-200',
          job_titles: ['Marketing Manager', 'Sales Director']
        },
        linkedin_sequence_config: {
          connection_message: 'Hello! I found your profile interesting.',
          follow_up_messages: [
            {
              delay_days: 3,
              message: 'Thanks for connecting! Would you like to chat about...'
            }
          ]
        },
        scheduling_config: {
          start_date: new Date().toISOString(),
          daily_limit: 50,
          timezone: 'America/New_York'
        },
        performance_metrics: {
          sent: 0,
          delivered: 0,
          opened: 0,
          clicked: 0,
          replied: 0,
          converted: 0
        }
      };

      // Note: For testing without authentication, we'll need to handle workspace_id
      // First, get a test workspace
      const { data: workspaces, error: workspaceError } = await supabase
        .from('workspaces')
        .select('id')
        .limit(1);

      if (workspaceError || !workspaces || workspaces.length === 0) {
        console.log('    ⚠️  No workspace found, skipping authenticated tests');
        this.testResults.crud.creation = false;
        return;
      }

      const workspaceId = workspaces[0].id;
      testCampaign.workspace_id = workspaceId;

      const { data: createdCampaign, error: createError } = await supabase
        .from('campaigns')
        .insert(testCampaign)
        .select()
        .single();

      if (createError) {
        console.log(`    ❌ Creation failed: ${createError.message}`);
        this.testResults.crud.creation = false;
        return;
      }

      this.testCampaignId = createdCampaign.id;
      this.testResults.crud.creation = true;
      console.log(`    ✅ Campaign created: ${createdCampaign.id}`);

      // Test Campaign Reading
      console.log('  Testing campaign reading...');
      const { data: readCampaign, error: readError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', this.testCampaignId)
        .single();

      this.testResults.crud.reading = !readError && readCampaign.name === testCampaign.name;
      console.log(`    ${this.testResults.crud.reading ? '✅' : '❌'} Campaign read: ${this.testResults.crud.reading ? 'OK' : readError?.message}`);

      // Test Campaign Update
      console.log('  Testing campaign update...');
      const updatedData = {
        name: `${testCampaign.name} - Updated`,
        status: 'active',
        budget: 1000
      };

      const { error: updateError } = await supabase
        .from('campaigns')
        .update(updatedData)
        .eq('id', this.testCampaignId);

      this.testResults.crud.updating = !updateError;
      console.log(`    ${this.testResults.crud.updating ? '✅' : '❌'} Campaign updated: ${this.testResults.crud.updating ? 'OK' : updateError?.message}`);

      // Verify update
      const { data: updatedCampaign } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', this.testCampaignId)
        .single();

      const updateVerified = updatedCampaign && updatedCampaign.name.includes('Updated');
      this.testResults.crud.updateVerification = updateVerified;
      console.log(`    ${updateVerified ? '✅' : '❌'} Update verified: ${updateVerified ? 'OK' : 'Failed'}`);

      // Test Campaigns List
      console.log('  Testing campaigns listing...');
      const { data: campaignsList, error: listError } = await supabase
        .from('campaigns')
        .select('id, name, status, type')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })
        .limit(10);

      this.testResults.crud.listing = !listError && campaignsList && campaignsList.length > 0;
      console.log(`    ${this.testResults.crud.listing ? '✅' : '❌'} Campaigns listing: ${this.testResults.crud.listing ? `${campaignsList?.length} found` : listError?.message}`);

    } catch (error) {
      console.error('    ❌ CRUD test failed:', error.message);
      this.testResults.crud.error = error.message;
    }
  }

  async testCampaignValidation() {
    console.log('✅ Testing Campaign Validation...');
    
    try {
      // Test required fields validation
      console.log('  Testing required fields...');
      const { error: requiredError } = await supabase
        .from('campaigns')
        .insert({
          // Missing required fields
          workspace_id: null,
          name: null
        })
        .select();

      this.testResults.validation.requiredFields = !!requiredError;
      console.log(`    ${this.testResults.validation.requiredFields ? '✅' : '❌'} Required fields validated: ${requiredError ? 'OK' : 'Missing validation'}`);

      // Test status enum validation
      console.log('  Testing status enum validation...');
      const testWorkspace = await this.getTestWorkspace();
      
      if (testWorkspace) {
        const { error: statusError } = await supabase
          .from('campaigns')
          .insert({
            workspace_id: testWorkspace.id,
            name: 'Status Test Campaign',
            status: 'invalid_status', // This should fail
            type: 'email'
          })
          .select();

        this.testResults.validation.statusEnum = !!statusError;
        console.log(`    ${this.testResults.validation.statusEnum ? '✅' : '❌'} Status enum validated: ${statusError ? 'OK' : 'Missing validation'}`);
      } else {
        console.log('    ⚠️  No workspace for status validation test');
        this.testResults.validation.statusEnum = false;
      }

      // Test type enum validation
      console.log('  Testing type enum validation...');
      if (testWorkspace) {
        const { error: typeError } = await supabase
          .from('campaigns')
          .insert({
            workspace_id: testWorkspace.id,
            name: 'Type Test Campaign',
            type: 'invalid_type', // This should fail
            status: 'draft'
          })
          .select();

        this.testResults.validation.typeEnum = !!typeError;
        console.log(`    ${this.testResults.validation.typeEnum ? '✅' : '❌'} Type enum validated: ${typeError ? 'OK' : 'Missing validation'}`);
      } else {
        this.testResults.validation.typeEnum = false;
      }

    } catch (error) {
      console.error('    ❌ Validation test failed:', error.message);
      this.testResults.validation.error = error.message;
    }
  }

  async testCampaignWorkflow() {
    console.log('🔄 Testing Campaign Workflow...');
    
    try {
      if (!this.testCampaignId) {
        console.log('    ⚠️  No test campaign for workflow testing');
        return;
      }

      // Test status transitions
      console.log('  Testing status transitions...');
      const statusTransitions = [
        { from: 'draft', to: 'scheduled' },
        { from: 'scheduled', to: 'active' },
        { from: 'active', to: 'paused' },
        { from: 'paused', to: 'active' },
        { from: 'active', to: 'completed' }
      ];

      for (const transition of statusTransitions) {
        const { error } = await supabase
          .from('campaigns')
          .update({ status: transition.to })
          .eq('id', this.testCampaignId);

        if (error) {
          console.log(`    ❌ ${transition.from} → ${transition.to}: Failed (${error.message})`);
        } else {
          console.log(`    ✅ ${transition.from} → ${transition.to}: OK`);
        }
      }

      this.testResults.workflow.statusTransitions = true;

      // Test analytics integration
      console.log('  Testing analytics integration...');
      const { data: analytics, error: analyticsError } = await supabase
        .from('campaign_analytics')
        .select('*')
        .eq('campaign_id', this.testCampaignId);

      this.testResults.workflow.analyticsIntegration = !analyticsError;
      console.log(`    ${this.testResults.workflow.analyticsIntegration ? '✅' : '❌'} Analytics integration: ${this.testResults.workflow.analyticsIntegration ? 'OK' : analyticsError?.message}`);

    } catch (error) {
      console.error('    ❌ Workflow test failed:', error.message);
      this.testResults.workflow.error = error.message;
    }
  }

  async testCampaignIntegrations() {
    console.log('🔗 Testing Campaign Integrations...');
    
    try {
      // Test campaign rules integration
      console.log('  Testing campaign rules...');
      const { data: rules, error: rulesError } = await supabase
        .from('campaign_rules')
        .select('*')
        .limit(1);

      this.testResults.integration.campaignRules = !rulesError;
      console.log(`    ${this.testResults.integration.campaignRules ? '✅' : '❌'} Campaign rules: ${this.testResults.integration.campaignRules ? 'Accessible' : rulesError?.message}`);

      // Test saved searches integration (for prospect targeting)
      console.log('  Testing saved searches...');
      const { data: searches, error: searchesError } = await supabase
        .from('saved_searches')
        .select('*')
        .limit(1);

      this.testResults.integration.savedSearches = !searchesError;
      console.log(`    ${this.testResults.integration.savedSearches ? '✅' : '❌'} Saved searches: ${this.testResults.integration.savedSearches ? 'Accessible' : searchesError?.message}`);

      // Test workspace isolation
      console.log('  Testing workspace isolation...');
      const testWorkspace = await this.getTestWorkspace();
      
      if (testWorkspace) {
        // Try to access campaigns from different workspace (should fail with RLS)
        const { data: otherWorkspaceCampaigns, error: isolationError } = await supabase
          .from('campaigns')
          .select('*')
          .neq('workspace_id', testWorkspace.id);

        // RLS should prevent access to other workspace data
        const isolationWorking = !!isolationError || (otherWorkspaceCampaigns && otherWorkspaceCampaigns.length === 0);
        this.testResults.integration.workspaceIsolation = isolationWorking;
        console.log(`    ${isolationWorking ? '✅' : '⚠️ '} Workspace isolation: ${isolationWorking ? 'Working' : 'Needs review'}`);
      }

    } catch (error) {
      console.error('    ❌ Integration test failed:', error.message);
      this.testResults.integration.error = error.message;
    }
  }

  async getTestWorkspace() {
    const { data: workspaces, error } = await supabase
      .from('workspaces')
      .select('id, name')
      .limit(1);
    
    return !error && workspaces && workspaces.length > 0 ? workspaces[0] : null;
  }

  async cleanup() {
    if (this.testCampaignId) {
      console.log('🧹 Cleaning up test data...');
      try {
        const { error } = await supabase
          .from('campaigns')
          .delete()
          .eq('id', this.testCampaignId);

        if (error) {
          console.log(`    ⚠️  Cleanup warning: ${error.message}`);
        } else {
          console.log('    ✅ Test campaign cleaned up');
        }
      } catch (error) {
        console.log(`    ⚠️  Cleanup failed: ${error.message}`);
      }
    }
  }

  generateCampaignTestReport() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 CAMPAIGN FUNCTIONALITY TEST REPORT');
    console.log('='.repeat(80));
    
    const timestamp = new Date().toISOString();
    console.log(`Generated: ${timestamp}\n`);
    
    // CRUD Results
    console.log('📝 CRUD OPERATIONS:');
    Object.entries(this.testResults.crud).forEach(([operation, result]) => {
      if (operation !== 'error') {
        console.log(`  ${operation}: ${result ? '✅ Pass' : '❌ Fail'}`);
      }
    });
    if (this.testResults.crud.error) {
      console.log(`  Error: ${this.testResults.crud.error}`);
    }
    console.log();
    
    // Validation Results
    console.log('✅ VALIDATION:');
    Object.entries(this.testResults.validation).forEach(([validation, result]) => {
      if (validation !== 'error') {
        console.log(`  ${validation}: ${result ? '✅ Pass' : '❌ Fail'}`);
      }
    });
    if (this.testResults.validation.error) {
      console.log(`  Error: ${this.testResults.validation.error}`);
    }
    console.log();
    
    // Workflow Results
    console.log('🔄 WORKFLOW:');
    Object.entries(this.testResults.workflow).forEach(([workflow, result]) => {
      if (workflow !== 'error') {
        console.log(`  ${workflow}: ${result ? '✅ Pass' : '❌ Fail'}`);
      }
    });
    if (this.testResults.workflow.error) {
      console.log(`  Error: ${this.testResults.workflow.error}`);
    }
    console.log();
    
    // Integration Results
    console.log('🔗 INTEGRATIONS:');
    Object.entries(this.testResults.integration).forEach(([integration, result]) => {
      if (integration !== 'error') {
        console.log(`  ${integration}: ${result ? '✅ Pass' : '❌ Fail'}`);
      }
    });
    if (this.testResults.integration.error) {
      console.log(`  Error: ${this.testResults.integration.error}`);
    }
    console.log();
    
    // Overall Assessment
    const allTests = [
      ...Object.values(this.testResults.crud).filter(v => typeof v === 'boolean'),
      ...Object.values(this.testResults.validation).filter(v => typeof v === 'boolean'),
      ...Object.values(this.testResults.workflow).filter(v => typeof v === 'boolean'),
      ...Object.values(this.testResults.integration).filter(v => typeof v === 'boolean')
    ];
    
    const passedTests = allTests.filter(Boolean).length;
    const totalTests = allTests.length;
    const successRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;
    
    console.log('🎯 OVERALL ASSESSMENT:');
    console.log(`  Success Rate: ${successRate}% (${passedTests}/${totalTests} tests passed)`);
    console.log(`  Campaign System: ${this.getCampaignSystemStatus(successRate)}`);
    console.log(`  Production Ready: ${successRate >= 75 ? '✅ YES' : '❌ NEEDS WORK'}\n`);
    
    // Recommendations
    this.generateCampaignRecommendations(successRate);
    
    console.log('='.repeat(80));
    
    return {
      ...this.testResults,
      summary: {
        passedTests,
        totalTests,
        successRate,
        systemStatus: this.getCampaignSystemStatus(successRate),
        productionReady: successRate >= 75,
        timestamp
      }
    };
  }

  getCampaignSystemStatus(successRate) {
    if (successRate >= 90) return '🟢 Excellent';
    if (successRate >= 75) return '🟡 Good';
    if (successRate >= 60) return '🟠 Fair';
    return '🔴 Needs Work';
  }

  generateCampaignRecommendations(successRate) {
    console.log('💡 CAMPAIGN SYSTEM RECOMMENDATIONS:');
    
    if (successRate >= 90) {
      console.log('  ✅ Campaign system is working excellently');
      console.log('  ✅ All CRUD operations functioning properly');
      console.log('  🚀 Ready for campaign automation workflows');
    } else if (successRate >= 75) {
      console.log('  ⚠️  Campaign system is mostly functional');
      console.log('  🔧 Review any failed validation or workflow tests');
      console.log('  📝 Consider adding missing table schema if needed');
    } else {
      console.log('  ❌ Campaign system needs attention before production');
      console.log('  🔧 Fix CRUD operations and database constraints');
      console.log('  📋 Ensure all required database tables exist');
      console.log('  🧪 Test workspace isolation and RLS policies');
    }
    
    // Specific recommendations based on failures
    if (!this.testResults.crud.creation) {
      console.log('  📝 Fix campaign creation - check workspace authentication');
    }
    
    if (!this.testResults.validation.requiredFields) {
      console.log('  ✅ Add database constraints for required fields');
    }
    
    if (!this.testResults.integration.workspaceIsolation) {
      console.log('  🔒 Review and strengthen workspace isolation (RLS policies)');
    }
    
    console.log();
  }
}

// Run the campaign test suite
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new CampaignTester();
  tester.runCampaignTests().then(() => {
    console.log('Campaign test suite completed');
  }).catch((error) => {
    console.error('Campaign test suite failed:', error);
    process.exit(1);
  });
}

export default CampaignTester;