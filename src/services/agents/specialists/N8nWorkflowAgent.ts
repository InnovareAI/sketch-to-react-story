/**
 * n8n Workflow Agent
 * Specialist agent that integrates with n8n for workflow automation
 */

import { BaseAgent, AgentConfig, TaskRequest, TaskResponse } from '../types/AgentTypes';
import { n8nService } from '../../n8n/N8nIntegrationService';

export class N8nWorkflowAgent extends BaseAgent {
  constructor(config: AgentConfig) {
    super('n8n-workflow', config);
    this.initializeCapabilities();
  }

  private initializeCapabilities(): void {
    this.capabilities = [
      {
        name: 'trigger-workflow',
        description: 'Trigger n8n workflow based on context',
        supportedComplexity: ['simple', 'moderate', 'complex'],
        estimatedDuration: 5,
        requiredParameters: ['workflowType', 'data'],
        optionalParameters: ['mode', 'stage']
      },
      {
        name: 'lead-discovery',
        description: 'Execute lead discovery workflow',
        supportedComplexity: ['moderate', 'complex'],
        estimatedDuration: 10,
        requiredParameters: ['criteria'],
        optionalParameters: ['limit', 'platforms']
      },
      {
        name: 'campaign-automation',
        description: 'Run campaign automation workflow',
        supportedComplexity: ['complex'],
        estimatedDuration: 15,
        requiredParameters: ['campaignData'],
        optionalParameters: ['schedule', 'targets']
      },
      {
        name: 'email-processing',
        description: 'Process emails through n8n workflow',
        supportedComplexity: ['simple', 'moderate'],
        estimatedDuration: 3,
        requiredParameters: ['emails'],
        optionalParameters: ['action', 'filters']
      },
      {
        name: 'ai-content-generation',
        description: 'Generate content using AI workflow',
        supportedComplexity: ['moderate', 'complex'],
        estimatedDuration: 8,
        requiredParameters: ['prompt', 'contentType'],
        optionalParameters: ['model', 'parameters']
      }
    ];
  }

  async initialize(): Promise<void> {
    console.log('Initializing n8n Workflow Agent...');
    // Check n8n connection
    const health = await n8nService.checkWorkflowHealth();
    if (!health.connected) {
      console.warn('n8n service is not connected. Some features may be unavailable.');
    }
    this.isInitialized = true;
  }

  async processTask(request: TaskRequest): Promise<TaskResponse> {
    const startTime = Date.now();

    try {
      let result: any;
      
      switch (request.intent) {
        case 'trigger-workflow':
          result = await this.triggerWorkflow(request);
          break;
          
        case 'lead-discovery':
          result = await this.executeLeadDiscovery(request);
          break;
          
        case 'campaign-automation':
          result = await this.executeCampaignAutomation(request);
          break;
          
        case 'email-processing':
          result = await this.processEmails(request);
          break;
          
        case 'ai-content-generation':
          result = await this.generateAIContent(request);
          break;
          
        default:
          // Try to map intent to workflow
          result = await this.handleGenericWorkflow(request);
      }

      return {
        success: true,
        data: result,
        message: `n8n workflow executed successfully`,
        processingTime: Date.now() - startTime,
        agentId: this.id,
        agentType: this.type,
        confidence: 0.9
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: `Failed to execute n8n workflow: ${error.message}`,
        processingTime: Date.now() - startTime,
        agentId: this.id,
        agentType: this.type,
        confidence: 0.3
      };
    }
  }

  private async triggerWorkflow(request: TaskRequest): Promise<any> {
    const { workflowType, data, mode, stage } = request.parameters;
    
    return await n8nService.triggerWorkflow(workflowType, {
      mode: mode || 'unified',
      workflow_stage: stage || 'default',
      data: data || {}
    });
  }

  private async executeLeadDiscovery(request: TaskRequest): Promise<any> {
    const { criteria, limit, platforms } = request.parameters;
    
    return await n8nService.triggerWorkflow('leadDiscovery', {
      mode: 'outbound',
      workflow_stage: 'lead_discovery',
      data: {
        search_criteria: criteria,
        max_results: limit || 50,
        target_platforms: platforms || ['linkedin', 'email'],
        enrichment_required: true
      }
    });
  }

