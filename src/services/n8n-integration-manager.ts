/**
 * N8N Integration Manager
 * Central coordination point for all N8N workflow integrations in SAM AI
 */

import { n8nService } from '@/services/n8n/N8nIntegrationService';
import { n8nCampaignService } from '@/services/n8n-campaign-integration';
import { supabase } from '@/integrations/supabase/client';

export interface N8nIntegrationStatus {
  connected: boolean;
  samWorkflowActive: boolean;
  webhookUrl: string;
  lastExecution?: Date;
  executionCount: number;
  errorCount: number;
  configuration: {
    n8nUrl: string;
    hasApiKey: boolean;
    workflowId: string;
  };
}

export interface CampaignWorkflowIntegration {
  campaignId: string;
  workflowId: string;
  status: 'active' | 'paused' | 'completed' | 'error';
  triggerUrl: string;
  executionCount: number;
  lastTriggered?: Date;
}

export interface WorkflowTriggerPayload {
  tenant_id: string;
  user_id: string;
  campaign_id?: string;
  mode: 'inbound' | 'outbound' | 'unified';
  workflow_stage: string;
  data: any;
  source?: string;
  metadata?: {
    timestamp: string;
    version: string;
    trigger_type: 'manual' | 'automated' | 'scheduled';
  };
}

class N8nIntegrationManager {
  private static instance: N8nIntegrationManager;
  
  static getInstance(): N8nIntegrationManager {
    if (!N8nIntegrationManager.instance) {
      N8nIntegrationManager.instance = new N8nIntegrationManager();
    }
    return N8nIntegrationManager.instance;
  }

  /**
   * Get comprehensive integration status
   */
  async getIntegrationStatus(): Promise<N8nIntegrationStatus> {
    try {
      // Check workflow health
      const health = await n8nService.checkWorkflowHealth();
      
      // Get execution history
      const executions = await n8nService.getExecutionHistory(undefined, 10);
      
      // Calculate statistics
      const executionCount = executions.length;
      const errorCount = executions.filter(e => e.status === 'error').length;
      const lastExecution = executions[0]?.startedAt;
      
      return {
        connected: health.connected,
        samWorkflowActive: health.connected && health.activeWorkflows > 0,
        webhookUrl: `${import.meta.env.VITE_N8N_URL}/webhook/sam-ai-main`,
        lastExecution,
        executionCount,
        errorCount,
        configuration: {
          n8nUrl: import.meta.env.VITE_N8N_URL || 'https://innovareai.app.n8n.cloud',
          hasApiKey: !!import.meta.env.VITE_N8N_API_KEY,
          workflowId: import.meta.env.VITE_N8N_SAM_WORKFLOW_ID || 'fV8rgC2kbzSmeHBN'
        }
      };
    } catch (error) {
      console.error('Error getting integration status:', error);
      
      return {
        connected: false,
        samWorkflowActive: false,
        webhookUrl: '',
        executionCount: 0,
        errorCount: 0,
        configuration: {
          n8nUrl: import.meta.env.VITE_N8N_URL || 'https://innovareai.app.n8n.cloud',
          hasApiKey: !!import.meta.env.VITE_N8N_API_KEY,
          workflowId: import.meta.env.VITE_N8N_SAM_WORKFLOW_ID || 'fV8rgC2kbzSmeHBN'
        }
      };
    }
  }

  /**
   * Initialize a campaign with N8N automation
   */
  async initializeCampaignWorkflow(
    campaignId: string,
    campaignData: {
      name: string;
      type: string;
      message_sequence: any[];
      prospects: any[];
      settings: any;
    }
  ): Promise<CampaignWorkflowIntegration> {
    try {
      // Create the N8N workflow for this campaign
      const workflowId = await n8nCampaignService.createCampaignWorkflow({
        id: campaignId,
        ...campaignData
      });

      // Construct the webhook URL for this campaign workflow
      const triggerUrl = `${import.meta.env.VITE_N8N_WEBHOOK_BASE}/campaign-${campaignId}`;

      // Log the integration setup
      await this.logIntegrationEvent(
        'campaign_workflow_created',
        `Campaign ${campaignId} integrated with N8N workflow ${workflowId}`,
        {
          campaign_id: campaignId,
          workflow_id: workflowId,
          trigger_url: triggerUrl
        }
      );

      return {
        campaignId,
        workflowId,
        status: 'active',
        triggerUrl,
        executionCount: 0,
        lastTriggered: undefined
      };
    } catch (error: any) {
      await this.logIntegrationEvent(
        'campaign_workflow_error',
        `Failed to create workflow for campaign ${campaignId}: ${error.message}`,
        { campaign_id: campaignId, error: error.message }
      );
      
      throw error;
    }
  }

