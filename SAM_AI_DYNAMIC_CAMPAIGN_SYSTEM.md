# Sam AI - Dynamic Campaign System Architecture

## 🎯 Project Overview

**Sam AI** is a fully autonomous sales agentic system that handles the complete prospect lifecycle through automated data scraping, enrichment, scoring, personalization, and multi-channel engagement. Sam automatically replies to responding prospects, books meetings, and follows up with leads that stop responding.

## 🏗️ Current Architecture

### **Core Sam AI Components:**
- **Data Collection & Enrichment**: Automated LinkedIn scraping with Bright Data residential proxies
- **Personalization Engine**: Creates personalized outreach based on scraped data
- **Autonomous Communication**: Handles responses and objections without human intervention  
- **Meeting Automation**: Books meetings directly with interested prospects
- **Follow-up Automation**: Re-engages cold leads with different approaches

### **Technology Stack:**
- **Frontend**: React + TypeScript with Vite
- **Backend**: Supabase with Edge Functions
- **Database**: PostgreSQL (multi-tenant)
- **UI**: shadcn/ui + Tailwind CSS
- **LinkedIn API**: Unipile
- **Web Scraping**: Apify (current implementation)
- **Proxy Network**: Bright Data (residential IPs with location-based assignment)
- **Workflow Engine**: Self-hosted n8n with API access
- **AI Platform**: Existing Sam funnel already deployed in n8n

## 🚀 Dynamic Campaign Challenge

### **The Problem:**
- **Cannot create static templates** for every use case (infinite possibilities)
- **One Sam Funnel** must be shared across all accounts/clients
- **Need dynamic n8n workflow generation** based on campaign parameters
- **Avoid template explosion** (hundreds of static funnel templates)

### **The Solution: Conversational Campaign Generation**

```
User → Sam Conversation → Campaign Parameters → Dynamic n8n Workflow → Deploy & Execute
```

## 📋 Campaign Types

### **Four Core Campaign Types:**

1. **Connection Requests (CRs)**
   - Channel: LinkedIn connection requests
   - Limit: 200 characters
   - Follow-up: Messenger campaigns after connection accepted

2. **Messenger Campaigns** 
   - Channel: LinkedIn direct messages
   - Limit: 8,000 characters
   - Requires: Existing connection

3. **Open InMail**
   - Channel: LinkedIn InMail
   - Limit: 1,900 characters
   - Cost: InMail credits
   - No connection required

4. **Group Message Campaigns**
   - Channel: LinkedIn group messages
   - Limit: 8,000 characters
   - Requires: Group membership

### **Multi-Touch Campaign Flow:**
- **Industry Agnostic**: Templates work across all industries
- **Multi-Channel**: Sam can jump between LinkedIn and email as needed
- **Intelligent Switching**: Based on response patterns and engagement
- **Follow-up Sequences**: Each campaign type has specific follow-up templates

## 🎯 **Apify MCP Integration Discovery**

### **Available Apify MCP Server:**
- **Location**: `/Users/tvonlinz/mcp-servers/actors-mcp-server`
- **Purpose**: Enables AI assistants to use any Apify Actor as a tool
- **Integration**: Can connect via Server-Sent Events (SSE) or stdio

### **Key MCP Tools Available:**
- `callActorGetDataset` - Execute actors and retrieve data
- `getActor` - Get actor information and capabilities  
- `searchActors` - Find actors by functionality
- `getActorRun` / `abortActorRun` - Monitor and control actor execution
- `getDataset` / `getDatasetItems` - Access scraped data
- `helpTool` - Get help with available actors

### **Perfect for Sam AI Workflow:**
```
User → Sam Conversation → Apify MCP → Actor Search → Actor Execution → Data Return → Sam Processing
```

**Example Conversational Flow:**
```
User: "I need to scrape LinkedIn profiles for SaaS founders"
Sam: *uses searchActors MCP tool* → "Found LinkedIn Profile Scraper actor"
Sam: "This actor can extract profile data. Should I run it with 100 profiles?"
User: "Yes, proceed"
Sam: *uses callActorGetDataset MCP tool* → Executes scraping
Sam: *processes results* → "Successfully scraped 95 profiles. Ready for campaign setup?"
```

## 🔧 Robust Self-Hosted n8n Infrastructure

### **Single n8n Instance Architecture:**
- **One n8n installation** serves ALL tenant accounts
- **Shared workflows** handle all operations across tenants
- **Tenant context routing** ensures data isolation
- **Scalable infrastructure** supports unlimited accounts
- **Centralized maintenance** with distributed processing

### **Master Sam Workflow Architecture:**

The core of our system is a single, comprehensive n8n workflow that handles all 8 stages of the Sam AI process for every tenant. This workflow is designed to be tenant-aware and data-isolated while sharing the same processing infrastructure.

#### **1. Master Workflow Structure:**

```javascript
// Master Sam Workflow - Handles ALL tenant operations
const MASTER_SAM_WORKFLOW = {
  id: 'sam-master-multi-tenant-v1',
  name: 'Sam AI Master Workflow - All Tenants',
  
  // Main workflow stages - each handles multi-tenant processing
  stages: {
    // Stage 1: Lead Scraping & Data Collection
    scraping: {
      trigger: 'webhook-multi-tenant',
      processors: [
        'tenant-context-parser',
        'apify-mcp-handler', 
        'bright-data-proxy-router',
        'linkedin-unipile-scraper'
      ]
    },
    
    // Stage 2: Data Enrichment
    enrichment: {
      processors: [
        'company-data-enricher',
        'contact-info-enricher', 
        'social-media-analyzer',
        'intent-data-collector'
      ]
    },
    
    // Stage 3: Knowledge Base RAG
    knowledge_rag: {
      processors: [
        'tenant-knowledge-retriever',
        'context-enrichment-engine',
        'persona-matching-system'
      ]
    },
    
    // Stage 4: Lead Qualification
    qualification: {
      processors: [
        'scoring-algorithm-engine',
        'icp-matching-system',
        'priority-ranking-engine'
      ]
    },
    
    // Stage 5: Personalization
    personalization: {
      processors: [
        'message-template-generator',
        'dynamic-content-engine',
        'a-b-testing-variants'
      ]
    },
    
    // Stage 6: Multi-Channel Outreach
    outreach: {
      processors: [
        'linkedin-connection-requests',
        'linkedin-messaging',
        'email-campaigns',
        'inmail-campaigns'
      ]
    },
    
    // Stage 7: Response Handling
    response_handling: {
      processors: [
        'reply-classification-engine',
        'sentiment-analysis',
        'response-generation',
        'meeting-booking-automation'
      ]
    },
    
    // Stage 8: Follow-up Automation
    followup: {
      processors: [
        'sequence-management',
        'timing-optimization',
        'channel-switching-logic',
        'campaign-performance-tracking'
      ]
    }
  }
};
```

