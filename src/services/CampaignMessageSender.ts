/**
 * Campaign Message Sender
 * Quick integration to send campaign messages via Unipile
 */

import { campaignUnipileIntegration } from './unipile/CampaignUnipileIntegration';
import { unipileService } from './unipile/UnipileService';
import { campaignService, type CampaignStep } from './campaignService';

export interface MessageSendOptions {
  campaignId: string;
  recipientLinkedInUrl: string;
  recipientName?: string;
  stepIndex?: number;
  linkedInAccountId?: string;
}

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  sentAt?: string;
  content?: string;
}

export class CampaignMessageSender {
  /**
   * Send a single message from campaign template
   */
  async sendMessage(options: MessageSendOptions): Promise<SendResult> {
    try {
      // Get campaign data
      const campaign = await campaignService.getCampaign(options.campaignId);
      if (!campaign) {
        return {
          success: false,
          error: 'Campaign not found'
        };
      }

      // Get message template from campaign steps
      const steps = campaign.messaging_sequence || [];
      const stepIndex = options.stepIndex || 0;
      const step = steps[stepIndex];

      if (!step) {
        return {
          success: false,
          error: `No message template found for step ${stepIndex + 1}`
        };
      }

      // Personalize message content
      const personalizedContent = this.personalizeMessage(step.content, {
        first_name: this.extractFirstName(options.recipientName),
        last_name: this.extractLastName(options.recipientName),
        company_name: 'your company', // Could be extracted from LinkedIn profile
        job_title: 'your role' // Could be extracted from LinkedIn profile
      });

      // Get LinkedIn account (use first available or specified)
      const linkedInAccountId = options.linkedInAccountId || await this.getAvailableLinkedInAccount();
      
      if (!linkedInAccountId) {
        return {
          success: false,
          error: 'No LinkedIn account available for sending'
        };
      }

      // Send via Unipile
      const sentMessage = await campaignUnipileIntegration.sendCampaignMessage(
        options.campaignId,
        linkedInAccountId,
        options.recipientLinkedInUrl,
        personalizedContent,
        stepIndex + 1
      );

      // Update campaign stats
      await this.updateCampaignSendCount(options.campaignId);

      return {
        success: true,
        messageId: sentMessage.id,
        sentAt: sentMessage.sent_at,
        content: personalizedContent
      };

    } catch (error) {
      console.error('Error sending campaign message:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Send bulk messages from campaign template
   */
  async sendBulkMessages(
    campaignId: string,
    recipients: Array<{
      linkedInUrl: string;
      name?: string;
      stepIndex?: number;
    }>,
    rateLimitPerHour = 25
  ): Promise<{
    sent: SendResult[];
    failed: SendResult[];
    summary: {
      total: number;
      successful: number;
      failed: number;
      estimatedTime: string;
    };
  }> {
    const sent: SendResult[] = [];
    const failed: SendResult[] = [];

    const delayMs = Math.ceil((60 * 60 * 1000) / rateLimitPerHour);
    const estimatedTimeMinutes = Math.ceil((recipients.length * delayMs) / (1000 * 60));

    console.log(`📤 Starting bulk send of ${recipients.length} messages`);
    console.log(`⏱️  Estimated completion time: ${estimatedTimeMinutes} minutes`);

    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i];
      
      console.log(`📧 Sending message ${i + 1}/${recipients.length} to ${recipient.name || 'recipient'}`);

      const result = await this.sendMessage({
        campaignId,
        recipientLinkedInUrl: recipient.linkedInUrl,
        recipientName: recipient.name,
        stepIndex: recipient.stepIndex
      });

      if (result.success) {
        sent.push(result);
        console.log(`✅ Sent to ${recipient.name || 'recipient'}`);
      } else {
        failed.push(result);
        console.log(`❌ Failed to send to ${recipient.name || 'recipient'}: ${result.error}`);
      }

      // Rate limiting delay (except for last message)
      if (i < recipients.length - 1) {
        console.log(`⏸️  Waiting ${delayMs/1000}s for rate limit...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    return {
      sent,
      failed,
      summary: {
        total: recipients.length,
        successful: sent.length,
        failed: failed.length,
        estimatedTime: `${estimatedTimeMinutes} minutes`
      }
    };
  }

  /**
   * Test sending with demo data
   */
  async sendTestMessage(campaignId: string, testRecipient?: string): Promise<SendResult> {
    const testUrl = testRecipient || 'https://linkedin.com/in/test-user';
    
    return this.sendMessage({
      campaignId,
      recipientLinkedInUrl: testUrl,
      recipientName: 'Test User',
      stepIndex: 0
    });
  }

  /**
   * Personalize message content with placeholders
   */
  private personalizeMessage(template: string, variables: Record<string, string>): string {
    let personalized = template;
    
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{${key}}`;
      personalized = personalized.replace(new RegExp(placeholder, 'g'), value || placeholder);
    });

    return personalized;
  }

  /**
   * Extract first name from full name
   */
  private extractFirstName(fullName?: string): string {
    if (!fullName) return 'there';
    return fullName.split(' ')[0] || 'there';
  }

  /**
   * Extract last name from full name
   */
  private extractLastName(fullName?: string): string {
    if (!fullName) return '';
    const parts = fullName.split(' ');
    return parts.length > 1 ? parts[parts.length - 1] : '';
  }

  /**
   * Get available LinkedIn account for sending
   */
  private async getAvailableLinkedInAccount(): Promise<string | null> {
    try {
      // This would typically query the linkedin_accounts table
      // For now, return a default account ID or null
      return 'demo-linkedin-account-123';
    } catch (error) {
      console.error('Error getting LinkedIn account:', error);
      return null;
    }
  }

  /**
   * Update campaign send statistics
   */
  private async updateCampaignSendCount(campaignId: string): Promise<void> {
    try {
      const campaign = await campaignService.getCampaign(campaignId);
      if (campaign) {
        await campaignService.updateCampaign(campaignId, {
          total_sent: (campaign.total_sent || 0) + 1,
          current_leads_today: (campaign.current_leads_today || 0) + 1
        });
      }
    } catch (error) {
      console.error('Error updating campaign stats:', error);
    }
  }
}

export const campaignMessageSender = new CampaignMessageSender();
export default campaignMessageSender;