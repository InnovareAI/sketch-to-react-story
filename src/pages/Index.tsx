import { SidebarProvider } from "@/components/ui/sidebar";
import { WorkspaceSidebar } from "@/components/workspace/WorkspaceSidebar";
import { WorkspaceHeader } from "@/components/workspace/WorkspaceHeader";
import { WorkspaceDashboard } from "@/components/workspace/WorkspaceDashboard";

const Index = () => {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-background">
        <WorkspaceSidebar />
        <main className="flex-1 flex flex-col overflow-hidden">
          <WorkspaceHeader />
          <div className="flex-1 overflow-auto">
            <WorkspaceDashboard />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Index;
