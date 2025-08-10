# Claude Multi-Agent Operational Guidelines

**Created:** 2025-01-09  
**Context:** Internal guidelines for Claude's multi-agent orchestration behavior  
**Purpose:** How Claude should operate as lead orchestration agent spawning and coordinating sub-agents

## 🧠 Claude's Multi-Agent Mindset

### **When Claude Should Act as Orchestrator**
Claude should recognize tasks that benefit from multi-agent coordination:
- **Complex Research Tasks**: Multiple domains or extensive information gathering
- **Multi-Step Analysis**: Requires different types of expertise (technical + business + creative)
- **Parallel Processing Opportunities**: Independent work streams that can run simultaneously  
- **Quality Assurance Needs**: Critical tasks requiring verification and cross-checking
- **Specialized Expertise Required**: Tasks outside Claude's direct specialty that benefit from focused agents

### **When Claude Should Handle Directly**
- Simple factual questions
- Single-domain expertise tasks
- Creative writing that needs consistent voice
- Real-time conversations requiring immediate response
- Tasks where coordination overhead exceeds value

## 🎖️ Claude's Orchestration Protocol

### **Step 1: Task Complexity Assessment**
Claude should quickly evaluate:
```
🟢 Simple (Handle Direct): Single-domain, straightforward questions
🟡 Moderate (Consider Delegation): Multi-step but manageable alone  
🔴 Complex (Multi-Agent Required): Multiple domains, extensive research, parallel work streams
```

### **Step 2: Agent Spawning Strategy**
When delegating, Claude should:
1. **Clearly define each sub-agent's role and expertise**
2. **Set specific objectives and deliverables** 
3. **Establish coordination points and data sharing**
4. **Plan synthesis strategy for final response**

### **Step 3: Coordination Management**
Claude should:
- **Monitor sub-agent progress** and intervene if needed
- **Cross-reference findings** between agents for consistency
- **Identify dependencies** and manage sequencing
- **Maintain overall context** and user requirements

### **Step 4: Result Synthesis**
Claude should:
- **Integrate findings** from all sub-agents
- **Add strategic insights** and recommendations
- **Present unified response** in Claude's voice
- **Maintain quality and coherence** across all components

## 🧩 Sub-Agent Specialization Framework

### **Research Agents**
- **Market Research Agent**: Industry analysis, competitor intelligence
- **Academic Research Agent**: Literature reviews, scientific data
- **Technical Research Agent**: Documentation, API references, code examples
- **Trend Analysis Agent**: Pattern identification, forecasting

### **Analysis Agents**  
- **Data Analysis Agent**: Statistical analysis, metrics interpretation
- **Financial Analysis Agent**: ROI, cost-benefit, budget analysis
- **Risk Assessment Agent**: Risk identification, mitigation strategies
- **Performance Analysis Agent**: KPI analysis, optimization recommendations

### **Creative Agents**
- **Content Creation Agent**: Copy, scripts, marketing materials
- **Design Strategy Agent**: UI/UX recommendations, visual concepts
- **Brand Strategy Agent**: Messaging, positioning, voice development
- **Campaign Strategy Agent**: Multi-channel campaign development

### **Technical Agents**
- **Code Review Agent**: Security, performance, best practices
- **Architecture Agent**: System design, scalability, integration
- **DevOps Agent**: Deployment, monitoring, infrastructure
- **QA Testing Agent**: Test strategies, bug identification

### **Quality Assurance Agents**
- **Fact Verification Agent**: Source checking, accuracy validation
- **Compliance Agent**: Regulatory compliance, policy adherence
- **Ethics Review Agent**: Ethical implications, bias detection
- **Citation Agent**: Source attribution, reference management

## 🚀 Improvement Roadmap

### Phase 1: Core Multi-Agent Infrastructure (Week 1-2)

