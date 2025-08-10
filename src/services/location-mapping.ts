// Smart Location-Based Proxy Assignment for LinkedIn Scraping
// Automatically assigns Bright Data proxy locations based on LinkedIn account location

interface LocationMapping {
  country: string;
  state?: string;
  city?: string;
  proxyCountry: string;
  proxyState?: string;
  timezone: string;
  language: string;
}

interface LinkedInLocationData {
  profile_location: string;
  detected_country?: string;
  detected_state?: string;
  detected_city?: string;
  suggested_proxy: {
    country: string;
    state?: string;
    confidence: number;
  };
}

class LocationMappingService {
  private locationMappings: LocationMapping[] = [
    // United States mappings
    { country: 'United States', state: 'New York', city: 'New York', proxyCountry: 'US', proxyState: 'NY', timezone: 'America/New_York', language: 'en-US' },
    { country: 'United States', state: 'California', city: 'San Francisco', proxyCountry: 'US', proxyState: 'CA', timezone: 'America/Los_Angeles', language: 'en-US' },
    { country: 'United States', state: 'California', city: 'Los Angeles', proxyCountry: 'US', proxyState: 'CA', timezone: 'America/Los_Angeles', language: 'en-US' },
    { country: 'United States', state: 'Texas', city: 'Austin', proxyCountry: 'US', proxyState: 'TX', timezone: 'America/Chicago', language: 'en-US' },
    { country: 'United States', state: 'Washington', city: 'Seattle', proxyCountry: 'US', proxyState: 'WA', timezone: 'America/Los_Angeles', language: 'en-US' },
    { country: 'United States', state: 'Illinois', city: 'Chicago', proxyCountry: 'US', proxyState: 'IL', timezone: 'America/Chicago', language: 'en-US' },
    { country: 'United States', state: 'Massachusetts', city: 'Boston', proxyCountry: 'US', proxyState: 'MA', timezone: 'America/New_York', language: 'en-US' },
    { country: 'United States', state: 'Florida', city: 'Miami', proxyCountry: 'US', proxyState: 'FL', timezone: 'America/New_York', language: 'en-US' },
    
    // United Kingdom
    { country: 'United Kingdom', city: 'London', proxyCountry: 'GB', timezone: 'Europe/London', language: 'en-GB' },
    { country: 'United Kingdom', city: 'Manchester', proxyCountry: 'GB', timezone: 'Europe/London', language: 'en-GB' },
    { country: 'United Kingdom', city: 'Birmingham', proxyCountry: 'GB', timezone: 'Europe/London', language: 'en-GB' },
    
    // Germany
    { country: 'Germany', city: 'Berlin', proxyCountry: 'DE', timezone: 'Europe/Berlin', language: 'de-DE' },
    { country: 'Germany', city: 'Munich', proxyCountry: 'DE', timezone: 'Europe/Berlin', language: 'de-DE' },
    { country: 'Germany', city: 'Hamburg', proxyCountry: 'DE', timezone: 'Europe/Berlin', language: 'de-DE' },
    
    // France
    { country: 'France', city: 'Paris', proxyCountry: 'FR', timezone: 'Europe/Paris', language: 'fr-FR' },
    { country: 'France', city: 'Lyon', proxyCountry: 'FR', timezone: 'Europe/Paris', language: 'fr-FR' },
    { country: 'France', city: 'Marseille', proxyCountry: 'FR', timezone: 'Europe/Paris', language: 'fr-FR' },
    
    // Canada
    { country: 'Canada', city: 'Toronto', proxyCountry: 'CA', timezone: 'America/Toronto', language: 'en-CA' },
    { country: 'Canada', city: 'Vancouver', proxyCountry: 'CA', timezone: 'America/Vancouver', language: 'en-CA' },
    { country: 'Canada', city: 'Montreal', proxyCountry: 'CA', timezone: 'America/Montreal', language: 'fr-CA' },
    
    // Australia
    { country: 'Australia', city: 'Sydney', proxyCountry: 'AU', timezone: 'Australia/Sydney', language: 'en-AU' },
    { country: 'Australia', city: 'Melbourne', proxyCountry: 'AU', timezone: 'Australia/Melbourne', language: 'en-AU' },
    
    // Netherlands
    { country: 'Netherlands', city: 'Amsterdam', proxyCountry: 'NL', timezone: 'Europe/Amsterdam', language: 'nl-NL' },
    
    // Default fallbacks
    { country: 'United States', proxyCountry: 'US', timezone: 'America/New_York', language: 'en-US' },
    { country: 'Global', proxyCountry: 'US', timezone: 'America/New_York', language: 'en-US' }
  ];

