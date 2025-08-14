// Extract ALL LinkedIn contacts - simplified approach
console.log('🚀 Extracting ALL LinkedIn contacts (v2)...\n');

const UNIPILE_API_KEY = 'aQzsD1+H.EJ60hU0LkPAxRaCU6nlvk3ypn9Rn9BUwqo9LGY24zZU=';
const ACCOUNT_ID = '4jyMc-EDT1-hE5pOoT7EaQ';
const BASE_URL = 'https://api6.unipile.com:13670/api/v1';

const headers = {
  'X-API-Key': UNIPILE_API_KEY,
  'Content-Type': 'application/json'
};

async function getAllContacts() {
  try {
    const allContacts = new Map(); 
    
    console.log('1. Getting maximum chats possible...');
    
    // Try different limits to find the maximum
    const limits = [1000, 500, 200, 100];
    let allChats = [];
    
    for (const limit of limits) {
      try {
        console.log(`   Trying limit ${limit}...`);
        const chatsResponse = await fetch(`${BASE_URL}/chats?account_id=${ACCOUNT_ID}&limit=${limit}`, { headers });
        
        if (chatsResponse.ok) {
          const chatsData = await chatsResponse.json();
          allChats = chatsData.items || [];
          console.log(`   ✅ Successfully got ${allChats.length} chats with limit ${limit}`);
          break;
        } else {
          console.log(`   ❌ Limit ${limit} failed: ${chatsResponse.status}`);
        }
      } catch (err) {
        console.log(`   ❌ Limit ${limit} error: ${err.message}`);
      }
    }
    
    if (allChats.length === 0) {
      throw new Error('Could not fetch any chats');
    }
    
    console.log(`\n2. Processing ${allChats.length} chats for attendees...`);
    
    // Process ALL chats to get attendees
    let processedChats = 0;
    let errorChats = 0;
    
    for (let i = 0; i < allChats.length; i++) {
      const chat = allChats[i];
      
      if (i % 20 === 0 || i === allChats.length - 1) {
        console.log(`   Progress: ${i + 1}/${allChats.length} chats (${Math.round((i+1)/allChats.length*100)}%)`);
      }
      
      try {
        const attendeesResponse = await fetch(`${BASE_URL}/chats/${chat.id}/attendees`, { headers });
        
        if (attendeesResponse.ok) {
          const attendeesData = await attendeesResponse.json();
          const attendees = attendeesData.items || [];
          
          // Process each attendee
          for (const attendee of attendees) {
            if (!attendee.is_self && attendee.provider_id && attendee.name) {
              const existingContact = allContacts.get(attendee.provider_id);
              
              // Store contact with more complete info
              allContacts.set(attendee.provider_id, {
                provider_id: attendee.provider_id,
                name: attendee.name,
                profile_url: attendee.profile_url || (existingContact?.profile_url || ''),
                occupation: attendee.specifics?.occupation || (existingContact?.occupation || ''),
                network_distance: attendee.specifics?.network_distance || (existingContact?.network_distance || ''),
                picture_url: attendee.picture_url || (existingContact?.picture_url || ''),
                is_company: attendee.specifics?.is_company || false,
                member_urn: attendee.specifics?.member_urn || '',
                chat_ids: [...(existingContact?.chat_ids || []), chat.id],
                chat_names: [...(existingContact?.chat_names || []), chat.name || 'Unnamed Chat'],
                source: 'linkedin_chat',
                last_seen_chat: chat.name || 'Unnamed Chat'
              });
            }
          }
          processedChats++;
        } else {
          errorChats++;
        }
      } catch (err) {
        errorChats++;
        if (errorChats < 5) { // Only log first few errors
          console.log(`   Warning: Failed to process chat ${chat.id}: ${err.message}`);
        }
      }
      
      // Small delay to be nice to the API
      if (i % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    console.log(`\n3. Getting contacts from recent messages...`);
    
    // Get messages with higher limit
    try {
      const messagesResponse = await fetch(`${BASE_URL}/messages?account_id=${ACCOUNT_ID}&limit=1000`, { headers });
      
      if (messagesResponse.ok) {
        const messagesData = await messagesResponse.json();
        const messages = messagesData.items || [];
        
        console.log(`   Processing ${messages.length} messages...`);
        
        // Extract sender information from messages
        for (const message of messages) {
          if (message.from && message.from.provider_id && message.from.name && !message.from.is_self) {
            const senderId = message.from.provider_id;
            const existingContact = allContacts.get(senderId);
            
            // Merge with existing or create new
            allContacts.set(senderId, {
              provider_id: senderId,
              name: message.from.name,
              profile_url: message.from.profile_url || (existingContact?.profile_url || ''),
              occupation: message.from.specifics?.occupation || (existingContact?.occupation || ''),
              picture_url: message.from.picture_url || (existingContact?.picture_url || ''),
              network_distance: message.from.specifics?.network_distance || (existingContact?.network_distance || ''),
              is_company: message.from.specifics?.is_company || false,
              member_urn: message.from.specifics?.member_urn || '',
              chat_ids: existingContact?.chat_ids || [],
              chat_names: existingContact?.chat_names || [],
              source: existingContact ? 'linkedin_chat_and_message' : 'linkedin_message',
              last_message_text: message.text ? message.text.substring(0, 100) + '...' : '',
              last_message_date: message.created_at || message.date
            });
          }
        }
      }
    } catch (err) {
      console.log(`   Warning: Could not process messages: ${err.message}`);
    }
    
    // Convert Map to Array and display results
    const contactsArray = Array.from(allContacts.values());
    
    console.log('\n' + '='.repeat(70));
    console.log('📊 EXTRACTION COMPLETE!');
    console.log('='.repeat(70));
    console.log(`🎯 TOTAL UNIQUE LINKEDIN CONTACTS: ${contactsArray.length}`);
    console.log(`✅ Chats processed successfully: ${processedChats}/${allChats.length}`);
    console.log(`❌ Chats with errors: ${errorChats}`);
    
    // Detailed breakdown
    const fromChatsOnly = contactsArray.filter(c => c.source === 'linkedin_chat').length;
    const fromMessagesOnly = contactsArray.filter(c => c.source === 'linkedin_message').length;
    const fromBoth = contactsArray.filter(c => c.source === 'linkedin_chat_and_message').length;
    
    console.log(`\n📈 Source breakdown:`);
    console.log(`   - From chats only: ${fromChatsOnly}`);
    console.log(`   - From messages only: ${fromMessagesOnly}`);
    console.log(`   - From both chats & messages: ${fromBoth}`);
    
    // Quality metrics
    const withJobs = contactsArray.filter(c => c.occupation).length;
    const withProfiles = contactsArray.filter(c => c.profile_url).length;
    const companies = contactsArray.filter(c => c.is_company).length;
    const people = contactsArray.filter(c => !c.is_company).length;
    
    console.log(`\n📊 Contact quality:`);
    console.log(`   - People: ${people}, Companies: ${companies}`);
    console.log(`   - With job titles: ${withJobs} (${Math.round(withJobs/contactsArray.length*100)}%)`);
    console.log(`   - With LinkedIn URLs: ${withProfiles} (${Math.round(withProfiles/contactsArray.length*100)}%)`);
    
    // Show top contacts by network distance
    const distance1 = contactsArray.filter(c => c.network_distance === 'DISTANCE_1').length;
    const distance2 = contactsArray.filter(c => c.network_distance === 'DISTANCE_2').length;
    const distance3 = contactsArray.filter(c => c.network_distance === 'DISTANCE_3').length;
    
    console.log(`\n🌐 Network distance:`);
    console.log(`   - 1st degree (direct connections): ${distance1}`);
    console.log(`   - 2nd degree: ${distance2}`);
    console.log(`   - 3rd degree: ${distance3}`);
    
    // Show some sample contacts
    console.log(`\n📋 Sample contacts (first 10):`);
    contactsArray.slice(0, 10).forEach((contact, i) => {
      console.log(`${i + 1}. ${contact.name} ${contact.network_distance ? `(${contact.network_distance})` : ''}`);
      console.log(`   Job: ${contact.occupation || 'N/A'}`);
      console.log(`   LinkedIn: ${contact.profile_url ? 'Yes' : 'No'}`);
      console.log(`   Chats: ${contact.chat_ids.length}`);
      console.log('');
    });
    
    // Results analysis
    if (contactsArray.length > 1000) {
      console.log(`🎉 EXCELLENT! Found ${contactsArray.length} contacts - this is a huge improvement!`);
      console.log(`This represents a significant portion of your LinkedIn network.`);
    } else if (contactsArray.length > 200) {
      console.log(`✅ GOOD PROGRESS! Found ${contactsArray.length} contacts - much better than 1!`);
      console.log(`This is a solid start. Consider expanding to get even more contacts.`);
    } else if (contactsArray.length > 50) {
      console.log(`👍 IMPROVEMENT! Found ${contactsArray.length} contacts - better than before.`);
      console.log(`We can likely get more by exploring additional data sources.`);
    } else {
      console.log(`⚠️  Found ${contactsArray.length} contacts. This suggests most of your LinkedIn`);
      console.log(`network might not be accessible through chat/message history.`);
      console.log(`Consider connecting via LinkedIn API directly for full network access.`);
    }
    
    return contactsArray;
    
  } catch (error) {
    console.error('❌ Error extracting contacts:', error);
    return [];
  }
}

getAllContacts();