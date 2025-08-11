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
  Loader2
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
  const [newWorkspace, setNewWorkspace] = useState({
    name: '',
    plan: 'free'
  });
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
      const { data: tenantsData } = await supabase
        .from('tenants')
        .select(`
          id,
          name,
          plan as subscription_tier,
          status as subscription_status,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (tenantsData) {
        // Transform to match workspace interface
        const workspacesData = tenantsData.map(tenant => ({
          ...tenant,
          slug: tenant.name.toLowerCase().replace(/[^a-z0-9]/g, '-')
        }));
        
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
      const { data: usersData } = await supabase
        .from('users')
        .select(`
          id,
          email,
          name,
          role,
          tenant_id,
          created_at,
          tenants!inner(name)
        `)
        .order('created_at', { ascending: false });

      if (usersData) {
        setUsers(usersData.map(user => ({
          ...user,
          full_name: user.name,
          workspace_id: user.tenant_id,
          workspace: { 
            name: user.tenants.name, 
            slug: user.tenants.name.toLowerCase().replace(/[^a-z0-9]/g, '-')
          },
          last_sign_in_at: '' // Would need auth.users join for this
        })));
        
        setStats(prev => ({
          ...prev,
          totalUsers: usersData.length
        }));
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    }
  };

  const handleSignOut = async () => {
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

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'owner':
        return <Badge className="bg-red-100 text-red-800">Super Admin</Badge>;
      case 'admin':
        return <Badge className="bg-purple-100 text-purple-800">Admin</Badge>;
      case 'member':
        return <Badge className="bg-green-100 text-green-800">Member</Badge>;
      default:
        return <Badge variant="secondary">{role}</Badge>;
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
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-1" />
                          View
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