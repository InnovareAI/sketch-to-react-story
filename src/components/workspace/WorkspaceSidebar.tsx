import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  BarChart3,
  MessageSquare,
  Users,
  Search,
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
  Building2,
  ChevronDown,
  ChevronRight,
  GraduationCap,
  Star,
  Gift,
  MousePointer,
  Video,
  Folder,
  Linkedin,
  UserPlus,
  Send,
  MessageCircle,
  TrendingUp,
  Zap,
  Clock,
  Database,
  Filter,
  Bell,
  Plus,
  Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

// LinkedIn Sales Workflow Navigation - Organized by user workflow
const prospectingItems = [
  { title: "LinkedIn Search", url: "/search", icon: Search, description: "Find prospects on LinkedIn" },
  { title: "Lead Capture", url: "/lead-capture", icon: UserPlus, description: "Import and manage leads", badge: "New" },
  { title: "Contact Lists", url: "/contacts", icon: Users, description: "Organized prospect lists" },
];

const outreachItems = [
  { title: "Campaigns", url: "/campaigns", icon: Target, description: "Automated outreach sequences" },
  { title: "Message Templates", url: "/templates", icon: FileText, description: "Reusable message templates" },
  { title: "Connection Requests", url: "/requests", icon: Linkedin, description: "LinkedIn connection management" },
  { title: "Message Queue", url: "/message-queue", icon: Send, description: "Scheduled messages" },
];

const engagementItems = [
  { title: "Inbox", url: "/inbox", icon: MessageCircle, description: "All conversations" },
  { title: "Responses", url: "/responses", icon: Mail, description: "Track replies and follow-ups" },
  { title: "Activity Feed", url: "/activity", icon: Activity, description: "Recent prospect interactions" },
];

const analyticsItems = [
  { title: "Performance", url: "/dashboard", icon: TrendingUp, description: "Campaign analytics" },
  { title: "Team Dashboard", url: "/", icon: LayoutDashboard, description: "Team performance overview" },
];

const teamItems = [
  { title: "Team Inbox", url: "/global-inbox", icon: Inbox, description: "Shared conversations" },
  { title: "Team Accounts", url: "/accounts", icon: Building2, description: "Manage LinkedIn accounts" },
];

const adminItems = [
  { title: "Workspace Settings", url: "/workspace-settings", icon: Settings },
  { title: "Users & Permissions", url: "/users-permissions", icon: Shield },
  { title: "Company Profile", url: "/company-profile", icon: Building2 },
];

// Agent Mode Navigation
const agentNavItems = [
  { title: "Agentic Team", url: "/agent/team", icon: Users, description: "Manage AI agents" },
  { title: "Train Sam", url: "/agent/train", icon: GraduationCap, description: "AI training center" },
];

