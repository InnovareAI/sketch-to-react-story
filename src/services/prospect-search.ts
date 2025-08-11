// Enhanced Prospect Search Service
// Integrates with Bright Data and n8n workflows for LinkedIn scraping

import { supabase } from '@/lib/supabase';
import { enhancedBrightDataService } from '@/services/brightdata-proxy-secure';
import { n8nService } from '@/services/n8n/N8nIntegrationService';
import { N8nProspectWorkflows } from '@/services/n8n-prospect-workflows';
import { N8N_LINKEDIN_WORKFLOW_TEMPLATES, deployWorkflowToN8n } from '@/services/n8n-workflow-templates';
import {
  SearchConfiguration,
  SearchConfigurationInsert,
  SearchConfigurationUpdate,
  CompanyProfile,
  CompanyProfileInsert,
  ProspectProfile,
  ProspectProfileInsert,
  SearchResult,
  SearchResultInsert,
  SearchHistory,
  SearchHistoryInsert,
  CsvUploadSession,
  CsvUploadSessionInsert,
  ProspectCampaignAssignment,
  ProspectCampaignAssignmentInsert,
  EnrichmentQueue,
  EnrichmentQueueInsert,
  CreateSearchConfigurationRequest,
  ExecuteSearchRequest,
  ExecuteSearchResponse,
  UploadCsvRequest,
  UploadCsvResponse,
  ProcessCsvRequest,
  ProcessCsvResponse,
  AssignProspectsToCampaignRequest,
  AssignProspectsToCampaignResponse,
  BulkEnrichProspectsRequest,
  BulkEnrichProspectsResponse,
  SearchStats,
  ProspectSearchFilters,
  CompanySearchFilters,
  PaginationParams,
  PaginatedResponse,
  CsvValidationError,
  SearchType,
  SearchMethod,
} from '@/types/prospect-search';

interface BrightDataSearchOptions {
  maxResults?: number;
  country?: string;
  state?: string;
  linkedInAccountId?: string;
  filters?: {
    location?: string[];
    industry?: string[];
    currentCompany?: string[];
    jobTitle?: string[];
  };
}

export class ProspectSearchService {
  
  // =====================================================
  // SEARCH CONFIGURATION METHODS
  // =====================================================
  
  static async createSearchConfiguration(
    request: CreateSearchConfigurationRequest,
    workspaceId: string,
    userId: string
  ): Promise<SearchConfiguration> {
    const insertData: SearchConfigurationInsert = {
      workspace_id: workspaceId,
      user_id: userId,
      ...request,
    };

    const { data, error } = await supabase
      .from('search_configurations')
      .insert(insertData)
      .select()
      .single();

    if (error) throw new Error(`Failed to create search configuration: ${error.message}`);
    return data;
  }

  static async getSearchConfigurations(
    workspaceId: string,
    filters?: { search_type?: SearchType; status?: string },
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<SearchConfiguration>> {
    let query = supabase
      .from('search_configurations')
      .select('*', { count: 'exact' })
      .eq('workspace_id', workspaceId)
      .order(pagination?.sort_by || 'created_at', { 
        ascending: pagination?.sort_order === 'asc' 
      });

    if (filters?.search_type) {
      query = query.eq('search_type', filters.search_type);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const offset = (page - 1) * limit;

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw new Error(`Failed to fetch search configurations: ${error.message}`);

    return {
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit),
        has_next: offset + limit < (count || 0),
        has_previous: page > 1,
      },
    };
  }

