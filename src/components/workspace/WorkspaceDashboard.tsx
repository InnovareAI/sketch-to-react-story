import { TrendingUp, TrendingDown, Users, Target, MessageSquare, BarChart3, Zap, Rocket, Star, Crown, Activity, ArrowUpRight, Eye, Clock, Globe } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const metrics = [
  {
    title: "Total Campaigns",
    value: "24",
    change: "+12%",
    trend: "up",
    icon: Target,
    color: "premium-purple",
    gradient: "from-premium-purple to-premium-blue",
    description: "Active outreach campaigns",
  },
  {
    title: "Active Connections",
    value: "1,247",
    change: "+8.2%",
    trend: "up",
    icon: Users,
    color: "premium-cyan",
    gradient: "from-premium-cyan to-premium-green",
    description: "LinkedIn connections made",
  },
  {
    title: "Response Rate",
    value: "23.5%",
    change: "-2.1%",
    trend: "down",
    icon: MessageSquare,
    color: "premium-orange",
    gradient: "from-premium-orange to-premium-pink",
    description: "Messages receiving replies",
  },
  {
    title: "Conversion Rate",
    value: "8.4%",
    change: "+5.7%",
    trend: "up",
    icon: BarChart3,
    color: "premium-green",
    gradient: "from-premium-green to-premium-cyan",
    description: "Leads converted to opportunities",
  },
];

const campaigns = [
  {
    name: "Who's Who in Impact Investing",
    status: "Active",
    contacted: "52.03%",
    connected: "0%",
    replied: "7.42%",
    other: "0%",
    progress: 52,
    priority: "High",
    leads: 142,
    lastActivity: "2 hours ago",
  },
  {
    name: "CO Impact Days 2024",
    status: "Active",
    contacted: "54.55%",
    connected: "0%",
    replied: "0%",
    other: "0%",
    progress: 55,
    priority: "Medium",
    leads: 89,
    lastActivity: "4 hours ago",
  },
  {
    name: "Intermediary Scale Campaign",
    status: "Active",
    contacted: "90.19%",
    connected: "22.2%",
    replied: "2.41%",
    other: "0.47%",
    progress: 90,
    priority: "High",
    leads: 234,
    lastActivity: "1 hour ago",
  },
];

