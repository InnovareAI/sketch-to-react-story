// Lead Enrichment Service - Real-time data enhancement for validation
// Integrates with multiple data providers to enrich lead profiles

import { BrightDataProxyService } from './brightdata-proxy';
import { supabase } from '@/integrations/supabase/client';
import { DatabaseLeadProfile } from './campaign-api-service';

export interface EnrichmentProvider {
  name: string;
  priority: number;
  cost_per_enrichment: number;
  fields_provided: string[];
  rate_limit: number; // requests per minute
  accuracy_score: number; // 0-1
}

export interface EnrichmentRequest {
  lead_id: string;
  linkedin_url?: string;
  email?: string;
  name?: string;
  company?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  fields_needed: string[];
  budget_limit?: number;
}

export interface EnrichmentResult {
  success: boolean;
  provider_used: string;
  cost: number;
  fields_enriched: string[];
  confidence_score: number;
  data: Partial<DatabaseLeadProfile>;
  errors: string[];
  rate_limited?: boolean;
  cache_hit?: boolean;
}

export interface LinkedInProfileData {
  connection_degree?: '1st' | '2nd' | '3rd' | 'out_of_network';
  premium_account?: boolean;
  open_to_work?: boolean;
  profile_visibility?: 'public' | 'limited' | 'private';
  profile_completeness?: number;
  mutual_connections?: number;
  follower_count?: number;
  has_company_page?: boolean;
  industry?: string;
  seniority_level?: string;
  last_activity?: string;
  skills?: string[];
  education?: any[];
  experience?: any[];
  certifications?: string[];
  languages?: string[];
}

export interface ContactData {
  email?: string;
  phone?: string;
  email_confidence?: number;
  phone_confidence?: number;
  email_deliverable?: boolean;
  phone_valid?: boolean;
}

export class LeadEnrichmentService {
  private static providers: EnrichmentProvider[] = [
    {
      name: 'bright_data',
      priority: 1,
      cost_per_enrichment: 0.50,
      fields_provided: ['connection_degree', 'premium_account', 'profile_completeness', 'mutual_connections', 'industry'],
      rate_limit: 10, // 10 per minute
      accuracy_score: 0.95
    },
    {
      name: 'apollo_io',
      priority: 2,
      cost_per_enrichment: 0.30,
      fields_provided: ['email', 'phone', 'title', 'company', 'industry'],
      rate_limit: 60,
      accuracy_score: 0.85
    },
    {
      name: 'zoominfo',
      priority: 3,
      cost_per_enrichment: 1.00,
      fields_provided: ['email', 'phone', 'title', 'company', 'seniority_level', 'industry'],
      rate_limit: 30,
      accuracy_score: 0.92
    },
    {
      name: 'hunter_io',
      priority: 4,
      cost_per_enrichment: 0.10,
      fields_provided: ['email'],
      rate_limit: 100,
      accuracy_score: 0.80
    }
  ];

