import { useState, useEffect } from 'react';
import { previewSync } from '@/services/unipile/PreviewSync';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function usePreviewSync() {
  const [syncStats, setSyncStats] = useState({
    fullSyncCount: 0,
    previewOnlyCount: 0,
    totalConversations: 0,
    storageUsedMB: 0,
    lastSyncTime: null as Date | null
  });
  
  const [isSyncing, setIsSyncing] = useState(false);

  // Load sync stats from database
  const loadSyncStats = async () => {
    try {
      const { data: workspace } = await supabase
        .from('workspaces')
        .select('id')
        .limit(1)
        .single();
        
      if (!workspace) return;
      
      const { data: metadata } = await supabase
        .from('sync_metadata')
        .select('*')
        .eq('workspace_id', workspace.id)
        .eq('sync_type', 'preview_sync')
        .order('synced_at', { ascending: false })
        .limit(1)
        .single();
        
      if (metadata) {
        setSyncStats({
          fullSyncCount: metadata.full_conversations || 0,
          previewOnlyCount: metadata.preview_conversations || 0,
          totalConversations: metadata.total_conversations || 0,
          storageUsedMB: metadata.storage_mb || 0,
          lastSyncTime: metadata.synced_at ? new Date(metadata.synced_at) : null
        });
      }
    } catch (error) {
      console.error('Error loading sync stats:', error);
    }
  };

  // Perform preview sync
  const performPreviewSync = async () => {
    if (isSyncing) return;
    
    setIsSyncing(true);
    toast.info('Starting preview sync...');
    
    try {
      // Get workspace and account
      const { data: workspace } = await supabase
        .from('workspaces')
        .select('id')
        .limit(1)
        .single();
        
      if (!workspace) {
        throw new Error('No workspace found');
      }
      
      // Get Unipile account
      const { unipileRealTimeSync } = await import('@/services/unipile/UnipileRealTimeSync');
      const accounts = await unipileRealTimeSync.testConnection();
      
      if (!accounts.success || accounts.accounts.length === 0) {
        throw new Error('No LinkedIn account connected');
      }
      
      const account = accounts.accounts[0];
      
      // Perform the preview sync
      const results = await previewSync.syncWithPreviews(
        account.id,
        workspace.id
      );
      
      // Update stats
      setSyncStats({
        fullSyncCount: results.fullSync,
        previewOnlyCount: results.previewOnly,
        totalConversations: results.totalConversations,
        storageUsedMB: results.storageUsed,
        lastSyncTime: new Date()
      });
      
      toast.success(
        `Sync complete! ${results.fullSync} full + ${results.previewOnly} preview conversations`
      );
      
    } catch (error) {
      console.error('Preview sync error:', error);
      toast.error('Failed to perform preview sync');
    } finally {
      setIsSyncing(false);
    }
  };

  // Load stats on mount
  useEffect(() => {
    loadSyncStats();
  }, []);

  return {
    syncStats,
    isSyncing,
    performPreviewSync,
    refreshStats: loadSyncStats
  };
}