  /**
   * Start a campaign automation via N8N
   */
  async startCampaignAutomation(campaignId: string): Promise<void> {
    try {
      await n8nCampaignService.startCampaign(campaignId);
      
      await this.logIntegrationEvent(
        'campaign_started',
        `Campaign ${campaignId} automation started`,
        { campaign_id: campaignId }
      );
    } catch (error: any) {
      await this.logIntegrationEvent(
        'campaign_start_error',
        `Failed to start campaign ${campaignId}: ${error.message}`,
        { campaign_id: campaignId, error: error.message }
      );
      
      throw error;
    }
  }

  /**
   * Pause a campaign automation
   */
  async pauseCampaignAutomation(campaignId: string): Promise<void> {
    try {
      await n8nCampaignService.pauseCampaign(campaignId);
      
      await this.logIntegrationEvent(
        'campaign_paused',
        `Campaign ${campaignId} automation paused`,
        { campaign_id: campaignId }
      );
    } catch (error: any) {
      await this.logIntegrationEvent(
        'campaign_pause_error',
        `Failed to pause campaign ${campaignId}: ${error.message}`,
        { campaign_id: campaignId, error: error.message }
      );
      
      throw error;
    }
  }

  /**
   * Resume a paused campaign automation
   */
  async resumeCampaignAutomation(campaignId: string): Promise<void> {
    try {
      await n8nCampaignService.resumeCampaign(campaignId);
      
      await this.logIntegrationEvent(
        'campaign_resumed',
        `Campaign ${campaignId} automation resumed`,
        { campaign_id: campaignId }
      );
    } catch (error: any) {
      await this.logIntegrationEvent(
        'campaign_resume_error',
        `Failed to resume campaign ${campaignId}: ${error.message}`,
        { campaign_id: campaignId, error: error.message }
      );
      
      throw error;
    }
  }

  /**
   * Trigger any SAM AI workflow with comprehensive payload
   */
  async triggerWorkflow(
    mode: 'inbound' | 'outbound' | 'unified',
    stage: string,
    data: any,
    options?: {
      campaignId?: string;
      triggerType?: 'manual' | 'automated' | 'scheduled';
      source?: string;
    }
  ): Promise<any> {
    // Get current user info
    const { data: { user } } = await supabase.auth.getUser();
    
    // Get tenant info
    let tenantId = 'default';
    if (user) {
      const { data: profile } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single();
      
      if (profile?.organization_id) {
        tenantId = profile.organization_id;
      }
    }

    // Build comprehensive payload
    const payload: WorkflowTriggerPayload = {
      tenant_id: tenantId,
      user_id: user?.id || 'anonymous',
      campaign_id: options?.campaignId,
      mode,
      workflow_stage: stage,
      data: {
        ...data,
        sam_ai_version: '1.0.0',
        integration_version: '1.0.0'
      },
      source: options?.source || 'sam-ai-platform',
      metadata: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        trigger_type: options?.triggerType || 'manual'
      }
    };

