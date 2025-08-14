import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Login from "./pages/Login";
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
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              
              {/* Protected routes */}
              <Route path="/" element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              } />
              <Route path="/agent" element={
                <ProtectedRoute>
                  <Agent />
                </ProtectedRoute>
              } />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/accounts" element={
                <ProtectedRoute>
                  <Accounts />
                </ProtectedRoute>
              } />
              <Route path="/campaigns" element={
                <ProtectedRoute>
                  <Campaigns />
                </ProtectedRoute>
              } />
              <Route path="/contacts" element={
                <ProtectedRoute>
                  <Contacts />
                </ProtectedRoute>
              } />
              <Route path="/search" element={
                <ProtectedRoute>
                  <Search />
                </ProtectedRoute>
              } />
              <Route path="/inbox" element={
                <ProtectedRoute>
                  <GlobalInbox />
                </ProtectedRoute>
              } />
              <Route path="/message-queue" element={
                <ProtectedRoute>
                  <MessageQueue />
                </ProtectedRoute>
              } />
              <Route path="/global-inbox" element={
                <ProtectedRoute>
                  <GlobalInbox />
                </ProtectedRoute>
              } />
              <Route path="/templates" element={
                <ProtectedRoute>
                  <Templates />
                </ProtectedRoute>
              } />
              <Route path="/requests" element={
                <ProtectedRoute>
                  <Requests />
                </ProtectedRoute>
              } />
              <Route path="/placeholders" element={
                <ProtectedRoute>
                  <Placeholders />
                </ProtectedRoute>
              } />
              <Route path="/company-profile" element={
                <ProtectedRoute>
                  <Members />
                </ProtectedRoute>
              } />
              <Route path="/members" element={
                <ProtectedRoute>
                  <Members />
                </ProtectedRoute>
              } />
              <Route path="/roles" element={
                <ProtectedRoute>
                  <Roles />
                </ProtectedRoute>
              } />
              <Route path="/workspace-settings" element={
                <ProtectedRoute>
                  <WorkspaceSettings />
                </ProtectedRoute>
              } />
              <Route path="/linkedin" element={
                <ProtectedRoute>
                  <LinkedInIntegration />
                </ProtectedRoute>
              } />
              <Route path="/linkedin-integration" element={
                <ProtectedRoute>
                  <LinkedInIntegration />
                </ProtectedRoute>
              } />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
