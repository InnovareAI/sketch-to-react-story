import { useState } from "react";
import { WorkspaceHeader } from "@/components/workspace/WorkspaceHeader";
import { WorkspaceSidebar } from "@/components/workspace/WorkspaceSidebar";
import { ConversationalInterface } from "@/components/workspace/ConversationalInterface";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Send, 
  Clock, 
  MessageSquare, 
  Search, 
  Filter, 
  Play, 
  Pause, 
  Edit,
  MoreHorizontal,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Users,
  Calendar,
  Settings,
  RefreshCw
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function MessageQueue() {
  const [isConversational, setIsConversational] = useState(false);
  const [activeTab, setActiveTab] = useState("scheduled");

  if (isConversational) {
    return (
      <SidebarProvider open={true} onOpenChange={() => {}}>
        <div className="min-h-screen flex w-full">
          <WorkspaceSidebar isConversational={isConversational} />
          <div className="flex-1 flex flex-col overflow-hidden">
            <WorkspaceHeader 
              isConversational={isConversational}
              onToggleMode={setIsConversational}
            />
            <div className="flex-1 overflow-auto">
              <ConversationalInterface />
            </div>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  // Sample message queue data
  const queuedMessages = [
    {
      id: 1,
      recipient: "Sarah Johnson",
      company: "TechFlow Inc.",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b829?w=400&h=400&fit=crop&crop=face",
      template: "Cold Outreach Template",
      scheduledFor: "Today, 2:00 PM",
      status: "scheduled",
      platform: "LinkedIn",
      campaign: "Q1 Outreach",
      message: "Hi Sarah, I noticed your work at TechFlow and would love to connect...",
      priority: "high"
    },
    {
      id: 2,
      recipient: "Michael Chen",
      company: "DataCorp",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
      template: "Follow-up Template",
      scheduledFor: "Tomorrow, 10:00 AM",
      status: "scheduled",
      platform: "Email",
      campaign: "Follow-up Campaign",
      message: "Following up on our previous conversation about data analytics...",
      priority: "medium"
    },
    {
      id: 3,
      recipient: "Emily Rodriguez",
      company: "InnovateHub",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face",
      template: "Partnership Proposal",
      scheduledFor: "In 2 hours",
      status: "sending",
      platform: "LinkedIn",
      campaign: "Partnership Outreach",
      message: "Hi Emily, I'd like to discuss a potential partnership opportunity...",
      priority: "high"
    },
    {
      id: 4,
      recipient: "David Wilson",
      company: "ScaleUp Solutions",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face",
      template: "Product Demo",
      scheduledFor: "Sent 1 hour ago",
      status: "sent",
      platform: "Email",
      campaign: "Demo Campaign",
      message: "Hi David, I'd love to show you how our platform can help...",
      priority: "medium"
    },
    {
      id: 5,
      recipient: "Lisa Thompson",
      company: "FinancePlus",
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop&crop=face",
      template: "Cold Outreach Template",
      scheduledFor: "Failed - 30 min ago",
      status: "failed",
      platform: "LinkedIn",
      campaign: "Q1 Outreach",
      message: "Hi Lisa, I came across your profile and was impressed...",
      priority: "low",
      error: "LinkedIn connection limit reached"
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "scheduled": return <Clock className="h-4 w-4 text-blue-600" />;
      case "sending": return <Send className="h-4 w-4 text-orange-600 animate-pulse" />;
      case "sent": return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "failed": return <AlertCircle className="h-4 w-4 text-red-600" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled": return "bg-blue-100 text-blue-800";
      case "sending": return "bg-orange-100 text-orange-800";
      case "sent": return "bg-green-100 text-green-800";
      case "failed": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "border-l-4 border-red-500";
      case "medium": return "border-l-4 border-yellow-500";
      case "low": return "border-l-4 border-green-500";
      default: return "border-l-4 border-gray-300";
    }
  };

  const filteredMessages = queuedMessages.filter(message => {
    if (activeTab === "all") return true;
    return message.status === activeTab;
  });

  return (
    <SidebarProvider open={true} onOpenChange={() => {}}>
      <div className="min-h-screen flex w-full bg-gray-50">
        <WorkspaceSidebar isConversational={isConversational} />
        <div className="flex-1 flex flex-col">
          <WorkspaceHeader isConversational={isConversational} onToggleMode={setIsConversational} />
          <main className="flex-1 p-8">
            <div className="max-w-7xl mx-auto">
              <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">Message Queue</h1>
                    <p className="text-gray-600 mt-1">Monitor and manage your scheduled outreach messages</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline">
                      <Filter className="h-4 w-4 mr-2" />
                      Filter
                    </Button>
                    <Button variant="outline">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                    <Button>
                      <Settings className="h-4 w-4 mr-2" />
                      Queue Settings
                    </Button>
                  </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-2xl font-bold text-gray-900">
                            {queuedMessages.filter(m => m.status === 'scheduled').length}
                          </div>
                          <div className="text-sm text-gray-600">Scheduled</div>
                        </div>
                        <Clock className="h-8 w-8 text-blue-600" />
                      </div>
                      <p className="text-xs text-blue-600 mt-2">
                        Next: in 2 hours
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-2xl font-bold text-gray-900">
                            {queuedMessages.filter(m => m.status === 'sending').length}
                          </div>
                          <div className="text-sm text-gray-600">Sending</div>
                        </div>
                        <Send className="h-8 w-8 text-orange-600" />
                      </div>
                      <p className="text-xs text-orange-600 mt-2">
                        Currently processing
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-2xl font-bold text-gray-900">
                            {queuedMessages.filter(m => m.status === 'sent').length}
                          </div>
                          <div className="text-sm text-gray-600">Sent Today</div>
                        </div>
                        <CheckCircle className="h-8 w-8 text-green-600" />
                      </div>
                      <p className="text-xs text-green-600 mt-2">
                        <TrendingUp className="h-3 w-3 inline mr-1" />
                        +12% vs yesterday
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-2xl font-bold text-gray-900">
                            {queuedMessages.filter(m => m.status === 'failed').length}
                          </div>
                          <div className="text-sm text-gray-600">Failed</div>
                        </div>
                        <AlertCircle className="h-8 w-8 text-red-600" />
                      </div>
                      <p className="text-xs text-red-600 mt-2">
                        Requires attention
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Message Queue Interface */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Message Queue</CardTitle>
                        <CardDescription>Scheduled and processed outreach messages</CardDescription>
                      </div>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search messages..."
                          className="pl-10 w-64"
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                      <TabsList>
                        <TabsTrigger value="all">All Messages ({queuedMessages.length})</TabsTrigger>
                        <TabsTrigger value="scheduled">Scheduled ({queuedMessages.filter(m => m.status === 'scheduled').length})</TabsTrigger>
                        <TabsTrigger value="sending">Sending</TabsTrigger>
                        <TabsTrigger value="sent">Sent</TabsTrigger>
                        <TabsTrigger value="failed">Failed</TabsTrigger>
                      </TabsList>

                      <TabsContent value={activeTab} className="space-y-4 mt-6">
                        {filteredMessages.map((message) => (
                          <Card key={message.id} className={`hover:shadow-md transition-shadow ${getPriorityColor(message.priority)}`}>
                            <CardContent className="p-6">
                              <div className="flex items-start gap-4">
                                <Avatar className="h-12 w-12">
                                  <AvatarImage src={message.avatar} alt={message.recipient} />
                                  <AvatarFallback className="bg-primary text-primary-foreground">
                                    {message.recipient.split(' ').map(n => n[0]).join('')}
                                  </AvatarFallback>
                                </Avatar>
                                
                                <div className="flex-1">
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <div className="flex items-center gap-2 mb-1">
                                        {getStatusIcon(message.status)}
                                        <h3 className="font-semibold text-gray-900">{message.recipient}</h3>
                                        <Badge variant="outline" className="text-xs">
                                          {message.platform}
                                        </Badge>
                                        <Badge variant="outline" className="text-xs bg-gray-50">
                                          {message.priority}
                                        </Badge>
                                      </div>
                                      <p className="text-sm text-premium-purple font-medium">{message.company}</p>
                                      <p className="text-sm text-gray-600 mb-2">Campaign: {message.campaign}</p>
                                      
                                      <div className="flex items-center gap-2 mb-3">
                                        <Badge className={getStatusColor(message.status)}>
                                          {message.status.charAt(0).toUpperCase() + message.status.slice(1)}
                                        </Badge>
                                        <span className="text-sm text-gray-500">{message.scheduledFor}</span>
                                      </div>

                                      <div className="bg-gray-50 rounded-lg p-3 mb-3">
                                        <p className="text-sm text-gray-700 font-medium mb-1">Template: {message.template}</p>
                                        <p className="text-sm text-gray-900">{message.message}</p>
                                      </div>

                                      {message.error && (
                                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                                          <p className="text-sm text-red-800">
                                            <AlertCircle className="h-4 w-4 inline mr-1" />
                                            Error: {message.error}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                    
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                          <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem>
                                          <Edit className="h-4 w-4 mr-2" />
                                          Edit Message
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                          <Calendar className="h-4 w-4 mr-2" />
                                          Reschedule
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem>
                                          <Play className="h-4 w-4 mr-2" />
                                          Send Now
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                          <Pause className="h-4 w-4 mr-2" />
                                          Cancel
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                  
                                  {message.status === "scheduled" && (
                                    <div className="flex gap-2 mt-4">
                                      <Button size="sm" variant="outline">
                                        <Edit className="h-3 w-3 mr-1" />
                                        Edit
                                      </Button>
                                      <Button size="sm" variant="outline">
                                        <Calendar className="h-3 w-3 mr-1" />
                                        Reschedule
                                      </Button>
                                      <Button size="sm">
                                        <Play className="h-3 w-3 mr-1" />
                                        Send Now
                                      </Button>
                                    </div>
                                  )}
                                  
                                  {message.status === "failed" && (
                                    <div className="flex gap-2 mt-4">
                                      <Button size="sm">
                                        <RefreshCw className="h-3 w-3 mr-1" />
                                        Retry
                                      </Button>
                                      <Button size="sm" variant="outline">
                                        <Edit className="h-3 w-3 mr-1" />
                                        Edit & Retry
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                        
                        {filteredMessages.length === 0 && (
                          <div className="text-center text-gray-500 py-12">
                            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                            <p>No {activeTab === "all" ? "" : activeTab} messages found</p>
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}