export function WorkspaceDashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="p-8 space-y-8">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-premium-purple/10 via-premium-blue/10 to-premium-cyan/10 border border-premium-purple/20 p-8">
          <div className="absolute inset-0 bg-gradient-to-r from-premium-purple/5 to-premium-blue/5" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-2xl bg-premium-purple/10 border border-premium-purple/20">
                <Crown className="h-8 w-8 text-premium-purple" />
              </div>
              <div>
                <h1 className="text-3xl font-bold gradient-text">Workspace Overview</h1>
                <p className="text-muted-foreground text-lg">Monitor your LinkedIn outreach performance</p>
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-premium-green" />
                <span className="text-foreground">Real-time Analytics</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-premium-orange" />
                <span className="text-foreground">AI-Powered Insights</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-premium-cyan" />
                <span className="text-foreground">Premium Dashboard</span>
              </div>
            </div>
          </div>
        </div>

        {/* Premium Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((metric, index) => (
            <Card key={metric.title} className="metric-card group relative overflow-hidden border-0">
              <div className={`absolute inset-0 opacity-50 bg-gradient-to-br ${metric.gradient}`} />
              <div className="absolute inset-0 bg-background/90 backdrop-blur-xl" />
              
              <CardHeader className="relative z-10 pb-2">
                <div className="flex items-center justify-between">
                  <div className={`p-2.5 rounded-xl bg-gradient-to-br ${metric.gradient} shadow-lg`}>
                    <metric.icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-foreground">{metric.value}</div>
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
                  <h3 className="font-semibold text-foreground">{metric.title}</h3>
                  <p className="text-xs text-muted-foreground">{metric.description}</p>
                  <div className="h-1.5 bg-muted/20 rounded-full overflow-hidden">
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
        <Card className="glass-card border-0 premium-shadow">
          <CardHeader className="pb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-premium-blue to-premium-purple">
                  <Rocket className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-foreground">Active Campaigns</CardTitle>
                  <p className="text-muted-foreground">Monitor your outreach performance</p>
                </div>
              </div>
              <Button className="bg-gradient-to-r from-premium-purple to-premium-blue hover:from-premium-purple/90 hover:to-premium-blue/90 border-0 shadow-lg">
                <Eye className="h-4 w-4 mr-2" />
                View All
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {campaigns.map((campaign, index) => (
              <div key={campaign.name} className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-muted/30 to-muted/10 border border-border/50 p-6 hover:shadow-xl transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-r from-premium-blue/5 to-premium-purple/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg text-foreground">{campaign.name}</h3>
                        <Badge className={`px-3 py-1 ${
                          campaign.priority === "High" 
                            ? "bg-premium-orange/10 text-premium-orange border-premium-orange/20" 
                            : "bg-premium-cyan/10 text-premium-cyan border-premium-cyan/20"
                        }`}>
                          {campaign.priority} Priority
                        </Badge>
                        <Badge className="bg-premium-green/10 text-premium-green border-premium-green/20">
                          {campaign.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {campaign.leads} leads
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {campaign.lastActivity}
                        </span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="hover:bg-premium-purple/10">
                      <ArrowUpRight className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-sm font-medium text-foreground">{campaign.contacted}</div>
                      <div className="text-xs text-muted-foreground">Contacted</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium text-foreground">{campaign.connected}</div>
                      <div className="text-xs text-muted-foreground">Connected</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium text-foreground">{campaign.replied}</div>
                      <div className="text-xs text-muted-foreground">Replied</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium text-foreground">{campaign.other}</div>
                      <div className="text-xs text-muted-foreground">Other</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Campaign Progress</span>
                      <span className="font-medium text-foreground">{campaign.progress}%</span>
                    </div>
                    <div className="relative h-2 bg-muted/30 rounded-full overflow-hidden">
                      <div 
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-premium-purple to-premium-blue rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${campaign.progress}%` }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Premium Action Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <Card className="glass-card border-0 premium-shadow group hover:scale-[1.02] transition-all duration-300">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-premium-orange to-premium-pink">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <CardTitle className="text-lg font-bold">Quick Actions</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start bg-gradient-to-r from-premium-purple/10 to-premium-blue/10 hover:from-premium-purple/20 hover:to-premium-blue/20 border border-premium-purple/20 text-foreground">
                <Target className="h-4 w-4 mr-3" />
                Create New Campaign
              </Button>
              <Button className="w-full justify-start bg-gradient-to-r from-premium-cyan/10 to-premium-green/10 hover:from-premium-cyan/20 hover:to-premium-green/20 border border-premium-cyan/20 text-foreground">
                <Users className="h-4 w-4 mr-3" />
                Import Contacts
              </Button>
              <Button className="w-full justify-start bg-gradient-to-r from-premium-orange/10 to-premium-pink/10 hover:from-premium-orange/20 hover:to-premium-pink/20 border border-premium-orange/20 text-foreground">
                <MessageSquare className="h-4 w-4 mr-3" />
                Review Messages
              </Button>
            </CardContent>
          </Card>

          {/* Performance Insights */}
          <Card className="glass-card border-0 premium-shadow group hover:scale-[1.02] transition-all duration-300">
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
                <span className="font-semibold text-premium-blue">2.4 hours</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-gradient-to-r from-premium-orange/10 to-premium-pink/10 border border-premium-orange/20">
                <span className="text-sm text-muted-foreground">Active LinkedIn accounts</span>
                <span className="font-semibold text-premium-orange">3</span>
              </div>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card className="glass-card border-0 premium-shadow group hover:scale-[1.02] transition-all duration-300">
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
                <span className="text-sm text-muted-foreground">Last Sync</span>
                <span className="text-sm font-semibold text-premium-purple flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  2 min ago
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}