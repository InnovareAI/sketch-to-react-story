/**
 * LLM Service - Handles all AI model interactions
 * Uses direct OpenAI and Anthropic APIs
 */

export interface LLMConfig {
  provider: 'openai' | 'anthropic';
  apiKey: string;
  anthropicApiKey?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  baseUrl?: string;
}

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason?: string;
}

export class LLMService {
  private static instance: LLMService;
  private config: LLMConfig;
  private defaultModels = {
    // OpenAI models
    fast: 'gpt-3.5-turbo',                   // Fast responses
    balanced: 'gpt-4-turbo-preview',         // Balanced performance
    gpt4: 'gpt-4-turbo-preview',            // GPT-4 Turbo
    gpt5: 'gpt-5-turbo',                    // GPT-5 (when available)
    
    // Anthropic models
    claude: 'claude-3-opus-20240229',       // Claude 3 Opus
    quality: 'claude-3-opus-20240229',      // PRIMARY: Claude 3 Opus
    
    // Specialized models
    code: 'claude-3-opus-20240229',         // Claude for code tasks
    creative: 'gpt-4-turbo-preview',        // GPT-4 for creative content
    analysis: 'claude-3-opus-20240229'      // Claude for analysis
  };

  private constructor(config: LLMConfig) {
    this.config = {
      ...config,
      baseUrl: config.provider === 'openai' 
        ? 'https://api.openai.com/v1'
        : 'https://api.anthropic.com/v1',
      model: config.model || (config.provider === 'openai' ? this.defaultModels.gpt4 : this.defaultModels.claude),
      temperature: config.temperature || 0.7,
      maxTokens: config.maxTokens || 2000
    };
  }

  public static initialize(config: LLMConfig): void {
    if (!LLMService.instance) {
      LLMService.instance = new LLMService(config);
    }
  }

  public static getInstance(): LLMService {
    if (!LLMService.instance) {
      // Initialize with environment variables if available
      const openaiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
      const anthropicKey = import.meta.env.VITE_ANTHROPIC_API_KEY || '';
      
      if (!openaiKey && !anthropicKey) {
        console.warn('No API keys found. Using mock responses.');
      }

      LLMService.instance = new LLMService({
        provider: openaiKey ? 'openai' : 'anthropic',
        apiKey: openaiKey || anthropicKey,
        anthropicApiKey: anthropicKey
      });
    }
    return LLMService.instance;
  }

