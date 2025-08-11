// SAM AI Campaign Assignment Rules Engine
// Validates lead eligibility for campaign assignment based on LinkedIn outreach restrictions

export interface LeadProfile {
  id: string;
  name: string;
  title?: string;
  company?: string;
  location?: string;
  linkedin_url?: string;
  email?: string;
  phone?: string;
  connection_degree?: '1st' | '2nd' | '3rd' | 'out_of_network';
  premium_account?: boolean;
  open_to_work?: boolean;
  profile_visibility?: 'public' | 'limited' | 'private';
  last_activity?: string; // ISO date
  profile_completeness?: number; // 0-100
  mutual_connections?: number;
  follower_count?: number;
  has_company_page?: boolean;
  industry?: string;
  seniority_level?: string;
  search_source: 'basic_search' | 'sales_navigator' | 'recruiter_search' | 'post_engagement' | 'csv_upload';
  profile_type?: 'individual' | 'company' | 'recruiter' | 'sales_navigator';
}

export interface CampaignProfile {
  id: string;
  name: string;
  type: 'connection_request' | 'direct_message' | 'inmail' | 'email' | 'multi_channel';
  target_audience: 'general' | 'sales_professionals' | 'recruiters' | 'c_suite' | 'specific_industry';
  connection_required: boolean;
  premium_required: boolean;
  email_required: boolean;
  phone_required: boolean;
  min_mutual_connections?: number;
  max_connection_degree?: '1st' | '2nd' | '3rd';
  allowed_search_sources: string[];
  min_profile_completeness?: number;
  excluded_industries?: string[];
  excluded_titles?: string[];
  max_leads_per_day?: number;
  current_leads_today?: number;
}

export interface ValidationRule {
  id: string;
  name: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  validator: (lead: LeadProfile, campaign: CampaignProfile) => ValidationResult;
}

export interface ValidationResult {
  isValid: boolean;
  reason?: string;
  suggestion?: string;
  severity: 'error' | 'warning' | 'info';
}

export interface CampaignAssignmentResult {
  canAssign: boolean;
  blockedReasons: string[];
  warnings: string[];
  suggestions: string[];
  validLeadsCount: number;
  totalLeadsCount: number;
  estimatedSuccessRate?: number;
}

