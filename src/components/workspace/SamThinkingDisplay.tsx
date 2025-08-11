/**
 * SAM Thinking Display Component
 * Shows SAM's internal thoughts, agent communications, and processing steps in real-time
 */

import { useState, useEffect } from "react";
import { Brain, Users, Cpu, MessageSquare, Activity, Sparkles, Zap, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export interface ThinkingStep {
  id: string;
  type: 'thinking' | 'routing' | 'agent-comm' | 'processing' | 'synthesis';
  agent?: string;
  action: string;
  details?: string;
  status: 'pending' | 'active' | 'completed' | 'error';
  progress?: number;
  timestamp: Date;
}

interface SamThinkingDisplayProps {
  isVisible: boolean;
  currentSteps: ThinkingStep[];
  isProcessing: boolean;
  className?: string;
}

export function SamThinkingDisplay({ 
  isVisible, 
  currentSteps, 
  isProcessing,
  className 
}: SamThinkingDisplayProps) {
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const [animatingSteps, setAnimatingSteps] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Animate new steps
    currentSteps.forEach(step => {
      if (step.status === 'active' && !animatingSteps.has(step.id)) {
        setAnimatingSteps(prev => new Set(prev).add(step.id));
        setTimeout(() => {
          setAnimatingSteps(prev => {
            const next = new Set(prev);
            next.delete(step.id);
            return next;
          });
        }, 500);
      }
    });
  }, [currentSteps, animatingSteps]);

  const getStepIcon = (step: ThinkingStep) => {
    switch (step.type) {
      case 'thinking':
        return <Brain className="h-4 w-4" />;
      case 'routing':
        return <Zap className="h-4 w-4" />;
      case 'agent-comm':
        return <MessageSquare className="h-4 w-4" />;
      case 'processing':
        return <Cpu className="h-4 w-4" />;
      case 'synthesis':
        return <Sparkles className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getStepColor = (step: ThinkingStep) => {
    switch (step.status) {
      case 'completed':
        return 'text-green-400 border-green-400/30 bg-green-400/10';
      case 'active':
        return 'text-blue-400 border-blue-400/30 bg-blue-400/10';
      case 'error':
        return 'text-red-400 border-red-400/30 bg-red-400/10';
      default:
        return 'text-gray-400 border-gray-400/30 bg-gray-400/10';
    }
  };

  const getStatusIcon = (status: ThinkingStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-3 w-3 text-green-400" />;
      case 'active':
        return <Clock className="h-3 w-3 text-blue-400 animate-spin" />;
      case 'error':
        return <AlertCircle className="h-3 w-3 text-red-400" />;
      default:
        return <Clock className="h-3 w-3 text-gray-400" />;
    }
  };

  const formatAgentName = (agent?: string) => {
    if (!agent) return 'SAM';
    
    // Format agent names for display
    const agentNames: Record<string, string> = {
      'orchestrator': 'SAM (Main)',
      'lead-research': 'Lead Research Agent',
      'campaign-management': 'Campaign Manager',
      'gtm-strategy': 'GTM Strategist',
      'meddic-qualification': 'MEDDIC Expert',
      'onboarding': 'Onboarding Assistant',
      'knowledge-base': 'Knowledge Base',
      'workflow-automation': 'Workflow Automation'
    };
    
    return agentNames[agent] || agent;
  };

  if (!isVisible || currentSteps.length === 0) {
    return null;
  }

  return (
    <Card className={cn(
      "bg-gray-800/50 border-gray-700 backdrop-blur-sm transition-all duration-300",
      isProcessing && "border-blue-500/50",
      className
    )}>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Brain className={cn(
              "h-5 w-5",
              isProcessing ? "text-blue-400 animate-pulse" : "text-gray-400"
            )} />
            <span className="text-sm font-medium text-gray-300">
              SAM is {isProcessing ? 'thinking...' : 'processing'}
            </span>
          </div>
          {isProcessing && (
            <Badge variant="outline" className="text-xs border-blue-500/50 text-blue-400">
              <Activity className="h-3 w-3 mr-1 animate-pulse" />
              Active
            </Badge>
          )}
        </div>

        {/* Thinking Steps */}
        <div className="space-y-2">
          {currentSteps.map((step) => (
            <div
              key={step.id}
              className={cn(
                "rounded-lg border p-3 transition-all duration-300",
                getStepColor(step),
                animatingSteps.has(step.id) && "animate-pulse scale-[1.02]"
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-2 flex-1">
                  <div className="mt-0.5">
                    {getStepIcon(step)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {formatAgentName(step.agent)}
                      </span>
                      {step.agent && step.agent !== 'orchestrator' && (
                        <Users className="h-3 w-3 text-gray-500" />
                      )}
                    </div>
                    <p className="text-xs text-gray-400">
                      {step.action}
                    </p>
                    {step.details && (
                      <p className="text-xs text-gray-500 mt-1">
                        {step.details}
                      </p>
                    )}
                    {step.progress !== undefined && step.status === 'active' && (
                      <Progress 
                        value={step.progress} 
                        className="h-1 mt-2"
                      />
                    )}
                  </div>
                </div>
                <div className="ml-2">
                  {getStatusIcon(step.status)}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Real-time Indicators */}
        {isProcessing && (
          <div className="mt-3 pt-3 border-t border-gray-700">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <Cpu className="h-3 w-3" />
                  {currentSteps.filter(s => s.status === 'active').length} active
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-green-400" />
                  {currentSteps.filter(s => s.status === 'completed').length} completed
                </span>
              </div>
              <span className="text-gray-500">
                {new Date().toLocaleTimeString()}
              </span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

export default SamThinkingDisplay;