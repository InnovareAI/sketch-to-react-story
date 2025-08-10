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
  Upload
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function WorkspaceSettings() {
  const { toast } = useToast();
  const [isConversational, setIsConversational] = useState(false);
  const [linkedinActiveSection, setLinkedinActiveSection] = useState("account-header");
  const [inactiveDates, setInactiveDates] = useState([
    { id: 1, date: "25 Dec, 2023 - 25 Dec, 2023", label: "Christmas Day" },
    { id: 2, date: "01 Jan, 2024 - 01 Jan, 2024", label: "New Year's Day" }
  ]);
  const [webhooks, setWebhooks] = useState([
    {
      id: 1,
      name: "Reply Messages",
      event: "Contact Replied",
      campaign: "Any campaign",
      tags: "No Contact tagged",
      targetUrl: "https://hook.eu1.make.com/8ydxmrgu1zrxpc7kuuan8mltk0me0kdj",
      sendAllAtOnce: true,
      timeDelta: "1 hour",
      active: true,
      description: "Whos Who - Contact Replied to Campaign Message"
    }
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
    // Show confirmation dialog first
    const confirmed = confirm("Are you sure you want to cancel your subscription and disconnect this LinkedIn account? This action cannot be undone.");
    
    if (confirmed) {
      setLinkedinAccounts(prev => prev.filter(acc => acc.id !== accountId));
      toast({
        title: "Subscription Cancelled",
        description: "LinkedIn account disconnected and subscription cancelled successfully.",
        variant: "destructive"
      });
    }
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

  const handleAddWebhook = () => {
    const newWebhook = {
      id: Date.now(),
      name: "New Webhook",
      event: "Contact Replied",
      campaign: "Any campaign",
      tags: "No Contact tagged",
      targetUrl: "",
      sendAllAtOnce: false,
      timeDelta: "Immediate",
      active: false,
      description: ""
    };
    setWebhooks(prev => [...prev, newWebhook]);
  };

  const handleToggleWebhook = (webhookId: number) => {
    setWebhooks(prev => prev.map(webhook => 
      webhook.id === webhookId 
        ? { ...webhook, active: !webhook.active }
        : webhook
    ));
  };

  const handleTestWebhook = (webhookId: number) => {
    toast({
      title: "Webhook Test",
      description: "Test webhook sent successfully",
    });
  };

  const handleRemoveWebhook = (webhookId: number) => {
    setWebhooks(prev => prev.filter(webhook => webhook.id !== webhookId));
    toast({
      title: "Webhook Removed",
      description: "Webhook has been deleted successfully",
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
            <div className="flex gap-6">
              {/* Left Navigation */}
              <div className="w-64 flex-shrink-0">
                <Card>
                  <CardContent className="p-4">
                    <nav className="space-y-1">
                      {[
                        { id: "account-header", label: "LinkedIn Settings", icon: Linkedin },
                        { id: "account-limit", label: "LinkedIn account limit", icon: Users },
                        { id: "activity-schedule", label: "Activity schedule settings", icon: Clock },
                        { id: "proxy-location", label: "Proxy location", icon: MapPin },
                        { id: "integrations", label: "Integrations Apps", icon: Link },
                        { id: "webhooks", label: "Webhooks", icon: Webhook },
                        { id: "blacklists", label: "Blacklists", icon: UserX },
                        { id: "general-settings", label: "General settings", icon: Settings },
                        { id: "disconnect", label: "Disconnect LinkedIn Account", icon: XCircle }
                      ].map((section) => {
                        const Icon = section.icon;
                        return (
                          <button
                            key={section.id}
                            onClick={() => setLinkedinActiveSection(section.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors text-sm ${
                              linkedinActiveSection === section.id
                                ? "bg-blue-50 text-blue-700 border border-blue-200"
                                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                            }`}
                          >
                            <Icon className="h-4 w-4 flex-shrink-0" />
                            <span className="font-medium leading-tight">{section.label}</span>
                          </button>
                        );
                      })}
                    </nav>
                  </CardContent>
                </Card>
              </div>

              {/* Right Content Area */}
              <div className="flex-1">
                {linkedinActiveSection === "account-header" && (
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
                )}

                {linkedinActiveSection === "account-limit" && (
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
                )}

                {linkedinActiveSection === "activity-schedule" && (
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
                )}

                {linkedinActiveSection === "proxy-location" && (
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

                  <Button className="w-fit">Apply Proxy Settings</Button>
                </div>
              </CardContent>
                  </Card>
                )}

                {linkedinActiveSection === "integrations" && (
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
                )}

                {linkedinActiveSection === "webhooks" && (
                  <Card>
                    <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Webhook className="h-5 w-5" />
                      Webhooks
                    </CardTitle>
                    <CardDescription>With webhooks you can easily notify another system when the contact accepted your request or replied to a messenger campaign. The webhook will include the contact information that is available at that moment.</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      WebhooksHistory
                    </Button>
                    <Button onClick={handleAddWebhook} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add a webhook
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <Input 
                    placeholder="Type to search" 
                    className="max-w-md"
                  />
                  
                  {webhooks.length > 0 && (
                    <div className="space-y-4">
                      {/* Headers */}
                      <div className="grid grid-cols-8 gap-4 text-xs font-medium text-muted-foreground border-b pb-2">
                        <div>Event type</div>
                        <div>Active</div>
                        <div>Test</div>
                        <div>Name</div>
                        <div>Event</div>
                        <div>Campaign</div>
                        <div>Tags</div>
                        <div>Target URL</div>
                      </div>

                      {/* Webhook rows */}
                      {webhooks.map((webhook) => (
                        <div key={webhook.id} className="space-y-4 border-b pb-4 last:border-b-0">
                          <div className="grid grid-cols-8 gap-4 items-center text-sm">
                            <div className="text-muted-foreground">-</div>
                            <div>
                              <Switch 
                                checked={webhook.active}
                                onCheckedChange={() => handleToggleWebhook(webhook.id)}
                              />
                            </div>
                            <div>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleTestWebhook(webhook.id)}
                              >
                                Test
                              </Button>
                            </div>
                            <div className="font-medium">{webhook.name}</div>
                            <div>{webhook.event}</div>
                            <div className="text-muted-foreground">{webhook.campaign}</div>
                            <div className="text-muted-foreground">{webhook.tags}</div>
                            <div className="font-mono text-xs text-blue-600 truncate">
                              {webhook.targetUrl}
                            </div>
                          </div>
                          
                          {/* Additional details row */}
                          <div className="grid grid-cols-8 gap-4 text-xs text-muted-foreground">
                            <div></div>
                            <div></div>
                            <div></div>
                            <div>Send all at once</div>
                            <div>Time delta</div>
                            <div>Actions</div>
                            <div></div>
                            <div></div>
                          </div>
                          
                          <div className="grid grid-cols-8 gap-4 items-center text-sm">
                            <div></div>
                            <div></div>
                            <div></div>
                            <div>
                              <Switch 
                                checked={webhook.sendAllAtOnce}
                                size="sm"
                              />
                            </div>
                            <div className="font-medium">{webhook.timeDelta}</div>
                            <div>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleRemoveWebhook(webhook.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            <div></div>
                            <div></div>
                          </div>

                          {webhook.description && (
                            <div className="text-sm text-muted-foreground pl-4 border-l-2 border-muted">
                              {webhook.description}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {webhooks.length === 0 && (
                    <div className="text-center py-8">
                      <Webhook className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-medium mb-2">No webhooks configured</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Add webhooks to receive real-time notifications about campaign events
                      </p>
                      <Button onClick={handleAddWebhook}>
                        Add Your First Webhook
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
                  </Card>
                )}

                {linkedinActiveSection === "blacklists" && (
                  <Card>
                    <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <UserX className="h-5 w-5" />
                      Blacklists
                    </CardTitle>
                    <CardDescription>The blacklist feature provides opportunity to block outreaching specific people by different criteria</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload CSV
                    </Button>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add blacklist
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800 leading-relaxed">
                      With the blacklist feature you can easily add companies which you want to ignore connecting to. You can set this up per company or per linkedin account. The moment you'll try to assign people to a campaign, or when the system reaches out to them on linkedin it will recognize the blacklisted company, first name, last name, job title or profile link and stop the request.
                    </p>
                    <p className="text-sm text-blue-700 mt-3 font-medium">
                      <strong>Important note:</strong> When overriding company name in dynamic placeholders, we only take 'company_name', 'first_name', 'last_name', 'job_title' or 'profile_link' into consideration for the blacklist feature.
                    </p>
                  </div>

                  <Input 
                    placeholder="Type to search" 
                    className="max-w-md"
                  />

                  {/* Blacklist table headers */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-5 gap-4 text-xs font-medium text-muted-foreground border-b pb-2">
                      <div>Blacklist type</div>
                      <div>Comparison type</div>
                      <div>Keyword</div>
                      <div>Comparison type</div>
                      <div>Actions</div>
                    </div>

                    {/* Sample blacklist entry */}
                    <div className="grid grid-cols-5 gap-4 items-center text-sm border-b pb-4">
                      <div className="font-medium">Profile link</div>
                      <div className="text-muted-foreground">Contains</div>
                      <div className="font-mono text-xs text-blue-600 break-all">
                        https://www.linkedin.com/in/margaret-herzog-pe-pmp-phd/
                      </div>
                      <div className="text-muted-foreground">Contains</div>
                      <div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Add new blacklist form */}
                    <div className="border rounded-lg p-4 bg-muted/30">
                      <h4 className="font-medium mb-3">Add New Blacklist Rule</h4>
                      <div className="grid grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <Label>Blacklist Type</Label>
                          <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                            <option value="profile_link">Profile link</option>
                            <option value="company_name">Company name</option>
                            <option value="first_name">First name</option>
                            <option value="last_name">Last name</option>
                            <option value="job_title">Job title</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label>Comparison Type</Label>
                          <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                            <option value="contains">Contains</option>
                            <option value="equals">Equals</option>
                            <option value="starts_with">Starts with</option>
                            <option value="ends_with">Ends with</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label>Keyword/Value</Label>
                          <Input placeholder="Enter keyword or value to blacklist" />
                        </div>
                        <div className="space-y-2">
                          <Label className="invisible">Action</Label>
                          <Button className="w-full">Add Rule</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
                  </Card>
                )}

                {linkedinActiveSection === "general-settings" && (
                  <Card>
                    <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  General settings
                </CardTitle>
                <CardDescription>Here you select whether this is your default account.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* LinkedIn Security (2FA) */}
                <div className="space-y-4">
                  <div>
                    <Label className="text-base font-semibold">LinkedIn Security (2FA)</Label>
                    <p className="text-sm text-muted-foreground">Keep your LinkedIn account securely connected and avoid unexpected logouts by activating two-step verification.</p>
                  </div>
                  
                  <div className="border rounded-lg p-4 space-y-4">
                    <div>
                      <h4 className="font-medium">Activate LinkedIn two-step verification</h4>
                      <p className="text-sm text-muted-foreground">Secure your LinkedIn connection and prevent disruptions by activating the two-step verification.</p>
                    </div>
                    <Button variant="outline">Set up</Button>
                  </div>
                </div>

                <Separator />

                {/* Switch LinkedIn account company */}
                <div className="space-y-4">
                  <div>
                    <Label className="text-base font-semibold">Switch LinkedIn account company</Label>
                    <p className="text-sm text-muted-foreground">Here, you can switch your LinkedIn account to another company. Performing this action all of your campaigns will be moved to the new company</p>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <select className="flex h-10 w-full max-w-md rounded-md border border-input bg-background px-3 py-2 text-sm">
                      <option value="impact-finance">Impact Finance Center</option>
                      <option value="company-b">Company B</option>
                      <option value="company-c">Company C</option>
                    </select>
                    <Button>Apply</Button>
                  </div>
                </div>

                <Separator />

                {/* Ignore titles */}
                <div className="space-y-4">
                  <div>
                    <Label className="text-base font-semibold">Ignore titles</Label>
                    <p className="text-sm text-muted-foreground">This setting allows Innovareai to automatically skip formal titles, such as "Mr.", "Dr.", "MD." and others if they are included in the contact's first, middle, or last name.</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="ignore-name">Name</Label>
                      <Input id="ignore-name" placeholder="Please, write name here" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ignore-job-title">Job title</Label>
                      <Input id="ignore-job-title" placeholder="Please, write job title here" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ignore-company-name">Company name</Label>
                      <Input id="ignore-company-name" placeholder="Please, write company name here" />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Default LinkedIn account */}
                <div className="space-y-4">
                  <div>
                    <Label className="text-base font-semibold">Default LinkedIn account</Label>
                    <p className="text-sm text-muted-foreground">Here, you select whether this is your default account. This will be the account that you will be using after logging in. The default account can be recognized by the star displayed next to it.</p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Make this the default LinkedIn account (after login)</Label>
                      <p className="text-sm text-muted-foreground">Use this account for all new campaigns and as primary login</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>

                <Separator />

                {/* Auto-pause on Warnings */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-pause on Warnings</Label>
                    <p className="text-sm text-muted-foreground">Automatically pause activity when LinkedIn shows warnings</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
                  </Card>
                )}

                {linkedinActiveSection === "disconnect" && (
                  <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <XCircle className="h-5 w-5" />
                  Disconnect LinkedIn Account
                </CardTitle>
                <CardDescription>Here you can disconnect your LinkedIn Account</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-destructive/10 p-4 rounded-lg">
                  <p className="text-sm text-destructive font-medium mb-2">⚠️ Warning</p>
                  <p className="text-sm text-muted-foreground">
                    Disconnecting your LinkedIn account will:
                  </p>
                  <ul className="text-sm text-muted-foreground mt-2 space-y-1 ml-4">
                    <li>• Stop all active campaigns</li>
                    <li>• Remove access to this account</li>
                    <li>• Cancel your subscription</li>
                    <li>• This action cannot be undone</li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-base font-semibold">Current Subscription</Label>
                    <div className="mt-2 p-4 border rounded-lg bg-muted/30">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Plan Name: By invoice</p>
                          <p className="text-sm text-muted-foreground">Your current subscription details</p>
                        </div>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Active
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                      <div className="flex items-start gap-3">
                        <div className="text-orange-600 mt-0.5">
                          <AlertCircle className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm text-orange-800 font-medium">Unipile Integration</p>
                          <p className="text-sm text-orange-700 mt-1">
                            This action will also remove your subscription from Unipile and cancel all associated services. 
                            You will need to re-subscribe through Unipile if you reconnect this account later.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <Button variant="destructive" onClick={() => handleRemoveAccount(1)} className="w-fit">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Disconnect account and cancel Unipile subscription
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
                )}
              </div>
            </div>
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