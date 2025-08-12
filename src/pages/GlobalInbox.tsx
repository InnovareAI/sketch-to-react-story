import { useState, useEffect } from "react";
import { supabase } from '@/integrations/supabase/client';
import { unipileService } from '@/services/unipile/UnipileService';

interface Message {
  id: number;
  from: string;
  avatar: string;
  company: string;
  channel: string;
  subject: string;
  preview: string;
  time: string;
  read: boolean;
  priority?: string;
  tags?: string[];
}
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Inbox, 
  Mail, 
  MessageSquare, 
  Phone, 
  Search, 
  Filter, 
  Archive, 
  Trash2, 
  Reply, 
  Forward, 
  Star,
  MoreHorizontal,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Users,
  Calendar,
  Video,
  RefreshCw
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function GlobalInbox() {
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMessages();
    
    // Set up real-time updates
    const channel = supabase
      .channel('global-inbox')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'conversation_messages' }, 
        () => loadMessages()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadMessages = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Try to load real messages first
      const realMessages = await unipileService.getAllMessagesForInbox(user.id);
      
      if (realMessages.length > 0) {
        setMessages(realMessages);
      } else {
        // Fall back to demo messages if no real ones
        setMessages(demoMessages);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      // Fall back to demo messages on error
      setMessages(demoMessages);
    } finally {
      setLoading(false);
    }
  };

  const demoMessages = [
    {
      id: 1,
      from: "Jennifer Fleming",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b829?w=400&h=400&fit=crop&crop=face",
      company: "TechCorp Solutions",
      channel: "email",
      subject: "Re: Enterprise Solution Demo",
      preview: "Thank you for the comprehensive demo yesterday. I'm impressed with the scalability features...",
      time: "2 hours ago",
      read: false,
      priority: "high",
      labels: ["Hot Lead", "Demo Follow-up"],
      fullMessage: "Thank you for the comprehensive demo yesterday. I'm impressed with the scalability features and would like to discuss pricing for our enterprise deployment. Could we schedule a follow-up call this week to go over the implementation timeline?"
    },
    {
      id: 2,
      from: "David Chen",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face",
      company: "InnovateLabs",
      channel: "linkedin",
      subject: "LinkedIn connection accepted",
      preview: "Thanks for connecting! I'm interested in learning more about your automation platform...",
      time: "4 hours ago",
      read: true,
      priority: "medium",
      labels: ["LinkedIn", "New Connection"],
      fullMessage: "Thanks for connecting! I'm interested in learning more about your automation platform. We're looking to streamline our development workflow and your solution seems like a great fit. Would you be available for a brief call next week?"
    },
    {
      id: 3,
      from: "Sarah Williams",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face",
      company: "GrowthMetrics",
      channel: "whatsapp",
      subject: "WhatsApp message",
      preview: "Hi! Saw your post about marketing automation. Very relevant to our current challenges...",
      time: "6 hours ago",
      read: false,
      priority: "medium",
      labels: ["WhatsApp", "Marketing"],
      fullMessage: "Hi! Saw your post about marketing automation. Very relevant to our current challenges. We're evaluating different solutions for our marketing team. Would love to learn more about your platform and see if it's a good fit for our needs."
    },
    {
      id: 4,
      from: "Michael Rodriguez",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
      company: "ScaleCorp",
      channel: "email",
      subject: "Meeting Request - Operations Automation",
      preview: "Following up on our conversation at the trade show. Would like to schedule a formal presentation...",
      time: "1 day ago",
      read: true,
      priority: "low",
      labels: ["Meeting Request", "Trade Show"],
      fullMessage: "Following up on our conversation at the trade show. Would like to schedule a formal presentation for our operations team. We're particularly interested in the workflow automation features. Are you available for a demo next Wednesday?"
    }
  ];

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case "email": return <Mail className="h-4 w-4 text-blue-600" />;
      case "linkedin": return <MessageSquare className="h-4 w-4 text-blue-700" />;
      case "whatsapp": return <MessageSquare className="h-4 w-4 text-green-600" />;
      case "phone": return <Phone className="h-4 w-4 text-purple-600" />;
      default: return <Mail className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "low": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatTime = (time: string) => {
    return time;
  };

  return (
    <div className="flex-1 bg-gray-50">
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Global Inbox</h1>
          <p className="text-gray-600 mt-1">Manage all your conversations across channels</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={loadMessages}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Sync Messages
          </Button>
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline">
            <Archive className="h-4 w-4 mr-2" />
            Archive All Read
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search conversations..."
              className="pl-10"
            />
          </div>
          <select className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
            <option>All Channels</option>
            <option>Email</option>
            <option>LinkedIn</option>
            <option>WhatsApp</option>
            <option>SMS</option>
          </select>
          <select className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
            <option>All Intents</option>
            <option>Meeting Request</option>
            <option>Follow-up</option>
            <option>Question</option>
            <option>Not Interested</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            More Filters
          </Button>
        </div>
      </div>

      {/* Inbox Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">3,848</div>
                <div className="text-sm text-gray-600">Total Messages</div>
              </div>
              <Inbox className="h-8 w-8 text-premium-purple" />
            </div>
            <p className="text-xs text-green-600 mt-2">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              +24 today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">156</div>
                <div className="text-sm text-gray-600">Unread</div>
              </div>
              <AlertCircle className="h-8 w-8 text-premium-orange" />
            </div>
            <p className="text-xs text-red-600 mt-2">
              Requires attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">89</div>
                <div className="text-sm text-gray-600">Responses Today</div>
              </div>
              <CheckCircle className="h-8 w-8 text-premium-cyan" />
            </div>
            <p className="text-xs text-green-600 mt-2">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              +15% vs yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">23</div>
                <div className="text-sm text-gray-600">High Priority</div>
              </div>
              <Star className="h-8 w-8 text-yellow-500" />
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Action required
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Inbox Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Message List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Messages</CardTitle>
              <Button variant="ghost" size="sm">
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="unread">Unread</TabsTrigger>
                <TabsTrigger value="starred">Starred</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-0">
                <div className="space-y-0">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors ${
                        selectedMessage?.id === message.id ? "bg-muted" : ""
                      } ${!message.read ? "bg-blue-50" : ""}`}
                      onClick={() => setSelectedMessage(message)}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={message.avatar} alt={message.from} />
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {message.from.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              {getChannelIcon(message.channel)}
                              <span className={`text-sm font-medium ${!message.read ? "font-semibold" : ""}`}>
                                {message.from}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500">{formatTime(message.time)}</span>
                          </div>
                          <div className="text-xs text-gray-600 mb-1">{message.company}</div>
                          <div className={`text-sm text-gray-900 truncate ${!message.read ? "font-medium" : ""}`}>
                            {message.subject}
                          </div>
                          <div className="text-xs text-gray-600 truncate mt-1">
                            {message.preview}
                          </div>
                          <div className="flex items-center gap-1 mt-2">
                            <Badge className={getPriorityColor(message.priority)}>
                              {message.priority}
                            </Badge>
                            {message.labels.map((label, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {label}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Message Detail */}
        <Card className="lg:col-span-2">
          <CardHeader>
            {selectedMessage ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={selectedMessage.avatar} alt={selectedMessage.from} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {selectedMessage.from.split(' ').map((n: string) => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      {getChannelIcon(selectedMessage.channel)}
                      <CardTitle className="text-lg">{selectedMessage.from}</CardTitle>
                    </div>
                    <CardDescription>{selectedMessage.company}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon">
                    <Star className="h-4 w-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Archive className="h-4 w-4 mr-2" />
                        Archive
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <Users className="h-4 w-4 mr-2" />
                        Add to Campaign
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ) : (
              <CardTitle>Select a message to view details</CardTitle>
            )}
          </CardHeader>
          <CardContent>
            {selectedMessage ? (
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-2">{selectedMessage.subject}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                    <Clock className="h-4 w-4" />
                    {selectedMessage.time}
                    <Badge className={getPriorityColor(selectedMessage.priority)}>
                      {selectedMessage.priority} priority
                    </Badge>
                  </div>
                  <div className="prose max-w-none">
                    <p className="text-gray-900 leading-relaxed">
                      {selectedMessage.fullMessage}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {selectedMessage.labels.map((label: string, index: number) => (
                    <Badge key={index} variant="outline">
                      {label}
                    </Badge>
                  ))}
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <Button>
                    <Reply className="h-4 w-4 mr-2" />
                    Reply
                  </Button>
                  <Button variant="outline">
                    <Forward className="h-4 w-4 mr-2" />
                    Forward
                  </Button>
                  <Button variant="outline">
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule Meeting
                  </Button>
                  <Button variant="outline">
                    <Video className="h-4 w-4 mr-2" />
                    Video Call
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-12">
                <Inbox className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Select a message to view its content</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      </div>
        </div>
      </main>
    </div>
  );
}