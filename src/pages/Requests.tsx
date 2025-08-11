import { useState } from "react";
import { WorkspaceHeader } from "@/components/workspace/WorkspaceHeader";
import { WorkspaceSidebar } from "@/components/workspace/WorkspaceSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MessageSquare, 
  UserPlus, 
  Clock, 
  CheckCircle, 
  X, 
  Search, 
  Filter, 
  Users,
  TrendingUp,
  AlertCircle,
  Calendar,
  MoreHorizontal,
  Eye,
  Reply,
  Trash2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Requests() {
  const [isConversational, setIsConversational] = useState(false);
  const [activeTab, setActiveTab] = useState("pending");
  
  // Prevent tab state from changing when clicking on form elements
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const requests = [
    {
      id: 1,
      type: "connection",
      from: "Alexandra Rodriguez",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b829?w=400&h=400&fit=crop&crop=face",
      company: "TechFlow Inc.",
      title: "VP of Engineering",
      message: "Hi! I'd love to connect and discuss potential collaboration opportunities between our companies.",
      time: "2 hours ago",
      status: "pending",
      mutualConnections: 5,
      source: "LinkedIn"
    },
    {
      id: 2,
      type: "meeting",
      from: "Marcus Thompson",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face",
      company: "ScaleUp Solutions",
      title: "Director of Sales",
      message: "Would like to schedule a 30-minute call to discuss your automation platform. Available this week?",
      time: "4 hours ago",
      status: "pending",
      proposedTime: "Tomorrow, 2:00 PM",
      source: "Email"
    },
    {
      id: 3,
      type: "collaboration",
      from: "Sarah Chen",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face",
      company: "InnovateHub",
      title: "Product Manager",
      message: "Interested in exploring a potential partnership. Our products seem complementary.",
      time: "6 hours ago",
      status: "pending",
      source: "LinkedIn"
    },
    {
      id: 4,
      type: "connection",
      from: "David Wilson",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
      company: "DataCorp",
      title: "CTO",
      message: "Saw your recent post about AI automation. Very insightful! Would love to connect.",
      time: "1 day ago",
      status: "accepted",
      mutualConnections: 12,
      source: "LinkedIn"
    },
    {
      id: 5,
      type: "meeting",
      from: "Emily Johnson",
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop&crop=face",
      company: "FinancePlus",
      title: "CFO",
      message: "Following up on our demo. Ready to discuss pricing and implementation timeline.",
      time: "2 days ago",
      status: "completed",
      meetingDate: "Yesterday, 3:00 PM",
      source: "Email"
    }
  ];

  const getRequestIcon = (type: string) => {
    switch (type) {
      case "connection": return <UserPlus className="h-4 w-4 text-blue-600" />;
      case "meeting": return <Calendar className="h-4 w-4 text-green-600" />;
      case "collaboration": return <Users className="h-4 w-4 text-purple-600" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return <Clock className="h-4 w-4 text-yellow-600" />;
      case "accepted": return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "declined": return <X className="h-4 w-4 text-red-600" />;
      case "completed": return <CheckCircle className="h-4 w-4 text-blue-600" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "accepted": return "bg-green-100 text-green-800";
      case "declined": return "bg-red-100 text-red-800";
      case "completed": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const filteredRequests = requests.filter(request => {
    if (activeTab === "all") return true;
    return request.status === activeTab;
  });

  return (
    <SidebarProvider defaultOpen={true} open={true}>
      <div className="min-h-screen flex w-full bg-gray-50">
        <WorkspaceSidebar isConversational={isConversational} />
        <div className="flex-1 flex flex-col">
          <WorkspaceHeader isConversational={isConversational} onToggleMode={setIsConversational} />
          <main className="flex-1 p-8">
            <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Requests</h1>
          <p className="text-gray-600 mt-1">Manage connection requests, meeting invitations, and collaboration proposals</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search requests..."
              className="pl-10"
              onClick={(e) => e.stopPropagation()}
              onFocus={(e) => e.stopPropagation()}
            />
          </div>
          <select 
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
            onClick={(e) => e.stopPropagation()}
            onFocus={(e) => e.stopPropagation()}
          >
            <option>All Status</option>
            <option>Pending</option>
            <option>Accepted</option>
            <option>Declined</option>
            <option>Completed</option>
          </select>
          <select 
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
            onClick={(e) => e.stopPropagation()}
            onFocus={(e) => e.stopPropagation()}
          >
            <option>All Types</option>
            <option>Connection</option>
            <option>Meeting</option>
            <option>Collaboration</option>
            <option>Information</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            More Filters
          </Button>
        </div>
      </div>

      {/* Request Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">23</div>
                <div className="text-sm text-gray-600">Total Requests</div>
              </div>
              <MessageSquare className="h-8 w-8 text-premium-purple" />
            </div>
            <p className="text-xs text-green-600 mt-2">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              +5 this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">8</div>
                <div className="text-sm text-gray-600">Pending</div>
              </div>
              <Clock className="h-8 w-8 text-premium-orange" />
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Requires action
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">12</div>
                <div className="text-sm text-gray-600">Accepted</div>
              </div>
              <CheckCircle className="h-8 w-8 text-premium-cyan" />
            </div>
            <p className="text-xs text-green-600 mt-2">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              +3 today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">85%</div>
                <div className="text-sm text-gray-600">Acceptance Rate</div>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
            <p className="text-xs text-green-600 mt-2">
              Above average
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Requests Interface */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Requests</CardTitle>
              <CardDescription>Manage your incoming requests and invitations</CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search requests..."
                className="pl-10 w-64"
                onClick={(e) => e.stopPropagation()}
                onFocus={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList>
              <TabsTrigger value="all">All Requests</TabsTrigger>
              <TabsTrigger value="pending">Pending ({requests.filter(r => r.status === "pending").length})</TabsTrigger>
              <TabsTrigger value="accepted">Accepted</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-4 mt-6" onClick={(e) => e.stopPropagation()}>
              {filteredRequests.map((request) => (
                <Card key={request.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={request.avatar} alt={request.from} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {request.from.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              {getRequestIcon(request.type)}
                              <h3 className="font-semibold text-gray-900">{request.from}</h3>
                              <Badge variant="outline" className="text-xs">
                                {request.source}
                              </Badge>
                            </div>
                            <p className="text-sm text-premium-purple font-medium">{request.title}</p>
                            <p className="text-sm text-gray-600 mb-2">{request.company}</p>
                            
                            <div className="flex items-center gap-2 mb-3">
                              {getStatusIcon(request.status)}
                              <Badge className={getStatusColor(request.status)}>
                                {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                              </Badge>
                              <span className="text-sm text-gray-500">{request.time}</span>
                            </div>

                            <p className="text-gray-900 mb-3">{request.message}</p>

                            {request.type === "connection" && request.mutualConnections && (
                              <p className="text-xs text-gray-600 mb-3">
                                <Users className="h-3 w-3 inline mr-1" />
                                {request.mutualConnections} mutual connections
                              </p>
                            )}

                            {request.type === "meeting" && request.proposedTime && request.status === "pending" && (
                              <p className="text-xs text-gray-600 mb-3">
                                <Calendar className="h-3 w-3 inline mr-1" />
                                Proposed time: {request.proposedTime}
                              </p>
                            )}

                            {request.type === "meeting" && request.meetingDate && request.status === "completed" && (
                              <p className="text-xs text-gray-600 mb-3">
                                <Calendar className="h-3 w-3 inline mr-1" />
                                Meeting held: {request.meetingDate}
                              </p>
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
                                <Eye className="h-4 w-4 mr-2" />
                                View Profile
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Reply className="h-4 w-4 mr-2" />
                                Send Message
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Request
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        
                        {request.status === "pending" && (
                          <div className="flex gap-2 mt-4">
                            <Button size="sm">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Accept
                            </Button>
                            <Button size="sm" variant="outline">
                              <Reply className="h-3 w-3 mr-1" />
                              Reply
                            </Button>
                            <Button size="sm" variant="outline">
                              <X className="h-3 w-3 mr-1" />
                              Decline
                            </Button>
                          </div>
                        )}
                        
                        {request.status === "accepted" && (
                          <div className="flex gap-2 mt-4">
                            <Button size="sm" variant="outline">
                              <Reply className="h-3 w-3 mr-1" />
                              Send Message
                            </Button>
                            <Button size="sm" variant="outline">
                              <Eye className="h-3 w-3 mr-1" />
                              View Profile
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {filteredRequests.length === 0 && (
                <div className="text-center text-gray-500 py-12">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No {activeTab === "all" ? "" : activeTab} requests found</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}