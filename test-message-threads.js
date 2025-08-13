// Test script to verify message thread fetching
const API_KEY = 'aQzsD1+H.EJ60hU0LkPAxRaCU6nlvk3ypn9Rn9BUwqo9LGY24zZU=';
const BASE_URL = 'https://api6.unipile.com:13670/api/v1';

async function testMessageThreads() {
  console.log('🧪 Testing Unipile message thread fetching...\n');
  
  try {
    // First, get accounts
    console.log('1️⃣ Fetching accounts...');
    const accountsResponse = await fetch(`${BASE_URL}/accounts`, {
      method: 'GET',
      headers: {
        'X-API-KEY': API_KEY,
        'Accept': 'application/json'
      }
    });
    
    const accountsData = await accountsResponse.json();
    const accounts = accountsData.items || [];
    console.log(`   Found ${accounts.length} accounts`);
    
    // Find Thorsten Linz account
    const thorstenAccount = accounts.find(acc => 
      acc.name === 'Thorsten Linz' && acc.type === 'LINKEDIN'
    );
    
    if (!thorstenAccount) {
      console.log('❌ Thorsten Linz account not found');
      return;
    }
    
    console.log(`   Using account: ${thorstenAccount.name} (${thorstenAccount.id})\n`);
    
    // Get chats
    console.log('2️⃣ Fetching chats...');
    const chatsResponse = await fetch(`${BASE_URL}/chats?account_id=${thorstenAccount.id}&limit=5`, {
      method: 'GET',
      headers: {
        'X-API-KEY': API_KEY,
        'Accept': 'application/json'
      }
    });
    
    const chatsData = await chatsResponse.json();
    const chats = chatsData.items || [];
    console.log(`   Found ${chats.length} chats\n`);
    
    // Test fetching messages for first few chats
    for (let i = 0; i < Math.min(3, chats.length); i++) {
      const chat = chats[i];
      console.log(`3️⃣ Testing chat ${i + 1}: ${chat.name || chat.id}`);
      
      // Try different message fetching approaches
      const approaches = [
        {
          name: 'With account_id and chat_id',
          url: `${BASE_URL}/messages?account_id=${thorstenAccount.id}&chat_id=${chat.id}&limit=100`
        },
        {
          name: 'With just chat_id',
          url: `${BASE_URL}/messages?chat_id=${chat.id}&limit=100`
        },
        {
          name: 'Chat messages endpoint (if exists)',
          url: `${BASE_URL}/chats/${chat.id}/messages?account_id=${thorstenAccount.id}&limit=100`
        }
      ];
      
      for (const approach of approaches) {
        console.log(`   Trying: ${approach.name}`);
        try {
          const response = await fetch(approach.url, {
            method: 'GET',
            headers: {
              'X-API-KEY': API_KEY,
              'Accept': 'application/json'
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            const messages = data.items || data.messages || data || [];
            const messageCount = Array.isArray(messages) ? messages.length : 
                               Array.isArray(data) ? data.length : 0;
            
            console.log(`   ✅ Success! Got ${messageCount} messages`);
            
            if (messageCount > 0) {
              console.log(`   Sample message structure:`, JSON.stringify(messages[0], null, 2).substring(0, 500));
              break; // Found messages, no need to try other approaches
            }
          } else {
            console.log(`   ❌ Failed (${response.status})`);
          }
        } catch (error) {
          console.log(`   ❌ Error: ${error.message}`);
        }
      }
      
      console.log('');
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testMessageThreads();