/**
 * Onboarding Agent - Handles new client onboarding and profile building
 * Triggers on LinkedIn account connection and guides comprehensive setup
 */

import { 
  BaseAgent, 
  TaskRequest, 
  TaskResponse, 
  ConversationContext, 
  AgentConfig,
  AgentCapability 
} from '../types/AgentTypes';

interface OnboardingStage {
  id: string;
  name: string;
  description: string;
  questions: OnboardingQuestion[];
  order: number;
  isComplete: boolean;
  completionScore: number;
}

interface OnboardingQuestion {
  id: string;
  question: string;
  type: 'text' | 'multiple-choice' | 'scale' | 'multi-select' | 'long-text';
  options?: string[];
  required: boolean;
  followUp?: string[];
  category: 'company' | 'offer' | 'audience' | 'pain-points' | 'competitors' | 'goals' | 'messaging';
  weight: number; // for completion scoring
}

interface ClientProfile {
  id: string;
  companyInfo: {
    name: string;
    industry: string;
    size: string;
    stage: string;
    website: string;
    description: string;
  };
  offering: {
    productName: string;
    category: string;
    valueProposition: string;
    keyFeatures: string[];
    benefits: string[];
    pricing: {
      model: string;
      range: string;
      competitive: string;
    };
    differentiators: string[];
  };
  targetAudience: {
    primaryPersona: {
      title: string;
      department: string;
      seniority: string;
      companySize: string[];
      industries: string[];
      painPoints: string[];
      goals: string[];
      challenges: string[];
    };
    secondaryPersonas?: {
      title: string;
      department: string;
      seniority: string;
      relevance: number;
    }[];
  };
  competitors: {
    primary: string[];
    secondary: string[];
    strengths: Record<string, string[]>;
    weaknesses: Record<string, string[]>;
  };
  messaging: {
    mainValueProp: string;
    keyMessages: string[];
    callToActions: string[];
    toneOfVoice: string;
    avoidanceWords: string[];
  };
  goals: {
    primary: string;
    metrics: string[];
    timeline: string;
    constraints: string[];
  };
  campaigns: {
    preferences: string[];
    channels: string[];
    frequency: string;
    budget: string;
  };
}

export class OnboardingAgent extends BaseAgent {
  private onboardingStages: OnboardingStage[] = [];
  private ragPromptTemplate: string = "";
  private supabaseClient: unknown = null;

  constructor(config: AgentConfig) {
    super('knowledge-base', config);
    this.initializeCapabilities();
  }

  private initializeCapabilities(): void {
    this.capabilities = [
      {
        name: 'linkedin-connection-trigger',
        description: 'Initiate onboarding when LinkedIn account is connected',
        supportedComplexity: ['moderate'],
        estimatedDuration: 5,
        requiredParameters: ['linkedinAccountInfo'],
        optionalParameters: ['existingProfile']
      },
      {
        name: 'guided-questionnaire',
        description: 'Conduct structured onboarding questionnaire with intelligent follow-ups',
        supportedComplexity: ['moderate', 'complex'],
        estimatedDuration: 25,
        requiredParameters: ['userId', 'stage'],
        optionalParameters: ['previousAnswers', 'skipCompleted']
      },
      {
        name: 'profile-building',
        description: 'Build comprehensive client profile from onboarding responses',
        supportedComplexity: ['complex'],
        estimatedDuration: 8,
        requiredParameters: ['onboardingData'],
        optionalParameters: ['existingProfile', 'enrichmentData']
      },
      {
        name: 'rag-training',
        description: 'Generate and store RAG training data from client profile',
        supportedComplexity: ['complex'],
        estimatedDuration: 10,
        requiredParameters: ['clientProfile'],
        optionalParameters: ['updateExisting']
      },
      {
        name: 'campaign-ideation',
        description: 'Generate initial campaign strategies based on client profile',
        supportedComplexity: ['complex', 'expert'],
        estimatedDuration: 15,
        requiredParameters: ['clientProfile'],
        optionalParameters: ['campaignType', 'budget', 'timeline']
      }
    ];
  }

  async initialize(): Promise<void> {
    console.log('Initializing Onboarding Agent...');
    
    // Initialize Supabase client
    if (this.config.supabase) {
      try {
        // This would be the actual Supabase client initialization
        // this.supabaseClient = createClient(this.config.supabase.url, this.config.supabase.serviceKey);
        console.log('Supabase client initialized');
      } catch (error) {
        console.error('Failed to initialize Supabase:', error);
      }
    }

    // Load onboarding stages and questions
    await this.loadOnboardingStages();
    
    // Initialize RAG prompt template
    this.loadRAGPromptTemplate();
    
    this.isInitialized = true;
  }

