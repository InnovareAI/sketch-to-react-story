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
  { title: "Search", url: "/search", icon: Search },
  { title: "Global inbox", url: "/global-inbox", icon: Inbox },
];

const campaignItems = [
  { title: "My campaigns", url: "/campaigns", icon: Target },
  { title: "Templates", url: "/templates", icon: FileText },
  { title: "Marketplace", url: "/marketplace", icon: Building2 },
];

const networkItems = [
  { title: "My contacts", url: "/contacts", icon: Users },
  { title: "My requests", url: "/requests", icon: MessageSquare },
  { title: "Placeholders", url: "/placeholders", icon: FileText },
];

const adminItems = [
  { title: "Members", url: "/members", icon: Users },
  { title: "Roles & Permissions", url: "/roles", icon: Shield },
  { title: "Companies", url: "/companies", icon: Building2 },
  { title: "Workspace settings", url: "/workspace-settings", icon: Settings },
];

export function WorkspaceSidebar() {
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
                        <item.icon className="h-4 w-4" />
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
    <Sidebar className="w-64 border-r border-border" collapsible="icon">
      <SidebarContent className="p-4">
        {/* Brand Header */}
        <div className="flex items-center gap-3 mb-6 px-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">I</span>
          </div>
          <span className="font-semibold text-foreground">Innovare</span>
          <SidebarTrigger className="ml-auto" />
        </div>

        {/* LinkedIn Accounts Section */}
        <div className="mb-6">
          <div className="flex items-center gap-2 px-2 mb-3">
            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">in</span>
            </div>
            <span className="text-sm font-medium text-muted-foreground">All LinkedIn accounts</span>
            <Button variant="ghost" size="sm" className="ml-auto h-6 w-6 p-0">
              <span className="text-primary text-lg">+</span>
            </Button>
          </div>
          
          <div className="bg-muted/30 rounded-lg p-3 mb-1">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">I</span>
              </div>
              <div>
                <div className="text-sm font-medium">Innovare</div>
                <div className="text-xs text-muted-foreground">Dr. Stephanie Gripne</div>
                <div className="text-xs text-muted-foreground">Impact Finance Center</div>
                <div className="text-xs text-green-600">Active: 7:00-22:00</div>
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