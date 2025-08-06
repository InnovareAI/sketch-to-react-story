import { TrendingUp, TrendingDown, Users, Target, MessageSquare, BarChart3 } from "lucide-react";
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
  },
  {
    title: "Active Connections",
    value: "1,247",
    change: "+8.2%",
    trend: "up",
    icon: Users,
  },
  {
    title: "Response Rate",
    value: "23.5%",
    change: "-2.1%",
    trend: "down",
    icon: MessageSquare,
  },
  {
    title: "Conversion Rate",
    value: "8.4%",
    change: "+5.7%",
    trend: "up",
    icon: BarChart3,
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
  },
  {
    name: "CO Impact Days 2024",
    status: "Active",
    contacted: "54.55%",
    connected: "0%",
    replied: "0%",
    other: "0%",
    progress: 55,
  },
  {
    name: "Intermediary Scale Campaign",
    status: "Active",
    contacted: "90.19%",
    connected: "22.2%",
    replied: "2.41%",
    other: "0.47%",
    progress: 90,
  },
];

export function WorkspaceDashboard() {
  return (
    <div className="p-6 space-y-6">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => (
          <Card key={metric.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.title}
              </CardTitle>
              <metric.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <div className="flex items-center text-xs">
                {metric.trend === "up" ? (
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                )}
                <span className={metric.trend === "up" ? "text-green-500" : "text-red-500"}>
                  {metric.change}
                </span>
                <span className="text-muted-foreground ml-1">from last month</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Campaign Activity</CardTitle>
          <Button variant="outline" size="sm">
            View All
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {campaigns.map((campaign) => (
              <div key={campaign.name} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-medium">{campaign.name}</h3>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      {campaign.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <span>Contacted: {campaign.contacted}</span>
                    <span>Connected: {campaign.connected}</span>
                    <span>Replied: {campaign.replied}</span>
                    <span>Other: {campaign.other}</span>
                  </div>
                  <div className="mt-2">
                    <Progress value={campaign.progress} className="h-2" />
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  View Details
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" variant="outline">
              <Target className="h-4 w-4 mr-2" />
              Create New Campaign
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Users className="h-4 w-4 mr-2" />
              Import Contacts
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <MessageSquare className="h-4 w-4 mr-2" />
              Review Messages
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Performance Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Best performing day</span>
                <span className="font-medium">Tuesday</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Avg. response time</span>
                <span className="font-medium">2.4 hours</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Active LinkedIn accounts</span>
                <span className="font-medium">3</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">API Status</span>
                <Badge className="bg-green-100 text-green-800">Operational</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Queue Status</span>
                <Badge className="bg-green-100 text-green-800">Healthy</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Last Sync</span>
                <span className="text-sm font-medium">2 min ago</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}