// AI Message Generation & Personalization Engine
// Multi-channel AI-powered message creation for LinkedIn, Email, WhatsApp

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Sparkles,
  Brain,
  MessageSquare,
  Mail,
  Smartphone,
  LinkedinIcon,
  Zap,
  Target,
  TrendingUp,
  RefreshCw,
  Send,
  Edit,
  Copy,
  Download,
  Upload,
  Star,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  Building,
  Globe,
  Settings,
  Play,
  Pause,
  RotateCcw,
  Save,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Calendar
} from 'lucide-react';
import { toast } from 'sonner';

interface AIMessageRequest {
  id: string;
  prospect_id: string;
  prospect_name: string;
  prospect_company: string;
  prospect_position: string;
  channels: ('linkedin' | 'cold_email' | 'inbound_email' | 'whatsapp')[];
  message_type: 'first_touch' | 'follow_up' | 'meeting_request' | 'nurture' | 'closing';
  tone: 'professional' | 'casual' | 'friendly' | 'authoritative' | 'consultative';
  length: 'short' | 'medium' | 'long';
  personalization_level: number; // 1-10
  include_elements: {
    company_research: boolean;
    recent_news: boolean;
    mutual_connections: boolean;
    industry_insights: boolean;
    pain_points: boolean;
    call_to_action: boolean;
  };
  ai_model: 'gpt-4' | 'claude-3' | 'perplexity-sonar' | 'gemini-pro';
  created_at: string;
  status: 'generating' | 'completed' | 'failed';
}

interface GeneratedMessage {
  id: string;
  request_id: string;
  channel: 'linkedin' | 'cold_email' | 'inbound_email' | 'whatsapp';
  content: {
    subject?: string; // For emails
    body: string;
    call_to_action: string;
  };
  ai_confidence: number; // 0-100
  personalization_score: number; // 0-100
  estimated_performance: {
    open_rate: number;
    response_rate: number;
    engagement_score: number;
  };
  ai_explanation: {
    strategy: string;
    personalization_elements: string[];
    tone_rationale: string;
    improvement_suggestions: string[];
  };
  variations: Array<{
    id: string;
    content: {
      subject?: string;
      body: string;
      call_to_action: string;
    };
    focus: string; // 'pain-focused', 'value-focused', 'relationship-focused'
    score: number;
  }>;
  generated_at: string;
  tokens_used: number;
  cost: number;
}

interface MessageTemplate {
  id: string;
  name: string;
  category: 'introduction' | 'follow_up' | 'meeting' | 'nurture' | 'closing';
  channels: string[];
  ai_prompt: string;
  default_settings: {
    tone: string;
    length: string;
    personalization_level: number;
  };
  performance_stats: {
    usage_count: number;
    avg_response_rate: number;
    avg_ai_confidence: number;
  };
  created_at: string;
}

interface AIMessageEngineProps {
  className?: string;
}

