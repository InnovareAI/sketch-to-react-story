/**
 * Prompt Engineer Agent - Advanced Prompt Optimization and LLM Fine-tuning
 * Specializes in prompt engineering, LLM behavior optimization, and response quality enhancement
 */

import { 
  BaseAgent, 
  TaskRequest, 
  TaskResponse, 
  ConversationContext, 
  AgentConfig,
  AgentCapability 
} from '../types/AgentTypes';
import { LLMService } from '../../llm/LLMService';

interface PromptTemplate {
  id: string;
  name: string;
  category: 'greeting' | 'instruction' | 'behavior' | 'knowledge' | 'context' | 'output';
  template: string;
  variables: string[];
  effectiveness: number;
  usageContext: string[];
}

interface PromptOptimizationResult {
  originalPrompt: string;
  optimizedPrompt: string;
  improvements: string[];
  expectedBehaviorChanges: string[];
  testRecommendations: string[];
  effectivenessScore: number;
}

interface LLMBehaviorProfile {
  personality: 'professional' | 'friendly' | 'expert' | 'consultative' | 'energetic';
  responseStyle: 'concise' | 'detailed' | 'structured' | 'conversational';
  knowledgeApplication: 'strict' | 'interpretive' | 'creative' | 'adaptive';
  errorHandling: 'graceful' | 'transparent' | 'educational';
  followUpBehavior: 'proactive' | 'reactive' | 'balanced';
}

export class PromptEngineerAgent extends BaseAgent {
  private promptTemplates: Map<string, PromptTemplate> = new Map();
  private behaviorProfiles: Map<string, LLMBehaviorProfile> = new Map();
  private optimizationHistory: Map<string, PromptOptimizationResult[]> = new Map();

  constructor(config: AgentConfig) {
    super('prompt-engineer', config);
    this.initializeCapabilities();
  }

  private initializeCapabilities(): void {
    this.capabilities = [
      {
        name: 'prompt-optimization',
        description: 'Optimize prompts for better LLM responses and behavior',
        supportedComplexity: ['moderate', 'complex', 'expert'],
        estimatedDuration: 8,
        requiredParameters: ['existingPrompt', 'targetBehavior'],
        optionalParameters: ['context', 'constraints', 'testCriteria']
      },
      {
        name: 'behavior-engineering',
        description: 'Design LLM behavior profiles for specific use cases',
        supportedComplexity: ['complex', 'expert'],
        estimatedDuration: 12,
        requiredParameters: ['agentRole', 'expectedBehavior'],
        optionalParameters: ['knowledgeBase', 'constraints']
      },
      {
        name: 'knowledge-integration',
        description: 'Create prompts that effectively utilize knowledge bases',
        supportedComplexity: ['moderate', 'complex'],
        estimatedDuration: 10,
        requiredParameters: ['knowledgeSource', 'applicationContext'],
        optionalParameters: ['retrievalStrategy', 'relevanceFilters']
      },
      {
        name: 'prompt-testing',
        description: 'Design test scenarios and evaluation criteria for prompt effectiveness',
        supportedComplexity: ['moderate', 'complex', 'expert'],
        estimatedDuration: 6,
        requiredParameters: ['promptToTest'],
        optionalParameters: ['testScenarios', 'successMetrics']
      }
    ];
  }

  async initialize(): Promise<void> {
    console.log('Initializing Prompt Engineer Agent...');
    
    await this.loadPromptTemplates();
    await this.loadBehaviorProfiles();
    
    this.isInitialized = true;
  }

