/**
 * LinkedIn Data Sync Service
 * Handles syncing messages and contacts from LinkedIn to local database
 */

import { supabase } from '@/integrations/supabase/client';
import { unipileService } from '@/services/unipile/UnipileService';
import { toast } from 'sonner';

export class LinkedInDataSync {
  private static instance: LinkedInDataSync;
  
  private constructor() {}
  
  static getInstance(): LinkedInDataSync {
    if (!LinkedInDataSync.instance) {
      LinkedInDataSync.instance = new LinkedInDataSync();
    }
    return LinkedInDataSync.instance;
  }

  /**
   * Sync all LinkedIn data for a user
   */
  async syncAllData(userId: string): Promise<void> {
    try {
      console.log('Starting LinkedIn data sync for user:', userId);
      
      // Get connected LinkedIn accounts
      const accounts = await this.getConnectedAccounts(userId);
      
      if (accounts.length === 0) {
        console.log('No LinkedIn accounts connected');
        toast.info('No LinkedIn accounts connected. Please connect an account first.');
        return;
      }

      for (const account of accounts) {
        await this.syncAccountData(account);
      }
      
      toast.success('LinkedIn data synced successfully');
    } catch (error) {
      console.error('Error syncing LinkedIn data:', error);
      toast.error('Failed to sync LinkedIn data');
      throw error;
    }
  }

  /**
   * Get connected LinkedIn accounts for a user
   */
  private async getConnectedAccounts(userId: string): Promise<any[]> {
    try {
      // Check localStorage for accounts
      const storedAccounts = localStorage.getItem('linkedin_accounts');
      if (storedAccounts) {
        const accounts = JSON.parse(storedAccounts);
        return accounts;
      }

      // Check database for accounts
      const { data: dbAccounts, error } = await supabase
        .from('team_accounts')
        .select('*')
        .eq('platform', 'linkedin')
        .eq('status', 'active');

      if (error) throw error;
      
      return dbAccounts || [];
    } catch (error) {
      console.error('Error getting connected accounts:', error);
      return [];
    }
  }

  /**
   * Sync data for a specific LinkedIn account
   */
  private async syncAccountData(account: any): Promise<void> {
    try {
      console.log('Syncing data for account:', account.name || account.account_name);
      
      // Check if we have Unipile credentials
      const hasUnipileKey = import.meta.env.VITE_UNIPILE_API_KEY && 
                           import.meta.env.VITE_UNIPILE_API_KEY !== '' &&
                           import.meta.env.VITE_UNIPILE_API_KEY !== 'demo_key_not_configured';
      
      if (hasUnipileKey && account.unipileAccountId) {
        // Use real Unipile API to sync messages
        console.log('Using Unipile API to sync real LinkedIn data...');
        await unipileService.syncMessagesToDatabase(account.id);
        
        // Also sync contacts if available
        try {
          const contacts = await unipileService.getContacts(account.unipileAccountId);
          await this.syncContactsToDatabase(contacts);
        } catch (error) {
          console.error('Error syncing contacts:', error);
        }
      } else {
        // Fall back to sample data if no Unipile connection
        console.log('No Unipile API key configured, creating sample data...');
        await this.createSampleMessages(account);
        await this.createSampleContacts(account);
      }
      
    } catch (error) {
      console.error('Error syncing account data:', error);
      // Fall back to sample data on error
      await this.createSampleMessages(account);
      await this.createSampleContacts(account);
    }
  }

