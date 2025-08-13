// Quick test script for Unipile contact sync
// Run in browser console at http://localhost:8083

async function testUnipileContactSync() {
  console.log('🔄 Starting Unipile Contact Sync Test...\n');
  
  try {
    // Test 1: Check API connection
    console.log('1️⃣ Testing Unipile API connection...');
    const testResponse = await fetch('/.netlify/functions/unipile-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: '/accounts',
        method: 'GET'
      })
    });
    
    if (!testResponse.ok) {
      throw new Error(`API connection failed: ${testResponse.status}`);
    }
    
    const accounts = await testResponse.json();
    console.log(`✅ API Connected! Found ${accounts.length} LinkedIn accounts\n`);
    
    if (accounts.length === 0) {
      console.log('❌ No LinkedIn accounts connected. Please connect an account first.');
      return;
    }
    
    // Test 2: Get conversations to extract contacts
    const accountId = accounts[0].id;
    console.log(`2️⃣ Fetching conversations for account: ${accounts[0].name || accountId}...`);
    
    const chatsResponse = await fetch('/.netlify/functions/unipile-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: `/chats?account_id=${accountId}&limit=20`,
        method: 'GET'
      })
    });
    
    if (!chatsResponse.ok) {
      throw new Error(`Failed to fetch chats: ${chatsResponse.status}`);
    }
    
    const chats = await chatsResponse.json();
    console.log(`✅ Found ${chats.items?.length || 0} conversations\n`);
    
    // Test 3: Extract unique contacts
    console.log('3️⃣ Extracting contacts from conversations...');
    const contactIds = new Set();
    const contactsToSync = [];
    
    for (const chat of (chats.items || [])) {
      if (chat.attendees_provider_ids) {
        for (const contactId of chat.attendees_provider_ids) {
          if (!contactIds.has(contactId)) {
            contactIds.add(contactId);
            
            // Get contact profile
            console.log(`   📧 Fetching profile for ${contactId}...`);
            const profileResponse = await fetch('/.netlify/functions/unipile-proxy', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                path: `/users/${contactId}?account_id=${accountId}`,
                method: 'GET'
              })
            });
            
            if (profileResponse.ok) {
              const profile = await profileResponse.json();
              contactsToSync.push({
                name: profile.name || 'Unknown',
                headline: profile.headline,
                company: profile.current_company,
                linkedin_url: profile.profile_url,
                email: profile.email
              });
              console.log(`   ✅ Got profile: ${profile.name || 'Unknown'}`);
            }
            
            // Limit to first 5 for testing
            if (contactsToSync.length >= 5) break;
          }
        }
        if (contactsToSync.length >= 5) break;
      }
    }
    
    console.log(`\n✅ Successfully extracted ${contactsToSync.length} contacts!\n`);
    console.log('📋 Sample contacts found:');
    contactsToSync.forEach((contact, i) => {
      console.log(`${i + 1}. ${contact.name} - ${contact.headline || 'No title'} at ${contact.company || 'Unknown company'}`);
    });
    
    // Test 4: Try to sync to database
    console.log('\n4️⃣ Attempting to sync contacts to database...');
    
    // Import the sync service
    const { unipileRealTimeSync } = await import('./src/services/unipile/UnipileRealTimeSync.ts');
    
    // Run sync
    const syncResult = await unipileRealTimeSync.syncContacts();
    console.log(`✅ Sync completed! ${syncResult} contacts processed.\n`);
    
    console.log('🎉 Contact sync test completed successfully!');
    console.log('Check your Contacts page to see the synced contacts.');
    
  } catch (error) {
    console.error('❌ Sync test failed:', error);
    console.log('\n💡 Troubleshooting tips:');
    console.log('1. Make sure you have a LinkedIn account connected in Unipile');
    console.log('2. Check that the Unipile API key is valid in .env.local');
    console.log('3. Ensure the dev server is running on the correct port');
  }
}

// Auto-run the test
console.log('Copy and paste this in your browser console:');
console.log('await testUnipileContactSync()');

// Make it available globally
window.testUnipileContactSync = testUnipileContactSync;