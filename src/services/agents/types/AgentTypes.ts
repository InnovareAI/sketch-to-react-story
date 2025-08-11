/**
 * Type definitions for SAM AI Multi-Agent System
 * Following Anthropic's best practices for agent design
 */

export type AgentType = 
  | 'orchestrator'
  | 'lead-research'
  | 'campaign-strategy' 
  | 'content-creation'
  | 'outreach-automation'
  | 'analytics'
  | 'knowledge-base';

export type TaskComplexity = 'simple' | 'moderate' | 'complex' | 'expert';

export type MessageIntent = 
  | 'lead-generation'
  | 'campaign-optimization'
  | 'content-creation'
  | 'performance-analysis'
  | 'automation-setup'
  | 'knowledge-query'
  | 'general-question';

export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'sam' | AgentType;
  timestamp: Date;
  intent?: MessageIntent;
  confidence?: number;
  context?: Record<string, any>;
  agentTrace?: AgentTrace[];
}

export interface AgentTrace {
  agentType: AgentType;
  action: string;
  input: any;
  output: any;
  duration: number;
  success: boolean;
  error?: string;
}

export interface TaskRequest {
  id: string;
  type: MessageIntent;
  description: string;
  parameters: Record<string, any>;
  complexity: TaskComplexity;
  priority: number;
  deadline?: Date;
  context: Record<string, any>;
}

export interface TaskResponse {
  taskId: string;
  agentType: AgentType;
  result: any;
  success: boolean;
  error?: string;
  suggestions?: string[];
  followUpTasks?: TaskRequest[];
  confidence: number;
  metadata: Record<string, any>;
}

export interface AgentCapability {
  name: string;
  description: string;
  supportedComplexity: TaskComplexity[];
  estimatedDuration: number; // in seconds
  requiredParameters: string[];
  optionalParameters: string[];
}

export interface AgentConfig {
  apiKeys: {
    openai?: string;
    claude?: string;
    brightData?: string;
    unipile?: string;
    repliq?: string;
  };
  supabase: {
    url: string;
    anonKey: string;
    serviceKey?: string;
  };
  features: {
    voiceEnabled: boolean;
    videoGeneration: boolean;
    linkedinAutomation: boolean;
    emailAutomation: boolean;
  };
  limits: {
    maxParallelTasks: number;
    maxTokensPerRequest: number;
    maxSessionDuration: number; // in minutes
  };
  prompts: Record<AgentType, string>;
}

export interface ConversationContext {
  sessionId: string;
  userId: string;
  workspace?: string;
  messageHistory: Message[];
  userProfile?: {
    name: string;
    company: string;
    targetAudience: string;
    productOffering: string;
    campaignGoals: string[];
  };
  currentTasks: TaskRequest[];
  completedTasks: TaskResponse[];
  knowledgeBase: Record<string, any>;
}

export abstract class BaseAgent {
  protected agentType: AgentType;
  protected config: AgentConfig;
  protected capabilities: AgentCapability[] = [];
  protected isInitialized = false;

  constructor(agentType: AgentType, config: AgentConfig) {
    this.agentType = agentType;
    this.config = config;
  }

  abstract initialize(): Promise<void>;
  abstract processTask(task: TaskRequest, context: ConversationContext): Promise<TaskResponse>;
  abstract getCapabilities(): AgentCapability[];
  abstract healthCheck(): Promise<boolean>;
  abstract shutdown(): Promise<void>;

  public getAgentType(): AgentType {
    return this.agentType;
  }

  public isReady(): boolean {
    return this.isInitialized;
  }

  protected validateTask(task: TaskRequest): boolean {
    // Check if agent can handle this task complexity
    const capability = this.capabilities.find(c => 
      c.supportedComplexity.includes(task.complexity)
    );
    return !!capability;
  }

  protected createTaskResponse(
    taskId: string,
    result: any,
    success: boolean,
    error?: string,
    metadata: Record<string, any> = {}
  ): TaskResponse {
    return {
      taskId,
      agentType: this.agentType,
      result,
      success,
      error,
      confidence: success ? 0.9 : 0.1,
      metadata: {
        timestamp: new Date().toISOString(),
        ...metadata
      }
    };
  }
}

export type AgentInstance = BaseAgent;

export interface IntentClassification {
  intent: MessageIntent;
  confidence: number;
  parameters: Record<string, any>;
  suggestedAgents: AgentType[];
  complexity: TaskComplexity;
  estimatedTokens: number;
}

export interface AgentRoutingDecision {
  primaryAgent: AgentType;
  supportingAgents: AgentType[];
  isParallel: boolean;
  estimatedDuration: number;
  requiredCapabilities: string[];
}