  static async getSearchConfiguration(id: string): Promise<SearchConfiguration> {
    const { data, error } = await supabase
      .from('search_configurations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new Error(`Failed to fetch search configuration: ${error.message}`);
    return data;
  }

  static async updateSearchConfiguration(
    id: string,
    updates: SearchConfigurationUpdate
  ): Promise<SearchConfiguration> {
    const { data, error } = await supabase
      .from('search_configurations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update search configuration: ${error.message}`);
    return data;
  }

  static async deleteSearchConfiguration(id: string): Promise<void> {
    const { error } = await supabase
      .from('search_configurations')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Failed to delete search configuration: ${error.message}`);
  }

  // =====================================================
  // PROSPECT PROFILE METHODS
  // =====================================================

  static async createProspectProfile(
    prospect: ProspectProfileInsert
  ): Promise<ProspectProfile> {
    // Check for duplicates first
    const duplicates = await this.findDuplicateProspects(
      prospect.workspace_id,
      prospect.email,
      prospect.linkedin_profile_id,
      prospect.full_name,
      prospect.company_name
    );

    if (duplicates.length > 0) {
      throw new Error(`Duplicate prospect found: ${duplicates[0].full_name}`);
    }

    const { data, error } = await supabase
      .from('prospect_profiles')
      .insert(prospect)
      .select()
      .single();

    if (error) throw new Error(`Failed to create prospect profile: ${error.message}`);
    return data;
  }

  static async bulkCreateProspectProfiles(
    prospects: ProspectProfileInsert[],
    checkDuplicates: boolean = true
  ): Promise<{ created: ProspectProfile[]; duplicates: string[]; errors: string[] }> {
    const created: ProspectProfile[] = [];
    const duplicates: string[] = [];
    const errors: string[] = [];

    for (const prospect of prospects) {
      try {
        if (checkDuplicates) {
          const existingDuplicates = await this.findDuplicateProspects(
            prospect.workspace_id,
            prospect.email,
            prospect.linkedin_profile_id,
            prospect.full_name,
            prospect.company_name
          );

          if (existingDuplicates.length > 0) {
            duplicates.push(prospect.full_name);
            continue;
          }
        }

        const { data, error } = await supabase
          .from('prospect_profiles')
          .insert(prospect)
          .select()
          .single();

        if (error) {
          errors.push(`${prospect.full_name}: ${error.message}`);
        } else {
          created.push(data);
        }
      } catch (err) {
        errors.push(`${prospect.full_name}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    return { created, duplicates, errors };
  }

  static async getProspectProfiles(
    workspaceId: string,
    filters?: ProspectSearchFilters,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<ProspectProfile>> {
    let query = supabase
      .from('prospect_profiles')
      .select('*', { count: 'exact' })
      .eq('workspace_id', workspaceId)
      .order(pagination?.sort_by || 'created_at', { 
        ascending: pagination?.sort_order === 'asc' 
      });

    // Apply filters
    if (filters) {
      if (filters.location?.length) {
        query = query.in('location', filters.location);
      }
      if (filters.industry?.length) {
        query = query.in('industry', filters.industry);
      }
      if (filters.experience_level?.length) {
        query = query.in('experience_level', filters.experience_level);
      }
      if (filters.enrichment_status?.length) {
        query = query.in('enrichment_status', filters.enrichment_status);
      }
      if (filters.has_email !== undefined) {
        if (filters.has_email) {
          query = query.not('email', 'is', null);
        } else {
          query = query.is('email', null);
        }
      }
      if (filters.has_phone !== undefined) {
        if (filters.has_phone) {
          query = query.not('phone', 'is', null);
        } else {
          query = query.is('phone', null);
        }
      }
      if (filters.premium_only !== undefined) {
        query = query.eq('premium_account', filters.premium_only);
      }
      if (filters.open_to_work !== undefined) {
        query = query.eq('open_to_work', filters.open_to_work);
      }
      if (filters.keywords?.length) {
        const searchTerm = filters.keywords.join(' | ');
        query = query.textSearch('full_name,headline,title', searchTerm);
      }
      if (filters.created_after) {
        query = query.gte('created_at', filters.created_after);
      }
      if (filters.created_before) {
        query = query.lte('created_at', filters.created_before);
      }
    }

    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const offset = (page - 1) * limit;

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw new Error(`Failed to fetch prospect profiles: ${error.message}`);

    return {
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit),
        has_next: offset + limit < (count || 0),
        has_previous: page > 1,
      },
    };
  }

  static async getProspectProfile(id: string): Promise<ProspectProfile> {
    const { data, error } = await supabase
      .from('prospect_profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new Error(`Failed to fetch prospect profile: ${error.message}`);
    return data;
  }

  static async updateProspectProfile(
    id: string,
    updates: Partial<ProspectProfile>
  ): Promise<ProspectProfile> {
    const { data, error } = await supabase
      .from('prospect_profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update prospect profile: ${error.message}`);
    return data;
  }

  static async findDuplicateProspects(
    workspaceId: string,
    email?: string,
    linkedinId?: string,
    fullName?: string,
    companyName?: string
  ): Promise<ProspectProfile[]> {
    const { data, error } = await supabase.rpc('detect_duplicate_prospects', {
      workspace_uuid: workspaceId,
      email_input: email,
      linkedin_id_input: linkedinId,
      full_name_input: fullName,
      company_input: companyName,
    });

    if (error) {
      console.error('Error detecting duplicates:', error);
      return [];
    }

    if (!data || data.length === 0) return [];

    const { data: prospects, error: fetchError } = await supabase
      .from('prospect_profiles')
      .select('*')
      .in('id', data);

    if (fetchError) {
      console.error('Error fetching duplicate prospects:', fetchError);
      return [];
    }

    return prospects || [];
  }

  // =====================================================
  // SEARCH EXECUTION METHODS
  // =====================================================

  /**
   * Enhanced search execution with Bright Data and n8n integration
   */
  static async executeSearch(request: ExecuteSearchRequest & {
    searchUrl?: string;
    brightDataOptions?: BrightDataSearchOptions;
  }): Promise<ExecuteSearchResponse & {
    bright_data_search_id?: string;
    n8n_execution_id?: string;
    estimated_cost?: number;
    budget_status?: 'ok' | 'warning' | 'exceeded';
  }> {
    const config = await this.getSearchConfiguration(request.search_configuration_id);
    
    // Check Bright Data budget and constraints
    const usageAnalytics = await enhancedBrightDataService.getUsageAnalytics();
    const budgetUtilization = usageAnalytics.monthly_summary.budget_utilization;
    
    let budgetStatus: 'ok' | 'warning' | 'exceeded' = 'ok';
    if (budgetUtilization >= 1.0) {
      budgetStatus = 'exceeded';
    } else if (budgetUtilization >= 0.8) {
      budgetStatus = 'warning';
    }
    
    if (budgetStatus === 'exceeded') {
      throw new Error('Monthly Bright Data budget exceeded. Cannot execute search.');
    }
    
    // Create search history entry
    const historyData: SearchHistoryInsert = {
      search_configuration_id: request.search_configuration_id,
      workspace_id: config.workspace_id,
      user_id: config.user_id,
      execution_type: request.execution_type || 'manual',
      search_url: request.search_url,
    };

    const { data: history, error: historyError } = await supabase
      .from('search_history')
      .insert(historyData)
      .select()
      .single();

    if (historyError) {
      throw new Error(`Failed to create search history: ${historyError.message}`);
    }

    try {
      let brightDataSearchId: string | undefined;
      let n8nExecutionId: string | undefined;
      let estimatedCost = 0;
      
      // Execute search based on search type
      switch (config.search_type) {
        case 'basic-search':
          if (request.searchUrl) {
            const searchResult = await enhancedBrightDataService.executeLinkedInBasicSearch(
              request.searchUrl,
              {
                maxResults: request.brightDataOptions?.maxResults || 50,
                country: request.brightDataOptions?.country,
                state: request.brightDataOptions?.state,
                workspaceId: config.workspace_id,
                searchConfigId: config.id,
                filters: request.brightDataOptions?.filters
              }
            );
            estimatedCost = searchResult.cost_info.estimated_cost;
          }
          break;
          
        case 'sales-navigator':
          if (request.searchUrl) {
            const searchResult = await enhancedBrightDataService.executeLinkedInSalesNavigatorSearch(
              request.searchUrl,
              {
                maxResults: request.brightDataOptions?.maxResults || 25,
                country: request.brightDataOptions?.country,
                workspaceId: config.workspace_id,
                searchConfigId: config.id,
                premiumFilters: {
                  seniority: request.brightDataOptions?.filters?.jobTitle,
                  geography: request.brightDataOptions?.filters?.location,
                  companySize: request.brightDataOptions?.filters?.currentCompany
                }
              }
            );
            estimatedCost = searchResult.cost_info.estimated_cost;
          }
          break;
          
        case 'recruiter-search':
          if (request.searchUrl) {
            const searchResult = await enhancedBrightDataService.executeLinkedInRecruiterSearch(
              request.searchUrl,
              {
                maxResults: request.brightDataOptions?.maxResults || 25,
                country: request.brightDataOptions?.country,
                workspaceId: config.workspace_id,
                searchConfigId: config.id,
                recruiterFilters: {
                  skills: request.brightDataOptions?.filters?.jobTitle
                }
              }
            );
            estimatedCost = searchResult.cost_info.estimated_cost;
          }
          break;
          
        case 'company-follower':
          // Get company URL from search parameters
          const companyUrl = config.parameters.company_url as string;
          if (companyUrl) {
            const followersResult = await enhancedBrightDataService.scrapeCompanyFollowers(
              companyUrl,
              {
                maxFollowers: request.brightDataOptions?.maxResults || 200,
                workspaceId: config.workspace_id,
                searchConfigId: config.id,
                filters: {
                  location: request.brightDataOptions?.filters?.location,
                  jobTitle: request.brightDataOptions?.filters?.jobTitle
                }
              }
            );
            estimatedCost = followersResult.cost_info.estimated_cost;
          }
          break;
          
        case 'post-engagement':
          const postUrl = config.parameters.post_url as string;
          if (postUrl) {
            const engagementResult = await enhancedBrightDataService.scrapePostEngagement(
              postUrl,
              {
                maxEngagers: request.brightDataOptions?.maxResults || 100,
                workspaceId: config.workspace_id,
                searchConfigId: config.id,
                engagementTypes: ['like', 'comment', 'share']
              }
            );
            estimatedCost = engagementResult.cost_info.estimated_cost;
          }
          break;
          
        case 'group-search':
          const groupUrl = config.parameters.group_url as string;
          if (groupUrl) {
            const membersResult = await enhancedBrightDataService.scrapeGroupMembers(
              groupUrl,
              {
                maxMembers: request.brightDataOptions?.maxResults || 500,
                workspaceId: config.workspace_id,
                searchConfigId: config.id
              }
            );
            estimatedCost = membersResult.cost_info.estimated_cost;
          }
          break;
          
        case 'event-search':
          const eventUrl = config.parameters.event_url as string;
          if (eventUrl) {
            const attendeesResult = await enhancedBrightDataService.scrapeEventAttendees(
              eventUrl,
              {
                maxAttendees: request.brightDataOptions?.maxResults || 300,
                workspaceId: config.workspace_id,
                searchConfigId: config.id,
                attendanceTypes: ['attending', 'interested']
              }
            );
            estimatedCost = attendeesResult.cost_info.estimated_cost;
          }
          break;
          
        case 'people-you-know':
          if (request.brightDataOptions?.linkedInAccountId) {
            const suggestionsResult = await enhancedBrightDataService.scrapePeopleYouMayKnow({
              maxSuggestions: request.brightDataOptions?.maxResults || 50,
              workspaceId: config.workspace_id,
              searchConfigId: config.id,
              linkedInAccountId: request.brightDataOptions.linkedInAccountId
            });
            estimatedCost = suggestionsResult.cost_info.estimated_cost;
          }
          break;
          
        default:
          throw new Error(`Search type ${config.search_type} not supported`);
      }
      
      // Update search history with success
      await supabase
        .from('search_history')
        .update({
          status: 'running',
          bright_data_usage: {
            estimated_cost: estimatedCost,
            search_id: brightDataSearchId
          }
        })
        .eq('id', history.id);
      
      return {
        search_history_id: history.id,
        status: 'started',
        message: 'Search execution started successfully with Bright Data',
        bright_data_search_id: brightDataSearchId,
        n8n_execution_id: n8nExecutionId,
        estimated_cost: estimatedCost,
        budget_status: budgetStatus
      };
    } catch (error) {
      // Update history with error
      await supabase
        .from('search_history')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          completed_at: new Date().toISOString(),
        })
        .eq('id', history.id);

      return {
        search_history_id: history.id,
        status: 'error',
        message: error instanceof Error ? error.message : 'Search execution failed',
        budget_status: budgetStatus
      };
    }
  }

  static async getSearchHistory(
    workspaceId: string,
    searchConfigId?: string,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<SearchHistory>> {
    let query = supabase
      .from('search_history')
      .select(`
        *,
        search_configuration:search_configurations(*)
      `, { count: 'exact' })
      .eq('workspace_id', workspaceId)
      .order('started_at', { ascending: false });

    if (searchConfigId) {
      query = query.eq('search_configuration_id', searchConfigId);
    }

    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const offset = (page - 1) * limit;

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw new Error(`Failed to fetch search history: ${error.message}`);

    return {
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit),
        has_next: offset + limit < (count || 0),
        has_previous: page > 1,
      },
    };
  }