  private async loadOnboardingStages(): Promise<void> {
    this.onboardingStages = [
      {
        id: 'company-setup',
        name: 'Company & Business Setup',
        description: 'Understanding your business fundamentals',
        order: 1,
        isComplete: false,
        completionScore: 0,
        questions: [
          {
            id: 'company-name',
            question: "What's your company name?",
            type: 'text',
            required: true,
            category: 'company',
            weight: 0.1
          },
          {
            id: 'company-website',
            question: "What's your company website?",
            type: 'text',
            required: true,
            category: 'company',
            weight: 0.1
          },
          {
            id: 'industry',
            question: "What industry are you in?",
            type: 'multiple-choice',
            options: [
              'Technology/Software', 'Financial Services', 'Healthcare', 'Manufacturing',
              'Professional Services', 'E-commerce', 'Education', 'Real Estate',
              'Marketing/Advertising', 'Other'
            ],
            required: true,
            category: 'company',
            weight: 0.15
          },
          {
            id: 'company-size',
            question: "How many employees does your company have?",
            type: 'multiple-choice',
            options: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'],
            required: true,
            category: 'company',
            weight: 0.1
          },
          {
            id: 'company-stage',
            question: "What stage is your company in?",
            type: 'multiple-choice',
            options: ['Startup (Pre-Revenue)', 'Early Stage (0-1M ARR)', 'Growth Stage (1-10M ARR)', 'Scale Stage (10M+ ARR)', 'Enterprise (100M+ ARR)'],
            required: true,
            category: 'company',
            weight: 0.15
          },
          {
            id: 'company-description',
            question: "In 2-3 sentences, describe what your company does:",
            type: 'long-text',
            required: true,
            category: 'company',
            weight: 0.2
          }
        ]
      },
      {
        id: 'product-offering',
        name: 'Product/Service Offering',
        description: 'Defining what you sell and its value',
        order: 2,
        isComplete: false,
        completionScore: 0,
        questions: [
          {
            id: 'product-name',
            question: "What's the name of your main product or service?",
            type: 'text',
            required: true,
            category: 'offer',
            weight: 0.1
          },
          {
            id: 'product-category',
            question: "What category best describes your offering?",
            type: 'multiple-choice',
            options: [
              'B2B SaaS Platform', 'Professional Services', 'E-commerce Product',
              'Hardware/Physical Product', 'Consulting Services', 'Digital Marketing Services',
              'Educational/Training', 'Financial Services', 'Other'
            ],
            required: true,
            category: 'offer',
            weight: 0.15
          },
          {
            id: 'value-proposition',
            question: "In one sentence, what's your main value proposition? (What problem do you solve and for whom?)",
            type: 'long-text',
            required: true,
            category: 'offer',
            weight: 0.25,
            followUp: [
              "Can you give me a specific example of this problem?",
              "How much does this problem typically cost your customers?"
            ]
          },
          {
            id: 'key-features',
            question: "What are your top 5 key features or capabilities?",
            type: 'multi-select',
            options: [], // Will be generated based on category
            required: true,
            category: 'offer',
            weight: 0.15
          },
          {
            id: 'key-benefits',
            question: "What are the main benefits customers get from using your product/service?",
            type: 'multi-select',
            options: [
              'Save Time', 'Reduce Costs', 'Increase Revenue', 'Improve Efficiency',
              'Better Decision Making', 'Risk Reduction', 'Competitive Advantage',
              'Scalability', 'Compliance', 'Customer Satisfaction'
            ],
            required: true,
            category: 'offer',
            weight: 0.2
          },
          {
            id: 'pricing-model',
            question: "What's your pricing model?",
            type: 'multiple-choice',
            options: [
              'Monthly Subscription', 'Annual Subscription', 'Per User/Seat',
              'Usage-Based', 'One-Time Purchase', 'Custom/Enterprise',
              'Freemium', 'Commission/Rev Share'
            ],
            required: true,
            category: 'offer',
            weight: 0.1
          },
          {
            id: 'price-range',
            question: "What's your typical price range?",
            type: 'multiple-choice',
            options: [
              'Under $100/month', '$100-500/month', '$500-2000/month',
              '$2000-5000/month', '$5000-10000/month', '$10000+/month',
              'Project-based pricing', 'Custom enterprise pricing'
            ],
            required: false,
            category: 'offer',
            weight: 0.05
          }
        ]
      },
      {
        id: 'target-audience',
        name: 'Ideal Customer Profile',
        description: 'Defining your perfect customer',
        order: 3,
        isComplete: false,
        completionScore: 0,
        questions: [
          {
            id: 'target-title',
            question: "What job titles do your ideal customers typically have?",
            type: 'multi-select',
            options: [
              'CEO/Founder', 'CTO/VP Engineering', 'CMO/VP Marketing', 'CRO/VP Sales',
              'CFO/Finance', 'COO/Operations', 'Director', 'Manager', 'Specialist/Individual Contributor'
            ],
            required: true,
            category: 'audience',
            weight: 0.2
          },
          {
            id: 'target-department',
            question: "Which departments do they typically work in?",
            type: 'multi-select',
            options: [
              'Sales', 'Marketing', 'Engineering/IT', 'Operations', 'Finance',
              'HR', 'Customer Success', 'Business Development', 'Product', 'Executive'
            ],
            required: true,
            category: 'audience',
            weight: 0.15
          },
          {
            id: 'target-company-size',
            question: "What size companies do your ideal customers work at?",
            type: 'multi-select',
            options: ['Startup (1-10)', 'Small (11-50)', 'Medium (51-200)', 'Large (201-1000)', 'Enterprise (1000+)'],
            required: true,
            category: 'audience',
            weight: 0.15
          },
          {
            id: 'target-industries',
            question: "Which industries do your best customers come from?",
            type: 'multi-select',
            options: [
              'Technology/Software', 'Financial Services', 'Healthcare', 'Manufacturing',
              'Professional Services', 'E-commerce', 'Education', 'Real Estate',
              'Marketing/Advertising', 'SaaS', 'Consulting', 'Non-profit'
            ],
            required: true,
            category: 'audience',
            weight: 0.15
          },
          {
            id: 'customer-goals',
            question: "What are your ideal customers typically trying to achieve?",
            type: 'multi-select',
            options: [
              'Increase Revenue', 'Reduce Costs', 'Improve Efficiency', 'Scale Operations',
              'Better Customer Experience', 'Competitive Advantage', 'Compliance',
              'Risk Management', 'Team Productivity', 'Digital Transformation'
            ],
            required: true,
            category: 'audience',
            weight: 0.2
          },
          {
            id: 'customer-challenges',
            question: "What are the biggest challenges your ideal customers face?",
            type: 'long-text',
            required: true,
            category: 'audience',
            weight: 0.15
          }
        ]
      },
      {
        id: 'pain-points',
        name: 'Pain Points & Problems',
        description: 'Understanding customer pain points',
        order: 4,
        isComplete: false,
        completionScore: 0,
        questions: [
          {
            id: 'current-solutions',
            question: "What are your prospects currently using to solve this problem?",
            type: 'multi-select',
            options: [
              'Manual Processes/Spreadsheets', 'Basic Tools', 'Enterprise Software',
              'Custom-Built Solution', 'Multiple Point Solutions', 'Nothing (Status Quo)', 'Other'
            ],
            required: true,
            category: 'pain-points',
            weight: 0.2
          },
          {
            id: 'pain-severity',
            question: "On a scale of 1-10, how painful is this problem for your customers?",
            type: 'scale',
            options: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
            required: true,
            category: 'pain-points',
            weight: 0.15
          },
          {
            id: 'pain-cost',
            question: "What does this problem typically cost your customers (time, money, opportunities)?",
            type: 'long-text',
            required: true,
            category: 'pain-points',
            weight: 0.25,
            followUp: [
              "Can you quantify this in dollars or hours?",
              "What happens if they don't solve this problem?"
            ]
          },
          {
            id: 'urgency-drivers',
            question: "What typically creates urgency for customers to solve this now?",
            type: 'multi-select',
            options: [
              'Regulatory Requirements', 'Competitive Pressure', 'Growth Demands',
              'Cost Pressures', 'Technology Changes', 'New Leadership', 'Market Changes',
              'Performance Issues', 'Customer Complaints', 'Audit Findings'
            ],
            required: true,
            category: 'pain-points',
            weight: 0.2
          },
          {
            id: 'trigger-events',
            question: "What events typically trigger customers to start looking for a solution like yours?",
            type: 'long-text',
            required: true,
            category: 'pain-points',
            weight: 0.2
          }
        ]
      },
      {
        id: 'competitors',
        name: 'Competitive Landscape',
        description: 'Understanding your competition',
        order: 5,
        isComplete: false,
        completionScore: 0,
        questions: [
          {
            id: 'primary-competitors',
            question: "Who are your top 3 direct competitors?",
            type: 'text', // Will allow multiple entries
            required: true,
            category: 'competitors',
            weight: 0.3
          },
          {
            id: 'competitive-strengths',
            question: "What are your key competitive advantages?",
            type: 'multi-select',
            options: [
              'Better Price', 'Superior Features', 'Easier to Use', 'Better Support',
              'Faster Implementation', 'More Integrations', 'Better Performance',
              'Industry Specialization', 'Larger Team', 'Better Technology'
            ],
            required: true,
            category: 'competitors',
            weight: 0.25
          },
          {
            id: 'competitive-weaknesses',
            question: "Where do competitors typically beat you?",
            type: 'multi-select',
            options: [
              'Lower Price', 'More Features', 'Better Brand Recognition', 'Larger Sales Team',
              'More Integrations', 'Longer Track Record', 'Better Funding',
              'Geographic Presence', 'Enterprise Features', 'Industry Relationships'
            ],
            required: false,
            category: 'competitors',
            weight: 0.2
          },
          {
            id: 'differentiation',
            question: "What makes you uniquely different from competitors?",
            type: 'long-text',
            required: true,
            category: 'competitors',
            weight: 0.25
          }
        ]
      },
      {
        id: 'messaging-cta',
        name: 'Messaging & CTAs',
        description: 'Defining your communication strategy',
        order: 6,
        isComplete: false,
        completionScore: 0,
        questions: [
          {
            id: 'brand-voice',
            question: "How would you describe your brand's tone of voice?",
            type: 'multiple-choice',
            options: [
              'Professional & Formal', 'Friendly & Conversational', 'Expert & Authoritative',
              'Innovative & Cutting-edge', 'Reliable & Trustworthy', 'Fun & Energetic'
            ],
            required: true,
            category: 'messaging',
            weight: 0.15
          },
          {
            id: 'key-messages',
            question: "What are your 3 most important messages to communicate?",
            type: 'long-text',
            required: true,
            category: 'messaging',
            weight: 0.25
          },
          {
            id: 'avoid-words',
            question: "Are there any words or phrases you want to avoid in messaging?",
            type: 'text',
            required: false,
            category: 'messaging',
            weight: 0.1
          },
          {
            id: 'primary-cta',
            question: "What's your primary call-to-action?",
            type: 'multiple-choice',
            options: [
              'Schedule a Demo', 'Start Free Trial', 'Request Quote',
              'Download Resource', 'Book Consultation', 'Get Started',
              'Learn More', 'Contact Sales'
            ],
            required: true,
            category: 'messaging',
            weight: 0.2
          },
          {
            id: 'secondary-ctas',
            question: "What are some alternative CTAs you use?",
            type: 'multi-select',
            options: [
              'View Case Study', 'Watch Video', 'Join Webinar',
              'Get Free Report', 'Take Assessment', 'Compare Options',
              'See Pricing', 'Request Demo'
            ],
            required: false,
            category: 'messaging',
            weight: 0.15
          },
          {
            id: 'success-stories',
            question: "Do you have any customer success stories or case studies you'd like to highlight?",
            type: 'long-text',
            required: false,
            category: 'messaging',
            weight: 0.15
          }
        ]
      }
    ];
  }

