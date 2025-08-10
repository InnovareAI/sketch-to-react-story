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
  Trash
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function WorkspaceSettings() {
  const { toast } = useToast();
  const [isConversational, setIsConversational] = useState(false);
  const [inactiveDates, setInactiveDates] = useState([
    { id: 1, date: "25 Dec, 2023 - 25 Dec, 2023", label: "Christmas Day" },
    { id: 2, date: "01 Jan, 2024 - 01 Jan, 2024", label: "New Year's Day" }
  ]);
  const [weeklyHours, setWeeklyHours] = useState({
    monday: { start: "7:00", end: "22:00" },
    tuesday: { start: "7:00", end: "22:00" },
    wednesday: { start: "7:00", end: "22:00" },
    thursday: { start: "7:00", end: "22:00" },
    friday: { start: "7:00", end: "22:00" },
    saturday: { start: "10:00", end: "19:00" },
    sunday: { start: "11:30", end: "17:00" }
  });
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

  const handleAddInactiveDate = () => {
    const newDate = {
      id: Date.now(),
      date: "Select date range",
      label: "New inactive period"
    };
    setInactiveDates(prev => [...prev, newDate]);
  };

  const handleRemoveInactiveDate = (dateId: number) => {
    setInactiveDates(prev => prev.filter(date => date.id !== dateId));
  };

  const handleTimeChange = (day: string, timeType: 'start' | 'end', value: string) => {
    setWeeklyHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day as keyof typeof prev],
        [timeType]: value
      }
    }));
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
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="linkedin">LinkedIn Account</TabsTrigger>
            <TabsTrigger value="email">Email Account</TabsTrigger>
            <TabsTrigger value="whatsapp">WhatsApp Account</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

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

          <TabsContent value="linkedin" className="space-y-6">
            {/* LinkedIn Account Header */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Linkedin className="h-5 w-5 text-blue-600" />
                      LinkedIn Settings: Dr. Stephanie Gripne
                    </CardTitle>
                    <CardDescription>
                      Jump into page...
                    </CardDescription>
                  </div>
                  <Button onClick={handleConnectLinkedin} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add new
                  </Button>
                </div>
              </CardHeader>
            </Card>

            {/* LinkedIn account limit */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  LinkedIn account limit
                </CardTitle>
                <CardDescription>Set up LinkedIn account limit</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Daily Connection Requests</Label>
                    <p className="text-sm text-muted-foreground">Maximum connection requests per day</p>
                  </div>
                  <Input type="number" defaultValue="20" className="w-20" />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Daily Messages</Label>
                    <p className="text-sm text-muted-foreground">Maximum messages per day</p>
                  </div>
                  <Input type="number" defaultValue="50" className="w-20" />
                </div>
              </CardContent>
            </Card>

            {/* Activity schedule settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Activity schedule settings
                </CardTitle>
                <CardDescription>Set daily active hours and choose specific inactive dates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* LinkedIn Account Time Zone */}
                <div className="space-y-4">
                  <div>
                    <Label className="text-base font-semibold">LinkedIn Account Time Zone</Label>
                    <p className="text-sm text-muted-foreground">Select time zone that is natural for activity for this LinkedIn account.</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="space-y-2">
                      <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                        <option value="US/Mountain">US/Mountain</option>
                        <option value="US/Pacific">US/Pacific</option>
                        <option value="US/Central">US/Central</option>
                        <option value="US/Eastern">US/Eastern</option>
                        <option value="Europe/London">Europe/London</option>
                      </select>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium">15:45 PM</span> local time
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Weekly Active Hours */}
                <div className="space-y-4">
                  <div>
                    <Label className="text-base font-semibold">Weekly Active Hours</Label>
                    <p className="text-sm text-muted-foreground">Set the hours when campaign messages are sent and searches auto-reload. Use your typical work hours for a natural, human-like pattern. Actions will only run during this time.</p>
                  </div>

                  <div className="space-y-3">
                    {Object.entries(weeklyHours).map(([day, times]) => (
                      <div key={day} className="grid grid-cols-4 gap-4 items-center py-2">
                        <div className="font-medium capitalize flex items-center gap-2">
                          {day === 'sunday' && <Badge variant="secondary" className="text-xs">Today</Badge>}
                          {day}
                        </div>
                        <div className="flex items-center gap-2">
                          <Input 
                            type="time" 
                            value={times.start}
                            onChange={(e) => handleTimeChange(day, 'start', e.target.value)}
                            className="w-24"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Input 
                            type="time" 
                            value={times.end}
                            onChange={(e) => handleTimeChange(day, 'end', e.target.value)}
                            className="w-24"
                          />
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {day.charAt(0).toUpperCase() + day.slice(1)}
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button className="w-fit">Apply</Button>
                </div>

                <Separator />

                {/* Send direct messages only during account active times */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Send direct messages only during account active times</Label>
                    <p className="text-sm text-muted-foreground">Restrict message sending to active hours only</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <Separator />

                {/* Additional Inactive Days */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-semibold">Additional Inactive Days</Label>
                      <p className="text-sm text-muted-foreground">Add specific dates (like holidays or time off) when automated actions should pause — even if they fall within active hours.</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleAddInactiveDate}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Inactive
                    </Button>
                  </div>

                  {inactiveDates.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            Select all
                          </Button>
                          <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                            <Trash className="h-4 w-4 mr-2" />
                            Delete selected
                          </Button>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Inactive Date Range</Label>
                        <div className="mt-2 space-y-2">
                          {inactiveDates.map((inactiveDate) => (
                            <div key={inactiveDate.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex items-center gap-3">
                                <input type="checkbox" className="h-4 w-4" />
                                <div>
                                  <div className="font-medium text-sm">{inactiveDate.date}</div>
                                  {inactiveDate.label && (
                                    <div className="text-xs text-muted-foreground">{inactiveDate.label}</div>
                                  )}
                                </div>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleRemoveInactiveDate(inactiveDate.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t">
                        <span className="text-sm text-muted-foreground">50 / Page</span>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">Previous</Button>
                          <Button variant="outline" size="sm">Next</Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Proxy location */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Proxy location
                </CardTitle>
                <CardDescription>Manage your dedicated IP address easily even while traveling</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    In order to assure a secure connection from us to your LinkedIn account we provide a dedicated IP address which will only be used for your account.
                  </p>
                  
                  <div className="space-y-3">
                    <Label className="text-base font-medium">Select the country for proxy you want to run your LinkedIn</Label>
                    
                    <div className="space-y-2">
                      <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                        <option value="US">United States</option>
                        <option value="CA">Canada</option>
                        <option value="UK">United Kingdom</option>
                        <option value="DE">Germany</option>
                        <option value="FR">France</option>
                        <option value="IT">Italy</option>
                        <option value="ES">Spain</option>
                        <option value="NL">Netherlands</option>
                        <option value="AU">Australia</option>
                        <option value="JP">Japan</option>
                        <option value="SG">Singapore</option>
                        <option value="BR">Brazil</option>
                        <option value="IN">India</option>
                      </select>
                      
                      <div className="text-xs text-muted-foreground">
                        <span className="underline cursor-pointer hover:text-foreground">Can't find your country?</span>
                      </div>
                    </div>
                  </div>

                  <Button className="w-fit">Apply</Button>
                </div>
              </CardContent>
            </Card>

            {/* Integrations Apps */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link className="h-5 w-5" />
                  Integrations Apps
                </CardTitle>
                <CardDescription>Here, you can easily set up and manage integrations between Innovareai and other applications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                        <Mail className="h-4 w-4 text-blue-600" />
                      </div>
                      <span className="font-medium">Email Integration</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">Connect your email for seamless outreach</p>
                    <Button variant="outline" size="sm">Configure</Button>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center">
                        <MessageCircle className="h-4 w-4 text-green-600" />
                      </div>
                      <span className="font-medium">CRM Integration</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">Sync contacts with your CRM system</p>
                    <Button variant="outline" size="sm">Configure</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Webhooks */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Webhook className="h-5 w-5" />
                  Webhooks
                </CardTitle>
                <CardDescription>With webhooks you can easily notify another system when the contact accepted your request or replied to a messenger campaign. The webhook will include the contact information that is available at that moment.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="webhook-url">Webhook URL</Label>
                  <Input id="webhook-url" placeholder="https://your-app.com/webhook" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Connection Accepted Webhook</Label>
                    <p className="text-sm text-muted-foreground">Trigger when someone accepts your connection request</p>
                  </div>
                  <Switch />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Message Reply Webhook</Label>
                    <p className="text-sm text-muted-foreground">Trigger when someone replies to your message</p>
                  </div>
                  <Switch />
                </div>
                <Button>Save Webhook Settings</Button>
              </CardContent>
            </Card>

            {/* Blacklists */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserX className="h-5 w-5" />
                  Blacklists
                </CardTitle>
                <CardDescription>The blacklist feature provides opportunity to block outreaching specific people by different criteria</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Blacklisted Domains</Label>
                  <Input placeholder="example.com, spam-domain.com" />
                  <p className="text-xs text-muted-foreground">Comma-separated list of domains to exclude</p>
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label>Blacklisted Companies</Label>
                  <Input placeholder="Company A, Company B" />
                  <p className="text-xs text-muted-foreground">Comma-separated list of companies to exclude</p>
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label>Blacklisted Keywords</Label>
                  <Input placeholder="competitor, not interested" />
                  <p className="text-xs text-muted-foreground">Exclude profiles containing these keywords</p>
                </div>
                <Button>Save Blacklist Settings</Button>
              </CardContent>
            </Card>

            {/* General settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  General settings
                </CardTitle>
                <CardDescription>Here you select whether this is your default account.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Set as Default Account</Label>
                    <p className="text-sm text-muted-foreground">Use this account for all new campaigns</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-pause on Warnings</Label>
                    <p className="text-sm text-muted-foreground">Automatically pause activity when LinkedIn shows warnings</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>

            {/* Disconnect LinkedIn Account */}
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <XCircle className="h-5 w-5" />
                  Disconnect LinkedIn Account
                </CardTitle>
                <CardDescription>Here you can disconnect your LinkedIn Account</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-destructive/10 p-4 rounded-lg mb-4">
                  <p className="text-sm text-destructive font-medium mb-2">⚠️ Warning</p>
                  <p className="text-sm text-muted-foreground">
                    Disconnecting your LinkedIn account will stop all active campaigns and remove access to this account. 
                    This action cannot be undone.
                  </p>
                </div>
                <Button variant="destructive" onClick={() => handleRemoveAccount(1)}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Disconnect Account
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="email" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-blue-600" />
                  Email Account Settings
                </CardTitle>
                <CardDescription>Configure your email accounts for outreach campaigns</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-address">Email Address</Label>
                  <Input id="email-address" type="email" placeholder="your.email@company.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp-server">SMTP Server</Label>
                  <Input id="smtp-server" placeholder="smtp.gmail.com" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="smtp-port">SMTP Port</Label>
                    <Input id="smtp-port" type="number" defaultValue="587" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="encryption">Encryption</Label>
                    <Input id="encryption" defaultValue="TLS" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-password">App Password</Label>
                  <Input id="email-password" type="password" placeholder="Enter app password" />
                </div>
                <Button>Connect Email Account</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="whatsapp" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-green-600" />
                  WhatsApp Account Settings
                </CardTitle>
                <CardDescription>Configure WhatsApp Business API for messaging campaigns</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="whatsapp-number">Phone Number</Label>
                  <Input id="whatsapp-number" type="tel" placeholder="+1 (555) 123-4567" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="business-account-id">Business Account ID</Label>
                  <Input id="business-account-id" placeholder="Enter WhatsApp Business Account ID" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="access-token">Access Token</Label>
                  <Input id="access-token" type="password" placeholder="Enter WhatsApp Business API token" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Message Templates</Label>
                    <p className="text-sm text-muted-foreground">Use pre-approved message templates</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Button>Connect WhatsApp Account</Button>
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