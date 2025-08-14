import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { unipileRealTimeSync } from '@/services/unipile/UnipileRealTimeSync';
import { BackgroundSyncManager } from '@/services/BackgroundSyncManager';
import { toast } from 'sonner';
import { getUserLinkedInAccounts, getUserWorkspaceId } from '@/utils/userDataStorage';

interface SyncState {
  isInitialSyncComplete: boolean;
  isSyncing: boolean;
  lastSyncTime: Date | null;
  nextSyncTime: Date | null;
  syncErrors: string[];
  messageCount: number;
  contactCount: number;
  autoSyncEnabled: boolean;
}

export function useLinkedInSync() {
  const [syncState, setSyncState] = useState<SyncState>({
    isInitialSyncComplete: false,
    isSyncing: false,
    lastSyncTime: null,
    nextSyncTime: null,
    syncErrors: [],
    messageCount: 0,
    contactCount: 0,
    autoSyncEnabled: true
  });
  
  const backgroundSync = BackgroundSyncManager.getInstance();

  // Check if initial sync has been done
  useEffect(() => {
    checkInitialSyncStatus();
    setupAutoSync();
    
    // NO CLEANUP - Auto-sync should continue running in background
    // Even when component unmounts or user navigates away
  }, []);

  const checkInitialSyncStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Check localStorage for sync status
    const syncStatus = localStorage.getItem(`linkedin_sync_${user.id}`);
    if (syncStatus) {
      const status = JSON.parse(syncStatus);
      setSyncState(prev => ({
        ...prev,
        isInitialSyncComplete: status.initialSyncComplete || false,
        lastSyncTime: status.lastSyncTime ? new Date(status.lastSyncTime) : null,
        messageCount: status.messageCount || 0,
        contactCount: status.contactCount || 0
      }));
    }

    // Check if we have any data in the database
    const { count: convCount } = await supabase
      .from('inbox_conversations')
      .select('*', { count: 'exact', head: true })
      .eq('platform', 'linkedin');

    if (convCount && convCount > 0) {
      setSyncState(prev => ({
        ...prev,
        isInitialSyncComplete: true
      }));
    } else if (unipileRealTimeSync.isConfigured()) {
      // No data but API configured - trigger initial sync
      console.log('🚀 Triggering initial sync for new user...');
      await performInitialSync();
    }
  };

  const setupAutoSync = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get workspace ID for current user
    const workspaceId = await getUserWorkspaceId();
    if (!workspaceId) {
      console.error('No workspace ID found for background sync setup');
      return;
    }

    // Auto-sync is ALWAYS enabled - no manual sync allowed
    const autoSyncEnabled = true; // Always true, no user preference

    if (autoSyncEnabled && unipileRealTimeSync.isConfigured()) {
      // Get LinkedIn account ID for current user
      const accounts = await getUserLinkedInAccounts();
      if (accounts.length > 0) {
        const account = accounts[0];
        const accountId = account.unipileAccountId || account.id || account.account_id;
        
        if (accountId) {
          // Enable CLOUD-BASED background sync that continues when page is closed
          const result = await backgroundSync.enableBackgroundSync(
            workspaceId,
            accountId,
            5, // Sync every 5 minutes for real-time updates
            'both' // Sync both contacts and messages
          );
          
          if (result.success) {
            console.log('☁️ Cloud-based background sync enabled - will continue even when page is closed');
            toast.success('Auto-sync enabled - messages sync every 5 minutes', {
              duration: 5000
            });
          } else {
            console.error('Failed to enable cloud sync:', result.error);
            // Fallback to browser-based sync
            unipileRealTimeSync.startAutoSync(60);
          }
        }
      }
      
      setSyncState(prev => ({
        ...prev,
        autoSyncEnabled: true,
        nextSyncTime: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes from now
      }));
    }
  };

  const performInitialSync = async () => {
    console.log('🎯 Starting initial full sync...');
    setSyncState(prev => ({ ...prev, isSyncing: true }));
    
    try {
      // Perform comprehensive initial sync
      await unipileRealTimeSync.syncAll();
      const status = unipileRealTimeSync.getStatus();
      
      // Save sync status
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const syncData = {
          initialSyncComplete: true,
          lastSyncTime: new Date().toISOString(),
          messageCount: status.messagessynced,
          contactCount: status.contactsSynced
        };
        localStorage.setItem(`linkedin_sync_${user.id}`, JSON.stringify(syncData));
      }

      setSyncState(prev => ({
        ...prev,
        isInitialSyncComplete: true,
        lastSyncTime: new Date(),
        messageCount: status.messagessynced,
        contactCount: status.contactsSynced,
        syncErrors: status.errors
      }));

      if (status.messagessynced > 0 || status.contactsSynced > 0) {
        toast.success(
          `Initial sync complete! Synced ${status.messagessynced} conversations and ${status.contactsSynced} contacts.`,
          { duration: 5000 }
        );
      }

    } catch (error) {
      console.error('Initial sync failed:', error);
      toast.error('Initial sync failed. Please try again.');
      setSyncState(prev => ({
        ...prev,
        syncErrors: [error instanceof Error ? error.message : 'Unknown error']
      }));
    } finally {
      setSyncState(prev => ({ ...prev, isSyncing: false }));
    }
  };

  const performManualSync = useCallback(async () => {
    console.log('👤 User triggered manual sync...');
    setSyncState(prev => ({ ...prev, isSyncing: true }));
    
    try {
      await unipileRealTimeSync.syncAll();
      const status = unipileRealTimeSync.getStatus();
      
      // Update sync status
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const currentStatus = localStorage.getItem(`linkedin_sync_${user.id}`);
        const statusData = currentStatus ? JSON.parse(currentStatus) : {};
        
        const updatedStatus = {
          ...statusData,
          lastSyncTime: new Date().toISOString(),
          messageCount: status.messagessynced,
          contactCount: status.contactsSynced
        };
        
        localStorage.setItem(`linkedin_sync_${user.id}`, JSON.stringify(updatedStatus));
      }

      setSyncState(prev => ({
        ...prev,
        lastSyncTime: new Date(),
        messageCount: status.messagessynced,
        contactCount: status.contactsSynced,
        syncErrors: status.errors
      }));

      if (status.messagessynced > 0) {
        toast.success(`Synced ${status.messagessynced} new conversations`);
      } else {
        toast.info('No new messages to sync');
      }

    } catch (error) {
      console.error('Manual sync failed:', error);
      toast.error('Sync failed. Please try again.');
      setSyncState(prev => ({
        ...prev,
        syncErrors: [error instanceof Error ? error.message : 'Unknown error']
      }));
    } finally {
      setSyncState(prev => ({ ...prev, isSyncing: false }));
    }
  }, []);

  const toggleAutoSync = useCallback(async (enabled: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No user found for auto-sync toggle');
        return;
      }

      // Get workspace ID
      const workspaceId = localStorage.getItem('workspace_id') || user.user_metadata?.workspace_id;
      if (!workspaceId) {
        console.error('No workspace ID found');
        toast.error('Unable to toggle sync - workspace not found');
        return;
      }

      localStorage.setItem(`auto_sync_${user.id}`, String(enabled));
      
      if (enabled) {
        // Check if unipileRealTimeSync is configured
        if (!unipileRealTimeSync.isConfigured()) {
          console.log('Configuring Unipile for auto-sync...');
          const accounts = JSON.parse(localStorage.getItem('linkedin_accounts') || '[]');
          if (accounts.length > 0) {
            const account = accounts[0];
            const accountId = account.unipileAccountId || account.id || account.account_id;
            if (accountId) {
              unipileRealTimeSync.configure({
                apiKey: 'TE3VJJ3-N3E63ND-MWXM462-RBPCWYQ',
                accountId: accountId
              });
              
              // Enable cloud-based background sync
              const result = await backgroundSync.enableBackgroundSync(
                workspaceId,
                accountId,
                5, // Every 5 minutes
                'both'
              );
              
              if (result.success) {
                toast.success('☁️ Cloud sync enabled - will continue syncing in background');
              }
            }
          }
        } else {
          // Already configured, just enable background sync
          const accounts = JSON.parse(localStorage.getItem('linkedin_accounts') || '[]');
          if (accounts.length > 0) {
            const accountId = accounts[0].unipileAccountId || accounts[0].id;
            await backgroundSync.enableBackgroundSync(workspaceId, accountId, 30, 'both');
          }
        }
        
        setSyncState(prev => ({
          ...prev,
          autoSyncEnabled: true,
          nextSyncTime: new Date(Date.now() + 30 * 60 * 1000)
        }));
      } else {
        // Disable cloud sync
        const accounts = JSON.parse(localStorage.getItem('linkedin_accounts') || '[]');
        if (accounts.length > 0) {
          const accountId = accounts[0].unipileAccountId || accounts[0].id;
          await backgroundSync.disableBackgroundSync(workspaceId, accountId);
        }
        
        unipileRealTimeSync.stopAutoSync();
        toast.info('Cloud sync disabled');
        setSyncState(prev => ({
          ...prev,
          autoSyncEnabled: false,
          nextSyncTime: null
        }));
      }
    } catch (error) {
      console.error('Error toggling auto-sync:', error);
      toast.error('Failed to toggle auto-sync');
    }
  }, [backgroundSync]);

  return {
    syncState,
    performManualSync,
    performInitialSync,
    toggleAutoSync,
    isConfigured: unipileRealTimeSync.isConfigured()
  };
}