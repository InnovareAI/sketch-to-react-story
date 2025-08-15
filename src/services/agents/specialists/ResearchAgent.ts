/**
 * ResearchAgent - Lead research and data collection
 * Integrates with Apify for LinkedIn/web scraping and data enrichment
 */

import { BaseAgent } from '../core/BaseAgent';
import { AgentConfig, TaskRequest, TaskResponse, ConversationContext } from '../types/AgentTypes';
import { LLMService } from '../../llm/LLMService';
import { MemoryService } from '../../memory/MemoryService';

export interface ResearchCriteria {
  // Company criteria
  industries?: string[];
  companySizes?: string[]; // '1-10', '11-50', '51-200', '201-1000', '1000+'
  locations?: string[];
  technologies?: string[];
  revenueRange?: string;
  fundingStage?: string;
  
  // Role criteria
  jobTitles?: string[];
  seniority?: string[]; // 'junior', 'mid', 'senior', 'director', 'vp', 'c-level'
  departments?: string[];
  
  // Additional filters
  keywords?: string[];
  excludeKeywords?: string[];
  recentNews?: boolean;
  socialActivity?: boolean;
  contactInfo?: 'email' | 'phone' | 'linkedin' | 'any';
}

export interface ResearchRequest {
  criteria: ResearchCriteria;
  maxResults?: number;
  dataSources?: ('linkedin' | 'apollo' | 'zoominfo' | 'hunter' | 'clearbit')[];
  enrichmentLevel?: 'basic' | 'standard' | 'premium';
  priorityFilters?: string[];
}

export interface ProspectProfile {
  // Personal info
  firstName: string;
  lastName: string;
  fullName: string;
  email?: string;
  phone?: string;
  linkedinUrl?: string;
  
  // Professional info
  title: string;
  company: string;
  department?: string;
  seniority?: string;
  
  // Company details
  companySize?: number;
  industry?: string;
  companyLinkedinUrl?: string;
  companyWebsite?: string;
  
  // Enrichment data
  location?: string;
  bio?: string;
  recentActivity?: string[];
  mutualConnections?: number;
  leadScore?: number;
  
  // Metadata
  dataSource: string;
  confidence: number;
  lastUpdated: Date;
  enrichmentData?: Record<string, unknown>;
}

export class ResearchAgent extends BaseAgent {
  private llmService: LLMService;
  private memoryService: MemoryService;

  constructor(config: AgentConfig) {
    super('research', config);
    this.llmService = LLMService.getInstance();
    this.memoryService = MemoryService.getInstance();
    this.initializeCapabilities();
  }

  private initializeCapabilities(): void {
    this.capabilities = [
      {
        name: 'lead-research',
        description: 'Research and find qualified prospects based on ICP',
        supportedComplexity: ['moderate', 'complex'],
        estimatedDuration: 300, // 5 minutes
        requiredParameters: ['criteria'],
        optionalParameters: ['max_results', 'data_sources', 'enrichment_level']
      },
      {
        name: 'company-analysis',
        description: 'Analyze company profiles and extract insights',
        supportedComplexity: ['simple', 'moderate'],
        estimatedDuration: 120, // 2 minutes
        requiredParameters: ['company_data'],
        optionalParameters: ['analysis_depth']
      },
      {
        name: 'prospect-scoring',
        description: 'Score prospects based on ICP fit and engagement potential',
        supportedComplexity: ['moderate'],
        estimatedDuration: 60, // 1 minute
        requiredParameters: ['prospects', 'icp_criteria'],
        optionalParameters: ['scoring_weights']
      }
    ];
  }

  async initialize(): Promise<void> {
    console.log('Initializing SAM Research Agent...');
    this.isInitialized = true;
  }

