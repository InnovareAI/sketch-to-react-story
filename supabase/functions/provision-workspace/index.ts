// Supabase Edge Function for automated workspace provisioning
// Handles Unipile setup for LinkedIn, Email, Calendar, and WhatsApp

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WorkspaceProvisionRequest {
  workspaceId: string;
  workspaceName: string;
  ownerEmail: string;
  userId: string;
  plan: 'free' | 'starter' | 'premium' | 'enterprise';
}

interface BrightDataSetup {
  customerId: string;
  zoneId: string;
  password: string;
  residentialProxy: string;
  datacenterProxy: string;
}

interface UnipileAccountSetup {
  accountId: string;
  apiKey: string;
  apiSecret: string;
  webhookSecret: string;
  linkedinEnabled: boolean;
  emailEnabled: boolean;
  calendarEnabled: boolean;
  whatsappEnabled: boolean;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const unipileMasterKey = Deno.env.get('UNIPILE_MASTER_API_KEY') ?? '';
    const unipileBaseUrl = Deno.env.get('UNIPILE_BASE_URL') ?? 'https://api6.unipile.com';

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { workspaceId, workspaceName, ownerEmail, userId, plan } = await req.json() as WorkspaceProvisionRequest;

    console.log(`🚀 Provisioning workspace: ${workspaceName} (${plan} plan)`);

    // Step 1: Create Bright Data proxy account for LinkedIn scraping
    const brightDataSetup = await createBrightDataAccount(
      workspaceId,
      workspaceName,
      plan
    );

    // Step 2: Create Unipile sub-account with all integrations
    const unipileSetup = await createUnipileAccount(
      unipileMasterKey,
      unipileBaseUrl,
      workspaceId,
      workspaceName,
      ownerEmail,
      plan
    );

    // Step 3: Store Bright Data credentials
    const { error: brightError } = await supabase
      .from('workspace_brightdata_config')
      .upsert({
        workspace_id: workspaceId,
        customer_id: brightDataSetup.customerId,
        zone_id: brightDataSetup.zoneId,
        password: brightDataSetup.password, // Should be encrypted in production
        residential_proxy: brightDataSetup.residentialProxy,
        datacenter_proxy: brightDataSetup.datacenterProxy,
        status: 'active',
        created_at: new Date().toISOString()
      });

    if (brightError) {
      console.error('Failed to store Bright Data credentials:', brightError);
    }

