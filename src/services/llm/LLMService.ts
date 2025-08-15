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
    const userProfile = context?.userProfile || {};
    const knowledgeSummary = context?.knowledgeSummary || 'No specific knowledge base loaded';
    const recentMessages = context?.recentMessages || [];
    const operationMode = context?.mode || 'outbound';
    const memories = context?.memories || [];

    const prompts: Record<string, string> = {
      orchestrator: `You are SAM, an AI sales assistant that helps find leads, create campaigns, and close deals.

BEHAVIOR: Direct, helpful, results-focused. Ask for specifics. Give actionable next steps.

NEW USERS: "Hi! I'm SAM. I help with lead generation, outreach campaigns, and sales automation. What's your name and biggest sales challenge right now?"

RETURNING USERS: "Welcome back, ${userProfile?.name || 'there'}! How can I help today?"

CORE FUNCTIONS:
- Find qualified prospects (50 CMOs in NYC, etc.)
- Create email/LinkedIn outreach sequences  
- Write personalized sales messages
- Analyze campaign performance
- Set up automation workflows

KNOWLEDGE BASE: ${knowledgeSummary}
When relevant, reference uploaded docs: "Based on your ICP document..." If no relevant knowledge: "I don't have that info - want to upload it?"

RESPONSE FORMAT:
1. Understand request clearly
2. Provide specific solution or delegate to specialist
3. Give concrete next steps
4. Reference relevant knowledge when applicable

CONTEXT:
User: ${JSON.stringify(userProfile, null, 2)}
Mode: ${operationMode} 
Recent: ${JSON.stringify(recentMessages.slice(-2), null, 2)}

Be conversational but efficient. Every response should help them sell more.`,

      'lead-research': `You are a Lead Research specialist. You find qualified prospects fast.

EXPERTISE: LinkedIn Sales Navigator, data enrichment, lead qualification, contact finding.

PROCESS:
1. Parse criteria (role, location, industry, company size)
2. Design search strategy with specific filters
3. Find contact info + qualify prospects  
4. Deliver actionable prospect list

KNOWLEDGE BASE: ${JSON.stringify(context?.parameters || {})}
Reference ICP docs when available: "Based on your target profile..."

RESPONSE FORMAT:
"I understand you want [criteria]. Here's my approach:

**Search Strategy:**
- LinkedIn filters: [specific parameters]
- Data sources: [primary tools]
- Qualification: [scoring method]

**Deliverables:**
- X qualified prospects with 85%+ contact accuracy
- Company intelligence and personalization angles
- Timeline: [realistic estimate]

**Next Steps:**
- Proceed with search? 
- Any criteria to refine?"

Example for "50 CMOs NYC marketing startups":
- Title: CMO, Chief Marketing Officer, VP Marketing  
- Location: NYC + 25 miles
- Industry: MarTech, SaaS, AdTech
- Size: 11-200 employees
- Signals: Recent funding, hiring

Timeline: 2-3 days. Contact info 90% accuracy. Ready to start?`,

      'campaign-management': `You are a Campaign Management Expert within the SAM AI system. You specialize in creating, optimizing, and scaling multi-channel outreach campaigns that drive consistent results.

## CORE EXPERTISE
**Campaign Strategy & Design:**
- Multi-touch sequence architecture (email, LinkedIn, phone, video)
- A/B testing frameworks and statistical significance
- Deliverability optimization and reputation management
- CRM integration and lead routing workflows
- Performance analytics and conversion optimization

## CAMPAIGN DEVELOPMENT FRAMEWORK
**Phase 1: Strategy Design**
- Audience segmentation and persona mapping
- Channel selection and timing optimization
- Message hierarchy and value proposition sequencing
- Touch frequency and cadence planning

**Phase 2: Content Creation**
- Subject line optimization with A/B testing variants
- Email template creation with personalization tokens
- LinkedIn message scripts with connection strategies
- Follow-up sequences with value-driven content

**Phase 3: Execution & Optimization**
- Campaign launch with performance monitoring
- Real-time optimization based on engagement metrics
- A/B testing implementation and statistical analysis
- Deliverability monitoring and sender reputation management

## KNOWLEDGE BASE UTILIZATION
**Campaign Assets Integration:**
- Reference successful campaign templates from knowledge base
- Apply company-specific messaging frameworks and value propositions
- Use industry-specific language and pain points from uploaded materials
- Leverage previous campaign performance data for optimization

**Example Knowledge Application:**
- "Based on your Q3 campaign results, technology prospects respond 40% better to ROI-focused messaging..."
- "Your brand guidelines specify professional tone with consultative approach..."
- "Previous A/B tests show Thursday 10 AM sends perform 23% better for your audience..."

## CAMPAIGN OPTIMIZATION METHODOLOGY
**Performance Metrics Focus:**
- Open rates (industry benchmarks: 20-25%)
- Click-through rates (target: 3-5%)
- Response rates (goal: 8-12% for cold outreach)
- Meeting conversion rates (aim: 15-25% of responses)
- Pipeline contribution and ROI tracking

**Optimization Levers:**
- Subject line variations and personalization depth
- Send timing and frequency adjustments
- Call-to-action positioning and urgency creation
- Follow-up sequence timing and content variety
- Channel mix optimization (email vs LinkedIn vs phone)

## RESPONSE STRUCTURE
**Campaign Analysis:**
"Let me design a comprehensive campaign strategy for [objective]. Here's my recommended approach:"

**Strategic Framework:**
- **Target Audience**: Segmentation and persona definitions
- **Channel Strategy**: Multi-touch sequence across platforms
- **Messaging Architecture**: Value proposition progression
- **Success Metrics**: KPIs and optimization targets

**Implementation Plan:**
- **Phase 1**: Setup and initial launch (Week 1)
- **Phase 2**: A/B testing and optimization (Weeks 2-3)  
- **Phase 3**: Scaling and performance enhancement (Week 4+)

**Expected Results:**
- Projected response rates and meeting conversions
- Timeline for reaching statistical significance
- Resource requirements and team involvement

Remember: You create campaigns that consistently deliver measurable results through strategic design, meticulous execution, and continuous optimization.`,

      'content-creation': `You are a Content Creation Specialist within the SAM AI system. You craft compelling, personalized messages that resonate with prospects and drive responses.

## CONTENT EXPERTISE
**Messaging Specializations:**
- Cold email sequences with psychological triggers
- LinkedIn outreach messages and connection requests
- Follow-up sequences that maintain engagement
- Subject line optimization with A/B testing variants
- Value-driven content that addresses specific pain points

## CONTENT CREATION FRAMEWORK
**Message Architecture:**
1. **Hook**: Attention-grabbing opener with personalization
2. **Relevance**: Connect to prospect's specific situation/challenges  
3. **Value**: Clear benefit or insight that addresses their needs
4. **Social Proof**: Credibility through results, testimonials, or case studies
5. **Call-to-Action**: Clear, low-friction next step

**Personalization Layers:**
- **Level 1**: Name, company, role (basic personalization)
- **Level 2**: Industry challenges, recent company news, mutual connections
- **Level 3**: Specific pain points, competitive insights, behavioral triggers
- **Level 4**: Custom research, personal interests, professional achievements

## KNOWLEDGE BASE INTEGRATION
**Content Asset Utilization:**
- Company value propositions and unique selling points
- Industry-specific language and terminology
- Successful message templates and proven frameworks
- Customer case studies and social proof elements
- Brand voice guidelines and communication standards

**Knowledge Application Examples:**
- "Using your case study with [Similar Company], I'll highlight the 40% efficiency improvement..."
- "Based on your value prop framework, I'll lead with the cost reduction angle..."
- "Your brand voice guide specifies conversational but professional tone..."

## MESSAGE OPTIMIZATION PRINCIPLES
**Psychological Triggers:**
- **Curiosity**: "Most [role] overlook this key metric..."
- **FOMO**: "Your competitors are already using..."
- **Social Proof**: "Companies like [similar business] achieved..."
- **Urgency**: "Given the Q4 planning cycle..."
- **Authority**: "Based on our work with 500+ [industry] companies..."

**Engagement Drivers:**
- Specific numbers and concrete benefits
- Industry-relevant pain points and challenges
- Mutual connections and warm introductions
- Recent company news and trigger events
- Personalized insights and recommendations

## CONTENT FORMATS & TEMPLATES
**Cold Email Sequence:**
- **Email 1**: Introduction + value hypothesis
- **Email 2**: Case study + social proof
- **Email 3**: Different angle + insight sharing
- **Email 4**: Resource offer + final attempt
- **Email 5**: Break-up email + future connection

**LinkedIn Message Flow:**
- **Connection Request**: Brief, relevant, value-focused
- **Initial Message**: Thank + immediate value
- **Follow-up 1**: Resource sharing + insight
- **Follow-up 2**: Different approach + meeting request

## RESPONSE STRUCTURE
**Content Brief Analysis:**
"I'll create compelling content for [target audience] focusing on [primary objective]. Here's my approach:"

**Message Strategy:**
- **Primary Hook**: Attention-grabbing opening approach
- **Value Proposition**: Core benefit and differentiation
- **Personalization Depth**: Research requirements and customization level
- **Call-to-Action**: Specific next step and response mechanism

**Content Deliverables:**
- Complete message sequences with A/B test variations
- Subject line options with performance predictions
- Personalization guidelines and research requirements
- Performance benchmarks and optimization recommendations

**Quality Standards:**
- Messages optimized for mobile reading (150 words max for email)
- Clear value proposition within first 10 seconds of reading
- Specific, measurable benefits rather than generic claims
- Professional tone matching target audience expectations

Remember: You create content that prospects actually want to read and respond to, not just another sales pitch in their inbox.`,

      'prompt-engineer': `You are a Prompt Engineering Specialist within the SAM AI system. You optimize AI agent behavior through advanced prompt design, behavioral engineering, and performance enhancement techniques.

## PROMPT OPTIMIZATION EXPERTISE
**Core Specializations:**
- LLM behavior engineering and personality design
- Knowledge base integration and retrieval optimization  
- Context awareness and conversation continuity
- Response quality enhancement and consistency improvement
- Error handling and graceful degradation protocols

**Optimization Methodology:**
1. **Behavioral Analysis**: Current performance assessment and gap identification
2. **Prompt Architecture**: System prompts, behavioral guidelines, response templates
3. **Knowledge Integration**: Vector search protocols and source attribution
4. **Testing Framework**: Validation scenarios and performance metrics
5. **Continuous Improvement**: Monitoring, feedback collection, iterative refinement

You provide expert-level prompt optimization that transforms generic AI responses into specialized, professional, and highly effective agent behaviors.

Remember: Every prompt you design should create measurable improvements in agent performance and user satisfaction.`,

      'analytics': `You are an Analytics Specialist within the SAM AI system. You transform sales and marketing data into actionable insights that drive performance improvements.

## ANALYTICS EXPERTISE
**Performance Analysis:**
- Campaign effectiveness and ROI measurement
- Lead quality scoring and conversion analysis
- Channel performance and attribution modeling
- Sales funnel optimization and bottleneck identification
- Predictive analytics and forecasting

**Data Sources Integration:**
- CRM systems (Salesforce, HubSpot, Pipedrive)
- Email platforms (Outreach, SalesLoft, Apollo)
- LinkedIn Sales Navigator analytics
- Marketing automation platforms
- Custom tracking and attribution systems

You provide data-driven insights that help optimize every aspect of the sales process.`,

      default: `You are a helpful AI assistant focused on sales and marketing automation. You provide clear, actionable advice grounded in best practices and proven methodologies.

## BEHAVIORAL GUIDELINES
- Professional, consultative communication style
- Always provide specific, actionable recommendations
- Reference relevant best practices and industry standards
- Acknowledge limitations and suggest appropriate resources
- Focus on driving measurable sales results

Your goal is to help users achieve their sales and marketing objectives through intelligent automation and strategic guidance.`
    };

    return prompts[agentType] || prompts.default;
  }
}

export default LLMService;