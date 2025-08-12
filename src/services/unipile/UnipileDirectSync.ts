/**
 * Direct Unipile API Sync Service
 * Directly calls Unipile API to fetch and sync all LinkedIn messages
 */

import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export class UnipileDirectSync {
  private baseUrl = 'https://api6.unipile.com:13670/api/v1';
  private apiKey: string | null = null;
  
  constructor() {
    // Get API key from environment or localStorage
    this.apiKey = import.meta.env.VITE_UNIPILE_API_KEY || 
                  localStorage.getItem('unipile_api_key') || 
                  null;
  }

  /**
   * Test Unipile API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      if (!this.apiKey) {
        console.error('No Unipile API key found');
        toast.error('Unipile API key not configured');
        return false;
      }

      console.log('Testing Unipile API connection...');
      
      const response = await fetch(`${this.baseUrl}/accounts`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'X-API-KEY': this.apiKey,
          'Accept': 'application/json'
        }
      });

      console.log('Unipile API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Unipile API connected successfully:', data);
        return true;
      } else {
        const errorText = await response.text();
        console.error('Unipile API error:', errorText);
        return false;
      }
    } catch (error) {
      console.error('Failed to connect to Unipile:', error);
      return false;
    }
  }

  /**
   * Get all connected LinkedIn accounts from Unipile
   */
  async getConnectedAccounts(): Promise<any[]> {
    try {
      if (!this.apiKey) {
        throw new Error('No Unipile API key configured');
      }

      const response = await fetch(`${this.baseUrl}/accounts`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'X-API-KEY': this.apiKey,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get accounts: ${response.status}`);
      }

      const data = await response.json();
      console.log('Connected Unipile accounts:', data);
      
      // Filter for LinkedIn accounts
      const linkedInAccounts = (data.items || data.accounts || [])
        .filter((acc: any) => acc.provider === 'LINKEDIN');
      
      return linkedInAccounts;
    } catch (error) {
      console.error('Error getting Unipile accounts:', error);
      return [];
    }
  }

  /**
   * Fetch all messages from a specific LinkedIn account
   */
  async fetchMessagesForAccount(accountId: string): Promise<any[]> {
    try {
      if (!this.apiKey) {
        throw new Error('No Unipile API key configured');
      }

      console.log(`Fetching messages for account: ${accountId}`);
      
      // Try different endpoint variations
      const endpoints = [
        `/messages?account_id=${accountId}`,
        `/messaging/messages?account_id=${accountId}`,
        `/accounts/${accountId}/messages`
      ];

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(`${this.baseUrl}${endpoint}&limit=100`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'X-API-KEY': this.apiKey,
              'X-ACCOUNT-ID': accountId,
              'Accept': 'application/json'
            }
          });

          if (response.ok) {
            const data = await response.json();
            console.log(`Messages fetched from ${endpoint}:`, data);
            return data.items || data.messages || data.data || [];
          }
        } catch (err) {
          console.log(`Endpoint ${endpoint} failed, trying next...`);
        }
      }

      // If no endpoint worked, try conversations
      return await this.fetchConversationsForAccount(accountId);
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  }

  /**
   * Fetch conversations (alternative to messages)
   */
  async fetchConversationsForAccount(accountId: string): Promise<any[]> {
    try {
      if (!this.apiKey) {
        throw new Error('No Unipile API key configured');
      }

      console.log(`Fetching conversations for account: ${accountId}`);
      
      const response = await fetch(`${this.baseUrl}/messaging/conversations?account_id=${accountId}&limit=100`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'X-API-KEY': this.apiKey,
          'X-ACCOUNT-ID': accountId,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to fetch conversations:', errorText);
        return [];
      }

      const data = await response.json();
      console.log('Conversations fetched:', data);
      
      // Extract messages from conversations
      const messages = [];
      const conversations = data.items || data.conversations || data.data || [];
      
      for (const conv of conversations) {
        if (conv.messages && Array.isArray(conv.messages)) {
          messages.push(...conv.messages);
        } else {
          // Create a message from conversation metadata
          messages.push({
            id: conv.id,
            conversation_id: conv.id,
            from: conv.participants?.[0] || { name: 'Unknown' },
            text: conv.last_message || conv.snippet || '',
            created_at: conv.updated_at || conv.created_at,
            type: 'conversation'
          });
        }
      }
      
      return messages;
    } catch (error) {
      console.error('Error fetching conversations:', error);
      return [];
    }
  }

  /**
   * Sync all LinkedIn messages to database
   */
  async syncAllMessages(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please sign in to sync messages');
        return;
      }

      toast.info('Connecting to Unipile API...');
      
      // Test connection first
      const isConnected = await this.testConnection();
      if (!isConnected) {
        toast.error('Failed to connect to Unipile API. Please check your API key.');
        return;
      }

      // Get all connected LinkedIn accounts
      const accounts = await this.getConnectedAccounts();
      
      if (accounts.length === 0) {
        // Try to get accounts from localStorage
        const storedAccounts = localStorage.getItem('linkedin_accounts');
        if (storedAccounts) {
          const localAccounts = JSON.parse(storedAccounts);
          console.log('Using local LinkedIn accounts:', localAccounts);
          
          for (const account of localAccounts) {
            await this.syncAccountMessages(account, user.id);
          }
        } else {
          toast.warning('No LinkedIn accounts connected. Please connect an account first.');
        }
        return;
      }

      toast.info(`Found ${accounts.length} LinkedIn account(s). Syncing messages...`);
      
      // Sync messages for each account
      for (const account of accounts) {
        await this.syncAccountMessages(account, user.id);
      }
      
      toast.success('All LinkedIn messages synced successfully!');
    } catch (error) {
      console.error('Sync error:', error);
      toast.error('Failed to sync messages. Check console for details.');
    }
  }

  /**
   * Sync messages for a specific account
   */
  private async syncAccountMessages(account: any, userId: string): Promise<void> {
    try {
      const accountId = account.id || account.unipileAccountId || account.account_id;
      
      if (!accountId) {
        console.error('No account ID found for:', account);
        return;
      }

      console.log(`Syncing messages for account: ${account.name || accountId}`);
      
      // Fetch messages
      const messages = await this.fetchMessagesForAccount(accountId);
      
      if (messages.length === 0) {
        console.log('No messages found for account');
        return;
      }

      console.log(`Syncing ${messages.length} messages to database...`);
      
      // Save each message to database
      for (const message of messages) {
        try {
          // Create or update conversation
          const { data: conversation } = await supabase
            .from('conversations')
            .upsert({
              user_id: userId,
              platform: 'linkedin',
              platform_conversation_id: message.conversation_id || message.thread_id || message.id,
              participant_name: message.from?.name || message.sender?.name || 'LinkedIn User',
              participant_email: message.from?.email || message.sender?.email || null,
              participant_company: message.from?.company || null,
              participant_profile_url: message.from?.profile_url || null,
              participant_avatar_url: message.from?.avatar || null,
              last_message_at: message.created_at || new Date().toISOString(),
              status: 'active'
            })
            .select()
            .single();

          if (conversation) {
            // Create message
            await supabase
              .from('conversation_messages')
              .upsert({
                conversation_id: conversation.id,
                platform_message_id: message.id,
                role: message.direction === 'outbound' ? 'user' : 'assistant',
                content: message.text || message.body || message.content || '',
                metadata: {
                  sender_name: message.from?.name || message.sender?.name,
                  sender_email: message.from?.email || message.sender?.email,
                  message_type: message.type || 'text',
                  direction: message.direction || 'inbound',
                  original_data: message
                }
              });
          }
        } catch (err) {
          console.error('Error saving message:', err);
        }
      }
      
      console.log(`Successfully synced ${messages.length} messages`);
    } catch (error) {
      console.error('Error syncing account messages:', error);
    }
  }

  /**
   * Manual API key setup
   */
  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
    localStorage.setItem('unipile_api_key', apiKey);
    toast.success('Unipile API key saved');
  }
}

// Export singleton instance
export const unipileDirectSync = new UnipileDirectSync();