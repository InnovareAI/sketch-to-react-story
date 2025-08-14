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
import { inboxService, type InboxConversation, type InboxMessage, type InboxStats } from '@/services/InboxService';
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

// Using types from InboxService
type Conversation = InboxConversation & {
  last_message?: InboxMessage;
  campaign_source?: string;
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

// Using InboxStats from service

interface InboxProps {
  className?: string;
}

export function Inbox({ className }: InboxProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [stats, setStats] = useState<InboxStats>({
    total_conversations: 0,
    unread_conversations: 0,
    starred_conversations: 0,
    messages_today: 0,
    last_sync_at: null
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
      
      // Load real conversations from database
      const [conversationsData, statsData] = await Promise.all([
        inboxService.loadConversations(),
        inboxService.getInboxStats()
      ]);
      
      setConversations(conversationsData);
      setStats(statsData);
      
      console.log(`✅ Loaded ${conversationsData.length} conversations`);

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
      await inboxService.sendMessage(selectedConversation, newMessage);
      
      toast.success('Message sent successfully');
      setNewMessage('');
      
      // Refresh conversation list and messages
      await loadInboxData();
      if (selectedConversation) {
        const updatedMessages = await inboxService.loadMessages(selectedConversation);
        setMessages(updatedMessages);
      }
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
      await inboxService.markAsRead(conversationId);
      
      setConversations(prev =>
        prev.map(conv =>
          conv.id === conversationId
            ? { ...conv, unread_count: 0, status: 'active' }
            : conv
        )
      );
      
      setStats(prev => ({
        ...prev,
        unread_conversations: Math.max(0, prev.unread_conversations - 1)
      }));
      
      toast.success('Marked as read');
    } catch (error) {
      toast.error('Failed to mark as read');
    }
  };

  const handleStarConversation = async (conversationId: string) => {
    try {
      const conversation = conversations.find(c => c.id === conversationId);
      if (!conversation) return;
      
      const newStarredState = !conversation.is_starred;
      await inboxService.toggleStar(conversationId, newStarredState);
      
      setConversations(prev =>
        prev.map(conv =>
          conv.id === conversationId
            ? { ...conv, is_starred: newStarredState }
            : conv
        )
      );
      
      setStats(prev => ({
        ...prev,
        starred_conversations: newStarredState 
          ? prev.starred_conversations + 1
          : Math.max(0, prev.starred_conversations - 1)
      }));
      
      toast.success(newStarredState ? 'Conversation starred' : 'Star removed');
    } catch (error) {
      toast.error('Failed to update conversation');
    }
  };

  const handleArchiveConversation = async (conversationId: string) => {
    try {
      const conversation = conversations.find(c => c.id === conversationId);
      if (!conversation) return;
      
      const newArchivedState = !conversation.is_archived;
      await inboxService.toggleArchive(conversationId, newArchivedState);
      
      setConversations(prev =>
        prev.map(conv =>
          conv.id === conversationId
            ? { ...conv, is_archived: newArchivedState }
            : conv
        )
      );
      
      toast.success(newArchivedState ? 'Conversation archived' : 'Conversation unarchived');
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
    const matchesSearch = conv.participant_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conv.participant_company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         searchTerm === '';

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
            <div className="text-2xl font-bold text-blue-600">{stats.total_conversations}</div>
            <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
              <MessageSquare className="h-3 w-3" />
              Total Conversations
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.unread_conversations}</div>
            <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
              <Eye className="h-3 w-3" />
              Unread
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.starred_conversations}</div>
            <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
              <Star className="h-3 w-3" />
              Starred
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.messages_today}</div>
            <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
              <Send className="h-3 w-3" />
              Sent Today
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-teal-600">
              {stats.last_sync_at ? formatTime(stats.last_sync_at) : 'Never'}
            </div>
            <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
              <RefreshCw className="h-3 w-3" />
              Last Sync
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={async () => {
                try {
                  toast.info('Syncing LinkedIn data...');
                  await inboxService.triggerSync();
                  await loadInboxData();
                  toast.success('Sync completed');
                } catch (error) {
                  toast.error('Sync failed');
                }
              }}
              className="w-full h-12"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Sync Now
            </Button>
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
                  onClick={async () => {
                    setSelectedConversation(conversation.id);
                    try {
                      const messagesData = await inboxService.loadMessages(conversation.id);
                      setMessages(messagesData);
                      
                      // Mark as read when opening
                      if (conversation.unread_count > 0) {
                        await handleMarkAsRead(conversation.id);
                      }
                    } catch (error) {
                      console.error('Failed to load messages:', error);
                    }
                  }}
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={conversation.participant_avatar_url || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(conversation.participant_name || 'U')}
                      alt={conversation.participant_name}
                      className="w-10 h-10 rounded-full"
                      onError={(e) => {
                        e.currentTarget.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(conversation.participant_name || 'U');
                      }}
                    />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-sm truncate">
                          {conversation.participant_name}
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
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStarConversation(conversation.id);
                            }}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            <Star className={`h-3 w-3 ${conversation.is_starred ? 'text-yellow-500 fill-current' : 'text-gray-400'}`} />
                          </button>
                        </div>
                      </div>
                      
                      <p className="text-xs text-gray-600 mb-1 truncate">
                        {conversation.participant_company}
                      </p>
                      
                      <p className="text-xs text-gray-500 truncate mb-1">
                        {conversation.metadata?.chat_subject || 'LinkedIn conversation'}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">
                          {formatTime(conversation.last_message_at)}
                        </span>
                        
                        {conversation.campaign_source && (
                          <Badge variant="outline" className="text-xs">
                            Campaign
                          </Badge>
                        )}
                        
                        {conversation.metadata?.chat_type === 'inmail' && (
                          <Badge variant="secondary" className="text-xs">
                            InMail
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
                    src={conversations.find(c => c.id === selectedConversation)?.participant_avatar_url || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(conversations.find(c => c.id === selectedConversation)?.participant_name || 'U')}
                    alt="Profile"
                    className="w-10 h-10 rounded-full"
                    onError={(e) => {
                      const conv = conversations.find(c => c.id === selectedConversation);
                      e.currentTarget.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(conv?.participant_name || 'U');
                    }}
                  />
                  <div>
                    <h3 className="font-semibold">
                      {conversations.find(c => c.id === selectedConversation)?.participant_name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {conversations.find(c => c.id === selectedConversation)?.participant_company}
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
                {messages.length > 0 ? (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.role === 'user'
                            ? 'bg-blue-500 text-white'
                            : 'bg-white border'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className={`text-xs mt-1 ${
                          message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {formatTime(message.created_at)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-sm text-gray-500">
                    No messages loaded yet. Click on a conversation to load messages.
                  </div>
                )}
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