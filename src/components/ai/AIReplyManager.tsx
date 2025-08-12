// AI-Powered Reply Management System
// Intelligent response handling across LinkedIn, Email, and WhatsApp via Unipile

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { 
  Brain,
  MessageCircle,
  Zap,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Send,
  Edit,
  Archive,
  Star,
  Trash2,
  Eye,
  EyeOff,
  Filter,
  Search,
  Calendar,
  User,
  Building,
  MapPin,
  LinkedinIcon,
  Mail,
  Smartphone,
  MessageSquare,
  BarChart3,
  Target,
  Sparkles,
  Robot,
  Users,
  Globe,
  Play,
  Pause,
  Settings,
  Plus,
  Download
} from 'lucide-react';
import { toast } from 'sonner';

interface IncomingMessage {
  id: string;
  conversation_id: string;
  channel: 'linkedin' | 'email' | 'whatsapp';
  sender: {
    id: string;
    name: string;
    email?: string;
    profile_url?: string;
    profile_image?: string;
    company?: string;
    position?: string;
  };
  content: {
    subject?: string;
    body: string;
    attachments?: Array<{
      name: string;
      url: string;
      type: string;
    }>;
  };
  received_at: string;
  ai_analysis: {
    intent: 'interested' | 'not_interested' | 'question' | 'objection' | 'meeting_request' | 'pricing' | 'competitor_mention' | 'referral' | 'out_of_office';
    sentiment: 'positive' | 'neutral' | 'negative';
    urgency: 'low' | 'medium' | 'high' | 'critical';
    buying_signals: string[];
    objections: string[];
    questions: string[];
    next_best_action: string;
    confidence_score: number; // 0-100
  };
  ai_suggested_reply: {
    content: string;
    tone: string;
    reasoning: string;
    confidence: number;
    alternatives: Array<{
      content: string;
      focus: string;
      score: number;
    }>;
  };
  status: 'unread' | 'ai_analyzed' | 'human_reviewed' | 'replied' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'critical';
  campaign_source?: string;
  auto_reply_eligible: boolean;
}

interface ReplyTemplate {
  id: string;
  name: string;
  intent_trigger: string[];
  template_content: string;
  ai_instructions: string;
  success_rate: number;
  usage_count: number;
  channels: string[];
  auto_send: boolean;
  created_at: string;
}

interface AutoReplyRules {
  id: string;
  name: string;
  enabled: boolean;
  conditions: {
    intents: string[];
    sentiment: string[];
    urgency: string[];
    channels: string[];
    business_hours_only: boolean;
    confidence_threshold: number;
  };
  actions: {
    send_auto_reply: boolean;
    notify_human: boolean;
    update_prospect_status: boolean;
    trigger_follow_up: boolean;
    add_to_calendar: boolean;
  };
  template_id?: string;
  created_at: string;
}

interface ReplyStats {
  total_messages: number;
  unread_count: number;
  ai_analyzed: number;
  auto_replies_sent: number;
  response_rate: number;
  avg_response_time: string;
  positive_sentiment: number;
  meeting_requests: number;
}

interface AIReplyManagerProps {
  className?: string;
}

