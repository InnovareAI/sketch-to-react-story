import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building2, 
  Plus, 
  Users, 
  Settings, 
  Shield, 
  AlertCircle,
  Check,
  X,
  Edit,
  Trash2,
  Mail,
  Phone,
  Globe,
  Calendar,
  DollarSign,
  Activity,
  UserPlus,
  Key,
  Copy,
  ExternalLink,
  Search,
  Filter,
  Download,
  ChevronRight,
  MoreVertical,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { generateUUID } from '@/lib/workspace';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  email: string;
  phone?: string;
  plan: 'free' | 'starter' | 'pro' | 'enterprise';
  status: 'active' | 'suspended' | 'trial' | 'pending';
  created_at: string;
  owner_email: string;
  owner_name: string;
  user_count: number;
  campaign_count: number;
  contact_count: number;
  monthly_quota: number;
  quota_used: number;
  billing_email?: string;
  next_billing_date?: string;
  trial_ends_at?: string;
}

export default function TenantManagement() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPlan, setFilterPlan] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  
  // Create tenant form state
  const [newTenant, setNewTenant] = useState({
    name: '',
    email: '',
    owner_name: '',
    owner_email: '',
    phone: '',
    domain: '',
    plan: 'trial' as const,
    trial_days: 14,
    monthly_quota: 3000,
    send_welcome_email: true,
    create_demo_data: false
  });

  // Check if user is super admin
  useEffect(() => {
    const checkSuperAdmin = () => {
      // Check if user is from InnovareAI workspace
      const isInnovareAdmin = user?.workspace_id === 'a0000000-0000-0000-0000-000000000000' && 
                             user?.role === 'admin' || user?.role === 'owner';
      
      if (!isInnovareAdmin) {
        toast.error('Access denied. Super admin privileges required.');
        navigate('/');
      }
    };
    
    checkSuperAdmin();
  }, [user, navigate]);

  // Load tenants
  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    setLoading(true);
    try {
      // Load from localStorage for now (in production, this would be from database)
      const storedTenants = JSON.parse(localStorage.getItem('super_admin_tenants') || '[]');
      
      // Add some sample data if empty
      if (storedTenants.length === 0) {
        const sampleTenants: Tenant[] = [
          {
            id: generateUUID(),
            name: 'Acme Corporation',
            slug: 'acme-corp',
            domain: 'acme.com',
            email: 'admin@acme.com',
            phone: '+1-555-0100',
            plan: 'pro',
            status: 'active',
            created_at: new Date('2024-01-15').toISOString(),
            owner_email: 'john@acme.com',
            owner_name: 'John Smith',
            user_count: 25,
            campaign_count: 12,
            contact_count: 5420,
            monthly_quota: 10000,
            quota_used: 3200,
            billing_email: 'billing@acme.com',
            next_billing_date: '2024-02-15'
          },
          {
            id: generateUUID(),
            name: 'Beta Startup',
            slug: 'beta-startup',
            email: 'hello@betastartup.io',
            plan: 'starter',
            status: 'trial',
            created_at: new Date('2024-01-20').toISOString(),
            owner_email: 'sarah@betastartup.io',
            owner_name: 'Sarah Johnson',
            user_count: 3,
            campaign_count: 2,
            contact_count: 150,
            monthly_quota: 3000,
            quota_used: 150,
            trial_ends_at: new Date('2024-02-03').toISOString()
          }
        ];
        localStorage.setItem('super_admin_tenants', JSON.stringify(sampleTenants));
        setTenants(sampleTenants);
      } else {
        setTenants(storedTenants);
      }
    } catch (error) {
      console.error('Error loading tenants:', error);
      toast.error('Failed to load tenants');
    } finally {
      setLoading(false);
    }
  };

  const createTenant = async () => {
    if (!newTenant.name || !newTenant.owner_email || !newTenant.owner_name) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      // Generate IDs and credentials
      const tenantId = generateUUID();
      const workspaceId = generateUUID();
      const adminUserId = generateUUID();
      const apiKey = `sk_${generateUUID().replace(/-/g, '')}`;
      const tempPassword = generateUUID().slice(0, 8) + '!Aa1';
      
      // Create tenant object
      const tenant: Tenant = {
        id: tenantId,
        name: newTenant.name,
        slug: newTenant.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        domain: newTenant.domain,
        email: newTenant.email || newTenant.owner_email,
        phone: newTenant.phone,
        plan: newTenant.plan === 'trial' ? 'starter' : newTenant.plan,
        status: newTenant.plan === 'trial' ? 'trial' : 'active',
        created_at: new Date().toISOString(),
        owner_email: newTenant.owner_email,
        owner_name: newTenant.owner_name,
        user_count: 1,
        campaign_count: 0,
        contact_count: 0,
        monthly_quota: newTenant.monthly_quota,
        quota_used: 0,
        billing_email: newTenant.email,
        trial_ends_at: newTenant.plan === 'trial' 
          ? new Date(Date.now() + newTenant.trial_days * 24 * 60 * 60 * 1000).toISOString()
          : undefined
      };
      
      // Store tenant
      const existingTenants = JSON.parse(localStorage.getItem('super_admin_tenants') || '[]');
      existingTenants.push(tenant);
      localStorage.setItem('super_admin_tenants', JSON.stringify(existingTenants));
      
      // Store workspace credentials
      const workspaceCredentials = {
        tenant_id: tenantId,
        workspace_id: workspaceId,
        admin_user_id: adminUserId,
        api_key: apiKey,
        temp_password: tempPassword,
        login_url: `${window.location.origin}/login`,
        setup_url: `${window.location.origin}/setup/${apiKey}`
      };
      
      const existingCredentials = JSON.parse(localStorage.getItem('tenant_credentials') || '[]');
      existingCredentials.push(workspaceCredentials);
      localStorage.setItem('tenant_credentials', JSON.stringify(existingCredentials));
      
      // Copy setup info to clipboard
      const setupInfo = `
Welcome to SAM AI!

Your workspace has been created successfully.

Organization: ${tenant.name}
Admin Email: ${newTenant.owner_email}
Temporary Password: ${tempPassword}

Setup URL: ${workspaceCredentials.setup_url}
API Key: ${apiKey}

Please save these credentials securely.
      `.trim();
      
      navigator.clipboard.writeText(setupInfo);
      
      // Show success message
      toast.success(
        <div>
          <p className="font-semibold">Tenant created successfully!</p>
          <p className="text-sm mt-1">Setup credentials copied to clipboard</p>
        </div>
      );
      
      // Reset form and refresh
      setNewTenant({
        name: '',
        email: '',
        owner_name: '',
        owner_email: '',
        phone: '',
        domain: '',
        plan: 'trial',
        trial_days: 14,
        monthly_quota: 3000,
        send_welcome_email: true,
        create_demo_data: false
      });
      setShowCreateDialog(false);
      await loadTenants();
      
    } catch (error) {
      console.error('Error creating tenant:', error);
      toast.error('Failed to create tenant');
    }
  };

  const updateTenantStatus = async (tenantId: string, newStatus: string) => {
    try {
      const tenants = JSON.parse(localStorage.getItem('super_admin_tenants') || '[]');
      const tenantIndex = tenants.findIndex((t: Tenant) => t.id === tenantId);
      
      if (tenantIndex !== -1) {
        tenants[tenantIndex].status = newStatus;
        localStorage.setItem('super_admin_tenants', JSON.stringify(tenants));
        await loadTenants();
        toast.success(`Tenant ${newStatus === 'active' ? 'activated' : 'suspended'} successfully`);
      }
    } catch (error) {
      console.error('Error updating tenant status:', error);
      toast.error('Failed to update tenant status');
    }
  };

  const deleteTenant = async (tenantId: string) => {
    if (!confirm('Are you sure you want to delete this tenant? This action cannot be undone.')) {
      return;
    }
    
    try {
      const tenants = JSON.parse(localStorage.getItem('super_admin_tenants') || '[]');
      const filteredTenants = tenants.filter((t: Tenant) => t.id !== tenantId);
      localStorage.setItem('super_admin_tenants', JSON.stringify(filteredTenants));
      await loadTenants();
      toast.success('Tenant deleted successfully');
    } catch (error) {
      console.error('Error deleting tenant:', error);
      toast.error('Failed to delete tenant');
    }
  };

  // Filter tenants
  const filteredTenants = tenants.filter(tenant => {
    const matchesSearch = tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          tenant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          tenant.owner_email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || tenant.status === filterStatus;
    const matchesPlan = filterPlan === 'all' || tenant.plan === filterPlan;
    
    return matchesSearch && matchesStatus && matchesPlan;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'trial': return 'bg-blue-100 text-blue-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'enterprise': return 'bg-purple-100 text-purple-800';
      case 'pro': return 'bg-indigo-100 text-indigo-800';
      case 'starter': return 'bg-blue-100 text-blue-800';
      case 'free': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Tenant Management
          </h1>
          <p className="text-gray-600 mt-1">Manage workspaces and tenant accounts</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Tenant
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tenants.length}</div>
            <p className="text-xs text-muted-foreground">
              {tenants.filter(t => t.status === 'active').length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tenants.reduce((sum, t) => sum + t.user_count, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all tenants
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tenants.reduce((sum, t) => sum + t.campaign_count, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total campaigns
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(tenants.filter(t => t.status === 'active' && t.plan !== 'free')
                .length * 299).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Monthly recurring
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search tenants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="trial">Trial</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterPlan} onValueChange={setFilterPlan}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Plans</SelectItem>
            <SelectItem value="free">Free</SelectItem>
            <SelectItem value="starter">Starter</SelectItem>
            <SelectItem value="pro">Pro</SelectItem>
            <SelectItem value="enterprise">Enterprise</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon">
          <Download className="h-4 w-4" />
        </Button>
      </div>

      {/* Tenants Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenant</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTenants.map((tenant) => (
                <TableRow key={tenant.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{tenant.name}</div>
                      <div className="text-sm text-gray-500">{tenant.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="text-sm">{tenant.owner_name}</div>
                      <div className="text-xs text-gray-500">{tenant.owner_email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getPlanColor(tenant.plan)}>
                      {tenant.plan}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(tenant.status)}>
                      {tenant.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{tenant.user_count}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {tenant.quota_used.toLocaleString()} / {tenant.monthly_quota.toLocaleString()}
                    </div>
                    <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                      <div 
                        className="bg-primary h-2 rounded-full"
                        style={{ width: `${(tenant.quota_used / tenant.monthly_quota) * 100}%` }}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {new Date(tenant.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                          setSelectedTenant(tenant);
                          setShowDetailsDialog(true);
                        }}>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Tenant
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Key className="h-4 w-4 mr-2" />
                          Reset Password
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {tenant.status === 'active' ? (
                          <DropdownMenuItem 
                            onClick={() => updateTenantStatus(tenant.id, 'suspended')}
                            className="text-orange-600"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Suspend Tenant
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem 
                            onClick={() => updateTenantStatus(tenant.id, 'active')}
                            className="text-green-600"
                          >
                            <Check className="h-4 w-4 mr-2" />
                            Activate Tenant
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem 
                          onClick={() => deleteTenant(tenant.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Tenant
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Tenant Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Tenant</DialogTitle>
            <DialogDescription>
              Set up a new workspace and admin account
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tenant-name">Organization Name *</Label>
                <Input
                  id="tenant-name"
                  value={newTenant.name}
                  onChange={(e) => setNewTenant({...newTenant, name: e.target.value})}
                  placeholder="Acme Corporation"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tenant-domain">Domain</Label>
                <Input
                  id="tenant-domain"
                  value={newTenant.domain}
                  onChange={(e) => setNewTenant({...newTenant, domain: e.target.value})}
                  placeholder="acme.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="owner-name">Admin Name *</Label>
                <Input
                  id="owner-name"
                  value={newTenant.owner_name}
                  onChange={(e) => setNewTenant({...newTenant, owner_name: e.target.value})}
                  placeholder="John Smith"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="owner-email">Admin Email *</Label>
                <Input
                  id="owner-email"
                  type="email"
                  value={newTenant.owner_email}
                  onChange={(e) => setNewTenant({...newTenant, owner_email: e.target.value})}
                  placeholder="admin@example.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tenant-email">Billing Email</Label>
                <Input
                  id="tenant-email"
                  type="email"
                  value={newTenant.email}
                  onChange={(e) => setNewTenant({...newTenant, email: e.target.value})}
                  placeholder="billing@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tenant-phone">Phone</Label>
                <Input
                  id="tenant-phone"
                  value={newTenant.phone}
                  onChange={(e) => setNewTenant({...newTenant, phone: e.target.value})}
                  placeholder="+1-555-0100"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tenant-plan">Plan</Label>
                <Select 
                  value={newTenant.plan} 
                  onValueChange={(value: any) => setNewTenant({...newTenant, plan: value})}
                >
                  <SelectTrigger id="tenant-plan">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trial">14-Day Trial</SelectItem>
                    <SelectItem value="starter">Starter ($99/mo)</SelectItem>
                    <SelectItem value="pro">Pro ($299/mo)</SelectItem>
                    <SelectItem value="enterprise">Enterprise (Custom)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="monthly-quota">Monthly Contact Quota</Label>
                <Input
                  id="monthly-quota"
                  type="number"
                  value={newTenant.monthly_quota}
                  onChange={(e) => setNewTenant({...newTenant, monthly_quota: parseInt(e.target.value) || 3000})}
                />
              </div>
            </div>

            {newTenant.plan === 'trial' && (
              <div className="space-y-2">
                <Label htmlFor="trial-days">Trial Duration (days)</Label>
                <Input
                  id="trial-days"
                  type="number"
                  value={newTenant.trial_days}
                  onChange={(e) => setNewTenant({...newTenant, trial_days: parseInt(e.target.value) || 14})}
                />
              </div>
            )}

            <div className="space-y-3 border rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between">
                <Label htmlFor="send-welcome" className="text-sm font-medium">
                  Send welcome email
                </Label>
                <Switch
                  id="send-welcome"
                  checked={newTenant.send_welcome_email}
                  onCheckedChange={(checked) => setNewTenant({...newTenant, send_welcome_email: checked})}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="create-demo" className="text-sm font-medium">
                  Create demo data
                </Label>
                <Switch
                  id="create-demo"
                  checked={newTenant.create_demo_data}
                  onCheckedChange={(checked) => setNewTenant({...newTenant, create_demo_data: checked})}
                />
              </div>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                A temporary password will be generated and sent to the admin email. 
                The admin will need to set their own password on first login.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={createTenant}>
              <UserPlus className="h-4 w-4 mr-2" />
              Create Tenant
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tenant Details Dialog */}
      {selectedTenant && (
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedTenant.name}</DialogTitle>
              <DialogDescription>
                Tenant ID: {selectedTenant.id}
              </DialogDescription>
            </DialogHeader>
            
            <Tabs defaultValue="overview" className="mt-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="usage">Usage</TabsTrigger>
                <TabsTrigger value="billing">Billing</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-gray-500">Status</Label>
                    <div className="mt-1">
                      <Badge className={getStatusColor(selectedTenant.status)}>
                        {selectedTenant.status}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Plan</Label>
                    <div className="mt-1">
                      <Badge className={getPlanColor(selectedTenant.plan)}>
                        {selectedTenant.plan}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Owner</Label>
                    <div className="mt-1 text-sm">
                      {selectedTenant.owner_name}
                      <div className="text-xs text-gray-500">{selectedTenant.owner_email}</div>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Created</Label>
                    <div className="mt-1 text-sm">
                      {new Date(selectedTenant.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="usage" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-gray-500">Users</Label>
                    <div className="mt-1 text-2xl font-bold">{selectedTenant.user_count}</div>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Campaigns</Label>
                    <div className="mt-1 text-2xl font-bold">{selectedTenant.campaign_count}</div>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Contacts</Label>
                    <div className="mt-1 text-2xl font-bold">{selectedTenant.contact_count.toLocaleString()}</div>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Quota Used</Label>
                    <div className="mt-1">
                      <div className="text-sm font-medium">
                        {selectedTenant.quota_used.toLocaleString()} / {selectedTenant.monthly_quota.toLocaleString()}
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div 
                          className="bg-primary h-2 rounded-full"
                          style={{ width: `${(selectedTenant.quota_used / selectedTenant.monthly_quota) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="billing" className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm text-gray-500">Billing Email</Label>
                    <div className="mt-1 text-sm">{selectedTenant.billing_email || selectedTenant.email}</div>
                  </div>
                  {selectedTenant.next_billing_date && (
                    <div>
                      <Label className="text-sm text-gray-500">Next Billing Date</Label>
                      <div className="mt-1 text-sm">
                        {new Date(selectedTenant.next_billing_date).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                  {selectedTenant.trial_ends_at && (
                    <div>
                      <Label className="text-sm text-gray-500">Trial Ends</Label>
                      <div className="mt-1 text-sm">
                        {new Date(selectedTenant.trial_ends_at).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}