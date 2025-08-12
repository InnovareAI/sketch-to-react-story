// Message Management Component
// Handles A/B testing, message sequencing, and AI message analysis

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  MessageSquare, 
  Plus, 
  Trash2, 
  Copy, 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Brain,
  Target,
  Zap,
  CheckCircle,
  AlertTriangle,
  Clock,
  Users,
  Eye,
  Edit,
  Play,
  Pause,
  Settings,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  MessageCircle
} from 'lucide-react';
import { toast } from 'sonner';

export interface MessageVariant {
  id: string;
  name: string;
  content: string;
  is_active: boolean;
  performance: {
    sent: number;
    opened: number;
    clicked: number;
    replied: number;
    connection_rate: number;
    response_rate: number;
  };
  ai_analysis: {
    sentiment_score: number;
    tone: 'professional' | 'casual' | 'friendly' | 'formal';
    personalization_level: number;
    spam_risk: number;
    readability_score: number;
    suggestions: string[];
  };
  created_at: string;
  last_updated: string;
}

export interface MessageSequence {
  id: string;
  name: string;
  messages: {
    order: number;
    delay: string;
    message_variants: MessageVariant[];
    conditions?: {
      send_if_no_response: boolean;
      send_if_not_connected: boolean;
      max_attempts: number;
    };
  }[];
  is_active: boolean;
  total_prospects: number;
  completion_rate: number;
}

interface MessageManagerProps {
  campaignId: string;
  sequences: MessageSequence[];
  onUpdateSequence: (sequenceId: string, updates: Partial<MessageSequence>) => void;
  onCreateVariant: (sequenceId: string, messageOrder: number, variant: Omit<MessageVariant, 'id'>) => void;
  onAnalyzeMessage: (content: string) => Promise<MessageVariant['ai_analysis']>;
  className?: string;
}

