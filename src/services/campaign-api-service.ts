// Campaign API Service - Technical integration layer
// Handles database operations, validation caching, and real-time processing

import { supabase } from '@/integrations/supabase/client';
import { 
  SAMCampaignRulesEngine, 
  LeadProfile, 
  CampaignProfile, 
  CampaignAssignmentResult 
} from './campaign-rules-engine';
import { toast } from 'sonner';

export interface DatabaseLeadProfile {
  id: string;
  workspace_id: string;
  name: string;
  title?: string;
  company?: string;
  location?: string;
  email?: string;
  phone?: string;
  linkedin_url?: string;
  connection_degree?: '1st' | '2nd' | '3rd' | 'out_of_network' | 'unknown';
  premium_account: boolean;
  open_to_work: boolean;
  profile_visibility: 'public' | 'limited' | 'private';
  last_activity?: string;
  profile_completeness: number;
  mutual_connections: number;
  follower_count: number;
  has_company_page: boolean;
  industry?: string;
  seniority_level?: string;
  search_source: string;
  search_id?: string;
  source_url?: string;
  enrichment_status: 'pending' | 'completed' | 'failed' | 'not_needed';
  quality_score: number;
  data_completeness: number;
  additional_data?: any;
  created_at: string;
  updated_at: string;
}

export interface DatabaseCampaign {
  id: string;
  workspace_id: string;
  name: string;
  description?: string;
  type: 'connection_request' | 'direct_message' | 'inmail' | 'email' | 'multi_channel';
  target_audience: string;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
  connection_required: boolean;
  premium_required: boolean;
  email_required: boolean;
  phone_required: boolean;
  min_mutual_connections?: number;
  max_connection_degree?: '1st' | '2nd' | '3rd';
  min_profile_completeness?: number;
  excluded_industries?: string[];
  excluded_titles?: string[];
  allowed_search_sources: string[];
  max_leads_per_day: number;
  max_leads_total?: number;
  current_leads_today: number;
  current_leads_total: number;
  settings?: any;
  total_sent: number;
  total_responses: number;
  total_connections: number;
  success_rate: number;
  created_at: string;
  updated_at: string;
}

export interface CampaignAssignment {
  id: string;
  campaign_id: string;
  lead_id: string;
  workspace_id: string;
  status: 'assigned' | 'contacted' | 'responded' | 'connected' | 'unqualified' | 'bounced' | 'opted_out';
  priority: number;
  validation_passed: boolean;
  validation_warnings?: string[];
  validation_suggestions?: string[];
  estimated_success_rate?: number;
  custom_fields?: any;
  assigned_at: string;
  assigned_by?: string;
  first_contact_at?: string;
  last_contact_at?: string;
  response_at?: string;
  connection_at?: string;
  total_messages: number;
}

export interface ValidationCacheEntry {
  id: string;
  lead_id: string;
  campaign_id: string;
  can_assign: boolean;
  blocked_reasons?: string[];
  warnings?: string[];
  suggestions?: string[];
  estimated_success_rate?: number;
  computed_at: string;
  expires_at: string;
  computation_time_ms: number;
}