#### **2. Tenant Context Routing System:**

```javascript
// Every workflow execution includes tenant context
const executeMasterWorkflow = async (payload) => {
  // Extract tenant context from webhook payload
  const tenantContext = {
    organization_id: payload.organization_id, // Primary tenant identifier
    account_settings: await getTenantSettings(payload.organization_id),
    api_credentials: await getTenantCredentials(payload.organization_id),
    knowledge_base: await getTenantKnowledgeBase(payload.organization_id),
    campaign_config: payload.campaign_config,
    processing_stage: payload.stage || 'scraping',
    
    // Data isolation keys
    supabase_filters: { organization_id: payload.organization_id },
    storage_prefix: `tenant_${payload.organization_id}`,
    cache_namespace: `sam_${payload.organization_id}`
  };
  
  // Route to appropriate stage processor
  const stageProcessor = MASTER_SAM_WORKFLOW.stages[tenantContext.processing_stage];
  return await processStage(stageProcessor, tenantContext, payload.data);
};
```

#### **3. Webhook Entry Points:**

```javascript
// Single webhook endpoint handling all tenant requests
const WEBHOOK_ENDPOINTS = {
  // Main entry point for all Sam AI operations
  master_webhook: {
    url: 'https://n8n.yourdomain.com/webhook/sam-master',
    method: 'POST',
    authentication: 'api_key_per_tenant',
    payload_structure: {
      organization_id: 'required', 
      stage: 'optional', // defaults to 'scraping'
      campaign_config: 'required',
      data: 'required' // leads, messages, etc.
    }
  },
  
  // Specialized endpoints for specific operations
  response_handler: {
    url: 'https://n8n.yourdomain.com/webhook/sam-response',
    method: 'POST',
    purpose: 'Handle prospect responses and replies'
  },
  
  followup_trigger: {
    url: 'https://n8n.yourdomain.com/webhook/sam-followup', 
    method: 'POST',
    purpose: 'Trigger follow-up sequences'
  }
};
```

#### **4. API Key & Credential Management:**

```javascript
// Secure credential management per tenant
const CREDENTIAL_MANAGEMENT = {
  // Tenant-specific credential storage
  storage_strategy: 'per_tenant_encryption',
  
  // Credential types per tenant
  tenant_credentials: {
    unipile: 'linkedin_api_keys',
    apify: 'scraping_api_keys', 
    bright_data: 'proxy_credentials',
    openai: 'gpt_api_keys',
    anthropic: 'claude_api_keys',
    supabase: 'database_connection'
  },
  
  // Dynamic credential injection
  inject_credentials: async (tenantContext) => {
    const credentials = await getEncryptedTenantCredentials(
      tenantContext.organization_id
    );
    
    // Decrypt and inject into workflow context
    return {
      unipile_token: decrypt(credentials.unipile),
      apify_token: decrypt(credentials.apify),
      proxy_config: decrypt(credentials.bright_data),
      llm_keys: decrypt(credentials.llm_apis)
    };
  }
};
```

#### **7. Advanced Credential Management System:**

```javascript
// Enterprise-grade credential management for all tenants
const ADVANCED_CREDENTIAL_SYSTEM = {
  
  // Encryption & Security
  security_layer: {
    encryption_method: 'AES-256-GCM',
    key_rotation: 'monthly_automatic',
    access_logging: 'all_credential_access_logged',
    vault_integration: 'hashicorp_vault_optional',
    
    // Per-tenant credential isolation
    isolation_strategy: {
      storage_path: '/credentials/tenant_{organization_id}/',
      encryption_key: 'tenant_specific_master_key',
      access_control: 'organization_id_based_acl'
    }
  },
  
  // Credential Types & Management
  credential_types: {
    api_keys: {
      unipile: { required: true, validation: 'api_endpoint_test' },
      apify: { required: true, validation: 'actor_list_call' },
      bright_data: { required: true, validation: 'proxy_test' },
      openai: { required: true, validation: 'model_list_call' },
      anthropic: { required: true, validation: 'model_availability_check' }
    },
    
    oauth_tokens: {
      linkedin: { refresh_logic: 'auto_refresh_before_expiry' },
      gmail: { scope_validation: 'email_send_permissions' },
      calendar: { integration: 'meeting_booking_workflows' }
    },
    
    database_connections: {
      supabase: { connection_pooling: true, ssl_required: true },
      postgresql: { read_replica_support: true },
      redis: { cluster_aware: true }
    }
  },
  
  // Dynamic Credential Injection
  runtime_injection: {
    workflow_context: async (tenantId, workflowStage) => {
      const requiredCredentials = getStageCredentials(workflowStage);
      const tenantCredentials = await getDecryptedCredentials(tenantId);
      
      // Only inject credentials needed for this stage
      const stageCredentials = {};
      for (const credType of requiredCredentials) {
        if (tenantCredentials[credType]) {
          stageCredentials[credType] = tenantCredentials[credType];
        }
      }
      
      return stageCredentials;
    },
    
    // Credential validation before injection
    validate_before_use: async (credentials, stage) => {
      const validationResults = {};
      
      for (const [service, creds] of Object.entries(credentials)) {
        validationResults[service] = await validateCredential(service, creds);
      }
      
      return validationResults;
    }
  },
  
  // Monitoring & Alerts
  monitoring: {
    credential_usage_tracking: true,
    expiry_alerts: '7_days_before_expiry',
    failed_validation_alerts: 'immediate_slack_notification',
    unusual_access_patterns: 'security_team_notification',
    
    metrics: {
      track_credential_calls_per_tenant: true,
      track_api_cost_per_credential: true,
      track_success_failure_rates: true
    }
  }
};
```

