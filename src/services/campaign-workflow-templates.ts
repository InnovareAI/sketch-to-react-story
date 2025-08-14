// Campaign Workflow Templates for N8N
// Pre-configured templates for different LinkedIn campaign types

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  campaign_type: string;
  nodes: any[];
  connections: Record<string, any>;
  settings: {
    daily_limit: number;
    priority: 'low' | 'medium' | 'high';
    working_hours: {
      start: string;
      end: string;
      days: string[];
    };
  };
  variables: Record<string, any>;
}

class CampaignWorkflowTemplates {
  private static instance: CampaignWorkflowTemplates;

  static getInstance(): CampaignWorkflowTemplates {
    if (!CampaignWorkflowTemplates.instance) {
      CampaignWorkflowTemplates.instance = new CampaignWorkflowTemplates();
    }
    return CampaignWorkflowTemplates.instance;
  }

  /**
   * Get workflow template for a specific campaign type
   */
  getTemplate(campaignType: string): WorkflowTemplate | null {
    const templates = {
      connector: this.createConnectorTemplate(),
      messenger: this.createMessengerTemplate(),
      open_inmail: this.createOpenInMailTemplate(),
      event_invite: this.createEventInviteTemplate(),
      company_follow_invite: this.createCompanyFollowTemplate(),
      group: this.createGroupTemplate(),
      inbound: this.createInboundTemplate(),
      event_participants: this.createEventParticipantsTemplate()
    };

    return templates[campaignType as keyof typeof templates] || null;
  }

