// Simple test to verify sync functionality
import fetch from 'node-fetch';

const UNIPILE_API_KEY = 'aQzsD1+H.EJ60hU0LkPAxRaCU6nlvk3ypn9Rn9BUwqo9LGY24zZU=';
const UNIPILE_BASE_URL = 'https://api6.unipile.com:13670/api/v1';
const ACCOUNT_ID = '4jyMc-EDT1-hE5pOoT7EaQ';

async function testUnipileAPI() {
  console.log('🧪 Testing Unipile API directly...');
  
  try {
    // Test 1: Get accounts
    console.log('📡 Testing accounts endpoint...');
    const accountsResponse = await fetch(`${UNIPILE_BASE_URL}/accounts`, {
      method: 'GET',
      headers: {
        'X-API-KEY': UNIPILE_API_KEY,
        'Accept': 'application/json'
      }
    });
    
    console.log(`📊 Accounts response: ${accountsResponse.status}`);
    
    if (accountsResponse.ok) {
      const accountsData = await accountsResponse.json();
      console.log('✅ Accounts data:', accountsData);
      
      // Test 2: Get chats for the account
      console.log('📡 Testing chats endpoint...');
      const chatsResponse = await fetch(`${UNIPILE_BASE_URL}/chats?account_id=${ACCOUNT_ID}&limit=5`, {
        method: 'GET',
        headers: {
          'X-API-KEY': UNIPILE_API_KEY,
          'Accept': 'application/json'
        }
      });
      
      console.log(`📊 Chats response: ${chatsResponse.status}`);
      
      if (chatsResponse.ok) {
        const chatsData = await chatsResponse.json();
        console.log('✅ Found chats:', chatsData?.items?.length || 0);
        console.log('📋 Sample chat:', JSON.stringify(chatsData?.items?.[0], null, 2));
        
        // Test 3: Get messages from a chat to see if we can get contact names
        if (chatsData?.items?.length > 0) {
          const chatId = chatsData.items[0].id;
          console.log('📡 Testing messages for chat:', chatId);
          
          const messagesResponse = await fetch(`${UNIPILE_BASE_URL}/chats/${chatId}/messages?limit=3`, {
            method: 'GET',
            headers: {
              'X-API-KEY': UNIPILE_API_KEY,
              'Accept': 'application/json'
            }
          });
          
          console.log(`📊 Messages response: ${messagesResponse.status}`);
          
          if (messagesResponse.ok) {
            const messagesData = await messagesResponse.json();
            console.log('✅ Found messages:', messagesData?.items?.length || 0);
            console.log('📋 Sample message:', JSON.stringify(messagesData?.items?.[0], null, 2));
          } else {
            const messagesError = await messagesResponse.text();
            console.log('❌ Messages error:', messagesError);
          }
        }
        
      } else {
        const chatsError = await chatsResponse.text();
        console.log('❌ Chats error:', chatsError);
      }
      
    } else {
      const accountsError = await accountsResponse.text();
      console.log('❌ Accounts error:', accountsError);
    }
    
  } catch (error) {
    console.error('💥 Network error:', error.message);
  }
}

testUnipileAPI();