#### **8. n8n Monitoring & Scaling Infrastructure:**

```javascript
// Enterprise monitoring and scaling for the shared n8n instance
const N8N_MONITORING_SYSTEM = {
  
  // Real-time Performance Monitoring
  performance_metrics: {
    workflow_execution_times: {
      per_tenant: 'execution_time_by_organization_id',
      per_stage: 'stage_processing_duration',
      bottleneck_identification: 'slowest_stages_per_tenant',
      threshold_alerts: 'execution_time > 60_seconds'
    },
    
    resource_utilization: {
      cpu_usage: 'per_workflow_execution',
      memory_consumption: 'tenant_specific_tracking',
      disk_io: 'data_processing_workloads',
      network_bandwidth: 'api_call_intensive_stages'
    },
    
    throughput_metrics: {
      executions_per_minute: 'total_and_per_tenant',
      concurrent_executions: 'max_parallel_processing',
      queue_depth: 'pending_workflow_executions',
      success_failure_rates: 'tenant_specific_success_rates'
    }
  },
  
  // Auto-scaling Logic
  scaling_configuration: {
    horizontal_scaling: {
      trigger: 'queue_depth > 50 OR avg_execution_time > 45s',
      action: 'spawn_additional_n8n_worker_nodes',
      max_instances: 10,
      scale_down_delay: '10_minutes_after_load_decrease'
    },
    
    vertical_scaling: {
      memory_scaling: 'auto_increase_if_memory_usage > 80%',
      cpu_scaling: 'auto_increase_if_cpu_usage > 70%',
      storage_scaling: 'auto_expand_if_disk_usage > 85%'
    },
    
    tenant_isolation_scaling: {
      per_tenant_limits: {
        max_concurrent_executions: 5,
        max_execution_time: '5_minutes',
        max_memory_per_execution: '512MB',
        rate_limiting: '100_executions_per_hour'
      },
      
      priority_queues: {
        enterprise_tenants: 'high_priority_queue',
        standard_tenants: 'normal_priority_queue',
        trial_tenants: 'low_priority_queue'
      }
    }
  },
  
  // Health Monitoring & Alerts
  health_monitoring: {
    system_health_checks: {
      n8n_api_endpoint: 'health_check_every_30s',
      database_connectivity: 'postgres_connection_test',
      external_api_connectivity: 'unipile_apify_bright_data_tests',
      webhook_endpoint_availability: 'response_time_monitoring'
    },
    
    alert_conditions: {
      system_down: 'n8n_api_not_responding_for_2_minutes',
      high_error_rate: 'workflow_failure_rate > 10%_for_5_minutes',
      resource_exhaustion: 'cpu_or_memory > 90%_for_3_minutes',
      tenant_specific_failures: 'single_tenant_failure_rate > 25%',
      credential_validation_failures: 'credential_errors_for_any_tenant'
    },
    
    notification_channels: {
      slack_integration: '#sam-ai-alerts channel',
      email_alerts: 'dev_team_and_ops_team',
      pagerduty: 'for_critical_system_outages',
      dashboard_alerts: 'real_time_status_page'
    }
  },
  
  // Performance Optimization
  optimization_strategies: {
    workflow_caching: {
      tenant_data_caching: 'redis_cluster_with_tenant_namespaces',
      api_response_caching: 'cache_external_api_responses_30min',
      credential_caching: 'cache_decrypted_credentials_5min',
      template_caching: 'cache_generated_templates_1hour'
    },
    
    database_optimization: {
      connection_pooling: 'separate_pools_per_tenant',
      query_optimization: 'index_on_organization_id',
      read_replicas: 'separate_read_queries_from_writes',
      partitioning: 'partition_large_tables_by_organization_id'
    },
    
    api_optimization: {
      request_batching: 'batch_similar_api_calls',
      rate_limit_management: 'intelligent_backoff_strategies',
      parallel_processing: 'concurrent_api_calls_where_possible',
      circuit_breakers: 'fail_fast_on_external_api_outages'
    }
  },
  
  // Disaster Recovery & Backup
  disaster_recovery: {
    backup_strategy: {
      workflow_backups: 'daily_automated_workflow_exports',
      credential_backups: 'encrypted_daily_credential_snapshots',
      data_backups: 'tenant_data_incremental_backups',
      configuration_backups: 'n8n_settings_and_environment_vars'
    },
    
    recovery_procedures: {
      workflow_recovery: 'restore_from_latest_backup_in_under_30min',
      credential_recovery: 'encrypted_credential_restore',
      data_recovery: 'tenant_specific_data_restoration',
      full_system_recovery: 'complete_n8n_instance_recreation'
    },
    
    high_availability: {
      multi_region_deployment: 'primary_and_secondary_regions',
      load_balancing: 'traffic_distribution_across_instances',
      failover_automation: 'automatic_failover_in_under_2min',
      data_replication: 'real_time_data_sync_between_regions'
    }
  }
};
```

#### **9. Deployment & Version Management:**

