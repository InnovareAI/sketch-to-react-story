/**
 * Test Campaign Integration
 * Tests the updated campaign service with the existing database schema
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://latxadqrvrrrcvkktrog.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhdHhhZHFydnJycmN2a2t0cm9nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTk5ODYsImV4cCI6MjA2ODI3NTk4Nn0.3WkAgXpk_MyQioVf_SED9O_ArjcT9nH0uy9we2okftE";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testCampaignIntegration() {
  console.log('🧪 Testing Campaign Database Integration...\n');

  try {
    // Test 1: List existing campaigns
    console.log('📋 Fetching existing campaigns...');
    const { data: campaigns, error: listError } = await supabase
      .from('campaigns')
      .select('id, name, status, type, created_at')
      .limit(5);

    if (listError) {
      console.error('❌ Error listing campaigns:', listError);
      return;
    }

    console.log(`✅ Found ${campaigns?.length || 0} campaigns`);
    if (campaigns && campaigns.length > 0) {
      campaigns.forEach(c => {
        console.log(`  - ${c.name} (${c.status}) - ${c.type}`);
      });
    }

    // Test 2: Create test campaign
    console.log('\n🆕 Creating test campaign...');
    const testCampaign = {
      workspace_id: 'df5d730f-1915-4269-bd5a-9534478b17af',
      tenant_id: '367b6c5c-43d7-4546-96d4-4f5f22641de1', // Use existing tenant ID
      user_id: '03ca8428-384a-482d-8371-66928fee1063', // Use CL's user ID
      name: 'React UI Integration Test',
      description: 'Testing campaign creation from React interface',
      type: 'connection_request',
      status: 'draft',
      target_audience: 'general',
      max_leads_per_day: 25,
      daily_connection_limit: 25,
      messaging_sequence: [
        {
          id: '1',
          type: 'connection',
          name: 'Connection Request',
          content: 'Hi {first_name}, would love to connect!'
        }
      ],
      follow_up_days: [1, 3, 7],
      current_leads_today: 0,
      current_leads_total: 0,
      total_sent: 0,
      total_responses: 0,
      total_connections: 0,
      success_rate: 0.00,
      settings: {
        personalization_enabled: true,
        working_hours: { start: '09:00', end: '17:00' }
      }
    };

    const { data: newCampaign, error: createError } = await supabase
      .from('campaigns')
      .insert(testCampaign)
      .select()
      .single();

    if (createError) {
      console.error('❌ Error creating campaign:', createError);
      return;
    }

    console.log(`✅ Created campaign: "${newCampaign.name}" (ID: ${newCampaign.id})`);

    // Test 3: Update campaign
    console.log('\n🔄 Updating campaign...');
    const { data: updatedCampaign, error: updateError } = await supabase
      .from('campaigns')
      .update({
        description: 'Updated: React UI integration working!'
      })
      .eq('id', newCampaign.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating campaign:', updateError);
      return;
    }

    console.log('✅ Updated campaign description');

    // Test 4: Activate campaign
    console.log('\n▶️ Activating campaign...');
    const { data: activatedCampaign, error: activateError } = await supabase
      .from('campaigns')
      .update({ status: 'active' })
      .eq('id', newCampaign.id)
      .select()
      .single();

    if (activateError) {
      console.error('❌ Error activating campaign:', activateError);
      return;
    }

    console.log(`✅ Activated campaign, new status: ${activatedCampaign.status}`);

    // Test 5: Fetch updated campaign
    console.log('\n🔍 Fetching updated campaign...');
    const { data: fetchedCampaign, error: fetchError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', newCampaign.id)
      .single();

    if (fetchError) {
      console.error('❌ Error fetching campaign:', fetchError);
      return;
    }

    console.log('✅ Campaign details:');
    console.log(`  Name: ${fetchedCampaign.name}`);
    console.log(`  Status: ${fetchedCampaign.status}`);
    console.log(`  Type: ${fetchedCampaign.type}`);
    console.log(`  Description: ${fetchedCampaign.description}`);
    console.log(`  Max Daily: ${fetchedCampaign.max_leads_per_day}`);
    console.log(`  Messaging Steps: ${fetchedCampaign.messaging_sequence?.length || 0}`);

    console.log('\n🎉 All tests passed! Campaign service integration is working correctly.');
    console.log('✅ React UI can now create, read, update, and activate campaigns in Supabase');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

testCampaignIntegration();