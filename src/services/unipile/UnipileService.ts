/**
 * Unipile Integration Service
 * Handles LinkedIn OAuth and account management via Unipile API
 */

import { supabase } from '@/integrations/supabase/client';

export interface UnipileConfig {
  apiKey: string;
  baseUrl: string;
  accountId?: string;
}

export interface LinkedInAccountData {
  id: string;
  provider: 'LINKEDIN';
  email: string;
  name: string;
  profileUrl: string;
  profilePicture?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: string;
  status: 'active' | 'expired' | 'error';
  unipileAccountId: string;
  metadata?: Record<string, any>;
}

export interface UnipileOAuthResponse {
  auth_url: string;
  account_id: string;
  expires_in: number;
}

class UnipileService {
  private config: UnipileConfig;
  private baseUrl: string;
  
  constructor() {
    const dsn = import.meta.env.VITE_UNIPILE_DSN || 'api6.unipile.com:13670';
    this.baseUrl = `https://${dsn}/api/v1`;
    
    this.config = {
      apiKey: import.meta.env.VITE_UNIPILE_API_KEY || '',
      baseUrl: this.baseUrl,
      accountId: import.meta.env.VITE_UNIPILE_ACCOUNT_ID
    };
  }

  /**
   * Initialize OAuth flow for LinkedIn connection
   */
  async initiateLinkedInOAuth(redirectUri?: string, proxyMetadata?: any): Promise<UnipileOAuthResponse> {
    try {
      // Check if we're in demo mode
      if (!this.config.apiKey || this.config.apiKey === 'demo_key_not_configured') {
        console.log('Unipile not configured - returning demo OAuth URL');
        // Return a demo OAuth response
        return {
          auth_url: 'https://www.linkedin.com/oauth/v2/authorization?demo=true',
          account_id: `demo-${Date.now()}`,
          expires_in: 3600
        };
      }

      const response = await fetch(`${this.baseUrl}/accounts/connect`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
          'X-API-KEY': this.config.apiKey
        },
        body: JSON.stringify({
          provider: 'LINKEDIN',
          redirect_uri: redirectUri || `${window.location.origin}/auth/linkedin/callback`,
          scopes: [
            'r_liteprofile',
            'r_emailaddress', 
            'w_member_social',
            'r_basicprofile',
            'r_organization_social'
          ],
          options: {
            auto_accept: false,
            sync_messages: true,
            sync_contacts: true,
            sync_calendar: false
          },
          metadata: proxyMetadata // Pass proxy information for backend processing
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to initiate LinkedIn OAuth');
      }

      const data = await response.json();
      
      // Store account_id temporarily for callback handling
      sessionStorage.setItem('unipile_account_id', data.account_id);
      
      return {
        auth_url: data.auth_url,
        account_id: data.account_id,
        expires_in: data.expires_in || 3600
      };
    } catch (error) {
      console.error('Error initiating LinkedIn OAuth:', error);
      // Return demo mode if API fails
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        console.log('API unreachable - returning demo OAuth URL');
        return {
          auth_url: 'https://www.linkedin.com/oauth/v2/authorization?demo=true',
          account_id: `demo-${Date.now()}`,
          expires_in: 3600
        };
      }
      throw error;
    }
  }

