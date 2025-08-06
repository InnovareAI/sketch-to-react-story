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
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function WorkspaceSettings() {
  const { toast } = useToast();
  const [isConversational, setIsConversational] = useState(false);
  const [linkedinAccounts, setLinkedinAccounts] = useState([
    {
      id: 1,
      name: "John Doe",
      email: "john.doe@company.com",
      profileUrl: "linkedin.com/in/johndoe",
      status: "active",
      connectedAt: "2024-01-15",
      messagesSent: 245,
      connectionsAdded: 89
    },
    {
      id: 2,
      name: "Sarah Wilson",
      email: "sarah.wilson@company.com",
      profileUrl: "linkedin.com/in/sarahwilson",
      status: "expired",
      connectedAt: "2024-01-10",
      messagesSent: 312,
      connectionsAdded: 156
    }
  ]);

  const handleConnectLinkedin = () => {
    toast({
      title: "LinkedIn Connection",
      description: "Redirecting to LinkedIn authentication...",
    });
  };

  const handleRefreshToken = (accountId: number) => {
    toast({
      title: "Token Refreshed",
      description: "LinkedIn account access token has been refreshed.",
    });
  };

  const handleRemoveAccount = (accountId: number) => {
    setLinkedinAccounts(prev => prev.filter(acc => acc.id !== accountId));
    toast({
      title: "Account Removed",
      description: "LinkedIn account has been disconnected.",
      variant: "destructive"
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Active</Badge>;
      case "expired":
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Expired</Badge>;
      case "warning":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><AlertCircle className="h-3 w-3 mr-1" />Warning</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <WorkspaceSidebar />
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
        <Tabs defaultValue="linkedin" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="linkedin">LinkedIn Accounts</TabsTrigger>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="linkedin" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Linkedin className="h-5 w-5 text-blue-600" />
                      LinkedIn Accounts
                    </CardTitle>
                    <CardDescription>
                      Manage your LinkedIn accounts for outreach campaigns
                    </CardDescription>
                  </div>
                  <Button onClick={handleConnectLinkedin} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Connect LinkedIn Account
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {linkedinAccounts.map((account) => (
                    <div key={account.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <Linkedin className="h-6 w-6 text-blue-600" />
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">{account.name}</h3>
                              {getStatusBadge(account.status)}
                            </div>
                            <p className="text-sm text-muted-foreground">{account.email}</p>
                            <p className="text-sm text-blue-600">{account.profileUrl}</p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>Connected: {account.connectedAt}</span>
                              <span>Messages: {account.messagesSent}</span>
                              <span>Connections: {account.connectionsAdded}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {account.status === "expired" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRefreshToken(account.id)}
                              className="flex items-center gap-1"
                            >
                              <RefreshCw className="h-3 w-3" />
                              Refresh
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveAccount(account.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {linkedinAccounts.length === 0 && (
                    <div className="text-center py-8">
                      <Linkedin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-medium mb-2">No LinkedIn accounts connected</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Connect your LinkedIn accounts to start sending personalized outreach campaigns
                      </p>
                      <Button onClick={handleConnectLinkedin}>
                        Connect Your First Account
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>LinkedIn Settings</CardTitle>
                <CardDescription>Configure LinkedIn automation preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Daily Message Limit</Label>
                    <p className="text-sm text-muted-foreground">Maximum messages per account per day</p>
                  </div>
                  <Input type="number" defaultValue="50" className="w-20" />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto Accept Connections</Label>
                    <p className="text-sm text-muted-foreground">Automatically accept connection requests</p>
                  </div>
                  <Switch />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Smart Delays</Label>
                    <p className="text-sm text-muted-foreground">Add random delays between actions</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Workspace Information
                </CardTitle>
                <CardDescription>Update your workspace details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="workspace-name">Workspace Name</Label>
                  <Input id="workspace-name" defaultValue="Acme Corporation" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="workspace-domain">Domain</Label>
                  <Input id="workspace-domain" defaultValue="acme.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Input id="timezone" defaultValue="UTC-5 (Eastern Time)" />
                </div>
                <Button>Save Changes</Button>
              </CardContent>
            </Card>
          </TabsContent>

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
                <Separator />
                <div className="space-y-2">
                  <Label>Session Timeout</Label>
                  <Input defaultValue="24 hours" />
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