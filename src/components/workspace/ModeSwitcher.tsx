/**
 * Mode Switcher Component
 * Allows switching between Inbound and Outbound modes
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Mail, 
  Send, 
  Inbox, 
  Target,
  Users,
  Filter,
  MessageSquare,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ModeSwitcherProps {
  currentMode: 'inbound' | 'outbound' | 'unified';
  onModeChange: (mode: 'inbound' | 'outbound' | 'unified') => void;
  className?: string;
}

export function ModeSwitcher({ currentMode, onModeChange, className }: ModeSwitcherProps) {
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleModeChange = (checked: boolean) => {
    setIsTransitioning(true);
    setTimeout(() => {
      // Three-way toggle: outbound -> unified -> inbound -> outbound
      let newMode: 'inbound' | 'outbound' | 'unified';
      if (currentMode === 'outbound') {
        newMode = 'unified';
      } else if (currentMode === 'unified') {
        newMode = 'inbound';
      } else {
        newMode = 'outbound';
      }
      onModeChange(newMode);
      setIsTransitioning(false);
    }, 300);
  };

  const modes = {
    outbound: {
      icon: Send,
      title: "Outbound",
      description: "Lead generation & campaigns",
      color: "from-blue-500 to-purple-600",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/30",
      agents: [
        { name: "Lead Research", icon: Users },
        { name: "Campaign Manager", icon: Target },
        { name: "Content Creator", icon: MessageSquare }
      ]
    },
    inbound: {
      icon: Inbox,
      title: "Inbound",
      description: "Email management & responses",
      color: "from-green-500 to-teal-600",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/30",
      agents: [
        { name: "Inbox Triage", icon: Mail },
        { name: "Spam Filter", icon: Filter },
        { name: "Auto-Response", icon: Sparkles }
      ]
    }
  };

  return (
    <div className={cn("relative", className)}>
      {/* Mode Selector - Three modes */}
      <div className="flex items-center gap-3 lg:gap-6">
        <div className="flex items-center gap-2 p-1.5 lg:p-2 rounded-xl border bg-black border-gray-600">
          <button
            onClick={() => onModeChange('outbound')}
            className={cn(
              "flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all",
              currentMode === 'outbound' ? "!bg-purple-600/20 !text-white" : "!text-gray-300 hover:!text-white hover:!bg-gray-900"
            )}
          >
            <Send className="h-3 w-3 lg:h-4 lg:w-4" />
            <span className="text-xs lg:text-sm font-medium hidden sm:inline">
              Outbound
            </span>
          </button>
          
          <button
            onClick={() => onModeChange('unified')}
            className={cn(
              "flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all",
              currentMode === 'unified' ? "!bg-purple-600/20 !text-white" : "!text-gray-300 hover:!text-white hover:!bg-gray-900"
            )}
          >
            <Sparkles className="h-3 w-3 lg:h-4 lg:w-4" />
            <span className="text-xs lg:text-sm font-medium hidden sm:inline">
              Unified
            </span>
          </button>
          
          <button
            onClick={() => onModeChange('inbound')}
            className={cn(
              "flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all",
              currentMode === 'inbound' ? "!bg-purple-600/20 !text-white" : "!text-gray-300 hover:!text-white hover:!bg-gray-900"
            )}
          >
            <Inbox className="h-3 w-3 lg:h-4 lg:w-4" />
            <span className="text-xs lg:text-sm font-medium hidden sm:inline">
              Inbound
            </span>
          </button>
        </div>
      </div>


      {/* Transition Overlay */}
      {isTransitioning && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 rounded-lg z-10">
          <div className="text-white text-sm flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            Switching mode...
          </div>
        </div>
      )}
    </div>
  );
}

export default ModeSwitcher;