// Campaign History Tracking Component
// Tracks and displays detailed campaign activity history

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  History, 
  Play, 
  Pause, 
  Square, 
  MessageSquare, 
  Users, 
  TrendingUp,
  Calendar,
  Search,
  Filter,
  Download,
  Clock,
  CheckCircle,
  AlertTriangle,
  User,
  Target,
  Mail,
  Eye
} from 'lucide-react';

export interface CampaignActivity {
  id: string;
  campaign_id: string;
  campaign_name: string;
  activity_type: 'status_change' | 'message_sent' | 'connection_request' | 'response_received' | 
                 'prospect_added' | 'prospect_removed' | 'settings_updated' | 'error_occurred';
  description: string;
  details: {
    old_value?: any;
    new_value?: any;
    prospect_name?: string;
    prospect_url?: string;
    message_content?: string;
    error_message?: string;
  };
  timestamp: string;
  user_id: string;
  user_name: string;
  metadata?: Record<string, any>;
}

export interface CampaignHistoryStats {
  total_activities: number;
  messages_sent_today: number;
  connections_made_today: number;
  responses_received_today: number;
  errors_today: number;
  most_active_campaign: string;
  peak_activity_hour: number;
}

interface CampaignHistoryProps {
  campaignId?: string;
  activities: CampaignActivity[];
  stats: CampaignHistoryStats;
  onExportHistory?: () => void;
  className?: string;
}

