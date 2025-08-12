import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Settings,
  Building2,
  Users,
  Bell,
  Shield,
  Linkedin,
  Plus,
  Trash2,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Mail,
  MessageCircle,
  Clock,
  Globe,
  Link,
  Webhook,
  UserX,
  Calendar,
  MapPin,
  ChevronDown,
  CalendarDays,
  Trash,
  Upload,
  Brain
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
import { LLMSettings } from "@/components/settings/LLMSettings";
import { TeamAccountsSettings } from "@/components/settings/TeamAccountsSettings";
import { LinkedInAccountConnection } from "@/components/settings/LinkedInAccountConnection";
import { EmailAccountConnection } from "@/components/settings/EmailAccountConnection";
import { CalendarIntegration } from "@/components/settings/CalendarIntegration";

export default function WorkspaceSettings() {
  const { toast } = useToast();
  const { user, refreshUser } = useAuth();
  const { workspace, workspaceId, refreshWorkspace } = useWorkspace();
  const [loading, setLoading] = useState(false);
  
  const [workspaceData, setWorkspaceData] = useState({
    companyName: '',
    workspaceName: '',
    website: '',
    industry: '',
    companySize: '',
    description: '',
    phone: '',
    email: '',
    address: '',
    timezone: 'UTC-5'
  });

  // Load workspace data when workspace changes
  useEffect(() => {
    if (workspace) {
      console.log('Loading workspace data from hook:', workspace);
      setWorkspaceData({
        companyName: workspace.name || 'My Company',
        workspaceName: workspace.name || 'My Company',
        website: workspace.settings?.website || '',
        industry: workspace.settings?.industry || '',
        companySize: workspace.settings?.companySize || '',
        description: workspace.settings?.description || '',
        phone: workspace.settings?.phone || '',
        email: workspace.settings?.email || '',
        address: workspace.settings?.address || '',
        timezone: workspace.settings?.timezone || 'UTC-5'
      });
    }
  }, [workspace]);

  // Handle input changes
  const handleInputChange = (field: string, value: string) => {
    setWorkspaceData(prev => {
      const updated = {
        ...prev,
        [field]: value
      };
      
      // Keep workspace name in sync with company name
      if (field === 'companyName') {
        updated.workspaceName = value;
      }
      
      return updated;
    });
  };

  // Handle Save Company Profile
  const handleSaveCompanyProfile = async () => {
    if (!workspaceData.companyName.trim()) {
      toast({
        title: "Error",
        description: "Company name is required.",
        variant: "destructive"
      });
      return;
    }
    
    // Use company name as workspace name if workspace name is empty
    const finalWorkspaceName = workspaceData.workspaceName.trim() || workspaceData.companyName.trim();
    
    setLoading(true);
    
    try {
      // Check if this is a bypass user
      const isBypassUser = localStorage.getItem('bypass_auth') === 'true';
      
      if (isBypassUser) {
        // For bypass user, update localStorage
        const bypassUserData = localStorage.getItem('bypass_user');
        if (bypassUserData) {
          const userData = JSON.parse(bypassUserData);
          userData.workspace_name = finalWorkspaceName;
          localStorage.setItem('bypass_user', JSON.stringify(userData));
          
          // Also save workspace data in localStorage
          const bypassWorkspaceData = {
            id: 'bypass-workspace-id',
            name: finalWorkspaceName,
            settings: {
              website: workspaceData.website.trim(),
              industry: workspaceData.industry,
              companySize: workspaceData.companySize,
              description: workspaceData.description.trim(),
              phone: workspaceData.phone.trim(),
              email: workspaceData.email.trim(),
              address: workspaceData.address.trim(),
              timezone: workspaceData.timezone
            }
          };
          localStorage.setItem('bypass_workspace', JSON.stringify(bypassWorkspaceData));
          
          // Simulate save delay
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Refresh workspace data to update the UI
          await refreshWorkspace();
          
          // Refresh user data to update workspace name in the UI
          if (user) {
            await refreshUser();
          }
          
          toast({
            title: "Company Profile Saved",
            description: "Your company profile information has been updated successfully.",
          });
          
          setLoading(false);
          return;
        }
      }
      
      console.log('Saving workspace data:', workspaceId, 'with name:', finalWorkspaceName);
      
      const updateData = {
        name: finalWorkspaceName,
        settings: {
          website: workspaceData.website.trim(),
          industry: workspaceData.industry,
          companySize: workspaceData.companySize,
          description: workspaceData.description.trim(),
          phone: workspaceData.phone.trim(),
          email: workspaceData.email.trim(),
          address: workspaceData.address.trim(),
          timezone: workspaceData.timezone
        },
        updated_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('workspaces')
        .update(updateData)
        .eq('id', workspaceId)
        .select();
        
      console.log('Update result:', { data, error });
        
      if (error) {
        throw error;
      }
      
      // Refresh workspace data to update the UI
      await refreshWorkspace();
      
      // Refresh user data to update workspace name in the UI (if authenticated)
      if (user) {
        await refreshUser();
      }
      
      toast({
        title: "Company Profile Saved",
        description: "Your company profile information has been updated successfully.",
      });
    } catch (error: any) {
      console.error('Error saving workspace:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save company profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-gray-50">
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                  <Settings className="h-8 w-8 text-primary" />
                  <h1 className="text-3xl font-bold text-gray-900">Workspace Settings</h1>
                </div>
                <p className="text-gray-600">Manage your workspace configuration and integrations</p>
              </div>
              
              <div className="space-y-6">
                <Tabs defaultValue="general" className="w-full">
                  <TabsList className="grid w-full grid-cols-9">
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="llm">AI Models</TabsTrigger>
                    <TabsTrigger value="team-accounts">Team Accounts</TabsTrigger>
                    <TabsTrigger value="linkedin">LinkedIn</TabsTrigger>
                    <TabsTrigger value="email">Email</TabsTrigger>
                    <TabsTrigger value="calendar">Calendar</TabsTrigger>
                    <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
                    <TabsTrigger value="notifications">Notifications</TabsTrigger>
                    <TabsTrigger value="security">Security</TabsTrigger>
                  </TabsList>

                  {/* General Tab */}
                  <TabsContent value="general" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Building2 className="h-5 w-5" />
                          Company Profile
                        </CardTitle>
                        <CardDescription>Update your company and workspace details</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Basic Company Information */}
                        <div className="space-y-4">
                          <h4 className="text-base font-semibold text-gray-900">Company Information</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="company-name">Company Name</Label>
                              <Input 
                                id="company-name" 
                                value={workspaceData.companyName}
                                onChange={(e) => handleInputChange('companyName', e.target.value)}
                                placeholder="Enter your company name"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="company-website">Website</Label>
                              <Input 
                                id="company-website" 
                                type="url" 
                                value={workspaceData.website}
                                onChange={(e) => handleInputChange('website', e.target.value)}
                                placeholder="https://your-company.com" 
                              />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="industry">Industry</Label>
                              <select 
                                id="industry" 
                                value={workspaceData.industry}
                                onChange={(e) => handleInputChange('industry', e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <option value="">Select industry</option>
                                <option value="technology">Technology</option>
                                <option value="healthcare">Healthcare</option>
                                <option value="finance">Finance</option>
                                <option value="manufacturing">Manufacturing</option>
                                <option value="retail">Retail</option>
                                <option value="education">Education</option>
                                <option value="consulting">Consulting</option>
                                <option value="real-estate">Real Estate</option>
                                <option value="other">Other</option>
                              </select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="company-size">Company Size</Label>
                              <select 
                                id="company-size" 
                                value={workspaceData.companySize}
                                onChange={(e) => handleInputChange('companySize', e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <option value="">Select size</option>
                                <option value="1-10">1-10 employees</option>
                                <option value="11-50">11-50 employees</option>
                                <option value="51-200">51-200 employees</option>
                                <option value="201-500">201-500 employees</option>
                                <option value="501-1000">501-1000 employees</option>
                                <option value="1000+">1000+ employees</option>
                              </select>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="company-description">Company Description</Label>
                            <textarea 
                              id="company-description" 
                              rows={3}
                              value={workspaceData.description}
                              onChange={(e) => handleInputChange('description', e.target.value)}
                              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              placeholder="Brief description of your company and what you do"
                            />
                          </div>
                        </div>

                        <Separator />

                        {/* Contact Information */}
                        <div className="space-y-4">
                          <h4 className="text-base font-semibold text-gray-900">Contact Information</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="phone">Phone Number</Label>
                              <Input 
                                id="phone" 
                                type="tel" 
                                value={workspaceData.phone}
                                onChange={(e) => handleInputChange('phone', e.target.value)}
                                placeholder="+1 (555) 123-4567" 
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="email">Business Email</Label>
                              <Input 
                                id="email" 
                                type="email" 
                                value={workspaceData.email}
                                onChange={(e) => handleInputChange('email', e.target.value)}
                                placeholder="contact@your-company.com" 
                              />
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="address">Address</Label>
                            <Input 
                              id="address" 
                              value={workspaceData.address}
                              onChange={(e) => handleInputChange('address', e.target.value)}
                              placeholder="123 Business Street, City, State 12345" 
                            />
                          </div>
                        </div>

                        <Separator />

                        {/* Workspace Settings */}
                        <div className="space-y-4">
                          <h4 className="text-base font-semibold text-gray-900">Workspace Settings</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="workspace-name">Workspace Name</Label>
                              <Input 
                                id="workspace-name" 
                                value={workspaceData.workspaceName}
                                onChange={(e) => handleInputChange('workspaceName', e.target.value)}
                                placeholder="Enter your workspace name"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="timezone">Timezone</Label>
                              <select 
                                id="timezone" 
                                value={workspaceData.timezone}
                                onChange={(e) => handleInputChange('timezone', e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <option value="UTC-12">UTC-12 (Baker Island)</option>
                                <option value="UTC-11">UTC-11 (American Samoa)</option>
                                <option value="UTC-10">UTC-10 (Hawaii)</option>
                                <option value="UTC-9">UTC-9 (Alaska)</option>
                                <option value="UTC-8">UTC-8 (Pacific Time)</option>
                                <option value="UTC-7">UTC-7 (Mountain Time)</option>
                                <option value="UTC-6">UTC-6 (Central Time)</option>
                                <option value="UTC-5" selected>UTC-5 (Eastern Time)</option>
                                <option value="UTC-4">UTC-4 (Atlantic Time)</option>
                                <option value="UTC-3">UTC-3 (Argentina)</option>
                                <option value="UTC-2">UTC-2 (South Georgia)</option>
                                <option value="UTC-1">UTC-1 (Azores)</option>
                                <option value="UTC+0">UTC+0 (London)</option>
                                <option value="UTC+1">UTC+1 (Central Europe)</option>
                                <option value="UTC+2">UTC+2 (Eastern Europe)</option>
                                <option value="UTC+3">UTC+3 (Moscow)</option>
                                <option value="UTC+4">UTC+4 (Dubai)</option>
                                <option value="UTC+5">UTC+5 (Pakistan)</option>
                                <option value="UTC+6">UTC+6 (Bangladesh)</option>
                                <option value="UTC+7">UTC+7 (Thailand)</option>
                                <option value="UTC+8">UTC+8 (China)</option>
                                <option value="UTC+9">UTC+9 (Japan)</option>
                                <option value="UTC+10">UTC+10 (Australia East)</option>
                                <option value="UTC+11">UTC+11 (Solomon Islands)</option>
                                <option value="UTC+12">UTC+12 (New Zealand)</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        <Button 
                          onClick={handleSaveCompanyProfile} 
                          disabled={loading}
                          className="w-fit"
                        >
                          {loading ? 'Saving...' : 'Save Company Profile'}
                        </Button>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* LLM Settings Tab */}
                  <TabsContent value="llm" className="space-y-6">
                    <LLMSettings />
                  </TabsContent>
                  
                  {/* Team Accounts Tab */}
                  <TabsContent value="team-accounts" className="space-y-6">
                    <TeamAccountsSettings />
                  </TabsContent>

                  {/* LinkedIn Tab - Now using our new component */}
                  <TabsContent value="linkedin" className="space-y-6">
                    <LinkedInAccountConnection />
                  </TabsContent>

                  {/* Email Tab */}
                  <TabsContent value="email" className="space-y-6">
                    <EmailAccountConnection />
                  </TabsContent>

                  {/* Calendar Tab */}
                  <TabsContent value="calendar" className="space-y-6">
                    <CalendarIntegration />
                  </TabsContent>

                  {/* WhatsApp Tab */}
                  <TabsContent value="whatsapp" className="space-y-6">
                    <div className="relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm"></div>
                      <div className="relative bg-gradient-to-r from-green-100 to-emerald-100 border border-green-200 rounded-lg p-6 text-center">
                        <div className="flex items-center justify-center gap-3 mb-4">
                          <MessageCircle className="h-8 w-8 text-green-600" />
                          <span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                            COMING SOON
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-green-800 mb-2">WhatsApp Integration</h3>
                        <p className="text-green-700 text-sm max-w-2xl mx-auto">
                          WhatsApp Business API integration is currently under development. Soon you'll be able to connect your WhatsApp Business account for seamless messaging campaigns.
                        </p>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Notifications Tab */}
                  <TabsContent value="notifications" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Bell className="h-5 w-5" />
                          Notification Preferences
                        </CardTitle>
                        <CardDescription>Choose what notifications you want to receive</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Campaign Completion</Label>
                            <p className="text-sm text-muted-foreground">Get notified when campaigns finish</p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>New Responses</Label>
                            <p className="text-sm text-muted-foreground">Get notified of new message responses</p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Account Issues</Label>
                            <p className="text-sm text-muted-foreground">Get notified of LinkedIn account problems</p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Security Tab */}
                  <TabsContent value="security" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Shield className="h-5 w-5" />
                          Security Settings
                        </CardTitle>
                        <CardDescription>Manage your workspace security preferences</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Two-Factor Authentication</Label>
                            <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                          </div>
                          <Switch />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Login Notifications</Label>
                            <p className="text-sm text-muted-foreground">Get notified of new login attempts</p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
        </div>
      </main>
    </div>
  );
}