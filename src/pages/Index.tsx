import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { WorkspaceSidebar } from "@/components/workspace/WorkspaceSidebar";
import { WorkspaceHeader } from "@/components/workspace/WorkspaceHeader";
import { WorkspaceDashboard } from "@/components/workspace/WorkspaceDashboard";
import { ConversationalInterface } from "@/components/workspace/ConversationalInterface";

const Index = () => {
  const [isConversational, setIsConversational] = useState(false);
  const navigate = useNavigate();

  const handleToggleMode = (conversational: boolean) => {
    if (conversational) {
      // Navigate to dedicated agent page for agent mode
      navigate('/agent');
    } else {
      // Stay on current page and show work mode
      setIsConversational(false);
    }
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-background">
        <WorkspaceSidebar isConversational={isConversational} />
        <main className="flex-1 flex flex-col overflow-hidden">
          <WorkspaceHeader 
            isConversational={isConversational}
            onToggleMode={handleToggleMode}
          />
          <div className="flex-1 overflow-auto">
            {isConversational ? (
              <ConversationalInterface />
            ) : (
              <WorkspaceDashboard />
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Index;
