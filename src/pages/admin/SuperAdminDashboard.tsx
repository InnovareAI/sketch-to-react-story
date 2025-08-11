/**
 * Super Admin Dashboard
 * Management interface for InnovareAI administrators
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Shield, 
  Users, 
  Building2, 
  Activity, 
  Settings, 
  LogOut,
  Plus,
  Eye,
  Trash2,
  RefreshCw,
  AlertCircle,
  Loader2,
  UserPlus,
  Mail
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Workspace {
  id: string;
  name: string;
  slug: string;
  subscription_tier: string;
  subscription_status: string;
  created_at: string;
  user_count?: number;
}

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  workspace_id: string;
  workspace?: { name: string; slug: string };
  created_at: string;
  last_sign_in_at: string;
}

export default function SuperAdminDashboard() {
  const [user, setUser] = useState<any>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [createWorkspaceOpen, setCreateWorkspaceOpen] = useState(false);
  const [createWorkspaceLoading, setCreateWorkspaceLoading] = useState(false);
  const [inviteUserOpen, setInviteUserOpen] = useState(false);
  const [inviteUserLoading, setInviteUserLoading] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
  const [newWorkspace, setNewWorkspace] = useState({
    name: '',
    plan: 'free'
  });
  const [inviteUserData, setInviteUserData] = useState({
    email: '',
    role: 'user'
  });
  const [deleteWorkspaceOpen, setDeleteWorkspaceOpen] = useState(false);
  const [deleteWorkspaceLoading, setDeleteWorkspaceLoading] = useState(false);
  const [workspaceToDelete, setWorkspaceToDelete] = useState<Workspace | null>(null);
  const [stats, setStats] = useState({
    totalWorkspaces: 0,
    totalUsers: 0,
    activeSubscriptions: 0,
    thisMonthSignups: 0
  });
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    // Check for development auth bypass first
    const devAuthUser = localStorage.getItem('dev_auth_user');
    const devAuthProfile = localStorage.getItem('dev_auth_profile');

    if (devAuthUser && devAuthProfile) {
      console.log('Using development auth bypass for dashboard');
      const user = JSON.parse(devAuthUser);
      const profile = JSON.parse(devAuthProfile);
      
      setUser({ ...user, profile });
      await loadDashboardData();
      setLoading(false);
      return;
    }

    // Normal Supabase Auth flow
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      navigate('/admin/login');
      return;
    }

    // Verify super admin role
    const { data: userRecord } = await supabase
      .from('users')
      .select('role, name, tenant_id')
      .eq('id', user.id)
      .single();

    if (!userRecord || userRecord.role !== 'owner') {
      await supabase.auth.signOut();
      navigate('/admin/login');
      return;
    }

    // Get user profile for display name
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('first_name, last_name')
      .eq('id', user.id)
      .single();

    const profile = {
      role: userRecord.role,
      workspace_id: userRecord.tenant_id,
      full_name: userProfile ? `${userProfile.first_name} ${userProfile.last_name}`.trim() : userRecord.name || 'Administrator'
    };

    setUser({ ...user, profile });
    await loadDashboardData();
    setLoading(false);
  };

  const loadDashboardData = async () => {
    try {
      // Load tenants (workspaces)
      console.log('Loading tenants data...');
      const { data: tenantsData, error: tenantsError } = await supabase
        .from('tenants')
        .select(`
          id,
          name,
          plan,
          status,
          created_at
        `)
        .order('created_at', { ascending: false });
      
      console.log('Tenants query result:', { tenantsData, tenantsError });

      if (tenantsData) {
        // Transform to match workspace interface
        const workspacesData = tenantsData.map(tenant => ({
          ...tenant,
          subscription_tier: tenant.plan,
          subscription_status: tenant.status,
          slug: tenant.name.toLowerCase().replace(/[^a-z0-9]/g, '-')
        }));
        
        console.log('Setting workspaces data:', workspacesData);
        setWorkspaces(workspacesData);
        
        // Calculate stats
        const activeSubscriptions = workspacesData.filter(w => w.subscription_status === 'active').length;
        const thisMonth = new Date();
        thisMonth.setMonth(thisMonth.getMonth() - 1);
        const thisMonthSignups = workspacesData.filter(w => new Date(w.created_at) > thisMonth).length;
        
        setStats(prev => ({
          ...prev,
          totalWorkspaces: workspacesData.length,
          activeSubscriptions,
          thisMonthSignups
        }));
      }

      // Load users
      console.log('Loading users data...');
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select(`
          id,
          email,
          name,
          role,
          tenant_id,
          created_at
        `)
        .order('created_at', { ascending: false });
      
      console.log('Users query result:', { usersData, usersError });

      if (usersData) {
        // Find tenant names for users
        const usersWithWorkspaces = usersData.map(user => {
          const userTenant = tenantsData?.find(t => t.id === user.tenant_id);
          return {
            ...user,
            full_name: user.name,
            workspace_id: user.tenant_id,
            workspace: userTenant ? { 
              name: userTenant.name, 
              slug: userTenant.name.toLowerCase().replace(/[^a-z0-9]/g, '-')
            } : { name: 'Unknown', slug: 'unknown' },
            last_sign_in_at: '' // Would need auth.users join for this
          };
        });
        
        setUsers(usersWithWorkspaces);
        
        setStats(prev => ({
          ...prev,
          totalUsers: usersData.length
        }));
      }
    } catch (error: any) {
      console.error('Error loading dashboard data:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      toast.error(`Failed to load dashboard data: ${error.message || 'Unknown error'}`);
    }
  };

  const handleSignOut = async () => {
    // Clear development auth state
    localStorage.removeItem('dev_auth_user');
    localStorage.removeItem('dev_auth_profile');
    
    // Sign out from Supabase (if applicable)
    await supabase.auth.signOut();
    
    navigate('/admin/login');
    toast.success('Signed out successfully');
  };

  const handleCreateWorkspace = async () => {
    if (!newWorkspace.name.trim()) {
      toast.error('Workspace name is required');
      return;
    }

    setCreateWorkspaceLoading(true);
    try {
      // Create new tenant (workspace)
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .insert({
          name: newWorkspace.name,
          plan: newWorkspace.plan,
          status: 'active'
        })
        .select()
        .single();

      if (tenantError) throw tenantError;

      // Create corresponding organization
      const { error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: newWorkspace.name,
          slug: newWorkspace.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          subscription_tier: newWorkspace.plan
        });

      if (orgError) {
        console.warn('Organization creation failed:', orgError);
        // Continue anyway as tenant is the primary entity
      }

      toast.success(`Workspace "${newWorkspace.name}" created successfully`);
      setCreateWorkspaceOpen(false);
      setNewWorkspace({ name: '', plan: 'free' });
      await loadDashboardData(); // Refresh the data
    } catch (error: any) {
      console.error('Error creating workspace:', error);
      toast.error(`Failed to create workspace: ${error.message}`);
    } finally {
      setCreateWorkspaceLoading(false);
    }
  };

  const handleInviteUser = async () => {
    if (!inviteUserData.email.trim() || !selectedWorkspace) {
      toast.error('Email and workspace are required');
      return;
    }

    setInviteUserLoading(true);
    try {
      // For development, we'll create a user record and show instructions
      // instead of trying to send actual invitations which require admin privileges
      
      // Generate a UUID for the new user (in a real app this would come from auth.users)
      const userId = crypto.randomUUID();
      
      // Create user record directly
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: userId,
          tenant_id: selectedWorkspace.id,
          email: inviteUserData.email,
          name: inviteUserData.email.split('@')[0].charAt(0).toUpperCase() + inviteUserData.email.split('@')[0].slice(1),
          role: inviteUserData.role,
          status: 'invited'
        });

      if (userError) {
        console.error('User record creation failed:', userError);
        throw new Error(`Failed to create user record: ${userError.message}`);
      }

      // Also create a user_profiles record for consistency
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: userId,
          email: inviteUserData.email,
          first_name: inviteUserData.email.split('@')[0],
          last_name: '',
          role: inviteUserData.role === 'workspace_manager' ? 'admin' : inviteUserData.role,
          subscription_status: 'trial'
        });

      if (profileError) {
        console.warn('User profile creation failed:', profileError);
        // Continue anyway as main user record was created
      }

      // Show success message with instructions
      toast.success(
        `User ${inviteUserData.email} added to workspace "${selectedWorkspace.name}" with role: ${inviteUserData.role}. ` +
        `Note: In development mode, no email invitation is sent.`,
        { duration: 6000 }
      );
      setInviteUserOpen(false);
      setInviteUserData({ email: '', role: 'user' });
      setSelectedWorkspace(null);
      await loadDashboardData(); // Refresh data
    } catch (error: any) {
      console.error('Error inviting user:', error);
      toast.error(`Failed to invite user: ${error.message}`);
    } finally {
      setInviteUserLoading(false);
    }
  };

  const openInviteDialog = (workspace: Workspace) => {
    setSelectedWorkspace(workspace);
    setInviteUserOpen(true);
  };

  const openDeleteDialog = (workspace: Workspace) => {
    setWorkspaceToDelete(workspace);
    setDeleteWorkspaceOpen(true);
  };

  const handleDeleteWorkspace = async () => {
    if (!workspaceToDelete) return;

    setDeleteWorkspaceLoading(true);
    try {
      // First, delete all users in this workspace
      const { error: usersError } = await supabase
        .from('users')
        .delete()
        .eq('tenant_id', workspaceToDelete.id);

      if (usersError) {
        console.warn('Error deleting users:', usersError);
        // Continue anyway as we want to delete the workspace
      }

      // Delete the organization (if it exists)
      const { error: orgError } = await supabase
        .from('organizations')
        .delete()
        .eq('name', workspaceToDelete.name);

      if (orgError) {
        console.warn('Error deleting organization:', orgError);
        // Continue anyway
      }

      // Finally, delete the tenant (workspace)
      const { error: tenantError } = await supabase
        .from('tenants')
        .delete()
        .eq('id', workspaceToDelete.id);

      if (tenantError) throw tenantError;

      toast.success(`Workspace "${workspaceToDelete.name}" deleted successfully`);
      setDeleteWorkspaceOpen(false);
      setWorkspaceToDelete(null);
      await loadDashboardData(); // Refresh data
    } catch (error: any) {
      console.error('Error deleting workspace:', error);
      toast.error(`Failed to delete workspace: ${error.message}`);
    } finally {
      setDeleteWorkspaceLoading(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'owner':
        return <Badge className="bg-red-100 text-red-800">Super Admin</Badge>;
      case 'admin':
        return <Badge className="bg-purple-100 text-purple-800">Admin</Badge>;
      case 'workspace_manager':
        return <Badge className="bg-blue-100 text-blue-800">Workspace Admin</Badge>;
      case 'user':
        return <Badge className="bg-green-100 text-green-800">User</Badge>;
      case 'co_worker':
        return <Badge className="bg-orange-100 text-orange-800">Co-Worker</Badge>;
      case 'member':
        return <Badge className="bg-gray-100 text-gray-800">Member</Badge>;
      default:
        return <Badge variant="secondary">{role.replace('_', ' ')}</Badge>;
    }
  };

  const getSubscriptionBadge = (tier: string, status: string) => {
    const color = status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
    return <Badge className={color}>{tier} ({status})</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p>Loading dashboard...</p>
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
              <Shield className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Super Admin Dashboard</h1>
                <p className="text-sm text-gray-500">InnovareAI System Management</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Welcome, {user?.profile?.full_name || user?.email}
              </span>
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
                <Building2 className="h-8 w-8 text-blue-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Workspaces</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalWorkspaces}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Activity className="h-8 w-8 text-purple-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Active Subscriptions</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeSubscriptions}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Plus className="h-8 w-8 text-orange-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">This Month</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.thisMonthSignups}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Invite User Dialog */}
        <Dialog open={inviteUserOpen} onOpenChange={setInviteUserOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Invite User to Workspace</DialogTitle>
              <DialogDescription>
                Send an invitation to join "{selectedWorkspace?.name}" workspace.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="invite-email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="invite-email"
                    type="email"
                    value={inviteUserData.email}
                    onChange={(e) => setInviteUserData({ ...inviteUserData, email: e.target.value })}
                    placeholder="user@example.com"
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="invite-role">User Role</Label>
                <Select value={inviteUserData.role} onValueChange={(value) => setInviteUserData({ ...inviteUserData, role: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="workspace_manager">
                      <div className="flex flex-col">
                        <span className="font-medium">Workspace Manager</span>
                        <span className="text-xs text-gray-500">Admin - can see and manage all workspace accounts</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="user">
                      <div className="flex flex-col">
                        <span className="font-medium">User</span>
                        <span className="text-xs text-gray-500">Can manage and see only their own accounts</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="co_worker">
                      <div className="flex flex-col">
                        <span className="font-medium">Co-Worker</span>
                        <span className="text-xs text-gray-500">Can see co-workers' accounts based on invitation rights</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="admin">
                      <div className="flex flex-col">
                        <span className="font-medium">Admin (Legacy)</span>
                        <span className="text-xs text-gray-500">Legacy admin role</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="member">
                      <div className="flex flex-col">
                        <span className="font-medium">Member (Legacy)</span>
                        <span className="text-xs text-gray-500">Legacy member role</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {selectedWorkspace && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-sm">
                    <p className="font-medium text-blue-900">Workspace: {selectedWorkspace.name}</p>
                    <p className="text-blue-700">Plan: {selectedWorkspace.subscription_tier}</p>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setInviteUserOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleInviteUser} disabled={inviteUserLoading}>
                {inviteUserLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Invitation
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Workspace Confirmation Dialog */}
        <AlertDialog open={deleteWorkspaceOpen} onOpenChange={setDeleteWorkspaceOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Workspace</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{workspaceToDelete?.name}"? This action cannot be undone.
                <br /><br />
                <strong>This will permanently delete:</strong>
                <ul className="list-disc list-inside mt-2 text-sm">
                  <li>All users in this workspace</li>
                  <li>All workspace data</li>
                  <li>All associated organizations</li>
                </ul>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteWorkspaceLoading}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteWorkspace}
                disabled={deleteWorkspaceLoading}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleteWorkspaceLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Delete Workspace
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Tabs */}
        <Tabs defaultValue="workspaces" className="space-y-6">
          <TabsList>
            <TabsTrigger value="workspaces">Workspaces</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>

          {/* Workspaces Tab */}
          <TabsContent value="workspaces">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Workspaces</CardTitle>
                    <CardDescription>Manage customer workspaces and subscriptions</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Dialog open={createWorkspaceOpen} onOpenChange={setCreateWorkspaceOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="h-4 w-4 mr-2" />
                          Create Workspace
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Create New Workspace</DialogTitle>
                          <DialogDescription>
                            Add a new workspace for a customer or team.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid gap-2">
                            <Label htmlFor="workspace-name">Workspace Name</Label>
                            <Input
                              id="workspace-name"
                              value={newWorkspace.name}
                              onChange={(e) => setNewWorkspace({ ...newWorkspace, name: e.target.value })}
                              placeholder="Enter workspace name"
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="workspace-plan">Subscription Plan</Label>
                            <Select value={newWorkspace.plan} onValueChange={(value) => setNewWorkspace({ ...newWorkspace, plan: value })}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a plan" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="free">Free</SelectItem>
                                <SelectItem value="starter">Starter</SelectItem>
                                <SelectItem value="pro">Pro</SelectItem>
                                <SelectItem value="enterprise">Enterprise</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setCreateWorkspaceOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleCreateWorkspace} disabled={createWorkspaceLoading}>
                            {createWorkspaceLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Workspace
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    <Button variant="outline" onClick={loadDashboardData}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {workspaces.map((workspace) => (
                    <div key={workspace.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-semibold">{workspace.name}</h3>
                        <p className="text-sm text-gray-500">/{workspace.slug}</p>
                        <p className="text-xs text-gray-400">Created: {new Date(workspace.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        {getSubscriptionBadge(workspace.subscription_tier, workspace.subscription_status)}
                        <Button size="sm" variant="outline" onClick={() => openInviteDialog(workspace)}>
                          <UserPlus className="h-4 w-4 mr-1" />
                          Invite User
                        </Button>
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => openDeleteDialog(workspace)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                  {workspaces.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No workspaces found
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Users</CardTitle>
                    <CardDescription>Manage system users and permissions</CardDescription>
                  </div>
                  <Button onClick={loadDashboardData}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-semibold">{user.full_name || user.email}</h3>
                        <p className="text-sm text-gray-500">{user.email}</p>
                        <p className="text-xs text-gray-400">
                          Workspace: {user.workspace?.name || 'N/A'} • Created: {new Date(user.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-3">
                        {getRoleBadge(user.role)}
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                  {users.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No users found
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Tab */}
          <TabsContent value="system">
            <Card>
              <CardHeader>
                <CardTitle>System Information</CardTitle>
                <CardDescription>System status and configuration</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium">Environment</h4>
                      <p className="text-sm text-gray-600">Production</p>
                    </div>
                    <div>
                      <h4 className="font-medium">Database</h4>
                      <p className="text-sm text-gray-600">Supabase PostgreSQL</p>
                    </div>
                    <div>
                      <h4 className="font-medium">Domain Access</h4>
                      <p className="text-sm text-gray-600">innovareai.com only</p>
                    </div>
                    <div>
                      <h4 className="font-medium">Admin Count</h4>
                      <p className="text-sm text-gray-600">{users.filter(u => u.role === 'owner').length} super admin(s)</p>
                    </div>
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