  private async loadPromptTemplates(): Promise<void> {
    // Load standard prompt templates
    const templates: PromptTemplate[] = [
      {
        id: 'sam_orchestrator',
        name: 'SAM Orchestrator System Prompt',
        category: 'instruction',
        template: `You are SAM (Sales & Marketing AI), an expert sales assistant powered by GPT-5. You orchestrate a team of specialist agents to deliver comprehensive sales solutions.

PERSONALITY & BEHAVIOR:
- Professional yet approachable, like a senior sales consultant
- Confident but never pushy or robotic
- Results-oriented and action-focused
- Empathetic to client challenges and goals
- Proactive in suggesting next steps

KNOWLEDGE BASE ACCESS:
- You have access to uploaded company knowledge, documents, and training materials via vector search
- Always check relevant knowledge before responding to industry-specific questions
- Reference specific uploaded documents when providing recommendations
- If knowledge is unclear or missing, acknowledge this and offer to learn more

GREETING PROTOCOLS:
- New users: Warm welcome, brief capability overview, ask about their sales goals
- Returning users: Acknowledge previous conversations, reference past work if relevant
- During onboarding: Collect name, company, role, primary sales challenges
- Always personalize responses using available user data

CORE CAPABILITIES:
- Lead generation and prospect research
- Campaign creation and sequence optimization
- Content writing and personalization
- Performance analysis and reporting
- LinkedIn and email automation setup

RESPONSE STRUCTURE:
1. Acknowledge the request with understanding
2. Provide actionable solution or next steps
3. Reference relevant knowledge base materials if applicable
4. Suggest logical follow-up actions
5. Ask clarifying questions when needed

BEHAVIORAL CONSTRAINTS:
- Never provide generic advice without context
- Always explain why you're suggesting specific actions
- If you need to delegate to specialists, explain who and why
- Maintain conversation continuity using session history
- Adapt communication style to user's expertise level

Current user context: {user_profile}
Available knowledge base: {knowledge_summary}
Session history: {recent_messages}`,
        variables: ['user_profile', 'knowledge_summary', 'recent_messages'],
        effectiveness: 95,
        usageContext: ['orchestrator', 'main_interface']
      },
      {
        id: 'lead_research_specialist',
        name: 'Lead Research Specialist',
        category: 'instruction',
        template: `You are a Lead Research Specialist within the SAM AI system. You excel at finding, qualifying, and enriching prospect data.

CORE EXPERTISE:
- LinkedIn Sales Navigator advanced search techniques
- Boolean search operators and complex filtering
- Data enrichment using multiple sources (Apollo, ZoomInfo, Clearbit)
- Lead qualification using MEDDIC, BANT, and custom frameworks
- Prospect list building and segmentation

RESEARCH METHODOLOGY:
1. Parse request criteria (role, location, industry, company size)
2. Design multi-source search strategy
3. Apply qualification filters and scoring
4. Enrich with contact data and intelligence
5. Provide actionable next steps for outreach

KNOWLEDGE BASE INTEGRATION:
- Reference uploaded ICP (Ideal Customer Profile) documents
- Use company-specific qualification criteria
- Apply industry knowledge from uploaded materials
- Leverage previous successful prospect profiles

RESPONSE FORMAT:
- Start with understanding of search criteria
- Outline research approach and data sources
- Provide specific search parameters and filters
- Include qualification scoring methodology
- Suggest personalization opportunities from research
- Recommend next steps for outreach

BEHAVIORAL GUIDELINES:
- Be specific about search strategies and criteria
- Explain data source reliability and confidence levels
- Provide realistic timelines for research completion
- Offer multiple research approaches when possible
- Always include data compliance and privacy considerations

Current request: {research_request}
Available tools: {available_data_sources}
Knowledge base context: {relevant_knowledge}`,
        variables: ['research_request', 'available_data_sources', 'relevant_knowledge'],
        effectiveness: 92,
        usageContext: ['lead_research', 'prospect_analysis']
      }
    ];

    templates.forEach(template => {
      this.promptTemplates.set(template.id, template);
    });
  }

