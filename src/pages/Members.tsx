import { useState, useEffect } from "react";
import { WorkspaceHeader } from "@/components/workspace/WorkspaceHeader";
import { WorkspaceSidebar } from "@/components/workspace/WorkspaceSidebar";
import { ConversationalInterface } from "@/components/workspace/ConversationalInterface";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import InviteModal from "@/components/workspace/InviteModal";
import { 
  Users, 
  Search, 
  Plus, 
  Mail, 
  Phone, 
  Calendar,
  MoreHorizontal,
  Edit,
  Trash2,
  Shield,
  CheckCircle,
  XCircle,
  Settings,
  UserPlus
} from "lucide-react";
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

export default function Members() {
  const [isConversational, setIsConversational] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [currentWorkspace, setCurrentWorkspace] = useState<any>(null);
  
  useEffect(() => {
    // Get current workspace info
    const userProfile = localStorage.getItem('user_auth_profile');
    if (userProfile) {
      const profile = JSON.parse(userProfile);
      setCurrentWorkspace({
        id: profile.workspace_id,
        name: profile.workspace_name || 'My Workspace'
      });
    }
  }, []);

  if (isConversational) {
    return (
      <SidebarProvider open={true} onOpenChange={() => {}}>
        <div className="min-h-screen flex w-full">
          <WorkspaceSidebar isConversational={isConversational} />
          <div className="flex-1 flex flex-col overflow-hidden">
            <WorkspaceHeader 
              isConversational={isConversational}
              onToggleMode={setIsConversational}
            />
            <div className="flex-1 overflow-auto">
              <ConversationalInterface />
            </div>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  const members = [
    {
      id: 1,
      name: "Jennifer Fleming",
      email: "jennifer@company.com",
      role: "Admin",
      department: "Operations",
      status: "Active",
      lastActive: "2 hours ago",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b829?w=400&h=400&fit=crop&crop=face",
      joinDate: "2024-01-15",
      campaigns: 12,
      permissions: ["Full Access"]
    },
    {
      id: 2,
      name: "David Chen",
      email: "david@company.com", 
      role: "Manager",
      department: "Sales",
      status: "Active",
      lastActive: "1 day ago",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face",
      joinDate: "2024-02-01",
      campaigns: 8,
      permissions: ["Campaigns", "Contacts"]
    },
    {
      id: 3,
      name: "Sarah Johnson",
      email: "sarah@company.com",
      role: "Member", 
      department: "Marketing",
      status: "Inactive",
      lastActive: "1 week ago",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face",
      joinDate: "2024-01-20",
      campaigns: 5,
      permissions: ["View Only"]
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active": return "bg-green-100 text-green-800";
      case "Inactive": return "bg-gray-100 text-gray-800"; 
      case "Pending": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "Admin": return "bg-red-100 text-red-800";
      case "Manager": return "bg-blue-100 text-blue-800";
      case "Member": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <SidebarProvider open={true} onOpenChange={() => {}}>
      <div className="min-h-screen flex w-full bg-gray-50">
        <WorkspaceSidebar isConversational={isConversational} />
        <div className="flex-1 flex flex-col">
          <WorkspaceHeader isConversational={isConversational} onToggleMode={setIsConversational} />
          <main className="flex-1 p-8">
            <div className="max-w-7xl mx-auto">
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Members</h1>
          <p className="text-gray-600 mt-1">Manage team members and their permissions</p>
        </div>
        <Button 
          className="bg-primary hover:bg-primary/90"
          onClick={() => setShowInviteModal(true)}
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Invite Member
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <select className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
            <option>All Roles</option>
            <option>Admin</option>
            <option>Manager</option>
            <option>Member</option>
          </select>
          <select className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
            <option>All Status</option>
            <option>Active</option>
            <option>Inactive</option>
            <option>Pending</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            More Filters
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Members</CardTitle>
            <Users className="h-4 w-4 text-premium-purple" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">12</div>
            <p className="text-xs text-green-600 mt-1">+2 this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Members</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">8</div>
            <p className="text-xs text-gray-600 mt-1">67% active rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Admins</CardTitle>
            <Shield className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">3</div>
            <p className="text-xs text-gray-600 mt-1">25% admin ratio</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pending Invites</CardTitle>
            <Mail className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">2</div>
            <p className="text-xs text-gray-600 mt-1">Awaiting response</p>
          </CardContent>
        </Card>
      </div>

      {/* Members Table */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>Manage member access and permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead>Campaigns</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={member.avatar} alt={member.name} />
                        <AvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{member.name}</div>
                        <div className="text-sm text-gray-600">{member.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getRoleColor(member.role)}>
                      {member.role}
                    </Badge>
                  </TableCell>
                  <TableCell>{member.department}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(member.status)}>
                      {member.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">{member.lastActive}</TableCell>
                  <TableCell>{member.campaigns}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Member
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Settings className="h-4 w-4 mr-2" />
                          Permissions
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove Member
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
      </div>
            </div>
          </main>
        </div>
      </div>
      
      {/* Invite Modal */}
      {currentWorkspace && (
        <InviteModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          workspaceId={currentWorkspace.id}
          workspaceName={currentWorkspace.name}
        />
      )}
    </SidebarProvider>
  );
}