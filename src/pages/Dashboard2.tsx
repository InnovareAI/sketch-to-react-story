import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WorkspaceHeader } from "@/components/workspace/WorkspaceHeader";
import { WorkspaceSidebar } from "@/components/workspace/WorkspaceSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { AnalyticsChart } from "@/components/dashboard/AnalyticsChart";
import { DashboardSkeleton } from "@/components/ui/skeleton";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Users, 
  Mail, 
  Target,
  TrendingUp,
  MessageSquare,
  BarChart3,
  RefreshCw,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle
} from "lucide-react";

export default function Dashboard() {
  const [isConversational] = useState(false);
  const navigate = useNavigate();
  const { analytics, chartData, campaignMetrics, refreshData, isLoading } = useAnalytics();

  const handleToggleMode = (conversational: boolean) => {
    if (conversational) {
      navigate('/agent');
    }
  };

  // Enhanced metrics with realistic data
  const enhancedMetrics = [
    {
      title: "Total Contacts",
      value: analytics.totalContacts,
      change: { value: 12.5, type: 'increase' as const, period: 'last month' },
      icon: Users,
      iconColor: "text-premium-cyan"
    },
    {
      title: "Response Rate", 
      value: `${analytics.responseRate}%`,
      change: { value: 2.1, type: 'increase' as const, period: 'last week' },
      icon: MessageSquare,
      iconColor: "text-green-600"
    },
    {
      title: "Open Rate",
      value: `${analytics.openRate}%`, 
      change: { value: 5.3, type: 'increase' as const, period: 'last week' },
      icon: Mail,
      iconColor: "text-premium-purple"
    },
    {
      title: "Active Campaigns",
      value: analytics.activeCampaigns,
      change: { value: 8.2, type: 'increase' as const, period: 'last month' },
      icon: Target,
      iconColor: "text-premium-orange"
    }
  ];

  if (isLoading && !analytics.totalContacts) {
    return (
      <SidebarProvider open={true} onOpenChange={() => {}}>
        <div className="min-h-screen flex w-full">
          <WorkspaceSidebar isConversational={isConversational} />
          <div className="flex-1">
            <WorkspaceHeader isConversational={isConversational} onToggleMode={handleToggleMode} />
            <div className="p-6">
              <DashboardSkeleton />
            </div>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider open={true} onOpenChange={() => {}}>
      <div className="min-h-screen flex w-full">
        <WorkspaceSidebar isConversational={isConversational} />
        <div className="flex-1">
          <WorkspaceHeader isConversational={isConversational} onToggleMode={handleToggleMode} />
          <main className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600 mt-1">Real-time insights into your outreach performance</p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={refreshData}
                  disabled={isLoading}
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''} mr-2`} />
                  {isLoading ? 'Refreshing...' : 'Refresh'}
                </Button>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {enhancedMetrics.map((metric, index) => (
                <MetricCard key={index} {...metric} />
              ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <AnalyticsChart
                title="Response Rate Trend"
                description="Daily response rates over the past 30 days"
                data={chartData}
                type="line"
                color="#3b82f6"
              />
              <AnalyticsChart
                title="Weekly Message Volume"
                description="Messages sent per day this week"
                data={Array.from({ length: 7 }, (_, i) => ({
                  name: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
                  value: Math.floor(Math.random() * 200) + 50
                }))}
                type="bar"
                color="#10b981"
              />
            </div>

            {/* Campaign Performance */}
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
                    <div key={campaign.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold">{campaign.name}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              campaign.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                              campaign.status === 'paused' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                              'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                            }`}>
                              {campaign.status}
                            </span>
                          </div>
                          <div className="grid grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Sent:</span>
                              <span className="ml-1 font-medium">{campaign.sent.toLocaleString()}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Opened:</span>
                              <span className="ml-1 font-medium">{campaign.opened.toLocaleString()}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Replied:</span>
                              <span className="ml-1 font-medium">{campaign.replied.toLocaleString()}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Response Rate:</span>
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

            {/* Recent Activity */}
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
                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className={`p-2 rounded-full ${
                        activity.type === "success" ? "bg-green-100 dark:bg-green-900" :
                        activity.type === "warning" ? "bg-yellow-100 dark:bg-yellow-900" : "bg-blue-100 dark:bg-blue-900"
                      }`}>
                        <activity.icon className={`h-4 w-4 ${
                          activity.type === "success" ? "text-green-600 dark:text-green-300" :
                          activity.type === "warning" ? "text-yellow-600 dark:text-yellow-300" : "text-premium-cyan dark:text-premium-cyan"
                        }`} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.message}</p>
                        <p className="text-xs text-muted-foreground">{activity.campaign} • {activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}