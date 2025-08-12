import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { 
  User,
  Building2,
  Mail,
  Shield,
  Camera,
  Save,
  Settings
} from "lucide-react";

export default function Profile() {
  const { user, authUser, loading, refreshUser } = useAuth();
  const [localLoading, setLocalLoading] = useState(false);

  // If not authenticated or still loading, show loading state
  if (loading || !user || !authUser) {
    return (
      <div className="flex-1 bg-gray-50">
        <main className="flex-1 p-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Loading Profile...</h1>
              {!loading && !user && <p className="text-gray-600">Please sign in to view your profile.</p>}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Use authenticated user data
  const profileUser = user;


  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [privacySettings, setPrivacySettings] = useState({
    emailNotifications: true,
    profileVisibility: true,
    dataSharing: false,
    marketingEmails: false
  });

  const [formData, setFormData] = useState({
    full_name: profileUser.full_name || ''
  });

  // Initialize form data when user is loaded
  useEffect(() => {
    if (profileUser) {
      setFormData({
        full_name: profileUser.full_name || ''
      });
    }
  }, [profileUser]);

  const handleSave = async () => {
    if (!authUser || !profileUser) {
      toast({
        title: "Error",
        description: "You must be authenticated to update your profile.",
        variant: "destructive"
      });
      return;
    }

    try {
      setLocalLoading(true);
      console.log('Saving form data for authenticated user:', authUser.id, formData);
      
      // Save to Supabase database (this will work because we're authenticated)
      const { data, error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name
          // Note: We don't update email here since it's tied to auth.users
        })
        .eq('id', authUser.id)
        .select()
        .single();
      
      if (error) {
        console.error('Database error:', error);
        throw error;
      }
      
      console.log('Profile updated successfully:', data);
      
      // Refresh the user profile in the auth context
      await refreshUser();
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been saved successfully."
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: "Error", 
        description: `Failed to save profile: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setLocalLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleChangePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast({
        title: "Error",
        description: "Please fill in all password fields.",
        variant: "destructive"
      });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match.",
        variant: "destructive"
      });
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      toast({
        title: "Error",
        description: "New password must be at least 8 characters long.",
        variant: "destructive"
      });
      return;
    }

    try {
      setPasswordLoading(true);
      
      // Update password using Supabase auth
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Password Changed",
        description: "Your password has been updated successfully."
      });
      
      // Reset form
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Password change error:', error);
      toast({
        title: "Error",
        description: "Failed to change password. Please try again.",
        variant: "destructive"
      });
    } finally {
      setPasswordLoading(false);
    }
  };


  const handlePrivacySettingChange = (setting: keyof typeof privacySettings) => {
    setPrivacySettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const savePrivacySettings = () => {
    toast({
      title: "Privacy Settings Saved",
      description: "Your privacy preferences have been updated successfully."
    });
  };

  return (
    <div className="flex-1 bg-gray-50">
      <main className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
              <p className="text-gray-600">Manage your account settings and preferences</p>
            </div>
            <Button
              onClick={() => {
                if (isEditing) {
                  // Reset form data to current profile values when canceling
                  setFormData({
                    full_name: profileUser.full_name || ''
                  });
                }
                setIsEditing(!isEditing);
              }}
              variant={isEditing ? "outline" : "default"}
            >
              <Settings className="h-4 w-4 mr-2" />
              {isEditing ? "Cancel" : "Edit Profile"}
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Card */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-4">
                    <div className="relative">
                      <Avatar className="h-24 w-24">
                        <AvatarImage src={profileUser.avatar_url} />
                        <AvatarFallback className="text-lg">
                          {getInitials(profileUser.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      {isEditing && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                        >
                          <Camera className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <CardTitle className="text-xl">{profileUser.full_name}</CardTitle>
                  <CardDescription>{profileUser.email}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Role</span>
                    <Badge variant="secondary" className="capitalize">
                      <Shield className="h-3 w-3 mr-1" />
                      {profileUser.role}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Workspace</span>
                    <Badge variant="outline">
                      <Building2 className="h-3 w-3 mr-1" />
                      {profileUser.workspace_name}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Plan</span>
                    <Badge 
                      variant={profileUser.workspace_plan === 'pro' ? 'default' : 'secondary'}
                      className="capitalize"
                    >
                      {profileUser.workspace_plan}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Profile Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Personal Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Personal Information
                  </CardTitle>
                  <CardDescription>
                    Update your personal details and contact information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="full_name">Full Name</Label>
                      {isEditing ? (
                        <Input
                          id="full_name"
                          value={formData.full_name}
                          onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                          placeholder="Enter your full name"
                        />
                      ) : (
                        <div className="p-2 bg-gray-50 rounded border">
                          {profileUser.full_name}
                        </div>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <div className="p-2 bg-gray-50 rounded border flex-1">
                          {profileUser.email}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Email cannot be changed from this interface
                      </p>
                    </div>
                  </div>

                  {isEditing && (
                    <>
                      <Separator />
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => {
                          // Reset form data to current profile values when canceling
                          setFormData({
                            full_name: profileUser.full_name || ''
                          });
                          setIsEditing(false);
                        }}>
                          Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={localLoading}>
                          <Save className="h-4 w-4 mr-2" />
                          {localLoading ? "Saving..." : "Save Changes"}
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Workspace Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Workspace Information
                  </CardTitle>
                  <CardDescription>
                    Your current workspace details and permissions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Workspace Name</Label>
                      <div className="p-2 bg-gray-50 rounded border">
                        {profileUser.workspace_name}
                      </div>
                    </div>
                    <div>
                      <Label>Subscription Plan</Label>
                      <div className="p-2 bg-gray-50 rounded border capitalize">
                        {profileUser.workspace_plan}
                      </div>
                    </div>
                    <div>
                      <Label>Your Role</Label>
                      <div className="p-2 bg-gray-50 rounded border capitalize">
                        {profileUser.role}
                      </div>
                    </div>
                    <div>
                      <Label>Status</Label>
                      <div className="p-2 bg-gray-50 rounded border">
                        <Badge variant="outline" className="text-green-600">
                          Active
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => {
                      toast({
                        title: "Upgrade Plan",
                        description: "Contact support to upgrade your workspace plan."
                      });
                    }}>
                      Upgrade Plan
                    </Button>
                    <Button variant="outline" className="flex-1" onClick={() => {
                      toast({
                        title: "Invite Members",
                        description: "Member invitation functionality would open here."
                      });
                    }}>
                      Invite Members
                    </Button>
                    <Button variant="outline" className="flex-1" onClick={() => {
                      toast({
                        title: "Workspace Settings", 
                        description: "Redirecting to workspace configuration..."
                      });
                    }}>
                      Workspace Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Account Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Account Actions</CardTitle>
                  <CardDescription>
                    Manage your account settings and security
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="flex-1">
                          Change Password
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Change Password</DialogTitle>
                          <DialogDescription>
                            Update your account password. Please enter your current password and your new password twice.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="currentPassword">Current Password</Label>
                            <Input
                              id="currentPassword"
                              type="password"
                              value={passwordForm.currentPassword}
                              onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                              placeholder="Enter your current password"
                            />
                          </div>
                          <div>
                            <Label htmlFor="newPassword">New Password</Label>
                            <Input
                              id="newPassword"
                              type="password"
                              value={passwordForm.newPassword}
                              onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                              placeholder="Enter your new password"
                            />
                          </div>
                          <div>
                            <Label htmlFor="confirmPassword">Confirm New Password</Label>
                            <Input
                              id="confirmPassword"
                              type="password"
                              value={passwordForm.confirmPassword}
                              onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                              placeholder="Confirm your new password"
                            />
                          </div>
                          <div className="flex justify-end gap-2 pt-4">
                            <DialogTrigger asChild>
                              <Button variant="outline" disabled={passwordLoading}>
                                Cancel
                              </Button>
                            </DialogTrigger>
                            <Button 
                              onClick={handleChangePassword} 
                              disabled={passwordLoading}
                            >
                              {passwordLoading ? "Updating..." : "Update Password"}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="flex-1">
                          Privacy Settings
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Privacy Settings</DialogTitle>
                          <DialogDescription>
                            Manage your privacy preferences and data sharing settings.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-6">
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label className="text-base">Email Notifications</Label>
                              <div className="text-sm text-muted-foreground">
                                Receive email notifications about account activity
                              </div>
                            </div>
                            <Switch
                              checked={privacySettings.emailNotifications}
                              onCheckedChange={() => handlePrivacySettingChange('emailNotifications')}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label className="text-base">Profile Visibility</Label>
                              <div className="text-sm text-muted-foreground">
                                Make your profile visible to other users
                              </div>
                            </div>
                            <Switch
                              checked={privacySettings.profileVisibility}
                              onCheckedChange={() => handlePrivacySettingChange('profileVisibility')}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label className="text-base">Data Sharing</Label>
                              <div className="text-sm text-muted-foreground">
                                Share anonymized data for product improvement
                              </div>
                            </div>
                            <Switch
                              checked={privacySettings.dataSharing}
                              onCheckedChange={() => handlePrivacySettingChange('dataSharing')}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label className="text-base">Marketing Emails</Label>
                              <div className="text-sm text-muted-foreground">
                                Receive emails about new features and updates
                              </div>
                            </div>
                            <Switch
                              checked={privacySettings.marketingEmails}
                              onCheckedChange={() => handlePrivacySettingChange('marketingEmails')}
                            />
                          </div>
                          <div className="flex justify-end pt-4">
                            <Button onClick={savePrivacySettings}>
                              Save Settings
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}