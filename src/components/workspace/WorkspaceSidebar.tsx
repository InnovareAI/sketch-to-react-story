import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  BarChart3,
  MessageSquare,
  Users,
  Search,
  Building2,
  Mail,
  Calendar,
  Settings,
  Home,
  FileText,
  Target,
  Shield,
  Bot,
  Inbox,
  LayoutDashboard,
  ChevronDown,
  ChevronRight,
  GraduationCap,
  Star,
  Gift,
  MousePointer,
  Video,
  Folder,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";

// Work Mode Navigation
const workNavItems = [
  { title: "Workspace Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Team Accounts", url: "/accounts", icon: Building2 },
];

const campaignItems = [
  { title: "My campaigns", url: "/campaigns", icon: Target },
  { title: "Templates", url: "/templates", icon: FileText },
];

const inboxItems = [
  { title: "Team Inbox", url: "/global-inbox", icon: Inbox },
  { title: "My Inbox", url: "/inbox", icon: Mail },
  { title: "Message Queue", url: "/message-queue", icon: MessageSquare },
];

const networkItems = [
  { title: "My contacts", url: "/contacts", icon: Users },
  { title: "My requests", url: "/requests", icon: MessageSquare },
  { title: "Placeholders", url: "/placeholders", icon: FileText },
];

const adminItems = [
  { title: "Company Profile", url: "/company-profile", icon: Building2 },
  { title: "Users and Permissions", url: "/roles", icon: Shield },
  { title: "Workspace settings", url: "/workspace-settings", icon: Settings },
];

// Agent Mode Navigation
const agentNavItems = [
  { title: "Agentic Team", url: "/agent/team", icon: Users },
  { title: "Train Sam", url: "/agent/train", icon: GraduationCap },
];
const agentDocumentItems = [
  { title: "Your ICP", url: "/agent/icp", icon: Target },
  { title: "Your Value Prop", url: "/agent/value-prop", icon: Star },
  { title: "Your Offer", url: "/agent/offer", icon: Gift },
  { title: "Messaging Strategy", url: "/agent/messaging", icon: MessageSquare },
  { title: "CTA", url: "/agent/cta", icon: MousePointer },
  { title: "Meeting Link", url: "/agent/meeting", icon: Video },
  { title: "Link to Documents", url: "/agent/documents", icon: Folder },
];

