/**
 * Enhanced Conversational Interface with Multi-Agent System Integration
 * Implements Anthropic's best practices for conversational AI
 */

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Zap, Target, Users, MessageSquare, BookOpen, TrendingUp, Plus, Sparkles, Brain, Cpu, Activity } from "lucide-react";
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
  icon: any;
  color: string;
  complexity: 'simple' | 'moderate' | 'complex';
}

const quickActions: QuickAction[] = [
  {
    title: "Train Sam on my offer",
    description: "Help Sam understand your product/service offering",
    prompt: "I want to train you on my offer. Help me create a comprehensive description of what I'm selling, including key benefits, pricing, and unique selling points.",
    icon: BookOpen,
    color: "from-blue-500 to-purple-600",
    complexity: 'moderate'
  },
  {
    title: "Train Sam on my target audience",
    description: "Define your ideal customer profile",
    prompt: "Let's define my target audience together. Help me create detailed buyer personas including demographics, pain points, goals, and communication preferences.",
    icon: Users,
    color: "from-green-500 to-teal-600",
    complexity: 'moderate'
  },
  {
    title: "Find qualified leads",
    description: "Generate targeted prospect lists",
    prompt: "I need help finding qualified leads. Can you help me scrape LinkedIn Sales Navigator and enrich the data with contact information?",
    icon: Target,
    color: "from-orange-500 to-red-600",
    complexity: 'complex'
  },
  {
    title: "Create outreach sequences",
    description: "Build effective multi-touch sequences",
    prompt: "Help me create a multi-touch outreach sequence for my target audience. Include email and LinkedIn touchpoints with compelling messaging.",
    icon: MessageSquare,
    color: "from-purple-500 to-pink-600",
    complexity: 'complex'
  },
  {
    title: "Optimize my campaigns",
    description: "Get suggestions for improving campaign performance",
    prompt: "Analyze my current campaigns and provide recommendations for improving open rates, response rates, and conversions. What should I test or change?",
    icon: TrendingUp,
    color: "from-cyan-500 to-blue-600",
    complexity: 'complex'
  },
  {
    title: "Analyze performance",
    description: "Deep dive into campaign metrics",
    prompt: "Let's analyze my campaign performance data together. Help me understand what's working, what's not, and how to improve my results.",
    icon: Zap,
    color: "from-yellow-500 to-orange-600",
    complexity: 'complex'
  }
];

export function EnhancedConversationalInterface() {
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
      content: "Hello! I'm SAM, your AI sales assistant powered by a team of specialist agents. I can help you with lead generation, campaign optimization, content creation, and performance analysis. What would you like to work on today?",
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize agent system
  useEffect(() => {
    const initializeAgents = async () => {
      try {
        const config: AgentConfig = {
          apiKeys: {
            // These would come from environment variables
            openai: process.env.VITE_OPENAI_API_KEY,
            claude: process.env.VITE_CLAUDE_API_KEY,
          },
          supabase: {
            url: process.env.VITE_SUPABASE_URL || '',
            anonKey: process.env.VITE_SUPABASE_ANON_KEY || '',
          },
          features: {
            voiceEnabled: true,
            videoGeneration: false,
            linkedinAutomation: true,
            emailAutomation: true,
          },
          limits: {
            maxParallelTasks: 5,
            maxTokensPerRequest: 4000,
            maxSessionDuration: 120,
          },
          prompts: {
            orchestrator: "You are SAM, an AI sales assistant orchestrator...",
            'lead-research': "You are a lead research specialist...",
            'campaign-strategy': "You are a campaign strategy expert...",
            'content-creation': "You are a content creation specialist...",
            'outreach-automation': "You are an outreach automation expert...",
            'analytics': "You are a performance analytics specialist...",
            'knowledge-base': "You are a knowledge management expert..."
          }
        };

        await agentFactory.initialize(config);
        setIsAgentInitialized(true);
        setSamStatus("Multi-agent system ready");
        console.log('Agent system initialized successfully');
      } catch (error) {
        console.error('Failed to initialize agent system:', error);
        setSamStatus("Agent system offline - using fallback mode");
      }
    };

    initializeAgents();
  }, [agentFactory]);

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
      addMessageToSession(sessionId, userMessage);
    }
    setInput("");
    
    // Activate Sam and show processing
    setSamIsActive(true);
    setIsLoading(true);
    setProcessingProgress(0);
    setSamStatus("Initializing multi-agent processing...");
    setAgentTrace([]);

    try {
      if (!isAgentInitialized) {
        // Fallback to simple processing
        await handleFallbackProcessing(content);
        return;
      }

      // Real multi-agent processing
      await handleMultiAgentProcessing(content, sessionId);

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

      // Process through multi-agent system
      const result = await agentFactory.processMessage(content, existingContext, sessionId);
      
      // Update agent trace for debugging
      setAgentTrace(result.agentTrace || []);

      // Create SAM response
      const samResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: result.response.content,
        sender: "sam",
        timestamp: new Date(),
        agentTrace: result.agentTrace
      };

      setMessages(prev => [...prev, samResponse]);
      if (sessionId) {
        addMessageToSession(sessionId, samResponse);
      }

    } catch (error) {
      throw error;
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
    
    if (contentLower.includes('lead') || contentLower.includes('prospect')) {
      return "I understand you're looking for help with lead generation. While my full agent system is initializing, I can guide you through the basic process of finding and qualifying prospects. Would you like me to explain the key steps?";
    }
    
    if (contentLower.includes('campaign') || contentLower.includes('outreach')) {
      return "I can help you with campaign optimization! Even in simplified mode, I can provide guidance on improving your outreach performance. What specific aspect of your campaigns would you like to work on?";
    }
    
    if (contentLower.includes('content') || contentLower.includes('template') || contentLower.includes('write')) {
      return "I'd love to help with content creation. While waiting for full agent capabilities, I can provide you with proven email and LinkedIn message templates. What type of content do you need?";
    }
    
    return "I understand what you're looking for. My multi-agent system is still initializing, but I can provide helpful guidance. Could you tell me more specifically what you'd like assistance with?";
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

  const startNewChat = () => {
    const sessionId = createNewSession();
    setMessages([
      {
        id: "1",
        content: "Hello! I'm SAM, your AI sales assistant powered by a team of specialist agents. I can help you with lead generation, campaign optimization, content creation, and performance analysis. What would you like to work on today?",
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
                {isAgentInitialized ? 'Multi-agent system online' : 'Initializing agent system...'}
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
              className="text-gray-300 hover:text-white hover:bg-gray-700 border-gray-600"
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

        {/* Quick Actions */}
        {messages.length <= 1 && (
          <div className="mb-8">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-white mb-2 flex items-center justify-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-400" />
                Quick Start
                {!isAgentInitialized && (
                  <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-400">
                    Simplified Mode
                  </Badge>
                )}
              </h2>
              <p className="text-gray-400 text-sm">
                {isAgentInitialized 
                  ? "Choose an action below to engage the multi-agent system"
                  : "Basic assistance available while agent system initializes"
                }
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                    className="h-12 px-8 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 border-0 text-white font-medium transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    <Send className="h-5 w-5 mr-2" />
                    Send
                  </Button>
                </div>
                
                <div className="flex items-center justify-center mt-4">
                  <p className="text-xs text-gray-400 flex items-center gap-2">
                    <Brain className="h-3 w-3" />
                    {isAgentInitialized 
                      ? "Powered by 6 specialist agents for lead generation, campaign optimization & content creation"
                      : "Multi-agent system initializing... Basic assistance available"
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