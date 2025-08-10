// Bright Data Proxy Integration for LinkedIn Data Collection
// Sam AI Platform - Real proxy-enabled LinkedIn scraping

interface BrightDataProxyConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  zone: string;
}

interface ProxyRequest {
  url: string;
  method?: 'GET' | 'POST';
  headers?: Record<string, string>;
  body?: string;
  country?: string;
  state?: string;
  city?: string;
  asn?: string;
}

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

class BrightDataProxyService {
  private config: BrightDataProxyConfig;

  constructor() {
    // Prioritize Residential Network for maximum authenticity
    const preferredZone = import.meta.env.VITE_BRIGHT_DATA_PREFERRED_ZONE || 'residential';
    const isResidential = preferredZone === 'residential';
    
    this.config = {
      host: 'brd.superproxy.io',
      port: isResidential ? 22225 : 33335, // Residential: 22225, ISP: 33335
      username: `brd-customer-hl_8aca120e-zone-${preferredZone}`,
      password: import.meta.env.VITE_BRIGHT_DATA_PASSWORD || '',
      zone: preferredZone
    };
  }

  /**
   * Test proxy connection
   */
  async testProxyConnection(country?: string): Promise<{ success: boolean; ip: string; country: string; error?: string }> {
    try {
      const response = await this.makeProxyRequest({
        url: 'http://geo.brdtest.com/welcome.txt',
        country: country
      });

      if (response.ok) {
        const text = await response.text();
        const ipMatch = text.match(/IP: ([\d.]+)/);
        const countryMatch = text.match(/Country: ([A-Z]{2})/);
        
        return {
          success: true,
          ip: ipMatch?.[1] || 'unknown',
          country: countryMatch?.[1] || 'unknown'
        };
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      return {
        success: false,
        ip: 'unknown',
        country: 'unknown',
        error: error.message
      };
    }
  }

  /**
   * Scrape LinkedIn profile using proxy
   */
  async scrapeLinkedInProfile(profileUrl: string, options?: {
    country?: string;
    state?: string;
    includeConnections?: boolean;
    includeActivityData?: boolean;
  }): Promise<LinkedInScrapedProfile> {
    try {
      // First test the proxy connection
      const proxyTest = await this.testProxyConnection(options?.country);
      if (!proxyTest.success) {
        throw new Error(`Proxy connection failed: ${proxyTest.error}`);
      }

      // Make the request to LinkedIn
      const response = await this.makeProxyRequest({
        url: profileUrl,
        country: options?.country,
        state: options?.state,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Cache-Control': 'max-age=0'
        }
      });

      if (!response.ok) {
        throw new Error(`LinkedIn request failed: ${response.status} ${response.statusText}`);
      }

      const html = await response.text();
      
      // Parse LinkedIn profile data from HTML
      const profileData = this.parseLinkedInProfileHTML(html);
      
      return {
        ...profileData,
        profile_url: profileUrl,
        scraped_at: new Date().toISOString(),
        proxy_info: {
          country: proxyTest.country,
          ip: proxyTest.ip,
          success: true
        }
      };
    } catch (error) {
      console.error('Error scraping LinkedIn profile:', error);
      throw error;
    }
  }

