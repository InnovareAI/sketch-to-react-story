/**
 * Direct LinkedIn API Integration
 * Uses LinkedIn's official API without third-party services
 */

import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export class LinkedInDirectAPI {
  private static instance: LinkedInDirectAPI;
  private accessToken: string | null = null;
  
  private constructor() {
    // Check for stored LinkedIn token
    this.accessToken = localStorage.getItem('linkedin_access_token');
  }
  
  static getInstance(): LinkedInDirectAPI {
    if (!LinkedInDirectAPI.instance) {
      LinkedInDirectAPI.instance = new LinkedInDirectAPI();
    }
    return LinkedInDirectAPI.instance;
  }

  /**
   * Initialize LinkedIn OAuth flow
   */
  async initiateOAuth(): Promise<void> {
    const clientId = import.meta.env.VITE_LINKEDIN_CLIENT_ID;
    const redirectUri = `${window.location.origin}/auth/linkedin/callback`;
    
    if (!clientId) {
      toast.error('LinkedIn Client ID not configured. Please add VITE_LINKEDIN_CLIENT_ID to environment variables.');
      return;
    }
    
    // LinkedIn OAuth 2.0 URL
    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?` +
      `response_type=code&` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${encodeURIComponent('r_liteprofile r_emailaddress w_member_social r_basicprofile')}&` +
      `state=${crypto.randomUUID()}`;
    
    // Open OAuth window
    window.location.href = authUrl;
  }

  /**
   * Handle OAuth callback and exchange code for token
   */
  async handleOAuthCallback(code: string): Promise<boolean> {
    try {
      const clientId = import.meta.env.VITE_LINKEDIN_CLIENT_ID;
      const clientSecret = import.meta.env.VITE_LINKEDIN_CLIENT_SECRET;
      const redirectUri = `${window.location.origin}/auth/linkedin/callback`;
      
      if (!clientId || !clientSecret) {
        throw new Error('LinkedIn credentials not configured');
      }
      
      // Exchange code for access token
      const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: redirectUri,
          client_id: clientId,
          client_secret: clientSecret
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to exchange code for token');
      }
      
      const data = await response.json();
      this.accessToken = data.access_token;
      
      // Store token
      localStorage.setItem('linkedin_access_token', data.access_token);
      localStorage.setItem('linkedin_token_expires', String(Date.now() + data.expires_in * 1000));
      
      return true;
    } catch (error) {
      console.error('OAuth callback error:', error);
      toast.error('Failed to connect LinkedIn account');
      return false;
    }
  }

  /**
   * Fetch user's LinkedIn messages/conversations
   * Note: LinkedIn API has limitations on message access
   */
  async fetchMessages(): Promise<any[]> {
    if (!this.accessToken) {
      toast.error('Please connect your LinkedIn account first');
      return [];
    }
    
    try {
      // LinkedIn's messaging API is restricted to partners
      // We'll use the available endpoints to get connection updates
      const response = await fetch('https://api.linkedin.com/v2/me', {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch LinkedIn data');
      }
      
      const profile = await response.json();
      
      // Since direct message access is restricted, we'll fetch connections
      // and recent activity instead
      const connections = await this.fetchConnections();
      
      // Transform connections into message-like format
      const messages = connections.map((connection: any, index: number) => ({
        id: `linkedin_${index}`,
        from: connection.firstName + ' ' + connection.lastName,
        company: connection.headline || '',
        message: `Connected with ${connection.firstName}`,
        timestamp: new Date().toISOString(),
        type: 'connection'
      }));
      
      return messages;
    } catch (error) {
      console.error('Error fetching LinkedIn messages:', error);
      toast.error('Unable to fetch LinkedIn messages. API access may be restricted.');
      return [];
    }
  }

  /**
   * Fetch user's LinkedIn connections
   */
  async fetchConnections(): Promise<any[]> {
    if (!this.accessToken) {
      return [];
    }
    
    try {
      // Fetch connections (this endpoint may require special permissions)
      const response = await fetch('https://api.linkedin.com/v2/connections', {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0'
        }
      });
      
      if (!response.ok) {
        // Fallback: return empty array if connections API is restricted
        console.log('Connections API restricted, returning empty array');
        return [];
      }
      
      const data = await response.json();
      return data.elements || [];
    } catch (error) {
      console.error('Error fetching connections:', error);
      return [];
    }
  }

  /**
   * Sync LinkedIn data to database
   */
  async syncToDatabase(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please sign in to sync data');
        return;
      }
      
      toast.info('Syncing LinkedIn data...');
      
      // Fetch messages/connections
      const messages = await this.fetchMessages();
      
      if (messages.length === 0) {
        toast.warning('No LinkedIn data to sync. LinkedIn API access may be limited.');
        return;
      }
      
      // Store in database
      for (const msg of messages) {
        // Create conversation
        const { data: conversation } = await supabase
          .from('conversations')
          .upsert({
            user_id: user.id,
            platform: 'linkedin',
            platform_conversation_id: msg.id,
            participant_name: msg.from,
            participant_company: msg.company,
            last_message_at: msg.timestamp,
            status: 'active'
          })
          .select()
          .single();
        
        if (conversation) {
          // Create message
          await supabase
            .from('conversation_messages')
            .insert({
              conversation_id: conversation.id,
              role: 'assistant',
              content: msg.message,
              metadata: {
                type: msg.type,
                sender_name: msg.from
              }
            });
        }
      }
      
      toast.success('LinkedIn data synced successfully');
    } catch (error) {
      console.error('Sync error:', error);
      toast.error('Failed to sync LinkedIn data');
    }
  }

  /**
   * Check if user is authenticated with LinkedIn
   */
  isAuthenticated(): boolean {
    if (!this.accessToken) return false;
    
    const expires = localStorage.getItem('linkedin_token_expires');
    if (expires && Date.now() > parseInt(expires)) {
      // Token expired
      this.logout();
      return false;
    }
    
    return true;
  }

  /**
   * Logout and clear tokens
   */
  logout(): void {
    this.accessToken = null;
    localStorage.removeItem('linkedin_access_token');
    localStorage.removeItem('linkedin_token_expires');
  }
}

export const linkedInDirectAPI = LinkedInDirectAPI.getInstance();