```javascript
// Sophisticated deployment and version management for the shared workflow
const DEPLOYMENT_VERSION_MANAGEMENT = {
  
  // Version Control Strategy
  version_control: {
    workflow_versioning: {
      semantic_versioning: 'major.minor.patch (e.g., v2.1.3)',
      version_tags: 'git_tags_for_each_workflow_version',
      rollback_capability: 'instant_rollback_to_any_previous_version',
      change_tracking: 'detailed_changelog_for_each_version'
    },
    
    tenant_compatibility: {
      backward_compatibility: 'ensure_older_tenant_configs_still_work',
      migration_scripts: 'automatic_tenant_data_migration',
      compatibility_matrix: 'which_tenants_support_which_versions',
      gradual_rollout: 'deploy_to_subset_of_tenants_first'
    }
  },
  
  // Deployment Pipeline
  deployment_pipeline: {
    development_testing: {
      local_testing: 'test_workflow_changes_on_development_n8n',
      unit_tests: 'test_individual_workflow_nodes',
      integration_tests: 'test_end_to_end_tenant_flows',
      load_testing: 'simulate_multiple_tenant_concurrent_usage'
    },
    
    staging_deployment: {
      staging_environment: 'exact_replica_of_production_n8n',
      tenant_subset_testing: 'test_with_real_tenant_configurations',
      performance_validation: 'ensure_no_performance_regression',
      security_scanning: 'automated_security_vulnerability_checks'
    },
    
    production_deployment: {
      blue_green_deployment: 'zero_downtime_deployments',
      canary_releases: 'deploy_to_10%_of_tenants_first',
      automatic_rollback: 'rollback_if_error_rate_increases',
      deployment_monitoring: 'real_time_deployment_health_checks'
    }
  },
  
  // Feature Flag System
  feature_flags: {
    tenant_specific_features: {
      enable_new_features: 'per_tenant_feature_enablement',
      a_b_testing: 'test_workflow_variants_per_tenant',
      gradual_feature_rollout: 'enable_features_for_tenant_subsets',
      feature_killswitch: 'instantly_disable_problematic_features'
    },
    
    workflow_stage_flags: {
      experimental_stages: 'enable_experimental_processing_stages',
      performance_optimizations: 'toggle_performance_improvements',
      integration_toggles: 'enable_disable_specific_mcp_integrations',
      fallback_mechanisms: 'enable_backup_processing_paths'
    }
  },
  
  // Multi-Environment Management
  environment_management: {
    environment_types: {
      development: 'developer_workflow_testing',
      staging: 'pre_production_tenant_testing',
      production: 'live_tenant_workflow_processing',
      hotfix: 'emergency_patch_environment'
    },
    
    environment_sync: {
      configuration_sync: 'sync_environment_variables_across_environments',
      workflow_sync: 'deploy_same_workflow_version_across_environments',
      tenant_data_isolation: 'completely_separate_tenant_data_per_environment',
      credential_management: 'separate_encrypted_credentials_per_environment'
    }
  }
};
```

#### **5. Data Isolation & Processing:**

```javascript
// Complete data isolation between tenants
const DATA_ISOLATION_LAYER = {
  // All database operations include tenant filter
  supabase_operations: {
    table_prefix: 'sam_',
    rls_policy: 'organization_id = current_tenant_id',
    queries: {
      leads: 'SELECT * FROM sam_leads WHERE organization_id = $1',
      campaigns: 'SELECT * FROM sam_campaigns WHERE organization_id = $1',
      messages: 'SELECT * FROM sam_messages WHERE organization_id = $1'
    }
  },
  
  // File storage isolation
  storage_isolation: {
    base_path: '/data/sam/',
    tenant_path: '/data/sam/tenant_{organization_id}/',
    file_naming: 'tenant_{organization_id}_{campaign_id}_{timestamp}'
  },
  
  // Cache isolation
  cache_isolation: {
    redis_namespace: 'sam:tenant:{organization_id}',
    session_keys: 'sam:session:{organization_id}:{session_id}',
    temp_data: 'sam:temp:{organization_id}:{operation_id}'
  }
};
```

#### **6. Workflow Node Configuration:**

```javascript
// Key nodes in the master workflow
const MASTER_WORKFLOW_NODES = {
  // Entry point - webhook receiver
  webhook_trigger: {
    type: 'webhook',
    config: {
      httpMethod: 'POST',
      path: 'sam-master',
      authentication: 'header_auth'
    }
  },
  
  // Tenant context parser
  tenant_context_parser: {
    type: 'function',
    code: `
      const tenantId = items[0].json.organization_id;
      const settings = await getTenantSettings(tenantId);
      const credentials = await getTenantCredentials(tenantId);
      
      return [{
        json: {
          ...items[0].json,
          tenant_context: {
            id: tenantId,
            settings: settings,
            credentials: credentials
          }
        }
      }];
    `
  },
  
  // Apify MCP integration
  apify_scraper: {
    type: 'http_request',
    config: {
      url: 'https://api.apify.com/v2/acts/{{$json.tenant_context.settings.apify_actor_id}}/runs',
      method: 'POST',
      headers: {
        'Authorization': 'Bearer {{$json.tenant_context.credentials.apify_token}}'
      },
      body: {
        startUrls: '{{$json.scraping_targets}}',
        maxConcurrency: '{{$json.tenant_context.settings.scraping_concurrency}}'
      }
    }
  },
  
  // Unipile LinkedIn integration
  unipile_connector: {
    type: 'http_request',
    config: {
      url: 'https://api.unipile.com/v1/messages',
      method: 'POST',
      headers: {
        'Authorization': 'Bearer {{$json.tenant_context.credentials.unipile_token}}'
      },
      body: {
        account_id: '{{$json.tenant_context.settings.linkedin_account_id}}',
        text: '{{$json.personalized_message}}',
        attendees: '{{$json.prospect_ids}}'
      }
    }
  },
  
  // Supabase data operations
  supabase_writer: {
    type: 'postgres',
    config: {
      connection: '{{$json.tenant_context.credentials.supabase_connection}}',
      query: `
        INSERT INTO sam_campaign_results (organization_id, campaign_id, lead_data, status)
        VALUES ($1, $2, $3, $4)
      `,
      parameters: [
        '{{$json.tenant_context.id}}',
        '{{$json.campaign_id}}',
        '{{$json.processed_data}}',
        '{{$json.processing_status}}'
      ]
    }
  }
};
```

## 🎯 Conversational Data Integration & MCP System

### **Dual Data Input Approach:**
Users have two powerful ways to set up campaigns and provide data to Sam:

#### **1. Direct Data Upload:**
- CSV/Excel file uploads through the React interface
- Drag-and-drop lead lists directly into the dashboard
- Instant processing and validation of uploaded data
- Automatic field mapping and data enrichment

#### **2. Conversational Data Collection with Sam:**
- Natural language conversations about campaign goals
- Sam uses MCPs (Apify, Unipile, etc.) to automatically collect data
- AI-powered data discovery and target audience identification
- Dynamic campaign setup based on conversational requirements

### **Conversational MCP Integration Flow:**

```javascript
// Example user conversations → MCP actions → Campaign setup
const CONVERSATIONAL_DATA_FLOWS = {
  
  // Flow 1: Target Audience Discovery
  audience_discovery: {
    user_input: "I want to target SaaS founders in the fintech space",
    sam_response: "I'll help you find SaaS founders in fintech. Let me search LinkedIn for companies and decision makers.",
    mcp_actions: [
      {
        mcp: 'apify',
        action: 'search_linkedin_companies',
        parameters: {
          keywords: ['SaaS', 'fintech', 'financial technology'],
          company_size: '50-500 employees',
          industry: 'Financial Services'
        }
      },
      {
        mcp: 'apify', 
        action: 'extract_linkedin_profiles',
        parameters: {
          titles: ['CEO', 'Founder', 'Co-Founder', 'CTO'],
          companies: '{{companies_from_previous_search}}'
        }
      }
    ],
    campaign_setup: {
      target_audience: 'SaaS fintech founders',
      lead_source: 'linkedin_mcp_search',
      estimated_leads: '500-1000',
      recommended_channels: ['linkedin_connection_requests', 'linkedin_messaging']
    }
  },

  // Flow 2: Competitor Analysis & Lead Generation  
  competitor_analysis: {
    user_input: "Find leads from companies similar to Stripe and Square",
    sam_response: "I'll analyze Stripe and Square's customer base and find similar prospects.",
    mcp_actions: [
      {
        mcp: 'apify',
        action: 'company_analysis',
        parameters: {
          target_companies: ['Stripe', 'Square'],
          analysis_type: 'customer_base_analysis'
        }
      },
      {
        mcp: 'bright_data',
        action: 'web_scraping',
        parameters: {
          targets: 'similar_companies_websites',
          data_points: ['contact_info', 'team_members', 'company_size']
        }
      }
    ]
  },

  // Flow 3: Event-Based Targeting
  event_targeting: {
    user_input: "I want to reach people who attended fintech conferences this year",
    sam_response: "I'll find attendees from major fintech events and conferences.",
    mcp_actions: [
      {
        mcp: 'apify',
        action: 'event_attendee_scraping',
        parameters: {
          event_types: ['fintech conference', 'payment summit', 'blockchain conference'],
          time_range: '2024-2025',
          attendee_roles: ['executive', 'founder', 'director']
        }
      }
    ]
  }
};
```

### **MCP-Powered Data Collection System:**

```javascript
// Sam's MCP integration for automatic data collection
const SAM_MCP_INTEGRATION = {
  
  // Available MCPs for data collection
  available_mcps: {
    apify: {
      capabilities: [
        'linkedin_profile_scraping',
        'company_data_extraction', 
        'email_finder_tools',
        'social_media_analysis',
        'website_contact_extraction'
      ],
      rate_limits: '1000_profiles_per_hour',
      data_quality: 'high_accuracy'
    },
    
    unipile: {
      capabilities: [
        'linkedin_search_api',
        'real_time_profile_data',
        'connection_status_check',
        'message_deliverability'
      ],
      rate_limits: 'api_key_dependent',
      data_quality: 'real_time_accurate'
    },
    
    bright_data: {
      capabilities: [
        'large_scale_web_scraping',
        'geographic_data_collection',
        'proxy_rotation_scraping',
        'anti_detection_scraping'
      ],
      rate_limits: 'unlimited_with_proxies',
      data_quality: 'enterprise_grade'
    }
  },

  // Intelligent MCP selection based on user request
  select_optimal_mcp: async (userRequest) => {
    const requestAnalysis = await analyzeUserRequest(userRequest);
    
    const mcpSelection = {
      linkedin_data: requestAnalysis.needs_linkedin ? 'apify + unipile' : null,
      web_scraping: requestAnalysis.needs_web_data ? 'bright_data' : null, 
      real_time_api: requestAnalysis.needs_real_time ? 'unipile' : null,
      bulk_scraping: requestAnalysis.volume > 1000 ? 'apify + bright_data' : 'apify'
    };
    
    return mcpSelection;
  },

  // Execute MCP data collection
  execute_mcp_collection: async (mcpConfig, userContext) => {
    const results = {};
    
    // Run MCP operations in parallel where possible
    if (mcpConfig.apify) {
      results.apify_data = await callApifyMCP(mcpConfig.apify, userContext);
    }
    
    if (mcpConfig.unipile) {
      results.unipile_data = await callUnipileMCP(mcpConfig.unipile, userContext);
    }
    
    if (mcpConfig.bright_data) {
      results.bright_data = await callBrightDataMCP(mcpConfig.bright_data, userContext);
    }
    
    // Merge and deduplicate results
    const consolidatedData = await consolidateDataSources(results);
    
    return {
      leads: consolidatedData.prospects,
      companies: consolidatedData.organizations,
      metadata: consolidatedData.collection_stats
    };
  }
};
```

### **Conversational Campaign Setup with Apify MCP:**
```javascript
// Example Sam conversations:
"I want to run a CR campaign targeting SaaS founders with 3 follow-ups"
"Set up a messenger campaign for logistics companies with email backup"  
"Create an InMail campaign with group message follow-up for 2 weeks"

// Sam extracts parameters:
{
  campaignType: "connection_requests",
  targetAudience: "SaaS founders", 
  touchPoints: 3,
  channels: ["linkedin_cr", "linkedin_message"],
  followUpStrategy: "aggressive",
  duration: "2_weeks"
}
```

