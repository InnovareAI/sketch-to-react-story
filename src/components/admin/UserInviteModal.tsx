import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Mail, UserPlus, Send, Info, Copy, CheckCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface UserInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  workspaceName: string;
}

export function UserInviteModal({ isOpen, onClose, workspaceId, workspaceName }: UserInviteModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);
  
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    role: "member",
    department: "",
    sendWelcomeEmail: true,
    customMessage: "",
    permissions: {
      viewCampaigns: true,
      createCampaigns: false,
      manageCampaigns: false,
      viewAccounts: true,
      manageAccounts: false,
      viewAnalytics: true,
      manageSettings: false,
      manageUsers: false
    }
  });

  const generateInviteLink = () => {
    const baseUrl = window.location.origin;
    const inviteToken = crypto.randomUUID();
    const link = `${baseUrl}/signup?invite=${inviteToken}&workspace=${workspaceId}&email=${encodeURIComponent(formData.email)}`;
    return { link, token: inviteToken };
  };

  const handleInviteUser = async () => {
    if (!formData.email || !formData.firstName) {
      toast({
        title: "Missing Information",
        description: "Please provide at least email and first name.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Generate invite link and token
      const { link, token } = generateInviteLink();
      
      // Store invite in database
      const { data: inviteData, error: inviteError } = await supabase
        .from('user_invites')
        .insert({
          id: token,
          workspace_id: workspaceId,
          email: formData.email,
          first_name: formData.firstName,
          last_name: formData.lastName,
          role: formData.role,
          department: formData.department,
          permissions: formData.permissions,
          invite_link: link,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
          status: 'pending'
        })
        .select()
        .single();

      if (inviteError) throw inviteError;

      // Send invite email if enabled
      if (formData.sendWelcomeEmail) {
        const { error: emailError } = await supabase.functions.invoke('send-invite-email', {
          body: {
            to: formData.email,
            firstName: formData.firstName,
            workspaceName: workspaceName,
            inviteLink: link,
            customMessage: formData.customMessage,
            inviterName: 'Admin' // You can get this from current user context
          }
        });

        if (emailError) {
          console.error('Email send error:', emailError);
          // Don't throw - invite was created successfully
        }
      }

      setInviteLink(link);
      
      toast({
        title: "Invite Sent Successfully",
        description: formData.sendWelcomeEmail 
          ? `An invitation email has been sent to ${formData.email}`
          : "Invite link generated. Share it with the user.",
      });

    } catch (error: any) {
      console.error('Invite error:', error);
      toast({
        title: "Invite Failed",
        description: error.message || "Failed to create user invite",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const resetForm = () => {
    setFormData({
      email: "",
      firstName: "",
      lastName: "",
      role: "member",
      department: "",
      sendWelcomeEmail: true,
      customMessage: "",
      permissions: {
        viewCampaigns: true,
        createCampaigns: false,
        manageCampaigns: false,
        viewAccounts: true,
        manageAccounts: false,
        viewAnalytics: true,
        manageSettings: false,
        manageUsers: false
      }
    });
    setInviteLink("");
    setLinkCopied(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Invite New User
          </DialogTitle>
          <DialogDescription>
            Send an invitation to join the {workspaceName} workspace
          </DialogDescription>
        </DialogHeader>

        {!inviteLink ? (
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">User Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="user@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role *</Label>
                  <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    placeholder="John"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    placeholder="Doe"
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                    placeholder="Sales, Marketing, etc."
                  />
                </div>
              </div>
            </div>

            {/* Permissions */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Permissions</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="viewCampaigns" className="text-sm">View Campaigns</Label>
                  <Switch
                    id="viewCampaigns"
                    checked={formData.permissions.viewCampaigns}
                    onCheckedChange={(checked) => setFormData(prev => ({
                      ...prev,
                      permissions: { ...prev.permissions, viewCampaigns: checked }
                    }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="createCampaigns" className="text-sm">Create Campaigns</Label>
                  <Switch
                    id="createCampaigns"
                    checked={formData.permissions.createCampaigns}
                    onCheckedChange={(checked) => setFormData(prev => ({
                      ...prev,
                      permissions: { ...prev.permissions, createCampaigns: checked }
                    }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="manageCampaigns" className="text-sm">Manage Campaigns</Label>
                  <Switch
                    id="manageCampaigns"
                    checked={formData.permissions.manageCampaigns}
                    onCheckedChange={(checked) => setFormData(prev => ({
                      ...prev,
                      permissions: { ...prev.permissions, manageCampaigns: checked }
                    }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="viewAccounts" className="text-sm">View Accounts</Label>
                  <Switch
                    id="viewAccounts"
                    checked={formData.permissions.viewAccounts}
                    onCheckedChange={(checked) => setFormData(prev => ({
                      ...prev,
                      permissions: { ...prev.permissions, viewAccounts: checked }
                    }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="manageAccounts" className="text-sm">Manage Accounts</Label>
                  <Switch
                    id="manageAccounts"
                    checked={formData.permissions.manageAccounts}
                    onCheckedChange={(checked) => setFormData(prev => ({
                      ...prev,
                      permissions: { ...prev.permissions, manageAccounts: checked }
                    }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="manageSettings" className="text-sm">Manage Settings</Label>
                  <Switch
                    id="manageSettings"
                    checked={formData.permissions.manageSettings}
                    onCheckedChange={(checked) => setFormData(prev => ({
                      ...prev,
                      permissions: { ...prev.permissions, manageSettings: checked }
                    }))}
                  />
                </div>
              </div>
            </div>

            {/* Email Settings */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="sendEmail">Send Welcome Email</Label>
                  <p className="text-xs text-muted-foreground">Automatically send invitation email</p>
                </div>
                <Switch
                  id="sendEmail"
                  checked={formData.sendWelcomeEmail}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, sendWelcomeEmail: checked }))}
                />
              </div>
              
              {formData.sendWelcomeEmail && (
                <div className="space-y-2">
                  <Label htmlFor="customMessage">Custom Message (Optional)</Label>
                  <Textarea
                    id="customMessage"
                    value={formData.customMessage}
                    onChange={(e) => setFormData(prev => ({ ...prev, customMessage: e.target.value }))}
                    placeholder="Add a personal message to the invitation email..."
                    rows={3}
                  />
                </div>
              )}
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                The user will receive an email with a secure link to set up their account. The link expires in 7 days.
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <div className="space-y-6">
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Invitation created successfully! {formData.sendWelcomeEmail ? 'Email sent to' : 'Share this link with'} {formData.email}
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label>Invitation Link</Label>
              <div className="flex gap-2">
                <Input
                  value={inviteLink}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  onClick={copyInviteLink}
                  variant="outline"
                  size="icon"
                >
                  {linkCopied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">This link expires in 7 days</p>
            </div>

            <div className="space-y-2">
              <Label>Invited User Details</Label>
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Name:</span>
                  <span className="text-sm font-medium">{formData.firstName} {formData.lastName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Email:</span>
                  <span className="text-sm font-medium">{formData.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Role:</span>
                  <Badge variant="outline">{formData.role}</Badge>
                </div>
                {formData.department && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Department:</span>
                    <span className="text-sm font-medium">{formData.department}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          {!inviteLink ? (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleInviteUser} disabled={isLoading}>
                {isLoading ? (
                  <>Sending...</>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Invitation
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setInviteLink("")}>
                Invite Another
              </Button>
              <Button onClick={handleClose}>
                Done
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}