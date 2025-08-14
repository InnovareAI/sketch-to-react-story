/**
 * Apollo.io MCP Integration for B2B Prospect Data
 * 
 * Apollo.io provides high-quality B2B prospect data with better email accuracy
 * and compliance compared to LinkedIn scraping. Perfect for SAM AI.
 */

interface ApolloContact {
  id: string;
  first_name: string;
  last_name: string;
  name: string;
  email: string;
  email_status: 'verified' | 'guessed' | 'bounced' | 'unknown';
  title: string;
  linkedin_url?: string;
  twitter_url?: string;
  phone: string;
  organization: {
    id: string;
    name: string;
    website_url: string;
    linkedin_url?: string;
    industry: string;
    num_employees: number;
  };
  city: string;
  state: string;
  country: string;
  headline?: string;
  photo_url?: string;
}

interface ApolloSearchInput {
  q_keywords?: string;
  titles?: string[];
  company_names?: string[];
  industries?: string[];
  locations?: string[];
  num_employees_ranges?: string[];
  revenue_ranges?: string[];
  technology_names?: string[];
  page: number;
  per_page: number;
  contact_stage_ids?: string[];
  person_seniorities?: string[];
}

interface ApolloSearchResult {
  contacts: ApolloContact[];
  breadcrumbs: Array<{
    label: string;
    signal_field_name: string;
    value: string;
    display_name: string;
  }>;
  partial_results_only: boolean;
  disable_eu_prospecting: boolean;
  partial_results_limit: number;
  pagination: {
    page: number;
    per_page: number;
    total_entries: number;
    total_pages: number;
  };
}

class ApolloMcpService {
  private mcpEndpoint = '/api/mcp/apollo'; // MCP endpoint for Apollo
  
  /**
   * Searches for prospects using Apollo.io database
   * Much more reliable than LinkedIn scraping
   */
  async searchProspects(searchCriteria: {
    keywords?: string;
    titles?: string[];
    companies?: string[];
    industries?: string[];
    locations?: string[];
    maxResults?: number;
  }): Promise<{
    success: boolean;
    data: ApolloContact[];
    pagination: ApolloSearchResult['pagination'];
    errors: string[];
  }> {
    try {
      const input: ApolloSearchInput = {
        q_keywords: searchCriteria.keywords,
        titles: searchCriteria.titles,
        company_names: searchCriteria.companies,
        industries: searchCriteria.industries,
        locations: searchCriteria.locations,
        page: 1,
        per_page: Math.min(searchCriteria.maxResults || 100, 200) // Apollo max is 200
      };

      const response = await fetch(`${this.mcpEndpoint}/people/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'search_people',
          input: input
        })
      });

      if (!response.ok) {
        throw new Error(`Apollo MCP request failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        return {
          success: false,
          data: [],
          pagination: { page: 1, per_page: 0, total_entries: 0, total_pages: 0 },
          errors: result.errors || ['Unknown Apollo error']
        };
      }

      return {
        success: true,
        data: result.data.contacts || [],
        pagination: result.data.pagination,
        errors: result.warnings || []
      };

    } catch (error) {
      console.error('Apollo MCP search error:', error);
      return {
        success: false,
        data: [],
        pagination: { page: 1, per_page: 0, total_entries: 0, total_pages: 0 },
        errors: [error instanceof Error ? error.message : 'Unknown search error']
      };
    }
  }

  /**
   * Parses LinkedIn search URL to extract search criteria for Apollo
   */
  parseLinkedInSearchUrl(linkedinUrl: string): {
    keywords?: string;
    titles?: string[];
    companies?: string[];
    locations?: string[];
    industries?: string[];
  } {
    try {
      const url = new URL(linkedinUrl);
      const params = new URLSearchParams(url.search);
      
      const searchCriteria: any = {};
      
      // Extract keywords
      const keywords = params.get('keywords');
      if (keywords) {
        searchCriteria.keywords = decodeURIComponent(keywords);
      }
      
      // Extract titles from keywords (common pattern)
      if (searchCriteria.keywords) {
        const titleKeywords = ['manager', 'director', 'vp', 'vice president', 'ceo', 'cto', 'cfo'];
        const foundTitles = titleKeywords.filter(title => 
          searchCriteria.keywords.toLowerCase().includes(title)
        );
        if (foundTitles.length > 0) {
          searchCriteria.titles = foundTitles;
        }
      }
      
      // Extract location
      const location = params.get('location') || params.get('geoUrn');
      if (location) {
        searchCriteria.locations = [decodeURIComponent(location)];
      }
      
      // Extract company from facets
      const facets = params.get('facetCurrentCompany');
      if (facets) {
        // LinkedIn facets are encoded, would need more complex parsing
        // For now, extract from keywords if company names are present
      }
      
      return searchCriteria;
    } catch (error) {
      console.error('Error parsing LinkedIn URL:', error);
      return {};
    }
  }