  /**
   * Complete OAuth flow and get account details
   */
  async completeOAuthFlow(accountId: string, code?: string): Promise<LinkedInAccountData> {
    try {
      // Get account details from Unipile
      const response = await fetch(`${this.baseUrl}/accounts/${accountId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'X-API-KEY': this.config.apiKey
        }
      });

      if (!response.ok) {
        throw new Error('Failed to get account details from Unipile');
      }

      const accountData = await response.json();
      
      // Transform Unipile response to our format
      const linkedInAccount: LinkedInAccountData = {
        id: crypto.randomUUID(),
        provider: 'LINKEDIN',
        email: accountData.email || '',
        name: accountData.name || '',
        profileUrl: accountData.profile?.url || '',
        profilePicture: accountData.profile?.picture || '',
        status: accountData.status === 'CONNECTED' ? 'active' : 'expired',
        unipileAccountId: accountId,
        metadata: {
          connections_count: accountData.profile?.connections_count,
          headline: accountData.profile?.headline,
          location: accountData.profile?.location
        }
      };

      // Save to Supabase
      await this.saveAccountToSupabase(linkedInAccount);
      
      return linkedInAccount;
    } catch (error) {
      console.error('Error completing OAuth flow:', error);
      throw error;
    }
  }

  /**
   * Save LinkedIn account to Supabase
   */
  private async saveAccountToSupabase(account: LinkedInAccountData): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get the stored proxy location
      const proxyLocation = sessionStorage.getItem('linkedin_proxy_location') || 'US';

      const { error } = await supabase
        .from('team_accounts')
        .upsert({
          id: account.id,
          user_id: user.id,
          provider: account.provider,
          email: account.email,
          name: account.name,
          profile_url: account.profileUrl,
          profile_picture: account.profilePicture,
          status: account.status,
          unipile_account_id: account.unipileAccountId,
          metadata: {
            ...account.metadata,
            proxy_location: proxyLocation,
            proxy_provider: 'brightdata'
          },
          connected_at: new Date().toISOString(),
          last_sync: new Date().toISOString()
        });

      if (error) throw error;

      // Trigger n8n workflow for initial sync
      await this.triggerLinkedInSync(account.id);
    } catch (error) {
      console.error('Error saving account to Supabase:', error);
      throw error;
    }
  }

  /**
   * Get all connected LinkedIn accounts
   */
  async getConnectedAccounts(): Promise<LinkedInAccountData[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('team_accounts')
        .select('*')
        .eq('user_id', user.id)
        .eq('provider', 'LINKEDIN')
        .order('connected_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(acc => ({
        id: acc.id,
        provider: 'LINKEDIN',
        email: acc.email,
        name: acc.name,
        profileUrl: acc.profile_url,
        profilePicture: acc.profile_picture,
        status: acc.status,
        unipileAccountId: acc.unipile_account_id,
        metadata: acc.metadata
      }));
    } catch (error) {
      console.error('Error getting connected accounts:', error);
      return [];
    }
  }

  /**
   * Disconnect LinkedIn account
   */
  async disconnectAccount(accountId: string): Promise<void> {
    try {
      // First disconnect from Unipile
      const account = await this.getAccountById(accountId);
      if (account?.unipileAccountId) {
        await fetch(`${this.baseUrl}/accounts/${account.unipileAccountId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'X-API-KEY': this.config.apiKey
          }
        });
      }

      // Update status in Supabase
      const { error } = await supabase
        .from('team_accounts')
        .update({ 
          status: 'disconnected',
          disconnected_at: new Date().toISOString()
        })
        .eq('id', accountId);

