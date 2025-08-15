/**
 * Unipile API Configuration
 * Centralized configuration for Unipile API settings
 */

export const UNIPILE_CONFIG = {
  // API Configuration
  API_KEY: import.meta.env.VITE_UNIPILE_API_KEY || 'aQzsD1+H.EJ60hU0LkPAxRaCU6nlvk3ypn9Rn9BUwqo9LGY24zZU=',
  BASE_URL: 'https://api6.unipile.com:13670/api/v1',
  
  // Sync Configuration
  DEFAULT_SYNC_INTERVAL: 5 * 60 * 1000, // 5 minutes
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 second
  
  // Rate Limiting
  RATE_LIMIT_DELAY: 100, // ms between requests
  BATCH_SIZE: 50, // items per batch
  
  // Endpoints
  ENDPOINTS: {
    ACCOUNTS: '/accounts',
    CHATS: '/chats',
    USERS_CHATS: '/users/{accountId}/chats',
    CONNECTIONS: '/accounts/{accountId}/connections',
    MESSAGES: '/users/{accountId}/messages',
    EVENTS: '/users/{accountId}/events'
  }
} as const;

/**
 * Get API key from environment or fallback
 */
export function getUnipileApiKey(): string {
  return UNIPILE_CONFIG.API_KEY;
}

/**
 * Get base URL for API requests
 */
export function getUnipileBaseUrl(): string {
  return UNIPILE_CONFIG.BASE_URL;
}

/**
 * Build endpoint URL with parameters
 */
export function buildEndpointUrl(endpoint: keyof typeof UNIPILE_CONFIG.ENDPOINTS, params?: Record<string, string>): string {
  let url = `${UNIPILE_CONFIG.BASE_URL}${UNIPILE_CONFIG.ENDPOINTS[endpoint]}`;
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url = url.replace(`{${key}}`, value);
    });
  }
  
  return url;
}

/**
 * Get default headers for API requests
 */
export function getUnipileHeaders(): Record<string, string> {
  return {
    'X-API-KEY': getUnipileApiKey(),
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
}