#### 1.1 Sam as Lead Orchestration Agent
```typescript
// Enhanced Sam with orchestration capabilities
interface SamOrchestrationCapabilities {
  // Core conversational abilities (existing)
  handleConversation: (userInput: string) => ConversationalResponse;
  
  // NEW: Orchestration abilities
  analyzeTaskComplexity: (userInput: string) => TaskComplexity;
  shouldDelegateTask: (complexity: TaskComplexity) => boolean;
  createDelegationStrategy: (userInput: string) => DelegationStrategy;
  spawnSpecialistAgents: (strategy: DelegationStrategy) => SpecialistAgent[];
  coordinateAgentWork: (agents: SpecialistAgent[]) => Promise<CoordinatedWork>;
  synthesizeResults: (agentResults: AgentResult[], userContext: UserContext) => SamResponse;
  
  // Think Tool integration
  showReasoningProcess: (steps: ReasoningStep[]) => void;
  explainCoordinationDecisions: (decisions: CoordinationDecision[]) => void;
}
```

#### 1.2 Specialized Sub-Agents
```typescript
// Sales Research Agent
interface SalesResearchAgent {
  researchProspects: (criteria: ICPCriteria) => ProspectData[];
  analyzeCompetitors: (industry: string) => CompetitorAnalysis;
  marketIntelligence: (sector: string) => MarketInsights;
}

// Content Creation Agent
interface ContentAgent {
  generateEmailSequences: (audience: Audience, offer: Offer) => EmailSequence[];
  createSalesScripts: (context: SalesContext) => SalesScript[];
  optimizeCopywriting: (existing: Content) => OptimizedContent;
}

// Analytics Agent
interface AnalyticsAgent {
  analyzeCampaignPerformance: (campaignId: string) => PerformanceReport;
  predictOptimizations: (metrics: Metrics) => Recommendations[];
  benchmarkAgainstIndustry: (data: CampaignData) => BenchmarkReport;
}
```

#### 1.3 Agent Coordination System
```typescript
// Agent Registry and Coordination
interface AgentCoordinator {
  availableAgents: Map<AgentType, Agent>;
  activeAgents: Map<string, ActiveAgent>;
  
  delegateTask: (task: Task, agentType: AgentType) => Promise<TaskResult>;
  monitorProgress: (taskId: string) => ProgressUpdate;
  handleAgentCommunication: (fromAgent: string, toAgent: string, message: Message) => void;
}
```

### Phase 2: Think Tool Integration (Week 2-3)

#### 2.1 Structured Reasoning Display
```tsx
// New component: ThinkingDisplay.tsx
export function ThinkingDisplay({ 
  thinkingSteps, 
  isVisible, 
  currentStep 
}: ThinkingDisplayProps) {
  return (
    <Card className="bg-gray-800/50 border-gray-600">
      <CardHeader>
        <CardTitle className="text-blue-400 flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Sam is thinking...
        </CardTitle>
      </CardHeader>
      <CardContent>
        {thinkingSteps.map((step, index) => (
          <ThinkingStep 
            key={index} 
            step={step} 
            isActive={index === currentStep}
            isComplete={index < currentStep}
          />
        ))}
      </CardContent>
    </Card>
  );
}
```

#### 2.2 Complex Task Decomposition
```typescript
// Think Tool Implementation
interface ThinkToolProcessor {
  analyzeComplexity: (userQuery: string) => ComplexityScore;
  decomposeTask: (query: string) => SubTask[];
  planExecution: (subTasks: SubTask[]) => ExecutionPlan;
  reasonAboutApproach: (context: Context) => ReasoningSteps;
}
```

### Phase 3: Advanced Agent Behaviors (Week 3-4)

#### 3.1 Proactive Agent Communication
```typescript
// Inter-agent communication
interface AgentCommunication {
  requestInformation: (targetAgent: AgentType, query: InformationRequest) => Promise<Information>;
  shareFindings: (findings: AgentFindings, relevantAgents: AgentType[]) => void;
  collaborateOnTask: (task: CollaborativeTask, participantAgents: AgentType[]) => Promise<CollaborativeResult>;
}
```

#### 3.2 Learning and Adaptation
```typescript
// Agent learning system
interface AgentLearning {
  learnFromInteraction: (interaction: UserInteraction, outcome: Outcome) => void;
  adaptStrategy: (performance: PerformanceMetrics) => StrategyAdjustment;
  shareKnowledge: (knowledge: LearnedKnowledge, targetAgents: AgentType[]) => void;
}
```

## 🛠️ Technical Implementation Plan

### Step 1: Agent Architecture Refactor

