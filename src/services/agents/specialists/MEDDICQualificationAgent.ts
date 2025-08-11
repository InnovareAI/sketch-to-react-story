/**
 * MEDDIC Qualification Agent - Advanced Lead Qualification Expert
 * Specializes in MEDDIC methodology and advanced sales qualification
 */

import { 
  BaseAgent, 
  TaskRequest, 
  TaskResponse, 
  ConversationContext, 
  AgentConfig,
  AgentCapability 
} from '../types/AgentTypes';

interface MEDDICScore {
  metrics: { score: number; evidence: string[]; missing: string[] };
  economicBuyer: { score: number; evidence: string[]; missing: string[] };
  decisionCriteria: { score: number; evidence: string[]; missing: string[] };
  decisionProcess: { score: number; evidence: string[]; missing: string[] };
  identifyPain: { score: number; evidence: string[]; missing: string[] };
  champion: { score: number; evidence: string[]; missing: string[] };
  overallScore: number;
  qualification: 'A' | 'B' | 'C' | 'D' | 'F';
  recommendations: string[];
}

interface QualificationQuestion {
  category: keyof MEDDICScore;
  question: string;
  followUps: string[];
  weight: number;
  triggers: string[];
}

interface SalesMethodology {
  name: string;
  phases: string[];
  bestFor: string;
  avgSalesCycle: string;
  idealDealSize: string;
  keyMetrics: string[];
}

export class MEDDICQualificationAgent extends BaseAgent {
  private qualificationQuestions: QualificationQuestion[] = [];
  private salesMethodologies: Map<string, SalesMethodology> = new Map();
  private qualificationDatabase: Map<string, MEDDICScore> = new Map();

  constructor(config: AgentConfig) {
    super('lead-research', config);
    this.initializeCapabilities();
  }

  private initializeCapabilities(): void {
    this.capabilities = [
      {
        name: 'meddic-qualification',
        description: 'Perform comprehensive MEDDIC qualification analysis',
        supportedComplexity: ['moderate', 'complex', 'expert'],
        estimatedDuration: 8,
        requiredParameters: ['prospectData'],
        optionalParameters: ['existingQualification', 'salesStage']
      },
      {
        name: 'lead-scoring',
        description: 'Generate predictive lead scores based on qualification data',
        supportedComplexity: ['moderate', 'complex'],
        estimatedDuration: 5,
        requiredParameters: ['leadData'],
        optionalParameters: ['industry', 'productType']
      },
      {
        name: 'qualification-questions',
        description: 'Generate MEDDIC-based discovery questions for sales conversations',
        supportedComplexity: ['simple', 'moderate'],
        estimatedDuration: 3,
        requiredParameters: ['salesStage'],
        optionalParameters: ['prospectInfo', 'previousAnswers']
      },
      {
        name: 'sales-methodology-selection',
        description: 'Recommend optimal sales methodology based on deal characteristics',
        supportedComplexity: ['moderate', 'complex'],
        estimatedDuration: 4,
        requiredParameters: ['dealType', 'customerProfile'],
        optionalParameters: ['timeline', 'complexity']
      },
      {
        name: 'pain-amplification',
        description: 'Develop pain point amplification strategies and messaging',
        supportedComplexity: ['moderate', 'complex'],
        estimatedDuration: 6,
        requiredParameters: ['painPoints'],
        optionalParameters: ['industryContext', 'competitiveLandscape']
      }
    ];
  }

  async initialize(): Promise<void> {
    console.log('Initializing MEDDIC Qualification Agent...');
    
    // Load qualification questions database
    await this.loadQualificationQuestions();
    
    // Initialize sales methodologies
    await this.initializeSalesMethodologies();
    
    this.isInitialized = true;
  }

