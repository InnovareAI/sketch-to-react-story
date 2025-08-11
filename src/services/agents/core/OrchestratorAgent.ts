/**
 * Orchestrator Agent - Main coordinator for SAM AI Multi-Agent System
 * Implements Anthropic's orchestrator-worker pattern
 */

import { 
  BaseAgent, 
  AgentType, 
  AgentInstance, 
  Message, 
  TaskRequest, 
  TaskResponse, 
  ConversationContext, 
  IntentClassification,
  AgentRoutingDecision,
  MessageIntent,
  TaskComplexity,
  AgentConfig,
  AgentCapability
} from '../types/AgentTypes';

export type OperationMode = 'outbound' | 'inbound';

export class OrchestratorAgent extends BaseAgent {
  private specialists: Map<AgentType, AgentInstance> = new Map();
  private activeContext: Map<string, ConversationContext> = new Map();
  private operationMode: OperationMode = 'outbound';
  public readonly name = 'SAM';
  public readonly description = 'Your AI Sales & Communications Expert';

  constructor(config: AgentConfig) {
    super('orchestrator', config);
    this.initializeCapabilities();
  }

  public setOperationMode(mode: OperationMode): void {
    this.operationMode = mode;
    console.log(`SAM switched to ${mode} mode`);
    // Update active specialists based on mode
    this.updateSpecialistsForMode(mode);
  }

  private updateSpecialistsForMode(mode: OperationMode): void {
    // In inbound mode, prioritize inbox management agents
    // In outbound mode, prioritize campaign and lead generation agents
    if (mode === 'inbound') {
      // Activate inbound team
      console.log('Activating inbound specialist team: Inbox Triage, Spam Filter, Auto-Response');
    } else {
      // Activate outbound team
      console.log('Activating outbound specialist team: Lead Research, Campaign Management, Content Creation');
    }
  }

  private initializeCapabilities(): void {
    this.capabilities = [
      {
        name: 'intent-classification',
        description: 'Analyze user messages to determine intent and route to appropriate specialists',
        supportedComplexity: ['simple', 'moderate', 'complex', 'expert'],
        estimatedDuration: 2,
        requiredParameters: ['message', 'context'],
        optionalParameters: ['sessionHistory']
      },
      {
        name: 'task-orchestration',
        description: 'Coordinate multiple specialist agents for complex requests',
        supportedComplexity: ['moderate', 'complex', 'expert'],
        estimatedDuration: 10,
        requiredParameters: ['tasks', 'context'],
        optionalParameters: ['parallel']
      },
      {
        name: 'response-synthesis',
        description: 'Combine outputs from multiple agents into coherent response',
        supportedComplexity: ['simple', 'moderate', 'complex'],
        estimatedDuration: 3,
        requiredParameters: ['agentOutputs'],
        optionalParameters: ['userPreferences']
      }
    ];
  }

  async initialize(): Promise<void> {
    // Initialize orchestrator-specific resources
    console.log('Initializing SAM Orchestrator Agent...');
    this.isInitialized = true;
  }

  public registerSpecialists(specialists: Map<AgentType, AgentInstance>): void {
    this.specialists = new Map(specialists);
    console.log(`Registered ${specialists.size} specialist agents`);
  }

