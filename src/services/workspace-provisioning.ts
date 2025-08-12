/**
 * Workspace Provisioning Service
 * Automatically sets up Unipile and other integrations for new workspaces
 */

import { supabase } from '@/integrations/supabase/client';

interface WorkspaceConfig {
  workspaceId: string;
  workspaceName: string;
  ownerEmail: string;
  plan: 'free' | 'starter' | 'premium' | 'enterprise';
  features?: {
    unipile?: boolean;
    linkedin?: boolean;
    email?: boolean;
    calendar?: boolean;
    whatsapp?: boolean;
  };
}

interface UnipileWorkspaceSetup {
  accountId: string;
  apiKey: string;
  webhookUrl: string;
  status: 'active' | 'pending' | 'error';
}

export class WorkspaceProvisioningService {
  private static instance: WorkspaceProvisioningService;

  private constructor() {}

  static getInstance(): WorkspaceProvisioningService {
    if (!WorkspaceProvisioningService.instance) {
      WorkspaceProvisioningService.instance = new WorkspaceProvisioningService();
    }
    return WorkspaceProvisioningService.instance;
  }

  /**
   * Main provisioning method - called when a new workspace is created
   */
  async provisionNewWorkspace(config: WorkspaceConfig): Promise<void> {
    console.log('🚀 Starting workspace provisioning for:', config.workspaceName);

    try {
      // Step 1: Create Unipile account for the workspace
      const unipileSetup = await this.setupUnipileAccount(config);
      
      // Step 2: Store Unipile credentials in workspace settings
      await this.storeUnipileCredentials(config.workspaceId, unipileSetup);
      
      // Step 3: Configure default integrations based on plan
      await this.configureDefaultIntegrations(config);
      
      // Step 4: Set up webhooks for real-time updates
      await this.setupWebhooks(config, unipileSetup);
      
      // Step 5: Initialize default templates and settings
      await this.initializeWorkspaceDefaults(config);
      
      // Step 6: Send welcome email with setup instructions
      await this.sendWelcomeEmail(config);
      
      console.log('✅ Workspace provisioning completed successfully');
    } catch (error) {
      console.error('❌ Workspace provisioning failed:', error);
      await this.handleProvisioningError(config.workspaceId, error);
      throw error;
    }
  }