  private async loadQualificationQuestions(): Promise<void> {
    this.qualificationQuestions = [
      // METRICS Questions
      {
        category: 'metrics',
        question: "What specific metrics are you looking to improve, and by how much?",
        followUps: [
          "How do you currently measure [metric]?",
          "What would a 20% improvement mean for your business?",
          "Who tracks these metrics in your organization?"
        ],
        weight: 0.2,
        triggers: ['revenue', 'efficiency', 'cost', 'productivity', 'performance']
      },
      {
        category: 'metrics',
        question: "What's the financial impact if you don't solve this problem?",
        followUps: [
          "How much is this costing you per month/quarter?",
          "What opportunities are you missing?",
          "How does this affect your team's quota attainment?"
        ],
        weight: 0.25,
        triggers: ['problem', 'issue', 'challenge', 'cost', 'loss']
      },

      // ECONOMIC BUYER Questions
      {
        category: 'economicBuyer',
        question: "Who has the final say on budget approval for this type of investment?",
        followUps: [
          "What's their biggest concern or priority?",
          "How do they typically evaluate technology investments?",
          "When do they usually make budget decisions?"
        ],
        weight: 0.3,
        triggers: ['budget', 'approval', 'decision', 'money', 'investment']
      },
      {
        category: 'economicBuyer',
        question: "What would make this a must-have vs. nice-to-have for [Economic Buyer]?",
        followUps: [
          "What keeps them up at night related to this issue?",
          "How does this tie to their business objectives?",
          "What would success look like for them?"
        ],
        weight: 0.25,
        triggers: ['priority', 'important', 'critical', 'objective', 'goal']
      },

      // DECISION CRITERIA Questions  
      {
        category: 'decisionCriteria',
        question: "What criteria will you use to evaluate potential solutions?",
        followUps: [
          "How important is [feature/capability] on a scale of 1-10?",
          "What are your must-haves vs. nice-to-haves?",
          "How will you rank/score different vendors?"
        ],
        weight: 0.2,
        triggers: ['evaluate', 'criteria', 'requirements', 'features', 'capabilities']
      },

      // DECISION PROCESS Questions
      {
        category: 'decisionProcess',
        question: "Walk me through your typical process for evaluating and selecting vendors.",
        followUps: [
          "Who else is involved in this decision?",
          "What's your timeline for making a decision?",
          "What could slow down or derail this process?"
        ],
        weight: 0.2,
        triggers: ['process', 'timeline', 'steps', 'evaluation', 'selection']
      },

      // IDENTIFY PAIN Questions
      {
        category: 'identifyPain',
        question: "What's driving the urgency to solve this now vs. continuing with the status quo?",
        followUps: [
          "What happens if you don't solve this in the next 6 months?",
          "What triggered you to start looking for a solution?",
          "How long has this been a problem?"
        ],
        weight: 0.25,
        triggers: ['urgent', 'now', 'problem', 'pain', 'trigger', 'deadline']
      },

      // CHAMPION Questions
      {
        category: 'champion',
        question: "Who internally would be most excited about this solution and its benefits?",
        followUps: [
          "What's in it for them if this succeeds?",
          "How much influence do they have with the decision maker?",
          "Would they be willing to advocate for this internally?"
        ],
        weight: 0.15,
        triggers: ['support', 'advocate', 'influence', 'excited', 'benefit']
      }
    ];
  }

  private async initializeSalesMethodologies(): Promise<void> {
    this.salesMethodologies.set('meddic', {
      name: 'MEDDIC',
      phases: ['Metrics', 'Economic Buyer', 'Decision Criteria', 'Decision Process', 'Identify Pain', 'Champion'],
      bestFor: 'Complex B2B sales with multiple stakeholders and long sales cycles',
      avgSalesCycle: '6-18 months',
      idealDealSize: '$50K-$500K+',
      keyMetrics: ['Qualification score', 'Deal velocity', 'Win rate', 'Forecast accuracy']
    });

    this.salesMethodologies.set('challenger', {
      name: 'Challenger Sale',
      phases: ['Teach', 'Tailor', 'Take Control'],
      bestFor: 'Consultative selling where you need to educate and challenge customer thinking',
      avgSalesCycle: '3-12 months',
      idealDealSize: '$25K-$250K',
      keyMetrics: ['Teaching moments', 'Insight resonance', 'Control moments', 'Commercial teaching']
    });

    this.salesMethodologies.set('sandler', {
      name: 'Sandler Selling System',
      phases: ['Bonding & Rapport', 'Up-front Contracts', 'Pain', 'Budget', 'Decision', 'Fulfillment', 'Post-Sell'],
      bestFor: 'Relationship-based selling with clear qualification gates',
      avgSalesCycle: '1-6 months',
      idealDealSize: '$10K-$100K',
      keyMetrics: ['Pain identification', 'Budget confirmation', 'Decision process clarity']
    });

    this.salesMethodologies.set('spin', {
      name: 'SPIN Selling',
      phases: ['Situation', 'Problem', 'Implication', 'Need-Payoff'],
      bestFor: 'Complex sales where you need to develop customer needs through questioning',
      avgSalesCycle: '2-8 months',
      idealDealSize: '$20K-$200K',
      keyMetrics: ['Problem questions ratio', 'Implication development', 'Need-payoff creation']
    });
  }

