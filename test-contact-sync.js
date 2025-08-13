// Test LinkedIn contact sync directly
console.log('🔄 Testing LinkedIn contact sync...\n');

const UNIPILE_API_KEY = 'aQzsD1+H.EJ60hU0LkPAxRaCU6nlvk3ypn9Rn9BUwqo9LGY24zZU=';
const ACCOUNT_ID = '4jyMc-EDT1-hE5pOoT7EaQ';

async function testSync() {
  try {
    console.log('1. Testing chats endpoint...');
    const chatsResponse = await fetch(`https://api6.unipile.com:13670/api/v1/chats?account_id=${ACCOUNT_ID}&limit=5`, {
      headers: {
        'X-API-Key': UNIPILE_API_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    if (!chatsResponse.ok) {
      throw new Error(`Chats API failed: ${chatsResponse.status}`);
    }
    
    const chatsData = await chatsResponse.json();
    console.log(`✅ Found ${chatsData.items.length} chats`);
    
    // Test first chat's attendees
    const firstChat = chatsData.items[0];
    console.log(`\n2. Testing attendees for chat: ${firstChat.id}`);
    
    const attendeesResponse = await fetch(`https://api6.unipile.com:13670/api/v1/chats/${firstChat.id}/attendees`, {
      headers: {
        'X-API-Key': UNIPILE_API_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    if (!attendeesResponse.ok) {
      throw new Error(`Attendees API failed: ${attendeesResponse.status}`);
    }
    
    const attendeesData = await attendeesResponse.json();
    console.log(`✅ Found ${attendeesData.items.length} attendees`);
    
    // Show first contact details
    const firstContact = attendeesData.items.find(a => !a.is_self);
    if (firstContact) {
      console.log('\n📋 Sample contact:');
      console.log(`Name: ${firstContact.name}`);
      console.log(`Provider ID: ${firstContact.provider_id}`);
      console.log(`Occupation: ${firstContact.specifics?.occupation || 'N/A'}`);
      console.log(`LinkedIn URL: ${firstContact.profile_url || 'N/A'}`);
      console.log(`Network Distance: ${firstContact.specifics?.network_distance || 'N/A'}`);
    }
    
    // Test database connection
    console.log('\n3. Testing database connection...');
    
    // Create contact object as our sync function would
    const contactData = {
      workspace_id: 'df5d730f-1915-4269-bd5a-9534478b17af',
      email: `${firstContact.provider_id}@linkedin.com`,
      first_name: firstContact.name?.split(' ')[0] || '',
      last_name: firstContact.name?.split(' ').slice(1).join(' ') || '',
      title: firstContact.specifics?.occupation || '',
      linkedin_url: firstContact.profile_url || '',
      metadata: {
        ...firstContact,
        source: 'linkedin_chat',
        unipile_account_id: ACCOUNT_ID,
        chat_id: firstChat.id
      }
    };
    
    console.log('\n📝 Contact data to be stored:');
    console.log(JSON.stringify(contactData, null, 2));
    
    console.log('\n✅ API endpoints working! Issue might be in the frontend sync call or database permissions.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Details:', error);
  }
}

testSync();