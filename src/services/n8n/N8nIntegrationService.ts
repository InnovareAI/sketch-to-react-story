/**
 * n8n Integration Service for SAM AI
 * Manages workflow orchestration and automation through n8n
 */

import { supabase } from '@/integrations/supabase/client';

export interface N8nWorkflow {
  id: string;
  name: string;
  active: boolean;
  description?: string;
  tags?: string[];
  webhookUrl?: string;
}

export interface N8nWorkflowExecution {
  workflowId: string;
  executionId?: string;
  status: 'pending' | 'running' | 'success' | 'error';
  data: any;
  response?: any;
  error?: string;
  startedAt: Date;
  completedAt?: Date;
}

export interface N8nTriggerPayload {
  tenant_id: string;
  user_id: string;
  campaign_id?: string;
  workflow_stage: string;
  mode: 'inbound' | 'outbound' | 'unified';
  data: any;
  tenant_config?: {
    supabase_url?: string;
    api_keys?: Record<string, string>;
    rate_limits?: {
      concurrent: number;
      per_minute: number;
    };
    allowed_platforms?: string[];
  };
}

class N8nIntegrationService {
  private static instance: N8nIntegrationService;
  private baseUrl: string;
  private apiKey: string | null = null;
  private tenantId: string | null = null;
  private userId: string | null = null;

  // Predefined SAM AI workflow templates
  // Main SAM workflow ID: aR0ADfWS0ynkR6Gm
  private readonly workflowTemplates = {
    // Main SAM workflow
    samMain: {
      id: 'aR0ADfWS0ynkR6Gm',
      name: 'SAM AI Main Workflow',
      webhookPath: 'sam-ai-main',
      description: 'Main SAM AI orchestration workflow'
    },
    
    // Outbound workflows
    leadDiscovery: {
      id: 'lead-discovery',
      name: 'Lead Discovery & Research',
      webhookPath: 'sam-ai/lead-discovery',
      description: 'Find and research potential leads based on criteria'
    },
    campaignAutomation: {
      id: 'campaign-automation',
      name: 'Campaign Automation',
      webhookPath: 'sam-ai/campaign',
      description: 'Automated outbound campaign management'
    },
    linkedInOutreach: {
      id: 'linkedin-outreach',
      name: 'LinkedIn Outreach',
      webhookPath: 'sam-ai/linkedin',
      description: 'Automated LinkedIn connection and messaging'
    },
    
    // Inbound workflows
    emailTriage: {
      id: 'email-triage',
      name: 'Email Triage & Classification',
      webhookPath: 'sam-ai/email-triage',
      description: 'Classify and prioritize incoming emails'
    },
    autoResponse: {
      id: 'auto-response',
      name: 'Intelligent Auto-Response',
      webhookPath: 'sam-ai/auto-response',
      description: 'Generate contextual automatic responses'
    },
    
    // Unified workflows
    multiChannelSync: {
      id: 'multi-channel',
      name: 'Multi-Channel Sync',
      webhookPath: 'sam-ai/multi-channel',
      description: 'Sync across email, LinkedIn, and CRM'
    },
    aiProcessing: {
      id: 'ai-processing',
      name: 'AI Content Processing',
      webhookPath: 'sam-ai/ai-process',
      description: 'Process content with AI models'
    }
  };

  private constructor() {
    // Get n8n URL from environment or use default
    this.baseUrl = import.meta.env.VITE_N8N_URL || 'https://workflows.innovareai.com';
    this.initializeFromAuth();
  }

  static getInstance(): N8nIntegrationService {
    if (!N8nIntegrationService.instance) {
      N8nIntegrationService.instance = new N8nIntegrationService();
    }
    return N8nIntegrationService.instance;
  }

  private async initializeFromAuth() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        this.userId = user.id;
        
        // Get tenant/organization from user profile
        const { data: profile } = await supabase
          .from('users')
          .select('organization_id')
          .eq('id', user.id)
          .single();
          
        if (profile?.organization_id) {
          this.tenantId = profile.organization_id;
        }
        
