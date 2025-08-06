import React from "react";
import { WorkspaceHeader } from "@/components/workspace/WorkspaceHeader";
import { WorkspaceSidebar } from "@/components/workspace/WorkspaceSidebar";
import { ConversationalInterface } from "@/components/workspace/ConversationalInterface";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function Agent() {
  // Agent mode is always conversational
  const isConversational = true;
  const onToggleMode = () => {
    // In agent mode, we don't allow toggling back to work mode
    // User can navigate to other pages to access work mode
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <WorkspaceSidebar />
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