  private cityAliases: Record<string, string> = {
    'NYC': 'New York',
    'SF': 'San Francisco',
    'LA': 'Los Angeles',
    'CHI': 'Chicago',
    'BOS': 'Boston',
    'MIA': 'Miami',
    'LDN': 'London',
    'LON': 'London',
    'BER': 'Berlin',
    'MUN': 'Munich',
    'PAR': 'Paris',
    'TOR': 'Toronto',
    'VAN': 'Vancouver',
    'SYD': 'Sydney',
    'MEL': 'Melbourne',
    'AMS': 'Amsterdam'
  };

  private countryAliases: Record<string, string> = {
    'USA': 'United States',
    'US': 'United States',
    'UK': 'United Kingdom',
    'Britain': 'United Kingdom',
    'Deutschland': 'Germany',
    'España': 'Spain',
    'Italia': 'Italy',
    'Nederland': 'Netherlands',
    'Brasil': 'Brazil',
    'Nippon': 'Japan'
  };

  /**
   * Parse LinkedIn location string and suggest optimal proxy location
   */
  analyzeLinkedInLocation(locationString: string): LinkedInLocationData {
    if (!locationString) {
      return {
        profile_location: '',
        suggested_proxy: {
          country: 'US',
          confidence: 0.5
        }
      };
    }

    const normalizedLocation = this.normalizeLocationString(locationString);
    const parsed = this.parseLocationComponents(normalizedLocation);
    const mapping = this.findBestMapping(parsed);

    return {
      profile_location: locationString,
      detected_country: parsed.country,
      detected_state: parsed.state,
      detected_city: parsed.city,
      suggested_proxy: {
        country: mapping.proxyCountry,
        state: mapping.proxyState,
        confidence: this.calculateConfidence(parsed, mapping)
      }
    };
  }

  /**
   * Get Bright Data proxy configuration for a specific location
   */
  getBrightDataProxyConfig(locationData: LinkedInLocationData): {
    username: string;
    country: string;
    state?: string;
    session_id?: string;
  } {
    const baseUsername = 'brd-customer-hl_8aca120e-zone-residential'; // Use residential for max authenticity
    let username = `${baseUsername}-country-${locationData.suggested_proxy.country.toLowerCase()}`;
    
    if (locationData.suggested_proxy.state) {
      username += `-state-${locationData.suggested_proxy.state.toLowerCase()}`;
    }

    // Add session rotation for better IP diversity
    const sessionId = this.generateSessionId(locationData.profile_location);
    username += `-session-${sessionId}`;

    return {
      username,
      country: locationData.suggested_proxy.country,
      state: locationData.suggested_proxy.state,
      session_id: sessionId
    };
  }

