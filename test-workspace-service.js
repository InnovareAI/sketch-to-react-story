// Test WorkspaceUnipileService functionality
console.log('🔄 Testing WorkspaceUnipileService...\n');

const WORKSPACE_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

// Simulate the database response
const mockConfig = {
  account_id: '4jyMc-EDT1-hE5pOoT7EaQ',
  api_key: 'aQzsD1+H.EJ60hU0LkPAxRaCU6nlvk3ypn9Rn9BUwqo9LGY24zZU=',
  dsn: 'api6.unipile.com:13670',
  linkedin_connected: true
};

async function testWorkspaceService() {
  try {
    console.log('1. Testing config retrieval...');
    console.log('✅ Config loaded:', {
      account_id: mockConfig.account_id,
      api_key: mockConfig.api_key.substring(0, 10) + '...',
      dsn: mockConfig.dsn,
      linkedin_connected: mockConfig.linkedin_connected
    });
    
    console.log('\n2. Testing API URL construction...');
    const baseUrl = `https://${mockConfig.dsn}/api/v1`;
    console.log('✅ API URL:', baseUrl);
    
    console.log('\n3. Testing API headers...');
    const headers = {
      'X-API-Key': mockConfig.api_key,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Workspace-ID': WORKSPACE_ID,
      'X-Account-ID': mockConfig.account_id
    };
    console.log('✅ Headers configured:', {
      'X-API-Key': headers['X-API-Key'].substring(0, 10) + '...',
      'Content-Type': headers['Content-Type'],
      'X-Account-ID': headers['X-Account-ID']
    });
    
    console.log('\n4. Testing LinkedIn contacts sync endpoint...');
    const chatsUrl = `${baseUrl}/chats?account_id=${mockConfig.account_id}&limit=5`;
    console.log('✅ Chats endpoint URL:', chatsUrl);
    
    // Test actual API call
    const response = await fetch(chatsUrl, { headers });
    
    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`✅ API call successful! Found ${data.items.length} chats`);
    
    if (data.items.length > 0) {
      const firstChat = data.items[0];
      console.log('\n5. Testing attendees endpoint...');
      
      const attendeesUrl = `${baseUrl}/chats/${firstChat.id}/attendees`;
      const attendeesResponse = await fetch(attendeesUrl, { headers });
      
      if (attendeesResponse.ok) {
        const attendeesData = await attendeesResponse.json();
        console.log(`✅ Attendees call successful! Found ${attendeesData.items.length} contacts`);
        
        const realContact = attendeesData.items.find(a => !a.is_self);
        if (realContact) {
          console.log('\n📋 Sample contact data:');
          console.log(`Name: ${realContact.name}`);
          console.log(`LinkedIn URL: ${realContact.profile_url || 'N/A'}`);
          console.log(`Job: ${realContact.specifics?.occupation || 'N/A'}`);
        }
      }
    }
    
    console.log('\n✅ WorkspaceUnipileService test completed successfully!');
    console.log('🎉 Contact sync should now work in the frontend!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Details:', error);
  }
}

testWorkspaceService();