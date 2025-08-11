/**
 * Workspace Layout Component
 * Main layout wrapper for authenticated workspace users
 */

import { useState, useEffect } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
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
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  workspace_id: string;
  workspace_name: string;
  workspace_plan: string;
}

export default function WorkspaceLayout() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    // Check for development auth bypass first
    const userAuthUser = localStorage.getItem('user_auth_user');
    const userAuthProfile = localStorage.getItem('user_auth_profile');

    if (userAuthUser && userAuthProfile) {
      console.log('Using development auth bypass for workspace layout');
      const authUser = JSON.parse(userAuthUser);
      const profile = JSON.parse(userAuthProfile);
      console.log('Dev auth user:', authUser);
      console.log('Dev auth profile:', profile);
      
      const userProfile: UserProfile = {
        id: authUser.id,
        email: authUser.email,
        full_name: profile.full_name,
        role: profile.role,
        workspace_id: profile.workspace_id,
        workspace_name: profile.workspace_name,
        workspace_plan: profile.workspace_plan
      };
      
      setUser(userProfile);
      setLoading(false);
      return;
    }

    // Normal Supabase Auth flow
    const { data: { user: authUser }, error } = await supabase.auth.getUser();
    
    if (error || !authUser) {
      navigate('/login');
      return;
    }

    // Get user profile and workspace info
    const { data: userRecord, error: userError } = await supabase
      .from('users')
      .select(`
        id,
        email,
        name,
        role,
        tenant_id,
        status,
        tenants:tenant_id (
          id,
          name,
          plan
        )
      `)
      .eq('id', authUser.id)
      .single();

    if (userError || !userRecord) {
      toast.error('Failed to load user profile');
      navigate('/login');
      return;
    }

    // Check if user is super admin (shouldn't be here)
    if (userRecord.role === 'owner') {
      navigate('/admin/dashboard');
      return;
    }

    const userProfile: UserProfile = {
      id: userRecord.id,
      email: userRecord.email,
      full_name: userRecord.name ? 
        (userRecord.name.length > 2 ? 
          userRecord.name.charAt(0).toUpperCase() + userRecord.name.slice(1) : 
          userRecord.name.toUpperCase()
        ) : 
        userRecord.email.split('@')[0].toUpperCase(),
      role: userRecord.role,
      workspace_id: userRecord.tenant_id,
      workspace_name: userRecord.tenants?.name || 'Unknown Workspace',
      workspace_plan: userRecord.tenants?.plan || 'free'
    };

    setUser(userProfile);
    setLoading(false);
  };

  const handleSignOut = async () => {
    // Clear development auth state
    localStorage.removeItem('user_auth_user');
    localStorage.removeItem('user_auth_profile');
    
    // Sign out from Supabase (if applicable)
    await supabase.auth.signOut();
    
    navigate('/login');
    toast.success('Signed out successfully');
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading workspace...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p>Failed to load workspace</p>
          <Button onClick={() => navigate('/login')} className="mt-4">
            Return to Login
          </Button>
        </div>
      </div>
    );
  }

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
                {/* Debug info in development */}
                {process.env.NODE_ENV === 'development' && (
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      localStorage.removeItem('user_auth_user');
                      localStorage.removeItem('user_auth_profile');
                      window.location.reload();
                    }}
                    size="sm"
                    className="text-xs px-2"
                    title="Clear cached auth data"
                  >
                    Clear Auth
                  </Button>
                )}
                
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