  public async processMessage(
    message: string, 
    existingContext: any, 
    sessionId: string
  ): Promise<{
    response: Message;
    context: ConversationContext;
    agentTrace: any[];
  }> {
    const startTime = Date.now();
    const agentTrace: any[] = [];

    try {
      // Get or create conversation context
      const context = await this.getOrCreateContext(sessionId, existingContext);
      
      // Step 1: Classify intent
      const intent = await this.classifyIntent(message, context);
      agentTrace.push({
        agentType: 'orchestrator',
        action: 'intent-classification',
        input: { message },
        output: intent,
        duration: Date.now() - startTime,
        success: true
      });

      // Step 2: Route to appropriate agent(s)
      const routingDecision = this.routeToAgents(intent);
      agentTrace.push({
        agentType: 'orchestrator',
        action: 'routing-decision',
        input: intent,
        output: routingDecision,
        duration: Date.now() - startTime,
        success: true
      });

      // Step 3: Execute tasks
      const taskResponses = await this.executeTasks(routingDecision, intent, context);
      agentTrace.push(...taskResponses.traces);

      // Step 4: Synthesize response
      const response = await this.synthesizeResponse(
        message, 
        intent, 
        taskResponses.results, 
        context
      );

      // Step 5: Update context
      const userMessage: Message = {
        id: `msg_${Date.now()}`,
        content: message,
        sender: 'user',
        timestamp: new Date(),
        intent: intent.intent,
        confidence: intent.confidence
      };

      const samResponse: Message = {
        id: `msg_${Date.now() + 1}`,
        content: response,
        sender: 'sam',
        timestamp: new Date(),
        agentTrace
      };

      context.messageHistory.push(userMessage, samResponse);
      this.activeContext.set(sessionId, context);

      return {
        response: samResponse,
        context,
        agentTrace
      };

    } catch (error) {
      console.error('Orchestrator processing error:', error);
      
      const errorResponse: Message = {
        id: `msg_${Date.now()}`,
        content: "I apologize, but I encountered an issue processing your request. Let me try to help you in a different way. Could you please rephrase your question?",
        sender: 'sam',
        timestamp: new Date(),
        agentTrace: [{
          agentType: 'orchestrator',
          action: 'error-handling',
          input: { message, error: error.message },
          output: null,
          duration: Date.now() - startTime,
          success: false,
          error: error.message
        }]
      };

      return {
        response: errorResponse,
        context: this.activeContext.get(sessionId) || await this.getOrCreateContext(sessionId, existingContext),
        agentTrace: [errorResponse.agentTrace[0]]
      };
    }
  }

  private async classifyIntent(message: string, context: ConversationContext): Promise<IntentClassification> {
    // Enhanced intent classification using patterns and keywords
    const intentPatterns: Record<MessageIntent, { keywords: string[], complexity: TaskComplexity }> = {
      'lead-generation': {
        keywords: ['find leads', 'scrape', 'prospects', 'sales navigator', 'linkedin', 'contacts'],
        complexity: 'moderate'
      },
      'campaign-optimization': {
        keywords: ['optimize', 'improve', 'performance', 'conversion', 'open rate', 'response rate'],
        complexity: 'complex'
      },
      'content-creation': {
        keywords: ['write', 'create', 'email', 'subject line', 'template', 'copy', 'message'],
        complexity: 'moderate'
      },
      'performance-analysis': {
        keywords: ['analyze', 'metrics', 'results', 'data', 'report', 'roi', 'analytics'],
        complexity: 'complex'
      },
      'automation-setup': {
        keywords: ['automate', 'sequence', 'workflow', 'campaign', 'setup', 'configure'],
        complexity: 'expert'
      },
      'knowledge-query': {
        keywords: ['what is', 'how to', 'explain', 'help', 'question', 'information'],
        complexity: 'simple'
      },
      'general-question': {
        keywords: ['hello', 'hi', 'thanks', 'yes', 'no'],
        complexity: 'simple'
      }
    };

    const messageLower = message.toLowerCase();
    let bestMatch: { intent: MessageIntent; confidence: number } = {
      intent: 'general-question',
      confidence: 0.3
    };

    // Calculate confidence scores for each intent
    for (const [intent, pattern] of Object.entries(intentPatterns)) {
      const matches = pattern.keywords.filter(keyword => 
        messageLower.includes(keyword.toLowerCase())
      ).length;
      
      const confidence = matches / pattern.keywords.length;
      if (confidence > bestMatch.confidence) {
        bestMatch = {
          intent: intent as MessageIntent,
          confidence: Math.min(confidence, 0.95)
        };
      }
    }

    // Extract parameters based on intent
    const parameters = this.extractParameters(message, bestMatch.intent);
    
    // Determine suggested agents
    const suggestedAgents = this.getSuggestedAgents(bestMatch.intent);
    
    return {
      intent: bestMatch.intent,
      confidence: bestMatch.confidence,
      parameters,
      suggestedAgents,
      complexity: intentPatterns[bestMatch.intent].complexity,
      estimatedTokens: Math.ceil(message.length / 4) // Rough token estimate
    };
  }

