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

const mainNavItems = [
  { title: "Workspace Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Meet Sam", url: "/agent", icon: Bot },
  { title: "Team Accounts", url: "/accounts", icon: Building2 },
  { title: "Team Inbox", url: "/global-inbox", icon: Inbox },
];

const campaignItems = [
  { title: "My campaigns", url: "/campaigns", icon: Target },
  { title: "Templates", url: "/templates", icon: FileText },
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

export function WorkspaceSidebar({ isConversational = false }: { isConversational?: boolean }) {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  
  const [campaignOpen, setCampaignOpen] = useState(true);
  const [networkOpen, setNetworkOpen] = useState(true);
  
  const isActive = (path: string) => currentPath === path;
  const getNavCls = (path: string) =>
    isActive(path) ? "bg-primary/10 text-primary font-medium border-r-2 border-primary" : "hover:bg-muted/50";

  if (state === "collapsed") {
    return (
      <Sidebar className="w-14" collapsible="icon">
        <SidebarTrigger className="m-2 self-end" />
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {mainNavItems.map((item) => (
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
    <Sidebar className={`w-64 border-r ${isConversational ? 'bg-gray-900 border-gray-700' : 'border-border'}`} collapsible="icon">
      <SidebarContent className={`p-4 ${isConversational ? 'bg-gray-900' : ''}`}>
        {/* Brand Header */}
        <div className="flex items-center gap-3 mb-6 px-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">I</span>
          </div>
          <span className={`font-semibold ${isConversational ? 'text-white' : 'text-foreground'}`}>Innovare</span>
          <SidebarTrigger className="ml-auto" />
        </div>

        {/* LinkedIn Accounts Section */}
        <div className="mb-6">
          <div className="flex items-center gap-2 px-2 mb-3">
            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">in</span>
            </div>
            <span className={`text-sm font-medium ${isConversational ? 'text-gray-300' : 'text-muted-foreground'}`}>All accounts</span>
            <Button variant="ghost" size="sm" className="ml-auto h-6 w-6 p-0">
              <span className="text-primary text-lg">+</span>
            </Button>
          </div>
          
          <div className={`rounded-lg p-3 mb-1 ${isConversational ? 'bg-gray-800' : 'bg-muted/30'}`}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">J</span>
              </div>
              <div>
                <div className={`text-sm font-medium ${isConversational ? 'text-white' : ''}`}>Jennifer Fleming</div>
                <div className={`text-xs ${isConversational ? 'text-gray-400' : 'text-muted-foreground'}`}>Senior Account Executive</div>
                <div className={`text-xs ${isConversational ? 'text-gray-400' : 'text-muted-foreground'}`}>Multi-channel outreach</div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="text-xs text-green-600">LinkedIn: Active</div>
                  <div className="text-xs text-blue-600">Email: Active</div>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="ml-auto h-6 w-6 p-0">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                     <NavLink to={item.url} className={({ isActive }) => `${getNavCls(item.url)} flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive 
                          ? (isConversational ? 'bg-gray-700 text-white' : 'bg-primary/10 text-primary font-medium border-r-2 border-primary')
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

        {/* Search Section */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                   <NavLink to="/search" className={({ isActive }) => `${getNavCls("/search")} flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive 
                        ? (isConversational ? 'bg-gray-700 text-white' : 'bg-primary/10 text-primary font-medium border-r-2 border-primary')
                        : (isConversational ? 'text-gray-300 hover:bg-gray-800 hover:text-white' : 'hover:bg-muted/50')
                    }`}>
                    <Search className={`h-4 w-4 ${isConversational ? 'text-gray-300' : ''}`} />
                    <span>Search</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Campaigns Section */}
        <SidebarGroup>
          <Collapsible open={campaignOpen} onOpenChange={setCampaignOpen}>
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel className="flex items-center justify-between cursor-pointer hover:bg-muted/50 rounded-md p-2 -m-2">
                <span className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Campaigns
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
                        <NavLink to={item.url} className={getNavCls(item.url)}>
                        <item.icon className={`h-4 w-4 ${isConversational ? 'text-gray-300' : ''}`} />
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

        {/* My Network Section */}
        <SidebarGroup>
          <Collapsible open={networkOpen} onOpenChange={setNetworkOpen}>
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel className="flex items-center justify-between cursor-pointer hover:bg-muted/50 rounded-md p-2 -m-2">
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  My network
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
                        <NavLink to={item.url} className={getNavCls(item.url)}>
                        <item.icon className={`h-4 w-4 ${isConversational ? 'text-gray-300' : ''}`} />
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

        {/* Inbox Section */}
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Inbox className="h-4 w-4" />
              Inbox
            </span>
            <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">3848</span>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/inbox" className={getNavCls("/inbox")}>
                    <Mail className="h-4 w-4" />
                    <span>Inbox</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/message-queue" className={getNavCls("/message-queue")}>
                    <MessageSquare className="h-4 w-4" />
                    <span>Message queue</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin Section */}
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              {adminItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavCls(item.url)}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
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