/**
 * Global Auto-Sync Service
 * Initializes and maintains auto-sync across the entire application
 * Runs independently of component lifecycle
 */

import { supabase } from '@/integrations/supabase/client';
import { unipileRealTimeSync } from '@/services/unipile/UnipileRealTimeSync';
import { BackgroundSyncManager } from '@/services/BackgroundSyncManager';
import { toast } from 'sonner';

class GlobalAutoSync {
  private static instance: GlobalAutoSync;
  private isInitialized = false;
  private syncInterval: NodeJS.Timeout | null = null;
  
  private constructor() {}
  
  static getInstance(): GlobalAutoSync {
    if (!GlobalAutoSync.instance) {
      GlobalAutoSync.instance = new GlobalAutoSync();
    }
    return GlobalAutoSync.instance;
  }
  
  /**
   * Initialize global auto-sync
   * This should be called once when the app starts
   */
  async initialize() {
    if (this.isInitialized) {
      console.log('🔄 Global auto-sync already initialized');
      return;
    }
    
    console.log('🚀 Initializing global auto-sync...');
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('⚠️ No user found, skipping auto-sync initialization');
      return;
    }
    
    // Get workspace ID
    const workspaceId = localStorage.getItem('workspace_id') || user.user_metadata?.workspace_id;
    if (!workspaceId) {
      console.error('❌ No workspace ID found for auto-sync');
      return;
    }
    
    // Get LinkedIn accounts
    const accounts = JSON.parse(localStorage.getItem('linkedin_accounts') || '[]');
    if (accounts.length === 0) {
      console.log('⚠️ No LinkedIn accounts found, skipping auto-sync');
      return;
    }
    
    const account = accounts[0];
    const accountId = account.unipileAccountId || account.id || account.account_id;
    
    if (!accountId) {
      console.error('❌ No valid account ID found');
      return;
    }
    
    // Configure Unipile if needed
    if (!unipileRealTimeSync.isConfigured()) {
      unipileRealTimeSync.configure({
        apiKey: 'TE3VJJ3-N3E63ND-MWXM462-RBPCWYQ',
        accountId: accountId
      });
    }
    
    // Enable cloud-based background sync
    const backgroundSync = BackgroundSyncManager.getInstance();
    const result = await backgroundSync.enableBackgroundSync(
      workspaceId,
      accountId,
      5, // Sync every 5 minutes
      'both' // Sync both contacts and messages
    );
    
    if (result.success) {
      console.log('✅ Cloud-based background sync enabled');
      
      // Also start client-side sync as backup
      this.startClientSideSync();
      
      this.isInitialized = true;
      
      // Show success message only once
      if (!sessionStorage.getItem('auto_sync_notified')) {
        toast.success('Auto-sync active - syncing every 5 minutes', {
          duration: 5000
        });
        sessionStorage.setItem('auto_sync_notified', 'true');
      }
    } else {
      console.error('❌ Failed to enable cloud sync:', result.error);
      
      // Fallback to client-side sync only
      this.startClientSideSync();
      this.isInitialized = true;
    }
  }
  
  /**
   * Start client-side sync as backup
   * This runs in the browser and continues as long as the app is open
   */
  private startClientSideSync() {
    // Clear any existing interval
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    // Set up sync every 5 minutes
    this.syncInterval = setInterval(async () => {
      console.log('⏰ Running client-side auto-sync...');
      
      try {
        await unipileRealTimeSync.syncAll();
        const status = unipileRealTimeSync.getStatus();
        
        if (status.messagessynced > 0 || status.contactsSynced > 0) {
          console.log(`✅ Synced ${status.messagessynced} messages, ${status.contactsSynced} contacts`);
        }
      } catch (error) {
        console.error('❌ Client-side sync error:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes
    
    console.log('🔄 Client-side auto-sync started (5-minute interval)');
  }
  
  /**
   * Stop auto-sync (should rarely be needed)
   */
  stop() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    this.isInitialized = false;
    console.log('🛑 Global auto-sync stopped');
  }
  
  /**
   * Check if auto-sync is running
   */
  isRunning(): boolean {
    return this.isInitialized;
  }
}

export const globalAutoSync = GlobalAutoSync.getInstance();