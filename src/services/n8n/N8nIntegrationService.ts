/**
 * N8N Integration Service
 * Handles data flow between SAM AI Supabase database and N8N workflows
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export interface WorkflowQueueItem {
  id: string;
  workspace_id: string;
  workflow_id: string;
  priority: number;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  input_data: Record<string, unknown>;
  output_data?: Record<string, unknown>;
  error_data?: Record<string, unknown>;
  triggered_by: string;
  source_session_id?: string;
  source_message_id?: string;
  related_campaign_id?: string;
  related_contact_ids?: string[];
  n8n_execution_id?: string;
  created_at: string;
  updated_at: string;
}

export interface WorkflowStatusUpdate {
  id: string;
  queue_id: string;
  n8n_execution_id: string;
  status_type: 'started' | 'progress' | 'node_completed' | 'completed' | 'error';
  progress_percentage: number;
  current_step?: string;
  status_message?: string;
  status_data: Record<string, unknown>;
  n8n_timestamp: string;
}

export class N8nIntegrationService {
  private static instance: N8nIntegrationService;
  private supabase: SupabaseClient;
  
  // N8N Configuration
  private readonly N8N_BASE_URL = 'https://workflows.innovareai.com';
  private readonly N8N_API_KEY = import.meta.env.VITE_N8N_API_KEY;
  
  private constructor() {
    this.supabase = supabase;
  }

  public static getInstance(): N8nIntegrationService {
    if (!N8nIntegrationService.instance) {
      N8nIntegrationService.instance = new N8nIntegrationService();
    }
    return N8nIntegrationService.instance;
  }

  /**
   * Queue lead research workflow
   */
  public async queueLeadResearch(
    workspaceId: string,
    criteria: {
      companyCriteria: Record<string, unknown>;
      roleCriteria: Record<string, unknown>;
      additionalFilters?: Record<string, unknown>;
      maxResults?: number;
      dataSources?: string[];
    },
    sessionId?: string,
    messageId?: string
  ): Promise<string> {
    const inputData = {
      company_criteria: criteria.companyCriteria,
      role_criteria: criteria.roleCriteria,
      additional_filters: criteria.additionalFilters || {},
      max_results: criteria.maxResults || 100,
      data_sources: criteria.dataSources || ['linkedin', 'apollo']
    };

    // For now, return a mock queue ID
    const queueId = `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log('Queued lead research workflow:', {
      queueId,
      workspaceId,
      inputData,
      sessionId,
      messageId
    });

    return queueId;
  }

  /**
   * Queue content generation workflow
   */
  public async queueContentGeneration(
    workspaceId: string,
    request: {
      contentType: string;
      targetAudience: Record<string, unknown>;
      personalizationData?: Record<string, unknown>;
      contentGuidelines?: Record<string, unknown>;
      variantsRequested?: number;
      kbContextIds?: string[];
    },
    sessionId?: string,
    messageId?: string
  ): Promise<string> {
    const inputData = {
      content_type: request.contentType,
      target_audience: request.targetAudience,
      personalization_data: request.personalizationData || {},
      content_guidelines: request.contentGuidelines || {},
      variants_requested: request.variantsRequested || 1,
      kb_context_ids: request.kbContextIds || []
    };

    // For now, return a mock queue ID
    const queueId = `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log('Queued content generation workflow:', {
      queueId,
      workspaceId,
      inputData,
      sessionId,
      messageId
    });

    return queueId;
  }

  /**
   * Get workflow execution status
   */
  public async getWorkflowStatus(queueId: string): Promise<WorkflowQueueItem | null> {
    // Mock response for testing
    return {
      id: queueId,
      workspace_id: 'df5d730f-1915-4269-bd5a-9534478b17af',
      workflow_id: 'workflow_123',
      priority: 5,
      status: 'completed',
      input_data: {},
      output_data: { result: 'Mock workflow completed successfully' },
      triggered_by: 'conversation',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  /**
   * Subscribe to workflow status updates (mock implementation)
   */
  public subscribeToWorkflowUpdates(
    queueId: string,
    callback: (update: WorkflowStatusUpdate) => void
  ) {
    // Mock subscription - in real implementation, this would use Supabase realtime
    console.log(`Subscribed to workflow updates for: ${queueId}`);
    
    // Return a mock subscription object
    return {
      unsubscribe: () => {
        console.log(`Unsubscribed from workflow updates for: ${queueId}`);
      }
    };
  }
}

export default N8nIntegrationService;