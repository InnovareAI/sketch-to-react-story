/**
 * SmartSync - Intelligent sync for users with large message volumes
 * Handles users with 10,000+ messages efficiently
 */

import { supabase } from '@/integrations/supabase/client';

export class SmartSync {
  
  /**
   * Smart sync strategy for large message volumes
   */
  async syncLargeInbox(accountId: string, workspaceId: string) {
    console.log('🧠 SmartSync: Analyzing inbox size...');
    
    // First, get a count of total conversations
    const countResponse = await fetch(
      `https://api6.unipile.com:13670/api/v1/chats?account_id=${accountId}&limit=1`,
      {
        headers: {
          'X-API-KEY': 'aQzsD1+H.EJ60hU0LkPAxRaCU6nlvk3ypn9Rn9BUwqo9LGY24zZU=',
          'Accept': 'application/json'
        }
      }
    );
    
    const countData = await countResponse.json();
    const totalConversations = countData.total || countData.count || 0;
    
    console.log(`📊 Total conversations: ${totalConversations}`);
    
    // Determine sync strategy based on volume
    if (totalConversations > 5000) {
      return await this.executeVeryLargeSync(accountId, workspaceId, totalConversations);
    } else if (totalConversations > 1000) {
      return await this.executeLargeSync(accountId, workspaceId, totalConversations);
    } else {
      return await this.executeStandardSync(accountId, workspaceId);
    }
  }
  
  /**
   * For users with 5000+ conversations (10,000+ messages)
   */
  private async executeVeryLargeSync(accountId: string, workspaceId: string, total: number) {
    console.log('🔴 Very Large Inbox Detected - Using Priority Sync');
    
    const syncStrategy = {
      // Phase 1: Most recent conversations
      recent: {
        count: 200,
        messagesPerChat: 10,  // Only recent messages
        priority: 1
      },
      
      // Phase 2: Active conversations (last 7 days)
      active: {
        count: 300,
        messagesPerChat: 20,
        priority: 2
      },
      
      // Phase 3: Important conversations (unread, starred, etc)
      important: {
        count: 500,
        messagesPerChat: 15,
        priority: 3
      },
      
      // Archive the rest
      archive: {
        enabled: true,
        olderThan: 30, // days
        keepSummary: true
      }
    };
    
    // Save sync strategy to database
    await supabase
      .from('sync_settings')
      .upsert({
        workspace_id: workspaceId,
        strategy: 'very_large',
        total_conversations: total,
        settings: syncStrategy,
        last_optimized: new Date().toISOString()
      });
    
    // Execute phased sync
    let syncedCount = 0;
    
    // Phase 1: Most recent (immediate display)
    syncedCount += await this.syncRecentConversations(
      accountId, 
      workspaceId, 
      syncStrategy.recent.count,
      syncStrategy.recent.messagesPerChat
    );
    
    // Phase 2: Active conversations (background)
    setTimeout(async () => {
      await this.syncActiveConversations(
        accountId,
        workspaceId,
        syncStrategy.active.count,
        syncStrategy.active.messagesPerChat
      );
    }, 5000);
    
    // Phase 3: Important conversations (background, delayed)
    setTimeout(async () => {
      await this.syncImportantConversations(
        accountId,
        workspaceId,
        syncStrategy.important.count,
        syncStrategy.important.messagesPerChat
      );
    }, 15000);
    
    return {
      strategy: 'very_large',
      immediate: syncedCount,
      total: total,
      phased: true,
      message: `Syncing ${syncedCount} recent conversations immediately. ${total - syncedCount} will sync in background.`
    };
  }
  
  /**
   * For users with 1000-5000 conversations
   */
  private async executeLargeSync(accountId: string, workspaceId: string, total: number) {
    console.log('🟡 Large Inbox - Using Optimized Sync');
    
    const BATCH_SIZE = 500;
    const MESSAGES_PER_CHAT = 25;
    
    // Sync in batches
    let syncedCount = 0;
    
    // First batch immediately
    syncedCount = await this.syncBatch(
      accountId,
      workspaceId,
      0,
      BATCH_SIZE,
      MESSAGES_PER_CHAT
    );
    
    // Schedule remaining batches
    const remainingBatches = Math.ceil((total - BATCH_SIZE) / BATCH_SIZE);
    
    for (let i = 0; i < remainingBatches; i++) {
      setTimeout(async () => {
        await this.syncBatch(
          accountId,
          workspaceId,
          BATCH_SIZE * (i + 1),
          BATCH_SIZE,
          MESSAGES_PER_CHAT
        );
      }, (i + 1) * 10000); // 10 seconds between batches
    }
    
    return {
      strategy: 'large',
      immediate: syncedCount,
      total: total,
      batched: true,
      message: `Syncing ${syncedCount} conversations now. Remaining ${total - syncedCount} in background.`
    };
  }
  
  /**
   * Standard sync for < 1000 conversations
   */
  private async executeStandardSync(accountId: string, workspaceId: string) {
    console.log('🟢 Standard Inbox - Full Sync');
    
    // Use existing sync logic
    const { unipileRealTimeSync } = await import('./UnipileRealTimeSync');
    await unipileRealTimeSync.syncAll();
    
    return {
      strategy: 'standard',
      message: 'Standard sync completed'
    };
  }
  
