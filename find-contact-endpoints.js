/**
 * Find the correct Unipile endpoints for contacts/connections
 */

const UNIPILE_API_KEY = 'aQzsD1+H.EJ60hU0LkPAxRaCU6nlvk3ypn9Rn9BUwqo9LGY24zZU=';
const UNIPILE_BASE_URL = 'https://api6.unipile.com:13670/api/v1';
const THORSTEN_ACCOUNT_ID = '4jyMc-EDT1-hE5pOoT7EaQ';

async function findContactEndpoints() {
  console.log('🔍 Finding correct contact/connection endpoints...');

  const possibleEndpoints = [
    '/contacts',
    '/connections', 
    '/people',
    '/network',
    '/linkedin_connections',
    '/attendees'
  ];

  for (const endpoint of possibleEndpoints) {
    const testEndpoints = [
      `${endpoint}?account_id=${THORSTEN_ACCOUNT_ID}&limit=5`,
      `${endpoint}/${THORSTEN_ACCOUNT_ID}?limit=5`,
      `${endpoint}`
    ];

    for (const testUrl of testEndpoints) {
      console.log(`\n📡 Testing: ${testUrl}`);
      
      try {
        const response = await fetch(`${UNIPILE_BASE_URL}${testUrl}`, {
          method: 'GET',
          headers: {
            'X-API-KEY': UNIPILE_API_KEY,
            'Accept': 'application/json'
          }
        });

        console.log(`   Status: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log(`   ✅ SUCCESS! Found ${data.items?.length || 0} items`);
          
          if (data.items && data.items.length > 0) {
            console.log(`   📝 Sample item:`, JSON.stringify(data.items[0], null, 2));
            console.log(`   🎯 This endpoint works for contacts!`);
            return testUrl;
          }
        } else if (response.status === 404) {
          console.log(`   ❌ Not found`);
        } else {
          const errorText = await response.text();
          console.log(`   ⚠️ Error: ${errorText}`);
        }
      } catch (error) {
        console.log(`   🚨 Network error: ${error.message}`);
      }
    }
  }

  // Let's also check if we can get attendee information from chat participants
  console.log('\n🔍 Testing attendee extraction from chats...');
  
  try {
    // Get a chat first
    const chatsResponse = await fetch(`${UNIPILE_BASE_URL}/chats?account_id=${THORSTEN_ACCOUNT_ID}&limit=1`, {
      headers: {
        'X-API-KEY': UNIPILE_API_KEY,
        'Accept': 'application/json'
      }
    });
    
    if (chatsResponse.ok) {
      const chatsData = await chatsResponse.json();
      
      if (chatsData.items && chatsData.items.length > 0) {
        const chat = chatsData.items[0];
        console.log(`Found chat with attendee_provider_id: ${chat.attendee_provider_id}`);
        
        // Try to get attendee info
        if (chat.attendee_provider_id) {
          const attendeeTests = [
            `/attendees/${encodeURIComponent(chat.attendee_provider_id)}?account_id=${THORSTEN_ACCOUNT_ID}`,
            `/users/${encodeURIComponent(chat.attendee_provider_id)}?account_id=${THORSTEN_ACCOUNT_ID}`,
            `/profiles/${encodeURIComponent(chat.attendee_provider_id)}?account_id=${THORSTEN_ACCOUNT_ID}`
          ];
          
          for (const attendeeUrl of attendeeTests) {
            console.log(`\n👤 Testing attendee endpoint: ${attendeeUrl}`);
            
            const attendeeResponse = await fetch(`${UNIPILE_BASE_URL}${attendeeUrl}`, {
              headers: {
                'X-API-KEY': UNIPILE_API_KEY,
                'Accept': 'application/json'
              }
            });
            
            console.log(`   Status: ${attendeeResponse.status}`);
            
            if (attendeeResponse.ok) {
              const attendeeData = await attendeeResponse.json();
              console.log(`   ✅ SUCCESS! Attendee data:`, JSON.stringify(attendeeData, null, 2));
              return attendeeUrl;
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error testing attendee extraction:', error);
  }

  console.log('\n❌ No working contact endpoints found');
  console.log('💡 Contact data might need to be extracted from chat attendees');
  return null;
}

findContactEndpoints().catch(console.error);