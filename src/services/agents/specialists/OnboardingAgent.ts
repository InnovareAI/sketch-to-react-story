/**
 * Onboarding Agent - Real working dialogue and training data collection
 */

import { BaseAgent, AgentConfig, TaskRequest, TaskResponse, ConversationContext } from '../types/AgentTypes';
import { LLMService } from '../../llm/LLMService';
import { MemoryService } from '../../memory/MemoryService';
import { N8nIntegrationService } from '../../n8n/N8nIntegrationService';

export interface OnboardingStep {
  id: string;
  title: string;
  question: string;
  followUpQuestions: string[];
  extractionPrompt: string;
  required: boolean;
  completed: boolean;
  data?: Record<string, unknown>;
}

export interface OnboardingState {
  currentStep: number;
  totalSteps: number;
  steps: OnboardingStep[];
  collectedData: Record<string, unknown>;
  completionPercentage: number;
  userResponses: string[];
  extractedInsights: Record<string, unknown>[];
}

export class OnboardingAgent extends BaseAgent {
  private llmService: LLMService;
  private memoryService: MemoryService;
  private n8nService: N8nIntegrationService;

  // Comprehensive SAM Funnel Information Gathering Flow
  private readonly onboardingSteps: Omit<OnboardingStep, 'completed' | 'data'>[] = [
    {
      id: 'company_basics',
      title: 'Company Overview',
      question: "Let's start with the basics! What's your company name, industry, and what you do?",
      followUpQuestions: [
        "What products or services does your company offer?",
        "How long has your company been in business?",
        "What's your role and what are your main responsibilities?"
      ],
      extractionPrompt: `Extract company fundamentals:
        - company_name: string
        - industry: string
        - business_model: string
        - products_services: string[]
        - company_age: string
        - company_size: string
        - user_role: string
        - user_responsibilities: string[]
        Return as JSON.`,
      required: true
    },
    {
      id: 'ideal_customer_profile',
      title: 'Ideal Customer Profile (ICP)',
      question: "Now let's dive deep into your ideal customers. Describe the perfect company you love working with - their size, industry, characteristics, and decision-making process.",
      followUpQuestions: [
        "What company sizes work best (employees, revenue ranges)?",
        "Which industries convert best for you?",
        "What are the common characteristics of your best customers?",
        "How do they typically make purchasing decisions?"
      ],
      extractionPrompt: `Extract detailed ICP:
        - target_industries: string[]
        - company_size_ranges: string[]
        - revenue_ranges: string[]
        - geographic_focus: string[]
        - customer_characteristics: string[]
        - decision_making_process: string
        - buying_signals: string[]
        - customer_journey_stages: string[]
        Return as JSON.`,
      required: true
    },
    {
      id: 'decision_makers',
      title: 'Decision Makers & Influencers',
      question: "Who are the key people involved in buying decisions at your target companies? Let's map out the decision-making unit.",
      followUpQuestions: [
        "What job titles are usually the final decision makers?",
        "Who are the influencers and stakeholders involved?",
        "What departments get involved in the purchase process?",
        "How do you typically get introduced to these people?"
      ],
      extractionPrompt: `Extract decision maker mapping:
        - primary_decision_makers: string[]
        - secondary_decision_makers: string[]
        - influencers: string[]
        - departments_involved: string[]
        - typical_titles: string[]
        - introduction_methods: string[]
        - decision_criteria: string[]
        Return as JSON.`,
      required: true
    },
    {
      id: 'pain_points_triggers',
      title: 'Pain Points & Trigger Events',
      question: "What specific problems keep your ideal customers up at night? What events typically trigger them to start looking for a solution like yours?",
      followUpQuestions: [
        "What are the most common pain points you solve?",
        "What events trigger them to start searching for solutions?",
        "How do they currently try to solve these problems?",
        "What's the cost of not solving these problems?"
      ],
      extractionPrompt: `Extract pain points and triggers:
        - primary_pain_points: string[]
        - secondary_pain_points: string[]
        - trigger_events: string[]
        - current_solutions: string[]
        - cost_of_inaction: string[]
        - urgency_drivers: string[]
        - emotional_motivators: string[]
        Return as JSON.`,
      required: true
    },
    {
      id: 'value_proposition',
      title: 'Value Proposition & Differentiation',
      question: "How do you position your solution? What makes you different from competitors, and what specific outcomes do you deliver?",
      followUpQuestions: [
        "What's your core value proposition?",
        "How do you differentiate from competitors?",
        "What specific outcomes and ROI do customers see?",
        "What proof points or case studies do you use?"
      ],
      extractionPrompt: `Extract value proposition:
        - core_value_props: string[]
        - competitive_advantages: string[]
        - differentiation_factors: string[]
        - outcomes_delivered: string[]
        - roi_metrics: string[]
        - social_proof: string[]
        - case_studies: string[]
        Return as JSON.`,
      required: true
    },
    {
      id: 'messaging_tone',
      title: 'Messaging & Communication Style',
      question: "How do you typically communicate with prospects? What tone, style, and messaging approaches work best for your audience?",
      followUpQuestions: [
        "What tone of voice resonates with your audience?",
        "Do you prefer formal or casual communication?",
        "What messaging frameworks do you currently use?",
        "What words/phrases do your customers use to describe their problems?"
      ],
      extractionPrompt: `Extract messaging preferences:
        - preferred_tone: string
        - communication_style: string
        - messaging_frameworks: string[]
        - customer_language: string[]
        - effective_subject_lines: string[]
        - call_to_actions: string[]
        - objection_responses: string[]
        Return as JSON.`,
      required: true
    },
    {
      id: 'sales_process',
      title: 'Sales Process & Cycle',
      question: "Walk me through your typical sales process. How long does it take from first contact to close, and what are the key stages?",
      followUpQuestions: [
        "What's your average sales cycle length?",
        "What are the key stages in your sales process?",
        "What tools do you currently use for outreach?",
        "Where do most deals get stuck or fall through?"
      ],
      extractionPrompt: `Extract sales process details:
        - sales_cycle_length: string
        - sales_stages: string[]
        - current_tools: string[]
        - bottlenecks: string[]
        - conversion_rates: string[]
        - follow_up_sequences: string[]
        - deal_blockers: string[]
        Return as JSON.`,
      required: true
    },
    {
      id: 'campaign_preferences',
      title: 'Campaign Preferences & Goals',
      question: "Finally, let's talk about your outreach preferences. What channels work best for you, and what are your goals for using SAM AI?",
      followUpQuestions: [
        "Which channels work best (email, LinkedIn, phone)?",
        "How many prospects do you typically reach out to per week?",
        "What are your response rate and conversion goals?",
        "What specific outcomes are you hoping to achieve with SAM AI?"
      ],
      extractionPrompt: `Extract campaign preferences:
        - preferred_channels: string[]
        - outreach_volume: string
        - response_rate_goals: string
        - conversion_goals: string
        - success_metrics: string[]
        - campaign_types: string[]
        - automation_preferences: string[]
        - sam_ai_goals: string[]
        Return as JSON.`,
      required: true
    }
  ];

