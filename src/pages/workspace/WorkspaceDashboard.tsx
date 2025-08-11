/**
 * Workspace Dashboard for Regular Users
 * Role-based interface for workspace members
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Building2, 
  Activity, 
  Settings, 
  LogOut,
  RefreshCw,
  UserPlus,
  Crown,
  User,
  UserCheck
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
  created_at: string;
}

interface WorkspaceUser {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  created_at: string;
}

export default function WorkspaceDashboard() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [workspaceUsers, setWorkspaceUsers] = useState<WorkspaceUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    pendingInvites: 0,
    currentUserRole: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    // Check for development auth bypass first
    const userAuthUser = localStorage.getItem('user_auth_user');
    const userAuthProfile = localStorage.getItem('user_auth_profile');

    if (userAuthUser && userAuthProfile) {
      console.log('Using development auth bypass for workspace dashboard');
      const authUser = JSON.parse(userAuthUser);
      const profile = JSON.parse(userAuthProfile);
      
      const userProfile: UserProfile = {
        id: authUser.id,
        email: authUser.email,
        full_name: profile.full_name,
        role: profile.role,
        workspace_id: profile.workspace_id,
        workspace_name: profile.workspace_name,
        workspace_plan: profile.workspace_plan,
        created_at: new Date().toISOString()
      };
      
      setUser(userProfile);
      await loadWorkspaceData(userProfile);
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
        created_at,
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
      full_name: userRecord.name || userRecord.email.split('@')[0],
      role: userRecord.role,
      workspace_id: userRecord.tenant_id,
      workspace_name: userRecord.tenants?.name || 'Unknown Workspace',
      workspace_plan: userRecord.tenants?.plan || 'free',
      created_at: userRecord.created_at
    };

    setUser(userProfile);
    await loadWorkspaceData(userProfile);
    setLoading(false);
  };

  const loadWorkspaceData = async (userProfile: UserProfile) => {
    try {
      // Load workspace users (visibility based on role)
      let usersQuery = supabase
        .from('users')
        .select('id, email, name, role, status, created_at')
        .eq('tenant_id', userProfile.workspace_id);

      // Role-based filtering
      if (userProfile.role === 'user') {
        // Users can only see themselves
        usersQuery = usersQuery.eq('id', userProfile.id);
      } else if (userProfile.role === 'co_worker') {
        // Co-workers can see other co-workers and users (simplified for now)
        usersQuery = usersQuery.in('role', ['user', 'co_worker']);
      }
      // workspace_manager and admin can see all users (no additional filtering)

      const { data: usersData, error: usersError } = await usersQuery
        .order('created_at', { ascending: false });
      
      if (usersError) {
        console.error('Error loading workspace users:', usersError);
      } else if (usersData) {
        setWorkspaceUsers(usersData);
        
        // Calculate stats
        const activeUsers = usersData.filter(u => u.status === 'active').length;
        const pendingInvites = usersData.filter(u => u.status === 'invited').length;
        
        setStats({
          totalUsers: usersData.length,
          activeUsers,
          pendingInvites,
          currentUserRole: userProfile.role
        });
      }
    } catch (error: any) {
      console.error('Error loading workspace data:', error);
      toast.error(`Failed to load workspace data: ${error.message || 'Unknown error'}`);
    }
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
        return <Badge className="bg-blue-100 text-blue-800"><Crown className="h-3 w-3 mr-1" />Workspace Admin</Badge>;
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'invited':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const canManageUsers = user?.role === 'workspace_manager' || user?.role === 'admin';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p>Loading workspace...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p>Failed to load user profile</p>
          <Button onClick={() => navigate('/login')} className="mt-4">
            Return to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{user.workspace_name}</h1>
                <p className="text-sm text-gray-500">SAM AI Workspace • {user.workspace_plan} plan</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <span className="text-sm font-medium text-gray-900">{user.full_name}</span>
                <div className="flex items-center justify-end mt-1">
                  {getRoleBadge(user.role)}
                </div>
              </div>
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Workspace Users</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Activity className="h-8 w-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Active Users</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <UserPlus className="h-8 w-8 text-orange-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Pending Invites</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pendingInvites}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Building2 className="h-8 w-8 text-purple-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Your Role</p>
                  <p className="text-lg font-bold text-gray-900 capitalize">{user.role.replace('_', ' ')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            {canManageUsers && <TabsTrigger value="users">Users</TabsTrigger>}
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Welcome to SAM AI</CardTitle>
                  <CardDescription>
                    Your LinkedIn automation and sales intelligence platform
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900">Quick Actions</h4>
                      <div className="mt-2 space-y-2">
                        <Button className="w-full justify-start" disabled>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Start LinkedIn Campaign
                        </Button>
                        <Button variant="outline" className="w-full justify-start" disabled>
                          <Activity className="h-4 w-4 mr-2" />
                          View Analytics
                        </Button>
                        <Button variant="outline" className="w-full justify-start" disabled>
                          <Settings className="h-4 w-4 mr-2" />
                          Manage Integrations
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Features coming soon - workspace functionality is being developed
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Your Workspace Info</CardTitle>
                  <CardDescription>Current workspace details</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500">Workspace</span>
                      <span className="text-sm text-gray-900">{user.workspace_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500">Plan</span>
                      <Badge variant="secondary">{user.workspace_plan}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500">Your Role</span>
                      {getRoleBadge(user.role)}
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500">Member Since</span>
                      <span className="text-sm text-gray-900">
                        {new Date(user.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Users Tab (Only visible to workspace managers and admins) */}
          {canManageUsers && (
            <TabsContent value="users">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Workspace Users</CardTitle>
                      <CardDescription>Manage users in your workspace</CardDescription>
                    </div>
                    <Button onClick={() => window.location.reload()}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {workspaceUsers.map((workspaceUser) => (
                      <div key={workspaceUser.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h3 className="font-semibold">{workspaceUser.name || workspaceUser.email}</h3>
                          <p className="text-sm text-gray-500">{workspaceUser.email}</p>
                          <p className="text-xs text-gray-400">
                            Joined: {new Date(workspaceUser.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-3">
                          {getStatusBadge(workspaceUser.status)}
                          {getRoleBadge(workspaceUser.role)}
                        </div>
                      </div>
                    ))}
                    {workspaceUsers.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        No users visible with your current permissions
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>Manage your account preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Profile Information</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Name:</span>
                        <p className="font-medium">{user.full_name}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Email:</span>
                        <p className="font-medium">{user.email}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Role Permissions</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center mb-2">
                        {getRoleBadge(user.role)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {user.role === 'workspace_manager' && 
                          'You can see and manage all workspace accounts and users.'
                        }
                        {user.role === 'admin' && 
                          'You have administrative access to workspace features.'
                        }
                        {user.role === 'user' && 
                          'You can manage and see only your own accounts.'
                        }
                        {user.role === 'co_worker' && 
                          'You can see co-workers\' accounts based on invitation rights.'
                        }
                      </div>
                    </div>
                  </div>

                  <div>
                    <Button variant="outline" disabled>
                      <Settings className="h-4 w-4 mr-2" />
                      Edit Profile (Coming Soon)
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}