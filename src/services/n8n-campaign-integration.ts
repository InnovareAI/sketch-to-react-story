// N8N Campaign Integration Service
// Handles campaign broadcast and automation management through n8n workflows

import { n8nService } from '@/services/n8n/N8nIntegrationService';
import { supabase } from '@/integrations/supabase/client';
import { campaignWorkflowTemplates } from './campaign-workflow-templates';

export interface N8nCampaignWorkflow {
  workflow_id: string;
  campaign_id: string;
  campaign_type: string;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'error';
  message_sequence: {
    step: number;
    message_id: string;
    delay: string;
    conditions: any;
    status: 'pending' | 'active' | 'completed';
  }[];
  prospects: {
    id: string;
    current_step: number;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    last_message_sent: string | null;
    next_scheduled: string | null;
  }[];
  settings: {
    daily_limit: number;
    priority: 'low' | 'medium' | 'high';
    timezone: string;
    working_hours: {
      start: string;
      end: string;
      days: string[];
    };
  };
  created_at: string;
  updated_at: string;
}

class N8nCampaignIntegrationService {
  private static instance: N8nCampaignIntegrationService;

  static getInstance(): N8nCampaignIntegrationService {
    if (!N8nCampaignIntegrationService.instance) {
      N8nCampaignIntegrationService.instance = new N8nCampaignIntegrationService();
    }
    return N8nCampaignIntegrationService.instance;
  }

  /**
   * Create and deploy n8n workflow for a campaign
   */
  async createCampaignWorkflow(campaignData: {
    id: string;
    name: string;
    type: string;
    message_sequence: any[];
    prospects: any[];
    settings: any;
  }): Promise<string> {
    try {
      // Generate workflow based on campaign type
      const workflowTemplate = this.generateWorkflowTemplate(campaignData);
      
      // Create workflow in n8n
      const workflowResponse = await n8nService.triggerWorkflow('samMain', {
        workflow_stage: 'create_campaign',
        mode: 'unified',
        data: {
          action: 'create_workflow',
          campaign: campaignData,
          workflow_template: workflowTemplate
        }
      });

      if (workflowResponse.status === 'success') {
        // Store workflow reference in database
        await this.saveCampaignWorkflow(campaignData.id, workflowResponse.response.workflow_id);
        return workflowResponse.response.workflow_id;
      }

      throw new Error('Failed to create n8n workflow');
    } catch (error) {
      console.error('Error creating campaign workflow:', error);
      throw error;
    }
  }

  /**
   * Start campaign automation
   */
  async startCampaign(campaignId: string): Promise<void> {
    try {
      const workflow = await this.getCampaignWorkflow(campaignId);
      if (!workflow) throw new Error('Campaign workflow not found');

      await n8nService.triggerWorkflow('samMain', {
        workflow_stage: 'start_campaign',
        mode: 'outbound',
        data: {
          action: 'start',
          workflow_id: workflow.workflow_id,
          campaign_id: campaignId,
          settings: workflow.settings
        }
      });

      // Update workflow status
      await this.updateWorkflowStatus(campaignId, 'active');
    } catch (error) {
      console.error('Error starting campaign:', error);
      throw error;
    }
  }

  /**
   * Pause campaign automation
   */
  async pauseCampaign(campaignId: string): Promise<void> {
    try {
      const workflow = await this.getCampaignWorkflow(campaignId);
      if (!workflow) throw new Error('Campaign workflow not found');

      await n8nService.triggerWorkflow('samMain', {
        workflow_stage: 'pause_campaign',
        mode: 'unified',
        data: {
          action: 'pause',
          workflow_id: workflow.workflow_id,
          campaign_id: campaignId
        }
      });

      await this.updateWorkflowStatus(campaignId, 'paused');
    } catch (error) {
      console.error('Error pausing campaign:', error);
      throw error;
    }
  }