  constructor(config: AgentConfig) {
    super('orchestrator', config); // Use valid AgentType
    this.llmService = LLMService.getInstance();
    this.memoryService = MemoryService.getInstance();
    this.n8nService = N8nIntegrationService.getInstance();
    this.initializeCapabilities();
  }

  private initializeCapabilities(): void {
    this.capabilities = [
      {
        name: 'onboarding-conversation',
        description: 'Conduct intelligent onboarding conversations',
        supportedComplexity: ['moderate', 'complex'],
        estimatedDuration: 10,
        requiredParameters: ['user_response', 'current_step'],
        optionalParameters: ['conversation_history']
      }
    ];
  }

  async initialize(): Promise<void> {
    console.log('Initializing SAM Onboarding Agent...');
    this.isInitialized = true;
  }

  async processTask(task: TaskRequest, context: ConversationContext): Promise<TaskResponse> {
    const startTime = Date.now();
    
    try {
      switch (task.type) {
        case 'start_onboarding':
          return await this.startOnboarding(task, context);
        
        case 'process_onboarding_response':
          return await this.processOnboardingResponse(task, context);
          
        default:
          return this.createTaskResponse(
            task.id,
            { type: 'error', data: {} },
            false,
            `Unsupported task type: ${task.type}`,
            { processingTime: Date.now() - startTime }
          );
      }
    } catch (error) {
      return this.createTaskResponse(
        task.id,
        { type: 'error', data: {} },
        false,
        `Onboarding processing failed: ${error.message}`,
        { processingTime: Date.now() - startTime }
      );
    }
  }

