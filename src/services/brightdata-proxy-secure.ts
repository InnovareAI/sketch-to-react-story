// Secure Bright Data Proxy Client
// This client sends requests to a secure server-side endpoint
// All credentials are handled server-side only

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

class SecureBrightDataService {
  private apiEndpoint: string;

  constructor() {
    // Use secure server-side endpoint
    this.apiEndpoint = '/api/brightdata';
  }

  /**
   * Test proxy connection through secure endpoint
   */
  async testProxyConnection(country?: string): Promise<{ success: boolean; ip: string; country: string; error?: string }> {
    try {
      const response = await fetch(`${this.apiEndpoint}/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({ country })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      return {
        success: false,
        ip: 'unknown',
        country: 'unknown',
        error: error.message
      };
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
    try {
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

      return await response.json();
    } catch (error) {
      console.error('Error scraping LinkedIn profile:', error);
      throw error;
    }
  }

  /**
   * Search LinkedIn profiles through secure endpoint
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

      return await response.json();
    } catch (error) {
      console.error('Error searching LinkedIn profiles:', error);
      throw error;
    }
  }

  /**
   * Bulk scrape LinkedIn profiles through secure endpoint
   */
  async bulkScrapeProfiles(profileUrls: string[], options?: {
    distributeAcrossCountries?: boolean;
    countries?: string[];
    concurrency?: number;
  }): Promise<LinkedInScrapedProfile[]> {
    try {
      const response = await fetch(`${this.apiEndpoint}/bulk-scrape`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({
          profileUrls,
          ...options
        })
      });

      if (!response.ok) {
        throw new Error(`Bulk scraping failed: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error bulk scraping profiles:', error);
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
}

// Singleton instance
export const secureBrightDataService = new SecureBrightDataService();

// Export types
export type { LinkedInScrapedProfile };