/**
 * Test Unipile API Connection
 * This script tests the actual Unipile API endpoints to diagnose connection issues
 */

const UNIPILE_API_KEY = 'aQzsD1+H.EJ60hU0LkPAxRaCU6nlvk3ypn9Rn9BUwqo9LGY24zZU=';
const UNIPILE_BASE_URL = 'https://api6.unipile.com:13670/api/v1';

async function testUnipileConnection() {
  console.log('🔧 Testing Unipile API Connection...');
  console.log('🌐 Base URL:', UNIPILE_BASE_URL);
  console.log('🔑 API Key Preview:', UNIPILE_API_KEY ? `${UNIPILE_API_KEY.substring(0, 8)}...` : 'NOT SET');

  const tests = [
    {
      name: 'Test /accounts endpoint',
      url: '/accounts',
      method: 'GET'
    },
    {
      name: 'Test /me endpoint',
      url: '/me',
      method: 'GET'
    },
    {
      name: 'Test /users endpoint (with dummy account)',
      url: '/users?account_id=test&limit=10',
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
      
      // Get response headers
      const headers = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });
      console.log(`   Headers:`, JSON.stringify(headers, null, 2));

      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ Success! Response:`, JSON.stringify(data, null, 2));
      } else {
        const errorText = await response.text();
        console.log(`   ❌ Error: ${errorText}`);
      }
    } catch (error) {
      console.log(`   🚨 Network Error: ${error.message}`);
      
      // Check if it's a CORS error
      if (error.message.includes('CORS') || error.message.includes('Cross-Origin')) {
        console.log(`   💡 This appears to be a CORS issue. The API might be working but blocked by browser security.`);
      }
      
      // Check if it's a connection error
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        console.log(`   💡 This appears to be a network connectivity issue. The API endpoint might be down or unreachable.`);
      }
    }
  }

  // Test DNS resolution
  console.log('\n🌍 Testing DNS Resolution...');
  try {
    const hostname = 'api6.unipile.com';
    const testUrl = `https://${hostname}:13670/`;
    
    const response = await fetch(testUrl, {
      method: 'HEAD',
      mode: 'no-cors' // Bypass CORS for connectivity test
    });
    
    console.log(`   ✅ DNS Resolution successful for ${hostname}`);
  } catch (error) {
    console.log(`   ❌ DNS Resolution failed: ${error.message}`);
  }
}

// Run the test
testUnipileConnection().catch(console.error);