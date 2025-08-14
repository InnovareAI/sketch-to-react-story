// Direct sync that mimics the edge function but with debug output
import fetch from 'node-fetch';

const UNIPILE_API_KEY = 'aQzsD1+H.EJ60hU0LkPAxRaCU6nlvk3ypn9Rn9BUwqo9LGY24zZU=';
const UNIPILE_BASE_URL = 'https://api6.unipile.com:13670/api/v1';
const ACCOUNT_ID = '4jyMc-EDT1-hE5pOoT7EaQ';

const SUPABASE_URL = 'https://latxadqrvrrrcvkktrog.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhdHhhZHFydnJycmN2a2t0cm9nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTk5ODYsImV4cCI6MjA2ODI3NTk4Nn0.3WkAgXpk_MyQioVf_SED9O_ArjcT9nH0uy9we2okftE';

async function directSync() {
  console.log('🔄 Starting direct sync debug...');
  
  try {
    // Step 1: Get chats from Unipile
    console.log('\n📡 Step 1: Fetching chats from Unipile...');
    const chatsResponse = await fetch(`${UNIPILE_BASE_URL}/chats?account_id=${ACCOUNT_ID}&limit=5`, {
      headers: {
        'X-API-KEY': UNIPILE_API_KEY,
        'Accept': 'application/json'
      }
    });
    
    console.log(`📊 Chats API response: ${chatsResponse.status}`);
    
    if (!chatsResponse.ok) {
      const error = await chatsResponse.text();
      console.error('❌ Chats API error:', error);
      return;
    }
    
    const chatsData = await chatsResponse.json();
    const conversations = chatsData.items || [];
    console.log(`✅ Found ${conversations.length} conversations`);
    
    if (conversations.length === 0) {
      console.log('⚠️ No conversations found, exiting');
      return;
    }
    
    // Step 2: Process first conversation
    const conversation = conversations[0];
    console.log('\n📋 Processing conversation:', conversation.id);
    console.log('   Attendee:', conversation.attendee_provider_id);
    console.log('   Timestamp:', conversation.timestamp);
    
    // Step 3: Get messages for this conversation
    console.log('\n📡 Step 3: Fetching messages...');
    const messagesResponse = await fetch(`${UNIPILE_BASE_URL}/chats/${conversation.id}/messages?limit=3`, {
      headers: {
        'X-API-KEY': UNIPILE_API_KEY,
        'Accept': 'application/json'
      }
    });
    
    console.log(`📊 Messages API response: ${messagesResponse.status}`);
    
    if (!messagesResponse.ok) {
      const error = await messagesResponse.text();
      console.error('❌ Messages API error:', error);
      return;
    }
    
    const messagesData = await messagesResponse.json();
    const messages = messagesData.items || [];
    console.log(`✅ Found ${messages.length} messages`);
    
    if (messages.length > 0) {
      console.log('📋 Latest message:', {
        id: messages[0].id,
        text: messages[0].text?.substring(0, 100) + '...',
        timestamp: messages[0].timestamp,
        is_sender: messages[0].is_sender
      });
    }
    
    // Step 4: Save to database using REST API
    console.log('\n💾 Step 4: Saving to database...');
    
    const conversationData = {
      workspace_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      platform: 'linkedin',
      platform_conversation_id: conversation.id,
      participant_name: 'Debug Contact',
      participant_company: 'Debug Company',
      participant_avatar_url: `https://ui-avatars.com/api/?name=Debug&background=0D8ABC&color=fff&size=200`,
      status: 'active',
      last_message_at: conversation.timestamp || new Date().toISOString(),
      metadata: {
        chat_type: 'message',
        attendee_provider_id: conversation.attendee_provider_id,
        debug_sync: true,
        synced_at: new Date().toISOString()
      }
    };
    
    const saveResponse = await fetch(`${SUPABASE_URL}/rest/v1/inbox_conversations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(conversationData)
    });
    
    console.log(`📊 Database save response: ${saveResponse.status}`);
    
    if (saveResponse.ok) {
      const savedConv = await saveResponse.json();
      console.log('✅ Conversation saved with ID:', savedConv[0]?.id);
      
      // Save messages
      if (messages.length > 0) {
        console.log('\n💾 Saving messages...');
        for (let i = 0; i < Math.min(2, messages.length); i++) {
          const message = messages[i];
          const messageData = {
            conversation_id: savedConv[0].id,
            role: message.is_sender ? 'user' : 'assistant',
            content: message.text || 'No content',
            metadata: {
              message_id: message.id,
              timestamp: message.timestamp,
              debug_sync: true
            },
            created_at: message.timestamp || new Date().toISOString()
          };
          
          const msgResponse = await fetch(`${SUPABASE_URL}/rest/v1/inbox_messages`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
              'apikey': SUPABASE_ANON_KEY,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(messageData)
          });
          
          console.log(`   Message ${i + 1}: ${msgResponse.status}`);
        }
      }
      
      console.log('\n✅ Direct sync completed successfully!');
      
    } else {
      const error = await saveResponse.text();
      console.error('❌ Database save error:', error);
    }
    
  } catch (error) {
    console.error('💥 Direct sync error:', error.message);
  }
}

directSync();