  /**
   * Start the intelligent onboarding conversation
   */
  private async startOnboarding(task: TaskRequest, context: ConversationContext): Promise<TaskResponse> {
    const onboardingState: OnboardingState = {
      currentStep: 0,
      totalSteps: this.onboardingSteps.length,
      steps: this.onboardingSteps.map(step => ({ ...step, completed: false })),
      collectedData: {},
      completionPercentage: 0,
      userResponses: [],
      extractedInsights: []
    };

    // Create dynamic welcome message
    const welcomeMessage = await this.llmService.chat([
      {
        role: 'system',
        content: `You are SAM, an AI sales assistant starting an onboarding conversation. Create a personalized welcome that:

1. Welcomes them warmly to SAM AI
2. Explains you'll learn about their business to provide personalized sales assistance
3. Sets expectation of a quick conversation to understand their needs
4. Shows enthusiasm about helping them succeed
5. Ends with asking them to start

Keep it conversational and energetic.`
      },
      {
        role: 'user',
        content: 'Start the onboarding process for a new SAM AI user.'
      }
    ], {
      model: 'quality',
      temperature: 0.7,
      maxTokens: 300
    });

    const firstStep = onboardingState.steps[0];
    
    return this.createTaskResponse(
      task.id,
      {
        type: 'onboarding_start',
        data: {
          message: `${welcomeMessage.content}\n\n**${firstStep.title}**\n${firstStep.question}`,
          onboarding_state: onboardingState,
          current_step: firstStep,
          progress_percentage: 0,
          is_onboarding: true
        }
      },
      true,
      undefined,
      { processingTime: 200 }
    );
  }

  /**
   * Process user response and continue conversation
   */
  private async processOnboardingResponse(task: TaskRequest, context: ConversationContext): Promise<TaskResponse> {
    const userResponse = task.parameters.user_response as string;
    const onboardingState = task.parameters.onboarding_state as OnboardingState;
    
    const currentStep = onboardingState.steps[onboardingState.currentStep];
    
    // Add response to history
    onboardingState.userResponses.push(userResponse);

    // Extract structured data from the response
    const extractedData = await this.extractStructuredData(userResponse, currentStep.extractionPrompt);
    
    // Store the extracted data
    currentStep.data = extractedData;
    currentStep.completed = true;
    onboardingState.extractedInsights.push(extractedData);
    
    // Store data in memory system
    await this.storeStepData(currentStep, userResponse, extractedData, context.sessionId);

    // Move to next step or complete
    onboardingState.currentStep++;
    onboardingState.completionPercentage = Math.round((onboardingState.currentStep / onboardingState.totalSteps) * 100);
    
    let response: string;
    let nextAction: string;
    
    if (onboardingState.currentStep >= onboardingState.totalSteps) {
      // Onboarding complete
      response = await this.completeOnboarding(onboardingState, context);
      nextAction = 'complete';
    } else {
      // Move to next step
      const nextStep = onboardingState.steps[onboardingState.currentStep];
      response = await this.generateStepTransition(currentStep, nextStep, extractedData);
      nextAction = 'next_step';
    }

    return this.createTaskResponse(
      task.id,
      {
        type: 'onboarding_response',
        data: {
          message: response,
          onboarding_state: onboardingState,
          current_step: onboardingState.currentStep < onboardingState.totalSteps ? 
            onboardingState.steps[onboardingState.currentStep] : null,
          progress_percentage: onboardingState.completionPercentage,
          action: nextAction,
          extracted_data: extractedData,
          is_onboarding: nextAction !== 'complete'
        }
      },
      true,
      undefined,
      { processingTime: 400 }
    );
  }

  /**
   * Extract structured data from conversational response
   */
  private async extractStructuredData(response: string, extractionPrompt: string): Promise<Record<string, unknown>> {
    try {
      const extraction = await this.llmService.chat([
        {
          role: 'system',
          content: `You are a data extraction expert. Extract structured information from conversational responses. Always return valid JSON only.`
        },
        {
          role: 'user',
          content: `${extractionPrompt}\n\nUser Response: "${response}"`
        }
      ], {
        model: 'quality',
        temperature: 0.2,
        maxTokens: 400
      });

      return JSON.parse(extraction.content);
    } catch (error) {
      console.error('Data extraction failed:', error);
      return { raw_response: response, extraction_error: error.message };
    }
  }