export class CampaignAPIService {
  /**
   * Get all campaigns for a workspace
   */
  static async getCampaigns(workspaceId: string): Promise<DatabaseCampaign[]> {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      throw error;
    }
  }

  /**
   * Create a new campaign
   */
  static async createCampaign(campaign: Partial<DatabaseCampaign>): Promise<DatabaseCampaign> {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .insert([campaign])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating campaign:', error);
      throw error;
    }
  }

  /**
   * Update campaign
   */
  static async updateCampaign(id: string, updates: Partial<DatabaseCampaign>): Promise<DatabaseCampaign> {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating campaign:', error);
      throw error;
    }
  }

  /**
   * Get all leads for a workspace
   */
  static async getLeads(workspaceId: string, filters?: {
    search_source?: string;
    quality_score_min?: number;
    enrichment_status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ leads: DatabaseLeadProfile[], total: number }> {
    try {
      let query = supabase
        .from('lead_profiles')
        .select('*', { count: 'exact' })
        .eq('workspace_id', workspaceId);

      // Apply filters
      if (filters?.search_source) {
        query = query.eq('search_source', filters.search_source);
      }
      if (filters?.quality_score_min !== undefined) {
        query = query.gte('quality_score', filters.quality_score_min);
      }
      if (filters?.enrichment_status) {
        query = query.eq('enrichment_status', filters.enrichment_status);
      }

      // Pagination
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }
      if (filters?.offset) {
        query = query.range(filters.offset, (filters.offset + (filters.limit || 50)) - 1);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) throw error;
      
      return {
        leads: data || [],
        total: count || 0
      };
    } catch (error) {
      console.error('Error fetching leads:', error);
      throw error;
    }
  }

  /**
   * Create or update lead profile
   */
  static async upsertLead(lead: Partial<DatabaseLeadProfile>): Promise<DatabaseLeadProfile> {
    try {
      const { data, error } = await supabase
        .from('lead_profiles')
        .upsert([{
          ...lead,
          updated_at: new Date().toISOString()
        }], {
          onConflict: 'workspace_id,linkedin_url'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error upserting lead:', error);
      throw error;
    }
  }

  /**
   * Batch create leads from search results
   */
  static async batchCreateLeads(
    leads: Partial<DatabaseLeadProfile>[],
    searchId?: string
  ): Promise<{ created: number, updated: number, errors: string[] }> {
    let created = 0;
    let updated = 0;
    const errors: string[] = [];

    try {
      // Process in batches of 50 to avoid timeout
      const batchSize = 50;
      for (let i = 0; i < leads.length; i += batchSize) {
        const batch = leads.slice(i, i + batchSize).map(lead => ({
          ...lead,
          search_id: searchId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));

        const { data, error } = await supabase
          .from('lead_profiles')
          .upsert(batch, {
            onConflict: 'workspace_id,linkedin_url'
          })
          .select('id');

        if (error) {
          errors.push(`Batch ${Math.floor(i/batchSize) + 1}: ${error.message}`);
        } else {
          created += data?.length || 0;
        }
      }

      return { created, updated, errors };
    } catch (error) {
      console.error('Error batch creating leads:', error);
      return { created, updated, errors: [error instanceof Error ? error.message : 'Unknown error'] };
    }
  }

  /**
   * Get validation result from cache or compute fresh
   */
  static async validateLeadForCampaign(
    leadId: string,
    campaignId: string,
    forceRefresh = false
  ): Promise<CampaignAssignmentResult> {
    try {
      // Check cache first (unless force refresh)
      if (!forceRefresh) {
        const cached = await this.getValidationFromCache(leadId, campaignId);
        if (cached && new Date(cached.expires_at) > new Date()) {
          return {
            canAssign: cached.can_assign,
            blockedReasons: cached.blocked_reasons || [],
            warnings: cached.warnings || [],
            suggestions: cached.suggestions || [],
            validLeadsCount: cached.can_assign ? 1 : 0,
            totalLeadsCount: 1,
            estimatedSuccessRate: cached.estimated_success_rate
          };
        }
      }

      // Fetch fresh data
      const [leadData, campaignData] = await Promise.all([
        this.getLeadById(leadId),
        this.getCampaignById(campaignId)
      ]);

      if (!leadData || !campaignData) {
        throw new Error('Lead or campaign not found');
      }

      // Convert to rule engine format
      const lead = this.convertToLeadProfile(leadData);
      const campaign = this.convertToCampaignProfile(campaignData);

      // Run validation
      const startTime = Date.now();
      const result = SAMCampaignRulesEngine.validateLeadForCampaign(lead, campaign);
      const computationTime = Date.now() - startTime;

      // Cache the result
      await this.cacheValidationResult(leadId, campaignId, result, computationTime);

      return result;
    } catch (error) {
      console.error('Error validating lead for campaign:', error);
      throw error;
    }
  }

  /**
   * Validate multiple leads for campaign (bulk)
   */
  static async validateLeadsForCampaign(
    leadIds: string[],
    campaignId: string
  ): Promise<CampaignAssignmentResult> {
    try {
      const validationPromises = leadIds.map(leadId => 
        this.validateLeadForCampaign(leadId, campaignId)
      );

      const results = await Promise.allSettled(validationPromises);
      
      // Aggregate results
      let validLeadsCount = 0;
      const allBlockedReasons: string[] = [];
      const allWarnings: string[] = [];
      const allSuggestions: string[] = [];

      results.forEach(result => {
        if (result.status === 'fulfilled') {
          if (result.value.canAssign) {
            validLeadsCount++;
          }
          allBlockedReasons.push(...result.value.blockedReasons);
          allWarnings.push(...result.value.warnings);
          allSuggestions.push(...result.value.suggestions);
        }
      });

      return {
        canAssign: validLeadsCount > 0,
        blockedReasons: [...new Set(allBlockedReasons)],
        warnings: [...new Set(allWarnings)],
        suggestions: [...new Set(allSuggestions)],
        validLeadsCount,
        totalLeadsCount: leadIds.length,
        estimatedSuccessRate: validLeadsCount > 0 ? Math.round((validLeadsCount / leadIds.length) * 100) : 0
      };
    } catch (error) {
      console.error('Error bulk validating leads:', error);
      throw error;
    }
  }

  /**
   * Assign leads to campaign with validation
   */
  static async assignLeadsToCampaign(
    leadIds: string[],
    campaignId: string,
    workspaceId: string,
    assignedBy: string
  ): Promise<{ assigned: number, failed: number, errors: string[] }> {
    let assigned = 0;
    let failed = 0;
    const errors: string[] = [];

    try {
      // Validate first
      const validationResult = await this.validateLeadsForCampaign(leadIds, campaignId);
      
      if (validationResult.validLeadsCount === 0) {
        return {
          assigned: 0,
          failed: leadIds.length,
          errors: [`No leads passed validation: ${validationResult.blockedReasons.join(', ')}`]
        };
      }

      // Get campaign to check daily limits
      const campaign = await this.getCampaignById(campaignId);
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      // Check daily limit
      if (campaign.current_leads_today + validationResult.validLeadsCount > campaign.max_leads_per_day) {
        return {
          assigned: 0,
          failed: leadIds.length,
          errors: [`Would exceed daily limit: ${campaign.current_leads_today + validationResult.validLeadsCount}/${campaign.max_leads_per_day}`]
        };
      }

      // Validate each lead individually and assign valid ones
      for (const leadId of leadIds) {
        try {
          const validation = await this.validateLeadForCampaign(leadId, campaignId);
          
          if (validation.canAssign) {
            const assignment: Partial<CampaignAssignment> = {
              campaign_id: campaignId,
              lead_id: leadId,
              workspace_id: workspaceId,
              assigned_by: assignedBy,
              status: 'assigned',
              priority: 1,
              validation_passed: true,
              validation_warnings: validation.warnings,
              validation_suggestions: validation.suggestions,
              estimated_success_rate: validation.estimatedSuccessRate,
              total_messages: 0
            };

            const { error } = await supabase
              .from('campaign_assignments')
              .insert([assignment]);

            if (error) {
              if (error.code === '23505') { // Unique constraint violation
                errors.push(`Lead ${leadId} already assigned to this campaign`);
              } else {
                errors.push(`Lead ${leadId}: ${error.message}`);
              }
              failed++;
            } else {
              assigned++;
            }
          } else {
            failed++;
            errors.push(`Lead ${leadId}: ${validation.blockedReasons.join(', ')}`);
          }
        } catch (error) {
          failed++;
          errors.push(`Lead ${leadId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Update campaign counters
      if (assigned > 0) {
        await supabase
          .from('campaigns')
          .update({
            current_leads_today: campaign.current_leads_today + assigned,
            current_leads_total: campaign.current_leads_total + assigned,
            updated_at: new Date().toISOString()
          })
          .eq('id', campaignId);
      }

      return { assigned, failed, errors };
    } catch (error) {
      console.error('Error assigning leads to campaign:', error);
      return {
        assigned: 0,
        failed: leadIds.length,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Get campaign assignments
   */
  static async getCampaignAssignments(
    campaignId: string,
    filters?: {
      status?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<{ assignments: CampaignAssignment[], total: number }> {
    try {
      let query = supabase
        .from('campaign_assignments')
        .select('*', { count: 'exact' })
        .eq('campaign_id', campaignId);

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      if (filters?.offset) {
        query = query.range(filters.offset, (filters.offset + (filters.limit || 50)) - 1);
      }

      query = query.order('assigned_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        assignments: data || [],
        total: count || 0
      };
    } catch (error) {
      console.error('Error fetching campaign assignments:', error);
      throw error;
    }
  }

  /**
   * Update assignment status
   */
  static async updateAssignmentStatus(
    assignmentId: string,
    status: CampaignAssignment['status'],
    customFields?: any
  ): Promise<CampaignAssignment> {
    try {
      const updates: any = {
        status,
        updated_at: new Date().toISOString()
      };

      // Set timestamp fields based on status
      const now = new Date().toISOString();
      switch (status) {
        case 'contacted':
          updates.first_contact_at = updates.first_contact_at || now;
          updates.last_contact_at = now;
          break;
        case 'responded':
          updates.response_at = now;
          break;
        case 'connected':
          updates.connection_at = now;
          break;
      }

      if (customFields) {
        updates.custom_fields = customFields;
      }

      const { data, error } = await supabase
        .from('campaign_assignments')
        .update(updates)
        .eq('id', assignmentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating assignment status:', error);
      throw error;
    }
  }

  /**
   * Get campaign analytics
   */
  static async getCampaignAnalytics(
    campaignId: string,
    dateRange?: { from: string; to: string }
  ): Promise<any> {
    try {
      let query = supabase
        .from('campaign_analytics')
        .select('*')
        .eq('campaign_id', campaignId);

      if (dateRange) {
        query = query.gte('date', dateRange.from).lte('date', dateRange.to);
      }

      query = query.order('date', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      // Aggregate data
      const totals = data?.reduce((acc, day) => ({
        leads_assigned: acc.leads_assigned + day.leads_assigned,
        messages_sent: acc.messages_sent + day.messages_sent,
        responses_received: acc.responses_received + day.responses_received,
        connections_made: acc.connections_made + day.connections_made,
        total_cost: acc.total_cost + day.total_cost
      }), {
        leads_assigned: 0,
        messages_sent: 0,
        responses_received: 0,
        connections_made: 0,
        total_cost: 0
      });

      return {
        daily: data || [],
        totals: totals || {},
        response_rate: totals && totals.messages_sent > 0 
          ? Math.round((totals.responses_received / totals.messages_sent) * 100)
          : 0,
        connection_rate: totals && totals.leads_assigned > 0
          ? Math.round((totals.connections_made / totals.leads_assigned) * 100)
          : 0
      };
    } catch (error) {
      console.error('Error fetching campaign analytics:', error);
      throw error;
    }
  }

  // Helper methods

  private static async getLeadById(id: string): Promise<DatabaseLeadProfile | null> {
    const { data, error } = await supabase
      .from('lead_profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  }

  private static async getCampaignById(id: string): Promise<DatabaseCampaign | null> {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  }

  private static async getValidationFromCache(
    leadId: string, 
    campaignId: string
  ): Promise<ValidationCacheEntry | null> {
    const { data, error } = await supabase
      .from('validation_cache')
      .select('*')
      .eq('lead_id', leadId)
      .eq('campaign_id', campaignId)
      .single();

    if (error) return null;
    return data;
  }

  private static async cacheValidationResult(
    leadId: string,
    campaignId: string,
    result: CampaignAssignmentResult,
    computationTimeMs: number
  ): Promise<void> {
    const cacheEntry: Partial<ValidationCacheEntry> = {
      lead_id: leadId,
      campaign_id: campaignId,
      can_assign: result.canAssign,
      blocked_reasons: result.blockedReasons,
      warnings: result.warnings,
      suggestions: result.suggestions,
      estimated_success_rate: result.estimatedSuccessRate,
      computation_time_ms: computationTimeMs,
      expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour
    };

    await supabase
      .from('validation_cache')
      .upsert([cacheEntry], {
        onConflict: 'lead_id,campaign_id'
      });
  }

  private static convertToLeadProfile(dbLead: DatabaseLeadProfile): LeadProfile {
    return {
      id: dbLead.id,
      name: dbLead.name,
      title: dbLead.title,
      company: dbLead.company,
      location: dbLead.location,
      email: dbLead.email,
      phone: dbLead.phone,
      linkedin_url: dbLead.linkedin_url,
      connection_degree: dbLead.connection_degree as any,
      premium_account: dbLead.premium_account,
      open_to_work: dbLead.open_to_work,
      profile_visibility: dbLead.profile_visibility as any,
      last_activity: dbLead.last_activity,
      profile_completeness: dbLead.profile_completeness,
      mutual_connections: dbLead.mutual_connections,
      follower_count: dbLead.follower_count,
      has_company_page: dbLead.has_company_page,
      industry: dbLead.industry,
      seniority_level: dbLead.seniority_level,
      search_source: dbLead.search_source as any
    };
  }

  private static convertToCampaignProfile(dbCampaign: DatabaseCampaign): CampaignProfile {
    return {
      id: dbCampaign.id,
      name: dbCampaign.name,
      type: dbCampaign.type,
      target_audience: dbCampaign.target_audience as any,
      connection_required: dbCampaign.connection_required,
      premium_required: dbCampaign.premium_required,
      email_required: dbCampaign.email_required,
      phone_required: dbCampaign.phone_required,
      min_mutual_connections: dbCampaign.min_mutual_connections,
      max_connection_degree: dbCampaign.max_connection_degree,
      allowed_search_sources: dbCampaign.allowed_search_sources,
      min_profile_completeness: dbCampaign.min_profile_completeness,
      excluded_industries: dbCampaign.excluded_industries,
      excluded_titles: dbCampaign.excluded_titles,
      max_leads_per_day: dbCampaign.max_leads_per_day,
      current_leads_today: dbCampaign.current_leads_today
    };
  }
}