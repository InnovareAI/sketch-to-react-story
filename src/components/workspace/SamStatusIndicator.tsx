import React from "react";
import { Bot, Brain, Search, MessageSquare, FileText, Zap } from "lucide-react";

interface SamStatusIndicatorProps {
  isActive: boolean;
  currentStatus: string;
}

const statusIcons: Record<string, React.ReactNode> = {
  reading: <FileText className="h-4 w-4 text-blue-400" />,
  researching: <Search className="h-4 w-4 text-purple-400" />,
  thinking: <Brain className="h-4 w-4 text-green-400" />,
  talking: <MessageSquare className="h-4 w-4 text-orange-400" />,
  processing: <Zap className="h-4 w-4 text-yellow-400" />,
  default: <Bot className="h-4 w-4 text-blue-400" />,
};

const getStatusIcon = (status: string) => {
  const lowerStatus = status.toLowerCase();
  if (lowerStatus.includes("reading")) return statusIcons.reading;
  if (lowerStatus.includes("research")) return statusIcons.researching;
  if (lowerStatus.includes("thinking") || lowerStatus.includes("analyzing")) return statusIcons.thinking;
  if (lowerStatus.includes("talking") || lowerStatus.includes("speaking")) return statusIcons.talking;
  if (lowerStatus.includes("processing") || lowerStatus.includes("working")) return statusIcons.processing;
  return statusIcons.default;
};

export function SamStatusIndicator({ isActive, currentStatus }: SamStatusIndicatorProps) {
  if (!isActive) return null;

  return (
    <div className="fixed top-20 right-6 z-50">
      <div className="bg-gray-800 border border-gray-600 rounded-lg shadow-lg p-4 min-w-64 max-w-80">
        <div className="flex items-center gap-3 mb-3">
          <div className="relative">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-gray-800 animate-pulse"></div>
          </div>
          <div>
            <h3 className="text-white font-medium text-sm">Sam AI Assistant</h3>
            <p className="text-gray-400 text-xs">Active</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 p-3 bg-gray-700 rounded-md">
          <div className="flex-shrink-0">
            {getStatusIcon(currentStatus)}
          </div>
          <div className="flex-1">
            <p className="text-gray-200 text-sm">{currentStatus}</p>
          </div>
          <div className="flex space-x-1">
            <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse"></div>
            <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse delay-100"></div>
            <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse delay-200"></div>
          </div>
        </div>
        
        <div className="mt-3 bg-gray-700 rounded-md p-2">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Processing</span>
            <span>78%</span>
          </div>
          <div className="w-full bg-gray-600 rounded-full h-1.5">
            <div className="bg-blue-500 h-1.5 rounded-full w-3/4 transition-all duration-300"></div>
          </div>
        </div>
      </div>
    </div>
  );
}