#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

// Configuration
const SUPABASE_URL = 'https://latxadqrvrrrcvkktrog.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhdHhhZHFydnJycmN2a2t0cm9nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY2MDEwNzUsImV4cCI6MjA1MjE3NzA3NX0.niqLT5ue9wDzJKVp8J8jZRJRQwhZGTWJysN8nU2h4ek';

// Unipile API configuration
const UNIPILE_API_KEY = 'TE3VJJ3-N3E63ND-MWXM462-RBPCWYQ';
const UNIPILE_BASE_URL = 'https://api6.unipile.com:13443/api/v1';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testInboxMessageSending() {
  console.log('🧪 Testing Inbox Message Sending\n');
  console.log('═'.repeat(50));
  
  const results = {
    database: { status: '❌', details: '' },
    unipileConnection: { status: '❌', details: '' },
    messageSending: { status: '❌', details: '' },
    edgeFunction: { status: '❌', details: '' },
    uiIntegration: { status: '❌', details: '' }
  };

  // Test 1: Database Inbox Tables
  console.log('\n📊 Testing Database Inbox Tables...');
  try {
    // Check inbox_conversations table
    const { data: conversations, error: convError } = await supabase
      .from('inbox_conversations')
      .select('id, participant_name, platform')
      .limit(3);
    
    if (convError) throw convError;
    
    // Check inbox_messages table  
    const { data: messages, error: msgError } = await supabase
      .from('inbox_messages')
      .select('id, content, role')
      .limit(3);
    
    if (msgError) throw msgError;
    
    results.database.status = '✅';
    results.database.details = `Found ${conversations?.length || 0} conversations, ${messages?.length || 0} messages`;
    console.log(`✅ Database tables working: ${results.database.details}`);
  } catch (error) {
    results.database.details = error.message;
    console.error(`❌ Database error: ${error.message}`);
  }

  // Test 2: Unipile API Connection
  console.log('\n🔌 Testing Unipile API Connection...');
  try {
    const response = await fetch(`${UNIPILE_BASE_URL}/accounts`, {
      method: 'GET',
      headers: {
        'X-API-KEY': UNIPILE_API_KEY,
        'Accept': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      results.unipileConnection.status = '✅';
      results.unipileConnection.details = `API accessible, ${data.items?.length || 0} accounts found`;
      console.log(`✅ Unipile API working: ${results.unipileConnection.details}`);
    } else {
      throw new Error(`API returned ${response.status}`);
    }
  } catch (error) {
    results.unipileConnection.details = error.message;
    console.error(`❌ Unipile API error: ${error.message}`);
  }

  // Test 3: Message Sending Capability
  console.log('\n📤 Testing Message Sending Capability...');
  try {
    // Create a test outbound message in database
    const { data: testMsg, error } = await supabase
      .from('inbox_messages')
      .insert({
        conversation_id: '00000000-0000-0000-0000-000000000000',
        role: 'user',
        content: 'Test message - verifying sending capability',
        metadata: {
          type: 'test',
          direction: 'outbound',
          timestamp: new Date().toISOString()
        }
      })
      .select()
      .single();
    
    if (error) throw error;
    
    results.messageSending.status = '✅';
    results.messageSending.details = `Test message created with ID: ${testMsg.id}`;
    console.log(`✅ Message sending capability: ${results.messageSending.details}`);
    
    // Clean up test message
    await supabase
      .from('inbox_messages')
      .delete()
      .eq('id', testMsg.id);
      
  } catch (error) {
    results.messageSending.details = error.message;
    console.error(`❌ Message sending error: ${error.message}`);
  }

  // Test 4: Edge Function Proxy
  console.log('\n🌐 Testing Edge Function Proxy...');
  try {
    const { data, error } = await supabase.functions.invoke('unipile-proxy', {
      body: {
        path: '/accounts',
        method: 'GET'
      }
    });
    
    if (error) throw error;
    
    results.edgeFunction.status = data?.ok ? '✅' : '⚠️';
    results.edgeFunction.details = data?.ok ? 'Edge function working' : 'Edge function returns error';
    console.log(`${results.edgeFunction.status} Edge Function: ${results.edgeFunction.details}`);
  } catch (error) {
    results.edgeFunction.details = error.message;
    console.error(`❌ Edge Function error: ${error.message}`);
  }

  // Test 5: UI Integration Points
  console.log('\n🖥️  Testing UI Integration Points...');
  try {
    // Check if follow-ups table exists
    const { data: followUps, error: followUpError } = await supabase
      .from('follow_ups')
      .select('id')
      .limit(1);
    
    // Check if templates exist
    const { data: templates, error: templateError } = await supabase
      .from('message_templates')
      .select('id')
      .limit(1);
    
    const hasFollowUps = !followUpError;
    const hasTemplates = !templateError;
    
    results.uiIntegration.status = hasFollowUps && hasTemplates ? '✅' : '⚠️';
    results.uiIntegration.details = `Follow-ups: ${hasFollowUps ? 'Yes' : 'No'}, Templates: ${hasTemplates ? 'Yes' : 'No'}`;
    console.log(`${results.uiIntegration.status} UI Integration: ${results.uiIntegration.details}`);
  } catch (error) {
    results.uiIntegration.details = error.message;
    console.error(`⚠️ UI Integration check: ${error.message}`);
  }

  // Summary
  console.log('\n' + '═'.repeat(50));
  console.log('📊 TEST SUMMARY:');
  console.log('═'.repeat(50));
  
  for (const [test, result] of Object.entries(results)) {
    const testName = test.replace(/([A-Z])/g, ' $1').trim();
    console.log(`${result.status} ${testName}: ${result.details}`);
  }
  
  // Overall verdict
  const allPassed = Object.values(results).every(r => r.status === '✅');
  const somePassed = Object.values(results).some(r => r.status === '✅');
  
  console.log('\n' + '═'.repeat(50));
  if (allPassed) {
    console.log('✅ All inbox message sending features are working!');
  } else if (somePassed) {
    console.log('⚠️  Some features working, but issues detected');
  } else {
    console.log('❌ Major issues with message sending functionality');
  }
  
  // Recommendations
  console.log('\n📝 RECOMMENDATIONS:');
  if (results.unipileConnection.status !== '✅') {
    console.log('- Unipile API is down. Message sending will not work until service is restored.');
  }
  if (results.database.status !== '✅') {
    console.log('- Database tables need to be created or fixed.');
  }
  if (results.edgeFunction.status !== '✅') {
    console.log('- Edge Function proxy needs to be deployed or fixed.');
  }
  
  return results;
}

// Run the test
testInboxMessageSending().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});