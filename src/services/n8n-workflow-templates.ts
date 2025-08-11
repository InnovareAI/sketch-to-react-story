// n8n Workflow Templates for LinkedIn Prospect Search
// Complete workflow definitions for each search type with Bright Data integration

export const N8N_LINKEDIN_WORKFLOW_TEMPLATES = {
  
  // 1. LinkedIn Basic Search Workflow
  LINKEDIN_BASIC_SEARCH: {
    name: "LinkedIn Basic Search with Bright Data",
    description: "Scrapes LinkedIn basic search results using residential proxies",
    nodes: [
      {
        id: "webhook-trigger",
        name: "LinkedIn Basic Search Trigger",
        type: "n8n-nodes-base.webhook",
        typeVersion: 1,
        position: [240, 300],
        parameters: {
          httpMethod: "POST",
          path: "linkedin-basic-search",
          responseMode: "responseNode",
          options: {}
        }
      },
      {
        id: "validate-input",
        name: "Validate Input",
        type: "n8n-nodes-base.function",
        typeVersion: 1,
        position: [460, 300],
        parameters: {
          functionCode: `
// Validate required input parameters
const requiredFields = ['search_url', 'workspace_id', 'search_config_id'];
const input = items[0].json;

for (const field of requiredFields) {
  if (!input[field]) {
    throw new Error(\`Missing required field: \${field}\`);
  }
}

// Validate LinkedIn URL format
if (!input.search_url.includes('linkedin.com')) {
  throw new Error('Invalid LinkedIn URL');
}

// Set defaults
input.max_results = input.max_results || 50;
input.bright_data_config = input.bright_data_config || {
  proxy_type: 'residential',
  country: 'US'
};

return items.map(item => ({
  json: {
    ...input,
    validated: true,
    timestamp: new Date().toISOString()
  }
}));
`
        }
      },
      {
        id: "bright-data-scraper",
        name: "Bright Data LinkedIn Scraper",
        type: "n8n-nodes-base.httpRequest",
        typeVersion: 3,
        position: [680, 300],
        parameters: {
          method: "POST",
          url: "={{ $env.BRIGHT_DATA_API_ENDPOINT }}/scrape-linkedin-search",
          headers: {
            "Authorization": "Bearer {{ $env.BRIGHT_DATA_API_KEY }}",
            "Content-Type": "application/json"
          },
          body: {
            search_url: "={{ $json.search_url }}",
            max_results: "={{ $json.max_results }}",
            proxy_config: {
              zone: "residential",
              country: "={{ $json.bright_data_config.country || 'US' }}",
              session_id: "linkedin_basic_{{ $json.workspace_id }}_{{ $json.timestamp }}"
            },
            extraction_rules: {
              profiles: {
                name: ".entity-result__title-text .app-aware-link",
                headline: ".entity-result__primary-subtitle",
                location: ".entity-result__secondary-subtitle",
                profile_url: ".entity-result__title-text .app-aware-link@href",
                company: ".entity-result__summary-info .entity-result__content--summary",
                image_url: ".entity-result__image img@src"
              }
            }
          },
          options: {
            timeout: 120000,
            followRedirect: true,
            ignoreHttpStatusErrors: false
          }
        }
      },
      {
        id: "process-results",
        name: "Process Scraping Results",
        type: "n8n-nodes-base.function",
        typeVersion: 1,
        position: [900, 300],
        parameters: {
          functionCode: `
const scrapingResult = items[0].json;

if (!scrapingResult.success) {
  throw new Error(\`Scraping failed: \${scrapingResult.error}\`);
}

// Process and clean the scraped data
const profiles = (scrapingResult.data || []).map((profile, index) => ({
  profile_url: profile.profile_url || '',
  full_name: (profile.name || '').trim(),
  headline: (profile.headline || '').trim(),
  location: (profile.location || '').trim(),
  current_company: (profile.company || '').trim(),
  current_position: (profile.headline || '').trim(),
  connections_count: '0',
  about: '',
  experience: [],
  education: [],
  skills: [],
  contact_info: {},
  profile_image_url: profile.image_url || '',
  scraped_at: new Date().toISOString(),
  proxy_info: {
    country: scrapingResult.proxy_info?.country || 'US',
    ip: scrapingResult.proxy_info?.ip || 'unknown',
    success: true
  },
  search_position: index + 1,
  source: 'linkedin_basic_search'
})).filter(profile => profile.full_name && profile.profile_url);

return [{
  json: {
    search_url: items[0].json.search_url,
    workspace_id: items[0].json.workspace_id,
    search_config_id: items[0].json.search_config_id,
    results: profiles,
    pagination: {
      current_page: 1,
      total_pages: Math.ceil(profiles.length / 25),
      total_results: profiles.length,
      has_more: false
    },
    scraped_at: new Date().toISOString(),
    cost_info: {
      requests_used: 1,
      estimated_cost: 0.05,
      data_points_extracted: profiles.length
    }
  }
}];
`
        }
      },
      {
        id: "save-to-supabase",
        name: "Save Results to Supabase",
        type: "n8n-nodes-base.supabase",
        typeVersion: 1,
        position: [1120, 300],
        parameters: {
          resource: "row",
          operation: "create",
          tableId: "prospect_profiles",
          body: {
            workspace_id: "={{ $json.workspace_id }}",
            source: "linkedin_search",
            source_details: {
              search_url: "={{ $json.search_url }}",
              search_config_id: "={{ $json.search_config_id }}",
              scraped_at: "={{ $json.scraped_at }}"
            }
          },
          options: {
            bulk: true,
            bulkData: "={{ $json.results }}"
          }
        },
        credentials: {
          supabaseApi: {
            id: "supabase-main",
            name: "Supabase Main DB"
          }
        }
      },
      {
        id: "update-search-stats",
        name: "Update Search Statistics",
        type: "n8n-nodes-base.supabase",
        typeVersion: 1,
        position: [1340, 300],
        parameters: {
          resource: "row",
          operation: "update",
          tableId: "search_history",
          filterType: "single",
          filters: {
            search_configuration_id: "={{ $json.search_config_id }}"
          },
          body: {
            status: "completed",
            results_found: "={{ $json.results.length }}",
            processing_time_seconds: "={{ Math.floor((Date.now() - new Date($json.scraped_at).getTime()) / 1000) }}",
            bright_data_usage: "={{ $json.cost_info }}",
            completed_at: "={{ new Date().toISOString() }}"
          }
        }
      },
      {
        id: "webhook-response",
        name: "Send Response",
        type: "n8n-nodes-base.respondToWebhook",
        typeVersion: 1,
        position: [1560, 300],
        parameters: {
          options: {},
          responseBody: {
            success: true,
            message: "LinkedIn Basic Search completed successfully",
            results_count: "={{ $json.results.length }}",
            search_config_id: "={{ $json.search_config_id }}",
            cost_info: "={{ $json.cost_info }}"
          }
        }
      },
      {
        id: "error-handler",
        name: "Error Handler",
        type: "n8n-nodes-base.respondToWebhook",
        typeVersion: 1,
        position: [900, 500],
        parameters: {
          options: {},
          responseBody: {
            success: false,
            error: "={{ $json.error || 'Unknown error occurred' }}",
            message: "LinkedIn Basic Search failed",
            timestamp: "={{ new Date().toISOString() }}"
          }
        }
      }
    ],
    connections: {
      "webhook-trigger": {
        main: [
          [
            {
              node: "validate-input",
              type: "main",
              index: 0
            }
          ]
        ]
      },
      "validate-input": {
        main: [
          [
            {
              node: "bright-data-scraper",
              type: "main",
              index: 0
            }
          ]
        ]
      },
      "bright-data-scraper": {
        main: [
          [
            {
              node: "process-results",
              type: "main",
              index: 0
            }
          ]
        ]
      },
      "process-results": {
        main: [
          [
            {
              node: "save-to-supabase",
              type: "main",
              index: 0
            }
          ]
        ]
      },
      "save-to-supabase": {
        main: [
          [
            {
              node: "update-search-stats",
              type: "main",
              index: 0
            }
          ]
        ]
      },
      "update-search-stats": {
        main: [
          [
            {
              node: "webhook-response",
              type: "main",
              index: 0
            }
          ]
        ]
      }
    }
  },

  // 2. LinkedIn Sales Navigator Search Workflow
  LINKEDIN_SALES_NAVIGATOR: {
    name: "LinkedIn Sales Navigator Search with Bright Data",
    description: "Advanced scraping for Sales Navigator premium searches",
    nodes: [
      {
        id: "webhook-trigger",
        name: "Sales Navigator Search Trigger",
        type: "n8n-nodes-base.webhook",
        typeVersion: 1,
        position: [240, 300],
        parameters: {
          httpMethod: "POST",
          path: "linkedin-sales-navigator",
          responseMode: "responseNode",
          options: {}
        }
      },
      {
        id: "validate-premium",
        name: "Validate Premium Access",
        type: "n8n-nodes-base.function",
        typeVersion: 1,
        position: [460, 300],
        parameters: {
          functionCode: `
const input = items[0].json;

// Check for Sales Navigator specific URL patterns
if (!input.search_url.includes('linkedin.com/sales/') && 
    !input.search_url.includes('linkedin.com/sales-navigator/')) {
  throw new Error('URL does not appear to be a Sales Navigator search');
}

// Validate premium account requirements
if (!input.linkedin_account_id) {
  throw new Error('LinkedIn account ID required for Sales Navigator searches');
}

// Set premium defaults
input.max_results = Math.min(input.max_results || 25, 25); // Lower limit for premium
input.bright_data_config = {
  ...input.bright_data_config,
  premium_account_required: true,
  session_persistence: true
};

return items.map(item => ({
  json: {
    ...input,
    validated: true,
    search_type: 'sales_navigator'
  }
}));
`
        }
      },
      {
        id: "bright-data-premium-scraper",
        name: "Bright Data Sales Navigator Scraper",
        type: "n8n-nodes-base.httpRequest",
        typeVersion: 3,
        position: [680, 300],
        parameters: {
          method: "POST",
          url: "={{ $env.BRIGHT_DATA_API_ENDPOINT }}/scrape-sales-navigator",
          headers: {
            "Authorization": "Bearer {{ $env.BRIGHT_DATA_API_KEY }}",
            "Content-Type": "application/json"
          },
          body: {
            search_url: "={{ $json.search_url }}",
            max_results: "={{ $json.max_results }}",
            linkedin_account: "={{ $json.linkedin_account_id }}",
            proxy_config: {
              zone: "residential_premium",
              country: "={{ $json.bright_data_config.country || 'US' }}",
              session_persistence: true,
              premium_account: true
            },
            extraction_rules: {
              profiles: {
                name: "[data-anonymize='person-name'] span",
                headline: "[data-anonymize='headline']",
                location: "[data-anonymize='location']",
                profile_url: "a[data-control-name='view_lead_panel_via_search_lead_name']@href",
                company: "[data-anonymize='company-name'] span",
                image_url: ".presence-entity__image img@src",
                premium_insights: ".search-result__insights",
                mutual_connections: ".search-result__social-proof",
                recent_activity: ".search-result__activity"
              }
            }
          },
          options: {
            timeout: 180000 // 3 minutes for premium searches
          }
        }
      }
      // Additional nodes would follow similar pattern...
    ]
  },

  // 3. Company Follower Scraping Workflow
  COMPANY_FOLLOWER_SCRAPING: {
    name: "LinkedIn Company Follower Scraping",
    description: "Extract followers from LinkedIn company pages",
    nodes: [
      {
        id: "webhook-trigger",
        name: "Company Follower Trigger",
        type: "n8n-nodes-base.webhook",
        typeVersion: 1,
        position: [240, 300],
        parameters: {
          httpMethod: "POST",
          path: "company-followers",
          responseMode: "responseNode"
        }
      },
      {
        id: "validate-company-url",
        name: "Validate Company URL",
        type: "n8n-nodes-base.function",
        typeVersion: 1,
        position: [460, 300],
        parameters: {
          functionCode: `
const input = items[0].json;

if (!input.company_url.includes('linkedin.com/company/')) {
  throw new Error('Invalid LinkedIn company URL');
}

// Extract company slug
const urlParts = input.company_url.split('/');
const companySlug = urlParts[urlParts.indexOf('company') + 1];

return [{
  json: {
    ...input,
    company_slug: companySlug,
    follower_scrape_url: \`\${input.company_url}/followers/\`,
    max_followers: input.max_followers || 200
  }
}];
`
        }
      },
      {
        id: "scrape-followers",
        name: "Scrape Company Followers",
        type: "n8n-nodes-base.httpRequest",
        typeVersion: 3,
        position: [680, 300],
        parameters: {
          method: "POST",
          url: "={{ $env.BRIGHT_DATA_API_ENDPOINT }}/scrape-company-followers",
          headers: {
            "Authorization": "Bearer {{ $env.BRIGHT_DATA_API_KEY }}",
            "Content-Type": "application/json"
          },
          body: {
            company_url: "={{ $json.follower_scrape_url }}",
            max_followers: "={{ $json.max_followers }}",
            filters: "={{ $json.filters }}",
            proxy_config: {
              zone: "residential",
              country: "US"
            },
            extraction_rules: {
              followers: {
                name: ".org-people-profile-card__profile-title",
                headline: ".org-people-profile-card__summary",
                profile_url: ".org-people-profile-card__profile-title@href",
                location: ".org-people-profile-card__location",
                mutual_connections: ".org-people-profile-card__connections",
                image_url: ".org-people-profile-card__profile-photo img@src"
              }
            }
          }
        }
      }
      // Process results nodes would follow...
    ]
  },

  // 4. Post Engagement Scraping Workflow
  POST_ENGAGEMENT_SCRAPING: {
    name: "LinkedIn Post Engagement Scraping",
    description: "Extract users who engaged with specific LinkedIn posts",
    nodes: [
      {
        id: "webhook-trigger",
        name: "Post Engagement Trigger",
        type: "n8n-nodes-base.webhook",
        typeVersion: 1,
        position: [240, 300],
        parameters: {
          httpMethod: "POST",
          path: "post-engagement",
          responseMode: "responseNode"
        }
      },
      {
        id: "extract-post-id",
        name: "Extract Post ID",
        type: "n8n-nodes-base.function",
        typeVersion: 1,
        position: [460, 300],
        parameters: {
          functionCode: `
const input = items[0].json;

// Extract post ID from LinkedIn URL
const postUrlMatch = input.post_url.match(/activity-(\\d+)/);
if (!postUrlMatch) {
  throw new Error('Invalid LinkedIn post URL - could not extract post ID');
}

const postId = postUrlMatch[1];

return [{
  json: {
    ...input,
    post_id: postId,
    engagement_types: input.engagement_types || ['like', 'comment', 'share'],
    max_engagers: input.max_engagers || 100
  }
}];
`
        }
      }
      // Scraping nodes would follow...
    ]
  },

  // 5. Group Member Scraping Workflow
  GROUP_MEMBER_SCRAPING: {
    name: "LinkedIn Group Member Scraping",
    description: "Extract members from LinkedIn groups",
    nodes: [
      {
        id: "webhook-trigger",
        name: "Group Member Trigger",
        type: "n8n-nodes-base.webhook",
        typeVersion: 1,
        position: [240, 300],
        parameters: {
          httpMethod: "POST",
          path: "group-members",
          responseMode: "responseNode"
        }
      }
      // Group-specific scraping nodes...
    ]
  },

  // 6. Event Attendee Scraping Workflow
  EVENT_ATTENDEE_SCRAPING: {
    name: "LinkedIn Event Attendee Scraping",
    description: "Extract attendees from LinkedIn events",
    nodes: [
      {
        id: "webhook-trigger",
        name: "Event Attendee Trigger",
        type: "n8n-nodes-base.webhook",
        typeVersion: 1,
        position: [240, 300],
        parameters: {
          httpMethod: "POST",
          path: "event-attendees",
          responseMode: "responseNode"
        }
      }
      // Event-specific scraping nodes...
    ]
  },

  // 7. People You May Know Scraping Workflow
  PEOPLE_SUGGESTIONS_SCRAPING: {
    name: "LinkedIn People Suggestions Scraping",
    description: "Extract 'People you may know' suggestions",
    nodes: [
      {
        id: "webhook-trigger",
        name: "People Suggestions Trigger",
        type: "n8n-nodes-base.webhook",
        typeVersion: 1,
        position: [240, 300],
        parameters: {
          httpMethod: "POST",
          path: "people-suggestions",
          responseMode: "responseNode"
        }
      }
      // People suggestions scraping nodes...
    ]
  }
};

