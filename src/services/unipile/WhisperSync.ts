/**
 * WhisperSync Service
 * Automatically syncs LinkedIn data in the background at regular intervals
 * Handles rate limiting and progressive sync strategies
 */

import { contactMessageSync } from './ContactMessageSync';
import { supabase } from '@/integrations/supabase/client';
import { getUserLinkedInAccounts } from '@/utils/userDataStorage';

interface WhisperSyncConfig {
  enabled: boolean;
  intervalMinutes: number;
  contactsOnly?: boolean;
  messagesOnly?: boolean;
  onlyFirstDegree?: boolean;
  maxContactsPerSync?: number;
  maxMessagesPerSync?: number;
}

class WhisperSyncService {
  private syncInterval: NodeJS.Timeout | null = null;
  private isSyncing: boolean = false;
  private lastSyncTime: Date | null = null;
  private config: WhisperSyncConfig = {
    enabled: true,
    intervalMinutes: 30, // Default 30 minutes
    contactsOnly: false,
    messagesOnly: false,
    onlyFirstDegree: false,
    maxContactsPerSync: 500,
    maxMessagesPerSync: 200
  };

  /**
   * Start automatic background syncing
   */
  async start(workspaceId?: string, accountId?: string) {
    console.log('WhisperSync: Starting background sync service...');
    
    // Load config from localStorage or database
    await this.loadConfig();
    
    if (!this.config.enabled) {
      console.log('WhisperSync: Service is disabled');
      return;
    }

    // Clear any existing interval
    this.stop();

    // Get workspace and account if not provided
    const wsId = workspaceId || await this.getWorkspaceId();
    const accId = accountId || await this.getLinkedInAccountId();

    if (!wsId || !accId) {
      console.warn('WhisperSync: Missing workspace or account ID, cannot start');
      return;
    }

    // Perform initial sync
    await this.performSync(wsId, accId);

    // Set up recurring sync
    this.syncInterval = setInterval(async () => {
      await this.performSync(wsId, accId);
    }, this.config.intervalMinutes * 60 * 1000);

    console.log(`WhisperSync: Running every ${this.config.intervalMinutes} minutes`);
  }

  /**
   * Stop automatic syncing
   */
  stop() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('WhisperSync: Stopped');
    }
  }

  /**
   * Perform a single sync operation
   */
  private async performSync(workspaceId: string, accountId: string) {
    if (this.isSyncing) {
      console.log('WhisperSync: Sync already in progress, skipping...');
      return;
    }

    this.isSyncing = true;
    const startTime = Date.now();

    try {
      console.log('WhisperSync: Starting background sync...');

      const result = await contactMessageSync.syncContactsAndMessages(
        accountId,
        workspaceId,
        {
          syncContacts: !this.config.messagesOnly,
          syncMessages: !this.config.contactsOnly,
          contactLimit: this.config.maxContactsPerSync,
          messageLimit: this.config.maxMessagesPerSync,
          onlyFirstDegree: this.config.onlyFirstDegree
        }
      );

      const duration = Date.now() - startTime;
      this.lastSyncTime = new Date();

      // Log sync results
      console.log(`WhisperSync: Completed in ${(duration / 1000).toFixed(1)}s`, {
        contacts: result.contactsSynced,
        messages: result.messagesSynced,
        errors: result.errors.length
      });

      // Store sync history
      await this.logSyncHistory(workspaceId, result, duration);

      // Check if we should adjust sync frequency based on activity
      await this.adjustSyncFrequency(result);

    } catch (error: any) {
      console.error('WhisperSync: Error during sync:', error);
      
      // If rate limited, increase interval
      if (error.message?.includes('rate limit')) {
        this.config.intervalMinutes = Math.min(120, this.config.intervalMinutes * 2);
        console.log(`WhisperSync: Rate limited, increasing interval to ${this.config.intervalMinutes} minutes`);
        await this.saveConfig();
        
        // Restart with new interval
        this.start(workspaceId, accountId);
      }
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Adjust sync frequency based on activity levels
   */
  private async adjustSyncFrequency(result: any) {
    // If we're getting a lot of new data, sync more frequently
    if (result.contactsSynced > 100 || result.messagesSynced > 50) {
      this.config.intervalMinutes = Math.max(15, this.config.intervalMinutes - 5);
    } 
    // If getting little data, sync less frequently
    else if (result.contactsSynced < 10 && result.messagesSynced < 5) {
      this.config.intervalMinutes = Math.min(60, this.config.intervalMinutes + 5);
    }
  }

  /**
   * Log sync history to database
   */
  private async logSyncHistory(workspaceId: string, result: any, duration: number) {
    try {
      await supabase.from('sync_history').insert({
        workspace_id: workspaceId,
        sync_type: 'whisper',
        contacts_synced: result.contactsSynced,
        messages_synced: result.messagesSynced,
        errors: result.errors,
        duration_ms: duration,
        created_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('WhisperSync: Failed to log history:', error);
    }
  }

  /**
   * Get workspace ID from localStorage or auth
   */
  private async getWorkspaceId(): Promise<string | null> {
    try {
      const userProfile = localStorage.getItem('user_auth_profile');
      if (userProfile) {
        const profile = JSON.parse(userProfile);
        return profile.workspace_id;
      }
      // Get user-specific workspace ID
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        return localStorage.getItem(`user_${user.id}_workspace_id`);
      }
      return null;
    } catch (error) {
      console.error('WhisperSync: Error getting workspace ID:', error);
      return null;
    }
  }

  /**
   * Get LinkedIn account ID from localStorage
   */
  private async getLinkedInAccountId(): Promise<string | null> {
    try {
      // Use the centralized user data storage
      const accounts = await getUserLinkedInAccounts();
      if (accounts.length > 0) {
        return accounts[0].unipileAccountId || accounts[0].id;
      }
      return null;
    } catch (error) {
      console.error('WhisperSync: Error getting LinkedIn account:', error);
      return null;
    }
  }

  /**
   * Load configuration from localStorage
   */
  private async loadConfig() {
    try {
      // Get user-specific config
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const saved = localStorage.getItem(`user_${user.id}_whisper_sync_config`);
      if (saved) {
        this.config = { ...this.config, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.error('WhisperSync: Error loading config:', error);
    }
  }

  /**
   * Save configuration to localStorage
   */
  private async saveConfig() {
    try {
      // Save user-specific config
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      localStorage.setItem(`user_${user.id}_whisper_sync_config`, JSON.stringify(this.config));
    } catch (error) {
      console.error('WhisperSync: Error saving config:', error);
    }
  }

  /**
   * Update configuration
   */
  async updateConfig(config: Partial<WhisperSyncConfig>) {
    this.config = { ...this.config, ...config };
    await this.saveConfig();
    
    // Restart if enabled state changed
    if (config.enabled !== undefined) {
      if (config.enabled) {
        this.start();
      } else {
        this.stop();
      }
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): WhisperSyncConfig {
    return { ...this.config };
  }

  /**
   * Get last sync time
   */
  getLastSyncTime(): Date | null {
    return this.lastSyncTime;
  }

  /**
   * Check if currently syncing
   */
  isSyncInProgress(): boolean {
    return this.isSyncing;
  }
}

// Export singleton instance
export const whisperSync = new WhisperSyncService();

// Auto-start on page load if enabled
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    // Delay start to allow auth to complete
    setTimeout(() => {
      whisperSync.start();
    }, 5000);
  });
}