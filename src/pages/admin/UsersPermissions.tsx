import { useState, useEffect } from "react";
import { WorkspaceHeader } from "@/components/workspace/WorkspaceHeader";
import { WorkspaceSidebar } from "@/components/workspace/WorkspaceSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Users,
  UserPlus,
  Shield,
  Mail,
  MoreHorizontal,
  Edit,
  Trash2,
  Key,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  Download,
  RefreshCw,
  UserCheck,
  UserX,
  Send,
  Copy,
  Settings
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { UserInviteModal } from "@/components/admin/UserInviteModal";

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  department: string;
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
  last_login: string;
  avatar_url?: string;
}

interface Invite {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  status: 'pending' | 'accepted' | 'expired';
  created_at: string;
  expires_at: string;
}

export default function UsersPermissions() {
  const { toast } = useToast();
  const [isConversational, setIsConversational] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [workspaceId] = useState("default-workspace"); // Get from context
  const [workspaceName] = useState("Acme Corporation"); // Get from context

  useEffect(() => {
    loadUsers();
    loadInvites();
  }, []);

  const loadUsers = async () => {
    try {
      // Mock data for now - replace with actual Supabase query
      const mockUsers: User[] = [
        {
          id: "1",
          email: "john.doe@acme.com",
          first_name: "John",
          last_name: "Doe",
          role: "admin",
          department: "Engineering",
          status: "active",
          created_at: "2024-01-15T10:00:00Z",
          last_login: "2024-01-30T14:30:00Z",
          avatar_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop"
        },
        {
          id: "2",
          email: "jane.smith@acme.com",
          first_name: "Jane",
          last_name: "Smith",
          role: "manager",
          department: "Sales",
          status: "active",
          created_at: "2024-01-20T10:00:00Z",
          last_login: "2024-01-30T09:15:00Z",
          avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop"
        },
        {
          id: "3",
          email: "bob.wilson@acme.com",
          first_name: "Bob",
          last_name: "Wilson",
          role: "member",
          department: "Marketing",
          status: "active",
          created_at: "2024-01-25T10:00:00Z",
          last_login: "2024-01-29T16:45:00Z"
        },
        {
          id: "4",
          email: "alice.johnson@acme.com",
          first_name: "Alice",
          last_name: "Johnson",
          role: "viewer",
          department: "Support",
          status: "inactive",
          created_at: "2024-01-10T10:00:00Z",
          last_login: "2024-01-20T11:00:00Z"
        }
      ];
      setUsers(mockUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadInvites = async () => {
    try {
      // Mock data for now
      const mockInvites: Invite[] = [
        {
          id: "inv1",
          email: "new.user@example.com",
          first_name: "New",
          last_name: "User",
          role: "member",
          status: "pending",
          created_at: "2024-01-28T10:00:00Z",
          expires_at: "2024-02-04T10:00:00Z"
        },
        {
          id: "inv2",
          email: "pending@example.com",
          first_name: "Pending",
          last_name: "Invite",
          role: "viewer",
          status: "pending",
          created_at: "2024-01-29T10:00:00Z",
          expires_at: "2024-02-05T10:00:00Z"
        }
      ];
      setInvites(mockInvites);
    } catch (error) {
      console.error('Error loading invites:', error);
    }
  };

  const handleResendInvite = async (invite: Invite) => {
    toast({
      title: "Invite Resent",
      description: `Invitation resent to ${invite.email}`,
    });
  };

  const handleCancelInvite = async (inviteId: string) => {
    setInvites(prev => prev.filter(inv => inv.id !== inviteId));
    toast({
      title: "Invite Cancelled",
      description: "The invitation has been cancelled",
    });
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setShowDeleteConfirm(true);
  };

  const handleSuspendUser = async (userId: string) => {
    setUsers(prev => prev.map(u => 
      u.id === userId ? { ...u, status: 'suspended' as const } : u
    ));
    toast({
      title: "User Suspended",
      description: "The user account has been suspended",
    });
  };

  const handleReactivateUser = async (userId: string) => {
    setUsers(prev => prev.map(u => 
      u.id === userId ? { ...u, status: 'active' as const } : u
    ));
    toast({
      title: "User Reactivated",
      description: "The user account has been reactivated",
    });
  };

  const confirmDeleteUser = async () => {
    if (selectedUser) {
      setUsers(prev => prev.filter(u => u.id !== selectedUser.id));
      toast({
        title: "User Deleted",
        description: `${selectedUser.email} has been removed`,
      });
      setShowDeleteConfirm(false);
      setSelectedUser(null);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'manager': return 'default';
      case 'member': return 'secondary';
      case 'viewer': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'inactive': return 'secondary';
      case 'suspended': return 'destructive';
      case 'pending': return 'outline';
      default: return 'outline';
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <SidebarProvider open={true} onOpenChange={() => {}}>
      <div className="min-h-screen flex w-full bg-gray-50">
        <WorkspaceSidebar isConversational={isConversational} />
        <div className="flex-1 flex flex-col">
          <WorkspaceHeader isConversational={isConversational} onToggleMode={setIsConversational} />
          <main className="flex-1 p-8">
            <div className="max-w-7xl mx-auto">
              {/* Header */}
              <div className="mb-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Shield className="h-8 w-8 text-primary" />
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900">Users & Permissions</h1>
                      <p className="text-gray-600">Manage team members and their access levels</p>
                    </div>
                  </div>
                  <Button onClick={() => setShowInviteModal(true)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Invite User
                  </Button>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{users.length}</div>
                    <p className="text-xs text-muted-foreground">
                      {users.filter(u => u.status === 'active').length} active
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Admins</CardTitle>
                    <Shield className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{users.filter(u => u.role === 'admin').length}</div>
                    <p className="text-xs text-muted-foreground">Full access</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending Invites</CardTitle>
                    <Mail className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{invites.filter(i => i.status === 'pending').length}</div>
                    <p className="text-xs text-muted-foreground">Awaiting acceptance</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Last Activity</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">2h</div>
                    <p className="text-xs text-muted-foreground">ago</p>
                  </CardContent>
                </Card>
              </div>

              {/* Tabs */}
              <Tabs defaultValue="users" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="users">Active Users</TabsTrigger>
                  <TabsTrigger value="invites">Pending Invites</TabsTrigger>
                  <TabsTrigger value="roles">Role Management</TabsTrigger>
                </TabsList>

                {/* Users Tab */}
                <TabsContent value="users" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Team Members</CardTitle>
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Search users..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="pl-8 w-[200px]"
                            />
                          </div>
                          <Select value={roleFilter} onValueChange={setRoleFilter}>
                            <SelectTrigger className="w-[130px]">
                              <SelectValue placeholder="Filter by role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Roles</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="manager">Manager</SelectItem>
                              <SelectItem value="member">Member</SelectItem>
                              <SelectItem value="viewer">Viewer</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button variant="outline" size="icon">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Department</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Last Login</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredUsers.map((user) => (
                            <TableRow key={user.id}>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={user.avatar_url} />
                                    <AvatarFallback>
                                      {user.first_name[0]}{user.last_name[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="font-medium">{user.first_name} {user.last_name}</div>
                                    <div className="text-sm text-muted-foreground">{user.email}</div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant={getRoleBadgeColor(user.role)}>
                                  {user.role}
                                </Badge>
                              </TableCell>
                              <TableCell>{user.department}</TableCell>
                              <TableCell>
                                <Badge variant={getStatusBadgeColor(user.status)}>
                                  {user.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {new Date(user.last_login).toLocaleDateString()}
                              </TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuItem onClick={() => handleEditUser(user)}>
                                      <Edit className="h-4 w-4 mr-2" />
                                      Edit User
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <Key className="h-4 w-4 mr-2" />
                                      Reset Password
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    {user.status === 'active' ? (
                                      <DropdownMenuItem onClick={() => handleSuspendUser(user.id)}>
                                        <UserX className="h-4 w-4 mr-2" />
                                        Suspend User
                                      </DropdownMenuItem>
                                    ) : (
                                      <DropdownMenuItem onClick={() => handleReactivateUser(user.id)}>
                                        <UserCheck className="h-4 w-4 mr-2" />
                                        Reactivate User
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem 
                                      onClick={() => handleDeleteUser(user)}
                                      className="text-destructive"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete User
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
                </TabsContent>

                {/* Invites Tab */}
                <TabsContent value="invites" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Pending Invitations</CardTitle>
                      <CardDescription>
                        Manage pending user invitations
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {invites.length === 0 ? (
                        <div className="text-center py-8">
                          <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">No pending invitations</p>
                        </div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Email</TableHead>
                              <TableHead>Name</TableHead>
                              <TableHead>Role</TableHead>
                              <TableHead>Sent</TableHead>
                              <TableHead>Expires</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {invites.map((invite) => (
                              <TableRow key={invite.id}>
                                <TableCell>{invite.email}</TableCell>
                                <TableCell>{invite.first_name} {invite.last_name}</TableCell>
                                <TableCell>
                                  <Badge variant={getRoleBadgeColor(invite.role)}>
                                    {invite.role}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {new Date(invite.created_at).toLocaleDateString()}
                                </TableCell>
                                <TableCell>
                                  {new Date(invite.expires_at).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleResendInvite(invite)}
                                    >
                                      <RefreshCw className="h-3 w-3 mr-1" />
                                      Resend
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleCancelInvite(invite.id)}
                                    >
                                      <XCircle className="h-3 w-3 mr-1" />
                                      Cancel
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Roles Tab */}
                <TabsContent value="roles" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Role Permissions</CardTitle>
                      <CardDescription>
                        Configure permissions for each role
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {['Admin', 'Manager', 'Member', 'Viewer'].map((role) => (
                          <div key={role} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <h3 className="font-semibold">{role}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {role === 'Admin' && 'Full system access'}
                                  {role === 'Manager' && 'Manage campaigns and accounts'}
                                  {role === 'Member' && 'Create and edit campaigns'}
                                  {role === 'Viewer' && 'View-only access'}
                                </p>
                              </div>
                              <Button variant="outline" size="sm">
                                <Settings className="h-4 w-4 mr-2" />
                                Configure
                              </Button>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              {role === 'Admin' && (
                                <>
                                  <Badge variant="default">All Permissions</Badge>
                                </>
                              )}
                              {role === 'Manager' && (
                                <>
                                  <Badge>Manage Campaigns</Badge>
                                  <Badge>Manage Accounts</Badge>
                                  <Badge>View Analytics</Badge>
                                </>
                              )}
                              {role === 'Member' && (
                                <>
                                  <Badge>Create Campaigns</Badge>
                                  <Badge>View Accounts</Badge>
                                  <Badge>View Analytics</Badge>
                                </>
                              )}
                              {role === 'Viewer' && (
                                <>
                                  <Badge variant="secondary">View Campaigns</Badge>
                                  <Badge variant="secondary">View Analytics</Badge>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </div>
      </div>

      {/* Invite Modal */}
      <UserInviteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        workspaceId={workspaceId}
        workspaceName={workspaceName}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedUser?.email}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteUser}>
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}