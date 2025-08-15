import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Brain, FileText, Users, Target, MessageSquare, Clock, Upload, Zap } from 'lucide-react';
import { MemoryService } from '@/services/memory/MemoryService';

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
  const [memoryService] = useState(() => MemoryService.getInstance());
  const [contextItems, setContextItems] = useState<ContextItem[]>([]);
  const [knowledgeProgress, setKnowledgeProgress] = useState(0);
  const [progressStage, setProgressStage] = useState("Getting to know you...");

  useEffect(() => {
    loadMemoryData();
  }, [memoryService]);

  const loadMemoryData = () => {
    const memories = memoryService.getRelevantMemories();
    const stats = memoryService.getStats();
    
    // Convert memory items to context items
    const items: ContextItem[] = memories.map(memory => ({
      id: memory.id,
      type: mapMemoryTypeToContextType(memory.type),
      title: memory.title,
      content: memory.content,
      lastUpdated: memory.updatedAt,
      relevance: memory.confidence
    }));

    setContextItems(items);

    // Calculate knowledge progress based on memory count and confidence
    const progress = calculateKnowledgeProgress(stats.total, stats.averageConfidence);
    setKnowledgeProgress(progress);
    setProgressStage(getProgressStage(progress));
  };

  const mapMemoryTypeToContextType = (type: string): ContextItem['type'] => {
    switch (type) {
      case 'product': return 'offer';
      case 'audience': return 'audience';
      case 'company': return 'document';
      case 'campaign': return 'document';
      case 'conversation': return 'conversation';
      case 'preference': return 'document';
      default: return 'document';
    }
  };

  const calculateKnowledgeProgress = (memoryCount: number, avgConfidence: number): number => {
    if (memoryCount === 0) return 0;
    
    // Progressive milestones based on key knowledge areas
    const milestones = [
      { threshold: 1, weight: 15, description: "Basic setup" },
      { threshold: 3, weight: 25, description: "Business understanding" },
      { threshold: 6, weight: 40, description: "Voice learning" },
      { threshold: 10, weight: 25, description: "Strategy optimization" }
    ];

    let progress = 0;
    for (const milestone of milestones) {
      if (memoryCount >= milestone.threshold) {
        progress += milestone.weight;
      } else {
        // Partial progress for incomplete milestones
        const partialProgress = (memoryCount / milestone.threshold) * milestone.weight;
        progress += partialProgress;
        break;
      }
    }

    // Apply confidence multiplier (memories with low confidence contribute less)
    const confidenceMultiplier = Math.max(0.3, avgConfidence);
    return Math.min(100, Math.round(progress * confidenceMultiplier));
  };

  const getProgressStage = (progress: number): string => {
    if (progress === 0) return "Getting to know you...";
    if (progress < 25) return "Building your profile...";
    if (progress < 50) return "Understanding your business...";
    if (progress < 75) return "Learning your voice...";
    if (progress < 90) return "Optimizing strategies...";
    return "Mastering your approach...";
  };

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
        <div className="flex items-center gap-2 mb-3">
          <Brain className="h-5 w-5 text-blue-400" />
          <h3 className="font-semibold text-white">SAM's Memory</h3>
          <Badge variant="outline" className="text-xs border-gray-600 text-gray-400">
            {contextItems.length} items
          </Badge>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">
              {contextItems.length === 0 ? "I'm learning about you and your business..." : progressStage}
            </p>
            <span className="text-xs text-gray-500">{knowledgeProgress}%</span>
          </div>
          
          <Progress 
            value={knowledgeProgress} 
            className="h-2 bg-gray-700"
            indicatorClassName={`transition-all duration-500 ${
              knowledgeProgress === 0 ? 'bg-gray-500' :
              knowledgeProgress < 25 ? 'bg-red-500' :
              knowledgeProgress < 50 ? 'bg-orange-500' :
              knowledgeProgress < 75 ? 'bg-yellow-500' :
              knowledgeProgress < 90 ? 'bg-blue-500' : 'bg-green-500'
            }`}
          />
        </div>
      </div>
      
      <ScrollArea className="h-64">
        <div className="p-4 space-y-3">
          {contextItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
              <Upload className="h-12 w-12 mb-3 text-gray-500" />
              <p className="text-sm text-center mb-2">No knowledge yet</p>
              <p className="text-xs text-center text-gray-500 leading-relaxed">
                Upload documents, share your website, or start chatting to help SAM learn about your business
              </p>
              <div className="mt-4 flex items-center gap-2 px-3 py-1.5 bg-gray-700/50 rounded-lg">
                <Zap className="h-3 w-3 text-blue-400" />
                <span className="text-xs text-blue-400">Ready to learn</span>
              </div>
            </div>
          ) : (
            contextItems
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
              })
          )}
        </div>
      </ScrollArea>
    </Card>
  );
}