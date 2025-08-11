import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import LinkedInIntegration from "./pages/LinkedInIntegration";
import CampaignSetup from "./pages/CampaignSetup";

const queryClient = new QueryClient();

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/agent" element={<Agent />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/accounts" element={<Accounts />} />
            <Route path="/campaigns" element={<Campaigns />} />
            <Route path="/campaign-setup" element={<CampaignSetup />} />
            <Route path="/contacts" element={<Contacts />} />
            <Route path="/search" element={<Search />} />
            <Route path="/inbox" element={<GlobalInbox />} />
            <Route path="/message-queue" element={<MessageQueue />} />
            <Route path="/global-inbox" element={<GlobalInbox />} />
            <Route path="/templates" element={<Templates />} />
            <Route path="/requests" element={<Requests />} />
            <Route path="/placeholders" element={<Placeholders />} />
            <Route path="/company-profile" element={<Members />} />
            <Route path="/members" element={<Members />} />
            <Route path="/roles" element={<Roles />} />
            <Route path="/workspace-settings" element={<WorkspaceSettings />} />
            <Route path="/linkedin" element={<LinkedInIntegration />} />
            <Route path="/linkedin-integration" element={<LinkedInIntegration />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