export class SAMCampaignRulesEngine {
  private static rules: ValidationRule[] = [
    {
      id: 'linkedin_profile_required',
      name: 'LinkedIn Profile Required',
      description: 'Lead must have a valid LinkedIn profile URL',
      priority: 'critical',
      validator: (lead, campaign) => {
        if (!lead.linkedin_url || !lead.linkedin_url.includes('linkedin.com')) {
          return {
            isValid: false,
            reason: 'No valid LinkedIn profile found',
            suggestion: 'Use LinkedIn search or CSV upload with profile URLs',
            severity: 'error'
          };
        }
        return { isValid: true, severity: 'info' };
      }
    },
    {
      id: 'connection_degree_limit',
      name: 'Connection Degree Limit',
      description: 'Lead must be within allowed connection degree for campaign',
      priority: 'critical',
      validator: (lead, campaign) => {
        if (!campaign.max_connection_degree || !lead.connection_degree) {
          return { isValid: true, severity: 'info' };
        }

        const degreeOrder = { '1st': 1, '2nd': 2, '3rd': 3, 'out_of_network': 4 };
        const maxDegree = degreeOrder[campaign.max_connection_degree];
        const leadDegree = degreeOrder[lead.connection_degree];

        if (leadDegree > maxDegree) {
          return {
            isValid: false,
            reason: `Lead is ${lead.connection_degree} connection, campaign requires ${campaign.max_connection_degree} or closer`,
            suggestion: 'Connect with lead first or use different campaign type',
            severity: 'error'
          };
        }
        return { isValid: true, severity: 'info' };
      }
    },
    {
      id: 'premium_account_required',
      name: 'Premium Account Required',
      description: 'Some campaigns require leads to have LinkedIn Premium',
      priority: 'high',
      validator: (lead, campaign) => {
        if (campaign.premium_required && !lead.premium_account) {
          return {
            isValid: false,
            reason: 'Campaign requires LinkedIn Premium members only',
            suggestion: 'Filter search results for Premium members',
            severity: 'error'
          };
        }
        return { isValid: true, severity: 'info' };
      }
    },
    {
      id: 'email_required',
      name: 'Email Required',
      description: 'Email campaigns require valid email addresses',
      priority: 'critical',
      validator: (lead, campaign) => {
        if (campaign.email_required && !lead.email) {
          return {
            isValid: false,
            reason: 'Email campaign requires email addresses',
            suggestion: 'Use email finder tools or different campaign type',
            severity: 'error'
          };
        }
        return { isValid: true, severity: 'info' };
      }
    },
    {
      id: 'phone_required',
      name: 'Phone Required',
      description: 'Phone campaigns require valid phone numbers',
      priority: 'high',
      validator: (lead, campaign) => {
        if (campaign.phone_required && !lead.phone) {
          return {
            isValid: false,
            reason: 'Phone campaign requires phone numbers',
            suggestion: 'Use phone finder tools or different campaign type',
            severity: 'error'
          };
        }
        return { isValid: true, severity: 'info' };
      }
    },
    {
      id: 'search_source_compatibility',
      name: 'Search Source Compatibility',
      description: 'Campaign must support the lead search source',
      priority: 'critical',
      validator: (lead, campaign) => {
        if (!campaign.allowed_search_sources.includes(lead.search_source)) {
          return {
            isValid: false,
            reason: `Campaign doesn't support ${lead.search_source} leads`,
            suggestion: 'Use compatible search method or different campaign',
            severity: 'error'
          };
        }
        return { isValid: true, severity: 'info' };
      }
    },
    {
      id: 'profile_completeness',
      name: 'Profile Completeness',
      description: 'Lead profile must meet minimum completeness requirements',
      priority: 'medium',
      validator: (lead, campaign) => {
        if (campaign.min_profile_completeness && lead.profile_completeness) {
          if (lead.profile_completeness < campaign.min_profile_completeness) {
            return {
              isValid: false,
              reason: `Profile completeness ${lead.profile_completeness}% below minimum ${campaign.min_profile_completeness}%`,
              suggestion: 'Target leads with more complete profiles',
              severity: 'warning'
            };
          }
        }
        return { isValid: true, severity: 'info' };
      }
    },
    {
      id: 'mutual_connections_minimum',
      name: 'Mutual Connections Minimum',
      description: 'Lead must have minimum mutual connections for better response rates',
      priority: 'medium',
      validator: (lead, campaign) => {
        if (campaign.min_mutual_connections && lead.mutual_connections !== undefined) {
          if (lead.mutual_connections < campaign.min_mutual_connections) {
            return {
              isValid: false,
              reason: `Only ${lead.mutual_connections} mutual connections, minimum ${campaign.min_mutual_connections} required`,
              suggestion: 'Target leads with more mutual connections',
              severity: 'warning'
            };
          }
        }
        return { isValid: true, severity: 'info' };
      }
    },
    {
      id: 'industry_restrictions',
      name: 'Industry Restrictions',
      description: 'Lead industry must not be in excluded list',
      priority: 'high',
      validator: (lead, campaign) => {
        if (campaign.excluded_industries && lead.industry && 
            campaign.excluded_industries.includes(lead.industry)) {
          return {
            isValid: false,
            reason: `Industry "${lead.industry}" is excluded from this campaign`,
            suggestion: 'Use different campaign or filter out excluded industries',
            severity: 'error'
          };
        }
        return { isValid: true, severity: 'info' };
      }
    },
    {
      id: 'title_restrictions',
      name: 'Title Restrictions', 
      description: 'Lead title must not be in excluded list',
      priority: 'high',
      validator: (lead, campaign) => {
        if (campaign.excluded_titles && lead.title) {
          const isExcluded = campaign.excluded_titles.some(excludedTitle =>
            lead.title!.toLowerCase().includes(excludedTitle.toLowerCase())
          );
          if (isExcluded) {
            return {
              isValid: false,
              reason: `Title "${lead.title}" contains excluded keywords`,
              suggestion: 'Filter out excluded job titles',
              severity: 'error'
            };
          }
        }
        return { isValid: true, severity: 'info' };
      }
    },
    {
      id: 'daily_limit',
      name: 'Daily Limit Check',
      description: 'Campaign daily lead limit must not be exceeded',
      priority: 'critical',
      validator: (lead, campaign) => {
        if (campaign.max_leads_per_day && campaign.current_leads_today !== undefined) {
          if (campaign.current_leads_today >= campaign.max_leads_per_day) {
            return {
              isValid: false,
              reason: `Daily limit reached: ${campaign.current_leads_today}/${campaign.max_leads_per_day} leads`,
              suggestion: 'Wait until tomorrow or increase daily limit',
              severity: 'error'
            };
          }
        }
        return { isValid: true, severity: 'info' };
      }
    },
    {
      id: 'profile_privacy',
      name: 'Profile Privacy Check',
      description: 'Private profiles may have lower success rates',
      priority: 'low',
      validator: (lead, campaign) => {
        if (lead.profile_visibility === 'private') {
          return {
            isValid: true,
            reason: 'Private profile may have limited outreach success',
            suggestion: 'Consider focusing on public profiles',
            severity: 'warning'
          };
        }
        return { isValid: true, severity: 'info' };
      }
    }
  ];