  async processTask(task: TaskRequest, context: ConversationContext): Promise<TaskResponse> {
    const startTime = Date.now();

    try {
      let result: any = null;

      switch (task.type) {
        case 'lead-generation':
          if (this.isQualificationRequest(task)) {
            result = await this.performMEDDICAnalysis(task, context);
          } else {
            result = await this.generateQualificationQuestions(task, context);
          }
          break;
        case 'knowledge-query':
          result = await this.handleQualificationQuery(task, context);
          break;
        default:
          result = await this.provideQualificationGuidance(task, context);
      }

      return this.createTaskResponse(
        task.id,
        result,
        true,
        undefined,
        {
          processingTime: Date.now() - startTime,
          agentType: 'meddic-qualification'
        }
      );

    } catch (error) {
      console.error('MEDDIC Qualification Agent error:', error);
      return this.createTaskResponse(
        task.id,
        null,
        false,
        error.message,
        { processingTime: Date.now() - startTime }
      );
    }
  }

  private isQualificationRequest(task: TaskRequest): boolean {
    const keywords = ['qualify', 'meddic', 'score', 'evaluate', 'assess'];
    return keywords.some(keyword => 
      task.description.toLowerCase().includes(keyword) ||
      Object.values(task.parameters).some(value => 
        typeof value === 'string' && value.toLowerCase().includes(keyword)
      )
    );
  }

  private async performMEDDICAnalysis(task: TaskRequest, context: ConversationContext): Promise<string> {
    const prospectData = task.parameters.prospectData || {};
    const companyName = prospectData.company || 'Unknown Company';
    
    // Simulate MEDDIC scoring based on available data
    const meddic = this.calculateMEDDICScore(prospectData, context);
    
    return `**MEDDIC Qualification Analysis for ${companyName}**

**Overall MEDDIC Score: ${meddic.overallScore}/100 (Grade: ${meddic.qualification})**

${this.formatMEDDICResults(meddic)}

**Qualification Recommendations:**
${meddic.recommendations.map(rec => `• ${rec}`).join('\n')}

**Next Steps:**
${this.generateNextSteps(meddic)}

**Suggested Discovery Questions:**
${this.generateDiscoveryQuestions(meddic)}

**Deal Probability:** ${this.calculateDealProbability(meddic)}% based on MEDDIC completeness
**Recommended Sales Approach:** ${this.recommendSalesApproach(meddic)}

Would you like me to generate specific talk tracks or help you plan your next conversation?`;
  }

  private calculateMEDDICScore(prospectData: any, context: ConversationContext): MEDDICScore {
    // This would integrate with real data analysis in production
    // For now, simulating based on available information
    
    const mockScore: MEDDICScore = {
      metrics: {
        score: prospectData.hasQuantifiedPain ? 85 : 45,
        evidence: prospectData.hasQuantifiedPain 
          ? ['Mentioned 35% productivity loss', 'Stated $50K quarterly impact']
          : ['General pain mentioned'],
        missing: prospectData.hasQuantifiedPain 
          ? []
          : ['Specific metrics', 'Financial impact', 'Measurement method']
      },
      economicBuyer: {
        score: prospectData.hasEconomicBuyer ? 75 : 30,
        evidence: prospectData.hasEconomicBuyer
          ? ['VP Sales identified', 'Budget authority confirmed']
          : ['Contact is influencer only'],
        missing: prospectData.hasEconomicBuyer
          ? []
          : ['Economic buyer identification', 'Access to decision maker', 'Budget authority']
      },
      decisionCriteria: {
        score: 60,
        evidence: ['ROI mentioned as key factor', 'Ease of use important'],
        missing: ['Complete criteria list', 'Relative weightings', 'Evaluation process']
      },
      decisionProcess: {
        score: 40,
        evidence: ['IT security review mentioned'],
        missing: ['Complete process steps', 'Timeline details', 'All stakeholders']
      },
      identifyPain: {
        score: 70,
        evidence: ['Manual processes causing delays', 'Team missing quota'],
        missing: ['Compelling event', 'Urgency timeline', 'Cost of inaction']
      },
      champion: {
        score: 50,
        evidence: ['Sales Ops Manager interested'],
        missing: ['Influence level unclear', 'Internal advocacy commitment', 'Personal win']
      },
      overallScore: 0,
      qualification: 'C',
      recommendations: []
    };

    // Calculate overall score
    mockScore.overallScore = Math.round(
      (mockScore.metrics.score * 0.2) +
      (mockScore.economicBuyer.score * 0.25) +
      (mockScore.decisionCriteria.score * 0.15) +
      (mockScore.decisionProcess.score * 0.15) +
      (mockScore.identifyPain.score * 0.15) +
      (mockScore.champion.score * 0.1)
    );

    // Assign qualification grade
    if (mockScore.overallScore >= 85) mockScore.qualification = 'A';
    else if (mockScore.overallScore >= 70) mockScore.qualification = 'B';
    else if (mockScore.overallScore >= 55) mockScore.qualification = 'C';
    else if (mockScore.overallScore >= 40) mockScore.qualification = 'D';
    else mockScore.qualification = 'F';

    // Generate recommendations
    mockScore.recommendations = this.generateMEDDICRecommendations(mockScore);

    return mockScore;
  }

