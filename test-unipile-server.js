/**
 * Test Unipile API Connection from Server Context
 * This simulates what the Edge Function will do
 */

async function testUnipileFromServer() {
  const API_KEY = 'TE3VJJ3-N3E63ND-MWXM462-RBPCWYQ';
  const BASE_URL = 'https://api6.unipile.com:13443/api/v1';
  
  console.log('🔍 Testing Unipile API from Server Context...');
  console.log('Base URL:', BASE_URL);
  
  try {
    // Test 1: List accounts endpoint
    console.log('\n📋 Test 1: Listing Accounts...');
    const accountsResponse = await fetch(`${BASE_URL}/accounts`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Accept': 'application/json'
      }
    });
    
    console.log('Accounts Response Status:', accountsResponse.status);
    
    if (accountsResponse.ok) {
      const accounts = await accountsResponse.json();
      console.log('✅ Available Accounts:', accounts);
      
      // If we have accounts, test with the first one
      if (accounts && accounts.length > 0) {
        const firstAccount = accounts[0];
        console.log(`\n👤 Test 2: Testing with account: ${firstAccount.id || firstAccount.accountId || 'unknown'}`);
        
        const accountId = firstAccount.id || firstAccount.accountId || firstAccount.account_id;
        if (accountId) {
          // Test getting connections for this account
          const connectionsResponse = await fetch(`${BASE_URL}/users/${accountId}/connections?limit=5`, {
            headers: {
              'Authorization': `Bearer ${API_KEY}`,
              'Accept': 'application/json'
            }
          });
          
          console.log('Connections Response Status:', connectionsResponse.status);
          
          if (connectionsResponse.ok) {
            const connections = await connectionsResponse.json();
            console.log('✅ Sample Connections:', connections);
          } else {
            const error = await connectionsResponse.text();
            console.log('❌ Connections Error:', error);
          }
        }
      }
    } else {
      const errorText = await accountsResponse.text();
      console.error('❌ Accounts Error:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Server Test Error:', error.message);
  }
  
  console.log('\n🎉 Server-side Unipile test completed!');
  console.log('If you see account data above, the Edge Function should work correctly.');
}

// Run the test
testUnipileFromServer();