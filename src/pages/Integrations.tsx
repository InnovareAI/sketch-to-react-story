import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { 
  Plug2, 
  Linkedin, 
  Mail, 
  MessageSquare, 
  Calendar,
  Bot,
  Webhook,
  Settings,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Plus,
  Zap,
  Database,
  BarChart3,
  FileText,
  Users,
  Target,
  Clock
} from "lucide-react";

export default function Integrations() {
  const integrations = [
    {
      id: "linkedin",
      name: "LinkedIn",
      description: "Connect LinkedIn accounts for automated outreach and data collection",
      icon: Linkedin,
      category: "Social Media",
      status: "connected",
      color: "text-blue-700 bg-blue-100",
      accounts: 3,
      features: ["Profile scraping", "Connection requests", "Message automation", "InMail campaigns"]
    },
    {
      id: "gmail",
      name: "Gmail / Google Workspace",
      description: "Email campaigns and inbox management through Gmail",
      icon: Mail,
      category: "Email",
      status: "connected",
      color: "text-red-600 bg-red-100",
      accounts: 2,
      features: ["Email campaigns", "Inbox sync", "Template management", "Tracking pixels"]
    },
    {
      id: "outlook",
      name: "Microsoft Outlook",
      description: "Microsoft 365 email integration for enterprise teams",
      icon: Mail,
      category: "Email", 
      status: "available",
      color: "text-blue-600 bg-blue-100",
      accounts: 0,
      features: ["Email campaigns", "Calendar sync", "Teams integration", "Enterprise SSO"]
    },
    {
      id: "whatsapp",
      name: "WhatsApp Business",
      description: "WhatsApp messaging for direct customer communication",
      icon: MessageSquare,
      category: "Messaging",
      status: "coming-soon",
      color: "text-green-600 bg-green-100",
      accounts: 0,
      features: ["Bulk messaging", "Template messages", "Contact management", "Analytics"]
    },
    {
      id: "calendar",
      name: "Google Calendar",
      description: "Schedule meetings and manage availability automatically",
      icon: Calendar,
      category: "Productivity",
      status: "available",
      color: "text-purple-600 bg-purple-100",
      accounts: 0,
      features: ["Meeting scheduling", "Availability check", "Timezone handling", "Reminder automation"]
    },
    {
      id: "zapier",
      name: "Zapier",
      description: "Connect to 5000+ apps through Zapier automation platform",
      icon: Zap,
      category: "Automation",
      status: "available",
      color: "text-orange-600 bg-orange-100",
      accounts: 0,
      features: ["Workflow automation", "Trigger actions", "Data sync", "Custom integrations"]
    },
    {
      id: "crm",
      name: "CRM Integration",
      description: "Sync contacts and leads with popular CRM platforms",
      icon: Database,
      category: "CRM",
      status: "available",
      color: "text-indigo-600 bg-indigo-100",
      accounts: 0,
      features: ["Contact sync", "Lead tracking", "Pipeline management", "Custom fields"]
    },
    {
      id: "analytics",
      name: "Google Analytics",
      description: "Track campaign performance and website conversions",
      icon: BarChart3,
      category: "Analytics",
      status: "available",
      color: "text-teal-600 bg-teal-100",
      accounts: 0,
      features: ["Campaign tracking", "Conversion metrics", "ROI analysis", "Custom reports"]
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "connected":
        return <Badge className="bg-green-100 text-green-800">Connected</Badge>;
      case "available":
        return <Badge variant="outline">Available</Badge>;
      case "coming-soon":
        return <Badge className="bg-yellow-100 text-yellow-800">Coming Soon</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "connected":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "available":
        return <Plus className="h-4 w-4 text-gray-600" />;
      case "coming-soon":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const categories = [...new Set(integrations.map(i => i.category))];

  return (
    <div className="flex-1 bg-gray-50">
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Integrations</h1>
              <p className="text-gray-600 mt-1">Connect your favorite tools and automate your workflow</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Manage API Keys
              </Button>
              <Button variant="outline">
                <Webhook className="h-4 w-4 mr-2" />
                Webhooks
              </Button>
            </div>
          </div>

          {/* Integration Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Integrations</CardTitle>
                <Plug2 className="h-8 w-8 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{integrations.length}</div>
                <p className="text-xs text-gray-600 mt-1">Available platforms</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Connected</CardTitle>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {integrations.filter(i => i.status === "connected").length}
                </div>
                <p className="text-xs text-green-600 mt-1">Active connections</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Accounts</CardTitle>
                <Users className="h-8 w-8 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {integrations.reduce((sum, i) => sum + i.accounts, 0)}
                </div>
                <p className="text-xs text-gray-600 mt-1">Connected accounts</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Available</CardTitle>
                <Target className="h-8 w-8 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {integrations.filter(i => i.status === "available").length}
                </div>
                <p className="text-xs text-gray-600 mt-1">Ready to connect</p>
              </CardContent>
            </Card>
          </div>

          {/* Integrations by Category */}
          {categories.map(category => (
            <div key={category} className="space-y-4">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold text-gray-900">{category}</h2>
                <Badge variant="outline" className="text-xs">
                  {integrations.filter(i => i.category === category).length} integrations
                </Badge>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {integrations.filter(i => i.category === category).map((integration) => (
                  <Card key={integration.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${integration.color}`}>
                            <integration.icon className="h-6 w-6" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg text-gray-900 mb-1">
                              {integration.name}
                            </h3>
                            <p className="text-gray-600 text-sm mb-3">
                              {integration.description}
                            </p>
                            <div className="flex items-center gap-3">
                              {getStatusBadge(integration.status)}
                              {integration.accounts > 0 && (
                                <span className="text-xs text-gray-500">
                                  {integration.accounts} account{integration.accounts > 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Features */}
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Key Features</h4>
                        <div className="flex flex-wrap gap-1">
                          {integration.features.slice(0, 3).map((feature, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
                          {integration.features.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{integration.features.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        {integration.status === "connected" ? (
                          <>
                            <Button size="sm" variant="outline" className="flex-1">
                              <Settings className="h-3 w-3 mr-1" />
                              Configure
                            </Button>
                            <Button size="sm" variant="outline">
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </>
                        ) : integration.status === "available" ? (
                          <Button size="sm" className="flex-1">
                            {getStatusIcon(integration.status)}
                            <span className="ml-1">Connect</span>
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" className="flex-1" disabled>
                            {getStatusIcon(integration.status)}
                            <span className="ml-1">Coming Soon</span>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}

          {/* Custom Integration */}
          <Card className="border-dashed">
            <CardContent className="p-8 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 rounded-full bg-gray-100">
                  <Webhook className="h-8 w-8 text-gray-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Need a Custom Integration?</h3>
                  <p className="text-gray-600 mb-4">
                    Don't see your platform listed? Contact our team to discuss custom integrations and API connections.
                  </p>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Request Integration
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}