// Test direct LinkedIn API access to get full network
console.log('🔍 Testing direct LinkedIn API endpoints...\n');

const UNIPILE_API_KEY = 'aQzsD1+H.EJ60hU0LkPAxRaCU6nlvk3ypn9Rn9BUwqo9LGY24zZU=';
const ACCOUNT_ID = '4jyMc-EDT1-hE5pOoT7EaQ';
const BASE_URL = 'https://api6.unipile.com:13670/api/v1';

const headers = {
  'X-API-Key': UNIPILE_API_KEY,
  'Content-Type': 'application/json'
};

async function testLinkedInDirectAPI() {
  console.log('='.repeat(60));
  console.log('TESTING DIRECT LINKEDIN API ACCESS');
  console.log('='.repeat(60));
  
  // First, get account info to understand what's available
  try {
    console.log('1. Getting account information...');
    const accountResponse = await fetch(`${BASE_URL}/accounts/${ACCOUNT_ID}`, { headers });
    
    if (accountResponse.ok) {
      const accountData = await accountResponse.json();
      console.log('✅ Account data:', JSON.stringify(accountData, null, 2));
      
      // Check if it shows LinkedIn API access levels
      if (accountData.scopes) {
        console.log('🔑 Available scopes:', accountData.scopes);
      }
      if (accountData.permissions) {
        console.log('🔑 Available permissions:', accountData.permissions);
      }
    }
  } catch (error) {
    console.log('❌ Account info error:', error.message);
  }

  console.log('\n' + '='.repeat(60));
  console.log('2. TESTING LINKEDIN CONNECTIONS ENDPOINTS');
  console.log('='.repeat(60));
  
  // Test various LinkedIn connections endpoints
  const connectionEndpoints = [
    `/users/${ACCOUNT_ID}/connections`,
    `/linkedin/connections?account_id=${ACCOUNT_ID}`,
    `/connections?account_id=${ACCOUNT_ID}`,
    `/linkedin/network?account_id=${ACCOUNT_ID}`,
    `/linkedin/people?account_id=${ACCOUNT_ID}`,
    `/linkedin/contacts?account_id=${ACCOUNT_ID}`,
    `/contacts?account_id=${ACCOUNT_ID}`,
    `/users/${ACCOUNT_ID}/network`,
    `/users/${ACCOUNT_ID}/contacts`,
    `/api/linkedin/connections/${ACCOUNT_ID}`,
    `/v1/people/connections?account_id=${ACCOUNT_ID}`,
    `/linkedin/v2/connections?account_id=${ACCOUNT_ID}`
  ];

  for (const endpoint of connectionEndpoints) {
    await testEndpoint(`Connections: ${endpoint}`, `${BASE_URL}${endpoint}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('3. TESTING PAGINATION & LARGE DATASETS');
  console.log('='.repeat(60));
  
  // Test pagination for large datasets
  const paginationTests = [
    `/chats?account_id=${ACCOUNT_ID}&limit=1000`,
    `/messages?account_id=${ACCOUNT_ID}&limit=5000`,
    `/linkedin/people?account_id=${ACCOUNT_ID}&limit=1000&offset=0`,
    `/contacts?account_id=${ACCOUNT_ID}&limit=5000`,
    `/users/${ACCOUNT_ID}/connections?limit=1000`,
    `/linkedin/network?account_id=${ACCOUNT_ID}&size=1000`
  ];

  for (const endpoint of paginationTests) {
    await testEndpoint(`Large dataset: ${endpoint}`, `${BASE_URL}${endpoint}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('4. TESTING SEARCH & DISCOVERY');
  console.log('='.repeat(60));
  
  // Test search capabilities
  const searchEndpoints = [
    `/search?account_id=${ACCOUNT_ID}&type=people&limit=1000`,
    `/linkedin/search?account_id=${ACCOUNT_ID}&entity=people&count=1000`,
    `/users/${ACCOUNT_ID}/search?q=*&type=connections`,
    `/discovery/people?account_id=${ACCOUNT_ID}`,
    `/linkedin/people/search?account_id=${ACCOUNT_ID}&keywords=*`,
    `/people?account_id=${ACCOUNT_ID}&scope=all`
  ];

  for (const endpoint of searchEndpoints) {
    await testEndpoint(`Search: ${endpoint}`, `${BASE_URL}${endpoint}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('5. TESTING PROFILE & RELATIONSHIP DATA');
  console.log('='.repeat(60));
  
  // Test profile and relationship endpoints
  const profileEndpoints = [
    `/users/${ACCOUNT_ID}/profile/connections`,
    `/linkedin/profile?account_id=${ACCOUNT_ID}&include=connections`,
    `/users/${ACCOUNT_ID}?expand=connections`,
    `/linkedin/me/connections?account_id=${ACCOUNT_ID}`,
    `/profile/connections?account_id=${ACCOUNT_ID}`,
    `/me/connections?account_id=${ACCOUNT_ID}`
  ];

  for (const endpoint of profileEndpoints) {
    await testEndpoint(`Profile: ${endpoint}`, `${BASE_URL}${endpoint}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('6. ANALYSIS COMPLETE');
  console.log('='.repeat(60));
  
  console.log('📊 Next steps based on working endpoints:');
  console.log('1. Use working endpoints to get maximum contacts');
  console.log('2. Implement pagination if supported');
  console.log('3. Combine multiple data sources');
  console.log('4. Build comprehensive contact database');
}

async function testEndpoint(name, url) {
  try {
    const response = await fetch(url, { headers });
    
    if (response.ok) {
      const data = await response.json();
      const count = data.items ? data.items.length : 
                   data.elements ? data.elements.length :
                   Array.isArray(data) ? data.length : 1;
      
      console.log(`✅ ${name}: ${count} items`);
      
      // Show sample data structure
      if (data.items && data.items.length > 0) {
        const sample = data.items[0];
        const keys = Object.keys(sample).slice(0, 5);
        console.log(`   Sample fields: ${keys.join(', ')}`);
      } else if (data.elements && data.elements.length > 0) {
        const sample = data.elements[0];
        const keys = Object.keys(sample).slice(0, 5);
        console.log(`   Sample fields: ${keys.join(', ')}`);
      }
      
      return { success: true, count, data };
    } else {
      console.log(`❌ ${name}: ${response.status} ${response.statusText}`);
      return { success: false, status: response.status };
    }
  } catch (error) {
    console.log(`❌ ${name}: ${error.message}`);
    return { success: false, error: error.message };
  }
}

testLinkedInDirectAPI();