  private async executeCampaignAutomation(request: TaskRequest): Promise<any> {
    const { campaignData, schedule, targets } = request.parameters;
    
    return await n8nService.triggerWorkflow('campaignAutomation', {
      mode: 'outbound',
      workflow_stage: 'campaign_execution',
      data: {
        campaign: campaignData,
        schedule: schedule || 'immediate',
        target_contacts: targets || [],
        personalization_enabled: true
      }
    });
  }

  private async processEmails(request: TaskRequest): Promise<any> {
    const { emails, action, filters } = request.parameters;
    
    const workflowType = action === 'respond' ? 'autoResponse' : 'emailTriage';
    
    return await n8nService.triggerWorkflow(workflowType, {
      mode: 'inbound',
      workflow_stage: 'email_processing',
      data: {
        emails: emails,
        action: action || 'triage',
        filters: filters || {},
        auto_categorize: true
      }
    });
  }

  private async generateAIContent(request: TaskRequest): Promise<any> {
    const { prompt, contentType, model, parameters } = request.parameters;
    
    return await n8nService.executeAIWorkflow(
      prompt,
      contentType || 'generate'
    );
  }

  private async handleGenericWorkflow(request: TaskRequest): Promise<any> {
    // Map common intents to workflows
    const intentToWorkflow: Record<string, string> = {
      'find-leads': 'leadDiscovery',
      'send-campaign': 'campaignAutomation',
      'process-inbox': 'emailTriage',
      'auto-reply': 'autoResponse',
      'sync-data': 'multiChannelSync',
      'generate-content': 'aiProcessing'
    };

    const workflowType = intentToWorkflow[request.intent];
    
    if (workflowType) {
      return await n8nService.triggerWorkflow(workflowType as any, {
        data: request.parameters
      });
    }

    throw new Error(`Unknown workflow intent: ${request.intent}`);
  }

  async getCapabilities() {
    return this.capabilities;
  }

  async getStatus() {
    const health = await n8nService.checkWorkflowHealth();
    
    return {
      isInitialized: this.isInitialized,
      isActive: health.connected,
      currentTasks: [],
      performance: {
        totalTasks: 0,
        successRate: 0,
        averageTime: 0
      },
      health: {
        connected: health.connected,
        activeWorkflows: health.activeWorkflows,
        lastExecution: health.lastExecution
      }
    };
  }

  /**
   * Execute workflow based on conversation context
   */
  async executeContextualWorkflow(
    context: {
      mode: 'inbound' | 'outbound' | 'unified';
      intent: string;
      data: any;
    }
  ): Promise<any> {
    // Determine the best workflow based on context
    let workflowType: string;
    
    if (context.mode === 'outbound') {
      if (context.intent.includes('lead') || context.intent.includes('prospect')) {
        workflowType = 'leadDiscovery';
      } else if (context.intent.includes('campaign') || context.intent.includes('outreach')) {
        workflowType = 'campaignAutomation';
      } else if (context.intent.includes('linkedin')) {
        workflowType = 'linkedInOutreach';
      } else {
        workflowType = 'campaignAutomation';
      }
    } else if (context.mode === 'inbound') {
      if (context.intent.includes('triage') || context.intent.includes('classify')) {
        workflowType = 'emailTriage';
      } else if (context.intent.includes('respond') || context.intent.includes('reply')) {
        workflowType = 'autoResponse';
      } else {
        workflowType = 'emailTriage';
      }
    } else {
      // Unified mode
      if (context.intent.includes('sync')) {
        workflowType = 'multiChannelSync';
      } else if (context.intent.includes('ai') || context.intent.includes('generate')) {
        workflowType = 'aiProcessing';
      } else {
        workflowType = 'multiChannelSync';
      }
    }

    return await n8nService.triggerWorkflow(workflowType as any, {
      mode: context.mode,
      data: context.data
    });
  }
}

export default N8nWorkflowAgent;