  static async getSearchStats(searchConfigId: string): Promise<SearchStats> {
    const { data, error } = await supabase.rpc('get_search_stats', {
      config_id: searchConfigId,
    });

    if (error) throw new Error(`Failed to fetch search stats: ${error.message}`);
    return data;
  }

  // =====================================================
  // CSV UPLOAD METHODS
  // =====================================================

  static async createCsvUploadSession(
    request: UploadCsvRequest,
    workspaceId: string,
    userId: string
  ): Promise<UploadCsvResponse> {
    const insertData: CsvUploadSessionInsert = {
      workspace_id: workspaceId,
      user_id: userId,
      filename: request.filename,
      file_size: request.file_size,
      field_mappings: request.field_mappings,
    };

    const { data, error } = await supabase
      .from('csv_upload_sessions')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      return {
        session_id: '',
        status: 'error',
        message: `Failed to create CSV upload session: ${error.message}`,
      };
    }

    return {
      session_id: data.id,
      status: 'created',
      message: 'CSV upload session created successfully',
    };
  }

  static async processCsvUpload(request: ProcessCsvRequest): Promise<ProcessCsvResponse> {
    const { data: session, error: sessionError } = await supabase
      .from('csv_upload_sessions')
      .select('*')
      .eq('id', request.session_id)
      .single();

    if (sessionError) {
      return {
        session_id: request.session_id,
        status: 'error',
        message: `Failed to fetch CSV session: ${sessionError.message}`,
      };
    }

    try {
      // Update session status to processing
      await supabase
        .from('csv_upload_sessions')
        .update({
          status: 'processing',
          processing_started_at: new Date().toISOString(),
        })
        .eq('id', request.session_id);

      // Here you would process the actual CSV data
      // This could involve parsing the file, validating data, 
      // creating prospects, checking duplicates, etc.

      // For now, return a processing status
      return {
        session_id: request.session_id,
        status: 'processing',
        message: 'CSV processing started successfully',
      };
    } catch (error) {
      await supabase
        .from('csv_upload_sessions')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          processing_completed_at: new Date().toISOString(),
        })
        .eq('id', request.session_id);

      return {
        session_id: request.session_id,
        status: 'error',
        message: error instanceof Error ? error.message : 'CSV processing failed',
      };
    }
  }

  static async getCsvUploadSession(sessionId: string): Promise<CsvUploadSession> {
    const { data, error } = await supabase
      .from('csv_upload_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error) throw new Error(`Failed to fetch CSV upload session: ${error.message}`);
    return data;
  }

  // =====================================================
  // CAMPAIGN ASSIGNMENT METHODS
  // =====================================================

  static async assignProspectsToCampaign(
    request: AssignProspectsToCampaignRequest,
    workspaceId: string,
    userId: string
  ): Promise<AssignProspectsToCampaignResponse> {
    const assignments: ProspectCampaignAssignmentInsert[] = request.prospect_ids.map(
      (prospectId) => ({
        prospect_id: prospectId,
        campaign_id: request.campaign_id,
        workspace_id: workspaceId,
        assigned_by: userId,
        segment: request.segment,
        priority: request.priority || 0,
        custom_fields: request.custom_fields || {},
      })
    );

    const results = {
      assignments_created: 0,
      duplicates_skipped: 0,
      errors: [] as string[],
    };

    for (const assignment of assignments) {
      try {
        const { error } = await supabase
          .from('prospect_campaign_assignments')
          .insert(assignment);

        if (error) {
          if (error.code === '23505') { // Unique constraint violation
            results.duplicates_skipped++;
          } else {
            results.errors.push(
              `Prospect ${assignment.prospect_id}: ${error.message}`
            );
          }
        } else {
          results.assignments_created++;
        }
      } catch (err) {
        results.errors.push(
          `Prospect ${assignment.prospect_id}: ${
            err instanceof Error ? err.message : 'Unknown error'
          }`
        );
      }
    }

    return results;
  }

  static async getProspectCampaignAssignments(
    workspaceId: string,
    campaignId?: string,
    prospectId?: string,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<ProspectCampaignAssignment>> {
    let query = supabase
      .from('prospect_campaign_assignments')
      .select(`
        *,
        prospect:prospect_profiles(*),
        campaign:campaigns(id, name, status)
      `, { count: 'exact' })
      .eq('workspace_id', workspaceId)
      .order('assigned_at', { ascending: false });

    if (campaignId) {
      query = query.eq('campaign_id', campaignId);
    }
    if (prospectId) {
      query = query.eq('prospect_id', prospectId);
    }

    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const offset = (page - 1) * limit;

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw new Error(`Failed to fetch campaign assignments: ${error.message}`);

    return {
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit),
        has_next: offset + limit < (count || 0),
        has_previous: page > 1,
      },
    };
  }

  // =====================================================
  // ENRICHMENT METHODS
  // =====================================================

  static async bulkEnrichProspects(
    request: BulkEnrichProspectsRequest,
    workspaceId: string
  ): Promise<BulkEnrichProspectsResponse> {
    const enrichmentTasks: EnrichmentQueueInsert[] = [];

    for (const prospectId of request.prospect_ids) {
      for (const enrichmentType of request.enrichment_types) {
        enrichmentTasks.push({
          prospect_id: prospectId,
          workspace_id: workspaceId,
          enrichment_type,
          priority: request.priority || 0,
          provider: request.provider,
        });
      }
    }

    let queuedCount = 0;
    let skippedCount = 0;

    for (const task of enrichmentTasks) {
      try {
        const { error } = await supabase
          .from('enrichment_queue')
          .insert(task);

        if (error) {
          skippedCount++;
        } else {
          queuedCount++;
        }
      } catch {
        skippedCount++;
      }
    }

    return {
      queued_count: queuedCount,
      skipped_count: skippedCount,
      total_credits_estimated: queuedCount * 1, // Rough estimate
    };
  }

  static async getEnrichmentQueue(
    workspaceId: string,
    status?: string,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<EnrichmentQueue>> {
    let query = supabase
      .from('enrichment_queue')
      .select(`
        *,
        prospect:prospect_profiles(*)
      `, { count: 'exact' })
      .eq('workspace_id', workspaceId)
      .order('scheduled_at', { ascending: true });

    if (status) {
      query = query.eq('status', status);
    }

    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const offset = (page - 1) * limit;

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw new Error(`Failed to fetch enrichment queue: ${error.message}`);

    return {
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit),
        has_next: offset + limit < (count || 0),
        has_previous: page > 1,
      },
    };
  }

  // =====================================================
  // COMPANY PROFILE METHODS
  // =====================================================

  static async createCompanyProfile(
    company: CompanyProfileInsert
  ): Promise<CompanyProfile> {
    const { data, error } = await supabase
      .from('company_profiles')
      .insert(company)
      .select()
      .single();

    if (error) throw new Error(`Failed to create company profile: ${error.message}`);
    return data;
  }

  static async getCompanyProfiles(
    workspaceId: string,
    filters?: CompanySearchFilters,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<CompanyProfile>> {
    let query = supabase
      .from('company_profiles')
      .select('*', { count: 'exact' })
      .eq('workspace_id', workspaceId)
      .order(pagination?.sort_by || 'created_at', { 
        ascending: pagination?.sort_order === 'asc' 
      });

    // Apply filters
    if (filters) {
      if (filters.industry?.length) {
        query = query.in('industry', filters.industry);
      }
      if (filters.company_size?.length) {
        query = query.in('company_size', filters.company_size);
      }
      if (filters.verification_status?.length) {
        query = query.in('verification_status', filters.verification_status);
      }
      if (filters.follower_count_min !== undefined) {
        query = query.gte('follower_count', filters.follower_count_min);
      }
      if (filters.follower_count_max !== undefined) {
        query = query.lte('follower_count', filters.follower_count_max);
      }
      if (filters.employee_count_min !== undefined) {
        query = query.gte('employee_count', filters.employee_count_min);
      }
      if (filters.employee_count_max !== undefined) {
        query = query.lte('employee_count', filters.employee_count_max);
      }
    }

    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const offset = (page - 1) * limit;

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw new Error(`Failed to fetch company profiles: ${error.message}`);

    return {
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit),
        has_next: offset + limit < (count || 0),
        has_previous: page > 1,
      },
    };
  }

  // =====================================================
  // BRIGHT DATA INTEGRATION METHODS
  // =====================================================
  
  /**
   * Get Bright Data usage analytics and budget status
   */
  static async getBrightDataAnalytics(workspaceId: string): Promise<{
    usage_stats: any;
    cost_tracker: any;
    monthly_summary: any;
    budget_alerts: string[];
  }> {
    try {
      const analytics = await enhancedBrightDataService.getUsageAnalytics();
      const budgetAlerts: string[] = [];
      
      // Generate budget alerts
      if (analytics.monthly_summary.budget_utilization >= 1.0) {
        budgetAlerts.push('Monthly budget exceeded - searches are blocked');
      } else if (analytics.monthly_summary.budget_utilization >= 0.9) {
        budgetAlerts.push('90% of monthly budget used - approaching limit');
      } else if (analytics.monthly_summary.budget_utilization >= 0.8) {
        budgetAlerts.push('80% of monthly budget used - consider monitoring usage');
      }
      
      if (analytics.cost_tracker.current_spend > 0) {
        const avgCostPerProspect = analytics.monthly_summary.average_cost_per_prospect;
        const remainingBudget = analytics.cost_tracker.monthly_budget - analytics.cost_tracker.current_spend;
        const estimatedProspectsLeft = Math.floor(remainingBudget / Math.max(avgCostPerProspect, 0.01));
        
        if (estimatedProspectsLeft < 50) {
          budgetAlerts.push(`Estimated ${estimatedProspectsLeft} prospects remaining with current budget`);
        }
      }
      
      return {
        usage_stats: analytics.usage_stats,
        cost_tracker: analytics.cost_tracker,
        monthly_summary: analytics.monthly_summary,
        budget_alerts: budgetAlerts
      };
    } catch (error) {
      console.error('Error getting Bright Data analytics:', error);
      throw error;
    }
  }
  
  /**
   * Update Bright Data budget and rate limits
   */
  static async updateBrightDataConfig(config: {
    monthly_budget?: number;
    requests_per_minute?: number;
    requests_per_hour?: number;
    alert_threshold?: number;
  }): Promise<void> {
    try {
      await enhancedBrightDataService.updateBudgetAndLimits(config);
      
      // Log the configuration update
      await supabase.from('brightdata_config_history').insert({
        config_changes: config,
        updated_at: new Date().toISOString(),
        updated_by: 'system'
      });
    } catch (error) {
      console.error('Error updating Bright Data config:', error);
      throw error;
    }
  }
  
  /**
   * Cancel an active Bright Data search
   */
  static async cancelBrightDataSearch(
    searchId: string,
    searchHistoryId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Cancel the Bright Data search
      const cancelResult = await enhancedBrightDataService.cancelSearch(searchId);
      
      if (cancelResult.success) {
        // Update search history status
        await supabase
          .from('search_history')
          .update({
            status: 'cancelled',
            completed_at: new Date().toISOString(),
            error_message: 'Search cancelled by user'
          })
          .eq('id', searchHistoryId);
      }
      
      return cancelResult;
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
  
  /**
   * Get real-time search status with Bright Data integration
   */
  static async getSearchStatus(
    searchHistoryId: string,
    brightDataSearchId?: string
  ): Promise<{
    database_status: string;
    bright_data_status?: any;
    overall_status: 'active' | 'completed' | 'failed' | 'cancelled';
    progress?: number;
    results_found?: number;
    estimated_completion?: string;
  }> {
    try {
      // Get database status
      const { data: searchHistory, error } = await supabase
        .from('search_history')
        .select('*')
        .eq('id', searchHistoryId)
        .single();
      
      if (error) throw error;
      
      let brightDataStatus;
      if (brightDataSearchId) {
        brightDataStatus = await enhancedBrightDataService.getSearchStatus(brightDataSearchId);
      }
      
      // Determine overall status
      let overallStatus: 'active' | 'completed' | 'failed' | 'cancelled';
      if (searchHistory.status === 'completed') {
        overallStatus = 'completed';
      } else if (searchHistory.status === 'failed') {
        overallStatus = 'failed';
      } else if (searchHistory.status === 'cancelled') {
        overallStatus = 'cancelled';
      } else {
        overallStatus = 'active';
      }
      
      return {
        database_status: searchHistory.status,
        bright_data_status: brightDataStatus,
        overall_status: overallStatus,
        progress: brightDataStatus?.progress || 0,
        results_found: searchHistory.results_found || 0,
        estimated_completion: searchHistory.estimated_completion_at
      };
    } catch (error) {
      console.error('Error getting search status:', error);
      throw error;
    }
  }
  
  /**
   * Setup n8n workflows for LinkedIn scraping
   */
  static async setupN8nWorkflows(
    workspaceId: string,
    n8nApiUrl: string,
    n8nApiKey: string
  ): Promise<{
    deployed_workflows: Array<{
      name: string;
      workflow_id: string;
      webhook_url: string;
    }>;
    errors: string[];
  }> {
    const deployedWorkflows: Array<{
      name: string;
      workflow_id: string;
      webhook_url: string;
    }> = [];
    const errors: string[] = [];
    
    try {
      // Deploy each workflow template
      const workflowTemplates = [
        'LINKEDIN_BASIC_SEARCH',
        'LINKEDIN_SALES_NAVIGATOR', 
        'COMPANY_FOLLOWER_SCRAPING',
        'POST_ENGAGEMENT_SCRAPING',
        'GROUP_MEMBER_SCRAPING',
        'EVENT_ATTENDEE_SCRAPING',
        'PEOPLE_SUGGESTIONS_SCRAPING'
      ];
      
      for (const templateKey of workflowTemplates) {
        try {
          const template = N8N_LINKEDIN_WORKFLOW_TEMPLATES[templateKey as keyof typeof N8N_LINKEDIN_WORKFLOW_TEMPLATES];
          
          // Customize template for workspace
          const customizedTemplate = {
            ...template,
            name: `${template.name} - Workspace ${workspaceId}`,
            settings: {
              executionOrder: 'v1',
              saveDataErrorExecution: 'all',
              saveDataSuccessExecution: 'all'
            }
          };
          
          const deployResult = await deployWorkflowToN8n(
            n8nApiUrl,
            n8nApiKey,
            customizedTemplate
          );
          
          if (deployResult.success && deployResult.workflowId) {
            const webhookNode = template.nodes.find((node: any) => node.type === 'n8n-nodes-base.webhook');
            const webhookPath = webhookNode?.parameters?.path || templateKey.toLowerCase();
            
            deployedWorkflows.push({
              name: template.name,
              workflow_id: deployResult.workflowId,
              webhook_url: `${n8nApiUrl}/webhook/${webhookPath}`
            });
            
            // Save workflow mapping to database
            await supabase.from('n8n_workflow_mappings').upsert({
              workspace_id: workspaceId,
              template_key: templateKey,
              workflow_id: deployResult.workflowId,
              webhook_url: `${n8nApiUrl}/webhook/${webhookPath}`,
              deployed_at: new Date().toISOString()
            });
          } else {
            errors.push(`Failed to deploy ${template.name}: ${deployResult.error}`);
          }
        } catch (error) {
          errors.push(`Error deploying ${templateKey}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
      
      return { deployed_workflows: deployedWorkflows, errors };
    } catch (error) {
      console.error('Error setting up n8n workflows:', error);
      throw error;
    }
  }
  
  // =====================================================
  // VALIDATION METHODS
  // =====================================================

  static validateCsvData(
    data: any[],
    fieldMappings: Record<string, string>
  ): { isValid: boolean; errors: CsvValidationError[] } {
    const errors: CsvValidationError[] = [];
    
    // Required fields
    const requiredFields = ['full_name', 'company_name'];
    
    data.forEach((row, index) => {
      const rowNumber = index + 1;
      
      // Check required fields
      requiredFields.forEach((field) => {
        const mappedField = fieldMappings[field];
        if (!mappedField || !row[mappedField] || !row[mappedField].toString().trim()) {
          errors.push({
            row: rowNumber,
            field,
            message: `${field.replace('_', ' ')} is required`,
            value: row[mappedField],
          });
        }
      });
      
      // Validate email format if provided
      const emailField = fieldMappings['email'];
      if (emailField && row[emailField]) {
        const email = row[emailField].toString().trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          errors.push({
            row: rowNumber,
            field: 'email',
            message: 'Invalid email format',
            value: email,
          });
        }
      }
      
      // Validate LinkedIn URL format if provided
      const linkedinField = fieldMappings['profile_url'];
      if (linkedinField && row[linkedinField]) {
        const url = row[linkedinField].toString().trim();
        if (!url.includes('linkedin.com')) {
          errors.push({
            row: rowNumber,
            field: 'profile_url',
            message: 'LinkedIn URL must contain "linkedin.com"',
            value: url,
          });
        }
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}