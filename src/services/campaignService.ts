/**
 * Campaign Service - Database Integration
 * Connects React UI to Supabase campaign database
 */

import { supabase } from '@/integrations/supabase/client';

// Types matching database schema
export interface Campaign {
  id?: string;
  workspace_id?: string;
  tenant_id?: string;
  user_id?: string;
  name: string;
  description?: string;
  type?: string;
  status: 'active' | 'paused' | 'completed' | 'draft';
  
  // Campaign Configuration
  target_audience?: string;
  connection_required?: boolean;
  premium_required?: boolean;
  email_required?: boolean;
  phone_required?: boolean;
  min_mutual_connections?: number;
  max_connection_degree?: string;
  min_profile_completeness?: number;
  excluded_industries?: string[];
  excluded_titles?: string[];
  allowed_search_sources?: string[];
  
  // Limits
  max_leads_per_day?: number;
  max_leads_total?: number;
  current_leads_today?: number;
  current_leads_total?: number;
  daily_connection_limit?: number;
  
  // Performance Metrics
  total_sent?: number;
  total_responses?: number;
  total_connections?: number;
  success_rate?: number;
  
  // Messaging Configuration
  messaging_sequence?: CampaignStep[];
  follow_up_days?: number[];
  
  // Features
  profile_visit_enabled?: boolean;
  company_follow_enabled?: boolean;
  requires_2fa?: boolean;
  
  // Additional Settings
  settings?: any;
  event_id?: string;
  linkedin_group_id?: string;
  recovery_timeframe_days?: number;
  
  // Metadata
  created_at?: string;
  updated_at?: string;
}

export interface CampaignStep {
  id: string;
  type: 'connection' | 'message' | 'inmail' | 'follow_up';
  name: string;
  content: string;
  delay?: number;
  delayUnit?: 'hours' | 'days' | 'weeks';
  variants?: string[];
}

export interface CampaignMetrics {
  response_rate: number;
  conversion_rate: number;
  prospects_added: number;
  prospects_contacted: number;
  prospects_converted: number;
  prospects_responded: number;
  avg_response_time_hours: number;
}

export interface Prospect {
  id?: string;
  workspace_id?: string;
  linkedin_profile_id?: string;
  linkedin_url?: string;
  full_name: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  current_title?: string;
  current_company?: string;
  headline?: string;
  industry?: string;
  location?: string;
  experience?: any[];
  connections_count?: number;
  data_completeness_score?: number;
  engagement_score?: number;
  source?: string;
  created_by?: string;
}

export interface CampaignProspect {
  id?: string;
  campaign_id: string;
  prospect_id: string;
  status: 'pending_review' | 'approved' | 'rejected' | 'contacted' | 'responded' | 'converted';
  review_score?: number;
  review_notes?: string;
  approved_by?: string;
  approved_at?: string;
  step_progress?: number;
  contact_attempts?: number;
}

class CampaignService {
  /**
   * Create a new campaign
   */
  async createCampaign(campaign: Omit<Campaign, 'id' | 'created_at' | 'updated_at'>): Promise<Campaign> {
    // Get current user/workspace context
    const defaultWorkspaceId = 'df5d730f-1915-4269-bd5a-9534478b17af';
    const defaultTenantId = '367b6c5c-43d7-4546-96d4-4f5f22641de1';
    const defaultUserId = '03ca8428-384a-482d-8371-66928fee1063';
    
    const { data, error } = await supabase
      .from('campaigns')
      .insert({
        ...campaign,
        // Ensure required fields have defaults
        workspace_id: campaign.workspace_id || defaultWorkspaceId,
        tenant_id: campaign.tenant_id || defaultTenantId,
        user_id: campaign.user_id || defaultUserId,
        status: campaign.status || 'draft',
        type: campaign.type || 'connection_request',
        target_audience: campaign.target_audience || 'general',
        max_leads_per_day: campaign.max_leads_per_day || 50,
        daily_connection_limit: campaign.daily_connection_limit || 100,
        messaging_sequence: campaign.messaging_sequence || [],
        follow_up_days: campaign.follow_up_days || [1, 3, 7],
        current_leads_today: 0,
        current_leads_total: 0,
        total_sent: 0,
        total_responses: 0,
        total_connections: 0,
        success_rate: 0.00,
        settings: campaign.settings || {}
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating campaign:', error);
      throw new Error(`Failed to create campaign: ${error.message}`);
    }

    return data;
  }

  /**
   * Update existing campaign
   */
  async updateCampaign(id: string, updates: Partial<Campaign>): Promise<Campaign> {
    const { data, error } = await supabase
      .from('campaigns')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating campaign:', error);
      throw new Error(`Failed to update campaign: ${error.message}`);
    }

    return data;
  }

  /**
   * Get campaign by ID
   */
  async getCampaign(id: string): Promise<Campaign | null> {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      console.error('Error fetching campaign:', error);
      throw new Error(`Failed to fetch campaign: ${error.message}`);
    }

    return data;
  }

  /**
   * List campaigns for current workspace
   */
  async listCampaigns(filters?: {
    status?: string;
    type?: string;
    limit?: number;
  }): Promise<Campaign[]> {
    let query = supabase
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.type) {
      query = query.eq('type', filters.type);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error listing campaigns:', error);
      throw new Error(`Failed to list campaigns: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Delete campaign
   */
  async deleteCampaign(id: string): Promise<void> {
    const { error } = await supabase
      .from('campaigns')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting campaign:', error);
      throw new Error(`Failed to delete campaign: ${error.message}`);
    }
  }

  /**
   * Activate campaign (change status to active)
   */
  async activateCampaign(id: string): Promise<Campaign> {
    return this.updateCampaign(id, {
      status: 'active'
    });
  }

  /**
   * Pause campaign
   */
  async pauseCampaign(id: string): Promise<Campaign> {
    return this.updateCampaign(id, {
      status: 'paused'
    });
  }

  /**
   * Get campaign analytics summary
   */
  async getCampaignAnalytics(campaignId: string): Promise<any> {
    const { data, error } = await supabase
      .from('campaigns')
      .select('total_sent, total_responses, total_connections, success_rate, status, created_at')
      .eq('id', campaignId)
      .single();

    if (error) {
      console.error('Error fetching campaign analytics:', error);
      throw new Error(`Failed to fetch campaign analytics: ${error.message}`);
    }

    return {
      ...data,
      response_rate: data.total_sent > 0 ? (data.total_responses / data.total_sent * 100) : 0,
      connection_rate: data.total_sent > 0 ? (data.total_connections / data.total_sent * 100) : 0
    };
  }
}

export const campaignService = new CampaignService();
export default campaignService;