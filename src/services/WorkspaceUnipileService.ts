/**
 * Workspace Unipile Service
 * Centralized management of Unipile credentials shared across all features
 * Ensures consistent use of same account and dedicated IP
 */

import { supabase } from '@/integrations/supabase/client';

interface WorkspaceUnipileConfig {
  account_id: string;
  api_key: string;
  dedicated_ip?: string;
  dsn: string;
  linkedin_connected: boolean;
}

class WorkspaceUnipileService {
  private static instance: WorkspaceUnipileService;
  private config: WorkspaceUnipileConfig | null = null;
  private workspaceId: string | null = null;

  private constructor() {}

  static getInstance(): WorkspaceUnipileService {
    if (!WorkspaceUnipileService.instance) {
      WorkspaceUnipileService.instance = new WorkspaceUnipileService();
    }
    return WorkspaceUnipileService.instance;
  }

  /**
   * Initialize with workspace ID and load Unipile config
   */
  async initialize(workspaceId?: string): Promise<WorkspaceUnipileConfig> {
    // Use provided workspace ID or get from localStorage
    this.workspaceId = workspaceId || this.getCurrentWorkspaceId();
    
    if (!this.workspaceId) {
      throw new Error('No workspace ID available');
    }

    // Load config from database
    const { data, error } = await supabase
      .rpc('get_workspace_unipile_credentials', {
        p_workspace_id: this.workspaceId
      });

    if (error) throw error;
    if (!data || data.length === 0) {
      throw new Error('No Unipile credentials found for workspace');
    }

    this.config = data[0];
    
    // Store in localStorage for quick access
    localStorage.setItem('workspace_unipile_config', JSON.stringify(this.config));
    
    return this.config;
  }

  /**
   * Get current workspace ID from various sources
   */
  private getCurrentWorkspaceId(): string {
    // Check auth profile
    const authProfile = JSON.parse(localStorage.getItem('user_auth_profile') || '{}');
    if (authProfile.workspace_id) return authProfile.workspace_id;
    
    // Check direct storage
    const workspaceId = localStorage.getItem('workspace_id');
    if (workspaceId) return workspaceId;
    
    // Dev mode fallback
    return 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
  }

  /**
   * Get Unipile configuration for current workspace
   */
  async getConfig(): Promise<WorkspaceUnipileConfig> {
    if (this.config) return this.config;
    
    // Try to load from localStorage first
    const cached = localStorage.getItem('workspace_unipile_config');
    if (cached) {
      this.config = JSON.parse(cached);
      return this.config!;
    }
    
    // Load from database
    return this.initialize();
  }

  /**
   * Get Unipile API headers with proper authentication
   */
  async getApiHeaders(): Promise<Record<string, string>> {
    const config = await this.getConfig();
    
    return {
      'X-API-Key': config.api_key, // Unipile uses X-API-Key, not Bearer token
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Workspace-ID': this.workspaceId || '',
      'X-Account-ID': config.account_id
    };
  }

  /**
   * Get Unipile API base URL with dedicated IP if configured
   */
  async getApiUrl(): Promise<string> {
    const config = await this.getConfig();
    
    // Use dedicated IP if available, otherwise use DSN
    const host = config.dedicated_ip || config.dsn || 'api6.unipile.com:13670';
    
    // Ensure proper protocol and port
    if (!host.startsWith('http')) {
      return `https://${host}/api/v1`;
    }
    
    return `${host}/api/v1`;
  }

