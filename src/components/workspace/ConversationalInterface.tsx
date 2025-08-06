import { useState, useRef, useEffect } from "react";
import { Send, Mic, MicOff, Bot, User } from "lucide-react";
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

export function ConversationalInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "Hi! I'm Sam, your AI workspace assistant. I can help you manage campaigns, analyze performance, and optimize your LinkedIn outreach. What would you like to work on today?",
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

  const handleSendMessage = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");

    // Simulate Sam's response
    setTimeout(() => {
      const samResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: "I understand you'd like help with that. Let me analyze your workspace data and provide insights...",
        sender: "sam",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, samResponse]);
    }, 1000);
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
    <div className="conversational-theme flex flex-col h-full bg-gradient-to-br from-background via-background to-muted/20">
      {/* Chat Header */}
      <div className="p-6 border-b border-border/50 bg-background/95 backdrop-blur">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-premium-purple to-premium-blue">
            <Bot className="h-8 w-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold gradient-text">Sam AI Assistant</h2>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-premium-green rounded-full animate-pulse" />
              <span className="text-sm text-muted-foreground">Online & ready to help</span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-4 ${message.sender === "user" ? "justify-end" : "justify-start"}`}
          >
            {message.sender === "sam" && (
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-premium-purple to-premium-blue flex items-center justify-center">
                  <Bot className="h-5 w-5 text-white" />
                </div>
              </div>
            )}
            
            <div className={`max-w-[70%] ${message.sender === "user" ? "order-2" : ""}`}>
              <Card className={`p-4 ${
                message.sender === "user" 
                  ? "bg-gradient-to-br from-premium-purple to-premium-blue text-white border-0" 
                  : "glass-card-dark border-0"
              }`}>
                <p className="text-sm leading-relaxed">{message.content}</p>
              </Card>
              <div className="flex items-center gap-2 mt-1 px-2">
                <span className="text-xs text-muted-foreground">
                  {formatTime(message.timestamp)}
                </span>
                {message.sender === "sam" && (
                  <Badge variant="secondary" className="text-xs px-2 py-0.5">
                    AI
                  </Badge>
                )}
              </div>
            </div>

            {message.sender === "user" && (
              <div className="flex-shrink-0 order-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-premium-cyan to-premium-green flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-6 border-t border-border/50 bg-background/95 backdrop-blur">
        <div className="flex gap-4 items-end">
          <div className="flex-1 relative">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask Sam anything about your workspace..."
              className="pr-12 py-3 bg-muted/50 border-border/50 focus:bg-background"
            />
          </div>
          
          <Button
            onClick={toggleListening}
            variant="outline"
            size="icon"
            className={`h-12 w-12 ${
              isListening 
                ? "bg-premium-orange/10 border-premium-orange/50 text-premium-orange" 
                : "hover:bg-muted/50"
            }`}
          >
            {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </Button>
          
          <Button
            onClick={handleSendMessage}
            disabled={!input.trim()}
            className="h-12 px-6 bg-gradient-to-r from-premium-purple to-premium-blue hover:from-premium-purple/90 hover:to-premium-blue/90 border-0"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="flex items-center justify-center mt-4">
          <p className="text-xs text-muted-foreground">
            Sam can help with campaign management, performance analysis, and LinkedIn outreach optimization
          </p>
        </div>
      </div>
    </div>
  );
}