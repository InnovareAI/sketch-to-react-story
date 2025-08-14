/**
 * Unipile Email Service
 * Handles email account connections via Unipile API
 */

import { supabase } from '@/integrations/supabase/client';

export interface EmailAccountData {
  id: string;
  provider: 'GMAIL' | 'OUTLOOK' | 'OFFICE365' | 'EXCHANGE' | 'IMAP';
  email: string;
  name: string;
  status: 'active' | 'expired' | 'error';
  unipileAccountId?: string;
  metadata?: {
    folders?: string[];
    sync_status?: string;
    last_sync?: string;
    capabilities?: string[];
  };
  credentials?: any;
}

export interface EmailMessage {
  id: string;
  subject: string;
  from: { email: string; name?: string };
  to: Array<{ email: string; name?: string }>;
  cc?: Array<{ email: string; name?: string }>;
  bcc?: Array<{ email: string; name?: string }>;
  body: string;
  html?: string;
  date: string;
  thread_id?: string;
  labels?: string[];
  attachments?: Array<{
    filename: string;
    size: number;
    content_type: string;
  }>;
}

export class UnipileEmailService {
  private static instance: UnipileEmailService;
  private baseUrl: string;
  private apiKey: string | null = null;
  private dsn: string | null = null;

  private constructor() {
    // Use the same DSN configuration as UnipileService for LinkedIn
    const dsn = import.meta.env.VITE_UNIPILE_DSN || 'api6.unipile.com:13670';
    this.dsn = dsn;
    this.baseUrl = `https://${dsn}/api/v1`;
    this.apiKey = import.meta.env.VITE_UNIPILE_API_KEY || null;
    
    if (this.apiKey) {
      console.log('UnipileEmailService initialized with API key from Netlify environment');
    } else {
      console.log('UnipileEmailService running in demo mode - no API key found');
    }
  }

  public static getInstance(): UnipileEmailService {
    if (!UnipileEmailService.instance) {
      UnipileEmailService.instance = new UnipileEmailService();
    }
    return UnipileEmailService.instance;
  }

