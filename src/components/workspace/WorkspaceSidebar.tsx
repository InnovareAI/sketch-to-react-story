import { NavLink, useLocation } from "react-router-dom";
import {
  BarChart3,
  MessageSquare,
  Users,
  Mail,
  Settings,
  FileText,
  Target,
  Bot,
  Inbox,
  LayoutDashboard,
  Building2,
  GraduationCap,
  Star,
  Gift,
  MousePointer,
  Video,
  Folder,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Main Navigation Items
const mainNavItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Campaigns", url: "/campaigns", icon: Target },
  { title: "Search", url: "/prospect-search", icon: Search },
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

  // Simple navigation item component with no complex interactions
  const NavItem = ({ item, isActive }: { item: any; isActive: boolean }) => (
    <NavLink
      to={item.url}
      className={() => cn(
        "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 w-full",
        isActive
          ? "bg-blue-50 text-blue-600 border-l-4 border-blue-600"
          : "text-gray-600 hover:bg-blue-50 hover:text-blue-600 hover:border-l-4 hover:border-blue-300"
      )}
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      <item.icon className="h-4 w-4 flex-shrink-0" />
      <span className="truncate">{item.title}</span>
    </NavLink>
  );

  return (
    <aside className={cn(
      "w-64 border-r sticky top-0 h-screen flex-shrink-0 overflow-hidden",
      isConversational ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"
    )}>
      <div className="h-full flex flex-col">
        {/* Workspace Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className={cn(
              "flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0",
              isConversational ? "bg-gray-800 text-gray-300" : "bg-blue-600 text-white"
            )}>
              <Building2 className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className={cn(
                "font-semibold text-sm truncate",
                isConversational ? "text-white" : "text-gray-900"
              )}>
                {workspaceName}
              </h2>
              <p className={cn(
                "text-xs truncate",
                isConversational ? "text-gray-400" : "text-gray-500"
              )}>
                LinkedIn Automation
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            {/* Main Navigation */}
            {!isConversational && (
              <nav className="space-y-1 mb-6">
                {mainNavItems.map((item) => (
                  <NavItem
                    key={item.title}
                    item={item}
                    isActive={currentPath === item.url}
                  />
                ))}
              </nav>
            )}

            {/* Agent Mode Navigation */}
            {isConversational && (
              <nav className="space-y-1 mb-6">
                {agentNavItems.map((item) => (
                  <NavItem
                    key={item.title}
                    item={item}
                    isActive={currentPath === item.url}
                  />
                ))}
              </nav>
            )}

            {/* Team Section */}
            {!isConversational && isTeamMember && (
              <div className="mb-6">
                <h3 className={cn(
                  "text-xs font-semibold px-3 py-2 mb-2 uppercase tracking-wide",
                  isConversational ? "text-gray-400" : "text-gray-500"
                )}>
                  Team
                </h3>
                <nav className="space-y-1">
                  {teamNavItems.map((item) => (
                    <NavItem
                      key={item.title}
                      item={item}
                      isActive={currentPath === item.url}
                    />
                  ))}
                </nav>
              </div>
            )}

            {/* Agent Documents - Always Expanded */}
            {isConversational && (
              <div className="mb-6">
                <h3 className={cn(
                  "text-xs font-semibold px-3 py-2 mb-2 uppercase tracking-wide",
                  "text-gray-400"
                )}>
                  Documents
                </h3>
                <nav className="space-y-1">
                  {agentDocumentItems.map((item) => (
                    <NavItem
                      key={item.title}
                      item={item}
                      isActive={currentPath === item.url}
                    />
                  ))}
                </nav>
              </div>
            )}
          </div>
        </div>

        {/* Settings Section */}
        <div className="border-t border-gray-200 p-4">
          <h3 className={cn(
            "text-xs font-semibold px-3 py-2 mb-2 uppercase tracking-wide",
            isConversational ? "text-gray-400" : "text-gray-500"
          )}>
            Settings
          </h3>
          <nav className="space-y-1">
            {settingsItems.map((item) => (
              <NavItem
                key={item.title}
                item={item}
                isActive={currentPath === item.url}
              />
            ))}
          </nav>
        </div>
      </div>
    </aside>
  );
}