  private loadRAGPromptTemplate(): void {
    this.ragPromptTemplate = `
# SAM AI Knowledge Base - Client Profile

## Company Information
**Company Name**: {companyName}
**Industry**: {industry}
**Size**: {companySize}
**Stage**: {companyStage}
**Website**: {website}
**Description**: {companyDescription}

## Product/Service Offering
**Product Name**: {productName}
**Category**: {productCategory}
**Value Proposition**: {valueProposition}

### Key Features
{keyFeatures}

### Key Benefits
{keyBenefits}

### Pricing
**Model**: {pricingModel}
**Range**: {priceRange}

### Competitive Differentiators
{differentiators}

## Target Audience (Ideal Customer Profile)
**Primary Persona**:
- **Titles**: {targetTitles}
- **Departments**: {targetDepartments}
- **Company Sizes**: {targetCompanySizes}
- **Industries**: {targetIndustries}

### Customer Goals
{customerGoals}

### Customer Challenges
{customerChallenges}

## Pain Points & Problems
**Current Solutions Used**: {currentSolutions}
**Pain Severity**: {painSeverity}/10
**Cost of Problem**: {painCost}
**Urgency Drivers**: {urgencyDrivers}
**Trigger Events**: {triggerEvents}

## Competitive Landscape
**Primary Competitors**: {primaryCompetitors}
**Our Advantages**: {competitiveStrengths}
**Our Challenges**: {competitiveWeaknesses}
**Unique Differentiation**: {differentiation}

## Messaging Strategy
**Brand Voice**: {brandVoice}
**Key Messages**: {keyMessages}
**Primary CTA**: {primaryCTA}
**Secondary CTAs**: {secondaryCTAs}
**Success Stories**: {successStories}

---

## Instructions for SAM AI

When engaging with prospects and clients, use this information to:

1. **Personalize Outreach**: Reference specific pain points and benefits relevant to their industry/role
2. **Qualify Leads**: Focus on prospects matching our ICP criteria
3. **Handle Objections**: Use competitive advantages to address common concerns  
4. **Create Urgency**: Leverage trigger events and urgency drivers
5. **Craft Messaging**: Maintain consistent brand voice and key messages
6. **Generate Content**: Create emails, LinkedIn messages, and scripts aligned with our positioning

Always prioritize prospects who match our ideal customer profile and demonstrate clear pain points that our solution addresses.
`;
  }

