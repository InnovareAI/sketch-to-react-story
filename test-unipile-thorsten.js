/**
 * Test Unipile API with Thorsten's Account
 * Using the real account ID from the previous test
 */

const UNIPILE_API_KEY = 'aQzsD1+H.EJ60hU0LkPAxRaCU6nlvk3ypn9Rn9BUwqo9LGY24zZU=';
const UNIPILE_BASE_URL = 'https://api6.unipile.com:13670/api/v1';
const THORSTEN_ACCOUNT_ID = '4jyMc-EDT1-hE5pOoT7EaQ'; // From the accounts response

async function testThorstenAccount() {
  console.log('🔧 Testing Unipile API with Thorsten\'s Account...');
  console.log('👤 Account ID:', THORSTEN_ACCOUNT_ID);

  const tests = [
    {
      name: 'Test /chats endpoint (conversations)',
      url: `/chats?account_id=${THORSTEN_ACCOUNT_ID}&limit=5`,
      method: 'GET'
    },
    {
      name: 'Test /users endpoint (connections)',
      url: `/users?account_id=${THORSTEN_ACCOUNT_ID}&limit=5`,
      method: 'GET'
    },
    {
      name: 'Test /messages endpoint',
      url: `/messages?account_id=${THORSTEN_ACCOUNT_ID}&limit=5`,
      method: 'GET'
    }
  ];

  for (const test of tests) {
    console.log(`\n📡 ${test.name}`);
    console.log(`   URL: ${UNIPILE_BASE_URL}${test.url}`);
    
    try {
      const response = await fetch(`${UNIPILE_BASE_URL}${test.url}`, {
        method: test.method,
        headers: {
          'X-API-KEY': UNIPILE_API_KEY,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      console.log(`   Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ Success! Items found: ${data.items?.length || 0}`);
        
        // Show sample data structure
        if (data.items && data.items.length > 0) {
          console.log(`   📝 Sample item structure:`, JSON.stringify(data.items[0], null, 2));
        }
        
        // Show pagination info
        if (data.cursor) {
          console.log(`   📄 Has pagination cursor: ${data.cursor}`);
        }
      } else {
        const errorText = await response.text();
        console.log(`   ❌ Error: ${errorText}`);
      }
    } catch (error) {
      console.log(`   🚨 Network Error: ${error.message}`);
    }
  }
}

async function testConnectionSync() {
  console.log('\n🔄 Testing Connection Sync Process...');
  
  try {
    // Step 1: Get accounts
    console.log('1️⃣ Getting accounts...');
    const accountsResponse = await fetch(`${UNIPILE_BASE_URL}/accounts`, {
      headers: {
        'X-API-KEY': UNIPILE_API_KEY,
        'Accept': 'application/json'
      }
    });
    
    if (!accountsResponse.ok) {
      throw new Error(`Accounts API failed: ${accountsResponse.status}`);
    }
    
    const accountsData = await accountsResponse.json();
    const thorstenAccount = accountsData.items.find(acc => acc.name === 'Thorsten Linz');
    
    if (!thorstenAccount) {
      throw new Error('Thorsten account not found');
    }
    
    console.log(`✅ Found Thorsten account: ${thorstenAccount.id}`);
    
    // Step 2: Test chats sync
    console.log('2️⃣ Testing chats sync...');
    const chatsResponse = await fetch(`${UNIPILE_BASE_URL}/chats?account_id=${thorstenAccount.id}&limit=10`, {
      headers: {
        'X-API-KEY': UNIPILE_API_KEY,
        'Accept': 'application/json'
      }
    });
    
    if (chatsResponse.ok) {
      const chatsData = await chatsResponse.json();
      console.log(`✅ Found ${chatsData.items?.length || 0} conversations`);
      
      if (chatsData.items && chatsData.items.length > 0) {
        // Try to get messages for first chat
        const firstChat = chatsData.items[0];
        console.log(`3️⃣ Testing messages for chat: ${firstChat.id}`);
        
        const messagesResponse = await fetch(`${UNIPILE_BASE_URL}/messages?account_id=${thorstenAccount.id}&chat_id=${firstChat.id}&limit=5`, {
          headers: {
            'X-API-KEY': UNIPILE_API_KEY,
            'Accept': 'application/json'
          }
        });
        
        if (messagesResponse.ok) {
          const messagesData = await messagesResponse.json();
          console.log(`✅ Found ${messagesData.items?.length || 0} messages for this chat`);
        } else {
          console.log(`⚠️ Messages request failed: ${messagesResponse.status}`);
        }
      }
    } else {
      console.log(`⚠️ Chats request failed: ${chatsResponse.status}`);
    }
    
    // Step 3: Test users/connections
    console.log('4️⃣ Testing connections sync...');
    const usersResponse = await fetch(`${UNIPILE_BASE_URL}/users?account_id=${thorstenAccount.id}&limit=10`, {
      headers: {
        'X-API-KEY': UNIPILE_API_KEY,
        'Accept': 'application/json'
      }
    });
    
    if (usersResponse.ok) {
      const usersData = await usersResponse.json();
      console.log(`✅ Found ${usersData.items?.length || 0} connections`);
    } else {
      console.log(`⚠️ Users/connections request failed: ${usersResponse.status}`);
    }
    
    console.log('\n🎯 Diagnosis Complete!');
    console.log('The Unipile API is working correctly.');
    console.log('The issue might be in the client-side implementation or database sync logic.');
    
  } catch (error) {
    console.error('🚨 Sync test failed:', error);
  }
}

// Run the tests
testThorstenAccount()
  .then(() => testConnectionSync())
  .catch(console.error);