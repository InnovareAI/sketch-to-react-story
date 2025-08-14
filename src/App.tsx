import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import AuthGate from "@/components/AuthGate";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import ManagedAccounts from "./pages/ManagedAccounts";
import Campaigns from "./pages/Campaigns";
import Contacts from "./pages/Contacts";
import ContactsView from "./pages/ContactsView";
import Search from "./pages/Search";
import GlobalInbox from "./pages/GlobalInbox";
import GlobalInboxSimple from "./pages/GlobalInboxSimple";
import TestInbox from "./pages/TestInbox";
import InboxDirect from "./pages/InboxDirect";
import MessageQueue from "./pages/MessageQueue";
import Templates from "./pages/Templates";
import TemplatesEnhanced from "./pages/TemplatesEnhanced";
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
import TenantManagement from "./pages/admin/TenantManagement";
import Settings from "./pages/Settings";
// Analytics merged with Dashboard - no longer needed as separate page
import ProspectSearch from "./pages/ProspectSearch";
import SearchResults from "./pages/SearchResults";
import Profile from "./pages/Profile";
import LinkedInAccountSetup from "./pages/LinkedInAccountSetup";
import LinkedInAccountManager from "./pages/LinkedInAccountManager";
import LinkedInDiagnostic from "./pages/LinkedInDiagnostic";
import LinkedInOnboarding from "./pages/LinkedInOnboarding";
import ContactSyncTest from "./pages/ContactSyncTest";
import Onboarding from "./pages/Onboarding";
import OnboardingCallback from "./pages/OnboardingCallback";
import UserSetup from "./pages/UserSetup";
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
            <AuthGate>
              <Routes>
                {/* Public/Auth Routes */}
                <Route path="/login" element={<UserLogin />} />
                <Route path="/auth/login" element={<UserLogin />} />
                <Route path="/admin/login" element={<SuperAdminLogin />} />
                <Route path="/admin/dashboard" element={<SuperAdminDashboard />} />
                <Route path="/admin/tenants" element={<TenantManagement />} />
                <Route path="/auth/linkedin/callback" element={<LinkedInCallback />} />
                <Route path="/test-inbox" element={<TestInbox />} />
                <Route path="/inbox-direct" element={<InboxDirect />} />
                <Route path="/simple-inbox" element={<TestInbox />} />
                <Route path="/linkedin-setup" element={<LinkedInAccountSetup />} />
                <Route path="/linkedin-manager" element={<LinkedInAccountManager />} />
                <Route path="/linkedin-diagnostic" element={<LinkedInDiagnostic />} />
                <Route path="/linkedin-onboarding" element={<LinkedInOnboarding />} />
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/onboarding/callback" element={<OnboardingCallback />} />
                <Route path="/setup/:token" element={<UserSetup />} />
                
                {/* Protected Workspace Routes - All authenticated pages use WorkspaceLayout */}
                <Route 
                path="/" 
                element={<WorkspaceLayout />}
              >
                <Route index element={<Dashboard />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="accounts" element={<ManagedAccounts />} />
                
                {/* Core Navigation Routes - These should never 404 */}
                <Route path="campaigns" element={<Campaigns />} />
                <Route path="contacts" element={<ContactsView />} />
                <Route path="contacts-old" element={<Contacts />} />
                <Route path="test-sync" element={<ContactSyncTest />} />
                <Route path="inbox" element={<GlobalInbox />} />
                <Route path="templates" element={<TemplatesEnhanced />} />
                <Route path="analytics" element={<Dashboard />} /> {/* Analytics redirects to Dashboard */}
                
                {/* Team Routes */}
                <Route path="global-inbox" element={<GlobalInbox />} />
                
                {/* Settings Routes - All redirect to unified Settings page */}
                <Route path="settings" element={<Settings />} />
                <Route path="team-settings" element={<Settings />} />
                <Route path="integrations" element={<Settings />} />
                <Route path="workspace-settings" element={<Settings />} />
                
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
            </AuthGate>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
