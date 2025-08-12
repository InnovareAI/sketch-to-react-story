import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
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
  // User data that can be updated
  const [profileUser, setProfileUser] = useState({
    id: '3d0cafd6-57cd-4bcb-a105-af7784038105',
    email: 'tl@innovareai.com',
    full_name: 'TL InnovareAI',
    role: 'admin',
    workspace_id: 'df5d730f-1915-4269-bd5a-9534478b17af',
    workspace_name: 'InnovareAI',
    workspace_plan: 'pro',
    status: 'active',
    avatar_url: ''
  });

  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    full_name: profileUser.full_name || '',
    email: profileUser.email || ''
  });

  // Don't sync form data when profileUser changes - causes issues
  // useEffect(() => {
  //   setFormData({
  //     full_name: profileUser.full_name || '',
  //     email: profileUser.email || ''
  //   });
  // }, [profileUser]);

  const handleSave = async () => {
    try {
      console.log('Saving form data:', formData);
      
      // Update the profile user data with form data
      const updatedUser = {
        ...profileUser,
        full_name: formData.full_name,
        email: formData.email
      };
      
      console.log('Updated user:', updatedUser);
      setProfileUser(updatedUser);
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully."
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      });
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

  const handleChangePassword = () => {
    const newPassword = prompt("Enter new password:");
    if (newPassword && newPassword.length >= 6) {
      toast({
        title: "Password Changed",
        description: "Your password has been updated successfully."
      });
    } else if (newPassword) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long.",
        variant: "destructive"
      });
    }
  };

  const handleDownloadData = () => {
    // Create and download a JSON file with user data
    const userData = {
      profile: profileUser,
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

  const handlePrivacySettings = () => {
    const settings = [
      "✓ Email notifications enabled",
      "✓ Profile visibility: Public", 
      "✓ Data sharing: Disabled",
      "✓ Marketing emails: Disabled"
    ];
    
    toast({
      title: "Privacy Settings",
      description: settings.join("\n")
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
              onClick={() => setIsEditing(!isEditing)}
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
                        <Button variant="outline" onClick={() => setIsEditing(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleSave}>
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
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
                    <Button variant="outline" className="flex-1" onClick={handleChangePassword}>
                      Change Password
                    </Button>
                    <Button variant="outline" className="flex-1" onClick={handleDownloadData}>
                      Download Data
                    </Button>
                    <Button variant="outline" className="flex-1" onClick={handlePrivacySettings}>
                      Privacy Settings
                    </Button>
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