import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
          {message.sender === "sam" ? (
            <div className="text-sm leading-relaxed prose prose-sm prose-invert max-w-none prose-headings:text-gray-100 prose-p:text-gray-100 prose-strong:text-white prose-em:text-gray-200 prose-code:bg-gray-600 prose-code:text-gray-100 prose-pre:bg-gray-800 prose-blockquote:border-gray-500 prose-blockquote:text-gray-200">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content}
              </ReactMarkdown>
            </div>
          ) : (
            <div className="text-sm leading-relaxed">
              {message.content}
            </div>
          )}
          
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