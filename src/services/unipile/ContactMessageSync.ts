/**
 * ContactMessageSync Service
 * Synchronizes both LinkedIn messages and contacts together
 * Ensures all 1st degree connections are stored in the contacts table
 */

import { supabase } from '@/integrations/supabase/client';
import { unipileProxy } from './UnipileProxy';

interface LinkedInContact {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  headline?: string;
  company?: string;
  title?: string;
  linkedinUrl?: string;
  profilePictureUrl?: string;
  connectionDegree?: string;
  email?: string;
  phone?: string;
  location?: string;
  isPremium?: boolean;
  isInfluencer?: boolean;
  metadata?: any;
}

interface SyncResult {
  contactsSynced: number;
  messagesSynced: number;
  errors: string[];
  duration: number;
  firstDegreeContacts: number;
}

class ContactMessageSyncService {
  private readonly UNIPILE_API_KEY = import.meta.env.VITE_UNIPILE_API_KEY || 'aQzsD1+H.EJ60hU0LkPAxRaCU6nlvk3ypn9Rn9BUwqo9LGY24zZU=';
  private readonly UNIPILE_BASE_URL = 'https://api6.unipile.com:13670/api/v1';
  
  /**
   * Main sync function that coordinates both contact and message syncing
   */
  async syncContactsAndMessages(
    accountId: string, 
    workspaceId: string,
    options: {
      syncMessages?: boolean;
      syncContacts?: boolean;
      contactLimit?: number;
      messageLimit?: number;
      onlyFirstDegree?: boolean;
    } = {}
  ): Promise<SyncResult> {
    const startTime = Date.now();
    const result: SyncResult = {
      contactsSynced: 0,
      messagesSynced: 0,
      errors: [],
      firstDegreeContacts: 0,
      duration: 0
    };

    try {
      // Default options
      const syncOptions = {
        syncMessages: true,
        syncContacts: true,
        contactLimit: 1000,
        messageLimit: 500,
        onlyFirstDegree: false,
        ...options
      };

      // Sync contacts first (especially 1st degree connections)
      if (syncOptions.syncContacts) {
        console.log('Starting contact sync...');
        const contactResult = await this.syncLinkedInContacts(
          accountId,
          workspaceId,
          syncOptions.contactLimit,
          syncOptions.onlyFirstDegree
        );
        result.contactsSynced = contactResult.synced;
        result.firstDegreeContacts = contactResult.firstDegree;
        result.errors.push(...contactResult.errors);
      }

      // Then sync messages
      if (syncOptions.syncMessages) {
        console.log('Starting message sync...');
        const messageResult = await this.syncLinkedInMessages(
          accountId,
          workspaceId,
          syncOptions.messageLimit
        );
        result.messagesSynced = messageResult.synced;
        result.errors.push(...messageResult.errors);
        
        // Extract contacts from messages and add them if not already present
        await this.extractContactsFromMessages(workspaceId);
      }

      result.duration = Date.now() - startTime;
      
      // Update sync metadata
      await this.updateSyncMetadata(workspaceId, result);
      
      return result;
    } catch (error) {
      console.error('Sync error:', error);
      result.errors.push(error.message);
      result.duration = Date.now() - startTime;
      return result;
    }
  }