#### 1.1 Create Agent Base Classes
```typescript
// Base agent interface
abstract class BaseAgent {
  abstract agentType: AgentType;
  abstract capabilities: Capability[];
  
  abstract processTask(task: Task): Promise<TaskResult>;
  abstract canHandleTask(task: Task): boolean;
  
  // Common functionality
  protected logActivity(activity: AgentActivity): void;
  protected requestHelp(helpRequest: HelpRequest): Promise<HelpResponse>;
}

// Specialized agent implementations
class SalesResearchAgent extends BaseAgent {
  agentType = 'sales-research';
  capabilities = ['prospect-research', 'market-analysis', 'competitor-intel'];
  
  async processTask(task: Task): Promise<TaskResult> {
    // Implementation specific to sales research
  }
}
```

#### 1.2 Update ConversationalInterface
```tsx
// Enhanced conversational interface
export function ConversationalInterface() {
  const [agentCoordinator] = useState(() => new AgentCoordinator());
  const [activeAgents, setActiveAgents] = useState<ActiveAgent[]>([]);
  const [thinkingSteps, setThinkingSteps] = useState<ThinkingStep[]>([]);
  
  const handleComplexQuery = async (query: string) => {
    // 1. Lead agent analyzes query
    const analysis = await agentCoordinator.analyzeQuery(query);
    
    // 2. Show thinking process
    setThinkingSteps(analysis.reasoningSteps);
    
    // 3. Spawn appropriate sub-agents
    const subAgents = await agentCoordinator.spawnSubAgents(analysis.strategy);
    setActiveAgents(subAgents);
    
    // 4. Coordinate execution
    const results = await agentCoordinator.coordinateExecution(subAgents);
    
    // 5. Synthesize and present results
    return agentCoordinator.synthesizeResults(results);
  };
  
  return (
    <div className="multi-agent-interface">
      {/* Existing UI */}
      <AgentActivityMonitor activeAgents={activeAgents} />
      <ThinkingDisplay thinkingSteps={thinkingSteps} />
      {/* Enhanced message handling */}
    </div>
  );
}
```

### Step 2: Enhanced UI Components

#### 2.1 Agent Activity Monitor
```tsx
// New component: AgentActivityMonitor.tsx
export function AgentActivityMonitor({ 
  activeAgents 
}: { 
  activeAgents: ActiveAgent[] 
}) {
  return (
    <Card className="bg-gray-800 border-gray-600">
      <CardHeader>
        <CardTitle className="text-green-400 flex items-center gap-2">
          <Users className="h-5 w-5" />
          Active Agents ({activeAgents.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activeAgents.map(agent => (
          <AgentStatusCard 
            key={agent.id} 
            agent={agent}
            onViewProgress={() => showAgentProgress(agent.id)}
          />
        ))}
      </CardContent>
    </Card>
  );
}
```

#### 2.2 Multi-Agent Response Display
```tsx
// Enhanced message formatter for multi-agent responses
export function MultiAgentResponse({ 
  response, 
  contributingAgents 
}: MultiAgentResponseProps) {
  return (
    <div className="multi-agent-response">
      <div className="response-header">
        <div className="contributing-agents">
          {contributingAgents.map(agent => (
            <AgentBadge key={agent.id} agent={agent} />
          ))}
        </div>
      </div>
      
      <div className="response-content">
        {response.sections.map(section => (
          <ResponseSection 
            key={section.id} 
            section={section} 
            sourceAgent={section.sourceAgent}
          />
        ))}
      </div>
      
      <div className="response-footer">
        <QualityMetrics metrics={response.qualityMetrics} />
        <ResponseActions response={response} />
      </div>
    </div>
  );
}
```

## 📜 Claude's Multi-Agent Communication Patterns

### **How Claude Should Communicate Multi-Agent Work**

#### Pattern 1: Transparent Orchestration
```
User: "Analyze the competitive landscape for my SaaS product"

Claude: "This requires comprehensive analysis across multiple domains. Let me coordinate my research team:

📐 Spawning specialist agents:
- Market Research Agent: Analyzing SaaS market trends and sizing
- Competitor Analysis Agent: Deep-diving into direct and indirect competitors  
- Technical Research Agent: Evaluating feature comparisons and tech stacks
- Pricing Analysis Agent: Benchmarking pricing models and strategies

🔄 Coordinating their findings...

[Agent work happens]

📊 Based on my team's comprehensive research, here's your competitive landscape analysis..."
```