  /**
   * Make authenticated Unipile API request
   */
  async request(
    path: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const [headers, baseUrl] = await Promise.all([
      this.getApiHeaders(),
      this.getApiUrl()
    ]);

    const url = `${baseUrl}${path}`;
    
    return fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers
      }
    });
  }

  /**
   * Connect LinkedIn account (one-time setup during onboarding)
   */
  async connectLinkedIn(): Promise<{ auth_url?: string; account_id?: string }> {
    const response = await this.request('/accounts/connect', {
      method: 'POST',
      body: JSON.stringify({
        provider: 'LINKEDIN',
        scopes: ['profile', 'contacts', 'messages'],
        redirect_uri: `${window.location.origin}/onboarding/callback`
      })
    });

    if (!response.ok) {
      throw new Error('Failed to initiate LinkedIn connection');
    }

    const data = await response.json();
    
    // If successful, update workspace
    if (data.account_id) {
      await this.updateLinkedInConnection(data.account_id);
    }
    
    return data;
  }

  /**
   * Update workspace with LinkedIn connection
   */
  private async updateLinkedInConnection(accountId: string) {
    if (!this.workspaceId) return;

    const { error } = await supabase
      .from('workspaces')
      .update({
        unipile_account_id: accountId,
        integrations: {
          linkedin: {
            connected: true,
            account_id: accountId,
            connected_at: new Date().toISOString()
          }
        }
      })
      .eq('id', this.workspaceId);

    if (error) {
      console.error('Error updating LinkedIn connection:', error);
    } else {
      // Update local config
      if (this.config) {
        this.config.account_id = accountId;
        this.config.linkedin_connected = true;
      }
    }
  }

  /**
   * Sync LinkedIn contacts using shared credentials - Enhanced to get maximum contacts
   */
  async syncContacts(limit: number = 200): Promise<any> {
    const config = await this.getConfig();
    
    if (!config.linkedin_connected) {
      throw new Error('LinkedIn not connected. Please complete onboarding.');
    }

    console.log('🔄 Starting enhanced LinkedIn contact sync...');
    
    const allContacts = new Map(); // Use Map to deduplicate by provider_id
    
    // Step 1: Get maximum possible chats
    let chatsResponse;
    const tryLimits = [1000, 500, 200, 100];
    let allChats = [];
    
    for (const tryLimit of tryLimits) {
      try {
        chatsResponse = await this.request(`/chats?account_id=${config.account_id}&limit=${tryLimit}`);
        if (chatsResponse.ok) {
          const chatsData = await chatsResponse.json();
          allChats = chatsData.items || [];
          console.log(`✅ Successfully fetched ${allChats.length} chats`);
          break;
        }
      } catch (err) {
        continue; // Try next limit
      }
    }
    
    if (allChats.length === 0) {
      throw new Error('Failed to fetch any LinkedIn chats');
    }

    console.log(`📋 Processing ${allChats.length} chats for attendees...`);
    
    // Step 2: Process ALL chats to get attendees
    let processedChats = 0;
    
    for (let i = 0; i < allChats.length; i++) {
      const chat = allChats[i];
      
      if (i % 20 === 0) {
        console.log(`   Progress: ${i + 1}/${allChats.length} chats (${Math.round((i+1)/allChats.length*100)}%)`);
      }
      
      try {
        const attendeesResponse = await this.request(`/chats/${chat.id}/attendees`);
        
        if (attendeesResponse.ok) {
          const attendeesData = await attendeesResponse.json();
          const attendees = attendeesData.items || [];
          
          for (const attendee of attendees) {
            // Skip self and invalid contacts
            if (attendee.is_self || !attendee.provider_id || !attendee.name) continue;
            
            const existingContact = allContacts.get(attendee.provider_id);
            
            // Store contact with comprehensive info
            allContacts.set(attendee.provider_id, {
              provider_id: attendee.provider_id,
              name: attendee.name,
              profile_url: attendee.profile_url || (existingContact?.profile_url || ''),
              occupation: attendee.specifics?.occupation || (existingContact?.occupation || ''),
              network_distance: attendee.specifics?.network_distance || (existingContact?.network_distance || ''),
              picture_url: attendee.picture_url || (existingContact?.picture_url || ''),
              member_urn: attendee.specifics?.member_urn || (existingContact?.member_urn || ''),
              is_company: attendee.specifics?.is_company || false,
              chat_ids: [...(existingContact?.chat_ids || []), chat.id],
              chat_names: [...(existingContact?.chat_names || []), chat.name || 'Unnamed Chat'],
              source: 'linkedin_chat'
            });
          }
          processedChats++;
        }
      } catch (err) {
        console.error(`Error processing chat ${chat.id}:`, err.message);
      }
      
      // Small delay to be nice to the API
      if (i % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

    // Step 3: Also get contacts from messages
    try {
      const messagesResponse = await this.request(`/messages?account_id=${config.account_id}&limit=1000`);
      
      if (messagesResponse.ok) {
        const messagesData = await messagesResponse.json();
        const messages = messagesData.items || [];
        
        console.log(`📨 Processing ${messages.length} messages for additional contacts...`);
        
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
              member_urn: message.from.specifics?.member_urn || (existingContact?.member_urn || ''),
              is_company: message.from.specifics?.is_company || false,
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
      console.log('Warning: Could not fetch messages for additional contacts:', err.message);
    }
    
    // Step 4: Store all contacts in database
    const contactsArray = Array.from(allContacts.values());
    let storedCount = 0;
    
    console.log(`💾 Storing ${contactsArray.length} unique contacts in database...`);
    
    for (const contact of contactsArray) {
      try {
        const nameParts = contact.name.split(' ');
        const first_name = nameParts[0] || '';
        const last_name = nameParts.slice(1).join(' ') || '';
        
        await supabase.from('contacts').upsert({
          workspace_id: this.workspaceId,
          email: `${contact.provider_id}@linkedin.com`,
          first_name,
          last_name,
          title: contact.occupation || '',
          linkedin_url: contact.profile_url || '',
          phone: '', // LinkedIn doesn't provide phone numbers
          department: contact.is_company ? 'Company' : '',
          engagement_score: contact.network_distance === 'DISTANCE_1' ? 80 : 
                           contact.network_distance === 'DISTANCE_2' ? 60 : 40,
          tags: [
            contact.network_distance || 'unknown_distance',
            contact.source,
            ...(contact.is_company ? ['company'] : ['person'])
          ],
          metadata: {
            provider_id: contact.provider_id,
            member_urn: contact.member_urn,
            network_distance: contact.network_distance,
            picture_url: contact.picture_url,
            chat_ids: contact.chat_ids,
            chat_names: contact.chat_names,
            source: contact.source,
            unipile_account_id: config.account_id,
            is_company: contact.is_company,
            last_message_text: contact.last_message_text,
            last_message_date: contact.last_message_date,
            synced_at: new Date().toISOString()
          }
        }, { 
          onConflict: 'workspace_id,email' 
        });
        
        storedCount++;
      } catch (err) {
        console.error('Error storing contact:', contact.name, err);
      }
    }
    
    console.log(`✅ Successfully stored ${storedCount} LinkedIn contacts`);
    
    // Return comprehensive stats
    return { 
      contactsSynced: storedCount,
      totalFound: contactsArray.length,
      chatsProcessed: processedChats,
      fromChats: contactsArray.filter(c => c.source === 'linkedin_chat').length,
      fromMessages: contactsArray.filter(c => c.source === 'linkedin_message').length,
      fromBoth: contactsArray.filter(c => c.source === 'linkedin_chat_and_message').length,
      firstDegree: contactsArray.filter(c => c.network_distance === 'DISTANCE_1').length,
      secondDegree: contactsArray.filter(c => c.network_distance === 'DISTANCE_2').length,
      thirdDegree: contactsArray.filter(c => c.network_distance === 'DISTANCE_3').length,
      withJobTitles: contactsArray.filter(c => c.occupation).length,
      withProfiles: contactsArray.filter(c => c.profile_url).length
    };
  }

  /**
   * Send LinkedIn message using shared credentials
   */
  async sendMessage(
    recipientId: string,
    message: string
  ): Promise<any> {
    const config = await this.getConfig();
    
    if (!config.linkedin_connected) {
      throw new Error('LinkedIn not connected. Please complete onboarding.');
    }

    const response = await this.request(`/users/${config.account_id}/messages`, {
      method: 'POST',
      body: JSON.stringify({
        recipient_id: recipientId,
        body: message
      })
    });

    if (!response.ok) {
      throw new Error('Failed to send message');
    }

    return response.json();
  }

  /**
   * Check if LinkedIn is connected for workspace
   */
  async isLinkedInConnected(): Promise<boolean> {
    try {
      const config = await this.getConfig();
      return config.linkedin_connected;
    } catch {
      return false;
    }
  }

  /**
   * Clear cached configuration
   */
  clearCache() {
    this.config = null;
    localStorage.removeItem('workspace_unipile_config');
  }
}

// Export singleton instance
export const workspaceUnipile = WorkspaceUnipileService.getInstance();