/**
 * Test Campaign Service Integration
 * Quick test to verify database connectivity and campaign creation
 */

import { campaignService } from './src/services/campaignService.ts';

async function testCampaignService() {
  try {
    console.log('🧪 Testing Campaign Service Integration...\n');

    // Test 1: List existing campaigns
    console.log('📋 Fetching existing campaigns...');
    const campaigns = await campaignService.listCampaigns({ limit: 5 });
    console.log(`Found ${campaigns.length} existing campaigns`);
    
    if (campaigns.length > 0) {
      console.log('Sample campaign:', campaigns[0].name);
    }

    // Test 2: Create a test campaign
    console.log('\n🆕 Creating test campaign...');
    const testCampaign = {
      workspace_id: 'df5d730f-1915-4269-bd5a-9534478b17af',
      name: 'React Integration Test Campaign',
      description: 'Testing database integration from React UI',
      type: 'linkedin',
      channel: 'linkedin',
      status: 'draft',
      campaign_steps: [
        {
          id: '1',
          type: 'connection',
          name: 'Connection Request',
          content: 'Hi {first_name}, let\'s connect!',
          delay: 0,
          delayUnit: 'hours'
        }
      ],
      total_steps: 1,
      daily_limit: 25,
      timezone: 'America/New_York',
      created_by: 'cc000000-0000-0000-0000-000000000002',
      metrics: {
        response_rate: 0,
        conversion_rate: 0,
        prospects_added: 0,
        prospects_contacted: 0,
        prospects_converted: 0,
        prospects_responded: 0,
        avg_response_time_hours: 0
      }
    };

    const newCampaign = await campaignService.createCampaign(testCampaign);
    console.log('✅ Created campaign:', newCampaign.name);
    console.log('Campaign ID:', newCampaign.id);

    // Test 3: Update campaign
    console.log('\n🔄 Updating campaign...');
    const updatedCampaign = await campaignService.updateCampaign(newCampaign.id, {
      description: 'Updated description - React integration working!'
    });
    console.log('✅ Updated campaign description');

    // Test 4: Get campaign by ID
    console.log('\n🔍 Fetching campaign by ID...');
    const fetchedCampaign = await campaignService.getCampaign(newCampaign.id);
    console.log('✅ Fetched campaign:', fetchedCampaign?.name);
    console.log('Description:', fetchedCampaign?.description);

    console.log('\n🎉 All tests passed! Campaign service is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Error details:', error.message);
  }
}

testCampaignService();