  /**
   * Sync LinkedIn contacts by extracting from chat participants
   */
  private async syncLinkedInContacts(
    accountId: string,
    workspaceId: string,
    limit: number = 1000,
    onlyFirstDegree: boolean = false
  ): Promise<{ synced: number; firstDegree: number; errors: string[] }> {
    const result = { synced: 0, firstDegree: 0, errors: [] };
    
    try {
      console.log('Extracting contacts from chat participants...');
      
      // Get unique contact IDs from chats
      const contactIds = await this.extractContactIdsFromChats(accountId, Math.min(limit, 500));
      
      console.log(`Found ${contactIds.length} unique contacts from chats`);

      // Process each contact ID to get full profile
      for (const contactId of contactIds) {
        try {
          console.log(`Fetching profile for: ${contactId}`);
          
          const profileResponse = await fetch(`${this.UNIPILE_BASE_URL}/users/${encodeURIComponent(contactId)}?account_id=${accountId}`, {
            method: 'GET',
            headers: {
              'X-API-KEY': this.UNIPILE_API_KEY,
              'Accept': 'application/json'
            }
          });
          
          if (!profileResponse.ok) {
            console.log(`Failed to fetch profile for ${contactId}: ${profileResponse.status}`);
            continue;
          }
          
          const profile = await profileResponse.json();
          
          // Skip if not 1st degree and onlyFirstDegree is true
          const isFirstDegree = profile.network_distance === 'FIRST_DEGREE';
          if (onlyFirstDegree && !isFirstDegree) {
            continue;
          }
          
          // Parse profile data
          const contact = this.parseLinkedInProfile(profile);

          // Upsert contact to database
          const { error } = await supabase
            .from('contacts')
            .upsert({
              workspace_id: workspaceId,
              email: contact.email || `${contactId}@linkedin.com`,
              first_name: contact.firstName || '',
              last_name: contact.lastName || '',
              full_name: contact.name,
              title: contact.headline,
              company: '', // Not directly available in profile API
              linkedin_url: contact.linkedinUrl,
              profile_picture_url: contact.profilePictureUrl,
              department: this.extractDepartment(contact.headline),
              location: contact.location,
              connection_degree: contact.connectionDegree,
              engagement_score: this.calculateEngagementScore(contact),
              tags: this.generateTags(contact),
              metadata: {
                linkedin_id: profile.provider_id,
                public_identifier: profile.public_identifier,
                member_urn: profile.member_urn,
                is_premium: profile.is_premium,
                is_influencer: profile.is_influencer,
                is_creator: profile.is_creator,
                follower_count: profile.follower_count,
                connections_count: profile.connections_count,
                shared_connections_count: profile.shared_connections_count,
                synced_at: new Date().toISOString()
              },
              source: 'linkedin',
              status: 'active',
              last_synced_at: new Date().toISOString()
            }, {
              onConflict: 'workspace_id,email',
              ignoreDuplicates: false
            });

          if (error) {
            console.error(`Error upserting contact ${contact.name}:`, error);
            result.errors.push(`Contact ${contact.name}: ${error.message}`);
          } else {
            result.synced++;
            if (isFirstDegree) {
              result.firstDegree++;
            }
            console.log(`✅ Synced: ${contact.name} (${contact.connectionDegree})`);
          }
          
          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (err) {
          console.error(`Error processing contact ${contactId}:`, err);
          result.errors.push(`Contact ${contactId}: ${err.message}`);
        }
      }

      console.log(`Synced ${result.synced} contacts (${result.firstDegree} 1st degree)`);
    } catch (error) {
      console.error('Contact sync error:', error);
      result.errors.push(error.message);
    }

    return result;
  }

  /**
   * Sync LinkedIn messages/conversations
   */
  private async syncLinkedInMessages(
    accountId: string,
    workspaceId: string,
    limit: number = 500
  ): Promise<{ synced: number; errors: string[] }> {
    const result = { synced: 0, errors: [] };
    
    try {
      // Fetch conversations via proxy to avoid CORS
      console.log('Fetching chats via proxy...');
      const response = await unipileProxy.getChats(accountId, limit);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch messages: Status ${response.status}`);
      }

      const data = response.data;
      const conversations = data.items || data.chats || data.conversations || [];
      
      console.log(`Fetched ${conversations.length} conversations from LinkedIn`);

      // Process each conversation
      for (const conversation of conversations) {
        try {
          // Parse conversation participants
          const participant = this.extractParticipant(conversation);
          
          // Check if this is InMail
          const isInMail = this.detectInMail(conversation);
          
          // Ensure avatar URL is properly formatted
          let avatarUrl = participant.avatar;
          if (!avatarUrl || avatarUrl.includes('dicebear')) {
            // If no real avatar, generate a better one based on the name
            avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(participant.name)}&background=0D8ABC&color=fff&size=200&font-size=0.4`;
          }
          
          // Upsert conversation
          const { data: convData, error: convError } = await supabase
            .from('inbox_conversations')
            .upsert({
              workspace_id: workspaceId,
              platform: 'linkedin',
              platform_conversation_id: conversation.id || conversation.chat_id,
              participant_name: participant.name,
              participant_company: participant.company,
              participant_avatar_url: avatarUrl,
              participant_title: participant.title,
              status: 'active',
              last_message_at: conversation.last_message_at || new Date().toISOString(),
              metadata: {
                message_type: isInMail ? 'inmail' : 'message',
                is_inmail: isInMail,
                has_subject: !!conversation.subject,
                subject: conversation.subject,
                connection_degree: participant.connectionDegree,
                linkedin_profile_url: participant.linkedinUrl,
                linkedin_avatar_url: participant.avatar, // Store original LinkedIn avatar if available
                total_messages: conversation.messages?.length || 0,
                synced_at: new Date().toISOString()
              }
            }, {
              onConflict: 'workspace_id,platform_conversation_id',
              ignoreDuplicates: false
            })
            .select()
            .single();

          if (convError) {
            console.error(`Error upserting conversation:`, convError);
            result.errors.push(`Conversation: ${convError.message}`);
            continue;
          }

          // Sync messages for this conversation
          if (conversation.messages && conversation.messages.length > 0) {
            for (const message of conversation.messages) {
              const { error: msgError } = await supabase
                .from('inbox_messages')
                .upsert({
                  conversation_id: convData.id,
                  role: message.from === accountId ? 'user' : 'assistant',
                  content: message.text || message.content || '',
                  metadata: {
                    type: isInMail ? 'inmail' : 'message',
                    sender_name: message.sender_name || participant.name,
                    sender_id: message.from,
                    message_id: message.id,
                    sent_at: message.sent_at || message.created_at
                  },
                  created_at: message.sent_at || message.created_at || new Date().toISOString()
                }, {
                  onConflict: 'conversation_id,created_at',
                  ignoreDuplicates: true
                });

              if (msgError) {
                console.error(`Error upserting message:`, msgError);
                result.errors.push(`Message: ${msgError.message}`);
              }
            }
          }

          result.synced++;
        } catch (err) {
          console.error('Error processing conversation:', err);
          result.errors.push(err.message);
        }
      }