  /**
   * Resume paused campaign
   */
  async resumeCampaign(campaignId: string): Promise<void> {
    try {
      const workflow = await this.getCampaignWorkflow(campaignId);
      if (!workflow) throw new Error('Campaign workflow not found');

      await n8nService.triggerWorkflow('samMain', {
        workflow_stage: 'resume_campaign',
        mode: 'outbound',
        data: {
          action: 'resume',
          workflow_id: workflow.workflow_id,
          campaign_id: campaignId
        }
      });

      await this.updateWorkflowStatus(campaignId, 'active');
    } catch (error) {
      console.error('Error resuming campaign:', error);
      throw error;
    }
  }

  /**
   * Add new message to existing automation
   */
  async addMessageToAutomation(campaignId: string, newMessage: {
    content: string;
    delay: string;
    position: number;
    conditions?: any;
  }): Promise<void> {
    try {
      const workflow = await this.getCampaignWorkflow(campaignId);
      if (!workflow) throw new Error('Campaign workflow not found');

      // Check if campaign is running
      if (workflow.status === 'active') {
        // For active campaigns, we need to:
        // 1. Update the workflow template
        // 2. Apply changes to prospects who haven't reached this step yet
        // 3. Keep existing prospects on their current path
        
        await n8nService.triggerWorkflow('samMain', {
          workflow_stage: 'update_campaign_sequence',
          mode: 'unified',
          data: {
            action: 'add_message',
            workflow_id: workflow.workflow_id,
            campaign_id: campaignId,
            new_message: {
              ...newMessage,
              id: `msg_${Date.now()}`,
              created_at: new Date().toISOString()
            },
            update_strategy: 'future_prospects_only' // Don't affect current sequences
          }
        });

        // Update local workflow data
        await this.updateMessageSequence(campaignId, newMessage, 'add');
      } else {
        // For paused/draft campaigns, we can safely update the sequence
        await this.updateMessageSequence(campaignId, newMessage, 'add');
      }

      // Log the change
      await this.logCampaignActivity(campaignId, 'message_added', {
        message_content: newMessage.content,
        position: newMessage.position,
        delay: newMessage.delay
      });

    } catch (error) {
      console.error('Error adding message to automation:', error);
      throw error;
    }
  }

  /**
   * Update existing message in automation
   */
  async updateMessageInAutomation(campaignId: string, messageId: string, updates: {
    content?: string;
    delay?: string;
    conditions?: any;
  }): Promise<void> {
    try {
      const workflow = await this.getCampaignWorkflow(campaignId);
      if (!workflow) throw new Error('Campaign workflow not found');

      await n8nService.triggerWorkflow('samMain', {
        workflow_stage: 'update_campaign_sequence',
        mode: 'unified',
        data: {
          action: 'update_message',
          workflow_id: workflow.workflow_id,
          campaign_id: campaignId,
          message_id: messageId,
          updates: {
            ...updates,
            updated_at: new Date().toISOString()
          }
        }
      });

      await this.updateMessageSequence(campaignId, { ...updates, id: messageId }, 'update');
      
      await this.logCampaignActivity(campaignId, 'message_updated', {
        message_id: messageId,
        updates
      });

    } catch (error) {
      console.error('Error updating message in automation:', error);
      throw error;
    }
  }

  /**
   * Remove message from automation
   */
  async removeMessageFromAutomation(campaignId: string, messageId: string): Promise<void> {
    try {
      const workflow = await this.getCampaignWorkflow(campaignId);
      if (!workflow) throw new Error('Campaign workflow not found');

      if (workflow.status === 'active') {
        // For active campaigns, mark as inactive rather than delete
        await n8nService.triggerWorkflow('samMain', {
          workflow_stage: 'update_campaign_sequence',
          mode: 'unified',
          data: {
            action: 'deactivate_message',
            workflow_id: workflow.workflow_id,
            campaign_id: campaignId,
            message_id: messageId
          }
        });
      }

      await this.updateMessageSequence(campaignId, { id: messageId }, 'remove');
      
      await this.logCampaignActivity(campaignId, 'message_removed', {
        message_id: messageId
      });

    } catch (error) {
      console.error('Error removing message from automation:', error);
      throw error;
    }
  }