export function WorkspaceSidebar({ isConversational = false }: { isConversational?: boolean }) {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  
  const [campaignOpen, setCampaignOpen] = useState(true);
  const [networkOpen, setNetworkOpen] = useState(true);
  const [inboxOpen, setInboxOpen] = useState(true);
  const [documentsOpen, setDocumentsOpen] = useState(true);
  
  const isActive = (path: string) => currentPath === path;
  const getNavCls = (path: string) =>
    isActive(path) ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted/50";

  if (state === "collapsed") {
    return (
      <Sidebar className="w-14 sticky top-0 h-screen lg:block hidden" collapsible="icon">
        <SidebarTrigger className="m-2 self-end" />
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {(isConversational ? agentNavItems : workNavItems).map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.url} className={getNavCls(item.url)}>
                      <item.icon className={`h-4 w-4 ${isConversational ? 'text-gray-300' : ''}`} />
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    );
  }

  return (
    <Sidebar className={`w-64 lg:w-64 md:w-56 border-r sticky top-0 h-screen lg:block ${isConversational ? 'bg-gray-900 border-gray-700' : 'border-border'}`} collapsible="icon">
      <SidebarContent className={`p-4 h-full overflow-y-auto ${isConversational ? 'bg-gray-900' : ''}`}>
        {/* Brand Header */}
        <div className="flex items-center gap-3 mb-6 px-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">I</span>
          </div>
          <img 
            src="/lovable-uploads/f38e3099-bf46-483c-9a94-d1b4f8b34cb6.png" 
            alt="Innovare.AI" 
            className={`h-6 ${isConversational ? 'brightness-0 invert' : ''}`}
          />
          <SidebarTrigger className="ml-auto" />
        </div>


        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {(isConversational ? agentNavItems : workNavItems).map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                     <NavLink to={item.url} className={({ isActive }) => `${getNavCls(item.url)} flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive 
                          ? (isConversational ? 'bg-gray-700 text-white' : 'bg-primary/10 text-primary font-medium')
                          : (isConversational ? 'text-gray-300 hover:bg-gray-800 hover:text-white' : 'hover:bg-muted/50')
                      }`}>
                        <item.icon className={`h-4 w-4 ${isConversational ? 'text-gray-300' : ''}`} />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Conditional sections based on mode */}
        {!isConversational && (
          <>
            {/* Search Section - Work Mode Only */}
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                       <NavLink to="/search" className={({ isActive }) => `${getNavCls("/search")} flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          isActive 
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'hover:bg-muted/50'
                        }`}>
                        <Search className="h-4 w-4" />
                        <span>Search</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Campaigns Section - Work Mode Only */}
            <SidebarGroup>
              <Collapsible open={campaignOpen} onOpenChange={setCampaignOpen}>
                <CollapsibleTrigger asChild>
                  <SidebarGroupLabel className="flex items-center justify-between cursor-pointer hover:bg-muted/50 rounded-md p-2 -m-2">
                    <span className="flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      <span>Campaigns</span>
                    </span>
                    {campaignOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </SidebarGroupLabel>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {campaignItems.map((item) => (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton asChild>
                            <NavLink to={item.url} className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                              isActive 
                                ? 'bg-primary/10 text-primary font-medium'
                                : 'hover:bg-muted/50'
                            }`}>
                              <item.icon className="h-4 w-4" />
                              <span>{item.title}</span>
                            </NavLink>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </Collapsible>
            </SidebarGroup>

            {/* My Network Section - Work Mode Only */}
            <SidebarGroup>
              <Collapsible open={networkOpen} onOpenChange={setNetworkOpen}>
                <CollapsibleTrigger asChild>
                  <SidebarGroupLabel className="flex items-center justify-between cursor-pointer hover:bg-muted/50 rounded-md p-2 -m-2">
                    <span className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>My network</span>
                    </span>
                    {networkOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </SidebarGroupLabel>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {networkItems.map((item) => (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton asChild>
                            <NavLink to={item.url} className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                              isActive 
                                ? 'bg-primary/10 text-primary font-medium'
                                : 'hover:bg-muted/50'
                            }`}>
                              <item.icon className="h-4 w-4" />
                              <span>{item.title}</span>
                            </NavLink>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </Collapsible>
            </SidebarGroup>

            {/* Inbox Section - Work Mode Only */}
            <SidebarGroup>
              <Collapsible open={inboxOpen} onOpenChange={setInboxOpen}>
                <CollapsibleTrigger asChild>
                  <SidebarGroupLabel className="flex items-center justify-between cursor-pointer hover:bg-muted/50 rounded-md p-2 -m-2">
                    <span className="flex items-center gap-2">
                      <Inbox className="h-4 w-4" />
                      <span>Inbox</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">3848</span>
                      {inboxOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </div>
                  </SidebarGroupLabel>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {inboxItems.map((item) => (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton asChild>
                            <NavLink to={item.url} className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                              isActive 
                                ? 'bg-primary/10 text-primary font-medium'
                                : 'hover:bg-muted/50'
                            }`}>
                              <item.icon className="h-4 w-4" />
                              <span>{item.title}</span>
                            </NavLink>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </Collapsible>
            </SidebarGroup>

            {/* Admin Section - Work Mode Only */}
            <SidebarGroup className="mt-auto">
              <SidebarGroupContent>
                <SidebarMenu>
                  {adminItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink to={item.url} className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          isActive 
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'hover:bg-muted/50'
                        }`}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}

        {/* Agent Mode specific sections */}
        {isConversational && (
          <>
            {/* Your Documents Section */}
            <SidebarGroup>
              <Collapsible open={documentsOpen} onOpenChange={setDocumentsOpen}>
                <CollapsibleTrigger asChild>
                  <SidebarGroupLabel className="flex items-center justify-between cursor-pointer hover:bg-gray-800 rounded-md p-2 -m-2 text-gray-300">
                    <span className="flex items-center gap-2">
                      <Folder className="h-4 w-4 text-gray-300" />
                      <span className="text-gray-300">Your Documents</span>
                    </span>
                    {documentsOpen ? <ChevronDown className="h-4 w-4 text-gray-300" /> : <ChevronRight className="h-4 w-4 text-gray-300" />}
                  </SidebarGroupLabel>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {agentDocumentItems.map((item) => (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton asChild>
                            <NavLink to={item.url} className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                              isActive 
                                ? 'bg-gray-700 text-white'
                                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                            }`}>
                              <item.icon className="h-4 w-4 text-gray-300" />
                              <span>{item.title}</span>
                            </NavLink>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </Collapsible>
            </SidebarGroup>

            {/* AI Assistant Features */}
            <SidebarGroup>
              <SidebarGroupLabel className="flex items-center justify-between text-gray-300">
                <span className="flex items-center gap-2">
                  <Bot className="h-4 w-4 text-gray-300" />
                  <span className="text-gray-300">AI Features</span>
                </span>
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink to="/agent-settings" className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive 
                          ? 'bg-gray-700 text-white'
                          : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      }`}>
                        <Settings className="h-4 w-4 text-gray-300" />
                        <span>Agent Settings</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>
    </Sidebar>
  );
}