  /**
   * Enrich a single lead profile
   */
  static async enrichLead(request: EnrichmentRequest): Promise<EnrichmentResult> {
    try {
      // Check cache first
      const cacheResult = await this.checkEnrichmentCache(request.lead_id);
      if (cacheResult) {
        return {
          success: true,
          provider_used: cacheResult.provider || 'cache',
          cost: 0,
          fields_enriched: Object.keys(cacheResult.data),
          confidence_score: cacheResult.confidence_score || 0.9,
          data: cacheResult.data,
          errors: [],
          cache_hit: true
        };
      }

      // Select best provider based on fields needed and budget
      const provider = this.selectBestProvider(request);
      if (!provider) {
        return {
          success: false,
          provider_used: 'none',
          cost: 0,
          fields_enriched: [],
          confidence_score: 0,
          data: {},
          errors: ['No suitable provider found for requested fields']
        };
      }

      // Check rate limits
      const rateLimitOk = await this.checkRateLimit(provider.name);
      if (!rateLimitOk) {
        return {
          success: false,
          provider_used: provider.name,
          cost: 0,
          fields_enriched: [],
          confidence_score: 0,
          data: {},
          errors: ['Rate limit exceeded'],
          rate_limited: true
        };
      }

      // Perform enrichment
      let enrichmentData: Partial<DatabaseLeadProfile> = {};
      let fieldsEnriched: string[] = [];
      const errors: string[] = [];

      switch (provider.name) {
        case 'bright_data':
          const brightDataResult = await this.enrichWithBrightData(request);
          enrichmentData = { ...enrichmentData, ...brightDataResult.data };
          fieldsEnriched.push(...brightDataResult.fields_enriched);
          errors.push(...brightDataResult.errors);
          break;

        case 'apollo_io':
          const apolloResult = await this.enrichWithApollo(request);
          enrichmentData = { ...enrichmentData, ...apolloResult.data };
          fieldsEnriched.push(...apolloResult.fields_enriched);
          errors.push(...apolloResult.errors);
          break;

        case 'zoominfo':
          const zoomInfoResult = await this.enrichWithZoomInfo(request);
          enrichmentData = { ...enrichmentData, ...zoomInfoResult.data };
          fieldsEnriched.push(...zoomInfoResult.fields_enriched);
          errors.push(...zoomInfoResult.errors);
          break;

        case 'hunter_io':
          const hunterResult = await this.enrichWithHunter(request);
          enrichmentData = { ...enrichmentData, ...hunterResult.data };
          fieldsEnriched.push(...hunterResult.fields_enriched);
          errors.push(...hunterResult.errors);
          break;
      }

      // Calculate confidence score
      const confidenceScore = this.calculateConfidenceScore(enrichmentData, fieldsEnriched, provider);

      // Update lead in database
      if (Object.keys(enrichmentData).length > 0) {
        await this.updateLeadProfile(request.lead_id, enrichmentData);
      }

      // Cache the result
      await this.cacheEnrichmentResult(request.lead_id, {
        provider: provider.name,
        data: enrichmentData,
        confidence_score: confidenceScore,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      });

      // Update rate limit counter
      await this.updateRateLimitCounter(provider.name);

      const result: EnrichmentResult = {
        success: fieldsEnriched.length > 0,
        provider_used: provider.name,
        cost: provider.cost_per_enrichment,
        fields_enriched: fieldsEnriched,
        confidence_score: confidenceScore,
        data: enrichmentData,
        errors
      };

      return result;
    } catch (error) {
      console.error('Lead enrichment error:', error);
      return {
        success: false,
        provider_used: 'error',
        cost: 0,
        fields_enriched: [],
        confidence_score: 0,
        data: {},
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Bulk enrich multiple leads
   */
  static async enrichLeadsBulk(
    requests: EnrichmentRequest[],
    options: {
      batch_size?: number;
      delay_between_batches?: number;
      max_concurrent?: number;
      budget_limit?: number;
    } = {}
  ): Promise<{
    results: (EnrichmentResult & { lead_id: string })[];
    total_cost: number;
    success_count: number;
    error_count: number;
    rate_limited_count: number;
  }> {
    const {
      batch_size = 10,
      delay_between_batches = 1000,
      max_concurrent = 5,
      budget_limit = 100
    } = options;

    const results: (EnrichmentResult & { lead_id: string })[] = [];
    let totalCost = 0;
    let successCount = 0;
    let errorCount = 0;
    let rateLimitedCount = 0;

    // Process in batches
    for (let i = 0; i < requests.length; i += batch_size) {
      const batch = requests.slice(i, i + batch_size);
      
      // Check budget
      if (totalCost >= budget_limit) {
        const remainingRequests = requests.slice(i);
        remainingRequests.forEach(req => {
          results.push({
            lead_id: req.lead_id,
            success: false,
            provider_used: 'budget_exceeded',
            cost: 0,
            fields_enriched: [],
            confidence_score: 0,
            data: {},
            errors: ['Budget limit exceeded']
          });
        });
        break;
      }

      // Process batch with concurrency limit
      const batchPromises = batch.map(async (request) => {
        const result = await this.enrichLead(request);
        return { ...result, lead_id: request.lead_id };
      });

      // Limit concurrent requests
      const batchResults = await this.processConcurrently(batchPromises, max_concurrent);
      
      // Aggregate results
      batchResults.forEach(result => {
        results.push(result);
        totalCost += result.cost;
        
        if (result.success) successCount++;
        if (!result.success && !result.rate_limited) errorCount++;
        if (result.rate_limited) rateLimitedCount++;
      });

      // Delay between batches (except last)
      if (i + batch_size < requests.length) {
        await new Promise(resolve => setTimeout(resolve, delay_between_batches));
      }
    }

    return {
      results,
      total_cost: totalCost,
      success_count: successCount,
      error_count: errorCount,
      rate_limited_count: rateLimitedCount
    };
  }

  /**
   * Get enrichment status for leads
   */
  static async getEnrichmentStatus(leadIds: string[]): Promise<{
    [leadId: string]: {
      status: 'pending' | 'completed' | 'failed' | 'not_needed';
      last_enriched?: string;
      confidence_score?: number;
      missing_fields: string[];
    }
  }> {
    try {
      const { data, error } = await supabase
        .from('lead_profiles')
        .select('id, enrichment_status, enriched_at, quality_score, data_completeness, additional_data')
        .in('id', leadIds);

      if (error) throw error;

      const result: any = {};
      
      data?.forEach(lead => {
        const missingFields = this.identifyMissingFields(lead);
        result[lead.id] = {
          status: lead.enrichment_status,
          last_enriched: lead.enriched_at,
          confidence_score: lead.quality_score,
          missing_fields: missingFields
        };
      });

      return result;
    } catch (error) {
      console.error('Error getting enrichment status:', error);
      throw error;
    }
  }

  /**
   * Auto-enrich leads for campaign validation
   */
  static async autoEnrichForValidation(
    leadIds: string[],
    campaignId: string
  ): Promise<{ enriched_count: number; errors: string[] }> {
    try {
      // Get campaign requirements to determine needed fields
      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();

      if (campaignError || !campaign) {
        throw new Error('Campaign not found');
      }

      // Determine required fields based on campaign
      const requiredFields = this.determineRequiredFields(campaign);
      
      // Get current lead data to see what's missing
      const { data: leads, error: leadsError } = await supabase
        .from('lead_profiles')
        .select('*')
        .in('id', leadIds);

      if (leadsError) throw leadsError;

      // Create enrichment requests for leads with missing data
      const enrichmentRequests: EnrichmentRequest[] = [];
      
      leads?.forEach(lead => {
        const missingFields = requiredFields.filter(field => !lead[field]);
        if (missingFields.length > 0) {
          enrichmentRequests.push({
            lead_id: lead.id,
            linkedin_url: lead.linkedin_url,
            email: lead.email,
            name: lead.name,
            company: lead.company,
            priority: 'medium',
            fields_needed: missingFields,
            budget_limit: 5.00 // $5 per lead max
          });
        }
      });

      if (enrichmentRequests.length === 0) {
        return { enriched_count: 0, errors: [] };
      }

      // Perform bulk enrichment
      const bulkResult = await this.enrichLeadsBulk(enrichmentRequests, {
        batch_size: 5,
        delay_between_batches: 500,
        max_concurrent: 3,
        budget_limit: enrichmentRequests.length * 5
      });

      return {
        enriched_count: bulkResult.success_count,
        errors: bulkResult.results
          .filter(r => !r.success)
          .map(r => `${r.lead_id}: ${r.errors.join(', ')}`)
      };
    } catch (error) {
      console.error('Auto enrichment error:', error);
      return {
        enriched_count: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  // Provider-specific enrichment methods

  private static async enrichWithBrightData(request: EnrichmentRequest): Promise<{
    data: Partial<DatabaseLeadProfile>;
    fields_enriched: string[];
    errors: string[];
  }> {
    try {
      if (!request.linkedin_url) {
        return { data: {}, fields_enriched: [], errors: ['LinkedIn URL required for BrightData'] };
      }

      // Use existing BrightData service
      const profile = await BrightDataProxyService.scrapeLinkedInProfile(request.linkedin_url);
      
      const enrichedData: Partial<DatabaseLeadProfile> = {
        connection_degree: this.parseConnectionDegree(profile.connectionDegree),
        premium_account: profile.isPremium || false,
        profile_completeness: profile.profileCompleteness || 75,
        mutual_connections: profile.mutualConnections || 0,
        industry: profile.industry,
        seniority_level: this.parseSeniorityLevel(profile.title),
        last_activity: profile.lastActivity,
        follower_count: profile.followersCount || 0,
        has_company_page: Boolean(profile.companyUrl),
        additional_data: {
          skills: profile.skills,
          education: profile.education,
          experience: profile.experience
        }
      };

      const fieldsEnriched = Object.keys(enrichedData).filter(key => 
        enrichedData[key as keyof typeof enrichedData] !== undefined
      );

      return {
        data: enrichedData,
        fields_enriched: fieldsEnriched,
        errors: []
      };
    } catch (error) {
      return {
        data: {},
        fields_enriched: [],
        errors: [error instanceof Error ? error.message : 'BrightData enrichment failed']
      };
    }
  }

  private static async enrichWithApollo(request: EnrichmentRequest): Promise<{
    data: Partial<DatabaseLeadProfile>;
    fields_enriched: string[];
    errors: string[];
  }> {
    // Mock Apollo.io integration - replace with real API
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));

      const mockData: Partial<DatabaseLeadProfile> = {
        email: request.name ? `${request.name.toLowerCase().replace(' ', '.')}@${request.company?.toLowerCase().replace(' ', '')}.com` : undefined,
        phone: '+1-555-' + Math.floor(Math.random() * 9000 + 1000),
        industry: 'Technology',
        quality_score: 0.85
      };

      return {
        data: mockData,
        fields_enriched: Object.keys(mockData).filter(key => mockData[key as keyof typeof mockData]),
        errors: []
      };
    } catch (error) {
      return {
        data: {},
        fields_enriched: [],
        errors: ['Apollo.io enrichment failed']
      };
    }
  }

  private static async enrichWithZoomInfo(request: EnrichmentRequest): Promise<{
    data: Partial<DatabaseLeadProfile>;
    fields_enriched: string[];
    errors: string[];
  }> {
    // Mock ZoomInfo integration - replace with real API
    try {
      await new Promise(resolve => setTimeout(resolve, 800));

      const mockData: Partial<DatabaseLeadProfile> = {
        email: request.name ? `${request.name.toLowerCase().split(' ')[0]}@${request.company?.toLowerCase()}.com` : undefined,
        phone: '+1-' + Math.floor(Math.random() * 900 + 100) + '-' + Math.floor(Math.random() * 900 + 100) + '-' + Math.floor(Math.random() * 9000 + 1000),
        seniority_level: 'manager',
        industry: 'Software',
        quality_score: 0.92
      };

      return {
        data: mockData,
        fields_enriched: Object.keys(mockData).filter(key => mockData[key as keyof typeof mockData]),
        errors: []
      };
    } catch (error) {
      return {
        data: {},
        fields_enriched: [],
        errors: ['ZoomInfo enrichment failed']
      };
    }
  }

  private static async enrichWithHunter(request: EnrichmentRequest): Promise<{
    data: Partial<DatabaseLeadProfile>;
    fields_enriched: string[];
    errors: string[];
  }> {
    // Mock Hunter.io integration - replace with real API
    try {
      if (!request.name || !request.company) {
        return { data: {}, fields_enriched: [], errors: ['Name and company required for Hunter.io'] };
      }

      await new Promise(resolve => setTimeout(resolve, 200));

      const email = `${request.name.toLowerCase().replace(' ', '.')}@${request.company.toLowerCase().replace(/[^a-z]/g, '')}.com`;
      
      return {
        data: { email, quality_score: 0.80 },
        fields_enriched: ['email'],
        errors: []
      };
    } catch (error) {
      return {
        data: {},
        fields_enriched: [],
        errors: ['Hunter.io enrichment failed']
      };
    }
  }

  // Helper methods

  private static selectBestProvider(request: EnrichmentRequest): EnrichmentProvider | null {
    const availableProviders = this.providers.filter(provider => {
      // Check if provider has the needed fields
      const hasNeededFields = request.fields_needed.some(field => 
        provider.fields_provided.includes(field)
      );
      
      // Check budget constraint
      const withinBudget = !request.budget_limit || provider.cost_per_enrichment <= request.budget_limit;
      
      return hasNeededFields && withinBudget;
    });

    // Sort by priority and accuracy
    availableProviders.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return b.accuracy_score - a.accuracy_score;
    });

    return availableProviders[0] || null;
  }

  private static async checkRateLimit(providerName: string): Promise<boolean> {
    // Check rate limit from cache/database
    // For now, return true - implement actual rate limiting
    return true;
  }

  private static async updateRateLimitCounter(providerName: string): Promise<void> {
    // Update rate limit counter in cache/database
    // Implement actual rate limit tracking
  }

  private static async checkEnrichmentCache(leadId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('lead_profiles')
        .select('additional_data, enriched_at, quality_score')
        .eq('id', leadId)
        .single();

      if (error || !data?.enriched_at) return null;

      // Check if cache is still valid (24 hours)
      const enrichedAt = new Date(data.enriched_at);
      const now = new Date();
      const hoursDiff = (now.getTime() - enrichedAt.getTime()) / (1000 * 60 * 60);

      if (hoursDiff > 24) return null;

      return {
        provider: 'cache',
        data: data.additional_data || {},
        confidence_score: data.quality_score
      };
    } catch (error) {
      return null;
    }
  }