  async processTask(task: TaskRequest, context: ConversationContext): Promise<TaskResponse> {
    const startTime = Date.now();

    try {
      let result: unknown = null;

      switch (task.type) {
        case 'automation-setup':
          if (this.isLinkedInConnectionTrigger(task)) {
            result = await this.handleLinkedInConnection(task, context);
          } else if (this.isOnboardingRequest(task)) {
            result = await this.conductOnboarding(task, context);
          }
          break;
        case 'knowledge-query':
          result = await this.handleOnboardingQuery(task, context);
          break;
        default:
          result = await this.handleGeneralOnboarding(task, context);
      }

      return this.createTaskResponse(
        task.id,
        result,
        true,
        undefined,
        {
          processingTime: Date.now() - startTime,
          agentType: 'onboarding'
        }
      );

    } catch (error) {
      console.error('Onboarding Agent error:', error);
      return this.createTaskResponse(
        task.id,
        null,
        false,
        error.message,
        { processingTime: Date.now() - startTime }
      );
    }
  }

  private isLinkedInConnectionTrigger(task: TaskRequest): boolean {
    return task.parameters.linkedinAccountInfo || 
           task.description.toLowerCase().includes('linkedin connected') ||
           task.description.toLowerCase().includes('new account');
  }

  private isOnboardingRequest(task: TaskRequest): boolean {
    const keywords = ['onboarding', 'setup', 'questionnaire', 'profile'];
    return keywords.some(keyword => 
      task.description.toLowerCase().includes(keyword)
    );
  }

