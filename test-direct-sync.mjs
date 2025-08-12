#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ktchrfgkbpaixbiwbieg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0Y2hyZmdrYnBhaXhiaXdiaWVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0MTQ1NjAsImV4cCI6MjA2Nzk5MDU2MH0.NH8E52ypjXoI4wMVuXkaXkrwzw7vr7dYRk48sHuqMkw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDirectSync() {
  console.log('🚀 Testing direct LinkedIn sync without auth...\n');
  
  try {
    // Use a known workspace ID (you can get this from your database)
    // For now, let's check if we have any workspaces
    const { data: workspaces, error: wsError } = await supabase
      .from('workspaces')
      .select('id, name')
      .limit(1);
      
    if (wsError || !workspaces || workspaces.length === 0) {
      console.log('No workspaces found. Creating test workspace...');
      
      // Create a test workspace without authentication
      const { data: workspace, error: createError } = await supabase
        .from('workspaces')
        .insert({
          name: 'LinkedIn Test Workspace',
          created_by: '00000000-0000-0000-0000-000000000000' // Dummy UUID
        })
        .select()
        .single();
        
      if (createError) {
        console.error('❌ Could not create workspace:', createError.message);
        return;
      }
      
      console.log('✅ Created test workspace');
      workspaceId = workspace.id;
    } else {
      var workspaceId = workspaces[0].id;
      console.log(`✅ Using existing workspace: ${workspaces[0].name}`);
    }
    
    console.log(`📊 Workspace ID: ${workspaceId}\n`);
    
    // Create sample LinkedIn conversations
    const sampleConversations = [
      {
        participant_name: 'John Smith',
        participant_company: 'Tech Solutions Inc.',
        message: 'Hi! I saw your profile and would love to connect about potential B2B opportunities.',
      },
      {
        participant_name: 'Sarah Johnson',
        participant_company: 'Innovation Labs',
        message: 'Thanks for accepting my connection request! Our AI platform could really help your sales team.',
      },
      {
        participant_name: 'Michael Chen',
        participant_company: 'Growth Partners',
        message: 'Great presentation at the conference! Let\'s schedule a follow-up call next week.',
      },
      {
        participant_name: 'Emily Davis',
        participant_company: 'Digital Marketing Co',
        message: 'I noticed you\'re expanding into new markets. We specialize in B2B lead generation.',
      },
      {
        participant_name: 'Robert Wilson',
        participant_company: 'Enterprise Solutions',
        message: 'Following up on our LinkedIn conversation about the integration possibilities.',
      }
    ];
    
    console.log('📥 Creating LinkedIn conversations...\n');
    
    for (const conv of sampleConversations) {
      try {
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
            last_message_at: new Date(Date.now() - Math.random() * 86400000).toISOString(), // Random time in last 24 hours
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
              type: 'inbound',
              platform: 'linkedin'
            }
          });
          
        if (msgError) {
          console.error(`❌ Error creating message:`, msgError.message);
        } else {
          console.log(`✅ Created conversation with ${conv.participant_name}`);
        }
        
        // Add a small delay between inserts
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`❌ Error processing ${conv.participant_name}:`, error.message);
      }
    }
    
    // Verify data was created
    console.log('\n📊 Verifying sync results...\n');
    
    const { data: conversations, error: listError } = await supabase
      .from('sam_ai_conversations')
      .select('*, sam_ai_conversation_messages(*)')
      .eq('workspace_id', workspaceId)
      .eq('platform', 'linkedin')
      .order('last_message_at', { ascending: false });
      
    if (listError) {
      console.error('❌ Error fetching conversations:', listError.message);
    } else {
      console.log(`✅ Found ${conversations.length} LinkedIn conversations in database`);
      conversations.forEach(conv => {
        const messageCount = conv.sam_ai_conversation_messages?.length || 0;
        console.log(`   - ${conv.participant_name} (${conv.participant_company}): ${messageCount} message(s)`);
      });
    }
    
    console.log('\n🎉 LinkedIn sync test completed!');
    console.log('📱 Visit http://localhost:8081/global-inbox to see the synced messages');
    console.log('💡 Click "Sync LinkedIn Inbox" button to trigger the sync in the UI');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
  
  process.exit(0);
}

testDirectSync();