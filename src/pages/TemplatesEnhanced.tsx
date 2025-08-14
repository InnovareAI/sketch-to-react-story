import { useState, useEffect } from "react";
import { useLocalTemplates, LocalTemplate, TemplateMessage } from "@/hooks/useLocalTemplates";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  Upload,
  Save,
  Clock,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  X,
  Timer,
  Zap
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';

export default function TemplatesEnhanced() {
  const [selectedTemplate, setSelectedTemplate] = useState<LocalTemplate | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<LocalTemplate | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);
  
  const { 
    templates, 
    stats, 
    loading, 
    error, 
    refreshData, 
    createTemplate, 
    updateTemplate, 
    deleteTemplate,
    duplicateTemplate,
    addFollowUpMessage,
    removeMessage,
    AUTO_SAVE_INTERVAL
  } = useLocalTemplates();

  // New template state
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    type: "email" as 'email' | 'linkedin' | 'whatsapp',
    category: "General",
    tags: [] as string[],
    messages: [{
      id: 'msg-new-1',
      type: 'initial' as const,
      subject: "",
      content: "",
    }] as TemplateMessage[]
  });

  // Auto-save indicator
  useEffect(() => {
    if (autoSaveEnabled && editingTemplate) {
      const timer = setInterval(() => {
        setLastAutoSave(new Date());
      }, AUTO_SAVE_INTERVAL);
      
      return () => clearInterval(timer);
    }
  }, [autoSaveEnabled, editingTemplate, AUTO_SAVE_INTERVAL]);

  // Filter templates
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          template.messages.some(m => m.content.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = filterType === "all" || template.type === filterType;
    return matchesSearch && matchesType;
  });

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

  const handleCreateTemplate = async () => {
    if (!newTemplate.name || !newTemplate.messages[0].content) {
      toast.error('Please fill in template name and content');
      return;
    }

    try {
      await createTemplate({
        name: newTemplate.name,
        type: newTemplate.type,
        messages: newTemplate.messages,
        category: newTemplate.category,
        tags: newTemplate.tags,
      });
      
      setNewTemplate({
        name: "",
        type: "email",
        category: "General",
        tags: [],
        messages: [{
          id: 'msg-new-1',
          type: 'initial',
          subject: "",
          content: "",
        }]
      });
      setShowCreateDialog(false);
    } catch (error) {
      console.error('Failed to create template:', error);
    }
  };

  const handleAddFollowUp = () => {
    const newMessage: TemplateMessage = {
      id: `msg-new-${Date.now()}`,
      type: 'follow-up',
      subject: newTemplate.type === 'email' ? '' : undefined,
      content: '',
      delay: 3,
      delayUnit: 'days'
    };
    
    setNewTemplate({
      ...newTemplate,
      messages: [...newTemplate.messages, newMessage]
    });
  };

  const handleRemoveMessage = (messageId: string) => {
    setNewTemplate({
      ...newTemplate,
      messages: newTemplate.messages.filter(m => m.id !== messageId)
    });
  };

  const handleUpdateMessage = (messageId: string, updates: Partial<TemplateMessage>) => {
    setNewTemplate({
      ...newTemplate,
      messages: newTemplate.messages.map(m => 
        m.id === messageId ? { ...m, ...updates } : m
      )
    });
  };

  const handleEditTemplate = async () => {
    if (!editingTemplate) return;
    
    try {
      await updateTemplate(editingTemplate.id, editingTemplate, false);
      setShowEditDialog(false);
      setEditingTemplate(null);
    } catch (error) {
      console.error('Failed to update template:', error);
    }
  };

  const handleAutoSaveToggle = () => {
    setAutoSaveEnabled(!autoSaveEnabled);
    toast.success(autoSaveEnabled ? 'Auto-save disabled' : 'Auto-save enabled');
  };

  return (
    <div className="flex-1 bg-gray-50 min-h-screen">
      <main className="p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Templates</h1>
              <p className="text-gray-600 mt-1">Manage your message templates with follow-up sequences</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Auto-save indicator */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border">
                <button
                  onClick={handleAutoSaveToggle}
                  className="flex items-center gap-2 text-sm"
                >
                  {autoSaveEnabled ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-green-600">Auto-save ON</span>
                    </>
                  ) : (
                    <>
                      <X className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-500">Auto-save OFF</span>
                    </>
                  )}
                </button>
                {lastAutoSave && autoSaveEnabled && (
                  <span className="text-xs text-gray-400 border-l pl-2 ml-2">
                    Saved {new Date(lastAutoSave).toLocaleTimeString()}
                  </span>
                )}
              </div>
              
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Template
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">{stats.totalTemplates}</div>
                    <div className="text-sm text-gray-600">Total Templates</div>
                  </div>
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">{stats.activeTemplates}</div>
                    <div className="text-sm text-gray-600">Active</div>
                  </div>
                  <Zap className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">{stats.averageResponseRate}%</div>
                    <div className="text-sm text-gray-600">Avg Response</div>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">
                      {templates.reduce((sum, t) => sum + t.messages.length, 0)}
                    </div>
                    <div className="text-sm text-gray-600">Total Messages</div>
                  </div>
                  <MessageSquare className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="linkedin">LinkedIn</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Templates Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map((template) => (
                <Card key={template.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getChannelIcon(template.channel)}
                          <CardTitle className="text-lg">{template.name}</CardTitle>
                        </div>
                        <CardDescription>{template.category}</CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            setEditingTemplate(template);
                            setShowEditDialog(true);
                          }}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => duplicateTemplate(template.id)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => deleteTemplate(template.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* Message count */}
                      <div className="flex items-center gap-2 text-sm">
                        <MessageSquare className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">
                          {template.messages.length} {template.messages.length === 1 ? 'message' : 'messages'}
                        </span>
                        {template.messages.length > 1 && (
                          <Badge variant="secondary" className="text-xs">
                            Sequence
                          </Badge>
                        )}
                      </div>
                      
                      {/* Performance metrics */}
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div>
                          <div className="text-gray-500">Sent</div>
                          <div className="font-semibold">{template.performance.sent}</div>
                        </div>
                        <div>
                          <div className="text-gray-500">Opened</div>
                          <div className="font-semibold">{template.performance.opened}</div>
                        </div>
                        <div>
                          <div className="text-gray-500">Response</div>
                          <div className={`font-semibold ${getPerformanceColor(template.performance.responseRate)}`}>
                            {template.performance.responseRate}%
                          </div>
                        </div>
                      </div>
                      
                      {/* Tags */}
                      <div className="flex flex-wrap gap-1">
                        {template.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Create Template Dialog */}
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Template</DialogTitle>
                <DialogDescription>
                  Create a message template with optional follow-up sequences
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Template Name *</Label>
                    <Input
                      value={newTemplate.name}
                      onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value})}
                      placeholder="e.g., Cold Outreach Sequence"
                    />
                  </div>
                  <div>
                    <Label>Channel *</Label>
                    <Select 
                      value={newTemplate.type} 
                      onValueChange={(value: 'email' | 'linkedin' | 'whatsapp') => 
                        setNewTemplate({...newTemplate, type: value})
                      }
                    >
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

                <div>
                  <Label>Category</Label>
                  <Input
                    value={newTemplate.category}
                    onChange={(e) => setNewTemplate({...newTemplate, category: e.target.value})}
                    placeholder="e.g., Cold Outreach"
                  />
                </div>

                {/* Messages */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Messages</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddFollowUp}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Follow-up
                    </Button>
                  </div>
                  
                  {newTemplate.messages.map((message, index) => (
                    <Card key={message.id} className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant={index === 0 ? "default" : "secondary"}>
                              {index === 0 ? 'Initial Message' : `Follow-up ${index}`}
                            </Badge>
                            {index > 0 && (
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <Timer className="h-3 w-3" />
                                <Input
                                  type="number"
                                  value={message.delay || 3}
                                  onChange={(e) => handleUpdateMessage(message.id, { 
                                    delay: parseInt(e.target.value) || 3 
                                  })}
                                  className="w-16 h-7 px-2"
                                />
                                <Select 
                                  value={message.delayUnit || 'days'}
                                  onValueChange={(value: 'hours' | 'days' | 'weeks') => 
                                    handleUpdateMessage(message.id, { delayUnit: value })
                                  }
                                >
                                  <SelectTrigger className="w-20 h-7">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="hours">hours</SelectItem>
                                    <SelectItem value="days">days</SelectItem>
                                    <SelectItem value="weeks">weeks</SelectItem>
                                  </SelectContent>
                                </Select>
                                <span className="text-gray-500">after previous</span>
                              </div>
                            )}
                          </div>
                          {index > 0 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveMessage(message.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        
                        {newTemplate.type === 'email' && (
                          <div>
                            <Label>Subject Line</Label>
                            <Input
                              value={message.subject}
                              onChange={(e) => handleUpdateMessage(message.id, { subject: e.target.value })}
                              placeholder="Enter email subject..."
                            />
                          </div>
                        )}
                        
                        <div>
                          <Label>Message Content</Label>
                          <Textarea
                            value={message.content}
                            onChange={(e) => handleUpdateMessage(message.id, { content: e.target.value })}
                            placeholder="Enter your message... Use {{firstName}}, {{companyName}}, etc. for personalization"
                            rows={5}
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateTemplate}>
                  Create Template
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit Template Dialog */}
          {editingTemplate && (
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
              <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Edit Template</DialogTitle>
                  <DialogDescription>
                    Modify your template and its follow-up sequence
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  <div>
                    <Label>Template Name</Label>
                    <Input
                      value={editingTemplate.name}
                      onChange={(e) => {
                        const updated = {...editingTemplate, name: e.target.value};
                        setEditingTemplate(updated);
                        if (autoSaveEnabled) {
                          updateTemplate(editingTemplate.id, updated, true);
                        }
                      }}
                    />
                  </div>
                  
                  {/* Messages editing */}
                  <div className="space-y-4">
                    <Label>Messages</Label>
                    {editingTemplate.messages.map((message, index) => (
                      <Card key={message.id} className="p-4">
                        <div className="space-y-3">
                          <Badge variant={index === 0 ? "default" : "secondary"}>
                            {index === 0 ? 'Initial Message' : `Follow-up ${index}`}
                          </Badge>
                          
                          {editingTemplate.type === 'email' && message.subject !== undefined && (
                            <Input
                              value={message.subject}
                              onChange={(e) => {
                                const updated = {
                                  ...editingTemplate,
                                  messages: editingTemplate.messages.map(m =>
                                    m.id === message.id ? {...m, subject: e.target.value} : m
                                  )
                                };
                                setEditingTemplate(updated);
                                if (autoSaveEnabled) {
                                  updateTemplate(editingTemplate.id, updated, true);
                                }
                              }}
                              placeholder="Subject line"
                            />
                          )}
                          
                          <Textarea
                            value={message.content}
                            onChange={(e) => {
                              const updated = {
                                ...editingTemplate,
                                messages: editingTemplate.messages.map(m =>
                                  m.id === message.id ? {...m, content: e.target.value} : m
                                )
                              };
                              setEditingTemplate(updated);
                              if (autoSaveEnabled) {
                                updateTemplate(editingTemplate.id, updated, true);
                              }
                            }}
                            rows={5}
                          />
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => {
                    setShowEditDialog(false);
                    setEditingTemplate(null);
                  }}>
                    Cancel
                  </Button>
                  <Button onClick={handleEditTemplate}>
                    Save Changes
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </main>
    </div>
  );
}