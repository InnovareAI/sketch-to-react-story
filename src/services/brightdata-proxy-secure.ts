// Enhanced Bright Data Proxy Client for LinkedIn Prospect Search
// Integrates with n8n workflows and provides comprehensive LinkedIn scraping
// All credentials are handled server-side only

import { supabase } from '@/integrations/supabase/client';
import { n8nService } from '@/services/n8n/N8nIntegrationService';

// Enhanced data structures for different LinkedIn page types
interface LinkedInScrapedProfile {
  profile_url: string;
  full_name: string;
  headline: string;
  location: string;
  current_company: string;
  current_position: string;
  connections_count: string;
  about: string;
  experience: Array<{
    title: string;
    company: string;
    duration: string;
    location: string;
    description: string;
  }>;
  education: Array<{
    school: string;
    degree: string;
    field: string;
    duration: string;
  }>;
  skills: string[];
  contact_info: {
    email?: string;
    phone?: string;
    twitter?: string;
    website?: string;
  };
  profile_image_url: string;
  scraped_at: string;
  proxy_info: {
    country: string;
    ip: string;
    success: boolean;
  };
}

interface LinkedInSearchResult {
  search_url: string;
  search_type: 'basic' | 'sales-navigator' | 'recruiter';
  results: LinkedInScrapedProfile[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_results: number;
    has_more: boolean;
  };
  scraped_at: string;
  cost_info: {
    requests_used: number;
    estimated_cost: number;
    remaining_budget: number;
  };
}

interface CompanyFollower {
  profile_url: string;
  full_name: string;
  headline: string;
  location: string;
  mutual_connections: number;
  follow_date?: string;
  engagement_level?: 'high' | 'medium' | 'low';
}

interface PostEngagement {
  engager_profile_url: string;
  full_name: string;
  headline: string;
  engagement_type: 'like' | 'comment' | 'share' | 'reaction';
  engagement_content?: string;
  engagement_date: string;
  mutual_connections: number;
}

interface GroupMember {
  profile_url: string;
  full_name: string;
  headline: string;
  location: string;
  member_since?: string;
  activity_level?: 'active' | 'moderate' | 'passive';
  recent_posts?: number;
}

interface EventAttendee {
  profile_url: string;
  full_name: string;
  headline: string;
  attendance_status: 'attending' | 'interested' | 'organizer' | 'speaker';
  connection_degree: number;
}

interface ProxyUsageStats {
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  total_cost: number;
  average_response_time: number;
  data_transferred: number;
  rate_limit_hits: number;
}

interface RateLimitConfig {
  requests_per_minute: number;
  requests_per_hour: number;
  concurrent_requests: number;
  cool_down_period: number;
}

interface CostTracker {
  monthly_budget: number;
  current_spend: number;
  projected_spend: number;
  cost_per_request: number;
  alert_threshold: number;
}

class EnhancedBrightDataService {
  private apiEndpoint: string;
  private usageStats: ProxyUsageStats;
  private rateLimiter: RateLimitConfig;
  private costTracker: CostTracker;
  private linkedInAccounts: string[];
  private activeSearches: Map<string, any>;

  constructor() {
    // Use secure server-side endpoint
    this.apiEndpoint = '/api/brightdata';
    
    // Initialize tracking systems
    this.usageStats = {
      total_requests: 0,
      successful_requests: 0,
      failed_requests: 0,
      total_cost: 0,
      average_response_time: 0,
      data_transferred: 0,
      rate_limit_hits: 0
    };
    
    this.rateLimiter = {
      requests_per_minute: 20,
      requests_per_hour: 100,
      concurrent_requests: 5,
      cool_down_period: 30000 // 30 seconds
    };
    
    this.costTracker = {
      monthly_budget: 5.00, // $5 monthly budget
      current_spend: 0,
      projected_spend: 0,
      cost_per_request: 0.05, // $0.05 per request estimate
      alert_threshold: 0.8 // Alert at 80% budget
    };
    
    this.linkedInAccounts = [];
    this.activeSearches = new Map();
    
    this.loadUsageStats();
    this.loadLinkedInAccounts();
  }

