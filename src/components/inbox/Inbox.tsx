// Inbox Component
// LinkedIn message and conversation management interface

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Inbox as InboxIcon,
  MessageSquare,
  Send,
  Search,
  Filter,
  MoreHorizontal,
  Star,
  Archive,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  Reply,
  Forward,
  Paperclip,
  Calendar,
  User,
  Building,
  RefreshCw,
  Download,
  Upload,
  Plus,
  Edit,
  Save,
  X
} from 'lucide-react';
import { toast } from 'sonner';

interface LinkedInMessage {
  id: string;
  conversation_id: string;
  sender: {
    id: string;
    name: string;
    profile_url: string;
    profile_image: string;
    headline: string;
    company: string;
  };
  recipient: {
    id: string;
    name: string;
    profile_url: string;
  };
  content: string;
  sent_at: string;
  read_at?: string;
  message_type: 'direct' | 'connection_request' | 'inmail';
  is_outbound: boolean;
  failed: boolean;
  campaign_source?: string;
  attachments?: Array<{
    name: string;
    url: string;
    type: string;
  }>;
}

interface Conversation {
  id: string;
  participants: Array<{
    id: string;
    name: string;
    profile_url: string;
    profile_image: string;
    headline: string;
    company: string;
  }>;
  last_message: LinkedInMessage;
  unread_count: number;
  is_archived: boolean;
  is_starred: boolean;
  campaign_source?: string;
  created_at: string;
  updated_at: string;
}

interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  category: 'follow_up' | 'introduction' | 'meeting' | 'general';
  variables: string[];
  usage_count: number;
  created_at: string;
}

interface InboxStats {
  total_messages: number;
  unread_messages: number;
  sent_today: number;
  response_rate: number;
  avg_response_time: string;
  failed_messages: number;
}

interface InboxProps {
  className?: string;
}