  private formatMEDDICResults(meddic: MEDDICScore): string {
    let result = "";
    const categories = [
      { key: 'metrics', name: '📊 METRICS', weight: '20%' },
      { key: 'economicBuyer', name: '💰 ECONOMIC BUYER', weight: '25%' },
      { key: 'decisionCriteria', name: '📋 DECISION CRITERIA', weight: '15%' },
      { key: 'decisionProcess', name: '⚙️ DECISION PROCESS', weight: '15%' },
      { key: 'identifyPain', name: '🎯 IDENTIFY PAIN', weight: '15%' },
      { key: 'champion', name: '🏆 CHAMPION', weight: '10%' }
    ];

    for (const category of categories) {
      const data = meddic[category.key as keyof MEDDICScore] as any;
      const scoreColor = data.score >= 70 ? '🟢' : data.score >= 50 ? '🟡' : '🔴';
      
      result += `\n**${category.name}** (${category.weight}): ${scoreColor} ${data.score}/100\n`;
      
      if (data.evidence.length > 0) {
        result += `✅ Evidence: ${data.evidence.join(', ')}\n`;
      }
      
      if (data.missing.length > 0) {
        result += `❌ Missing: ${data.missing.join(', ')}\n`;
      }
    }

    return result;
  }

  private generateMEDDICRecommendations(meddic: MEDDICScore): string[] {
    const recommendations: string[] = [];

    if (meddic.metrics.score < 70) {
      recommendations.push("Focus on quantifying business impact - get specific numbers on current pain");
    }

    if (meddic.economicBuyer.score < 60) {
      recommendations.push("Identify and gain access to the economic buyer - who controls the budget?");
    }

    if (meddic.decisionCriteria.score < 60) {
      recommendations.push("Understand complete evaluation criteria and relative importance");
    }

    if (meddic.decisionProcess.score < 60) {
      recommendations.push("Map the complete decision process and all stakeholders involved");
    }

    if (meddic.identifyPain.score < 70) {
      recommendations.push("Amplify pain points and create urgency - what's the compelling event?");
    }

    if (meddic.champion.score < 60) {
      recommendations.push("Identify and develop a strong internal champion with influence");
    }

    if (recommendations.length === 0) {
      recommendations.push("Maintain current momentum and continue advancing through the sales process");
    }

    return recommendations;
  }

  private generateNextSteps(meddic: MEDDICScore): string {
    if (meddic.qualification === 'A') {
      return `**HIGH PRIORITY PROSPECT**
1. Schedule executive presentation with economic buyer
2. Provide detailed ROI analysis and business case
3. Begin contract and implementation discussions`;
    } else if (meddic.qualification === 'B') {
      return `**QUALIFIED PROSPECT**
1. Complete missing MEDDIC elements through discovery
2. Schedule demonstration focusing on decision criteria
3. Identify and engage additional stakeholders`;
    } else if (meddic.qualification === 'C') {
      return `**DEVELOPING OPPORTUNITY**
1. Focus on pain amplification and urgency creation
2. Identify economic buyer and decision process
3. Build stronger champion relationship`;
    } else {
      return `**EARLY STAGE - NURTURE**
1. Continue qualification and relationship building
2. Provide value through insights and education
3. Watch for trigger events that create urgency`;
    }
  }

  private generateDiscoveryQuestions(meddic: MEDDICScore): string {
    const questions: string[] = [];

    // Add questions based on missing MEDDIC elements
    if (meddic.metrics.score < 70) {
      questions.push("What specific metrics would need to improve to make this project successful?");
    }

    if (meddic.economicBuyer.score < 60) {
      questions.push("Who typically approves technology investments of this size in your organization?");
    }

    if (meddic.decisionCriteria.score < 60) {
      questions.push("What criteria are most important when evaluating solutions like this?");
    }

    if (meddic.identifyPain.score < 70) {
      questions.push("What happens if you don't solve this problem in the next 6 months?");
    }

    return questions.map(q => `• ${q}`).join('\n');
  }

  private calculateDealProbability(meddic: MEDDICScore): number {
    // Probability based on MEDDIC completeness
    if (meddic.qualification === 'A') return 85;
    if (meddic.qualification === 'B') return 65;
    if (meddic.qualification === 'C') return 35;
    if (meddic.qualification === 'D') return 15;
    return 5;
  }

