#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ktchrfgkbpaixbiwbieg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0Y2hyZmdrYnBhaXhiaXdiaWVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0MTQ1NjAsImV4cCI6MjA2Nzk5MDU2MH0.NH8E52ypjXoI4wMVuXkaXkrwzw7vr7dYRk48sHuqMkw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testQueries() {
  console.log('🔍 Testing database queries...\n');
  
  try {
    // 1. Test workspace query
    console.log('1️⃣ Testing workspace query...');
    const { data: workspace, error: wsError } = await supabase
      .from('workspaces')
      .select('id, name')
      .limit(1)
      .single();
      
    if (wsError) {
      console.error('❌ Workspace error:', wsError);
      return;
    }
    
    console.log('✅ Workspace found:', workspace.name, '(' + workspace.id + ')');
    
    // 2. Test inbox_conversations query
    console.log('\n2️⃣ Testing inbox_conversations query...');
    const { data: conversations, error: convError } = await supabase
      .from('inbox_conversations')
      .select('*')
      .eq('workspace_id', workspace.id)
      .limit(5);
      
    if (convError) {
      console.error('❌ Conversations error:', convError);
      return;
    }
    
    console.log(`✅ Found ${conversations.length} conversations`);
    conversations.forEach(c => {
      console.log(`   - ${c.participant_name} from ${c.participant_company}`);
    });
    
    // 3. Test joined query
    console.log('\n3️⃣ Testing joined query with messages...');
    const { data: convWithMessages, error: joinError } = await supabase
      .from('inbox_conversations')
      .select(`
        *,
        inbox_messages (*)
      `)
      .eq('workspace_id', workspace.id)
      .limit(3);
      
    if (joinError) {
      console.error('❌ Join error:', joinError);
      return;
    }
    
    console.log(`✅ Found ${convWithMessages.length} conversations with messages`);
    convWithMessages.forEach(c => {
      console.log(`   - ${c.participant_name}: ${c.inbox_messages?.length || 0} messages`);
    });
    
    // 4. Test if we can insert
    console.log('\n4️⃣ Testing insert capability...');
    const testId = 'test_' + Date.now();
    const { error: insertError } = await supabase
      .from('inbox_conversations')
      .upsert({
        workspace_id: workspace.id,
        platform: 'linkedin',
        platform_conversation_id: testId,
        participant_name: 'Test Insert',
        participant_company: 'Test Company',
        status: 'active'
      });
      
    if (insertError) {
      console.error('❌ Insert error:', insertError);
    } else {
      console.log('✅ Test insert successful');
      
      // Clean up
      await supabase
        .from('inbox_conversations')
        .delete()
        .eq('platform_conversation_id', testId);
    }
    
    console.log('\n✅ All tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
  
  process.exit(0);
}

testQueries();