  /**
   * Generate smooth transition between steps
   */
  private async generateStepTransition(currentStep: OnboardingStep, nextStep: OnboardingStep, extractedData: Record<string, unknown>): Promise<string> {
    const transition = await this.llmService.chat([
      {
        role: 'system',
        content: `You are SAM, transitioning between onboarding steps. Create a smooth transition that:
1. Acknowledges what they shared
2. Shows you're learning about their business
3. Introduces the next topic naturally
4. Asks the next question enthusiastically

Keep it conversational and engaged.`
      },
      {
        role: 'user',
        content: `Just Completed: ${currentStep.title}
What We Learned: ${JSON.stringify(extractedData)}

Next Step: ${nextStep.title}
Next Question: ${nextStep.question}

Generate smooth transition:`
      }
    ], {
      model: 'quality',
      temperature: 0.7,
      maxTokens: 300
    });

    return `${transition.content}\n\n**${nextStep.title}**\n${nextStep.question}`;
  }

  /**
   * Complete the onboarding process
   */
  private async completeOnboarding(onboardingState: OnboardingState, context: ConversationContext): Promise<string> {
    // Generate training data
    await this.generateTrainingData(onboardingState, context.sessionId);
    
    // Prepare SAM funnel initialization data
    await this.initializeSamFunnel(onboardingState, context);

    const completion = await this.llmService.chat([
      {
        role: 'system',
        content: `You are SAM, completing comprehensive onboarding. Create an enthusiastic completion message that:
1. Thanks them for the detailed information
2. Summarizes the key insights learned across all areas
3. Explains how this comprehensive profile enables personalized SAM funnel execution
4. Lists specific SAM AI capabilities now unlocked (prospecting, messaging, sequences, scoring, etc.)
5. Invites them to start their first campaign

Make it exciting, comprehensive, and action-oriented.`
      },
      {
        role: 'user',
        content: `🎉 SAM Funnel Onboarding Complete!

Here's what I've learned about you:

**Company Profile:** ${JSON.stringify(onboardingState.extractedInsights[0])}

**Ideal Customer Profile:** ${JSON.stringify(onboardingState.extractedInsights[1])}

**Decision Makers:** ${JSON.stringify(onboardingState.extractedInsights[2])}

**Pain Points & Triggers:** ${JSON.stringify(onboardingState.extractedInsights[3])}

**Value Proposition:** ${JSON.stringify(onboardingState.extractedInsights[4])}

**Messaging Style:** ${JSON.stringify(onboardingState.extractedInsights[5])}

**Sales Process:** ${JSON.stringify(onboardingState.extractedInsights[6])}

**Campaign Preferences:** ${JSON.stringify(onboardingState.extractedInsights[7])}

Generate enthusiastic completion message that shows how this enables the full SAM funnel:`
      }
    ], {
      model: 'quality',
      temperature: 0.8,
      maxTokens: 600
    });

    return completion.content;
  }

  /**
   * Store step data in memory system
   */
  private async storeStepData(step: OnboardingStep, response: string, extractedData: Record<string, unknown>, sessionId: string): Promise<void> {
    const memoryType = this.getMemoryTypeForStep(step.id);
    
    await this.memoryService.storeMemory({
      type: memoryType,
      category: 'business',
      title: step.title,
      content: response,
      tags: ['onboarding', step.id, 'training_data'],
      source: 'conversation',
      confidence: 0.9,
      metadata: {
        step_id: step.id,
        extracted_data: extractedData,
        session_id: sessionId,
        onboarding_step: true
      }
    });
  }

