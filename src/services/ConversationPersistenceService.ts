/**
 * Conversation Persistence Service
 * Manages saving and loading SAM AI conversations to/from Supabase
 */

import { supabase } from '@/integrations/supabase/client';

export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'sam' | 'assistant';
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface ConversationData {
  id: string;
  workspace_id: string;
  assistant_id?: string;
  status: 'active' | 'paused' | 'completed' | 'archived';
  context: Record<string, unknown>;
  messages: Message[];
  created_at: string;
  updated_at: string;
}

export class ConversationPersistenceService {
  private static instance: ConversationPersistenceService;

  public static getInstance(): ConversationPersistenceService {
    if (!ConversationPersistenceService.instance) {
      ConversationPersistenceService.instance = new ConversationPersistenceService();
    }
    return ConversationPersistenceService.instance;
  }

  /**
   * Create a new conversation
   */
  async createConversation(workspaceId: string, context: Record<string, unknown> = {}): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          workspace_id: workspaceId,
          assistant_id: null, // SAM AI conversations don't need assistant_id
          status: 'active',
          context: {
            ...context,
            agent_type: 'sam_ai',
            created_by: 'sam_orchestrator'
          }
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error creating conversation:', error);
        return null;
      }

      return data.id;
    } catch (error) {
      console.error('Failed to create conversation:', error);
      return null;
    }
  }

  /**
   * Save a message to conversation
   */
  async saveMessage(conversationId: string, message: Message): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('conversation_messages')
        .insert({
          conversation_id: conversationId,
          role: message.sender === 'sam' ? 'assistant' : message.sender,
          content: message.content,
          metadata: {
            ...message.metadata,
            original_sender: message.sender,
            message_id: message.id,
            timestamp: message.timestamp.toISOString()
          }
        });

      if (error) {
        console.error('Error saving message:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to save message:', error);
      return false;
    }
  }

  /**
   * Save multiple messages in batch
   */
  async saveMessages(conversationId: string, messages: Message[]): Promise<boolean> {
    try {
      const messagesToInsert = messages.map(message => ({
        conversation_id: conversationId,
        role: message.sender === 'sam' ? 'assistant' : message.sender,
        content: message.content,
        metadata: {
          ...message.metadata,
          original_sender: message.sender,
          message_id: message.id,
          timestamp: message.timestamp.toISOString()
        }
      }));

      const { error } = await supabase
        .from('conversation_messages')
        .insert(messagesToInsert);

      if (error) {
        console.error('Error saving messages:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to save messages:', error);
      return false;
    }
  }

  /**
   * Load conversation messages
   */
  async loadConversation(conversationId: string): Promise<Message[] | null> {
    try {
      const { data, error } = await supabase
        .from('conversation_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading conversation:', error);
        return null;
      }

      return data.map(msg => ({
        id: msg.metadata?.message_id || msg.id,
        content: msg.content,
        sender: msg.metadata?.original_sender || (msg.role === 'assistant' ? 'sam' : msg.role),
        timestamp: new Date(msg.metadata?.timestamp || msg.created_at),
        metadata: msg.metadata
      }));
    } catch (error) {
      console.error('Failed to load conversation:', error);
      return null;
    }
  }

  /**
   * Get recent conversations for a workspace
   */
  async getRecentConversations(workspaceId: string, limit: number = 10): Promise<ConversationData[]> {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          id,
          workspace_id,
          assistant_id,
          status,
          context,
          created_at,
          updated_at,
          conversation_messages (
            id,
            role,
            content,
            metadata,
            created_at
          )
        `)
        .eq('workspace_id', workspaceId)
        .eq('status', 'active')
        .order('updated_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error loading conversations:', error);
        return [];
      }

      return data.map(conv => ({
        id: conv.id,
        workspace_id: conv.workspace_id,
        assistant_id: conv.assistant_id,
        status: conv.status,
        context: conv.context,
        messages: conv.conversation_messages.map((msg: any) => ({
          id: msg.metadata?.message_id || msg.id,
          content: msg.content,
          sender: msg.metadata?.original_sender || (msg.role === 'assistant' ? 'sam' : msg.role),
          timestamp: new Date(msg.metadata?.timestamp || msg.created_at),
          metadata: msg.metadata
        })),
        created_at: conv.created_at,
        updated_at: conv.updated_at
      }));
    } catch (error) {
      console.error('Failed to load conversations:', error);
      return [];
    }
  }

  /**
   * Update conversation context
   */
  async updateConversationContext(conversationId: string, context: Record<string, unknown>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({
          context,
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId);

      if (error) {
        console.error('Error updating conversation context:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to update conversation context:', error);
      return false;
    }
  }

  /**
   * Get conversation history for context (last N messages)
   */
  async getConversationHistory(workspaceId: string, messageCount: number = 10): Promise<Message[]> {
    try {
      // Get the most recent active conversation
      const { data: conversations, error: convError } = await supabase
        .from('conversations')
        .select('id')
        .eq('workspace_id', workspaceId)
        .eq('status', 'active')
        .order('updated_at', { ascending: false })
        .limit(1);

      if (convError || !conversations.length) {
        return [];
      }

      const conversationId = conversations[0].id;

      // Get recent messages from that conversation
      const { data: messages, error: msgError } = await supabase
        .from('conversation_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(messageCount);

      if (msgError) {
        console.error('Error loading conversation history:', msgError);
        return [];
      }

      return messages.reverse().map(msg => ({
        id: msg.metadata?.message_id || msg.id,
        content: msg.content,
        sender: msg.metadata?.original_sender || (msg.role === 'assistant' ? 'sam' : msg.role),
        timestamp: new Date(msg.metadata?.timestamp || msg.created_at),
        metadata: msg.metadata
      }));
    } catch (error) {
      console.error('Failed to get conversation history:', error);
      return [];
    }
  }

  /**
   * Close/archive conversation
   */
  async closeConversation(conversationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId);

      if (error) {
        console.error('Error closing conversation:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to close conversation:', error);
      return false;
    }
  }
}

export default ConversationPersistenceService;