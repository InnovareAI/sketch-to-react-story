import { useState, useEffect } from "react";
import { supabase } from '@/integrations/supabase/client';
import { useLinkedInSync } from '@/hooks/useLinkedInSync';
import { useBusinessMetrics } from '@/hooks/useBusinessMetrics';
import { toast } from 'sonner';
import { previewSync } from '@/services/unipile/PreviewSync';
import FollowUpModal from '@/components/FollowUpModal';
import { getUserLinkedInAccounts } from '@/utils/userDataStorage';
// import MessageComposer from '@/components/MessageComposer'; // Temporarily disabled

interface Message {
  id: string;
  from: string;
  avatar: string;
  company: string;
  channel: string;
  messageType?: 'message' | 'inmail'; // Differentiate between regular LinkedIn messages and InMail
  subject: string;
  preview: string;
  time: string;
  read: boolean;
  priority?: string;
  tags?: string[];
  customTags?: string[]; // User-defined tags
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
  Star,
  MoreHorizontal,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Users,
  Calendar,
  RefreshCw,
  X,
  Tag,
  Linkedin,
  Plus,
  Send,
  Target
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
  const [searchFilter, setSearchFilter] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'read'>('all');
  const [filterTag, setFilterTag] = useState<string>('all');
  const [showTagModal, setShowTagModal] = useState(false);
  const [selectedMessageForTag, setSelectedMessageForTag] = useState<Message | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [selectedMessageForFollowUp, setSelectedMessageForFollowUp] = useState<Message | null>(null);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [filterAccount, setFilterAccount] = useState<string>('all');
  
  // Predefined tags
  const predefinedTags = [
    { value: 'important', label: 'Important', color: 'bg-red-100 text-red-800' },
    { value: 'follow-up', label: 'Follow Up', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'prospect', label: 'Prospect', color: 'bg-green-100 text-green-800' },
    { value: 'client', label: 'Client', color: 'bg-blue-100 text-blue-800' },
    { value: 'partner', label: 'Partner', color: 'bg-purple-100 text-purple-800' },
    { value: 'vendor', label: 'Vendor', color: 'bg-indigo-100 text-indigo-800' },
    { value: 'urgent', label: 'Urgent', color: 'bg-orange-100 text-orange-800' },
    { value: 'later', label: 'Later', color: 'bg-gray-100 text-gray-800' },
  ];
  
  // Use the LinkedIn sync hook and business metrics
  const { syncState, performManualSync, toggleAutoSync } = useLinkedInSync();
  const businessMetrics = useBusinessMetrics();
  
  // Modal states
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  
  // Form states
  const [replyContent, setReplyContent] = useState("");
  const [isManualSyncing, setIsManualSyncing] = useState(false);

  useEffect(() => {
    loadMessages();
    setupCloudSync();
    
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

  // Helper function to get workspace
  const getWorkspace = async () => {
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('id')
      .limit(1)
      .single();
    return workspace;
  };

  // Setup cloud-based background sync
  const setupCloudSync = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const workspace = await getWorkspace();
      if (!workspace) return;

      // Check if LinkedIn is connected using user-specific storage
      const accounts = await getUserLinkedInAccounts();
      if (accounts.length > 0) {
        const account = accounts[0];
        const accountId = account.unipileAccountId || account.id || account.account_id;
        
        if (accountId) {
          // Enable cloud sync through BackgroundSyncManager
          const { BackgroundSyncManager } = await import('@/services/BackgroundSyncManager');
          const syncManager = BackgroundSyncManager.getInstance();
          
          const result = await syncManager.enableBackgroundSync(
            workspace.id,
            accountId,
            30, // Sync every 30 minutes
            'both' // Sync both contacts and messages
          );
          
          if (result.success) {
            console.log('☁️ Cloud sync enabled for GlobalInbox - will continue syncing when page is closed');
          }
        }
      }
    } catch (error) {
      console.error('Error setting up cloud sync:', error);
    }
  };

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
        
        // Detect if this is an InMail message
        // InMail messages typically have certain characteristics:
        // 1. They might be marked in metadata
        // 2. They often have subject lines
        // 3. They may have specific keywords or patterns
        const isInMail = conv.metadata?.message_type === 'inmail' || 
                        conv.metadata?.is_inmail === true ||
                        (conv.platform === 'linkedin' && conv.metadata?.has_subject === true) ||
                        (latestMessage?.metadata?.type === 'inmail');
        
