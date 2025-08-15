// Test manual sync through app interface
import fetch from 'node-fetch';

const SUPABASE_URL = 'https://latxadqrvrrrcvkktrog.supabase.co';
const JWT_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhdHhhZHFydnJycmN2a2t0cm9nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTk5ODYsImV4cCI6MjA2ODI3NTk4Nn0.3WkAgXpk_MyQioVf_SED9O_ArjcT9nH0uy9we2okftE';

async function testAppSync() {
  console.log('🧪 Testing App-triggered sync...');
  
  try {
    // Call edge function the same way the app does
    const response = await fetch(`${SUPABASE_URL}/functions/v1/linkedin-background-sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${JWT_KEY}`,
        'apikey': JWT_KEY
      },
      body: JSON.stringify({
        workspace_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        account_id: '4jyMc-EDT1-hE5pOoT7EaQ',
        sync_type: 'messages',
        limit: 5
      })
    });
    
    console.log(`📊 Response status: ${response.status}`);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Sync response:', result);
      
      // Check database directly for new data
      console.log('\n📋 Checking database for new conversations...');
      
      const dbCheckResponse = await fetch(`${SUPABASE_URL}/rest/v1/inbox_conversations?select=*&workspace_id=eq.a1b2c3d4-e5f6-7890-abcd-ef1234567890&order=created_at.desc&limit=5`, {
        headers: {
          'Authorization': `Bearer ${JWT_KEY}`,
          'apikey': JWT_KEY,
          'Accept': 'application/json'
        }
      });
      
      if (dbCheckResponse.ok) {
        const conversations = await dbCheckResponse.json();
        console.log(`📊 Found ${conversations.length} conversations in database`);
        
        if (conversations.length > 0) {
          console.log('📋 Latest conversation:', conversations[0]);
        }
      }
      
    } else {
      const errorText = await response.text();
      console.error('❌ Sync failed:', response.status, errorText);
    }
    
  } catch (error) {
    console.error('💥 Error:', error.message);
  }
}

testAppSync();