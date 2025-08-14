/**
 * Background Sync Manager
 * Manages server-side background syncing via Supabase Edge Functions
 * Continues syncing even when user leaves the page
 */

import { supabase } from '@/integrations/supabase/client';

interface SyncSchedule {
  workspace_id: string;
  account_id: string;
  sync_enabled: boolean;
  sync_interval_minutes: number;
  sync_type: 'contacts' | 'messages' | 'both';
  last_sync_at?: string;
  next_sync_at?: string;
}

interface SyncStatus {
  isEnabled: boolean;
  lastSyncAt?: Date;
  nextSyncAt?: Date;
  intervalMinutes: number;
  syncType: string;
  recentSyncs?: SyncHistory[];
}

interface SyncHistory {
  synced_at: string;
  contacts_synced: number;
  messages_synced: number;
  status: 'success' | 'partial' | 'failed';
  duration_ms: number;
  errors?: string[];
}

class BackgroundSyncManager {
  private static instance: BackgroundSyncManager;
  private statusCheckInterval: NodeJS.Timeout | null = null;

  private constructor() {}

  static getInstance(): BackgroundSyncManager {
    if (!BackgroundSyncManager.instance) {
      BackgroundSyncManager.instance = new BackgroundSyncManager();
    }
    return BackgroundSyncManager.instance;
  }