  private static async cacheEnrichmentResult(leadId: string, cacheData: any): Promise<void> {
    // Cache enrichment results in lead profile
    await supabase
      .from('lead_profiles')
      .update({
        enriched_at: new Date().toISOString(),
        enrichment_status: 'completed',
        quality_score: cacheData.confidence_score,
        additional_data: cacheData.data
      })
      .eq('id', leadId);
  }

  private static async updateLeadProfile(leadId: string, data: Partial<DatabaseLeadProfile>): Promise<void> {
    await supabase
      .from('lead_profiles')
      .update({
        ...data,
        updated_at: new Date().toISOString()
      })
      .eq('id', leadId);
  }

  private static calculateConfidenceScore(
    data: Partial<DatabaseLeadProfile>, 
    fieldsEnriched: string[], 
    provider: EnrichmentProvider
  ): number {
    const baseScore = provider.accuracy_score;
    const fieldsScore = fieldsEnriched.length / provider.fields_provided.length;
    const dataQualityScore = Object.values(data).filter(v => v !== null && v !== undefined).length / Object.keys(data).length;
    
    return Math.round((baseScore * 0.6 + fieldsScore * 0.2 + dataQualityScore * 0.2) * 100) / 100;
  }

  private static determineRequiredFields(campaign: any): string[] {
    const fields = [];
    
    if (campaign.email_required) fields.push('email');
    if (campaign.phone_required) fields.push('phone');
    if (campaign.connection_required) fields.push('connection_degree');
    if (campaign.premium_required) fields.push('premium_account');
    if (campaign.min_mutual_connections) fields.push('mutual_connections');
    if (campaign.min_profile_completeness) fields.push('profile_completeness');
    
    // Always useful for validation
    fields.push('industry', 'seniority_level', 'quality_score');
    
    return fields;
  }