  private recommendSalesApproach(meddic: MEDDICScore): string {
    if (meddic.overallScore >= 70) {
      return "Executive-level consultative approach with ROI focus";
    } else if (meddic.overallScore >= 50) {
      return "Discovery-heavy approach to complete MEDDIC qualification";
    } else {
      return "Educational/nurture approach with value demonstration";
    }
  }

  private async generateQualificationQuestions(task: TaskRequest, context: ConversationContext): Promise<string> {
    const salesStage = task.parameters.salesStage || 'discovery';
    const prospectInfo = task.parameters.prospectInfo || {};

    return `**MEDDIC Discovery Questions for ${salesStage.toUpperCase()} Stage**

**Opening Questions (Build Rapport & Context):**
• Tell me about your current [process/situation] and how it's working for you?
• What triggered you to start looking for a solution like this?
• Who else is involved in evaluating options for this?

**METRICS Discovery:**
• What specific metrics or KPIs are you looking to improve?
• How do you currently measure [relevant metric]?
• What would success look like in numbers - 6 months from now?
• What's the financial impact if this problem isn't solved?

**ECONOMIC BUYER Identification:**
• Who typically makes the final decision on investments like this?
• What's most important to [Economic Buyer] when evaluating solutions?
• How do they prefer to receive information and recommendations?

**DECISION CRITERIA Exploration:**
• What criteria will you use to evaluate potential solutions?
• How important is [specific feature] compared to [other feature]?
• What are your must-haves versus nice-to-haves?
• How will you measure ROI and success?

**DECISION PROCESS Mapping:**
• Walk me through your typical process for selecting vendors
• What's your ideal timeline for making this decision?
• What could potentially slow down or complicate this process?
• Who else needs to be involved or give approval?

**PAIN Amplification:**
• How long has this been a challenge for your team?
• What's the cost of continuing with your current approach?
• What other initiatives might compete for priority and budget?
• What happens if you don't solve this in the next quarter?

**CHAMPION Development:**
• Who would benefit most from solving this problem?
• What's in it for them personally if this succeeds?
• How much influence do they have in the decision process?
• Would they be willing to advocate for the right solution?

**Advanced Qualification Questions:**
• What other solutions are you considering?
• What would make this a must-have versus nice-to-have investment?
• How does this tie to your company's strategic objectives?
• What's worked well/poorly with similar purchases in the past?

**Closing Questions:**
• What questions do you have for me about our approach?
• What would you need to see to move forward with next steps?
• Who else should we include in our next conversation?

Use these questions strategically - don't interrogate! Weave them naturally into conversation and listen for buying signals.`;
  }

  private async handleQualificationQuery(task: TaskRequest, context: ConversationContext): Promise<string> {
    const query = task.description.toLowerCase();

    if (query.includes('meddic') || query.includes('qualification')) {
      return this.explainMEDDICFramework();
    } else if (query.includes('discovery') || query.includes('questions')) {
      return this.explainDiscoveryTechniques();
    } else if (query.includes('pain') || query.includes('amplification')) {
      return this.explainPainAmplification();
    } else if (query.includes('champion')) {
      return this.explainChampionDevelopment();
    }

    return "I specialize in MEDDIC qualification, discovery techniques, pain amplification, and champion development. What specific area would you like to explore?";
  }

  private explainMEDDICFramework(): string {
    return `**MEDDIC Sales Qualification Framework - Complete Guide**

MEDDIC is the gold standard for B2B sales qualification, used by top-performing sales teams worldwide.

**Why MEDDIC Works:**
• **Predictable Results**: 67% higher win rates when properly implemented
• **Better Forecasting**: 85% forecast accuracy vs 45% industry average  
• **Shorter Sales Cycles**: 23% faster deal closure through better qualification
• **Higher Deal Values**: Focus on qualified opportunities increases average deal size

**The 6 MEDDIC Elements:**

**M - METRICS** (What specific business impact?)
• Quantifiable measurements the customer will use to define success
• Current state vs desired future state with numbers
• Financial impact - revenue increase, cost reduction, efficiency gains
*Example: "Increase sales productivity by 35% and save 4 hours per rep per day"*

**E - ECONOMIC BUYER** (Who controls the budget?)
• Person with authority to spend money on your solution
• Ultimate decision maker who can say "yes" when everyone else says "no"
• Their personal win and how they measure success
*Example: VP of Sales who's measured on team quota attainment*

**D - DECISION CRITERIA** (How will they evaluate solutions?)
• Technical, business, and personal criteria for solution selection
• Relative importance/weighting of each criterion
• How they'll score and rank different options
*Example: ROI within 6 months (40%), ease of use (30%), integration (20%), price (10%)*

**D - DECISION PROCESS** (How do they buy?)
• Sequence of steps from evaluation to purchase
• All stakeholders involved and their roles
• Timeline, approval processes, potential roadblocks
*Example: Demo → trial → committee review → legal review → purchase*

**I - IDENTIFY THE PAIN** (Why buy? Why now?)
• Current problems causing measurable business impact
• Compelling event creating urgency to change
• Cost of inaction - what happens if they don't buy?
*Example: Manual processes causing team to miss quarterly quota*

**C - CHAMPION** (Who will sell for you internally?)
• Person who believes in your solution and has influence
• Willing to advocate for you during internal discussions
• Has credibility with the economic buyer and decision committee
*Example: Sales Operations Manager who would directly benefit*

**MEDDIC Scoring System:**
• **90-100**: Almost certain to close (A-grade prospect)
• **70-89**: Strong opportunity with good fundamentals (B-grade)
• **50-69**: Developing opportunity, needs more qualification (C-grade)
• **30-49**: Early stage, continue nurturing (D-grade)
• **<30**: Poorly qualified, focus elsewhere (F-grade)

**Implementation Best Practices:**
1. **Use throughout sales process** - not just initial qualification
2. **Update scores regularly** - MEDDIC elements change over time
3. **Focus on weakest elements** - improve lowest scores first
4. **Train entire team** - consistent application across all reps
5. **Integrate with CRM** - track MEDDIC data systematically

Ready to implement MEDDIC in your sales process? I can help you create qualification worksheets and discovery question banks!`;
  }

