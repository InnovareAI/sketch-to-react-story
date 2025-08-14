// Extract ALL LinkedIn contacts from all chats and messages
console.log('🚀 Extracting ALL LinkedIn contacts...\n');

const UNIPILE_API_KEY = 'aQzsD1+H.EJ60hU0LkPAxRaCU6nlvk3ypn9Rn9BUwqo9LGY24zZU=';
const ACCOUNT_ID = '4jyMc-EDT1-hE5pOoT7EaQ';
const BASE_URL = 'https://api6.unipile.com:13670/api/v1';

const headers = {
  'X-API-Key': UNIPILE_API_KEY,
  'Content-Type': 'application/json'
};

async function getAllContacts() {
  try {
    const allContacts = new Map(); // Use Map to deduplicate by provider_id
    let totalProcessed = 0;
    
    console.log('1. Getting ALL chats (no limit)...');
    
    // Get all chats with higher limit
    let offset = 0;
    let hasMore = true;
    let allChats = [];
    
    while (hasMore) {
      const chatsResponse = await fetch(`${BASE_URL}/chats?account_id=${ACCOUNT_ID}&limit=500&offset=${offset}`, { headers });
      
      if (!chatsResponse.ok) {
        throw new Error(`Chats API failed: ${chatsResponse.status}`);
      }
      
      const chatsData = await chatsResponse.json();
      const chats = chatsData.items || [];
      
      allChats.push(...chats);
      console.log(`   Fetched ${chats.length} chats (offset: ${offset}, total: ${allChats.length})`);
      
      hasMore = chats.length === 500; // Continue if we got the full batch
      offset += 500;
    }
    
    console.log(`✅ Total chats found: ${allChats.length}`);
    
    console.log('\n2. Extracting attendees from ALL chats...');
    
    // Process all chats to get attendees
    for (let i = 0; i < allChats.length; i++) {
      const chat = allChats[i];
      
      if (i % 10 === 0) {
        console.log(`   Processing chat ${i + 1}/${allChats.length}...`);
      }
      
      try {
        const attendeesResponse = await fetch(`${BASE_URL}/chats/${chat.id}/attendees`, { headers });
        
        if (attendeesResponse.ok) {
          const attendeesData = await attendeesResponse.json();
          const attendees = attendeesData.items || [];
          
          // Process each attendee
          for (const attendee of attendees) {
            if (!attendee.is_self && attendee.provider_id && attendee.name) {
              // Store contact with provider_id as key to avoid duplicates
              allContacts.set(attendee.provider_id, {
                provider_id: attendee.provider_id,
                name: attendee.name,
                profile_url: attendee.profile_url || '',
                occupation: attendee.specifics?.occupation || '',
                network_distance: attendee.specifics?.network_distance || '',
                picture_url: attendee.picture_url || '',
                chat_id: chat.id,
                chat_name: chat.name || '',
                source: 'linkedin_chat'
              });
            }
          }
        }
      } catch (err) {
        // Continue with next chat on error
        console.log(`   Warning: Failed to process chat ${chat.id}: ${err.message}`);
      }
      
      totalProcessed++;
    }
    
    console.log('\n3. Getting contacts from messages...');
    
    // Also check messages for additional contacts
    let messageOffset = 0;
    let messageHasMore = true;
    let messagesProcessed = 0;
    
    while (messageHasMore && messagesProcessed < 1000) { // Limit to prevent infinite loop
      try {
        const messagesResponse = await fetch(`${BASE_URL}/messages?account_id=${ACCOUNT_ID}&limit=500&offset=${messageOffset}`, { headers });
        
        if (messagesResponse.ok) {
          const messagesData = await messagesResponse.json();
          const messages = messagesData.items || [];
          
          console.log(`   Fetched ${messages.length} messages (offset: ${messageOffset})`);
          
          // Extract sender information from messages
          for (const message of messages) {
            if (message.from && message.from.provider_id && message.from.name && !message.from.is_self) {
              const senderId = message.from.provider_id;
              if (!allContacts.has(senderId)) {
                allContacts.set(senderId, {
                  provider_id: senderId,
                  name: message.from.name,
                  profile_url: message.from.profile_url || '',
                  occupation: message.from.specifics?.occupation || '',
                  picture_url: message.from.picture_url || '',
                  source: 'linkedin_message'
                });
              }
            }
          }
          
          messageHasMore = messages.length === 500;
          messageOffset += 500;
          messagesProcessed += messages.length;
        } else {
          break;
        }
      } catch (err) {
        console.log(`   Warning: Failed to process messages: ${err.message}`);
        break;
      }
    }
    
    // Convert Map to Array and display results
    const contactsArray = Array.from(allContacts.values());
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 EXTRACTION COMPLETE!');
    console.log('='.repeat(60));
    console.log(`✅ Total unique LinkedIn contacts found: ${contactsArray.length}`);
    console.log(`✅ Chats processed: ${totalProcessed}`);
    console.log(`✅ Messages processed: ${messagesProcessed}`);
    
    // Show breakdown by source
    const fromChats = contactsArray.filter(c => c.source === 'linkedin_chat').length;
    const fromMessages = contactsArray.filter(c => c.source === 'linkedin_message').length;
    
    console.log(`   - From chat attendees: ${fromChats}`);
    console.log(`   - From message senders: ${fromMessages}`);
    
    // Show some sample contacts
    console.log('\n📋 Sample contacts:');
    contactsArray.slice(0, 5).forEach((contact, i) => {
      console.log(`${i + 1}. ${contact.name}`);
      console.log(`   Job: ${contact.occupation || 'N/A'}`);
      console.log(`   LinkedIn: ${contact.profile_url || 'N/A'}`);
      console.log(`   Source: ${contact.source}`);
      console.log('');
    });
    
    // Show contacts with job titles
    const withJobs = contactsArray.filter(c => c.occupation).length;
    const withProfiles = contactsArray.filter(c => c.profile_url).length;
    
    console.log(`📈 Contact quality:`);
    console.log(`   - With job titles: ${withJobs} (${Math.round(withJobs/contactsArray.length*100)}%)`);
    console.log(`   - With LinkedIn URLs: ${withProfiles} (${Math.round(withProfiles/contactsArray.length*100)}%)`);
    
    if (contactsArray.length > 1000) {
      console.log(`\n🎉 SUCCESS! Found ${contactsArray.length} contacts - this is much better than 1!`);
    } else if (contactsArray.length > 100) {
      console.log(`\n✅ Good! Found ${contactsArray.length} contacts - significant improvement!`);
    } else {
      console.log(`\n⚠️  Found ${contactsArray.length} contacts - let's investigate why the number is still low.`);
    }
    
    return contactsArray;
    
  } catch (error) {
    console.error('❌ Error extracting contacts:', error);
    return [];
  }
}

getAllContacts();