      console.log(`Synced ${result.synced} conversations`);
    } catch (error) {
      console.error('Message sync error:', error);
      result.errors.push(error.message);
    }

    return result;
  }

  /**
   * Extract contacts from message conversations and add them to contacts table
   */
  private async extractContactsFromMessages(workspaceId: string): Promise<void> {
    try {
      // Get all conversations with participants
      const { data: conversations, error } = await supabase
        .from('inbox_conversations')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('platform', 'linkedin');

      if (error) throw error;

      for (const conv of conversations || []) {
        // Check if contact already exists
        const email = `${conv.platform_conversation_id}@linkedin.local`;
        const { data: existingContact } = await supabase
          .from('contacts')
          .select('id')
          .eq('workspace_id', workspaceId)
          .eq('email', email)
          .single();

        if (!existingContact) {
          // Create contact from conversation participant
          const names = conv.participant_name?.split(' ') || [];
          await supabase
            .from('contacts')
            .insert({
              workspace_id: workspaceId,
              email: email,
              first_name: names[0] || '',
              last_name: names.slice(1).join(' ') || '',
              full_name: conv.participant_name,
              company: conv.participant_company,
              title: conv.participant_title,
              linkedin_url: conv.metadata?.linkedin_profile_url,
              profile_picture_url: conv.participant_avatar_url,
              connection_degree: conv.metadata?.connection_degree,
              engagement_score: 50, // Default score
              tags: conv.metadata?.message_type === 'inmail' ? ['inmail-sender'] : ['message-contact'],
              metadata: {
                extracted_from: 'conversation',
                conversation_id: conv.id,
                is_inmail_sender: conv.metadata?.message_type === 'inmail'
              },
              source: 'linkedin',
              status: 'active',
              last_synced_at: new Date().toISOString()
            });
        }
      }
    } catch (error) {
      console.error('Error extracting contacts from messages:', error);
    }
  }

  /**
   * Extract contact IDs from chat participants
   */
  private async extractContactIdsFromChats(accountId: string, limit: number): Promise<string[]> {
    const contactIds = new Set<string>();
    let cursor: string | null = null;
    let page = 1;
    const MAX_PAGES = 10;
    
    try {
      do {
        const url = cursor 
          ? `${this.UNIPILE_BASE_URL}/chats?account_id=${accountId}&limit=100&cursor=${cursor}`
          : `${this.UNIPILE_BASE_URL}/chats?account_id=${accountId}&limit=100`;
        
        const response = await fetch(url, {
          headers: {
            'X-API-KEY': this.UNIPILE_API_KEY,
            'Accept': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          const chats = data.items || [];
          
          for (const chat of chats) {
            if (chat.attendee_provider_id && !contactIds.has(chat.attendee_provider_id)) {
              contactIds.add(chat.attendee_provider_id);
            }
          }
          
          cursor = data.cursor || null;
          console.log(`Page ${page}: Processed ${chats.length} chats, found ${contactIds.size} contacts`);
          page++;
          
          if (page > MAX_PAGES || contactIds.size >= limit) break;
        } else {
          break;
        }
      } while (cursor && page <= MAX_PAGES);
      
    } catch (error) {
      console.error('Error extracting contact IDs:', error);
    }
    
    return Array.from(contactIds).slice(0, limit);
  }
  
  /**
   * Parse LinkedIn profile data from Unipile API
   */
  private parseLinkedInProfile(profile: any): LinkedInContact {
    const firstName = profile.first_name || '';
    const lastName = profile.last_name || '';
    const fullName = `${firstName} ${lastName}`.trim() || 'Unknown';
    
    return {
      id: profile.provider_id || '',
      name: fullName,
      firstName: firstName,
      lastName: lastName,
      headline: profile.headline || '',
      company: '', // Not available in profile endpoint
      title: profile.headline || '',
      linkedinUrl: `https://linkedin.com/in/${profile.public_identifier || profile.provider_id}`,
      profilePictureUrl: profile.profile_picture_url,
      connectionDegree: profile.network_distance === 'FIRST_DEGREE' ? '1st' : 
                       profile.network_distance === 'SECOND_DEGREE' ? '2nd' : '3rd',
      email: profile.contact_info?.emails?.[0] || '',
      phone: '', // Not available in profile endpoint
      location: profile.location || '',
      isPremium: profile.is_premium || false,
      isInfluencer: profile.is_influencer || false,
      metadata: {
        public_identifier: profile.public_identifier,
        member_urn: profile.member_urn,
        is_creator: profile.is_creator,
        follower_count: profile.follower_count,
        connections_count: profile.connections_count,
        shared_connections_count: profile.shared_connections_count
      }
    };
  }

  /**
   * Extract participant from conversation
   */
  private extractParticipant(conversation: any): any {
    const participants = conversation.participants || conversation.attendees || [];
    const otherParticipant = participants.find((p: any) => !p.is_self) || participants[0] || {};
    
    return {
      name: otherParticipant.name || 'Unknown',
      company: otherParticipant.company,
      title: otherParticipant.title || otherParticipant.headline,
      avatar: otherParticipant.profile_picture || otherParticipant.avatar_url,
      linkedinUrl: otherParticipant.linkedin_url,
      connectionDegree: otherParticipant.degree || otherParticipant.connection_degree
    };
  }

  /**
   * Detect if a conversation is InMail
   */
  private detectInMail(conversation: any): boolean {
    // Multiple ways to detect InMail
    if (conversation.is_inmail) return true;
    if (conversation.type === 'inmail') return true;
    if (conversation.subject && !conversation.is_connected) return true;
    if (conversation.metadata?.is_inmail) return true;
    if (conversation.message_type === 'INMAIL') return true;
    
    // Check first message for InMail indicators
    const firstMessage = conversation.messages?.[0];
    if (firstMessage?.is_inmail) return true;
    if (firstMessage?.type === 'inmail') return true;
    
    return false;
  }

  /**
   * Extract department from title
   */
  private extractDepartment(title?: string): string {
    if (!title) return 'General';
    
    const titleLower = title.toLowerCase();
    if (titleLower.includes('sales')) return 'Sales';
    if (titleLower.includes('marketing')) return 'Marketing';
    if (titleLower.includes('engineer') || titleLower.includes('developer')) return 'Engineering';
    if (titleLower.includes('product')) return 'Product';
    if (titleLower.includes('design')) return 'Design';
    if (titleLower.includes('hr') || titleLower.includes('human')) return 'HR';
    if (titleLower.includes('finance') || titleLower.includes('accounting')) return 'Finance';
    if (titleLower.includes('ceo') || titleLower.includes('cto') || titleLower.includes('cfo')) return 'Executive';
    
    return 'General';
  }

  /**
   * Calculate engagement score based on various factors
   */
  private calculateEngagementScore(contact: LinkedInContact): number {
    let score = 50; // Base score
    
    // Connection degree bonus
    if (contact.connectionDegree === '1st') score += 30;
    else if (contact.connectionDegree === '2nd') score += 15;
    
    // Premium/Influencer bonus
    if (contact.isPremium) score += 10;
    if (contact.isInfluencer) score += 15;
    
    // Profile completeness
    if (contact.email) score += 5;
    if (contact.phone) score += 5;
    if (contact.company) score += 5;
    if (contact.title) score += 5;
    
    // Network metrics from metadata
    if (contact.metadata?.follower_count > 1000) score += 5;
    if (contact.metadata?.follower_count > 10000) score += 10;
    if (contact.metadata?.connections_count > 500) score += 5;
    if (contact.metadata?.shared_connections_count > 5) score += 5;
    
    return Math.min(100, score);
  }

  /**
   * Generate tags based on contact information
   */
  private generateTags(contact: LinkedInContact): string[] {
    const tags: string[] = [];
    
    // Connection degree
    if (contact.connectionDegree === '1st') tags.push('1st-degree');
    else if (contact.connectionDegree === '2nd') tags.push('2nd-degree');
    else tags.push('3rd-degree');
    
    // Special status
    if (contact.isPremium) tags.push('premium');
    if (contact.isInfluencer) tags.push('influencer');
    
    // Department
    const dept = this.extractDepartment(contact.title);
    if (dept !== 'General') tags.push(dept.toLowerCase());
    
    return tags;
  }

  /**
   * Update sync metadata
   */
  private async updateSyncMetadata(workspaceId: string, result: SyncResult): Promise<void> {
    try {
      await supabase
        .from('sync_metadata')
        .upsert({
          workspace_id: workspaceId,
          sync_type: 'contacts_messages',
          last_sync_at: new Date().toISOString(),
          contacts_synced: result.contactsSynced,
          messages_synced: result.messagesSynced,
          first_degree_contacts: result.firstDegreeContacts,
          errors: result.errors,
          duration_ms: result.duration,
          status: result.errors.length > 0 ? 'partial' : 'success'
        }, {
          onConflict: 'workspace_id,sync_type'
        });
    } catch (error) {
      console.error('Error updating sync metadata:', error);
    }
  }
}

// Export singleton instance
export const contactMessageSync = new ContactMessageSyncService();
export default ContactMessageSyncService;