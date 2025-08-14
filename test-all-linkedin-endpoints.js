// Test all possible LinkedIn endpoints to find all contacts
console.log('🔍 Testing all LinkedIn contact endpoints...\n');

const UNIPILE_API_KEY = 'aQzsD1+H.EJ60hU0LkPAxRaCU6nlvk3ypn9Rn9BUwqo9LGY24zZU=';
const ACCOUNT_ID = '4jyMc-EDT1-hE5pOoT7EaQ';
const BASE_URL = 'https://api6.unipile.com:13670/api/v1';

const headers = {
  'X-API-Key': UNIPILE_API_KEY,
  'Content-Type': 'application/json'
};

async function testEndpoint(name, url) {
  try {
    console.log(`Testing ${name}: ${url}`);
    const response = await fetch(url, { headers });
    
    if (response.ok) {
      const data = await response.json();
      const count = data.items ? data.items.length : (Array.isArray(data) ? data.length : 1);
      console.log(`✅ ${name}: ${count} items found`);
      
      if (data.items && data.items.length > 0) {
        const sample = data.items[0];
        console.log(`   Sample: ${JSON.stringify(sample).substring(0, 100)}...`);
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

async function testAllEndpoints() {
  console.log('='.repeat(60));
  console.log('1. DIRECT CONTACTS ENDPOINTS');
  console.log('='.repeat(60));
  
  // Direct contacts endpoints
  await testEndpoint('Direct Contacts', `${BASE_URL}/users/${ACCOUNT_ID}/contacts`);
  await testEndpoint('Direct Contacts (alt)', `${BASE_URL}/contacts?account_id=${ACCOUNT_ID}`);
  await testEndpoint('Connections', `${BASE_URL}/users/${ACCOUNT_ID}/connections`);
  await testEndpoint('Connections (alt)', `${BASE_URL}/connections?account_id=${ACCOUNT_ID}`);
  
  console.log('\n' + '='.repeat(60));
  console.log('2. LINKEDIN SPECIFIC ENDPOINTS');
  console.log('='.repeat(60));
  
  // LinkedIn specific
  await testEndpoint('LinkedIn Contacts', `${BASE_URL}/linkedin/contacts?account_id=${ACCOUNT_ID}`);
  await testEndpoint('LinkedIn Connections', `${BASE_URL}/linkedin/connections?account_id=${ACCOUNT_ID}`);
  await testEndpoint('LinkedIn Network', `${BASE_URL}/linkedin/network?account_id=${ACCOUNT_ID}`);
  await testEndpoint('LinkedIn People', `${BASE_URL}/linkedin/people?account_id=${ACCOUNT_ID}`);
  
  console.log('\n' + '='.repeat(60));
  console.log('3. MESSAGES & CHATS (current working)');
  console.log('='.repeat(60));
  
  // Messages and chats (what we know works)
  const chatsResult = await testEndpoint('Chats (working)', `${BASE_URL}/chats?account_id=${ACCOUNT_ID}&limit=100`);
  await testEndpoint('Messages', `${BASE_URL}/users/${ACCOUNT_ID}/messages`);
  await testEndpoint('Messages (alt)', `${BASE_URL}/messages?account_id=${ACCOUNT_ID}`);
  
  console.log('\n' + '='.repeat(60));
  console.log('4. PROFILE & ACCOUNT INFO');
  console.log('='.repeat(60));
  
  // Profile information
  await testEndpoint('Account Info', `${BASE_URL}/accounts/${ACCOUNT_ID}`);
  await testEndpoint('Profile', `${BASE_URL}/users/${ACCOUNT_ID}/profile`);
  await testEndpoint('User Info', `${BASE_URL}/users/${ACCOUNT_ID}`);
  
  console.log('\n' + '='.repeat(60));
  console.log('5. EXPANDING CHAT ATTENDEES');
  console.log('='.repeat(60));
  
  // Get more from chats
  if (chatsResult.success && chatsResult.data.items) {
    console.log(`Found ${chatsResult.data.items.length} chats, getting ALL attendees...`);
    
    let totalContacts = 0;
    const uniqueContacts = new Set();
    
    for (let i = 0; i < Math.min(chatsResult.data.items.length, 50); i++) {
      const chat = chatsResult.data.items[i];
      try {
        const attendeesResponse = await fetch(`${BASE_URL}/chats/${chat.id}/attendees`, { headers });
        if (attendeesResponse.ok) {
          const attendeesData = await attendeesResponse.json();
          const realAttendees = attendeesData.items.filter(a => !a.is_self);
          realAttendees.forEach(a => uniqueContacts.add(a.provider_id));
          totalContacts += realAttendees.length;
        }
      } catch (e) {
        // Continue with next chat
      }
    }
    
    console.log(`✅ Expanded Chat Attendees: ${uniqueContacts.size} unique contacts from ${Math.min(chatsResult.data.items.length, 50)} chats`);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('6. SEARCH & DISCOVERY');
  console.log('='.repeat(60));
  
  // Search endpoints
  await testEndpoint('Search People', `${BASE_URL}/search/people?account_id=${ACCOUNT_ID}&q=*`);
  await testEndpoint('LinkedIn Search', `${BASE_URL}/linkedin/search?account_id=${ACCOUNT_ID}&type=people`);
  await testEndpoint('Discovery', `${BASE_URL}/discovery?account_id=${ACCOUNT_ID}`);
  
  console.log('\n🎯 ANALYSIS COMPLETE!');
  console.log('Look for endpoints that returned high counts to access your full network.');
}

testAllEndpoints();