  private async handleLinkedInConnection(task: TaskRequest, context: ConversationContext): Promise<string> {
    const linkedinInfo = task.parameters.linkedinAccountInfo || {};
    const userId = context.userId || 'anonymous';

    // Save LinkedIn connection info to Supabase
    await this.saveLinkedInConnection(userId, linkedinInfo);

    // Check if user has existing profile
    const existingProfile = await this.getExistingProfile(userId);

    if (existingProfile) {
      return `Great! I see you've connected a new LinkedIn account. Since you already have a profile with me, would you like to:

1. **Use your existing profile** for this LinkedIn account
2. **Create a new profile** for different targeting (useful for multiple products/markets)
3. **Update your current profile** based on new goals or market changes

What would work best for you?`;
    }

    // Start onboarding for new user
    return `🎉 **Welcome to SAM AI!** 

I see you've just connected your LinkedIn account - that's the first step to supercharging your sales outreach! 

To help you get the best results, I need to understand your business, ideal customers, and goals. This will take about 10-15 minutes but will dramatically improve the quality of your campaigns.

**Here's what I'll help you define:**
✅ Your company and offering
✅ Ideal customer profile (ICP)  
✅ Target audience pain points
✅ Competitive positioning
✅ Messaging strategy & CTAs
✅ Campaign preferences

Ready to get started? I'll guide you through each section with smart questions that adapt based on your answers.

**Let's begin with the basics - what's your company name?**

*You can always come back and update this information later as your strategy evolves.*`;
  }

  private async conductOnboarding(task: TaskRequest, context: ConversationContext): Promise<string> {
    const userId = context.userId || 'anonymous';
    const stage = task.parameters.stage || 'company-setup';
    const previousAnswers = task.parameters.previousAnswers || {};

    // Get current onboarding stage
    const currentStage = this.onboardingStages.find(s => s.id === stage);
    if (!currentStage) {
      return "I couldn't find that onboarding stage. Let's start from the beginning with company setup.";
    }

    // Check if stage is already complete
    if (currentStage.isComplete) {
      const nextStage = this.getNextOnboardingStage(stage);
      if (nextStage) {
        return `Great! You've completed the ${currentStage.name} section. 

**Next up: ${nextStage.name}**
${nextStage.description}

${await this.generateStageQuestions(nextStage, previousAnswers)}`;
      } else {
        return await this.completeOnboarding(userId, previousAnswers, context);
      }
    }

    // Generate questions for current stage
    return await this.generateStageQuestions(currentStage, previousAnswers);
  }

