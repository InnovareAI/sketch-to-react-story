/**
 * Unipile Proxy Service
 * Uses Supabase Edge Function to bypass CORS issues
 */

import { supabase } from '@/integrations/supabase/client';

export class UnipileProxyService {
  /**
   * Make a proxied request to Unipile API
   */
  async request(path: string, options: {
    method?: string;
    body?: any;
  } = {}) {
    try {
      console.log(`[UnipileProxy] Making ${options.method || 'GET'} request to: ${path}`);
      
      // Try Netlify function first
      try {
        const response = await fetch('/.netlify/functions/unipile-proxy', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            path,
            method: options.method || 'GET',
            body: options.body
          })
        });

        if (response.ok) {
          const data = await response.json();
          console.log('[UnipileProxy] Netlify function response:', data);
          return data;
        }
      } catch (netlifyError) {
        console.warn('[UnipileProxy] Netlify function failed, trying Supabase...', netlifyError);
      }
      
      // Fallback to Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('unipile-proxy', {
        body: {
          path,
          method: options.method || 'GET',
          body: options.body
        }
      });

      if (error) {
        console.error('[UnipileProxy] Edge function error:', error);
        throw error;
      }

      console.log('[UnipileProxy] Supabase response:', data);
      return data;
    } catch (error) {
      console.error('[UnipileProxy] Request failed:', error);
      throw error;
    }
  }

  /**
   * Get LinkedIn connections
   */
  async getConnections(accountId: string, limit: number = 100) {
    return this.request(`/users/${accountId}/connections?limit=${limit}`);
  }

  /**
   * Get LinkedIn chats/conversations
   */
  async getChats(accountId: string, limit: number = 100) {
    return this.request(`/users/${accountId}/chats?limit=${limit}&provider=LINKEDIN`);
  }

  /**
   * Get user account info
   */
  async getUserInfo(accountId: string) {
    return this.request(`/users/${accountId}`);
  }

  /**
   * Send a LinkedIn message
   */
  async sendMessage(accountId: string, chatId: string, message: string) {
    return this.request(`/users/${accountId}/chats/${chatId}/messages`, {
      method: 'POST',
      body: { text: message }
    });
  }
}

// Export singleton instance
export const unipileProxy = new UnipileProxyService();