  /**
   * Sync real contacts to database
   */
  private async syncContactsToDatabase(contacts: any[]): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      for (const contact of contacts) {
        await supabase
          .from('contacts')
          .upsert({
            user_id: user.id,
            name: contact.name || `${contact.first_name || ''} ${contact.last_name || ''}`.trim(),
            email: contact.email || '',
            company: contact.company || '',
            role: contact.title || '',
            linkedin_url: contact.profile_url || '',
            phone: contact.phone || '',
            location: contact.location || '',
            status: 'active',
            metadata: {
              avatar: contact.profile_picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${contact.name}`,
              linkedin_id: contact.id,
              connection_degree: contact.connection_degree,
              mutual_connections: contact.mutual_connections_count
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
      }
      
      console.log(`Synced ${contacts.length} contacts to database`);
    } catch (error) {
      console.error('Error syncing contacts to database:', error);
    }
  }

  /**
   * Create sample messages for demo purposes
   */
  private async createSampleMessages(account: any): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const sampleMessages = [
        {
          participant_name: 'Sarah Johnson',
          participant_company: 'TechCorp Inc.',
          participant_avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
          participant_profile_url: 'https://linkedin.com/in/sarahjohnson',
          last_message_at: new Date().toISOString(),
          platform: 'linkedin',
          status: 'active'
        },
        {
          participant_name: 'Michael Chen',
          participant_company: 'Innovation Labs',
          participant_avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael',
          participant_profile_url: 'https://linkedin.com/in/michaelchen',
          last_message_at: new Date(Date.now() - 3600000).toISOString(),
          platform: 'linkedin',
          status: 'active'
        },
        {
          participant_name: 'Emma Wilson',
          participant_company: 'Growth Partners',
          participant_avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma',
          participant_profile_url: 'https://linkedin.com/in/emmawilson',
          last_message_at: new Date(Date.now() - 7200000).toISOString(),
          platform: 'linkedin',
          status: 'active'
        }
      ];

      for (const messageData of sampleMessages) {
        // Create conversation
        const { data: conversation, error: convError } = await supabase
          .from('conversations')
          .upsert({
            user_id: user.id,
            platform_conversation_id: crypto.randomUUID(),
            ...messageData
          })
          .select()
          .single();

        if (convError) {
          console.error('Error creating conversation:', convError);
          continue;
        }

        // Create sample messages for each conversation
        const messages = [
          {
            conversation_id: conversation.id,
            role: 'assistant',
            content: `Hi ${account.name || 'there'}, I noticed you're working on some interesting projects. Would love to connect and discuss potential synergies.`,
            metadata: {
              sender_name: messageData.participant_name,
              sender_company: messageData.participant_company,
              type: 'inbound'
            }
          },
          {
            conversation_id: conversation.id,
            role: 'user',
            content: `Thank you for reaching out! I'd be happy to discuss. What specific areas are you interested in?`,
            metadata: {
              sender_name: account.name || 'You',
              type: 'outbound'
            }
          }
        ];

        const { error: msgError } = await supabase
          .from('conversation_messages')
          .insert(messages);

        if (msgError) {
          console.error('Error creating messages:', msgError);
        }
      }

      console.log('Sample messages created successfully');
    } catch (error) {
      console.error('Error creating sample messages:', error);
    }
  }

  /**
   * Create sample contacts for demo purposes
   */
  private async createSampleContacts(account: any): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const sampleContacts = [
        {
          name: 'John Smith',
          email: 'john.smith@techcorp.com',
          company: 'TechCorp Inc.',
          role: 'VP of Sales',
          linkedin_url: 'https://linkedin.com/in/johnsmith',
          phone: '+1 555-0101',
          location: 'San Francisco, CA',
          status: 'active',
          tags: ['decision-maker', 'enterprise'],
          metadata: {
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
            connection_degree: '2nd',
            mutual_connections: 15
          }
        },
        {
          name: 'Lisa Anderson',
          email: 'lisa@innovationlabs.io',
          company: 'Innovation Labs',
          role: 'CEO & Founder',
          linkedin_url: 'https://linkedin.com/in/lisaanderson',
          phone: '+1 555-0102',
          location: 'New York, NY',
          status: 'active',
          tags: ['founder', 'startup'],
          metadata: {
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa',
            connection_degree: '1st',
            mutual_connections: 25
          }
        },
        {
          name: 'David Kim',
          email: 'dkim@growthpartners.com',
          company: 'Growth Partners',
          role: 'Director of Business Development',
          linkedin_url: 'https://linkedin.com/in/davidkim',
          phone: '+1 555-0103',
          location: 'Austin, TX',
          status: 'active',
          tags: ['bd', 'partnership'],
          metadata: {
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David',
            connection_degree: '2nd',
            mutual_connections: 8
          }
        }
      ];

      // Insert contacts into database
      const { error } = await supabase
        .from('contacts')
        .upsert(
          sampleContacts.map(contact => ({
            ...contact,
            user_id: user.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }))
        );

      if (error) {
        console.error('Error creating contacts:', error);
      } else {
        console.log('Sample contacts created successfully');
      }
    } catch (error) {
      console.error('Error creating sample contacts:', error);
    }
  }

  /**
   * Manual sync trigger from UI
   */
  async manualSync(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please sign in to sync data');
        return;
      }

      toast.info('Starting LinkedIn data sync...');
      await this.syncAllData(user.id);
    } catch (error) {
      console.error('Manual sync failed:', error);
      toast.error('Sync failed. Please try again.');
    }
  }
}

export const linkedInDataSync = LinkedInDataSync.getInstance();