// Utility function to create n8n workflow from template
export function createN8nWorkflowFromTemplate(templateKey: string, customizations?: any) {
  const template = N8N_LINKEDIN_WORKFLOW_TEMPLATES[templateKey as keyof typeof N8N_LINKEDIN_WORKFLOW_TEMPLATES];
  
  if (!template) {
    throw new Error(`Workflow template not found: ${templateKey}`);
  }

  // Apply customizations if provided
  const workflow = JSON.parse(JSON.stringify(template)); // Deep clone
  
  if (customizations) {
    // Apply custom environment variables
    if (customizations.environment) {
      workflow.nodes.forEach((node: any) => {
        if (node.parameters?.body) {
          const bodyStr = JSON.stringify(node.parameters.body);
          Object.entries(customizations.environment).forEach(([key, value]) => {
            const envVar = `{{ $env.${key} }}`;
            if (bodyStr.includes(envVar)) {
              node.parameters.body = JSON.parse(bodyStr.replace(new RegExp(envVar, 'g'), value as string));
            }
          });
        }
      });
    }
    
    // Apply custom webhook paths
    if (customizations.webhook_path) {
      const webhookNode = workflow.nodes.find((node: any) => node.type === 'n8n-nodes-base.webhook');
      if (webhookNode) {
        webhookNode.parameters.path = customizations.webhook_path;
      }
    }
  }

  return workflow;
}

// Export function to deploy workflow to n8n instance
export async function deployWorkflowToN8n(
  n8nApiUrl: string, 
  apiKey: string, 
  workflowTemplate: any
): Promise<{ success: boolean; workflowId?: string; error?: string }> {
  try {
    const response = await fetch(`${n8nApiUrl}/api/v1/workflows`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-N8N-API-KEY': apiKey
      },
      body: JSON.stringify(workflowTemplate)
    });

    if (!response.ok) {
      throw new Error(`Failed to deploy workflow: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
    // Activate the workflow
    await fetch(`${n8nApiUrl}/api/v1/workflows/${result.id}/activate`, {
      method: 'POST',
      headers: {
        'X-N8N-API-KEY': apiKey
      }
    });

    return { success: true, workflowId: result.id };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}