  private extractParameters(message: string, intent: MessageIntent): Record<string, any> {
    const parameters: Record<string, any> = {};
    
    // Basic parameter extraction patterns
    const patterns = {
      company: /(?:company|companies?|business|firm)(?:\s+(?:called|named))?\s+([A-Za-z\s&.,-]+)/i,
      location: /(?:in|from|at|near)\s+([A-Za-z\s,]+)/i,
      industry: /(?:industry|sector|field)(?:\s+of)?\s+([A-Za-z\s&.,-]+)/i,
      role: /(?:role|title|position|job)\s+(?:of|as)?\s+([A-Za-z\s&.,-]+)/i,
      metric: /(\d+(?:\.\d+)?%?)\s+(?:open rate|response rate|conversion|roi)/i
    };

    for (const [key, pattern] of Object.entries(patterns)) {
      const match = message.match(pattern);
      if (match) {
        parameters[key] = match[1].trim();
      }
    }

    return parameters;
  }

  private getSuggestedAgents(intent: MessageIntent): AgentType[] {
    const intentAgentMapping: Record<MessageIntent, AgentType[]> = {
      'lead-generation': ['lead-research', 'knowledge-base'],
      'campaign-optimization': ['campaign-strategy', 'analytics', 'content-creation'],
      'content-creation': ['content-creation', 'knowledge-base'],
      'performance-analysis': ['analytics', 'campaign-strategy'],
      'automation-setup': ['outreach-automation', 'campaign-strategy'],
      'knowledge-query': ['knowledge-base'],
      'general-question': ['knowledge-base']
    };

    return intentAgentMapping[intent] || ['knowledge-base'];
  }

  private routeToAgents(intent: IntentClassification): AgentRoutingDecision {
    const primaryAgent = intent.suggestedAgents[0];
    const supportingAgents = intent.suggestedAgents.slice(1);
    
    // Determine if tasks can be run in parallel
    const isParallel = intent.complexity !== 'simple' && supportingAgents.length > 0;
    
    // Estimate duration based on complexity
    const baseTime = {
      'simple': 3,
      'moderate': 8,
      'complex': 15,
      'expert': 25
    };

    return {
      primaryAgent,
      supportingAgents,
      isParallel,
      estimatedDuration: baseTime[intent.complexity],
      requiredCapabilities: [intent.intent]
    };
  }

  private async executeTasks(
    routing: AgentRoutingDecision, 
    intent: IntentClassification,
    context: ConversationContext
  ): Promise<{ results: TaskResponse[], traces: any[] }> {
    const results: TaskResponse[] = [];
    const traces: any[] = [];

    // Create task request
    const taskRequest: TaskRequest = {
      id: `task_${Date.now()}`,
      type: intent.intent,
      description: `Handle ${intent.intent} request with ${intent.complexity} complexity`,
      parameters: intent.parameters,
      complexity: intent.complexity,
      priority: 1,
      context: {
        sessionId: context.sessionId,
        userProfile: context.userProfile,
        messageHistory: context.messageHistory.slice(-5) // Last 5 messages for context
      }
    };

    try {
      // Execute primary agent task
      const primaryAgent = this.specialists.get(routing.primaryAgent);
      if (primaryAgent) {
        const startTime = Date.now();
        const result = await primaryAgent.processTask(taskRequest, context);
        
        traces.push({
          agentType: routing.primaryAgent,
          action: 'process-task',
          input: taskRequest,
          output: result,
          duration: Date.now() - startTime,
          success: result.success,
          error: result.error
        });
        
        results.push(result);

        // Execute supporting agents if needed
        if (routing.supportingAgents.length > 0 && routing.isParallel) {
          const supportingPromises = routing.supportingAgents.map(async agentType => {
            const agent = this.specialists.get(agentType);
            if (agent) {
              const startTime = Date.now();
              try {
                const result = await agent.processTask(taskRequest, context);
                traces.push({
                  agentType,
                  action: 'support-task',
                  input: taskRequest,
                  output: result,
                  duration: Date.now() - startTime,
                  success: result.success,
                  error: result.error
                });
                return result;
              } catch (error) {
                traces.push({
                  agentType,
                  action: 'support-task',
                  input: taskRequest,
                  output: null,
                  duration: Date.now() - startTime,
                  success: false,
                  error: error.message
                });
                return null;
              }
            }
            return null;
          });

          const supportingResults = await Promise.all(supportingPromises);
          results.push(...supportingResults.filter(r => r !== null) as TaskResponse[]);
        }
      }
    } catch (error) {
      console.error('Task execution error:', error);
      traces.push({
        agentType: 'orchestrator',
        action: 'task-execution-error',
        input: taskRequest,
        output: null,
        duration: 0,
        success: false,
        error: error.message
      });
    }

    return { results, traces };
  }

