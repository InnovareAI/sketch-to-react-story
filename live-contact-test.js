// Live contact sync test - Show actual contacts & SAVE TO SUPABASE
console.log('🧪 LIVE CONTACT SYNC TEST WITH SUPABASE STORAGE\n');

const UNIPILE_API_KEY = 'aQzsD1+H.EJ60hU0LkPAxRaCU6nlvk3ypn9Rn9BUwqo9LGY24zZU=';
const ACCOUNT_ID = '4jyMc-EDT1-hE5pOoT7EaQ';
const BASE_URL = 'https://api6.unipile.com:13670/api/v1';
const WORKSPACE_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

// Supabase configuration
const SUPABASE_URL = 'https://latxadqrvrrrcvkktrog.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhdHhhZHFydnJycmN2a2t0cm9nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTk5ODYsImV4cCI6MjA2ODI3NTk4Nn0.3WkAgXpk_MyQioVf_SED9O_ArjcT9nH0uy9we2okftE';

const headers = {
  'X-API-Key': UNIPILE_API_KEY,
  'Content-Type': 'application/json'
};

// Supabase helper function
async function saveContactsToSupabase(contacts) {
  console.log(`💾 Saving ${contacts.length} contacts to Supabase...`);
  
  const supabaseHeaders = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal'
  };
  
  let savedCount = 0;
  let errorCount = 0;
  
  // Process contacts in batches of 10 to avoid overwhelming the API
  for (let i = 0; i < contacts.length; i += 10) {
    const batch = contacts.slice(i, i + 10);
    
    try {
      const contactsForInsert = batch.map(contact => ({
        workspace_id: WORKSPACE_ID,
        first_name: contact.first_name || '',
        last_name: contact.last_name || '',
        email: contact.email,
        linkedin_url: contact.linkedin_url || null,
        title: contact.title !== 'No title available' ? contact.title : null,
        engagement_score: Math.floor(Math.random() * 100) + 1, // Random score for now
        tags: ['linkedin-sync', 'unipile-import'],
        metadata: {
          provider_id: contact.provider_id,
          network_distance: contact.network_distance,
          picture_url: contact.picture_url,
          source: contact.source || 'chat',
          chat_name: contact.chat_name,
          member_urn: contact.member_urn,
          sync_date: new Date().toISOString(),
          last_message: contact.last_message
        }
      }));
      
      const response = await fetch(`${SUPABASE_URL}/rest/v1/contacts`, {
        method: 'POST',
        headers: supabaseHeaders,
        body: JSON.stringify(contactsForInsert)
      });
      
      if (response.ok) {
        savedCount += batch.length;
        console.log(`   ✅ Batch ${Math.floor(i/10) + 1}: Saved ${batch.length} contacts`);
      } else {
        const errorText = await response.text();
        console.log(`   ❌ Batch ${Math.floor(i/10) + 1}: Failed to save ${batch.length} contacts - ${errorText}`);
        errorCount += batch.length;
      }
    } catch (error) {
      console.log(`   ❌ Batch ${Math.floor(i/10) + 1}: Error saving ${batch.length} contacts - ${error.message}`);
      errorCount += batch.length;
    }
    
    // Small delay between batches
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return { savedCount, errorCount };
}