      if (error) throw error;
    } catch (error) {
      console.error('Error disconnecting account:', error);
      throw error;
    }
  }

  /**
   * Sync LinkedIn account data
   */
  async syncAccount(accountId: string): Promise<void> {
    try {
      const account = await this.getAccountById(accountId);
      if (!account?.unipileAccountId) throw new Error('Account not found');

      // Trigger sync in Unipile
      await fetch(`${this.baseUrl}/accounts/${account.unipileAccountId}/sync`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'X-API-KEY': this.config.apiKey
        },
        body: JSON.stringify({
          sync_messages: true,
          sync_contacts: true,
          sync_profile: true
        })
      });

      // Update last sync time
      await supabase
        .from('team_accounts')
        .update({ last_sync: new Date().toISOString() })
        .eq('id', accountId);

      // Trigger n8n workflow
      await this.triggerLinkedInSync(accountId);
    } catch (error) {
      console.error('Error syncing account:', error);
      throw error;
    }
  }

  /**
   * Get account by ID
   */
  private async getAccountById(accountId: string): Promise<LinkedInAccountData | null> {
    try {
      const { data, error } = await supabase
        .from('team_accounts')
        .select('*')
        .eq('id', accountId)
        .single();

      if (error || !data) return null;

      return {
        id: data.id,
        provider: 'LINKEDIN',
        email: data.email,
        name: data.name,
        profileUrl: data.profile_url,
        profilePicture: data.profile_picture,
        status: data.status,
        unipileAccountId: data.unipile_account_id,
        metadata: data.metadata
      };
    } catch (error) {
      console.error('Error getting account by ID:', error);
      return null;
    }
  }

  /**
   * Trigger n8n workflow for LinkedIn sync
   */
  private async triggerLinkedInSync(accountId: string): Promise<void> {
    try {
      const n8nWebhookUrl = `${import.meta.env.VITE_N8N_URL || 'https://workflows.innovareai.com'}/webhook/linkedin-sync`;
      
      const { data: { user } } = await supabase.auth.getUser();
      
      await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          accountId,
          userId: user?.id,
          tenantId: user?.user_metadata?.tenant_id || user?.id,
          timestamp: new Date().toISOString(),
          action: 'sync'
        })
      });
    } catch (error) {
      console.error('Error triggering n8n sync:', error);
      // Don't throw - this is non-critical
    }
  }

  /**
   * Send LinkedIn message
   */
  async sendMessage(accountId: string, recipientUrl: string, message: string): Promise<void> {
    try {
      const account = await this.getAccountById(accountId);
      if (!account?.unipileAccountId) throw new Error('Account not found');

      const response = await fetch(`${this.baseUrl}/messages/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'X-API-KEY': this.config.apiKey,
          'X-UNIPILE-ACCOUNT-ID': account.unipileAccountId
        },
        body: JSON.stringify({
          provider: 'LINKEDIN',
          recipient: recipientUrl,
          message: {
            text: message,
            type: 'TEXT'
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send LinkedIn message');
      }
    } catch (error) {
      console.error('Error sending LinkedIn message:', error);
      throw error;
    }
  }

  /**
   * Get LinkedIn messages
   */
  async getMessages(accountId: string, limit = 50): Promise<any[]> {
    try {
      const account = await this.getAccountById(accountId);
      if (!account?.unipileAccountId) throw new Error('Account not found');

      const response = await fetch(`${this.baseUrl}/messages?limit=${limit}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'X-API-KEY': this.config.apiKey,
          'X-UNIPILE-ACCOUNT-ID': account.unipileAccountId
        }
      });

      if (!response.ok) {
        throw new Error('Failed to get LinkedIn messages');
      }

      const data = await response.json();
      return data.messages || [];
    } catch (error) {
      console.error('Error getting LinkedIn messages:', error);
      return [];
    }
  }

  /**
   * Get conversations for an account
   */
  async getConversations(accountId: string, limit = 50): Promise<any[]> {
    try {
      const account = await this.getAccountById(accountId);
      if (!account?.unipileAccountId) throw new Error('Account not found');

      const response = await fetch(`${this.baseUrl}/conversations?limit=${limit}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'X-API-KEY': this.config.apiKey,
          'X-UNIPILE-ACCOUNT-ID': account.unipileAccountId
        }
      });

      if (!response.ok) {
        throw new Error('Failed to get conversations');
      }

      const data = await response.json();
      return data.conversations || [];
    } catch (error) {
      console.error('Error getting conversations:', error);
      return [];
    }
  }

  /**
   * Sync messages to database
   */
  async syncMessagesToDatabase(accountId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const messages = await this.getMessages(accountId, 100);
      
      for (const message of messages) {
        // Check if conversation exists, create if not
        let conversationId = message.conversation_id;
        
        if (!conversationId) {
          const { data: conversation, error: convError } = await supabase
            .from('conversations')
            .insert({
              user_id: user.id,
              platform: 'linkedin',
              platform_conversation_id: message.thread_id || message.id,
              participant_name: message.from?.name || 'Unknown',
              participant_email: message.from?.email,
              participant_profile_url: message.from?.profile_url,
              last_message_at: message.created_at,
              status: 'active'
            })
            .select('id')
            .single();

          if (convError) throw convError;
          conversationId = conversation.id;
        }

        // Insert message
        const { error: msgError } = await supabase
          .from('conversation_messages')
          .upsert({
            conversation_id: conversationId,
            platform_message_id: message.id,
            sender_name: message.from?.name || 'Unknown',
            sender_email: message.from?.email,
            content: message.text || message.body,
            message_type: message.type || 'text',
            sent_at: message.created_at,
            direction: message.direction || 'inbound',
            platform_data: message
          });

        if (msgError) throw msgError;
      }
    } catch (error) {
      console.error('Error syncing messages to database:', error);
      throw error;
    }
  }

  /**
   * Send message and track in database
   */
  async sendMessageWithTracking(
    accountId: string, 
    recipientUrl: string, 
    message: string,
    campaignId?: string
  ): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Send message via Unipile
      await this.sendMessage(accountId, recipientUrl, message);

      // Find or create conversation
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('id')
        .eq('user_id', user.id)
        .eq('platform', 'linkedin')
        .eq('participant_profile_url', recipientUrl)
        .single();

      let conversationId = conversation?.id;

      if (!conversationId) {
        const { data: newConv, error: newConvError } = await supabase
          .from('conversations')
          .insert({
            user_id: user.id,
            platform: 'linkedin',
            platform_conversation_id: crypto.randomUUID(),
            participant_profile_url: recipientUrl,
            last_message_at: new Date().toISOString(),
            status: 'active'
          })
          .select('id')
          .single();

        if (newConvError) throw newConvError;
        conversationId = newConv.id;
      }

      // Track message in database
      const { error: msgError } = await supabase
        .from('conversation_messages')
        .insert({
          conversation_id: conversationId,
          platform_message_id: crypto.randomUUID(),
          sender_name: 'You',
          content: message,
          message_type: 'text',
          sent_at: new Date().toISOString(),
          direction: 'outbound',
          campaign_id: campaignId
        });

      if (msgError) throw msgError;

    } catch (error) {
      console.error('Error sending tracked message:', error);
      throw error;
    }
  }

  /**
   * Setup webhook for real-time message notifications
   */
  async setupWebhook(webhookUrl: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/webhooks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'X-API-KEY': this.config.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: webhookUrl,
          events: [
            'message.received',
            'message.sent',
            'conversation.created',
            'conversation.updated'
          ]
        })
      });

      if (!response.ok) {
        throw new Error('Failed to setup webhook');
      }

    } catch (error) {
      console.error('Error setting up webhook:', error);
      throw error;
    }
  }

  /**
   * Get all messages for global inbox
   */
  async getAllMessagesForInbox(userId: string): Promise<any[]> {
    try {
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select(`
          *,
          conversation_messages (
            *
          )
        `)
        .eq('user_id', userId)
        .order('last_message_at', { ascending: false });

      if (error) throw error;

      return (conversations || []).map(conv => ({
        id: conv.id,
        from: conv.participant_name || 'Unknown',
        avatar: conv.participant_avatar_url,
        company: conv.participant_company,
        channel: conv.platform,
        subject: conv.latest_subject || `Message from ${conv.participant_name}`,
        preview: conv.conversation_messages?.[0]?.content?.substring(0, 100) || '',
        time: conv.last_message_at,
        read: conv.status === 'read',
        priority: conv.priority || 'medium',
        labels: conv.tags || [],
        fullMessage: conv.conversation_messages?.[0]?.content || '',
        messages: conv.conversation_messages || []
      }));

    } catch (error) {
      console.error('Error getting inbox messages:', error);
      return [];
    }
  }
}

// Export singleton instance
export const unipileService = new UnipileService();
export default unipileService;