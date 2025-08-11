import React, { useState } from "react";
import { WorkspaceHeader } from "@/components/workspace/WorkspaceHeader";
import { WorkspaceSidebar } from "@/components/workspace/WorkspaceSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
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
import { LLMSettings } from "@/components/settings/LLMSettings";
import { TeamAccountsSettings } from "@/components/settings/TeamAccountsSettings";
import { LinkedInAccountConnection } from "@/components/settings/LinkedInAccountConnection";

export default function WorkspaceSettings() {
  const { toast } = useToast();
  const [isConversational, setIsConversational] = useState(false);

  // Handle Save Company Profile
  const handleSaveCompanyProfile = () => {
    toast({
      title: "Company Profile Saved",
      description: "Your company profile information has been updated successfully.",
    });
  };

  return (
    <SidebarProvider open={true} onOpenChange={() => {}}>
      <div className="min-h-screen flex w-full bg-gray-50">
        <WorkspaceSidebar isConversational={isConversational} />
        <div className="flex-1 flex flex-col">
          <WorkspaceHeader isConversational={isConversational} onToggleMode={setIsConversational} />
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
                              <Input id="company-name" defaultValue="Acme Corporation" />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="company-website">Website</Label>
                              <Input id="company-website" type="url" placeholder="https://acme.com" />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="industry">Industry</Label>
                              <select id="industry" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
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
                              <select id="company-size" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
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
                              <Input id="phone" type="tel" placeholder="+1 (555) 123-4567" />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="email">Business Email</Label>
                              <Input id="email" type="email" placeholder="contact@acme.com" />
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="address">Address</Label>
                            <Input id="address" placeholder="123 Business Street, City, State 12345" />
                          </div>
                        </div>

                        <Separator />

                        {/* Workspace Settings */}
                        <div className="space-y-4">
                          <h4 className="text-base font-semibold text-gray-900">Workspace Settings</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="workspace-name">Workspace Name</Label>
                              <Input id="workspace-name" defaultValue="Acme Corporation" />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="timezone">Timezone</Label>
                              <select id="timezone" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
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

                        <Button onClick={handleSaveCompanyProfile} className="w-fit">Save Company Profile</Button>
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
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Mail className="h-5 w-5 text-blue-600" />
                          Email Account Settings
                        </CardTitle>
                        <CardDescription>Configure your email accounts for outreach campaigns</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-10 h-10 bg-red-100 rounded flex items-center justify-center">
                                <Mail className="h-5 w-5 text-red-600" />
                              </div>
                              <div>
                                <h3 className="font-semibold">Gmail / Google Workspace</h3>
                                <p className="text-xs text-muted-foreground">Connect your Gmail account</p>
                              </div>
                            </div>
                            <Button variant="outline" size="sm" className="w-full">Configure</Button>
                          </div>
                          
                          <div className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center">
                                <Mail className="h-5 w-5 text-blue-600" />
                              </div>
                              <div>
                                <h3 className="font-semibold">Microsoft 365</h3>
                                <p className="text-xs text-muted-foreground">Connect your Microsoft 365 account</p>
                              </div>
                            </div>
                            <Button variant="outline" size="sm" className="w-full">Configure</Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Calendar Tab */}
                  <TabsContent value="calendar" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Calendar className="h-5 w-5 text-purple-600" />
                          Calendar Integration
                        </CardTitle>
                        <CardDescription>Connect your calendar accounts for scheduling and availability</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-10 h-10 bg-white rounded border flex items-center justify-center">
                                <Calendar className="h-5 w-5 text-purple-600" />
                              </div>
                              <div>
                                <h3 className="font-semibold">Google Calendar</h3>
                                <p className="text-xs text-muted-foreground">Gmail & Google Workspace integration</p>
                              </div>
                            </div>
                            <Button variant="outline" size="sm" className="w-full">Connect</Button>
                          </div>
                          
                          <div className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-10 h-10 bg-white rounded border flex items-center justify-center">
                                <Calendar className="h-5 w-5 text-blue-600" />
                              </div>
                              <div>
                                <h3 className="font-semibold">Outlook Calendar</h3>
                                <p className="text-xs text-muted-foreground">Microsoft Outlook Calendar</p>
                              </div>
                            </div>
                            <Button variant="outline" size="sm" className="w-full">Connect</Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
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
      </div>
    </SidebarProvider>
  );
}