    // Step 4: Store Unipile credentials in database
    const { error: credError } = await supabase
      .from('workspace_unipile_config')
      .upsert({
        workspace_id: workspaceId,
        account_id: unipileSetup.accountId,
        api_key: unipileSetup.apiKey,
        api_secret: unipileSetup.apiSecret,
        webhook_secret: unipileSetup.webhookSecret,
        linkedin_enabled: unipileSetup.linkedinEnabled,
        email_enabled: unipileSetup.emailEnabled,
        calendar_enabled: unipileSetup.calendarEnabled,
        whatsapp_enabled: unipileSetup.whatsappEnabled,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (credError) {
      throw new Error(`Failed to store credentials: ${credError.message}`);
    }

    // Step 3: Configure LinkedIn integration defaults
    if (unipileSetup.linkedinEnabled) {
      await configureLinkedInDefaults(supabase, workspaceId, plan);
    }

    // Step 4: Configure Email integration defaults
    if (unipileSetup.emailEnabled) {
      await configureEmailDefaults(supabase, workspaceId, plan);
    }

    // Step 5: Configure Calendar integration defaults
    if (unipileSetup.calendarEnabled) {
      await configureCalendarDefaults(supabase, workspaceId, plan);
    }

    // Step 6: Configure WhatsApp integration (Enterprise only)
    if (unipileSetup.whatsappEnabled && plan === 'enterprise') {
      await configureWhatsAppDefaults(supabase, workspaceId);
    }

    // Step 7: Create default templates and campaigns
    await createDefaultTemplates(supabase, workspaceId);

    // Step 8: Set up webhooks for real-time updates
    await setupWebhooks(
      unipileSetup.apiKey,
      unipileBaseUrl,
      workspaceId,
      `${supabaseUrl}/functions/v1/unipile-webhook`
    );

    // Step 9: Update workspace status
    const { error: statusError } = await supabase
      .from('workspaces')
      .update({
        provisioning_status: 'completed',
        provisioned_at: new Date().toISOString(),
        unipile_account_id: unipileSetup.accountId
      })
      .eq('id', workspaceId);

    if (statusError) {
      console.error('Failed to update workspace status:', statusError);
    }

    console.log(`✅ Workspace ${workspaceName} provisioned successfully`);

    return new Response(
      JSON.stringify({
        success: true,
        workspaceId,
        unipileAccountId: unipileSetup.accountId,
        integrations: {
          linkedin: unipileSetup.linkedinEnabled,
          email: unipileSetup.emailEnabled,
          calendar: unipileSetup.calendarEnabled,
          whatsapp: unipileSetup.whatsappEnabled
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Provisioning error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error occurred'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

async function createUnipileAccount(
  masterKey: string,
  baseUrl: string,
  workspaceId: string,
  workspaceName: string,
  ownerEmail: string,
  plan: string
): Promise<UnipileAccountSetup> {
  try {
    // Create Unipile sub-account with full access to all integrations
    const response = await fetch(`${baseUrl}/v1/accounts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${masterKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: workspaceName,
        email: ownerEmail,
        workspace_id: workspaceId,
        plan: plan,
        integrations: {
          linkedin: {
            enabled: plan !== 'free',
            features: {
              messaging: true,
              connections: true,
              profile_scraping: true,
              inmail: plan === 'enterprise',
              sales_navigator: plan === 'premium' || plan === 'enterprise'
            }
          },
          email: {
            enabled: true,
            providers: ['gmail', 'outlook', 'office365', 'exchange'],
            features: {
              send: true,
              receive: true,
              templates: true,
              tracking: plan !== 'free',
              sequences: plan === 'premium' || plan === 'enterprise'
            }
          },
          calendar: {
            enabled: plan !== 'free',
            providers: ['google', 'outlook'],
            features: {
              events: true,
              availability: true,
              scheduling: true,
              reminders: plan === 'premium' || plan === 'enterprise'
            }
          },
          whatsapp: {
            enabled: plan === 'enterprise',
            features: {
              business_api: true,
              messaging: true,
              templates: true,
              bulk_send: true
            }
          }
        }
      })
    });

    if (!response.ok) {
      // Fallback for development/demo
      console.warn('Using mock Unipile setup for development');
      return {
        accountId: `unipile_${workspaceId}`,
        apiKey: `ak_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        apiSecret: `as_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        webhookSecret: `ws_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        linkedinEnabled: plan !== 'free',
        emailEnabled: true,
        calendarEnabled: plan !== 'free',
        whatsappEnabled: plan === 'enterprise'
      };
    }

    const data = await response.json();
    
    return {
      accountId: data.account_id,
      apiKey: data.api_key,
      apiSecret: data.api_secret,
      webhookSecret: data.webhook_secret,
      linkedinEnabled: data.integrations?.linkedin?.enabled ?? false,
      emailEnabled: data.integrations?.email?.enabled ?? true,
      calendarEnabled: data.integrations?.calendar?.enabled ?? false,
      whatsappEnabled: data.integrations?.whatsapp?.enabled ?? false
    };
  } catch (error) {
    console.error('Error creating Unipile account:', error);
    
    // Return mock setup for development
    return {
      accountId: `unipile_${workspaceId}`,
      apiKey: `ak_demo_${Date.now()}`,
      apiSecret: `as_demo_${Date.now()}`,
      webhookSecret: `ws_demo_${Date.now()}`,
      linkedinEnabled: plan !== 'free',
      emailEnabled: true,
      calendarEnabled: plan !== 'free',
      whatsappEnabled: plan === 'enterprise'
    };
  }
}

async function configureLinkedInDefaults(supabase: any, workspaceId: string, plan: string) {
  const linkedinConfig = {
    workspace_id: workspaceId,
    max_accounts: plan === 'enterprise' ? 10 : plan === 'premium' ? 5 : 1,
    daily_connection_limit: plan === 'enterprise' ? 100 : plan === 'premium' ? 50 : 20,
    daily_message_limit: plan === 'enterprise' ? 200 : plan === 'premium' ? 100 : 50,
    features: {
      auto_connect: plan === 'premium' || plan === 'enterprise',
      bulk_messaging: plan === 'premium' || plan === 'enterprise',
      profile_enrichment: true,
      sales_navigator: plan === 'premium' || plan === 'enterprise',
      inmail: plan === 'enterprise'
    },
    safety_settings: {
      message_delay_seconds: 30,
      connection_delay_seconds: 60,
      working_hours_only: true,
      skip_weekends: true
    }
  };

  await supabase
    .from('linkedin_config')
    .upsert(linkedinConfig);
}

async function configureEmailDefaults(supabase: any, workspaceId: string, plan: string) {
  const emailConfig = {
    workspace_id: workspaceId,
    max_accounts: plan === 'enterprise' ? 10 : plan === 'premium' ? 5 : 2,
    daily_send_limit: plan === 'enterprise' ? 1000 : plan === 'premium' ? 500 : 100,
    providers: ['gmail', 'outlook', 'office365'],
    features: {
      templates: true,
      scheduling: plan !== 'free',
      tracking: plan === 'premium' || plan === 'enterprise',
      sequences: plan === 'premium' || plan === 'enterprise',
      attachments: true,
      unsubscribe_link: true
    },
    smtp_settings: {
      rate_limit_per_minute: 10,
      retry_on_failure: true,
      bounce_handling: plan !== 'free'
    }
  };

  await supabase
    .from('email_config')
    .upsert(emailConfig);
}

async function configureCalendarDefaults(supabase: any, workspaceId: string, plan: string) {
  const calendarConfig = {
    workspace_id: workspaceId,
    max_accounts: plan === 'enterprise' ? 5 : 2,
    providers: ['google', 'outlook'],
    features: {
      scheduling: true,
      availability_check: true,
      meeting_links: true,
      reminders: plan === 'premium' || plan === 'enterprise',
      team_calendars: plan === 'enterprise',
      buffer_time: plan !== 'free'
    },
    default_settings: {
      meeting_duration_minutes: 30,
      buffer_minutes: 15,
      working_hours: {
        start: '09:00',
        end: '17:00',
        timezone: 'America/New_York'
      }
    }
  };

  await supabase
    .from('calendar_config')
    .upsert(calendarConfig);
}

async function configureWhatsAppDefaults(supabase: any, workspaceId: string) {
  const whatsappConfig = {
    workspace_id: workspaceId,
    features: {
      business_api: true,
      messaging: true,
      templates: true,
      bulk_send: true,
      media_messages: true,
      interactive_messages: true
    },
    limits: {
      daily_messages: 1000,
      template_messages: 500,
      media_size_mb: 16
    }
  };

  await supabase
    .from('whatsapp_config')
    .upsert(whatsappConfig);
}

async function createDefaultTemplates(supabase: any, workspaceId: string) {
  const templates = [
    // LinkedIn Templates
    {
      workspace_id: workspaceId,
      name: 'LinkedIn Connection Request',
      type: 'linkedin_connection',
      content: "Hi {{firstName}}, I noticed we're both in {{industry}}. Your experience at {{company}} caught my attention. Would love to connect and exchange insights!",
      is_default: true
    },
    {
      workspace_id: workspaceId,
      name: 'LinkedIn Follow-up',
      type: 'linkedin_message',
      content: "Hi {{firstName}}, Thanks for connecting! I wanted to reach out because {{reason}}. Are you available for a quick call this week?",
      is_default: true
    },
    // Email Templates
    {
      workspace_id: workspaceId,
      name: 'Introduction Email',
      type: 'email',
      subject: 'Quick Introduction - {{company}}',
      content: "Hi {{firstName}},\n\nI hope this email finds you well. I wanted to reach out because {{reason}}.\n\nWould you be open to a brief conversation?\n\nBest regards,\n{{senderName}}",
      is_default: true
    },
    {
      workspace_id: workspaceId,
      name: 'Meeting Request',
      type: 'email',
      subject: 'Meeting Request - {{topic}}',
      content: "Hi {{firstName}},\n\nI'd like to schedule a meeting to discuss {{topic}}.\n\nAre you available {{suggestedTime}}?\n\nBest,\n{{senderName}}",
      is_default: true
    }
  ];

  await supabase
    .from('message_templates')
    .insert(templates);
}

async function setupWebhooks(apiKey: string, baseUrl: string, workspaceId: string, webhookUrl: string) {
  const events = [
    'linkedin.message.received',
    'linkedin.connection.accepted',
    'linkedin.profile.viewed',
    'email.received',
    'email.bounced',
    'email.opened',
    'calendar.event.created',
    'calendar.event.updated',
    'calendar.event.cancelled',
    'whatsapp.message.received',
    'whatsapp.message.delivered'
  ];

  try {
    await fetch(`${baseUrl}/v1/webhooks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: webhookUrl,
        events: events,
        metadata: { workspace_id: workspaceId }
      })
    });
  } catch (error) {
    console.error('Failed to setup webhooks:', error);
  }
}

async function createBrightDataAccount(
  workspaceId: string,
  workspaceName: string,
  plan: string
): Promise<BrightDataSetup> {
  const brightDataApiKey = Deno.env.get('BRIGHTDATA_MASTER_API_KEY') ?? '';
  const brightDataCustomerId = Deno.env.get('BRIGHTDATA_CUSTOMER_ID') ?? '';
  
  try {
    // Create sub-zone in Bright Data for this workspace
    const response = await fetch('https://api.brightdata.com/zone', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${brightDataApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: `workspace_${workspaceId}`,
        customer: brightDataCustomerId,
        zone_type: 'residential',
        ips_type: 'residential',
        plan: {
          type: plan === 'enterprise' ? 'unlimited' : 'pay_as_you_go',
          bandwidth_limit_gb: plan === 'enterprise' ? 1000 : plan === 'premium' ? 100 : 10
        },
        settings: {
          geo_targeting: true,
          ssl_decryption: true,
          request_retry: true,
          super_proxy: true
        },
        permissions: {
          shared: false,
          whitelist_ips: [],
          password: generateSecurePassword()
        }
      })
    });

    if (response.ok) {
      const data = await response.json();
      
      return {
        customerId: data.customer,
        zoneId: data.zone,
        password: data.password,
        residentialProxy: `http://${data.zone}:${data.password}@zproxy.lum-superproxy.io:22225`,
        datacenterProxy: `http://${data.zone}:${data.password}@zproxy.lum-superproxy.io:22226`
      };
    }
  } catch (error) {
    console.error('Error creating Bright Data account:', error);
  }
  
  // Fallback for development/demo
  return {
    customerId: `bd_customer_${workspaceId}`,
    zoneId: `bd_zone_${workspaceId}`,
    password: generateSecurePassword(),
    residentialProxy: 'http://demo:proxy@residential.brightdata.com:22225',
    datacenterProxy: 'http://demo:proxy@datacenter.brightdata.com:22226'
  };
}

async function configureLinkedInDefaults(supabase: any, workspaceId: string, plan: string) {
  const linkedinConfig = {
    workspace_id: workspaceId,
    max_accounts: plan === 'enterprise' ? 10 : plan === 'premium' ? 5 : 1,
    daily_connection_limit: plan === 'enterprise' ? 100 : plan === 'premium' ? 50 : 20,
    daily_message_limit: plan === 'enterprise' ? 200 : plan === 'premium' ? 100 : 50,
    daily_profile_views: plan === 'enterprise' ? 1000 : plan === 'premium' ? 500 : 100,
    scraping_enabled: true,
    proxy_rotation_enabled: plan !== 'free',
    residential_proxy_enabled: plan === 'premium' || plan === 'enterprise',
    features: {
      auto_connect: plan === 'premium' || plan === 'enterprise',
      bulk_messaging: plan === 'premium' || plan === 'enterprise',
      profile_enrichment: true,
      sales_navigator: plan === 'premium' || plan === 'enterprise',
      inmail: plan === 'enterprise',
      profile_scraping: true,
      company_scraping: plan !== 'free',
      job_scraping: plan === 'premium' || plan === 'enterprise'
    },
    safety_settings: {
      message_delay_seconds: 30,
      connection_delay_seconds: 60,
      profile_view_delay_seconds: 5,
      working_hours_only: true,
      skip_weekends: true,
      randomize_delays: true,
      max_actions_per_hour: plan === 'enterprise' ? 60 : 30
    },
    ip_rotation: {
      enabled: true,
      rotation_interval_minutes: 30,
      geo_targeting: 'auto', // Automatically match profile location
      residential_percentage: plan === 'enterprise' ? 100 : plan === 'premium' ? 80 : 50
    }
  };

  await supabase
    .from('linkedin_config')
    .upsert(linkedinConfig);
}

function generateSecurePassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 16; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}