  /**
   * Generate comprehensive training data for SAM funnel
   */
  private async generateTrainingData(onboardingState: OnboardingState, sessionId: string): Promise<void> {
    const consolidatedData = {
      company_profile: onboardingState.extractedInsights[0],
      ideal_customer_profile: onboardingState.extractedInsights[1],
      decision_makers: onboardingState.extractedInsights[2],
      pain_points_triggers: onboardingState.extractedInsights[3],
      value_proposition: onboardingState.extractedInsights[4],
      messaging_tone: onboardingState.extractedInsights[5],
      sales_process: onboardingState.extractedInsights[6],
      campaign_preferences: onboardingState.extractedInsights[7]
    };

    // Generate SAM AI personalization instructions
    const personalizationInstructions = await this.llmService.chat([
      {
        role: 'system',
        content: 'Generate personalized SAM AI instructions based on comprehensive onboarding data.'
      },
      {
        role: 'user',
        content: `Create personalized SAM AI instructions for:

Company: ${JSON.stringify(consolidatedData.company_profile)}
ICP: ${JSON.stringify(consolidatedData.ideal_customer_profile)}
Pain Points: ${JSON.stringify(consolidatedData.pain_points_triggers)}
Value Prop: ${JSON.stringify(consolidatedData.value_proposition)}
Messaging: ${JSON.stringify(consolidatedData.messaging_tone)}
Sales Process: ${JSON.stringify(consolidatedData.sales_process)}
Preferences: ${JSON.stringify(consolidatedData.campaign_preferences)}

Generate:
1. Personalized prospecting criteria
2. Custom messaging templates
3. Outreach sequence recommendations
4. Lead scoring criteria
5. Follow-up automation rules`
      }
    ], {
      model: 'quality',
      temperature: 0.3,
      maxTokens: 800
    });

    // Store consolidated training data
    await this.memoryService.storeMemory({
      type: 'company',
      category: 'strategy',
      title: 'SAM AI Complete Training Profile',
      content: `Comprehensive SAM funnel training data with personalization instructions`,
      tags: ['training_data', 'onboarding_complete', 'sam_funnel', 'personalization'],
      source: 'analysis',
      confidence: 0.95,
      metadata: {
        consolidated_data: consolidatedData,
        personalization_instructions: personalizationInstructions.content,
        onboarding_responses: onboardingState.userResponses,
        session_id: sessionId,
        completed_at: new Date().toISOString(),
        sam_funnel_ready: true
      }
    });

    // Store individual data categories for targeted retrieval
    const dataCategories = [
      { key: 'company_profile', type: 'company', category: 'business' },
      { key: 'ideal_customer_profile', type: 'audience', category: 'business' },
      { key: 'decision_makers', type: 'audience', category: 'strategy' },
      { key: 'pain_points_triggers', type: 'audience', category: 'strategy' },
      { key: 'value_proposition', type: 'product', category: 'strategy' },
      { key: 'messaging_tone', type: 'preference', category: 'strategy' },
      { key: 'sales_process', type: 'campaign', category: 'strategy' },
      { key: 'campaign_preferences', type: 'campaign', category: 'strategy' }
    ];

    for (const [index, category] of dataCategories.entries()) {
      await this.memoryService.storeMemory({
        type: category.type,
        category: category.category,
        title: `SAM Funnel - ${category.key.replace('_', ' ')}`,
        content: JSON.stringify(consolidatedData[category.key]),
        tags: ['sam_funnel_data', category.key, 'structured_data'],
        source: 'analysis',
        confidence: 0.9,
        metadata: {
          data_type: category.key,
          onboarding_step: index,
          session_id: sessionId
        }
      });
    }

    console.log('Comprehensive SAM funnel training data generated and stored:', consolidatedData);
  }

