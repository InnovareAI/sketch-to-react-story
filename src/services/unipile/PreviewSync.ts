/**
 * PreviewSync - Efficient sync with preview-only for older messages
 * Full sync for recent 500 conversations, preview-only for older
 */

import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export class PreviewSync {
  private readonly FULL_SYNC_LIMIT = 500;
  private readonly PREVIEW_SYNC_LIMIT = 2000; // Next 2000 as previews only
  private readonly MESSAGES_PER_RECENT = 50;  // Full messages for recent
  private readonly MESSAGES_PER_OLD = 1;      // Only last message for old

  /**
   * Smart sync with preview mode for older conversations
   */
  async syncWithPreviews(accountId: string, workspaceId: string) {
    console.log('📋 Starting Preview Sync Strategy...');
    
    const syncResults = {
      fullSync: 0,
      previewOnly: 0,
      totalConversations: 0,
      storageUsed: 0
    };

    try {
      // Phase 1: Full sync for recent 500 conversations
      console.log(`✨ Phase 1: Full sync for ${this.FULL_SYNC_LIMIT} recent conversations`);
      syncResults.fullSync = await this.syncFullConversations(
        accountId, 
        workspaceId, 
        this.FULL_SYNC_LIMIT
      );
      
      // Phase 2: Preview-only for older conversations
      console.log(`👁️ Phase 2: Preview-only for older conversations`);
      syncResults.previewOnly = await this.syncPreviewConversations(
        accountId,
        workspaceId,
        this.FULL_SYNC_LIMIT, // Start after the full sync
        this.PREVIEW_SYNC_LIMIT
      );
      
      syncResults.totalConversations = syncResults.fullSync + syncResults.previewOnly;
      
      // Calculate approximate storage
      syncResults.storageUsed = this.calculateStorage(syncResults);
      
      // Save sync metadata
      await this.saveSyncMetadata(workspaceId, syncResults);
      
      console.log('📊 Sync Results:', syncResults);
      
      return syncResults;
      
    } catch (error) {
      console.error('Preview sync error:', error);
      throw error;
    }
  }

  /**
   * Full sync for recent conversations
   */
  private async syncFullConversations(
    accountId: string, 
    workspaceId: string, 
    limit: number
  ): Promise<number> {
    const response = await fetch(
      `https://api6.unipile.com:13670/api/v1/chats?account_id=${accountId}&limit=${limit}`,
      {
        headers: {
          'X-API-KEY': 'aQzsD1+H.EJ60hU0LkPAxRaCU6nlvk3ypn9Rn9BUwqo9LGY24zZU=',
          'Accept': 'application/json'
        }
      }
    );
    
    const data = await response.json();
    const chats = data.items || [];
    let synced = 0;
    
    for (const chat of chats) {
      await this.saveFullConversation(accountId, workspaceId, chat);
      synced++;
      
      // Show progress every 50 conversations
      if (synced % 50 === 0) {
        console.log(`   📦 Full sync progress: ${synced}/${limit}`);
      }
    }
    
    return synced;
  }

  /**
   * Preview-only sync for older conversations
   */
  private async syncPreviewConversations(
    accountId: string,
    workspaceId: string,
    offset: number,
    limit: number
  ): Promise<number> {
    const response = await fetch(
      `https://api6.unipile.com:13670/api/v1/chats?account_id=${accountId}&offset=${offset}&limit=${limit}`,
      {
        headers: {
          'X-API-KEY': 'aQzsD1+H.EJ60hU0LkPAxRaCU6nlvk3ypn9Rn9BUwqo9LGY24zZU=',
          'Accept': 'application/json'
        }
      }
    );
    
    const data = await response.json();
    const chats = data.items || [];
    let synced = 0;
    
    for (const chat of chats) {
      await this.savePreviewConversation(accountId, workspaceId, chat);
      synced++;
      
      // Show progress every 100 conversations
      if (synced % 100 === 0) {
        console.log(`   👁️ Preview sync progress: ${synced}/${limit}`);
      }
    }
    
    return synced;
  }

  /**
   * Save full conversation with all messages
   */
  private async saveFullConversation(
    accountId: string,
    workspaceId: string,
    chat: any
  ) {
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
          const user = await userResponse.json();
          participantName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.name || participantName;
        }
      } catch (e) {
        // Use fallback name
      }
    }
    
    // Save conversation
    const { data: savedConv } = await supabase
      .from('inbox_conversations')
      .upsert({
        workspace_id: workspaceId,
        platform: 'linkedin',
        platform_conversation_id: chat.id,
        participant_name: participantName,
        participant_company: chat.company || '',
        participant_avatar_url: chat.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${participantName}`,
        status: chat.unread_count > 0 ? 'unread' : 'active',
        last_message_at: chat.timestamp || new Date().toISOString(),
        metadata: {
          sync_type: 'full',
          total_messages: chat.message_count || 0,
          unread_count: chat.unread_count || 0
        }
      }, {
        onConflict: 'platform_conversation_id,workspace_id'
      })
      .select()
      .single();
    
    if (savedConv) {
      // Fetch all recent messages
      const messagesResponse = await fetch(
        `https://api6.unipile.com:13670/api/v1/messages?account_id=${accountId}&chat_id=${chat.id}&limit=${this.MESSAGES_PER_RECENT}`,
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
        
        if (messages.length > 0) {
          // Clear old messages
          await supabase
            .from('inbox_messages')
            .delete()
            .eq('conversation_id', savedConv.id);
          
          // Insert all messages
          const messagesToInsert = messages.map((msg: any, i: number) => ({
            conversation_id: savedConv.id,
            platform_message_id: msg.id || `${chat.id}_msg_${i}`,
            role: msg.is_sender ? 'user' : 'assistant',
            content: msg.text || msg.body || 'No content',
            created_at: msg.timestamp || new Date().toISOString(),
            metadata: {
              sender_name: msg.is_sender ? 'You' : participantName,
              sync_type: 'full',
              message_index: i
            }
          }));
          
          await supabase
            .from('inbox_messages')
            .insert(messagesToInsert);
        }
      }
    }
  }

  /**
   * Save preview-only conversation (just metadata and last message)
   */
  private async savePreviewConversation(
    accountId: string,
    workspaceId: string,
    chat: any
  ) {
    // Get basic participant info from chat data
    const participantName = chat.name || chat.subject || 'LinkedIn User';
    
    // Save conversation with preview flag
    const { data: savedConv } = await supabase
      .from('inbox_conversations')
      .upsert({
        workspace_id: workspaceId,
        platform: 'linkedin',
        platform_conversation_id: chat.id,
        participant_name: participantName,
        participant_company: chat.company || '',
        participant_avatar_url: chat.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${participantName}`,
        status: chat.unread_count > 0 ? 'unread' : 'active',
        last_message_at: chat.timestamp || new Date().toISOString(),
        metadata: {
          sync_type: 'preview',
          total_messages: chat.message_count || 0,
          unread_count: chat.unread_count || 0,
          preview_only: true,
          last_message_preview: chat.last_message?.text || chat.snippet || ''
        }
      }, {
        onConflict: 'platform_conversation_id,workspace_id'
      })
      .select()
      .single();
    
    if (savedConv) {
      // Save ONLY the last message as preview
      if (chat.last_message || chat.snippet) {
        await supabase
          .from('inbox_messages')
          .upsert({
            conversation_id: savedConv.id,
            platform_message_id: `${chat.id}_preview`,
            role: 'assistant',
            content: chat.last_message?.text || chat.snippet || 'No preview available',
            created_at: chat.timestamp || new Date().toISOString(),
            metadata: {
              is_preview: true,
              needs_full_load: true,
              total_messages: chat.message_count || 0
            }
          }, {
            onConflict: 'platform_message_id,conversation_id'
          });
      }
    }
  }

  /**
   * Load full messages for a preview conversation on-demand
   */
  async loadFullConversation(conversationId: string, chatId: string, accountId: string) {
    console.log(`📥 Loading full conversation for ${chatId}...`);
    
    try {
      // Show loading indicator
      toast.info('Loading full conversation...');
      
      // Fetch all messages
      const messagesResponse = await fetch(
        `https://api6.unipile.com:13670/api/v1/messages?account_id=${accountId}&chat_id=${chatId}&limit=100`,
        {
          headers: {
            'X-API-KEY': 'aQzsD1+H.EJ60hU0LkPAxRaCU6nlvk3ypn9Rn9BUwqo9LGY24zZU=',
            'Accept': 'application/json'
          }
        }
      );
      
      if (!messagesResponse.ok) {
        throw new Error('Failed to load messages');
      }
      
      const messagesData = await messagesResponse.json();
      const messages = messagesData.items || [];
      
      // Clear preview message
      await supabase
        .from('inbox_messages')
        .delete()
        .eq('conversation_id', conversationId)
        .eq('metadata->is_preview', true);
      
      // Insert full messages
      if (messages.length > 0) {
        const messagesToInsert = messages.map((msg: any, i: number) => ({
          conversation_id: conversationId,
          platform_message_id: msg.id || `${chatId}_msg_${i}`,
          role: msg.is_sender ? 'user' : 'assistant',
          content: msg.text || msg.body || 'No content',
          created_at: msg.timestamp || new Date().toISOString(),
          metadata: {
            sync_type: 'on_demand',
            message_index: i
          }
        }));
        
        await supabase
          .from('inbox_messages')
          .insert(messagesToInsert);
        
        // Update conversation metadata
        await supabase
          .from('inbox_conversations')
          .update({
            metadata: {
              sync_type: 'full',
              preview_only: false,
              last_full_load: new Date().toISOString()
            }
          })
          .eq('id', conversationId);
        
        toast.success(`Loaded ${messages.length} messages`);
        return messages;
      }
      
      toast.warning('No messages found');
      return [];
      
    } catch (error) {
      console.error('Error loading full conversation:', error);
      toast.error('Failed to load conversation');
      return [];
    }
  }

  /**
   * Calculate storage used
   */
  private calculateStorage(results: any): number {
    // Approximate calculation
    const fullStorage = results.fullSync * 50 * 1; // 500 convos * 50 messages * 1KB
    const previewStorage = results.previewOnly * 1 * 1; // 2000 convos * 1 message * 1KB
    return (fullStorage + previewStorage) / 1024; // Return in MB
  }

  /**
   * Save sync metadata
   */
  private async saveSyncMetadata(workspaceId: string, results: any) {
    await supabase
      .from('sync_metadata')
      .upsert({
        workspace_id: workspaceId,
        sync_type: 'preview_sync',
        full_conversations: results.fullSync,
        preview_conversations: results.previewOnly,
        total_conversations: results.totalConversations,
        storage_mb: results.storageUsed,
        synced_at: new Date().toISOString()
      });
  }
}

// Export singleton
export const previewSync = new PreviewSync();