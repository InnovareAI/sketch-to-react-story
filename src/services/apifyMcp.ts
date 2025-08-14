/**
 * Apify MCP Integration for LinkedIn Data Extraction
 * 
 * This service integrates with Apify through MCP (Model Context Protocol)
 * providing a clean interface for LinkedIn profile extraction
 */

interface ApifyActorRun {
  id: string;
  status: 'READY' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'TIMED-OUT' | 'ABORTED';
  startedAt: string;
  finishedAt?: string;
  stats: {
    inputBodyLen: number;
    restartCount: number;
    resurrectCount: number;
    memAvgBytes: number;
    memMaxBytes: number;
    memCurrentBytes: number;
    cpuAvgUsage: number;
    cpuMaxUsage: number;
    cpuCurrentUsage: number;
    netRxBytes: number;
    netTxBytes: number;
    durationMillis: number;
    runTimeSecs: number;
    metamorph: number;
    computeUnits: number;
  };
}

interface ApifyLinkedInResult {
  firstName: string;
  lastName: string;
  fullName: string;
  profileUrl: string;
  profileId: string;
  title?: string;
  companyName?: string;
  companyUrl?: string;
  location?: string;
  description?: string;
  connectionsCount?: number;
  mutualConnectionsCount?: number;
  email?: string;
  phone?: string;
  twitter?: string;
  imgUrl?: string;
  backgroundImgUrl?: string;
  skills?: string[];
  recommendations?: number;
  experience?: Array<{
    title: string;
    company: string;
    location?: string;
    startDate?: string;
    endDate?: string;
    description?: string;
  }>;
  education?: Array<{
    school: string;
    degree?: string;
    field?: string;
    startYear?: number;
    endYear?: number;
  }>;
}

interface LinkedInSearchInput {
  startUrls: Array<{ url: string }>;
  maxResults?: number;
  saveToKVS?: boolean;
  saveToDataset?: boolean;
  extractEmails?: boolean;
  extractPhones?: boolean;
  includePrivateProfiles?: boolean;
  waitForResults?: boolean;
  maxRequestRetries?: number;
  maxPagesPerQuery?: number;
  maxProfilesPerPage?: number;
}

class ApifyMcpService {
  private mcpEndpoint = '/api/mcp/apify'; // MCP endpoint for Apify
  private predefinedActorId = 'apify/linkedin-scraper'; // Official production actor
  private fallbackActorId = 'drobnikj/linkedin-scraper'; // High-rated community fallback
  
  /**
   * Extracts LinkedIn profiles from search URL using Apify API (following official docs)
   */
  async extractLinkedInProfiles(searchUrl: string, options: Partial<LinkedInSearchInput> = {}): Promise<{
    success: boolean;
    data: ApifyLinkedInResult[];
    runId: string;
    stats?: ApifyActorRun['stats'];
    errors: string[];
  }> {
    try {
      // Check if we have API token via environment or MCP
      const apiToken = await this.getApiToken();
      if (!apiToken) {
        throw new Error('Apify API token not configured');
      }

      const input: LinkedInSearchInput = {
        startUrls: [{ url: searchUrl }],
        maxResults: Math.min(options.maxResults || 100, 200), // Production limit
        saveToKVS: false,
        saveToDataset: true,
        extractEmails: options.extractEmails ?? true,
        extractPhones: options.extractPhones ?? false,
        includePrivateProfiles: false,
        waitForResults: true,
        maxRequestRetries: 3,
        maxPagesPerQuery: 5, // Conservative for production
        maxProfilesPerPage: 20, // Conservative for production
        proxyConfiguration: { useApifyProxy: true }, // Use Apify's proxies for reliability
        ...options
      };

      // Use official Apify API v2 endpoint (as per docs)
      const response = await fetch(`https://api.apify.com/v2/acts/${this.predefinedActorId}/runs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiToken}` // Recommended authentication method
        },
        body: JSON.stringify(input)
      });

      if (!response.ok) {
        // Handle rate limiting (30 req/sec per resource)
        if (response.status === 429) {
          throw new Error('Rate limited - too many requests. Please try again in a moment.');
        }
        throw new Error(`Apify API request failed: ${response.status} ${response.statusText}`);
      }

      const runData = await response.json();
      const runId = runData.data.id;

