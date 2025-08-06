import React from "react";
import { useNavigate } from "react-router-dom";
import { WorkspaceHeader } from "@/components/workspace/WorkspaceHeader";
import { WorkspaceSidebar } from "@/components/workspace/WorkspaceSidebar";
import { ConversationalInterface } from "@/components/workspace/ConversationalInterface";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function Agent() {
  const navigate = useNavigate();
  
  // Agent mode is always conversational
  const isConversational = true;
  const onToggleMode = () => {
    // Navigate to main workspace when toggling to work mode
    navigate('/');
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full dark bg-gray-900 text-white">
        <WorkspaceSidebar isConversational={isConversational} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <WorkspaceHeader 
            isConversational={isConversational}
            onToggleMode={onToggleMode}
          />
          <div className="flex-1 overflow-auto">
            <ConversationalInterface />
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}