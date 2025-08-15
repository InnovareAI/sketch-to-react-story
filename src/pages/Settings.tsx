import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  User,
  Building2,
  Users,
  Shield,
  Link,
  Settings as SettingsIcon,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Download,
  Trash2,
  Bell,
  Globe,
  Clock,
  Linkedin,
  Calendar,
  MessageSquare,
  Zap,
  Key,
  Smartphone,
  AlertTriangle,
  CheckCircle,
  UserPlus,
  Save,
  RefreshCw,
  ChevronRight,
  Camera,
  Edit
} from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: string;
  workspace_id: string;
  settings?: any;
}

interface Workspace {
  id: string;
  name: string;
  slug: string;
  settings?: any;
  subscription_tier: string;
  subscription_status: string;
}

export default function Settings() {
  const navigate = useNavigate();
  const { user: authUser, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('personal');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Data states
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [linkedInAccounts, setLinkedInAccounts] = useState<any[]>([]);
  
  // Form states
  const [personalForm, setPersonalForm] = useState({
    full_name: '',
    email: '',
    avatar_url: '',
    notifications_enabled: true,
    profile_visibility: 'public',
    data_sharing: false,
    personal_timezone: 'UTC'
  });
  
  const [workspaceForm, setWorkspaceForm] = useState({
    name: '',
    company_name: '',
    website: '',
    industry: '',
    company_size: '',
    description: '',
    timezone: 'UTC',
    ai_model: 'gpt-4',
    notifications: {
      campaign_completion: true,
      new_responses: true,
      account_issues: true
    }
  });
  
  const [securityForm, setSecurityForm] = useState({
    two_factor_enabled: false,
    session_timeout: '30',
    ip_restriction_enabled: false,
    allowed_ips: '',
    login_notifications: true
  });
  
  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  
  // Modal states
  const [showDeleteAccountDialog, setShowDeleteAccountDialog] = useState(false);
  const [showInviteMemberDialog, setShowInviteMemberDialog] = useState(false);
  const [showRoleChangeDialog, setShowRoleChangeDialog] = useState(false);
  const [showWebhookDialog, setShowWebhookDialog] = useState(false);
  
  // Form states for modals
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'member' });
  const [roleChangeForm, setRoleChangeForm] = useState({ memberId: '', currentRole: '', newRole: '' });
  const [webhookForm, setWebhookForm] = useState({ url: '', description: '' });
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  
  useEffect(() => {
    loadAllData();
  }, [authUser, isAuthenticated]); // Re-run when auth state changes

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  
  // Format time in selected timezone
  const formatTimeInTimezone = (date: Date, timezone: string) => {
    try {
      const options: Intl.DateTimeFormatOptions = {
        timeZone: timezone,
        hour12: true,
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      };
      return new Intl.DateTimeFormat('en-US', options).format(date);
    } catch (error) {
      console.error('Error formatting timezone:', error);
      return date.toLocaleString();
    }
  };

  // Get timezone offset
  const getTimezoneOffset = (timezone: string) => {
    try {
      const now = new Date();
      const tzDate = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        timeZoneName: 'short'
      }).format(now);
      const match = tzDate.match(/[A-Z]{3,4}/);
      if (match) return match[0];
      
      // Calculate offset manually if abbreviation not available
      const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
      const tzDateObj = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
      const offset = (tzDateObj.getTime() - utcDate.getTime()) / (1000 * 60 * 60);
      const sign = offset >= 0 ? '+' : '';
      return `GMT${sign}${offset}`;
    } catch (error) {
      return '';
    }
  };

  const loadAllData = async () => {
    try {
      setLoading(true);
      
      // Wait for auth context to finish loading before checking authentication
      // This prevents premature redirects when auth is still loading
      if (!authUser) {
        console.log('User data not yet available, waiting...');
        // Instead of redirecting immediately, let the auth context finish loading
        setLoading(false);
        return;
      }
      
      if (!isAuthenticated) {
        console.log('No authenticated user found, redirecting to login');
        navigate('/login');
        return;
      }
      
      console.log('Loading settings for user:', authUser.email);
      
      // Load user profile using authUser (works for both bypass and regular auth)
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();
      
      // Use profile data if available, otherwise use authUser data
      const profileData = profile || {
        id: authUser.id,
        email: authUser.email,
        full_name: authUser.full_name,
        avatar_url: authUser.avatar_url,
        role: authUser.role,
        workspace_id: authUser.workspace_id,
        settings: {}
      };
      
      setUserProfile(profileData);
      setPersonalForm({
        full_name: profileData.full_name || '',
        email: profileData.email || '',
        avatar_url: profileData.avatar_url || '',
        notifications_enabled: profileData.settings?.notifications_enabled ?? true,
        profile_visibility: profileData.settings?.profile_visibility || 'public',
        data_sharing: profileData.settings?.data_sharing ?? false
      });
      
      // Load workspace using either profile or authUser workspace_id
      const workspaceId = profileData.workspace_id;
      if (workspaceId) {
        const { data: ws } = await supabase
          .from('workspaces')
          .select('*')
          .eq('id', workspaceId)
          .single();
        
        if (ws) {
          setWorkspace(ws);
          setWorkspaceForm({
            name: ws.name || '',
            company_name: ws.settings?.company_name || '',
            website: ws.settings?.website || '',
            industry: ws.settings?.industry || '',
            company_size: ws.settings?.company_size || '',
            description: ws.settings?.description || '',
            timezone: ws.settings?.timezone || 'UTC',
            ai_model: ws.settings?.ai_model || 'gpt-4',
            notifications: ws.settings?.notifications || {
              campaign_completion: true,
              new_responses: true,
              account_issues: true
            }
          });
          
          setSecurityForm({
            two_factor_enabled: ws.settings?.two_factor_enabled ?? false,
            session_timeout: ws.settings?.session_timeout || '30',
            ip_restriction_enabled: ws.settings?.ip_restriction_enabled ?? false,
            allowed_ips: ws.settings?.allowed_ips || '',
            login_notifications: ws.settings?.login_notifications ?? true
          });
        }
        
        // Load team members
        const { data: members } = await supabase
          .from('profiles')
          .select('*')
          .eq('workspace_id', workspaceId)
          .order('created_at', { ascending: false });
        
        setTeamMembers(members || []);
      }
      
      // Load LinkedIn accounts
      const linkedInData = localStorage.getItem('linkedin_accounts');
      if (linkedInData) {
        setLinkedInAccounts(JSON.parse(linkedInData));
      }
      
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };
  
  const savePersonalSettings = async () => {
    try {
      setSaving(true);
      
      if (!userProfile) return;
      
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: personalForm.full_name,
          avatar_url: personalForm.avatar_url,
          settings: {
            ...userProfile.settings,
            notifications_enabled: personalForm.notifications_enabled,
            profile_visibility: personalForm.profile_visibility,
            data_sharing: personalForm.data_sharing
          }
        })
        .eq('id', userProfile.id);
      
      if (error) throw error;
      
      toast.success('Personal settings saved');
    } catch (error) {
      console.error('Error saving personal settings:', error);
      toast.error('Failed to save personal settings');
    } finally {
      setSaving(false);
    }
  };
  
  const saveWorkspaceSettings = async () => {
    try {
      setSaving(true);
      
      if (!workspace) return;
      
      const { error } = await supabase
        .from('workspaces')
        .update({
          name: workspaceForm.name,
          settings: {
            ...workspace.settings,
            company_name: workspaceForm.company_name,
            website: workspaceForm.website,
            industry: workspaceForm.industry,
            company_size: workspaceForm.company_size,
            description: workspaceForm.description,
            timezone: workspaceForm.timezone,
            ai_model: workspaceForm.ai_model,
            notifications: workspaceForm.notifications
          }
        })
        .eq('id', workspace.id);
      
      if (error) throw error;
      
      toast.success('Workspace settings saved');
    } catch (error) {
      console.error('Error saving workspace settings:', error);
      toast.error('Failed to save workspace settings');
    } finally {
      setSaving(false);
    }
  };
  
  const saveSecuritySettings = async () => {
    try {
      setSaving(true);
      
      if (!workspace) return;
      
      const { error } = await supabase
        .from('workspaces')
        .update({
          settings: {
            ...workspace.settings,
            ...securityForm
          }
        })
        .eq('id', workspace.id);
      
      if (error) throw error;
      
      toast.success('Security settings saved');
    } catch (error) {
      console.error('Error saving security settings:', error);
      toast.error('Failed to save security settings');
    } finally {
      setSaving(false);
    }
  };
  
  const changePassword = async () => {
    try {
      if (passwordForm.new !== passwordForm.confirm) {
        toast.error('Passwords do not match');
        return;
      }
      
      // Check if this is a bypass user
      const isBypassUser = localStorage.getItem('bypass_auth') === 'true';
      if (isBypassUser) {
        toast.error('Password changes are not available for bypass authentication users');
        return;
      }
      
      setSaving(true);
      
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.new
      });
      
      if (error) throw error;
      
      toast.success('Password changed successfully');
      setPasswordForm({ current: '', new: '', confirm: '' });
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error('Failed to change password');
    } finally {
      setSaving(false);
    }
  };
  
  const inviteTeamMember = async (email: string, role: string) => {
    try {
      if (!workspace) return;
      
      // In production, this would send an invitation email
      // For now, we'll create a placeholder
      const { error } = await supabase
        .from('profiles')
        .insert({
          id: crypto.randomUUID(),
          workspace_id: workspace.id,
          email,
          role,
          full_name: email.split('@')[0],
          settings: { invited: true, invited_at: new Date().toISOString() }
        });
      
      if (error && error.code !== '23505') throw error;
      
      toast.success(`Invitation sent to ${email}`);
      loadAllData();
    } catch (error) {
      console.error('Error inviting team member:', error);
      toast.error('Failed to send invitation');
    }
  };
  
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-purple-100 text-purple-800';
      case 'admin': return 'bg-blue-100 text-blue-800';
      case 'member': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Modal handlers
  const handleDeleteAccount = () => {
    if (deleteConfirmText === 'DELETE') {
      // In production, this would call a delete account API
      toast.error('Account deletion is currently disabled. Contact support for account deletion.');
      setShowDeleteAccountDialog(false);
      setDeleteConfirmText('');
    } else {
      toast.error('Please type DELETE to confirm account deletion.');
    }
  };
  
  const handleInviteMember = async () => {
    if (inviteForm.email) {
      await inviteTeamMember(inviteForm.email, inviteForm.role);
      setShowInviteMemberDialog(false);
      setInviteForm({ email: '', role: 'member' });
    } else {
      toast.error('Please enter an email address');
    }
  };
  
  const handleRoleChange = () => {
    if (roleChangeForm.newRole !== roleChangeForm.currentRole) {
      // In production, this would update the member's role
      toast.success(`Role updated to ${roleChangeForm.newRole}`);
      setShowRoleChangeDialog(false);
      loadAllData();
    }
  };
  
  const handleWebhookSave = () => {
    if (webhookForm.url) {
      if (webhookForm.url.startsWith('http://') || webhookForm.url.startsWith('https://')) {
        toast.success('Webhook configured successfully!');
        // In production, this would save the webhook configuration
        setShowWebhookDialog(false);
        setWebhookForm({ url: '', description: '' });
      } else {
        toast.error('Please enter a valid URL starting with http:// or https://');
      }
    } else {
      toast.error('Please enter a webhook URL');
    }
  };
  
  
  // Show loading state while waiting for auth or while loading data
  if (loading || !authUser) {
    return (
      <div className="flex-1 bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">
              {!authUser ? 'Loading user data...' : 'Loading settings...'}
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex-1 bg-gray-50">
      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
              <p className="text-gray-600 mt-1">Manage your account, workspace, and team settings</p>
            </div>
            <Button onClick={() => navigate('/profile')} variant="outline">
              <User className="h-4 w-4 mr-2" />
              View Profile
            </Button>
          </div>
          
          {/* Main Settings Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid grid-cols-5 w-full">
              <TabsTrigger value="personal" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Personal
              </TabsTrigger>
              <TabsTrigger value="workspace" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Workspace
              </TabsTrigger>
              <TabsTrigger value="team" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Team
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Security
              </TabsTrigger>
              <TabsTrigger value="integrations" className="flex items-center gap-2">
                <Link className="h-4 w-4" />
                Integrations
              </TabsTrigger>
            </TabsList>
            
            {/* Personal Tab */}
            <TabsContent value="personal" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Update your personal details and preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Avatar Section */}
                  <div className="flex items-center gap-6">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={personalForm.avatar_url} />
                      <AvatarFallback>
                        {personalForm.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'image/*';
                          input.onchange = (e: any) => {
                            const file = e.target?.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (e) => {
                                const result = e.target?.result as string;
                                setPersonalForm({ ...personalForm, avatar_url: result });
                                toast.success('Photo updated successfully');
                              };
                              reader.readAsDataURL(file);
                            }
                          };
                          input.click();
                        }}
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        Change Photo
                      </Button>
                      <p className="text-xs text-gray-500">JPG, GIF or PNG. Max size 2MB</p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Personal Details */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Full Name</Label>
                      <Input
                        id="full_name"
                        value={personalForm.full_name}
                        onChange={(e) => setPersonalForm({ ...personalForm, full_name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={personalForm.email}
                        disabled
                        className="bg-gray-50"
                      />
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Privacy Preferences */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Privacy Preferences</h3>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Email Notifications</Label>
                        <p className="text-sm text-gray-500">Receive email updates about your account</p>
                      </div>
                      <Switch
                        checked={personalForm.notifications_enabled}
                        onCheckedChange={(checked) => 
                          setPersonalForm({ ...personalForm, notifications_enabled: checked })
                        }
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Profile Visibility</Label>
                        <p className="text-sm text-gray-500">Control who can see your profile</p>
                      </div>
                      <Select
                        value={personalForm.profile_visibility}
                        onValueChange={(value) => 
                          setPersonalForm({ ...personalForm, profile_visibility: value })
                        }
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="public">Public</SelectItem>
                          <SelectItem value="team">Team Only</SelectItem>
                          <SelectItem value="private">Private</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Data Sharing</Label>
                        <p className="text-sm text-gray-500">Share usage data to improve the platform</p>
                      </div>
                      <Switch
                        checked={personalForm.data_sharing}
                        onCheckedChange={(checked) => 
                          setPersonalForm({ ...personalForm, data_sharing: checked })
                        }
                      />
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Password Change */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Change Password</h3>
                    {localStorage.getItem('bypass_auth') === 'true' && (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          Password changes are not available for bypass authentication users. Contact your administrator for password management.
                        </AlertDescription>
                      </Alert>
                    )}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="current_password">Current Password</Label>
                        <div className="relative">
                          <Input
                            id="current_password"
                            type={showPassword ? "text" : "password"}
                            value={passwordForm.current}
                            onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                            disabled={localStorage.getItem('bypass_auth') === 'true'}
                            className={localStorage.getItem('bypass_auth') === 'true' ? 'bg-gray-100' : ''}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new_password">New Password</Label>
                        <Input
                          id="new_password"
                          type={showPassword ? "text" : "password"}
                          value={passwordForm.new}
                          onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
                          disabled={localStorage.getItem('bypass_auth') === 'true'}
                          className={localStorage.getItem('bypass_auth') === 'true' ? 'bg-gray-100' : ''}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirm_password">Confirm Password</Label>
                        <div className="relative">
                          <Input
                            id="confirm_password"
                            type={showPassword ? "text" : "password"}
                            value={passwordForm.confirm}
                            onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                            disabled={localStorage.getItem('bypass_auth') === 'true'}
                            className={localStorage.getItem('bypass_auth') === 'true' ? 'bg-gray-100' : ''}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => setShowPassword(!showPassword)}
                            disabled={localStorage.getItem('bypass_auth') === 'true'}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                    </div>
                    <Button 
                      onClick={changePassword} 
                      disabled={saving || localStorage.getItem('bypass_auth') === 'true'}
                    >
                      <Lock className="h-4 w-4 mr-2" />
                      Change Password
                    </Button>
                  </div>
                  
                  <Separator />
                  
                  {/* Account Actions */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Account Actions</h3>
                    <div className="flex gap-4">
                      <Button 
                        variant="outline"
                        onClick={() => {
                          // Create a simple data export
                          const userData = {
                            profile: userProfile,
                            settings: personalForm,
                            workspace: workspace?.name,
                            exported_at: new Date().toISOString()
                          };
                          const dataStr = JSON.stringify(userData, null, 2);
                          const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
                          
                          const exportFileDefaultName = `sam-ai-data-${new Date().toISOString().split('T')[0]}.json`;
                          
                          const linkElement = document.createElement('a');
                          linkElement.setAttribute('href', dataUri);
                          linkElement.setAttribute('download', exportFileDefaultName);
                          linkElement.click();
                          
                          toast.success('Data export downloaded successfully');
                        }}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download My Data
                      </Button>
                      <Button 
                        variant="outline" 
                        className="text-red-600 hover:text-red-700"
                        onClick={() => setShowDeleteAccountDialog(true)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Account
                      </Button>
                    </div>
                  </div>
                </CardContent>
                <div className="px-6 py-4 bg-gray-50 border-t">
                  <Button onClick={savePersonalSettings} disabled={saving}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Personal Settings
                  </Button>
                </div>
              </Card>
            </TabsContent>
            
            {/* Workspace Tab */}
            <TabsContent value="workspace" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Workspace Configuration</CardTitle>
                  <CardDescription>Manage your workspace and company settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Workspace Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="workspace_name">Workspace Name</Label>
                      <Input
                        id="workspace_name"
                        value={workspaceForm.name}
                        onChange={(e) => setWorkspaceForm({ ...workspaceForm, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="timezone">Timezone</Label>
                      <Select
                        value={workspaceForm.timezone}
                        onValueChange={(value) => setWorkspaceForm({ ...workspaceForm, timezone: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-[200px] overflow-y-auto">
                          {/* UTC */}
                          <SelectItem value="UTC">UTC (Coordinated Universal Time)</SelectItem>
                          
                          {/* North America */}
                          <SelectItem value="America/New_York">Eastern Time (New York)</SelectItem>
                          <SelectItem value="America/Chicago">Central Time (Chicago)</SelectItem>
                          <SelectItem value="America/Denver">Mountain Time (Denver)</SelectItem>
                          <SelectItem value="America/Los_Angeles">Pacific Time (Los Angeles)</SelectItem>
                          <SelectItem value="America/Anchorage">Alaska Time (Anchorage)</SelectItem>
                          <SelectItem value="Pacific/Honolulu">Hawaii Time (Honolulu)</SelectItem>
                          <SelectItem value="America/Toronto">Eastern Time (Toronto)</SelectItem>
                          <SelectItem value="America/Vancouver">Pacific Time (Vancouver)</SelectItem>
                          <SelectItem value="America/Mexico_City">Mexico City</SelectItem>
                          
                          {/* South America */}
                          <SelectItem value="America/Sao_Paulo">São Paulo, Brazil</SelectItem>
                          <SelectItem value="America/Argentina/Buenos_Aires">Buenos Aires, Argentina</SelectItem>
                          <SelectItem value="America/Santiago">Santiago, Chile</SelectItem>
                          <SelectItem value="America/Bogota">Bogotá, Colombia</SelectItem>
                          <SelectItem value="America/Lima">Lima, Peru</SelectItem>
                          
                          {/* Europe */}
                          <SelectItem value="Europe/London">London, UK</SelectItem>
                          <SelectItem value="Europe/Paris">Paris, France</SelectItem>
                          <SelectItem value="Europe/Berlin">Berlin, Germany</SelectItem>
                          <SelectItem value="Europe/Rome">Rome, Italy</SelectItem>
                          <SelectItem value="Europe/Madrid">Madrid, Spain</SelectItem>
                          <SelectItem value="Europe/Amsterdam">Amsterdam, Netherlands</SelectItem>
                          <SelectItem value="Europe/Zurich">Zurich, Switzerland</SelectItem>
                          <SelectItem value="Europe/Stockholm">Stockholm, Sweden</SelectItem>
                          <SelectItem value="Europe/Helsinki">Helsinki, Finland</SelectItem>
                          <SelectItem value="Europe/Warsaw">Warsaw, Poland</SelectItem>
                          <SelectItem value="Europe/Prague">Prague, Czech Republic</SelectItem>
                          <SelectItem value="Europe/Vienna">Vienna, Austria</SelectItem>
                          <SelectItem value="Europe/Brussels">Brussels, Belgium</SelectItem>
                          <SelectItem value="Europe/Dublin">Dublin, Ireland</SelectItem>
                          <SelectItem value="Europe/Lisbon">Lisbon, Portugal</SelectItem>
                          <SelectItem value="Europe/Moscow">Moscow, Russia</SelectItem>
                          <SelectItem value="Europe/Kiev">Kiev, Ukraine</SelectItem>
                          <SelectItem value="Europe/Istanbul">Istanbul, Turkey</SelectItem>
                          
                          {/* Asia */}
                          <SelectItem value="Asia/Tokyo">Tokyo, Japan</SelectItem>
                          <SelectItem value="Asia/Shanghai">Shanghai, China</SelectItem>
                          <SelectItem value="Asia/Hong_Kong">Hong Kong</SelectItem>
                          <SelectItem value="Asia/Singapore">Singapore</SelectItem>
                          <SelectItem value="Asia/Seoul">Seoul, South Korea</SelectItem>
                          <SelectItem value="Asia/Mumbai">Mumbai, India</SelectItem>
                          <SelectItem value="Asia/Delhi">Delhi, India</SelectItem>
                          <SelectItem value="Asia/Kolkata">Kolkata, India</SelectItem>
                          <SelectItem value="Asia/Bangkok">Bangkok, Thailand</SelectItem>
                          <SelectItem value="Asia/Manila">Manila, Philippines</SelectItem>
                          <SelectItem value="Asia/Jakarta">Jakarta, Indonesia</SelectItem>
                          <SelectItem value="Asia/Kuala_Lumpur">Kuala Lumpur, Malaysia</SelectItem>
                          <SelectItem value="Asia/Karachi">Karachi, Pakistan</SelectItem>
                          <SelectItem value="Asia/Dubai">Dubai, UAE</SelectItem>
                          <SelectItem value="Asia/Qatar">Doha, Qatar</SelectItem>
                          <SelectItem value="Asia/Riyadh">Riyadh, Saudi Arabia</SelectItem>
                          <SelectItem value="Asia/Tehran">Tehran, Iran</SelectItem>
                          <SelectItem value="Asia/Baghdad">Baghdad, Iraq</SelectItem>
                          <SelectItem value="Asia/Tel_Aviv">Tel Aviv, Israel</SelectItem>
                          
                          {/* Africa */}
                          <SelectItem value="Africa/Cairo">Cairo, Egypt</SelectItem>
                          <SelectItem value="Africa/Lagos">Lagos, Nigeria</SelectItem>
                          <SelectItem value="Africa/Johannesburg">Johannesburg, South Africa</SelectItem>
                          <SelectItem value="Africa/Nairobi">Nairobi, Kenya</SelectItem>
                          <SelectItem value="Africa/Casablanca">Casablanca, Morocco</SelectItem>
                          <SelectItem value="Africa/Tunis">Tunis, Tunisia</SelectItem>
                          <SelectItem value="Africa/Algiers">Algiers, Algeria</SelectItem>
                          
                          {/* Oceania */}
                          <SelectItem value="Australia/Sydney">Sydney, Australia</SelectItem>
                          <SelectItem value="Australia/Melbourne">Melbourne, Australia</SelectItem>
                          <SelectItem value="Australia/Perth">Perth, Australia</SelectItem>
                          <SelectItem value="Australia/Brisbane">Brisbane, Australia</SelectItem>
                          <SelectItem value="Australia/Adelaide">Adelaide, Australia</SelectItem>
                          <SelectItem value="Pacific/Auckland">Auckland, New Zealand</SelectItem>
                          <SelectItem value="Pacific/Fiji">Fiji</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <div className="text-sm">
                            <p className="font-medium text-gray-700">
                              Current time: {formatTimeInTimezone(currentTime, workspaceForm.timezone)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {getTimezoneOffset(workspaceForm.timezone)} • This timezone will be used for all campaign scheduling and analytics
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Company Profile */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Company Profile</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="company_name">Company Name</Label>
                        <Input
                          id="company_name"
                          value={workspaceForm.company_name}
                          onChange={(e) => setWorkspaceForm({ ...workspaceForm, company_name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="website">Website</Label>
                        <Input
                          id="website"
                          type="url"
                          value={workspaceForm.website}
                          onChange={(e) => setWorkspaceForm({ ...workspaceForm, website: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="industry">Industry</Label>
                        <Select
                          value={workspaceForm.industry}
                          onValueChange={(value) => setWorkspaceForm({ ...workspaceForm, industry: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select industry" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="technology">Technology</SelectItem>
                            <SelectItem value="finance">Finance</SelectItem>
                            <SelectItem value="healthcare">Healthcare</SelectItem>
                            <SelectItem value="retail">Retail</SelectItem>
                            <SelectItem value="manufacturing">Manufacturing</SelectItem>
                            <SelectItem value="services">Services</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="company_size">Company Size</Label>
                        <Select
                          value={workspaceForm.company_size}
                          onValueChange={(value) => setWorkspaceForm({ ...workspaceForm, company_size: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select size" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1-10">1-10 employees</SelectItem>
                            <SelectItem value="11-50">11-50 employees</SelectItem>
                            <SelectItem value="51-200">51-200 employees</SelectItem>
                            <SelectItem value="201-500">201-500 employees</SelectItem>
                            <SelectItem value="501-1000">501-1000 employees</SelectItem>
                            <SelectItem value="1000+">1000+ employees</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Company Description</Label>
                      <Textarea
                        id="description"
                        value={workspaceForm.description}
                        onChange={(e) => setWorkspaceForm({ ...workspaceForm, description: e.target.value })}
                        rows={3}
                      />
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* AI Settings */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">AI Configuration</h3>
                    <div className="space-y-2">
                      <Label htmlFor="ai_model">Default AI Model</Label>
                      <Select
                        value={workspaceForm.ai_model}
                        onValueChange={(value) => setWorkspaceForm({ ...workspaceForm, ai_model: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gpt-4">GPT-4</SelectItem>
                          <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                          <SelectItem value="claude-3">Claude 3</SelectItem>
                          <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Notifications */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Workspace Notifications</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Campaign Completion</Label>
                          <p className="text-sm text-gray-500">Notify when campaigns complete</p>
                        </div>
                        <Switch
                          checked={workspaceForm.notifications.campaign_completion}
                          onCheckedChange={(checked) => 
                            setWorkspaceForm({
                              ...workspaceForm,
                              notifications: { ...workspaceForm.notifications, campaign_completion: checked }
                            })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>New Responses</Label>
                          <p className="text-sm text-gray-500">Notify on new message responses</p>
                        </div>
                        <Switch
                          checked={workspaceForm.notifications.new_responses}
                          onCheckedChange={(checked) => 
                            setWorkspaceForm({
                              ...workspaceForm,
                              notifications: { ...workspaceForm.notifications, new_responses: checked }
                            })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Account Issues</Label>
                          <p className="text-sm text-gray-500">Notify about integration issues</p>
                        </div>
                        <Switch
                          checked={workspaceForm.notifications.account_issues}
                          onCheckedChange={(checked) => 
                            setWorkspaceForm({
                              ...workspaceForm,
                              notifications: { ...workspaceForm.notifications, account_issues: checked }
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
                <div className="px-6 py-4 bg-gray-50 border-t">
                  <Button onClick={saveWorkspaceSettings} disabled={saving}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Workspace Settings
                  </Button>
                </div>
              </Card>
            </TabsContent>
            
            {/* Team Tab */}
            <TabsContent value="team" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Team Management</CardTitle>
                  <CardDescription>Manage team members and permissions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Team Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold">{teamMembers.length}</div>
                      <p className="text-sm text-gray-600">Total Members</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold">
                        {teamMembers.filter(m => m.role === 'admin' || m.role === 'owner').length}
                      </div>
                      <p className="text-sm text-gray-600">Admins</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold">
                        {teamMembers.filter(m => m.settings?.invited).length}
                      </div>
                      <p className="text-sm text-gray-600">Pending Invites</p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Team Members List */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">Team Members</h3>
                      <Button onClick={() => setShowInviteMemberDialog(true)}>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Invite Member
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      {teamMembers.map((member) => (
                        <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={member.avatar_url} />
                              <AvatarFallback>
                                {member.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{member.full_name || member.email}</div>
                              <div className="text-sm text-gray-500">{member.email}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getRoleBadgeColor(member.role)}>
                              {member.role}
                            </Badge>
                            {member.settings?.invited && (
                              <Badge variant="outline">Pending</Badge>
                            )}
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                setRoleChangeForm({
                                  memberId: member.id,
                                  currentRole: member.role,
                                  newRole: member.role
                                });
                                setShowRoleChangeDialog(true);
                              }}
                            >
                              <SettingsIcon className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Role Definitions */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Role Permissions</h3>
                    <div className="space-y-3">
                      <div className="p-3 border rounded-lg">
                        <div className="font-medium mb-1">Owner</div>
                        <p className="text-sm text-gray-600">Full access to all workspace features and settings</p>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <div className="font-medium mb-1">Admin</div>
                        <p className="text-sm text-gray-600">Manage campaigns, team members, and most settings</p>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <div className="font-medium mb-1">Member</div>
                        <p className="text-sm text-gray-600">Create and manage own campaigns and contacts</p>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <div className="font-medium mb-1">Viewer</div>
                        <p className="text-sm text-gray-600">View-only access to campaigns and analytics</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Security Tab */}
            <TabsContent value="security" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>Configure security and access controls</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Two-Factor Authentication */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Two-Factor Authentication</h3>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-0.5">
                        <Label>Enable 2FA for Workspace</Label>
                        <p className="text-sm text-gray-500">Require all team members to use 2FA</p>
                      </div>
                      <Switch
                        checked={securityForm.two_factor_enabled}
                        onCheckedChange={(checked) => 
                          setSecurityForm({ ...securityForm, two_factor_enabled: checked })
                        }
                      />
                    </div>
                    {securityForm.two_factor_enabled && (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          Team members will be required to enable 2FA on their next login
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                  
                  <Separator />
                  
                  {/* Session Management */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Session Management</h3>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="session_timeout">Session Timeout (minutes)</Label>
                        <Select
                          value={securityForm.session_timeout}
                          onValueChange={(value) => setSecurityForm({ ...securityForm, session_timeout: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="15">15 minutes</SelectItem>
                            <SelectItem value="30">30 minutes</SelectItem>
                            <SelectItem value="60">1 hour</SelectItem>
                            <SelectItem value="120">2 hours</SelectItem>
                            <SelectItem value="480">8 hours</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Login Notifications</Label>
                          <p className="text-sm text-gray-500">Notify on new login attempts</p>
                        </div>
                        <Switch
                          checked={securityForm.login_notifications}
                          onCheckedChange={(checked) => 
                            setSecurityForm({ ...securityForm, login_notifications: checked })
                          }
                        />
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* IP Restrictions */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">IP Restrictions</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Enable IP Restrictions</Label>
                          <p className="text-sm text-gray-500">Only allow access from specific IP addresses</p>
                        </div>
                        <Switch
                          checked={securityForm.ip_restriction_enabled}
                          onCheckedChange={(checked) => 
                            setSecurityForm({ ...securityForm, ip_restriction_enabled: checked })
                          }
                        />
                      </div>
                      
                      {securityForm.ip_restriction_enabled && (
                        <div className="space-y-2">
                          <Label htmlFor="allowed_ips">Allowed IP Addresses</Label>
                          <Textarea
                            id="allowed_ips"
                            placeholder="Enter one IP address per line"
                            value={securityForm.allowed_ips}
                            onChange={(e) => setSecurityForm({ ...securityForm, allowed_ips: e.target.value })}
                            rows={4}
                          />
                          <p className="text-xs text-gray-500">
                            Use CIDR notation for IP ranges (e.g., 192.168.1.0/24)
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* API Access */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">API Access</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <div className="font-medium">API Keys</div>
                          <p className="text-sm text-gray-500">Manage API keys for integrations</p>
                        </div>
                        <Button 
                          variant="outline"
                          onClick={() => {
                            toast.info('API Key management will open in a modal. Feature coming soon!');
                            // In production, this would open a modal with API key management
                          }}
                        >
                          <Key className="h-4 w-4 mr-2" />
                          Manage Keys
                        </Button>
                      </div>
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <div className="font-medium">Webhooks</div>
                          <p className="text-sm text-gray-500">Configure webhook endpoints</p>
                        </div>
                        <Button 
                          variant="outline"
                          onClick={() => setShowWebhookDialog(true)}
                        >
                          <Zap className="h-4 w-4 mr-2" />
                          Configure
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <div className="px-6 py-4 bg-gray-50 border-t">
                  <Button onClick={saveSecuritySettings} disabled={saving}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Security Settings
                  </Button>
                </div>
              </Card>
            </TabsContent>
            
            {/* Integrations Tab */}
            <TabsContent value="integrations" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Integrations</CardTitle>
                  <CardDescription>Connect your favorite tools and services</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* LinkedIn */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">LinkedIn Integration</h3>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate('/linkedin-integration')}
                      >
                        <Linkedin className="h-4 w-4 mr-2" />
                        Add LinkedIn Account
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {linkedInAccounts.length > 0 ? (
                        linkedInAccounts.map((account: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <Linkedin className="h-8 w-8 text-blue-600" />
                              <div>
                                <div className="font-medium">{account.name || 'LinkedIn Account'}</div>
                                <p className="text-sm text-gray-500">Connected</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className="bg-green-100 text-green-800">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Active
                              </Badge>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => navigate('/linkedin-integration')}
                              >
                                <ChevronRight className="h-4 w-4" />
                                Manage
                              </Button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Linkedin className="h-8 w-8 text-gray-400" />
                            <div>
                              <div className="font-medium">LinkedIn</div>
                              <p className="text-sm text-gray-500">Not connected</p>
                            </div>
                          </div>
                          <Button onClick={() => {
                            navigate('/linkedin-integration');
                          }}>
                            Connect Account
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Email */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Email Integration</h3>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Mail className="h-8 w-8 text-gray-400" />
                        <div>
                          <div className="font-medium">Email</div>
                          <p className="text-sm text-gray-500">Connect your email account</p>
                        </div>
                      </div>
                      <Button 
                        variant="outline"
                        onClick={() => {
                          toast.info('Email integration coming soon! We will support Gmail, Outlook, and other providers.');
                        }}
                      >
                        Connect Email
                      </Button>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Calendar */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Calendar Integration</h3>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-8 w-8 text-gray-400" />
                        <div>
                          <div className="font-medium">Calendar</div>
                          <p className="text-sm text-gray-500">Sync with Google Calendar or Outlook</p>
                        </div>
                      </div>
                      <Button 
                        variant="outline"
                        onClick={() => {
                          toast.info('Calendar integration coming soon! We will support Google Calendar, Outlook Calendar, and Apple Calendar.');
                        }}
                      >
                        Connect Calendar
                      </Button>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* WhatsApp */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">WhatsApp Integration</h3>
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                      <div className="flex items-center gap-3">
                        <MessageSquare className="h-8 w-8 text-gray-400" />
                        <div>
                          <div className="font-medium">WhatsApp Business</div>
                          <p className="text-sm text-gray-500">Coming soon</p>
                        </div>
                      </div>
                      <Badge variant="outline">Coming Soon</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      {/* Delete Account Dialog */}
      <Dialog open={showDeleteAccountDialog} onOpenChange={setShowDeleteAccountDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Delete Account
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete your account and all associated data, campaigns, and settings.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                All your campaigns, contacts, messages, and analytics will be permanently lost.
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <Label htmlFor="delete-confirmation">Type "DELETE" to confirm:</Label>
              <Input
                id="delete-confirmation"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Type DELETE here"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowDeleteAccountDialog(false);
              setDeleteConfirmText('');
            }}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteAccount}
              disabled={deleteConfirmText !== 'DELETE'}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Invite Team Member Dialog */}
      <Dialog open={showInviteMemberDialog} onOpenChange={setShowInviteMemberDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Invite Team Member
            </DialogTitle>
            <DialogDescription>
              Send an invitation to join your workspace. They will receive an email with setup instructions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email Address</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="teammate@company.com"
                value={inviteForm.email}
                onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-role">Role</Label>
              <Select value={inviteForm.role} onValueChange={(value) => setInviteForm({ ...inviteForm, role: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member - Can create and manage campaigns</SelectItem>
                  <SelectItem value="admin">Admin - Can manage team and most settings</SelectItem>
                  <SelectItem value="viewer">Viewer - View-only access</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowInviteMemberDialog(false);
              setInviteForm({ email: '', role: 'member' });
            }}>
              Cancel
            </Button>
            <Button onClick={handleInviteMember}>
              <Mail className="h-4 w-4 mr-2" />
              Send Invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Change Role Dialog */}
      <Dialog open={showRoleChangeDialog} onOpenChange={setShowRoleChangeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Change Member Role
            </DialogTitle>
            <DialogDescription>
              Update the role and permissions for this team member.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Current Role</Label>
              <div className="p-2 bg-gray-50 rounded capitalize">{roleChangeForm.currentRole}</div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-role">New Role</Label>
              <Select value={roleChangeForm.newRole} onValueChange={(value) => setRoleChangeForm({ ...roleChangeForm, newRole: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">Owner - Full workspace access</SelectItem>
                  <SelectItem value="admin">Admin - Manage team and most settings</SelectItem>
                  <SelectItem value="member">Member - Create and manage campaigns</SelectItem>
                  <SelectItem value="viewer">Viewer - View-only access</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRoleChangeDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleRoleChange}>
              <Save className="h-4 w-4 mr-2" />
              Update Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Webhook Configuration Dialog */}
      <Dialog open={showWebhookDialog} onOpenChange={setShowWebhookDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Configure Webhook
            </DialogTitle>
            <DialogDescription>
              Add a webhook endpoint to receive real-time notifications about campaigns and responses.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="webhook-url">Webhook URL</Label>
              <Input
                id="webhook-url"
                type="url"
                placeholder="https://your-app.com/webhook"
                value={webhookForm.url}
                onChange={(e) => setWebhookForm({ ...webhookForm, url: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="webhook-description">Description (optional)</Label>
              <Textarea
                id="webhook-description"
                placeholder="What this webhook is used for..."
                value={webhookForm.description}
                onChange={(e) => setWebhookForm({ ...webhookForm, description: e.target.value })}
                rows={3}
              />
            </div>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Webhooks will receive campaign completion, response notifications, and account alerts.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowWebhookDialog(false);
              setWebhookForm({ url: '', description: '' });
            }}>
              Cancel
            </Button>
            <Button onClick={handleWebhookSave}>
              <Zap className="h-4 w-4 mr-2" />
              Save Webhook
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
    </div>
  );
}