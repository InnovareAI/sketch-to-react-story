/**
 * Large Dataset Sync Manager
 * Handles syncing for users with thousands of connections (10k, 20k+)
 * Uses intelligent batching, prioritization, and incremental sync
 */

import { supabase } from '@/integrations/supabase/client';

interface SyncStrategy {
  batchSize: number;
  syncInterval: number;
  maxItemsPerSync: number;
  priorityStrategy: 'recent' | 'engaged' | 'all';
}

interface ConnectionMetrics {
  totalConnections: number;
  activeConnections: number; // Had activity in last 30 days
  recentConnections: number; // Connected in last 7 days
  highEngagement: number;    // Multiple interactions
}

export class LargeDatasetSyncManager {
  private static instance: LargeDatasetSyncManager;
  
  private constructor() {}
  
  static getInstance(): LargeDatasetSyncManager {
    if (!LargeDatasetSyncManager.instance) {
      LargeDatasetSyncManager.instance = new LargeDatasetSyncManager();
    }
    return LargeDatasetSyncManager.instance;
  }

  /**
   * Analyze connection count and determine optimal sync strategy
   */
  async determineSyncStrategy(
    accountId: string,
    totalConnections: number
  ): Promise<SyncStrategy> {
    // For massive datasets (15k+ connections)
    if (totalConnections >= 15000) {
      return {
        batchSize: 50,           // Small batches to avoid timeouts
        syncInterval: 60,         // Sync every hour
        maxItemsPerSync: 200,     // Only sync 200 most important items per cycle
        priorityStrategy: 'engaged' // Focus on engaged connections
      };
    }
    
    // For large datasets (5k-15k connections)
    if (totalConnections >= 5000) {
      return {
        batchSize: 100,
        syncInterval: 45,         // Sync every 45 minutes
        maxItemsPerSync: 500,
        priorityStrategy: 'recent'
      };
    }
    
    // For medium datasets (1k-5k connections)
    if (totalConnections >= 1000) {
      return {
        batchSize: 200,
        syncInterval: 30,
        maxItemsPerSync: 1000,
        priorityStrategy: 'all'
      };
    }
    
    // For small datasets (<1k connections)
    return {
      batchSize: 500,
      syncInterval: 30,
      maxItemsPerSync: 1000,
      priorityStrategy: 'all'
    };
  }

  /**
   * Implement incremental sync with pagination
   */
  async performIncrementalSync(
    workspaceId: string,
    accountId: string,
    lastCursor?: string
  ): Promise<{
    itemsSynced: number;
    nextCursor?: string;
    completed: boolean;
  }> {
    try {
      // Get sync configuration
      const { data: config } = await supabase
        .from('sync_schedules')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('account_id', accountId)
        .single();

      if (!config) {
        throw new Error('No sync configuration found');
      }

      const batchSize = config.batch_size || 100;
      const maxItems = config.max_items_per_sync || 500;
      
      // Call the edge function with pagination
      const { data, error } = await supabase.functions.invoke('linkedin-background-sync', {
        body: {
          workspace_id: workspaceId,
          account_id: accountId,
          sync_type: config.sync_type,
          limit: Math.min(batchSize, maxItems),
          cursor: lastCursor,
          priority_filter: this.getPriorityFilter(workspaceId)
        }
      });

      if (error) throw error;

      // Update sync cursor
      if (data.nextCursor) {
        await supabase
          .from('sync_schedules')
          .update({ 
            last_sync_cursor: data.nextCursor,
            total_items_synced: supabase.sql`total_items_synced + ${data.itemsSynced}`
          })
          .eq('workspace_id', workspaceId)
          .eq('account_id', accountId);
      }

      return {
        itemsSynced: data.itemsSynced || 0,
        nextCursor: data.nextCursor,
        completed: !data.nextCursor || data.itemsSynced < batchSize
      };

    } catch (error) {
      console.error('Incremental sync error:', error);
      throw error;
    }
  }

