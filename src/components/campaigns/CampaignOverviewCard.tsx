import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  UserPlus, 
  MessageSquare, 
  Calendar,
  Play,
  Pause,
  MoreVertical,
  Edit,
  Trash2,
  Copy,
  BarChart3,
  Send,
  UserCheck,
  Reply,
  Flag
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface CampaignMetrics {
  totalPeople: number;
  contacted: { count: number; total: number; percentage: number };
  connected: { count: number; total: number; percentage: number };
  repliedToConnection: { count: number; total: number; percentage: number };
  repliedToOther: { count: number; total: number; percentage: number };
}

interface CampaignOverviewCardProps {
  id: string;
  name: string;
  type: 'Connector' | 'Messenger' | 'Open InMail' | 'Event Participants';
  status: 'active' | 'paused' | 'stopped' | 'draft';
  createdAt: Date;
  stoppedAt?: Date;
  priority: 'low' | 'medium' | 'high';
  metrics: CampaignMetrics;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onAddPeople?: (id: string) => void;
  onToggleStatus?: (id: string, newStatus: 'active' | 'paused') => void;
}

export default function CampaignOverviewCard({
  id,
  name,
  type,
  status,
  createdAt,
  stoppedAt,
  priority,
  metrics,
  onEdit,
  onDelete,
  onDuplicate,
  onAddPeople,
  onToggleStatus
}: CampaignOverviewCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getTypeIcon = () => {
    switch (type) {
      case 'Connector':
        return <UserPlus className="h-4 w-4" />;
      case 'Messenger':
        return <MessageSquare className="h-4 w-4" />;
      case 'Open InMail':
        return <Send className="h-4 w-4" />;
      case 'Event Participants':
        return <Users className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'stopped':
        return 'bg-red-100 text-red-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = () => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'low':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const formatMetric = (metric: { count: number; total: number; percentage: number }) => {
    if (metric.total === 0) return '-';
    return `${metric.percentage.toFixed(1)}%`;
  };

  const formatMetricDetail = (metric: { count: number; total: number }) => {
    if (metric.total === 0) return '0 of 0';
    return `${metric.count} of ${metric.total}`;
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-xs">
                {getTypeIcon()}
                <span className="ml-1">{type}</span>
              </Badge>
              <Badge className={cn("text-xs", getStatusColor())}>
                {status}
              </Badge>
              <Badge variant="outline" className={cn("text-xs", getPriorityColor())}>
                <Flag className="h-3 w-3 mr-1" />
                {priority}
              </Badge>
            </div>
            <h3 className="font-semibold text-lg text-gray-900 mb-1">{name}</h3>
            <p className="text-sm text-gray-500">
              <Calendar className="h-3 w-3 inline mr-1" />
              {status === 'stopped' && stoppedAt
                ? `Stopped ${format(stoppedAt, 'dd MMM, yyyy')}`
                : `Created at ${format(createdAt, 'dd MMM, yyyy')}`}
            </p>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-2">
            {status === 'active' ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onToggleStatus?.(id, 'paused')}
              >
                <Pause className="h-4 w-4" />
              </Button>
            ) : status === 'paused' ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onToggleStatus?.(id, 'active')}
              >
                <Play className="h-4 w-4" />
              </Button>
            ) : null}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit?.(id)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Campaign
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDuplicate?.(id)}>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Analytics
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => onDelete?.(id)}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Campaign
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* People Count or Add Button */}
        <div className="mb-4">
          {metrics.totalPeople > 0 ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-900">
                  {metrics.totalPeople} People in total
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAddPeople?.(id)}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add More
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => onAddPeople?.(id)}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add people
            </Button>
          )}
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Contacted */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-600">Contacted</span>
              <Send className="h-3 w-3 text-gray-400" />
            </div>
            <div className="text-xl font-bold text-gray-900">
              {formatMetric(metrics.contacted)}
            </div>
            <div className="text-xs text-gray-500">
              {formatMetricDetail(metrics.contacted)}
            </div>
            {metrics.contacted.total > 0 && (
              <Progress 
                value={metrics.contacted.percentage} 
                className="h-1"
              />
            )}
          </div>

          {/* Connected */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-600">Connected</span>
              <UserCheck className="h-3 w-3 text-gray-400" />
            </div>
            <div className="text-xl font-bold text-gray-900">
              {formatMetric(metrics.connected)}
            </div>
            <div className="text-xs text-gray-500">
              {formatMetricDetail(metrics.connected)}
            </div>
            {metrics.connected.total > 0 && (
              <Progress 
                value={metrics.connected.percentage} 
                className="h-1"
              />
            )}
          </div>

          {/* Replied to connection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-600">Replied to connection</span>
              <Reply className="h-3 w-3 text-gray-400" />
            </div>
            <div className="text-xl font-bold text-gray-900">
              {formatMetric(metrics.repliedToConnection)}
            </div>
            <div className="text-xs text-gray-500">
              {formatMetricDetail(metrics.repliedToConnection)}
            </div>
            {metrics.repliedToConnection.total > 0 && (
              <Progress 
                value={metrics.repliedToConnection.percentage} 
                className="h-1"
              />
            )}
          </div>

          {/* Replied to other */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-600">Replied to other</span>
              <MessageSquare className="h-3 w-3 text-gray-400" />
            </div>
            <div className="text-xl font-bold text-gray-900">
              {formatMetric(metrics.repliedToOther)}
            </div>
            <div className="text-xs text-gray-500">
              {formatMetricDetail(metrics.repliedToOther)}
            </div>
            {metrics.repliedToOther.total > 0 && (
              <Progress 
                value={metrics.repliedToOther.percentage} 
                className="h-1"
              />
            )}
          </div>
        </div>

        {/* Expandable Details (optional) */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Daily limit:</span>
                <span className="ml-2 font-medium">50 contacts</span>
              </div>
              <div>
                <span className="text-gray-600">Follow-ups:</span>
                <span className="ml-2 font-medium">3 messages</span>
              </div>
              <div>
                <span className="text-gray-600">Response rate:</span>
                <span className="ml-2 font-medium text-green-600">
                  {metrics.repliedToConnection.total > 0 
                    ? `${((metrics.repliedToConnection.count / metrics.contacted.count) * 100).toFixed(1)}%`
                    : 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Acceptance rate:</span>
                <span className="ml-2 font-medium text-blue-600">
                  {metrics.connected.total > 0 
                    ? `${((metrics.connected.count / metrics.contacted.count) * 100).toFixed(1)}%`
                    : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Expand/Collapse Button */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full mt-4"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? 'Show Less' : 'Show More Details'}
        </Button>
      </CardContent>
    </Card>
  );
}