  private async generateStageQuestions(stage: OnboardingStage, previousAnswers: Record<string, unknown>): Promise<string> {
    const response = `**${stage.name}**\n${stage.description}\n\n`;

    // Get next unanswered question
    const unansweredQuestions = stage.questions.filter(q => 
      !previousAnswers[q.id] && q.required
    );

    if (unansweredQuestions.length === 0) {
      // All required questions answered, show optional ones or move to next stage
      const optionalQuestions = stage.questions.filter(q => 
        !previousAnswers[q.id] && !q.required
      );

      if (optionalQuestions.length > 0) {
        const nextQuestion = optionalQuestions[0];
        return response + this.formatQuestion(nextQuestion, previousAnswers);
      } else {
        stage.isComplete = true;
        const nextStage = this.getNextOnboardingStage(stage.id);
        if (nextStage) {
          return `✅ **${stage.name} Complete!**\n\n**Next: ${nextStage.name}**\n${nextStage.description}\n\n${await this.generateStageQuestions(nextStage, previousAnswers)}`;
        }
      }
    } else {
      const nextQuestion = unansweredQuestions[0];
      return response + this.formatQuestion(nextQuestion, previousAnswers);
    }

    return response + "All questions in this stage are complete!";
  }

  private formatQuestion(question: OnboardingQuestion, previousAnswers: Record<string, unknown>): string {
    let formatted = `**${question.question}**\n`;

    if (question.type === 'multiple-choice' && question.options) {
      formatted += question.options.map((option, index) => 
        `${index + 1}. ${option}`
      ).join('\n') + '\n\n';
      formatted += '*Please respond with the number of your choice.*';
    } else if (question.type === 'multi-select' && question.options) {
      formatted += question.options.map((option, index) => 
        `${index + 1}. ${option}`
      ).join('\n') + '\n\n';
      formatted += '*You can select multiple options by listing the numbers (e.g., "1, 3, 5").*';
    } else if (question.type === 'scale' && question.options) {
      formatted += `Scale: ${question.options.join(' - ')}\n\n`;
      formatted += '*Please respond with a number from the scale.*';
    } else {
      formatted += '\n*Please provide your response below.*';
    }

    if (question.required) {
      formatted += '\n\n*This field is required.*';
    }

    return formatted;
  }

  private getNextOnboardingStage(currentStageId: string): OnboardingStage | null {
    const currentStage = this.onboardingStages.find(s => s.id === currentStageId);
    if (!currentStage) return null;

    const nextOrder = currentStage.order + 1;
    return this.onboardingStages.find(s => s.order === nextOrder) || null;
  }

  private async completeOnboarding(userId: string, allAnswers: Record<string, unknown>, context: ConversationContext): Promise<string> {
    // Build client profile from answers
    const clientProfile = await this.buildClientProfile(allAnswers, userId);
    
    // Save to Supabase
    await this.saveClientProfile(userId, clientProfile);
    
    // Generate and save RAG training data
    await this.generateRAGTraining(userId, clientProfile);
    
    // Generate initial campaign ideas
    const campaignIdeas = await this.generateInitialCampaigns(clientProfile);

    return `🎉 **Onboarding Complete!** 

Excellent work! I now have a comprehensive understanding of your business:

**Your Profile Summary:**
• **Company**: ${clientProfile.companyInfo.name} (${clientProfile.companyInfo.industry})
• **Offering**: ${clientProfile.offering.productName} - ${clientProfile.offering.valueProposition}
• **Target**: ${clientProfile.targetAudience.primaryPersona.title}s at ${clientProfile.targetAudience.primaryPersona.companySize.join('/')} companies
• **Main CTA**: ${clientProfile.messaging.callToActions[0] || 'Schedule Demo'}

**🧠 I've trained my AI knowledge base** with all your information, so I can now:
✅ Create personalized outreach messages that reflect your value prop
✅ Qualify leads based on your ideal customer profile  
✅ Handle objections using your competitive advantages
✅ Generate campaigns tailored to your target audience

**🚀 Recommended Next Steps:**

${campaignIdeas}

**Ready to launch your first campaign?** I can help you:
1. **Find qualified prospects** matching your ICP
2. **Create personalized sequences** with your messaging
3. **Set up automated follow-ups** with your CTAs
4. **Track performance** and optimize results

What would you like to work on first?

*Remember: You can always update your profile by saying "update my profile" and I'll guide you through any changes.*`;
  }

