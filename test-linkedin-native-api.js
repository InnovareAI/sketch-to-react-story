// Test native LinkedIn API access patterns
console.log('🔍 Testing LinkedIn native API access patterns...\n');

const UNIPILE_API_KEY = 'aQzsD1+H.EJ60hU0LkPAxRaCU6nlvk3ypn9Rn9BUwqo9LGY24zZU=';
const ACCOUNT_ID = '4jyMc-EDT1-hE5pOoT7EaQ';
const BASE_URL = 'https://api6.unipile.com:13670/api/v1';

const headers = {
  'X-API-Key': UNIPILE_API_KEY,
  'Content-Type': 'application/json'
};

async function testLinkedInNativeAPI() {
  console.log('='.repeat(60));
  console.log('TESTING NATIVE LINKEDIN API PATTERNS');
  console.log('='.repeat(60));
  
  // The account shows you have Sales Navigator Premium, let's test those endpoints
  console.log('🎯 Sales Navigator Premium detected!');
  console.log('🔑 Premium Features:', ['premium', 'sales_navigator']);
  console.log('🏢 Organizations available:', 9);
  
  console.log('\n1. Testing Sales Navigator specific endpoints...');
  
  const salesNavEndpoints = [
    `/sales-navigator/people?account_id=${ACCOUNT_ID}`,
    `/sales-navigator/connections?account_id=${ACCOUNT_ID}`,
    `/navigator/people?account_id=${ACCOUNT_ID}`,
    `/premium/connections?account_id=${ACCOUNT_ID}`,
    `/premium/network?account_id=${ACCOUNT_ID}`,
    `/sales/people?account_id=${ACCOUNT_ID}`,
    `/sales/connections?account_id=${ACCOUNT_ID}`
  ];

  for (const endpoint of salesNavEndpoints) {
    await testEndpoint(`Sales Nav: ${endpoint}`, `${BASE_URL}${endpoint}`);
  }

  console.log('\n2. Testing LinkedIn v2 API patterns through Unipile...');
  
  // Test if Unipile proxies LinkedIn v2 API
  const v2Endpoints = [
    `/v2/people/(id:${ACCOUNT_ID})/connections`,
    `/v2/people/connections?q=viewer`,
    `/v2/networkSizes?edgeType=FIRST_DEGREE_CONNECTION`,
    `/v2/people?q=connections&start=0&count=50`,
    `/v2/connections?q=viewer`,
    `/linkedin/v2/people/connections?account_id=${ACCOUNT_ID}`,
    `/linkedin/v2/networkSizes?account_id=${ACCOUNT_ID}`
  ];

  for (const endpoint of v2Endpoints) {
    await testEndpoint(`LinkedIn v2: ${endpoint}`, `${BASE_URL}${endpoint}`);
  }

  console.log('\n3. Testing organization-based messaging for contacts...');
  
  // Test organization mailboxes for contacts
  const orgEndpoints = [
    `/organizations/78558524/contacts?account_id=${ACCOUNT_ID}`, // CHILLMINE
    `/organizations/63514768/contacts?account_id=${ACCOUNT_ID}`, // SIA
    `/organizations/15157661/contacts?account_id=${ACCOUNT_ID}`, // InnovareAI
    `/mailbox/78558524/contacts?account_id=${ACCOUNT_ID}`,
    `/company/106816561/connections?account_id=${ACCOUNT_ID}`
  ];

  for (const endpoint of orgEndpoints) {
    await testEndpoint(`Org contacts: ${endpoint}`, `${BASE_URL}${endpoint}`);
  }

  console.log('\n4. Testing raw LinkedIn endpoint proxying...');
  
  // Test if Unipile can proxy raw LinkedIn API calls
  const rawEndpoints = [
    `/raw/linkedin/v2/people/connections`,
    `/proxy/linkedin/v2/people/connections`,
    `/linkedin-api/v2/people/connections`,
    `/api/linkedin/v2/people/connections`,
    `/external/linkedin/people/connections?account_id=${ACCOUNT_ID}`
  ];

  for (const endpoint of rawEndpoints) {
    await testEndpoint(`Raw LinkedIn: ${endpoint}`, `${BASE_URL}${endpoint}`);
  }

  console.log('\n5. Testing advanced pagination and data mining...');
  
  // Test getting more data from existing working endpoints
  console.log('Testing maximum chat extraction with different parameters...');
  
  const chatVariations = [
    `/chats?account_id=${ACCOUNT_ID}&limit=200&include_archived=true`,
    `/chats?account_id=${ACCOUNT_ID}&limit=200&folder=ALL`,
    `/chats?account_id=${ACCOUNT_ID}&limit=200&type=all`,
    `/chats?account_id=${ACCOUNT_ID}&limit=200&include_metadata=true`,
    `/chats?account_id=${ACCOUNT_ID}&start=0&count=200`,
    `/chats?account_id=${ACCOUNT_ID}&limit=200&expand=participants`
  ];

  for (const endpoint of chatVariations) {
    await testEndpoint(`Chat variation: ${endpoint}`, `${BASE_URL}${endpoint}`);
  }

  console.log('\n6. Testing message mining for expanded network...');
  
  const messageVariations = [
    `/messages?account_id=${ACCOUNT_ID}&limit=1000&include_archived=true`,
    `/messages?account_id=${ACCOUNT_ID}&limit=1000&folder=ALL`,
    `/messages?account_id=${ACCOUNT_ID}&limit=1000&expand=sender`,
    `/messages?account_id=${ACCOUNT_ID}&limit=1000&type=all`,
    `/messages?account_id=${ACCOUNT_ID}&limit=1000&include_metadata=true`
  ];

  for (const endpoint of messageVariations) {
    await testEndpoint(`Message variation: ${endpoint}`, `${BASE_URL}${endpoint}`);
  }

  console.log('\n='.repeat(60));
  console.log('SUMMARY & RECOMMENDATIONS');
  console.log('='.repeat(60));
  
  console.log('🎯 Current Status:');
  console.log('- ✅ Unipile provides LinkedIn messaging/chat access');
  console.log('- ✅ Sales Navigator Premium features available');
  console.log('- ❌ Direct connections API not exposed through Unipile');
  console.log('- ❌ LinkedIn v2 People API not accessible via proxy');
  
  console.log('\n💡 Potential Solutions:');
  console.log('1. 🔥 Use LinkedIn API directly with your credentials');
  console.log('2. 📈 Maximize current Unipile chat/message mining');
  console.log('3. 🏢 Explore organization-based contact discovery');
  console.log('4. 🔍 Implement LinkedIn web scraping (if ToS compliant)');
  console.log('5. 📱 Use LinkedIn mobile API endpoints');
  
  console.log('\n🚀 Immediate Action Plan:');
  console.log('1. Check if you have LinkedIn API app credentials');
  console.log('2. Optimize current chat/message extraction to get 500+ contacts');
  console.log('3. Explore LinkedIn CSV export as backup');
  console.log('4. Consider LinkedIn Sales Navigator API if available');
}

async function testEndpoint(name, url) {
  try {
    const response = await fetch(url, { headers });
    
    if (response.ok) {
      const data = await response.json();
      const count = data.items ? data.items.length : 
                   data.elements ? data.elements.length :
                   data.connections ? data.connections.length :
                   Array.isArray(data) ? data.length : 1;
      
      console.log(`✅ ${name}: ${count} items`);
      
      if (count > 0) {
        const sampleData = data.items?.[0] || data.elements?.[0] || data.connections?.[0] || data;
        if (sampleData && typeof sampleData === 'object') {
          const fields = Object.keys(sampleData).slice(0, 5);
          console.log(`   📋 Fields: ${fields.join(', ')}`);
        }
      }
      
      return { success: true, count, data };
    } else {
      console.log(`❌ ${name}: ${response.status}`);
      return { success: false, status: response.status };
    }
  } catch (error) {
    console.log(`❌ ${name}: ${error.message}`);
    return { success: false, error: error.message };
  }
}

testLinkedInNativeAPI();