export function AIMessageEngine({ className }: AIMessageEngineProps) {
  const [activeTab, setActiveTab] = useState('generator');
  const [messageRequests, setMessageRequests] = useState<AIMessageRequest[]>([]);
  const [generatedMessages, setGeneratedMessages] = useState<GeneratedMessage[]>([]);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  
  // Generator State
  const [prospectName, setProspectName] = useState('');
  const [prospectCompany, setProspectCompany] = useState('');
  const [prospectPosition, setProspectPosition] = useState('');
  const [selectedChannels, setSelectedChannels] = useState<string[]>(['linkedin']);
  const [messageType, setMessageType] = useState('first_touch');
  const [tone, setTone] = useState('professional');
  const [length, setLength] = useState('medium');
  const [personalizationLevel, setPersonalizationLevel] = useState([7]);
  const [aiModel, setAiModel] = useState('gpt-4');
  const [includeElements, setIncludeElements] = useState({
    company_research: true,
    recent_news: true,
    mutual_connections: false,
    industry_insights: true,
    pain_points: true,
    call_to_action: true,
  });
  
  const [generating, setGenerating] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);

  useEffect(() => {
    loadAIMessageData();
  }, []);

  const loadAIMessageData = async () => {
    try {
      // Mock data for demonstration
      setTemplates([
        {
          id: '1',
          name: 'SaaS Executive Outreach',
          category: 'introduction',
          channels: ['linkedin', 'cold_email'],
          ai_prompt: 'Create a personalized message for a SaaS executive focusing on efficiency and ROI. Reference their company size and recent growth.',
          default_settings: {
            tone: 'professional',
            length: 'medium',
            personalization_level: 8
          },
          performance_stats: {
            usage_count: 247,
            avg_response_rate: 23.4,
            avg_ai_confidence: 87.2
          },
          created_at: '2024-01-15T10:00:00Z'
        }
      ]);

      setGeneratedMessages([
        {
          id: '1',
          request_id: 'req_1',
          channel: 'linkedin',
          content: {
            body: 'Hi Sarah, I noticed TechNovate Solutions recently secured Series B funding - congratulations! With your team scaling from 150 to potentially 300+ employees, I imagine managing sales operations across multiple channels is becoming increasingly complex.\n\nI\'ve helped similar scale-ups like Zendesk and Mixpanel reduce manual lead qualification by 67% while improving conversion rates through AI-powered prospect intelligence.\n\nWould you be open to a brief 15-minute conversation about how we\'re helping VP-level sales leaders streamline their operations during rapid growth phases?',
            call_to_action: 'Quick 15-minute chat this week?'
          },
          ai_confidence: 92,
          personalization_score: 89,
          estimated_performance: {
            open_rate: 78,
            response_rate: 34,
            engagement_score: 87
          },
          ai_explanation: {
            strategy: 'Lead with recent company milestone (funding) to show research, connect to specific pain point (scaling challenges), provide social proof with similar companies, and make low-commitment ask.',
            personalization_elements: ['Series B funding mention', 'Employee growth projection', 'VP-level targeting', 'Scale-up stage relevance'],
            tone_rationale: 'Professional tone matches her seniority level and analytical communication style based on her LinkedIn activity.',
            improvement_suggestions: ['Could add specific metric from their industry', 'Consider mentioning a mutual connection if available']
          },
          variations: [
            {
              id: 'v1',
              content: {
                body: 'Hi Sarah, Your recent Series B announcement caught my attention - exciting milestone for TechNovate! As someone who\'s navigated similar growth phases, I know the challenge of maintaining sales efficiency while scaling from 150 to 300+ team members.\n\nWe\'ve developed AI-powered solutions that helped companies like yours increase qualified lead flow by 3x while reducing manual work. The timing might be perfect given your expansion phase.\n\nWorth a quick conversation?',
                call_to_action: 'Worth exploring for TechNovate?'
              },
              focus: 'efficiency-focused',
              score: 85
            },
            {
              id: 'v2',
              content: {
                body: 'Hi Sarah, I was impressed by TechNovate\'s Series B success - clearly, your sales approach is working! I\'m curious about your plans for scaling sales operations as you grow the team.\n\nI work with VP-level sales leaders at funded startups to optimize their prospect intelligence and reduce time-to-close. Given your growth trajectory, there might be some interesting synergies.\n\nOpen to a brief conversation about your scaling priorities?',
                call_to_action: 'Brief call about your scaling priorities?'
              },
              focus: 'relationship-focused',
              score: 88
            }
          ],
          generated_at: '2024-01-22T14:30:00Z',
          tokens_used: 1247,
          cost: 0.023
        }
      ]);

    } catch (error) {
      console.error('Error loading AI message data:', error);
      toast.error('Failed to load message data');
    }
  };

  const handleGenerateMessage = async () => {
    if (!prospectName || !prospectCompany) {
      toast.error('Prospect name and company are required');
      return;
    }

    try {
      setGenerating(true);
      
      const request: AIMessageRequest = {
        id: `req_${Date.now()}`,
        prospect_id: 'temp_id',
        prospect_name: prospectName,
        prospect_company: prospectCompany,
        prospect_position: prospectPosition,
        channels: selectedChannels as any[],
        message_type: messageType as any,
        tone: tone as any,
        length: length as any,
        personalization_level: personalizationLevel[0],
        include_elements: includeElements,
        ai_model: aiModel as any,
        created_at: new Date().toISOString(),
        status: 'generating'
      };

      setMessageRequests(prev => [request, ...prev]);

      // Simulate AI generation delay
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Create mock generated messages for each channel
      const newMessages = selectedChannels.map((channel) => ({
        id: `msg_${Date.now()}_${channel}`,
        request_id: request.id,
        channel: channel as any,
        content: {
          subject: channel.includes('email') ? `Quick question about ${prospectCompany}` : undefined,
          body: `Hi ${prospectName}, I noticed ${prospectCompany} is in an interesting growth phase. [AI-generated personalized content would appear here based on your settings...]`,
          call_to_action: 'Worth a brief conversation?'
        },
        ai_confidence: Math.floor(Math.random() * 20) + 80,
        personalization_score: Math.floor(Math.random() * 15) + 85,
        estimated_performance: {
          open_rate: Math.floor(Math.random() * 20) + 70,
          response_rate: Math.floor(Math.random() * 25) + 20,
          engagement_score: Math.floor(Math.random() * 20) + 75
        },
        ai_explanation: {
          strategy: 'AI-generated strategy explanation would appear here',
          personalization_elements: ['Company research', 'Position relevance'],
          tone_rationale: `Selected ${tone} tone based on prospect profile`,
          improvement_suggestions: ['Consider adding industry insight', 'Reference mutual connections if available']
        },
        variations: [],
        generated_at: new Date().toISOString(),
        tokens_used: Math.floor(Math.random() * 500) + 800,
        cost: Math.round((Math.random() * 0.05 + 0.01) * 100) / 100
      }));

      setGeneratedMessages(prev => [...newMessages, ...prev]);
      
      // Update request status
      setMessageRequests(prev => 
        prev.map(req => 
          req.id === request.id 
            ? { ...req, status: 'completed' as const }
            : req
        )
      );

      toast.success(`AI generated ${newMessages.length} personalized messages!`);

    } catch (error) {
      toast.error('Failed to generate messages');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success('Message copied to clipboard');
  };

  const handleSendMessage = async (messageId: string) => {
    try {
      // This would integrate with n8n workflows or direct API calls
      toast.success('Message queued for sending via SAM AI automation');
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'linkedin': return <LinkedinIcon className="h-4 w-4" />;
      case 'cold_email': 
      case 'inbound_email': return <Mail className="h-4 w-4" />;
      case 'whatsapp': return <Smartphone className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getChannelColor = (channel: string) => {
    switch (channel) {
      case 'linkedin': return 'bg-blue-100 text-blue-800';
      case 'cold_email': return 'bg-gray-100 text-gray-800';
      case 'inbound_email': return 'bg-green-100 text-green-800';
      case 'whatsapp': return 'bg-emerald-100 text-emerald-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            AI Message Generation & Personalization Engine
          </CardTitle>
          <CardDescription>
            Generate highly personalized messages across LinkedIn, Email, and WhatsApp using advanced AI models
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="generator">AI Generator</TabsTrigger>
          <TabsTrigger value="messages">Generated Messages ({generatedMessages.length})</TabsTrigger>
          <TabsTrigger value="templates">AI Templates ({templates.length})</TabsTrigger>
          <TabsTrigger value="analytics">Performance Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="generator" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Input Form */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  AI Message Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Prospect Information */}
                <div className="space-y-4">
                  <Label className="text-base font-medium">Prospect Information</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="prospect-name">Full Name *</Label>
                      <Input
                        id="prospect-name"
                        value={prospectName}
                        onChange={(e) => setProspectName(e.target.value)}
                        placeholder="e.g., Sarah Chen"
                      />
                    </div>
                    <div>
                      <Label htmlFor="prospect-company">Company *</Label>
                      <Input
                        id="prospect-company"
                        value={prospectCompany}
                        onChange={(e) => setProspectCompany(e.target.value)}
                        placeholder="e.g., TechNovate Solutions"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="prospect-position">Position</Label>
                    <Input
                      id="prospect-position"
                      value={prospectPosition}
                      onChange={(e) => setProspectPosition(e.target.value)}
                      placeholder="e.g., VP of Sales"
                    />
                  </div>
                </div>

                {/* Channels */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">Target Channels</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { id: 'linkedin', label: 'LinkedIn', icon: LinkedinIcon },
                      { id: 'cold_email', label: 'Cold Email', icon: Mail },
                      { id: 'inbound_email', label: 'Email Reply', icon: Mail },
                      { id: 'whatsapp', label: 'WhatsApp', icon: Smartphone, disabled: true }
                    ].map((channel) => (
                      <div key={channel.id} className="relative">
                        <label className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer ${
                          selectedChannels.includes(channel.id) 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        } ${channel.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={selectedChannels.includes(channel.id)}
                            disabled={channel.disabled}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedChannels([...selectedChannels, channel.id]);
                              } else {
                                setSelectedChannels(selectedChannels.filter(c => c !== channel.id));
                              }
                            }}
                          />
                          <channel.icon className="h-4 w-4" />
                          <span className="text-sm">{channel.label}</span>
                          {channel.disabled && (
                            <Badge variant="secondary" className="text-xs ml-auto">Soon</Badge>
                          )}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Message Settings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label>Message Type</Label>
                      <Select value={messageType} onValueChange={setMessageType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="first_touch">First Touch</SelectItem>
                          <SelectItem value="follow_up">Follow-up</SelectItem>
                          <SelectItem value="meeting_request">Meeting Request</SelectItem>
                          <SelectItem value="nurture">Nurture</SelectItem>
                          <SelectItem value="closing">Closing</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Tone</Label>
                      <Select value={tone} onValueChange={setTone}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="professional">Professional</SelectItem>
                          <SelectItem value="casual">Casual</SelectItem>
                          <SelectItem value="friendly">Friendly</SelectItem>
                          <SelectItem value="authoritative">Authoritative</SelectItem>
                          <SelectItem value="consultative">Consultative</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Length</Label>
                      <Select value={length} onValueChange={setLength}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="short">Short (50-100 words)</SelectItem>
                          <SelectItem value="medium">Medium (100-200 words)</SelectItem>
                          <SelectItem value="long">Long (200+ words)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label>AI Model</Label>
                      <Select value={aiModel} onValueChange={setAiModel}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gpt-4">GPT-4 (Best Quality)</SelectItem>
                          <SelectItem value="claude-3">Claude-3 (Best Reasoning)</SelectItem>
                          <SelectItem value="perplexity-sonar">Perplexity Sonar (Best Research)</SelectItem>
                          <SelectItem value="gemini-pro">Gemini Pro (Fast)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Personalization Level: {personalizationLevel[0]}/10</Label>
                      <Slider
                        value={personalizationLevel}
                        onValueChange={setPersonalizationLevel}
                        max={10}
                        min={1}
                        step={1}
                        className="mt-2"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Basic</span>
                        <span>Hyper-Personalized</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Include Elements */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">AI Research & Personalization Elements</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries({
                      company_research: 'Company Research',
                      recent_news: 'Recent News & Events',
                      mutual_connections: 'Mutual Connections',
                      industry_insights: 'Industry Insights',
                      pain_points: 'Pain Point Analysis',
                      call_to_action: 'Strategic CTA'
                    }).map(([key, label]) => (
                      <div key={key} className="flex items-center space-x-3">
                        <Switch
                          checked={includeElements[key as keyof typeof includeElements]}
                          onCheckedChange={(checked) => 
                            setIncludeElements(prev => ({ ...prev, [key]: checked }))
                          }
                        />
                        <Label className="text-sm">{label}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Button 
                  onClick={handleGenerateMessage}
                  disabled={generating || !prospectName || !prospectCompany || selectedChannels.length === 0}
                  className="w-full"
                  size="lg"
                >
                  {generating ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Generating AI Messages...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate AI Messages for {selectedChannels.length} Channel{selectedChannels.length !== 1 ? 's' : ''}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Preview/Results */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Live Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                {generating ? (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
                      <span className="text-sm">AI is researching {prospectName}...</span>
                    </div>
                    <div className="space-y-2">
                      <div className="h-2 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-2 bg-gray-200 rounded animate-pulse w-3/4"></div>
                      <div className="h-2 bg-gray-200 rounded animate-pulse w-1/2"></div>
                    </div>
                  </div>
                ) : generatedMessages.length > 0 ? (
                  <div className="space-y-4">
                    <div className="text-sm font-medium text-green-600">
                      ✨ Latest AI Generated Message:
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-xs text-gray-500 mb-2">
                        AI Confidence: {generatedMessages[0].ai_confidence}%
                      </div>
                      <div className="text-sm">
                        {generatedMessages[0].content.body.substring(0, 150)}...
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Configure your settings and generate your first AI message</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="messages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Generated AI Messages
              </CardTitle>
              <CardDescription>
                Review, edit, and deploy your AI-generated messages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {generatedMessages.map((message) => (
                  <div key={message.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Badge className={getChannelColor(message.channel)}>
                          <div className="flex items-center gap-1">
                            {getChannelIcon(message.channel)}
                            {message.channel.replace('_', ' ').toUpperCase()}
                          </div>
                        </Badge>
                        
                        <div className="text-sm text-gray-600">
                          Generated {new Date(message.generated_at).toLocaleString()}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="text-center">
                          <div className={`text-lg font-bold ${getConfidenceColor(message.ai_confidence)}`}>
                            {message.ai_confidence}%
                          </div>
                          <div className="text-xs text-gray-500">AI Confidence</div>
                        </div>
                      </div>
                    </div>

                    {/* Message Content */}
                    <div className="space-y-3 mb-4">
                      {message.content.subject && (
                        <div>
                          <Label className="text-xs font-medium text-gray-600">Subject Line</Label>
                          <div className="mt-1 p-2 bg-gray-50 rounded text-sm font-medium">
                            {message.content.subject}
                          </div>
                        </div>
                      )}
                      
                      <div>
                        <Label className="text-xs font-medium text-gray-600">Message Body</Label>
                        <div className="mt-1 p-3 bg-gray-50 rounded text-sm leading-relaxed whitespace-pre-wrap">
                          {message.content.body}
                        </div>
                      </div>
                    </div>

                    {/* Performance Prediction */}
                    <div className="grid grid-cols-3 gap-4 mb-4 p-3 bg-blue-50 rounded-lg">
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-600">
                          {message.estimated_performance.open_rate}%
                        </div>
                        <div className="text-xs text-gray-600">Est. Open Rate</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600">
                          {message.estimated_performance.response_rate}%
                        </div>
                        <div className="text-xs text-gray-600">Est. Response Rate</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-purple-600">
                          {message.estimated_performance.engagement_score}
                        </div>
                        <div className="text-xs text-gray-600">Engagement Score</div>
                      </div>
                    </div>

                    {/* AI Explanation */}
                    <div className="bg-yellow-50 rounded-lg p-3 mb-4">
                      <div className="text-sm font-medium text-yellow-900 mb-2">
                        🧠 AI Strategy & Reasoning:
                      </div>
                      <div className="text-sm text-yellow-800">
                        {message.ai_explanation.strategy}
                      </div>
                      
                      <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <div className="text-xs font-medium text-yellow-900">Personalization Elements:</div>
                          <ul className="text-xs text-yellow-700 mt-1">
                            {message.ai_explanation.personalization_elements.map((element, idx) => (
                              <li key={idx}>• {element}</li>
                            ))}
                          </ul>
                        </div>
                        
                        <div>
                          <div className="text-xs font-medium text-yellow-900">Improvements:</div>
                          <ul className="text-xs text-yellow-700 mt-1">
                            {message.ai_explanation.improvement_suggestions.map((suggestion, idx) => (
                              <li key={idx}>• {suggestion}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500">
                        Cost: ${message.cost} • Tokens: {message.tokens_used.toLocaleString()}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleCopyMessage(message.content.body)}>
                          <Copy className="h-3 w-3 mr-1" />
                          Copy
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button size="sm" onClick={() => handleSendMessage(message.id)}>
                          <Send className="h-3 w-3 mr-1" />
                          Send
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                {generatedMessages.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">No messages generated yet</p>
                    <p className="text-sm">Use the AI Generator tab to create your first personalized message</p>
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
                AI Message Templates
              </CardTitle>
              <CardDescription>
                Pre-configured AI prompts for common scenarios
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
                          <Badge variant="outline">{template.category}</Badge>
                          {template.channels.map((channel) => (
                            <Badge key={channel} className={getChannelColor(channel)} variant="outline">
                              {channel.replace('_', ' ')}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600">
                          {template.performance_stats.avg_response_rate}%
                        </div>
                        <div className="text-xs text-gray-500">Avg Response Rate</div>
                      </div>
                    </div>

                    <div className="text-sm text-gray-600 mb-3">
                      {template.ai_prompt}
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div>
                        Used {template.performance_stats.usage_count} times • 
                        AI Confidence: {template.performance_stats.avg_ai_confidence}%
                      </div>
                      
                      <Button variant="outline" size="sm">
                        Use Template
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">AI Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">89.3%</div>
                    <div className="text-sm text-gray-600">Avg AI Confidence</div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-gray-50 rounded">
                      <div className="text-lg font-bold text-blue-600">2,347</div>
                      <div className="text-xs text-gray-600">Messages Generated</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded">
                      <div className="text-lg font-bold text-purple-600">$47.50</div>
                      <div className="text-xs text-gray-600">Total AI Costs</div>
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
                    { channel: 'LinkedIn', response_rate: 34, color: 'bg-blue-500' },
                    { channel: 'Cold Email', response_rate: 23, color: 'bg-gray-500' },
                    { channel: 'Inbound Email', response_rate: 67, color: 'bg-green-500' }
                  ].map((item) => (
                    <div key={item.channel} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{item.channel}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${item.color}`}
                            style={{ width: `${item.response_rate}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{item.response_rate}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AIMessageEngine;