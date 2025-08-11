import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { WorkspaceHeader } from "@/components/workspace/WorkspaceHeader";
import { WorkspaceSidebar } from "@/components/workspace/WorkspaceSidebar";
import { ConversationalInterface } from "@/components/workspace/ConversationalInterface";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  const [isConversational, setIsConversational] = useState(false);
  const navigate = useNavigate();

  if (isConversational) {
    return (
      <SidebarProvider open={true} onOpenChange={() => {}}>
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

  const campaigns = [
    {
      id: 1,
      name: "Q1 Enterprise Outreach",
      description: "Targeting enterprise accounts for Q1 growth",
      status: "Active",
      type: "Multi-channel",
      contacts: 156,
      sent: 134,
      opened: 89,
      replied: 23,
      responseRate: 17.2,
      channels: ["email", "linkedin"],
      startDate: "2024-01-15",
      endDate: "2024-03-31",
      progress: 78
    },
    {
      id: 2,
      name: "LinkedIn Lead Generation",
      description: "Connect with decision makers on LinkedIn",
      status: "Active",
      type: "LinkedIn Only",
      contacts: 89,
      sent: 89,
      opened: 67,
      replied: 18,
      responseRate: 20.2,
      channels: ["linkedin"],
      startDate: "2024-02-01",
      endDate: "2024-04-15",
      progress: 65
    },
    {
      id: 3,
      name: "Product Demo Follow-up",
      description: "Follow up with demo attendees",
      status: "Paused",
      type: "Email Only",
      contacts: 67,
      sent: 45,
      opened: 32,
      replied: 12,
      responseRate: 26.7,
      channels: ["email"],
      startDate: "2024-01-20",
      endDate: "2024-02-28",
      progress: 45
    },
    {
      id: 4,
      name: "Holiday Campaign 2024",
      description: "End of year outreach campaign",
      status: "Completed",
      type: "Multi-channel",
      contacts: 234,
      sent: 234,
      opened: 187,
      replied: 34,
      responseRate: 14.5,
      channels: ["email", "linkedin"],
      startDate: "2023-12-01",
      endDate: "2023-12-31",
      progress: 100
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active": return "default";
      case "Paused": return "secondary";
      case "Completed": return "outline";
      case "Draft": return "destructive";
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
    <SidebarProvider open={true} onOpenChange={() => {}}>
      <div className="min-h-screen flex w-full bg-gray-50">
        <WorkspaceSidebar isConversational={isConversational} />
        <div className="flex-1 flex flex-col">
          <WorkspaceHeader isConversational={isConversational} onToggleMode={setIsConversational} />
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
            <div className="text-2xl font-bold text-gray-900">12</div>
            <p className="text-xs text-green-600 mt-1">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              +3 this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Campaigns</CardTitle>
            <Play className="h-8 w-8 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">5</div>
            <p className="text-xs text-gray-600 mt-1">
              2 ending this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Avg Response Rate</CardTitle>
            <TrendingUp className="h-8 w-8 text-premium-cyan" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">19.7%</div>
            <p className="text-xs text-green-600 mt-1">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              +2.3% vs last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Contacts</CardTitle>
            <Users className="h-8 w-8 text-premium-orange" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">546</div>
            <p className="text-xs text-gray-600 mt-1">
              Across all campaigns
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
        {campaigns.map((campaign) => (
          <Card key={campaign.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">{campaign.name}</h3>
                    <Badge variant={getStatusColor(campaign.status)}>
                      {campaign.status}
                    </Badge>
                    <Badge variant="outline">{campaign.type}</Badge>
                  </div>
                  <p className="text-gray-600 mb-3">{campaign.description}</p>
                  
                  {/* Channels */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm text-gray-600">Channels:</span>
                    {campaign.channels.map((channel, index) => (
                      <div key={index} className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-md">
                        {getChannelIcon(channel)}
                        <span className="text-xs capitalize">{channel}</span>
                      </div>
                    ))}
                  </div>

                  {/* Date Range */}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>{campaign.startDate} - {campaign.endDate}</span>
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
                    {campaign.status === "Active" ? (
                      <DropdownMenuItem>
                        <Pause className="h-4 w-4 mr-2" />
                        Pause Campaign
                      </DropdownMenuItem>
                    ) : campaign.status === "Paused" ? (
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
                  <span className="text-sm font-medium">{campaign.progress}%</span>
                </div>
                <Progress value={campaign.progress} className="h-2" />
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">{campaign.contacts}</div>
                  <div className="text-xs text-gray-600">Contacts</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">{campaign.sent}</div>
                  <div className="text-xs text-gray-600">Sent</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">{campaign.opened}</div>
                  <div className="text-xs text-gray-600">Opened</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-premium-cyan">{campaign.replied}</div>
                  <div className="text-xs text-gray-600">Replied</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-premium-purple">{campaign.responseRate}%</div>
                  <div className="text-xs text-gray-600">Response Rate</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}