### **2. Shared n8n Workflow for All Tenants:**
```javascript
// Single workflow handles all tenants with context-aware processing
async function triggerSharedSamWorkflow(campaignConfig, organizationId) {
  // Prepare tenant context
  const tenantContext = {
    organization_id: organizationId,
    campaign_config: campaignConfig,
    tenant_settings: await getTenantSettings(organizationId),
    api_keys: await getTenantApiKeys(organizationId),
    knowledge_base_id: organizationId // for RAG queries
  };
  
  // Trigger the single shared Sam workflow
  const result = await triggerN8nWorkflow(SHARED_SAM_WORKFLOW_ID, {
    tenant_context: tenantContext,
    lead_data: campaignConfig.leads,
    stage: campaignConfig.stage || 'scraping'
  });
  
  return result;
}

// The shared workflow receives tenant context and routes accordingly
const SHARED_SAM_WORKFLOW_ID = 'sam-multi-tenant-workflow';
```

### **3. Channel-Specific Integration:**

#### **Unipile LinkedIn API Integration:**
- Connection requests and messaging
- Profile data extraction
- Message status tracking
- Response handling

#### **Bright Data Proxy Network:**
- **Residential IP rotation** by geographic location
- **Location-based proxy assignment** (NYC profiles → NYC IPs)
- **180+ location mappings** for authentic scraping
- **Certificate-based authentication** for premium residential network

### **4. Sam Integration Points:**
```javascript
// Where Sam takes over in workflows
const samIntegrationNodes = [
  {
    type: "webhook_trigger",
    name: "Prospect Responds", 
    action: "route_to_conversational_sam"
  },
  {
    type: "schedule_trigger",
    name: "Follow-up Check",
    action: "sam_decides_follow_up"
  },
  {
    type: "condition_node", 
    name: "Channel Switch Logic",
    condition: "no_linkedin_response_72h",
    action: "sam_switch_to_email"
  }
];
```

## 🛠️ Implementation Roadmap

### **Phase 1: Conversation Parser**
- [ ] Create Sam conversation parser for campaign setup
- [ ] Extract campaign parameters from natural language
- [ ] Validate campaign configuration
- [ ] Campaign parameter UI for review/editing

### **Phase 2: Workflow Generator**
- [ ] Build n8n workflow generator using self-hosted API
- [ ] Integrate base Sam funnel template with dynamic campaign logic
- [ ] Create campaign deployment system via n8n API
- [ ] Implement workflow versioning and cleanup

### **Phase 3: Campaign Management**
- [ ] Build campaign monitoring and management interface
- [ ] Real-time campaign performance tracking through Sam conversations
- [ ] Campaign modification capabilities ("pause", "clone", "modify")
- [ ] Multi-campaign coordination and conflict resolution

### **Phase 4: Advanced Features**
- [ ] A/B testing framework for campaign variations
- [ ] Predictive analytics for campaign optimization
- [ ] Cross-campaign learning and template evolution
- [ ] Advanced audience segmentation and targeting

## 🔍 Integration Research Needed

### **Unipile LinkedIn API Analysis:**
- [ ] Full API capabilities and rate limits
- [ ] Multi-account management features
- [ ] Webhook support for real-time events
- [ ] Advanced search and filtering options
- [ ] Integration with other platforms beyond LinkedIn
- [ ] **Cost analysis**: Per-request pricing vs subscription models
- [ ] **Reliability metrics**: Uptime, error rates, support quality

### **Apify Platform Features Analysis:**

#### **Core Automation Features:**
- [ ] **Actor Ecosystem**: 6,000+ pre-built scrapers and automation tools
- [ ] **Developer Community**: Large developer base creating specialized actors
- [ ] **Custom Actor Development**: Build custom scrapers for specific needs
- [ ] **Auto-generated UIs**: Configuration interfaces for actors

#### **Sales Automation Capabilities:**
- [ ] **LinkedIn Actors**: Profile scrapers, company data extractors, network analysis
- [ ] **Lead Generation Actors**: Apollo scraper, website crawlers, contact enrichment
- [ ] **Data Processing**: Built-in data transformation and enrichment tools
- [ ] **Bulk Operations**: Large-scale data extraction capabilities

#### **Integration & Workflow Features:**
- [ ] **Webhook Integration**: Real-time data delivery to n8n workflows
- [ ] **API Clients**: JavaScript/Python SDKs for custom integrations
- [ ] **Data Export**: Multiple formats (JSON, CSV, Excel) for Sam AI ingestion
- [ ] **Scheduling**: Automated actor runs for regular data updates
- [ ] **Storage System**: Built-in data storage and management

#### **Anti-Detection & Reliability:**
- [ ] **Proxy Management**: Datacenter and residential IP rotation
- [ ] **Anti-Scraping Protections**: Built-in bypass mechanisms
- [ ] **Fingerprint Suite**: Browser fingerprinting tools (open-source)
- [ ] **Error Handling**: Robust retry logic and failure management
- [ ] **Rate Limiting**: Intelligent request throttling

#### **Enterprise Features:**
- [ ] **Scalability**: Handle high-volume operations
- [ ] **Monitoring**: Real-time job monitoring and alerting
- [ ] **Security**: Data encryption and secure processing
- [ ] **Support**: Developer community + enterprise support options

#### **n8n Integration Assessment:**
- [ ] **API Compatibility**: REST API integration with n8n HTTP nodes
- [ ] **Webhook Support**: Real-time data flow to Sam AI workflows
- [ ] **Data Format**: JSON output compatibility with n8n processing
- [ ] **Authentication**: API key management and security
- [ ] **Error Propagation**: Failure handling in n8n workflows

#### **Sam AI Specific Requirements:**
- [ ] **LinkedIn Data Quality**: Profile completeness and accuracy
- [ ] **Real-time Processing**: Speed of data delivery to Sam
- [ ] **Data Enrichment**: Company and contact enhancement capabilities
- [ ] **Bulk Processing**: Handle large prospect lists efficiently
- [ ] **Cost Efficiency**: Price per successful data point extracted

