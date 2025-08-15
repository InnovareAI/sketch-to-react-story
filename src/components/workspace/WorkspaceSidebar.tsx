import { useState } from "react";
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
  Shield,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SAMBranding } from '@/components/branding/SAMBranding';
import { WorkspaceSwitcher } from './WorkspaceSwitcher';
import WorkspaceSelector from './WorkspaceSelector';
import ReplyModal from '@/components/ReplyModal';

// Main Navigation Items
const mainNavItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Campaigns", url: "/campaigns", icon: Target },
  { title: "Search", url: "/search", icon: Search },
  { title: "Contacts", url: "/contacts", icon: Users },
  { title: "Reply", url: "/reply", icon: MessageSquare },
  { title: "Templates", url: "/templates", icon: FileText },
];

// Team Navigation Items  
const teamNavItems = [
  { title: "Team Accounts", url: "/accounts", icon: Building2 },
];

// Settings Navigation - Streamlined
const settingsItems = [
  { title: "Profile", url: "/profile", icon: Users },
  { title: "Settings", url: "/settings", icon: Settings },
];

// Super Admin Navigation (for InnovareAI workspace only)
const superAdminItems = [
  { title: "Tenant Management", url: "/admin/tenants", icon: Shield },
];

// Agent Mode Navigation
const agentNavItems = [
  { title: "AI Agents", url: "/agent", icon: Bot },
  { title: "Training", url: "/agent/train", icon: GraduationCap },
];

const agentDocumentItems = [
  { title: "ICP", url: "/agent/icp", icon: Target },
  { title: "Value Proposition", url: "/agent/value-prop", icon: Star },
  { title: "Offers", url: "/agent/offer", icon: Gift },
  { title: "Messaging", url: "/agent/messaging", icon: MessageSquare },
  { title: "CTAs", url: "/agent/cta", icon: MousePointer },
  { title: "Meetings", url: "/agent/meeting", icon: Calendar },
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
  const [showReplyModal, setShowReplyModal] = useState(false);
  
  // Determine if we're in agent mode based on current path
  const isAgentMode = currentPath.startsWith('/agent');

  // Simple navigation item component with no complex interactions
  const NavItem = ({ item, isActive }: { item: any; isActive: boolean }) => {
    // Special handling for reply to open modal
    if (item.title === "Reply") {
      return (
        <button
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 w-full",
            isAgentMode
              ? "text-gray-300 font-normal hover:bg-gray-800 hover:text-white ml-1"
              : "text-gray-600 font-normal hover:bg-gray-50 hover:text-blue-600 ml-1"
          )}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowReplyModal(true);
          }}
        >
          <item.icon className={cn("h-4 w-4 flex-shrink-0", isAgentMode ? "text-gray-300" : "")} />
          <span className="truncate">{item.title}</span>
        </button>
      );
    }
    
    return (
      <NavLink
        to={item.url}
        className={() => cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 w-full",
          isActive
            ? (isAgentMode 
               ? "bg-gradient-to-r from-purple-900/50 to-blue-900/50 text-white font-medium border-l-3 border-purple-400 ml-1"
               : "bg-gradient-to-r from-blue-50 to-purple-50 text-blue-600 font-medium border-l-3 border-blue-400 ml-1")
            : (isAgentMode
               ? "text-gray-300 font-normal hover:bg-gray-800 hover:text-white ml-1"
               : "text-gray-600 font-normal hover:bg-gray-50 hover:text-blue-600 ml-1")
        )}
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <item.icon className={cn("h-4 w-4 flex-shrink-0", isActive ? (isAgentMode ? "text-white" : "text-blue-500") : (isAgentMode ? "text-gray-300" : ""))} />
        <span className="truncate">{item.title}</span>
      </NavLink>
    );
  };

  return (
    <aside className={cn(
      "w-64 border-r sticky top-0 h-screen flex-shrink-0 overflow-hidden",
      isAgentMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"
    )}>
      <div className="h-full flex flex-col">
        {/* SAM Branding Header */}
        <div className={cn(
          "p-4 border-b",
          isAgentMode ? "border-gray-700" : "border-gray-200"
        )}>
          <SAMBranding variant="default" showTagline={true} className="mb-4" />
          <div className="flex flex-col gap-3">
            {/* Workspace Selector */}
            <WorkspaceSelector isAgentMode={isAgentMode} />
            
            {/* Mode Switch Button */}
            <div className={cn(
              "flex items-center gap-1 p-1 rounded-lg w-full border",
              isAgentMode 
                ? "bg-gray-800 border-gray-600" 
                : "bg-gray-50 border-gray-200"
            )}>
              <NavLink
                to="/"
                className={({ isActive }) => cn(
                  "flex-1 px-3 py-1.5 text-xs font-normal rounded-md text-center transition-all",
                  !isAgentMode 
                    ? "bg-white text-blue-600 shadow-sm border border-gray-200" 
                    : "text-gray-300 hover:text-white hover:bg-gray-700"
                )}
              >
                Work
              </NavLink>
              <NavLink
                to="/agent"
                className={({ isActive }) => cn(
                  "flex-1 px-3 py-1.5 text-xs font-normal rounded-md text-center transition-all",
                  isAgentMode 
                    ? "bg-black text-white shadow-sm border border-gray-500" 
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                Agent
              </NavLink>
            </div>
          </div>
        </div>

        {/* Navigation Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            {/* Main Navigation */}
            {!isAgentMode && (
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
            {isAgentMode && (
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
            {!isAgentMode && isTeamMember && (
              <div className="mb-6">
                <h3 className={cn(
                  "text-xs px-3 py-2 mb-2 uppercase tracking-wider",
                  isAgentMode ? "text-gray-300 font-normal" : "text-gray-400 font-normal"
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
            {isAgentMode && (
              <div className="mb-6">
                <h3 className={cn(
                  "text-xs px-3 py-2 mb-2 uppercase tracking-wider",
                  isAgentMode ? "text-gray-300 font-normal" : "text-gray-400 font-normal"
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

        {/* Settings Section - Only show in Work mode */}
        {!isAgentMode && (
        <div className="border-t border-gray-100 p-4 bg-gray-50">
          <h3 className={cn(
            "text-xs px-3 py-2 mb-2 uppercase tracking-wider",
            isAgentMode ? "text-gray-300 font-normal" : "text-gray-400 font-normal"
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
        )}
      </div>
      
      {/* Reply Modal */}
      <ReplyModal 
        isOpen={showReplyModal} 
        onClose={() => setShowReplyModal(false)} 
      />
    </aside>
  );
}