  /**
   * Get all connected email accounts
   */
  async getConnectedAccounts(): Promise<EmailAccountData[]> {
    // First check localStorage for any persisted accounts
    const persistedAccounts = localStorage.getItem('email_accounts');
    if (persistedAccounts) {
      try {
        return JSON.parse(persistedAccounts);
      } catch (error) {
        console.error('Error parsing persisted email accounts:', error);
      }
    }

    // If no Unipile API key, return empty array
    if (!this.apiKey) {
      console.log('No Unipile API key configured');
      return [];
    }

    try {
      const response = await fetch(`${this.baseUrl}/accounts`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch accounts: ${response.statusText}`);
      }

      const data = await response.json();
      const emailAccounts = data.accounts?.filter((account: any) => 
        ['GMAIL', 'OUTLOOK', 'OFFICE365', 'EXCHANGE', 'IMAP'].includes(account.provider)
      ) || [];

      return emailAccounts.map((account: any) => ({
        id: account.id,
        provider: account.provider,
        email: account.email,
        name: account.name || account.email.split('@')[0],
        status: account.status,
        unipileAccountId: account.id,
        metadata: account.metadata
      }));
    } catch (error) {
      console.error('Error fetching email accounts:', error);
      return [];
    }
  }

  /**
   * Initiate OAuth flow for email provider
   */
  async initiateEmailOAuth(
    provider: 'GMAIL' | 'OUTLOOK' | 'OFFICE365',
    redirectUri?: string,
    metadata?: Record<string, any>
  ): Promise<{ auth_url: string; account_id?: string } | null> {
    // If no API key, create demo account
    if (!this.apiKey) {
      console.log('No Unipile API key - creating demo email account');
      
      // For demo mode, create a mock account
      setTimeout(() => {
        const mockAccount: EmailAccountData = {
          id: `demo-email-${Date.now()}`,
          provider: provider,
          email: `demo@${provider.toLowerCase()}.com`,
          name: `Demo ${provider} Account`,
          status: 'active',
          metadata: {
            folders: ['Inbox', 'Sent', 'Drafts', 'Trash'],
            sync_status: 'synced',
            last_sync: new Date().toISOString(),
            capabilities: ['send', 'receive', 'folders', 'attachments']
          }
        };

        // Save to localStorage
        const existingAccounts = JSON.parse(localStorage.getItem('email_accounts') || '[]');
        existingAccounts.push(mockAccount);
        localStorage.setItem('email_accounts', JSON.stringify(existingAccounts));
      }, 2000);

      // Return a fake auth URL for demo
      return {
        auth_url: `https://demo.unipile.com/oauth/${provider.toLowerCase()}?demo=true`,
        account_id: 'demo-pending'
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/accounts/connect`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          provider: provider,
          redirect_uri: redirectUri || `${window.location.origin}/auth/email/callback`,
          metadata: metadata || {},
          dsn: this.dsn
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to initiate OAuth: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        auth_url: data.auth_url,
        account_id: data.account_id
      };
    } catch (error) {
      console.error('Error initiating email OAuth:', error);
      return null;
    }
  }

  /**
   * Connect IMAP/SMTP account with credentials
   */
  async connectIMAPAccount(credentials: {
    email: string;
    password: string;
    imap_host: string;
    imap_port: number;
    smtp_host: string;
    smtp_port: number;
    use_ssl?: boolean;
  }): Promise<EmailAccountData | null> {
    if (!this.apiKey) {
      // Create demo IMAP account
      const mockAccount: EmailAccountData = {
        id: `demo-imap-${Date.now()}`,
        provider: 'IMAP',
        email: credentials.email,
        name: credentials.email.split('@')[0],
        status: 'active',
        metadata: {
          folders: ['Inbox', 'Sent', 'Drafts'],
          sync_status: 'synced',
          last_sync: new Date().toISOString()
        }
      };

      // Save to localStorage
      const existingAccounts = JSON.parse(localStorage.getItem('email_accounts') || '[]');
      existingAccounts.push(mockAccount);
      localStorage.setItem('email_accounts', JSON.stringify(existingAccounts));

      return mockAccount;
    }

    try {
      const response = await fetch(`${this.baseUrl}/accounts/connect/imap`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...credentials,
          dsn: this.dsn
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to connect IMAP account: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        id: data.account_id,
        provider: 'IMAP',
        email: credentials.email,
        name: credentials.email.split('@')[0],
        status: 'active',
        unipileAccountId: data.account_id,
        metadata: data.metadata
      };
    } catch (error) {
      console.error('Error connecting IMAP account:', error);
      return null;
    }
  }

  /**
   * Disconnect email account
   */
  async disconnectAccount(accountId: string): Promise<boolean> {
    // Remove from localStorage
    const existingAccounts = JSON.parse(localStorage.getItem('email_accounts') || '[]');
    const updatedAccounts = existingAccounts.filter((acc: EmailAccountData) => acc.id !== accountId);
    localStorage.setItem('email_accounts', JSON.stringify(updatedAccounts));

    if (!this.apiKey) {
      return true;
    }

    try {
      const response = await fetch(`${this.baseUrl}/accounts/${accountId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Error disconnecting account:', error);
      return false;
    }
  }

  /**
   * Send email
   */
  async sendEmail(
    accountId: string,
    message: {
      to: string | string[];
      subject: string;
      body: string;
      html?: string;
      cc?: string | string[];
      bcc?: string | string[];
      attachments?: Array<{ filename: string; content: string; content_type: string }>;
    }
  ): Promise<boolean> {
    if (!this.apiKey) {
      console.log('Demo mode: Email would be sent:', message);
      return true;
    }

    try {
      const response = await fetch(`${this.baseUrl}/accounts/${accountId}/messages/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(message)
      });

      return response.ok;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  /**
   * Get inbox messages
   */
  async getInboxMessages(accountId: string, limit: number = 50): Promise<EmailMessage[]> {
    if (!this.apiKey) {
      // Return demo messages
      return [
        {
          id: 'demo-1',
          subject: 'Welcome to SAM AI',
          from: { email: 'welcome@samai.com', name: 'SAM AI Team' },
          to: [{ email: 'user@example.com' }],
          body: 'Welcome to your email integration!',
          date: new Date().toISOString(),
          labels: ['inbox']
        }
      ];
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/accounts/${accountId}/messages?folder=inbox&limit=${limit}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch messages: ${response.statusText}`);
      }

      const data = await response.json();
      return data.messages || [];
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  }

  /**
   * Sync account to Supabase
   */
  async syncAccountToSupabase(account: EmailAccountData): Promise<boolean> {
    try {
      // Get current workspace ID from auth context
      const workspaceId = this.getCurrentWorkspaceId();
      
      const { error } = await supabase
        .from('email_accounts')
        .upsert({
          id: account.id,
          workspace_id: workspaceId,
          account_name: account.name,
          email: account.email,
          provider: account.provider.toLowerCase(),
          status: account.status,
          purpose: 'both',
          warmup_status: 'warm',
          reputation: 100,
          metadata: account.metadata,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error syncing to Supabase:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error syncing email account:', error);
      return false;
    }
  }

  /**
   * Get current workspace ID from various sources
   */
  private getCurrentWorkspaceId(): string {
    // Check auth profile
    const authProfile = JSON.parse(localStorage.getItem('user_auth_profile') || '{}');
    if (authProfile.workspace_id) return authProfile.workspace_id;
    
    // Check bypass user data
    const bypassUser = JSON.parse(localStorage.getItem('bypass_user') || '{}');
    if (bypassUser.workspace_id) return bypassUser.workspace_id;
    
    // Check direct storage
    const workspaceId = localStorage.getItem('workspace_id');
    if (workspaceId) return workspaceId;
    
    // Generate dynamic fallback workspace ID
    const userEmail = localStorage.getItem('user_email') || 'default';
    const emailHash = userEmail.toLowerCase().replace(/[^a-z0-9]/g, '');
    return `workspace-${emailHash}-${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 8)}`;
  }
}

export const unipileEmailService = UnipileEmailService.getInstance();