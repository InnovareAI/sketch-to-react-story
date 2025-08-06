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
    <div className="w-full bg-gray-700/50 border-t border-gray-600 px-6 py-3">
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          {getStatusIcon(currentStatus)}
        </div>
        <div className="flex-1">
          <p className="text-gray-200 text-sm">{currentStatus}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-12 h-2 bg-gray-600 rounded-full overflow-hidden">
            <div className="absolute inset-0">
              <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-[wave_1.5s_ease-in-out_infinite]"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}