// Dynamic Message Handler Component
// Specialized component for handling dynamic message additions to running n8n automations

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MessageSquare, 
  AlertTriangle,
  CheckCircle,
  Info,
  Users,
  Clock,
  ArrowRight,
  Workflow,
  Zap,
  Shield,
  Target,
  Activity
} from 'lucide-react';
import { toast } from 'sonner';
import { n8nCampaignService } from '@/services/n8n-campaign-integration';

interface DynamicMessageHandlerProps {
  campaignId: string;
  campaignStatus: 'draft' | 'active' | 'paused' | 'completed' | 'error';
  existingMessageCount: number;
  activeProspects: {
    total: number;
    current_steps: Record<number, number>; // step -> count of prospects at that step
  };
  onMessageAdded?: (messageId: string) => void;
  className?: string;
}

interface MessageImpactAnalysis {
  affected_prospects: number;
  unaffected_prospects: number;
  impact_strategy: 'all_prospects' | 'future_prospects_only' | 'current_step_and_beyond';
  warnings: string[];
  recommendations: string[];
}

export function DynamicMessageHandler({
  campaignId,
  campaignStatus,
  existingMessageCount,
  activeProspects,
  onMessageAdded,
  className
}: DynamicMessageHandlerProps) {
  const [messageContent, setMessageContent] = useState('');
  const [insertPosition, setInsertPosition] = useState(existingMessageCount);
  const [messageDelay, setMessageDelay] = useState('1 day');
  const [updateStrategy, setUpdateStrategy] = useState<'future_only' | 'all_prospects'>('future_only');
  const [impactAnalysis, setImpactAnalysis] = useState<MessageImpactAnalysis | null>(null);
  const [processing, setProcessing] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  useEffect(() => {
    if (campaignStatus === 'active' && insertPosition !== null) {
      calculateImpact();
    }
  }, [insertPosition, updateStrategy, activeProspects]);

  const calculateImpact = () => {
    if (!activeProspects.current_steps) {
      setImpactAnalysis(null);
      return;
    }

    let affectedCount = 0;
    let unaffectedCount = 0;
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Calculate impact based on insertion position and strategy
    Object.entries(activeProspects.current_steps).forEach(([step, count]) => {
      const stepNumber = parseInt(step);
      
      if (updateStrategy === 'future_only') {
        // Only affect prospects who haven't reached the insertion point
        if (stepNumber < insertPosition) {
          affectedCount += count;
        } else {
          unaffectedCount += count;
        }
      } else {
        // Affect all prospects (risky for active campaigns)
        affectedCount += count;
      }
    });

    // Generate warnings and recommendations
    if (campaignStatus === 'active') {
      warnings.push('Campaign is currently active - changes will affect live automation');
      
      if (updateStrategy === 'all_prospects') {
        warnings.push('This will modify the sequence for ALL prospects, including those mid-conversation');
        recommendations.push('Consider using "Future Prospects Only" to avoid disrupting ongoing conversations');
      }

      if (insertPosition <= Math.max(...Object.keys(activeProspects.current_steps).map(Number))) {
        warnings.push('Some prospects have already passed this position in the sequence');
      }

      if (affectedCount === 0) {
        warnings.push('No prospects will be affected by this change');
        recommendations.push('Consider adding the message at the end of the sequence instead');
      }
    }

    if (insertPosition === 0) {
      warnings.push('Inserting at position 0 will make this the first message sent');
      recommendations.push('Ensure this message works as an initial contact message');
    }

    setImpactAnalysis({
      affected_prospects: affectedCount,
      unaffected_prospects: unaffectedCount,
      impact_strategy: updateStrategy === 'future_only' ? 'future_prospects_only' : 'all_prospects',
      warnings,
      recommendations
    });
  };

  const handleAddMessage = async () => {
    if (!messageContent.trim()) {
      toast.error('Message content is required');
      return;
    }

    try {
      setProcessing(true);

      await n8nCampaignService.addMessageToAutomation(campaignId, {
        content: messageContent,
        delay: messageDelay,
        position: insertPosition,
        conditions: {
          send_if_no_response: true,
          send_if_not_connected: false,
          max_attempts: 3
        }
      });

      // Reset form
      setMessageContent('');
      setInsertPosition(existingMessageCount + 1);
      setImpactAnalysis(null);
      
      toast.success('Message added to automation successfully');
      onMessageAdded?.(`msg_${Date.now()}`);
      
    } catch (error) {
      console.error('Error adding message:', error);
      toast.error('Failed to add message to automation');
    } finally {
      setProcessing(false);
    }
  };

  const getStrategyDescription = (strategy: string) => {
    switch (strategy) {
      case 'future_only':
        return 'Only affect prospects who haven\'t reached this step yet. Safest option for active campaigns.';
      case 'all_prospects':
        return 'Update sequence for ALL prospects, including those currently mid-conversation. Use with caution.';
      default:
        return '';
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      draft: 'text-gray-600',
      active: 'text-green-600',
      paused: 'text-yellow-600',
      completed: 'text-blue-600',
      error: 'text-red-600'
    };
    return colors[status as keyof typeof colors] || 'text-gray-600';
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Campaign Status Context */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Campaign Context
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className={`text-lg font-bold ${getStatusColor(campaignStatus)}`}>
                {campaignStatus.toUpperCase()}
              </div>
              <div className="text-xs text-gray-600">Campaign Status</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-lg font-bold text-gray-900">{existingMessageCount}</div>
              <div className="text-xs text-gray-600">Current Messages</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-lg font-bold text-blue-600">{activeProspects.total}</div>
              <div className="text-xs text-gray-600">Active Prospects</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-lg font-bold text-purple-600">
                {Object.keys(activeProspects.current_steps || {}).length}
              </div>
              <div className="text-xs text-gray-600">Different Steps</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="basic" onValueChange={(tab) => setShowAdvancedOptions(tab === 'advanced')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="basic">Quick Add</TabsTrigger>
          <TabsTrigger value="advanced">Advanced Options</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Add Message to Running Automation
              </CardTitle>
              <CardDescription>
                Quick message addition with safe defaults for active campaigns
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="quick-message">Message Content</Label>
                <Textarea
                  id="quick-message"
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  placeholder="Enter your message content..."
                  rows={4}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Position in Sequence</Label>
                  <Select 
                    value={insertPosition.toString()} 
                    onValueChange={(value) => setInsertPosition(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: existingMessageCount + 1 }, (_, i) => (
                        <SelectItem key={i} value={i.toString()}>
                          {i === 0 ? 'First message' : 
                           i === existingMessageCount ? 'Last message' :
                           `Position ${i + 1}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Delay from Previous</Label>
                  <Select value={messageDelay} onValueChange={setMessageDelay}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
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
              </div>

              {campaignStatus === 'active' && (
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Safe Mode:</strong> This message will only affect prospects who haven't reached this step yet. 
                    Existing conversations will continue uninterrupted.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Workflow className="h-5 w-5" />
                Advanced Message Insertion
              </CardTitle>
              <CardDescription>
                Full control over how the message affects your automation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="advanced-message">Message Content</Label>
                <Textarea
                  id="advanced-message"
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  placeholder="Enter your message content..."
                  rows={5}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Insertion Position</Label>
                  <Select 
                    value={insertPosition.toString()} 
                    onValueChange={(value) => setInsertPosition(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: existingMessageCount + 1 }, (_, i) => (
                        <SelectItem key={i} value={i.toString()}>
                          Position {i} {i === 0 && '(First)'} {i === existingMessageCount && '(End)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Update Strategy</Label>
                  <Select 
                    value={updateStrategy} 
                    onValueChange={(value: 'future_only' | 'all_prospects') => setUpdateStrategy(value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="future_only">Future Prospects Only (Safe)</SelectItem>
                      <SelectItem value="all_prospects">All Prospects (Risky)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  {getStrategyDescription(updateStrategy)}
                </AlertDescription>
              </Alert>

              {/* Impact Analysis */}
              {impactAnalysis && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Impact Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-lg font-bold text-green-600">
                          {impactAnalysis.affected_prospects}
                        </div>
                        <div className="text-xs text-gray-600">Will receive new message</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-lg font-bold text-gray-600">
                          {impactAnalysis.unaffected_prospects}
                        </div>
                        <div className="text-xs text-gray-600">Continue current sequence</div>
                      </div>
                    </div>

                    {impactAnalysis.warnings.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-orange-600">Warnings:</Label>
                        {impactAnalysis.warnings.map((warning, index) => (
                          <div key={index} className="flex items-start gap-2 text-sm text-orange-600">
                            <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                            {warning}
                          </div>
                        ))}
                      </div>
                    )}

                    {impactAnalysis.recommendations.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-blue-600">Recommendations:</Label>
                        {impactAnalysis.recommendations.map((rec, index) => (
                          <div key={index} className="flex items-start gap-2 text-sm text-blue-600">
                            <CheckCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                            {rec}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Prospect Distribution */}
              {activeProspects.current_steps && Object.keys(activeProspects.current_steps).length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Prospect Distribution by Step</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(activeProspects.current_steps).map(([step, count]) => {
                        const stepNumber = parseInt(step);
                        const willBeAffected = updateStrategy === 'future_only' ? 
                          stepNumber < insertPosition : true;
                        
                        return (
                          <div key={step} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="text-sm">Step {stepNumber + 1}</span>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{count} prospects</Badge>
                              {willBeAffected ? (
                                <Badge variant="default" className="text-xs">Will be affected</Badge>
                              ) : (
                                <Badge variant="secondary" className="text-xs">Unchanged</Badge>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4">
        <div className="flex items-center gap-2">
          <Button 
            onClick={handleAddMessage}
            disabled={!messageContent.trim() || processing}
            className="flex items-center gap-2"
          >
            <Zap className="h-4 w-4" />
            {processing ? 'Adding Message...' : 'Add Message to Automation'}
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => {
              setMessageContent('');
              setImpactAnalysis(null);
            }}
          >
            Clear
          </Button>
        </div>

        {campaignStatus === 'active' && (
          <div className="text-xs text-gray-500 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Changes take effect within 5 minutes
          </div>
        )}
      </div>
    </div>
  );
}

export default DynamicMessageHandler;