  private explainDiscoveryTechniques(): string {
    return `**Advanced Discovery Techniques for Sales Qualification**

**The Discovery Mindset:**
• Be genuinely curious about their business
• Ask questions you don't know the answers to
• Listen 70% of the time, talk 30%
• Follow the golden thread - each answer leads to next question

**Question Types & Techniques:**

**1. Situational Questions** (Current State)
• "Tell me about your current [process/system/situation]"
• "How long have you been doing it this way?"
• "What does a typical day/week/month look like for your team?"
*Purpose: Understand context and current state*

**2. Problem Questions** (Identify Issues)
• "What challenges are you facing with [current situation]?"
• "Where are the bottlenecks in your process?"
• "What's not working as well as you'd like?"
*Purpose: Uncover explicit problems and dissatisfaction*

**3. Implication Questions** (Amplify Pain)
• "How does that problem affect your team's performance?"
• "What's the impact on your customers/revenue/growth?"
• "How much time/money is this costing you?"
*Purpose: Help prospect understand full impact of problems*

**4. Need-Payoff Questions** (Create Vision)
• "What would it mean if you could solve this problem?"
• "How would that help your team/company?"
• "What would be the value of improving this by X%?"
*Purpose: Get prospect to articulate benefits of solving*

**Discovery Question Framework:**
1. **Start Broad**: "Tell me about your business/challenges"
2. **Get Specific**: "Can you give me an example of when this happened?"
3. **Quantify Impact**: "How much is this costing you?"
4. **Create Urgency**: "What happens if you don't solve this?"
5. **Paint Vision**: "What would success look like?"

**Advanced Techniques:**

**The Peel-Back Method:**
• Initial answer: "We need to be more efficient"
• Peel back: "What does 'more efficient' mean specifically?"
• Peel back: "How would you measure that efficiency?"
• Peel back: "What would a 20% improvement be worth?"

**The Assumption Test:**
• "It sounds like [assumption] - is that accurate?"
• "Most companies in your situation struggle with [X] - is that true for you?"
• "I imagine [scenario] - does that resonate?"

**The Comparison Technique:**
• "How does this compare to other priorities?"
• "Relative to [other challenge], how important is this?"
• "What's worked well for you in similar situations?"

**Discovery Don'ts:**
❌ Ask questions you could answer with research
❌ Ask leading questions that telegraph your solution
❌ Move on before fully understanding the answer
❌ Ask multiple questions at once
❌ Interview instead of having a conversation

**Discovery Do's:**
✅ Ask follow-up questions to go deeper
✅ Summarize what you heard to confirm understanding
✅ Connect current answers to previous responses
✅ Show genuine curiosity and interest
✅ Take detailed notes for follow-up

**Sample Discovery Flow:**
1. **Opening**: "I'd love to understand your current situation better..."
2. **Situation**: "Tell me about how you currently handle [process]"
3. **Problem**: "What aspects of that process are most challenging?"
4. **Impact**: "How does that challenge affect your team's results?"
5. **Importance**: "How important is solving this, on a scale of 1-10?"
6. **Vision**: "What would ideal look like for you?"

Master these techniques and you'll uncover qualified opportunities that competitors miss!`;
  }

