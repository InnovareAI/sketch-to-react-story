/**
 * Secure API Key Storage Service
 * 
 * SECURITY: API keys are stored server-side in Supabase
 * Frontend only receives temporary tokens for API access
 */

import { supabase } from '@/integrations/supabase/client';

interface SecureApiConfig {
  provider: string;
  model?: string;
  baseUrl?: string;
}

interface ApiKeyResponse {
  success: boolean;
  message?: string;
  hasKey?: boolean;
}

class SecureApiStorageService {
  private static instance: SecureApiStorageService;

  private constructor() {}

  static getInstance(): SecureApiStorageService {
    if (!SecureApiStorageService.instance) {
      SecureApiStorageService.instance = new SecureApiStorageService();
    }
    return SecureApiStorageService.instance;
  }

  /**
   * Save API configuration securely (keys stored server-side)
   */
  async saveApiConfiguration(config: SecureApiConfig & { apiKey: string }): Promise<ApiKeyResponse> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, message: 'User not authenticated' };
      }

      // Send to secure edge function that encrypts and stores the key
      const { data, error } = await supabase.functions.invoke('store-api-key', {
        body: {
          provider: config.provider,
          apiKey: config.apiKey,
          model: config.model,
          baseUrl: config.baseUrl
        }
      });

      if (error) {
        console.error('Error storing API key:', error);
        return { success: false, message: 'Failed to store API key securely' };
      }

      // Store non-sensitive config in localStorage
      const publicConfig = {
        provider: config.provider,
        model: config.model,
        baseUrl: config.baseUrl,
        autoSelectModel: true
      };
      
      localStorage.setItem('llm_config_public', JSON.stringify(publicConfig));

      return { 
        success: true, 
        message: 'API key stored securely on server',
        hasKey: true 
      };
    } catch (error) {
      console.error('Error saving API configuration:', error);
      return { success: false, message: 'Failed to save configuration' };
    }
  }

  /**
   * Get API configuration status (does not return actual keys)
   */
  async getApiConfigurationStatus(provider: string): Promise<ApiKeyResponse> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, message: 'User not authenticated' };
      }

      // Check if user has stored key for this provider
      const { data, error } = await supabase.functions.invoke('check-api-key', {
        body: { provider }
      });

      if (error) {
        console.error('Error checking API key:', error);
        return { success: false, message: 'Failed to check API key status' };
      }

      return {
        success: true,
        hasKey: data?.hasKey || false
      };
    } catch (error) {
      console.error('Error getting API configuration:', error);
      return { success: false, message: 'Failed to get configuration' };
    }
  }

  /**
   * Get public configuration (non-sensitive data only)
   */
  getPublicConfiguration(): SecureApiConfig | null {
    const configStr = localStorage.getItem('llm_config_public');
    if (!configStr) return null;
    
    try {
      return JSON.parse(configStr);
    } catch {
      return null;
    }
  }

  /**
   * Make API call using stored credentials (server-side proxy)
   */
  async makeSecureApiCall(provider: string, payload: any): Promise<any> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Call edge function that uses stored API key
      const { data, error } = await supabase.functions.invoke('llm-proxy', {
        body: {
          provider,
          payload
        }
      });

      if (error) {
        console.error('API call error:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error making secure API call:', error);
      throw error;
    }
  }

  /**
   * Test API connection using stored credentials
   */
  async testConnection(provider: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.makeSecureApiCall(provider, {
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Say "Connection successful!" in 5 words or less.' }
        ],
        maxTokens: 50
      });

      if (response?.content) {
        return { 
          success: true, 
          message: `Success! Response: "${response.content}"` 
        };
      }

      return { 
        success: false, 
        message: 'No response received' 
      };
    } catch (error: any) {
      return { 
        success: false, 
        message: `Connection failed: ${error.message}` 
      };
    }
  }

  /**
   * Remove API configuration for a provider
   */
  async removeApiConfiguration(provider: string): Promise<ApiKeyResponse> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, message: 'User not authenticated' };
      }

      // Remove from server
      const { error } = await supabase.functions.invoke('remove-api-key', {
        body: { provider }
      });

      if (error) {
        console.error('Error removing API key:', error);
        return { success: false, message: 'Failed to remove API key' };
      }

      // Update local public config
      const publicConfig = this.getPublicConfiguration();
      if (publicConfig && publicConfig.provider === provider) {
        localStorage.removeItem('llm_config_public');
      }

      return { 
        success: true, 
        message: 'API key removed successfully',
        hasKey: false 
      };
    } catch (error) {
      console.error('Error removing API configuration:', error);
      return { success: false, message: 'Failed to remove configuration' };
    }
  }
}

export const secureApiStorage = SecureApiStorageService.getInstance();

export type { SecureApiConfig, ApiKeyResponse };