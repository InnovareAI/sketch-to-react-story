/**
 * Knowledge Base Agent - Handles company-specific information retrieval
 * Part of SAM AI Multi-Agent System
 */

import { 
  BaseAgent, 
  TaskRequest, 
  TaskResponse, 
  ConversationContext, 
  AgentConfig,
  AgentCapability 
} from '../types/AgentTypes';

export class KnowledgeBaseAgent extends BaseAgent {
  private knowledgeStore: Map<string, any> = new Map();
  private ragSystem: any = null; // Will integrate with vector database

  constructor(config: AgentConfig) {
    super('knowledge-base', config);
    this.initializeCapabilities();
  }

  private initializeCapabilities(): void {
    this.capabilities = [
      {
        name: 'company-info-retrieval',
        description: 'Retrieve information about user company, products, and services',
        supportedComplexity: ['simple', 'moderate'],
        estimatedDuration: 2,
        requiredParameters: ['query'],
        optionalParameters: ['category', 'relevanceThreshold']
      },
      {
        name: 'best-practices-guidance',
        description: 'Provide sales and marketing best practices',
        supportedComplexity: ['simple', 'moderate', 'complex'],
        estimatedDuration: 3,
        requiredParameters: ['topic'],
        optionalParameters: ['industry', 'companySize']
      },
      {
        name: 'template-retrieval',
        description: 'Find relevant email and message templates',
        supportedComplexity: ['simple', 'moderate'],
        estimatedDuration: 1,
        requiredParameters: ['templateType'],
        optionalParameters: ['industry', 'audience']
      },
      {
        name: 'qa-assistance',
        description: 'Answer general questions about sales processes and strategies',
        supportedComplexity: ['simple', 'moderate'],
        estimatedDuration: 2,
        requiredParameters: ['question'],
        optionalParameters: ['context']
      }
    ];
  }

  async initialize(): Promise<void> {
    console.log('Initializing Knowledge Base Agent...');
    
    // Initialize with default knowledge
    await this.loadDefaultKnowledge();
    
    // TODO: Initialize RAG system with vector database
    // this.ragSystem = await initializeRAG(this.config.supabase);
    
    this.isInitialized = true;
  }

  private async loadDefaultKnowledge(): Promise<void> {
    // Company Information Categories
    this.knowledgeStore.set('company-info', {
      name: 'Your Company',
      industry: 'B2B SaaS',
      targetAudience: 'Mid-market B2B companies (50-500 employees)',
      valueProposition: 'AI-powered sales automation and outreach platform',
      keyBenefits: [
        'Automated lead generation and enrichment',
        'Personalized outreach at scale',
        'Multi-channel campaign management',
        'Performance analytics and optimization',
        'CRM integration and workflow automation'
      ]
    });

    // Sales Best Practices
    this.knowledgeStore.set('best-practices', {
      emailOutreach: [
        'Personalize subject lines with company or role-specific information',
        'Keep initial emails under 100 words',
        'Include clear value proposition in first 2 lines',
        'Use social proof and specific metrics when possible',
        'Include single, clear call-to-action',
        'Follow up 3-5 times with different angles'
      ],
      linkedinOutreach: [
        'Send personalized connection requests with reason',
        'Wait 24-48 hours before first message',
        'Reference mutual connections or shared interests',
        'Ask questions to encourage engagement',
        'Share relevant content to add value',
        'Be patient with response times'
      ],
      campaignOptimization: [
        'A/B test subject lines with 10% sample size',
        'Test send times across different time zones',
        'Segment audiences by industry and role',
        'Monitor unsubscribe rates and adjust frequency',
        'Track conversation rates, not just open rates',
        'Use video messages for higher engagement'
      ]
    });

    // Templates
    this.knowledgeStore.set('templates', {
      coldEmail: {
        subject: '{{company}} + {{yourCompany}} - Quick question',
        body: `Hi {{firstName}},

I noticed {{company}} is {{specificDetail}}. We help similar {{industry}} companies {{valueProposition}}.

Quick question: {{relevantQuestion}}?

Worth a 15-minute conversation?

Best,
{{senderName}}`
      },
      linkedinConnection: {
        request: `Hi {{firstName}}, I saw your post about {{recentPost}} - very insightful! I'd love to connect and share some ideas about {{relevantTopic}}.`,
        followUp: `Thanks for connecting, {{firstName}}! I've been helping {{similarCompanies}} with {{specificBenefit}}. Would love to learn more about your current challenges at {{company}}.`
      },
      followUp: {
        email: `Hi {{firstName}},

Following up on my message about {{previousTopic}}. 

I realize you're busy, so I'll keep this brief: {{conciseBenefit}}.

If this isn't a priority right now, no worries - I'll check back in {{timeframe}}.

Best,
{{senderName}}`
      }
    });

    // FAQ Knowledge
    this.knowledgeStore.set('faq', {
      'what is sam': 'SAM is your AI-powered sales assistant that automates lead generation, outreach, and campaign optimization to help you scale your sales efforts more effectively.',
      'how does automation work': 'SAM uses a multi-agent system to handle different aspects of your sales process - from finding leads and enriching data to creating personalized content and managing outreach sequences.',
      'linkedin automation limits': 'LinkedIn allows approximately 100 connection requests per week and 300 messages per day for personal accounts. We use smart rotation and delays to maximize volume safely.',
      'email deliverability': 'We recommend warming up new domains, using authenticated sending, maintaining clean lists, and monitoring engagement rates to ensure good deliverability.',
      'roi expectations': 'Most clients see 3-5x ROI within 90 days through improved lead quality, increased response rates, and time savings from automation.',
      'integration options': 'SAM integrates with popular CRMs like HubSpot, Salesforce, and Pipedrive, plus email platforms like Gmail, Outlook, and sales tools like LinkedIn Sales Navigator.'
    });

    console.log('Default knowledge loaded successfully');
  }

