#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ktchrfgkbpaixbiwbieg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0Y2hyZmdrYnBhaXhiaXdiaWVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0MTQ1NjAsImV4cCI6MjA2Nzk5MDU2MH0.NH8E52ypjXoI4wMVuXkaXkrwzw7vr7dYRk48sHuqMkw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInboxSync() {
  console.log('🚀 Testing LinkedIn inbox sync...\n');
  
  try {
    // Get first workspace
    const { data: workspaces } = await supabase
      .from('workspaces')
      .select('id, name')
      .limit(1);
      
    if (!workspaces || workspaces.length === 0) {
      console.error('No workspaces found');
      return;
    }
    
    const workspaceId = workspaces[0].id;
    console.log(`✅ Using workspace: ${workspaces[0].name} (${workspaceId})\n`);
    
    // Create sample LinkedIn conversations
    const sampleConversations = [
      {
        participant_name: 'John Smith',
        participant_company: 'Tech Solutions Inc.',
        message: 'Hi! I saw your profile and would love to connect about B2B opportunities.',
      },
      {
        participant_name: 'Sarah Johnson',
        participant_company: 'Innovation Labs',
        message: 'Thanks for connecting! Our AI platform could help your sales team.',
      },
      {
        participant_name: 'Michael Chen',
        participant_company: 'Growth Partners',
        message: 'Great meeting you at the conference! Let\'s schedule a follow-up.',
      }
    ];
    
    console.log('📥 Creating LinkedIn conversations...\n');
    
    for (const conv of sampleConversations) {
      // Create conversation
      const { data: conversation, error: convError } = await supabase
        .from('inbox_conversations')
        .insert({
          workspace_id: workspaceId,
          platform: 'linkedin',
          platform_conversation_id: `linkedin_${Date.now()}_${Math.random()}`,
          participant_name: conv.participant_name,
          participant_company: conv.participant_company,
          participant_avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${conv.participant_name}`,
          participant_profile_url: `https://linkedin.com/in/${conv.participant_name.toLowerCase().replace(' ', '')}`,
          last_message_at: new Date().toISOString(),
          status: 'active'
        })
        .select()
        .single();
        
      if (convError) {
        console.error(`❌ Error creating conversation:`, convError.message);
        continue;
      }
      
      // Create message
      const { error: msgError } = await supabase
        .from('inbox_messages')
        .insert({
          conversation_id: conversation.id,
          role: 'assistant',
          content: conv.message,
          metadata: {
            sender_name: conv.participant_name,
            sender_company: conv.participant_company,
            type: 'inbound'
          }
        });
        
      if (msgError) {
        console.error(`❌ Error creating message:`, msgError.message);
      } else {
        console.log(`✅ Created conversation with ${conv.participant_name}`);
      }
      
      // Small delay
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Verify data
    console.log('\n📊 Verifying inbox data...\n');
    
    const { data: conversations } = await supabase
      .from('inbox_conversations')
      .select('*, inbox_messages(*)')
      .eq('workspace_id', workspaceId)
      .order('last_message_at', { ascending: false });
      
    console.log(`✅ Found ${conversations?.length || 0} conversations in inbox`);
    conversations?.forEach(conv => {
      console.log(`   - ${conv.participant_name}: ${conv.inbox_messages?.length || 0} messages`);
    });
    
    console.log('\n🎉 Test completed!');
    console.log('📱 Visit http://localhost:8081/global-inbox to see the messages');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
  
  process.exit(0);
}

testInboxSync();