/**
 * Inbox Service
 * Handles loading and managing LinkedIn inbox conversations and messages
 */

import { supabase } from '@/integrations/supabase/client';
import { getUserWorkspaceId } from '@/utils/userDataStorage';
import { getDemoWorkspaceId, initSimpleAuth } from '@/utils/simpleAuth';

export interface InboxConversation {
  id: string;
  workspace_id: string;
  platform: string;
  platform_conversation_id: string;
  participant_name: string;
  participant_company?: string;
  participant_avatar_url?: string;
  participant_title?: string;
  status: string;
  last_message_at: string;
  unread_count: number;
  is_starred: boolean;
  is_archived: boolean;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export interface InboxMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  metadata: any;
  created_at: string;
}

export interface InboxStats {
  total_conversations: number;
  unread_conversations: number;
  starred_conversations: number;
  messages_today: number;
  last_sync_at: string | null;
}

class InboxService {
  /**
   * Load all conversations for the current workspace
   */
  async loadConversations(): Promise<InboxConversation[]> {
    try {
      // Initialize demo auth if needed
      await initSimpleAuth();
      
      // Try to get workspace ID, fallback to demo workspace
      let workspaceId = await getUserWorkspaceId();
      if (!workspaceId) {
        workspaceId = getDemoWorkspaceId();
      }

      const { data, error } = await supabase
        .from('inbox_conversations')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('platform', 'linkedin')
        .order('last_message_at', { ascending: false });

      if (error) {
        console.error('Error loading conversations:', error);
        throw error;
      }

      // Transform data to include computed fields
      return (data || []).map(conv => ({
        ...conv,
        unread_count: conv.status === 'unread' ? (conv.metadata?.unread_count || 1) : 0,
        is_starred: conv.metadata?.is_starred || false,
        is_archived: conv.metadata?.is_archived || false
      }));

    } catch (error) {
      console.error('Failed to load conversations:', error);
      throw error;
    }
  }

