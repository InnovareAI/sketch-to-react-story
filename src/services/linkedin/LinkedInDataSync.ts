/**
 * LinkedIn Data Sync Service
 * Handles syncing messages and contacts from LinkedIn to local database
 */

import { supabase } from '@/integrations/supabase/client';
import { unipileService } from '@/services/unipile/UnipileService';
import { toast } from 'sonner';
import { getUserLinkedInAccounts } from '@/utils/userDataStorage';

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
      // Check user-specific storage for accounts
      const accounts = await getUserLinkedInAccounts();
      if (accounts && accounts.length > 0) {
        return accounts;
      }

      // Check database for accounts
      const { data: dbAccounts, error } = await supabase
        .from('team_accounts')
        .select('*')
        .eq('provider', 'LINKEDIN')
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
        // No API configured - don't create any data
        console.log('No Unipile API key configured. Please configure API to sync data.');
        toast.error('Unipile API not configured. Cannot sync LinkedIn data.');
      }
      
    } catch (error) {
      console.error('Error syncing account data:', error);
      toast.error('Failed to sync LinkedIn data');
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
}

// Export singleton instance
export const linkedInDataSync = LinkedInDataSync.getInstance();