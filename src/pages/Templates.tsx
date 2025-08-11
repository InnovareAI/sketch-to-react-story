import { useState } from "react";
import { WorkspaceHeader } from "@/components/workspace/WorkspaceHeader";
import { WorkspaceSidebar } from "@/components/workspace/WorkspaceSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  FileText, 
  Mail, 
  MessageSquare, 
  Plus, 
  Search, 
  Filter, 
  Copy, 
  Edit, 
  Trash2, 
  Star,
  MoreHorizontal,
  TrendingUp,
  Users,
  Target,
  Eye,
  Download,
  Upload
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Templates() {
  const [isConversational, setIsConversational] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [newTemplate, setNewTemplate] = useState({ name: "", type: "email", subject: "", content: "" });

  const templates = [
    {
      id: 1,
      name: "Sam Lead Funnel",
      type: "email",
      channel: "Email",
      subject: "Quick question about {{companyName}}'s growth strategy",
      content: "Hi {{firstName}},\n\nI've been following {{companyName}}'s journey and I'm impressed with your recent expansion into {{industry}}.\n\nMany companies at your stage struggle with scaling their lead generation while maintaining quality. I've helped similar companies like {{competitorExample}} increase qualified leads by 40% using our proven funnel approach.\n\nWould you be open to a brief 15-minute conversation about how we could help {{companyName}} achieve similar results?\n\nBest regards,\nSam",
      category: "Lead Generation",
      tags: ["Sam", "Lead Funnel", "Growth"],
      performance: { sent: 189, opened: 127, replied: 45, responseRate: 23.8 },
      lastUsed: "1 hour ago",
      created: "2024-01-20",
      status: "Active"
    },
    {
      id: 2,
      name: "Enterprise Introduction",
      type: "email",
      channel: "Email",
      subject: "Streamline Your Enterprise Operations",
      content: "Hi {{firstName}},\n\nI noticed {{companyName}} has been scaling rapidly. Many companies your size struggle with operational inefficiencies that can cost millions annually.\n\nOur platform has helped similar enterprises like {{competitorExample}} reduce operational costs by 35% while improving productivity.\n\nWould you be interested in a 15-minute call to see how we could help {{companyName}} achieve similar results?\n\nBest regards,\n{{senderName}}",
      category: "Cold Outreach",
      tags: ["Enterprise", "Introduction", "Cold"],
      performance: { sent: 245, opened: 89, replied: 23, responseRate: 9.4 },
      lastUsed: "2 days ago",
      created: "2024-01-15",
      status: "Active"
    },
    {
      id: 3,
      name: "LinkedIn Connection Request",
      type: "linkedin",
      channel: "LinkedIn",
      subject: "Connection Request",
      content: "Hi {{firstName}},\n\nI see we're both in the {{industry}} space. I'd love to connect and share insights about {{specificTopic}}.\n\nLooking forward to connecting!",
      category: "LinkedIn Outreach",
      tags: ["LinkedIn", "Connection", "Networking"],
      performance: { sent: 156, opened: 134, replied: 45, responseRate: 28.8 },
      lastUsed: "1 day ago",
      created: "2024-01-20",
      status: "Active"
    },
    {
      id: 3,
      name: "Demo Follow-up",
      type: "email",
      channel: "Email",
      subject: "Thanks for the demo - Next steps",
      content: "Hi {{firstName}},\n\nThank you for taking the time to see our demo yesterday. I hope you found the {{specificFeature}} capabilities as impressive as I do.\n\nBased on our conversation, it sounds like {{companyName}} could benefit significantly from:\n- {{benefit1}}\n- {{benefit2}}\n- {{benefit3}}\n\nI'd love to discuss how we can customize our solution for {{companyName}}'s specific needs. Are you available for a brief call this week?\n\nBest regards,\n{{senderName}}",
      category: "Follow-up",
      tags: ["Demo", "Follow-up", "Warm"],
      performance: { sent: 78, opened: 72, replied: 34, responseRate: 43.6 },
      lastUsed: "3 hours ago",
      created: "2024-02-01",
      status: "Active"
    },
    {
      id: 4,
      name: "WhatsApp Introduction",
      type: "whatsapp",
      channel: "WhatsApp",
      subject: "WhatsApp Message",
      content: "Hi {{firstName}}! 👋\n\nI'm {{senderName}} from {{companyName}}. I came across {{prospectCompany}} and was impressed by {{specificDetail}}.\n\nWe help companies like yours {{valueProposition}}. Would you be open to a quick chat about how we could help {{prospectCompany}}?\n\nThanks! 🙂",
      category: "WhatsApp Outreach",
      tags: ["WhatsApp", "Introduction", "Casual"],
      performance: { sent: 34, opened: 32, replied: 18, responseRate: 52.9 },
      lastUsed: "1 week ago",
      created: "2024-02-05",
      status: "Active"
    }
  ];

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case "Email": return <Mail className="h-4 w-4 text-blue-600" />;
      case "LinkedIn": return <MessageSquare className="h-4 w-4 text-blue-700" />;
      case "WhatsApp": return <MessageSquare className="h-4 w-4 text-green-600" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getPerformanceColor = (rate: number) => {
    if (rate >= 30) return "text-green-600";
    if (rate >= 15) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <SidebarProvider defaultOpen={true} open={true}>
      <div className="min-h-screen flex w-full bg-gray-50">
        <WorkspaceSidebar isConversational={isConversational} />
        <div className="flex-1 flex flex-col">
          <WorkspaceHeader isConversational={isConversational} onToggleMode={setIsConversational} />
          <main className="flex-1 p-8">
            <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Templates</h1>
          <p className="text-gray-600 mt-1">Manage your message templates and track performance</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Template</DialogTitle>
                <DialogDescription>
                  Create a new message template for your campaigns
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Template Name</label>
                    <Input
                      placeholder="Enter template name"
                      value={newTemplate.name}
                      onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Channel</label>
                    <Select value={newTemplate.type} onValueChange={(value) => setNewTemplate({...newTemplate, type: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="linkedin">LinkedIn</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {newTemplate.type === "email" && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Subject Line</label>
                    <Input
                      placeholder="Enter email subject"
                      value={newTemplate.subject}
                      onChange={(e) => setNewTemplate({...newTemplate, subject: e.target.value})}
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Message Content</label>
                  <Textarea
                    placeholder="Enter your template content with variables like {{firstName}}, {{companyName}}, etc."
                    rows={8}
                    value={newTemplate.content}
                    onChange={(e) => setNewTemplate({...newTemplate, content: e.target.value})}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline">Cancel</Button>
                  <Button>Create Template</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search templates..."
              className="pl-10"
            />
          </div>
          <select className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
            <option>All Types</option>
            <option>Email</option>
            <option>LinkedIn</option>
            <option>WhatsApp</option>
            <option>Follow-up</option>
          </select>
          <select className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
            <option>All Categories</option>
            <option>Outreach</option>
            <option>Follow-up</option>
            <option>Meeting</option>
            <option>Thank You</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            More Filters
          </Button>
        </div>
      </div>

      {/* Search and Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-2">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search templates..."
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">24</div>
                <div className="text-sm text-gray-600">Total Templates</div>
              </div>
              <FileText className="h-8 w-8 text-premium-purple" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">18</div>
                <div className="text-sm text-gray-600">Active</div>
              </div>
              <Target className="h-8 w-8 text-premium-cyan" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">23.7%</div>
                <div className="text-sm text-gray-600">Avg Response Rate</div>
              </div>
              <TrendingUp className="h-8 w-8 text-premium-orange" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Templates Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Templates List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Templates</CardTitle>
              <Button variant="ghost" size="sm">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-0">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className={`p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors ${
                    selectedTemplate?.id === template.id ? "bg-muted" : ""
                  }`}
                  onClick={() => setSelectedTemplate(template)}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getChannelIcon(template.channel)}
                        <span className="font-medium text-sm">{template.name}</span>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            Preview
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="text-xs text-gray-600">{template.category}</div>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">
                        {template.channel}
                      </Badge>
                      <span className={`text-xs font-medium ${getPerformanceColor(template.performance.responseRate)}`}>
                        {template.performance.responseRate}% response
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {template.tags.slice(0, 2).map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Template Detail */}
        <Card className="lg:col-span-2">
          <CardHeader>
            {selectedTemplate ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getChannelIcon(selectedTemplate.channel)}
                  <div>
                    <CardTitle className="text-lg">{selectedTemplate.name}</CardTitle>
                    <CardDescription>{selectedTemplate.category}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon">
                    <Star className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button size="sm">
                    <Copy className="h-4 w-4 mr-2" />
                    Use Template
                  </Button>
                </div>
              </div>
            ) : (
              <CardTitle>Select a template to view details</CardTitle>
            )}
          </CardHeader>
          <CardContent>
            {selectedTemplate ? (
              <Tabs defaultValue="content">
                <TabsList>
                  <TabsTrigger value="content">Content</TabsTrigger>
                  <TabsTrigger value="performance">Performance</TabsTrigger>
                </TabsList>

                <TabsContent value="content" className="space-y-4 mt-6">
                  {selectedTemplate.type === "email" && (
                    <div>
                      <h4 className="font-medium text-sm mb-2">Subject Line</h4>
                      <div className="p-3 bg-muted rounded-lg">
                        <code className="text-sm">{selectedTemplate.subject}</code>
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <h4 className="font-medium text-sm mb-2">Message Content</h4>
                    <div className="p-4 bg-muted rounded-lg">
                      <pre className="text-sm whitespace-pre-wrap font-sans">
                        {selectedTemplate.content}
                      </pre>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedTemplate.tags.map((tag: string, index: number) => (
                        <Badge key={index} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Created:</span>
                      <span className="ml-2">{selectedTemplate.created}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Last used:</span>
                      <span className="ml-2">{selectedTemplate.lastUsed}</span>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="performance" className="space-y-4 mt-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">{selectedTemplate.performance.sent}</div>
                      <div className="text-sm text-gray-600">Sent</div>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">{selectedTemplate.performance.opened}</div>
                      <div className="text-sm text-gray-600">Opened</div>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-premium-cyan">{selectedTemplate.performance.replied}</div>
                      <div className="text-sm text-gray-600">Replied</div>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className={`text-2xl font-bold ${getPerformanceColor(selectedTemplate.performance.responseRate)}`}>
                        {selectedTemplate.performance.responseRate}%
                      </div>
                      <div className="text-sm text-gray-600">Response Rate</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Open Rate</span>
                      <span>{((selectedTemplate.performance.opened / selectedTemplate.performance.sent) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-premium-cyan h-2 rounded-full" 
                        style={{ width: `${(selectedTemplate.performance.opened / selectedTemplate.performance.sent) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Reply Rate</span>
                      <span>{selectedTemplate.performance.responseRate}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-premium-purple h-2 rounded-full" 
                        style={{ width: `${selectedTemplate.performance.responseRate}%` }}
                      ></div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="text-center text-gray-500 py-12">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Select a template to view its details and performance</p>
              </div>
            )}
          </CardContent>
        </Card>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}