  /**
   * Send a chat completion request
   */
  public async chat(
    messages: LLMMessage[],
    options?: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
      stream?: boolean;
    }
  ): Promise<LLMResponse> {
    // If no API key, return mock response
    if (!this.config.apiKey) {
      return this.getMockResponse(messages);
    }

    try {
      const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
          'HTTP-Referer': 'https://sameaisalesassistant.netlify.app',
          'X-Title': 'SAM AI Sales Assistant'
        },
        body: JSON.stringify({
          model: options?.model || this.config.model,
          messages: messages,
          temperature: options?.temperature || this.config.temperature,
          max_tokens: options?.maxTokens || this.config.maxTokens,
          stream: options?.stream || false
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || `LLM request failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        content: data.choices[0].message.content,
        model: data.model,
        usage: data.usage ? {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens
        } : undefined,
        finishReason: data.choices[0].finish_reason
      };
    } catch (error) {
      console.error('LLM request failed:', error);
      // Fallback to mock response on error
      return this.getMockResponse(messages);
    }
  }

  /**
   * Stream a chat completion response
   */
  public async *streamChat(
    messages: LLMMessage[],
    options?: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
    }
  ): AsyncGenerator<string, void, unknown> {
    if (!this.config.apiKey) {
      // Mock streaming response
      const response = await this.getMockResponse(messages);
      const words = response.content.split(' ');
      for (const word of words) {
        yield word + ' ';
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      return;
    }

    try {
      const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
          'HTTP-Referer': 'https://sameaisalesassistant.netlify.app',
          'X-Title': 'SAM AI Sales Assistant'
        },
        body: JSON.stringify({
          model: options?.model || this.config.model,
          messages: messages,
          temperature: options?.temperature || this.config.temperature,
          max_tokens: options?.maxTokens || this.config.maxTokens,
          stream: true
        })
      });

      if (!response.ok) {
        throw new Error(`LLM stream request failed: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('Response body is not readable');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content;
              if (content) {
                yield content;
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      console.error('LLM stream failed:', error);
      // Fallback to mock streaming
      const response = await this.getMockResponse(messages);
      const words = response.content.split(' ');
      for (const word of words) {
        yield word + ' ';
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
  }

  /**
   * Get available models
   */
  public getAvailableModels(): Record<string, string> {
    return this.defaultModels;
  }

  /**
   * Switch to a different model
   */
  public setModel(modelKey: keyof typeof LLMService.prototype.defaultModels | string): void {
    if (modelKey in this.defaultModels) {
      this.config.model = this.defaultModels[modelKey as keyof typeof this.defaultModels];
    } else {
      this.config.model = modelKey;
    }
  }

  /**
   * Generate a mock response for testing
   */
  private getMockResponse(messages: LLMMessage[]): LLMResponse {
    const lastMessage = messages[messages.length - 1].content.toLowerCase();
    
    // Context-aware mock responses
    if (lastMessage.includes('lead') || lastMessage.includes('prospect')) {
      return {
        content: "I'll help you find qualified leads. Based on your requirements, I can search LinkedIn Sales Navigator, enrich contact data, and build targeted prospect lists. What specific criteria should I use for your ideal customer profile?",
        model: 'mock',
      };
    }
    
    if (lastMessage.includes('campaign')) {
      return {
        content: "I'll create a multi-channel outreach campaign for you. This will include personalized email sequences, LinkedIn connection requests, and follow-up strategies. Let me analyze your target audience and craft compelling messages that resonate with their pain points.",
        model: 'mock',
      };
    }
    
    if (lastMessage.includes('email') || lastMessage.includes('message')) {
      return {
        content: "I'll write personalized outreach messages for you. Here's a template that focuses on value proposition and includes personalization elements based on the prospect's background. Would you like me to create variations for A/B testing?",
        model: 'mock',
      };
    }

    if (lastMessage.includes('analyze') || lastMessage.includes('performance')) {
      return {
        content: "Let me analyze your campaign performance. I'm reviewing open rates, response rates, and conversion metrics. Based on the data, I can identify optimization opportunities and suggest improvements to boost your results.",
        model: 'mock',
      };
    }

    // Default response
    return {
      content: "I'm SAM, your AI sales assistant. I can help you with lead generation, campaign creation, content writing, and performance analysis. What would you like to work on today?",
      model: 'mock',
    };
  }

  /**
   * Create a system prompt for the agent
   */
  public createSystemPrompt(agentType: string, context?: Record<string, unknown>): string {
    const prompts: Record<string, string> = {
      orchestrator: `You are SAM, an AI Sales Assistant that orchestrates a team of specialist agents. You are helpful, professional, and focused on driving sales success. You coordinate between different specialists to provide comprehensive solutions.

Current context: ${JSON.stringify(context || {})}

Your capabilities include:
- Lead generation and research
- Campaign creation and optimization  
- Content writing and personalization
- Performance analysis and reporting
- Email and LinkedIn automation

Always be concise, actionable, and results-oriented.`,

      'lead-research': `You are a Lead Research Specialist. Your role is to find and qualify prospects based on specific criteria. You excel at using LinkedIn Sales Navigator, web scraping, and data enrichment to build targeted prospect lists.`,

      'campaign-management': `You are a Campaign Management Expert. You create and optimize multi-channel outreach campaigns, design sequences, set up A/B tests, and ensure maximum engagement and conversion rates.`,

      'content-creation': `You are a Content Creation Specialist. You write compelling, personalized outreach messages, email templates, LinkedIn messages, and follow-up sequences that resonate with prospects and drive responses.`,

      default: `You are a helpful AI assistant focused on sales and marketing automation. Provide clear, actionable advice to help achieve sales goals.`
    };

    return prompts[agentType] || prompts.default;
  }
}

export default LLMService;