  async processTask(task: TaskRequest, context: ConversationContext): Promise<TaskResponse> {
    const startTime = Date.now();

    try {
      let result: any = null;

      switch (task.type) {
        case 'knowledge-query':
          result = await this.handleKnowledgeQuery(task, context);
          break;
        case 'general-question':
          result = await this.handleGeneralQuestion(task, context);
          break;
        default:
          result = await this.handleFallback(task, context);
      }

      return this.createTaskResponse(
        task.id,
        result,
        true,
        undefined,
        {
          processingTime: Date.now() - startTime,
          knowledgeSource: 'internal'
        }
      );

    } catch (error) {
      console.error('Knowledge Base Agent error:', error);
      return this.createTaskResponse(
        task.id,
        null,
        false,
        error.message,
        { processingTime: Date.now() - startTime }
      );
    }
  }

  private async handleKnowledgeQuery(task: TaskRequest, context: ConversationContext): Promise<string> {
    const query = task.description.toLowerCase();
    
    // Search FAQ first
    const faqData = this.knowledgeStore.get('faq') as Record<string, string>;
    const faqMatch = this.findBestMatch(query, Object.keys(faqData));
    
    if (faqMatch && faqMatch.confidence > 0.6) {
      return faqData[faqMatch.key];
    }

    // Search company information
    if (this.containsKeywords(query, ['company', 'business', 'product', 'service', 'offer'])) {
      const companyInfo = this.knowledgeStore.get('company-info');
      return this.formatCompanyInfo(companyInfo, query);
    }

    // Search best practices
    if (this.containsKeywords(query, ['best practice', 'how to', 'strategy', 'optimize'])) {
      const bestPractices = this.knowledgeStore.get('best-practices');
      return this.formatBestPractices(bestPractices, query);
    }

    // Search templates
    if (this.containsKeywords(query, ['template', 'example', 'script', 'message'])) {
      const templates = this.knowledgeStore.get('templates');
      return this.formatTemplates(templates, query);
    }

    // Fallback to general guidance
    return this.generateGeneralGuidance(query, context);
  }

