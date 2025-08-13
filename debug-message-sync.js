// Debug script to check what's happening with message sync
const API_KEY = 'aQzsD1+H.EJ60hU0LkPAxRaCU6nlvk3ypn9Rn9BUwqo9LGY24zZU=';
const BASE_URL = 'https://api6.unipile.com:13670/api/v1';

async function debugMessageSync() {
  console.log('🔍 Debugging message sync issue...\n');
  
  try {
    // Get accounts
    const accountsResponse = await fetch(`${BASE_URL}/accounts`, {
      headers: { 'X-API-KEY': API_KEY, 'Accept': 'application/json' }
    });
    
    const accountsData = await accountsResponse.json();
    const thorstenAccount = accountsData.items?.find(acc => 
      acc.name === 'Thorsten Linz' && acc.type === 'LINKEDIN'
    );
    
    if (!thorstenAccount) {
      console.log('❌ Account not found');
      return;
    }
    
    // Get first chat
    const chatsResponse = await fetch(`${BASE_URL}/chats?account_id=${thorstenAccount.id}&limit=1`, {
      headers: { 'X-API-KEY': API_KEY, 'Accept': 'application/json' }
    });
    
    const chatsData = await chatsResponse.json();
    const firstChat = chatsData.items?.[0];
    
    if (!firstChat) {
      console.log('❌ No chats found');
      return;
    }
    
    console.log(`📧 Testing chat: ${firstChat.id}`);
    console.log(`   Name: ${firstChat.name || 'Unknown'}`);
    
    // Fetch messages
    const messagesResponse = await fetch(
      `${BASE_URL}/messages?account_id=${thorstenAccount.id}&chat_id=${firstChat.id}&limit=100`,
      { headers: { 'X-API-KEY': API_KEY, 'Accept': 'application/json' } }
    );
    
    const messagesData = await messagesResponse.json();
    const messages = messagesData.items || [];
    
    console.log(`\n📨 Found ${messages.length} messages`);
    
    // Check message IDs
    console.log('\n🆔 Message IDs and uniqueness:');
    const messageIds = new Set();
    
    messages.forEach((msg, index) => {
      const hasId = !!msg.id;
      const isDuplicate = messageIds.has(msg.id);
      
      if (msg.id) {
        messageIds.add(msg.id);
      }
      
      console.log(`   Message ${index + 1}:`);
      console.log(`     - ID: ${msg.id || 'NO ID!'}`);
      console.log(`     - Provider ID: ${msg.provider_id || 'none'}`);
      console.log(`     - Has unique ID: ${hasId && !isDuplicate ? '✅' : '❌'}`);
      console.log(`     - Timestamp: ${msg.timestamp}`);
      console.log(`     - Is sender: ${msg.is_sender}`);
      console.log(`     - Text preview: "${(msg.text || '').substring(0, 50)}..."`);
    });
    
    console.log(`\n📊 Summary:`);
    console.log(`   - Total messages: ${messages.length}`);
    console.log(`   - Messages with IDs: ${messageIds.size}`);
    console.log(`   - Messages without IDs: ${messages.length - messageIds.size}`);
    
    // Check if messages have different timestamps
    const timestamps = messages.map(m => m.timestamp);
    const uniqueTimestamps = new Set(timestamps);
    console.log(`   - Unique timestamps: ${uniqueTimestamps.size}`);
    
    // Return data for further processing
    return { chat: firstChat, messages };
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

// Run the debug
debugMessageSync();