  /**
   * Load usage statistics from database
   */
  private async loadUsageStats(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('brightdata_usage_stats')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (!error && data) {
        this.usageStats = data;
      }
    } catch (error) {
      console.warn('Could not load usage stats:', error);
    }
  }
  
  /**
   * Load connected LinkedIn accounts
   */
  private async loadLinkedInAccounts(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('linkedin_account_connections')
        .select('account_id, username')
        .eq('status', 'active');
      
      if (!error && data) {
        this.linkedInAccounts = data.map(account => account.account_id);
      }
    } catch (error) {
      console.warn('Could not load LinkedIn accounts:', error);
    }
  }
  
  /**
   * Update usage statistics
   */
  private async updateUsageStats(success: boolean, cost: number, responseTime: number): Promise<void> {
    this.usageStats.total_requests++;
    if (success) {
      this.usageStats.successful_requests++;
    } else {
      this.usageStats.failed_requests++;
    }
    this.usageStats.total_cost += cost;
    this.usageStats.average_response_time = 
      (this.usageStats.average_response_time + responseTime) / 2;
    
    // Save to database
    try {
      await supabase
        .from('brightdata_usage_stats')
        .upsert(this.usageStats);
    } catch (error) {
      console.error('Failed to save usage stats:', error);
    }
  }
  
  /**
   * Check rate limits and budget constraints
   */
  private async checkConstraints(): Promise<{ allowed: boolean; reason?: string }> {
    // Check budget
    if (this.costTracker.current_spend >= this.costTracker.monthly_budget) {
      return { allowed: false, reason: 'Monthly budget exceeded' };
    }
    
    if (this.costTracker.current_spend >= this.costTracker.monthly_budget * this.costTracker.alert_threshold) {
      console.warn(`Budget alert: ${(this.costTracker.current_spend / this.costTracker.monthly_budget * 100).toFixed(1)}% of monthly budget used`);
    }
    
    // Check active searches limit
    if (this.activeSearches.size >= this.rateLimiter.concurrent_requests) {
      return { allowed: false, reason: 'Too many concurrent requests' };
    }
    
    return { allowed: true };
  }
  
  /**
   * Enhanced proxy connection test with account validation
   */
  async testProxyConnection(country?: string, linkedInAccountId?: string): Promise<{ success: boolean; ip: string; country: string; error?: string; account_status?: string }> {
    const startTime = Date.now();
    
    try {
      const constraintCheck = await this.checkConstraints();
      if (!constraintCheck.allowed) {
        throw new Error(constraintCheck.reason);
      }
      
      const response = await fetch(`${this.apiEndpoint}/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({ 
          country,
          linkedin_account_id: linkedInAccountId,
          test_linkedin_access: true
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      const responseTime = Date.now() - startTime;
      
      await this.updateUsageStats(true, this.costTracker.cost_per_request, responseTime);
      
      return {
        ...result,
        account_status: result.linkedin_accessible ? 'accessible' : 'blocked'
      };
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      await this.updateUsageStats(false, 0, responseTime);
      
      return {
        success: false,
        ip: 'unknown',
        country: 'unknown',
        error: error.message,
        account_status: 'error'
      };
    }
  }

  /**
   * Enhanced LinkedIn Basic Search with n8n workflow integration
   */
  async executeLinkedInBasicSearch(searchUrl: string, options: {
    maxResults?: number;
    country?: string;
    state?: string;
    workspaceId: string;
    searchConfigId: string;
    filters?: {
      location?: string[];
      industry?: string[];
      currentCompany?: string[];
      jobTitle?: string[];
    };
  }): Promise<LinkedInSearchResult> {
    const startTime = Date.now();
    const searchId = `basic_search_${Date.now()}`;
    
    try {
      const constraintCheck = await this.checkConstraints();
      if (!constraintCheck.allowed) {
        throw new Error(constraintCheck.reason);
      }
      
      this.activeSearches.set(searchId, {
        type: 'basic_search',
        started_at: new Date(),
        search_url: searchUrl
      });
      
      // Trigger n8n workflow for LinkedIn basic search
      const workflowExecution = await n8nService.triggerWorkflow('leadDiscovery', {
        workflow_stage: 'linkedin_basic_search',
        data: {
          search_url: searchUrl,
          workspace_id: options.workspaceId,
          search_config_id: options.searchConfigId,
          max_results: options.maxResults || 50,
          filters: options.filters,
          bright_data_config: {
            proxy_type: 'residential',
            country: options.country || 'US',
            state: options.state,
            session_stickiness: true
          }
        }
      });
      
      // Make direct request to secure endpoint
      const response = await fetch(`${this.apiEndpoint}/linkedin-basic-search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({
          searchUrl,
          workflowExecutionId: workflowExecution.executionId,
          ...options
        })
      });

      if (!response.ok) {
        throw new Error(`LinkedIn Basic Search failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      const responseTime = Date.now() - startTime;
      const estimatedCost = result.results.length * this.costTracker.cost_per_request;
      
      await this.updateUsageStats(true, estimatedCost, responseTime);
      this.activeSearches.delete(searchId);
      
      return {
        search_url: searchUrl,
        search_type: 'basic',
        results: result.results,
        pagination: result.pagination,
        scraped_at: new Date().toISOString(),
        cost_info: {
          requests_used: result.results.length,
          estimated_cost: estimatedCost,
          remaining_budget: this.costTracker.monthly_budget - this.costTracker.current_spend
        }
      };
    } catch (error) {
      console.error('Error in LinkedIn Basic Search:', error);
      this.activeSearches.delete(searchId);
      const responseTime = Date.now() - startTime;
      await this.updateUsageStats(false, 0, responseTime);
      throw error;
    }
  }
  
  /**
   * Enhanced LinkedIn Sales Navigator Search
   */
  async executeLinkedInSalesNavigatorSearch(searchUrl: string, options: {
    maxResults?: number;
    country?: string;
    workspaceId: string;
    searchConfigId: string;
    premiumFilters?: {
      seniority?: string[];
      department?: string[];
      companySize?: string[];
      geography?: string[];
    };
  }): Promise<LinkedInSearchResult> {
    const startTime = Date.now();
    const searchId = `sales_nav_search_${Date.now()}`;
    
    try {
      const constraintCheck = await this.checkConstraints();
      if (!constraintCheck.allowed) {
        throw new Error(constraintCheck.reason);
      }
      
      this.activeSearches.set(searchId, {
        type: 'sales_navigator_search',
        started_at: new Date(),
        search_url: searchUrl
      });
      
      // Trigger n8n workflow for Sales Navigator search
      const workflowExecution = await n8nService.triggerWorkflow('linkedInOutreach', {
        workflow_stage: 'sales_navigator_search',
        data: {
          search_url: searchUrl,
          workspace_id: options.workspaceId,
          search_config_id: options.searchConfigId,
          max_results: options.maxResults || 25, // Lower limit for premium searches
          premium_filters: options.premiumFilters,
          bright_data_config: {
            proxy_type: 'residential',
            country: options.country || 'US',
            premium_account_required: true
          }
        }
      });
      
      const response = await fetch(`${this.apiEndpoint}/linkedin-sales-navigator`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({
          searchUrl,
          workflowExecutionId: workflowExecution.executionId,
          requiresPremium: true,
          ...options
        })
      });

      if (!response.ok) {
        throw new Error(`Sales Navigator Search failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      const responseTime = Date.now() - startTime;
      const estimatedCost = result.results.length * this.costTracker.cost_per_request * 1.5; // Premium searches cost more
      
      await this.updateUsageStats(true, estimatedCost, responseTime);
      this.activeSearches.delete(searchId);
      
      return {
        search_url: searchUrl,
        search_type: 'sales-navigator',
        results: result.results,
        pagination: result.pagination,
        scraped_at: new Date().toISOString(),
        cost_info: {
          requests_used: result.results.length,
          estimated_cost: estimatedCost,
          remaining_budget: this.costTracker.monthly_budget - this.costTracker.current_spend
        }
      };
    } catch (error) {
      console.error('Error in Sales Navigator Search:', error);
      this.activeSearches.delete(searchId);
      const responseTime = Date.now() - startTime;
      await this.updateUsageStats(false, 0, responseTime);
      throw error;
    }
  }
  
  /**
   * Enhanced LinkedIn Recruiter Search
   */
  async executeLinkedInRecruiterSearch(searchUrl: string, options: {
    maxResults?: number;
    country?: string;
    workspaceId: string;
    searchConfigId: string;
    recruiterFilters?: {
      openToWork?: boolean;
      yearsOfExperience?: string;
      skills?: string[];
      education?: string[];
    };
  }): Promise<LinkedInSearchResult> {
    const startTime = Date.now();
    const searchId = `recruiter_search_${Date.now()}`;
    
    try {
      const constraintCheck = await this.checkConstraints();
      if (!constraintCheck.allowed) {
        throw new Error(constraintCheck.reason);
      }
      
      this.activeSearches.set(searchId, {
        type: 'recruiter_search',
        started_at: new Date(),
        search_url: searchUrl
      });
      
      const response = await fetch(`${this.apiEndpoint}/linkedin-recruiter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({
          searchUrl,
          requiresRecruiter: true,
          ...options
        })
      });

      if (!response.ok) {
        throw new Error(`Recruiter Search failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      const responseTime = Date.now() - startTime;
      const estimatedCost = result.results.length * this.costTracker.cost_per_request * 2; // Recruiter searches cost most
      
      await this.updateUsageStats(true, estimatedCost, responseTime);
      this.activeSearches.delete(searchId);
      
      return {
        search_url: searchUrl,
        search_type: 'recruiter',
        results: result.results,
        pagination: result.pagination,
        scraped_at: new Date().toISOString(),
        cost_info: {
          requests_used: result.results.length,
          estimated_cost: estimatedCost,
          remaining_budget: this.costTracker.monthly_budget - this.costTracker.current_spend
        }
      };
    } catch (error) {
      console.error('Error in Recruiter Search:', error);
      this.activeSearches.delete(searchId);
      const responseTime = Date.now() - startTime;
      await this.updateUsageStats(false, 0, responseTime);
      throw error;
    }
  }
  
  /**
   * Scrape company followers
   */
  async scrapeCompanyFollowers(companyUrl: string, options: {
    maxFollowers?: number;
    workspaceId: string;
    searchConfigId: string;
    filters?: {
      location?: string[];
      jobTitle?: string[];
    };
  }): Promise<{ company_url: string; followers: CompanyFollower[]; scraped_at: string; cost_info: any }> {
    const startTime = Date.now();
    const searchId = `company_followers_${Date.now()}`;
    
    try {
      const constraintCheck = await this.checkConstraints();
      if (!constraintCheck.allowed) {
        throw new Error(constraintCheck.reason);
      }
      
      this.activeSearches.set(searchId, {
        type: 'company_followers',
        started_at: new Date(),
        company_url: companyUrl
      });
      
      const response = await fetch(`${this.apiEndpoint}/company-followers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({
          companyUrl,
          maxFollowers: options.maxFollowers || 200,
          filters: options.filters,
          workspaceId: options.workspaceId,
          searchConfigId: options.searchConfigId
        })
      });

      if (!response.ok) {
        throw new Error(`Company Followers scraping failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      const responseTime = Date.now() - startTime;
      const estimatedCost = result.followers.length * this.costTracker.cost_per_request * 0.5; // Company scraping is cheaper
      
      await this.updateUsageStats(true, estimatedCost, responseTime);
      this.activeSearches.delete(searchId);
      
      return {
        company_url: companyUrl,
        followers: result.followers,
        scraped_at: new Date().toISOString(),
        cost_info: {
          requests_used: result.followers.length,
          estimated_cost: estimatedCost,
          remaining_budget: this.costTracker.monthly_budget - this.costTracker.current_spend
        }
      };
    } catch (error) {
      console.error('Error in Company Followers scraping:', error);
      this.activeSearches.delete(searchId);
      const responseTime = Date.now() - startTime;
      await this.updateUsageStats(false, 0, responseTime);
      throw error;
    }
  }
  
  /**
   * Scrape LinkedIn profile through secure endpoint
   */
  async scrapeLinkedInProfile(profileUrl: string, options?: {
    country?: string;
    state?: string;
    includeConnections?: boolean;
    includeActivityData?: boolean;
  }): Promise<LinkedInScrapedProfile> {
    const startTime = Date.now();
    
    try {
      const constraintCheck = await this.checkConstraints();
      if (!constraintCheck.allowed) {
        throw new Error(constraintCheck.reason);
      }
      
      const response = await fetch(`${this.apiEndpoint}/scrape`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({
          profileUrl,
          ...options
        })
      });

      if (!response.ok) {
        throw new Error(`Scraping failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      const responseTime = Date.now() - startTime;
      await this.updateUsageStats(true, this.costTracker.cost_per_request, responseTime);
      
      return result;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      await this.updateUsageStats(false, 0, responseTime);
      console.error('Error scraping LinkedIn profile:', error);
      throw error;
    }
  }

  /**
   * Scrape LinkedIn post engagement
   */
  async scrapePostEngagement(postUrl: string, options: {
    maxEngagers?: number;
    workspaceId: string;
    searchConfigId: string;
    engagementTypes?: ('like' | 'comment' | 'share' | 'reaction')[];
  }): Promise<{ post_url: string; engagement: PostEngagement[]; scraped_at: string; cost_info: any }> {
    const startTime = Date.now();
    const searchId = `post_engagement_${Date.now()}`;
    
    try {
      const constraintCheck = await this.checkConstraints();
      if (!constraintCheck.allowed) {
        throw new Error(constraintCheck.reason);
      }
      
      this.activeSearches.set(searchId, {
        type: 'post_engagement',
        started_at: new Date(),
        post_url: postUrl
      });
      
      const response = await fetch(`${this.apiEndpoint}/post-engagement`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({
          postUrl,
          maxEngagers: options.maxEngagers || 100,
          engagementTypes: options.engagementTypes || ['like', 'comment', 'share'],
          workspaceId: options.workspaceId,
          searchConfigId: options.searchConfigId
        })
      });

      if (!response.ok) {
        throw new Error(`Post Engagement scraping failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      const responseTime = Date.now() - startTime;
      const estimatedCost = result.engagement.length * this.costTracker.cost_per_request * 0.3;
      
      await this.updateUsageStats(true, estimatedCost, responseTime);
      this.activeSearches.delete(searchId);
      
      return {
        post_url: postUrl,
        engagement: result.engagement,
        scraped_at: new Date().toISOString(),
        cost_info: {
          requests_used: result.engagement.length,
          estimated_cost: estimatedCost,
          remaining_budget: this.costTracker.monthly_budget - this.costTracker.current_spend
        }
      };
    } catch (error) {
      console.error('Error in Post Engagement scraping:', error);
      this.activeSearches.delete(searchId);
      const responseTime = Date.now() - startTime;
      await this.updateUsageStats(false, 0, responseTime);
      throw error;
    }
  }
  
  /**
   * Scrape LinkedIn group members
   */
  async scrapeGroupMembers(groupUrl: string, options: {
    maxMembers?: number;
    workspaceId: string;
    searchConfigId: string;
    filters?: {
      activityLevel?: 'active' | 'moderate' | 'passive';
      location?: string[];
    };
  }): Promise<{ group_url: string; members: GroupMember[]; scraped_at: string; cost_info: any }> {
    const startTime = Date.now();
    const searchId = `group_members_${Date.now()}`;
    
    try {
      const constraintCheck = await this.checkConstraints();
      if (!constraintCheck.allowed) {
        throw new Error(constraintCheck.reason);
      }
      
      this.activeSearches.set(searchId, {
        type: 'group_members',
        started_at: new Date(),
        group_url: groupUrl
      });
      
      const response = await fetch(`${this.apiEndpoint}/group-members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({
          groupUrl,
          maxMembers: options.maxMembers || 500,
          filters: options.filters,
          workspaceId: options.workspaceId,
          searchConfigId: options.searchConfigId
        })
      });

      if (!response.ok) {
        throw new Error(`Group Members scraping failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      const responseTime = Date.now() - startTime;
      const estimatedCost = result.members.length * this.costTracker.cost_per_request * 0.4;
      
      await this.updateUsageStats(true, estimatedCost, responseTime);
      this.activeSearches.delete(searchId);
      
      return {
        group_url: groupUrl,
        members: result.members,
        scraped_at: new Date().toISOString(),
        cost_info: {
          requests_used: result.members.length,
          estimated_cost: estimatedCost,
          remaining_budget: this.costTracker.monthly_budget - this.costTracker.current_spend
        }
      };
    } catch (error) {
      console.error('Error in Group Members scraping:', error);
      this.activeSearches.delete(searchId);
      const responseTime = Date.now() - startTime;
      await this.updateUsageStats(false, 0, responseTime);
      throw error;
    }
  }
  
  /**
   * Scrape LinkedIn event attendees
   */
  async scrapeEventAttendees(eventUrl: string, options: {
    maxAttendees?: number;
    workspaceId: string;
    searchConfigId: string;
    attendanceTypes?: ('attending' | 'interested' | 'organizer' | 'speaker')[];
  }): Promise<{ event_url: string; attendees: EventAttendee[]; scraped_at: string; cost_info: any }> {
    const startTime = Date.now();
    const searchId = `event_attendees_${Date.now()}`;
    
    try {
      const constraintCheck = await this.checkConstraints();
      if (!constraintCheck.allowed) {
        throw new Error(constraintCheck.reason);
      }
      
      this.activeSearches.set(searchId, {
        type: 'event_attendees',
        started_at: new Date(),
        event_url: eventUrl
      });
      
      const response = await fetch(`${this.apiEndpoint}/event-attendees`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({
          eventUrl,
          maxAttendees: options.maxAttendees || 300,
          attendanceTypes: options.attendanceTypes || ['attending', 'interested'],
          workspaceId: options.workspaceId,
          searchConfigId: options.searchConfigId
        })
      });

      if (!response.ok) {
        throw new Error(`Event Attendees scraping failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      const responseTime = Date.now() - startTime;
      const estimatedCost = result.attendees.length * this.costTracker.cost_per_request * 0.3;
      
      await this.updateUsageStats(true, estimatedCost, responseTime);
      this.activeSearches.delete(searchId);
      
      return {
        event_url: eventUrl,
        attendees: result.attendees,
        scraped_at: new Date().toISOString(),
        cost_info: {
          requests_used: result.attendees.length,
          estimated_cost: estimatedCost,
          remaining_budget: this.costTracker.monthly_budget - this.costTracker.current_spend
        }
      };
    } catch (error) {
      console.error('Error in Event Attendees scraping:', error);
      this.activeSearches.delete(searchId);
      const responseTime = Date.now() - startTime;
      await this.updateUsageStats(false, 0, responseTime);
      throw error;
    }
  }
  
  /**
   * Scrape "People you may know" suggestions
   */
  async scrapePeopleYouMayKnow(options: {
    maxSuggestions?: number;
    workspaceId: string;
    searchConfigId: string;
    linkedInAccountId: string;
  }): Promise<{ suggestions: LinkedInScrapedProfile[]; scraped_at: string; cost_info: any }> {
    const startTime = Date.now();
    const searchId = `people_suggestions_${Date.now()}`;
    
    try {
      const constraintCheck = await this.checkConstraints();
      if (!constraintCheck.allowed) {
        throw new Error(constraintCheck.reason);
      }
      
      if (!this.linkedInAccounts.includes(options.linkedInAccountId)) {
        throw new Error('LinkedIn account not connected or inactive');
      }
      
      this.activeSearches.set(searchId, {
        type: 'people_suggestions',
        started_at: new Date(),
        account_id: options.linkedInAccountId
      });
      
      const response = await fetch(`${this.apiEndpoint}/people-suggestions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({
          maxSuggestions: options.maxSuggestions || 50,
          linkedInAccountId: options.linkedInAccountId,
          workspaceId: options.workspaceId,
          searchConfigId: options.searchConfigId
        })
      });

      if (!response.ok) {
        throw new Error(`People Suggestions scraping failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      const responseTime = Date.now() - startTime;
      const estimatedCost = result.suggestions.length * this.costTracker.cost_per_request * 0.2;
      
      await this.updateUsageStats(true, estimatedCost, responseTime);
      this.activeSearches.delete(searchId);
      
      return {
        suggestions: result.suggestions,
        scraped_at: new Date().toISOString(),
        cost_info: {
          requests_used: result.suggestions.length,
          estimated_cost: estimatedCost,
          remaining_budget: this.costTracker.monthly_budget - this.costTracker.current_spend
        }
      };
    } catch (error) {
      console.error('Error in People Suggestions scraping:', error);
      this.activeSearches.delete(searchId);
      const responseTime = Date.now() - startTime;
      await this.updateUsageStats(false, 0, responseTime);
      throw error;
    }
  }
  
  /**
   * Search LinkedIn profiles through secure endpoint (legacy method - enhanced)
   */
  async searchLinkedInProfiles(searchParams: {
    keywords: string;
    location?: string;
    company?: string;
    title?: string;
    limit?: number;
    proxyCountry?: string;
    proxyState?: string;
  }): Promise<LinkedInScrapedProfile[]> {
    const startTime = Date.now();
    
    try {
      const constraintCheck = await this.checkConstraints();
      if (!constraintCheck.allowed) {
        throw new Error(constraintCheck.reason);
      }
      
      const response = await fetch(`${this.apiEndpoint}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify(searchParams)
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      const responseTime = Date.now() - startTime;
      const estimatedCost = result.length * this.costTracker.cost_per_request;
      
      await this.updateUsageStats(true, estimatedCost, responseTime);
      
      return result;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      await this.updateUsageStats(false, 0, responseTime);
      console.error('Error searching LinkedIn profiles:', error);
      throw error;
    }
  }

  /**
   * Get usage and cost analytics
   */
  async getUsageAnalytics(): Promise<{
    usage_stats: ProxyUsageStats;
    cost_tracker: CostTracker;
    active_searches: any[];
    monthly_summary: {
      searches_completed: number;
      total_prospects_found: number;
      average_cost_per_prospect: number;
      budget_utilization: number;
    };
  }> {
    try {
      // Get monthly summary from database
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const { data: monthlyStats, error } = await supabase
        .from('search_history')
        .select('results_found, bright_data_usage')
        .gte('started_at', startOfMonth.toISOString())
        .eq('status', 'completed');
      
      let searchesCompleted = 0;
      let totalProspectsFound = 0;
      
      if (!error && monthlyStats) {
        searchesCompleted = monthlyStats.length;
        totalProspectsFound = monthlyStats.reduce((sum, stat) => sum + (stat.results_found || 0), 0);
      }
      
      const activeSearchesArray = Array.from(this.activeSearches.entries()).map(([id, data]) => ({
        id,
        ...data
      }));
      
      return {
        usage_stats: this.usageStats,
        cost_tracker: this.costTracker,
        active_searches: activeSearchesArray,
        monthly_summary: {
          searches_completed: searchesCompleted,
          total_prospects_found: totalProspectsFound,
          average_cost_per_prospect: totalProspectsFound > 0 
            ? this.costTracker.current_spend / totalProspectsFound 
            : 0,
          budget_utilization: this.costTracker.current_spend / this.costTracker.monthly_budget
        }
      };
    } catch (error) {
      console.error('Error getting usage analytics:', error);
      throw error;
    }
  }
  
  /**
   * Set budget and rate limits
   */
  async updateBudgetAndLimits(config: {
    monthly_budget?: number;
    requests_per_minute?: number;
    requests_per_hour?: number;
    alert_threshold?: number;
  }): Promise<void> {
    if (config.monthly_budget !== undefined) {
      this.costTracker.monthly_budget = config.monthly_budget;
    }
    if (config.requests_per_minute !== undefined) {
      this.rateLimiter.requests_per_minute = config.requests_per_minute;
    }
    if (config.requests_per_hour !== undefined) {
      this.rateLimiter.requests_per_hour = config.requests_per_hour;
    }
    if (config.alert_threshold !== undefined) {
      this.costTracker.alert_threshold = config.alert_threshold;
    }
    
    // Save configuration to database
    try {
      await supabase
        .from('brightdata_config')
        .upsert({
          cost_tracker: this.costTracker,
          rate_limiter: this.rateLimiter,
          updated_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Failed to save budget configuration:', error);
    }
  }
  
  /**
   * Enhanced error handling with retry logic and fallbacks
   */
  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    backoffMs: number = 1000
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on budget or rate limit errors
        if (error instanceof Error && 
            (error.message.includes('budget') || error.message.includes('rate limit'))) {
          throw error;
        }
        
        if (attempt === maxRetries) {
          break;
        }
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, backoffMs * Math.pow(2, attempt - 1)));
      }
    }
    
    throw lastError!;
  }
  
  /**
   * Bulk scrape LinkedIn profiles with enhanced error handling and batching
   */
  async bulkScrapeProfiles(profileUrls: string[], options?: {
    distributeAcrossCountries?: boolean;
    countries?: string[];
    concurrency?: number;
    workspaceId: string;
    batchSize?: number;
  }): Promise<{
    successful: LinkedInScrapedProfile[];
    failed: { url: string; error: string }[];
    cost_info: any;
  }> {
    const batchSize = options?.batchSize || 10;
    const successful: LinkedInScrapedProfile[] = [];
    const failed: { url: string; error: string }[] = [];
    let totalCost = 0;
    
    try {
      // Process in batches to avoid overwhelming the system
      for (let i = 0; i < profileUrls.length; i += batchSize) {
        const batch = profileUrls.slice(i, i + batchSize);
        
        const batchResults = await Promise.allSettled(
          batch.map(url => this.executeWithRetry(() => this.scrapeLinkedInProfile(url, options)))
        );
        
        for (let j = 0; j < batchResults.length; j++) {
          const result = batchResults[j];
          const url = batch[j];
          
          if (result.status === 'fulfilled') {
            successful.push(result.value);
            totalCost += this.costTracker.cost_per_request;
          } else {
            failed.push({
              url,
              error: result.reason.message
            });
          }
        }
        
        // Add delay between batches to respect rate limits
        if (i + batchSize < profileUrls.length) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      return {
        successful,
        failed,
        cost_info: {
          requests_attempted: profileUrls.length,
          requests_successful: successful.length,
          requests_failed: failed.length,
          total_cost: totalCost,
          remaining_budget: this.costTracker.monthly_budget - this.costTracker.current_spend
        }
      };
    } catch (error) {
      console.error('Error in bulk scraping:', error);
      throw error;
    }
  }

  /**
   * Get authentication token from secure storage
   */
  private getAuthToken(): string {
    // In production, this would get a secure token from your auth system
    // Never store API keys in frontend code
    const token = sessionStorage.getItem('auth_token');
    if (!token) {
      throw new Error('Not authenticated. Please log in.');
    }
    return token;
  }
  
  /**
   * Cancel an active search
   */
  async cancelSearch(searchId: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.activeSearches.has(searchId)) {
        return { success: false, error: 'Search not found or already completed' };
      }
      
      const searchInfo = this.activeSearches.get(searchId);
      this.activeSearches.delete(searchId);
      
      // If there's a workflow execution, try to cancel it
      if (searchInfo.workflowExecutionId) {
        try {
          await fetch(`${this.apiEndpoint}/cancel/${searchInfo.workflowExecutionId}`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.getAuthToken()}`
            }
          });
        } catch (error) {
          console.warn('Could not cancel workflow execution:', error);
        }
      }
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
  
  /**
   * Get real-time search status
   */
  async getSearchStatus(searchId: string): Promise<{
    status: 'active' | 'completed' | 'failed' | 'not_found';
    progress?: number;
    results_found?: number;
    error?: string;
  }> {
    try {
      const searchInfo = this.activeSearches.get(searchId);
      
      if (!searchInfo) {
        return { status: 'not_found' };
      }
      
      // Check if search is still active (hasn't exceeded timeout)
      const timeoutMs = 10 * 60 * 1000; // 10 minutes
      const isExpired = Date.now() - searchInfo.started_at.getTime() > timeoutMs;
      
      if (isExpired) {
        this.activeSearches.delete(searchId);
        return { status: 'failed', error: 'Search timeout' };
      }
      
      // Try to get status from n8n workflow if available
      if (searchInfo.workflowExecutionId) {
        try {
          const response = await fetch(`${this.apiEndpoint}/status/${searchInfo.workflowExecutionId}`, {
            headers: {
              'Authorization': `Bearer ${this.getAuthToken()}`
            }
          });
          
          if (response.ok) {
            const workflowStatus = await response.json();
            return {
              status: workflowStatus.finished ? 'completed' : 'active',
              progress: workflowStatus.progress || 0,
              results_found: workflowStatus.results_found || 0
            };
          }
        } catch (error) {
          console.warn('Could not get workflow status:', error);
        }
      }
      
      return { status: 'active', progress: 50 }; // Default active status
    } catch (error) {
      return { status: 'failed', error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

// Singleton instance
export const enhancedBrightDataService = new EnhancedBrightDataService();

// Maintain backward compatibility
export const secureBrightDataService = enhancedBrightDataService;

// Export all types
export type { 
  LinkedInScrapedProfile,
  LinkedInSearchResult,
  CompanyFollower,
  PostEngagement,
  GroupMember,
  EventAttendee,
  ProxyUsageStats,
  RateLimitConfig,
  CostTracker
};