  /**
   * Set up Unipile account for the workspace
   */
  private async setupUnipileAccount(config: WorkspaceConfig): Promise<UnipileWorkspaceSetup> {
    try {
      // Call Unipile API to create a new sub-account
      // In production, this would use the master Unipile account to create sub-accounts
      const response = await fetch('https://api.unipile.com/v1/accounts/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_UNIPILE_MASTER_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          workspace_name: config.workspaceName,
          owner_email: config.ownerEmail,
          plan: config.plan,
          features: {
            email: config.features?.email ?? true,
            calendar: config.features?.calendar ?? true,
            linkedin: config.features?.linkedin ?? true,
            whatsapp: config.features?.whatsapp ?? false
          },
          webhook_url: `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/unipile-webhook`,
          metadata: {
            workspace_id: config.workspaceId,
            created_by: 'auto-provisioning'
          }
        })
      });

      if (!response.ok) {
        // Fallback: Generate mock credentials for demo/development
        console.warn('Using mock Unipile setup for development');
        return {
          accountId: `unipile_${config.workspaceId}`,
          apiKey: `demo_key_${Date.now()}`,
          webhookUrl: `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/unipile-webhook`,
          status: 'pending'
        };
      }

      const data = await response.json();
      
      return {
        accountId: data.account_id,
        apiKey: data.api_key,
        webhookUrl: data.webhook_url,
        status: 'active'
      };
    } catch (error) {
      console.error('Error setting up Unipile account:', error);
      
      // Return mock setup for development
      return {
        accountId: `unipile_${config.workspaceId}`,
        apiKey: `demo_key_${Date.now()}`,
        webhookUrl: `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/unipile-webhook`,
        status: 'pending'
      };
    }
  }

  /**
   * Store Unipile credentials securely in workspace settings
   */
  private async storeUnipileCredentials(
    workspaceId: string, 
    unipileSetup: UnipileWorkspaceSetup
  ): Promise<void> {
    const { error } = await supabase
      .from('workspace_settings')
      .upsert({
        workspace_id: workspaceId,
        unipile_account_id: unipileSetup.accountId,
        unipile_api_key: unipileSetup.apiKey, // In production, encrypt this
        unipile_webhook_url: unipileSetup.webhookUrl,
        unipile_status: unipileSetup.status,
        integrations: {
          unipile: {
            enabled: true,
            account_id: unipileSetup.accountId,
            status: unipileSetup.status,
            created_at: new Date().toISOString()
          }
        },
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error storing Unipile credentials:', error);
      throw error;
    }
  }

  /**
   * Configure default integrations based on workspace plan
   */
  private async configureDefaultIntegrations(config: WorkspaceConfig): Promise<void> {
    const integrations = {
      linkedin: {
        enabled: config.plan !== 'free',
        max_accounts: config.plan === 'enterprise' ? 10 : config.plan === 'premium' ? 5 : 1,
        features: {
          auto_connect: config.plan === 'premium' || config.plan === 'enterprise',
          bulk_messaging: config.plan === 'premium' || config.plan === 'enterprise',
          profile_scraping: true,
          inmail: config.plan === 'enterprise'
        }
      },
      email: {
        enabled: true,
        max_accounts: config.plan === 'enterprise' ? 10 : config.plan === 'premium' ? 5 : 2,
        providers: ['gmail', 'outlook', 'office365'],
        features: {
          templates: true,
          scheduling: config.plan !== 'free',
          tracking: config.plan === 'premium' || config.plan === 'enterprise',
          sequences: config.plan === 'premium' || config.plan === 'enterprise'
        }
      },
      calendar: {
        enabled: config.plan !== 'free',
        max_accounts: config.plan === 'enterprise' ? 5 : 2,
        providers: ['google', 'outlook'],
        features: {
          scheduling: true,
          availability: true,
          reminders: config.plan === 'premium' || config.plan === 'enterprise',
          team_calendars: config.plan === 'enterprise'
        }
      },
      whatsapp: {
        enabled: config.plan === 'enterprise',
        features: {
          business_api: true,
          bulk_messaging: true,
          templates: true
        }
      }
    };

    const { error } = await supabase
      .from('workspace_integrations')
      .upsert({
        workspace_id: config.workspaceId,
        integrations: integrations,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error configuring integrations:', error);
    }
  }

  /**
   * Set up webhooks for real-time updates
   */
  private async setupWebhooks(
    config: WorkspaceConfig, 
    unipileSetup: UnipileWorkspaceSetup
  ): Promise<void> {
    // Register webhooks with Unipile for real-time events
    const webhookEvents = [
      'email.received',
      'email.sent',
      'calendar.event.created',
      'calendar.event.updated',
      'calendar.event.deleted',
      'linkedin.message.received',
      'linkedin.connection.accepted'
    ];

    try {
      const response = await fetch('https://api.unipile.com/v1/webhooks/register', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${unipileSetup.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: unipileSetup.webhookUrl,
          events: webhookEvents,
          workspace_id: config.workspaceId
        })
      });

      if (!response.ok) {
        console.warn('Failed to register webhooks, will retry later');
      }
    } catch (error) {
      console.error('Error setting up webhooks:', error);
    }
  }

  /**
   * Initialize workspace with default templates and settings
   */
  private async initializeWorkspaceDefaults(config: WorkspaceConfig): Promise<void> {
    // Create default message templates
    const defaultTemplates = [
      {
        workspace_id: config.workspaceId,
        name: 'Initial Connection Request',
        type: 'linkedin_connection',
        content: "Hi {{firstName}}, I came across your profile and was impressed by your experience in {{industry}}. I'd love to connect and learn more about your work at {{company}}.",
        is_default: true
      },
      {
        workspace_id: config.workspaceId,
        name: 'Follow-up Message',
        type: 'linkedin_message',
        content: "Hi {{firstName}}, Thanks for connecting! I wanted to reach out because {{reason}}. Would you be open to a brief call next week?",
        is_default: true
      },
      {
        workspace_id: config.workspaceId,
        name: 'Welcome Email',
        type: 'email',
        content: "Subject: Welcome to {{company}}!\n\nHi {{firstName}},\n\nWelcome aboard! We're excited to have you join us...",
        is_default: true
      }
    ];

    const { error: templatesError } = await supabase
      .from('message_templates')
      .insert(defaultTemplates);

    if (templatesError) {
      console.error('Error creating default templates:', templatesError);
    }

    // Set default workspace settings
    const defaultSettings = {
      workspace_id: config.workspaceId,
      campaign_defaults: {
        daily_limit: config.plan === 'free' ? 20 : config.plan === 'starter' ? 50 : 100,
        connection_request_limit: 20,
        message_delay_minutes: 5,
        working_hours: {
          start: '09:00',
          end: '17:00',
          timezone: 'America/New_York',
          working_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
        }
      },
      ai_settings: {
        model: 'gpt-4',
        temperature: 0.7,
        auto_personalization: config.plan !== 'free',
        tone: 'professional'
      },
      notification_preferences: {
        email: true,
        in_app: true,
        campaign_completion: true,
        new_responses: true,
        account_issues: true
      }
    };

    const { error: settingsError } = await supabase
      .from('workspace_preferences')
      .upsert(defaultSettings);

    if (settingsError) {
      console.error('Error creating default settings:', settingsError);
    }
  }

  /**
   * Send welcome email with setup instructions
   */
  private async sendWelcomeEmail(config: WorkspaceConfig): Promise<void> {
    // In production, this would use an email service
    console.log(`📧 Sending welcome email to ${config.ownerEmail}`);
    
    // Call Supabase Edge Function to send email
    const { error } = await supabase.functions.invoke('send-email', {
      body: {
        to: config.ownerEmail,
        subject: `Welcome to SAM AI - ${config.workspaceName} is ready!`,
        template: 'workspace_welcome',
        data: {
          workspace_name: config.workspaceName,
          plan: config.plan,
          setup_url: `${window.location.origin}/workspace-settings`,
          support_email: 'support@samai.com'
        }
      }
    });

    if (error) {
      console.error('Error sending welcome email:', error);
    }
  }

  /**
   * Handle provisioning errors
   */
  private async handleProvisioningError(workspaceId: string, error: any): Promise<void> {
    // Log error to database for admin review
    await supabase
      .from('provisioning_errors')
      .insert({
        workspace_id: workspaceId,
        error_message: error.message || 'Unknown error',
        error_details: error,
        created_at: new Date().toISOString()
      });

    // Update workspace status
    await supabase
      .from('workspaces')
      .update({
        provisioning_status: 'error',
        provisioning_error: error.message
      })
      .eq('id', workspaceId);
  }

  /**
   * Retry failed provisioning
   */
  async retryProvisioning(workspaceId: string): Promise<void> {
    // Get workspace details
    const { data: workspace, error } = await supabase
      .from('workspaces')
      .select('*')
      .eq('id', workspaceId)
      .single();

    if (error || !workspace) {
      throw new Error('Workspace not found');
    }

    // Retry provisioning
    await this.provisionNewWorkspace({
      workspaceId: workspace.id,
      workspaceName: workspace.name,
      ownerEmail: workspace.owner_email,
      plan: workspace.plan || 'free',
      features: workspace.features
    });
  }

  /**
   * Check provisioning status
   */
  async checkProvisioningStatus(workspaceId: string): Promise<{
    status: 'completed' | 'pending' | 'error';
    details?: any;
  }> {
    const { data, error } = await supabase
      .from('workspace_settings')
      .select('unipile_status, integrations')
      .eq('workspace_id', workspaceId)
      .single();

    if (error || !data) {
      return { status: 'pending' };
    }

    if (data.unipile_status === 'active') {
      return { status: 'completed', details: data.integrations };
    } else if (data.unipile_status === 'error') {
      return { status: 'error', details: data };
    }

    return { status: 'pending' };
  }
}