        // Get n8n API key from secure storage
        await this.loadApiKey();
      }
    } catch (error) {
      console.error('Error initializing n8n service:', error);
    }
  }

  private async loadApiKey(): Promise<void> {
    try {
      // Call edge function to get decrypted n8n API key
      const { data, error } = await supabase.functions.invoke('get-n8n-config');
      if (!error && data?.apiKey) {
        this.apiKey = data.apiKey;
      }
    } catch (error) {
      console.error('Error loading n8n API key:', error);
    }
  }

  /**
   * Trigger a workflow via webhook
   */
  async triggerWorkflow(
    workflowType: keyof typeof this.workflowTemplates,
    payload: Partial<N8nTriggerPayload>
  ): Promise<N8nWorkflowExecution> {
    const workflow = this.workflowTemplates[workflowType];
    const webhookUrl = `${this.baseUrl}/webhook/${workflow.webhookPath}`;
    
    // Build complete payload with tenant context
    const fullPayload: N8nTriggerPayload = {
      tenant_id: this.tenantId || payload.tenant_id || 'default',
      user_id: this.userId || payload.user_id || 'anonymous',
      campaign_id: payload.campaign_id,
      workflow_stage: payload.workflow_stage || workflow.id,
      mode: payload.mode || 'unified',
      data: payload.data || {},
      tenant_config: payload.tenant_config
    };

    const execution: N8nWorkflowExecution = {
      workflowId: workflow.id,
      status: 'pending',
      data: fullPayload,
      startedAt: new Date()
    };

    try {
      // Log execution start
      await this.logExecution(execution);
      
      execution.status = 'running';
      
      // Make webhook request
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'X-API-Key': this.apiKey })
        },
        body: JSON.stringify(fullPayload)
      });

      if (!response.ok) {
        throw new Error(`Workflow failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      execution.status = 'success';
      execution.response = result;
      execution.completedAt = new Date();
      
      // Log successful execution
      await this.logExecution(execution);
      
      return execution;
    } catch (error: any) {
      execution.status = 'error';
      execution.error = error.message;
      execution.completedAt = new Date();
      
      // Log failed execution
      await this.logExecution(execution);
      
      throw error;
    }
  }

  /**
   * Execute workflow based on SAM AI mode
   */
  async executeModeWorkflow(
    mode: 'inbound' | 'outbound' | 'unified',
    stage: string,
    data: any
  ): Promise<N8nWorkflowExecution> {
    // Map mode and stage to appropriate workflow
    let workflowType: keyof typeof this.workflowTemplates;
    
    if (mode === 'outbound') {
      switch (stage) {
        case 'lead_discovery':
          workflowType = 'leadDiscovery';
          break;
        case 'campaign':
          workflowType = 'campaignAutomation';
          break;
        case 'linkedin':
          workflowType = 'linkedInOutreach';
          break;
        default:
          workflowType = 'campaignAutomation';
      }
    } else if (mode === 'inbound') {
      switch (stage) {
        case 'triage':
          workflowType = 'emailTriage';
          break;
        case 'response':
          workflowType = 'autoResponse';
          break;
        default:
          workflowType = 'emailTriage';
      }
    } else {
      workflowType = 'multiChannelSync';
    }
    
    return this.triggerWorkflow(workflowType, {
      mode,
      workflow_stage: stage,
      data
    });
  }

  /**
   * Execute AI processing workflow
   */
  async executeAIWorkflow(
    content: string,
    processingType: 'summarize' | 'extract' | 'generate' | 'classify'
  ): Promise<any> {
    return this.triggerWorkflow('aiProcessing', {
      workflow_stage: 'ai_processing',
      data: {
        content,
        processing_type: processingType,
        model: 'claude-3.5-sonnet',
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Trigger the main SAM workflow at workflows.innovareai.com
   */
  async triggerMainSAMWorkflow(
    mode: 'inbound' | 'outbound' | 'unified',
    action: string,
    data: any
  ): Promise<N8nWorkflowExecution> {
    // Use the main SAM workflow
    const webhookUrl = `${this.baseUrl}/webhook/sam-ai-main`;
    
    const payload: N8nTriggerPayload = {
      tenant_id: this.tenantId || 'default',
      user_id: this.userId || 'anonymous',
      workflow_stage: action,
      mode,
      data: {
        ...data,
        workflow_id: 'aR0ADfWS0ynkR6Gm',
        workflow_name: 'SAM',
        triggered_at: new Date().toISOString(),
        source: 'sam-ai-platform'
      }
    };

    const execution: N8nWorkflowExecution = {
      workflowId: 'aR0ADfWS0ynkR6Gm',
      status: 'pending',
      data: payload,
      startedAt: new Date()
    };

    try {
      execution.status = 'running';
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'SAM-AI-Platform/1.0',
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`SAM workflow failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      execution.status = 'success';
      execution.response = result;
      execution.completedAt = new Date();
      
      await this.logExecution(execution);
      
      return execution;
    } catch (error: any) {
      execution.status = 'error';
      execution.error = error.message;
      execution.completedAt = new Date();
      
      await this.logExecution(execution);
      
      throw error;
    }
  }

  /**
   * Get workflow execution history
   */
  async getExecutionHistory(
    workflowId?: string,
    limit: number = 10
  ): Promise<N8nWorkflowExecution[]> {
    try {
      const query = supabase
        .from('n8n_executions')
        .select('*')
        .eq('tenant_id', this.tenantId)
        .order('started_at', { ascending: false })
        .limit(limit);
      
      if (workflowId) {
        query.eq('workflow_id', workflowId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error fetching execution history:', error);
      return [];
    }
  }

  /**
   * Log workflow execution to database
   */
  private async logExecution(execution: N8nWorkflowExecution): Promise<void> {
    try {
      await supabase.from('n8n_executions').insert({
        tenant_id: this.tenantId,
        user_id: this.userId,
        workflow_id: execution.workflowId,
        execution_id: execution.executionId,
        status: execution.status,
        data: execution.data,
        response: execution.response,
        error: execution.error,
        started_at: execution.startedAt,
        completed_at: execution.completedAt
      });
    } catch (error) {
      console.error('Error logging execution:', error);
    }
  }

  /**
   * Check workflow health status
   */
  async checkWorkflowHealth(): Promise<{
    connected: boolean;
    activeWorkflows: number;
    lastExecution?: Date;
    error?: string;
  }> {
    try {
      // Test connection with a simple request
      const response = await fetch(`${this.baseUrl}/webhook-test/health`, {
        method: 'GET',
        headers: this.apiKey ? { 'X-API-Key': this.apiKey } : {}
      });
      
      const connected = response.ok;
      
      // Get recent executions
      const executions = await this.getExecutionHistory(undefined, 1);
      
      return {
        connected,
        activeWorkflows: Object.keys(this.workflowTemplates).length,
        lastExecution: executions[0]?.startedAt
      };
    } catch (error: any) {
      return {
        connected: false,
        activeWorkflows: 0,
        error: error.message
      };
    }
  }

  /**
   * Get available workflow templates
   */
  getAvailableWorkflows(): typeof this.workflowTemplates {
    return this.workflowTemplates;
  }

  /**
   * Set custom n8n instance URL
   */
  setN8nUrl(url: string): void {
    this.baseUrl = url;
  }

  /**
   * Set API key for authenticated requests
   */
  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }
}

export const n8nService = N8nIntegrationService.getInstance();

export default N8nIntegrationService;