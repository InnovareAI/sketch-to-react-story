/**
 * LinkedIn OAuth Flow with Unipile
 * Handles the complete OAuth process for LinkedIn integration
 */

import { supabase } from '@/integrations/supabase/client';

interface LinkedInOAuthConfig {
  workspaceId: string;
  redirectUri?: string;
  scopes?: string[];
}

interface UnipileOAuthResponse {
  auth_url: string;
  state: string;
  account_id?: string;
}

export class LinkedInOAuthService {
  private readonly UNIPILE_BASE_URL = import.meta.env.VITE_UNIPILE_BASE_URL || 'https://api6.unipile.com';
  private readonly UNIPILE_API_KEY = import.meta.env.VITE_UNIPILE_API_KEY;
  
  /**
   * How LinkedIn OAuth Works with Automated Provisioning:
   * 
   * 1. WORKSPACE CREATION:
   *    - When a new workspace is created, our Edge Function automatically:
   *      a) Creates a Unipile sub-account for the workspace
   *      b) Generates unique API keys for that workspace
   *      c) Stores credentials in workspace_unipile_config table
   * 
   * 2. LINKEDIN OAUTH INITIATION:
   *    - User clicks "Connect LinkedIn" in the UI
   *    - System retrieves workspace's Unipile credentials
   *    - Generates OAuth URL via Unipile API
   *    - Opens LinkedIn authorization page
   * 
   * 3. USER AUTHORIZATION:
   *    - User logs into LinkedIn
   *    - Grants permissions to access profile, connections, messaging
   *    - LinkedIn redirects back to Unipile callback URL
   * 
   * 4. TOKEN EXCHANGE:
   *    - Unipile handles the OAuth callback
   *    - Exchanges authorization code for access tokens
   *    - Stores encrypted tokens in Unipile's secure vault
   * 
   * 5. ACCOUNT ACTIVATION:
   *    - Unipile creates a LinkedIn account object
   *    - Returns account_id to our system
   *    - We store account_id in workspace_linkedin_accounts table
   * 
   * 6. AUTOMATED FEATURES:
   *    - Profile scraping via Bright Data proxies
   *    - Message sending through Unipile API
   *    - Connection requests and InMail
   *    - Activity monitoring and analytics
   */

  /**
   * Step 1: Get workspace-specific Unipile credentials
   */
  async getWorkspaceCredentials(workspaceId: string) {
    const { data, error } = await supabase
      .from('workspace_unipile_config')
      .select('api_key, api_secret, account_id')
      .eq('workspace_id', workspaceId)
      .single();

    if (error || !data) {
      throw new Error('Workspace not provisioned. Please wait for automatic setup to complete.');
    }

    return data;
  }