  /**
   * Converts Apollo contacts to our prospect format
   */
  convertToProspects(apolloContacts: ApolloContact[]): Array<{
    first_name: string;
    last_name: string;
    email: string;
    title?: string;
    company?: string;
    linkedin_url?: string;
    phone?: string;
    location?: string;
    source: 'apollo';
    email_status?: string;
    industry?: string;
  }> {
    return apolloContacts.map(contact => ({
      first_name: contact.first_name || '',
      last_name: contact.last_name || '',
      email: contact.email || '',
      title: contact.title,
      company: contact.organization?.name,
      linkedin_url: contact.linkedin_url,
      phone: contact.phone,
      location: [contact.city, contact.state].filter(Boolean).join(', '),
      source: 'apollo' as const,
      email_status: contact.email_status,
      industry: contact.organization?.industry
    })).filter(prospect => 
      prospect.first_name && 
      prospect.last_name && 
      prospect.email
    );
  }

  /**
   * Gets available search filters from Apollo
   */
  async getSearchFilters(): Promise<{
    industries: string[];
    seniorities: string[];
    employee_ranges: string[];
    revenue_ranges: string[];
    technologies: string[];
  }> {
    try {
      const response = await fetch(`${this.mcpEndpoint}/filters`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Filters request failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data || {
        industries: [],
        seniorities: [],
        employee_ranges: [],
        revenue_ranges: [],
        technologies: []
      };

    } catch (error) {
      console.error('Apollo filters error:', error);
      return {
        industries: [],
        seniorities: [],
        employee_ranges: [],
        revenue_ranges: [],
        technologies: []
      };
    }
  }

  /**
   * Enriches a single contact with additional data
   */
  async enrichContact(email: string): Promise<{
    success: boolean;
    contact?: ApolloContact;
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.mcpEndpoint}/people/match`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'enrich_person',
          input: { email }
        })
      });

      if (!response.ok) {
        throw new Error(`Enrichment failed: ${response.statusText}`);
      }

      const result = await response.json();
      return {
        success: result.success,
        contact: result.data?.person,
        error: result.error
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Enrichment failed'
      };
    }
  }

  /**
   * Estimates Apollo search cost and credits
   */
  estimateSearchCost(maxResults: number): {
    estimatedCredits: number;
    estimatedCost: number;
    resultLimit: number;
    emailCredits: number;
  } {
    // Apollo pricing (approximate)
    const searchCreditsPerResult = 1; // 1 credit per contact view
    const emailCreditsPerEmail = 1; // 1 credit per email reveal
    const creditsPerDollar = 100; // Approximate rate
    
    const estimatedCredits = maxResults * searchCreditsPerResult;
    const emailCredits = maxResults * emailCreditsPerEmail; // If revealing emails
    const totalCredits = estimatedCredits + emailCredits;
    const estimatedCost = totalCredits / creditsPerDollar;
    
    return {
      estimatedCredits,
      estimatedCost: Math.round(estimatedCost * 100) / 100,
      resultLimit: Math.min(maxResults, 10000), // Apollo's typical limit
      emailCredits
    };
  }

  /**
   * Validates search criteria
   */
  validateSearchCriteria(criteria: {
    keywords?: string;
    titles?: string[];
    companies?: string[];
    industries?: string[];
    locations?: string[];
  }): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Need at least one search criterion
    const hasSearchTerms = !!(
      criteria.keywords ||
      (criteria.titles && criteria.titles.length > 0) ||
      (criteria.companies && criteria.companies.length > 0) ||
      (criteria.industries && criteria.industries.length > 0) ||
      (criteria.locations && criteria.locations.length > 0)
    );

    if (!hasSearchTerms) {
      errors.push('At least one search criterion is required');
    }

    // Warn about broad searches
    if (criteria.keywords && criteria.keywords.length < 3) {
      warnings.push('Very short keywords may return too many results');
    }

    if (!criteria.titles && !criteria.companies && criteria.keywords) {
      warnings.push('Adding job titles or companies will improve result quality');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

// Export singleton instance
export const apolloMcp = new ApolloMcpService();
export type { 
  ApolloContact, 
  ApolloSearchInput, 
  ApolloSearchResult 
};