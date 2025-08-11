// n8n Workflow Integration for Prospect Search
// Automates LinkedIn scraping, data enrichment, and prospect processing

interface N8nWorkflowTrigger {
  workflowId: string;
  payload: Record<string, any>;
  webhookUrl?: string;
}

interface LinkedInSearchWorkflowInput {
  searchUrl: string;
  searchType: string;
  workspaceId: string;
  searchConfigId: string;
  maxResults?: number;
  filters?: {
    location?: string[];
    industry?: string[];
    currentCompany?: string[];
    pastCompany?: string[];
    jobTitle?: string[];
    connectionDegree?: number[];
  };
}

interface CompanyFollowerWorkflowInput {
  companyUrl: string;
  companyId: string;
  workspaceId: string;
  searchConfigId: string;
  maxFollowers?: number;
  followerFilters?: {
    location?: string[];
    industry?: string[];
    jobTitle?: string[];
  };
}

interface ProspectEnrichmentWorkflowInput {
  prospectIds: string[];
  workspaceId: string;
  enrichmentTypes: string[];
  providers?: {
    email?: string;
    phone?: string;
    social?: string;
    company?: string;
  };
}

interface CsvProcessingWorkflowInput {
  uploadSessionId: string;
  workspaceId: string;
  csvData: any[];
  fieldMappings: Record<string, string>;
  processingOptions: {
    createProspects: boolean;
    autoEnrich: boolean;
    deduplicate: boolean;
    assignToCampaign?: string;
  };
}

export class N8nProspectWorkflows {
  private static readonly BASE_WORKFLOW_URL = process.env.VITE_N8N_WEBHOOK_BASE_URL || 'https://n8n.yourcompany.com/webhook';
  
  // Workflow IDs - these should match your n8n workflow webhook endpoints
  private static readonly WORKFLOWS = {
    LINKEDIN_BASIC_SEARCH: 'linkedin-basic-search',
    LINKEDIN_SALES_NAVIGATOR: 'linkedin-sales-navigator',
    LINKEDIN_RECRUITER: 'linkedin-recruiter-search',
    COMPANY_FOLLOWER_SCRAPING: 'company-follower-scraping',
    POST_ENGAGEMENT_SCRAPING: 'post-engagement-scraping',
    GROUP_MEMBER_SCRAPING: 'group-member-scraping',
    EVENT_ATTENDEE_SCRAPING: 'event-attendee-scraping',
    PROSPECT_ENRICHMENT: 'prospect-enrichment',
    CSV_PROCESSING: 'csv-processing-workflow',
    DUPLICATE_DETECTION: 'duplicate-detection',
    LEAD_SCORING: 'lead-scoring-workflow',
    AUTO_CAMPAIGN_ASSIGNMENT: 'auto-campaign-assignment'
  };

