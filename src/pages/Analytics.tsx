import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown,
  Users, 
  Target, 
  Mail, 
  Eye,
  BarChart3,
  MessageSquare,
  Calendar,
  DollarSign
} from "lucide-react";

export default function Analytics() {
  const metrics = [
    {
      title: "Total Campaigns",
      value: "12",
      change: "+3 this month",
      trend: "up",
      icon: Target
    },
    {
      title: "Total Contacts",
      value: "1,247",
      change: "+125 this month",
      trend: "up",
      icon: Users
    },
    {
      title: "Messages Sent",
      value: "3,420",
      change: "+245 this week",
      trend: "up",
      icon: Mail
    },
    {
      title: "Response Rate",
      value: "24.5%",
      change: "+2.1% vs last month",
      trend: "up",
      icon: MessageSquare
    }
  ];

  const campaigns = [
    {
      name: "Q1 Enterprise Outreach",
      status: "Active",
      contacts: 150,
      sent: 145,
      opened: 87,
      replied: 23,
      responseRate: 15.9
    },
    {
      name: "Product Demo Follow-up",
      status: "Active", 
      contacts: 75,
      sent: 75,
      opened: 52,
      replied: 18,
      responseRate: 24.0
    },
    {
      name: "LinkedIn Lead Generation",
      status: "Paused",
      contacts: 200,
      sent: 180,
      opened: 95,
      replied: 31,
      responseRate: 17.2
    }
  ];

  return (
    <div className="flex-1 bg-gray-50">
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
              <p className="text-gray-600 mt-1">Track your LinkedIn automation performance</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                Last 30 Days
              </Button>
              <Button variant="outline">
                Export Report
              </Button>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {metrics.map((metric, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    {metric.title}
                  </CardTitle>
                  <metric.icon className="h-8 w-8 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{metric.value}</div>
                  <p className={`text-xs mt-1 flex items-center ${
                    metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {metric.trend === 'up' ? (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-1" />
                    )}
                    {metric.change}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Campaign Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Campaign Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {campaigns.map((campaign, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900">{campaign.name}</h3>
                        <Badge variant={campaign.status === "Active" ? "default" : "secondary"}>
                          {campaign.status}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-blue-600">{campaign.responseRate}%</div>
                        <div className="text-sm text-gray-500">Response Rate</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-4 mb-3">
                      <div className="text-center">
                        <div className="text-xl font-semibold text-gray-900">{campaign.contacts}</div>
                        <div className="text-xs text-gray-600">Contacts</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-semibold text-gray-900">{campaign.sent}</div>
                        <div className="text-xs text-gray-600">Sent</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-semibold text-gray-900">{campaign.opened}</div>
                        <div className="text-xs text-gray-600">Opened</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-semibold text-blue-600">{campaign.replied}</div>
                        <div className="text-xs text-gray-600">Replied</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{Math.round((campaign.sent / campaign.contacts) * 100)}%</span>
                      </div>
                      <Progress 
                        value={(campaign.sent / campaign.contacts) * 100} 
                        className="h-2"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Content</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-2 border-b">
                    <div>
                      <div className="font-medium">Connection Request Template #1</div>
                      <div className="text-sm text-gray-500">Professional introduction</div>
                    </div>
                    <div className="text-green-600 font-semibold">32% response</div>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <div>
                      <div className="font-medium">Follow-up Message #3</div>
                      <div className="text-sm text-gray-500">Value proposition focused</div>
                    </div>
                    <div className="text-green-600 font-semibold">28% response</div>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <div className="font-medium">Industry Insight Share</div>
                      <div className="text-sm text-gray-500">Thought leadership content</div>
                    </div>
                    <div className="text-green-600 font-semibold">25% response</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Achievements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <div className="font-medium">Highest Monthly Response Rate</div>
                      <div className="text-sm text-gray-500">Achieved 24.5% response rate in March</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <div className="font-medium">1000+ Connections Made</div>
                      <div className="text-sm text-gray-500">Reached milestone this quarter</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                    <div>
                      <div className="font-medium">Top Performing Campaign</div>
                      <div className="text-sm text-gray-500">Product Demo Follow-up exceeded targets</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}