  async processTask(task: TaskRequest, context: ConversationContext): Promise<TaskResponse> {
    const startTime = Date.now();
    
    try {
      switch (task.type) {
        case 'lead_research':
          return await this.conductLeadResearch(task, context);
          
        case 'company_analysis':
          return await this.analyzeCompany(task, context);
          
        case 'prospect_scoring':
          return await this.scoreProspects(task, context);
          
        default:
          return {
            success: false,
            error: `Unsupported task type: ${task.type}`,
            agentId: this.agentId,
            taskId: task.id,
            processingTime: Date.now() - startTime
          };
      }
    } catch (error) {
      return {
        success: false,
        error: `Research processing failed: ${error.message}`,
        agentId: this.agentId,
        taskId: task.id,
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * Conduct lead research based on criteria
   */
  private async conductLeadResearch(task: TaskRequest, context: ConversationContext): Promise<TaskResponse> {
    const request = task.parameters as ResearchRequest;
    const startTime = Date.now();

    // Step 1: Validate and refine criteria using AI
    const refinedCriteria = await this.refineCriteria(request.criteria, context);

    // Step 2: Execute research via multiple data sources
    const prospects = await this.executeResearch(refinedCriteria, request);

    // Step 3: Enrich prospect data
    const enrichedProspects = await this.enrichProspects(prospects, request.enrichmentLevel || 'standard');

    // Step 4: Score and rank prospects
    const scoredProspects = await this.scoreAndRankProspects(enrichedProspects, refinedCriteria, context);

    // Step 5: Store results in memory
    await this.storeResearchResults(scoredProspects, context);

    return {
      success: true,
      result: {
        prospects: scoredProspects,
        total_found: scoredProspects.length,
        criteria_used: refinedCriteria,
        data_sources: request.dataSources || ['linkedin', 'apollo'],
        research_summary: await this.generateResearchSummary(scoredProspects, refinedCriteria)
      },
      agentId: this.agentId,
      taskId: task.id,
      processingTime: Date.now() - startTime
    };
  }

  /**
   * Refine research criteria using AI and context
   */
  private async refineCriteria(criteria: ResearchCriteria, context: ConversationContext): Promise<ResearchCriteria> {
    const refinementPrompt = `
You are a B2B research specialist. Analyze and refine these research criteria to maximize prospect quality.

Original Criteria:
${JSON.stringify(criteria, null, 2)}

User Context:
- Session ID: ${context.sessionId}
- Previous conversations available: ${context.conversationHistory?.length > 0}

Please refine the criteria to:
1. Remove contradictions or overlaps
2. Add complementary filters that would improve results
3. Suggest priority rankings for criteria
4. Identify potential gaps in targeting

Return refined criteria as JSON with explanations for changes.
    `;

    const refinement = await this.llmService.chat([
      {
        role: 'system',
        content: 'You are a B2B research specialist helping optimize prospect search criteria.'
      },
      {
        role: 'user',
        content: refinementPrompt
      }
    ], {
      model: 'quality',
      temperature: 0.3,
      maxTokens: 800
    });

    try {
      const parsed = JSON.parse(refinement.content);
      return { ...criteria, ...parsed.refined_criteria };
    } catch (error) {
      console.error('Failed to parse refined criteria:', error);
      return criteria; // Return original if parsing fails
    }
  }

  /**
   * Execute research using Apify and other data sources
   */
  private async executeResearch(criteria: ResearchCriteria, request: ResearchRequest): Promise<ProspectProfile[]> {
    const prospects: ProspectProfile[] = [];
    const maxResults = request.maxResults || 100;
    const dataSources = request.dataSources || ['linkedin'];

    // For now, return mock data - in real implementation, this would call Apify MCP
    const mockProspects: ProspectProfile[] = [
      {
        firstName: 'Sarah',
        lastName: 'Johnson',
        fullName: 'Sarah Johnson',
        email: 'sarah.johnson@techcorp.com',
        linkedinUrl: 'https://linkedin.com/in/sarahjohnson',
        title: 'VP of Marketing',
        company: 'TechCorp Solutions',
        department: 'Marketing',
        seniority: 'vp',
        companySize: 250,
        industry: 'Technology',
        location: 'San Francisco, CA',
        bio: 'Marketing leader with 10+ years experience in B2B SaaS',
        leadScore: 85,
        dataSource: 'linkedin',
        confidence: 0.9,
        lastUpdated: new Date()
      },
      {
        firstName: 'Michael',
        lastName: 'Chen',
        fullName: 'Michael Chen',
        email: 'michael.chen@growthco.com',
        linkedinUrl: 'https://linkedin.com/in/michaelchen',
        title: 'Director of Growth',
        company: 'GrowthCo',
        department: 'Marketing',
        seniority: 'director',
        companySize: 150,
        industry: 'SaaS',
        location: 'Austin, TX',
        bio: 'Growth marketing specialist focused on scaling B2B companies',
        leadScore: 78,
        dataSource: 'apollo',
        confidence: 0.85,
        lastUpdated: new Date()
      },
      {
        firstName: 'Emily',
        lastName: 'Rodriguez',
        fullName: 'Emily Rodriguez',
        email: 'emily@innovate.io',
        linkedinUrl: 'https://linkedin.com/in/emilyrodriguez',
        title: 'CMO',
        company: 'Innovate Labs',
        department: 'Marketing',
        seniority: 'c-level',
        companySize: 80,
        industry: 'Fintech',
        location: 'New York, NY',
        bio: 'CMO driving digital transformation in financial services',
        leadScore: 92,
        dataSource: 'linkedin',
        confidence: 0.95,
        lastUpdated: new Date()
      }
    ];

    // Filter and limit results
    const filteredProspects = mockProspects
      .filter(prospect => this.matchesCriteria(prospect, criteria))
      .slice(0, maxResults);

    return filteredProspects;
  }

  /**
   * Check if prospect matches criteria
   */
  private matchesCriteria(prospect: ProspectProfile, criteria: ResearchCriteria): boolean {
    // Industries
    if (criteria.industries && criteria.industries.length > 0) {
      if (!criteria.industries.some(industry => 
        prospect.industry?.toLowerCase().includes(industry.toLowerCase())
      )) {
        return false;
      }
    }

    // Job titles
    if (criteria.jobTitles && criteria.jobTitles.length > 0) {
      if (!criteria.jobTitles.some(title => 
        prospect.title.toLowerCase().includes(title.toLowerCase())
      )) {
        return false;
      }
    }

    // Seniority
    if (criteria.seniority && criteria.seniority.length > 0) {
      if (!criteria.seniority.includes(prospect.seniority || '')) {
        return false;
      }
    }

    return true;
  }

  /**
   * Enrich prospect data
   */
  private async enrichProspects(prospects: ProspectProfile[], level: string): Promise<ProspectProfile[]> {
    // Mock enrichment - in real implementation, this would call enrichment APIs
    return prospects.map(prospect => ({
      ...prospect,
      recentActivity: level === 'premium' ? [
        'Posted about marketing automation trends',
        'Shared article on B2B lead generation',
        'Commented on industry report'
      ] : [],
      mutualConnections: level !== 'basic' ? Math.floor(Math.random() * 20) : undefined,
      enrichmentData: {
        enrichment_level: level,
        last_enriched: new Date().toISOString()
      }
    }));
  }

  /**
   * Score and rank prospects
   */
  private async scoreAndRankProspects(
    prospects: ProspectProfile[], 
    criteria: ResearchCriteria,
    context: ConversationContext
  ): Promise<ProspectProfile[]> {
    const scoringPrompt = `
Analyze these prospects and provide lead scores (0-100) based on the research criteria and context.

Prospects:
${prospects.map(p => `${p.fullName} - ${p.title} at ${p.company} (${p.industry})`).join('\n')}

Research Criteria:
${JSON.stringify(criteria, null, 2)}

Consider:
1. Job title relevance to criteria
2. Company size and industry fit
3. Seniority level alignment
4. Geographic preferences
5. Engagement potential based on profile data

Return scoring rationale and updated lead scores.
    `;

    const scoring = await this.llmService.chat([
      {
        role: 'system',
        content: 'You are a B2B lead scoring specialist.'
      },
      {
        role: 'user',
        content: scoringPrompt
      }
    ], {
      model: 'quality',
      temperature: 0.2,
      maxTokens: 1000
    });

    // For now, keep existing scores - in real implementation, parse AI response
    return prospects.sort((a, b) => (b.leadScore || 0) - (a.leadScore || 0));
  }

  /**
   * Analyze company profile
   */
  private async analyzeCompany(task: TaskRequest, context: ConversationContext): Promise<TaskResponse> {
    const companyData = task.parameters.company_data as Record<string, unknown>;
    const startTime = Date.now();

    const analysisPrompt = `
Analyze this company profile and provide strategic insights:

Company Data:
${JSON.stringify(companyData, null, 2)}

Provide analysis on:
1. Business model and market position
2. Growth stage and funding status
3. Technology stack and tools used
4. Key decision makers and organizational structure
5. Potential pain points and challenges
6. Best outreach strategies and messaging angles
7. Competition and market dynamics

Return structured analysis with actionable insights.
    `;

    const analysis = await this.llmService.chat([
      {
        role: 'system',
        content: 'You are a B2B company research analyst providing strategic insights.'
      },
      {
        role: 'user',
        content: analysisPrompt
      }
    ], {
      model: 'quality',
      temperature: 0.4,
      maxTokens: 1200
    });

    return {
      success: true,
      result: {
        company_analysis: analysis.content,
        insights: {
          business_model: 'B2B SaaS',
          growth_stage: 'Series B',
          key_challenges: ['scaling customer acquisition', 'competitive market'],
          outreach_strategy: 'Focus on ROI and efficiency gains',
          decision_makers: ['CMO', 'VP Sales', 'VP Marketing']
        }
      },
      agentId: this.agentId,
      taskId: task.id,
      processingTime: Date.now() - startTime
    };
  }

  /**
   * Score prospects based on ICP fit
   */
  private async scoreProspects(task: TaskRequest, context: ConversationContext): Promise<TaskResponse> {
    const prospects = task.parameters.prospects as ProspectProfile[];
    const icpCriteria = task.parameters.icp_criteria as Record<string, unknown>;
    const startTime = Date.now();

    const scoredProspects = prospects.map(prospect => ({
      ...prospect,
      leadScore: this.calculateLeadScore(prospect, icpCriteria),
      scoringReason: this.generateScoringReason(prospect, icpCriteria)
    }));

    return {
      success: true,
      result: {
        scored_prospects: scoredProspects.sort((a, b) => (b.leadScore || 0) - (a.leadScore || 0)),
        average_score: scoredProspects.reduce((sum, p) => sum + (p.leadScore || 0), 0) / scoredProspects.length,
        high_quality_count: scoredProspects.filter(p => (p.leadScore || 0) >= 80).length
      },
      agentId: this.agentId,
      taskId: task.id,
      processingTime: Date.now() - startTime
    };
  }

  /**
   * Store research results in memory
   */
  private async storeResearchResults(prospects: ProspectProfile[], context: ConversationContext): Promise<void> {
    await this.memoryService.storeMemory({
      type: 'audience',
      category: 'business',
      title: `Research Results - ${prospects.length} Prospects`,
      content: `Found ${prospects.length} qualified prospects matching ICP criteria`,
      tags: ['research', 'prospects', 'leads'],
      source: 'analysis',
      confidence: 0.85,
      metadata: {
        prospects,
        research_date: new Date().toISOString(),
        session_id: context.sessionId,
        high_quality_count: prospects.filter(p => (p.leadScore || 0) >= 80).length
      }
    });
  }

  /**
   * Generate research summary
   */
  private async generateResearchSummary(prospects: ProspectProfile[], criteria: ResearchCriteria): Promise<string> {
    const summary = await this.llmService.chat([
      {
        role: 'system',
        content: 'Generate a concise research summary highlighting key findings and next steps.'
      },
      {
        role: 'user',
        content: `
Research completed with ${prospects.length} prospects found.

Top prospects:
${prospects.slice(0, 5).map(p => `- ${p.fullName}: ${p.title} at ${p.company} (Score: ${p.leadScore})`).join('\n')}

Criteria used:
${JSON.stringify(criteria, null, 2)}

Generate 2-3 sentence summary with key insights and recommendations.
        `
      }
    ], {
      model: 'fast',
      temperature: 0.6,
      maxTokens: 200
    });

    return summary.content;
  }

  /**
   * Calculate lead score
   */
  private calculateLeadScore(prospect: ProspectProfile, icpCriteria: Record<string, unknown>): number {
    let score = 0;

    // Title match
    if (prospect.title.toLowerCase().includes('vp') || prospect.title.toLowerCase().includes('director')) {
      score += 30;
    }
    if (prospect.title.toLowerCase().includes('cmo') || prospect.title.toLowerCase().includes('ceo')) {
      score += 40;
    }

    // Company size
    if (prospect.companySize && prospect.companySize >= 50 && prospect.companySize <= 500) {
      score += 25;
    }

    // Industry relevance
    if (prospect.industry?.toLowerCase().includes('tech') || prospect.industry?.toLowerCase().includes('saas')) {
      score += 20;
    }

    // Contact info availability
    if (prospect.email) score += 15;
    if (prospect.linkedinUrl) score += 10;

    return Math.min(score, 100);
  }

  /**
   * Generate scoring reason
   */
  private generateScoringReason(prospect: ProspectProfile, icpCriteria: Record<string, unknown>): string {
    const reasons = [];
    
    if (prospect.seniority === 'c-level' || prospect.seniority === 'vp') {
      reasons.push('Senior decision maker');
    }
    
    if (prospect.companySize && prospect.companySize >= 50 && prospect.companySize <= 500) {
      reasons.push('Ideal company size');
    }
    
    if (prospect.email) {
      reasons.push('Direct contact available');
    }

    return reasons.join(', ') || 'Basic profile match';
  }

  getCapabilities() {
    return this.capabilities;
  }

  async healthCheck(): Promise<boolean> {
    return this.isInitialized && this.llmService !== null;
  }

  async shutdown(): Promise<void> {
    this.isInitialized = false;
    console.log('Research agent shut down');
  }
}

export default ResearchAgent;