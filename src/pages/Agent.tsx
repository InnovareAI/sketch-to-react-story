import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { WorkspaceHeader } from "@/components/workspace/WorkspaceHeader";
import { WorkspaceSidebar } from "@/components/workspace/WorkspaceSidebar";
import { EnhancedConversationalInterface } from "@/components/workspace/EnhancedConversationalInterface";
import { ModeSwitcher } from "@/components/workspace/ModeSwitcher";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function Agent() {
  const navigate = useNavigate();
  const [operationMode, setOperationMode] = useState<'inbound' | 'outbound'>('outbound');
  
  // Agent mode is always conversational
  const isConversational = true;
  const onToggleMode = () => {
    // Navigate to main workspace when toggling to work mode
    navigate('/');
  };
  
  const handleModeChange = (mode: 'inbound' | 'outbound') => {
    setOperationMode(mode);
  };

  return (
    <SidebarProvider open={true} onOpenChange={() => {}}>
      <div className="min-h-screen flex w-full dark bg-gray-900 text-white">
        <WorkspaceSidebar isConversational={isConversational} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <WorkspaceHeader 
            isConversational={isConversational}
            onToggleMode={onToggleMode}
          />
          {/* Mode Switcher for Inbound/Outbound */}
          <div className="px-4 py-2 bg-gray-800 border-b border-gray-700">
            <ModeSwitcher 
              currentMode={operationMode}
              onModeChange={handleModeChange}
              className="max-w-2xl mx-auto"
            />
          </div>
          <div className="flex-1 overflow-auto">
            <EnhancedConversationalInterface operationMode={operationMode} />
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}