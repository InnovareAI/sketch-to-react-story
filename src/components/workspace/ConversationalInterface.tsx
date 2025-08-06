import { useState, useRef, useEffect } from "react";
import { Send, Mic, MicOff, Bot, User, Zap, Target, Users, MessageSquare, BookOpen, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
  icon: any;
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
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "Hi! I'm Sam, your AI sales assistant. I'm here to help you optimize your outreach campaigns, understand your audience better, and create compelling sales content. What would you like to work on today?",
      sender: "sam",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
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

    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");

    // Simulate Sam's response
    setTimeout(() => {
      const samResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: "I understand what you're looking for. Let me help you with that. Based on your request, here are some initial thoughts and questions to get us started...",
        sender: "sam",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, samResponse]);
    }, 1000);
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

  const toggleListening = () => {
    setIsListening(!isListening);
    // Voice functionality will be implemented with ElevenLabs
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="h-full bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto h-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600">
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

        {/* Quick Actions */}
        {messages.length <= 1 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4 text-center">Quick Start</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {quickActions.map((action, index) => (
                <Card
                  key={index}
                  className="p-4 cursor-pointer hover:shadow-lg transition-all duration-300 border border-gray-700 bg-gray-800/70 backdrop-blur-sm hover:bg-gray-700/90"
                  onClick={() => handleQuickAction(action)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg bg-gradient-to-r ${action.color}`}>
                      <action.icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-white mb-1">{action.title}</h3>
                      <p className="text-sm text-gray-300">{action.description}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Chat Container */}
        <div className="bg-gray-800 rounded-2xl shadow-xl border border-gray-700 overflow-hidden">
          {/* Messages Area */}
          <div className="h-96 overflow-y-auto p-6 space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-4 ${message.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.sender === "sam" && (
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <Bot className="h-5 w-5 text-white" />
                    </div>
                  </div>
                )}
                
                <div className={`max-w-[80%] ${message.sender === "user" ? "order-2" : ""}`}>
                  <Card className={`p-4 ${
                    message.sender === "user" 
                      ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white border-0" 
                      : "bg-gray-700 border-gray-600 text-gray-100"
                  }`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  </Card>
                  <div className="flex items-center gap-2 mt-1 px-2">
                    <span className="text-xs text-gray-400">
                      {formatTime(message.timestamp)}
                    </span>
                    {message.sender === "sam" && (
                      <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-gray-600 text-gray-200">
                        Sam
                      </Badge>
                    )}
                  </div>
                </div>

                {message.sender === "user" && (
                  <div className="flex-shrink-0 order-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center">
                      <User className="h-5 w-5 text-white" />
                    </div>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-700 p-6 bg-gray-800">
            <div className="flex gap-4 items-end">
              <div className="flex-1 relative">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask Sam anything about your sales process..."
                  className="py-4 text-base bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <Button
                onClick={toggleListening}
                variant="outline"
                size="icon"
                className={`h-12 w-12 ${
                  isListening 
                    ? "bg-red-900/50 border-red-600 text-red-400 hover:bg-red-900/70" 
                    : "bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
                }`}
              >
                {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </Button>
              
              <Button
                onClick={() => handleSendMessage()}
                disabled={!input.trim()}
                className="h-12 px-8 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 border-0 text-white font-medium"
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
    </div>
  );
}