  /**
   * Initialize SAM funnel workflows based on onboarding data
   */
  private async initializeSamFunnel(onboardingState: OnboardingState, context: ConversationContext): Promise<void> {
    const consolidatedData = {
      company_profile: onboardingState.extractedInsights[0],
      ideal_customer_profile: onboardingState.extractedInsights[1],
      decision_makers: onboardingState.extractedInsights[2],
      pain_points_triggers: onboardingState.extractedInsights[3],
      value_proposition: onboardingState.extractedInsights[4],
      messaging_tone: onboardingState.extractedInsights[5],
      sales_process: onboardingState.extractedInsights[6],
      campaign_preferences: onboardingState.extractedInsights[7]
    };

    // Prepare lead research criteria from onboarding data
    const leadResearchCriteria = {
      companyCriteria: {
        industries: consolidatedData.ideal_customer_profile?.target_industries || [],
        sizeRanges: consolidatedData.ideal_customer_profile?.company_size_ranges || [],
        revenueRanges: consolidatedData.ideal_customer_profile?.revenue_ranges || [],
        geographicFocus: consolidatedData.ideal_customer_profile?.geographic_focus || [],
        characteristics: consolidatedData.ideal_customer_profile?.customer_characteristics || []
      },
      roleCriteria: {
        primaryTitles: consolidatedData.decision_makers?.primary_decision_makers || [],
        secondaryTitles: consolidatedData.decision_makers?.secondary_decision_makers || [],
        departments: consolidatedData.decision_makers?.departments_involved || [],
        seniorityLevels: ['Director', 'VP', 'C-Suite', 'Manager']
      },
      additionalFilters: {
        triggerEvents: consolidatedData.pain_points_triggers?.trigger_events || [],
        painPoints: consolidatedData.pain_points_triggers?.primary_pain_points || [],
        urgencyDrivers: consolidatedData.pain_points_triggers?.urgency_drivers || []
      },
      maxResults: parseInt(consolidatedData.campaign_preferences?.outreach_volume?.toString() || '100'),
      dataSources: ['linkedin', 'apollo', 'brightdata']
    };

    // Prepare content generation preferences
    const contentGenerationRequest = {
      contentType: 'multi_channel_sequence',
      targetAudience: consolidatedData.ideal_customer_profile,
      personalizationData: {
        valueProposition: consolidatedData.value_proposition,
        painPoints: consolidatedData.pain_points_triggers,
        messagingTone: consolidatedData.messaging_tone,
        salesProcess: consolidatedData.sales_process
      },
      contentGuidelines: {
        tone: consolidatedData.messaging_tone?.preferred_tone || 'professional',
        style: consolidatedData.messaging_tone?.communication_style || 'consultative',
        channels: consolidatedData.campaign_preferences?.preferred_channels || ['email', 'linkedin'],
        sequenceLength: consolidatedData.sales_process?.sales_stages?.length || 5
      },
      variantsRequested: 3,
      kbContextIds: [] // Will be populated by knowledge ingestion
    };

    try {
      // Queue lead research workflow
      const leadResearchQueueId = await this.n8nService.queueLeadResearch(
        context.workspaceId || 'df5d730f-1915-4269-bd5a-9534478b17af',
        leadResearchCriteria,
        context.sessionId,
        context.messageId
      );

      // Queue content generation workflow
      const contentGenerationQueueId = await this.n8nService.queueContentGeneration(
        context.workspaceId || 'df5d730f-1915-4269-bd5a-9534478b17af',
        contentGenerationRequest,
        context.sessionId,
        context.messageId
      );

      console.log('SAM funnel workflows queued:', {
        leadResearch: leadResearchQueueId,
        contentGeneration: contentGenerationQueueId
      });

      // Store workflow queue IDs in memory for tracking
      await this.memoryService.storeMemory({
        type: 'campaign',
        category: 'strategy',
        title: 'SAM Funnel Initialization - Workflow Queue IDs',
        content: `Onboarding complete - SAM funnel workflows queued`,
        tags: ['sam_funnel_init', 'workflow_queue', 'n8n_integration'],
        source: 'analysis',
        confidence: 1.0,
        metadata: {
          lead_research_queue_id: leadResearchQueueId,
          content_generation_queue_id: contentGenerationQueueId,
          session_id: context.sessionId,
          workspace_id: context.workspaceId,
          initialized_at: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Failed to initialize SAM funnel workflows:', error);
      // Store the error for later retry
      await this.memoryService.storeMemory({
        type: 'campaign',
        category: 'technical',
        title: 'SAM Funnel Initialization - Failed',
        content: `Failed to queue SAM funnel workflows: ${error.message}`,
        tags: ['sam_funnel_error', 'workflow_failure', 'retry_needed'],
        source: 'analysis',
        confidence: 1.0,
        metadata: {
          error_message: error.message,
          session_id: context.sessionId,
          workspace_id: context.workspaceId,
          failed_at: new Date().toISOString(),
          retry_required: true
        }
      });
    }
  }

  private getMemoryTypeForStep(stepId: string): 'product' | 'audience' | 'company' | 'campaign' | 'conversation' | 'preference' {
    const stepTypeMap: Record<string, 'product' | 'audience' | 'company' | 'campaign' | 'conversation' | 'preference'> = {
      'company_basics': 'company',
      'ideal_customer_profile': 'audience',
      'decision_makers': 'audience',
      'pain_points_triggers': 'audience',
      'value_proposition': 'product',
      'messaging_tone': 'preference',
      'sales_process': 'campaign',
      'campaign_preferences': 'campaign'
    };
    
    return stepTypeMap[stepId] || 'company';
  }

  getCapabilities() {
    return this.capabilities;
  }

  async healthCheck(): Promise<boolean> {
    return this.isInitialized && this.llmService !== null;
  }

  async shutdown(): Promise<void> {
    this.isInitialized = false;
    console.log('Onboarding agent shut down');
  }
}

export default OnboardingAgent;