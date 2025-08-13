import { useState, useEffect } from "react";
import { supabase } from '@/integrations/supabase/client';
import { useLinkedInSync } from '@/hooks/useLinkedInSync';
import { toast } from 'sonner';
import { previewSync } from '@/services/unipile/PreviewSync';
import PreviewSyncStatus from '@/components/PreviewSyncStatus';
// import MessageComposer from '@/components/MessageComposer'; // Temporarily disabled

interface Message {
  id: string;
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
  conversationData?: any;
  isPreviewOnly?: boolean; // New field to indicate preview-only conversations
  totalMessages?: number;   // Total message count for preview conversations
}
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const [selectedConversation, setSelectedConversation] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [showComposer, setShowComposer] = useState(false);
  const [composerMode, setComposerMode] = useState<'reply' | 'new'>('new');
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [newMessageContent, setNewMessageContent] = useState('');
  const [newMessageRecipient, setNewMessageRecipient] = useState('');
  
  // Use the LinkedIn sync hook
  const { syncState, performManualSync, toggleAutoSync } = useLinkedInSync();
  
  // Modal states
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [forwardModalOpen, setForwardModalOpen] = useState(false);
  const [scheduleMeetingModalOpen, setScheduleMeetingModalOpen] = useState(false);
  
  // Form states
  const [replyContent, setReplyContent] = useState("");
  const [forwardTo, setForwardTo] = useState("");
  const [forwardContent, setForwardContent] = useState("");
  const [meetingTitle, setMeetingTitle] = useState("");
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingTime, setMeetingTime] = useState("");
  const [meetingDescription, setMeetingDescription] = useState("");

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
      setLoading(true);
      
      // Get first workspace
      const { data: workspace } = await supabase
        .from('workspaces')
        .select('id')
        .limit(1)
        .single();
        
      if (!workspace) {
        setMessages([]);
        setLoading(false);
        return;
      }
      
      const workspaceId = workspace.id;
      
      // Load conversations with messages from inbox tables
      const { data: conversations, error } = await supabase
        .from('inbox_conversations')
        .select(`
          *,
          inbox_messages (
            *
          )
        `)
        .eq('workspace_id', workspaceId)
        .order('last_message_at', { ascending: false });

      if (error) {
        throw error;
      }

      // If no conversations, show empty state
      if (!conversations || conversations.length === 0) {
        setMessages([]);
        setLoading(false);
        return;
      }

      // Transform conversations into inbox messages format
      const inboxMessages: Message[] = conversations.map((conv, index) => {
        const latestMessage = conv.inbox_messages?.[conv.inbox_messages.length - 1];
        const messageCount = conv.inbox_messages?.length || 0;
        const isPreviewOnly = conv.metadata?.preview_only === true;
        const totalMessages = conv.metadata?.total_messages || messageCount;
        
        // Build tags array
        const tags = [];
        if (conv.platform === 'linkedin') tags.push('LinkedIn');
        if (isPreviewOnly) {
          tags.push('Preview Only');
          tags.push(`${totalMessages} total`);
        } else {
          tags.push(`${messageCount} msgs`);
        }
        
        return {
          id: conv.id, // Use actual conversation ID instead of index
          from: conv.participant_name || 'Unknown',
          avatar: conv.participant_avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${conv.participant_name}`,
          company: conv.participant_company || '',
          channel: conv.platform || 'linkedin',
          subject: `Message from ${conv.participant_name}`,
          preview: latestMessage?.content || conv.metadata?.last_message_preview || 'No message content',
          time: new Date(conv.last_message_at).toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
          }),
          read: false,
          priority: 'normal',
          tags,
          conversationData: conv, // Store the full conversation data
          isPreviewOnly,
          totalMessages
        };
      });
      
      setMessages(inboxMessages);
    } catch (error) {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncMessages = async () => {
    setLoading(true);
    await performManualSync();
    // Wait a moment for database to update
    await new Promise(resolve => setTimeout(resolve, 1000));
    // Reload messages
    await loadMessages();
    setLoading(false);
  };

  // Load conversation messages (helper function)
  const loadConversationMessages = async (message: Message) => {
    if (message.conversationData?.inbox_messages) {
      // Use existing data
      const sortedMessages = message.conversationData.inbox_messages.sort((a: any, b: any) => {
        if (a.metadata?.message_index !== undefined && b.metadata?.message_index !== undefined) {
          return a.metadata.message_index - b.metadata.message_index;
        }
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });
      setSelectedConversation(sortedMessages);
    } else {
      // Reload from database
      const { data: conv } = await supabase
        .from('inbox_conversations')
        .select(`
          *,
          inbox_messages (
            *
          )
        `)
        .eq('id', message.id)
        .single();
      
      if (conv?.inbox_messages && conv.inbox_messages.length > 0) {
        const sortedMessages = conv.inbox_messages.sort((a: any, b: any) => {
          if (a.metadata?.message_index !== undefined && b.metadata?.message_index !== undefined) {
            return a.metadata.message_index - b.metadata.message_index;
          }
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        });
        setSelectedConversation(sortedMessages);
      } else {
        setSelectedConversation([]);
      }
    }
  };

  // Load full conversation for preview-only messages
  const handleLoadFullConversation = async (message: Message) => {
    if (!message.isPreviewOnly || !message.conversationData) return;
    
    try {
      toast.info('Loading full conversation history...');
      
      // Get the Unipile account
      const { unipileRealTimeSync } = await import('@/services/unipile/UnipileRealTimeSync');
      const accounts = await unipileRealTimeSync.testConnection();
      
      if (accounts.success && accounts.accounts.length > 0) {
        const account = accounts.accounts[0];
        const chatId = message.conversationData.platform_conversation_id;
        
        // Load full conversation using PreviewSync
        const messages = await previewSync.loadFullConversation(
          message.id, // conversation ID in our database
          chatId,     // chat ID in Unipile
          account.id  // Unipile account ID
        );
        
        if (messages && messages.length > 0) {
          // Reload the messages to show the full conversation
          await loadMessages();
          
          // Re-select the message to show full conversation
          const updatedMessage = messages.find(m => m.id === message.id);
          if (updatedMessage) {
            setSelectedMessage(updatedMessage);
            await loadConversationMessages(updatedMessage);
          }
        }
      }
    } catch (error) {
      console.error('Error loading full conversation:', error);
      toast.error('Failed to load full conversation');
    }
  };

  // Action handlers
  const handleReply = () => {
    if (selectedMessage) {
      setReplyContent(`Hi ${selectedMessage.from},\n\n`);
      setReplyModalOpen(true);
    }
  };

  const handleForward = () => {
    if (selectedMessage) {
      setForwardContent(`---------- Forwarded message ----------\nFrom: ${selectedMessage.from}\nSubject: ${selectedMessage.subject}\n\n${selectedMessage.preview}`);
      setForwardModalOpen(true);
    }
  };

  const handleScheduleMeeting = () => {
    if (selectedMessage) {
      setMeetingTitle(`Meeting with ${selectedMessage.from}`);
      setMeetingDescription(`Following up on: ${selectedMessage.subject}`);
      setScheduleMeetingModalOpen(true);
    }
  };

  const sendReply = async () => {
    try {
      if (!selectedMessage || !replyContent.trim()) return;
      
      toast.info('Sending reply...');
      
      // Try to send via Unipile API
      const { unipileRealTimeSync } = await import('@/services/unipile/UnipileRealTimeSync');
      const accounts = await unipileRealTimeSync.testConnection();
      
      if (accounts.success && accounts.accounts.length > 0) {
        // Get the chat ID from conversation data
        const chatId = selectedMessage.conversationData?.platform_conversation_id;
        const account = accounts.accounts[0];
        
        if (chatId && account) {
          // Send the actual message via Unipile
          const success = await unipileRealTimeSync.sendMessage(
            account.id,
            chatId, // Use chat ID as recipient
            replyContent
          );
          
          if (success) {
            toast.success('Reply sent successfully!');
          }
        }
      }
      
      // Save to our database
      const { data: { user } } = await supabase.auth.getUser();
      if (selectedMessage.conversationData?.id) {
        await supabase
          .from('inbox_messages')
          .insert({
            conversation_id: selectedMessage.conversationData.id,
            role: 'user',
            content: replyContent,
            metadata: {
              type: 'reply',
              sender_name: 'You',
              direction: 'outbound',
              timestamp: new Date().toISOString()
            }
          });
      }

      setReplyModalOpen(false);
      setReplyContent("");
      
      // Refresh messages
      loadMessages();
      
    } catch (error) {
      console.error('Error sending reply:', error);
      toast.error('Failed to send reply');
    }
  };

  const sendForward = async () => {
    try {
      if (!selectedMessage) return;
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const userProfile = JSON.parse(localStorage.getItem('user_auth_profile') || '{}');
      
      // Insert forward message into database
      const { error } = await supabase
        .from('conversation_messages')
        .insert({
          conversation_id: `forward_${Date.now()}`, // Generate unique conversation ID
          role: 'user',
          content: forwardContent,
          metadata: {
            type: 'forward',
            original_message_id: selectedMessage.id,
            recipient: forwardTo
          }
        });

      if (error) throw error;

      setForwardModalOpen(false);
      setForwardTo("");
      setForwardContent("");
      
      // Refresh messages
      loadMessages();
    } catch (error) {
      console.error('Error forwarding message:', error);
    }
  };

  const scheduleMeeting = async () => {
    try {
      if (!selectedMessage) return;
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const userProfile = JSON.parse(localStorage.getItem('user_auth_profile') || '{}');
      
      // Insert meeting schedule into database
      const { error } = await supabase
        .from('conversation_messages')
        .insert({
          conversation_id: `meeting_${Date.now()}`, // Generate unique conversation ID
          role: 'system',
          content: `Meeting scheduled: ${meetingTitle}`,
          metadata: {
            type: 'meeting_schedule',
            original_message_id: selectedMessage.id,
            meeting_details: {
              title: meetingTitle,
              date: meetingDate,
              time: meetingTime,
              description: meetingDescription,
              attendee: selectedMessage.from
            }
          }
        });

      if (error) throw error;

      setScheduleMeetingModalOpen(false);
      setMeetingTitle("");
      setMeetingDate("");
      setMeetingTime("");
      setMeetingDescription("");
      
      // Refresh messages
      loadMessages();
    } catch (error) {
      console.error('Error scheduling meeting:', error);
    }
  };

  // Empty messages array - will be populated from database
  const demoMessages: Message[] = [];

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
          <h1 className="text-3xl font-bold text-gray-900">Inbox</h1>
          <p className="text-gray-600 mt-1">
            Manage all your conversations across channels
            {syncState.lastSyncTime && (
              <span className="text-sm ml-2">
                • Last sync: {syncState.lastSyncTime.toLocaleTimeString()}
              </span>
            )}
            {syncState.autoSyncEnabled && syncState.nextSyncTime && (
              <span className="text-sm ml-2">
                • Next auto-sync: {syncState.nextSyncTime.toLocaleTimeString()}
              </span>
            )}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Syncing up to 500 most recent conversations with 20 messages each
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowNewMessageModal(true)}
          >
            <Mail className="h-4 w-4 mr-2" />
            New Message
          </Button>
          <Button 
            variant="outline"
            onClick={handleSyncMessages}
            disabled={syncState.isSyncing || loading}
            title="Manually sync LinkedIn messages"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${(syncState.isSyncing || loading) ? 'animate-spin' : ''}`} />
            {syncState.isSyncing ? 'Syncing...' : 'Sync LinkedIn'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => toggleAutoSync(!syncState.autoSyncEnabled)}
            title={syncState.autoSyncEnabled ? 'Disable auto-sync' : 'Enable hourly auto-sync'}
          >
            {syncState.autoSyncEnabled ? (
              <>
                <Clock className="h-4 w-4 mr-2" />
                Auto-sync ON
              </>
            ) : (
              <>
                <Clock className="h-4 w-4 mr-2 opacity-50" />
                Auto-sync OFF
              </>
            )}
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
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleSyncMessages}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Sync LinkedIn
          </Button>
          <Button variant="outline" size="sm">
            More Filters
          </Button>
        </div>
      </div>

      {/* Preview Sync Status */}
      <div className="mb-6">
        <PreviewSyncStatus />
      </div>

      {/* Inbox Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">{messages.length}</div>
                <div className="text-sm text-gray-600">Total Messages</div>
              </div>
              <Inbox className="h-8 w-8 text-premium-purple" />
            </div>
            {messages.length > 0 && (
              <p className="text-xs text-gray-500 mt-2">
                Synced from LinkedIn
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">{messages.filter(m => !m.read).length}</div>
                <div className="text-sm text-gray-600">Unread</div>
              </div>
              <AlertCircle className="h-8 w-8 text-premium-orange" />
            </div>
            {messages.filter(m => !m.read).length > 0 && (
              <p className="text-xs text-orange-600 mt-2">
                Requires attention
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">0</div>
                <div className="text-sm text-gray-600">Sent Today</div>
              </div>
              <CheckCircle className="h-8 w-8 text-premium-cyan" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Track sent messages
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">0</div>
                <div className="text-sm text-gray-600">High Priority</div>
              </div>
              <Star className="h-8 w-8 text-yellow-500" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Important messages
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
                  {messages.length === 0 ? (
                    <div className="p-8 text-center">
                      <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No messages yet</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Click "Sync Messages" to import from LinkedIn
                      </p>
                    </div>
                  ) : (
                    messages.map((message) => (
                    <div
                      key={message.id}
                      className={`p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors ${
                        selectedMessage?.id === message.id ? "bg-muted" : ""
                      } ${!message.read ? "bg-blue-50" : ""}`}
                      onClick={async () => {
                        setSelectedMessage(message);
                        
                        // Use the conversation data we already have or reload it
                        if (message.conversationData?.inbox_messages) {
                          // Use existing data
                          const sortedMessages = message.conversationData.inbox_messages.sort((a: any, b: any) => {
                            if (a.metadata?.message_index !== undefined && b.metadata?.message_index !== undefined) {
                              return a.metadata.message_index - b.metadata.message_index;
                            }
                            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                          });
                          console.log(`Using ${sortedMessages.length} cached messages`);
                          setSelectedConversation(sortedMessages);
                        } else {
                          // Reload from database
                          console.log(`Reloading messages for conversation ${message.id}`);
                          const { data: conv } = await supabase
                            .from('inbox_conversations')
                            .select(`
                              *,
                              inbox_messages (
                                *
                              )
                            `)
                            .eq('id', message.id)
                            .single();
                          
                          if (conv?.inbox_messages && conv.inbox_messages.length > 0) {
                            console.log(`Loaded ${conv.inbox_messages.length} messages from database`);
                            const sortedMessages = conv.inbox_messages.sort((a: any, b: any) => {
                              if (a.metadata?.message_index !== undefined && b.metadata?.message_index !== undefined) {
                                return a.metadata.message_index - b.metadata.message_index;
                              }
                              return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                            });
                            setSelectedConversation(sortedMessages);
                          } else {
                            console.log('No messages found in database');
                            setSelectedConversation([]);
                          }
                        }
                      }}
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
                            {message.priority && (
                              <Badge className={getPriorityColor(message.priority)}>
                                {message.priority}
                              </Badge>
                            )}
                            {message.tags?.map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                  )}
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
          <CardContent className="h-[600px] overflow-y-auto">
            {selectedMessage ? (
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-2">{selectedMessage.subject}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                    <Clock className="h-4 w-4" />
                    {selectedMessage.time}
                    {selectedMessage.priority && (
                      <Badge className={getPriorityColor(selectedMessage.priority)}>
                        {selectedMessage.priority} priority
                      </Badge>
                    )}
                  </div>
                  
                  {/* Full conversation thread */}
                  <div className="space-y-4">
                    {/* Show Load Full Conversation button for preview-only messages */}
                    {selectedMessage.isPreviewOnly && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-amber-900">Preview Mode</p>
                            <p className="text-xs text-amber-700 mt-1">
                              This conversation has {selectedMessage.totalMessages || 'many'} total messages. 
                              Currently showing preview only.
                            </p>
                          </div>
                          <Button 
                            onClick={() => handleLoadFullConversation(selectedMessage)}
                            variant="outline"
                            size="sm"
                            className="ml-4"
                          >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Load Full Conversation
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {selectedConversation.length > 0 ? (
                      <>
                        <div className="text-xs text-gray-500 mb-2">
                          Showing {selectedConversation.length} message{selectedConversation.length !== 1 ? 's' : ''} in this conversation
                          {selectedMessage.isPreviewOnly && ' (preview only)'}
                        </div>
                        {selectedConversation.map((msg: any, idx: number) => {
                          const isUser = msg.role === 'user' || msg.metadata?.direction === 'outbound';
                          const senderName = isUser ? 'You' : 
                            (msg.metadata?.sender_name || selectedMessage.from);
                          
                          return (
                            <div key={msg.id || idx} className={`p-4 rounded-lg transition-all ${
                              isUser ? 'bg-blue-50 ml-8' : 'bg-gray-50 mr-8'
                            }`}>
                              <div className="flex items-start gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage 
                                    src={isUser ? '' : selectedMessage.avatar} 
                                    alt={senderName} 
                                  />
                                  <AvatarFallback className="text-xs">
                                    {isUser ? 'You' : selectedMessage.from.split(' ').map(n => n[0]).join('')}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-sm">
                                      {senderName}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {new Date(msg.created_at || msg.metadata?.timestamp || Date.now()).toLocaleString()}
                                    </span>
                                    {msg.metadata?.message_type === 'placeholder' && (
                                      <Badge variant="outline" className="text-xs">
                                        Preview Only
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="text-sm text-gray-900 whitespace-pre-wrap">
                                    {msg.content || 'No content'}
                                  </div>
                                  {msg.metadata?.attachments?.length > 0 && (
                                    <div className="mt-2 text-xs text-gray-500">
                                      📎 {msg.metadata.attachments.length} attachment(s)
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </>
                    ) : (
                      <div className="prose max-w-none">
                        <p className="text-gray-900 leading-relaxed">
                          {selectedMessage.preview}
                        </p>
                        <p className="text-sm text-gray-500 mt-4">
                          Full conversation history is being synced. Try refreshing in a moment.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {selectedMessage.tags?.map((tag: string, index: number) => (
                    <Badge key={index} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <Button onClick={handleReply}>
                    <Reply className="h-4 w-4 mr-2" />
                    Reply
                  </Button>
                  <Button variant="outline" onClick={handleForward}>
                    <Forward className="h-4 w-4 mr-2" />
                    Forward
                  </Button>
                  <Button variant="outline" onClick={handleScheduleMeeting}>
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

      {/* Reply Modal */}
      <Dialog open={replyModalOpen} onOpenChange={setReplyModalOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Reply to {selectedMessage?.from}</DialogTitle>
            <DialogDescription>
              Compose your reply to: {selectedMessage?.subject}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="reply-content">Message</Label>
              <Textarea
                id="reply-content"
                placeholder="Type your reply here..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                className="min-h-[150px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReplyModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={sendReply} disabled={!replyContent.trim()}>
              Send Reply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Forward Modal */}
      <Dialog open={forwardModalOpen} onOpenChange={setForwardModalOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Forward Message</DialogTitle>
            <DialogDescription>
              Forward this message to another contact
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="forward-to">Forward To</Label>
              <Input
                id="forward-to"
                placeholder="Enter email address"
                value={forwardTo}
                onChange={(e) => setForwardTo(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="forward-content">Message</Label>
              <Textarea
                id="forward-content"
                placeholder="Add a note (optional)"
                value={forwardContent}
                onChange={(e) => setForwardContent(e.target.value)}
                className="min-h-[150px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setForwardModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={sendForward} disabled={!forwardTo.trim()}>
              Forward Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Meeting Modal */}
      <Dialog open={scheduleMeetingModalOpen} onOpenChange={setScheduleMeetingModalOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Schedule Meeting</DialogTitle>
            <DialogDescription>
              Schedule a meeting with {selectedMessage?.from}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="meeting-title">Meeting Title</Label>
              <Input
                id="meeting-title"
                placeholder="Enter meeting title"
                value={meetingTitle}
                onChange={(e) => setMeetingTitle(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="meeting-date">Date</Label>
                <Input
                  id="meeting-date"
                  type="date"
                  value={meetingDate}
                  onChange={(e) => setMeetingDate(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="meeting-time">Time</Label>
                <Input
                  id="meeting-time"
                  type="time"
                  value={meetingTime}
                  onChange={(e) => setMeetingTime(e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="meeting-description">Description</Label>
              <Textarea
                id="meeting-description"
                placeholder="Meeting agenda and details..."
                value={meetingDescription}
                onChange={(e) => setMeetingDescription(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleMeetingModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={scheduleMeeting} disabled={!meetingTitle.trim() || !meetingDate || !meetingTime}>
              Schedule Meeting
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Message Modal */}
      <Dialog open={showNewMessageModal} onOpenChange={setShowNewMessageModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>New LinkedIn Message</DialogTitle>
            <DialogDescription>
              Send a message to a LinkedIn connection
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="recipient">To (LinkedIn Name or Email)</Label>
              <Input
                id="recipient"
                placeholder="Enter recipient name..."
                value={newMessageRecipient}
                onChange={(e) => setNewMessageRecipient(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Type your message here..."
                value={newMessageContent}
                onChange={(e) => setNewMessageContent(e.target.value)}
                className="min-h-[200px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowNewMessageModal(false);
              setNewMessageContent('');
              setNewMessageRecipient('');
            }}>
              Cancel
            </Button>
            <Button onClick={async () => {
              if (!newMessageRecipient.trim() || !newMessageContent.trim()) {
                toast.error('Please enter recipient and message');
                return;
              }
              
              toast.info('Sending message...');
              
              try {
                // Import and use Unipile API
                const { unipileRealTimeSync } = await import('@/services/unipile/UnipileRealTimeSync');
                const accounts = await unipileRealTimeSync.testConnection();
                
                if (accounts.success && accounts.accounts.length > 0) {
                  const account = accounts.accounts[0];
                  
                  // Note: For new messages, we'd need to search for the recipient's LinkedIn ID
                  // This is a simplified version
                  toast.success('Message feature coming soon!');
                  
                  // TODO: Implement recipient search and actual sending
                  // const success = await unipileRealTimeSync.sendMessage(
                  //   account.id,
                  //   recipientLinkedInId,
                  //   newMessageContent
                  // );
                }
                
                setShowNewMessageModal(false);
                setNewMessageContent('');
                setNewMessageRecipient('');
                
              } catch (error) {
                console.error('Error sending message:', error);
                toast.error('Failed to send message');
              }
            }}>
              Send Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}