  private async buildClientProfile(answers: Record<string, unknown>, userId: string): Promise<ClientProfile> {
    // This would process all the onboarding answers into a structured profile
    // For now, creating a sample structure
    return {
      id: userId,
      companyInfo: {
        name: answers['company-name'] || 'Your Company',
        industry: answers['industry'] || 'Technology',
        size: answers['company-size'] || '11-50',
        stage: answers['company-stage'] || 'Growth Stage',
        website: answers['company-website'] || '',
        description: answers['company-description'] || ''
      },
      offering: {
        productName: answers['product-name'] || 'Your Product',
        category: answers['product-category'] || 'B2B SaaS Platform',
        valueProposition: answers['value-proposition'] || 'We help businesses succeed',
        keyFeatures: this.parseMultiSelect(answers['key-features']) || [],
        benefits: this.parseMultiSelect(answers['key-benefits']) || [],
        pricing: {
          model: answers['pricing-model'] || 'Monthly Subscription',
          range: answers['price-range'] || '$100-500/month',
          competitive: 'competitive'
        },
        differentiators: []
      },
      targetAudience: {
        primaryPersona: {
          title: this.parseMultiSelect(answers['target-title'])?.[0] || 'Decision Maker',
          department: this.parseMultiSelect(answers['target-department'])?.[0] || 'Sales',
          seniority: 'Director+',
          companySize: this.parseMultiSelect(answers['target-company-size']) || ['51-200'],
          industries: this.parseMultiSelect(answers['target-industries']) || ['Technology'],
          painPoints: [answers['customer-challenges'] || 'Operational inefficiencies'],
          goals: this.parseMultiSelect(answers['customer-goals']) || ['Increase Revenue'],
          challenges: [answers['customer-challenges'] || 'Need better processes']
        }
      },
      competitors: {
        primary: [answers['primary-competitors'] || 'Generic Competitor'],
        secondary: [],
        strengths: {},
        weaknesses: {}
      },
      messaging: {
        mainValueProp: answers['value-proposition'] || 'We help businesses succeed',
        keyMessages: [answers['key-messages'] || 'Key message here'],
        callToActions: [answers['primary-cta'] || 'Schedule Demo'],
        toneOfVoice: answers['brand-voice'] || 'Professional & Friendly',
        avoidanceWords: []
      },
      goals: {
        primary: 'Generate qualified leads',
        metrics: ['Response Rate', 'Meeting Booked', 'Deals Closed'],
        timeline: '90 days',
        constraints: []
      },
      campaigns: {
        preferences: ['LinkedIn Outreach', 'Email Campaigns'],
        channels: ['LinkedIn', 'Email'],
        frequency: 'Daily',
        budget: 'Standard'
      }
    };
  }