  /**
   * Get campaign workflow status and progress
   */
  async getCampaignProgress(campaignId: string): Promise<{
    status: string;
    progress: {
      total_prospects: number;
      active_prospects: number;
      completed_prospects: number;
      failed_prospects: number;
    };
    current_activity: {
      messages_sent_today: number;
      connections_made_today: number;
      responses_received_today: number;
    };
    next_scheduled: Date | null;
  }> {
    try {
      const workflow = await this.getCampaignWorkflow(campaignId);
      if (!workflow) throw new Error('Campaign workflow not found');

      // Get real-time status from n8n
      const statusResponse = await n8nService.triggerWorkflow('samMain', {
        workflow_stage: 'get_campaign_status',
        mode: 'unified',
        data: {
          action: 'get_status',
          workflow_id: workflow.workflow_id,
          campaign_id: campaignId
        }
      });

      return statusResponse.response;
    } catch (error) {
      console.error('Error getting campaign progress:', error);
      throw error;
    }
  }

  /**
   * Generate workflow template based on campaign type
   */
  private generateWorkflowTemplate(campaignData: any): any {
    // Get the predefined template for this campaign type
    const template = campaignWorkflowTemplates.getTemplate(campaignData.type);
    
    if (!template) {
      throw new Error(`No workflow template found for campaign type: ${campaignData.type}`);
    }

    // Customize the template for this specific campaign
    const customizedTemplate = campaignWorkflowTemplates.customizeTemplate(template, {
      campaignId: campaignData.id,
      campaignName: campaignData.name,
      settings: campaignData.settings,
      variables: campaignData.variables
    });

    return {
      name: customizedTemplate.name,
      tags: ['campaign', campaignData.type, 'sam-ai'],
      active: false, // Start as inactive
      nodes: customizedTemplate.nodes,
      connections: customizedTemplate.connections
    };
  }

  /**
   * Parse delay string into amount and unit (utility method for workflow templates)
   */
  private parseDelay(delay: string): { amount: number; unit: string } {
    const match = delay.match(/(\d+)\s*(min|hour|day|week)s?/i);
    if (match) {
      return {
        amount: parseInt(match[1]),
        unit: match[2].toLowerCase() + (match[2].toLowerCase() === 'day' ? 's' : '')
      };
    }
    
    // Default to 1 hour if can't parse
    return { amount: 1, unit: 'hours' };
  }

  /**
   * Save campaign workflow reference
   */
  private async saveCampaignWorkflow(campaignId: string, workflowId: string): Promise<void> {
    const { error } = await supabase
      .from('campaign_workflows')
      .upsert({
        campaign_id: campaignId,
        n8n_workflow_id: workflowId,
        status: 'draft',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (error) throw error;
  }

  /**
   * Get campaign workflow
   */
  private async getCampaignWorkflow(campaignId: string): Promise<N8nCampaignWorkflow | null> {
    const { data, error } = await supabase
      .from('campaign_workflows')
      .select('*')
      .eq('campaign_id', campaignId)
      .single();

    if (error || !data) return null;
    return data as N8nCampaignWorkflow;
  }

  /**
   * Update workflow status
   */
  private async updateWorkflowStatus(campaignId: string, status: string): Promise<void> {
    const { error } = await supabase
      .from('campaign_workflows')
      .update({ 
        status, 
        updated_at: new Date().toISOString() 
      })
      .eq('campaign_id', campaignId);

    if (error) throw error;
  }

  /**
   * Update message sequence
   */
  private async updateMessageSequence(campaignId: string, messageData: any, action: 'add' | 'update' | 'remove'): Promise<void> {
    // This would update the message sequence in the database
    // Implementation depends on your database schema
    console.log(`${action} message for campaign ${campaignId}:`, messageData);
  }

  /**
   * Log campaign activity
   */
  private async logCampaignActivity(campaignId: string, activityType: string, details: any): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from('campaign_activities')
      .insert({
        campaign_id: campaignId,
        activity_type: activityType,
        details,
        user_id: user?.id,
        timestamp: new Date().toISOString()
      });

    if (error) {
      console.error('Error logging campaign activity:', error);
    }
  }
}

export const n8nCampaignService = N8nCampaignIntegrationService.getInstance();
export default N8nCampaignIntegrationService;