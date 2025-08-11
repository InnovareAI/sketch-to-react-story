import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
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

// Work Mode Navigation - Team Section
const teamNavItems = [
  { title: "Team Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Team Inbox", url: "/global-inbox", icon: Inbox },
  { title: "Team Accounts", url: "/accounts", icon: Building2 },
];

// Work Mode Navigation - Individual Section
const individualNavItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Inbox", url: "/inbox", icon: Mail },
  { title: "Message Queue", url: "/message-queue", icon: MessageSquare },
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
  { title: "Users & Permissions", url: "/users-permissions", icon: Shield },
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

export function WorkspaceSidebar({ 
  isConversational = false, 
  workspaceName = "Workspace" 
}: { 
  isConversational?: boolean;
  workspaceName?: string;
}) {
  const location = useLocation();
  const currentPath = location.pathname;
  
  // Simulated team membership - replace with actual logic
  const isTeamMember = true; // TODO: Replace with actual team membership check
  
  const [campaignOpen, setCampaignOpen] = useState(true);
  const [networkOpen, setNetworkOpen] = useState(true);
  const [teamOpen, setTeamOpen] = useState(true);
  const [individualOpen, setIndividualOpen] = useState(true);
  const [documentsOpen, setDocumentsOpen] = useState(true);
  
  // Simple collapsible section component
  const CollapsibleSection = ({ title, icon: Icon, children, isOpen, onToggle }: {
    title: string;
    icon: any;
    children: React.ReactNode;
    isOpen: boolean;
    onToggle: () => void;
  }) => (
    <div className="mb-4">
      <button
        onClick={onToggle}
        className={cn(
          "flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-md transition-colors",
          isConversational
            ? "text-gray-300 hover:bg-gray-800 hover:text-white"
            : "text-gray-700 hover:bg-gray-100"
        )}
      >
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4" />
          <span>{title}</span>
        </div>
        {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>
      {isOpen && <div className="mt-2 space-y-1">{children}</div>}
    </div>
  );

  // Simple navigation item component
  const NavItem = ({ item, isActive }: { item: any; isActive: boolean }) => (
    <NavLink
      to={item.url}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
        isActive
          ? isConversational
            ? "bg-gray-700 text-white"
            : "bg-primary/10 text-primary font-medium"
          : isConversational
          ? "text-gray-300 hover:bg-gray-800 hover:text-white"
          : "hover:bg-gray-100 text-gray-700"
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
      <div className={cn(
        "p-4 h-full overflow-y-auto",
        isConversational ? "bg-gray-900" : "bg-white"
      )}>
        {/* Workspace Header */}
        <div className="flex items-center gap-3 mb-6 px-2">
          <div className={cn(
            "flex items-center justify-center w-8 h-8 rounded-md",
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
              SAM AI Workspace
            </p>
          </div>
        </div>

        {/* Team Section - Conditional */}
        {!isConversational && isTeamMember && (
          <CollapsibleSection
            title="Team"
            icon={Users}
            isOpen={teamOpen}
            onToggle={() => setTeamOpen(!teamOpen)}
          >
            {teamNavItems.map((item) => (
              <NavItem
                key={item.title}
                item={item}
                isActive={currentPath === item.url}
              />
            ))}
          </CollapsibleSection>
        )}

        {/* Individual Section */}
        {!isConversational && (
          <CollapsibleSection
            title="My Account"
            icon={Home}
            isOpen={individualOpen}
            onToggle={() => setIndividualOpen(!individualOpen)}
          >
            {individualNavItems.map((item) => (
              <NavItem
                key={item.title}
                item={item}
                isActive={currentPath === item.url}
              />
            ))}
          </CollapsibleSection>
        )}

        {/* Agent Mode Navigation */}
        {isConversational && (
          <div className="space-y-2 mb-6">
            {agentNavItems.map((item) => (
              <NavItem
                key={item.title}
                item={item}
                isActive={currentPath === item.url}
              />
            ))}
          </div>
        )}

        {/* Conditional sections based on mode */}
        {!isConversational && (
          <>
            {/* Search Section */}
            <div className="mb-4">
              <NavItem
                item={{ title: "Search", url: "/search", icon: Search }}
                isActive={currentPath === "/search"}
              />
            </div>

            {/* Campaigns Section */}
            <CollapsibleSection
              title="Campaigns"
              icon={Target}
              isOpen={campaignOpen}
              onToggle={() => setCampaignOpen(!campaignOpen)}
            >
              {campaignItems.map((item) => (
                <NavItem
                  key={item.title}
                  item={item}
                  isActive={currentPath === item.url}
                />
              ))}
            </CollapsibleSection>

            {/* My Network Section */}
            <CollapsibleSection
              title="My network"
              icon={Users}
              isOpen={networkOpen}
              onToggle={() => setNetworkOpen(!networkOpen)}
            >
              {networkItems.map((item) => (
                <NavItem
                  key={item.title}
                  item={item}
                  isActive={currentPath === item.url}
                />
              ))}
            </CollapsibleSection>

            {/* Admin Section */}
            <div className="mt-auto space-y-2">
              <h3 className={cn(
                "text-xs font-medium px-3 py-2",
                isConversational ? "text-gray-400" : "text-gray-500"
              )}>
                WORKSPACE SETTINGS
              </h3>
              {adminItems.map((item) => (
                <NavItem
                  key={item.title}
                  item={item}
                  isActive={currentPath === item.url}
                />
              ))}
            </div>
          </>
        )}

        {/* Agent Mode specific sections */}
        {isConversational && (
          <>
            {/* Your Documents Section */}
            <CollapsibleSection
              title="Your Documents"
              icon={Folder}
              isOpen={documentsOpen}
              onToggle={() => setDocumentsOpen(!documentsOpen)}
            >
              {agentDocumentItems.map((item) => (
                <NavItem
                  key={item.title}
                  item={item}
                  isActive={currentPath === item.url}
                />
              ))}
            </CollapsibleSection>

            {/* AI Assistant Features */}
            <div className="mb-4">
              <div className={cn(
                "flex items-center gap-2 px-3 py-2 text-sm font-medium",
                "text-gray-300"
              )}>
                <Bot className="h-4 w-4" />
                <span>AI Features</span>
              </div>
              <div className="mt-2">
                <NavItem
                  item={{ title: "Agent Settings", url: "/agent-settings", icon: Settings }}
                  isActive={currentPath === "/agent-settings"}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}