      // For synchronous operation, wait for completion
      if (options.waitForResults !== false) {
        const results = await this.waitForRunCompletion(runId, apiToken, 300000); // 5 min timeout
        
        return {
          success: true,
          data: results.data,
          runId: runId,
          stats: results.stats,
          errors: results.warnings || []
        };
      } else {
        // Asynchronous - return run ID for later polling
        return {
          success: true,
          data: [],
          runId: runId,
          errors: []
        };
      }

    } catch (error) {
      console.error('Apify extraction error:', error);
      return {
        success: false,
        data: [],
        runId: '',
        errors: [error instanceof Error ? error.message : 'Unknown extraction error']
      };
    }
  }

  /**
   * Gets API token from environment or MCP configuration
   */
  private async getApiToken(): Promise<string | null> {
    // Try environment variable first
    const envToken = process.env.VITE_APIFY_TOKEN || process.env.APIFY_API_TOKEN;
    if (envToken) {
      return envToken;
    }

    // Try MCP endpoint for token
    try {
      const response = await fetch(`${this.mcpEndpoint}/auth/token`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.token;
      }
    } catch (error) {
      // MCP not available, continue without token
    }

    return null;
  }

  /**
   * Waits for run completion following Apify's recommended polling pattern
   */
  private async waitForRunCompletion(runId: string, apiToken: string, timeoutMs: number = 300000): Promise<{
    data: ApifyLinkedInResult[];
    stats?: ApifyActorRun['stats'];
    warnings?: string[];
  }> {
    const startTime = Date.now();
    const pollInterval = 2000; // 2 seconds (respects 30 req/sec limit)
    
    while (Date.now() - startTime < timeoutMs) {
      try {
        // Check run status (following API v2 docs)
        const statusResponse = await fetch(`https://api.apify.com/v2/actor-runs/${runId}`, {
          headers: { 'Authorization': `Bearer ${apiToken}` }
        });
        
        if (!statusResponse.ok) {
          throw new Error(`Status check failed: ${statusResponse.statusText}`);
        }
        
        const statusData = await statusResponse.json();
        const runInfo = statusData.data;
        
        if (runInfo.status === 'SUCCEEDED') {
          // Get results from dataset (as per docs)
          const resultsResponse = await fetch(`https://api.apify.com/v2/actor-runs/${runId}/dataset/items`, {
            headers: { 'Authorization': `Bearer ${apiToken}` }
          });
          
          if (!resultsResponse.ok) {
            throw new Error(`Results fetch failed: ${resultsResponse.statusText}`);
          }
          
          const results = await resultsResponse.json();
          
          return {
            data: results || [],
            stats: runInfo.stats,
            warnings: []
          };
        }
        
        if (runInfo.status === 'FAILED') {
          throw new Error(`Actor run failed: ${runInfo.statusMessage || 'Unknown error'}`);
        }
        
        if (runInfo.status === 'TIMED-OUT') {
          throw new Error('Actor run timed out');
        }
        
        if (runInfo.status === 'ABORTED') {
          throw new Error('Actor run was aborted');
        }
        
        // Still running, wait and poll again
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        
      } catch (error) {
        throw new Error(`Run monitoring failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    throw new Error('Run timeout - actor took too long to complete');
  }

  /**
   * Gets the status of a running Apify actor
   */
  async getRunStatus(runId: string): Promise<{
    status: ApifyActorRun['status'];
    stats?: ApifyActorRun['stats'];
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.mcpEndpoint}/actors/runs/${runId}/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Status check failed: ${response.statusText}`);
      }

      const result = await response.json();
      return {
        status: result.status,
        stats: result.stats
      };

    } catch (error) {
      return {
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Status check failed'
      };
    }
  }

  /**
   * Gets results from a completed Apify run
   */
  async getRunResults(runId: string): Promise<{
    success: boolean;
    data: ApifyLinkedInResult[];
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.mcpEndpoint}/actors/runs/${runId}/dataset`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Results fetch failed: ${response.statusText}`);
      }

      const result = await response.json();
      return {
        success: true,
        data: result.data || []
      };

    } catch (error) {
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Results fetch failed'
      };
    }
  }

  /**
   * Lists available Apify actors for LinkedIn
   */
  async getAvailableActors(): Promise<{
    actors: Array<{
      id: string;
      name: string;
      description: string;
      version: string;
      stats: {
        totalRuns: number;
        lastRunStartedAt?: string;
      };
    }>;
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.mcpEndpoint}/actors/search?q=linkedin`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Actor search failed: ${response.statusText}`);
      }

      const result = await response.json();
      return {
        actors: result.actors || []
      };

    } catch (error) {
      return {
        actors: [],
        error: error instanceof Error ? error.message : 'Actor search failed'
      };
    }
  }

  /**
   * Validates LinkedIn search URL format
   */
  validateLinkedInUrl(url: string): {
    isValid: boolean;
    urlType: 'search' | 'profile' | 'company' | 'invalid';
    errors: string[];
  } {
    const errors: string[] = [];

    if (!url || url.trim() === '') {
      errors.push('URL is required');
      return { isValid: false, urlType: 'invalid', errors };
    }

    try {
      const urlObj = new URL(url);
      
      if (!urlObj.hostname.includes('linkedin.com')) {
        errors.push('URL must be from linkedin.com');
        return { isValid: false, urlType: 'invalid', errors };
      }

      // Determine URL type
      if (url.includes('/search/results/people/')) {
        return { isValid: true, urlType: 'search', errors: [] };
      }
      
      if (url.includes('/sales/search/') || url.includes('/sales/people/')) {
        return { isValid: true, urlType: 'search', errors: [] };
      }
      
      if (url.includes('/in/') || url.includes('/pub/')) {
        return { isValid: true, urlType: 'profile', errors: [] };
      }
      
      if (url.includes('/company/')) {
        return { isValid: true, urlType: 'company', errors: [] };
      }

      errors.push('URL must be a LinkedIn search, profile, or company page');
      return { isValid: false, urlType: 'invalid', errors };

    } catch (e) {
      errors.push('Invalid URL format');
      return { isValid: false, urlType: 'invalid', errors };
    }
  }

  /**
   * Estimates extraction cost and time
   */
  estimateExtraction(searchUrl: string, maxResults: number = 100): {
    estimatedCost: number;
    estimatedTimeMinutes: number;
    computeUnits: number;
    resultLimit: number;
  } {
    // Apify pricing estimates (approximate)
    const baseComputeUnits = 0.1; // Base CU per profile
    const searchComplexityMultiplier = searchUrl.includes('/sales/') ? 1.5 : 1.0;
    
    const computeUnits = Math.ceil(maxResults * baseComputeUnits * searchComplexityMultiplier);
    const estimatedCost = computeUnits * 0.25; // $0.25 per CU (approximate)
    const estimatedTimeMinutes = Math.ceil(maxResults / 20); // ~20 profiles per minute
    
    return {
      estimatedCost: Math.round(estimatedCost * 100) / 100, // Round to 2 decimals
      estimatedTimeMinutes: Math.max(1, estimatedTimeMinutes),
      computeUnits,
      resultLimit: Math.min(maxResults, 1000) // Apify limit
    };
  }

  /**
   * Converts Apify results to our prospect format
   */
  convertToProspects(apifyResults: ApifyLinkedInResult[]): Array<{
    first_name: string;
    last_name: string;
    email: string;
    title?: string;
    company?: string;
    linkedin_url: string;
    phone?: string;
    location?: string;
    source: 'search-url';
  }> {
    return apifyResults.map(result => ({
      first_name: result.firstName || '',
      last_name: result.lastName || '',
      email: result.email || this.generateEmailFromName(result.firstName, result.lastName, result.companyName),
      title: result.title,
      company: result.companyName,
      linkedin_url: result.profileUrl,
      phone: result.phone,
      location: result.location,
      source: 'search-url' as const
    })).filter(prospect => 
      prospect.first_name && 
      prospect.last_name && 
      prospect.linkedin_url
    );
  }

  /**
   * Generates a reasonable email guess from name and company
   */
  private generateEmailFromName(firstName: string, lastName: string, company?: string): string {
    if (!firstName || !lastName) {
      return '';
    }

    const first = firstName.toLowerCase().replace(/[^a-z]/g, '');
    const last = lastName.toLowerCase().replace(/[^a-z]/g, '');
    
    if (company) {
      const domain = company.toLowerCase()
        .replace(/\s+/g, '')
        .replace(/[^a-z0-9]/g, '')
        .substring(0, 20);
      
      return `${first}.${last}@${domain}.com`;
    }
    
    return `${first}.${last}@company.com`;
  }
}

// Export singleton instance
export const apifyMcp = new ApifyMcpService();
export type { 
  ApifyLinkedInResult, 
  LinkedInSearchInput, 
  ApifyActorRun 
};