  /**
   * LinkedIn Connector Campaign Template
   */
  private createConnectorTemplate(): WorkflowTemplate {
    return {
      id: 'connector-template',
      name: 'LinkedIn Connector Campaign',
      description: 'Automated connection requests with follow-up messages',
      campaign_type: 'connector',
      settings: {
        daily_limit: 50,
        priority: 'medium',
        working_hours: { start: '09:00', end: '17:00', days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] }
      },
      variables: {
        connection_message: 'Hi {{prospect_name}}, I\'d like to connect and share insights about {{industry}}.',
        follow_up_delay: '3 days',
        max_follow_ups: 2
      },
      nodes: [
        {
          id: 'trigger',
          name: 'Campaign Trigger',
          type: 'n8n-nodes-base.webhook',
          typeVersion: 1,
          position: [250, 300],
          parameters: {
            httpMethod: 'POST',
            path: 'connector-campaign',
            options: {}
          }
        },
        {
          id: 'load-prospects',
          name: 'Load Prospects',
          type: 'n8n-nodes-base.supabase',
          typeVersion: 1,
          position: [450, 300],
          parameters: {
            resource: 'row',
            operation: 'get',
            tableId: 'prospects',
            filterType: 'manual',
            matchType: 'allFilters',
            filters: {
              conditions: [
                {
                  keyName: 'campaign_id',
                  keyValue: '={{$json.campaign_id}}',
                  condition: 'eq'
                },
                {
                  keyName: 'status',
                  keyValue: 'active',
                  condition: 'eq'
                }
              ]
            }
          }
        },
        {
          id: 'rate-limiter',
          name: 'Rate Limiter',
          type: 'n8n-nodes-base.function',
          typeVersion: 1,
          position: [650, 300],
          parameters: {
            functionCode: `
              // Implement daily rate limiting
              const dailyLimit = $json.campaign_settings?.daily_limit || 50;
              const today = new Date().toISOString().split('T')[0];
              
              // Check how many connections sent today
              // This would query the database for today's count
              return items.slice(0, dailyLimit);
            `
          }
        },
        {
          id: 'send-connection',
          name: 'Send Connection Request',
          type: 'n8n-nodes-base.httpRequest',
          typeVersion: 3,
          position: [850, 300],
          parameters: {
            method: 'POST',
            url: '={{$env.UNIPILE_API_URL}}/connect',
            authentication: 'headerAuth',
            options: {
              timeout: 30000
            },
            bodyParameters: {
              provider: 'LINKEDIN',
              recipient: '={{$json.linkedin_url}}',
              message: '={{$json.connection_message}}',
              type: 'CONNECTION_REQUEST'
            }
          },
          credentials: {
            headerAuth: {
              id: 'unipile-api-key',
              name: 'Unipile API'
            }
          }
        },
        {
          id: 'log-activity',
          name: 'Log Campaign Activity',
          type: 'n8n-nodes-base.supabase',
          typeVersion: 1,
          position: [1050, 300],
          parameters: {
            resource: 'row',
            operation: 'create',
            tableId: 'campaign_activities',
            fieldsUi: {
              fieldValues: [
                {
                  fieldId: 'campaign_id',
                  fieldValue: '={{$json.campaign_id}}'
                },
                {
                  fieldId: 'prospect_id',
                  fieldValue: '={{$json.prospect_id}}'
                },
                {
                  fieldId: 'activity_type',
                  fieldValue: 'connection_request'
                },
                {
                  fieldId: 'status',
                  fieldValue: '={{$json.success ? "sent" : "failed"}}'
                },
                {
                  fieldId: 'timestamp',
                  fieldValue: '={{new Date().toISOString()}}'
                }
              ]
            }
          }
        },
        {
          id: 'schedule-follow-up',
          name: 'Schedule Follow-up',
          type: 'n8n-nodes-base.wait',
          typeVersion: 1,
          position: [1250, 300],
          parameters: {
            amount: 3,
            unit: 'days'
          }
        },
        {
          id: 'send-follow-up',
          name: 'Send Follow-up Message',
          type: 'n8n-nodes-base.httpRequest',
          typeVersion: 3,
          position: [1450, 300],
          parameters: {
            method: 'POST',
            url: '={{$env.UNIPILE_API_URL}}/messages/send',
            authentication: 'headerAuth',
            bodyParameters: {
              provider: 'LINKEDIN',
              recipient: '={{$json.linkedin_url}}',
              message: {
                text: 'Thanks for connecting! I wanted to share some insights about {{industry}} that might interest you.',
                type: 'TEXT'
              }
            }
          }
        }
      ],
      connections: {
        'trigger': {
          main: [
            [{ node: 'load-prospects', type: 'main', index: 0 }]
          ]
        },
        'load-prospects': {
          main: [
            [{ node: 'rate-limiter', type: 'main', index: 0 }]
          ]
        },
        'rate-limiter': {
          main: [
            [{ node: 'send-connection', type: 'main', index: 0 }]
          ]
        },
        'send-connection': {
          main: [
            [{ node: 'log-activity', type: 'main', index: 0 }]
          ]
        },
        'log-activity': {
          main: [
            [{ node: 'schedule-follow-up', type: 'main', index: 0 }]
          ]
        },
        'schedule-follow-up': {
          main: [
            [{ node: 'send-follow-up', type: 'main', index: 0 }]
          ]
        }
      }
    };
  }

  /**
   * LinkedIn Messenger Campaign Template
   */
  private createMessengerTemplate(): WorkflowTemplate {
    return {
      id: 'messenger-template',
      name: 'LinkedIn Messenger Campaign',
      description: 'Direct message sequence to existing connections',
      campaign_type: 'messenger',
      settings: {
        daily_limit: 100,
        priority: 'medium',
        working_hours: { start: '09:00', end: '17:00', days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] }
      },
      variables: {
        initial_message: 'Hi {{prospect_name}}, thanks for connecting! I wanted to share something that might interest you...',
        follow_up_delay: '2 days',
        max_messages: 3
      },
      nodes: [
        {
          id: 'trigger',
          name: 'Message Campaign Trigger',
          type: 'n8n-nodes-base.webhook',
          typeVersion: 1,
          position: [250, 300],
          parameters: {
            httpMethod: 'POST',
            path: 'messenger-campaign'
          }
        },
        {
          id: 'load-connections',
          name: 'Load Connected Prospects',
          type: 'n8n-nodes-base.supabase',
          typeVersion: 1,
          position: [450, 300],
          parameters: {
            resource: 'row',
            operation: 'get',
            tableId: 'prospects',
            filterType: 'manual',
            filters: {
              conditions: [
                {
                  keyName: 'campaign_id',
                  keyValue: '={{$json.campaign_id}}',
                  condition: 'eq'
                },
                {
                  keyName: 'connection_status',
                  keyValue: 'connected',
                  condition: 'eq'
                }
              ]
            }
          }
        },
        {
          id: 'personalize-message',
          name: 'Personalize Message',
          type: 'n8n-nodes-base.function',
          typeVersion: 1,
          position: [650, 300],
          parameters: {
            functionCode: `
              // Personalize message content
              const messageTemplate = $parameter["variables"]["initial_message"];
              const personalizedMessage = messageTemplate
                .replace(/{{prospect_name}}/g, $json.prospect_name || 'there')
                .replace(/{{company}}/g, $json.company || 'your company')
                .replace(/{{industry}}/g, $json.industry || 'your industry');
              
              return [{
                json: {
                  ...$json,
                  message_content: personalizedMessage
                }
              }];
            `
          }
        },
        {
          id: 'send-message',
          name: 'Send LinkedIn Message',
          type: 'n8n-nodes-base.httpRequest',
          typeVersion: 3,
          position: [850, 300],
          parameters: {
            method: 'POST',
            url: '={{$env.UNIPILE_API_URL}}/messages/send',
            authentication: 'headerAuth',
            bodyParameters: {
              provider: 'LINKEDIN',
              recipient: '={{$json.linkedin_url}}',
              message: {
                text: '={{$json.message_content}}',
                type: 'TEXT'
              }
            }
          }
        }
      ],
      connections: {
        'trigger': {
          main: [
            [{ node: 'load-connections', type: 'main', index: 0 }]
          ]
        },
        'load-connections': {
          main: [
            [{ node: 'personalize-message', type: 'main', index: 0 }]
          ]
        },
        'personalize-message': {
          main: [
            [{ node: 'send-message', type: 'main', index: 0 }]
          ]
        }
      }
    };
  }

  /**
   * LinkedIn Open InMail Campaign Template
   */
  private createOpenInMailTemplate(): WorkflowTemplate {
    return {
      id: 'open-inmail-template',
      name: 'LinkedIn Open InMail Campaign',
      description: 'Premium InMail messages to prospects (requires Sales Navigator)',
      campaign_type: 'open_inmail',
      settings: {
        daily_limit: 20,
        priority: 'high',
        working_hours: { start: '09:00', end: '17:00', days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] }
      },
      variables: {
        subject_line: 'Quick question about {{company}}',
        inmail_message: 'Hi {{prospect_name}}, I noticed {{company}} is expanding in {{industry}}. I have some insights that might be valuable...',
        follow_up_delay: '1 week'
      },
      nodes: [
        {
          id: 'trigger',
          name: 'InMail Campaign Trigger',
          type: 'n8n-nodes-base.webhook',
          typeVersion: 1,
          position: [250, 300]
        },
        {
          id: 'validate-premium',
          name: 'Validate Premium Account',
          type: 'n8n-nodes-base.function',
          typeVersion: 1,
          position: [450, 300],
          parameters: {
            functionCode: `
              // Validate that the account has Sales Navigator/Premium
              const accountInfo = $json.account_info;
              if (!accountInfo?.premium_status || 
                  !['sales_navigator', 'recruiter'].includes(accountInfo.premium_status)) {
                throw new Error('Sales Navigator or Recruiter license required for InMail campaigns');
              }
              
              // Check InMail credits
              if (accountInfo.inmail_credits < 1) {
                throw new Error('Insufficient InMail credits');
              }
              
              return items;
            `
          }
        },
        {
          id: 'send-inmail',
          name: 'Send InMail',
          type: 'n8n-nodes-base.httpRequest',
          typeVersion: 3,
          position: [650, 300],
          parameters: {
            method: 'POST',
            url: '={{$env.UNIPILE_API_URL}}/inmails/send',
            authentication: 'headerAuth',
            bodyParameters: {
              provider: 'LINKEDIN',
              recipient: '={{$json.prospect_linkedin_url}}',
              subject: '={{$json.subject_line}}',
              message: '={{$json.inmail_message}}',
              type: 'INMAIL'
            }
          }
        }
      ],
      connections: {
        'trigger': {
          main: [
            [{ node: 'validate-premium', type: 'main', index: 0 }]
          ]
        },
        'validate-premium': {
          main: [
            [{ node: 'send-inmail', type: 'main', index: 0 }]
          ]
        }
      }
    };
  }


  private createEventInviteTemplate(): WorkflowTemplate {
    return {
      id: 'event-invite-template',
      name: 'LinkedIn Event Invite Campaign',
      description: 'Automated event invitations to targeted prospects',
      campaign_type: 'event_invite',
      settings: {
        daily_limit: 100,
        priority: 'medium',
        working_hours: { start: '09:00', end: '17:00', days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] }
      },
      variables: {
        event_name: 'Industry Innovation Summit 2024',
        event_date: '2024-06-15',
        event_url: 'https://example.com/event',
        invite_message: 'Hi {{prospect_name}}, I\'d like to invite you to our upcoming {{event_name}}...'
      },
      nodes: [
        {
          id: 'trigger',
          name: 'Event Invite Trigger',
          type: 'n8n-nodes-base.webhook',
          typeVersion: 1,
          position: [250, 300]
        },
        {
          id: 'load-prospects',
          name: 'Load Event Prospects',
          type: 'n8n-nodes-base.supabase',
          typeVersion: 1,
          position: [450, 300]
        },
        {
          id: 'send-invite',
          name: 'Send Event Invite',
          type: 'n8n-nodes-base.httpRequest',
          typeVersion: 3,
          position: [650, 300],
          parameters: {
            method: 'POST',
            url: '={{$env.UNIPILE_API_URL}}/events/invite',
            bodyParameters: {
              provider: 'LINKEDIN',
              recipient: '={{$json.linkedin_url}}',
              event_details: {
                name: '={{$parameter["variables"]["event_name"]}}',
                date: '={{$parameter["variables"]["event_date"]}}',
                url: '={{$parameter["variables"]["event_url"]}}'
              },
              message: '={{$json.personalized_invite}}'
            }
          }
        }
      ],
      connections: {
        'trigger': { main: [[{ node: 'load-prospects', type: 'main', index: 0 }]] },
        'load-prospects': { main: [[{ node: 'send-invite', type: 'main', index: 0 }]] }
      }
    };
  }

  private createCompanyFollowTemplate(): WorkflowTemplate {
    return {
      id: 'company-follow-template',
      name: 'Company Follow Invite Campaign',
      description: 'Invite prospects to follow your company page',
      campaign_type: 'company_follow_invite',
      settings: {
        daily_limit: 200,
        priority: 'low',
        working_hours: { start: '09:00', end: '17:00', days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] }
      },
      variables: {},
      nodes: [],
      connections: {}
    };
  }

  private createGroupTemplate(): WorkflowTemplate {
    return {
      id: 'group-template',
      name: 'LinkedIn Group Campaign',
      description: 'Group-based outreach and engagement',
      campaign_type: 'group',
      settings: {
        daily_limit: 50,
        priority: 'medium',
        working_hours: { start: '09:00', end: '17:00', days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] }
      },
      variables: {},
      nodes: [],
      connections: {}
    };
  }

  private createInboundTemplate(): WorkflowTemplate {
    return {
      id: 'inbound-template',
      name: 'Inbound Lead Nurturing Campaign',
      description: 'Automated responses to inbound leads',
      campaign_type: 'inbound',
      settings: {
        daily_limit: 500,
        priority: 'high',
        working_hours: { start: '00:00', end: '23:59', days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] }
      },
      variables: {},
      nodes: [],
      connections: {}
    };
  }

  private createEventParticipantsTemplate(): WorkflowTemplate {
    return {
      id: 'event-participants-template',
      name: 'Event Participants Campaign',
      description: 'Outreach to event attendees and participants',
      campaign_type: 'event_participants',
      settings: {
        daily_limit: 75,
        priority: 'medium',
        working_hours: { start: '09:00', end: '17:00', days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] }
      },
      variables: {},
      nodes: [],
      connections: {}
    };
  }


  /**
   * Get all available templates
   */
  getAllTemplates(): WorkflowTemplate[] {
    return [
      this.createConnectorTemplate(),
      this.createMessengerTemplate(),
      this.createOpenInMailTemplate(),
      this.createEventInviteTemplate(),
      this.createCompanyFollowTemplate(),
      this.createGroupTemplate(),
      this.createInboundTemplate(),
      this.createEventParticipantsTemplate()
    ];
  }

  /**
   * Customize template for specific campaign
   */
  customizeTemplate(template: WorkflowTemplate, customizations: {
    campaignId: string;
    campaignName: string;
    settings?: Partial<WorkflowTemplate['settings']>;
    variables?: Record<string, any>;
  }): WorkflowTemplate {
    return {
      ...template,
      name: `${customizations.campaignName} - ${template.name}`,
      settings: {
        ...template.settings,
        ...customizations.settings
      },
      variables: {
        ...template.variables,
        ...customizations.variables
      },
      // Update webhook path to be campaign-specific
      nodes: template.nodes.map(node => {
        if (node.type === 'n8n-nodes-base.webhook') {
          return {
            ...node,
            parameters: {
              ...node.parameters,
              path: `campaign-${customizations.campaignId}`
            }
          };
        }
        return node;
      })
    };
  }
}

export const campaignWorkflowTemplates = CampaignWorkflowTemplates.getInstance();
export default CampaignWorkflowTemplates;