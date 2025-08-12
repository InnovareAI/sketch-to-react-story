import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, 
  Shield, 
  Settings, 
  UserPlus, 
  Mail, 
  MoreHorizontal,
  Edit,
  Trash2,
  Crown,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Building2,
  Key,
  Bell,
  FileText,
  Globe,
  Lock
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function TeamSettings() {
  const [selectedUser, setSelectedUser] = useState(null);

  // Empty team members array - will be populated from database
  const teamMembers: any[] = [];

  const roleDefinitions = [
    {
      role: "workspace_manager",
      name: "Workspace Manager",
      description: "Full access to all features and settings",
      permissions: ["Manage team", "Access all campaigns", "Workspace settings", "Billing", "Integrations"],
      color: "bg-purple-100 text-purple-800"
    },
    {
      role: "user",
      name: "User", 
      description: "Access to campaigns and contacts with limited settings",
      permissions: ["Create campaigns", "Manage contacts", "Use templates", "View analytics"],
      color: "bg-blue-100 text-blue-800"
    },
    {
      role: "co_worker",
      name: "Co-worker",
      description: "Limited access to specific features only",
      permissions: ["View contacts", "Use templates", "View assigned campaigns"],
      color: "bg-green-100 text-green-800"
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "inactive":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "inactive":
        return <Badge className="bg-red-100 text-red-800">Inactive</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "workspace_manager":
        return <Crown className="h-4 w-4 text-purple-600" />;
      case "user":
        return <Users className="h-4 w-4 text-blue-600" />;
      case "co_worker":
        return <Shield className="h-4 w-4 text-green-600" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  return (
    <div className="flex-1 bg-gray-50">
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Team Settings</h1>
              <p className="text-gray-600 mt-1">Manage team members, roles, and permissions</p>
            </div>
            <div className="flex gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Invite Member
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Invite Team Member</DialogTitle>
                    <DialogDescription>
                      Send an invitation to add a new member to your workspace
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="invite-email">Email Address</Label>
                      <Input id="invite-email" type="email" placeholder="colleague@company.com" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="invite-role">Role</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="co_worker">Co-worker</SelectItem>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="workspace_manager">Workspace Manager</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline">Cancel</Button>
                      <Button>Send Invitation</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Team Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Members</CardTitle>
                <Users className="h-8 w-8 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{teamMembers.length}</div>
                <p className="text-xs text-gray-600 mt-1">Active workspace members</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Active</CardTitle>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {teamMembers.filter(m => m.status === "active").length}
                </div>
                <p className="text-xs text-green-600 mt-1">Currently online members</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Pending</CardTitle>
                <Clock className="h-8 w-8 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {teamMembers.filter(m => m.status === "pending").length}
                </div>
                <p className="text-xs text-yellow-600 mt-1">Awaiting acceptance</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Managers</CardTitle>
                <Crown className="h-8 w-8 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {teamMembers.filter(m => m.role === "workspace_manager").length}
                </div>
                <p className="text-xs text-gray-600 mt-1">Workspace managers</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="members" className="w-full">
            <TabsList>
              <TabsTrigger value="members">Team Members</TabsTrigger>
              <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
              <TabsTrigger value="security">Security Settings</TabsTrigger>
            </TabsList>

            {/* Team Members Tab */}
            <TabsContent value="members" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Team Members</CardTitle>
                  <CardDescription>Manage your workspace team members and their access</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {teamMembers.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={member.avatar} alt={member.name} />
                            <AvatarFallback className="bg-blue-100 text-blue-600">
                              {member.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-lg text-gray-900">{member.name}</h3>
                              {getRoleIcon(member.role)}
                              <Badge className={roleDefinitions.find(r => r.role === member.role)?.color}>
                                {member.roleLabel}
                              </Badge>
                            </div>
                            <p className="text-gray-600">{member.email}</p>
                            <div className="flex items-center gap-4 mt-1">
                              <div className="flex items-center gap-1">
                                {getStatusIcon(member.status)}
                                {getStatusBadge(member.status)}
                              </div>
                              <span className="text-xs text-gray-500">Last login: {member.lastLogin}</span>
                              <span className="text-xs text-gray-500">Joined: {member.joinedDate}</span>
                            </div>
                          </div>
                        </div>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Role
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Mail className="h-4 w-4 mr-2" />
                              Resend Invite
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove Member
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Roles & Permissions Tab */}
            <TabsContent value="roles" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {roleDefinitions.map((role) => (
                  <Card key={role.role}>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        {getRoleIcon(role.role)}
                        <CardTitle className="text-lg">{role.name}</CardTitle>
                      </div>
                      <CardDescription>{role.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium text-gray-900">Permissions</h4>
                        <div className="space-y-2">
                          {role.permissions.map((permission, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <CheckCircle className="h-3 w-3 text-green-600" />
                              <span className="text-sm text-gray-700">{permission}</span>
                            </div>
                          ))}
                        </div>
                        <div className="pt-3">
                          <span className="text-xs text-gray-500">
                            {teamMembers.filter(m => m.role === role.role).length} members with this role
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Security Settings Tab */}
            <TabsContent value="security" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    Workspace Security
                  </CardTitle>
                  <CardDescription>Configure security settings for your team workspace</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base">Require Two-Factor Authentication</Label>
                        <p className="text-sm text-gray-600">Enforce 2FA for all team members</p>
                      </div>
                      <Switch />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base">Login Notifications</Label>
                        <p className="text-sm text-gray-600">Email notifications for new logins</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base">Session Timeout</Label>
                        <p className="text-sm text-gray-600">Auto-logout after inactivity</p>
                      </div>
                      <Select>
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Select timeout" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="30m">30 minutes</SelectItem>
                          <SelectItem value="1h">1 hour</SelectItem>
                          <SelectItem value="4h">4 hours</SelectItem>
                          <SelectItem value="8h">8 hours</SelectItem>
                          <SelectItem value="never">Never</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base">IP Restrictions</Label>
                        <p className="text-sm text-gray-600">Limit access to specific IP addresses</p>
                      </div>
                      <Button variant="outline" size="sm">Configure</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    API Access
                  </CardTitle>
                  <CardDescription>Manage API keys and integrations access</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">API Access Enabled</Label>
                      <p className="text-sm text-gray-600">Allow team members to use API keys</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Webhook Notifications</Label>
                      <p className="text-sm text-gray-600">Send security events to external systems</p>
                    </div>
                    <Button variant="outline" size="sm">Configure</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}