  /**
   * Get priority filter based on user behavior
   */
  private getPriorityFilter(workspaceId: string): any {
    // Priority rules for 20k+ connection accounts:
    return {
      // 1. Recent conversations (last 7 days)
      recent_activity: 7,
      
      // 2. High engagement contacts (5+ messages)
      min_message_count: 5,
      
      // 3. VIP/tagged contacts
      include_tags: ['vip', 'important', 'client', 'prospect'],
      
      // 4. Contacts with scheduled follow-ups
      has_follow_up: true,
      
      // 5. Skip archived/muted conversations
      exclude_status: ['archived', 'muted', 'spam']
    };
  }

  /**
   * Smart sync scheduler that adapts to data size
   */
  async setupAdaptiveSync(
    workspaceId: string,
    accountId: string
  ): Promise<void> {
    try {
      // First, get connection count
      const metrics = await this.getConnectionMetrics(accountId);
      
      // Determine optimal strategy
      const strategy = await this.determineSyncStrategy(
        accountId,
        metrics.totalConnections
      );

      // Update sync configuration
      await supabase
        .from('sync_schedules')
        .upsert({
          workspace_id: workspaceId,
          account_id: accountId,
          sync_enabled: true,
          sync_interval_minutes: strategy.syncInterval,
          batch_size: strategy.batchSize,
          max_items_per_sync: strategy.maxItemsPerSync,
          sync_type: 'both',
          next_sync_at: new Date(Date.now() + strategy.syncInterval * 60000).toISOString()
        });

      console.log(`📊 Adaptive sync configured for ${metrics.totalConnections} connections:`);
      console.log(`   Batch size: ${strategy.batchSize}`);
      console.log(`   Interval: ${strategy.syncInterval} minutes`);
      console.log(`   Max per sync: ${strategy.maxItemsPerSync}`);
      console.log(`   Strategy: ${strategy.priorityStrategy}`);

      // For very large datasets, show warning
      if (metrics.totalConnections >= 10000) {
        console.warn(`⚠️ Large dataset detected (${metrics.totalConnections} connections)`);
        console.warn('   Sync will prioritize:');
        console.warn('   1. Recent conversations');
        console.warn('   2. High-engagement contacts');
        console.warn('   3. Tagged/VIP contacts');
        console.warn('   Older inactive connections will sync gradually in background');
      }

    } catch (error) {
      console.error('Error setting up adaptive sync:', error);
      throw error;
    }
  }

  /**
   * Get connection metrics for the account
   */
  private async getConnectionMetrics(accountId: string): Promise<ConnectionMetrics> {
    try {
      // This would call Unipile API to get stats
      // For now, return mock data
      const response = await fetch('/.netlify/functions/unipile-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: `/accounts/${accountId}/stats`,
          method: 'GET'
        })
      });

      if (response.ok) {
        const data = await response.json();
        return {
          totalConnections: data.total_connections || 1000,
          activeConnections: data.active_connections || 500,
          recentConnections: data.recent_connections || 100,
          highEngagement: data.high_engagement || 50
        };
      }

      // Fallback metrics
      return {
        totalConnections: 1000,
        activeConnections: 500,
        recentConnections: 100,
        highEngagement: 50
      };

    } catch (error) {
      console.error('Error getting connection metrics:', error);
      // Return conservative defaults
      return {
        totalConnections: 1000,
        activeConnections: 500,
        recentConnections: 100,
        highEngagement: 50
      };
    }
  }

  /**
   * Pause sync for large datasets during peak usage
   */
  async pauseSyncDuringPeakHours(workspaceId: string): Promise<void> {
    const currentHour = new Date().getHours();
    const isPeakHours = currentHour >= 9 && currentHour <= 17; // 9 AM - 5 PM
    
    if (isPeakHours) {
      await supabase
        .from('sync_schedules')
        .update({
          sync_enabled: false,
          next_sync_at: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString() // Resume in 8 hours
        })
        .eq('workspace_id', workspaceId);
        
      console.log('⏸️ Sync paused during peak hours for large dataset');
    }
  }
}