### **Bright Data Services Assessment:**
- [ ] Web scraping APIs vs current Apify implementation
- [ ] Data enrichment services and accuracy
- [ ] Real-time proxy rotation capabilities
- [ ] Geographic targeting precision
- [ ] Enterprise features and custom solutions
- [ ] **Cost comparison**: Apify vs Bright Data for web scraping
- [ ] **Reliability comparison**: Success rates, support quality

## 💰 LLM Cost Analysis & Optimization (2025)

### **ChatGPT-5 Pricing Revolution:**
**OpenAI has disrupted the market with aggressive GPT-5 pricing:**
- **Input tokens**: $1.25 per 1 million tokens (50% cheaper than GPT-4o)
- **Output tokens**: $10 per 1 million tokens
- **Cached input**: $0.125 per 1 million tokens (90% discount)
- **Available models**: Regular, Mini, Nano with 4 reasoning levels

### **Current Model Pricing Comparison:**

#### **High-Performance Models:**
| Model | Input (per 1M tokens) | Output (per 1M tokens) | Best Use Case |
|-------|---------------------|----------------------|---------------|
| **GPT-5** | $1.25 | $10.00 | Complex reasoning, code generation |
| Claude 3.5 Sonnet | $3.00 | $15.00 | Content creation, analysis |
| Claude 3.7 Sonnet | $3.00 | $15.00 | Extended thinking, complex tasks |
| Claude Sonnet 4 | $3.00 | $15.00 | Latest capabilities |

#### **Cost-Effective Models:**
| Model | Input (per 1M tokens) | Output (per 1M tokens) | Best Use Case |
|-------|---------------------|----------------------|---------------|
| Claude 3 Haiku | $0.25 | $1.25 | Quick responses, high volume |
| DeepSeek Coder v2 | Free/Low | Free/Low | Code generation |
| Llama models | Free/Low | Free/Low | Open source flexibility |

### **Sam AI Cost Optimization Strategy:**

#### **Hybrid Model Approach:**
```javascript
// Complete Sam AI model routing strategy
const modelRouter = {
  // CORE GPT-5 RESPONSIBILITIES (Primary Engine)
  workflows: 'gpt-5',              // n8n workflow generation
  conversations: 'gpt-5',          // Sam AI conversational interface
  templates: 'gpt-5',              // Dynamic template generation
  strategy: 'gpt-5',               // Campaign strategy & logic
  objections: 'gpt-5',             // Complex objection handling
  coding: 'gpt-5',                 // All development tasks
  
  // SPECIALIZED TASKS (Cost-Optimized)
  personalization: 'claude-3.5-sonnet', // Message personalization
  copywriting: 'claude-3.5-sonnet',     // Marketing copy creation
  analysis: 'claude-3.5-sonnet',        // Content analysis & review
  
  // HIGH-VOLUME OPERATIONS (Ultra Cost-Effective)
  scoring: 'claude-3-haiku',       // Lead scoring algorithms
  processing: 'claude-3-haiku',    // Data processing & enrichment
  classification: 'claude-3-haiku' // Prospect categorization
};
```

### **GPT-5 Core Capabilities for Sam AI:**

#### **1. Conversational Interface (GPT-5)**
**Why GPT-5 for Sam's Conversations:**
- **Context Retention**: Long conversations about campaign setup
- **Complex Reasoning**: Understanding user intent across multiple exchanges
- **Decision Making**: Campaign recommendations and strategy suggestions
- **Natural Language Processing**: Converting conversations to actionable parameters

```javascript
// GPT-5 conversation examples
"I want to target SaaS founders with a CR campaign, then messenger follow-ups"
→ GPT-5 extracts: {
  target: "saas_founders", 
  sequence: ["connection_request", "messenger_campaign"],
  timing: "3_day_intervals"
}

"Switch to email if LinkedIn doesn't respond in 5 days"
→ GPT-5 adds: {
  fallback: "email_outreach",
  trigger: "no_response_5_days"
}
```

#### **2. Template Generation (GPT-5)**
**Dynamic Template Creation:**
- **Industry-Agnostic Templates**: Adapt to any vertical instantly
- **Personalization Variables**: Smart placeholder generation
- **Multi-Channel Templates**: LinkedIn, email, InMail variations
- **Follow-up Sequences**: Contextual continuation messages

```javascript
// GPT-5 generates templates on-demand
const templateRequest = "Create connection request for fintech CEOs";
→ GPT-5 generates:
{
  template: "Hi {{firstName}}, noticed {{companyName}} is innovating in {{fintechNiche}}. I help fintech leaders scale through {{ourSolution}}. Worth a quick chat?",
  variables: ["firstName", "companyName", "fintechNiche", "ourSolution"],
  character_count: 147,
  tone: "professional_casual"
}
```

#### **3. Text Generation Strategy (GPT-5)**
**Why GPT-5 for Message Creation:**
- **Reasoning About Context**: Understands prospect data and conversation history
- **Objection Handling**: Sophisticated responses to common pushbacks
- **Tone Adaptation**: Matches communication style to prospect persona
- **Follow-up Logic**: Determines next best action based on response patterns

**However, for high-volume personalization → Claude 3.5 Sonnet**

#### **4. n8n Workflow Generation (GPT-5)**
**Complex JSON Schema Understanding**: n8n workflows require intricate node connections
**Workflow Logic Reasoning**: Multi-step campaign flows with conditional branching  
**API Integration Expertise**: Unipile, Apify, webhook configurations
**Error Handling**: Robust retry logic and fallback mechanisms

#### **GPT-5 Workflow Generation Examples:**

**1. Dynamic Campaign Workflow Creation:**
```javascript
// GPT-5 generates complete n8n workflows from conversation
const generateCampaign = async (userPrompt) => {
  const prompt = `
  Create an n8n workflow for: "${userPrompt}"
  
  Requirements:
  - Use Unipile LinkedIn nodes for outreach
  - Integrate Apify MCP for data collection  
  - Include Sam AI webhook triggers for responses
  - Add retry logic and error handling
  - Include 3 follow-up sequences
  
  Return complete n8n JSON with nodes and connections.
  `;
  
  const workflow = await openai.chat.completions.create({
    model: "gpt-5",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.1 // Low temperature for precise workflow generation
  });
  
  return JSON.parse(workflow.choices[0].message.content);
};
```

