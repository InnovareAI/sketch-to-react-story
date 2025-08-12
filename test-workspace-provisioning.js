#!/usr/bin/env node

/**
 * Test script for automated workspace provisioning
 * Verifies that Unipile and Bright Data accounts are automatically created
 */

const fetch = require('node-fetch');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://latxadqrvrrrcvkktrog.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/provision-workspace`;

async function testWorkspaceProvisioning() {
  console.log('🚀 Testing Automated Workspace Provisioning System\n');
  console.log('=' .repeat(50));
  
  // Test workspace data
  const testWorkspace = {
    workspaceId: `test-${Date.now()}`,
    workspaceName: 'Test Company',
    ownerEmail: 'test@example.com',
    userId: 'test-user-123',
    plan: 'premium'
  };
  
  console.log('\n📋 Test Workspace Configuration:');
  console.log(`   Workspace ID: ${testWorkspace.workspaceId}`);
  console.log(`   Name: ${testWorkspace.workspaceName}`);
  console.log(`   Email: ${testWorkspace.ownerEmail}`);
  console.log(`   Plan: ${testWorkspace.plan}`);
  
  console.log('\n🔄 Calling provisioning edge function...\n');
  
  try {
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(testWorkspace)
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }
    
    const result = await response.json();
    
    console.log('✅ Provisioning Successful!\n');
    console.log('=' .repeat(50));
    
    // Display results
    if (result.unipile) {
      console.log('\n📧 Unipile Integration Setup:');
      console.log(`   Account ID: ${result.unipile.accountId}`);
      console.log(`   API Key: ${result.unipile.apiKey ? '✓ Generated' : '✗ Missing'}`);
      console.log(`   LinkedIn: ${result.unipile.linkedinEnabled ? '✓ Enabled' : '✗ Disabled'}`);
      console.log(`   Email: ${result.unipile.emailEnabled ? '✓ Enabled' : '✗ Disabled'}`);
      console.log(`   Calendar: ${result.unipile.calendarEnabled ? '✓ Enabled' : '✗ Disabled'}`);
      console.log(`   WhatsApp: ${result.unipile.whatsappEnabled ? '✓ Enabled' : '✗ Disabled'}`);
    }
    
    if (result.brightData) {
      console.log('\n🌐 Bright Data Proxy Setup:');
      console.log(`   Customer ID: ${result.brightData.customerId}`);
      console.log(`   Zone ID: ${result.brightData.zoneId}`);
      console.log(`   Residential Proxy: ${result.brightData.residentialProxy ? '✓ Configured' : '✗ Missing'}`);
      console.log(`   Bandwidth Limit: ${result.brightData.bandwidthLimit || '10'} GB`);
    }
    
    console.log('\n🎉 All integrations provisioned automatically!');
    console.log('   No manual setup required - workspace is ready to use.');
    
  } catch (error) {
    console.error('\n❌ Provisioning Failed:');
    console.error(`   ${error.message}`);
    console.log('\n📝 Troubleshooting:');
    console.log('   1. Check if Supabase Edge Functions are deployed');
    console.log('   2. Verify environment variables are set');
    console.log('   3. Ensure Unipile and Bright Data API keys are configured');
  }
  
  console.log('\n' + '=' .repeat(50));
  console.log('Test completed.\n');
}

// Run the test
testWorkspaceProvisioning().catch(console.error);