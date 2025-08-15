/**
 * LLM Service - Handles all AI model interactions
 * Uses direct OpenAI and Anthropic APIs
 */

export interface LLMConfig {
  provider: 'openai' | 'anthropic' | 'openrouter';
  apiKey: string;
  anthropicApiKey?: string;
  openrouterApiKey?: string;
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
    // Direct API models (preferred)
    fast: 'gpt-3.5-turbo',                  // Fast responses via OpenAI
    balanced: 'gpt-5',                      // PRIMARY: GPT-5 via OpenAI (cost optimized)
    quality: 'gpt-5',                       // PRIMARY: GPT-5 via OpenAI (best value)
    gpt5: 'gpt-5',                         // GPT-5 via OpenAI
    gpt4: 'gpt-4-turbo',                    // GPT-4 Turbo via OpenAI
    claude: 'claude-3-5-sonnet-20241022',   // Claude 3.5 Sonnet via Anthropic (fallback)
    
    // Specialized models - All GPT-5 for consistency and cost
    code: 'gpt-5',                         // GPT-5 for code tasks
    creative: 'gpt-5',                     // GPT-5 for creative content  
    analysis: 'gpt-5',                     // GPT-5 for analysis
    sales: 'gpt-5',                        // GPT-5 optimized for sales tasks
    
