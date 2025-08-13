/**
 * Unipile Direct API Service
 * Alternative approach using CORS proxy services
 */

const UNIPILE_API_KEY = 'TE3VJJ3-N3E63ND-MWXM462-RBPCWYQ';
const UNIPILE_BASE_URL = 'https://api6.unipile.com:13443/api/v1';

// Try multiple CORS proxy services as fallbacks
const CORS_PROXIES = [
  'https://cors-anywhere.herokuapp.com/',
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?',
];

export class UnipileDirectAPI {
  private currentProxyIndex = 0;

  /**
   * Make a request using CORS proxy
   */
  async requestWithProxy(path: string, options: RequestInit = {}) {
    const url = `${UNIPILE_BASE_URL}${path}`;
    
    // Try each CORS proxy
    for (let i = 0; i < CORS_PROXIES.length; i++) {
      const proxyIndex = (this.currentProxyIndex + i) % CORS_PROXIES.length;
      const proxy = CORS_PROXIES[proxyIndex];
      
      try {
        console.log(`[UnipileDirectAPI] Trying proxy ${proxyIndex}: ${proxy}`);
        
        const proxyUrl = proxy + encodeURIComponent(url);
        const response = await fetch(proxyUrl, {
          ...options,
          headers: {
            'Authorization': `Bearer ${UNIPILE_API_KEY}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            ...options.headers,
          },
        });

        if (response.ok || response.status < 500) {
          // Success or client error (not proxy issue)
          this.currentProxyIndex = proxyIndex; // Remember working proxy
          const data = await response.json();
          return {
            status: response.status,
            ok: response.ok,
            data,
          };
        }
      } catch (error) {
        console.warn(`[UnipileDirectAPI] Proxy ${proxyIndex} failed:`, error);
      }
    }

    // All proxies failed, try direct
    console.log('[UnipileDirectAPI] All proxies failed, trying direct...');
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${UNIPILE_API_KEY}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      const data = await response.json();
      return {
        status: response.status,
        ok: response.ok,
        data,
      };
    } catch (error: any) {
      throw new Error(`All connection methods failed: ${error.message}`);
    }
  }

  /**
   * Test connection with simple endpoint
   */
  async testConnection(accountId: string) {
    try {
      // Try a simple endpoint first
      const response = await this.requestWithProxy(`/users/${accountId}`);
      return response;
    } catch (error) {
      console.error('[UnipileDirectAPI] Test connection failed:', error);
      throw error;
    }
  }

  /**
   * Get connections
   */
  async getConnections(accountId: string, limit: number = 100) {
    return this.requestWithProxy(`/users/${accountId}/connections?limit=${limit}`);
  }

  /**
   * Get chats
   */
  async getChats(accountId: string, limit: number = 100) {
    return this.requestWithProxy(`/users/${accountId}/chats?limit=${limit}&provider=LINKEDIN`);
  }
}

// Export singleton
export const unipileDirectAPI = new UnipileDirectAPI();