  /**
   * Validate a single lead against campaign rules
   */
  static validateLeadForCampaign(
    lead: LeadProfile, 
    campaign: CampaignProfile
  ): CampaignAssignmentResult {
    const blockedReasons: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Run all validation rules
    for (const rule of this.rules) {
      const result = rule.validator(lead, campaign);
      
      if (!result.isValid) {
        if (result.severity === 'error') {
          blockedReasons.push(result.reason || 'Validation failed');
          if (result.suggestion) {
            suggestions.push(result.suggestion);
          }
        } else if (result.severity === 'warning' && result.reason) {
          warnings.push(result.reason);
          if (result.suggestion) {
            suggestions.push(result.suggestion);
          }
        }
      }
    }

    const canAssign = blockedReasons.length === 0;
    
    return {
      canAssign,
      blockedReasons,
      warnings,
      suggestions: [...new Set(suggestions)], // Remove duplicates
      validLeadsCount: canAssign ? 1 : 0,
      totalLeadsCount: 1,
      estimatedSuccessRate: this.calculateSuccessRate(lead, campaign)
    };
  }

  /**
   * Validate multiple leads against campaign rules
   */
  static validateLeadsForCampaign(
    leads: LeadProfile[], 
    campaign: CampaignProfile
  ): CampaignAssignmentResult {
    const allBlockedReasons: string[] = [];
    const allWarnings: string[] = [];
    const allSuggestions: string[] = [];
    let validLeadsCount = 0;

    for (const lead of leads) {
      const result = this.validateLeadForCampaign(lead, campaign);
      
      if (result.canAssign) {
        validLeadsCount++;
      }
      
      allBlockedReasons.push(...result.blockedReasons);
      allWarnings.push(...result.warnings);
      allSuggestions.push(...result.suggestions);
    }

    // Get unique reasons/warnings/suggestions
    const uniqueBlockedReasons = [...new Set(allBlockedReasons)];
    const uniqueWarnings = [...new Set(allWarnings)];
    const uniqueSuggestions = [...new Set(allSuggestions)];

    const canAssign = validLeadsCount > 0;

    return {
      canAssign,
      blockedReasons: uniqueBlockedReasons,
      warnings: uniqueWarnings,
      suggestions: uniqueSuggestions,
      validLeadsCount,
      totalLeadsCount: leads.length,
      estimatedSuccessRate: this.calculateBulkSuccessRate(leads, campaign)
    };
  }

  /**
   * Get campaign compatibility summary
   */
  static getCampaignCompatibility(
    leads: LeadProfile[], 
    campaigns: CampaignProfile[]
  ): Array<{
    campaign: CampaignProfile;
    compatibleLeads: number;
    totalLeads: number;
    compatibilityScore: number;
    topIssues: string[];
  }> {
    return campaigns.map(campaign => {
      const validation = this.validateLeadsForCampaign(leads, campaign);
      const compatibilityScore = (validation.validLeadsCount / validation.totalLeadsCount) * 100;
      
      // Get top 3 most common issues
      const topIssues = validation.blockedReasons
        .slice(0, 3)
        .map(reason => reason.split(':')[0]); // Take first part before colon

      return {
        campaign,
        compatibleLeads: validation.validLeadsCount,
        totalLeads: validation.totalLeadsCount,
        compatibilityScore,
        topIssues
      };
    });
  }

