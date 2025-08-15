/**
 * Onboarding Agent - Real working dialogue and training data collection
 */

import { BaseAgent } from '../core/BaseAgent';
import { AgentConfig, TaskRequest, TaskResponse, ConversationContext } from '../types/AgentTypes';
import { LLMService } from '../../llm/LLMService';
import { MemoryService } from '../../memory/MemoryService';

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

  // Real onboarding conversation flow
  private readonly onboardingSteps: Omit<OnboardingStep, 'completed' | 'data'>[] = [
    {
      id: 'company_basics',
      title: 'Company Overview',
      question: "Let's start with the basics! What's your company name and what industry are you in?",
      followUpQuestions: [
        "What products or services does your company offer?",
        "How long has your company been in business?",
        "What's your role at the company?"
      ],
      extractionPrompt: `Extract from this company description:
        - company_name: string
        - industry: string 
        - products_services: string[]
        - company_age: string
        - user_role: string
        Return as JSON.`,
      required: true
    },
    {
      id: 'target_market',
      title: 'Target Market & ICP',
      question: "Perfect! Now tell me about your ideal customers. What types of companies do you typically sell to?",
      followUpQuestions: [
        "What company sizes do you target (employees, revenue)?",
        "Which job titles or roles do you usually reach out to?",
        "Are there specific industries you focus on?"
      ],
      extractionPrompt: `Extract ICP details:
        - target_industries: string[]
        - company_sizes: string[]
        - decision_maker_titles: string[]
        - customer_characteristics: string[]
        Return as JSON.`,
      required: true
    },
    {
      id: 'pain_points_solutions',
      title: 'Problems & Solutions',
      question: "Great! What are the main problems or pain points that your ideal customers face that you help solve?",
      followUpQuestions: [
        "How do you typically position your solution?",
        "What makes your solution different from competitors?",
        "What results do customers typically see?"
      ],
      extractionPrompt: `Extract problem/solution fit:
        - customer_pain_points: string[]
        - solutions_offered: string[]
        - value_propositions: string[]
        - competitive_advantages: string[]
        Return as JSON.`,
      required: true
    }
  ];

  constructor(config: AgentConfig) {
    super('onboarding', config);
    this.llmService = LLMService.getInstance();
    this.memoryService = MemoryService.getInstance();
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
        error: `Onboarding processing failed: ${error.message}`,
        agentId: this.agentId,
        taskId: task.id,
        processingTime: Date.now() - startTime
      };
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
    
    return {
      success: true,
      result: {
        message: `${welcomeMessage.content}\n\n**${firstStep.title}**\n${firstStep.question}`,
        onboarding_state: onboardingState,
        current_step: firstStep,
        progress_percentage: 0,
        is_onboarding: true
      },
      agentId: this.agentId,
      taskId: task.id,
      processingTime: 200
    };
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

    return {
      success: true,
      result: {
        message: response,
        onboarding_state: onboardingState,
        current_step: onboardingState.currentStep < onboardingState.totalSteps ? 
          onboardingState.steps[onboardingState.currentStep] : null,
        progress_percentage: onboardingState.completionPercentage,
        action: nextAction,
        extracted_data: extractedData,
        is_onboarding: nextAction !== 'complete'
      },
      agentId: this.agentId,
      taskId: task.id,
      processingTime: 400
    };
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

    const completion = await this.llmService.chat([
      {
        role: 'system',
        content: `You are SAM, completing onboarding. Create an enthusiastic completion message that:
1. Thanks them for the information
2. Summarizes key insights learned
3. Explains how this helps provide personalized assistance
4. Lists specific ways you can now help them
5. Invites them to start using SAM AI

Make it exciting and actionable.`
      },
      {
        role: 'user',
        content: `Onboarding Complete!
Company: ${JSON.stringify(onboardingState.extractedInsights[0])}
Target Market: ${JSON.stringify(onboardingState.extractedInsights[1])}
Solutions: ${JSON.stringify(onboardingState.extractedInsights[2])}

Generate completion message:`
      }
    ], {
      model: 'quality',
      temperature: 0.8,
      maxTokens: 400
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
   * Generate comprehensive training data
   */
  private async generateTrainingData(onboardingState: OnboardingState, sessionId: string): Promise<void> {
    const consolidatedData = {
      company_profile: onboardingState.extractedInsights[0],
      ideal_customer_profile: onboardingState.extractedInsights[1], 
      value_proposition: onboardingState.extractedInsights[2]
    };

    // Store consolidated training data
    await this.memoryService.storeMemory({
      type: 'company',
      category: 'strategy',
      title: 'SAM AI Training Profile - Complete',
      content: `Training data from onboarding conversation`,
      tags: ['training_data', 'onboarding_complete', 'personalization'],
      source: 'analysis',
      confidence: 0.95,
      metadata: {
        consolidated_data: consolidatedData,
        onboarding_responses: onboardingState.userResponses,
        session_id: sessionId,
        completed_at: new Date().toISOString()
      }
    });

    console.log('Training data generated and stored:', consolidatedData);
  }

  private getMemoryTypeForStep(stepId: string): 'product' | 'audience' | 'company' | 'campaign' | 'conversation' | 'preference' {
    const stepTypeMap: Record<string, 'product' | 'audience' | 'company' | 'campaign' | 'conversation' | 'preference'> = {
      'company_basics': 'company',
      'target_market': 'audience', 
      'pain_points_solutions': 'product'
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