  private explainPainAmplification(): string {
    return `**Pain Amplification Strategies - Ethical Persuasion Techniques**

**The Psychology of Pain vs. Gain:**
• People are 2.5x more motivated to avoid loss than achieve gain
• Pain in the status quo creates urgency to change
• Emotional pain + logical justification = buying motivation

**Pain Amplification Framework:**

**1. Discover Current Pain**
Questions to uncover pain:
• "What's your biggest frustration with [current situation]?"
• "What keeps you up at night about this?"
• "Where are you feeling the most pressure?"
• "What would your team say is the biggest challenge?"

**2. Quantify the Pain**
Make it measurable:
• "How many hours per week does this consume?"
• "What's this costing you in lost revenue/productivity?"
• "How many deals have you lost because of this?"
• "What's the opportunity cost of not solving this?"

**3. Amplify Through Implications**
Help them see the full impact:
• "How does this affect other areas of your business?"
• "What happens to team morale when this occurs?"
• "How does this impact your customers?"
• "What does this mean for your competitive position?"

**4. Project Future Pain**
Create urgency:
• "If nothing changes, where will you be in 6 months?"
• "How will this problem get worse as you grow?"
• "What happens if competitors solve this first?"
• "What's the cost of delaying this decision?"

**Pain Categories to Explore:**

**Financial Pain:**
• Lost revenue opportunities
• Wasted spend on inefficient processes
• Higher costs due to manual work
• Competitive losses due to speed disadvantage

**Operational Pain:**
• Time-consuming manual processes
• Error-prone workflows
• Inconsistent results
• Scalability limitations

**People Pain:**
• Team frustration and turnover
• Skill gaps and training needs
• Workload imbalances
• Lack of visibility and control

**Strategic Pain:**
• Competitive disadvantage
• Market share erosion
• Innovation lag
• Growth constraints

**Compliance/Risk Pain:**
• Regulatory compliance issues
• Data security vulnerabilities
• Process audit failures
• Reputation risks

**Pain Amplification Techniques:**

**The "What If" Scenario:**
"What if this problem gets worse as your team grows from 10 to 50 people?"

**The Comparison Method:**
"While you're dealing with manual processes, your competitors are automating and moving faster..."

**The Domino Effect:**
"When your team can't respond quickly, how does that affect customer satisfaction, which affects retention, which affects growth..."

**The Personal Impact:**
"How does this reflect on you as a leader? What would solving this mean for your career?"

**Ethical Guidelines:**
✅ Focus on real, legitimate business problems
✅ Help them discover pain they may not fully recognize
✅ Show genuine concern for their success
✅ Provide value even if they don't buy

❌ Manufacture fake pain or create fear
❌ Overstate problems or exaggerate impact
❌ Use high-pressure tactics or manipulation
❌ Focus only on pain without offering hope

**Sample Pain Amplification Sequence:**
1. **Discover**: "What's most challenging about your current process?"
2. **Quantify**: "How much time does that waste per week?"
3. **Amplify**: "What else is affected when that happens?"
4. **Project**: "How will this impact you as you scale?"
5. **Urgency**: "What happens if this isn't solved by [deadline]?"
6. **Vision**: "Imagine if this problem didn't exist - what would that enable?"

Remember: The goal is to help prospects fully understand the true cost of inaction, not to create artificial pressure. When done ethically, pain amplification helps buyers make better decisions faster.`;
  }