    // OpenRouter fallback models
    or_claude: 'anthropic/claude-3.5-sonnet',
    or_gpt4: 'openai/gpt-4-turbo',
    or_gpt5: 'openai/gpt-5',
    llama: 'meta-llama/llama-3.1-70b-instruct',
    mixtral: 'mistralai/mixtral-8x7b-instruct'
  };

  private constructor(config: LLMConfig) {
    let baseUrl = 'https://api.openai.com/v1';
    
    if (config.provider === 'anthropic') {
      baseUrl = 'https://api.anthropic.com/v1';
    } else if (config.provider === 'openrouter') {
      baseUrl = 'https://openrouter.ai/api/v1';
    }
    
    this.config = {
      ...config,
      baseUrl: config.baseUrl || baseUrl,
      model: config.model || this.defaultModels.quality,
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
      const openrouterKey = import.meta.env.VITE_OPENROUTER_API_KEY || '';
      
      // Require at least one API key - NO MOCK RESPONSES
      if (!anthropicKey && !openaiKey && !openrouterKey) {
        throw new Error('❌ SAM AI requires real API keys. Please set VITE_OPENAI_API_KEY, VITE_ANTHROPIC_API_KEY, or VITE_OPENROUTER_API_KEY');
      }

      // Prefer OpenAI for GPT-5 cost optimization
      let provider: 'openai' | 'anthropic' | 'openrouter' = 'openai';
      let apiKey = openaiKey;
      
      if (!openaiKey && anthropicKey) {
        provider = 'anthropic';
        apiKey = anthropicKey;
      } else if (!openaiKey && !anthropicKey && openrouterKey) {
        provider = 'openrouter';
        apiKey = openrouterKey;
      }

      console.log(`🚀 Initializing LLMService with provider: ${provider} (GPT-5 optimized for cost & performance)`);

      LLMService.instance = new LLMService({
        provider,
        apiKey,
        openrouterApiKey: openrouterKey,
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
    // Require API key - NO MOCK RESPONSES
    if (!this.config.apiKey) {
      throw new Error('❌ No API key configured. SAM AI requires real API keys to function.');
    }

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
        'HTTP-Referer': 'https://sameaisalesassistant.netlify.app',
        'X-Title': 'SAM AI Sales Assistant'
      };
      
      // Add OpenRouter specific headers
      if (this.config.provider === 'openrouter') {
        headers['HTTP-Referer'] = 'https://sameaisalesassistant.netlify.app';
        headers['X-Title'] = 'SAM AI Sales Assistant';
      }
      
      // Add Anthropic specific headers
      if (this.config.provider === 'anthropic') {
        headers['anthropic-version'] = '2023-06-01';
        delete headers['Authorization'];
        headers['x-api-key'] = this.config.apiKey;
      }

      let endpoint = '/chat/completions';
      let body: any;
      
      if (this.config.provider === 'anthropic') {
        endpoint = '/messages';
        body = {
          model: options?.model || this.config.model,
          max_tokens: options?.maxTokens || this.config.maxTokens,
          temperature: options?.temperature || this.config.temperature,
          messages: messages
        };
      } else {
        body = {
          model: options?.model || this.config.model,
          messages: messages,
          temperature: options?.temperature || this.config.temperature,
          max_tokens: options?.maxTokens || this.config.maxTokens,
          stream: options?.stream || false
        };
      }

      const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || `LLM request failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Handle different response formats
      let content: string;
      let model: string;
      let usage: any;
      let finishReason: string;
      
      if (this.config.provider === 'anthropic') {
        content = data.content?.[0]?.text || data.content || '';
        model = data.model || 'claude-3.5-sonnet';
        usage = data.usage;
        finishReason = data.stop_reason || 'stop';
      } else {
        content = data.choices?.[0]?.message?.content || '';
        model = data.model || this.config.model || 'unknown';
        usage = data.usage;
        finishReason = data.choices?.[0]?.finish_reason || 'stop';
      }
      
      return {
        content,
        model,
        usage: usage ? {
          promptTokens: usage.prompt_tokens || usage.input_tokens || 0,
          completionTokens: usage.completion_tokens || usage.output_tokens || 0,
          totalTokens: usage.total_tokens || (usage.input_tokens + usage.output_tokens) || 0
        } : undefined,
        finishReason
      };
    } catch (error) {
      console.error('LLM request failed:', error);
      // NO MOCK FALLBACK - throw the actual error
      throw new Error(`❌ AI request failed: ${error.message}. Please check your API key and network connection.`);
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
      throw new Error('❌ No API key configured. SAM AI requires real API keys for streaming.');
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
      // NO MOCK FALLBACK - throw the actual error
      throw new Error(`❌ AI streaming failed: ${error.message}. Please check your API key and network connection.`);
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
   * Validate API connection
   */
  public async validateConnection(): Promise<boolean> {
    try {
      const testResponse = await this.chat([
        { role: 'user', content: 'Hello, please respond with: Connection verified' }
      ], { maxTokens: 10, temperature: 0 });
      return testResponse.content.includes('verified') || testResponse.content.includes('Connection');
    } catch (error) {
      console.error('API connection validation failed:', error);
      return false;
    }
  }

  /**
   * Create a system prompt for the agent
   */
  public createSystemPrompt(agentType: string, context?: Record<string, unknown>): string {
    const prompts: Record<string, string> = {
      orchestrator: `You are SAM, an AI Sales Assistant powered by GPT-5 that orchestrates a team of specialist agents. You are helpful, professional, and focused on driving sales success. You coordinate between different specialists to provide comprehensive, cost-effective solutions.

Current context: ${JSON.stringify(context || {})}

Your capabilities include:
- Lead generation and research
- Campaign creation and optimization  
- Content writing and personalization
- Performance analysis and reporting
- Email and LinkedIn automation

Always be concise, actionable, and results-oriented. Leverage GPT-5's advanced reasoning for complex sales strategies.`,

      'lead-research': `You are a Lead Research Specialist. Your role is to find and qualify prospects based on specific criteria. You excel at using LinkedIn Sales Navigator, web scraping, and data enrichment to build targeted prospect lists.`,

      'campaign-management': `You are a Campaign Management Expert. You create and optimize multi-channel outreach campaigns, design sequences, set up A/B tests, and ensure maximum engagement and conversion rates.`,

      'content-creation': `You are a Content Creation Specialist. You write compelling, personalized outreach messages, email templates, LinkedIn messages, and follow-up sequences that resonate with prospects and drive responses.`,

      default: `You are a helpful AI assistant focused on sales and marketing automation. Provide clear, actionable advice to help achieve sales goals.`
    };

    return prompts[agentType] || prompts.default;
  }
}

export default LLMService;