  /**
   * Step 2: Initiate LinkedIn OAuth flow
   */
  async initiateLinkedInOAuth(config: LinkedInOAuthConfig): Promise<UnipileOAuthResponse> {
    try {
      // Get workspace's Unipile credentials
      const credentials = await this.getWorkspaceCredentials(config.workspaceId);
      
      // Default OAuth scopes for LinkedIn
      const scopes = config.scopes || [
        'r_liteprofile',
        'r_emailaddress', 
        'w_member_social',
        'r_basicprofile',
        'r_organization_social'
      ];

      // Build OAuth initiation request
      const response = await fetch(`${this.UNIPILE_BASE_URL}/v1/accounts/connect`, {
        method: 'POST',
        headers: {
          'X-API-KEY': credentials.api_key,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: 'LINKEDIN',
          type: 'OAUTH',
          scopes: scopes.join(','),
          redirect_uri: config.redirectUri || `${window.location.origin}/settings/linkedin/callback`,
          workspace_id: config.workspaceId,
          metadata: {
            workspace_id: config.workspaceId,
            initiated_at: new Date().toISOString()
          }
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to initiate LinkedIn OAuth');
      }

      const result = await response.json();
      
      // Store OAuth state for verification
      await this.storeOAuthState(config.workspaceId, result.state);
      
      return {
        auth_url: result.auth_url,
        state: result.state,
        account_id: result.account_id
      };
    } catch (error) {
      console.error('LinkedIn OAuth initiation error:', error);
      throw error;
    }
  }

  /**
   * Step 3: Handle OAuth callback
   */
  async handleOAuthCallback(code: string, state: string, workspaceId: string) {
    try {
      // Verify OAuth state
      const isValidState = await this.verifyOAuthState(workspaceId, state);
      if (!isValidState) {
        throw new Error('Invalid OAuth state. Possible CSRF attack.');
      }

      // Get workspace credentials
      const credentials = await this.getWorkspaceCredentials(workspaceId);

      // Exchange code for account
      const response = await fetch(`${this.UNIPILE_BASE_URL}/v1/accounts/callback`, {
        method: 'POST',
        headers: {
          'X-API-KEY': credentials.api_key,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          state,
          provider: 'LINKEDIN'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to complete OAuth flow');
      }

      const account = await response.json();
      
      // Store LinkedIn account in database
      await this.storeLinkedInAccount(workspaceId, account);
      
      return account;
    } catch (error) {
      console.error('OAuth callback error:', error);
      throw error;
    }
  }

  /**
   * Step 4: Check if LinkedIn is already connected
   */
  async checkLinkedInConnection(workspaceId: string): Promise<boolean> {
    const { data } = await supabase
      .from('workspace_linkedin_accounts')
      .select('id, status')
      .eq('workspace_id', workspaceId)
      .eq('status', 'active')
      .single();

    return !!data;
  }

  /**
   * Step 5: Get connected LinkedIn accounts
   */
  async getConnectedAccounts(workspaceId: string) {
    const credentials = await this.getWorkspaceCredentials(workspaceId);
    
    const response = await fetch(`${this.UNIPILE_BASE_URL}/v1/accounts`, {
      method: 'GET',
      headers: {
        'X-API-KEY': credentials.api_key,
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch LinkedIn accounts');
    }

    const accounts = await response.json();
    
    // Filter for LinkedIn accounts only
    return accounts.items.filter((acc: any) => acc.provider === 'LINKEDIN');
  }

  /**
   * Step 6: Disconnect LinkedIn account
   */
  async disconnectLinkedIn(workspaceId: string, accountId: string) {
    const credentials = await this.getWorkspaceCredentials(workspaceId);
    
    const response = await fetch(`${this.UNIPILE_BASE_URL}/v1/accounts/${accountId}`, {
      method: 'DELETE',
      headers: {
        'X-API-KEY': credentials.api_key,
      }
    });

    if (!response.ok) {
      throw new Error('Failed to disconnect LinkedIn account');
    }

    // Update database
    await supabase
      .from('workspace_linkedin_accounts')
      .update({ status: 'disconnected', disconnected_at: new Date().toISOString() })
      .eq('workspace_id', workspaceId)
      .eq('account_id', accountId);

    return true;
  }

  /**
   * Helper: Store OAuth state for CSRF protection
   */
  private async storeOAuthState(workspaceId: string, state: string) {
    await supabase
      .from('oauth_states')
      .insert({
        workspace_id: workspaceId,
        state,
        provider: 'linkedin',
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 600000).toISOString() // 10 minutes
      });
  }

  /**
   * Helper: Verify OAuth state
   */
  private async verifyOAuthState(workspaceId: string, state: string): Promise<boolean> {
    const { data } = await supabase
      .from('oauth_states')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('state', state)
      .eq('provider', 'linkedin')
      .gt('expires_at', new Date().toISOString())
      .single();

    if (data) {
      // Delete used state
      await supabase
        .from('oauth_states')
        .delete()
        .eq('id', data.id);
      
      return true;
    }

    return false;
  }

  /**
   * Helper: Store LinkedIn account in database
   */
  private async storeLinkedInAccount(workspaceId: string, account: any) {
    await supabase
      .from('workspace_linkedin_accounts')
      .upsert({
        workspace_id: workspaceId,
        account_id: account.id,
        name: account.name,
        email: account.email,
        profile_url: account.profile?.url,
        profile_data: account.profile,
        status: 'active',
        connected_at: new Date().toISOString(),
        metadata: {
          provider: 'LINKEDIN',
          permissions: account.permissions,
          limits: account.limits
        }
      });
  }

  /**
   * AUTOMATED PROVISIONING FLOW EXPLANATION:
   * 
   * The beauty of our system is that LinkedIn OAuth works seamlessly with 
   * automated provisioning:
   * 
   * 1. NO MANUAL API KEY SETUP:
   *    - Workspace creation triggers Edge Function
   *    - Edge Function creates Unipile account automatically
   *    - API keys are generated and stored securely
   * 
   * 2. NO MANUAL PROXY CONFIGURATION:
   *    - Bright Data account created automatically
   *    - Residential IPs assigned to workspace
   *    - Geo-targeting configured based on plan
   * 
   * 3. INSTANT LINKEDIN ACCESS:
   *    - User just clicks "Connect LinkedIn"
   *    - OAuth flow uses pre-provisioned credentials
   *    - No waiting, no manual configuration
   * 
   * 4. PLAN-BASED FEATURES:
   *    - Free: 100 connections/month
   *    - Starter: 500 connections/month
   *    - Premium: 2000 connections/month
   *    - Enterprise: Unlimited
   * 
   * 5. SECURITY:
   *    - Each workspace has isolated credentials
   *    - Tokens encrypted and stored in Unipile vault
   *    - CSRF protection with state verification
   *    - Automatic token refresh
   */
}

// Export singleton instance
export const linkedInOAuthService = new LinkedInOAuthService();