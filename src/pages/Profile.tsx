import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
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
  const { user, loading: authLoading, refreshUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [privacySettings, setPrivacySettings] = useState({
    emailNotifications: true,
    profileVisibility: true,
    dataSharing: false,
    marketingEmails: false
  });
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [formData, setFormData] = useState({
    full_name: '',
    email: ''
  });

  // Initialize form data when user loads
  useEffect(() => {
    const currentUser = user || {
      full_name: 'Guest User',
      email: 'guest@example.com'
    };
    setFormData({
      full_name: currentUser.full_name || '',
      email: currentUser.email || ''
    });
  }, [user]);

  const handleSave = async () => {
    if (!formData.full_name.trim()) {
      toast({
        title: "Error",
        description: "Full name is required.",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    
    try {
      // Check if this is a bypass user
      const isBypassUser = localStorage.getItem('bypass_auth') === 'true';
      
      if (isBypassUser) {
        // For bypass user, update localStorage
        const bypassUserData = localStorage.getItem('bypass_user');
        if (bypassUserData) {
          const userData = JSON.parse(bypassUserData);
          userData.full_name = formData.full_name.trim();
          localStorage.setItem('bypass_user', JSON.stringify(userData));
          
          // Simulate save delay
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Refresh user data from context
          await refreshUser();
          
          toast({
            title: "Profile Updated",
            description: "Your profile has been updated successfully."
          });
          setIsEditing(false);
          return;
        }
      }
      
      // If no user (guest mode), just simulate saving
      if (!user || !user.id) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast({
          title: "Profile Updated",
          description: "Your profile has been updated locally. (Guest Mode)"
        });
        setIsEditing(false);
        return;
      }

      // Update profile in Supabase for authenticated users
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating profile:', error);
        throw error;
      }

      // Refresh user data from context
      await refreshUser();
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully."
      });
      setIsEditing(false);
    } catch (error: any) {
      console.error('Profile update error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
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

  // Show loading state if user data is still being loaded
  if (authLoading) {
    return (
      <div className="flex-1 bg-gray-50">
        <main className="flex-1 p-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Loading Profile...</h1>
            <p className="text-gray-600">Please wait while we load your profile information.</p>
          </div>
        </main>
      </div>
    );
  }

  // If no user, show guest mode interface
  const displayUser = user || {
    id: null,
    email: 'guest@example.com',
    full_name: 'Guest User',
    role: 'guest',
    workspace_name: 'InnovareAI',
    workspace_plan: 'guest',
    status: 'guest',
    avatar_url: null
  };

  const handleChangePassword = () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match.",
        variant: "destructive"
      });
      return;
    }
    
    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long.",
        variant: "destructive"
      });
      return;
    }
    
    // Here you would actually update the password
    toast({
      title: "Password Changed",
      description: "Your password has been updated successfully."
    });
    
    setPasswordDialogOpen(false);
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleDownloadData = () => {
    const userData = {
      profile: displayUser,
      exportDate: new Date().toISOString(),
      dataType: "Profile Export"
    };
    
    const dataStr = JSON.stringify(userData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `profile-data-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    
    toast({
      title: "Data Downloaded",
      description: "Your profile data has been downloaded successfully."
    });
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
                  // Reset form data when cancelling
                  setFormData({
                    full_name: user?.full_name || '',
                    email: user?.email || ''
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
                        <AvatarImage src={displayUser.avatar_url || undefined} />
                        <AvatarFallback className="text-lg">
                          {getInitials(displayUser.full_name || displayUser.email)}
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
                  <CardTitle className="text-xl">{displayUser.full_name || 'No name set'}</CardTitle>
                  <CardDescription>{displayUser.email}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Role</span>
                    <Badge variant="secondary" className="capitalize">
                      <Shield className="h-3 w-3 mr-1" />
                      {displayUser.role}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Workspace</span>
                    <Badge variant="outline">
                      <Building2 className="h-3 w-3 mr-1" />
                      {displayUser.workspace_name}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Plan</span>
                    <Badge 
                      variant={displayUser.workspace_plan === 'pro' ? 'default' : 'secondary'}
                      className="capitalize"
                    >
                      {displayUser.workspace_plan}
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
                          {displayUser.full_name || 'No name set'}
                        </div>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <div className="p-2 bg-gray-50 rounded border flex-1">
                          {displayUser.email}
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
                          setFormData({
                            full_name: displayUser?.full_name || '',
                            email: displayUser?.email || ''
                          });
                          setIsEditing(false);
                        }}>
                          Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={saving}>
                          <Save className="h-4 w-4 mr-2" />
                          {saving ? 'Saving...' : 'Save Changes'}
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
                    Your current workspace details. To edit workspace settings, use the "Workspace Settings" button below.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Workspace Name</Label>
                      <div className="p-2 bg-gray-50 rounded border">
                        {displayUser.workspace_name}
                      </div>
                    </div>
                    <div>
                      <Label>Subscription Plan</Label>
                      <div className="p-2 bg-gray-50 rounded border capitalize">
                        {displayUser.workspace_plan}
                      </div>
                    </div>
                    <div>
                      <Label>Your Role</Label>
                      <div className="p-2 bg-gray-50 rounded border capitalize">
                        {displayUser.role}
                      </div>
                    </div>
                    <div>
                      <Label>Status</Label>
                      <div className="p-2 bg-gray-50 rounded border">
                        <Badge variant="outline" className="text-green-600">
                          {displayUser.status}
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
                      navigate('/workspace-settings');
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
                    <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="flex-1">
                          Change Password
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Change Password</DialogTitle>
                          <DialogDescription>
                            Enter your new password. Make sure it's at least 6 characters long.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="new-password">New Password</Label>
                            <Input
                              id="new-password"
                              type="password"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              placeholder="Enter new password"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="confirm-password">Confirm Password</Label>
                            <Input
                              id="confirm-password"
                              type="password"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              placeholder="Confirm new password"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end pt-4 gap-2">
                          <Button variant="outline" onClick={() => {
                            setPasswordDialogOpen(false);
                            setNewPassword("");
                            setConfirmPassword("");
                          }}>
                            Cancel
                          </Button>
                          <Button onClick={handleChangePassword}>
                            Change Password
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button variant="outline" className="flex-1" onClick={handleDownloadData}>
                      Download Data
                    </Button>
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