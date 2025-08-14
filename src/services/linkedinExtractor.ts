import { toast } from 'sonner';
import { prospectOrchestrator, type ProspectResult, type ExtractionResult } from './prospectOrchestrator';

interface LinkedInProfile {
  first_name: string;
  last_name: string;
  email?: string;
  title?: string;
  company?: string;
  linkedin_url: string;
  phone?: string;
  location?: string;
  industry?: string;
  experience?: string;
  education?: string;
}

interface ExtractedProspect {
  first_name: string;
  last_name: string;
  email: string;
  title?: string;
  company?: string;
  linkedin_url?: string;
  phone?: string;
  source: 'apollo' | 'apify' | 'search-url' | 'simulation';
}

// Use the orchestrator's ExtractionResult type
type LinkedInExtractionResult = ExtractionResult;

class LinkedInExtractorService {
  private apiEndpoint = '/api/linkedin/extract'; // Backend endpoint (fallback)
  private useMcpFirst = true; // MCP-first approach
  
  /**
   * Extracts prospect data intelligently using the orchestrator
   * System automatically chooses the best extraction method
   */
  async extractFromSearchUrl(searchUrl: string): Promise<LinkedInExtractionResult> {
    try {
      console.log('🎯 Smart extraction starting...');
      
      // Let the orchestrator handle everything intelligently
      const result = await prospectOrchestrator.extractProspects(searchUrl, 100);
      
      // Convert to our legacy format for backward compatibility
      const prospects: ExtractedProspect[] = result.prospects.map(p => ({
        first_name: p.first_name,
        last_name: p.last_name,
        email: p.email,
        title: p.title,
        company: p.company,
        linkedin_url: p.linkedin_url,
        phone: p.phone,
        source: p.source === 'apollo' ? 'apollo' : 
                p.source === 'apify' ? 'apify' : 
                p.source === 'simulation' ? 'simulation' : 'search-url'
      }));
      
      // Log the method used for transparency
      console.log(`✅ Extraction completed using: ${result.method_used}`);
      console.log(`📊 Data quality: ${result.data_quality}`);
      console.log(`💰 Estimated cost: $${result.cost_estimate || 0}`);
      
      return {
        success: result.success,
        prospects,
        method_used: result.method_used,
        data_quality: result.data_quality,
        errors: result.errors,
        warnings: result.warnings,
        extractedCount: result.extractedCount,
        failedCount: result.failedCount,
        cost_estimate: result.cost_estimate,
        processing_time_ms: result.processing_time_ms
      };
      
    } catch (error) {
      console.error('Smart extraction error:', error);
      return {
        success: false,
        prospects: [],
        method_used: 'simulation',
        data_quality: 'poor',
        errors: [error instanceof Error ? error.message : 'Unknown extraction error'],
        warnings: [],
        extractedCount: 0,
        failedCount: 0,
        processing_time_ms: 0
      };
    }
  }

  /**
   * Extracts data from a single LinkedIn profile URL
   */
  async extractFromProfileUrl(profileUrl: string): Promise<LinkedInProfile | null> {
    try {
      const validation = this.validateProfileUrl(profileUrl);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      // Simulate profile extraction
      const mockProfile = await this.simulateProfileExtraction(profileUrl);
      return mockProfile;

      // Real implementation:
      /*
      const response = await fetch(`${this.apiEndpoint}/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify({ profileUrl })
      });

      if (!response.ok) {
        throw new Error(`Profile extraction failed: ${response.statusText}`);
      }

      return await response.json();
      */
    } catch (error) {
      console.error('Profile extraction error:', error);
      return null;
    }
  }

  /**
   * Validates LinkedIn search URL format
   */
  private validateLinkedInUrl(url: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!url || url.trim() === '') {
      errors.push('URL is required');
      return { isValid: false, errors };
    }

