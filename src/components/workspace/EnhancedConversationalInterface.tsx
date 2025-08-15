/**
 * Enhanced Conversational Interface with Multi-Agent System Integration
 * Implements Anthropic's best practices for conversational AI
 */

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Zap, Target, Users, MessageSquare, BookOpen, TrendingUp, Plus, Sparkles, Brain, Cpu, Activity, Upload, Rocket, Linkedin, Search, Database, Mail, BarChart3, TestTube, FileText, Link } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { SamStatusIndicator } from "./SamStatusIndicator";
import { MessageFormatter } from "./MessageFormatter";
import { VoiceInterface } from "./VoiceInterface";
import { ChatHistory } from "./ChatHistory";
import { ContextMemory } from "./ContextMemory";
import { SamThinkingDisplay, ThinkingStep } from "./SamThinkingDisplay";
import { useChatHistory } from "@/hooks/useChatHistory";
import { useVoice } from "@/hooks/useVoice";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { ChatSkeleton } from "@/components/ui/skeleton";
import { AgentFactory } from "@/services/agents/AgentFactory";
import { AgentConfig, Message, AgentTrace } from "@/services/agents/types/AgentTypes";

interface QuickAction {
  title: string;
  description: string;
  prompt: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  complexity: 'simple' | 'moderate' | 'complex';
}

interface EnhancedConversationalInterfaceProps {
  operationMode?: 'inbound' | 'outbound';
}

// Conversation starters - focused on agent functionality
const conversationStarters = {
  "Train Your Agents": [
    {
      title: "🎓 Agent Training Overview",
      prompt: "Show me what my AI agents have learned and how to train them better",
      icon: Brain,
      color: "from-purple-500 to-pink-600"
    },
    {
      title: "📊 Agent Performance",
      prompt: "How are my AI agents performing and what can they do?",
      icon: Activity,
      color: "from-blue-500 to-purple-600"
    }
  ],
  "Get Started": [
    {
      title: "🚀 Generate New Leads",
      prompt: "I want to generate new leads and create outreach campaigns",
      icon: Target,
      color: "from-green-500 to-teal-600"
    },
    {
      title: "📥 Manage My Inbox",  
      prompt: "I want to manage my inbox and automate responses",
      icon: MessageSquare,
      color: "from-orange-500 to-red-600"
    }
  ]
};

// Flatten for backward compatibility
const quickActions: QuickAction[] = Object.values(conversationStarters).flat().map(action => ({
  ...action,
  description: "",
  complexity: 'moderate' as const
}));