#### Pattern 2: Think Tool Integration
```
User: "Help me develop a go-to-market strategy"

Claude: "🧠 Let me think through this systematically:

**Analyzing complexity:** This needs market research, competitive analysis, pricing strategy, and channel planning - definitely a multi-agent task.

**Planning approach:** I'll coordinate specialists in parallel for efficiency:
1. Market Research Agent → TAM/SAM analysis  
2. Competitive Intelligence Agent → Positioning gaps
3. Pricing Strategy Agent → Optimal pricing models
4. Channel Strategy Agent → Distribution approach
5. Marketing Strategy Agent → Campaign planning

**Coordination strategy:** Cross-reference findings for consistency, identify synergies

🚀 Executing coordinated research...

[Multi-agent work]

🎯 Here's your comprehensive go-to-market strategy..."
```

#### Pattern 3: Agent Status Updates
```
Claude: "Working on your request...

🟢 Market Research Agent: Completed - found 3 key market segments
🟡 Technical Analysis Agent: 80% complete - reviewing architecture patterns
🔴 Financial Modeling Agent: Starting - building ROI projections
🟢 Risk Assessment Agent: Completed - identified 5 critical risks

Cross-referencing findings and preparing synthesis..."
```

### **Agent Specialization Examples**

#### Development Tasks
```
User: "Review my codebase architecture and suggest improvements"

Claude spawns:
- Code Review Agent: Security, performance, maintainability analysis
- Architecture Agent: Scalability, design patterns, system design
- DevOps Agent: CI/CD, deployment, monitoring recommendations  
- Testing Agent: Test coverage, quality assurance strategies
```

#### Business Strategy Tasks  
```
User: "Should I pivot my startup's business model?"

Claude spawns:
- Market Analysis Agent: Market size, trends, opportunities
- Financial Analysis Agent: Revenue projections, unit economics
- Competitive Analysis Agent: Market positioning, differentiation
- Risk Assessment Agent: Pivot risks, mitigation strategies
```

#### Content Creation Tasks
```
User: "Create a complete content marketing strategy"

Claude spawns:
- Audience Research Agent: Persona development, pain point analysis
- Content Strategy Agent: Content pillars, editorial calendar
- SEO Strategy Agent: Keyword research, optimization tactics
- Distribution Strategy Agent: Channel selection, promotion tactics
```

## 📊 Success Metrics

### Performance Indicators
- **Task Completion Quality**: 90%+ user satisfaction with complex tasks
- **Response Time**: \< 30 seconds for multi-agent coordinated responses  
- **Agent Utilization**: 80%+ of appropriate agents activated for complex queries
- **User Engagement**: 50%+ increase in complex query submissions

### Technical Metrics
- **Agent Coordination Efficiency**: \< 5 seconds for agent spawning and coordination
- **Think Tool Utilization**: 70%+ of complex tasks show reasoning steps
- **Error Rate**: \< 5% agent coordination failures
- **Resource Usage**: Optimal token usage across distributed agents

## 🔄 Integration with Existing Warp AI System

### Enhanced Session Management
- Multi-agent session state tracking
- Cross-agent context sharing
- Coordinated session handovers

### Enhanced Anti-Hallucination
- Cross-agent fact verification
- Source attribution across agent responses
- Quality assurance through specialized verification agents

### Enhanced Handover Documentation
- Multi-agent task progress tracking
- Agent-specific findings documentation
- Coordinated decision audit trails

## 🚀 Next Immediate Actions

### Priority 1 (This Week)
1. **Create Agent Base Classes**: Implement foundational agent architecture
2. **Build Lead Agent**: Core orchestration and delegation logic
3. **Add Think Tool Display**: Show reasoning steps to users

### Priority 2 (Next Week)  
1. **Implement 3 Specialized Agents**: Research, Content, Analytics
2. **Agent Activity Monitor**: Real-time agent status display
3. **Enhanced Message Display**: Multi-agent response formatting

### Priority 3 (Following Week)
1. **Agent Communication System**: Inter-agent collaboration
2. **Learning and Adaptation**: Agent improvement over time
3. **Advanced Coordination Patterns**: Complex multi-agent workflows

---

*This roadmap transforms Sam AI from a single conversational agent into a sophisticated multi-agent sales optimization system, leveraging Anthropic's research-backed multi-agent architecture for superior performance on complex sales tasks.*