  private async synthesizeResponse(
    originalMessage: string,
    intent: IntentClassification,
    taskResults: TaskResponse[],
    context: ConversationContext
  ): Promise<string> {
    // If no successful results, provide helpful fallback
    const successfulResults = taskResults.filter(r => r.success);
    
    if (successfulResults.length === 0) {
      return this.generateFallbackResponse(intent.intent, originalMessage);
    }

    // Synthesize response based on intent and results
    const primaryResult = successfulResults[0];
    let response = "";

    switch (intent.intent) {
      case 'lead-generation':
        response = this.synthesizeLeadGenerationResponse(primaryResult, successfulResults);
        break;
      case 'campaign-optimization':
        response = this.synthesizeCampaignOptimizationResponse(primaryResult, successfulResults);
        break;
      case 'content-creation':
        response = this.synthesizeContentCreationResponse(primaryResult, successfulResults);
        break;
      case 'performance-analysis':
        response = this.synthesizeAnalyticsResponse(primaryResult, successfulResults);
        break;
      case 'automation-setup':
        response = this.synthesizeAutomationResponse(primaryResult, successfulResults);
        break;
      case 'knowledge-query':
      case 'general-question':
      default:
        response = this.synthesizeKnowledgeResponse(primaryResult, successfulResults, originalMessage);
        break;
    }

    // Add suggestions for follow-up actions
    const suggestions = this.generateFollowUpSuggestions(intent.intent, successfulResults);
    if (suggestions.length > 0) {
      response += `\n\n**What would you like to do next?**\n${suggestions.map(s => `• ${s}`).join('\n')}`;
    }

    return response;
  }

  private generateFallbackResponse(intent: MessageIntent, originalMessage: string): string {
    const fallbackResponses = {
      'lead-generation': "I'd be happy to help you find leads! Could you provide more details about your target audience, such as industry, company size, or specific roles you're targeting?",
      'campaign-optimization': "I can help optimize your campaigns. Could you share some details about your current performance metrics or specific areas you'd like to improve?",
      'content-creation': "I'd love to help create compelling content for you. What type of content do you need? Email templates, LinkedIn messages, or something else?",
      'performance-analysis': "I can analyze your campaign performance. Could you share what specific metrics or time period you'd like me to focus on?",
      'automation-setup': "I can help set up automation workflows. What specific process would you like to automate? Lead outreach, follow-ups, or something else?",
      'knowledge-query': "I'm here to help! Could you provide more context about what you'd like to know?",
      'general-question': "Thanks for reaching out! I'm SAM, your AI sales assistant. I can help with lead generation, campaign optimization, content creation, and performance analysis. What would you like to work on?"
    };

    return fallbackResponses[intent] || fallbackResponses['general-question'];
  }

