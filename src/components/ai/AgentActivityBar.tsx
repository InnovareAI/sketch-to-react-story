/**
 * AgentActivityBar - Devin-style agent activity display
 * Shows real-time agent processing status at bottom of screen
 */

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Bot, 
  Brain, 
  Search, 
  FileText, 
  Database, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  ChevronUp,
  ChevronDown,
  Activity,
  Clock,
  Zap
} from 'lucide-react';

interface AgentActivity {
  id: string;
  type: 'processing' | 'extracting' | 'generating' | 'storing' | 'searching' | 'analyzing' | 'complete' | 'error';
  message: string;
  timestamp: Date;
  duration?: number;
  metadata?: Record<string, unknown>;
  progress?: number;
}

interface AgentActivityBarProps {
  activities?: AgentActivity[];
  currentAgent?: string;
  isActive?: boolean;
  className?: string;
}

const activityIcons = {
  processing: Loader2,
  extracting: Database,
  generating: Brain,
  storing: FileText,
  searching: Search,
  analyzing: Activity,
  complete: CheckCircle,
  error: AlertCircle
};

const activityColors = {
  processing: 'text-blue-500',
  extracting: 'text-purple-500',
  generating: 'text-green-500',
  storing: 'text-orange-500',
  searching: 'text-cyan-500',
  analyzing: 'text-pink-500',
  complete: 'text-green-600',
  error: 'text-red-500'
};

export const AgentActivityBar: React.FC<AgentActivityBarProps> = ({
  activities = [],
  currentAgent = 'SAM AI',
  isActive = false,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentActivity, setCurrentActivity] = useState<AgentActivity | null>(null);

  // Update current activity when activities change
  useEffect(() => {
    if (activities.length > 0) {
      const latest = activities[activities.length - 1];
      setCurrentActivity(latest);
    }
  }, [activities]);

  const getActivityIcon = (type: AgentActivity['type']) => {
    const IconComponent = activityIcons[type] || Bot;
    return IconComponent;
  };

  const getActivityColor = (type: AgentActivity['type']) => {
    return activityColors[type] || 'text-gray-500';
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return '';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const getStatusBadge = () => {
    if (!currentActivity) return null;
    
    const isProcessing = ['processing', 'extracting', 'generating', 'storing', 'searching', 'analyzing'].includes(currentActivity.type);
    
    return (
      <Badge 
        variant={currentActivity.type === 'error' ? 'destructive' : isProcessing ? 'secondary' : 'outline'}
        className="flex items-center space-x-1"
      >
        {isProcessing && <Loader2 className="w-3 h-3 animate-spin" />}
        {currentActivity.type === 'complete' && <CheckCircle className="w-3 h-3" />}
        {currentActivity.type === 'error' && <AlertCircle className="w-3 h-3" />}
        <span className="capitalize">{currentActivity.type}</span>
      </Badge>
    );
  };

  if (!isActive && activities.length === 0) {
    return null;
  }

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-50 ${className}`}>
      {/* Main Activity Bar */}
      <Card className="border-t border-x-0 border-b-0 rounded-none bg-white/95 backdrop-blur-sm shadow-lg">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left - Current Activity */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <Bot className="w-3 h-3 text-white" />
                </div>
                <span className="font-medium text-gray-900">{currentAgent}</span>
              </div>
              
              {currentActivity && (
                <>
                  <div className="w-px h-4 bg-gray-300" />
                  <div className="flex items-center space-x-2">
                    {React.createElement(getActivityIcon(currentActivity.type), {
                      className: `w-4 h-4 ${getActivityColor(currentActivity.type)} ${
                        ['processing', 'extracting', 'generating', 'storing', 'searching', 'analyzing'].includes(currentActivity.type) 
                          ? 'animate-spin' 
                          : ''
                      }`
                    })}
                    <span className="text-sm text-gray-700 max-w-md truncate">
                      {currentActivity.message}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Center - Progress */}
            {currentActivity?.progress !== undefined && (
              <div className="flex items-center space-x-2 mx-4">
                <Progress value={currentActivity.progress} className="w-32" />
                <span className="text-xs text-gray-500 min-w-0">
                  {currentActivity.progress}%
                </span>
              </div>
            )}

            {/* Right - Status and Controls */}
            <div className="flex items-center space-x-3">
              {getStatusBadge()}
              
              {currentActivity && (
                <div className="flex items-center space-x-1 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  <span>{currentActivity.timestamp.toLocaleTimeString()}</span>
                  {currentActivity.duration && (
                    <>
                      <span>•</span>
                      <span>{formatDuration(currentActivity.duration)}</span>
                    </>
                  )}
                </div>
              )}
              
              {activities.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="h-6 w-6 p-0"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronUp className="w-4 h-4" />
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Expanded Activity History */}
      {isExpanded && activities.length > 1 && (
        <Card className="border-t-0 rounded-none bg-white/95 backdrop-blur-sm max-h-48 overflow-hidden">
          <div className="p-2">
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {activities.slice(0, -1).reverse().map((activity, index) => (
                <div 
                  key={activity.id} 
                  className="flex items-center justify-between p-2 hover:bg-gray-50 rounded text-sm"
                >
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    {React.createElement(getActivityIcon(activity.type), {
                      className: `w-3 h-3 ${getActivityColor(activity.type)} flex-shrink-0`
                    })}
                    <span className="truncate text-gray-700">
                      {activity.message}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-xs text-gray-500 flex-shrink-0">
                    <Badge variant="outline" size="sm">
                      {activity.type}
                    </Badge>
                    <span>{activity.timestamp.toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Performance Indicator */}
      {isActive && (
        <div className="absolute -top-1 left-4 right-4 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 rounded-full opacity-50">
          <div className="h-full bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 rounded-full animate-pulse"></div>
        </div>
      )}
    </div>
  );
};

export default AgentActivityBar;