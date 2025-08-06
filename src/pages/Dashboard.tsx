import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { WorkspaceHeader } from "@/components/workspace/WorkspaceHeader";
import { WorkspaceSidebar } from "@/components/workspace/WorkspaceSidebar";
import { ConversationalInterface } from "@/components/workspace/ConversationalInterface";
import { SidebarProvider } from "@/components/ui/sidebar";
import { 
  BarChart3, 
  Users, 
  Mail, 
  Linkedin, 
  TrendingUp, 
  Target,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle
} from "lucide-react";

export default function Dashboard() {
  const [isConversational, setIsConversational] = useState(false);

  if (isConversational) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <WorkspaceSidebar isConversational={isConversational} />
          <div className="flex-1 flex flex-col overflow-hidden">
            <WorkspaceHeader 
              isConversational={isConversational}
              onToggleMode={setIsConversational}
            />
            <div className="flex-1 overflow-auto">
              <ConversationalInterface />
            </div>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <WorkspaceSidebar isConversational={isConversational} />
        <div className="flex-1 flex flex-col">
          <WorkspaceHeader isConversational={isConversational} onToggleMode={setIsConversational} />
          <main className="flex-1 p-8">
            <div className="max-w-7xl mx-auto">
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Overview of your outreach performance</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90">
          <Target className="h-4 w-4 mr-2" />
          New Campaign
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Contacts</CardTitle>
            <Users className="h-4 w-4 text-premium-purple" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">2,847</div>
            <p className="text-xs text-green-600 mt-1">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              +12.5% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Email Response Rate</CardTitle>
            <Mail className="h-4 w-4 text-premium-cyan" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">24.3%</div>
            <p className="text-xs text-green-600 mt-1">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              +2.1% from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">LinkedIn Connections</CardTitle>
            <Linkedin className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">1,234</div>
            <p className="text-xs text-green-600 mt-1">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              +8.2% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Campaigns</CardTitle>
            <BarChart3 className="h-4 w-4 text-premium-orange" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">12</div>
            <p className="text-xs text-gray-600 mt-1">
              <Clock className="h-3 w-3 inline mr-1" />
              3 ending this week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Campaign Performance */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-gray-900">Campaign Performance</CardTitle>
            <CardDescription>Your top performing campaigns this month</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { name: "Q1 Enterprise Outreach", status: "Active", progress: 78, responses: 23, sent: 156 },
              { name: "LinkedIn Lead Generation", status: "Active", progress: 65, responses: 18, sent: 89 },
              { name: "Product Demo Follow-up", status: "Paused", progress: 45, responses: 12, sent: 67 },
              { name: "Holiday Campaign 2024", status: "Completed", progress: 100, responses: 34, sent: 234 }
            ].map((campaign, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h4 className="font-medium text-gray-900">{campaign.name}</h4>
                    <Badge variant={campaign.status === "Active" ? "default" : campaign.status === "Paused" ? "secondary" : "outline"}>
                      {campaign.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600">
                    {campaign.responses}/{campaign.sent} responses
                  </div>
                </div>
                <Progress value={campaign.progress} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900">Recent Activity</CardTitle>
            <CardDescription>Latest updates from your campaigns</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { type: "success", message: "New response from Jennifer Fleming", time: "2 min ago", icon: CheckCircle2 },
              { type: "info", message: "Campaign 'Q1 Enterprise' reached 500 contacts", time: "1 hour ago", icon: BarChart3 },
              { type: "warning", message: "LinkedIn rate limit approaching", time: "3 hours ago", icon: AlertTriangle },
              { type: "success", message: "Meeting scheduled with David Chen", time: "5 hours ago", icon: Calendar },
              { type: "info", message: "New contact added to 'Tech Leads' list", time: "1 day ago", icon: Users }
            ].map((activity, index) => (
              <div key={index} className="flex items-start gap-3">
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
                  <p className="text-sm text-gray-900">{activity.message}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900">Quick Actions</CardTitle>
          <CardDescription>Common tasks to get you started</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <Users className="h-6 w-6" />
              <span>Import Contacts</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <Target className="h-6 w-6" />
              <span>Create Campaign</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <BarChart3 className="h-6 w-6" />
              <span>View Analytics</span>
            </Button>
          </div>
        </CardContent>
      </Card>
      </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}