import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import Accounts from "./pages/Accounts";
import Campaigns from "./pages/Campaigns";
import Contacts from "./pages/Contacts";
import Search from "./pages/Search";
import GlobalInbox from "./pages/GlobalInbox";
import MessageQueue from "./pages/MessageQueue";
import Templates from "./pages/Templates";
import Requests from "./pages/Requests";
import Placeholders from "./pages/Placeholders";
import Members from "./pages/Members";
import Roles from "./pages/Roles";
import WorkspaceSettings from "./pages/WorkspaceSettings";
import Agent from "./pages/Agent";
import LinkedInIntegrationSimple from "./pages/LinkedInIntegrationSimple";
import CampaignSetup from "./pages/CampaignSetup";
import AgentFullScreen from "./pages/AgentFullScreen";
import UsersPermissions from "./pages/admin/UsersPermissions";
import LinkedInCallback from "./pages/auth/LinkedInCallback";
import SuperAdminLogin from "./pages/auth/SuperAdminLogin";
import UserLogin from "./pages/auth/UserLogin";
import SuperAdminDashboard from "./pages/admin/SuperAdminDashboard";
import Integrations from "./pages/Integrations";
import TeamSettings from "./pages/TeamSettings";
import Analytics from "./pages/Analytics";
import ProspectSearch from "./pages/ProspectSearch";
import SearchResults from "./pages/SearchResults";
import Profile from "./pages/Profile";
import WorkspaceLayout from "./components/workspace/WorkspaceLayout";

const queryClient = new QueryClient();

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public/Auth Routes */}
              <Route path="/login" element={<UserLogin />} />
              <Route path="/auth/login" element={<UserLogin />} />
              <Route path="/admin/login" element={<SuperAdminLogin />} />
              <Route path="/admin/dashboard" element={<SuperAdminDashboard />} />
              <Route path="/auth/linkedin/callback" element={<LinkedInCallback />} />
              
              {/* Protected Workspace Routes - All authenticated pages use WorkspaceLayout */}
              <Route 
                path="/" 
                element={<WorkspaceLayout />}
              >
                <Route index element={<Index />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="accounts" element={<Accounts />} />
                
                {/* Core Navigation Routes - These should never 404 */}
                <Route path="campaigns" element={<Campaigns />} />
                <Route path="contacts" element={<Contacts />} />
                <Route path="inbox" element={<GlobalInbox />} />
                <Route path="templates" element={<Templates />} />
                <Route path="analytics" element={<Analytics />} />
                
                {/* Team Routes */}
                <Route path="global-inbox" element={<GlobalInbox />} />
                <Route path="team-settings" element={<TeamSettings />} />
                <Route path="integrations" element={<Integrations />} />
                
                {/* Campaign & Setup Routes */}
                <Route path="campaign-setup" element={<CampaignSetup />} />
                <Route path="prospect-search" element={<ProspectSearch />} />
                <Route path="search" element={<Search />} />
                <Route path="search-results" element={<SearchResults />} />
                <Route path="message-queue" element={<MessageQueue />} />
                <Route path="requests" element={<Requests />} />
                <Route path="placeholders" element={<Placeholders />} />
                <Route path="company-profile" element={<Members />} />
                <Route path="members" element={<Members />} />
                <Route path="roles" element={<Roles />} />
                <Route path="workspace-settings" element={<WorkspaceSettings />} />
                <Route path="profile" element={<Profile />} />
                <Route path="linkedin" element={<LinkedInIntegrationSimple />} />
                <Route path="linkedin-integration" element={<LinkedInIntegrationSimple />} />
                <Route 
                  path="users-permissions" 
                  element={<UsersPermissions />} 
                />
                <Route 
                  path="admin/users" 
                  element={<UsersPermissions />} 
                />
                
                {/* Agent/Chatbot Routes */}
                <Route path="agent" element={<AgentFullScreen />} />
                <Route path="agent-old" element={<Agent />} />
              </Route>
              
              {/* Legacy redirect - /workspace/dashboard redirects to main dashboard */}
              <Route 
                path="/workspace/dashboard" 
                element={<WorkspaceLayout />}
              >
                <Route index element={<Dashboard />} />
              </Route>
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
