/**
 * Campaign-Unipile Integration Service
 * Handles sending campaign messages through Unipile and tracking responses
 */

import { supabase } from '@/integrations/supabase/client';
import { unipileService } from './UnipileService';

export interface CampaignMessage {
  id: string;
  campaign_id: string;
  recipient_profile_url: string;
  recipient_name?: string;
  message_content: string;
  message_sequence_step: number;
  scheduled_at?: string;
  sent_at?: string;
  status: 'scheduled' | 'sent' | 'delivered' | 'failed' | 'replied';
  linkedin_account_id: string;
  response_received?: boolean;
  response_content?: string;
  response_received_at?: string;
}

export interface CampaignStats {
  total_sent: number;
  total_delivered: number;
  total_replied: number;
  reply_rate: number;
  pending_messages: number;
  failed_messages: number;
}

class CampaignUnipileIntegration {
  /**
   * Send a campaign message through Unipile
   */
  async sendCampaignMessage(
    campaignId: string,
    linkedInAccountId: string,
    recipientUrl: string,
    messageContent: string,
    sequenceStep: number = 1
  ): Promise<CampaignMessage> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Create message record first
      const messageId = crypto.randomUUID();
      const message: CampaignMessage = {
        id: messageId,
        campaign_id: campaignId,
        recipient_profile_url: recipientUrl,
        message_content: messageContent,
        message_sequence_step: sequenceStep,
        scheduled_at: new Date().toISOString(),
        status: 'scheduled',
        linkedin_account_id: linkedInAccountId
      };

      // Store in database
      const { error: dbError } = await supabase
        .from('campaign_messages')
        .insert({
          id: message.id,
          campaign_id: message.campaign_id,
          recipient_profile_url: message.recipient_profile_url,
          message_content: message.message_content,
          message_sequence_step: message.message_sequence_step,
          scheduled_at: message.scheduled_at,
          status: message.status,
          linkedin_account_id: message.linkedin_account_id,
          user_id: user.id
        });

      if (dbError) throw dbError;

