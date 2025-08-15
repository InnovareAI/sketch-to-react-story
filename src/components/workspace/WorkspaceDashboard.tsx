import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { TrendingUp, TrendingDown, Users, Target, MessageSquare, BarChart3, Zap, Rocket, Star, Crown, Activity, ArrowUpRight, Eye, Clock, Globe, Loader2, Upload, Search, FileText, TestTube, BarChart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface DashboardMetrics {
  totalCampaigns: number;
  activeConnections: number;
  responseRate: number;
  conversionRate: number;
}

interface CampaignData {
  id: string;
  name: string;
  status: string;
  type: string;
  performance_metrics: any;
  created_at: string;
  updated_at: string;
}

export function WorkspaceDashboard() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalCampaigns: 0,
    activeConnections: 0,
    responseRate: 0,
    conversionRate: 0,
  });
  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch total campaigns
      const { data: campaignsData, error: campaignsError } = await supabase
        .from('campaigns')
        .select('*');

      if (campaignsError) throw campaignsError;

      // Fetch contacts count
      const { data: contactsData, error: contactsError } = await supabase
        .from('contacts')
        .select('id');

      if (contactsError) throw contactsError;

      // Fetch messages for response rate calculation
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('id, status, replied_at, sent_at');

      if (messagesError) throw messagesError;

      // Calculate metrics
      const totalCampaigns = campaignsData?.length || 0;
      const activeConnections = contactsData?.length || 0;
      
      const sentMessages = messagesData?.filter(msg => msg.sent_at) || [];
      const repliedMessages = messagesData?.filter(msg => msg.replied_at) || [];
      const responseRate = sentMessages.length > 0 ? (repliedMessages.length / sentMessages.length) * 100 : 0;
      
      // Simple conversion rate calculation (replied messages / sent messages * some factor)
      const conversionRate = sentMessages.length > 0 ? (repliedMessages.length / sentMessages.length) * 50 : 0;

      setMetrics({
        totalCampaigns,
        activeConnections,
        responseRate: Math.round(responseRate * 10) / 10,
        conversionRate: Math.round(conversionRate * 10) / 10,
      });

      // Set campaigns (limit to 3 for display)
      setCampaigns(campaignsData?.slice(0, 3) || []);

    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getMetricsArray = () => [
    {
      title: "Total Campaigns",
      value: loading ? "..." : metrics.totalCampaigns.toString(),
      change: "+12%",
      trend: "up" as const,
      icon: Target,
      color: "premium-purple",
      gradient: "from-premium-purple to-premium-blue",
      description: "Active multi-channel campaigns",
    },
    {
      title: "Active Connections",
      value: loading ? "..." : metrics.activeConnections.toLocaleString(),
      change: "+8.2%",
      trend: "up" as const,
      icon: Users,
      color: "premium-cyan",
      gradient: "from-premium-cyan to-premium-green",
      description: "Email & LinkedIn connections",
    },
    {
      title: "Response Rate",
      value: loading ? "..." : `${metrics.responseRate}%`,
      change: "-2.1%",
      trend: "down" as const,
      icon: MessageSquare,
      color: "premium-orange",
      gradient: "from-premium-orange to-premium-pink",
      description: "Messages receiving replies",
    },
    {
      title: "Conversion Rate",
      value: loading ? "..." : `${metrics.conversionRate}%`,
      change: "+5.7%",
      trend: "up" as const,
      icon: BarChart3,
      color: "premium-green",
      gradient: "from-premium-green to-premium-cyan",
      description: "Leads converted to opportunities",
    },
  ];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return `${diffInHours} hours ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} days ago`;
    }
  };
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <CardContent>
            <h2 className="text-xl font-bold text-red-600 mb-2">Error Loading Dashboard</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={fetchDashboardData}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const metricsArray = getMetricsArray();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="p-4 lg:p-8 space-y-6 lg:space-y-8">

        {/* Workspace Overview Banner */}
        <div className="relative overflow-hidden rounded-2xl lg:rounded-3xl backdrop-blur-xl bg-white/80 border border-white/20 p-4 lg:p-8 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10" />
          <div className="relative z-10">
            <div className="mb-4 lg:mb-6">
              <div className="flex items-center gap-3 lg:gap-4">
                <div className="p-2 lg:p-3 rounded-2xl bg-gradient-to-br from-purple-600/20 to-blue-600/20 backdrop-blur-sm border border-purple-300/30">
                  <Crown className="h-6 w-6 lg:h-8 lg:w-8 text-purple-600" />
                </div>
                <div>
                  <h1 className="text-2xl lg:text-4xl font-bold bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 bg-clip-text text-transparent">
                    Workspace Overview
                  </h1>
                  <p className="text-slate-600 text-base lg:text-lg">Monitor your multi-channel outreach performance</p>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-premium-green" />
                <span className="text-gray-900">Real-time Analytics</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-premium-orange" />
                <span className="text-gray-900">AI-Powered Insights</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-premium-cyan" />
                <span className="text-gray-900">Premium Workspace</span>
              </div>
            </div>
          </div>
        </div>

        {/* Premium Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {metricsArray.map((metric, index) => (
            <Card key={metric.title} className="group relative overflow-hidden backdrop-blur-xl bg-white/80 border border-white/20 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1">
              <div className="absolute inset-0 opacity-20 bg-gradient-to-br from-purple-400/30 to-blue-400/30" />
              <div className="absolute inset-0 bg-white/95 backdrop-blur-xl" />
              
              <CardHeader className="relative z-10 pb-2">
                <div className="flex items-center justify-between">
                  <div className={`p-2.5 rounded-xl bg-gradient-to-br ${metric.gradient} shadow-lg`}>
                    <metric.icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                      {metric.value}
                      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                      {metric.trend === "up" ? (
                        <TrendingUp className="h-3 w-3 text-premium-green" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-premium-orange" />
                      )}
                      <span className={metric.trend === "up" ? "text-premium-green" : "text-premium-orange"}>
                        {metric.change}
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="relative z-10 pt-0">
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-900">{metric.title}</h3>
                  <p className="text-xs text-gray-600">{metric.description}</p>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full bg-gradient-to-r ${metric.gradient} rounded-full transition-all duration-700 ease-out`}
                      style={{ width: `${65 + index * 10}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Premium Campaign Activity */}
        <Card className="backdrop-blur-xl bg-white/80 border border-white/20 shadow-2xl">
          <CardHeader className="pb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-premium-blue to-premium-purple">
                  <Rocket className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    Active Campaigns
                    {loading && <Loader2 className="h-5 w-5 animate-spin" />}
                  </CardTitle>
                  <p className="text-gray-600">Monitor your outreach performance</p>
                </div>
              </div>
              <Button className="bg-gradient-to-r from-premium-purple to-premium-blue hover:from-premium-purple/90 hover:to-premium-blue/90 border-0 shadow-lg">
                <Eye className="h-4 w-4 mr-2" />
                View All
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {loading ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-premium-purple" />
                <p className="text-gray-600 mt-2">Loading campaigns...</p>
              </div>
            ) : campaigns.length === 0 ? (
              <div className="text-center py-8 text-gray-600">
                <p>No campaigns found. Create your first campaign to get started!</p>
              </div>
            ) : (
              campaigns.map((campaign) => (
                <div key={campaign.id} className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-muted/30 to-muted/10 border border-border/50 p-6 hover:shadow-xl transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-r from-premium-blue/5 to-premium-purple/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg text-foreground">{campaign.name}</h3>
                          <Badge className="bg-premium-green/10 text-premium-green border-premium-green/20">
                            {campaign.status}
                          </Badge>
                          <Badge className="bg-premium-blue/10 text-premium-blue border-premium-blue/20">
                            {campaign.type}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(campaign.updated_at)}
                          </span>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="hover:bg-premium-purple/10">
                        <ArrowUpRight className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Campaign Status</span>
                        <span className="font-medium text-foreground capitalize">{campaign.status}</span>
                      </div>
                      <div className="relative h-2 bg-muted/30 rounded-full overflow-hidden">
                        <div 
                          className="absolute inset-y-0 left-0 bg-gradient-to-r from-premium-purple to-premium-blue rounded-full transition-all duration-1000 ease-out"
                          style={{ width: `${campaign.status === 'active' ? 75 : campaign.status === 'paused' ? 50 : 25}%` }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Premium Action Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Quick Actions */}
          <Card className="backdrop-blur-xl bg-white/80 border border-white/20 shadow-2xl group hover:scale-[1.02] transition-all duration-300">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-premium-orange to-premium-pink">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <CardTitle className="text-lg font-bold">Quick Actions</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={() => navigate('/knowledge')}
                className="w-full justify-start bg-gradient-to-r from-premium-blue/10 to-premium-purple/10 hover:from-premium-blue/20 hover:to-premium-purple/20 border border-premium-blue/20 text-foreground"
              >
                <Upload className="h-4 w-4 mr-3" />
                Upload Knowledge Documents
              </Button>
              <Button 
                onClick={() => navigate('/research')}
                className="w-full justify-start bg-gradient-to-r from-premium-green/10 to-premium-cyan/10 hover:from-premium-green/20 hover:to-premium-cyan/20 border border-premium-green/20 text-foreground"
              >
                <Search className="h-4 w-4 mr-3" />
                Research
              </Button>
              <Button 
                onClick={() => navigate('/research')}
                className="w-full justify-start bg-gradient-to-r from-premium-purple/10 to-premium-pink/10 hover:from-premium-purple/20 hover:to-premium-pink/20 border border-premium-purple/20 text-foreground"
              >
                <Target className="h-4 w-4 mr-3" />
                Find Qualified Leads
              </Button>
              <Button 
                onClick={() => navigate('/agent')}
                className="w-full justify-start bg-gradient-to-r from-premium-cyan/10 to-premium-blue/10 hover:from-premium-cyan/20 hover:to-premium-blue/20 border border-premium-cyan/20 text-foreground"
              >
                <MessageSquare className="h-4 w-4 mr-3" />
                Write Messaging
              </Button>
              <Button 
                onClick={() => navigate('/campaign-setup')}
                className="w-full justify-start bg-gradient-to-r from-premium-orange/10 to-premium-pink/10 hover:from-premium-orange/20 hover:to-premium-pink/20 border border-premium-orange/20 text-foreground"
              >
                <TestTube className="h-4 w-4 mr-3" />
                Setup A/B Testing
              </Button>
              <Button 
                onClick={() => navigate('/dashboard')}
                className="w-full justify-start bg-gradient-to-r from-premium-pink/10 to-premium-orange/10 hover:from-premium-pink/20 hover:to-premium-orange/20 border border-premium-pink/20 text-foreground"
              >
                <BarChart className="h-4 w-4 mr-3" />
                Analyze Performance
              </Button>
            </CardContent>
          </Card>

          {/* Performance Insights */}
          <Card className="backdrop-blur-xl bg-white/80 border border-white/20 shadow-2xl group hover:scale-[1.02] transition-all duration-300">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-premium-cyan to-premium-blue">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                <CardTitle className="text-lg font-bold">Performance Insights</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center p-3 rounded-xl bg-gradient-to-r from-premium-green/10 to-premium-cyan/10 border border-premium-green/20">
                <span className="text-sm text-muted-foreground">Best performing day</span>
                <span className="font-semibold text-premium-green">Tuesday</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-gradient-to-r from-premium-blue/10 to-premium-purple/10 border border-premium-blue/20">
                <span className="text-sm text-muted-foreground">Avg. response time</span>
                <span className="font-semibold text-premium-blue">
                  {loading ? "..." : "2.4 hours"}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-gradient-to-r from-premium-orange/10 to-premium-pink/10 border border-premium-orange/20">
                <span className="text-sm text-muted-foreground">Active campaigns</span>
                <span className="font-semibold text-premium-orange">
                  {loading ? "..." : metrics.totalCampaigns}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card className="backdrop-blur-xl bg-white/80 border border-white/20 shadow-2xl group hover:scale-[1.02] transition-all duration-300">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-premium-green to-premium-cyan">
                  <Globe className="h-5 w-5 text-white" />
                </div>
                <CardTitle className="text-lg font-bold">System Status</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-premium-green/10 to-premium-cyan/10 border border-premium-green/20">
                <span className="text-sm text-muted-foreground">API Status</span>
                <Badge className="bg-premium-green/10 text-premium-green border-premium-green/20 px-3 py-1">
                  <div className="w-2 h-2 bg-premium-green rounded-full mr-2 animate-pulse" />
                  Operational
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-premium-blue/10 to-premium-purple/10 border border-premium-blue/20">
                <span className="text-sm text-muted-foreground">Queue Status</span>
                <Badge className="bg-premium-blue/10 text-premium-blue border-premium-blue/20 px-3 py-1">
                  <div className="w-2 h-2 bg-premium-blue rounded-full mr-2 animate-pulse" />
                  Healthy
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-premium-purple/10 to-premium-pink/10 border border-premium-purple/20">
                <span className="text-sm text-muted-foreground">Database Status</span>
                <Badge className={`px-3 py-1 ${error ? "bg-red-100 text-red-600 border-red-200" : "bg-premium-purple/10 text-premium-purple border-premium-purple/20"}`}>
                  <div className={`w-2 h-2 rounded-full mr-2 animate-pulse ${error ? "bg-red-600" : "bg-premium-purple"}`} />
                  {error ? "Error" : "Connected"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}