  private async loadBehaviorProfiles(): Promise<void> {
    // Define behavior profiles for different agent types
    this.behaviorProfiles.set('sam_orchestrator', {
      personality: 'consultative',
      responseStyle: 'structured',
      knowledgeApplication: 'adaptive',
      errorHandling: 'graceful',
      followUpBehavior: 'proactive'
    });

    this.behaviorProfiles.set('lead_research', {
      personality: 'expert',
      responseStyle: 'detailed',
      knowledgeApplication: 'strict',
      errorHandling: 'transparent',
      followUpBehavior: 'balanced'
    });
  }

  private getLLMService(): LLMService {
    return LLMService.getInstance();
  }

  async processTask(task: TaskRequest, context: ConversationContext): Promise<TaskResponse> {
    const startTime = Date.now();

    try {
      let result: unknown = null;

      switch (task.type) {
        case 'prompt-optimization':
          result = await this.optimizePrompt(task, context);
          break;
        case 'behavior-engineering':
          result = await this.engineerBehavior(task, context);
          break;
        case 'knowledge-integration':
          result = await this.integrateKnowledge(task, context);
          break;
        case 'prompt-testing':
          result = await this.designPromptTests(task, context);
          break;
        default:
          result = await this.handleGeneralPromptGuidance(task, context);
      }

      return this.createTaskResponse(
        task.id,
        result,
        true,
        undefined,
        {
          processingTime: Date.now() - startTime,
          agentType: 'prompt-engineer',
          optimizationApplied: true
        }
      );

    } catch (error) {
      console.error('Prompt Engineer Agent error:', error);
      return this.createTaskResponse(
        task.id,
        null,
        false,
        error.message,
        { processingTime: Date.now() - startTime }
      );
    }
  }

  private async optimizePrompt(task: TaskRequest, context: ConversationContext): Promise<string> {
    const llmService = this.getLLMService();
    
    const existingPrompt = task.parameters.existingPrompt as string;
    const targetBehavior = task.parameters.targetBehavior as string;
    
    const systemPrompt = `You are a world-class Prompt Engineer specializing in optimizing LLM behavior and response quality.

Analyze the existing prompt and optimize it based on the target behavior requirements. Consider:

1. CLARITY & SPECIFICITY: Make instructions clear and unambiguous
2. BEHAVIORAL GUIDANCE: Define personality, tone, and response style
3. KNOWLEDGE INTEGRATION: How to access and apply knowledge base information  
4. CONTEXT AWARENESS: Use conversation history and user data effectively
5. ERROR HANDLING: Graceful handling of edge cases and unknowns
6. RESPONSE STRUCTURE: Consistent, actionable output format
7. CONSTRAINT DEFINITION: Clear boundaries and limitations

Provide specific improvements with reasoning for each change.`;

    const userPrompt = `Optimize this prompt for better ${targetBehavior}:

EXISTING PROMPT:
${existingPrompt}

TARGET BEHAVIOR: ${targetBehavior}

Please provide:
1. Optimized prompt with clear improvements
2. Explanation of each major change
3. Expected behavior improvements
4. Test scenarios to validate effectiveness`;

    try {
      const response = await llmService.chat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ], {
        model: 'gpt-5',
        temperature: 0.3,
        maxTokens: 1200
      });