        // Build tags array
        const tags = [];
        if (conv.platform === 'linkedin') tags.push('LinkedIn');
        if (isInMail) tags.push('InMail');
        if (isPreviewOnly) {
          tags.push('Preview Only');
          tags.push(`${totalMessages} total`);
        } else {
          tags.push(`${messageCount} msgs`);
        }
        
        // Generate better avatar URL
        let avatarUrl = conv.participant_avatar_url;
        if (!avatarUrl || avatarUrl === '' || avatarUrl.includes('dicebear')) {
          // Use UI Avatars for a cleaner look with the person's initials
          const name = conv.participant_name || 'Unknown';
          avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0D8ABC&color=fff&size=200&font-size=0.4`;
        }
        
        return {
          id: conv.id, // Use actual conversation ID instead of index
          from: conv.participant_name || 'Unknown',
          avatar: avatarUrl,
          company: conv.participant_company || '',
          channel: conv.platform || 'linkedin',
          messageType: isInMail ? 'inmail' : 'message', // Add message type
          subject: `Message from ${conv.participant_name}`,
          preview: latestMessage?.content || conv.metadata?.last_message_preview || 'No message content',
          time: new Date(conv.last_message_at).toLocaleString('en-US', { 
            month: 'short',
            day: 'numeric',
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
          }),
          read: conv.metadata?.read === true || conv.status === 'active',
          priority: 'normal',
          tags,
          customTags: conv.metadata?.custom_tags || [],
          conversationData: conv, // Store the full conversation data
          isPreviewOnly,
          totalMessages
        };
      });
      
      setMessages(inboxMessages);
      
      // Also refresh business metrics when messages are loaded
      if (!businessMetrics.loading) {
        businessMetrics.refetch();
      }
    } catch (error) {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };


  // Mark all messages as read
  const markAllAsRead = async () => {
    try {
      // Update local state first for immediate UI feedback
      setMessages(prevMessages => 
        prevMessages.map(msg => ({ ...msg, read: true }))
      );
      
      // Get workspace ID
      const { data: workspace } = await supabase
        .from('workspaces')
        .select('id')
        .limit(1)
        .single();
        
      if (!workspace) {
        toast.error('No workspace found');
        return;
      }
      
      // Update all conversations in database to mark as read
      const { error } = await supabase
        .from('inbox_conversations')
        .update({ 
          status: 'active',
          metadata: supabase.sql`
            CASE 
              WHEN metadata IS NULL THEN '{"read": true}'::jsonb
              ELSE metadata || '{"read": true}'::jsonb
            END
          `
        })
        .eq('workspace_id', workspace.id)
        .in('status', ['unread', 'active']);
      
      if (error) {
        console.error('Error marking messages as read:', error);
        toast.error('Failed to mark all as read');
        // Revert local state on error
        await loadMessages();
      } else {
        toast.success('All messages marked as read');
      }
    } catch (error) {
      console.error('Error in markAllAsRead:', error);
      toast.error('Failed to mark messages as read');
      await loadMessages();
    }
  };

  // Add tags to message
  const addTagsToMessage = async (messageId: string, tags: string[]) => {
    try {
      // Update local state
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === messageId 
            ? { ...msg, customTags: tags }
            : msg
        )
      );
      
      // Update in database
      const { error } = await supabase
        .from('inbox_conversations')
        .update({ 
          metadata: supabase.sql`
            CASE 
              WHEN metadata IS NULL THEN jsonb_build_object('custom_tags', ${JSON.stringify(tags)}::jsonb)
              ELSE metadata || jsonb_build_object('custom_tags', ${JSON.stringify(tags)}::jsonb)
            END
          `
        })
        .eq('id', messageId);
      
      if (error) {
        console.error('Error adding tags:', error);
        toast.error('Failed to add tags');
        // Revert on error
        await loadMessages();
      } else {
        toast.success('Tags updated');
      }
    } catch (error) {
      console.error('Error in addTagsToMessage:', error);
      toast.error('Failed to update tags');
    }
  };

  // Open tag modal for a message
  const openTagModal = (message: Message) => {
    setSelectedMessageForTag(message);
    setSelectedTags(message.customTags || []);
    setShowTagModal(true);
  };

  // Save tags from modal
  const saveTags = async () => {
    if (selectedMessageForTag) {
      await addTagsToMessage(selectedMessageForTag.id, selectedTags);
      setShowTagModal(false);
      setSelectedMessageForTag(null);
      setSelectedTags([]);
    }
  };

  // Archive all read messages
  const archiveAllRead = async () => {
    try {
      const readMessages = messages.filter(m => m.read);
      if (readMessages.length === 0) {
        toast.info('No read messages to archive');
        return;
      }

      // Update local state first
      setMessages(prevMessages => prevMessages.filter(msg => !msg.read));
      
      // Get workspace ID
      const { data: workspace } = await supabase
        .from('workspaces')
        .select('id')
        .limit(1)
        .single();
        
      if (!workspace) {
        toast.error('No workspace found');
        return;
      }
      
      // Archive read conversations in database
      const { error } = await supabase
        .from('inbox_conversations')
        .update({ 
          status: 'archived',
          metadata: supabase.sql`
            CASE 
              WHEN metadata IS NULL THEN '{"archived": true, "archived_at": "' || NOW() || '"}'::jsonb
              ELSE metadata || ('{"archived": true, "archived_at": "' || NOW() || '"}')::jsonb
            END
          `
        })
        .eq('workspace_id', workspace.id)
        .eq('status', 'active')
        .in('metadata->read', [true]);
      
      if (error) {
        console.error('Error archiving messages:', error);
        toast.error('Failed to archive messages');
        await loadMessages(); // Reload on error
      } else {
        toast.success(`Archived ${readMessages.length} read messages`);
      }
    } catch (error) {
      console.error('Error in archiveAllRead:', error);
      toast.error('Failed to archive messages');
      await loadMessages();
    }
  };

  // Mark single message as read
  const markAsRead = async (messageId: string) => {
    try {
      // Update local state
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === messageId ? { ...msg, read: true } : msg
        )
      );
      
      // Update in database
      const { error } = await supabase
        .from('inbox_conversations')
        .update({ 
          status: 'active',
          metadata: supabase.sql`
            CASE 
              WHEN metadata IS NULL THEN '{"read": true}'::jsonb
              ELSE metadata || '{"read": true}'::jsonb
            END
          `
        })
        .eq('id', messageId);
      
      if (error) {
        console.error('Error marking message as read:', error);
        // Revert on error
        await loadMessages();
      }
    } catch (error) {
      console.error('Error in markAsRead:', error);
    }
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
      setReplyModalOpen(true);
    }
  };

  const handleScheduleMeeting = () => {
    if (selectedMessage) {
      // Navigate to calendar/settings for meeting scheduling
      toast.info('Opening calendar settings for meeting scheduling...');
      // This would navigate to the calendar integration in settings
      // For now, show a message that this will integrate with calendar settings
      setTimeout(() => {
        window.location.href = '/settings#calendar';
      }, 1000);
    }
  };

  const sendReply = async () => {
    try {
      if (!selectedMessage || !replyContent.trim()) {
        toast.error('Please enter a reply message');
        return;
      }
      
      toast.info('Sending reply via LinkedIn...');
      console.log('🔄 Sending reply via Unipile...');
      
      // Configure and send via Unipile API
      const { unipileRealTimeSync } = await import('@/services/unipile/UnipileRealTimeSync');
      
      // Check if Unipile is configured
      if (!unipileRealTimeSync.isConfigured()) {
        console.log('📝 Configuring Unipile for reply...');
        const { getUserLinkedInAccounts } = await import('@/utils/userDataStorage');
        const { getUnipileApiKey } = await import('@/config/unipile');
        
        const accounts = await getUserLinkedInAccounts();
        if (accounts.length > 0) {
          const account = accounts[0];
          const accountId = account.unipileAccountId || account.id || account.account_id;
          
          if (accountId) {
            unipileRealTimeSync.configure({
              apiKey: getUnipileApiKey(),
              accountId: accountId
            });
            console.log('✅ Unipile configured for reply');
          } else {
            throw new Error('No valid LinkedIn account ID found');
          }
        } else {
          throw new Error('No LinkedIn account connected');
        }
      }
      
      // Test connection and get accounts
      const connectionTest = await unipileRealTimeSync.testConnection();
      
      if (connectionTest.success && connectionTest.accounts.length > 0) {
        // Get the chat ID from conversation data
        const chatId = selectedMessage.conversationData?.platform_conversation_id;
        const account = connectionTest.accounts[0];
        
        console.log('📤 Sending reply:', {
          accountId: account.id,
          chatId: chatId,
          messageLength: replyContent.length
        });
        
        if (chatId && account) {
          // Send the actual message via Unipile
          const success = await unipileRealTimeSync.sendMessage(
            account.id,
            chatId, // Use chat ID as recipient
            replyContent
          );
          
          if (success) {
            console.log('✅ Reply sent successfully via Unipile');
            toast.success('Reply sent via LinkedIn!');
          } else {
            throw new Error('Failed to send message via Unipile');
          }
        } else {
          throw new Error('Missing chat ID or account information');
        }
      } else {
        throw new Error('Unable to connect to LinkedIn via Unipile');
      }
      
      // Save to our database for record keeping
      if (selectedMessage.conversationData?.id) {
        console.log('💾 Saving reply to database...');
        const { error } = await supabase
          .from('inbox_messages')
          .insert({
            conversation_id: selectedMessage.conversationData.id,
            role: 'user',
            content: replyContent,
            metadata: {
              type: 'reply',
              sender_name: 'You',
              direction: 'outbound',
              timestamp: new Date().toISOString(),
              sent_via: 'unipile',
              platform: 'linkedin'
            }
          });
          
        if (error) {
          console.error('Error saving reply to database:', error);
          // Don't fail the whole operation if DB save fails
          toast.warning('Reply sent but not saved to history');
        } else {
          console.log('✅ Reply saved to database');
        }
      }

      setReplyModalOpen(false);
      setReplyContent("");
      
      // Refresh messages to show the new reply
      setTimeout(() => {
        loadMessages();
      }, 1000);
      
    } catch (error) {
      console.error('❌ Error sending reply:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to send reply: ${errorMessage}`);
    }
  };


  // Empty messages array - will be populated from database
  const demoMessages: Message[] = [];

  const getChannelIcon = (channel: string, messageType?: string) => {
    switch (channel) {
      case "email": return <Mail className="h-4 w-4 text-blue-600" />;
      case "linkedin":
        // Show different icons for regular messages vs InMail
        if (messageType === 'inmail') {
          return (
            <div className="relative">
              <Linkedin className="h-4 w-4 text-blue-700" />
              <Send className="h-2 w-2 text-blue-700 absolute -bottom-0.5 -right-0.5" />
            </div>
          );
        }
        return <Linkedin className="h-4 w-4 text-blue-700" />;
      case "whatsapp": return <MessageSquare className="h-4 w-4 text-green-600" />;
      case "phone": return <Phone className="h-4 w-4 text-purple-600" />;
      default: return <Mail className="h-4 w-4" />;
    }
  };

  // Filter messages based on search and filter type
  const filteredMessages = messages.filter(message => {
    // Filter by read/unread status
    if (filterType === 'unread' && message.read) return false;
    if (filterType === 'read' && !message.read) return false;
    
    // Filter by tag
    if (filterTag !== 'all' && !message.customTags?.includes(filterTag)) return false;
    
    // Filter by search term
    if (searchFilter) {
      const searchLower = searchFilter.toLowerCase();
      const searchMatch = (
        message.from.toLowerCase().includes(searchLower) ||
        message.company.toLowerCase().includes(searchLower) ||
        message.preview.toLowerCase().includes(searchLower) ||
        message.subject.toLowerCase().includes(searchLower)
      );
      if (!searchMatch) return false;
    }
    
    return true;
  });

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
          <h1 className="text-3xl font-bold text-gray-900">Team Inbox</h1>
          <p className="text-gray-600 mt-1">
            Manage all your conversations across channels
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
            onClick={markAllAsRead}
            disabled={messages.length === 0 || messages.every(m => m.read)}
            title="Mark all messages as read"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Mark All Read
          </Button>
          <DropdownMenu open={showFilterDropdown} onOpenChange={setShowFilterDropdown}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="p-2">
                <div className="text-sm font-medium mb-2">Filter by Status</div>
                <div className="space-y-1">
                  <Button
                    variant={filterType === 'all' ? 'default' : 'ghost'}
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => {
                      setFilterType('all');
                      setShowFilterDropdown(false);
                    }}
                  >
                    All Messages
                  </Button>
                  <Button
                    variant={filterType === 'unread' ? 'default' : 'ghost'}
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => {
                      setFilterType('unread');
                      setActiveTab('unread');
                      setShowFilterDropdown(false);
                    }}
                  >
                    Unread Only
                  </Button>
                  <Button
                    variant={filterType === 'read' ? 'default' : 'ghost'}
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => {
                      setFilterType('read');
                      setShowFilterDropdown(false);
                    }}
                  >
                    Read Only
                  </Button>
                </div>
              </div>
              <DropdownMenuSeparator />
              <div className="p-2">
                <div className="text-sm font-medium mb-2">Filter by Tag</div>
                <div className="space-y-1">
                  <Button
                    variant={filterTag === 'all' ? 'default' : 'ghost'}
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => {
                      setFilterTag('all');
                      setShowFilterDropdown(false);
                    }}
                  >
                    All Tags
                  </Button>
                  {predefinedTags.map(tag => (
                    <Button
                      key={tag.value}
                      variant={filterTag === tag.value ? 'default' : 'ghost'}
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => {
                        setFilterTag(tag.value);
                        setShowFilterDropdown(false);
                      }}
                    >
                      {tag.label}
                    </Button>
                  ))}
                </div>
              </div>
              <DropdownMenuSeparator />
              <div className="p-2">
                <div className="text-sm font-medium mb-2">Filter by LinkedIn Account</div>
                <div className="space-y-1">
                  <Button
                    variant={filterAccount === 'all' ? 'default' : 'ghost'}
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => {
                      setFilterAccount('all');
                      setShowFilterDropdown(false);
                    }}
                  >
                    All Accounts
                  </Button>
                  <Button
                    variant={filterAccount === 'primary' ? 'default' : 'ghost'}
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => {
                      setFilterAccount('primary');
                      setShowFilterDropdown(false);
                    }}
                  >
                    Primary Account
                  </Button>
                  <Button
                    variant={filterAccount === 'team1' ? 'default' : 'ghost'}
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => {
                      setFilterAccount('team1');
                      setShowFilterDropdown(false);
                    }}
                  >
                    Team Account 1
                  </Button>
                  <Button
                    variant={filterAccount === 'team2' ? 'default' : 'ghost'}
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => {
                      setFilterAccount('team2');
                      setShowFilterDropdown(false);
                    }}
                  >
                    Team Account 2
                  </Button>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button 
            variant="outline"
            onClick={archiveAllRead}
            disabled={messages.filter(m => m.read).length === 0}
            title={`Archive ${messages.filter(m => m.read).length} read messages`}
          >
            <Archive className="h-4 w-4 mr-2" />
            Archive All Read ({messages.filter(m => m.read).length})
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by name, company, or message..."
              className="pl-10"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
            />
            {searchFilter && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
                onClick={() => setSearchFilter('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <select 
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as 'all' | 'unread' | 'read')}
          >
            <option value="all">All Messages</option>
            <option value="unread">Unread Only</option>
            <option value="read">Read Only</option>
          </select>
          <select 
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
            value={filterTag}
            onChange={(e) => setFilterTag(e.target.value)}
          >
            <option value="all">All Tags</option>
            {predefinedTags.map(tag => (
              <option key={tag.value} value={tag.value}>{tag.label}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">
            {filteredMessages.length === messages.length ? (
              `${messages.length} messages`
            ) : (
              `${filteredMessages.length} of ${messages.length}`
            )}
          </span>
          {(searchFilter || filterType !== 'all' || filterTag !== 'all') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchFilter('');
                setFilterType('all');
                setFilterTag('all');
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* Business Metrics Stats - Real Data from Supabase */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {businessMetrics.loading ? '...' : businessMetrics.totalMessages.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Total Messages</div>
                {messages.filter(m => !m.read).length > 0 && (
                  <Badge className="mt-1 bg-blue-100 text-blue-800">
                    {messages.filter(m => !m.read).length} unread
                  </Badge>
                )}
                {businessMetrics.error && (
                  <Badge className="mt-1 bg-red-100 text-red-800">
                    Error loading
                  </Badge>
                )}
              </div>
              <Inbox className="h-8 w-8 text-premium-purple" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Team + User Level
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {businessMetrics.loading ? '...' : businessMetrics.connectionsAccepted.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Connection Requests Accepted</div>
                <Badge className="mt-1 bg-green-100 text-green-800">
                  +{businessMetrics.loading ? '...' : businessMetrics.connectionsThisWeek} this week
                </Badge>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Growing network
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {businessMetrics.loading ? '...' : businessMetrics.interestedContacts.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Interested</div>
                <Badge className="mt-1 bg-orange-100 text-orange-800">
                  +{businessMetrics.loading ? '...' : businessMetrics.interestedThisWeek} this week
                </Badge>
              </div>
              <Target className="h-8 w-8 text-orange-600" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Engaged leads
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {businessMetrics.loading ? '...' : businessMetrics.meetingsBooked.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Meetings Booked</div>
                <Badge className="mt-1 bg-purple-100 text-purple-800">
                  +{businessMetrics.loading ? '...' : businessMetrics.meetingsThisWeek} this week
                </Badge>
              </div>
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Conversion success
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
                        Messages will appear here once synced from LinkedIn
                      </p>
                    </div>
                  ) : filteredMessages.length === 0 ? (
                    <div className="p-8 text-center">
                      <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No messages match your filter</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Try adjusting your search or filter criteria
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-4"
                        onClick={() => {
                          setSearchFilter('');
                          setFilterType('all');
                        }}
                      >
                        Clear Filters
                      </Button>
                    </div>
                  ) : (
                    filteredMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors ${
                        selectedMessage?.id === message.id ? "bg-muted" : ""
                      } ${!message.read ? "bg-blue-50" : ""}`}
                      onClick={async () => {
                        setSelectedMessage(message);
                        
                        // Mark as read when selected
                        if (!message.read) {
                          await markAsRead(message.id);
                        }
                        
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
                          {message.avatar && message.avatar !== '' ? (
                            <AvatarImage 
                              src={message.avatar} 
                              alt={message.from}
                              onError={(e) => {
                                // If image fails to load, hide it to show fallback
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : null}
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-medium">
                            {message.from.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {getChannelIcon(message.channel, message.messageType)}
                              <span className={`text-sm font-medium ${!message.read ? "font-semibold" : ""}`}>
                                {message.from}
                              </span>
                              {message.messageType === 'inmail' && (
                                <Badge variant="outline" className="text-xs h-5 px-1.5">
                                  InMail
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">{formatTime(message.time)}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedMessage(message);
                                  setReplyModalOpen(true);
                                }}
                                title="Reply to message"
                              >
                                <Reply className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openTagModal(message);
                                }}
                                title="Add tags"
                              >
                                <Tag className="h-3 w-3" />
                              </Button>
                            </div>
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
                            {message.customTags?.map((tagValue, index) => {
                              const tag = predefinedTags.find(t => t.value === tagValue);
                              return (
                                <Badge 
                                  key={`custom-${index}`} 
                                  className={`text-xs ${tag?.color || 'bg-gray-100 text-gray-800'}`}
                                >
                                  {tag?.label || tagValue}
                                </Badge>
                              );
                            })}
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
                      {getChannelIcon(selectedMessage.channel, selectedMessage.messageType)}
                      <CardTitle className="text-lg">{selectedMessage.from}</CardTitle>
                      {selectedMessage.messageType === 'inmail' && (
                        <Badge variant="outline" className="text-xs h-5 px-1.5">
                          InMail
                        </Badge>
                      )}
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
                    {selectedMessage.conversationData?.last_message_at ? 
                      new Date(selectedMessage.conversationData.last_message_at).toLocaleString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      }) : selectedMessage.time}
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
                                      {new Date(msg.created_at || msg.metadata?.timestamp || Date.now()).toLocaleString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric',
                                        hour: 'numeric',
                                        minute: '2-digit',
                                        hour12: true
                                      })}
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
                  
                  {/* LinkedIn messaging button - appears when LinkedIn URL available */}
                  {(selectedMessage?.conversationData?.metadata?.linkedin_message_url || 
                    selectedMessage?.conversationData?.metadata?.participant_linkedin_url) && (
                    <Button 
                      variant="outline"
                      onClick={() => {
                        const linkedinUrl = selectedMessage.conversationData.metadata.linkedin_message_url || 
                                          selectedMessage.conversationData.metadata.participant_linkedin_url;
                        window.open(linkedinUrl, '_blank');
                        toast.success('Opening LinkedIn messaging...');
                      }}
                      title="Message this contact directly on LinkedIn"
                    >
                      <Linkedin className="h-4 w-4 mr-2" />
                      Message on LinkedIn
                    </Button>
                  )}
                  
                  <Button variant="outline" onClick={handleScheduleMeeting}>
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule Meeting
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
                if (!newMessageRecipient || !newMessageContent) {
                  toast.error('Please enter recipient and message');
                  return;
                }

                // Import and use Unipile API
                const { unipileRealTimeSync } = await import('@/services/unipile/UnipileRealTimeSync');
                const accounts = await unipileRealTimeSync.testConnection();
                
                if (accounts.success && accounts.accounts.length > 0) {
                  const account = accounts.accounts[0];
                  
                  // For now, create a new conversation in the database
                  const { data: newConv, error } = await supabase
                    .from('inbox_conversations')
                    .insert({
                      workspace_id: workspaceId,
                      platform: 'linkedin',
                      platform_conversation_id: `new_${Date.now()}`,
                      participant_name: newMessageRecipient,
                      participant_company: 'LinkedIn User',
                      status: 'active',
                      last_message_at: new Date().toISOString()
                    })
                    .select()
                    .single();

                  if (error) throw error;

                  // Add the message
                  const { error: msgError } = await supabase
                    .from('inbox_messages')
                    .insert({
                      conversation_id: newConv.id,
                      role: 'user',
                      content: newMessageContent,
                      metadata: { direction: 'outbound', type: 'message' }
                    });

                  if (msgError) throw msgError;

                  toast.success('Message sent successfully!');
                  loadMessages();
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

      {/* Tag Modal */}
      <Dialog open={showTagModal} onOpenChange={setShowTagModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Tags</DialogTitle>
            <DialogDescription>
              Add or remove tags for this conversation
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Tags</Label>
              <div className="grid grid-cols-2 gap-2">
                {predefinedTags.map((tag) => (
                  <Button
                    key={tag.value}
                    variant={selectedTags.includes(tag.value) ? "default" : "outline"}
                    size="sm"
                    className={`justify-start ${
                      selectedTags.includes(tag.value) ? '' : tag.color
                    }`}
                    onClick={() => {
                      if (selectedTags.includes(tag.value)) {
                        setSelectedTags(selectedTags.filter(t => t !== tag.value));
                      } else {
                        setSelectedTags([...selectedTags, tag.value]);
                      }
                    }}
                  >
                    {selectedTags.includes(tag.value) && (
                      <CheckCircle className="h-3 w-3 mr-1" />
                    )}
                    {tag.label}
                  </Button>
                ))}
              </div>
            </div>
            {selectedMessageForTag && (
              <div className="text-sm text-muted-foreground">
                <span className="font-medium">Message from:</span> {selectedMessageForTag.from}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowTagModal(false);
                setSelectedMessageForTag(null);
                setSelectedTags([]);
              }}
            >
              Cancel
            </Button>
            <Button onClick={saveTags}>
              Save Tags
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Follow-Up Modal */}
      {showFollowUpModal && (
        <FollowUpModal
          isOpen={showFollowUpModal}
          onClose={() => {
            setShowFollowUpModal(false);
            setSelectedMessageForFollowUp(null);
          }}
          message={selectedMessageForFollowUp ? {
            id: selectedMessageForFollowUp.id,
            from: selectedMessageForFollowUp.from,
            company: selectedMessageForFollowUp.company,
            subject: selectedMessageForFollowUp.subject,
            channel: selectedMessageForFollowUp.channel,
            conversationData: selectedMessageForFollowUp.conversationData
          } : undefined}
          onSend={(followUpData) => {
            console.log('Follow-up created:', followUpData);
            toast('Follow-up scheduled successfully');
            // Refresh messages to show follow-up indicator
            loadMessages();
          }}
        />
      )}
    </div>
  );
}