  private async handleGeneralQuestion(task: TaskRequest, context: ConversationContext): Promise<string> {
    const message = task.description.toLowerCase();

    // Greeting responses
    if (this.containsKeywords(message, ['hello', 'hi', 'hey', 'good morning', 'good afternoon'])) {
      const userName = context.userProfile?.name || 'there';
      return `Hello ${userName}! I'm SAM, your AI sales assistant. I'm here to help you with lead generation, campaign optimization, content creation, and performance analysis. What would you like to work on today?`;
    }

    // Help requests
    if (this.containsKeywords(message, ['help', 'assist', 'support', 'guide'])) {
      return `I'd be happy to help! Here's what I can do for you:

**🎯 Lead Generation**: Find and qualify prospects using LinkedIn Sales Navigator, Google Search, and other sources
**📧 Content Creation**: Write personalized emails, LinkedIn messages, and outreach sequences  
**📊 Campaign Optimization**: Analyze performance and provide improvement recommendations
**🤖 Automation Setup**: Configure multi-channel outreach workflows and follow-up sequences
**📈 Performance Analysis**: Deep dive into metrics, ROI, and conversion data

What specific area would you like to explore?`;
    }

    // Capability questions
    if (this.containsKeywords(message, ['what can you do', 'capabilities', 'features'])) {
      return this.describeCapabilities();
    }

    // Default response for general questions
    return `I'd be happy to help you with that! Could you provide a bit more context about what specifically you'd like to know? I can assist with lead generation, campaign optimization, content creation, automation setup, and performance analysis.`;
  }

  private async handleFallback(task: TaskRequest, context: ConversationContext): Promise<string> {
    // Try to provide helpful response based on task type
    switch (task.type) {
      case 'lead-generation':
        return "I can help you find qualified leads! To get started, I'll need to know more about your target audience - what industry, company size, and roles are you targeting?";
      case 'campaign-optimization':
        return "Great! I can help optimize your campaigns. Could you share your current performance metrics or specific areas you'd like to improve?";
      case 'content-creation':
        return "I'd love to help create compelling content. What type do you need? Email templates, LinkedIn messages, or something else?";
      default:
        return "I understand you need help with that. Could you provide more details so I can give you the most relevant assistance?";
    }
  }

  private findBestMatch(query: string, keys: string[]): { key: string; confidence: number } | null {
    let bestMatch = { key: '', confidence: 0 };

    for (const key of keys) {
      const confidence = this.calculateSimilarity(query, key);
      if (confidence > bestMatch.confidence) {
        bestMatch = { key, confidence };
      }
    }

    return bestMatch.confidence > 0.3 ? bestMatch : null;
  }

  private calculateSimilarity(str1: string, str2: string): number {
    const words1 = str1.toLowerCase().split(/\s+/);
    const words2 = str2.toLowerCase().split(/\s+/);
    
    let matches = 0;
    for (const word1 of words1) {
      for (const word2 of words2) {
        if (word1.includes(word2) || word2.includes(word1)) {
          matches++;
          break;
        }
      }
    }

    return matches / Math.max(words1.length, words2.length);
  }

  private containsKeywords(text: string, keywords: string[]): boolean {
    return keywords.some(keyword => text.includes(keyword.toLowerCase()));
  }

  private formatCompanyInfo(companyInfo: any, query: string): string {
    if (!companyInfo) return "I don't have specific company information stored yet. You can help me learn about your business!";

    return `**Company Overview:**
• **Name**: ${companyInfo.name}
• **Industry**: ${companyInfo.industry}
• **Target Audience**: ${companyInfo.targetAudience}
• **Value Proposition**: ${companyInfo.valueProposition}

**Key Benefits:**
${companyInfo.keyBenefits.map((benefit: string) => `• ${benefit}`).join('\n')}

Would you like me to help you refine any of this information or create content based on it?`;
  }

  private formatBestPractices(bestPractices: any, query: string): string {
    if (!bestPractices) return "I can provide best practices guidance. What specific area are you interested in?";

    // Determine which best practices are most relevant
    let relevantPractices = '';
    
    if (this.containsKeywords(query, ['email', 'outreach', 'cold email'])) {
      relevantPractices = `**Email Outreach Best Practices:**
${bestPractices.emailOutreach.map((tip: string) => `• ${tip}`).join('\n')}`;
    } else if (this.containsKeywords(query, ['linkedin', 'social', 'connection'])) {
      relevantPractices = `**LinkedIn Outreach Best Practices:**
${bestPractices.linkedinOutreach.map((tip: string) => `• ${tip}`).join('\n')}`;
    } else if (this.containsKeywords(query, ['campaign', 'optimize', 'performance'])) {
      relevantPractices = `**Campaign Optimization Best Practices:**
${bestPractices.campaignOptimization.map((tip: string) => `• ${tip}`).join('\n')}`;
    } else {
      // Show all categories
      relevantPractices = `**Email Outreach:**
${bestPractices.emailOutreach.slice(0, 3).map((tip: string) => `• ${tip}`).join('\n')}

**LinkedIn Outreach:**
${bestPractices.linkedinOutreach.slice(0, 3).map((tip: string) => `• ${tip}`).join('\n')}

**Campaign Optimization:**
${bestPractices.campaignOptimization.slice(0, 3).map((tip: string) => `• ${tip}`).join('\n')}`;
    }

    return relevantPractices + "\n\nWould you like me to elaborate on any of these points or help you implement them?";
  }