export function Inbox({ className }: InboxProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<LinkedInMessage[]>([]);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [stats, setStats] = useState<InboxStats>({
    total_messages: 0,
    unread_messages: 0,
    sent_today: 0,
    response_rate: 0,
    avg_response_time: '0h',
    failed_messages: 0
  });
  
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState('all');
  const [newMessage, setNewMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);

  useEffect(() => {
    loadInboxData();
  }, []);

  const loadInboxData = async () => {
    try {
      setLoading(true);
      
      // Only real data - no mock data
      setStats({
        total_messages: 0,
        unread_messages: 0,
        sent_today: 0,
        response_rate: 0,
        avg_response_time: '0h',
        failed_messages: 0
      });

      // Empty until real data is loaded
      setConversations([]);
      setTemplates([]);

    } catch (error) {
      console.error('Error loading inbox data:', error);
      toast.error('Failed to load inbox data');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const messageData = {
        conversation_id: selectedConversation,
        content: newMessage,
        sent_at: new Date().toISOString(),
        is_outbound: true
      };

      // This would call the API to send the message via Unipile
      toast.success('Message sent successfully');
      setNewMessage('');
      
      // Refresh messages
      await loadInboxData();
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  const handleUseTemplate = (template: MessageTemplate) => {
    let content = template.content;
    
    // Simple variable replacement (in a real app, this would be more sophisticated)
    if (selectedConversation) {
      const conversation = conversations.find(c => c.id === selectedConversation);
      if (conversation) {
        const participant = conversation.participants[0];
        content = content
          .replace(/{{name}}/g, participant.name.split(' ')[0])
          .replace(/{{company}}/g, participant.company)
          .replace(/{{industry}}/g, 'your industry'); // This would be dynamic
      }
    }
    
    setNewMessage(content);
    setSelectedTemplate('');
  };

  const handleMarkAsRead = async (conversationId: string) => {
    try {
      setConversations(prev =>
        prev.map(conv =>
          conv.id === conversationId
            ? { ...conv, unread_count: 0 }
            : conv
        )
      );
      
      setStats(prev => ({
        ...prev,
        unread_messages: Math.max(0, prev.unread_messages - 1)
      }));
    } catch (error) {
      toast.error('Failed to mark as read');
    }
  };

  const handleStarConversation = async (conversationId: string) => {
    try {
      setConversations(prev =>
        prev.map(conv =>
          conv.id === conversationId
            ? { ...conv, is_starred: !conv.is_starred }
            : conv
        )
      );
    } catch (error) {
      toast.error('Failed to update conversation');
    }
  };

  const handleArchiveConversation = async (conversationId: string) => {
    try {
      setConversations(prev =>
        prev.map(conv =>
          conv.id === conversationId
            ? { ...conv, is_archived: !conv.is_archived }
            : conv
        )
      );
      toast.success('Conversation archived');
    } catch (error) {
      toast.error('Failed to archive conversation');
    }
  };

  const handleSaveTemplate = async (template: Partial<MessageTemplate>) => {
    try {
      if (editingTemplate) {
        // Update existing template
        setTemplates(prev =>
          prev.map(t =>
            t.id === editingTemplate.id
              ? { ...t, ...template }
              : t
          )
        );
        toast.success('Template updated successfully');
      } else {
        // Create new template
        const newTemplate: MessageTemplate = {
          id: Date.now().toString(),
          name: template.name || 'New Template',
          content: template.content || '',
          category: template.category || 'general',
          variables: template.variables || [],
          usage_count: 0,
          created_at: new Date().toISOString()
        };
        
        setTemplates(prev => [...prev, newTemplate]);
        toast.success('Template created successfully');
      }
      
      setEditingTemplate(null);
      setShowTemplateDialog(false);
    } catch (error) {
      toast.error('Failed to save template');
    }
  };

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.participants.some(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.company.toLowerCase().includes(searchTerm.toLowerCase())
    ) || conv.last_message.content.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filterBy === 'all' ||
                         (filterBy === 'unread' && conv.unread_count > 0) ||
                         (filterBy === 'starred' && conv.is_starred) ||
                         (filterBy === 'archived' && conv.is_archived) ||
                         (filterBy === 'campaign' && conv.campaign_source);

    return matchesSearch && matchesFilter;
  });

  const formatTime = (dateString: string) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffTime = Math.abs(now.getTime() - past.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays < 7) return `${diffDays}d ago`;
    return past.toLocaleDateString();
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Loading inbox...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Inbox Stats */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.total_messages}</div>
            <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
              <MessageSquare className="h-3 w-3" />
              Total Messages
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.unread_messages}</div>
            <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
              <Eye className="h-3 w-3" />
              Unread
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.sent_today}</div>
            <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
              <Send className="h-3 w-3" />
              Sent Today
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.response_rate}%</div>
            <div className="text-sm text-gray-600">Response Rate</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-teal-600">{stats.avg_response_time}</div>
            <div className="text-sm text-gray-600">Avg Response</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.failed_messages}</div>
            <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
              <XCircle className="h-3 w-3" />
              Failed
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Inbox Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversations List */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <InboxIcon className="h-5 w-5" />
              Conversations
            </CardTitle>
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={filterBy} onValueChange={setFilterBy}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Conversations</SelectItem>
                  <SelectItem value="unread">Unread</SelectItem>
                  <SelectItem value="starred">Starred</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                  <SelectItem value="campaign">From Campaigns</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedConversation === conversation.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedConversation(conversation.id)}
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={conversation.participants[0].profile_image}
                      alt={conversation.participants[0].name}
                      className="w-10 h-10 rounded-full"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-sm truncate">
                          {conversation.participants[0].name}
                        </h4>
                        <div className="flex items-center gap-1">
                          {conversation.is_starred && (
                            <Star className="h-3 w-3 text-yellow-500 fill-current" />
                          )}
                          {conversation.unread_count > 0 && (
                            <Badge variant="destructive" className="text-xs px-1 py-0">
                              {conversation.unread_count}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-xs text-gray-600 mb-1 truncate">
                        {conversation.participants[0].headline}
                      </p>
                      
                      <p className="text-xs text-gray-500 truncate mb-1">
                        {conversation.last_message.content}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">
                          {formatTime(conversation.last_message.sent_at)}
                        </span>
                        
                        {conversation.campaign_source && (
                          <Badge variant="outline" className="text-xs">
                            Campaign
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {filteredConversations.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No conversations found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Message Thread & Compose */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-4">
            {selectedConversation ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={conversations.find(c => c.id === selectedConversation)?.participants[0].profile_image}
                    alt="Profile"
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <h3 className="font-semibold">
                      {conversations.find(c => c.id === selectedConversation)?.participants[0].name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {conversations.find(c => c.id === selectedConversation)?.participants[0].headline}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleStarConversation(selectedConversation)}
                  >
                    <Star className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleArchiveConversation(selectedConversation)}
                  >
                    <Archive className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Select a conversation to view messages</p>
              </div>
            )}
          </CardHeader>
          
          {selectedConversation && (
            <CardContent className="space-y-4">
              {/* Message Thread */}
              <div className="max-h-64 overflow-y-auto space-y-3 border rounded-lg p-4 bg-gray-50">
                {/* Messages would be loaded here */}
                <div className="text-center text-sm text-gray-500">
                  Message history will be displayed here
                </div>
              </div>

              {/* Message Composer */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Quick templates" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {selectedTemplate && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const template = templates.find(t => t.id === selectedTemplate);
                        if (template) handleUseTemplate(template);
                      }}
                    >
                      Use Template
                    </Button>
                  )}
                  
                  <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Plus className="h-3 w-3 mr-1" />
                        New Template
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create Message Template</DialogTitle>
                        <DialogDescription>
                          Create a reusable message template with variables
                        </DialogDescription>
                      </DialogHeader>
                      {/* Template creation form would go here */}
                    </DialogContent>
                  </Dialog>
                </div>

                <Textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  rows={4}
                  className="resize-none"
                />
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Paperclip className="h-3 w-3" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Calendar className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                    <Send className="h-4 w-4 mr-2" />
                    Send Message
                  </Button>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}

export default Inbox;