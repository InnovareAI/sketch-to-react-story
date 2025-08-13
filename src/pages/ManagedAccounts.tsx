import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Users, 
  UserPlus, 
  Settings, 
  Mail, 
  Target,
  Activity,
  MoreHorizontal,
  Shield,
  Eye,
  Edit,
  Trash2,
  Play,
  Pause,
  RefreshCw,
  Linkedin,
  MessageSquare,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface TeamMember {
  id: string;
  email: string;
  full_name: string;
  role: string;
  avatar_url?: string;
  linkedin_connected: boolean;
  campaigns_count: number;
  active_campaigns: number;
  total_sent: number;
  total_responses: number;
  is_managed?: boolean;
  managed_by?: string;
  last_activity?: string;
}

export default function ManagedAccounts() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [managingAs, setManagingAs] = useState<TeamMember | null>(null);
  const navigate = useNavigate();

  // New member form state
  const [newMember, setNewMember] = useState({
    email: '',
    full_name: '',
    role: 'member',
    linkedin_url: ''
  });

  useEffect(() => {
    loadTeamMembers();
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const userProfile = JSON.parse(localStorage.getItem('user_auth_profile') || '{}');
      setCurrentUser({
        ...user,
        ...userProfile
      });
    }
  };

  const loadTeamMembers = async () => {
    try {
      setLoading(true);
      
      // Get current workspace
      const workspaceId = localStorage.getItem('current_workspace_id') || 
                         JSON.parse(localStorage.getItem('user_auth_profile') || '{}').workspace_id;
      
      if (!workspaceId) {
        toast.error('No workspace selected');
        return;
      }

      // Load all team members in the workspace
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Load campaign stats for each member
      const membersWithStats = await Promise.all((profiles || []).map(async (profile) => {
        // Get campaign counts
        const { count: totalCampaigns } = await supabase
          .from('campaigns')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', profile.id);

        const { count: activeCampaigns } = await supabase
          .from('campaigns')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', profile.id)
          .eq('status', 'active');

        // Get message stats
        const { data: messages } = await supabase
          .from('messages')
          .select('id, replied_at')
          .eq('workspace_id', workspaceId);

        const totalSent = messages?.length || 0;
        const totalResponses = messages?.filter(m => m.replied_at).length || 0;

        // Check LinkedIn connection
        const linkedInAccounts = JSON.parse(localStorage.getItem(`linkedin_accounts_${profile.id}`) || '[]');
        const linkedin_connected = linkedInAccounts.length > 0;

        return {
          id: profile.id,
          email: profile.email,
          full_name: profile.full_name || profile.email.split('@')[0],
          role: profile.role,
          avatar_url: profile.avatar_url,
          linkedin_connected,
          campaigns_count: totalCampaigns || 0,
          active_campaigns: activeCampaigns || 0,
          total_sent: totalSent,
          total_responses: totalResponses,
          is_managed: profile.settings?.is_managed || false,
          managed_by: profile.settings?.managed_by,
          last_activity: profile.updated_at
        };
      }));

      setTeamMembers(membersWithStats);
    } catch (error) {
      console.error('Error loading team members:', error);
      toast.error('Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  const addTeamMember = async () => {
    try {
      const workspaceId = localStorage.getItem('current_workspace_id');
      if (!workspaceId) {
        toast.error('No workspace selected');
        return;
      }

      // Create a placeholder user ID (in production, you'd invite them via email)
      const placeholderId = crypto.randomUUID();

      // Add team member to profiles
      const { error } = await supabase
        .from('profiles')
        .insert({
          id: placeholderId,
          workspace_id: workspaceId,
          email: newMember.email,
          full_name: newMember.full_name,
          role: newMember.role,
          settings: {
            is_managed: true,
            managed_by: currentUser?.id,
            linkedin_url: newMember.linkedin_url,
            added_at: new Date().toISOString()
          }
        });

      if (error) throw error;

      toast.success(`Added ${newMember.full_name} to team`);
      setShowAddMemberModal(false);
      setNewMember({ email: '', full_name: '', role: 'member', linkedin_url: '' });
      loadTeamMembers();
    } catch (error: any) {
      console.error('Error adding team member:', error);
      if (error.code === '23505') {
        toast.error('This email is already in the workspace');
      } else {
        toast.error('Failed to add team member');
      }
    }
  };

  const manageAsUser = (member: TeamMember) => {
    // Store the member we're managing as in localStorage
    localStorage.setItem('managing_as_user', JSON.stringify({
      id: member.id,
      email: member.email,
      full_name: member.full_name
    }));
    
    setManagingAs(member);
    toast.success(`Now managing campaigns for ${member.full_name}`);
    
    // Navigate to campaigns page with context
    navigate('/campaigns', { 
      state: { managingFor: member }
    });
  };

  const stopManaging = () => {
    localStorage.removeItem('managing_as_user');
    setManagingAs(null);
    toast.info('Switched back to your own account');
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-purple-100 text-purple-800';
      case 'admin': return 'bg-blue-100 text-blue-800';
      case 'member': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (member: TeamMember) => {
    if (member.active_campaigns > 0) {
      return <Activity className="h-4 w-4 text-green-500" />;
    } else if (member.linkedin_connected) {
      return <CheckCircle className="h-4 w-4 text-blue-500" />;
    } else {
      return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  return (
    <div className="flex-1 bg-gray-50">
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
              <p className="text-gray-600 mt-1">Manage campaigns for your team members</p>
              {managingAs && (
                <div className="mt-2 flex items-center gap-2">
                  <Badge className="bg-blue-100 text-blue-800">
                    <Shield className="h-3 w-3 mr-1" />
                    Managing as: {managingAs.full_name}
                  </Badge>
                  <Button variant="ghost" size="sm" onClick={stopManaging}>
                    <XCircle className="h-4 w-4 mr-1" />
                    Stop Managing
                  </Button>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={loadTeamMembers}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={() => setShowAddMemberModal(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Team Member
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Team Members</p>
                    <p className="text-2xl font-bold">{teamMembers.length}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active Campaigns</p>
                    <p className="text-2xl font-bold">
                      {teamMembers.reduce((sum, m) => sum + m.active_campaigns, 0)}
                    </p>
                  </div>
                  <Target className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Messages</p>
                    <p className="text-2xl font-bold">
                      {teamMembers.reduce((sum, m) => sum + m.total_sent, 0)}
                    </p>
                  </div>
                  <MessageSquare className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Responses</p>
                    <p className="text-2xl font-bold">
                      {teamMembers.reduce((sum, m) => sum + m.total_responses, 0)}
                    </p>
                  </div>
                  <Mail className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Team Members Table */}
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>
                Click "Manage" to run campaigns on behalf of team members
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>LinkedIn</TableHead>
                    <TableHead>Campaigns</TableHead>
                    <TableHead>Messages</TableHead>
                    <TableHead>Response Rate</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={member.avatar_url} />
                            <AvatarFallback>
                              {member.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{member.full_name}</p>
                            <p className="text-sm text-gray-500">{member.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getRoleBadgeColor(member.role)}>
                          {member.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {member.linkedin_connected ? (
                          <Badge className="bg-green-100 text-green-800">
                            <Linkedin className="h-3 w-3 mr-1" />
                            Connected
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            Not Connected
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{member.campaigns_count}</span>
                          <span className="text-xs text-gray-500">
                            {member.active_campaigns} active
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{member.total_sent}</span>
                          <span className="text-xs text-gray-500">sent</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {member.total_sent > 0 
                              ? `${Math.round((member.total_responses / member.total_sent) * 100)}%`
                              : '0%'}
                          </span>
                          <span className="text-xs text-gray-500">
                            ({member.total_responses} replies)
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusIcon(member)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={() => manageAsUser(member)}
                              className="font-medium"
                            >
                              <Shield className="h-4 w-4 mr-2" />
                              Manage Campaigns
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              navigate('/campaigns', { 
                                state: { viewOnly: true, forUser: member }
                              });
                            }}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Campaigns
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Settings className="h-4 w-4 mr-2" />
                              Settings
                            </DropdownMenuItem>
                            {currentUser?.role === 'owner' && (
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Remove
                              </DropdownMenuItem>
                            )}
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
      </main>

      {/* Add Team Member Modal */}
      <Dialog open={showAddMemberModal} onOpenChange={setShowAddMemberModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>
              Add a team member whose campaigns you'll manage
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="team.member@company.com"
                value={newMember.email}
                onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={newMember.full_name}
                onChange={(e) => setNewMember({ ...newMember, full_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="linkedin">LinkedIn URL (Optional)</Label>
              <Input
                id="linkedin"
                placeholder="https://linkedin.com/in/johndoe"
                value={newMember.linkedin_url}
                onChange={(e) => setNewMember({ ...newMember, linkedin_url: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={newMember.role}
                onValueChange={(value) => setNewMember({ ...newMember, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddMemberModal(false)}>
              Cancel
            </Button>
            <Button onClick={addTeamMember}>
              Add Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}