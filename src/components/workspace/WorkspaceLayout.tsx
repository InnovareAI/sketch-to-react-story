/**
 * Workspace Layout Component
 * Main layout wrapper for authenticated workspace users
 */

import { Outlet, useLocation, useNavigate } from 'react-router-dom';
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
  Linkedin
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

export default function WorkspaceLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  // Mock user data
  const user = {
    full_name: 'TL InnovareAI',
    workspace_name: 'InnovareAI',
    workspace_plan: 'pro',
    role: 'admin'
  };

  const handleSignOut = async () => {
    toast.success('Signed out successfully');
    navigate('/login');
  };

  const getRoleBadge = (role: string) => {
    const badgeClass = isConversational 
      ? "border text-white backdrop-blur-sm"
      : "border shadow-sm";
    
    switch (role) {
      case 'workspace_manager':
        return (
          <Badge className={cn(
            badgeClass,
            "bg-premium-blue/10 text-premium-blue border-premium-blue/30"
          )}>
            <Crown className="h-3 w-3 mr-1" />
            Admin
          </Badge>
        );
      case 'admin':
        return (
          <Badge className={cn(
            badgeClass,
            "bg-premium-purple/10 text-premium-purple border-premium-purple/30"
          )}>
            <Crown className="h-3 w-3 mr-1" />
            Admin
          </Badge>
        );
      case 'user':
        return (
          <Badge className={cn(
            badgeClass,
            "bg-premium-green/10 text-premium-green border-premium-green/30"
          )}>
            <User className="h-3 w-3 mr-1" />
            User
          </Badge>
        );
      case 'co_worker':
        return (
          <Badge className={cn(
            badgeClass,
            "bg-premium-orange/10 text-premium-orange border-premium-orange/30"
          )}>
            <UserCheck className="h-3 w-3 mr-1" />
            Co-Worker
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className={badgeClass}>
            {role.replace('_', ' ')}
          </Badge>
        );
    }
  };

  // Determine if we're in agent/conversational mode
  const isConversational = location.pathname.startsWith('/agent');

  return (
    <div className="flex h-screen w-full">
      {/* Sidebar */}
      <WorkspaceSidebar 
        isConversational={isConversational} 
        workspaceName={user.workspace_name}
      />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0">
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
                  <Linkedin className="h-3 w-3" />
                  LinkedIn Automation Platform
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
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Workspace Overview Banner */}
        <div className={cn(
          "px-6 py-3 border-b",
          isConversational 
            ? "bg-gray-800/50 border-gray-700/50" 
            : "bg-blue-50 border-blue-200"
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "text-sm font-medium",
                isConversational ? "text-white" : "text-blue-900"
              )}>
                Welcome back, {user.full_name}
              </div>
              <Badge 
                variant="outline" 
                className={cn(
                  "text-xs px-2 py-1",
                  isConversational 
                    ? "border-gray-600 text-gray-300 bg-gray-800/50" 
                    : "border-blue-300 text-blue-700 bg-blue-100/50"
                )}
              >
                {user.role.replace('_', ' ').charAt(0).toUpperCase() + user.role.replace('_', ' ').slice(1)}
              </Badge>
            </div>
            <div className={cn(
              "text-xs",
              isConversational ? "text-gray-400" : "text-blue-600"
            )}>
              {user.workspace_name} • {user.workspace_plan.charAt(0).toUpperCase() + user.workspace_plan.slice(1)} Plan
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          <Outlet />
        </div>
      </div>
    </div>
  );
}