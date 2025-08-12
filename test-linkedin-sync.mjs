#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ktchrfgkbpaixbiwbieg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0Y2hyZmdrYnBhaXhiaXdiaWVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0MTQ1NjAsImV4cCI6MjA2Nzk5MDU2MH0.NH8E52ypjXoI4wMVuXkaXkrwzw7vr7dYRk48sHuqMkw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLinkedInSync() {
  console.log('🚀 Testing LinkedIn sync functionality...\n');
  
  try {
    // 1. Try to sign in first (in case user already exists)
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'linkedin.test@gmail.com',
      password: 'TestPassword123!'
    });
    
    let user;
    
    if (authError) {
      console.log('Creating new test user...');
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: 'linkedin.test@gmail.com',
        password: 'TestPassword123!'
      });
      
      if (signUpError) throw signUpError;
      console.log('✅ Test user created');
      user = signUpData.user;
      
      // Wait for session to be established
      await new Promise(resolve => setTimeout(resolve, 1000));
    } else {
      console.log('✅ Signed in as test user');
      user = authData.user;
    }
    
    if (!user) throw new Error('No user found');
    
    // 3. Ensure user has a workspace
    const { data: profile } = await supabase
      .from('profiles')
      .select('workspace_id')
      .eq('id', user.id)
      .single();
    
    let workspaceId = profile?.workspace_id;
    
    if (!workspaceId) {
      console.log('Creating workspace for user...');
      const { data: workspace, error: wsError } = await supabase
        .from('workspaces')
        .insert({
          name: 'Test Workspace',
          created_by: user.id
        })
        .select()
        .single();
        
      if (wsError) throw wsError;
      workspaceId = workspace.id;
      
      // Update profile with workspace
      await supabase
        .from('profiles')
        .update({ workspace_id: workspaceId })
        .eq('id', user.id);
        
      console.log('✅ Workspace created');
    }
    
    console.log(`📊 Using workspace: ${workspaceId}\n`);
    
    // 4. Create sample LinkedIn conversations
    const sampleConversations = [
      {
        participant_name: 'John Smith',
        participant_company: 'Tech Solutions Inc.',
        message: 'Hi! I saw your profile and would love to connect about potential opportunities.',
      },
      {
        participant_name: 'Sarah Johnson',
        participant_company: 'Innovation Labs',
        message: 'Thanks for connecting! Interested in discussing our new AI platform?',
      },
      {
        participant_name: 'Michael Chen',
        participant_company: 'Growth Partners',
        message: 'Great meeting you at the conference! Let\'s schedule a follow-up call.',
      }
    ];
    
    console.log('📥 Creating LinkedIn conversations...\n');
    
    for (const conv of sampleConversations) {
      // Create conversation
      const { data: conversation, error: convError } = await supabase
        .from('sam_ai_conversations')
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
        console.error(`❌ Error creating conversation for ${conv.participant_name}:`, convError.message);
        continue;
      }
      
      // Create message
      const { error: msgError } = await supabase
        .from('sam_ai_conversation_messages')
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
    }
    
    // 5. Verify data was created
    console.log('\n📊 Verifying sync results...\n');
    
    const { data: conversations, error: listError } = await supabase
      .from('inbox_conversations')
      .select('*, sam_ai_conversation_messages(*)')
      .eq('workspace_id', workspaceId)
      .order('last_message_at', { ascending: false });
      
    if (listError) {
      console.error('❌ Error fetching conversations:', listError);
    } else {
      console.log(`✅ Found ${conversations.length} conversations in inbox`);
      conversations.forEach(conv => {
        console.log(`   - ${conv.participant_name} (${conv.participant_company}): ${conv.sam_ai_conversation_messages.length} messages`);
      });
    }
    
    console.log('\n🎉 LinkedIn sync test completed successfully!');
    console.log('📱 Visit http://localhost:8081/global-inbox to see the synced messages');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
  
  process.exit(0);
}

testLinkedInSync();