  private parseMultiSelect(value: unknown): string[] {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      // Parse comma-separated or number-separated responses
      return value.split(/[,\n]/).map(v => v.trim()).filter(v => v.length > 0);
    }
    return [];
  }

  private async saveLinkedInConnection(userId: string, linkedinInfo: Record<string, unknown>): Promise<void> {
    // Save LinkedIn account connection info to Supabase
    try {
      // This would be actual Supabase call
      console.log(`Saving LinkedIn connection for user ${userId}:`, linkedinInfo);
      // await this.supabaseClient
      //   .from('linkedin_accounts')
      //   .insert({ user_id: userId, account_info: linkedinInfo, connected_at: new Date() });
    } catch (error) {
      console.error('Failed to save LinkedIn connection:', error);
    }
  }

  private async getExistingProfile(userId: string): Promise<ClientProfile | null> {
    // Check for existing user profile in Supabase
    try {
      // This would be actual Supabase call
      console.log(`Checking for existing profile for user ${userId}`);
      // const { data } = await this.supabaseClient
      //   .from('client_profiles')
      //   .select('*')
      //   .eq('user_id', userId)
      //   .single();
      // return data;
      return null; // For now, assume no existing profile
    } catch (error) {
      console.error('Failed to get existing profile:', error);
      return null;
    }
  }

  private async saveClientProfile(userId: string, profile: ClientProfile): Promise<void> {
    try {
      console.log(`Saving client profile for user ${userId}:`, profile);
      // await this.supabaseClient
      //   .from('client_profiles')
      //   .upsert({ user_id: userId, profile_data: profile, updated_at: new Date() });
    } catch (error) {
      console.error('Failed to save client profile:', error);
    }
  }

  private async generateRAGTraining(userId: string, profile: ClientProfile): Promise<void> {
    // Generate RAG training prompt with client-specific information
    const ragPrompt = this.ragPromptTemplate
      .replace('{companyName}', profile.companyInfo.name)
      .replace('{industry}', profile.companyInfo.industry)
      .replace('{companySize}', profile.companyInfo.size)
      .replace('{companyStage}', profile.companyInfo.stage)
      .replace('{website}', profile.companyInfo.website)
      .replace('{companyDescription}', profile.companyInfo.description)
      .replace('{productName}', profile.offering.productName)
      .replace('{productCategory}', profile.offering.category)
      .replace('{valueProposition}', profile.offering.valueProposition)
      .replace('{keyFeatures}', profile.offering.keyFeatures.map(f => `- ${f}`).join('\n'))
      .replace('{keyBenefits}', profile.offering.benefits.map(b => `- ${b}`).join('\n'))
      .replace('{pricingModel}', profile.offering.pricing.model)
      .replace('{priceRange}', profile.offering.pricing.range)
      .replace('{targetTitles}', profile.targetAudience.primaryPersona.title)
      .replace('{targetDepartments}', profile.targetAudience.primaryPersona.department)
      .replace('{targetCompanySizes}', profile.targetAudience.primaryPersona.companySize.join(', '))
      .replace('{targetIndustries}', profile.targetAudience.primaryPersona.industries.join(', '))
      .replace('{customerGoals}', profile.targetAudience.primaryPersona.goals.join(', '))
      .replace('{customerChallenges}', profile.targetAudience.primaryPersona.challenges.join(', '))
      .replace('{primaryCompetitors}', profile.competitors.primary.join(', '))
      .replace('{brandVoice}', profile.messaging.toneOfVoice)
      .replace('{keyMessages}', profile.messaging.keyMessages.join(', '))
      .replace('{primaryCTA}', profile.messaging.callToActions[0] || 'Contact us');

    // Save RAG training data to vector database
    try {
      console.log(`Generating RAG training for user ${userId}`);
      // await this.supabaseClient
      //   .from('rag_training_data')
      //   .upsert({ 
      //     user_id: userId, 
      //     training_prompt: ragPrompt, 
      //     profile_version: 1,
      //     created_at: new Date() 
      //   });
    } catch (error) {
      console.error('Failed to save RAG training data:', error);
    }
  }

  private async generateInitialCampaigns(profile: ClientProfile): Promise<string> {
    // Generate campaign recommendations based on profile
    const industry = profile.companyInfo.industry;
    const targetTitle = profile.targetAudience.primaryPersona.title;
    const valueProps = profile.offering.valueProposition;

    return `**🎯 Recommended Campaigns Based on Your Profile:**

**Campaign 1: "LinkedIn Warm Connection"**
• **Target**: ${targetTitle}s in ${industry} (50-500 employees)
• **Approach**: Personalized connection requests + follow-up sequence
• **Message Angle**: ${valueProps} 
• **Timeline**: 5-touch sequence over 2 weeks
• **Expected**: 15-25% connection rate, 8-12% response rate

**Campaign 2: "Pain Point Amplification"**
• **Target**: Companies showing growth/hiring signals
• **Approach**: Problem-focused messaging with industry insights
• **Message Angle**: "Seeing rapid growth? Here's how similar companies avoid [pain point]"
• **Timeline**: 3-touch sequence over 1 week
• **Expected**: 5-8% response rate, high qualification

**Campaign 3: "Value Demonstration"**
• **Target**: Your ICP with specific trigger events
• **Approach**: Case study/ROI focused outreach
• **Message Angle**: "Helped [similar company] achieve [specific result]"
• **Timeline**: 4-touch sequence over 10 days
• **Expected**: 10-15% response rate, high intent`;
  }

  private async handleOnboardingQuery(task: TaskRequest, context: ConversationContext): Promise<string> {
    const query = task.description.toLowerCase();

    if (query.includes('update') || query.includes('change')) {
      return "I can help you update any part of your profile! What would you like to change?\n\n• Company information\n• Product/service details\n• Target audience\n• Pain points\n• Competitive positioning\n• Messaging & CTAs\n\nJust let me know which section, and I'll guide you through the updates.";
    }

    if (query.includes('profile') || query.includes('information')) {
      return "I can show you your current profile or help you build a new one. Would you like to:\n\n1. **View your current profile** summary\n2. **Update existing information**\n3. **Create a new profile** (for different product/market)\n4. **Complete missing sections**\n\nWhat would be most helpful?";
    }

    return "I'm your onboarding specialist! I can help you:\n\n• **Set up your profile** after connecting LinkedIn\n• **Define your ideal customers** and target audience\n• **Clarify your value proposition** and messaging\n• **Identify pain points** and competitive advantages\n• **Create campaign strategies** based on your profile\n• **Update any information** as your business evolves\n\nWhat would you like to work on?";
  }

  private async handleGeneralOnboarding(task: TaskRequest, context: ConversationContext): Promise<string> {
    return "I'm here to help you get the most out of SAM AI! To create effective campaigns, I need to understand your business better.\n\nLet's start with a quick setup - this will help me personalize everything for your specific needs.\n\n**Would you like to begin the onboarding questionnaire?** It takes about 10-15 minutes and covers:\n\n• Your company and offering\n• Ideal customer profile\n• Target audience pain points\n• Competitive landscape\n• Messaging preferences\n\nReady to get started?";
  }

  getCapabilities(): AgentCapability[] {
    return this.capabilities;
  }

  async healthCheck(): Promise<boolean> {
    return this.isInitialized && this.onboardingStages.length > 0;
  }

  async shutdown(): Promise<void> {
    this.onboardingStages = [];
    this.supabaseClient = null;
    this.isInitialized = false;
    console.log('Onboarding Agent shut down');
  }
}