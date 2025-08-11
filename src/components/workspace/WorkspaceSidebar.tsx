import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  BarChart3,
  MessageSquare,
  Users,
  Search,
  Mail,
  Settings,
  Home,
  FileText,
  Target,
  Shield,
  Bot,
  Inbox,
  LayoutDashboard,
  Building2,
  ChevronDown,
  ChevronRight,
  GraduationCap,
  Star,
  Gift,
  MousePointer,
  Video,
  Folder,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Main Navigation Items
const mainNavItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Campaigns", url: "/campaigns", icon: Target },
  { title: "Contacts", url: "/contacts", icon: Users },
  { title: "Inbox", url: "/inbox", icon: Mail },
  { title: "Templates", url: "/templates", icon: FileText },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
];

// Team Navigation Items  
const teamNavItems = [
  { title: "Team Accounts", url: "/accounts", icon: Building2 },
  { title: "Team Inbox", url: "/global-inbox", icon: Inbox },
  { title: "Team Settings", url: "/team-settings", icon: Settings },
];

// Settings Navigation
const settingsItems = [
  { title: "Profile", url: "/profile", icon: Users },
  { title: "Workspace Settings", url: "/workspace-settings", icon: Settings },
  { title: "Integrations", url: "/integrations", icon: Target },
];

// Agent Mode Navigation
const agentNavItems = [
  { title: "AI Agents", url: "/agent/team", icon: Bot },
  { title: "Training", url: "/agent/train", icon: GraduationCap },
];

const agentDocumentItems = [
  { title: "ICP", url: "/agent/icp", icon: Target },
  { title: "Value Proposition", url: "/agent/value-prop", icon: Star },
  { title: "Offers", url: "/agent/offer", icon: Gift },
  { title: "Messaging", url: "/agent/messaging", icon: MessageSquare },
  { title: "CTAs", url: "/agent/cta", icon: MousePointer },
  { title: "Meetings", url: "/agent/meeting", icon: Video },
  { title: "Documents", url: "/agent/documents", icon: Folder },
];

export function WorkspaceSidebar({ 
  isConversational = false, 
  workspaceName = "Workspace" 
}: { 
  isConversational?: boolean;
  workspaceName?: string;
}) {
  const location = useLocation();
  const currentPath = location.pathname;
  
  const isTeamMember = true;
  const [documentsOpen, setDocumentsOpen] = useState(true);
  
  // Simple navigation item component
  const NavItem = ({ item, isActive }: { item: any; isActive: boolean }) => (
    <NavLink
      to={item.url}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
        isActive
          ? isConversational
            ? "bg-gray-700 text-white"
            : "bg-primary/10 text-primary"
          : isConversational
          ? "text-gray-300 hover:bg-gray-800 hover:text-white"
          : "text-gray-700 hover:bg-gray-100"
      )}
    >
      <item.icon className="h-4 w-4" />
      <span>{item.title}</span>
    </NavLink>
  );

  return (
    <div className={cn(
      "w-64 border-r sticky top-0 h-screen flex flex-col",
      isConversational ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"
    )}>
      <div className="p-4 h-full overflow-y-auto">
        {/* Workspace Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className={cn(
            "flex items-center justify-center w-8 h-8 rounded-lg",
            isConversational ? "bg-gray-800 text-gray-300" : "bg-primary text-white"
          )}>
            <Building2 className="h-4 w-4" />
          </div>
          <div>
            <h2 className={cn(
              "font-semibold text-sm",
              isConversational ? "text-white" : "text-gray-900"
            )}>
              {workspaceName}
            </h2>
            <p className={cn(
              "text-xs",
              isConversational ? "text-gray-400" : "text-gray-500"
            )}>
              LinkedIn Automation
            </p>
          </div>
        </div>

        {/* Main Navigation */}
        {!isConversational && (
          <div className="space-y-1 mb-6">
            {mainNavItems.map((item) => (
              <NavItem
                key={item.title}
                item={item}
                isActive={currentPath === item.url}
              />
            ))}
          </div>
        )}

        {/* Agent Mode Navigation */}
        {isConversational && (
          <div className="space-y-1 mb-6">
            {agentNavItems.map((item) => (
              <NavItem
                key={item.title}
                item={item}
                isActive={currentPath === item.url}
              />
            ))}
          </div>
        )}

        {/* Team Section */}
        {!isConversational && isTeamMember && (
          <div className="mb-6">
            <h3 className={cn(
              "text-xs font-semibold px-3 py-2 mb-2",
              isConversational ? "text-gray-400" : "text-gray-500"
            )}>
              TEAM
            </h3>
            <div className="space-y-1">
              {teamNavItems.map((item) => (
                <NavItem
                  key={item.title}
                  item={item}
                  isActive={currentPath === item.url}
                />
              ))}
            </div>
          </div>
        )}

        {/* Agent Documents */}
        {isConversational && (
          <div className="mb-6">
            <button
              onClick={() => setDocumentsOpen(!documentsOpen)}
              className={cn(
                "flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                "text-gray-300 hover:bg-gray-800 hover:text-white"
              )}
            >
              <div className="flex items-center gap-2">
                <Folder className="h-4 w-4" />
                <span>Documents</span>
              </div>
              {documentsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
            {documentsOpen && (
              <div className="mt-2 space-y-1">
                {agentDocumentItems.map((item) => (
                  <NavItem
                    key={item.title}
                    item={item}
                    isActive={currentPath === item.url}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Settings Section */}
        <div className="mt-auto">
          <h3 className={cn(
            "text-xs font-semibold px-3 py-2 mb-2",
            isConversational ? "text-gray-400" : "text-gray-500"
          )}>
            SETTINGS
          </h3>
          <div className="space-y-1">
            {settingsItems.map((item) => (
              <NavItem
                key={item.title}
                item={item}
                isActive={currentPath === item.url}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}