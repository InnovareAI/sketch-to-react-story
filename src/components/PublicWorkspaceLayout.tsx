/**
 * Public Workspace Layout Component
 * Layout wrapper for public pages that need sidebar navigation without authentication
 */

import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { WorkspaceSidebar } from '@/components/workspace/WorkspaceSidebar';
import { 
  LogOut,
  User,
  Crown,
  UserCheck,
  Building2,
  Bell,
  Linkedin,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface PublicWorkspaceLayoutProps {
  children: React.ReactNode;
}

export default function PublicWorkspaceLayout({ children }: PublicWorkspaceLayoutProps) {
  const location = useLocation();

  // Mock user data for public layout
  const user = {
    id: 'demo-user',
    email: 'demo@sameaisalesassistant.com',
    full_name: 'Demo User',
    role: 'admin',
    workspace_id: 'demo-workspace',
    workspace_name: 'SAM AI Demo',
    workspace_plan: 'premium',
    status: 'active'
  };

  const handleSignOut = () => {
    toast.success('Demo session ended');
  };

  // Determine if we're in agent/conversational mode
  const isConversational = location.pathname.startsWith('/agent');

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Sidebar */}
      <WorkspaceSidebar 
        isConversational={isConversational} 
        workspaceName={user.workspace_name}
      />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full">
        {/* Enhanced Top Header */}
        <div className={cn(
          "border-b px-6 py-4 flex items-center justify-between shrink-0 backdrop-blur-sm",
          isConversational 
            ? "bg-gray-900/95 border-gray-700/50" 
            : "bg-white/95 border-gray-200 shadow-sm"
        )}>
          <div className="flex items-center space-x-6">
            {/* Breadcrumb-style workspace info */}
            <div className="flex items-center space-x-3">
              <div className={cn(
                "p-2 rounded-xl",
                isConversational 
                  ? "bg-premium-purple/20 text-premium-purple" 
                  : "bg-primary/10 text-primary"
              )}>
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "font-semibold text-base",
                    isConversational ? "text-white" : "text-gray-900"
                  )}>
                    {user.workspace_name}
                  </span>
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "text-xs px-2 py-1 border",
                      user.workspace_plan === 'premium'
                        ? "border-premium-purple/30 text-premium-purple bg-premium-purple/5"
                        : "border-gray-300 text-gray-600"
                    )}
                  >
                    {user.workspace_plan.charAt(0).toUpperCase() + user.workspace_plan.slice(1)}
                  </Badge>
                </div>
                <p className={cn(
                  "text-sm flex items-center gap-1",
                  isConversational ? "text-gray-300" : "text-gray-600"
                )}>
                  <Building2 className="h-3 w-3" />
                  SAM - Sales AI Agent
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Enhanced notification bell */}
            <Button 
              variant="ghost" 
              size="sm" 
              className={cn(
                "relative p-2 rounded-xl",
                isConversational
                  ? "text-gray-300 hover:text-white hover:bg-gray-800"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              )}
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              {/* Notification indicator */}
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-premium-orange rounded-full border-2 border-white" />
            </Button>
            
            {/* User profile section */}
            <div className="flex items-center space-x-4">
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  onClick={handleSignOut} 
                  size="sm"
                  className={cn(
                    "px-3 py-2 rounded-xl transition-all",
                    isConversational
                      ? "text-gray-300 hover:text-white hover:bg-red-900/20 hover:border-red-500/50"
                      : "text-gray-600 hover:text-red-600 hover:bg-red-50 hover:border-red-200"
                  )}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Demo Mode
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  );
}