  private synthesizeLeadGenerationResponse(primary: TaskResponse, all: TaskResponse[]): string {
    return "Great! I've analyzed your lead generation request. Based on your criteria, I can help you find qualified prospects using LinkedIn Sales Navigator, Google Search, and other sources. Here's what I found:\n\n" + 
           (primary.result || "I'm ready to start searching for leads that match your target profile.");
  }

  private synthesizeCampaignOptimizationResponse(primary: TaskResponse, all: TaskResponse[]): string {
    return "I've analyzed your campaign optimization needs. Here are my recommendations for improving your performance:\n\n" + 
           (primary.result || "Let me help you identify the key areas where we can boost your campaign effectiveness.");
  }

  private synthesizeContentCreationResponse(primary: TaskResponse, all: TaskResponse[]): string {
    return "I've created some content ideas for you. Here's what I came up with:\n\n" + 
           (primary.result || "I'm ready to help you create compelling, personalized content that resonates with your audience.");
  }

  private synthesizeAnalyticsResponse(primary: TaskResponse, all: TaskResponse[]): string {
    return "Here's my analysis of your performance data:\n\n" + 
           (primary.result || "I can help you dive deep into your metrics and identify opportunities for improvement.");
  }

  private synthesizeAutomationResponse(primary: TaskResponse, all: TaskResponse[]): string {
    return "I've outlined an automation strategy for you:\n\n" + 
           (primary.result || "Let me help you set up automated workflows that will save you time and improve consistency.");
  }

  private synthesizeKnowledgeResponse(primary: TaskResponse, all: TaskResponse[], originalMessage: string): string {
    return primary.result || `I understand you're asking about: "${originalMessage}". Let me provide you with the most relevant information I have on this topic.`;
  }

  private generateFollowUpSuggestions(intent: MessageIntent, results: TaskResponse[]): string[] {
    const suggestionMap = {
      'lead-generation': ['Enrich the leads with contact information', 'Create personalized outreach sequences', 'Set up automated follow-ups'],
      'campaign-optimization': ['A/B test different subject lines', 'Analyze competitor strategies', 'Create new audience segments'],
      'content-creation': ['Generate video scripts', 'Create follow-up sequences', 'Develop A/B test variants'],
      'performance-analysis': ['Set up automated reporting', 'Create optimization experiments', 'Forecast future performance'],
      'automation-setup': ['Test the workflow', 'Create backup sequences', 'Set up performance monitoring'],
      'knowledge-query': ['Learn about related topics', 'See practical examples', 'Get implementation guidance'],
      'general-question': ['Train SAM on your offering', 'Define your target audience', 'Set up your first campaign']
    };

    return suggestionMap[intent] || suggestionMap['general-question'];
  }

  private async getOrCreateContext(sessionId: string, existingContext: any): Promise<ConversationContext> {
    let context = this.activeContext.get(sessionId);
    
    if (!context) {
      context = {
        sessionId,
        userId: existingContext?.userId || 'anonymous',
        workspace: existingContext?.workspace,
        messageHistory: existingContext?.messages || [],
        userProfile: existingContext?.userProfile,
        currentTasks: [],
        completedTasks: [],
        knowledgeBase: {}
      };
      
      this.activeContext.set(sessionId, context);
    }

    return context;
  }

  async processTask(task: TaskRequest, context: ConversationContext): Promise<TaskResponse> {
    // Orchestrator doesn't process tasks directly - it delegates
    throw new Error('Orchestrator delegates tasks to specialists');
  }

  getCapabilities(): AgentCapability[] {
    return this.capabilities;
  }

  async healthCheck(): Promise<boolean> {
    // Check if specialists are healthy
    for (const [type, agent] of this.specialists) {
      try {
        const healthy = await agent.healthCheck();
        if (!healthy) {
          console.warn(`Specialist ${type} failed health check`);
          return false;
        }
      } catch (error) {
        console.error(`Health check error for ${type}:`, error);
        return false;
      }
    }
    return this.isInitialized;
  }

  async shutdown(): Promise<void> {
    this.activeContext.clear();
    this.specialists.clear();
    this.isInitialized = false;
    console.log('Orchestrator agent shut down');
  }
}