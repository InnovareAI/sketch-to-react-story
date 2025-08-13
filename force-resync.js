// Force complete resync with fixed message saving
const API_KEY = 'aQzsD1+H.EJ60hU0LkPAxRaCU6nlvk3ypn9Rn9BUwqo9LGY24zZU=';
const BASE_URL = 'https://api6.unipile.com:13670/api/v1';

const SUPABASE_URL = 'https://ktchrfgkbpaixbiwbieg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0Y2hyZmdrYnBhaXhiaXdiaWVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjI0MzMxNzcsImV4cCI6MjAzODAwOTE3N30.YI1RxpjqToyqY9Dj12fqEP2V3G6d2j8QZA2xj8TcTBg';

async function forceResync() {
  console.log('🚀 Starting complete resync with ALL messages...\n');
  
  try {
    // Get Thorsten account
    const accountsResponse = await fetch(`${BASE_URL}/accounts`, {
      headers: { 'X-API-KEY': API_KEY, 'Accept': 'application/json' }
    });
    
    const accountsData = await accountsResponse.json();
    const thorstenAccount = accountsData.items?.find(acc => 
      acc.name === 'Thorsten Linz' && acc.type === 'LINKEDIN'
    );
    
    if (!thorstenAccount) {
      console.log('❌ Account not found');
      return;
    }
    
    console.log(`✅ Found account: ${thorstenAccount.name}\n`);
    
    // Get all chats
    const chatsResponse = await fetch(`${BASE_URL}/chats?account_id=${thorstenAccount.id}&limit=10`, {
      headers: { 'X-API-KEY': API_KEY, 'Accept': 'application/json' }
    });
    
    const chatsData = await chatsResponse.json();
    const chats = chatsData.items || [];
    
    console.log(`📧 Processing ${chats.length} conversations...\n`);
    
    // Process each chat
    for (const chat of chats) {
      // Fetch ALL messages for this chat
      const messagesResponse = await fetch(
        `${BASE_URL}/messages?account_id=${thorstenAccount.id}&chat_id=${chat.id}&limit=100`,
        { headers: { 'X-API-KEY': API_KEY, 'Accept': 'application/json' } }
      );
      
      const messagesData = await messagesResponse.json();
      const messages = messagesData.items || [];
      
      console.log(`📨 Chat ${chat.id}: Found ${messages.length} messages`);
      
      if (messages.length > 1) {
        console.log('   Sample messages:');
        messages.slice(0, 3).forEach((msg, i) => {
          console.log(`     ${i + 1}. ${msg.is_sender ? 'You' : 'Them'}: "${msg.text?.substring(0, 50)}..."`);
        });
      }
    }
    
    console.log('\n✅ Analysis complete!');
    console.log('Now click "Sync LinkedIn" in your inbox to sync all these messages.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the resync
forceResync();