export function CampaignHistory({
  campaignId,
  activities,
  stats,
  onExportHistory,
  className
}: CampaignHistoryProps) {
  const [filteredActivities, setFilteredActivities] = useState(activities);
  const [searchTerm, setSearchTerm] = useState('');
  const [activityTypeFilter, setActivityTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('today');
  const [expandedActivity, setExpandedActivity] = useState<string | null>(null);

  useEffect(() => {
    filterActivities();
  }, [activities, searchTerm, activityTypeFilter, dateFilter]);

  const filterActivities = () => {
    let filtered = [...activities];

    // Campaign filter
    if (campaignId) {
      filtered = filtered.filter(activity => activity.campaign_id === campaignId);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(activity => 
        activity.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.campaign_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.details.prospect_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Activity type filter
    if (activityTypeFilter !== 'all') {
      filtered = filtered.filter(activity => activity.activity_type === activityTypeFilter);
    }

    // Date filter
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    if (dateFilter !== 'all') {
      filtered = filtered.filter(activity => {
        const activityDate = new Date(activity.timestamp);
        switch (dateFilter) {
          case 'today':
            return activityDate >= today;
          case 'yesterday':
            return activityDate >= yesterday && activityDate < today;
          case 'week':
            return activityDate >= weekAgo;
          default:
            return true;
        }
      });
    }

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    setFilteredActivities(filtered);
  };

  const getActivityIcon = (type: CampaignActivity['activity_type']) => {
    const icons = {
      status_change: Play,
      message_sent: MessageSquare,
      connection_request: Users,
      response_received: TrendingUp,
      prospect_added: User,
      prospect_removed: Target,
      settings_updated: Clock,
      error_occurred: AlertTriangle
    };
    return icons[type] || History;
  };

  const getActivityColor = (type: CampaignActivity['activity_type']) => {
    const colors = {
      status_change: 'text-blue-600 bg-blue-100',
      message_sent: 'text-green-600 bg-green-100',
      connection_request: 'text-purple-600 bg-purple-100',
      response_received: 'text-orange-600 bg-orange-100',
      prospect_added: 'text-teal-600 bg-teal-100',
      prospect_removed: 'text-red-600 bg-red-100',
      settings_updated: 'text-gray-600 bg-gray-100',
      error_occurred: 'text-red-600 bg-red-100'
    };
    return colors[type] || 'text-gray-600 bg-gray-100';
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    
    return date.toLocaleDateString();
  };

  const getActivityTypeLabel = (type: CampaignActivity['activity_type']) => {
    const labels = {
      status_change: 'Status Change',
      message_sent: 'Message Sent',
      connection_request: 'Connection Request',
      response_received: 'Response Received',
      prospect_added: 'Prospect Added',
      prospect_removed: 'Prospect Removed',
      settings_updated: 'Settings Updated',
      error_occurred: 'Error Occurred'
    };
    return labels[type] || type.replace('_', ' ').toUpperCase();
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.total_activities}</div>
            <div className="text-sm text-gray-600">Total Activities</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.messages_sent_today}</div>
            <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
              <MessageSquare className="h-3 w-3" />
              Messages Today
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.connections_made_today}</div>
            <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
              <Users className="h-3 w-3" />
              Connections Today
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.responses_received_today}</div>
            <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Responses Today
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.errors_today}</div>
            <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Errors Today
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Activity Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search activities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={activityTypeFilter} onValueChange={setActivityTypeFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Activities</SelectItem>
                <SelectItem value="message_sent">Messages</SelectItem>
                <SelectItem value="connection_request">Connections</SelectItem>
                <SelectItem value="response_received">Responses</SelectItem>
                <SelectItem value="status_change">Status Changes</SelectItem>
                <SelectItem value="error_occurred">Errors</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="week">Last 7 days</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={onExportHistory} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Activity Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <History className="h-5 w-5" />
            Activity Timeline
          </CardTitle>
          <CardDescription>
            {filteredActivities.length} activities found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredActivities.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No activities found matching your filters.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredActivities.map((activity) => {
                const Icon = getActivityIcon(activity.activity_type);
                const isExpanded = expandedActivity === activity.id;
                
                return (
                  <div key={activity.id} className="border rounded-lg hover:shadow-md transition-shadow">
                    <div 
                      className="p-4 cursor-pointer"
                      onClick={() => setExpandedActivity(isExpanded ? null : activity.id)}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-lg ${getActivityColor(activity.activity_type)}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <span className="font-medium text-gray-900">
                              {activity.description}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {getActivityTypeLabel(activity.activity_type)}
                            </Badge>
                            {!campaignId && (
                              <Badge variant="secondary" className="text-xs">
                                {activity.campaign_name}
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {activity.user_name}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatTimestamp(activity.timestamp)}
                            </span>
                            {activity.details.prospect_name && (
                              <span className="flex items-center gap-1">
                                <Target className="h-3 w-3" />
                                {activity.details.prospect_name}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-xs text-gray-500">
                            {new Date(activity.timestamp).toLocaleTimeString()}
                          </div>
                          <Button variant="ghost" size="sm" className="mt-1">
                            <Eye className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="border-t bg-gray-50 p-4">
                        <div className="space-y-3">
                          {activity.details.message_content && (
                            <div>
                              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                Message Content
                              </label>
                              <div className="mt-1 p-3 bg-white border rounded text-sm">
                                {activity.details.message_content}
                              </div>
                            </div>
                          )}
                          
                          {activity.details.old_value && activity.details.new_value && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                  Previous Value
                                </label>
                                <div className="mt-1 p-2 bg-red-50 border border-red-200 rounded text-sm">
                                  {JSON.stringify(activity.details.old_value)}
                                </div>
                              </div>
                              <div>
                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                  New Value
                                </label>
                                <div className="mt-1 p-2 bg-green-50 border border-green-200 rounded text-sm">
                                  {JSON.stringify(activity.details.new_value)}
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {activity.details.error_message && (
                            <div>
                              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                Error Details
                              </label>
                              <div className="mt-1 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                                {activity.details.error_message}
                              </div>
                            </div>
                          )}
                          
                          {activity.details.prospect_url && (
                            <div>
                              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                Prospect Profile
                              </label>
                              <div className="mt-1">
                                <Button variant="outline" size="sm" className="text-xs">
                                  <Eye className="h-3 w-3 mr-1" />
                                  View LinkedIn Profile
                                </Button>
                              </div>
                            </div>
                          )}
                          
                          <div className="text-xs text-gray-500">
                            Full timestamp: {new Date(activity.timestamp).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default CampaignHistory;