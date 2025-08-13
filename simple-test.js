// Simple Contact Sync Test - Copy this entire block
async function testSync() {
  console.log('Testing LinkedIn Sync...');
  
  // Get account
  const accounts = JSON.parse(localStorage.getItem('linkedin_accounts') || '[]');
  if (!accounts[0]) {
    console.error('No LinkedIn account found');
    return;
  }
  
  const acc = accounts[0];
  console.log('Account:', acc);
  
  // Find ID
  const id = acc.unipileAccountId || acc.id || acc.account_id;
  console.log('Account ID:', id);
  
  if (!id) {
    console.error('No valid account ID found');
    return;
  }
  
  // Test API
  try {
    const url = 'https://api6.unipile.com:13443/api/v1/users/' + id + '/connections?limit=5';
    const res = await fetch(url, {
      headers: {
        'Authorization': 'Bearer TE3VJJ3-N3E63ND-MWXM462-RBPCWYQ',
        'Accept': 'application/json'
      }
    });
    
    console.log('API Status:', res.status);
    
    if (res.ok) {
      const data = await res.json();
      console.log('Success! Contacts:', data);
      const contacts = data.connections || data.items || data.data || [];
      console.log('Found', contacts.length, 'contacts');
      if (contacts[0]) {
        console.log('First contact:', contacts[0].name || contacts[0]);
      }
    } else {
      const err = await res.text();
      console.error('API Error:', err);
    }
  } catch (e) {
    console.error('Request failed:', e);
  }
}

// Run the test
testSync();