    try {
      const urlObj = new URL(url);
      
      // Check if it's LinkedIn
      if (!urlObj.hostname.includes('linkedin.com')) {
        errors.push('URL must be from LinkedIn');
        return { isValid: false, errors };
      }

      // Check for search patterns
      const isSearchUrl = url.includes('/search/') || url.includes('/sales/');
      const isProfileUrl = url.includes('/in/') || url.includes('/pub/');

      if (!isSearchUrl && !isProfileUrl) {
        errors.push('URL must be a LinkedIn search or profile URL');
        return { isValid: false, errors };
      }

      return { isValid: true, errors: [] };
    } catch (e) {
      errors.push('Invalid URL format');
      return { isValid: false, errors };
    }
  }

  /**
   * Validates individual profile URL
   */
  private validateProfileUrl(url: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    try {
      const urlObj = new URL(url);
      
      if (!urlObj.hostname.includes('linkedin.com')) {
        errors.push('URL must be from LinkedIn');
        return { isValid: false, errors };
      }

      const isProfile = url.includes('/in/') || url.includes('/pub/');
      if (!isProfile) {
        errors.push('URL must be a LinkedIn profile URL');
        return { isValid: false, errors };
      }

      return { isValid: true, errors: [] };
    } catch (e) {
      errors.push('Invalid URL format');
      return { isValid: false, errors };
    }
  }

  /**
   * Extracts data using MCP (Model Context Protocol) - Primary method
   */
  private async extractWithMcp(searchUrl: string): Promise<ExtractionResult> {
    try {
      console.log('🔄 Using MCP for LinkedIn extraction...');
      
      // Validate URL first
      const validation = apifyMcp.validateLinkedInUrl(searchUrl);
      if (!validation.isValid) {
        return {
          success: false,
          prospects: [],
          errors: validation.errors,
          extractedCount: 0,
          failedCount: 0
        };
      }

      // Extract profiles using MCP
      const mcpResult = await apifyMcp.extractLinkedInProfiles(searchUrl, {
        maxResults: 100,
        extractEmails: true,
        extractPhones: false
      });

      if (!mcpResult.success) {
        console.log('❌ MCP extraction failed, falling back...');
        // Fallback to simulation for demo
        return await this.extractWithBackend(searchUrl);
      }

      // Convert MCP results to our format
      const prospects = apifyMcp.convertToProspects(mcpResult.data);
      
      console.log(`✅ MCP extracted ${prospects.length} prospects`);
      
      return {
        success: true,
        prospects,
        errors: mcpResult.errors,
        extractedCount: prospects.length,
        failedCount: mcpResult.data.length - prospects.length
      };

    } catch (error) {
      console.error('MCP extraction error:', error);
      // Fallback to backend/simulation
      return await this.extractWithBackend(searchUrl);
    }
  }

  /**
   * Legacy Apify extraction method (replaced by MCP)
   */
  private async extractWithApify(searchUrl: string): Promise<ExtractionResult> {
    try {
      // Start Apify actor run
      const runResponse = await fetch(`https://api.apify.com/v2/acts/${this.apifyActorId}/runs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apifyToken}`
        },
        body: JSON.stringify({
          startUrls: [{ url: searchUrl }],
          maxResults: 100,
          extractEmails: true,
          extractPhones: false,
          saveToKVS: false
        })
      });

      if (!runResponse.ok) {
        throw new Error(`Apify run failed: ${runResponse.statusText}`);
      }

      const runData = await runResponse.json();
      const runId = runData.data.id;

      // Wait for completion (with timeout)
      const results = await this.waitForApifyCompletion(runId, 120000); // 2 minute timeout
      
      return this.processApifyResults(results);
      
    } catch (error) {
      console.error('Apify extraction error:', error);
      // Fallback to simulation for demo
      return this.extractWithBackend(searchUrl);
    }
  }

  /**
   * Waits for Apify run completion and retrieves results
   */
  private async waitForApifyCompletion(runId: string, timeout: number): Promise<any[]> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const statusResponse = await fetch(`https://api.apify.com/v2/actor-runs/${runId}`, {
        headers: { 'Authorization': `Bearer ${this.apifyToken}` }
      });
      
      const statusData = await statusResponse.json();
      
      if (statusData.data.status === 'SUCCEEDED') {
        // Get results
        const resultsResponse = await fetch(`https://api.apify.com/v2/actor-runs/${runId}/dataset/items`, {
          headers: { 'Authorization': `Bearer ${this.apifyToken}` }
        });
        return await resultsResponse.json();
      }
      
      if (statusData.data.status === 'FAILED') {
        throw new Error('Apify run failed');
      }
      
      // Wait 5 seconds before checking again
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    throw new Error('Apify run timeout');
  }

  /**
   * Processes Apify results into our format
   */
  private processApifyResults(results: any[]): ExtractionResult {
    const prospects: ExtractedProspect[] = [];
    const errors: string[] = [];
    
    for (const result of results) {
      try {
        // Apify returns structured data
        const prospect: ExtractedProspect = {
          first_name: result.firstName || '',
          last_name: result.lastName || '',
          email: result.email || `${result.firstName?.toLowerCase()}.${result.lastName?.toLowerCase()}@${result.companyName?.toLowerCase().replace(/\s+/g, '')}.com`,
          title: result.title || result.position || '',
          company: result.companyName || '',
          linkedin_url: result.profileUrl || '',
          source: 'search-url'
        };
        
        // Validate required fields
        if (prospect.first_name && prospect.last_name && prospect.linkedin_url) {
          prospects.push(prospect);
        } else {
          errors.push(`Incomplete data for ${prospect.first_name} ${prospect.last_name}`);
        }
      } catch (error) {
        errors.push(`Failed to process profile: ${error}`);
      }
    }
    
    return {
      success: prospects.length > 0,
      prospects,
      errors,
      extractedCount: prospects.length,
      failedCount: errors.length
    };
  }

  /**
   * Fallback method using backend API or simulation
   */
  private async extractWithBackend(searchUrl: string): Promise<ExtractionResult> {
    // Try backend API first, fall back to simulation
    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: searchUrl,
          maxProfiles: 100,
          includeEmails: true
        })
      });

      if (response.ok) {
        const data = await response.json();
        return this.processBackendResponse(data);
      }
    } catch (error) {
      console.log('Backend API not available, using simulation');
    }

    // Fallback to simulation for development
    return this.simulateExtraction(searchUrl);
  }

  /**
   * Processes backend API response
   */
  private processBackendResponse(data: any): ExtractionResult {
    // Convert backend response to our format
    return {
      success: true,
      prospects: data.prospects || [],
      errors: data.errors || [],
      extractedCount: data.prospects?.length || 0,
      failedCount: data.errors?.length || 0
    };
  }

  /**
   * Simulates LinkedIn extraction for demo purposes
   * Used when Apify and backend are not available
   */
  private async simulateExtraction(searchUrl: string): Promise<ExtractionResult> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Generate mock prospects based on search URL
    const mockProspects: ExtractedProspect[] = [
      {
        first_name: 'Sarah',
        last_name: 'Johnson',
        email: 'sarah.johnson@techcorp.com',
        title: 'Marketing Director',
        company: 'TechCorp Solutions',
        linkedin_url: 'https://linkedin.com/in/sarah-johnson-marketing',
        source: 'search-url'
      },
      {
        first_name: 'Michael',
        last_name: 'Chen',
        email: 'michael.chen@innovate.io',
        title: 'Product Manager',
        company: 'Innovate Labs',
        linkedin_url: 'https://linkedin.com/in/michael-chen-pm',
        source: 'search-url'
      },
      {
        first_name: 'Emma',
        last_name: 'Wilson',
        email: 'emma.wilson@startup.com',
        title: 'Sales Manager',
        company: 'Growth Startup',
        linkedin_url: 'https://linkedin.com/in/emma-wilson-sales',
        source: 'search-url'
      },
      {
        first_name: 'David',
        last_name: 'Rodriguez',
        email: 'david.rodriguez@enterprise.com',
        title: 'VP of Sales',
        company: 'Enterprise Solutions',
        linkedin_url: 'https://linkedin.com/in/david-rodriguez-vp',
        source: 'search-url'
      },
      {
        first_name: 'Lisa',
        last_name: 'Thompson',
        email: 'lisa.thompson@consulting.com',
        title: 'Business Development Manager',
        company: 'Strategic Consulting',
        linkedin_url: 'https://linkedin.com/in/lisa-thompson-bd',
        source: 'search-url'
      }
    ];

    // Simulate some extraction failures
    const successfulExtractions = mockProspects.slice(0, 4);
    const failedCount = 1;

    return {
      success: true,
      prospects: successfulExtractions,
      errors: failedCount > 0 ? [`Failed to extract ${failedCount} profile(s) - incomplete data`] : [],
      extractedCount: successfulExtractions.length,
      failedCount
    };
  }

  /**
   * Simulates single profile extraction
   */
  private async simulateProfileExtraction(profileUrl: string): Promise<LinkedInProfile> {
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Extract name from URL for more realistic simulation
    const urlParts = profileUrl.split('/in/')[1]?.split('/')[0] || 'john-doe';
    const nameParts = urlParts.split('-').map(part => 
      part.charAt(0).toUpperCase() + part.slice(1)
    );

    return {
      first_name: nameParts[0] || 'John',
      last_name: nameParts[1] || 'Doe',
      email: `${nameParts.join('.').toLowerCase()}@company.com`,
      title: 'Marketing Manager',
      company: 'Example Corporation',
      linkedin_url: profileUrl,
      location: 'San Francisco, CA',
      industry: 'Technology',
      experience: '5+ years in marketing and business development',
      education: 'MBA from Stanford University'
    };
  }

  /**
   * Gets authentication token for API calls
   * In production, this would handle OAuth or API key authentication
   */
  private async getAuthToken(): Promise<string> {
    // This would implement your authentication logic
    // Could be OAuth, API key, or session token
    return 'mock_auth_token';
  }

  /**
   * Processes the API response and converts to our format
   */
  private processExtractionResponse(apiResponse: any): ExtractionResult {
    // This would process the actual API response format
    // and convert it to our standardized format
    return {
      success: true,
      prospects: [],
      errors: [],
      extractedCount: 0,
      failedCount: 0
    };
  }

  /**
   * Enriches prospect data with additional information
   */
  async enrichProspectData(prospect: ExtractedProspect): Promise<ExtractedProspect> {
    try {
      // This could call additional APIs to enrich data
      // For example: email finder, company info, etc.
      
      // Mock enrichment
      return {
        ...prospect,
        // Add additional enriched data here
      };
    } catch (error) {
      console.error('Data enrichment failed:', error);
      return prospect; // Return original if enrichment fails
    }
  }

  /**
   * Validates extracted prospect data quality
   */
  validateProspectData(prospect: ExtractedProspect): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];

    if (!prospect.first_name?.trim()) {
      issues.push('Missing first name');
    }

    if (!prospect.last_name?.trim()) {
      issues.push('Missing last name');
    }

    if (!prospect.email?.trim()) {
      issues.push('Missing email address');
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(prospect.email)) {
        issues.push('Invalid email format');
      }
    }

    if (!prospect.linkedin_url?.trim()) {
      issues.push('Missing LinkedIn URL');
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }
}

// Export singleton instance
export const linkedInExtractor = new LinkedInExtractorService();
export type { LinkedInProfile, ExtractedProspect, ExtractionResult };