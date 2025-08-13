/**
 * Workspace Unipile Service
 * Centralized management of Unipile credentials shared across all features
 * Ensures consistent use of same account and dedicated IP
 */

import { supabase } from '@/integrations/supabase/client';

interface WorkspaceUnipileConfig {
  account_id: string;
  api_key: string;
  dedicated_ip?: string;
  dsn: string;
  linkedin_connected: boolean;
}

class WorkspaceUnipileService {
  private static instance: WorkspaceUnipileService;
  private config: WorkspaceUnipileConfig | null = null;
  private workspaceId: string | null = null;

  private constructor() {}

  static getInstance(): WorkspaceUnipileService {
    if (!WorkspaceUnipileService.instance) {
      WorkspaceUnipileService.instance = new WorkspaceUnipileService();
    }
    return WorkspaceUnipileService.instance;
  }

  /**
   * Initialize with workspace ID and load Unipile config
   */
  async initialize(workspaceId?: string): Promise<WorkspaceUnipileConfig> {
    // Use provided workspace ID or get from localStorage
    this.workspaceId = workspaceId || this.getCurrentWorkspaceId();
    
    if (!this.workspaceId) {
      throw new Error('No workspace ID available');
    }

    // Load config from database
    const { data, error } = await supabase
      .rpc('get_workspace_unipile_credentials', {
        p_workspace_id: this.workspaceId
      });

    if (error) throw error;
    if (!data || data.length === 0) {
      throw new Error('No Unipile credentials found for workspace');
    }

    this.config = data[0];
    
    // Store in localStorage for quick access
    localStorage.setItem('workspace_unipile_config', JSON.stringify(this.config));
    
    return this.config;
  }

  /**
   * Get current workspace ID from various sources
   */
  private getCurrentWorkspaceId(): string {
    // Check auth profile
    const authProfile = JSON.parse(localStorage.getItem('user_auth_profile') || '{}');
    if (authProfile.workspace_id) return authProfile.workspace_id;
    
    // Check direct storage
    const workspaceId = localStorage.getItem('workspace_id');
    if (workspaceId) return workspaceId;
    
    // Dev mode fallback
    return 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
  }

  /**
   * Get Unipile configuration for current workspace
   */
  async getConfig(): Promise<WorkspaceUnipileConfig> {
    if (this.config) return this.config;
    
    // Try to load from localStorage first
    const cached = localStorage.getItem('workspace_unipile_config');
    if (cached) {
      this.config = JSON.parse(cached);
      return this.config!;
    }
    
    // Load from database
    return this.initialize();
  }

  /**
   * Get Unipile API headers with proper authentication
   */
  async getApiHeaders(): Promise<Record<string, string>> {
    const config = await this.getConfig();
    
    return {
      'Authorization': `Bearer ${config.api_key}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Workspace-ID': this.workspaceId || '',
      'X-Account-ID': config.account_id
    };
  }

  /**
   * Get Unipile API base URL with dedicated IP if configured
   */
  async getApiUrl(): Promise<string> {
    const config = await this.getConfig();
    
    // Use dedicated IP if available, otherwise use DSN
    const host = config.dedicated_ip || config.dsn;
    
    // Ensure proper protocol
    if (!host.startsWith('http')) {
      return `https://${host}/api/v1`;
    }
    
    return `${host}/api/v1`;
  }

  /**
   * Make authenticated Unipile API request
   */
  async request(
    path: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const [headers, baseUrl] = await Promise.all([
      this.getApiHeaders(),
      this.getApiUrl()
    ]);

    const url = `${baseUrl}${path}`;
    
    return fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers
      }
    });
  }

  /**
   * Connect LinkedIn account (one-time setup during onboarding)
   */
  async connectLinkedIn(): Promise<{ auth_url?: string; account_id?: string }> {
    const response = await this.request('/accounts/connect', {
      method: 'POST',
      body: JSON.stringify({
        provider: 'LINKEDIN',
        scopes: ['profile', 'contacts', 'messages'],
        redirect_uri: `${window.location.origin}/onboarding/callback`
      })
    });

    if (!response.ok) {
      throw new Error('Failed to initiate LinkedIn connection');
    }

    const data = await response.json();
    
    // If successful, update workspace
    if (data.account_id) {
      await this.updateLinkedInConnection(data.account_id);
    }
    
    return data;
  }

  /**
   * Update workspace with LinkedIn connection
   */
  private async updateLinkedInConnection(accountId: string) {
    if (!this.workspaceId) return;

    const { error } = await supabase
      .from('workspaces')
      .update({
        unipile_account_id: accountId,
        integrations: {
          linkedin: {
            connected: true,
            account_id: accountId,
            connected_at: new Date().toISOString()
          }
        }
      })
      .eq('id', this.workspaceId);

    if (error) {
      console.error('Error updating LinkedIn connection:', error);
    } else {
      // Update local config
      if (this.config) {
        this.config.account_id = accountId;
        this.config.linkedin_connected = true;
      }
    }
  }

  /**
   * Sync LinkedIn contacts using shared credentials
   */
  async syncContacts(limit: number = 100): Promise<any> {
    const config = await this.getConfig();
    
    if (!config.linkedin_connected) {
      throw new Error('LinkedIn not connected. Please complete onboarding.');
    }

    const response = await this.request(`/users/${config.account_id}/contacts?limit=${limit}`);
    
    if (!response.ok) {
      throw new Error('Failed to sync contacts');
    }

    const data = await response.json();
    const contacts = data.items || [];
    
    // Store contacts in database with shared account_id
    for (const contact of contacts) {
      try {
        await supabase.from('contacts').upsert({
          workspace_id: this.workspaceId,
          account_id: config.account_id, // Always use workspace's account
          email: contact.email || `${contact.id}@linkedin.com`,
          first_name: contact.first_name || contact.name?.split(' ')[0],
          last_name: contact.last_name || contact.name?.split(' ').slice(1).join(' '),
          title: contact.headline || contact.title,
          linkedin_url: contact.linkedin_url || contact.profile_url,
          metadata: contact
        }, { 
          onConflict: 'workspace_id,email' 
        });
      } catch (err) {
        console.error('Error storing contact:', err);
      }
    }
    
    return { contactsSynced: contacts.length };
  }

  /**
   * Send LinkedIn message using shared credentials
   */
  async sendMessage(
    recipientId: string,
    message: string
  ): Promise<any> {
    const config = await this.getConfig();
    
    if (!config.linkedin_connected) {
      throw new Error('LinkedIn not connected. Please complete onboarding.');
    }

    const response = await this.request(`/users/${config.account_id}/messages`, {
      method: 'POST',
      body: JSON.stringify({
        recipient_id: recipientId,
        body: message
      })
    });

    if (!response.ok) {
      throw new Error('Failed to send message');
    }

    return response.json();
  }

  /**
   * Check if LinkedIn is connected for workspace
   */
  async isLinkedInConnected(): Promise<boolean> {
    try {
      const config = await this.getConfig();
      return config.linkedin_connected;
    } catch {
      return false;
    }
  }

  /**
   * Clear cached configuration
   */
  clearCache() {
    this.config = null;
    localStorage.removeItem('workspace_unipile_config');
  }
}

// Export singleton instance
export const workspaceUnipile = WorkspaceUnipileService.getInstance();