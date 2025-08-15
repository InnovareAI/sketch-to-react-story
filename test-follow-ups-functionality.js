#!/usr/bin/env node

/**
 * Test Follow-ups Functionality
 * This script tests the follow-ups page functionality and creates sample data
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Demo workspace ID (from the app configuration)
const DEMO_WORKSPACE_ID = 'df5d730f-1915-4269-bd5a-9534478b17af';

async function createSampleFollowUps() {
  console.log('🔧 Creating sample follow-ups data...');
  
  const sampleFollowUps = [
    {
      workspace_id: DEMO_WORKSPACE_ID,
      conversation_id: crypto.randomUUID(),
      content: 'Follow up on our conversation about the new product demo. Looking forward to hearing your thoughts!',
      scheduled_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      status: 'scheduled',
      priority: 'high',
      tags: ['demo', 'product'],
      reminder_enabled: true,
      notes: 'Potential high-value client',
      contact_info: {
        name: 'John Smith',
        email: 'john.smith@techcorp.com',
        company: 'TechCorp Solutions'
      },
      metadata: {
        from: 'John Smith',
        company: 'TechCorp Solutions',
        channel: 'linkedin',
        conversation_type: 'inbound'
      }
    },
    {
      workspace_id: DEMO_WORKSPACE_ID,
      conversation_id: crypto.randomUUID(),
      content: 'Check if Sarah has reviewed the proposal we sent last week.',
      scheduled_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // Day after tomorrow
      status: 'scheduled',
      priority: 'normal',
      tags: ['proposal', 'review'],
      reminder_enabled: true,
      notes: 'Sent proposal on Monday',
      contact_info: {
        name: 'Sarah Johnson',
        email: 'sarah.j@innovate.co',
        company: 'Innovate Co'
      },
      metadata: {
        from: 'Sarah Johnson',
        company: 'Innovate Co',
        channel: 'email',
        conversation_type: 'outbound'
      }
    },
    {
      workspace_id: DEMO_WORKSPACE_ID,
      conversation_id: crypto.randomUUID(),
      content: 'Thank Mike for the referral and update him on the progress.',
      scheduled_at: null,
      sent_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
      status: 'sent',
      priority: 'normal',
      tags: ['referral', 'thank-you'],
      reminder_enabled: false,
      notes: 'Great referral partner',
      contact_info: {
        name: 'Mike Chen',
        email: 'mike.chen@partner.com',
        company: 'Partner Networks'
      },
      metadata: {
        from: 'Mike Chen',
        company: 'Partner Networks',
        channel: 'linkedin',
        conversation_type: 'relationship',
        response_sent: true,
        response_content: 'Thank you so much for the referral, Mike! I wanted to update you on the progress...'
      }
    },
    {
      workspace_id: DEMO_WORKSPACE_ID,
      conversation_id: crypto.randomUUID(),
      content: 'Follow up on the integration timeline discussion with the CTO.',
      scheduled_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago (overdue)
      status: 'scheduled',
      priority: 'urgent',
      tags: ['integration', 'technical', 'cto'],
      reminder_enabled: true,
      notes: 'Time-sensitive project',
      contact_info: {
        name: 'Alex Rodriguez',
        email: 'alex.rodriguez@startup.io',
        company: 'StartupIO'
      },
      metadata: {
        from: 'Alex Rodriguez',
        company: 'StartupIO',
        channel: 'linkedin',
        conversation_type: 'technical',
        urgency: 'high'
      }
    },
    {
      workspace_id: DEMO_WORKSPACE_ID,
      conversation_id: crypto.randomUUID(),
      content: 'Reach out to Emma about the Q4 budget allocation for our solution.',
      scheduled_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Next week
      status: 'scheduled',
      priority: 'low',
      tags: ['budget', 'q4', 'planning'],
      reminder_enabled: true,
      notes: 'Budget planning season',
      contact_info: {
        name: 'Emma Wilson',
        email: 'emma.wilson@enterprise.com',
        company: 'Enterprise Solutions'
      },
      metadata: {
        from: 'Emma Wilson',
        company: 'Enterprise Solutions',
        channel: 'email',
        conversation_type: 'budget',
        quarter: 'Q4'
      }
    }
  ];

  try {
    // First, check if follow_ups table exists and clear existing demo data
    console.log('🧹 Clearing existing demo follow-ups...');
    const { error: deleteError } = await supabase
      .from('follow_ups')
      .delete()
      .eq('workspace_id', DEMO_WORKSPACE_ID);

    if (deleteError) {
      console.log('ℹ️  No existing data to clear or table doesn\'t exist yet');
    }

    // Insert sample data
    console.log('📝 Inserting sample follow-ups...');
    const { data, error } = await supabase
      .from('follow_ups')
      .insert(sampleFollowUps)
      .select();

    if (error) {
      console.error('❌ Error inserting sample follow-ups:', error);
      return false;
    }

    console.log(`✅ Successfully created ${data.length} sample follow-ups`);
    return true;
  } catch (error) {
    console.error('❌ Database operation failed:', error);
    return false;
  }
}

async function testFollowUpsQuery() {
  console.log('🔍 Testing follow-ups query...');
  
  try {
    const { data, error } = await supabase
      .from('follow_ups')
      .select('*')
      .eq('workspace_id', DEMO_WORKSPACE_ID)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error querying follow-ups:', error);
      return false;
    }

    console.log(`✅ Successfully queried ${data.length} follow-ups`);
    
    // Show sample of data
    if (data.length > 0) {
      console.log('\n📊 Sample follow-up data:');
      data.slice(0, 2).forEach((followUp, index) => {
        console.log(`${index + 1}. ${followUp.content.substring(0, 50)}...`);
        console.log(`   Status: ${followUp.status}, Priority: ${followUp.priority}`);
        console.log(`   From: ${followUp.metadata?.from || 'Unknown'}`);
        console.log('');
      });
    }
    
    return true;
  } catch (error) {
    console.error('❌ Query test failed:', error);
    return false;
  }
}

async function testTableSchema() {
  console.log('🔍 Testing follow_ups table schema...');
  
  try {
    // Try to query with all expected columns
    const { data, error } = await supabase
      .from('follow_ups')
      .select('id, workspace_id, conversation_id, content, scheduled_at, sent_at, status, tags, priority, reminder_enabled, notes, contact_info, metadata, created_at, updated_at')
      .eq('workspace_id', DEMO_WORKSPACE_ID)
      .limit(1);

    if (error) {
      console.error('❌ Schema test failed:', error);
      console.log('💡 This might indicate the follow_ups table doesn\'t exist or has wrong schema');
      return false;
    }

    console.log('✅ follow_ups table schema is correct');
    return true;
  } catch (error) {
    console.error('❌ Schema test error:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 Testing Follow-ups Functionality\n');
  
  // Test 1: Check table schema
  const schemaOk = await testTableSchema();
  if (!schemaOk) {
    console.log('\n❌ Table schema test failed. The follow_ups table may not exist.');
    console.log('💡 Run the SQL script: src/sql/create-follow-ups-table.sql');
    return;
  }
  
  // Test 2: Create sample data
  const dataCreated = await createSampleFollowUps();
  if (!dataCreated) {
    console.log('\n❌ Failed to create sample data');
    return;
  }
  
  // Test 3: Query the data
  const queryOk = await testFollowUpsQuery();
  if (!queryOk) {
    console.log('\n❌ Failed to query follow-ups data');
    return;
  }
  
  console.log('\n🎉 All tests passed! The follow-ups functionality should work correctly.');
  console.log('\n📱 You can now test the follow-ups page at:');
  console.log('   - Local: http://localhost:5173/follow-ups-public');
  console.log('   - Live: https://sameaisalesassistant.netlify.app/follow-ups-public');
}

// Run the tests
main().catch(console.error);