export function AIReplyManager({ className }: AIReplyManagerProps) {
  const [messages, setMessages] = useState<IncomingMessage[]>([]);
  const [templates, setTemplates] = useState<ReplyTemplate[]>([]);
  const [autoReplyRules, setAutoReplyRules] = useState<AutoReplyRules[]>([]);
  const [stats, setStats] = useState<ReplyStats>({
    total_messages: 0,
    unread_count: 0,
    ai_analyzed: 0,
    auto_replies_sent: 0,
    response_rate: 0,
    avg_response_time: '0h',
    positive_sentiment: 0,
    meeting_requests: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const [filterBy, setFilterBy] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [replyContent, setReplyContent] = useState('');
  const [aiProcessing, setAiProcessing] = useState(false);

  useEffect(() => {
    loadReplyData();
    // Set up real-time message monitoring
    const interval = setInterval(() => {
      checkForNewMessages();
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const loadReplyData = async () => {
    try {
      setLoading(true);
      
      // Mock data for demonstration
      setStats({
        total_messages: 1847,
        unread_count: 23,
        ai_analyzed: 1824,
        auto_replies_sent: 247,
        response_rate: 67.3,
        avg_response_time: '2h 34m',
        positive_sentiment: 73,
        meeting_requests: 12
      });

      setMessages([
        {
          id: '1',
          conversation_id: 'conv_1',
          channel: 'linkedin',
          sender: {
            id: 'user_1',
            name: 'Sarah Chen',
            profile_url: 'https://linkedin.com/in/sarahchen',
            profile_image: 'https://via.placeholder.com/40',
            company: 'TechNovate Solutions',
            position: 'VP of Sales'
          },
          content: {
            body: 'Thanks for reaching out! I\'m definitely interested in learning more about how your AI solution could help streamline our lead qualification process. We\'re currently using HubSpot but finding it quite manual. Could we schedule a 15-minute call next week to discuss?'
          },
          received_at: '2024-01-22T15:30:00Z',
          ai_analysis: {
            intent: 'meeting_request',
            sentiment: 'positive',
            urgency: 'high',
            buying_signals: [
              'Definitely interested in learning more',
              'Looking to streamline process',
              'Ready to schedule a call',
              'Specific pain point mentioned (manual process)'
            ],
            objections: [],
            questions: [],
            next_best_action: 'Schedule meeting immediately - high buying intent detected',
            confidence_score: 94
          },
          ai_suggested_reply: {
            content: 'Hi Sarah, fantastic to hear about your interest! I\'d be happy to show you how we\'ve helped similar VP-level sales leaders reduce manual qualification by 67% while improving lead quality.\n\nI have availability next Tuesday at 2 PM or Wednesday at 10 AM EST. Which works better for you?\n\nI\'ll send a brief agenda beforehand focusing specifically on HubSpot integration and your lead qualification challenges.',
            tone: 'Professional & Enthusiastic',
            reasoning: 'High buying intent detected. Prospect specifically mentioned pain point (manual process) and requested a meeting. Quick response with specific times shows professionalism. Mentioning similar clients builds credibility.',
            confidence: 91,
            alternatives: [
              {
                content: 'Sarah, excellent! Let me send you a calendar link to book 15 minutes next week. I\'ll prepare some specific examples of HubSpot integrations that have helped similar teams.',
                focus: 'efficiency-focused',
                score: 87
              },
              {
                content: 'Hi Sarah, I\'m excited you\'re interested! I have some great case studies from other VP Sales leaders who\'ve streamlined their qualification process. When would be a good time for a brief call?',
                focus: 'social-proof-focused',
                score: 85
              }
            ]
          },
          status: 'ai_analyzed',
          priority: 'high',
          campaign_source: 'SaaS VP Outreach',
          auto_reply_eligible: false
        },
        {
          id: '2',
          conversation_id: 'conv_2',
          channel: 'email',
          sender: {
            id: 'user_2',
            name: 'Mike Rodriguez',
            email: 'mike.rodriguez@growthtech.com',
            company: 'GrowthTech',
            position: 'Head of Marketing'
          },
          content: {
            subject: 'Re: AI-Powered Lead Intelligence',
            body: 'Hi there, thanks for reaching out. We\'re pretty happy with our current solution and not looking to make any changes right now. Maybe check back in 6 months?'
          },
          received_at: '2024-01-22T14:45:00Z',
          ai_analysis: {
            intent: 'not_interested',
            sentiment: 'neutral',
            urgency: 'low',
            buying_signals: [],
            objections: ['Happy with current solution', 'Not looking to make changes'],
            questions: [],
            next_best_action: 'Nurture sequence - add to 6-month follow-up campaign',
            confidence_score: 88
          },
          ai_suggested_reply: {
            content: 'Thanks for the honest feedback, Mike! I completely understand - switching solutions is a big decision.\n\nI\'ll make a note to follow up in 6 months. In the meantime, if you\'re interested, I\'d be happy to send you our monthly newsletter with marketing intelligence trends that other Head of Marketing folks find valuable.\n\nNo pressure at all - just want to stay helpful!',
            tone: 'Understanding & Professional',
            reasoning: 'Prospect clearly not ready now but open to future contact. Maintain relationship with value-add content. Respect their timeline while keeping door open.',
            confidence: 83,
            alternatives: [
              {
                content: 'Understood, Mike. I\'ll set a reminder for 6 months. Best of luck with your current solution!',
                focus: 'brief-respectful',
                score: 78
              }
            ]
          },
          status: 'ai_analyzed',
          priority: 'low',
          campaign_source: 'Marketing Leaders Campaign',
          auto_reply_eligible: true
        }
      ]);

      setTemplates([
        {
          id: '1',
          name: 'Meeting Request Response',
          intent_trigger: ['meeting_request', 'interested'],
          template_content: 'Thank you for your interest! I have availability on [TIMES]. Which works better for you?',
          ai_instructions: 'Respond enthusiastically to meeting requests, provide 2-3 specific time slots, mention what will be covered in the meeting.',
          success_rate: 89.3,
          usage_count: 156,
          channels: ['linkedin', 'email'],
          auto_send: false,
          created_at: '2024-01-15T10:00:00Z'
        }
      ]);

      setAutoReplyRules([
        {
          id: '1',
          name: 'Auto-Reply Not Interested',
          enabled: true,
          conditions: {
            intents: ['not_interested'],
            sentiment: ['neutral', 'negative'],
            urgency: ['low'],
            channels: ['email', 'linkedin'],
            business_hours_only: false,
            confidence_threshold: 80
          },
          actions: {
            send_auto_reply: true,
            notify_human: false,
            update_prospect_status: true,
            trigger_follow_up: true,
            add_to_calendar: false
          },
          template_id: '1',
          created_at: '2024-01-10T09:00:00Z'
        }
      ]);

    } catch (error) {
      console.error('Error loading reply data:', error);
      toast.error('Failed to load reply management data');
    } finally {
      setLoading(false);
    }
  };

  const checkForNewMessages = async () => {
    try {
      // This would call Unipile API to check for new messages across all channels
      // and trigger AI analysis via n8n workflow
      console.log('Checking for new messages via Unipile...');
    } catch (error) {
      console.error('Error checking for new messages:', error);
    }
  };

  const handleAIAnalysis = async (messageId: string) => {
    try {
      setAiProcessing(true);
      
      // This would trigger the n8n workflow to analyze the message with AI
      toast.success('AI analysis initiated - results in 30 seconds');
      
      // Update message status
      setMessages(prev =>
        prev.map(msg =>
          msg.id === messageId
            ? { ...msg, status: 'ai_analyzed' as const }
            : msg
        )
      );

    } catch (error) {
      toast.error('Failed to analyze message');
    } finally {
      setAiProcessing(false);
    }
  };

  const handleSendReply = async (messageId: string, content: string) => {
    try {
      const message = messages.find(m => m.id === messageId);
      if (!message) return;

      // This would send via Unipile API based on the original channel
      toast.success(`Reply sent via ${message.channel.toUpperCase()}`);
      
      // Update message status
      setMessages(prev =>
        prev.map(msg =>
          msg.id === messageId
            ? { ...msg, status: 'replied' as const }
            : msg
        )
      );

      setReplyContent('');
      setSelectedMessage(null);

    } catch (error) {
      toast.error('Failed to send reply');
    }
  };

  const handleAutoReply = async (messageId: string) => {
    try {
      const message = messages.find(m => m.id === messageId);
      if (!message || !message.auto_reply_eligible) return;

      // Send the AI-suggested reply automatically
      await handleSendReply(messageId, message.ai_suggested_reply.content);
      
      setStats(prev => ({
        ...prev,
        auto_replies_sent: prev.auto_replies_sent + 1
      }));

    } catch (error) {
      toast.error('Failed to send auto-reply');
    }
  };

  const filteredMessages = messages.filter(message => {
    const matchesSearch = message.sender.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.content.body.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (message.sender.company || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filterBy === 'all' ||
                         (filterBy === 'unread' && message.status === 'unread') ||
                         (filterBy === 'high_priority' && message.priority === 'high') ||
                         (filterBy === 'positive' && message.ai_analysis.sentiment === 'positive') ||
                         (filterBy === 'meetings' && message.ai_analysis.intent === 'meeting_request');

    return matchesSearch && matchesFilter;
  });

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'linkedin': return <LinkedinIcon className="h-4 w-4" />;
      case 'email': return <Mail className="h-4 w-4" />;
      case 'whatsapp': return <Smartphone className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getChannelColor = (channel: string) => {
    switch (channel) {
      case 'linkedin': return 'bg-blue-100 text-blue-800';
      case 'email': return 'bg-gray-100 text-gray-800';
      case 'whatsapp': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getIntentColor = (intent: string) => {
    switch (intent) {
      case 'interested':
      case 'meeting_request': return 'bg-green-100 text-green-800';
      case 'question':
      case 'objection': return 'bg-yellow-100 text-yellow-800';
      case 'not_interested': return 'bg-red-100 text-red-800';
      case 'pricing': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600';
      case 'negative': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Loading AI reply management...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Reply Management Stats */}
      <div className="grid grid-cols-1 md:grid-cols-8 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.total_messages}</div>
            <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
              <MessageCircle className="h-3 w-3" />
              Total Messages
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.unread_count}</div>
            <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
              <Eye className="h-3 w-3" />
              Unread
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.ai_analyzed}</div>
            <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
              <Brain className="h-3 w-3" />
              AI Analyzed
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.auto_replies_sent}</div>
            <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
              <Robot className="h-3 w-3" />
              Auto Replies
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-teal-600">{stats.response_rate}%</div>
            <div className="text-sm text-gray-600">Response Rate</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-indigo-600">{stats.avg_response_time}</div>
            <div className="text-sm text-gray-600">Avg Response</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-pink-600">{stats.positive_sentiment}%</div>
            <div className="text-sm text-gray-600">Positive Sentiment</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.meeting_requests}</div>
            <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
              <Calendar className="h-3 w-3" />
              Meeting Requests
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="messages" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="messages">Incoming Messages ({filteredMessages.length})</TabsTrigger>
          <TabsTrigger value="templates">Reply Templates ({templates.length})</TabsTrigger>
          <TabsTrigger value="automation">Auto-Reply Rules ({autoReplyRules.length})</TabsTrigger>
          <TabsTrigger value="analytics">AI Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="messages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI-Powered Reply Management
              </CardTitle>
              <CardDescription>
                Intelligent analysis and response suggestions for all incoming messages
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Search and Filters */}
              <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search messages..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={filterBy} onValueChange={setFilterBy}>
                  <SelectTrigger className="w-48">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Messages</SelectItem>
                    <SelectItem value="unread">Unread</SelectItem>
                    <SelectItem value="high_priority">High Priority</SelectItem>
                    <SelectItem value="positive">Positive Sentiment</SelectItem>
                    <SelectItem value="meetings">Meeting Requests</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline" onClick={checkForNewMessages}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sync Messages
                </Button>
              </div>

              {/* Messages List */}
              <div className="space-y-6">
                {filteredMessages.map((message) => (
                  <div key={message.id} className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
                    {/* Message Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        {message.sender.profile_image && (
                          <img
                            src={message.sender.profile_image}
                            alt={message.sender.name}
                            className="w-12 h-12 rounded-full"
                          />
                        )}
                        
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900">{message.sender.name}</h3>
                            <Badge className={getChannelColor(message.channel)}>
                              <div className="flex items-center gap-1">
                                {getChannelIcon(message.channel)}
                                {message.channel.toUpperCase()}
                              </div>
                            </Badge>
                          </div>
                          
                          <div className="text-sm text-gray-600">
                            {message.sender.position && message.sender.company && (
                              <div className="flex items-center gap-1">
                                <Building className="h-3 w-3" />
                                {message.sender.position} at {message.sender.company}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-sm text-gray-500">
                          {new Date(message.received_at).toLocaleString()}
                        </div>
                        <Badge variant={message.priority === 'high' ? 'destructive' : 'secondary'}>
                          {message.priority.toUpperCase()} PRIORITY
                        </Badge>
                      </div>
                    </div>

                    {/* Message Content */}
                    <div className="mb-4">
                      {message.content.subject && (
                        <div className="mb-2">
                          <Label className="text-xs font-medium text-gray-600">Subject:</Label>
                          <div className="font-medium text-gray-900">{message.content.subject}</div>
                        </div>
                      )}
                      
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm leading-relaxed">{message.content.body}</p>
                      </div>
                    </div>

                    {/* AI Analysis */}
                    <div className="bg-blue-50 rounded-lg p-4 mb-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-blue-900 flex items-center gap-2">
                          <Brain className="h-4 w-4" />
                          AI Analysis (Confidence: {message.ai_analysis.confidence_score}%)
                        </h4>
                        
                        <div className="flex items-center gap-2">
                          <Badge className={getIntentColor(message.ai_analysis.intent)}>
                            {message.ai_analysis.intent.replace('_', ' ').toUpperCase()}
                          </Badge>
                          <Badge variant="outline" className={getSentimentColor(message.ai_analysis.sentiment)}>
                            {message.ai_analysis.sentiment.toUpperCase()}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        {message.ai_analysis.buying_signals.length > 0 && (
                          <div>
                            <Label className="text-xs font-medium text-green-800">🟢 Buying Signals:</Label>
                            <ul className="text-xs text-green-700 mt-1 space-y-1">
                              {message.ai_analysis.buying_signals.map((signal, idx) => (
                                <li key={idx}>• {signal}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {message.ai_analysis.objections.length > 0 && (
                          <div>
                            <Label className="text-xs font-medium text-red-800">🔴 Objections:</Label>
                            <ul className="text-xs text-red-700 mt-1 space-y-1">
                              {message.ai_analysis.objections.map((objection, idx) => (
                                <li key={idx}>• {objection}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      <div className="mt-3 p-3 bg-white rounded">
                        <Label className="text-xs font-medium text-blue-900">🎯 Recommended Action:</Label>
                        <p className="text-sm text-blue-800 mt-1">{message.ai_analysis.next_best_action}</p>
                      </div>
                    </div>

                    {/* AI Suggested Reply */}
                    <div className="bg-green-50 rounded-lg p-4 mb-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-green-900 flex items-center gap-2">
                          <Sparkles className="h-4 w-4" />
                          AI Suggested Reply (Confidence: {message.ai_suggested_reply.confidence}%)
                        </h4>
                        
                        <Badge variant="outline">
                          {message.ai_suggested_reply.tone}
                        </Badge>
                      </div>

                      <div className="bg-white rounded p-3 mb-3">
                        <p className="text-sm leading-relaxed">{message.ai_suggested_reply.content}</p>
                      </div>

                      <div className="text-xs text-green-800 mb-3">
                        <Label className="font-medium">🧠 AI Reasoning:</Label>
                        <p className="mt-1">{message.ai_suggested_reply.reasoning}</p>
                      </div>

                      {message.ai_suggested_reply.alternatives.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-xs font-medium text-green-800">Alternative Approaches:</Label>
                          {message.ai_suggested_reply.alternatives.map((alt, idx) => (
                            <div key={idx} className="p-2 bg-green-100 rounded text-xs">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium">{alt.focus}</span>
                                <span>Score: {alt.score}%</span>
                              </div>
                              <p>{alt.content}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex items-center gap-2">
                        {message.campaign_source && (
                          <Badge variant="outline" className="text-xs">
                            {message.campaign_source}
                          </Badge>
                        )}
                        
                        <Badge variant={message.status === 'replied' ? 'default' : 'secondary'}>
                          {message.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {message.auto_reply_eligible && message.status !== 'replied' && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleAutoReply(message.id)}
                          >
                            <Robot className="h-3 w-3 mr-1" />
                            Auto Reply
                          </Button>
                        )}
                        
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedMessage(message.id);
                            setReplyContent(message.ai_suggested_reply.content);
                          }}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Customize Reply
                        </Button>
                        
                        <Button 
                          size="sm"
                          onClick={() => handleSendReply(message.id, message.ai_suggested_reply.content)}
                          disabled={message.status === 'replied'}
                        >
                          <Send className="h-3 w-3 mr-1" />
                          Send Reply
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                {filteredMessages.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">No messages found</p>
                    <p className="text-sm">Try adjusting your filters or search criteria</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Star className="h-5 w-5" />
                AI Reply Templates
              </CardTitle>
              <CardDescription>
                Pre-configured AI response templates for common scenarios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {templates.map((template) => (
                  <div key={template.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-gray-900">{template.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">{template.intent_trigger.join(', ')}</Badge>
                          {template.channels.map((channel) => (
                            <Badge key={channel} className={getChannelColor(channel)} variant="outline">
                              {channel}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600">
                          {template.success_rate}%
                        </div>
                        <div className="text-xs text-gray-500">Success Rate</div>
                      </div>
                    </div>

                    <div className="text-sm text-gray-600 mb-2">
                      {template.template_content}
                    </div>

                    <div className="text-xs text-gray-500 mb-3">
                      AI Instructions: {template.ai_instructions}
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div>
                        Used {template.usage_count} times • Auto-send: {template.auto_send ? 'Yes' : 'No'}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button variant="outline" size="sm">
                          Use Template
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                <Button className="w-full" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Template
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Auto-Reply Automation Rules
              </CardTitle>
              <CardDescription>
                Configure intelligent auto-reply rules based on AI analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {autoReplyRules.map((rule) => (
                  <div key={rule.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Switch checked={rule.enabled} />
                        <h4 className="font-medium text-gray-900">{rule.name}</h4>
                      </div>
                      
                      <Badge variant={rule.enabled ? "default" : "secondary"}>
                        {rule.enabled ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <Label className="font-medium text-gray-700">Triggers:</Label>
                        <ul className="mt-1 text-gray-600">
                          <li>Intents: {rule.conditions.intents.join(', ')}</li>
                          <li>Sentiment: {rule.conditions.sentiment.join(', ')}</li>
                          <li>Confidence: ≥{rule.conditions.confidence_threshold}%</li>
                          <li>Channels: {rule.conditions.channels.join(', ')}</li>
                        </ul>
                      </div>
                      
                      <div>
                        <Label className="font-medium text-gray-700">Actions:</Label>
                        <ul className="mt-1 text-gray-600">
                          {Object.entries(rule.actions).map(([key, value]) => 
                            value ? <li key={key}>✓ {key.replace('_', ' ')}</li> : null
                          )}
                        </ul>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t text-xs text-gray-500">
                      <span>Created: {new Date(rule.created_at).toLocaleDateString()}</span>
                      
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Edit className="h-3 w-3 mr-1" />
                          Edit Rule
                        </Button>
                        <Button variant="outline" size="sm">
                          <BarChart3 className="h-3 w-3 mr-1" />
                          Stats
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                <Button className="w-full" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Auto-Reply Rule
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">AI Reply Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{stats.response_rate}%</div>
                    <div className="text-sm text-gray-600">Overall Response Rate</div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-gray-50 rounded">
                      <div className="text-lg font-bold text-blue-600">{stats.auto_replies_sent}</div>
                      <div className="text-xs text-gray-600">Auto Replies</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded">
                      <div className="text-lg font-bold text-purple-600">91.3%</div>
                      <div className="text-xs text-gray-600">AI Accuracy</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Channel Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { channel: 'LinkedIn', response_rate: 34, auto_replies: 67 },
                    { channel: 'Email', response_rate: 23, auto_replies: 156 },
                    { channel: 'WhatsApp', response_rate: 78, auto_replies: 24 }
                  ].map((item) => (
                    <div key={item.channel} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{item.channel}</span>
                        <span className="text-sm font-medium">{item.response_rate}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-green-500"
                          style={{ width: `${item.response_rate}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-500">{item.auto_replies} auto-replies sent</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Reply Composer Modal */}
      {selectedMessage && (
        <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Customize AI Reply</DialogTitle>
              <DialogDescription>
                Edit the AI-suggested response before sending
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <Textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                rows={8}
                className="resize-none"
              />
              
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Replying via {messages.find(m => m.id === selectedMessage)?.channel.toUpperCase()}
                </div>
                
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => setSelectedMessage(null)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => {
                      if (selectedMessage) {
                        handleSendReply(selectedMessage, replyContent);
                      }
                    }}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send Reply
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export default AIReplyManager;