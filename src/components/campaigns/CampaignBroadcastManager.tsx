// Campaign Broadcast Manager Component
// Manages n8n-powered campaign broadcasts and dynamic message additions

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Broadcast,
  Play, 
  Pause, 
  Square,
  MessageSquare, 
  Plus, 
  Clock,
  Users,
  BarChart3,
  Settings,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Edit,
  Trash2,
  Eye,
  Send,
  Workflow,
  Zap,
  Timer,
  Target,
  Activity
} from 'lucide-react';
import { toast } from 'sonner';
import { n8nCampaignService, N8nCampaignWorkflow } from '@/services/n8n-campaign-integration';

interface CampaignBroadcastManagerProps {
  campaignId: string;
  campaignName: string;
  campaignType: string;
  onWorkflowUpdate?: (workflowId: string, status: string) => void;
  className?: string;
}

interface MessageSequenceItem {
  id: string;
  content: string;
  delay: string;
  position: number;
  conditions?: {
    send_if_no_response: boolean;
    send_if_not_connected: boolean;
    max_attempts: number;
  };
  status: 'pending' | 'active' | 'completed' | 'error';
  sent_count?: number;
  response_count?: number;
}

export function CampaignBroadcastManager({
  campaignId,
  campaignName,
  campaignType,
  onWorkflowUpdate,
  className
}: CampaignBroadcastManagerProps) {
  const [workflow, setWorkflow] = useState<N8nCampaignWorkflow | null>(null);
  const [loading, setLoading] = useState(true);
  const [broadcasting, setBroadcasting] = useState(false);
  const [messageSequence, setMessageSequence] = useState<MessageSequenceItem[]>([]);
  
  // New message form
  const [newMessage, setNewMessage] = useState({
    content: '',
    delay: '1 day',
    position: 0,
    conditions: {
      send_if_no_response: true,
      send_if_not_connected: false,
      max_attempts: 3
    }
  });

  // Campaign progress
  const [progress, setProgress] = useState({
    status: 'draft',
    progress: {
      total_prospects: 0,
      active_prospects: 0,
      completed_prospects: 0,
      failed_prospects: 0
    },
    current_activity: {
      messages_sent_today: 0,
      connections_made_today: 0,
      responses_received_today: 0
    },
    next_scheduled: null as Date | null
  });

  useEffect(() => {
    loadCampaignWorkflow();
    loadCampaignProgress();
  }, [campaignId]);

  const loadCampaignWorkflow = async () => {
    try {
      setLoading(true);
      // In a real implementation, this would fetch existing workflow data
      // For now, we'll simulate the workflow structure
      const mockWorkflow: N8nCampaignWorkflow = {
        workflow_id: `workflow_${campaignId}`,
        campaign_id: campaignId,
        campaign_type: campaignType,
        status: 'draft',
        message_sequence: [],
        prospects: [],
        settings: {
          daily_limit: 50,
          priority: 'medium',
          timezone: 'America/New_York',
          working_hours: {
            start: '09:00',
            end: '17:00',
            days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
          }
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      setWorkflow(mockWorkflow);
      setMessageSequence([]);
    } catch (error) {
      console.error('Error loading campaign workflow:', error);
      toast.error('Failed to load campaign workflow');
    } finally {
      setLoading(false);
    }
  };

  const loadCampaignProgress = async () => {
    try {
      const progressData = await n8nCampaignService.getCampaignProgress(campaignId);
      setProgress(progressData);
    } catch (error) {
      console.error('Error loading campaign progress:', error);
    }
  };

  const handleStartBroadcast = async () => {
    try {
      setBroadcasting(true);
      
      if (!workflow) {
        // Create new workflow if it doesn't exist
        const workflowId = await n8nCampaignService.createCampaignWorkflow({
          id: campaignId,
          name: campaignName,
          type: campaignType,
          message_sequence: messageSequence,
          prospects: [], // This would come from the campaign prospects
          settings: workflow?.settings || {
            daily_limit: 50,
            priority: 'medium',
            timezone: 'America/New_York',
            working_hours: {
              start: '09:00',
              end: '17:00',
              days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
            }
          }
        });
        
        if (workflow) {
          setWorkflow({ ...workflow, workflow_id: workflowId });
        }
      }

      await n8nCampaignService.startCampaign(campaignId);
      await loadCampaignProgress();
      
      toast.success('Campaign broadcast started successfully');
      onWorkflowUpdate?.(workflow?.workflow_id || '', 'active');
    } catch (error) {
      console.error('Error starting broadcast:', error);
      toast.error('Failed to start campaign broadcast');
    } finally {
      setBroadcasting(false);
    }
  };

  const handlePauseBroadcast = async () => {
    try {
      await n8nCampaignService.pauseCampaign(campaignId);
      await loadCampaignProgress();
      toast.success('Campaign broadcast paused');
      onWorkflowUpdate?.(workflow?.workflow_id || '', 'paused');
    } catch (error) {
      console.error('Error pausing broadcast:', error);
      toast.error('Failed to pause campaign broadcast');
    }
  };

  const handleResumeBroadcast = async () => {
    try {
      await n8nCampaignService.resumeCampaign(campaignId);
      await loadCampaignProgress();
      toast.success('Campaign broadcast resumed');
      onWorkflowUpdate?.(workflow?.workflow_id || '', 'active');
    } catch (error) {
      console.error('Error resuming broadcast:', error);
      toast.error('Failed to resume campaign broadcast');
    }
  };

  const handleAddMessage = async () => {
    if (!newMessage.content.trim()) {
      toast.error('Message content is required');
      return;
    }

    try {
      // Add message to existing automation
      await n8nCampaignService.addMessageToAutomation(campaignId, {
        content: newMessage.content,
        delay: newMessage.delay,
        position: newMessage.position || messageSequence.length,
        conditions: newMessage.conditions
      });

      // Update local state
      const newMessageItem: MessageSequenceItem = {
        id: `msg_${Date.now()}`,
        content: newMessage.content,
        delay: newMessage.delay,
        position: newMessage.position || messageSequence.length,
        conditions: newMessage.conditions,
        status: 'pending',
        sent_count: 0,
        response_count: 0
      };

      setMessageSequence(prev => [...prev, newMessageItem]);
      
      // Reset form
      setNewMessage({
        content: '',
        delay: '1 day',
        position: messageSequence.length + 1,
        conditions: {
          send_if_no_response: true,
          send_if_not_connected: false,
          max_attempts: 3
        }
      });

      toast.success('Message added to automation successfully');
    } catch (error) {
      console.error('Error adding message:', error);
      toast.error('Failed to add message to automation');
    }
  };

  const handleUpdateMessage = async (messageId: string, updates: Partial<MessageSequenceItem>) => {
    try {
      await n8nCampaignService.updateMessageInAutomation(campaignId, messageId, {
        content: updates.content,
        delay: updates.delay,
        conditions: updates.conditions
      });

      setMessageSequence(prev =>
        prev.map(msg => msg.id === messageId ? { ...msg, ...updates } : msg)
      );

      toast.success('Message updated successfully');
    } catch (error) {
      console.error('Error updating message:', error);
      toast.error('Failed to update message');
    }
  };

  const handleRemoveMessage = async (messageId: string) => {
    try {
      await n8nCampaignService.removeMessageFromAutomation(campaignId, messageId);
      
      setMessageSequence(prev => prev.filter(msg => msg.id !== messageId));
      
      toast.success('Message removed from automation');
    } catch (error) {
      console.error('Error removing message:', error);
      toast.error('Failed to remove message');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      draft: { variant: 'outline' as const, color: 'text-gray-600' },
      active: { variant: 'default' as const, color: 'text-green-600' },
      paused: { variant: 'secondary' as const, color: 'text-yellow-600' },
      completed: { variant: 'outline' as const, color: 'text-blue-600' },
      error: { variant: 'destructive' as const, color: 'text-red-600' }
    };

    const config = variants[status as keyof typeof variants] || variants.draft;
    
    return (
      <Badge variant={config.variant}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Loading campaign workflow...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Campaign Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Broadcast className="h-5 w-5" />
            Campaign Broadcast Control
          </CardTitle>
          <CardDescription>
            Manage your n8n-powered LinkedIn campaign automation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div>
                <h3 className="font-medium">{campaignName}</h3>
                <p className="text-sm text-gray-500">{campaignType.replace('_', ' ').toUpperCase()} Campaign</p>
              </div>
              {getStatusBadge(progress.status)}
            </div>

            <div className="flex items-center gap-2">
              {progress.status === 'draft' && (
                <Button 
                  onClick={handleStartBroadcast}
                  disabled={broadcasting || messageSequence.length === 0}
                  className="flex items-center gap-2"
                >
                  <Play className="h-4 w-4" />
                  {broadcasting ? 'Starting...' : 'Start Broadcast'}
                </Button>
              )}
              
              {progress.status === 'active' && (
                <Button 
                  onClick={handlePauseBroadcast}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Pause className="h-4 w-4" />
                  Pause
                </Button>
              )}
              
              {progress.status === 'paused' && (
                <Button 
                  onClick={handleResumeBroadcast}
                  className="flex items-center gap-2"
                >
                  <Play className="h-4 w-4" />
                  Resume
                </Button>
              )}

              <Button variant="outline" onClick={loadCampaignProgress}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Progress Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-lg font-bold text-gray-900">{progress.progress.total_prospects}</div>
              <div className="text-xs text-gray-600">Total Prospects</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-lg font-bold text-blue-600">{progress.progress.active_prospects}</div>
              <div className="text-xs text-gray-600">Active</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-lg font-bold text-green-600">{progress.progress.completed_prospects}</div>
              <div className="text-xs text-gray-600">Completed</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-lg font-bold text-orange-600">{progress.current_activity.messages_sent_today}</div>
              <div className="text-xs text-gray-600">Messages Today</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-lg font-bold text-purple-600">{progress.current_activity.responses_received_today}</div>
              <div className="text-xs text-gray-600">Responses</div>
            </div>
          </div>

          {workflow?.workflow_id && (
            <Alert>
              <Workflow className="h-4 w-4" />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <span>N8N Workflow ID: {workflow.workflow_id}</span>
                  <Button variant="outline" size="sm">
                    <Eye className="h-3 w-3 mr-1" />
                    View in N8N
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Message Sequence Management */}
      <Tabs defaultValue="sequence" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sequence">Message Sequence ({messageSequence.length})</TabsTrigger>
          <TabsTrigger value="add-message">Add New Message</TabsTrigger>
        </TabsList>

        <TabsContent value="sequence" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Current Message Sequence
              </CardTitle>
              <CardDescription>
                Messages in your automation flow. Changes to active campaigns affect only future prospects.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {messageSequence.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="mb-2">No messages in sequence yet</p>
                  <p className="text-sm">Add your first message to start the automation</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messageSequence.map((message, index) => (
                    <div key={message.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">Step {index + 1}</Badge>
                          <Badge variant="secondary">{message.delay}</Badge>
                          {getStatusBadge(message.status)}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleRemoveMessage(message.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      <div className="mb-3">
                        <Textarea 
                          value={message.content}
                          readOnly
                          rows={3}
                          className="bg-gray-50"
                        />
                      </div>

                      {(message.sent_count || 0) > 0 && (
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Send className="h-3 w-3" />
                            {message.sent_count} sent
                          </span>
                          <span className="flex items-center gap-1">
                            <Target className="h-3 w-3" />
                            {message.response_count} responses
                          </span>
                        </div>
                      )}

                      {message.conditions && (
                        <div className="mt-2 text-xs text-gray-500">
                          Conditions: 
                          {message.conditions.send_if_no_response && ' Send if no response'}
                          {message.conditions.send_if_not_connected && ' Send if not connected'}
                          {message.conditions.max_attempts && ` (max ${message.conditions.max_attempts} attempts)`}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="add-message" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add Message to Automation
              </CardTitle>
              <CardDescription>
                Add a new message to your running automation. For active campaigns, this will only affect prospects who haven't reached this step yet.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="message-content">Message Content</Label>
                <Textarea
                  id="message-content"
                  value={newMessage.content}
                  onChange={(e) => setNewMessage(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Enter your message content..."
                  rows={6}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="message-delay">Delay from Previous Message</Label>
                  <Select 
                    value={newMessage.delay} 
                    onValueChange={(value) => setNewMessage(prev => ({ ...prev, delay: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Immediate</SelectItem>
                      <SelectItem value="1 hour">1 hour</SelectItem>
                      <SelectItem value="6 hours">6 hours</SelectItem>
                      <SelectItem value="12 hours">12 hours</SelectItem>
                      <SelectItem value="1 day">1 day</SelectItem>
                      <SelectItem value="2 days">2 days</SelectItem>
                      <SelectItem value="3 days">3 days</SelectItem>
                      <SelectItem value="1 week">1 week</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="message-position">Position in Sequence</Label>
                  <Input
                    id="message-position"
                    type="number"
                    value={newMessage.position || messageSequence.length}
                    onChange={(e) => setNewMessage(prev => ({ ...prev, position: parseInt(e.target.value) }))}
                    min="0"
                    max={messageSequence.length + 1}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label>Message Conditions</Label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={newMessage.conditions.send_if_no_response}
                      onChange={(e) => setNewMessage(prev => ({
                        ...prev,
                        conditions: { ...prev.conditions, send_if_no_response: e.target.checked }
                      }))}
                    />
                    <span className="text-sm">Send only if no response to previous messages</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={newMessage.conditions.send_if_not_connected}
                      onChange={(e) => setNewMessage(prev => ({
                        ...prev,
                        conditions: { ...prev.conditions, send_if_not_connected: e.target.checked }
                      }))}
                    />
                    <span className="text-sm">Send only if connection request not accepted</span>
                  </label>
                </div>
              </div>

              {progress.status === 'active' && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Campaign is active:</strong> This message will only be sent to prospects who haven't reached this step yet. Current prospects will continue with their existing sequence.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex items-center gap-2 pt-4">
                <Button onClick={handleAddMessage} disabled={!newMessage.content.trim()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Message to Automation
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setNewMessage({
                    content: '',
                    delay: '1 day',
                    position: messageSequence.length,
                    conditions: {
                      send_if_no_response: true,
                      send_if_not_connected: false,
                      max_attempts: 3
                    }
                  })}
                >
                  Clear Form
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default CampaignBroadcastManager;