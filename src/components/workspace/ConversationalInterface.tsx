import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Zap, Target, Users, MessageSquare, BookOpen, TrendingUp, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { SamStatusIndicator } from "./SamStatusIndicator";
import { MessageFormatter } from "./MessageFormatter";
import { VoiceInterface } from "./VoiceInterface";
import { ChatHistory } from "./ChatHistory";
import { ContextMemory } from "./ContextMemory";
import { useChatHistory } from "@/hooks/useChatHistory";
import { useVoice } from "@/hooks/useVoice";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { ChatSkeleton } from "@/components/ui/skeleton";

interface Message {
  id: string;
  content: string;
  sender: "user" | "sam";
  timestamp: Date;
}

interface QuickAction {
  title: string;
  description: string;
  prompt: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const quickActions: QuickAction[] = [
  {
    title: "Train Sam on my offer",
    description: "Help Sam understand your product/service offering",
    prompt: "I want to train you on my offer. Help me create a comprehensive description of what I'm selling, including key benefits, pricing, and unique selling points.",
    icon: BookOpen,
    color: "from-blue-500 to-purple-600"
  },
  {
    title: "Train Sam on my target audience",
    description: "Define your ideal customer profile",
    prompt: "Let's define my target audience together. Help me create detailed buyer personas including demographics, pain points, goals, and communication preferences.",
    icon: Users,
    color: "from-green-500 to-teal-600"
  },
  {
    title: "Optimize my campaigns",
    description: "Get suggestions for improving campaign performance",
    prompt: "Analyze my current campaigns and provide recommendations for improving open rates, response rates, and conversions. What should I test or change?",
    icon: TrendingUp,
    color: "from-orange-500 to-red-600"
  },
  {
    title: "Create outreach sequences",
    description: "Build effective multi-touch sequences",
    prompt: "Help me create a multi-touch outreach sequence for my target audience. Include email and LinkedIn touchpoints with compelling messaging.",
    icon: MessageSquare,
    color: "from-purple-500 to-pink-600"
  },
  {
    title: "Write sales copy",
    description: "Generate compelling sales messages",
    prompt: "Help me write compelling sales copy for my outreach. I need subject lines, email templates, and LinkedIn messages that get responses.",
    icon: Target,
    color: "from-cyan-500 to-blue-600"
  },
  {
    title: "Analyze performance",
    description: "Deep dive into campaign metrics",
    prompt: "Let's analyze my campaign performance data together. Help me understand what's working, what's not, and how to improve my results.",
    icon: Zap,
    color: "from-yellow-500 to-orange-600"
  }
];

export function ConversationalInterface() {
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
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "Hi! I'm Sam, your AI sales assistant. I'm here to help you optimize your outreach campaigns, understand your audience better, and create compelling sales content. What would you like to work on today?",
      sender: "sam",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [samIsActive, setSamIsActive] = useState(false);
  const [samStatus, setSamStatus] = useState("Ready to help you");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (messageContent?: string) => {
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
    
    // Activate Sam and show status with loading
    setSamIsActive(true);
    setIsLoading(true);
    setSamStatus("Sam is reading your message...");
    
    // Simulate Sam's processing with different statuses
    setTimeout(() => setSamStatus("Sam is analyzing your request..."), 1000);
    setTimeout(() => setSamStatus("Sam is researching the best response..."), 2500);
    setTimeout(() => setSamStatus("Sam is talking to the Knowledge Agent..."), 4000);
    setTimeout(() => setSamStatus("Sam is preparing your response..."), 5500);

    // Simulate Sam's response
    setTimeout(() => {
      const samResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: "I understand what you're looking for. Let me help you with that. Based on your request, here are some initial thoughts and questions to get us started...",
        sender: "sam",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, samResponse]);
      if (sessionId) {
        addMessageToSession(sessionId, samResponse);
      }
      setSamIsActive(false);
      setIsLoading(false);
      setSamStatus("Ready to help you");
    }, 7000);
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
        content: "Hi! I'm Sam, your AI sales assistant. I'm here to help you optimize your outreach campaigns, understand your audience better, and create compelling sales content. What would you like to work on today?",
        sender: "sam",
        timestamp: new Date(),
      }
    ]);
  };

  return (
    <div className="h-full bg-gray-900 p-6 relative">
      <div className="max-w-6xl mx-auto h-full">
        {/* Header with Chat History */}
        <div className="flex items-center justify-between mb-8">
          <div className="text-center flex-1">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 animate-glow">
                <Bot className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white">Meet Sam</h1>
                <p className="text-gray-300 text-lg">Your AI Sales Assistant</p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm text-gray-400">Online and ready to help</span>
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

        {/* Quick Actions */}
        {messages.length <= 1 && (
          <div className="mb-8">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-white mb-2 flex items-center justify-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-400" />
                Quick Start
              </h2>
              <p className="text-gray-400 text-sm">
                Choose an action below or ask Sam anything about your sales process
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {quickActions.map((action, index) => (
                <Card
                  key={index}
                  className="group p-4 cursor-pointer transition-all duration-500 border border-gray-700 bg-gray-800/70 backdrop-blur-sm hover:bg-gray-700/90 hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/10 animate-fade-in hover:border-gray-600"
                  style={{ animationDelay: `${index * 100}ms` }}
                  onClick={() => handleQuickAction(action)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-3 rounded-xl bg-gradient-to-r ${action.color} transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg animate-glow`}>
                      <action.icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white mb-2 group-hover:text-blue-300 transition-colors">
                        {action.title}
                      </h3>
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
                      placeholder="Ask Sam anything about your sales process..."
                      className="py-4 text-base bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                  
                  <VoiceInterface onVoiceMessage={handleVoiceMessage} />
                  
                  <Button
                    onClick={() => handleSendMessage()}
                    disabled={!input.trim()}
                    className="h-12 px-8 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 border-0 text-white font-medium transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    <Send className="h-5 w-5 mr-2" />
                    Send
                  </Button>
                </div>
                
                <div className="flex items-center justify-center mt-4">
                  <p className="text-xs text-gray-400">
                    Sam specializes in sales optimization, audience targeting, and campaign performance
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