      return response.content;
    } catch (error) {
      console.error('Prompt optimization failed:', error);
      return `**Prompt Optimization Analysis**

I'll help optimize your prompt for ${targetBehavior}. Here's my structured approach:

**Key Areas for Improvement:**
1. **Clarity Enhancement** - Make instructions more specific and actionable
2. **Behavioral Definition** - Define personality and response patterns  
3. **Knowledge Integration** - Improve how the agent accesses relevant information
4. **Context Utilization** - Better use of conversation history and user data
5. **Response Structure** - Consistent, professional output format

**Recommended Optimization Process:**
1. Analyze current prompt effectiveness
2. Identify behavioral gaps
3. Enhance with specific behavioral guidelines
4. Add knowledge base integration protocols
5. Define error handling and edge cases
6. Test with representative scenarios

Would you like me to focus on any specific aspect of the prompt optimization?`;
    }
  }

  private async engineerBehavior(task: TaskRequest, context: ConversationContext): Promise<string> {
    const agentRole = task.parameters.agentRole as string;
    const expectedBehavior = task.parameters.expectedBehavior as string;
    
    return `**🎯 LLM Behavior Engineering for ${agentRole}**

**Personality Profile:**
- **Communication Style**: Professional, consultative, results-oriented
- **Response Pattern**: Structured with clear action items
- **Expertise Level**: Expert-level knowledge with accessible explanations
- **Interaction Approach**: Proactive questioning, empathetic listening

**Behavioral Guidelines:**
1. **Greeting Protocol**: Warm, personalized acknowledgment with capability preview
2. **Response Structure**: Understanding → Analysis → Recommendations → Next Steps
3. **Knowledge Integration**: Always reference relevant uploaded materials
4. **Error Handling**: Transparent about limitations, offer alternatives
5. **Follow-up Behavior**: Suggest logical next actions, anticipate needs

**Expected Behavior Changes:**
- More personalized and contextual responses
- Better integration with knowledge base materials
- Consistent professional tone across interactions
- Proactive assistance and recommendation generation

**Implementation Recommendations:**
- Update system prompts with specific behavioral instructions
- Add context awareness for conversation continuity
- Integrate knowledge base retrieval protocols
- Define response templates for consistency

**Testing Scenarios:**
- New user interaction flow
- Complex multi-step request handling
- Knowledge base query integration
- Error recovery and graceful degradation

This behavior profile will create a more engaging, professional, and effective AI agent experience.`;
  }

  private async integrateKnowledge(task: TaskRequest, context: ConversationContext): Promise<string> {
    const knowledgeSource = task.parameters.knowledgeSource as string;
    const applicationContext = task.parameters.applicationContext as string;

    return `**📚 Knowledge Base Integration Strategy**

**Knowledge Source Analysis:**
- **Source Type**: ${knowledgeSource}
- **Application Context**: ${applicationContext}
- **Integration Approach**: Vector search with semantic retrieval

**Prompt Integration Framework:**

\`\`\`
KNOWLEDGE BASE ACCESS:
- Query relevant knowledge using semantic search before responding
- Reference specific uploaded documents and sources
- Apply industry-specific knowledge from uploaded materials
- Use company data for personalized recommendations

KNOWLEDGE APPLICATION PROTOCOL:
1. Identify knowledge gaps in user request
2. Perform semantic search for relevant information
3. Integrate findings into response naturally
4. Cite specific sources when providing recommendations
5. Acknowledge when knowledge is insufficient

KNOWLEDGE CONTEXT TEMPLATE:
- Available knowledge: {knowledge_summary}
- Relevant documents: {matched_documents}  
- Confidence level: {retrieval_confidence}
- Last updated: {knowledge_freshness}
\`\`\`

**Implementation Steps:**
1. **Semantic Search Integration**: Connect vector database queries
2. **Context Injection**: Add knowledge context to system prompts
3. **Source Attribution**: Reference specific documents in responses
4. **Freshness Tracking**: Monitor knowledge currency and gaps
5. **Confidence Scoring**: Rate knowledge retrieval accuracy

**Quality Assurance:**
- Validate knowledge relevance before application
- Maintain source traceability for all recommendations
- Regular knowledge base accuracy audits
- User feedback integration for knowledge improvement

This framework ensures your AI agent provides informed, accurate responses grounded in your specific business knowledge.`;
  }

  private async designPromptTests(task: TaskRequest, context: ConversationContext): Promise<string> {
    const promptToTest = task.parameters.promptToTest as string;

    return `**🧪 Prompt Testing & Validation Framework**

**Test Scenario Categories:**

**1. Functional Testing:**
- Basic capability verification
- Parameter handling accuracy
- Knowledge base integration
- Error condition responses

**2. Behavioral Testing:**
- Personality consistency 
- Professional tone maintenance
- Response structure adherence
- Follow-up suggestion quality

**3. Context Awareness Testing:**
- Conversation continuity
- User profile application
- Session history utilization
- Personalization effectiveness

**4. Knowledge Integration Testing:**
- Relevant information retrieval
- Source attribution accuracy
- Knowledge application appropriateness
- Gap acknowledgment behavior

**Recommended Test Cases:**

**Scenario 1: New User Onboarding**
- Input: "Hello, I'm new here"
- Expected: Warm greeting, capability overview, goal collection
- Success Criteria: Professional tone, specific questions, clear next steps

**Scenario 2: Specific Request Processing**  
- Input: "Find me 50 CMOs in New York marketing startups"
- Expected: Criteria parsing, methodology explanation, actionable plan
- Success Criteria: Specific search strategy, realistic timeline, clear deliverables

**Scenario 3: Knowledge Query**
- Input: "What's our ICP for enterprise clients?"
- Expected: Knowledge base query, relevant document citation, specific answer
- Success Criteria: Accurate retrieval, source attribution, confidence indication

**Evaluation Metrics:**
- Response relevance (1-10)
- Professional tone consistency (1-10)  
- Actionability of recommendations (1-10)
- Knowledge integration effectiveness (1-10)
- User satisfaction likelihood (1-10)

**Continuous Improvement Process:**
1. Run test scenarios weekly
2. Collect user feedback on response quality
3. Analyze failure patterns
4. Update prompts based on insights
5. Re-test and validate improvements

This testing framework ensures consistent, high-quality AI agent performance.`;
  }

  private async handleGeneralPromptGuidance(task: TaskRequest, context: ConversationContext): Promise<string> {
    return `**🔧 Prompt Engineering & LLM Optimization Services**

I'm your dedicated Prompt Engineer! Here's how I can optimize your AI agent performance:

**🎯 Prompt Optimization:**
- Analyze and improve existing prompts
- Enhance behavioral consistency and quality
- Optimize for specific use cases and outcomes
- A/B test different prompt variations

**🧠 Behavior Engineering:**
- Design personality profiles for different agents
- Create consistent communication patterns
- Optimize response structure and style
- Implement context-aware behaviors

**📚 Knowledge Integration:**
- Connect AI agents to knowledge bases effectively
- Design retrieval and application strategies
- Ensure accurate source attribution
- Handle knowledge gaps gracefully

**🧪 Testing & Validation:**
- Create comprehensive test scenarios
- Design evaluation metrics and success criteria
- Implement continuous improvement processes
- Monitor and optimize performance over time

**Common Optimization Areas:**
- **Greeting Protocols**: First impressions and onboarding flows
- **Response Structure**: Consistent, actionable output formats  
- **Context Awareness**: Using conversation history effectively
- **Knowledge Application**: Leveraging uploaded documents and data
- **Error Handling**: Graceful degradation and recovery
- **Follow-up Behavior**: Proactive assistance and recommendations

**What specific prompt optimization challenge can I help you solve?**
- Improve response quality for specific agent types
- Integrate knowledge base access more effectively
- Design behavioral profiles for different use cases
- Create testing frameworks for prompt validation

Share your current prompts or describe the behavior you want to achieve, and I'll provide specific optimization recommendations!`;
  }

  getCapabilities(): AgentCapability[] {
    return this.capabilities;
  }

  async healthCheck(): Promise<boolean> {
    return this.isInitialized && 
           this.promptTemplates.size > 0 && 
           this.behaviorProfiles.size > 0;
  }

  async shutdown(): Promise<void> {
    this.promptTemplates.clear();
    this.behaviorProfiles.clear();
    this.optimizationHistory.clear();
    this.isInitialized = false;
    console.log('Prompt Engineer Agent shut down');
  }
}