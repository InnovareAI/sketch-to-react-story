// Direct Contact Sync Test
// Copy and paste this into the browser console on the Contacts page

(async function testContactSyncDirect() {
  console.log('🧪 Starting Contact Sync Test...\n');
  
  const UNIPILE_API_KEY = 'TE3VJJ3-N3E63ND-MWXM462-RBPCWYQ';
  const UNIPILE_BASE_URL = 'https://api6.unipile.com:13443/api/v1';
  
  try {
    // Step 1: Check LinkedIn Account
    console.log('📋 Step 1: Checking LinkedIn Account...');
    const accounts = JSON.parse(localStorage.getItem('linkedin_accounts') || '[]');
    
    if (accounts.length === 0) {
      console.error('❌ No LinkedIn account connected');
      return;
    }
    
    const account = accounts[0];
    const accountId = account.unipileAccountId || account.id || account.account_id;
    
    console.log('✅ Found LinkedIn account:', {
      name: account.name,
      email: account.email,
      accountId: accountId,
      allIds: {
        unipileAccountId: account.unipileAccountId,
        id: account.id,
        account_id: account.account_id
      }
    });

    // Step 2: Test API Connection
    console.log('\n🔌 Step 2: Testing Unipile API...');
    try {
      const response = await fetch(
        `${UNIPILE_BASE_URL}/users/${accountId}/connections?limit=10`,
        {
          headers: {
            'Authorization': `Bearer ${UNIPILE_API_KEY}`,
            'Accept': 'application/json'
          }
        }
      );
      
      console.log('API Response Status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        const contacts = data.connections || data.items || data.data || [];
        
        console.log(`✅ API Working! Found ${contacts.length} contacts`);
        
        if (contacts.length > 0) {
          console.log('\n📝 Sample Contacts:');
          contacts.slice(0, 3).forEach((c, i) => {
            console.log(`  ${i + 1}. ${c.name || 'Unknown'} - ${c.company || 'No company'}`);
          });
        }
      } else {
        const errorText = await response.text();
        console.error('❌ API Error:', response.status, errorText);
      }
    } catch (error) {
      console.error('❌ API Connection Failed:', error);
    }

    // Step 3: Try Manual Sync
    console.log('\n🔄 Step 3: Attempting Manual Sync...');
    console.log('To manually sync, click the "Sync LinkedIn" or "Enable Auto-Sync" button on the page');
    
    // Check if sync service is available
    if (window.contactMessageSync) {
      console.log('✅ Sync service is available');
    } else {
      console.log('⚠️ Sync service not loaded. Importing...');
      try {
        const module = await import('/src/services/unipile/ContactMessageSync.ts');
        if (module.contactMessageSync) {
          console.log('✅ Sync service imported successfully');
        }
      } catch (e) {
        console.log('❌ Could not import sync service');
      }
    }

  } catch (error) {
    console.error('❌ Test Error:', error);
  }
  
  console.log('\n========================================');
  console.log('Test complete. Check output above for issues.');
  console.log('If contacts aren\'t syncing, the issue is likely:');
  console.log('1. No LinkedIn account connected');
  console.log('2. Wrong account ID format');
  console.log('3. API authentication issue');
  console.log('4. API endpoint has changed');
})();