**2. Intelligent Node Configuration:**
```javascript
// GPT-5 configures complex node parameters automatically
const configureUnipileNode = {
  "id": "unipile-linkedin-message",
  "type": "n8n-nodes-base.httpRequest", 
  "parameters": {
    "url": "https://api.unipile.com/v1/messages",
    "method": "POST",
    "headers": {
      "Authorization": "Bearer {{$node['credentials'].token}}",
      "Content-Type": "application/json"
    },
    "body": {
      "account_id": "{{$json.linkedin_account_id}}",
      "text": "{{$node['Sam-Personalization'].json.personalized_message}}",
      "attendees": ["{{$json.prospect_linkedin_id}}"]
    },
    "options": {
      "timeout": 30000,
      "retry": {
        "maxRetries": 3,
        "retryDelay": 2000
      }
    }
  }
};
```

**3. Campaign Flow Orchestration:**
```javascript
// GPT-5 creates sophisticated campaign flows
const campaignFlow = {
  "trigger": "webhook", // Sam conversation initiates
  "dataCollection": "apify-mcp", // Use MCP for LinkedIn scraping
  "enrichment": "multiple-apis", // Company data, contact info
  "personalization": "gpt-5", // Custom message generation
  "outreach": "unipile-sequence", // Multi-touch campaigns
  "responseHandling": "sam-webhook", // AI handles replies
  "followUp": "conditional-logic", // Smart retry sequences
  "reporting": "campaign-analytics" // Performance tracking
};
```

#### **Updated Cost Projections for Sam AI:**

**Scenario: 10,000 prospects/month with GPT-5 + Claude Integration**
- **Conversations & Templates** (GPT-5): 15M tokens = $168.75
- **Workflow generation** (GPT-5): 5M tokens = $56.25
- **Strategy & objections** (GPT-5): 10M tokens = $112.50
- **Coding & development** (GPT-5): 3M tokens = $33.75
- **Message personalization** (Claude 3.5): 15M tokens = $270
- **Data processing** (Haiku): 50M tokens = $62.50
- **Total monthly cost**: ~$704 (vs $2,000+ with single premium model)
- **Final cost with direct APIs**: $704 (no OpenRouter fees)

**ROI Analysis:**
- **Manual n8n development**: $200/hour × 40 hours = $8,000/month
- **GPT-5 automated generation**: $56.25/month
- **Savings**: $7,943.75/month (99.3% cost reduction)
- **Speed improvement**: Instant vs 40 hours development time

### **Direct API Strategy (Production Choice):**
- **OpenAI Direct API**: GPT-5 for conversations, templates, workflows, strategy, coding
- **Anthropic Direct API**: Claude 3.5 Sonnet for personalization, Claude Haiku for volume
- **Advantages**: Better reliability, no 5.5% OpenRouter fee, direct vendor relationship
- **Cost Savings**: Eliminates $38.72/month OpenRouter fees ($704 × 5.5%)
- **Simplified Architecture**: Only 2 API providers to manage

### **Token Caching Optimization:**
- **GPT-5**: 90% discount on cached inputs
- **Strategy**: Cache common prompts, persona templates, industry data
- **Savings potential**: 40-60% reduction in input costs

### **Direct API Implementation Architecture:**
```javascript
// Simplified dual-provider API architecture
const apiProviders = {
  openai: {
    models: ['gpt-5'],
    endpoint: 'https://api.openai.com/v1/chat/completions',
    usage: ['conversations', 'templates', 'workflows', 'strategy', 'coding']
  },
  anthropic: {
    models: ['claude-3.5-sonnet', 'claude-3-haiku'],
    endpoint: 'https://api.anthropic.com/v1/messages',
    usage: ['personalization', 'copywriting', 'volume-processing']
  }
};

// Reliability & failover strategy
const apiReliability = {
  primary: 'direct_vendor_apis',
  fallback: 'openrouter_backup',
  monitoring: 'real_time_health_checks',
  sla: '99.9_uptime_target'
};
```

### **Cost Monitoring & Alerts:**
```javascript
// Implement cost tracking per campaign with direct APIs
const costTracker = {
  budgetAlert: '$100/campaign',
  dailyLimit: '$50/day',
  modelFallback: 'switch to cheaper model at 80% budget',
  directApiFees: 'no_additional_charges',
  vendorRelationship: 'direct_support_access'
};
```

## 📊 Campaign Analytics & Optimization

### **Key Metrics to Track:**
- Response rates by campaign type and channel
- Connection acceptance rates
- Meeting booking conversion rates
- Follow-up sequence effectiveness
- Channel switching success rates
- Geographic performance variations

### **Optimization Strategies:**
- Dynamic message personalization based on response patterns
- Intelligent timing optimization
- Channel preference learning
- A/B testing of message variations
- Predictive lead scoring improvements

## 🎯 Success Criteria

### **System Performance Goals:**
- **Scalability**: Support 100+ parallel campaigns
- **Reliability**: 99.9% workflow execution success rate
- **Efficiency**: < 30 second campaign deployment time
- **Intelligence**: Continuous learning and optimization

### **Business Impact Goals:**
- **Response Rate**: Maintain/improve current response rates
- **Conversion Rate**: Increase meeting booking rates by 25%
- **Efficiency**: 10x campaign setup speed vs manual creation
- **ROI**: Measurable improvement in cost-per-lead metrics

## 📝 Next Steps

1. **Research Phase**: Deep dive into Unipile and Bright Data capabilities
2. **Architecture Review**: Validate technical approach with existing Sam funnel
3. **Prototype Development**: Build conversation parser and basic workflow generator
4. **Testing Framework**: Establish campaign testing and validation processes
5. **Production Deployment**: Gradual rollout with monitoring and optimization

---

**Document Status**: Initial Architecture Design  
**Last Updated**: January 2025  
**Next Review**: After Unipile/Bright Data research completion