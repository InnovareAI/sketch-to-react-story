/**
 * Workspace Layout Component
 * Main layout wrapper for authenticated workspace users
 */

import { useState, useEffect } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SidebarProvider } from '@/components/ui/sidebar';
import { WorkspaceSidebar } from '@/components/workspace/WorkspaceSidebar';
import { 
  LogOut,
  User,
  Crown,
  UserCheck,
  Building2,
  Bell
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
    switch (role) {
      case 'workspace_manager':
        return <Badge className="bg-blue-100 text-blue-800"><Crown className="h-3 w-3 mr-1" />Admin</Badge>;
      case 'admin':
        return <Badge className="bg-purple-100 text-purple-800"><Crown className="h-3 w-3 mr-1" />Admin</Badge>;
      case 'user':
        return <Badge className="bg-green-100 text-green-800"><User className="h-3 w-3 mr-1" />User</Badge>;
      case 'co_worker':
        return <Badge className="bg-orange-100 text-orange-800"><UserCheck className="h-3 w-3 mr-1" />Co-Worker</Badge>;
      default:
        return <Badge variant="secondary">{role.replace('_', ' ')}</Badge>;
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
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen w-full">
        {/* Sidebar */}
        <WorkspaceSidebar isConversational={isConversational} />
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Top Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Building2 className="h-5 w-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-900">{user.workspace_name}</span>
                <Badge variant="outline" className="text-xs">{user.workspace_plan}</Badge>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                  <div className="text-xs text-gray-500">{user.email}</div>
                </div>
                {getRoleBadge(user.role)}
                
                <Button variant="ghost" onClick={handleSignOut} size="sm">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-hidden">
            <Outlet />
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}