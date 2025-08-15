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
import { ModeSwitcher } from "./ModeSwitcher";
import { useChatHistory } from "@/hooks/useChatHistory";
import { useVoice } from "@/hooks/useVoice";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { ChatSkeleton } from "@/components/ui/skeleton";
import { AgentFactory } from "@/services/agents/AgentFactory";
import { AgentConfig, Message, AgentTrace } from "@/services/agents/types/AgentTypes";
import { MemoryService } from "@/services/memory/MemoryService";

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
  const [messages, setMessages] = useState<Message[]>([]);
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
  const [currentOperationMode, setCurrentOperationMode] = useState<'inbound' | 'outbound'>(operationMode);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [needsNameCollection, setNeedsNameCollection] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Helper functions to check account connection status
  const checkLinkedInConnection = (): boolean => {
    // Check if LinkedIn account is connected (this would come from your auth/integration system)
    const linkedinData = localStorage.getItem('linkedin_connection');
    return linkedinData ? JSON.parse(linkedinData).connected : false;
  };

  const checkEmailConnection = (): boolean => {
    // Check if email account is connected (this would come from your auth/integration system)
    const emailData = localStorage.getItem('email_connection');
    return emailData ? JSON.parse(emailData).connected : false;
  };

  const checkActiveCampaigns = (): boolean => {
    // Check if there are active campaigns running
    const campaignsData = localStorage.getItem('active_campaigns');
    return campaignsData ? JSON.parse(campaignsData).length > 0 : false;
  };

  // Load user profile and customize greeting
  useEffect(() => {
    const loadUserProfile = () => {
      try {
        const profileData = localStorage.getItem('user_auth_profile');
        if (profileData) {
          const profile = JSON.parse(profileData);
          setUserProfile(profile);
          
          // Check if we have a proper first name (not "Demo User" or empty)
          const firstName = profile.full_name?.split(' ')[0];
          if (!firstName || firstName === 'Demo' || profile.full_name === 'Demo User' || profile.full_name.trim() === '') {
            setNeedsNameCollection(true);
          }
        } else {
          setNeedsNameCollection(true);
        }
      } catch (error) {
        console.error('Failed to load user profile:', error);
        setNeedsNameCollection(true);
      }
    };

    loadUserProfile();
  }, []);

  // Set personalized initial message
  useEffect(() => {
    if (userProfile && messages.length === 0) {
      const firstName = userProfile.full_name?.split(' ')[0];
      let greeting;
      
      if (needsNameCollection) {
        greeting = `👋 **Welcome to SAM AI!** I'm your intelligent sales assistant with 6 specialist agents ready to help.\n\n**Before we start, I'd love to know - what should I call you?** Just your first name is perfect!\n\n**🔄 SAM AI Operation Modes:**\n• **📤 Outbound Mode:** Lead generation, prospecting, cold outreach campaigns\n• **📥 Inbound Mode:** Response handling, customer service, inbox triage\n• **⚡ Unified Mode:** Full automation across all channels simultaneously\n\n**⚠️ Important Setup Notes:**\n• You'll get **preview data** during onboarding, but **full data scraping** requires connected accounts\n• **SAM is most productive** when you have **active running campaigns**\n• To get started effectively, you'll need to **connect LinkedIn** and/or **email accounts**\n\n**💬 Chat Features:**\n• **Chat History:** Access all saved conversations (top right)\n• **🎤 Voice Input:** Click microphone to speak instead of typing`;
      } else {
        greeting = `👋 **Welcome back, ${firstName}!** I'm SAM, your intelligent sales assistant with 6 specialist agents ready to help.\n\n**🔄 SAM AI Operation Modes:**\n• **📤 Outbound Mode:** Lead generation, prospecting, automated cold outreach campaigns\n• **📥 Inbound Mode:** Response handling, customer service, inbox management\n• **⚡ Unified Mode:** Full automation across all channels with intelligent routing\n\n**🚀 Account Status Check:**\n• **LinkedIn Connected:** ${checkLinkedInConnection() ? '✅ Ready for prospecting' : '❌ Connect for full lead generation'}\n• **Email Connected:** ${checkEmailConnection() ? '✅ Ready for campaigns' : '❌ Connect for email automation'}\n• **Active Campaigns:** ${checkActiveCampaigns() ? '✅ SAM is fully productive' : '⚠️ No active campaigns - limited productivity'}\n\n**💡 Pro Tip:** SAM is most effective when you have active campaigns running. Without connected accounts, you'll only see preview data during prospecting.\n\n**💬 Chat Features:**\n• **Chat History:** Access all saved conversations (top right)\n• **🎤 Voice Input:** Click microphone to speak instead of typing\n• **Conversation Starters:** Quick actions to get started below\n\n**What would you like to work on first, ${firstName}?** Try the conversation starters below or ask me anything!`;
      }
      
      setMessages([{
        id: "1",
        content: greeting,
        sender: "sam",
        timestamp: new Date(),
      }]);
    }
  }, [userProfile, needsNameCollection, messages.length]);

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

  // Handle mode change
  const handleModeChange = (mode: 'inbound' | 'outbound' | 'unified') => {
    const mapped = mode === 'unified' ? 'outbound' : mode as 'inbound' | 'outbound';
    setCurrentOperationMode(mapped);
  };
  
  // Update operation mode when it changes
  useEffect(() => {
    if (isAgentInitialized) {
      try {
        const orchestrator = agentFactory.getOrchestrator();
        if (orchestrator) {
          orchestrator.setOperationMode(currentOperationMode);
          setSamStatus(`Switched to ${currentOperationMode} mode`);
        } else {
          setSamStatus(`${currentOperationMode} mode (simplified)`);
        }
      } catch (error) {
        console.warn('Mode change failed:', error);
        setSamStatus(`${currentOperationMode} mode (basic)`);
      }
      
      // Update the greeting message based on mode
      const greetingMessage: Message = {
        id: "mode-change-" + Date.now(),
        content: currentOperationMode === 'inbound' 
          ? "🔄 **Switched to Inbound Mode** 📥\n\n**Now focused on Response Management & Customer Service:**\n• 🛡️ **Spam Filter Agent** - Automatically filter unwanted messages\n• 📥 **Inbox Triage Agent** - Prioritize and organize incoming messages\n• 💬 **Auto-Response Agent** - Draft intelligent replies to inquiries\n• 🎯 **Customer Service** - Handle support requests professionally\n\n**Perfect for:** Managing existing customer relationships, handling inquiries, providing support.\n\nWhat inbox challenge can I help you with?"
          : "🔄 **Switched to Outbound Mode** 🚀\n\n**Now focused on Lead Generation & Sales Campaigns:**\n• 🎯 **Lead Research Agent** - Find and qualify perfect prospects\n• 📊 **Campaign Manager** - Create multi-touch outreach sequences\n• ✍️ **Content Creator** - Write personalized messages that convert\n• 📈 **GTM Strategy** - Develop go-to-market plans\n• 🔄 **Workflow Automation** - Set up intelligent follow-ups\n\n**Perfect for:** Growing your business, finding new customers, scaling outreach.\n\nReady to generate some leads?",
        sender: "sam",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, greetingMessage]);
    }
  }, [currentOperationMode, isAgentInitialized, agentFactory]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (messageContent?: string) => {
    const content = messageContent || input;
    if (!content.trim()) return;

    // Check if user is providing their first name in response to name collection
    if (needsNameCollection && content.trim().length > 0) {
      await handleNameCollection(content.trim());
      return;
    }

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

  const handleNameCollection = async (providedName: string) => {
    // Extract first name from user input (handle cases like "My name is John" or just "John")
    const namePattern = /(?:my name is|i'm|im|call me|name is|i am)\s+([a-zA-Z]+)/i;
    const match = providedName.match(namePattern);
    const firstName = match ? match[1] : providedName.split(' ')[0];
    
    // Validate the name (basic check for reasonable first name)
    if (firstName.length < 2 || firstName.length > 20 || !/^[a-zA-Z]+$/.test(firstName)) {
      const clarificationMessage: Message = {
        id: Date.now().toString(),
        content: "I didn't quite catch that. Could you just tell me your first name? For example, just type \"Sarah\" or \"Mike\".",
        sender: "sam",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, clarificationMessage]);
      return;
    }

    // Add user's response to chat
    const userMessage: Message = {
      id: Date.now().toString(),
      content: providedName,
      sender: "user",
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInput("");

    try {
      // Update profile with the new name
      const updatedProfile = {
        ...userProfile,
        full_name: firstName // We only store first name for now
      };

      // Save to localStorage
      localStorage.setItem('user_auth_profile', JSON.stringify(updatedProfile));
      
      // Update component state
      setUserProfile(updatedProfile);
      setNeedsNameCollection(false);

      // Send confirmation message
      const confirmationMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `Perfect! Nice to meet you, **${firstName}**! 🎉

I'm SAM, your intelligent sales assistant with 6 specialist agents ready to help you grow your business.

**🔄 Mode Switcher (Top Right):**
• **📤 Outbound:** Lead generation, campaigns, prospecting
• **📥 Inbound:** Response handling, customer service, inbox triage
• **⚡ Unified:** Full automation across all channels

**💬 Chat Features:**
• **Chat History:** Access all saved conversations (top right)
• **🎤 Voice Input:** Click microphone to speak instead of typing
• **Conversation Starters:** Quick actions to get started below

**What would you like to work on first, ${firstName}?** Try the conversation starters below or ask me anything!`,
        sender: "sam",
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, confirmationMessage]);

      console.log(`✅ User profile updated with name: ${firstName}`);
    } catch (error) {
      console.error('Failed to save user name:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `Nice to meet you, ${firstName}! I had a small issue saving your name, but I'll remember it for this session. What would you like to work on first?`,
        sender: "sam",
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
      setNeedsNameCollection(false);
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

    const fallbackResponse = await generateFallbackResponse(content);
    
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

  const generateFallbackResponse = async (content: string): Promise<string> => {
    const contentLower = content.toLowerCase();
    
    // Agent Training Overview with real document data
    if (contentLower.includes('agent') && (contentLower.includes('training') || contentLower.includes('learned') || contentLower.includes('overview'))) {
      try {
        // Get actual document data from memory service
        const memoryService = MemoryService.getInstance();
        const documents = await memoryService.getAllDocuments();
        
        const documentCount = documents.length;
        const documentTypes = documents.reduce((acc: any, doc: any) => {
          const type = doc.metadata?.type || 'document';
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {});

        return `🎓 **Your AI Agent Training Center & Knowledge Base**

**📊 Current Knowledge Status:**
• 📁 **Documents Uploaded:** ${documentCount} files
• 🏢 **Company Info:** ${documentTypes.company || 0} docs
• 🎯 **Product/Service:** ${documentTypes.product || 0} docs  
• 👥 **Audience/ICP:** ${documentTypes.audience || 0} docs
• 📢 **Campaign Examples:** ${documentTypes.campaign || 0} docs
• 💬 **Conversation Data:** ${documentTypes.conversation || 0} records

**📈 Training Progress:**
${documentCount === 0 ? '🔴 **Getting Started** - No knowledge uploaded yet' : 
  documentCount < 3 ? '🟡 **Basic Training** - Need more comprehensive data' : 
  documentCount < 6 ? '🟠 **Good Foundation** - Adding specialized knowledge' : 
  '🟢 **Well Trained** - Rich knowledge base for personalization'}

**🎯 Recent Documents:**
${documents.length === 0 ? '• No documents uploaded yet' : 
  documents.slice(0, 3).map((doc: any) => 
    `• ${doc.title || 'Untitled Document'} (${doc.metadata?.type || 'document'})`
  ).join('\\n')}

**🚀 Quick Training Actions:**
1. **"Upload company deck"** - Add your pitch deck or company overview
2. **"Define ideal customer profile"** - Tell me about your target audience  
3. **"Share successful campaigns"** - Upload examples of what works
4. **"Add competitor analysis"** - Help me understand your market position

**Ready to expand my knowledge?** The more context I have, the better I can help with lead generation and personalized outreach.`;
      } catch (error) {
        // Fallback if memory service fails
        return `🎓 **Your AI Agent Training Center**

**Current Knowledge Status:**
• 📁 **Documents Uploaded:** 0 files (Upload company info, pitch decks, case studies)
• 🎯 **ICP Defined:** Not set (Tell me about your ideal customers)  
• ✍️ **Voice Samples:** None (Share successful messages/emails)
• 🏢 **Company Profile:** Basic (Need your value proposition, services, USP)

**Quick Training Options:**
1. **"Upload my company information"** - I'll help you add documents
2. **"Define my ideal customer"** - Let's create your ICP profile  
3. **"Here are some successful messages"** - Share examples for me to learn your voice
4. **"My company does [X] for [Y]"** - Quick company profile setup

**What would you like to train me on first?** The more I know about your business and successful approaches, the better I can help you generate leads and create personalized outreach.`;
      }
    }

    // Agent Performance  
    if (contentLower.includes('agent') && (contentLower.includes('performance') || contentLower.includes('performing'))) {
      return `📊 **Live Agent Performance Dashboard**

**🟢 Online Agents (6/6 Active)**

**🎯 Lead Research Agent** | Status: Ready | Tasks Completed: 0
- **Next Action:** "Find me leads in [industry]" or "Research prospects at [company type]"

**📊 Campaign Manager** | Status: Ready | Active Campaigns: 0  
- **Next Action:** "Create a LinkedIn campaign" or "Set up email sequence"

**✍️ Content Creator** | Status: Ready | Messages Written: 0
- **Next Action:** "Write a cold email" or "Create LinkedIn connection request"

**📈 Performance Analyst** | Status: Ready | Reports Generated: 0
- **Next Action:** "Show me campaign metrics" or "Analyze my outreach performance"

**🔄 Workflow Automation** | Status: Ready | Automations: 0
- **Next Action:** "Set up follow-up sequence" or "Create drip campaign"

**🧠 Knowledge Manager** | Status: Ready | Documents: 0
- **Next Action:** "Upload company info" or "Add successful message examples"

**🚀 Try these commands:**
• "Find leads in SaaS companies"
• "Write a cold email for CEOs" 
• "Create a LinkedIn campaign"
• "Upload my company deck"`;
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
        content: "👋 **Welcome to SAM AI!** I'm your intelligent sales assistant with 6 specialist agents ready to help.\n\n**🔄 Mode Switcher (Top Right):**\n• **📤 Outbound:** Lead generation, campaigns, prospecting\n• **📥 Inbound:** Response handling, customer service, inbox triage\n• **⚡ Unified:** Full automation across all channels\n\n**💬 Chat Features:**\n• **Chat History:** Access all saved conversations (top right)\n• **🎤 Voice Input:** Click microphone to speak instead of typing\n• **Conversation Starters:** Quick actions to get started below\n\n**What would you like to work on first?** Try the conversation starters below or ask me anything!",
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
            <ModeSwitcher 
              currentMode={currentOperationMode}
              onModeChange={handleModeChange}
              className="scale-90"
            />
            <ChatHistory 
              onLoadSession={handleLoadSession}
              currentSessionId={currentSessionId}
            />
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