export function MessageManager({
  campaignId,
  sequences,
  onUpdateSequence,
  onCreateVariant,
  onAnalyzeMessage,
  className
}: MessageManagerProps) {
  const [activeSequence, setActiveSequence] = useState<string>(sequences[0]?.id || '');
  const [selectedMessage, setSelectedMessage] = useState<number>(0);
  const [newVariantContent, setNewVariantContent] = useState('');
  const [analyzingMessage, setAnalyzingMessage] = useState(false);
  const [showABTest, setShowABTest] = useState(false);

  const currentSequence = sequences.find(s => s.id === activeSequence);
  const currentMessage = currentSequence?.messages[selectedMessage];

  const handleAnalyzeMessage = async (content: string) => {
    if (!content.trim()) return;
    
    try {
      setAnalyzingMessage(true);
      const analysis = await onAnalyzeMessage(content);
      
      // Show analysis results
      toast.success('Message analyzed successfully');
      return analysis;
    } catch (error) {
      toast.error('Failed to analyze message');
    } finally {
      setAnalyzingMessage(false);
    }
  };

  const handleCreateVariant = async () => {
    if (!currentSequence || !newVariantContent.trim()) return;

    try {
      const analysis = await handleAnalyzeMessage(newVariantContent);
      if (!analysis) return;

      const newVariant: Omit<MessageVariant, 'id'> = {
        name: `Variant ${(currentMessage?.message_variants.length || 0) + 1}`,
        content: newVariantContent,
        is_active: true,
        performance: {
          sent: 0,
          opened: 0,
          clicked: 0,
          replied: 0,
          connection_rate: 0,
          response_rate: 0
        },
        ai_analysis: analysis,
        created_at: new Date().toISOString(),
        last_updated: new Date().toISOString()
      };

      await onCreateVariant(activeSequence, selectedMessage, newVariant);
      setNewVariantContent('');
      toast.success('Message variant created successfully');
    } catch (error) {
      toast.error('Failed to create message variant');
    }
  };

  const getPerformanceColor = (value: number, type: 'rate' | 'count') => {
    if (type === 'rate') {
      if (value >= 30) return 'text-green-600';
      if (value >= 15) return 'text-yellow-600';
      return 'text-red-600';
    } else {
      if (value >= 100) return 'text-green-600';
      if (value >= 50) return 'text-yellow-600';
      return 'text-red-600';
    }
  };

  const getSentimentColor = (score: number) => {
    if (score >= 0.7) return 'text-green-600';
    if (score >= 0.3) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRiskColor = (risk: number) => {
    if (risk <= 0.3) return 'text-green-600';
    if (risk <= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Sequence Selector */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Message Sequences
          </CardTitle>
          <CardDescription>
            Manage your message sequences and A/B test variants
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Select value={activeSequence} onValueChange={setActiveSequence}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a message sequence" />
                </SelectTrigger>
                <SelectContent>
                  {sequences.map(sequence => (
                    <SelectItem key={sequence.id} value={sequence.id}>
                      {sequence.name} ({sequence.messages.length} messages)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button variant="outline" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Sequence
            </Button>
          </div>

          {currentSequence && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-lg font-bold text-gray-900">{currentSequence.total_prospects}</div>
                <div className="text-xs text-gray-600">Total Prospects</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-lg font-bold text-blue-600">{currentSequence.completion_rate}%</div>
                <div className="text-xs text-gray-600">Completion Rate</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-lg font-bold text-green-600">{currentSequence.messages.length}</div>
                <div className="text-xs text-gray-600">Messages</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <Badge variant={currentSequence.is_active ? "default" : "secondary"}>
                  {currentSequence.is_active ? 'Active' : 'Paused'}
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {currentSequence && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Message Flow */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Message Flow</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {currentSequence.messages.map((message, index) => (
                    <div
                      key={index}
                      className={`p-3 border rounded-lg cursor-pointer transition-all ${
                        selectedMessage === index 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedMessage(index)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            Message {index + 1}
                          </Badge>
                          <span className="text-xs text-gray-500">{message.delay}</span>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {message.message_variants.length} variant{message.message_variants.length !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {message.message_variants[0]?.content || 'No content'}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Message Editor */}
          <div className="lg:col-span-2">
            {currentMessage && (
              <Tabs value={showABTest ? "variants" : "editor"} onValueChange={(v) => setShowABTest(v === "variants")}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="editor">Message Editor</TabsTrigger>
                  <TabsTrigger value="variants">A/B Testing ({currentMessage.message_variants.length})</TabsTrigger>
                  <TabsTrigger value="performance">Performance</TabsTrigger>
                </TabsList>

                <TabsContent value="editor" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Message {selectedMessage + 1}</CardTitle>
                      <CardDescription>
                        {currentMessage.delay} delay from previous message
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Primary Message Variant */}
                      {currentMessage.message_variants.length > 0 && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium">Primary Message</Label>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAnalyzeMessage(currentMessage.message_variants[0].content)}
                                disabled={analyzingMessage}
                              >
                                <Brain className="h-3 w-3 mr-1" />
                                {analyzingMessage ? 'Analyzing...' : 'AI Analyze'}
                              </Button>
                              <Button variant="outline" size="sm">
                                <Edit className="h-3 w-3 mr-1" />
                                Edit
                              </Button>
                            </div>
                          </div>
                          
                          <Textarea
                            value={currentMessage.message_variants[0].content}
                            readOnly
                            rows={6}
                            className="bg-gray-50"
                          />

                          {/* AI Analysis */}
                          {currentMessage.message_variants[0].ai_analysis && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-gray-50 rounded-lg">
                              <div className="text-center">
                                <div className={`text-lg font-bold ${getSentimentColor(currentMessage.message_variants[0].ai_analysis.sentiment_score)}`}>
                                  {Math.round(currentMessage.message_variants[0].ai_analysis.sentiment_score * 100)}%
                                </div>
                                <div className="text-xs text-gray-600">Sentiment</div>
                              </div>
                              
                              <div className="text-center">
                                <div className="text-lg font-bold text-blue-600">
                                  {currentMessage.message_variants[0].ai_analysis.personalization_level}%
                                </div>
                                <div className="text-xs text-gray-600">Personal</div>
                              </div>
                              
                              <div className="text-center">
                                <div className={`text-lg font-bold ${getRiskColor(currentMessage.message_variants[0].ai_analysis.spam_risk)}`}>
                                  {Math.round(currentMessage.message_variants[0].ai_analysis.spam_risk * 100)}%
                                </div>
                                <div className="text-xs text-gray-600">Spam Risk</div>
                              </div>
                              
                              <div className="text-center">
                                <div className="text-lg font-bold text-green-600">
                                  {currentMessage.message_variants[0].ai_analysis.readability_score}%
                                </div>
                                <div className="text-xs text-gray-600">Readable</div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <Separator />

                      {/* Create New Variant */}
                      <div className="space-y-3">
                        <Label className="text-sm font-medium">Create A/B Test Variant</Label>
                        <Textarea
                          value={newVariantContent}
                          onChange={(e) => setNewVariantContent(e.target.value)}
                          placeholder="Enter your message variant here..."
                          rows={4}
                        />
                        
                        <div className="flex items-center gap-2">
                          <Button 
                            onClick={handleCreateVariant}
                            disabled={!newVariantContent.trim() || analyzingMessage}
                            className="flex items-center gap-2"
                          >
                            <Plus className="h-4 w-4" />
                            Create Variant
                          </Button>
                          
                          {newVariantContent.trim() && (
                            <Button
                              variant="outline"
                              onClick={() => handleAnalyzeMessage(newVariantContent)}
                              disabled={analyzingMessage}
                            >
                              <Brain className="h-4 w-4 mr-1" />
                              Preview Analysis
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="variants" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        A/B Test Variants
                      </CardTitle>
                      <CardDescription>
                        Compare performance across message variants
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {currentMessage.message_variants.map((variant, variantIndex) => (
                        <div key={variant.id} className="border rounded-lg p-4 mb-4 last:mb-0">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <Badge variant={variant.is_active ? "default" : "secondary"}>
                                {variant.name}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {variant.ai_analysis.tone}
                              </Badge>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Button variant="outline" size="sm">
                                <Copy className="h-3 w-3 mr-1" />
                                Duplicate
                              </Button>
                              {variantIndex > 0 && (
                                <Button variant="outline" size="sm">
                                  <Trash2 className="h-3 w-3 mr-1" />
                                  Delete
                                </Button>
                              )}
                            </div>
                          </div>

                          <div className="mb-3">
                            <Textarea
                              value={variant.content}
                              readOnly
                              rows={3}
                              className="bg-gray-50 text-sm"
                            />
                          </div>

                          {/* Performance Metrics */}
                          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                            <div className="text-center p-2 bg-gray-50 rounded">
                              <div className="text-sm font-bold text-gray-900">{variant.performance.sent}</div>
                              <div className="text-xs text-gray-600">Sent</div>
                            </div>
                            
                            <div className="text-center p-2 bg-gray-50 rounded">
                              <div className="text-sm font-bold text-blue-600">{variant.performance.opened}</div>
                              <div className="text-xs text-gray-600">Opened</div>
                            </div>
                            
                            <div className="text-center p-2 bg-gray-50 rounded">
                              <div className="text-sm font-bold text-purple-600">{variant.performance.clicked}</div>
                              <div className="text-xs text-gray-600">Clicked</div>
                            </div>
                            
                            <div className="text-center p-2 bg-gray-50 rounded">
                              <div className="text-sm font-bold text-green-600">{variant.performance.replied}</div>
                              <div className="text-xs text-gray-600">Replied</div>
                            </div>
                            
                            <div className="text-center p-2 bg-gray-50 rounded">
                              <div className={`text-sm font-bold ${getPerformanceColor(variant.performance.connection_rate, 'rate')}`}>
                                {variant.performance.connection_rate.toFixed(1)}%
                              </div>
                              <div className="text-xs text-gray-600">Connect Rate</div>
                            </div>
                            
                            <div className="text-center p-2 bg-gray-50 rounded">
                              <div className={`text-sm font-bold ${getPerformanceColor(variant.performance.response_rate, 'rate')}`}>
                                {variant.performance.response_rate.toFixed(1)}%
                              </div>
                              <div className="text-xs text-gray-600">Response Rate</div>
                            </div>
                          </div>

                          {/* AI Suggestions */}
                          {variant.ai_analysis.suggestions.length > 0 && (
                            <div className="mt-3">
                              <Label className="text-xs font-medium text-gray-500">AI Suggestions</Label>
                              <ul className="mt-1 space-y-1">
                                {variant.ai_analysis.suggestions.slice(0, 2).map((suggestion, idx) => (
                                  <li key={idx} className="text-xs text-gray-600 flex items-start gap-1">
                                    <Sparkles className="h-3 w-3 mt-0.5 flex-shrink-0 text-blue-500" />
                                    {suggestion}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="performance" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Performance Analytics
                      </CardTitle>
                      <CardDescription>
                        Detailed performance metrics for this message
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {/* Performance overview would go here */}
                      <div className="text-center py-8 text-gray-500">
                        <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Performance analytics coming soon</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default MessageManager;