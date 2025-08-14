import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const UNIPILE_API_KEY = Deno.env.get('UNIPILE_API_KEY') || 'aQzsD1+H.EJ60hU0LkPAxRaCU6nlvk3ypn9Rn9BUwqo9LGY24zZU='
const UNIPILE_BASE_URL = Deno.env.get('UNIPILE_BASE_URL') || 'https://api6.unipile.com:13670/api/v1'

interface SyncRequest {
  workspace_id: string
  account_id: string
  sync_type?: 'contacts' | 'messages' | 'both' | 'emails' | 'calendar' | 'all'
  sync_emails?: boolean
  sync_calendar?: boolean
  limit?: number
}

serve(async (req) => {
  try {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    }

    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders })
    }

    // Skip auth verification for this function - using service role internally
    // This allows the function to be called without JWT authentication

    console.log('🚀 LinkedIn Background Sync function called')
    console.log('📊 Headers:', Object.fromEntries(req.headers.entries()))

    // Initialize Supabase Admin Client with service role (bypasses auth)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    console.log('🔧 Using Supabase URL:', supabaseUrl)
    console.log('🔧 Service key configured:', !!supabaseServiceKey)
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { workspace_id, account_id, sync_type = 'both', sync_emails = false, sync_calendar = false, limit = 500 } = await req.json()

    console.log(`Starting background sync for workspace ${workspace_id}`)

    // Check last sync time to prevent too frequent syncs
    const { data: lastSync } = await supabase
      .from('sync_metadata')
      .select('last_sync_at')
      .eq('workspace_id', workspace_id)
      .eq('sync_type', 'background_linkedin')
      .single()

    if (lastSync?.last_sync_at) {
      const lastSyncTime = new Date(lastSync.last_sync_at)
      const minutesSinceLastSync = (Date.now() - lastSyncTime.getTime()) / (1000 * 60)
      
      if (minutesSinceLastSync < 15) {
        return new Response(
          JSON.stringify({ 
            message: 'Sync skipped - too soon since last sync',
            minutesSinceLastSync,
            nextSyncInMinutes: 15 - minutesSinceLastSync
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    const syncResult = {
      contactsSynced: 0,
      messagesSynced: 0,
      errors: [] as string[],
      startTime: Date.now()
    }

    // Sync Contacts
    if (sync_type === 'contacts' || sync_type === 'both') {
      try {
        const response = await fetch(
          `${UNIPILE_BASE_URL}/chats?account_id=${account_id}&limit=${limit}`,
          {
            headers: {
              'X-API-KEY': UNIPILE_API_KEY,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          }
        )

        if (response.ok) {
          const data = await response.json()
          const chats = data.items || []
          
          console.log(`Fetched ${chats.length} chats for contact extraction`)

          // Extract unique contacts from chat participants
          const uniqueContacts = new Set()
          const contactsToSync = []

          for (const chat of chats) {
            if (chat.attendee_provider_id && !uniqueContacts.has(chat.attendee_provider_id)) {
              uniqueContacts.add(chat.attendee_provider_id)
              contactsToSync.push({
                id: chat.attendee_provider_id,
                name: chat.name || 'LinkedIn Contact',
                linkedin_url: `https://linkedin.com/in/${chat.attendee_provider_id}`
              })
            }
          }

          console.log(`Found ${contactsToSync.length} unique contacts from chats`)

          for (const connection of contactsToSync) {
            try {
              // Parse and prepare contact data
              const names = (connection.name || '').split(' ')
              const firstName = names[0] || connection.first_name || ''
              const lastName = names.slice(1).join(' ') || connection.last_name || ''
              
              // Generate better avatar URL
              let avatarUrl = connection.profile_picture || connection.avatar_url
              if (!avatarUrl || avatarUrl.includes('dicebear')) {
                avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(connection.name || 'U')}&background=0D8ABC&color=fff&size=200`
              }

              // Upsert contact
              const { error } = await supabase
                .from('contacts')
                .upsert({
                  workspace_id,
                  email: connection.email || `${connection.id || Date.now()}@linkedin.local`,
                  first_name: firstName,
                  last_name: lastName,
                  full_name: connection.name,
                  title: connection.title || connection.headline,
                  company: connection.company || connection.current_company,
                  linkedin_url: connection.linkedin_url || connection.profile_url,
                  profile_picture_url: avatarUrl,
                  department: extractDepartment(connection.title),
                  phone: connection.phone,
                  location: connection.location,
                  connection_degree: connection.degree || connection.connection_degree || '2nd',
                  engagement_score: calculateEngagementScore(connection),
                  tags: generateTags(connection),
                  metadata: {
                    linkedin_id: connection.id,
                    is_premium: connection.is_premium || false,
                    is_influencer: connection.is_influencer || false,
                    synced_at: new Date().toISOString(),
                    sync_source: 'background_edge_function'
                  },
                  source: 'linkedin',
                  status: 'active',
                  last_synced_at: new Date().toISOString()
                }, {
                  onConflict: 'workspace_id,email',
                  ignoreDuplicates: false
                })

              if (!error) {
                syncResult.contactsSynced++
              } else {
                console.error(`Error syncing contact: ${error.message}`)
                syncResult.errors.push(`Contact ${connection.name}: ${error.message}`)
              }
            } catch (err: any) {
              console.error('Error processing connection:', err)
              syncResult.errors.push(err.message)
            }
          }
        }
      } catch (error: any) {
        console.error('Error syncing contacts:', error)
        syncResult.errors.push(`Contacts sync: ${error.message}`)
      }
    }

    // Sync Messages/Conversations
    if (sync_type === 'messages' || sync_type === 'both') {
      try {
        const response = await fetch(
          `${UNIPILE_BASE_URL}/chats?account_id=${account_id}&limit=${limit}`,
          {
            headers: {
              'X-API-KEY': UNIPILE_API_KEY,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          }
        )

        if (response.ok) {
          const data = await response.json()
          const conversations = data.items || []
          
          console.log(`Fetched ${conversations.length} conversations`)

          for (const conversation of conversations) {
            try {
              // Get participant info from the chat attendee data
              const participantId = conversation.attendee_provider_id
              const participantName = 'LinkedIn Contact' // Will be filled from messages
              
              // Generate avatar URL
              let avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(participantName)}&background=0D8ABC&color=fff&size=200`

              // Detect if InMail based on chat type
              const isInMail = conversation.type === 'inmail' || conversation.folder?.includes('INMAIL')

              // Upsert conversation
              const { data: convData, error: convError } = await supabase
                .from('inbox_conversations')
                .upsert({
                  workspace_id,
                  platform: 'linkedin',
                  platform_conversation_id: conversation.id,
                  participant_name: participantName,
                  participant_company: 'Unknown Company',
                  participant_avatar_url: avatarUrl,
                  status: 'active',
                  last_message_at: conversation.timestamp || new Date().toISOString(),
                  metadata: {
                    chat_type: isInMail ? 'inmail' : 'message',
                    is_inmail: isInMail,
                    attendee_provider_id: participantId,
                    chat_folder: conversation.folder,
                    unread_count: conversation.unread_count || 0,
                    synced_at: new Date().toISOString(),
                    sync_source: 'background_edge_function'
                  }
                }, {
                  onConflict: 'workspace_id,platform_conversation_id',
                  ignoreDuplicates: false
                })
                .select()
                .single()

              if (!convError && convData) {
                // Now fetch messages for this specific chat
                console.log(`Fetching messages for chat: ${conversation.id}`)
                const messagesResponse = await fetch(
                  `${UNIPILE_BASE_URL}/chats/${conversation.id}/messages?limit=10`,
                  {
                    headers: {
                      'X-API-KEY': UNIPILE_API_KEY,
                      'Accept': 'application/json'
                    }
                  }
                )

                if (messagesResponse.ok) {
                  const messagesData = await messagesResponse.json()
                  const messages = messagesData.items || []
                  
                  console.log(`Found ${messages.length} messages for chat ${conversation.id}`)
                  
                  // Update participant name from first message
                  let realParticipantName = participantName
                  let realParticipantCompany = 'Unknown Company'
                  
                  if (messages.length > 0) {
                    // Find a message from the other person (not sender)
                    const otherMessage = messages.find(m => !m.is_sender && m.sender_id !== account_id)
                    if (otherMessage) {
                      // Try to extract name from message metadata or content
                      realParticipantName = 'LinkedIn Contact' // We'll improve this later
                    }
                  }

                  // Update conversation with real participant info
                  await supabase
                    .from('inbox_conversations')
                    .update({
                      participant_name: realParticipantName,
                      participant_company: realParticipantCompany,
                      participant_avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(realParticipantName)}&background=0D8ABC&color=fff&size=200`
                    })
                    .eq('id', convData.id)

                  // Sync individual messages
                  for (const message of messages) {
                    try {
                      await supabase
                        .from('inbox_messages')
                        .upsert({
                          conversation_id: convData.id,
                          role: message.is_sender ? 'user' : 'assistant',
                          content: message.text || message.content || 'No content',
                          metadata: {
                            type: isInMail ? 'inmail' : 'message',
                            sender_id: message.sender_id,
                            message_id: message.id,
                            is_sender: message.is_sender,
                            timestamp: message.timestamp,
                            provider_id: message.provider_id
                          },
                          created_at: message.timestamp || new Date().toISOString()
                        }, {
                          onConflict: 'conversation_id,created_at',
                          ignoreDuplicates: true
                        })
                    } catch (msgErr: any) {
                      console.error('Error saving message:', msgErr)
                    }
                  }
                  
                  syncResult.messagesSynced++
                } else {
                  console.error(`Failed to fetch messages for chat ${conversation.id}: ${messagesResponse.status}`)
                }
              } else if (convError) {
                console.error(`Error syncing conversation: ${convError.message}`)
                syncResult.errors.push(`Conversation: ${convError.message}`)
              }
            } catch (err: any) {
              console.error('Error processing conversation:', err)
              syncResult.errors.push(err.message)
            }
          }
        }
      } catch (error: any) {
        console.error('Error syncing messages:', error)
        syncResult.errors.push(`Messages sync: ${error.message}`)
      }
    }

    // Sync Emails if requested
    let emailsSynced = 0
    let eventsSynced = 0
    
    if (sync_emails || sync_type === 'emails' || sync_type === 'all') {
      try {
        const emailParams = new URLSearchParams({
          limit: limit.toString()
        })
        
        const emailResponse = await fetch(
          `${UNIPILE_BASE_URL}/users/${account_id}/messages?${emailParams}`,
          {
            headers: {
              'X-API-KEY': UNIPILE_API_KEY,
              'Accept': 'application/json'
            }
          }
        )
        
        if (emailResponse.ok) {
          const emailData = await emailResponse.json()
          const emails = emailData.items || []
          
          // Get or create email account
          const { data: emailAccount } = await supabase
            .from('email_accounts')
            .select('id')
            .eq('workspace_id', workspace_id)
            .eq('unipile_account_id', account_id)
            .single()
          
          if (emailAccount) {
            for (const email of emails) {
              try {
                await supabase.from('emails').upsert({
                  workspace_id,
                  email_account_id: emailAccount.id,
                  unipile_message_id: email.id,
                  subject: email.subject,
                  from_email: email.from?.email,
                  to_emails: email.to?.map((t: any) => t.email) || [],
                  date_received: email.date,
                  body_text: email.body?.text,
                  body_html: email.body?.html
                }, { onConflict: 'unipile_message_id' })
                
                emailsSynced++
              } catch (err) {
                console.error('Error storing email:', err)
              }
            }
          }
        }
      } catch (error: any) {
        console.error('Error syncing emails:', error)
        syncResult.errors.push(`Email sync: ${error.message}`)
      }
    }
    
    // Sync Calendar if requested
    if (sync_calendar || sync_type === 'calendar' || sync_type === 'all') {
      try {
        const calendarParams = new URLSearchParams({
          limit: limit.toString()
        })
        
        const calResponse = await fetch(
          `${UNIPILE_BASE_URL}/users/${account_id}/events?${calendarParams}`,
          {
            headers: {
              'X-API-KEY': UNIPILE_API_KEY,
              'Accept': 'application/json'
            }
          }
        )
        
        if (calResponse.ok) {
          const calData = await calResponse.json()
          const events = calData.items || []
          
          // Get email account (calendar linked to email)
          const { data: emailAccount } = await supabase
            .from('email_accounts')
            .select('id')
            .eq('workspace_id', workspace_id)
            .eq('unipile_account_id', account_id)
            .single()
          
          if (emailAccount) {
            for (const event of events) {
              try {
                await supabase.from('calendar_events').upsert({
                  workspace_id,
                  email_account_id: emailAccount.id,
                  unipile_event_id: event.id,
                  title: event.title || 'Untitled',
                  start_time: event.start?.date_time,
                  end_time: event.end?.date_time,
                  location: event.location,
                  organizer_email: event.organizer?.email
                }, { onConflict: 'unipile_event_id' })
                
                eventsSynced++
              } catch (err) {
                console.error('Error storing event:', err)
              }
            }
          }
        }
      } catch (error: any) {
        console.error('Error syncing calendar:', error)
        syncResult.errors.push(`Calendar sync: ${error.message}`)
      }
    }

    // Update sync metadata
    const duration = Date.now() - syncResult.startTime
    await supabase
      .from('sync_metadata')
      .upsert({
        workspace_id,
        sync_type: 'background_sync',
        last_sync_at: new Date().toISOString(),
        contacts_synced: syncResult.contactsSynced,
        messages_synced: syncResult.messagesSynced,
        errors: syncResult.errors,
        duration_ms: duration,
        status: syncResult.errors.length > 0 ? 'partial' : 'success',
        metadata: {
          triggered_by: 'edge_function',
          account_id,
          sync_type_requested: sync_type,
          emails_synced: emailsSynced,
          events_synced: eventsSynced,
          limit
        }
      }, {
        onConflict: 'workspace_id,sync_type'
      })

    console.log(`Background sync completed: ${syncResult.contactsSynced} contacts, ${syncResult.messagesSynced} messages, ${emailsSynced} emails, ${eventsSynced} events`)

    return new Response(
      JSON.stringify({
        success: true,
        contactsSynced: syncResult.contactsSynced,
        messagesSynced: syncResult.messagesSynced,
        emailsSynced,
        eventsSynced,
        errors: syncResult.errors,
        duration: duration
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
})

// Helper functions
function extractDepartment(title?: string): string {
  if (!title) return 'General'
  
  const titleLower = title.toLowerCase()
  if (titleLower.includes('sales')) return 'Sales'
  if (titleLower.includes('marketing')) return 'Marketing'
  if (titleLower.includes('engineer') || titleLower.includes('developer')) return 'Engineering'
  if (titleLower.includes('product')) return 'Product'
  if (titleLower.includes('design')) return 'Design'
  if (titleLower.includes('hr') || titleLower.includes('human')) return 'HR'
  if (titleLower.includes('finance') || titleLower.includes('accounting')) return 'Finance'
  if (titleLower.includes('ceo') || titleLower.includes('cto') || titleLower.includes('cfo')) return 'Executive'
  
  return 'General'
}

function calculateEngagementScore(connection: any): number {
  let score = 50 // Base score
  
  // Connection degree bonus
  const degree = connection.degree || connection.connection_degree
  if (degree === '1st' || degree === '1') score += 30
  else if (degree === '2nd' || degree === '2') score += 15
  
  // Premium/Influencer bonus
  if (connection.is_premium) score += 10
  if (connection.is_influencer) score += 15
  
  // Profile completeness
  if (connection.email) score += 5
  if (connection.phone) score += 5
  if (connection.company || connection.current_company) score += 5
  if (connection.title || connection.headline) score += 5
  
  return Math.min(100, score)
}

function generateTags(connection: any): string[] {
  const tags: string[] = []
  
  // Connection degree
  const degree = connection.degree || connection.connection_degree
  if (degree === '1st' || degree === '1') tags.push('1st-degree')
  else if (degree === '2nd' || degree === '2') tags.push('2nd-degree')
  else tags.push('3rd-degree')
  
  // Special status
  if (connection.is_premium) tags.push('premium')
  if (connection.is_influencer) tags.push('influencer')
  
  // Department
  const dept = extractDepartment(connection.title || connection.headline)
  if (dept !== 'General') tags.push(dept.toLowerCase())
  
  return tags
}