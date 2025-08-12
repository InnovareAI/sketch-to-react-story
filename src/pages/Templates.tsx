import { useState } from "react";
import { useRealTemplates, TemplateWithPerformance } from "@/hooks/useRealTemplates";
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
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateWithPerformance | null>(null);
  const [newTemplate, setNewTemplate] = useState({ name: "", type: "email", subject: "", content: "" });
  const { templates, stats, loading, error, refreshData, createTemplate, updateTemplate, deleteTemplate } = useRealTemplates();

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case "Email": return <Mail className="h-4 w-4 text-premium-cyan" />;
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
    <div className="flex-1 bg-gray-50">
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
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
                  <Button 
                    onClick={async () => {
                      try {
                        await createTemplate({
                          name: newTemplate.name,
                          type: newTemplate.type,
                          subject: newTemplate.subject,
                          content: newTemplate.content,
                        });
                        setNewTemplate({ name: "", type: "email", subject: "", content: "" });
                      } catch (error) {
                        console.error('Failed to create template:', error);
                      }
                    }}
                  >
                    Create Template
                  </Button>
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
                <div className="text-2xl font-bold text-gray-900">{stats.totalTemplates}</div>
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
                <div className="text-2xl font-bold text-gray-900">{stats.activeTemplates}</div>
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
                <div className="text-2xl font-bold text-gray-900">{stats.averageResponseRate}%</div>
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
              {loading ? (
                <div className="p-4 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Loading templates...</p>
                </div>
              ) : error ? (
                <div className="p-4 text-center">
                  <p className="text-red-600 text-sm mb-2">Error: {error}</p>
                  <Button onClick={refreshData} variant="outline" size="sm">
                    Try Again
                  </Button>
                </div>
              ) : templates.length === 0 ? (
                <div className="p-4 text-center">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm text-gray-600 mb-2">No templates yet</p>
                  <p className="text-xs text-gray-500">Create your first template to get started</p>
                </div>
              ) : (
              templates.map((template) => (
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
              ))
              )}
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
                      <span className="ml-2">{new Date(selectedTemplate.created_at).toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Last used:</span>
                      <span className="ml-2">
                        {selectedTemplate.lastUsed 
                          ? new Date(selectedTemplate.lastUsed).toLocaleDateString()
                          : 'Never'
                        }
                      </span>
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
        </div>
      </main>
    </div>
  );
}