  private formatTemplates(templates: any, query: string): string {
    if (!templates) return "I can provide templates for various outreach scenarios. What type of template do you need?";

    // Determine which templates are most relevant
    if (this.containsKeywords(query, ['cold email', 'email template', 'first email'])) {
      return `**Cold Email Template:**

**Subject:** ${templates.coldEmail.subject}

${templates.coldEmail.body}

This template includes personalization placeholders that can be automatically filled based on your prospect data. Would you like me to help customize it for a specific audience?`;
    } else if (this.containsKeywords(query, ['linkedin', 'connection request', 'linkedin message'])) {
      return `**LinkedIn Templates:**

**Connection Request:**
${templates.linkedinConnection.request}

**Follow-up Message:**
${templates.linkedinConnection.followUp}

These templates focus on personalization and value-first messaging. Would you like variations for different industries?`;
    } else if (this.containsKeywords(query, ['follow up', 'followup', 'second email'])) {
      return `**Follow-up Email Template:**

${templates.followUp.email}

This template maintains persistence while being respectful of the prospect's time. Would you like to see a sequence of multiple follow-ups?`;
    } else {
      return `I have templates available for:
• **Cold Email**: Initial outreach with value proposition
• **LinkedIn Messages**: Connection requests and follow-ups  
• **Follow-up Emails**: Persistent but polite re-engagement

Which type would you like to see? I can also customize them for your specific industry or audience.`;
    }
  }

  private generateGeneralGuidance(query: string, context: ConversationContext): string {
    const userProfile = context.userProfile;
    const baseGuidance = `Based on your query, here's what I recommend:

If you're looking to improve your sales process, I suggest starting with these key areas:
• **Define your ideal customer profile** clearly
• **Personalize your outreach messages** with specific company details
• **Test and optimize** your approach based on response data
• **Follow up consistently** with value-added content

`;

    if (userProfile?.targetAudience) {
      return baseGuidance + `Since you're targeting ${userProfile.targetAudience}, I can help you create specific strategies for that market segment.`;
    }

    return baseGuidance + "Would you like me to help you develop a specific strategy for any of these areas?";
  }

  private describeCapabilities(): string {
    return `Here's what I can help you with:

**🎯 Lead Generation & Research**
• Find prospects on LinkedIn Sales Navigator
• Enrich contact data with emails and phone numbers
• Research company information and recent news
• Identify website visitors in real-time

**📧 Content Creation & Personalization** 
• Write compelling email templates and subject lines
• Create personalized LinkedIn messages
• Generate video scripts and visual content
• Develop multi-touch outreach sequences

**🚀 Campaign Automation & Optimization**
• Set up automated email and LinkedIn sequences  
• A/B test different messaging approaches
• Optimize send times and frequency
• Manage follow-up workflows

**📊 Analytics & Performance**
• Track open rates, response rates, and conversions
• Analyze campaign performance and ROI
• Provide optimization recommendations
• Generate detailed reports and insights

**🧠 Knowledge & Strategy**
• Answer questions about sales best practices
• Provide industry-specific guidance
• Share templates and proven strategies
• Help plan and execute sales campaigns

What would you like to dive into first?`;
  }

  getCapabilities(): AgentCapability[] {
    return this.capabilities;
  }

  async healthCheck(): Promise<boolean> {
    // Check if knowledge store is accessible
    return this.isInitialized && this.knowledgeStore.size > 0;
  }

  async shutdown(): Promise<void> {
    this.knowledgeStore.clear();
    if (this.ragSystem) {
      // Cleanup RAG system resources
      this.ragSystem = null;
    }
    this.isInitialized = false;
    console.log('Knowledge Base Agent shut down');
  }
}