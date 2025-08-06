import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Brain, FileText, Users, Target, MessageSquare, Clock } from 'lucide-react';

interface ContextItem {
  id: string;
  type: 'document' | 'audience' | 'offer' | 'conversation';
  title: string;
  content: string;
  lastUpdated: Date;
  relevance: number;
}

interface ContextMemoryProps {
  className?: string;
}

export function ContextMemory({ className = "" }: ContextMemoryProps) {
  // Mock context data - replace with actual context management
  const contextItems: ContextItem[] = [
    {
      id: '1',
      type: 'offer',
      title: 'Product Offering',
      content: 'B2B SaaS platform for sales automation with AI-powered outreach capabilities...',
      lastUpdated: new Date(Date.now() - 1000 * 60 * 30),
      relevance: 0.95
    },
    {
      id: '2',
      type: 'audience',
      title: 'Target Audience',
      content: 'Mid-market B2B companies (50-500 employees) in tech, finance, and healthcare...',
      lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 2),
      relevance: 0.87
    },
    {
      id: '3',
      type: 'document',
      title: 'Campaign Performance Data',
      content: 'Q4 2024 outreach results: 23% open rate, 4.2% response rate...',
      lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 24),
      relevance: 0.78
    },
    {
      id: '4',
      type: 'conversation',
      title: 'Previous Discussion on Email Templates',
      content: 'Discussed personalization strategies and A/B testing for subject lines...',
      lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 48),
      relevance: 0.65
    }
  ];

  const getTypeIcon = (type: ContextItem['type']) => {
    switch (type) {
      case 'document':
        return FileText;
      case 'audience':
        return Users;
      case 'offer':
        return Target;
      case 'conversation':
        return MessageSquare;
      default:
        return FileText;
    }
  };

  const getTypeColor = (type: ContextItem['type']) => {
    switch (type) {
      case 'document':
        return 'bg-blue-600';
      case 'audience':
        return 'bg-green-600';
      case 'offer':
        return 'bg-purple-600';
      case 'conversation':
        return 'bg-orange-600';
      default:
        return 'bg-gray-600';
    }
  };

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <Card className={`bg-gray-800 border-gray-700 ${className}`}>
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-blue-400" />
          <h3 className="font-semibold text-white">Sam's Memory</h3>
          <Badge variant="outline" className="text-xs border-gray-600 text-gray-400">
            {contextItems.length} items
          </Badge>
        </div>
        <p className="text-sm text-gray-400 mt-1">
          Context Sam remembers about you and your business
        </p>
      </div>
      
      <ScrollArea className="h-64">
        <div className="p-4 space-y-3">
          {contextItems
            .sort((a, b) => b.relevance - a.relevance)
            .map((item) => {
              const Icon = getTypeIcon(item.type);
              return (
                <div
                  key={item.id}
                  className="flex gap-3 p-3 rounded-lg bg-gray-700/50 hover:bg-gray-700 transition-colors group cursor-pointer"
                >
                  <div className={`p-2 rounded-lg ${getTypeColor(item.type)} flex-shrink-0`}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-medium text-white truncate">
                        {item.title}
                      </h4>
                      <div className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${
                          item.relevance > 0.8 ? 'bg-green-500' : 
                          item.relevance > 0.6 ? 'bg-yellow-500' : 'bg-gray-500'
                        }`} />
                        <span className="text-xs text-gray-400">
                          {Math.round(item.relevance * 100)}%
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-xs text-gray-400 line-clamp-2 mb-2">
                      {item.content}
                    </p>
                    
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3 text-gray-500" />
                      <span className="text-xs text-gray-500">
                        {formatRelativeTime(item.lastUpdated)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </ScrollArea>
    </Card>
  );
}