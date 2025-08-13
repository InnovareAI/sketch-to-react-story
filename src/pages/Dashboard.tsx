import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { AnalyticsChart } from "@/components/dashboard/AnalyticsChart";
import { useRealAnalytics } from "@/hooks/useRealAnalytics";
import { 
  Users, 
  Mail, 
  Linkedin, 
  Target,
  TrendingUp,
  MessageSquare,
  BarChart3,
  RefreshCw,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Settings,
  Plus,
  UserPlus
} from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();
  const { analytics, chartData, campaignMetrics, refreshData, isLoading, error } = useRealAnalytics();

  // Prepare chart data for different visualizations
  const campaignStatusData = [
    { name: 'Active', value: analytics.activeCampaigns },
    { name: 'Paused', value: Math.floor(analytics.totalCampaigns * 0.3) },
    { name: 'Completed', value: analytics.totalCampaigns - analytics.activeCampaigns - Math.floor(analytics.totalCampaigns * 0.3) }
  ];

  // Use last 7 days of real chart data for weekly view
  const weeklyMessagesData = chartData.slice(-7).map((data, i) => ({
    name: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i] || new Date(data.name).toLocaleDateString(),
    value: data.value || 0
  }));

  return (
    <div className="flex-1 bg-white">
      <main className="flex-1 p-4 lg:p-8 bg-gray-50">
            <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="display-text">SAM Analytics</h1>
                  <p className="body-text mt-1">AI-powered sales intelligence and performance metrics</p>
                  {error && (
                    <div className="mt-2 text-red-600 text-sm">
                      <AlertTriangle className="h-4 w-4 inline mr-1" />
                      {error}
                    </div>
                  )}
                </div>
                <div className="flex gap-3">
                  <button 
                    className="flat-button flat-button-secondary"
                    onClick={refreshData}
                    disabled={isLoading}
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                  <button className="flat-button flat-button-primary">
                    <Settings className="h-4 w-4" />
                    Customize Reports
                  </button>
                </div>
              </div>

              {/* Enhanced KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                <MetricCard
                  title="Total Contacts"
                  value={analytics.totalContacts}
                  change={{ value: 12.5, type: 'increase', period: 'last month' }}
                  icon={Users}
                  iconColor="text-premium-cyan"
                />
                <MetricCard
                  title="Response Rate"
                  value={`${analytics.responseRate}%`}
                  change={{ value: 2.1, type: 'increase', period: 'last week' }}
                  icon={MessageSquare}
                  iconColor="text-green-600"
                />
                <MetricCard
                  title="Open Rate"
                  value={`${analytics.openRate}%`}
                  change={{ value: 5.3, type: 'increase', period: 'last week' }}
                  icon={Mail}
                  iconColor="text-premium-purple"
                />
                <MetricCard
                  title="Active Campaigns"
                  value={analytics.activeCampaigns}
                  change={{ value: 8.2, type: 'increase', period: 'last month' }}
                  icon={Target}
                  iconColor="text-premium-orange"
                />
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
                <AnalyticsChart
                  title="Response Rate Trend"
                  description="Daily response rates over the past 30 days"
                  data={chartData}
                  type="line"
                  color="#3b82f6"
                />
                <AnalyticsChart
                  title="Campaign Status Distribution"
                  description="Current status of all campaigns"
                  data={campaignStatusData}
                  type="pie"
                />
              </div>

              {/* Weekly Messages Chart */}
              <AnalyticsChart
                title="Weekly Message Volume"
                description="Messages sent per day this week"
                data={weeklyMessagesData}
                type="bar"
                color="#10b981"
                className="w-full"
              />

              {/* Campaign Performance Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Campaign Performance
                  </CardTitle>
                  <CardDescription>Detailed metrics for your active campaigns</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {campaignMetrics.map((campaign) => (
                      <div key={campaign.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-gray-900">{campaign.name}</h3>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                campaign.status === 'active' ? 'bg-green-100 text-green-800' :
                                campaign.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {campaign.status}
                              </span>
                            </div>
                            <div className="grid grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-gray-500">Sent:</span>
                                <span className="ml-1 font-medium">{campaign.sent.toLocaleString()}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Opened:</span>
                                <span className="ml-1 font-medium">{campaign.opened.toLocaleString()}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Replied:</span>
                                <span className="ml-1 font-medium">{campaign.replied.toLocaleString()}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Response Rate:</span>
                                <span className="ml-1 font-medium text-green-600">{campaign.responseRate}%</span>
                              </div>
                            </div>
                          </div>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity Feed */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Recent Activity
                  </CardTitle>
                  <CardDescription>Latest updates from your campaigns</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {campaignMetrics.slice(0, 4).map((campaign, index) => (
                      <div key={campaign.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="p-2 rounded-full bg-blue-100">
                          <Target className="h-4 w-4 text-premium-cyan" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {campaign.name} - {campaign.sent} messages sent
                          </p>
                          <p className="text-xs text-gray-500">
                            {campaign.responseRate}% response rate • {campaign.startDate}
                          </p>
                        </div>
                      </div>
                    ))}
                    {campaignMetrics.length === 0 && (
                      <div className="text-center text-gray-500 py-8">
                        <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>No recent activity. Create your first campaign to get started!</p>
                        <Button 
                          className="mt-4" 
                          onClick={() => navigate('/campaign-setup')}
                        >
                          Create Campaign
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
      
    </div>
  );
}