  /**
   * Trigger LinkedIn Basic Search workflow
   */
  static async triggerLinkedInBasicSearch(input: LinkedInSearchWorkflowInput): Promise<{ success: boolean; executionId?: string; error?: string }> {
    try {
      const payload = {
        searchUrl: input.searchUrl,
        searchType: input.searchType,
        workspaceId: input.workspaceId,
        searchConfigId: input.searchConfigId,
        maxResults: input.maxResults || 100,
        filters: input.filters || {},
        brightDataConfig: {
          proxyType: 'residential',
          country: 'US',
          sessionStickiness: true
        },
        processingOptions: {
          extractProfiles: true,
          enrichBasicData: true,
          detectDuplicates: true,
          saveToDatabase: true
        }
      };

      const response = await fetch(`${this.BASE_WORKFLOW_URL}/${this.WORKFLOWS.LINKEDIN_BASIC_SEARCH}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.VITE_N8N_API_KEY}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return { success: true, executionId: result.executionId };
    } catch (error) {
      console.error('LinkedIn Basic Search workflow error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Trigger Sales Navigator Search workflow
   */
  static async triggerSalesNavigatorSearch(input: LinkedInSearchWorkflowInput): Promise<{ success: boolean; executionId?: string; error?: string }> {
    try {
      const payload = {
        ...input,
        searchUrl: input.searchUrl,
        advancedFilters: input.filters,
        brightDataConfig: {
          proxyType: 'residential',
          country: 'US',
          sessionStickiness: true,
          premiumAccount: true
        },
        processingOptions: {
          extractAdvancedData: true,
          includeSalesInsights: true,
          extractContactInfo: true,
          enrichProfiles: true
        }
      };

      const response = await fetch(`${this.BASE_WORKFLOW_URL}/${this.WORKFLOWS.LINKEDIN_SALES_NAVIGATOR}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.VITE_N8N_API_KEY}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return { success: true, executionId: result.executionId };
    } catch (error) {
      console.error('Sales Navigator workflow error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Trigger Company Follower Scraping workflow
   */
  static async triggerCompanyFollowerScraping(input: CompanyFollowerWorkflowInput): Promise<{ success: boolean; executionId?: string; error?: string }> {
    try {
      const payload = {
        companyUrl: input.companyUrl,
        companyId: input.companyId,
        workspaceId: input.workspaceId,
        searchConfigId: input.searchConfigId,
        maxFollowers: input.maxFollowers || 500,
        followerFilters: input.followerFilters || {},
        processingOptions: {
          extractFollowerProfiles: true,
          filterByJobTitle: true,
          filterByLocation: true,
          enrichBasicData: true,
          detectExistingConnections: true
        }
      };

      const response = await fetch(`${this.BASE_WORKFLOW_URL}/${this.WORKFLOWS.COMPANY_FOLLOWER_SCRAPING}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.VITE_N8N_API_KEY}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return { success: true, executionId: result.executionId };
    } catch (error) {
      console.error('Company Follower Scraping workflow error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Trigger Post Engagement Scraping workflow
   */
  static async triggerPostEngagementScraping(postUrl: string, workspaceId: string, searchConfigId: string): Promise<{ success: boolean; executionId?: string; error?: string }> {
    try {
      const payload = {
        postUrl,
        workspaceId,
        searchConfigId,
        engagementTypes: ['likes', 'comments', 'shares', 'reactions'],
        processingOptions: {
          extractEngagers: true,
          analyzeEngagementType: true,
          extractProfiles: true,
          enrichBasicData: true
        }
      };

      const response = await fetch(`${this.BASE_WORKFLOW_URL}/${this.WORKFLOWS.POST_ENGAGEMENT_SCRAPING}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.VITE_N8N_API_KEY}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return { success: true, executionId: result.executionId };
    } catch (error) {
      console.error('Post Engagement Scraping workflow error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Trigger Group Member Scraping workflow
   */
  static async triggerGroupMemberScraping(groupUrl: string, workspaceId: string, searchConfigId: string): Promise<{ success: boolean; executionId?: string; error?: string }> {
    try {
      const payload = {
        groupUrl,
        workspaceId,
        searchConfigId,
        maxMembers: 1000,
        processingOptions: {
          extractMemberProfiles: true,
          filterActiveMembers: true,
          extractRecentActivity: true,
          enrichProfiles: true
        }
      };

      const response = await fetch(`${this.BASE_WORKFLOW_URL}/${this.WORKFLOWS.GROUP_MEMBER_SCRAPING}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.VITE_N8N_API_KEY}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return { success: true, executionId: result.executionId };
    } catch (error) {
      console.error('Group Member Scraping workflow error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Trigger Event Attendee Scraping workflow
   */
  static async triggerEventAttendeeScraping(eventUrl: string, workspaceId: string, searchConfigId: string): Promise<{ success: boolean; executionId?: string; error?: string }> {
    try {
      const payload = {
        eventUrl,
        workspaceId,
        searchConfigId,
        attendeeTypes: ['attending', 'interested', 'organizers', 'speakers'],
        processingOptions: {
          extractAttendeeProfiles: true,
          categorizeAttendees: true,
          extractEventContext: true,
          enrichProfiles: true
        }
      };

      const response = await fetch(`${this.BASE_WORKFLOW_URL}/${this.WORKFLOWS.EVENT_ATTENDEE_SCRAPING}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.VITE_N8N_API_KEY}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return { success: true, executionId: result.executionId };
    } catch (error) {
      console.error('Event Attendee Scraping workflow error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Trigger Prospect Enrichment workflow
   */
  static async triggerProspectEnrichment(input: ProspectEnrichmentWorkflowInput): Promise<{ success: boolean; executionId?: string; error?: string }> {
    try {
      const payload = {
        prospectIds: input.prospectIds,
        workspaceId: input.workspaceId,
        enrichmentTypes: input.enrichmentTypes,
        providers: input.providers || {
          email: 'apollo',
          phone: 'clearbit',
          social: 'pipl',
          company: 'crunchbase'
        },
        processingOptions: {
          batchSize: 10,
          retryFailures: true,
          validateResults: true,
          costOptimization: true
        }
      };

      const response = await fetch(`${this.BASE_WORKFLOW_URL}/${this.WORKFLOWS.PROSPECT_ENRICHMENT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.VITE_N8N_API_KEY}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return { success: true, executionId: result.executionId };
    } catch (error) {
      console.error('Prospect Enrichment workflow error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Trigger CSV Processing workflow
   */
  static async triggerCsvProcessing(input: CsvProcessingWorkflowInput): Promise<{ success: boolean; executionId?: string; error?: string }> {
    try {
      const payload = {
        uploadSessionId: input.uploadSessionId,
        workspaceId: input.workspaceId,
        csvData: input.csvData,
        fieldMappings: input.fieldMappings,
        processingOptions: input.processingOptions,
        validationRules: {
          requiredFields: ['full_name', 'company_name'],
          emailValidation: true,
          phoneValidation: true,
          linkedinUrlValidation: true
        }
      };

      const response = await fetch(`${this.BASE_WORKFLOW_URL}/${this.WORKFLOWS.CSV_PROCESSING}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.VITE_N8N_API_KEY}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return { success: true, executionId: result.executionId };
    } catch (error) {
      console.error('CSV Processing workflow error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Trigger Duplicate Detection workflow
   */
  static async triggerDuplicateDetection(workspaceId: string, prospectIds?: string[]): Promise<{ success: boolean; executionId?: string; error?: string }> {
    try {
      const payload = {
        workspaceId,
        prospectIds: prospectIds || [], // If empty, will check all prospects in workspace
        detectionCriteria: {
          exactEmailMatch: true,
          linkedinProfileMatch: true,
          nameCompanyMatch: true,
          phoneMatch: true,
          fuzzyNameMatching: 0.85 // 85% similarity threshold
        },
        processingOptions: {
          autoMergeDuplicates: false, // Manual review required
          flagSimilarProspects: true,
          createDuplicateGroups: true
        }
      };

      const response = await fetch(`${this.BASE_WORKFLOW_URL}/${this.WORKFLOWS.DUPLICATE_DETECTION}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.VITE_N8N_API_KEY}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return { success: true, executionId: result.executionId };
    } catch (error) {
      console.error('Duplicate Detection workflow error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Trigger Lead Scoring workflow
   */
  static async triggerLeadScoring(workspaceId: string, prospectIds: string[], scoringCriteria?: Record<string, any>): Promise<{ success: boolean; executionId?: string; error?: string }> {
    try {
      const payload = {
        workspaceId,
        prospectIds,
        scoringCriteria: scoringCriteria || {
          jobTitleRelevance: 0.3,
          companySize: 0.2,
          industryMatch: 0.2,
          geographicRelevance: 0.1,
          socialPresence: 0.1,
          contactInfoCompleteness: 0.1
        },
        processingOptions: {
          updateExistingScores: true,
          createScoringEvents: true,
          triggerSegmentation: true
        }
      };

      const response = await fetch(`${this.BASE_WORKFLOW_URL}/${this.WORKFLOWS.LEAD_SCORING}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.VITE_N8N_API_KEY}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return { success: true, executionId: result.executionId };
    } catch (error) {
      console.error('Lead Scoring workflow error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Trigger Auto Campaign Assignment workflow
   */
  static async triggerAutoCampaignAssignment(workspaceId: string, prospectIds: string[], assignmentRules?: Record<string, any>): Promise<{ success: boolean; executionId?: string; error?: string }> {
    try {
      const payload = {
        workspaceId,
        prospectIds,
        assignmentRules: assignmentRules || {
          byIndustry: true,
          byJobTitle: true,
          byCompanySize: true,
          byGeography: true,
          byLeadScore: true
        },
        campaignSelectionCriteria: {
          activeCampaignsOnly: true,
          respectCapacityLimits: true,
          balanceDistribution: true
        }
      };

      const response = await fetch(`${this.BASE_WORKFLOW_URL}/${this.WORKFLOWS.AUTO_CAMPAIGN_ASSIGNMENT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.VITE_N8N_API_KEY}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return { success: true, executionId: result.executionId };
    } catch (error) {
      console.error('Auto Campaign Assignment workflow error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Get workflow execution status
   */
  static async getWorkflowExecutionStatus(executionId: string): Promise<{ status: string; data?: any; error?: string }> {
    try {
      const response = await fetch(`${this.BASE_WORKFLOW_URL}/status/${executionId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.VITE_N8N_API_KEY}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return { status: result.status, data: result.data };
    } catch (error) {
      console.error('Get workflow status error:', error);
      return { status: 'error', error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Cancel workflow execution
   */
  static async cancelWorkflowExecution(executionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.BASE_WORKFLOW_URL}/cancel/${executionId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.VITE_N8N_API_KEY}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return { success: true };
    } catch (error) {
      console.error('Cancel workflow error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Get available workflow templates
   */
  static async getWorkflowTemplates(): Promise<{ templates: any[]; error?: string }> {
    try {
      const response = await fetch(`${this.BASE_WORKFLOW_URL}/templates`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.VITE_N8N_API_KEY}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return { templates: result.templates };
    } catch (error) {
      console.error('Get workflow templates error:', error);
      return { templates: [], error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Batch trigger multiple workflows
   */
  static async batchTriggerWorkflows(triggers: N8nWorkflowTrigger[]): Promise<{ results: Array<{ success: boolean; executionId?: string; error?: string }> }> {
    const results = await Promise.allSettled(
      triggers.map(async (trigger) => {
        const response = await fetch(`${this.BASE_WORKFLOW_URL}/${trigger.workflowId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.VITE_N8N_API_KEY}`
          },
          body: JSON.stringify(trigger.payload)
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        return { success: true, executionId: result.executionId };
      })
    );

    return {
      results: results.map(result => 
        result.status === 'fulfilled' 
          ? result.value 
          : { success: false, error: result.reason.message }
      )
    };
  }
}