async function runLiveContactTest() {
  console.log('='.repeat(60));
  console.log('🔄 EXTRACTING YOUR ACTUAL LINKEDIN CONTACTS');
  console.log('='.repeat(60));
  
  const allContacts = new Map();
  let contactSamples = [];
  
  try {
    // Step 1: Get all chats including archived
    console.log('📱 Step 1: Fetching all LinkedIn chats...');
    const chatsResponse = await fetch(`${BASE_URL}/chats?account_id=${ACCOUNT_ID}&limit=200&include_archived=true`, { headers });
    
    if (!chatsResponse.ok) {
      throw new Error(`Chats API failed: ${chatsResponse.status}`);
    }
    
    const chatsData = await chatsResponse.json();
    const allChats = chatsData.items || [];
    console.log(`✅ Found ${allChats.length} total chats\n`);
    
    // Step 2: Process chats to extract contacts
    console.log('👥 Step 2: Extracting contacts from chats...');
    let processedChats = 0;
    
    for (let i = 0; i < Math.min(allChats.length, 50); i++) { // Process first 50 for speed
      const chat = allChats[i];
      
      try {
        const attendeesResponse = await fetch(`${BASE_URL}/chats/${chat.id}/attendees`, { headers });
        
        if (attendeesResponse.ok) {
          const attendeesData = await attendeesResponse.json();
          const attendees = attendeesData.items || [];
          
          for (const attendee of attendees) {
            if (!attendee.is_self && attendee.provider_id && attendee.name) {
              const contact = {
                provider_id: attendee.provider_id,
                name: attendee.name,
                first_name: attendee.name.split(' ')[0] || '',
                last_name: attendee.name.split(' ').slice(1).join(' ') || '',
                email: `${attendee.provider_id}@linkedin.com`,
                title: attendee.specifics?.occupation || 'No title available',
                linkedin_url: attendee.profile_url || '',
                network_distance: attendee.specifics?.network_distance || 'Unknown',
                picture_url: attendee.picture_url || '',
                is_company: attendee.specifics?.is_company || false,
                chat_name: chat.name || 'Unnamed Chat',
                member_urn: attendee.specifics?.member_urn || ''
              };
              
              allContacts.set(attendee.provider_id, contact);
              
              // Collect interesting samples
              if (contactSamples.length < 20 && contact.title !== 'No title available') {
                contactSamples.push(contact);
              }
            }
          }
          processedChats++;
        }
      } catch (err) {
        // Continue with next chat
      }
      
      // Progress indicator
      if (i % 10 === 0) {
        console.log(`   Processed ${i + 1}/50 chats... (${allContacts.size} contacts so far)`);
      }
    }
    
    console.log(`✅ Processed ${processedChats} chats successfully\n`);
    
    // Step 3: Get contacts from messages
    console.log('📨 Step 3: Extracting contacts from messages...');
    
    try {
      const messagesResponse = await fetch(`${BASE_URL}/messages?account_id=${ACCOUNT_ID}&limit=500`, { headers });
      
      if (messagesResponse.ok) {
        const messagesData = await messagesResponse.json();
        const messages = messagesData.items || [];
        
        let messageContacts = 0;
        for (const message of messages) {
          if (message.from && message.from.provider_id && message.from.name && !message.from.is_self) {
            const senderId = message.from.provider_id;
            
            if (!allContacts.has(senderId)) {
              const contact = {
                provider_id: senderId,
                name: message.from.name,
                first_name: message.from.name.split(' ')[0] || '',
                last_name: message.from.name.split(' ').slice(1).join(' ') || '',
                email: `${senderId}@linkedin.com`,
                title: message.from.specifics?.occupation || 'No title available',
                linkedin_url: message.from.profile_url || '',
                network_distance: message.from.specifics?.network_distance || 'Unknown',
                picture_url: message.from.picture_url || '',
                source: 'message',
                last_message: message.text ? message.text.substring(0, 100) + '...' : '',
                message_date: message.created_at
              };
              
              allContacts.set(senderId, contact);
              messageContacts++;
              
              // Add to samples if interesting
              if (contactSamples.length < 20 && contact.title !== 'No title available') {
                contactSamples.push(contact);
              }
            }
          }
        }
        
        console.log(`✅ Found ${messageContacts} additional contacts from messages\n`);
      }
    } catch (err) {
      console.log('⚠️ Could not fetch messages:', err.message);
    }
    
    // Step 4: Show results
    const contactsArray = Array.from(allContacts.values());
    
    console.log('='.repeat(60));
    console.log('📊 LIVE TEST RESULTS');
    console.log('='.repeat(60));
    
    console.log(`🎯 TOTAL CONTACTS FOUND: ${contactsArray.length}`);
    
    // Quality breakdown
    const withTitles = contactsArray.filter(c => c.title && c.title !== 'No title available').length;
    const withLinkedIn = contactsArray.filter(c => c.linkedin_url).length;
    const firstDegree = contactsArray.filter(c => c.network_distance === 'DISTANCE_1').length;
    const secondDegree = contactsArray.filter(c => c.network_distance === 'DISTANCE_2').length;
    const thirdDegree = contactsArray.filter(c => c.network_distance === 'DISTANCE_3').length;
    
    console.log(`\n📈 QUALITY METRICS:`);
    console.log(`   - With job titles: ${withTitles} (${Math.round(withTitles/contactsArray.length*100)}%)`);
    console.log(`   - With LinkedIn URLs: ${withLinkedIn} (${Math.round(withLinkedIn/contactsArray.length*100)}%)`);
    console.log(`   - 1st degree connections: ${firstDegree}`);
    console.log(`   - 2nd degree connections: ${secondDegree}`);
    console.log(`   - 3rd degree connections: ${thirdDegree}`);
    
    console.log(`\n👥 SAMPLE CONTACTS (Your Actual Network):`);
    console.log('-'.repeat(60));
    
    // Show actual contact samples
    contactSamples.slice(0, 15).forEach((contact, i) => {
      console.log(`${i + 1}. ${contact.name} ${contact.network_distance ? `(${contact.network_distance})` : ''}`);
      console.log(`   📋 Title: ${contact.title}`);
      console.log(`   🔗 LinkedIn: ${contact.linkedin_url ? 'Yes' : 'No'}`);
      console.log(`   💬 From: ${contact.chat_name || 'Message'}`);
      if (contact.last_message) {
        console.log(`   📨 Last msg: ${contact.last_message}`);
      }
      console.log('');
    });
    
    if (contactSamples.length > 15) {
      console.log(`... and ${contactsArray.length - 15} more contacts\n`);
    }
    
    // Step 5: Analyze contact types
    console.log('🏢 CONTACT CATEGORIES:');
    console.log('-'.repeat(30));
    
    const categories = {};
    contactsArray.forEach(contact => {
      if (contact.title && contact.title !== 'No title available') {
        // Extract industry/role keywords
        const title = contact.title.toLowerCase();
        if (title.includes('ceo') || title.includes('founder') || title.includes('president')) {
          categories['C-Level/Founders'] = (categories['C-Level/Founders'] || 0) + 1;
        } else if (title.includes('sales') || title.includes('business development')) {
          categories['Sales & BD'] = (categories['Sales & BD'] || 0) + 1;
        } else if (title.includes('marketing')) {
          categories['Marketing'] = (categories['Marketing'] || 0) + 1;
        } else if (title.includes('engineer') || title.includes('developer') || title.includes('tech')) {
          categories['Technology'] = (categories['Technology'] || 0) + 1;
        } else if (title.includes('consultant') || title.includes('advisor')) {
          categories['Consulting'] = (categories['Consulting'] || 0) + 1;
        } else {
          categories['Other Professionals'] = (categories['Other Professionals'] || 0) + 1;
        }
      }
    });
    
    Object.entries(categories).forEach(([category, count]) => {
      console.log(`   ${category}: ${count} contacts`);
    });
    
    // Step 5: Save to Supabase database
    console.log('\n' + '='.repeat(60));
    console.log('💾 STEP 5: SAVING TO SUPABASE DATABASE');
    console.log('='.repeat(60));
    
    const saveResult = await saveContactsToSupabase(contactsArray);
    
    console.log('\n📊 SUPABASE SAVE RESULTS:');
    console.log(`   ✅ Successfully saved: ${saveResult.savedCount} contacts`);
    if (saveResult.errorCount > 0) {
      console.log(`   ❌ Failed to save: ${saveResult.errorCount} contacts`);
    }
    console.log(`   📈 Success rate: ${Math.round((saveResult.savedCount / contactsArray.length) * 100)}%`);
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ LIVE TEST COMPLETE WITH DATABASE STORAGE!');
    console.log('='.repeat(60));
    
    console.log(`\n🎯 Summary: Found ${contactsArray.length} real LinkedIn contacts from your network`);
    console.log(`📊 These are actual people you've connected or communicated with`);
    console.log(`💾 Saved ${saveResult.savedCount} contacts to your SAM AI database!`);
    console.log(`🔗 Visit https://sameaisalesassistant.netlify.app/contacts to see them!`);
    
    return {
      totalContacts: contactsArray.length,
      withTitles,
      withLinkedIn,
      samples: contactSamples,
      categories,
      supabaseSaved: saveResult.savedCount,
      supabaseErrors: saveResult.errorCount
    };
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return null;
  }
}

runLiveContactTest();