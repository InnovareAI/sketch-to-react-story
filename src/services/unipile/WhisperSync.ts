/**
 * WhisperSync - Background sync service for LinkedIn messages
 * Quietly keeps your 500 most recent conversations up to date
 */

import { supabase } from '@/integrations/supabase/client';
import { unipileRealTimeSync } from './UnipileRealTimeSync';

export class WhisperSync {
  private isRunning = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private lastSyncTime: Date | null = null;
  private syncStats = {
    conversationsChecked: 0,
    messagesUpdated: 0,
    newConversations: 0,
    errors: 0
  };

  /**
   * Start the whisper sync service
   */
  start(intervalMinutes: number = 5) {
    if (this.isRunning) {
      console.log('🔇 WhisperSync already running');
      return;
    }

    console.log(`🔇 WhisperSync starting (every ${intervalMinutes} minutes)`);
    this.isRunning = true;

    // Run initial sync
    this.performWhisperSync();

    // Set up interval for background syncing
    this.syncInterval = setInterval(() => {
      this.performWhisperSync();
    }, intervalMinutes * 60 * 1000);
  }

  /**
   * Stop the whisper sync service
   */
  stop() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    this.isRunning = false;
    console.log('🔇 WhisperSync stopped');
  }

  /**
   * Perform a quiet background sync
   */
  private async performWhisperSync() {
    try {
      // Don't show loading indicators or toasts - this is a background operation
      console.log('🔇 WhisperSync: Starting quiet update...');
      
      // Reset stats
      this.syncStats = {
        conversationsChecked: 0,
        messagesUpdated: 0,
        newConversations: 0,
        errors: 0
      };

      // Check if API is configured
      if (!unipileRealTimeSync.isConfigured()) {
        console.log('🔇 WhisperSync: API not configured, skipping');
        return;
      }

      // Get connected accounts
      const result = await unipileRealTimeSync.testConnection();
      if (!result.success || result.accounts.length === 0) {
        console.log('🔇 WhisperSync: No accounts connected');
        return;
      }

      const account = result.accounts[0];
      
      // Fetch only the most recent conversations
      const response = await fetch(
        `https://api6.unipile.com:13670/api/v1/chats?account_id=${account.id}&limit=50`,
        {
          headers: {
            'X-API-KEY': 'aQzsD1+H.EJ60hU0LkPAxRaCU6nlvk3ypn9Rn9BUwqo9LGY24zZU=',
            'Accept': 'application/json'
          }
        }
      );

      if (!response.ok) {
        this.syncStats.errors++;
        return;
      }

      const data = await response.json();
      const recentChats = data.items || [];
      
      // Get workspace
      const { data: workspace } = await supabase
        .from('workspaces')
        .select('id')
        .limit(1)
        .single();
      
      if (!workspace) return;

      // Process only new or updated conversations
      for (const chat of recentChats.slice(0, 20)) { // Check top 20 most recent
        this.syncStats.conversationsChecked++;
        
        // Check if this conversation needs updating
        const { data: existingConv } = await supabase
          .from('inbox_conversations')
          .select('id, last_message_at')
          .eq('platform_conversation_id', chat.id)
          .eq('workspace_id', workspace.id)
          .single();
        
        // Only update if new or has new messages
        if (!existingConv || 
            (chat.timestamp && new Date(chat.timestamp) > new Date(existingConv.last_message_at))) {
          
          if (!existingConv) {
            this.syncStats.newConversations++;
          }
          
          // Fetch and update messages for this conversation
          await this.updateConversation(account.id, chat, workspace.id);
          this.syncStats.messagesUpdated++;
        }
      }

      this.lastSyncTime = new Date();
      
      // Log stats quietly
      if (this.syncStats.messagesUpdated > 0 || this.syncStats.newConversations > 0) {
        console.log(`🔇 WhisperSync complete: ${this.syncStats.newConversations} new, ${this.syncStats.messagesUpdated} updated`);
      }
      
      // Store sync status in localStorage for UI to pick up
      localStorage.setItem('whisper_sync_status', JSON.stringify({
        lastSync: this.lastSyncTime,
        stats: this.syncStats,
        isRunning: this.isRunning
      }));

    } catch (error) {
      console.error('🔇 WhisperSync error:', error);
      this.syncStats.errors++;
    }
  }

  /**
   * Update a single conversation quietly
   */
  private async updateConversation(accountId: string, chat: any, workspaceId: string) {
    try {
      // Fetch recent messages
      const messagesResponse = await fetch(
        `https://api6.unipile.com:13670/api/v1/messages?account_id=${accountId}&chat_id=${chat.id}&limit=10`,
        {
          headers: {
            'X-API-KEY': 'aQzsD1+H.EJ60hU0LkPAxRaCU6nlvk3ypn9Rn9BUwqo9LGY24zZU=',
            'Accept': 'application/json'
          }
        }
      );

      if (!messagesResponse.ok) return;

      const messagesData = await messagesResponse.json();
      const messages = messagesData.items || [];

      // Get participant info
      let participantName = chat.name || 'LinkedIn User';
      if (chat.attendee_provider_id) {
        try {
          const userResponse = await fetch(
            `https://api6.unipile.com:13670/api/v1/users/${chat.attendee_provider_id}?account_id=${accountId}`,
            {
              headers: {
                'X-API-KEY': 'aQzsD1+H.EJ60hU0LkPAxRaCU6nlvk3ypn9Rn9BUwqo9LGY24zZU=',
                'Accept': 'application/json'
              }
            }
          );
          
          if (userResponse.ok) {
            const attendee = await userResponse.json();
            participantName = `${attendee.first_name || ''} ${attendee.last_name || ''}`.trim() || 
                            attendee.name || participantName;
          }
        } catch (e) {
          // Ignore errors - use fallback name
        }
      }

      // Update conversation
      const { data: savedConv } = await supabase
        .from('inbox_conversations')
        .upsert({
          workspace_id: workspaceId,
          platform: 'linkedin',
          platform_conversation_id: chat.id,
          participant_name: participantName,
          participant_company: '',
          status: chat.unread_count > 0 ? 'unread' : 'active',
          last_message_at: chat.timestamp || new Date().toISOString(),
          metadata: {
            unread_count: chat.unread_count || 0,
            whisper_synced: true,
            whisper_sync_time: new Date().toISOString()
          }
        }, {
          onConflict: 'platform_conversation_id,workspace_id'
        })
        .select()
        .single();

      if (savedConv && messages.length > 0) {
        // Clear and re-insert messages
        await supabase
          .from('inbox_messages')
          .delete()
          .eq('conversation_id', savedConv.id);

        const messagesToInsert = messages.map((msg: any, i: number) => ({
          conversation_id: savedConv.id,
          platform_message_id: msg.id || `${chat.id}_msg_${i}`,
          role: msg.is_sender ? 'user' : 'assistant',
          content: msg.text || msg.body || 'No content',
          created_at: msg.timestamp || new Date().toISOString(),
          metadata: {
            sender_name: msg.is_sender ? 'You' : participantName,
            whisper_synced: true
          }
        }));

        await supabase
          .from('inbox_messages')
          .insert(messagesToInsert);
      }

    } catch (error) {
      console.error('🔇 WhisperSync: Error updating conversation:', error);
      this.syncStats.errors++;
    }
  }

  /**
   * Get current sync status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      lastSyncTime: this.lastSyncTime,
      stats: this.syncStats
    };
  }
}

// Export singleton instance
export const whisperSync = new WhisperSync();