      // Send through Unipile
      try {
        await unipileService.sendMessageWithTracking(
          linkedInAccountId,
          recipientUrl,
          messageContent,
          campaignId
        );

        // Update status to sent
        message.sent_at = new Date().toISOString();
        message.status = 'sent';

        await supabase
          .from('campaign_messages')
          .update({
            sent_at: message.sent_at,
            status: message.status
          })
          .eq('id', message.id);

        // Update campaign stats
        await this.updateCampaignStats(campaignId);

        return message;

      } catch (sendError) {
        // Update status to failed
        message.status = 'failed';
        await supabase
          .from('campaign_messages')
          .update({ status: 'failed' })
          .eq('id', message.id);

        throw sendError;
      }

    } catch (error) {
      console.error('Error sending campaign message:', error);
      throw error;
    }
  }

  /**
   * Send bulk campaign messages with rate limiting
   */
  async sendBulkCampaignMessages(
    campaignId: string,
    messages: Array<{
      linkedInAccountId: string;
      recipientUrl: string;
      recipientName?: string;
      messageContent: string;
      sequenceStep?: number;
    }>,
    rateLimitPerHour: number = 50
  ): Promise<{
    sent: CampaignMessage[];
    failed: Array<{ message: any; error: string }>;
  }> {
    const sent: CampaignMessage[] = [];
    const failed: Array<{ message: any; error: string }> = [];

    const delayBetweenMessages = Math.ceil((60 * 60 * 1000) / rateLimitPerHour); // ms delay

    for (let i = 0; i < messages.length; i++) {
      const messageData = messages[i];
      
      try {
        const sentMessage = await this.sendCampaignMessage(
          campaignId,
          messageData.linkedInAccountId,
          messageData.recipientUrl,
          messageData.messageContent,
          messageData.sequenceStep || 1
        );
        
        sent.push(sentMessage);
        
        // Rate limiting delay (except for last message)
        if (i < messages.length - 1) {
          await new Promise(resolve => setTimeout(resolve, delayBetweenMessages));
        }
        
      } catch (error) {
        failed.push({
          message: messageData,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return { sent, failed };
  }

  /**
   * Check for new responses and update message status
   */
  async checkForResponses(campaignId: string, linkedInAccountId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get all sent messages for this campaign
      const { data: campaignMessages, error: messagesError } = await supabase
        .from('campaign_messages')
        .select('*')
        .eq('campaign_id', campaignId)
        .eq('linkedin_account_id', linkedInAccountId)
        .eq('status', 'sent');

      if (messagesError) throw messagesError;

      // Sync messages from Unipile to get latest responses
      await unipileService.syncMessagesToDatabase(linkedInAccountId);

      // Check each campaign message for responses
      for (const campaignMsg of campaignMessages || []) {
        const { data: responses, error: responseError } = await supabase
          .from('conversation_messages')
          .select('*')
          .eq('campaign_id', campaignId)
          .eq('direction', 'inbound')
          .gte('sent_at', campaignMsg.sent_at)
          .order('sent_at', { ascending: false })
          .limit(1);

        if (responseError) continue;

        if (responses && responses.length > 0) {
          const latestResponse = responses[0];
          
          // Update campaign message status
          await supabase
            .from('campaign_messages')
            .update({
              status: 'replied',
              response_received: true,
              response_content: latestResponse.content,
              response_received_at: latestResponse.sent_at
            })
            .eq('id', campaignMsg.id);
        }
      }

      // Update campaign stats
      await this.updateCampaignStats(campaignId);

    } catch (error) {
      console.error('Error checking for responses:', error);
      throw error;
    }
  }

  /**
   * Get campaign statistics
   */
  async getCampaignStats(campaignId: string): Promise<CampaignStats> {
    try {
      const { data: messages, error } = await supabase
        .from('campaign_messages')
        .select('status')
        .eq('campaign_id', campaignId);

      if (error) throw error;

      const stats = (messages || []).reduce(
        (acc, msg) => {
          switch (msg.status) {
            case 'sent':
            case 'delivered':
              acc.total_sent++;
              if (msg.status === 'delivered') acc.total_delivered++;
              break;
            case 'replied':
              acc.total_sent++;
              acc.total_delivered++;
              acc.total_replied++;
              break;
            case 'failed':
              acc.failed_messages++;
              break;
            case 'scheduled':
              acc.pending_messages++;
              break;
          }
          return acc;
        },
        {
          total_sent: 0,
          total_delivered: 0,
          total_replied: 0,
          reply_rate: 0,
          pending_messages: 0,
          failed_messages: 0
        }
      );

      stats.reply_rate = stats.total_sent > 0 ? (stats.total_replied / stats.total_sent) * 100 : 0;

      return stats;
    } catch (error) {
      console.error('Error getting campaign stats:', error);
      return {
        total_sent: 0,
        total_delivered: 0,
        total_replied: 0,
        reply_rate: 0,
        pending_messages: 0,
        failed_messages: 0
      };
    }
  }

  /**
   * Update campaign statistics in database
   */
  private async updateCampaignStats(campaignId: string): Promise<void> {
    try {
      const stats = await this.getCampaignStats(campaignId);
      
      await supabase
        .from('campaigns')
        .update({
          messages_sent: stats.total_sent,
          responses_received: stats.total_replied,
          response_rate: stats.reply_rate,
          updated_at: new Date().toISOString()
        })
        .eq('id', campaignId);

    } catch (error) {
      console.error('Error updating campaign stats:', error);
    }
  }

  /**
   * Schedule campaign message sequence
   */
  async scheduleCampaignSequence(
    campaignId: string,
    recipientUrl: string,
    linkedInAccountId: string,
    messageSequence: Array<{
      content: string;
      delayHours: number;
      step: number;
    }>
  ): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      let scheduleTime = new Date();

      for (const message of messageSequence) {
        // Schedule each message with appropriate delay
        scheduleTime = new Date(scheduleTime.getTime() + (message.delayHours * 60 * 60 * 1000));

        await supabase
          .from('campaign_messages')
          .insert({
            id: crypto.randomUUID(),
            campaign_id: campaignId,
            recipient_profile_url: recipientUrl,
            message_content: message.content,
            message_sequence_step: message.step,
            scheduled_at: scheduleTime.toISOString(),
            status: 'scheduled',
            linkedin_account_id: linkedInAccountId,
            user_id: user.id
          });
      }

    } catch (error) {
      console.error('Error scheduling campaign sequence:', error);
      throw error;
    }
  }

  /**
   * Process scheduled messages
   */
  async processScheduledMessages(): Promise<void> {
    try {
      const now = new Date().toISOString();
      
      // Get all scheduled messages that are ready to send
      const { data: scheduledMessages, error } = await supabase
        .from('campaign_messages')
        .select('*')
        .eq('status', 'scheduled')
        .lte('scheduled_at', now)
        .limit(50); // Process in batches

      if (error) throw error;

      for (const message of scheduledMessages || []) {
        try {
          await unipileService.sendMessageWithTracking(
            message.linkedin_account_id,
            message.recipient_profile_url,
            message.message_content,
            message.campaign_id
          );

          // Update status
          await supabase
            .from('campaign_messages')
            .update({
              sent_at: new Date().toISOString(),
              status: 'sent'
            })
            .eq('id', message.id);

        } catch (sendError) {
          console.error(`Failed to send scheduled message ${message.id}:`, sendError);
          
          await supabase
            .from('campaign_messages')
            .update({ status: 'failed' })
            .eq('id', message.id);
        }
      }

    } catch (error) {
      console.error('Error processing scheduled messages:', error);
    }
  }
}

// Export singleton instance
export const campaignUnipileIntegration = new CampaignUnipileIntegration();
export default campaignUnipileIntegration;