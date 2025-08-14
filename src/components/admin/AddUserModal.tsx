import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { 
  User, 
  Mail, 
  Linkedin, 
  Building2, 
  Briefcase,
  Shield,
  Check,
  Loader2,
  Link,
  UserPlus
} from 'lucide-react';
import { toast } from 'sonner';
import { generateUUID } from '@/lib/workspace';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  workspaceName: string;
  onUserAdded?: (user: any) => void;
}

export default function AddUserModal({ 
  isOpen, 
  onClose, 
  workspaceId, 
  workspaceName,
  onUserAdded 
}: AddUserModalProps) {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'invite' | 'linkedin'>('invite');
  
  // Invite form state
  const [inviteForm, setInviteForm] = useState({
    email: '',
    fullName: '',
    role: 'member' as 'admin' | 'member',
    department: '',
    title: '',
    sendInvite: true,
    requireLinkedIn: true
  });
  
  // LinkedIn form state
  const [linkedInForm, setLinkedInForm] = useState({
    linkedinUrl: '',
    role: 'member' as 'admin' | 'member',
    autoImport: true,
    autoActivate: true
  });

  const handleInviteUser = async () => {
    if (!inviteForm.email || !inviteForm.fullName) {
      toast.error('Please provide email and full name');
      return;
    }
    
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteForm.email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    setLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Generate user credentials
      const userId = generateUUID();
      const tempPassword = generateUUID().slice(0, 8) + '!Aa1'; // Temporary password
      const inviteToken = generateUUID();
      
      // Create user object
      const newUser = {
        id: userId,
        email: inviteForm.email,
        full_name: inviteForm.fullName,
        role: inviteForm.role,
        department: inviteForm.department,
        title: inviteForm.title,
        workspace_id: workspaceId,
        workspace_name: workspaceName,
        status: 'invited',
        invite_token: inviteToken,
        temp_password: tempPassword,
        requires_password_change: true,
        requires_linkedin: inviteForm.requireLinkedIn,
        created_at: new Date().toISOString(),
        invited_at: new Date().toISOString()
      };
      
      // Store invited user
      const invitedUsers = JSON.parse(localStorage.getItem('invited_users') || '[]');
      invitedUsers.push(newUser);
      localStorage.setItem('invited_users', JSON.stringify(invitedUsers));
      
      // Generate setup link
      const setupLink = `${window.location.origin}/setup/${inviteToken}`;
      
      if (inviteForm.sendInvite) {
        // In production, this would send an email
        console.log('Sending invite email to:', inviteForm.email);
        console.log('Setup link:', setupLink);
        console.log('Temporary password:', tempPassword);
        
        // Copy setup info to clipboard
        const setupInfo = `
Welcome to ${workspaceName}!

Your account has been created. Please complete setup:
Setup Link: ${setupLink}
Temporary Password: ${tempPassword}

This link will expire in 7 days.
        `;
        
        navigator.clipboard.writeText(setupInfo);
        toast.success('User invited! Setup details copied to clipboard');
      } else {
        toast.success('User added successfully');
      }
      
      // Callback
      if (onUserAdded) {
        onUserAdded(newUser);
      }
      
      // Reset form
      setInviteForm({
        email: '',
        fullName: '',
        role: 'member',
        department: '',
        title: '',
        sendInvite: true,
        requireLinkedIn: true
      });
      
      onClose();
    } catch (error) {
      toast.error('Failed to add user');
    } finally {
      setLoading(false);
    }
  };

  const handleLinkedInImport = async () => {
    if (!linkedInForm.linkedinUrl) {
      toast.error('Please provide a LinkedIn URL');
      return;
    }
    
    // Validate LinkedIn URL
    if (!linkedInForm.linkedinUrl.includes('linkedin.com/in/')) {
      toast.error('Please enter a valid LinkedIn profile URL');
      return;
    }
    
    setLoading(true);
    
    try {
      // Simulate LinkedIn profile scraping
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Extract username from LinkedIn URL
      const username = linkedInForm.linkedinUrl.split('linkedin.com/in/')[1]?.split('/')[0]?.split('?')[0];
      
      // Generate mock data (in production, this would scrape actual LinkedIn data)
      const userId = generateUUID();
      const mockProfile = {
        id: userId,
        email: `${username}@linkedin-import.com`, // In production, get actual email
        full_name: username.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        role: linkedInForm.role,
        workspace_id: workspaceId,
        workspace_name: workspaceName,
        linkedin_url: linkedInForm.linkedinUrl,
        linkedin_connected: true,
        status: linkedInForm.autoActivate ? 'active' : 'pending',
        created_at: new Date().toISOString(),
        imported_from_linkedin: true,
        auto_imported: linkedInForm.autoImport
      };
      
      // Store user
      const users = JSON.parse(localStorage.getItem('workspace_users') || '[]');
      users.push(mockProfile);
      localStorage.setItem('workspace_users', JSON.stringify(users));
      
      toast.success(`User imported from LinkedIn${linkedInForm.autoActivate ? ' and activated' : ''}`);
      
      // Callback
      if (onUserAdded) {
        onUserAdded(mockProfile);
      }
      
      // Reset form
      setLinkedInForm({
        linkedinUrl: '',
        role: 'member',
        autoImport: true,
        autoActivate: true
      });
      
      onClose();
    } catch (error) {
      toast.error('Failed to import from LinkedIn');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add User to Workspace</DialogTitle>
          <DialogDescription>
            Add a new user directly or import from LinkedIn
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'invite' | 'linkedin')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="invite">
              <UserPlus className="h-4 w-4 mr-2" />
              Direct Invite
            </TabsTrigger>
            <TabsTrigger value="linkedin">
              <Linkedin className="h-4 w-4 mr-2" />
              LinkedIn Import
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="invite" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    className="pl-10"
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                    disabled={loading}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="John Doe"
                    className="pl-10"
                    value={inviteForm.fullName}
                    onChange={(e) => setInviteForm({ ...inviteForm, fullName: e.target.value })}
                    disabled={loading}
                  />
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="department"
                    type="text"
                    placeholder="Sales"
                    className="pl-10"
                    value={inviteForm.department}
                    onChange={(e) => setInviteForm({ ...inviteForm, department: e.target.value })}
                    disabled={loading}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="title">Job Title</Label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="title"
                    type="text"
                    placeholder="Sales Manager"
                    className="pl-10"
                    value={inviteForm.title}
                    onChange={(e) => setInviteForm({ ...inviteForm, title: e.target.value })}
                    disabled={loading}
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select 
                value={inviteForm.role} 
                onValueChange={(value: 'admin' | 'member') => setInviteForm({ ...inviteForm, role: value })}
              >
                <SelectTrigger id="role" disabled={loading}>
                  <Shield className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member - Can create and manage their own campaigns</SelectItem>
                  <SelectItem value="admin">Admin - Can manage workspace and all users</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-3 border rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between">
                <Label htmlFor="sendInvite" className="text-sm font-medium">
                  Send invitation email
                </Label>
                <Switch
                  id="sendInvite"
                  checked={inviteForm.sendInvite}
                  onCheckedChange={(checked) => setInviteForm({ ...inviteForm, sendInvite: checked })}
                  disabled={loading}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="requireLinkedIn" className="text-sm font-medium">
                  Require LinkedIn authentication
                </Label>
                <Switch
                  id="requireLinkedIn"
                  checked={inviteForm.requireLinkedIn}
                  onCheckedChange={(checked) => setInviteForm({ ...inviteForm, requireLinkedIn: checked })}
                  disabled={loading}
                />
              </div>
            </div>
            
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button onClick={handleInviteUser} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Adding user...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add User
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="linkedin" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="linkedinUrl">LinkedIn Profile URL *</Label>
              <div className="relative">
                <Linkedin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="linkedinUrl"
                  type="url"
                  placeholder="https://linkedin.com/in/username"
                  className="pl-10"
                  value={linkedInForm.linkedinUrl}
                  onChange={(e) => setLinkedInForm({ ...linkedInForm, linkedinUrl: e.target.value })}
                  disabled={loading}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                We'll import the user's profile information from LinkedIn
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="linkedinRole">Role</Label>
              <Select 
                value={linkedInForm.role} 
                onValueChange={(value: 'admin' | 'member') => setLinkedInForm({ ...linkedInForm, role: value })}
              >
                <SelectTrigger id="linkedinRole" disabled={loading}>
                  <Shield className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member - Can create and manage their own campaigns</SelectItem>
                  <SelectItem value="admin">Admin - Can manage workspace and all users</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-3 border rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between">
                <Label htmlFor="autoImport" className="text-sm font-medium">
                  Auto-import contacts and messages
                </Label>
                <Switch
                  id="autoImport"
                  checked={linkedInForm.autoImport}
                  onCheckedChange={(checked) => setLinkedInForm({ ...linkedInForm, autoImport: checked })}
                  disabled={loading}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="autoActivate" className="text-sm font-medium">
                  Activate account immediately
                </Label>
                <Switch
                  id="autoActivate"
                  checked={linkedInForm.autoActivate}
                  onCheckedChange={(checked) => setLinkedInForm({ ...linkedInForm, autoActivate: checked })}
                  disabled={loading}
                />
              </div>
            </div>
            
            <div className="rounded-lg bg-blue-50 p-4">
              <div className="flex">
                <Linkedin className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900">LinkedIn Integration</p>
                  <p className="text-blue-700 mt-1">
                    The user's LinkedIn profile will be connected automatically. They'll be able to send messages
                    and manage connections directly from the platform.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button onClick={handleLinkedInImport} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Linkedin className="h-4 w-4 mr-2" />
                    Import from LinkedIn
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}