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
  private baseUrl = 'https://api.unipile.com/api/v1';
  
  constructor() {
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
}

// Export singleton instance
export const unipileService = new UnipileService();
export default unipileService;