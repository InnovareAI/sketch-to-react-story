import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WorkspaceHeader } from "@/components/workspace/WorkspaceHeader";
import { WorkspaceSidebar } from "@/components/workspace/WorkspaceSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { AnalyticsChart } from "@/components/dashboard/AnalyticsChart";
import { useAnalytics } from "@/hooks/useAnalytics";
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
  Settings
} from "lucide-react";

export default function Dashboard() {
  const [isConversational, setIsConversational] = useState(false);
  const navigate = useNavigate();
  const { analytics, chartData, campaignMetrics, refreshData, isLoading } = useAnalytics();

  const handleToggleMode = (conversational: boolean) => {
    if (conversational) {
      navigate('/agent');
    } else {
      setIsConversational(false);
    }
  };

  // Prepare chart data for different visualizations
  const campaignStatusData = [
    { name: 'Active', value: analytics.activeCampaigns },
    { name: 'Paused', value: Math.floor(analytics.totalCampaigns * 0.3) },
    { name: 'Completed', value: analytics.totalCampaigns - analytics.activeCampaigns - Math.floor(analytics.totalCampaigns * 0.3) }
  ];

  const weeklyMessagesData = Array.from({ length: 7 }, (_, i) => ({
    name: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
    value: Math.floor(Math.random() * 200) + 50
  }));

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-50 to-slate-100">
        <WorkspaceSidebar isConversational={isConversational} />
        <div className="flex-1 flex flex-col">
          <WorkspaceHeader isConversational={isConversational} onToggleMode={handleToggleMode} />
          <main className="flex-1 p-8">
            <div className="max-w-7xl mx-auto space-y-8">
              {/* Header with glass morphism effect */}
              <div className="backdrop-blur-xl bg-white/80 border border-white/20 rounded-2xl p-8 shadow-2xl">
                <div className="flex items-center justify-between">
                  <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 bg-clip-text text-transparent">
                    Analytics Dashboard
                  </h1>
                  <p className="text-slate-600 mt-2 text-lg">Real-time insights into your outreach performance</p>
                  </div>
                  <div className="flex items-center gap-3">
                  <Button 
                    variant="outline" 
                    onClick={refreshData}
                    disabled={isLoading}
                    className="backdrop-blur-sm bg-white/50 border border-white/30 hover:bg-white/70 transition-all duration-300 shadow-lg"
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                  <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 border-0 shadow-xl text-white font-semibold px-6 py-2 transition-all duration-300 hover:scale-105">
                    <Settings className="h-4 w-4 mr-2" />
                    Customize Reports
                  </Button>
                  </div>
                </div>
              </div>

              {/* Enhanced KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                  title="Total Contacts"
                  value={analytics.totalContacts}
                  change={{ value: 12.5, type: 'increase', period: 'last month' }}
                  icon={Users}
                  iconColor="text-blue-600"
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
                  iconColor="text-purple-600"
                />
                <MetricCard
                  title="Active Campaigns"
                  value={analytics.activeCampaigns}
                  change={{ value: 8.2, type: 'increase', period: 'last month' }}
                  icon={Target}
                  iconColor="text-orange-600"
                />
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                    {[
                      { 
                        type: "success", 
                        message: "New response from Jennifer Fleming", 
                        time: "2 min ago", 
                        icon: CheckCircle2,
                        campaign: "Q1 Sales Outreach"
                      },
                      { 
                        type: "info", 
                        message: "Campaign reached 1,000 contacts", 
                        time: "1 hour ago", 
                        icon: Users,
                        campaign: "Product Demo Follow-up"
                      },
                      { 
                        type: "warning", 
                        message: "LinkedIn rate limit approaching", 
                        time: "3 hours ago", 
                        icon: AlertTriangle,
                        campaign: "Executive Outreach"
                      },
                      { 
                        type: "success", 
                        message: "Meeting scheduled with David Chen", 
                        time: "5 hours ago", 
                        icon: Calendar,
                        campaign: "Partnership Outreach"
                      }
                    ].map((activity, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className={`p-2 rounded-full ${
                          activity.type === "success" ? "bg-green-100" :
                          activity.type === "warning" ? "bg-yellow-100" : "bg-blue-100"
                        }`}>
                          <activity.icon className={`h-4 w-4 ${
                            activity.type === "success" ? "text-green-600" :
                            activity.type === "warning" ? "text-yellow-600" : "text-blue-600"
                          }`} />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                          <p className="text-xs text-gray-500">{activity.campaign} • {activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}