  /**
   * Search LinkedIn profiles with location targeting
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
    try {
      // Build LinkedIn search URL
      const searchUrl = this.buildLinkedInSearchUrl(searchParams);
      
      const response = await this.makeProxyRequest({
        url: searchUrl,
        country: searchParams.proxyCountry,
        state: searchParams.proxyState
      });

      if (!response.ok) {
        throw new Error(`LinkedIn search failed: ${response.status} ${response.statusText}`);
      }

      const html = await response.text();
      
      // Parse search results and extract profile URLs
      const profileUrls = this.extractProfileUrlsFromSearch(html);
      
      // Scrape individual profiles
      const profiles: LinkedInScrapedProfile[] = [];
      const limit = Math.min(searchParams.limit || 10, profileUrls.length);
      
      for (let i = 0; i < limit; i++) {
        try {
          const profile = await this.scrapeLinkedInProfile(profileUrls[i], {
            country: searchParams.proxyCountry,
            state: searchParams.proxyState
          });
          profiles.push(profile);
          
          // Add delay between requests to avoid rate limiting
          await this.delay(2000 + Math.random() * 3000);
        } catch (error) {
          console.error(`Error scraping profile ${profileUrls[i]}:`, error);
          continue;
        }
      }

      return profiles;
    } catch (error) {
      console.error('Error searching LinkedIn profiles:', error);
      throw error;
    }
  }

  /**
   * Bulk scrape LinkedIn profiles with distributed proxy locations
   */
  async bulkScrapeProfiles(profileUrls: string[], options?: {
    distributeAcrossCountries?: boolean;
    countries?: string[];
    concurrency?: number;
  }): Promise<LinkedInScrapedProfile[]> {
    const countries = options?.countries || ['US', 'GB', 'DE', 'FR', 'CA'];
    const concurrency = options?.concurrency || 3;
    const results: LinkedInScrapedProfile[] = [];
    
    // Split URLs into batches
    const batches = this.chunkArray(profileUrls, concurrency);
    
    for (const batch of batches) {
      const batchPromises = batch.map(async (url, index) => {
        const country = options?.distributeAcrossCountries 
          ? countries[index % countries.length]
          : undefined;
          
        try {
          return await this.scrapeLinkedInProfile(url, { country });
        } catch (error) {
          console.error(`Error scraping ${url}:`, error);
          return null;
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults.filter(result => result !== null));
      
      // Delay between batches
      if (batches.indexOf(batch) < batches.length - 1) {
        await this.delay(5000 + Math.random() * 5000);
      }
    }

    return results;
  }

  /**
   * Make a request through Bright Data proxy
   */
  private async makeProxyRequest(request: ProxyRequest): Promise<Response> {
    // Build proxy username with targeting options
    let proxyUsername = this.config.username;
    
    if (request.country) {
      proxyUsername += `-country-${request.country.toLowerCase()}`;
    }
    if (request.state) {
      proxyUsername += `-state-${request.state.toLowerCase()}`;
    }
    if (request.city) {
      proxyUsername += `-city-${request.city.toLowerCase()}`;
    }
    if (request.asn) {
      proxyUsername += `-asn-${request.asn}`;
    }

    // Create proxy configuration
    const proxyConfig = {
      host: this.config.host,
      port: this.config.port,
      auth: {
        username: proxyUsername,
        password: this.config.password
      }
    };

    // Use server-side proxy endpoint since browsers can't make direct proxy requests
    const proxyEndpoint = '/api/proxy-request';
    
    try {
      const response = await fetch(proxyEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: request.url,
          method: request.method || 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            ...request.headers
          },
          body: request.body,
          proxy: proxyConfig
        })
      });

      return response;
    } catch (error) {
      console.error('Proxy request failed:', error);
      throw error;
    }
  }

  /**
   * Parse LinkedIn profile HTML and extract structured data
   */
  private parseLinkedInProfileHTML(html: string): Omit<LinkedInScrapedProfile, 'profile_url' | 'scraped_at' | 'proxy_info'> {
    // Simplified parser - in production, use proper HTML parsing
    const nameMatch = html.match(/<h1[^>]*class="[^"]*text-heading-xlarge[^"]*"[^>]*>([^<]+)</);
    const headlineMatch = html.match(/<div[^>]*class="[^"]*text-body-medium[^"]*"[^>]*>([^<]+)</);
    const locationMatch = html.match(/<span[^>]*class="[^"]*text-body-small[^"]*"[^>]*>([^<]+)</);
    const imageMatch = html.match(/<img[^>]*src="([^"]+)"[^>]*alt="[^"]*profile[^"]*"/i);
    
    return {
      full_name: nameMatch?.[1]?.trim() || 'Unknown',
      headline: headlineMatch?.[1]?.trim() || '',
      location: locationMatch?.[1]?.trim() || '',
      current_company: '',
      current_position: '',
      connections_count: '500+',
      about: '',
      experience: [],
      education: [],
      skills: [],
      contact_info: {},
      profile_image_url: imageMatch?.[1] || ''
    };
  }

  /**
   * Build LinkedIn search URL
   */
  private buildLinkedInSearchUrl(params: {
    keywords: string;
    location?: string;
    company?: string;
    title?: string;
  }): string {
    const baseUrl = 'https://www.linkedin.com/search/results/people/';
    const searchParams = new URLSearchParams();
    
    if (params.keywords) searchParams.set('keywords', params.keywords);
    if (params.location) searchParams.set('geoUrn', params.location);
    if (params.company) searchParams.set('currentCompany', params.company);
    if (params.title) searchParams.set('title', params.title);
    
    return `${baseUrl}?${searchParams.toString()}`;
  }

  /**
   * Extract profile URLs from search results HTML
   */
  private extractProfileUrlsFromSearch(html: string): string[] {
    const profileUrlRegex = /href="(\/in\/[^"]+)"/g;
    const urls: string[] = [];
    let match;
    
    while ((match = profileUrlRegex.exec(html)) !== null) {
      const fullUrl = `https://www.linkedin.com${match[1]}`;
      if (!urls.includes(fullUrl)) {
        urls.push(fullUrl);
      }
    }
    
    return urls;
  }

  /**
   * Utility functions
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }
}

// Singleton instance
export const brightDataProxyService = new BrightDataProxyService();

// Export types
export type {
  LinkedInScrapedProfile,
  BrightDataProxyConfig,
  ProxyRequest
};