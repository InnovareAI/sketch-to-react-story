import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bot, User, Copy, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Message {
  id: string;
  content: string;
  sender: "user" | "sam";
  timestamp: Date;
}

interface MessageFormatterProps {
  message: Message;
  onSpeak?: (text: string) => void;
  className?: string;
}

export function MessageFormatter({ message, onSpeak, className = "" }: MessageFormatterProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatContent = (content: string) => {
    // Simple markdown-like formatting
    const formatted = content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
      .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic
      .replace(/`(.*?)`/g, '<code class="bg-gray-600 px-1 py-0.5 rounded text-sm">$1</code>') // Inline code
      .replace(/\n/g, '<br>'); // Line breaks

    return { __html: formatted };
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(message.content);
  };

  const handleSpeak = () => {
    if (onSpeak) {
      onSpeak(message.content);
    }
  };

  return (
    <div
      className={`flex gap-4 ${message.sender === "user" ? "justify-end" : "justify-start"} animate-fade-in ${className}`}
    >
      {message.sender === "sam" && (
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center animate-glow">
            <Bot className="h-5 w-5 text-white" />
          </div>
        </div>
      )}
      
      <div className={`max-w-[80%] group ${message.sender === "user" ? "order-2" : ""}`}>
        <Card className={`p-4 relative transition-all duration-200 hover:shadow-lg ${
          message.sender === "user" 
            ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white border-0" 
            : "bg-gray-700 border-gray-600 text-gray-100"
        }`}>
          <div 
            className="text-sm leading-relaxed"
            dangerouslySetInnerHTML={formatContent(message.content)}
          />
          
          {/* Message Actions */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute -top-2 right-2 flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 bg-gray-800/80 hover:bg-gray-700"
              onClick={copyToClipboard}
            >
              <Copy className="h-3 w-3" />
            </Button>
            {message.sender === "sam" && onSpeak && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 bg-gray-800/80 hover:bg-gray-700"
                onClick={handleSpeak}
              >
                <Volume2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </Card>
        
        <div className="flex items-center gap-2 mt-1 px-2">
          <span className="text-xs text-gray-400">
            {formatTime(message.timestamp)}
          </span>
          {message.sender === "sam" && (
            <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-gray-600 text-gray-200 animate-bounce-subtle">
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
  );
}