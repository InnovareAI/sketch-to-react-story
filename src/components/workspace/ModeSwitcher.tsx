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
  currentMode: 'inbound' | 'outbound';
  onModeChange: (mode: 'inbound' | 'outbound') => void;
  className?: string;
}

export function ModeSwitcher({ currentMode, onModeChange, className }: ModeSwitcherProps) {
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleModeChange = (newMode: 'inbound' | 'outbound') => {
    if (newMode === currentMode) return;
    
    setIsTransitioning(true);
    setTimeout(() => {
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
      {/* Mode Toggle - Same style as Work/Agent switcher */}
      <div className="flex items-center gap-3 lg:gap-6">
        <div className="flex items-center gap-2 lg:gap-4 p-1.5 lg:p-2 rounded-xl border bg-gray-800 border-gray-600">
          <div className="flex items-center gap-1 lg:gap-2">
            <Send className={cn(
              "h-3 w-3 lg:h-4 lg:w-4",
              currentMode === 'outbound' ? "text-premium-purple" : "text-gray-400"
            )} />
            <span className={cn(
              "text-xs lg:text-sm font-medium hidden sm:inline",
              currentMode === 'outbound' ? "text-white" : "text-gray-400"
            )}>
              Outbound
            </span>
          </div>
          <Switch 
            checked={currentMode === 'inbound'}
            onCheckedChange={(checked) => handleModeChange(checked ? 'inbound' : 'outbound')}
            className="data-[state=checked]:bg-premium-purple"
          />
          <div className="flex items-center gap-1 lg:gap-2">
            <Inbox className={cn(
              "h-3 w-3 lg:h-4 lg:w-4",
              currentMode === 'inbound' ? "text-premium-purple" : "text-gray-400"
            )} />
            <span className={cn(
              "text-xs lg:text-sm font-medium hidden sm:inline",
              currentMode === 'inbound' ? "text-white" : "text-gray-400"
            )}>
              Inbound
            </span>
          </div>
        </div>
      </div>

      {/* Active Mode Info */}
      <div className={cn(
        "mt-3 p-3 rounded-lg border transition-all duration-300",
        modes[currentMode].bgColor,
        modes[currentMode].borderColor
      )}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {(() => {
              const Icon = modes[currentMode].icon;
              return <Icon className="h-5 w-5 text-white" />;
            })()}
            <span className="text-sm font-semibold text-white">
              {modes[currentMode].title} Mode Active
            </span>
          </div>
          <Badge variant="outline" className="text-xs border-white/30 text-white">
            {modes[currentMode].agents.length} Agents
          </Badge>
        </div>
        
        <p className="text-xs text-gray-300 mb-3">
          {modes[currentMode].description}
        </p>
        
        <div className="space-y-1">
          <div className="text-xs text-gray-400 mb-1">Active Specialists:</div>
          <div className="flex flex-wrap gap-2">
            {modes[currentMode].agents.map((agent) => (
              <div
                key={agent.name}
                className="flex items-center gap-1 px-2 py-1 bg-white/10 rounded-md"
              >
                <agent.icon className="h-3 w-3 text-white/70" />
                <span className="text-xs text-white/90">{agent.name}</span>
              </div>
            ))}
          </div>
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