  /**
   * Load messages for a specific conversation
   */
  async loadMessages(conversationId: string): Promise<InboxMessage[]> {
    try {
      const { data, error } = await supabase
        .from('inbox_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading messages:', error);
        throw error;
      }

      return data || [];

    } catch (error) {
      console.error('Failed to load messages:', error);
      throw error;
    }
  }

  /**
   * Get inbox statistics
   */
  async getInboxStats(): Promise<InboxStats> {
    try {
      // Initialize demo auth if needed
      await initSimpleAuth();
      
      // Try to get workspace ID, fallback to demo workspace
      let workspaceId = await getUserWorkspaceId();
      if (!workspaceId) {
        workspaceId = getDemoWorkspaceId();
      }

      // Get conversation stats
      const { data: conversations, error: convError } = await supabase
        .from('inbox_conversations')
        .select('status, metadata, created_at')
        .eq('workspace_id', workspaceId)
        .eq('platform', 'linkedin');

      if (convError) {
        console.error('Error loading conversation stats:', convError);
        throw convError;
      }

      const stats = {
        total_conversations: conversations?.length || 0,
        unread_conversations: conversations?.filter(c => c.status === 'unread').length || 0,
        starred_conversations: conversations?.filter(c => c.metadata?.is_starred).length || 0,
        messages_today: 0, // Will be calculated from messages
        last_sync_at: null as string | null
      };

      // Get messages sent today
      const today = new Date().toISOString().split('T')[0];
      const { data: todayMessages, error: msgError } = await supabase
        .from('inbox_messages')
        .select('id')
        .gte('created_at', `${today}T00:00:00.000Z`)
        .eq('role', 'user'); // Only outbound messages

      if (!msgError && todayMessages) {
        stats.messages_today = todayMessages.length;
      }

      // Get last sync time
      const { data: syncData, error: syncError } = await supabase
        .from('sync_metadata')
        .select('synced_at')
        .eq('workspace_id', workspaceId)
        .eq('sync_type', 'linkedin_inbox')
        .order('synced_at', { ascending: false })
        .limit(1)
        .single();

      if (!syncError && syncData) {
        stats.last_sync_at = syncData.synced_at;
      }

      return stats;

    } catch (error) {
      console.error('Failed to get inbox stats:', error);
      return {
        total_conversations: 0,
        unread_conversations: 0,
        starred_conversations: 0,
        messages_today: 0,
        last_sync_at: null
      };
    }
  }

  /**
   * Mark conversation as read
   */
  async markAsRead(conversationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('inbox_conversations')
        .update({
          status: 'active',
          metadata: { ...{}, unread_count: 0 },
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId);

      if (error) {
        console.error('Error marking as read:', error);
        throw error;
      }

    } catch (error) {
      console.error('Failed to mark as read:', error);
      throw error;
    }
  }

  /**
   * Toggle star status for conversation
   */
  async toggleStar(conversationId: string, isStarred: boolean): Promise<void> {
    try {
      // First get current metadata
      const { data: current, error: getError } = await supabase
        .from('inbox_conversations')
        .select('metadata')
        .eq('id', conversationId)
        .single();

      if (getError) {
        console.error('Error getting current conversation:', getError);
        throw getError;
      }

      const updatedMetadata = {
        ...(current?.metadata || {}),
        is_starred: isStarred,
        starred_at: isStarred ? new Date().toISOString() : null
      };

      const { error } = await supabase
        .from('inbox_conversations')
        .update({
          metadata: updatedMetadata,
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId);

      if (error) {
        console.error('Error toggling star:', error);
        throw error;
      }

    } catch (error) {
      console.error('Failed to toggle star:', error);
      throw error;
    }
  }

  /**
   * Toggle archive status for conversation
   */
  async toggleArchive(conversationId: string, isArchived: boolean): Promise<void> {
    try {
      // First get current metadata
      const { data: current, error: getError } = await supabase
        .from('inbox_conversations')
        .select('metadata')
        .eq('id', conversationId)
        .single();

      if (getError) {
        console.error('Error getting current conversation:', getError);
        throw getError;
      }

      const updatedMetadata = {
        ...(current?.metadata || {}),
        is_archived: isArchived,
        archived_at: isArchived ? new Date().toISOString() : null
      };

      const { error } = await supabase
        .from('inbox_conversations')
        .update({
          metadata: updatedMetadata,
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId);

      if (error) {
        console.error('Error toggling archive:', error);
        throw error;
      }

    } catch (error) {
      console.error('Failed to toggle archive:', error);
      throw error;
    }
  }

  /**
   * Send a new message to LinkedIn
   */
  async sendMessage(conversationId: string, content: string): Promise<void> {
    try {
      // Add message to local database
      const { error: messageError } = await supabase
        .from('inbox_messages')
        .insert({
          conversation_id: conversationId,
          role: 'user',
          content: content,
          metadata: {
            type: 'outbound',
            sent_via: 'sam_ai_inbox',
            sent_at: new Date().toISOString()
          }
        });

      if (messageError) {
        console.error('Error saving message:', messageError);
        throw messageError;
      }

      // Update conversation last_message_at
      const { error: convError } = await supabase
        .from('inbox_conversations')
        .update({
          last_message_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId);

      if (convError) {
        console.error('Error updating conversation:', convError);
      }

      // TODO: In a real implementation, this would also send via Unipile API
      // For now, we just save locally

    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }

  /**
   * Trigger a manual sync of LinkedIn data
   */
  async triggerSync(): Promise<void> {
    try {
      // Initialize demo auth if needed
      await initSimpleAuth();
      
      // Try to get workspace ID, fallback to demo workspace
      let workspaceId = await getUserWorkspaceId();
      if (!workspaceId) {
        workspaceId = getDemoWorkspaceId();
      }

      // Call the edge function to trigger background sync
      const { data, error } = await supabase.functions.invoke('linkedin-background-sync', {
        body: {
          workspace_id: workspaceId,
          account_id: '4jyMc-EDT1-hE5pOoT7EaQ', // Default account - could be made dynamic
          sync_type: 'both',
          limit: 50
        }
      });

      if (error) {
        console.error('Error triggering sync:', error);
        throw error;
      }

      console.log('✅ Sync triggered successfully:', data);
      
      // Update local sync metadata
      await supabase
        .from('sync_metadata')
        .upsert({
          workspace_id: workspaceId,
          sync_type: 'linkedin_inbox',
          synced_at: new Date().toISOString(),
          total_conversations: data?.contactsSynced || 0,
          preview_conversations: data?.messagesSynced || 0
        }, {
          onConflict: 'workspace_id,sync_type,synced_at'
        });

    } catch (error) {
      console.error('Failed to trigger sync:', error);
      throw error;
    }
  }
}

export const inboxService = new InboxService();