export function EnhancedConversationalInterface({ operationMode = 'outbound' }: EnhancedConversationalInterfaceProps) {
  const { 
    sessions, 
    currentSessionId, 
    createNewSession, 
    addMessageToSession, 
    loadSession,
    getCurrentSession 
  } = useChatHistory();
  
  const { speakText } = useVoice();
  
  // Enable keyboard shortcuts
  useKeyboardShortcuts();
  
  // Agent system state
  const [agentFactory] = useState(() => AgentFactory.getInstance());
  const [isAgentInitialized, setIsAgentInitialized] = useState(false);
  
  // UI state
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "👋 **Hey there!** I'm SAM, your AI sales assistant.\n\n**Quick question:** Are you looking to **generate new leads** or **manage incoming messages** today?\n\nI've got specialist agents ready for both! 🚀",
      sender: "sam",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [samIsActive, setSamIsActive] = useState(false);
  const [samStatus, setSamStatus] = useState("Ready to help you");
  const [isLoading, setIsLoading] = useState(false);
  const [agentTrace, setAgentTrace] = useState<AgentTrace[]>([]);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [thinkingSteps, setThinkingSteps] = useState<ThinkingStep[]>([]);
  const [showThinking, setShowThinking] = useState(true);
  const [isNewUser, setIsNewUser] = useState<boolean>(false);
  const [hasStartedOnboarding, setHasStartedOnboarding] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check if user is new and needs onboarding
  useEffect(() => {
    const checkUserOnboardingStatus = () => {
      const hasCompletedOnboarding = localStorage.getItem('sam_onboarding_completed');
      const accountCreatedAt = localStorage.getItem('account_created_at');
      const now = Date.now();
      const accountAge = accountCreatedAt ? now - parseInt(accountCreatedAt) : 0;
      
      // Consider user "new" if account is less than 7 days old or no onboarding flag
      const isUserNew = !hasCompletedOnboarding || accountAge < (7 * 24 * 60 * 60 * 1000);
      
      setIsNewUser(isUserNew);
      
      // If new user and agent is initialized, start onboarding
      if (isUserNew && isAgentInitialized && !hasStartedOnboarding) {
        startOnboardingFlow();
      }
    };

    checkUserOnboardingStatus();
  }, [isAgentInitialized, hasStartedOnboarding]);

  // Initialize agent system with better error handling
  useEffect(() => {
    let isMounted = true;
    
    const initializeAgents = async () => {
      try {
        // Simple delay to show loading state
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        if (!isMounted) return;
        
        // Try to initialize agent factory
        try {
          const config: AgentConfig = {
            apiKeys: {
              openai: import.meta.env.VITE_OPENAI_API_KEY || undefined,
              claude: import.meta.env.VITE_CLAUDE_API_KEY || undefined,
            },
            supabase: {
              url: import.meta.env.VITE_SUPABASE_URL || 'https://ktchrfgkbpaixbiwbieg.supabase.co',
              anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0Y2hyZmdrYnBhaXhiaXdiaWVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjI0MzMxNzcsImV4cCI6MjAzODAwOTE3N30.YI1RxpjqToyqY9Dj12fqEP2V3G6d2j8QZA2xj8TcTBg',
            },
            features: {
              voiceEnabled: true,
              videoGeneration: false,
              linkedinAutomation: true,
              emailAutomation: true,
            },
            limits: {
              maxParallelTasks: 3,
              maxTokensPerRequest: 3000,
              maxSessionDuration: 60,
            },
            prompts: {
              orchestrator: "You are SAM, an AI sales assistant.",
              'lead-research': "You are a lead research specialist.",
              'campaign-management': "You are a campaign management expert.",
              'gtm-strategy': "You are a GTM strategy specialist.",
              'meddic-qualification': "You are a MEDDIC qualification expert.",
              'workflow-automation': "You are a workflow automation specialist.",
              'inbox-triage': "You are an inbox triage specialist.",
              'spam-filter': "You are a spam filter specialist.",
              'auto-response': "You are an auto-response specialist.",
              'content-creation': "You are a content creation specialist.",
              'outreach-automation': "You are an outreach automation expert.",
              'analytics': "You are a performance analytics specialist.",
              'knowledge-base': "You are a knowledge management expert."
            }
          };

          await agentFactory.initialize(config);
          console.log('✅ Agent system initialized');
          
          if (isMounted) {
            setSamStatus(`Multi-agent system ready - ${operationMode} mode`);
          }
        } catch (initError) {
          console.warn('⚠️ Agent initialization failed, using fallback mode:', initError);
          if (isMounted) {
            setSamStatus("Using simplified mode");
          }
        }
        
        if (isMounted) {
          setIsAgentInitialized(true);
        }
        
      } catch (error) {
        console.error('❌ Agent initialization error:', error);
        if (isMounted) {
          setSamStatus("Basic mode active");
          setIsAgentInitialized(true);
        }
      }
    };

    initializeAgents();
    
    return () => {
      isMounted = false;
    };
  }, [agentFactory, operationMode]);
  
  // Update operation mode when prop changes
  useEffect(() => {
    if (isAgentInitialized) {
      try {
        const orchestrator = agentFactory.getOrchestrator();
        if (orchestrator) {
          orchestrator.setOperationMode(operationMode);
          setSamStatus(`Switched to ${operationMode} mode`);
        } else {
          setSamStatus(`${operationMode} mode (simplified)`);
        }
      } catch (error) {
        console.warn('Mode change failed:', error);
        setSamStatus(`${operationMode} mode (basic)`);
      }
      
      // Update the greeting message based on mode
      const greetingMessage: Message = {
        id: "mode-change-" + Date.now(),
        content: operationMode === 'inbound' 
          ? "🔄 **Switched to Inbound Mode** 📥\n\nPerfect! I'm now your **inbox manager**. I can help you:\n• Filter spam and organize messages\n• Draft smart auto-replies\n• Prioritize important conversations\n\nWhat's your biggest inbox challenge?"
          : "🔄 **Switched to Outbound Mode** 🚀\n\nAwesome! I'm now your **lead generation engine**. I can help you:\n• Find qualified prospects\n• Create killer campaigns\n• Write personalized outreach\n\nReady to get some leads?",
        sender: "sam",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, greetingMessage]);
    }
  }, [operationMode, isAgentInitialized, agentFactory]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (messageContent?: string) => {
    const content = messageContent || input;
    if (!content.trim()) return;

    // Create or use existing session
    let sessionId = currentSessionId;
    if (!sessionId) {
      sessionId = createNewSession();
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    if (sessionId) {
      addMessageToSession(sessionId, userMessage as any);
    }
    setInput("");
    
    // Activate Sam and show processing
    setSamIsActive(true);
    setIsLoading(true);
    setProcessingProgress(0);
    setSamStatus("Initializing multi-agent processing...");
    setAgentTrace([]);
    setThinkingSteps([]);

    try {
      if (!isAgentInitialized) {
        console.log('🔄 Processing in fallback mode...');
        await handleFallbackProcessing(content);
        return;
      }

      // Try multi-agent processing with fallback
      try {
        const orchestrator = agentFactory.getOrchestrator();
        if (orchestrator) {
          await handleMultiAgentProcessing(content, sessionId);
        } else {
          console.log('🔄 No orchestrator available, using fallback...');
          await handleFallbackProcessing(content);
        }
      } catch (agentError) {
        console.warn('🔄 Multi-agent processing failed, falling back:', agentError);
        await handleFallbackProcessing(content);
      }

    } catch (error) {
      console.error('Message processing error:', error);
      await handleErrorResponse(error as Error);
    }
  };

  const handleMultiAgentProcessing = async (content: string, sessionId: string) => {
    // Progress tracking
    const progressSteps = [
      { message: "Analyzing your request...", progress: 20 },
      { message: "Routing to specialist agents...", progress: 40 },
      { message: "Agents processing in parallel...", progress: 60 },
      { message: "Synthesizing response...", progress: 80 },
      { message: "Finalizing results...", progress: 100 }
    ];

    for (const step of progressSteps) {
      setSamStatus(step.message);
      setProcessingProgress(step.progress);
      await new Promise(resolve => setTimeout(resolve, 800));
    }

    try {
      // Get current session context
      const currentSession = getCurrentSession();
      const existingContext = {
        messages: currentSession?.messages || [],
        userProfile: {
          // This would come from user settings/profile
          name: 'User',
          company: 'Your Company',
          targetAudience: 'B2B Decision Makers',
          productOffering: 'Sales Automation Platform'
        }
      };

      // Add initial thinking step
      const initialStep: ThinkingStep = {
        id: `step_${Date.now()}`,
        type: 'thinking',
        agent: 'orchestrator',
        action: 'Analyzing your request...',
        details: 'Determining the best approach to help you',
        status: 'active',
        timestamp: new Date()
      };
      setThinkingSteps([initialStep]);

      // Simulate processing steps (in production, these would come from actual agent events)
      setTimeout(() => {
        setThinkingSteps(prev => [
          ...prev.map(s => ({ ...s, status: 'completed' as const })),
          {
            id: `step_${Date.now() + 1}`,
            type: 'routing',
            agent: 'orchestrator',
            action: 'Routing to specialist agents...',
            details: 'Identifying the right experts for your needs',
            status: 'active',
            timestamp: new Date()
          }
        ]);
        setProcessingProgress(30);
      }, 500);

      setTimeout(() => {
        setThinkingSteps(prev => [
          ...prev.map(s => s.status === 'active' ? { ...s, status: 'completed' as const } : s),
          {
            id: `step_${Date.now() + 2}`,
            type: 'agent-comm',
            agent: content.includes('lead') ? 'lead-research' : 
                   content.includes('campaign') ? 'campaign-management' : 
                   content.includes('LinkedIn') ? 'workflow-automation' : 'knowledge-base',
            action: 'Processing with specialist agent...',
            details: 'Gathering insights and recommendations',
            status: 'active',
            progress: 50,
            timestamp: new Date()
          }
        ]);
        setProcessingProgress(60);
      }, 1000);

      // Process through multi-agent system
      try {
        const result: any = await agentFactory.processMessage(content, existingContext as any, sessionId);
        
        // Update agent trace for debugging
        if (result?.agentTrace) {
          setAgentTrace(result.agentTrace);
        }
        
        // Complete all thinking steps
        setThinkingSteps(prev => prev.map(s => ({ ...s, status: 'completed' as const })));

        // Create SAM response
        const samResponse: Message = {
          id: (Date.now() + 1).toString(),
          content: result?.response?.content || "I processed your request successfully, but I'm having trouble formulating a response right now. Could you try rephrasing your question?",
          sender: "sam",
          timestamp: new Date(),
          agentTrace: result?.agentTrace || []
        };

        setMessages(prev => [...prev, samResponse]);
        if (sessionId) {
          addMessageToSession(sessionId, samResponse as any);
        }
      } catch (processError) {
        console.error('Agent processing failed:', processError);
        throw processError; // Re-throw to trigger fallback
      }

    } finally {
      setSamIsActive(false);
      setIsLoading(false);
      setProcessingProgress(0);
      setSamStatus("Ready to help you");
    }
  };

  const handleFallbackProcessing = async (content: string) => {
    // Fallback processing when agent system is unavailable
    const fallbackSteps = [
      "Processing your request...",
      "Analyzing context...", 
      "Preparing response..."
    ];

    for (const step of fallbackSteps) {
      setSamStatus(step);
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    const fallbackResponse = generateFallbackResponse(content);
    
    const samResponse: Message = {
      id: (Date.now() + 1).toString(),
      content: fallbackResponse,
      sender: "sam",
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, samResponse]);
    
    setSamIsActive(false);
    setIsLoading(false);
    setSamStatus("Agent system initializing - using simplified mode");
  };

  const handleErrorResponse = async (error: Error) => {
    const errorResponse: Message = {
      id: (Date.now() + 1).toString(),
      content: "I apologize, but I encountered an issue processing your request. This might be due to high demand or a temporary service issue. Please try rephrasing your question, and I'll do my best to help you.",
      sender: "sam",
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, errorResponse]);
    
    setSamIsActive(false);
    setIsLoading(false);
    setProcessingProgress(0);
    setSamStatus("Error occurred - ready to try again");
  };

  const generateFallbackResponse = (content: string): string => {
    const contentLower = content.toLowerCase();
    
    // Agent Training Overview
    if (contentLower.includes('agent') && (contentLower.includes('training') || contentLower.includes('learned') || contentLower.includes('overview'))) {
      return `🎓 **Agent Training Status:**

**🧠 Knowledge Base Agent:** Currently has access to your uploaded documents and can perform semantic search. Ready for more training data!

**🎯 Lead Research Agent:** Knows basic prospecting techniques. Needs your ICP and target market info to be more effective.

**📊 Campaign Manager:** Has template frameworks loaded. Could use your successful campaign examples for better personalization.

**✍️ Content Creator:** Ready with proven templates. Will improve with your voice and successful message examples.

**📈 Performance Analyst:** Set up to track metrics. Needs historical data and KPI definitions to provide insights.

**🔄 Workflow Agent:** Basic automation ready. Needs your specific workflows and approval processes.

**What would you like to train first?** I recommend starting with uploading some company information or successful campaign examples.`;
    }

    // Agent Performance  
    if (contentLower.includes('agent') && (contentLower.includes('performance') || contentLower.includes('performing'))) {
      return `📊 **Agent Performance Dashboard:**

**Current Status:** All 6 specialist agents are online and ready!

**🎯 Lead Research:** Ready to find prospects (needs ICP training)
**📊 Campaign Manager:** Template-based campaigns ready  
**✍️ Content Creator:** 50+ proven templates loaded
**📈 Performance Analyst:** Tracking systems active
**🔄 Workflow Automation:** Basic sequences configured  
**🧠 Knowledge Manager:** Document processing active

**Recommendations:**
• Upload company info to improve personalization
• Share successful message examples for better content
• Define your ICP for better lead targeting

**Ready to put an agent to work?** Try asking me to find leads or write a campaign!`;
    }
    
    if (contentLower.includes('lead') || contentLower.includes('prospect')) {
      return "🎯 **Lead Research Agent activated!** I can help you find qualified prospects. To get better results, tell me about your ideal customer profile (ICP) - what industry, company size, and job titles are you targeting?";
    }
    
    if (contentLower.includes('campaign') || contentLower.includes('outreach')) {
      return "📊 **Campaign Manager Agent ready!** I can help you create multi-touch outreach sequences. What's your goal - LinkedIn outreach, email campaigns, or a multi-channel approach?";
    }
    
    if (contentLower.includes('content') || contentLower.includes('template') || contentLower.includes('write')) {
      return "✍️ **Content Creator Agent at your service!** I can write personalized messages, email sequences, or LinkedIn outreach. What type of content do you need and who's your target audience?";
    }
    
    return "I have 6 specialist agents ready to help! Try asking about **agent training**, **finding leads**, **writing campaigns**, or **analyzing performance**. What would you like to work on?";
  };

  const handleQuickAction = (action: QuickAction) => {
    handleSendMessage(action.prompt);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleVoiceMessage = (text: string) => {
    handleSendMessage(text);
  };

  const handleLoadSession = (sessionMessages: Message[]) => {
    setMessages(sessionMessages);
  };

  const startOnboardingFlow = () => {
    setHasStartedOnboarding(true);
    
    // Clear existing messages and start fresh onboarding
    const onboardingMessage: Message = {
      id: `onboarding_${Date.now()}`,
      content: `🎉 **Welcome to SAM AI!** Let me give you a quick overview of your new workspace.

**📍 Your Interface Layout:**

**Left Side** - Work Mode Switcher:
• **🤖 Agent Mode** (where you are now) - Chat with AI specialists for complex tasks
• **📧 Workspace Mode** - Traditional inbox-style communications hub

You can use both modes concurrently, but you'll spend most of your productive time here in **Agent Mode** where I can actively help you.

**🤖 Meet Your AI Specialist Team:**

🎯 **Lead Research** - Find and qualify perfect prospects  
📊 **Campaign Manager** - Create and optimize outreach sequences
✍️ **Content Creator** - Write personalized messages that convert  
📈 **Performance Analyst** - Track results and suggest improvements
🔄 **Workflow Automation** - Set up intelligent follow-ups
🧠 **Knowledge Manager** - Learn your business for better recommendations

**Ready to train your agents?** Let's start by letting them learn about your business and ideal customers!`,
      sender: "sam",
      timestamp: new Date(),
    };

    setMessages([onboardingMessage]);
    localStorage.setItem('sam_onboarding_started', 'true');
  };

  const completeOnboarding = () => {
    localStorage.setItem('sam_onboarding_completed', 'true');
    setIsNewUser(false);
    setHasStartedOnboarding(false);
    
    const completionMessage: Message = {
      id: `onboarding_complete_${Date.now()}`,
      content: `🚀 **Onboarding Complete!** 

You're all set up with SAM AI. I now understand your business and I'm ready to help you:

✅ Find qualified leads in your target market
✅ Create personalized outreach campaigns  
✅ Automate follow-ups and sequences
✅ Track performance and optimize results

**What would you like to work on first?** I'm here whenever you need help scaling your sales efforts!`,
      sender: "sam",
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, completionMessage]);
  };

  const startNewChat = () => {
    const sessionId = createNewSession();
    setMessages([
      {
        id: "1",
        content: "👋 **Hey there!** I'm SAM, your AI sales assistant.\n\n**Quick question:** Are you looking to **generate new leads** or **manage incoming messages** today?\n\nI've got specialist agents ready for both! 🚀",
        sender: "sam",
        timestamp: new Date(),
      }
    ]);
    setAgentTrace([]);
  };

  return (
    <div className="h-full bg-gray-900 p-6 relative">
      <div className="max-w-6xl mx-auto h-full">
        {/* Header with Agent Status */}
        <div className="flex items-center justify-between mb-8">
          <div className="text-center flex-1">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="relative p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 animate-glow">
                <Bot className="h-8 w-8 text-white" />
                {isAgentInitialized && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-900 animate-pulse" />
                )}
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white flex items-center gap-2">
                  Meet SAM
                  {isAgentInitialized && (
                    <Badge variant="outline" className="text-xs border-green-500 text-green-400">
                      Multi-Agent
                    </Badge>
                  )}
                </h1>
                <p className="text-gray-300 text-lg">Your AI Sales Assistant</p>
              </div>
            </div>
            
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className={`w-2 h-2 rounded-full animate-pulse ${
                isAgentInitialized ? 'bg-green-500' : 'bg-yellow-500'
              }`} />
              <span className="text-sm text-gray-400">
                {isAgentInitialized ? 'SAM AI ready' : 'SAM AI starting...'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <ChatHistory 
              onLoadSession={handleLoadSession}
              currentSessionId={currentSessionId}
            />
            <Button
              onClick={startNewChat}
              variant="outline"
              size="sm"
              className="!bg-black !text-white hover:!bg-gray-900 !border-gray-600 hover:!text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Chat
            </Button>
          </div>
        </div>

        {/* Agent Processing Trace */}
        {agentTrace.length > 0 && (
          <div className="mb-6">
            <Card className="p-4 bg-gray-800 border-gray-700">
              <div className="flex items-center gap-2 mb-3">
                <Cpu className="h-4 w-4 text-blue-400" />
                <span className="text-sm font-medium text-white">Agent Processing Trace</span>
              </div>
              <div className="space-y-2">
                {agentTrace.map((trace, index) => (
                  <div key={index} className="flex items-center gap-3 text-xs">
                    <Badge variant="outline" className="text-xs">
                      {trace.agentType}
                    </Badge>
                    <span className="text-gray-300">{trace.action}</span>
                    <span className="text-gray-500">({trace.duration}ms)</span>
                    {trace.success ? (
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                    ) : (
                      <div className="w-2 h-2 bg-red-500 rounded-full" />
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* SAM Thinking Display - Devin.ai Style */}
        {(isLoading || thinkingSteps.length > 0) && (
          <div className="mb-6">
            <SamThinkingDisplay
              isVisible={showThinking}
              currentSteps={thinkingSteps}
              isProcessing={isLoading}
              className="max-w-4xl mx-auto"
            />
          </div>
        )}

        {/* Conversation Starters */}
        {messages.filter(m => m.sender === 'user').length === 0 && (
          <div className="mb-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">
                What would you like to do today?
              </h2>
              <p className="text-gray-400">
                Choose a conversation starter or just type your request below
              </p>
            </div>
            
            {/* Categorized Conversation Starters */}
            <div className="space-y-6">
              {Object.entries(conversationStarters).map(([category, actions]) => (
                <div key={category}>
                  <h3 className="text-sm font-semibold text-gray-400 mb-3">{category}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {actions.map((action, index) => (
                      <button
                        key={index}
                        onClick={() => handleSendMessage(action.prompt)}
                        className="group relative p-4 text-left rounded-lg border border-gray-600 !bg-black hover:!bg-gray-900 hover:border-gray-500 transition-all duration-200 hover:scale-[1.02]"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg bg-gradient-to-r ${action.color} opacity-80 group-hover:opacity-100 transition-opacity`}>
                            <action.icon className="h-4 w-4 text-white" />
                          </div>
                          <span className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors">
                            {action.title}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Original Quick Actions Grid - Hidden but kept for reference */}
            <div className="hidden grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {quickActions.map((action, index) => (
                <Card
                  key={index}
                  className={`group p-4 cursor-pointer transition-all duration-500 border border-gray-700 bg-gray-800/70 backdrop-blur-sm hover:bg-gray-700/90 hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/10 animate-fade-in hover:border-gray-600 ${
                    !isAgentInitialized && action.complexity !== 'simple' ? 'opacity-60' : ''
                  }`}
                  style={{ animationDelay: `${index * 100}ms` }}
                  onClick={() => handleQuickAction(action)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-3 rounded-xl bg-gradient-to-r ${action.color} transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg animate-glow relative`}>
                      <action.icon className="h-5 w-5 text-white" />
                      {action.complexity !== 'simple' && !isAgentInitialized && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-white group-hover:text-blue-300 transition-colors">
                          {action.title}
                        </h3>
                        <Badge variant="outline" className="text-xs">
                          {action.complexity}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-300 group-hover:text-gray-200 transition-colors leading-relaxed">
                        {action.description}
                      </p>
                    </div>
                  </div>
                  
                  {/* Hover effect overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Chat Container */}
          <div className="lg:col-span-3">
            <div className="bg-gray-800 rounded-2xl shadow-xl border border-gray-700 overflow-hidden">
              {/* Messages Area */}
              <div className="h-96 overflow-y-auto p-6 space-y-6">
                {isLoading && messages.length <= 1 ? (
                  <ChatSkeleton />
                ) : (
                  messages.map((message, index) => (
                    <MessageFormatter
                      key={message.id}
                      message={message}
                      onSpeak={speakText}
                      className="animate-fade-in"
                    />
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Processing Progress */}
              {isLoading && processingProgress > 0 && (
                <div className="px-6 pb-2">
                  <Progress value={processingProgress} className="h-1" />
                </div>
              )}

              {/* Sam Status Indicator */}
              <SamStatusIndicator isActive={samIsActive} currentStatus={samStatus} />
              
              {/* Input Area */}
              <div className="border-t border-gray-700 p-6 bg-gray-800">
                <div className="flex gap-4 items-end">
                  <div className="flex-1 relative">
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={isAgentInitialized 
                        ? "Ask SAM's specialist agents anything about sales..." 
                        : "Ask SAM anything (simplified mode)..."
                      }
                      className="py-4 text-base bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      disabled={isLoading}
                    />
                  </div>
                  
                  <VoiceInterface onVoiceMessage={handleVoiceMessage} disabled={isLoading} />
                  
                  <Button
                    onClick={() => handleSendMessage()}
                    disabled={!input.trim() || isLoading}
                    className="h-12 px-8 !bg-black hover:!bg-gray-900 !border !border-gray-600 !text-white font-medium transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    <Send className="h-5 w-5 mr-2" />
                    Send
                  </Button>
                </div>
                
                <div className="flex items-center justify-center mt-4">
                  <p className="text-xs text-gray-400 flex items-center gap-2">
                    <Brain className="h-3 w-3" />
                    {isAgentInitialized 
                      ? "SAM AI is ready - 6 specialist agents online for lead generation, campaign optimization & content creation"
                      : "SAM AI is starting - Initializing multi-agent system..."
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Context Memory Sidebar */}
          <div className="lg:col-span-1">
            <ContextMemory className="h-full" />
          </div>
        </div>
      </div>
    </div>
  );
}