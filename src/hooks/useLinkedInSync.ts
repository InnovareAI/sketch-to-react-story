import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { unipileRealTimeSync } from '@/services/unipile/UnipileRealTimeSync';
import { toast } from 'sonner';

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

  // Check if initial sync has been done
  useEffect(() => {
    checkInitialSyncStatus();
    setupAutoSync();
    
    return () => {
      // Cleanup auto-sync on unmount
      unipileRealTimeSync.stopAutoSync();
    };
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

    // Check user preferences for auto-sync
    const autoSyncPref = localStorage.getItem(`auto_sync_${user.id}`);
    const autoSyncEnabled = autoSyncPref !== 'false'; // Default to true

    if (autoSyncEnabled && unipileRealTimeSync.isConfigured()) {
      // Start auto-sync with 60-minute interval
      unipileRealTimeSync.startAutoSync(60);
      
      setSyncState(prev => ({
        ...prev,
        autoSyncEnabled: true,
        nextSyncTime: new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now
      }));

      console.log('⏰ Auto-sync enabled: Every 60 minutes');
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    localStorage.setItem(`auto_sync_${user.id}`, String(enabled));
    
    if (enabled) {
      unipileRealTimeSync.startAutoSync(60);
      toast.success('Auto-sync enabled (every hour)');
      setSyncState(prev => ({
        ...prev,
        autoSyncEnabled: true,
        nextSyncTime: new Date(Date.now() + 60 * 60 * 1000)
      }));
    } else {
      unipileRealTimeSync.stopAutoSync();
      toast.info('Auto-sync disabled');
      setSyncState(prev => ({
        ...prev,
        autoSyncEnabled: false,
        nextSyncTime: null
      }));
    }
  }, []);

  return {
    syncState,
    performManualSync,
    performInitialSync,
    toggleAutoSync,
    isConfigured: unipileRealTimeSync.isConfigured()
  };
}