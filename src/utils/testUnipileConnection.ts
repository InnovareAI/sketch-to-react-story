/**
 * Test Unipile API Connection
 * Debug utility to test if Unipile API is working correctly
 */

const UNIPILE_API_KEY = 'TE3VJJ3-N3E63ND-MWXM462-RBPCWYQ';
const UNIPILE_BASE_URL = 'https://api6.unipile.com:13443/api/v1';

export async function testUnipileConnection(accountId: string) {
  console.log('🔍 Testing Unipile API Connection...');
  console.log('Account ID:', accountId);
  
  const results = {
    accountInfo: null as any,
    connections: null as any,
    chats: null as any,
    errors: [] as string[]
  };

  // Test 1: Get Account Info
  try {
    console.log('\n📋 Test 1: Fetching Account Info...');
    const accountResponse = await fetch(
      `${UNIPILE_BASE_URL}/users/${accountId}`,
      {
        headers: {
          'Authorization': `Bearer ${UNIPILE_API_KEY}`,
          'Accept': 'application/json'
        }
      }
    );
    
    console.log('Account Response Status:', accountResponse.status);
    
    if (accountResponse.ok) {
      results.accountInfo = await accountResponse.json();
      console.log('✅ Account Info Retrieved:', results.accountInfo);
    } else {
      const errorText = await accountResponse.text();
      console.error('❌ Account Info Error:', errorText);
      results.errors.push(`Account Info: ${accountResponse.status} - ${errorText}`);
    }
  } catch (error: any) {
    console.error('❌ Account Info Exception:', error);
    results.errors.push(`Account Info Exception: ${error.message}`);
  }

  // Test 2: Get Connections
  try {
    console.log('\n👥 Test 2: Fetching Connections...');
    const connectionsResponse = await fetch(
      `${UNIPILE_BASE_URL}/users/${accountId}/connections?limit=10`,
      {
        headers: {
          'Authorization': `Bearer ${UNIPILE_API_KEY}`,
          'Accept': 'application/json'
        }
      }
    );
    
    console.log('Connections Response Status:', connectionsResponse.status);
    
    if (connectionsResponse.ok) {
      results.connections = await connectionsResponse.json();
      console.log('✅ Connections Retrieved:', {
        count: results.connections?.connections?.length || results.connections?.items?.length || 0,
        sample: results.connections?.connections?.[0] || results.connections?.items?.[0]
      });
    } else {
      const errorText = await connectionsResponse.text();
      console.error('❌ Connections Error:', errorText);
      results.errors.push(`Connections: ${connectionsResponse.status} - ${errorText}`);
    }
  } catch (error: any) {
    console.error('❌ Connections Exception:', error);
    results.errors.push(`Connections Exception: ${error.message}`);
  }

  // Test 3: Get Chats/Messages
  try {
    console.log('\n💬 Test 3: Fetching Chats...');
    const chatsResponse = await fetch(
      `${UNIPILE_BASE_URL}/users/${accountId}/chats?limit=10&provider=LINKEDIN`,
      {
        headers: {
          'Authorization': `Bearer ${UNIPILE_API_KEY}`,
          'Accept': 'application/json'
        }
      }
    );
    
    console.log('Chats Response Status:', chatsResponse.status);
    
    if (chatsResponse.ok) {
      results.chats = await chatsResponse.json();
      console.log('✅ Chats Retrieved:', {
        count: results.chats?.items?.length || 0,
        sample: results.chats?.items?.[0]
      });
    } else {
      const errorText = await chatsResponse.text();
      console.error('❌ Chats Error:', errorText);
      results.errors.push(`Chats: ${chatsResponse.status} - ${errorText}`);
    }
  } catch (error: any) {
    console.error('❌ Chats Exception:', error);
    results.errors.push(`Chats Exception: ${error.message}`);
  }

  // Test 4: Try alternative endpoints
  console.log('\n🔄 Test 4: Trying Alternative Endpoints...');
  
  // Try /accounts endpoint
  try {
    const accountsResponse = await fetch(
      `${UNIPILE_BASE_URL}/accounts`,
      {
        headers: {
          'Authorization': `Bearer ${UNIPILE_API_KEY}`,
          'Accept': 'application/json'
        }
      }
    );
    
    console.log('Accounts List Response Status:', accountsResponse.status);
    
    if (accountsResponse.ok) {
      const accounts = await accountsResponse.json();
      console.log('✅ Available Accounts:', accounts);
    }
  } catch (error: any) {
    console.error('❌ Accounts List Error:', error.message);
  }

  // Try /users endpoint
  try {
    const usersResponse = await fetch(
      `${UNIPILE_BASE_URL}/users`,
      {
        headers: {
          'Authorization': `Bearer ${UNIPILE_API_KEY}`,
          'Accept': 'application/json'
        }
      }
    );
    
    console.log('Users List Response Status:', usersResponse.status);
    
    if (usersResponse.ok) {
      const users = await usersResponse.json();
      console.log('✅ Available Users:', users);
    }
  } catch (error: any) {
    console.error('❌ Users List Error:', error.message);
  }

  console.log('\n📊 Test Summary:');
  console.log('================');
  console.log('✅ Successful Tests:', 
    [results.accountInfo, results.connections, results.chats].filter(Boolean).length
  );
  console.log('❌ Failed Tests:', results.errors.length);
  
  if (results.errors.length > 0) {
    console.log('\n🚨 Errors:');
    results.errors.forEach(err => console.log('  -', err));
  }

  return results;
}

// Make it available on window for easy testing
if (typeof window !== 'undefined') {
  (window as any).testUnipileConnection = testUnipileConnection;
  console.log('🧪 Test function available: window.testUnipileConnection(accountId)');
}