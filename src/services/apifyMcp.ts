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
  private predefinedActorId = 'sam-ai/linkedin-prospect-extractor'; // Your predefined actor
  private fallbackActorId = 'apify/linkedin-scraper'; // Official fallback actor
  
  /**
   * Extracts LinkedIn profiles from search URL using Apify MCP
   */
  async extractLinkedInProfiles(searchUrl: string, options: Partial<LinkedInSearchInput> = {}): Promise<{
    success: boolean;
    data: ApifyLinkedInResult[];
    runId: string;
    stats?: ApifyActorRun['stats'];
    errors: string[];
  }> {
    try {
      const input: LinkedInSearchInput = {
        startUrls: [{ url: searchUrl }],
        maxResults: options.maxResults || 100,
        saveToKVS: false,
        saveToDataset: true,
        extractEmails: options.extractEmails ?? true,
        extractPhones: options.extractPhones ?? false,
        includePrivateProfiles: false,
        waitForResults: true,
        maxRequestRetries: 3,
        maxPagesPerQuery: 10,
        maxProfilesPerPage: 25,
        ...options
      };

      // Start predefined actor run through MCP
      const response = await fetch(`${this.mcpEndpoint}/actors/${this.predefinedActorId}/runs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'start_run',
          input: input,
          timeout: 300000, // 5 minutes
          waitForFinish: true
        })
      });

      if (!response.ok) {
        throw new Error(`MCP request failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        return {
          success: false,
          data: [],
          runId: result.runId || '',
          errors: result.errors || ['Unknown MCP error']
        };
      }

      return {
        success: true,
        data: result.data || [],
        runId: result.runId,
        stats: result.stats,
        errors: result.warnings || []
      };

    } catch (error) {
      console.error('Apify MCP extraction error:', error);
      return {
        success: false,
        data: [],
        runId: '',
        errors: [error instanceof Error ? error.message : 'Unknown extraction error']
      };
    }
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