  private static identifyMissingFields(lead: any): string[] {
    const importantFields = [
      'email', 'phone', 'connection_degree', 'premium_account', 
      'mutual_connections', 'profile_completeness', 'industry', 'seniority_level'
    ];
    
    return importantFields.filter(field => !lead[field]);
  }

  private static parseConnectionDegree(degree?: string): '1st' | '2nd' | '3rd' | 'out_of_network' | undefined {
    if (!degree) return undefined;
    if (degree.includes('1st')) return '1st';
    if (degree.includes('2nd')) return '2nd';
    if (degree.includes('3rd')) return '3rd';
    return 'out_of_network';
  }

  private static parseSeniorityLevel(title?: string): string | undefined {
    if (!title) return undefined;
    
    const lower = title.toLowerCase();
    if (lower.includes('ceo') || lower.includes('president') || lower.includes('founder')) return 'executive';
    if (lower.includes('vp') || lower.includes('vice president')) return 'executive';
    if (lower.includes('director')) return 'director';
    if (lower.includes('manager')) return 'manager';
    if (lower.includes('senior')) return 'senior';
    if (lower.includes('lead')) return 'senior';
    if (lower.includes('junior') || lower.includes('intern')) return 'entry';
    
    return 'associate';
  }

  private static async processConcurrently<T>(promises: Promise<T>[], concurrency: number): Promise<T[]> {
    const results: T[] = [];
    
    for (let i = 0; i < promises.length; i += concurrency) {
      const batch = promises.slice(i, i + concurrency);
      const batchResults = await Promise.all(batch);
      results.push(...batchResults);
    }
    
    return results;
  }
}