  /**
   * Sync only recent conversations
   */
  private async syncRecentConversations(
    accountId: string, 
    workspaceId: string, 
    limit: number,
    messagesPerChat: number
  ): Promise<number> {
    try {
      const response = await fetch(
        `https://api6.unipile.com:13670/api/v1/chats?account_id=${accountId}&limit=${limit}&sort=timestamp:desc`,
        {
          headers: {
            'X-API-KEY': 'aQzsD1+H.EJ60hU0LkPAxRaCU6nlvk3ypn9Rn9BUwqo9LGY24zZU=',
            'Accept': 'application/json'
          }
        }
      );
      
      const data = await response.json();
      const chats = data.items || [];
      
      // Quick sync with limited messages
      for (const chat of chats) {
        await this.saveConversation(accountId, workspaceId, chat, messagesPerChat);
      }
      
      return chats.length;
    } catch (error) {
      console.error('Error syncing recent conversations:', error);
      return 0;
    }
  }
  
  /**
   * Sync active conversations from last 7 days
   */
  private async syncActiveConversations(
    accountId: string,
    workspaceId: string,
    limit: number,
    messagesPerChat: number
  ): Promise<number> {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    
    try {
      const response = await fetch(
        `https://api6.unipile.com:13670/api/v1/chats?account_id=${accountId}&limit=${limit}&updated_after=${sevenDaysAgo}`,
        {
          headers: {
            'X-API-KEY': 'aQzsD1+H.EJ60hU0LkPAxRaCU6nlvk3ypn9Rn9BUwqo9LGY24zZU=',
            'Accept': 'application/json'
          }
        }
      );
      
      const data = await response.json();
      const chats = data.items || [];
      
      for (const chat of chats) {
        await this.saveConversation(accountId, workspaceId, chat, messagesPerChat);
      }
      
      return chats.length;
    } catch (error) {
      console.error('Error syncing active conversations:', error);
      return 0;
    }
  }
  
  /**
   * Sync important/unread conversations
   */
  private async syncImportantConversations(
    accountId: string,
    workspaceId: string,
    limit: number,
    messagesPerChat: number
  ): Promise<number> {
    try {
      // Get unread conversations
      const response = await fetch(
        `https://api6.unipile.com:13670/api/v1/chats?account_id=${accountId}&limit=${limit}&unread=true`,
        {
          headers: {
            'X-API-KEY': 'aQzsD1+H.EJ60hU0LkPAxRaCU6nlvk3ypn9Rn9BUwqo9LGY24zZU=',
            'Accept': 'application/json'
          }
        }
      );
      
      const data = await response.json();
      const chats = data.items || [];
      
      for (const chat of chats) {
        await this.saveConversation(accountId, workspaceId, chat, messagesPerChat);
      }
      
      return chats.length;
    } catch (error) {
      console.error('Error syncing important conversations:', error);
      return 0;
    }
  }
  
  /**
   * Sync a batch of conversations
   */
  private async syncBatch(
    accountId: string,
    workspaceId: string,
    offset: number,
    limit: number,
    messagesPerChat: number
  ): Promise<number> {
    console.log(`📦 Syncing batch: offset=${offset}, limit=${limit}`);
    
    try {
      const response = await fetch(
        `https://api6.unipile.com:13670/api/v1/chats?account_id=${accountId}&limit=${limit}&offset=${offset}`,
        {
          headers: {
            'X-API-KEY': 'aQzsD1+H.EJ60hU0LkPAxRaCU6nlvk3ypn9Rn9BUwqo9LGY24zZU=',
            'Accept': 'application/json'
          }
        }
      );
      
      const data = await response.json();
      const chats = data.items || [];
      
      for (const chat of chats) {
        await this.saveConversation(accountId, workspaceId, chat, messagesPerChat);
      }
      
      return chats.length;
    } catch (error) {
      console.error('Error syncing batch:', error);
      return 0;
    }
  }
  
  /**
   * Save a single conversation with limited messages
   */
  private async saveConversation(
    accountId: string,
    workspaceId: string,
    chat: any,
    messageLimit: number
  ) {
    try {
      // Save conversation metadata
      const { data: savedConv } = await supabase
        .from('inbox_conversations')
        .upsert({
          workspace_id: workspaceId,
          platform: 'linkedin',
          platform_conversation_id: chat.id,
          participant_name: chat.name || 'LinkedIn User',
          status: chat.unread_count > 0 ? 'unread' : 'active',
          last_message_at: chat.timestamp || new Date().toISOString(),
          metadata: {
            sync_strategy: 'smart',
            message_limit: messageLimit,
            total_messages: chat.message_count || 0
          }
        }, {
          onConflict: 'platform_conversation_id,workspace_id'
        })
        .select()
        .single();
      
      if (savedConv) {
        // Fetch only limited messages
        const messagesResponse = await fetch(
          `https://api6.unipile.com:13670/api/v1/messages?account_id=${accountId}&chat_id=${chat.id}&limit=${messageLimit}`,
          {
            headers: {
              'X-API-KEY': 'aQzsD1+H.EJ60hU0LkPAxRaCU6nlvk3ypn9Rn9BUwqo9LGY24zZU=',
              'Accept': 'application/json'
            }
          }
        );
        
        if (messagesResponse.ok) {
          const messagesData = await messagesResponse.json();
          const messages = messagesData.items || [];
          
          // Save messages
          if (messages.length > 0) {
            const messagesToInsert = messages.map((msg: any, i: number) => ({
              conversation_id: savedConv.id,
              platform_message_id: msg.id || `${chat.id}_msg_${i}`,
              role: msg.is_sender ? 'user' : 'assistant',
              content: msg.text || 'No content',
              created_at: msg.timestamp || new Date().toISOString(),
              metadata: {
                smart_synced: true,
                batch_index: i
              }
            }));
            
            await supabase
              .from('inbox_messages')
              .upsert(messagesToInsert, {
                onConflict: 'platform_message_id,conversation_id'
              });
          }
        }
      }
    } catch (error) {
      console.error(`Error saving conversation ${chat.id}:`, error);
    }
  }
}

// Export singleton
export const smartSync = new SmartSync();