const agentDocumentItems = [
  { title: "Your ICP", url: "/agent/icp", icon: Target, description: "Ideal Customer Profile" },
  { title: "Your Value Prop", url: "/agent/value-prop", icon: Star, description: "Value proposition" },
  { title: "Your Offer", url: "/agent/offer", icon: Gift, description: "Product/service offers" },
  { title: "Messaging Strategy", url: "/agent/messaging", icon: MessageSquare, description: "Messaging frameworks" },
  { title: "CTA", url: "/agent/cta", icon: MousePointer, description: "Call-to-action templates" },
  { title: "Meeting Link", url: "/agent/meeting", icon: Video, description: "Meeting scheduler" },
  { title: "Link to Documents", url: "/agent/documents", icon: Folder, description: "Resource library" },
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
  
  const [prospectingOpen, setProspectingOpen] = useState(true);
  const [outreachOpen, setOutreachOpen] = useState(true);
  const [engagementOpen, setEngagementOpen] = useState(true);
  const [analyticsOpen, setAnalyticsOpen] = useState(true);
  const [teamOpen, setTeamOpen] = useState(true);
  const [documentsOpen, setDocumentsOpen] = useState(true);
  
  // Enhanced collapsible section component with better styling
  const CollapsibleSection = ({ title, icon: Icon, children, isOpen, onToggle, description }: {
    title: string;
    icon: any;
    children: React.ReactNode;
    isOpen: boolean;
    onToggle: () => void;
    description?: string;
  }) => (
    <div className="mb-6">
      <button
        onClick={onToggle}
        className={cn(
          "flex items-center justify-between w-full px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-primary/50",
          isConversational
            ? "text-gray-200 hover:bg-gray-800/50 hover:text-white border border-gray-700/50 hover:border-gray-600 focus:ring-premium-purple/50"
            : "text-gray-800 hover:bg-gray-50 border border-gray-200 hover:border-gray-300 hover:shadow-sm focus:ring-primary/50"
        )}
        aria-expanded={isOpen}
        aria-controls={`section-${title.toLowerCase().replace(/\s+/g, '-')}`}
        aria-label={`${isOpen ? 'Collapse' : 'Expand'} ${title} section`}
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-1.5 rounded-lg transition-colors",
            isConversational
              ? "bg-gray-700 text-gray-300 group-hover:bg-gray-600"
              : "bg-gray-100 text-gray-600 group-hover:bg-gray-200"
          )}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="text-left">
            <span className="block">{title}</span>
            {description && (
              <span className={cn(
                "text-xs block mt-0.5",
                isConversational ? "text-gray-400" : "text-gray-500"
              )}>
                {description}
              </span>
            )}
          </div>
        </div>
        <div className={cn(
          "transition-transform duration-200",
          isOpen ? "rotate-180" : "rotate-0"
        )}>
          <ChevronDown className="h-4 w-4" />
        </div>
      </button>
      <div 
        className={cn(
          "overflow-hidden transition-all duration-200",
          isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        )}
        id={`section-${title.toLowerCase().replace(/\s+/g, '-')}`}
        role="region"
        aria-labelledby={`section-${title.toLowerCase().replace(/\s+/g, '-')}-header`}
      >
        <div className="pt-3 space-y-1" role="list">{children}</div>
      </div>
    </div>
  );

  // Enhanced navigation item component with better styling and tooltips
  const NavItem = ({ item, isActive, isSubItem = false }: { item: any; isActive: boolean; isSubItem?: boolean }) => (
    <NavLink
      to={item.url}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group relative focus:outline-none focus:ring-2",
        isSubItem && "ml-2",
        isActive
          ? isConversational
            ? "bg-gradient-to-r from-premium-purple/20 to-premium-blue/20 text-white border border-premium-purple/30 shadow-lg focus:ring-premium-purple/50"
            : "bg-gradient-to-r from-primary/10 to-primary/5 text-primary border border-primary/20 shadow-sm font-semibold focus:ring-primary/50"
          : isConversational
          ? "text-gray-300 hover:bg-gray-800/50 hover:text-white hover:border-gray-700 border border-transparent focus:ring-premium-purple/50"
          : "text-gray-700 hover:bg-gray-50 hover:text-gray-900 hover:border-gray-200 border border-transparent hover:shadow-sm focus:ring-primary/50"
      )}
      aria-current={isActive ? 'page' : undefined}
      role="listitem"
    >
      {/* Active indicator */}
      {isActive && (
        <div className={cn(
          "absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full",
          isConversational ? "bg-premium-purple" : "bg-primary"
        )} />
      )}
      
      <div className={cn(
        "p-1.5 rounded-lg transition-colors",
        isActive
          ? isConversational
            ? "bg-premium-purple/20 text-premium-purple"
            : "bg-primary/10 text-primary"
          : isConversational
          ? "text-gray-400 group-hover:text-gray-300 group-hover:bg-gray-700"
          : "text-gray-500 group-hover:text-gray-700 group-hover:bg-gray-100"
      )}>
        <item.icon className="h-4 w-4" />
      </div>
      
      <div className="flex-1">
        <span className="block">{item.title}</span>
        {item.description && !isActive && (
          <span className={cn(
            "text-xs block mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity",
            isConversational ? "text-gray-400" : "text-gray-500"
          )}>
            {item.description}
          </span>
        )}
      </div>
      
      {item.badge && (
        <Badge variant="secondary" className="text-xs px-2 py-0.5">
          {item.badge}
        </Badge>
      )}
    </NavLink>
  );

  // Quick action button component
  const QuickActionButton = ({ icon: Icon, label, onClick, variant = "ghost" }: {
    icon: any;
    label: string;
    onClick: () => void;
    variant?: "ghost" | "default";
  }) => (
    <Button
      variant={variant}
      size="sm"
      onClick={onClick}
      className={cn(
        "w-full justify-start gap-2 text-sm h-9 focus:outline-none focus:ring-2",
        variant === "default"
          ? isConversational
            ? "bg-premium-purple hover:bg-premium-purple/80 text-white focus:ring-premium-purple/50"
            : "bg-primary hover:bg-primary/90 text-white focus:ring-primary/50"
          : isConversational
          ? "text-gray-300 hover:text-white hover:bg-gray-800 focus:ring-premium-purple/50"
          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:ring-primary/50"
      )}
      aria-label={label}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Button>
  );

  return (
    <nav 
      className={cn(
        "w-72 border-r sticky top-0 h-screen flex flex-col",
        isConversational 
          ? "bg-gradient-to-b from-gray-900 to-gray-800 border-gray-700/50" 
          : "bg-white border-gray-200 shadow-sm"
      )}
      aria-label="Main navigation"
      role="navigation"
    >
      <div className={cn(
        "h-full flex flex-col",
        isConversational ? "bg-transparent" : "bg-white"
      )}>
        {/* Enhanced Workspace Header */}
        <header className="p-6 border-b border-gray-200/10" role="banner">
          <div className="flex items-center gap-4 mb-4">
            <div className={cn(
              "flex items-center justify-center w-12 h-12 rounded-2xl",
              isConversational 
                ? "bg-gradient-to-br from-premium-purple to-premium-blue shadow-lg" 
                : "bg-gradient-to-br from-primary to-primary/80 shadow-md"
            )}>
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h2 className={cn(
                "font-bold text-lg",
                isConversational ? "text-white" : "text-gray-900"
              )}>
                {workspaceName}
              </h2>
              <p className={cn(
                "text-sm flex items-center gap-1",
                isConversational ? "text-gray-300" : "text-gray-600"
              )}>
                <Linkedin className="h-3 w-3" />
                LinkedIn Automation
              </p>
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-2">
            <QuickActionButton
              icon={Plus}
              label="New Campaign"
              onClick={() => window.location.href = '/campaign-setup'}
              variant="default"
            />
            <QuickActionButton
              icon={Bell}
              label="Activity"
              onClick={() => window.location.href = '/activity'}
            />
          </div>
        </header>

        {/* Scrollable Navigation Content */}
        <main className="flex-1 overflow-y-auto px-4 py-4 space-y-2" role="main">
          {/* Analytics & Performance */}
          {!isConversational && (
            <CollapsibleSection
              title="Analytics & Performance"
              icon={TrendingUp}
              description="Track your LinkedIn success"
              isOpen={analyticsOpen}
              onToggle={() => setAnalyticsOpen(!analyticsOpen)}
            >
              {analyticsItems.map((item) => (
                <NavItem
                  key={item.title}
                  item={item}
                  isActive={currentPath === item.url}
                  isSubItem={true}
                />
              ))}
            </CollapsibleSection>
          )}

          {/* Agent Mode Navigation */}
          {isConversational && (
            <div className="space-y-2">
              {agentNavItems.map((item) => (
                <NavItem
                  key={item.title}
                  item={item}
                  isActive={currentPath === item.url}
                />
              ))}
            </div>
          )}

          {/* LinkedIn Sales Workflow Sections - Work Mode Only */}
          {!isConversational && (
            <>
              {/* Prospecting Workflow */}
              <CollapsibleSection
                title="Lead Generation"
                icon={Search}
                description="Find and capture LinkedIn prospects"
                isOpen={prospectingOpen}
                onToggle={() => setProspectingOpen(!prospectingOpen)}
              >
                {prospectingItems.map((item) => (
                  <NavItem
                    key={item.title}
                    item={item}
                    isActive={currentPath === item.url}
                    isSubItem={true}
                  />
                ))}
              </CollapsibleSection>

              {/* Outreach Workflow */}
              <CollapsibleSection
                title="Outreach & Automation"
                icon={Send}
                description="Automated LinkedIn campaigns"
                isOpen={outreachOpen}
                onToggle={() => setOutreachOpen(!outreachOpen)}
              >
                {outreachItems.map((item) => (
                  <NavItem
                    key={item.title}
                    item={item}
                    isActive={currentPath === item.url}
                    isSubItem={true}
                  />
                ))}
              </CollapsibleSection>

              {/* Engagement & Follow-up */}
              <CollapsibleSection
                title="Engagement & Follow-up"
                icon={MessageCircle}
                description="Manage conversations and replies"
                isOpen={engagementOpen}
                onToggle={() => setEngagementOpen(!engagementOpen)}
              >
                {engagementItems.map((item) => (
                  <NavItem
                    key={item.title}
                    item={item}
                    isActive={currentPath === item.url}
                    isSubItem={true}
                  />
                ))}
              </CollapsibleSection>

              {/* Team Collaboration - Conditional */}
              {isTeamMember && (
                <CollapsibleSection
                  title="Team Collaboration"
                  icon={Users}
                  description="Shared workspace features"
                  isOpen={teamOpen}
                  onToggle={() => setTeamOpen(!teamOpen)}
                >
                  {teamItems.map((item) => (
                    <NavItem
                      key={item.title}
                      item={item}
                      isActive={currentPath === item.url}
                      isSubItem={true}
                    />
                  ))}
                </CollapsibleSection>
              )}
            </>
          )}

          {/* Agent Mode specific sections */}
          {isConversational && (
            <>
              {/* Your Documents Section */}
              <CollapsibleSection
                title="Your Documents"
                icon={Folder}
                description="AI training materials"
                isOpen={documentsOpen}
                onToggle={() => setDocumentsOpen(!documentsOpen)}
              >
                {agentDocumentItems.map((item) => (
                  <NavItem
                    key={item.title}
                    item={item}
                    isActive={currentPath === item.url}
                    isSubItem={true}
                  />
                ))}
              </CollapsibleSection>

              {/* AI Assistant Features */}
              <Separator className="my-4" />
              <div className="space-y-2">
                <div className={cn(
                  "flex items-center gap-2 px-4 py-2 text-sm font-semibold",
                  "text-gray-300"
                )}>
                  <Bot className="h-4 w-4" />
                  <span>AI Features</span>
                </div>
                <NavItem
                  item={{ title: "Agent Settings", url: "/agent-settings", icon: Settings, description: "Configure AI behavior" }}
                  isActive={currentPath === "/agent-settings"}
                />
              </div>
            </>
          )}
        </main>
        
        {/* Footer - Admin Section */}
        {!isConversational && (
          <footer className="border-t border-gray-200/10 p-4 space-y-1" role="contentinfo">
            <h3 className={cn(
              "text-xs font-medium px-4 py-2",
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
          </footer>
        )}
      </div>
    </nav>
  );
}