  /**
   * Enable background sync for a workspace
   * This sets up server-side syncing that continues even when the user leaves
   */
  async enableBackgroundSync(
    workspaceId: string,
    accountId: string,
    intervalMinutes: number = 30,
    syncType: 'contacts' | 'messages' | 'both' = 'both'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('Enabling background sync...', { workspaceId, accountId, intervalMinutes });

      // Call the database function to set up the sync schedule
      const { error } = await supabase.rpc('set_linkedin_sync_schedule', {
        p_workspace_id: workspaceId,
        p_account_id: accountId,
        p_enabled: true,
        p_interval_minutes: intervalMinutes,
        p_sync_type: syncType
      });

      if (error) throw error;

      // Trigger an immediate sync
      await this.triggerImmediateSync(workspaceId, accountId);

      // Start monitoring sync status
      this.startStatusMonitoring(workspaceId);

      return { success: true };
    } catch (error: any) {
      console.error('Error enabling background sync:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Disable background sync
   */
  async disableBackgroundSync(
    workspaceId: string,
    accountId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.rpc('set_linkedin_sync_schedule', {
        p_workspace_id: workspaceId,
        p_account_id: accountId,
        p_enabled: false,
        p_interval_minutes: 30,
        p_sync_type: 'both'
      });

      if (error) throw error;

      // Stop monitoring
      this.stopStatusMonitoring();

      return { success: true };
    } catch (error: any) {
      console.error('Error disabling background sync:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Trigger an immediate sync (outside of the schedule)
   */
  async triggerImmediateSync(
    workspaceId: string,
    accountId: string,
    syncType: 'contacts' | 'messages' | 'both' = 'both'
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log('Triggering immediate background sync...');

      // Call the edge function directly
      const { data, error } = await supabase.functions.invoke('linkedin-background-sync', {
        body: {
          workspace_id: workspaceId,
          account_id: accountId,
          sync_type: syncType,
          limit: 1000
        }
      });

      if (error) throw error;

      console.log('Immediate sync completed:', data);
      return { success: true, data };
    } catch (error: any) {
      console.error('Error triggering immediate sync:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get current sync status
   */
  async getSyncStatus(workspaceId: string): Promise<SyncStatus | null> {
    try {
      // Get sync schedule
      const { data: schedule, error: scheduleError } = await supabase
        .from('sync_schedules')
        .select('*')
        .eq('workspace_id', workspaceId)
        .single();

      if (scheduleError) {
        console.error('Error fetching sync schedule:', scheduleError);
        return null;
      }

      // Get recent sync history
      const { data: history, error: historyError } = await supabase
        .from('sync_metadata')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('sync_type', 'background_linkedin')
        .order('created_at', { ascending: false })
        .limit(5);

      if (historyError) {
        console.error('Error fetching sync history:', historyError);
      }

      return {
        isEnabled: schedule?.sync_enabled || false,
        lastSyncAt: schedule?.last_sync_at ? new Date(schedule.last_sync_at) : undefined,
        nextSyncAt: schedule?.next_sync_at ? new Date(schedule.next_sync_at) : undefined,
        intervalMinutes: schedule?.sync_interval_minutes || 30,
        syncType: schedule?.sync_type || 'both',
        recentSyncs: history?.map(h => ({
          synced_at: h.last_sync_at,
          contacts_synced: h.contacts_synced,
          messages_synced: h.messages_synced,
          status: h.status,
          duration_ms: h.duration_ms,
          errors: h.errors
        })) || []
      };
    } catch (error) {
      console.error('Error getting sync status:', error);
      return null;
    }
  }

  /**
   * Update sync schedule settings
   */
  async updateSyncSettings(
    workspaceId: string,
    accountId: string,
    settings: {
      intervalMinutes?: number;
      syncType?: 'contacts' | 'messages' | 'both';
    }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('sync_schedules')
        .update({
          sync_interval_minutes: settings.intervalMinutes,
          sync_type: settings.syncType,
          updated_at: new Date().toISOString()
        })
        .eq('workspace_id', workspaceId)
        .eq('account_id', accountId);

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error('Error updating sync settings:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Start monitoring sync status (updates UI)
   */
  private startStatusMonitoring(workspaceId: string) {
    // Clear any existing interval
    this.stopStatusMonitoring();

    // Check status every minute
    this.statusCheckInterval = setInterval(async () => {
      const status = await this.getSyncStatus(workspaceId);
      if (status) {
        // Emit custom event for UI updates
        window.dispatchEvent(new CustomEvent('linkedin-sync-status', { 
          detail: status 
        }));
      }
    }, 60000); // Every minute
  }

  /**
   * Stop monitoring sync status
   */
  private stopStatusMonitoring() {
    if (this.statusCheckInterval) {
      clearInterval(this.statusCheckInterval);
      this.statusCheckInterval = null;
    }
  }

  /**
   * Check if background sync is supported (requires Edge Functions)
   */
  async isBackgroundSyncSupported(): Promise<boolean> {
    try {
      // Try to check if the edge function exists
      const { error } = await supabase.functions.invoke('linkedin-background-sync', {
        body: { test: true }
      });
      
      // If we get a specific error about missing parameters, the function exists
      // If we get a 404, the function doesn't exist
      return !error || !error.message?.includes('404');
    } catch (error) {
      console.error('Error checking background sync support:', error);
      return false;
    }
  }

  /**
   * Initialize background sync for a user
   * Called when user logs in or connects LinkedIn
   */
  async initializeForUser(workspaceId?: string, accountId?: string) {
    try {
      // Get workspace and account if not provided
      const wsId = workspaceId || this.getWorkspaceId();
      const accId = accountId || await this.getLinkedInAccountId();

      if (!wsId || !accId) {
        console.warn('Cannot initialize background sync: missing workspace or account');
        return;
      }

      // Check if sync is already enabled
      const status = await this.getSyncStatus(wsId);
      
      if (!status?.isEnabled) {
        // Enable background sync with default settings
        await this.enableBackgroundSync(wsId, accId, 30, 'both');
        console.log('Background sync initialized for user');
      } else {
        console.log('Background sync already enabled');
        // Start monitoring
        this.startStatusMonitoring(wsId);
      }
    } catch (error) {
      console.error('Error initializing background sync:', error);
    }
  }

  /**
   * Get workspace ID from localStorage
   */
  private getWorkspaceId(): string | null {
    try {
      const userProfile = localStorage.getItem('user_auth_profile');
      if (userProfile) {
        const profile = JSON.parse(userProfile);
        return profile.workspace_id;
      }
      return localStorage.getItem('workspace_id');
    } catch (error) {
      console.error('Error getting workspace ID:', error);
      return null;
    }
  }

  /**
   * Get LinkedIn account ID from localStorage
   */
  private async getLinkedInAccountId(): Promise<string | null> {
    try {
      const accounts = JSON.parse(localStorage.getItem('linkedin_accounts') || '[]');
      if (accounts.length > 0) {
        return accounts[0].unipileAccountId || accounts[0].id;
      }
      return null;
    } catch (error) {
      console.error('Error getting LinkedIn account:', error);
      return null;
    }
  }
}

// Export singleton instance
export const backgroundSyncManager = BackgroundSyncManager.getInstance();
export { BackgroundSyncManager };

// Auto-initialize on page load if user is logged in
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    // Delay initialization to allow auth to complete
    setTimeout(() => {
      backgroundSyncManager.initializeForUser();
    }, 3000);
  });
}