  /**
   * Get optimal proxy distribution for multiple LinkedIn accounts
   */
  getOptimalProxyDistribution(linkedinAccounts: Array<{ profile_location: string; id: string }>): Array<{
    account_id: string;
    proxy_country: string;
    proxy_state?: string;
    rotation_group: string;
    priority: number;
  }> {
    const distributions: Array<{
      account_id: string;
      proxy_country: string;
      proxy_state?: string;
      rotation_group: string;
      priority: number;
    }> = [];

    // Analyze all locations
    const locationAnalysis = linkedinAccounts.map(account => ({
      account_id: account.id,
      ...this.analyzeLinkedInLocation(account.profile_location)
    }));

    // Group by proxy country for rotation
    const countryGroups: Record<string, Array<{ account_id: string; proxy_state?: string }>> = {};
    
    locationAnalysis.forEach(analysis => {
      const country = analysis.suggested_proxy.country;
      if (!countryGroups[country]) {
        countryGroups[country] = [];
      }
      countryGroups[country].push({
        account_id: analysis.account_id,
        proxy_state: analysis.suggested_proxy.state
      });
    });

    // Assign rotation groups and priorities
    Object.entries(countryGroups).forEach(([country, accounts]) => {
      accounts.forEach((account, index) => {
        distributions.push({
          account_id: account.account_id,
          proxy_country: country,
          proxy_state: account.proxy_state,
          rotation_group: `${country}_group_${Math.floor(index / 3)}`, // Max 3 accounts per rotation group
          priority: index + 1
        });
      });
    });

    return distributions;
  }

  private normalizeLocationString(location: string): string {
    return location
      .replace(/[,\-\.]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private parseLocationComponents(location: string): { country?: string; state?: string; city?: string } {
    const parts = location.split(' ').filter(part => part.length > 0);
    const result: { country?: string; state?: string; city?: string } = {};

    // Try to match country aliases
    for (const part of parts) {
      const normalizedPart = part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
      if (this.countryAliases[normalizedPart]) {
        result.country = this.countryAliases[normalizedPart];
        break;
      }
    }

    // Try to match city aliases
    for (const part of parts) {
      const upperPart = part.toUpperCase();
      if (this.cityAliases[upperPart]) {
        result.city = this.cityAliases[upperPart];
        break;
      }
    }

    // If no aliases matched, try direct matching
    if (!result.country) {
      const locationUpper = location.toUpperCase();
      if (locationUpper.includes('UNITED STATES') || locationUpper.includes('USA') || locationUpper.includes('US ')) {
        result.country = 'United States';
      } else if (locationUpper.includes('UNITED KINGDOM') || locationUpper.includes('UK') || locationUpper.includes('BRITAIN')) {
        result.country = 'United Kingdom';
      } else if (locationUpper.includes('GERMANY') || locationUpper.includes('DEUTSCHLAND')) {
        result.country = 'Germany';
      } else if (locationUpper.includes('FRANCE')) {
        result.country = 'France';
      } else if (locationUpper.includes('CANADA')) {
        result.country = 'Canada';
      }
    }

    return result;
  }

  private findBestMapping(parsed: { country?: string; state?: string; city?: string }): LocationMapping {
    // Try exact match first
    let bestMatch = this.locationMappings.find(mapping => 
      mapping.country === parsed.country &&
      mapping.state === parsed.state &&
      mapping.city === parsed.city
    );

    if (bestMatch) return bestMatch;

    // Try country + state match
    bestMatch = this.locationMappings.find(mapping => 
      mapping.country === parsed.country &&
      mapping.state === parsed.state
    );

    if (bestMatch) return bestMatch;

    // Try country match
    bestMatch = this.locationMappings.find(mapping => 
      mapping.country === parsed.country
    );

    if (bestMatch) return bestMatch;

    // Default fallback
    return this.locationMappings[this.locationMappings.length - 1];
  }

  private calculateConfidence(
    parsed: { country?: string; state?: string; city?: string },
    mapping: LocationMapping
  ): number {
    let confidence = 0.3; // Base confidence

    if (parsed.country === mapping.country) confidence += 0.4;
    if (parsed.state === mapping.state) confidence += 0.2;
    if (parsed.city === mapping.city) confidence += 0.1;

    return Math.min(confidence, 1.0);
  }

  private generateSessionId(profileLocation: string): string {
    // Create a consistent session ID based on location for same-location grouping
    const hash = Array.from(profileLocation).reduce((hash, char) => {
      return ((hash << 5) - hash + char.charCodeAt(0)) & 0xffffffff;
    }, 0);
    
    return Math.abs(hash).toString(36).substring(0, 8);
  }
}

// Singleton instance
export const locationMappingService = new LocationMappingService();

// Export types
export type { LocationMapping, LinkedInLocationData };