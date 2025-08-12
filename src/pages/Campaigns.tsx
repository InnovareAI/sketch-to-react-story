import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCampaigns } from "@/hooks/useCampaigns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Target, 
  Mail, 
  Linkedin, 
  Users, 
  Play,
  Pause,
  MoreHorizontal,
  Calendar,
  TrendingUp,
  Eye,
  Edit,
  Copy,
  Trash2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Campaigns() {
  const navigate = useNavigate();
  const { campaigns, loading, error, refetch, createCampaign } = useCampaigns();
  
  const handleQuickCreateCampaign = async () => {
    try {
      const campaignName = `Campaign ${new Date().toLocaleDateString()}`;
      await createCampaign(campaignName, 'draft');
    } catch (error) {
      console.error('Failed to create campaign:', error);
    }
  };

  // Empty state component
  const EmptyState = () => (
    <div className="text-center py-12">
      <Target className="mx-auto h-12 w-12 text-gray-400 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns yet</h3>
      <p className="text-gray-600 mb-6">Get started by creating your first campaign</p>
      <div className="flex gap-3 justify-center">
        <Button 
          className="bg-primary hover:bg-primary/90"
          onClick={handleQuickCreateCampaign}
        >
          <Target className="h-4 w-4 mr-2" />
          Quick Create
        </Button>
        <Button 
          variant="outline"
          onClick={() => navigate('/campaign-setup')}
        >
          Advanced Setup
        </Button>
      </div>
    </div>
  );

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active": return "default";
      case "paused": return "secondary";
      case "completed": return "outline";
      case "draft": return "destructive";
      default: return "outline";
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case "email": return <Mail className="h-3 w-3" />;
      case "linkedin": return <Linkedin className="h-3 w-3" />;
      default: return null;
    }
  };

  return (
    <div className="flex-1 bg-gray-50">
      <main className="flex-1 p-8">
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Campaigns</h1>
                  <p className="text-gray-600 mt-1">Manage your outreach campaigns across channels</p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    className="bg-primary hover:bg-primary/90"
                    onClick={() => navigate('/campaign-setup')}
                  >
                    <Target className="h-4 w-4 mr-2" />
                    New Campaign
                  </Button>
                </div>
              </div>

              {/* Campaign Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Campaigns</CardTitle>
            <Target className="h-8 w-8 text-premium-purple" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{campaigns.length}</div>
            <p className="text-xs text-green-600 mt-1">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              All workspace campaigns
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Campaigns</CardTitle>
            <Play className="h-8 w-8 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{campaigns.filter(c => c.status === 'active').length}</div>
            <p className="text-xs text-gray-600 mt-1">
              Currently running
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Draft Campaigns</CardTitle>
            <TrendingUp className="h-8 w-8 text-premium-cyan" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{campaigns.filter(c => c.status === 'draft').length}</div>
            <p className="text-xs text-green-600 mt-1">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              Ready to launch
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">This Month</CardTitle>
            <Users className="h-8 w-8 text-premium-orange" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {campaigns.filter(c => {
                const createdDate = new Date(c.created_at);
                const now = new Date();
                return createdDate.getMonth() === now.getMonth() && createdDate.getFullYear() === now.getFullYear();
              }).length}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              New campaigns
            </p>
          </CardContent>
        </Card>
              </div>

              {/* Filters */}
              <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search campaigns..."
              className="w-80 px-4 py-2 border border-gray-200 rounded-lg text-sm"
            />
          </div>
          <select className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
            <option>All Status</option>
            <option>Active</option>
            <option>Paused</option>
            <option>Completed</option>
            <option>Draft</option>
          </select>
        </div>
        <Button variant="outline" size="sm">
          More Filters
        </Button>
              </div>

              {/* Campaign List */}
              <div className="space-y-4">
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p>Loading campaigns...</p>
                  </div>
                ) : error ? (
                  <div className="text-center py-12">
                    <p className="text-red-600 mb-4">Error: {error}</p>
                    <Button onClick={refetch} variant="outline">
                      Try Again
                    </Button>
                  </div>
                ) : campaigns.length === 0 ? (
                  <EmptyState />
                ) : (
                  campaigns.map((campaign) => {
                    // Use real campaign data with performance metrics
                    // Handle both JSONB performance_metrics field and potential legacy fields
                    const performanceMetrics = (() => {
                      if (campaign.performance_metrics && typeof campaign.performance_metrics === 'object') {
                        return {
                          sent: campaign.performance_metrics.sent || 0,
                          delivered: campaign.performance_metrics.delivered || 0,
                          opened: campaign.performance_metrics.opened || 0,
                          clicked: campaign.performance_metrics.clicked || 0,
                          replied: campaign.performance_metrics.replied || 0,
                          converted: campaign.performance_metrics.converted || 0
                        };
                      }
                      
                      // Fallback to default values if no metrics found
                      return {
                        sent: 0,
                        delivered: 0,
                        opened: 0,
                        clicked: 0,
                        replied: 0,
                        converted: 0
                      };
                    })();

                    const responseRate = performanceMetrics.sent > 0 
                      ? ((performanceMetrics.replied / performanceMetrics.sent) * 100)
                      : 0;

                    const progress = campaign.status === 'active' 
                      ? Math.min(100, Math.max(10, (performanceMetrics.sent / 100) * 100))
                      : campaign.status === 'completed' ? 100 : 0;

                    const campaignWithDefaults = {
                      ...campaign,
                      description: campaign.objective || `${campaign.type} campaign created on ${new Date(campaign.created_at).toLocaleDateString()}`,
                      channels: campaign.type === 'multi_channel' ? ['email', 'linkedin'] : [campaign.type],
                      startDate: campaign.start_date ? new Date(campaign.start_date).toLocaleDateString() : new Date(campaign.created_at).toLocaleDateString(),
                      endDate: campaign.end_date ? new Date(campaign.end_date).toLocaleDateString() : 'Ongoing',
                      progress: Math.round(progress),
                      contacts: performanceMetrics.sent || 0, // Use sent as contact count for now
                      sent: performanceMetrics.sent || 0,
                      opened: performanceMetrics.opened || 0,
                      replied: performanceMetrics.replied || 0,
                      responseRate: Math.round(responseRate * 10) / 10
                    };
                    
                    return (
          <Card key={campaign.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">{campaignWithDefaults.name}</h3>
                    <Badge variant={getStatusColor(campaignWithDefaults.status)}>
                      {campaignWithDefaults.status}
                    </Badge>
                    <Badge variant="outline">{campaignWithDefaults.type}</Badge>
                  </div>
                  <p className="text-gray-600 mb-3">{campaignWithDefaults.description}</p>
                  
                  {/* Channels */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm text-gray-600">Channels:</span>
                    {campaignWithDefaults.channels.map((channel, index) => (
                      <div key={index} className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-md">
                        {getChannelIcon(channel)}
                        <span className="text-xs capitalize">{channel}</span>
                      </div>
                    ))}
                  </div>

                  {/* Date Range */}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>{campaignWithDefaults.startDate} - {campaignWithDefaults.endDate}</span>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => navigate(`/campaign-setup?id=${campaign.id}`)}>
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate(`/campaign-setup?id=${campaign.id}`)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Campaign
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {campaignWithDefaults.status === "active" ? (
                      <DropdownMenuItem>
                        <Pause className="h-4 w-4 mr-2" />
                        Pause Campaign
                      </DropdownMenuItem>
                    ) : campaignWithDefaults.status === "paused" ? (
                      <DropdownMenuItem>
                        <Play className="h-4 w-4 mr-2" />
                        Resume Campaign
                      </DropdownMenuItem>
                    ) : null}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Progress */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Campaign Progress</span>
                  <span className="text-sm font-medium">{campaignWithDefaults.progress}%</span>
                </div>
                <Progress value={campaignWithDefaults.progress} className="h-2" />
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">{campaignWithDefaults.contacts}</div>
                  <div className="text-xs text-gray-600">Contacts</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">{campaignWithDefaults.sent}</div>
                  <div className="text-xs text-gray-600">Sent</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">{campaignWithDefaults.opened}</div>
                  <div className="text-xs text-gray-600">Opened</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-premium-cyan">{campaignWithDefaults.replied}</div>
                  <div className="text-xs text-gray-600">Replied</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-premium-purple">{campaignWithDefaults.responseRate}%</div>
                  <div className="text-xs text-gray-600">Response Rate</div>
                </div>
              </div>
            </CardContent>
          </Card>
                    );
                  })
                )}
              </div>
            </div>
          </main>
    </div>
  );
}