  /**
   * Calculate estimated success rate based on lead quality
   */
  private static calculateSuccessRate(lead: LeadProfile, campaign: CampaignProfile): number {
    let baseRate = 15; // Base 15% success rate

    // Boost for connection degree
    if (lead.connection_degree === '1st') baseRate += 25;
    else if (lead.connection_degree === '2nd') baseRate += 15;
    else if (lead.connection_degree === '3rd') baseRate += 5;

    // Boost for mutual connections
    if (lead.mutual_connections) {
      if (lead.mutual_connections >= 10) baseRate += 15;
      else if (lead.mutual_connections >= 5) baseRate += 10;
      else if (lead.mutual_connections >= 1) baseRate += 5;
    }

    // Boost for profile completeness
    if (lead.profile_completeness) {
      if (lead.profile_completeness >= 90) baseRate += 10;
      else if (lead.profile_completeness >= 70) baseRate += 5;
    }

    // Boost for premium accounts
    if (lead.premium_account) baseRate += 10;

    // Boost for open to work
    if (lead.open_to_work) baseRate += 15;

    // Penalty for private profiles
    if (lead.profile_visibility === 'private') baseRate -= 10;

    // Campaign type adjustments
    if (campaign.type === 'connection_request') baseRate += 5;
    else if (campaign.type === 'inmail') baseRate += 10;
    else if (campaign.type === 'email' && lead.email) baseRate += 20;

    return Math.min(Math.max(baseRate, 0), 85); // Cap between 0-85%
  }

  /**
   * Calculate bulk success rate
   */
  private static calculateBulkSuccessRate(leads: LeadProfile[], campaign: CampaignProfile): number {
    if (leads.length === 0) return 0;
    
    const totalSuccessRate = leads.reduce((sum, lead) => 
      sum + this.calculateSuccessRate(lead, campaign), 0
    );
    
    return Math.round(totalSuccessRate / leads.length);
  }

  /**
   * Get pre-configured campaign templates
   */
  static getCampaignTemplates(): CampaignProfile[] {
    return [
      {
        id: 'connection_request_general',
        name: 'General Connection Requests',
        type: 'connection_request',
        target_audience: 'general',
        connection_required: false,
        premium_required: false,
        email_required: false,
        phone_required: false,
        max_connection_degree: '3rd',
        allowed_search_sources: ['basic_search', 'sales_navigator', 'post_engagement'],
        min_profile_completeness: 50,
        max_leads_per_day: 100,
        current_leads_today: 0
      },
      {
        id: 'sales_outreach_premium',
        name: 'Sales Outreach (Premium)',
        type: 'direct_message',
        target_audience: 'sales_professionals',
        connection_required: true,
        premium_required: true,
        email_required: false,
        phone_required: false,
        max_connection_degree: '2nd',
        allowed_search_sources: ['sales_navigator', 'recruiter_search'],
        min_profile_completeness: 70,
        min_mutual_connections: 3,
        max_leads_per_day: 50,
        current_leads_today: 0,
        excluded_titles: ['intern', 'student', 'unemployed']
      },
      {
        id: 'email_campaign',
        name: 'Email Marketing Campaign',
        type: 'email',
        target_audience: 'general',
        connection_required: false,
        premium_required: false,
        email_required: true,
        phone_required: false,
        allowed_search_sources: ['csv_upload', 'basic_search'],
        min_profile_completeness: 30,
        max_leads_per_day: 500,
        current_leads_today: 0
      },
      {
        id: 'recruiter_outreach',
        name: 'Recruiter Outreach',
        type: 'inmail',
        target_audience: 'recruiters',
        connection_required: false,
        premium_required: false,
        email_required: false,
        phone_required: false,
        max_connection_degree: '3rd',
        allowed_search_sources: ['recruiter_search', 'basic_search'],
        min_profile_completeness: 80,
        min_mutual_connections: 1,
        max_leads_per_day: 25,
        current_leads_today: 0,
        excluded_industries: ['education', 'non-profit']
      }
    ];
  }
}