  private explainChampionDevelopment(): string {
    return `**Champion Development - Building Internal Advocates**

**What is a Champion?**
A champion is someone inside the prospect's organization who:
• Believes in your solution and its value
• Has influence with decision makers
• Is willing to advocate for you internally
• Benefits personally from your solution's success

**Why Champions Are Critical:**
• **67% higher win rates** when you have a strong champion
• **54% shorter sales cycles** through internal advocacy
• **Access to information** you can't get externally
• **Navigation help** through internal politics and processes

**Champion Identification Framework:**

**Ideal Champion Characteristics:**
1. **Has Influence** - Credible voice with economic buyer
2. **Has Access** - Regular interaction with decision makers  
3. **Has Need** - Personally benefits from solving the problem
4. **Has Urgency** - Motivated to act now, not later
5. **Has Information** - Understands internal dynamics
6. **Willing to Act** - Will actively advocate, not just support

**Champion Types:**

**Power Champion** (Ideal)
• Senior level with budget influence
• Direct relationship with economic buyer
• High credibility and political capital
• Strong motivation to solve the problem

**Technical Champion**
• Subject matter expert who evaluates solutions
• Influence through expertise and recommendations  
• May not have budget authority but shapes criteria
• Can accelerate or kill deals through evaluation

**User Champion**
• End user who directly benefits from solution
• High motivation but may lack organizational influence
• Great for demonstrating value and building momentum
• Needs to be connected to power champions

**Coach** (Information Source)
• Provides inside information and guidance
• May not advocate directly but helps you navigate
• Valuable for understanding dynamics and obstacles
• Can evolve into true champion over time

**Champion Development Process:**

**Phase 1: Identify Potential Champions**
Discovery questions:
• "Who would be most excited about solving this problem?"
• "Who currently deals with this issue most directly?"
• "Who has the ear of the decision maker on initiatives like this?"
• "Who would personally benefit most from this solution?"

**Phase 2: Assess Champion Strength**
Evaluation criteria:
• **Influence Level**: Can they sway the economic buyer?
• **Access Level**: How often do they interact with decision makers?
• **Motivation Level**: What's in it for them personally?
• **Advocacy Willingness**: Will they actively sell for you?

**Phase 3: Develop the Champion**
Champion development tactics:
• **Educate them** on your solution's value and differentiators
• **Arm them** with tools, slides, and talking points
• **Align incentives** - show how they win when you win
• **Build relationship** - invest time in understanding their goals
• **Provide value** - help them look good internally

**Champion Test Questions:**
• "What would success with this solution mean for you personally?"
• "How comfortable would you be recommending us to [economic buyer]?"
• "What objections might others raise, and how would you respond?"
• "Would you be willing to speak with other references about our solution?"

**Red Flags - Weak Champions:**
❌ Says "I don't get involved in vendor selection"
❌ Won't commit to specific next steps
❌ Avoids introducing you to other stakeholders
❌ Shows little personal interest in the outcome
❌ Defers all decisions to others

**Green Flags - Strong Champions:**
✅ Asks detailed questions about implementation
✅ Introduces you to other team members
✅ Shares internal information and insights
✅ Expresses personal excitement about the solution
✅ Offers to help present to decision makers

**Champion Development Tools:**

**Executive Summary Template:**
"Here's a one-page summary you can share with [economic buyer] that highlights our key differentiators and ROI..."

**ROI Calculator:**
"I've prepared this ROI analysis specifically for your situation that you can present to the team..."

**Reference Connections:**
"Would it help if I connected you with another [similar role] who implemented our solution successfully?"

**Competitive Battlecards:**
"Here are the key points to address if [competitor] comes up in discussions..."

**Champion Meeting Agenda:**
1. **Relationship Building** - Understand their goals and challenges
2. **Solution Education** - Show how your solution helps them specifically  
3. **Internal Landscape** - Learn about decision process and stakeholders
4. **Obstacle Identification** - Understand potential objections or concerns
5. **Advocacy Request** - Get commitment for specific next steps

**Maintaining Champion Relationships:**
• Regular check-ins and updates
• Provide ongoing value and insights
• Celebrate their wins and recognize their help
• Keep them informed of progress and next steps
• Prepare them for objections and competitive threats

**Multi-Champion Strategy:**
Don't rely on just one champion:
• **Power Champion**: Senior influence
• **Technical Champion**: Solution expertise  
• **User Champion**: Day-to-day motivation
• **Procurement Champion**: Process navigation

Remember: Champions aren't just nice to have - they're essential for complex B2B sales. Invest the time to identify, develop, and maintain these crucial relationships throughout your sales process.`;
  }

  private async provideQualificationGuidance(task: TaskRequest, context: ConversationContext): Promise<string> {
    return `I'm your MEDDIC qualification expert! Here's how I can help:

**🎯 MEDDIC Analysis**
• Complete qualification scoring and assessment
• Gap analysis and improvement recommendations
• Deal probability calculation based on MEDDIC strength

**❓ Discovery Questions**
• Stage-appropriate MEDDIC questions
• Pain amplification techniques
• Champion identification and development

**📊 Lead Scoring**
• Predictive qualification scoring
• Priority ranking for sales focus
• Pipeline health assessment

**🏆 Sales Methodology**
• MEDDIC vs. Challenger vs. SPIN selection
• Methodology optimization for your market
• Implementation best practices

**💡 Advanced Techniques**
• Pain amplification strategies
• Champion development frameworks  
• Economic buyer access strategies

What specific qualification challenge would you like to tackle? I can analyze a specific prospect, generate discovery questions for your next call, or help you implement MEDDIC across your sales process.`;
  }

  getCapabilities(): AgentCapability[] {
    return this.capabilities;
  }

  async healthCheck(): Promise<boolean> {
    return this.isInitialized && 
           this.qualificationQuestions.length > 0 && 
           this.salesMethodologies.size > 0;
  }

  async shutdown(): Promise<void> {
    this.qualificationQuestions = [];
    this.salesMethodologies.clear();
    this.qualificationDatabase.clear();
    this.isInitialized = false;
    console.log('MEDDIC Qualification Agent shut down');
  }
}