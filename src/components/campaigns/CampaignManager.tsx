// Campaign Management Component
// Handles pause/resume, priority settings, and campaign status management

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Play, 
  Pause, 
  Square, 
  TrendingUp, 
  Users, 
  MessageSquare, 
  Clock,
  Settings,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Target,
  Calendar,
  Tag,
  Filter,
  MoreHorizontal
} from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface Campaign {
  id: string;
  name: string;
  type: string;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'stopped';
  priority: 'low' | 'medium' | 'high';
  progress: {
    sent: number;
    connected: number;
    replied: number;
    total: number;
  };
  daily_limit: number;
  max_campaign_size: number;
  tags: string[];
  created_at: string;
  updated_at: string;
  performance: {
    connection_rate: number;
    response_rate: number;
    total_sent: number;
  };
}

interface CampaignManagerProps {
  campaigns: Campaign[];
  onUpdateCampaign: (campaignId: string, updates: Partial<Campaign>) => void;
  onDeleteCampaign: (campaignId: string) => void;
  className?: string;
}

export function CampaignManager({
  campaigns,
  onUpdateCampaign,
  onDeleteCampaign,
  className
}: CampaignManagerProps) {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');

  // Get unique tags from all campaigns
  const allTags = Array.from(new Set(campaigns.flatMap(c => c.tags)));

  // Filter campaigns
  const filteredCampaigns = campaigns.filter(campaign => {
    if (filterStatus !== 'all' && campaign.status !== filterStatus) return false;
    if (filterPriority !== 'all' && campaign.priority !== filterPriority) return false;
    if (selectedTag !== 'all' && !campaign.tags.includes(selectedTag)) return false;
    return true;
  });

  const handleStatusChange = async (campaignId: string, newStatus: Campaign['status']) => {
    try {
      // Validate status transitions
      const campaign = campaigns.find(c => c.id === campaignId);
      if (!campaign) return;

      if (newStatus === 'active' && campaign.status === 'draft') {
        // Additional validation for activating campaigns
        if (campaign.progress.total === 0) {
          toast.error('Cannot activate campaign with no prospects');
          return;
        }
      }

      await onUpdateCampaign(campaignId, { 
        status: newStatus, 
        updated_at: new Date().toISOString() 
      });

      const statusMessages = {
        active: 'Campaign activated successfully',
        paused: 'Campaign paused',
        stopped: 'Campaign stopped',
        completed: 'Campaign marked as completed'
      };

      toast.success(statusMessages[newStatus] || 'Campaign updated');
    } catch (error) {
      toast.error('Failed to update campaign status');
    }
  };

  const handlePriorityChange = async (campaignId: string, newPriority: Campaign['priority']) => {
    try {
      await onUpdateCampaign(campaignId, { 
        priority: newPriority,
        updated_at: new Date().toISOString()
      });
      toast.success('Campaign priority updated');
    } catch (error) {
      toast.error('Failed to update campaign priority');
    }
  };

  const getStatusBadge = (status: Campaign['status']) => {
    const variants = {
      draft: { variant: 'outline' as const, color: 'text-gray-600', icon: Clock },
      active: { variant: 'default' as const, color: 'text-green-600', icon: Play },
      paused: { variant: 'secondary' as const, color: 'text-yellow-600', icon: Pause },
      completed: { variant: 'default' as const, color: 'text-blue-600', icon: CheckCircle },
      stopped: { variant: 'destructive' as const, color: 'text-red-600', icon: Square }
    };

    const config = variants[status];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: Campaign['priority']) => {
    const variants = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-red-100 text-red-800'
    };

    return (
      <Badge className={variants[priority]}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </Badge>
    );
  };

  const calculateProgress = (campaign: Campaign) => {
    if (campaign.progress.total === 0) return 0;
    return Math.round((campaign.progress.sent / campaign.progress.total) * 100);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Filter Controls */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Campaign Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="stopped">Stopped</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Priority</label>
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="high">High Priority</SelectItem>
                  <SelectItem value="medium">Medium Priority</SelectItem>
                  <SelectItem value="low">Low Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Tags</label>
              <Select value={selectedTag} onValueChange={setSelectedTag}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tags</SelectItem>
                  {allTags.map(tag => (
                    <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setFilterStatus('all');
                  setFilterPriority('all');
                  setSelectedTag('all');
                }}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Campaign Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {['all', 'active', 'paused', 'draft', 'completed'].map(status => {
          const count = status === 'all' ? campaigns.length : campaigns.filter(c => c.status === status).length;
          return (
            <Card key={status}>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">{count}</div>
                <div className="text-sm text-gray-600 capitalize">{status === 'all' ? 'Total' : status}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Campaigns List */}
      <div className="space-y-4">
        {filteredCampaigns.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-gray-500">
                <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No campaigns found matching your filters.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredCampaigns.map((campaign) => (
            <Card key={campaign.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-lg text-gray-900">{campaign.name}</h3>
                      {getStatusBadge(campaign.status)}
                      {getPriorityBadge(campaign.priority)}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {campaign.type.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Created {new Date(campaign.created_at).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Target className="h-4 w-4" />
                        {campaign.progress.total} prospects
                      </span>
                    </div>

                    {campaign.tags.length > 0 && (
                      <div className="flex items-center gap-2 mb-3">
                        <Tag className="h-4 w-4 text-gray-400" />
                        <div className="flex gap-1">
                          {campaign.tags.map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Quick Actions */}
                    {campaign.status === 'active' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusChange(campaign.id, 'paused')}
                        className="flex items-center gap-1"
                      >
                        <Pause className="h-4 w-4" />
                        Pause
                      </Button>
                    )}

                    {(campaign.status === 'paused' || campaign.status === 'draft') && (
                      <Button
                        size="sm"
                        onClick={() => handleStatusChange(campaign.id, 'active')}
                        className="flex items-center gap-1"
                      >
                        <Play className="h-4 w-4" />
                        {campaign.status === 'draft' ? 'Start' : 'Resume'}
                      </Button>
                    )}

                    {campaign.status === 'active' && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleStatusChange(campaign.id, 'stopped')}
                        className="flex items-center gap-1"
                      >
                        <Square className="h-4 w-4" />
                        Stop
                      </Button>
                    )}

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Settings className="h-4 w-4 mr-2" />
                          Edit Settings
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <BarChart3 className="h-4 w-4 mr-2" />
                          View Analytics
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <div className="px-2 py-2">
                          <label className="text-xs font-medium text-gray-500 mb-1 block">Priority</label>
                          <Select 
                            value={campaign.priority} 
                            onValueChange={(value: Campaign['priority']) => handlePriorityChange(campaign.id, value)}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={() => onDeleteCampaign(campaign.id)}
                        >
                          Delete Campaign
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Campaign Progress */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Campaign Progress</span>
                    <span className="font-medium">{calculateProgress(campaign)}%</span>
                  </div>
                  <Progress value={calculateProgress(campaign)} className="h-2" />
                  
                  {/* Performance Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-lg font-bold text-gray-900">{campaign.progress.sent}</div>
                      <div className="text-xs text-gray-600 flex items-center justify-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        Sent
                      </div>
                    </div>
                    
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-lg font-bold text-blue-600">{campaign.progress.connected}</div>
                      <div className="text-xs text-gray-600 flex items-center justify-center gap-1">
                        <Users className="h-3 w-3" />
                        Connected
                      </div>
                    </div>
                    
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-lg font-bold text-green-600">{campaign.progress.replied}</div>
                      <div className="text-xs text-gray-600 flex items-center justify-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        Replied
                      </div>
                    </div>
                    
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-lg font-bold text-purple-600">
                        {campaign.performance.response_rate.toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-600">Response Rate</div>
                    </div>
                  </div>

                  {/* Safety Alerts */}
                  {campaign.progress.total >= campaign.max_campaign_size && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        Campaign has reached maximum size limit of {campaign.max_campaign_size} prospects.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

export default CampaignManager;