    try {
      // Trigger the main SAM workflow
      const execution = await n8nService.triggerMainSAMWorkflow(mode, stage, payload.data);
      
      await this.logIntegrationEvent(
        'workflow_triggered',
        `SAM workflow triggered: ${mode}/${stage}`,
        {
          execution_id: execution.executionId,
          workflow_id: execution.workflowId,
          mode,
          stage,
          trigger_type: options?.triggerType || 'manual'
        }
      );

      return execution;
    } catch (error: any) {
      await this.logIntegrationEvent(
        'workflow_trigger_error',
        `Failed to trigger workflow ${mode}/${stage}: ${error.message}`,
        {
          mode,
          stage,
          error: error.message,
          trigger_type: options?.triggerType || 'manual'
        }
      );
      
      throw error;
    }
  }

  /**
   * Process inbound communications (emails, LinkedIn messages)
   */
  async processInboundCommunication(
    communicationType: 'email' | 'linkedin' | 'other',
    content: string,
    metadata: any
  ): Promise<any> {
    return this.triggerWorkflow(
      'inbound',
      'triage',
      {
        communication_type: communicationType,
        content,
        metadata,
        processing_requested_at: new Date().toISOString()
      },
      {
        triggerType: 'automated',
        source: `${communicationType}_processor`
      }
    );
  }

  /**
   * Execute AI processing workflow
   */
  async processWithAI(
    content: string,
    processingType: 'summarize' | 'extract' | 'generate' | 'classify',
    options?: any
  ): Promise<any> {
    return this.triggerWorkflow(
      'unified',
      'ai_processing',
      {
        content,
        processing_type: processingType,
        options: options || {},
        ai_model: 'claude-3.5-sonnet'
      },
      {
        triggerType: 'automated',
        source: 'ai_processor'
      }
    );
  }

  /**
   * Sync data across multiple channels
   */
  async syncMultiChannel(
    channels: string[],
    syncData: any,
    syncType: 'full' | 'incremental' = 'incremental'
  ): Promise<any> {
    return this.triggerWorkflow(
      'unified',
      'multi_channel',
      {
        channels,
        sync_data: syncData,
        sync_type: syncType,
        sync_requested_at: new Date().toISOString()
      },
      {
        triggerType: 'automated',
        source: 'multi_channel_sync'
      }
    );
  }

  /**
   * Get campaign progress from N8N workflows
   */
  async getCampaignProgress(campaignId: string): Promise<any> {
    try {
      const progress = await n8nCampaignService.getCampaignProgress(campaignId);
      return progress;
    } catch (error: any) {
      await this.logIntegrationEvent(
        'campaign_progress_error',
        `Failed to get progress for campaign ${campaignId}: ${error.message}`,
        { campaign_id: campaignId, error: error.message }
      );
      
      return {
        status: 'unknown',
        progress: {
          total_prospects: 0,
          active_prospects: 0,
          completed_prospects: 0,
          failed_prospects: 0
        },
        current_activity: {
          messages_sent_today: 0,
          connections_made_today: 0,
          responses_received_today: 0
        },
        next_scheduled: null
      };
    }
  }

  /**
   * Log integration events for monitoring and debugging
   */
  private async logIntegrationEvent(
    eventType: string,
    message: string,
    contextData?: any
  ): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Get tenant info
      let tenantId: string | null = null;
      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('organization_id')
          .eq('id', user.id)
          .single();
        
        if (profile?.organization_id) {
          tenantId = profile.organization_id;
        }
      }

      // Try to log to database (will work once schema is applied)
      try {
        await supabase.from('n8n_integration_logs').insert({
          tenant_id: tenantId,
          user_id: user?.id || null,
          log_level: eventType.includes('error') ? 'error' : 'info',
          event_type: eventType,
          message,
          context_data: contextData || {}
        });
      } catch (dbError) {
        // If database logging fails, at least log to console
        console.log('N8N Integration Event:', {
          event_type: eventType,
          message,
          context_data: contextData,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Failed to log integration event:', error);
    }
  }

  /**
   * Get integration logs for monitoring
   */
  async getIntegrationLogs(limit: number = 50): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('n8n_integration_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Failed to get integration logs:', error);
      return [];
    }
  }

  /**
   * Test the entire integration setup
   */
  async runIntegrationTests(): Promise<any> {
    const { runN8nIntegrationTests } = await import('@/utils/n8n-integration-test');
    return runN8nIntegrationTests();
  }
}

export const n8nIntegrationManager = N8nIntegrationManager.getInstance();
export default N8nIntegrationManager;