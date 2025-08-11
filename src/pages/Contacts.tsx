import { useState } from "react";
import { WorkspaceHeader } from "@/components/workspace/WorkspaceHeader";
import { WorkspaceSidebar } from "@/components/workspace/WorkspaceSidebar";
import { ConversationalInterface } from "@/components/workspace/ConversationalInterface";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Mail, 
  Phone, 
  Building2, 
  MapPin, 
  Search,
  Filter,
  Plus,
  Users,
  Star,
  TrendingUp,
  MoreHorizontal,
  UserPlus,
  MessageSquare,
  Calendar,
  DollarSign,
  Target,
  Save,
  X,
  Edit,
  Download,
  Upload,
  List,
  Grid3X3,
  Globe,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Contacts() {
  const [isConversational, setIsConversational] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "tile">("list");
  const [editingContact, setEditingContact] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Prevent view mode from changing when clicking on form elements
  const handleViewModeChange = (mode: "list" | "tile") => {
    setViewMode(mode);
  };

  // CSV Import functionality
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [csvData, setCsvData] = useState("");
  
  const handleImportContacts = () => {
    if (!csvData.trim()) {
      // Show error toast if no data
      return;
    }
    // Process CSV data here
    console.log("Importing CSV data:", csvData);
    setShowImportDialog(false);
    setCsvData("");
    // Could add toast notification here
  };
  
  const contacts = [
    {
      id: 1,
      name: "Jennifer Fleming",
      email: "jennifer.fleming@techcorp.com",
      phone: "+1 (555) 123-4567",
      whatsapp: "+1 (555) 123-4567",
      companyPhone: "+1 (555) 123-0000",
      company: "TechCorp Solutions",
      role: "VP of Sales",
      location: "San Francisco, CA",
      linkedin: "linkedin.com/in/jennifer-fleming",
      website: "techcorp.com",
      status: "Hot Lead",
      lastContact: "2 days ago",
      nextFollowUp: "Tomorrow",
      responseRate: 85,
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b829?w=400&h=400&fit=crop&crop=face",
      tags: ["Enterprise", "Decision Maker", "Tech"],
      campaigns: 3,
      meetings: 2,
      revenue: "$45,000",
      priority: "High",
      leadScore: 92,
      notes: "Very interested in our enterprise solution. Mentioned budget approval next quarter."
    },
    {
      id: 2,
      name: "David Chen",
      email: "david.chen@innovatelabs.io",
      phone: "+1 (555) 987-6543",
      whatsapp: "+1 (555) 987-6543",
      companyPhone: "+1 (555) 987-0000",
      company: "InnovateLabs",
      role: "CTO",
      location: "Austin, TX",
      linkedin: "linkedin.com/in/david-chen-cto",
      website: "innovatelabs.io",
      status: "Warm Lead",
      lastContact: "1 week ago",
      nextFollowUp: "Next Monday",
      responseRate: 72,
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face",
      tags: ["Tech", "Startup", "Innovation"],
      campaigns: 2,
      meetings: 1,
      revenue: "$28,500",
      priority: "Medium",
      leadScore: 78,
      notes: "Technical decision maker. Needs demo of API integration capabilities."
    },
    {
      id: 3,
      name: "Sarah Williams",
      email: "sarah.williams@growthmetrics.com",
      phone: "+1 (555) 456-7890",
      whatsapp: "+1 (555) 456-7890",
      companyPhone: "+1 (555) 456-0000",
      company: "GrowthMetrics",
      role: "Head of Marketing",
      location: "New York, NY",
      linkedin: "linkedin.com/in/sarahwilliams",
      website: "growthmetrics.com",
      status: "Prospect",
      lastContact: "3 days ago",
      nextFollowUp: "This Friday",
      responseRate: 68,
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face",
      tags: ["Marketing", "B2B", "Analytics"],
      campaigns: 1,
      meetings: 0,
      revenue: "$0",
      priority: "Medium",
      leadScore: 65,
      notes: "Interested in marketing automation features. Planning to evaluate Q2."
    },
    {
      id: 4,
      name: "Michael Rodriguez",
      email: "michael.r@scalecorp.com",
      phone: "+1 (555) 789-0123",
      whatsapp: "+1 (555) 789-0123",
      companyPhone: "+1 (555) 789-0000",
      company: "ScaleCorp",
      role: "Operations Director",
      location: "Chicago, IL",
      linkedin: "linkedin.com/in/michaelrodriguez",
      website: "scalecorp.com",
      status: "New Contact",
      lastContact: "Never",
      nextFollowUp: "This week",
      responseRate: 0,
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
      tags: ["Operations", "Mid-Market", "Logistics"],
      campaigns: 0,
      meetings: 0,
      revenue: "$0",
      priority: "Low",
      leadScore: 45,
      notes: "New contact from trade show. Expressed interest in operational efficiency tools."
    },
    {
      id: 5,
      name: "Emily Johnson",
      email: "emily.johnson@financeplus.com",
      phone: "+1 (555) 234-5678",
      whatsapp: "+1 (555) 234-5678",
      companyPhone: "+1 (555) 234-0000",
      company: "FinancePlus",
      role: "CFO",
      location: "Boston, MA",
      linkedin: "linkedin.com/in/emilyjohnson-cfo",
      website: "financeplus.com",
      status: "Replied",
      lastContact: "1 day ago",
      nextFollowUp: "Next week",
      responseRate: 92,
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop&crop=face",
      tags: ["Finance", "C-Level", "ROI-Focused"],
      campaigns: 2,
      meetings: 3,
      revenue: "$67,000",
      priority: "High",
      leadScore: 88,
      notes: "Very responsive. Scheduled for contract discussion next week."
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Hot Lead": return "default";
      case "Warm Lead": return "secondary";
      case "Replied": return "outline";
      case "Prospect": return "outline";
      case "New Contact": return "destructive";
      default: return "outline";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High": return "bg-red-100 text-red-800";
      case "Medium": return "bg-yellow-100 text-yellow-800";
      case "Low": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Hot Lead": return <Star className="h-4 w-4 text-orange-500" />;
      case "Warm Lead": return <Target className="h-4 w-4 text-blue-500" />;
      case "Replied": return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "Prospect": return <Eye className="h-4 w-4 text-purple-500" />;
      case "New Contact": return <Clock className="h-4 w-4 text-gray-500" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const handleEditContact = (contact: any) => {
    setEditingContact({ ...contact });
  };

  const handleSaveContact = () => {
    console.log("Saving contact:", editingContact);
    setEditingContact(null);
  };
  
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

  return (
    <SidebarProvider open={true} onOpenChange={() => {}}>
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
          <h1 className="text-3xl font-bold text-gray-900">Contacts</h1>
          <p className="text-gray-600 mt-1">Manage your contact database and relationships</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button variant="outline" onClick={() => setShowImportDialog(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Import CSV
          </Button>
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            Add Contact
          </Button>
        </div>
      </div>

      {/* Edit Contact Dialog */}
      <Dialog open={!!editingContact} onOpenChange={() => setEditingContact(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Contact</DialogTitle>
            <DialogDescription>
              Update the contact information and details.
            </DialogDescription>
          </DialogHeader>
          {editingContact && (
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={editingContact.name}
                  onChange={(e) => setEditingContact({...editingContact, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Input
                  id="role"
                  value={editingContact.role}
                  onChange={(e) => setEditingContact({...editingContact, role: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={editingContact.company}
                  onChange={(e) => setEditingContact({...editingContact, company: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={editingContact.email}
                  onChange={(e) => setEditingContact({...editingContact, email: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Personal Phone</Label>
                <Input
                  id="phone"
                  value={editingContact.phone}
                  onChange={(e) => setEditingContact({...editingContact, phone: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  value={editingContact.whatsapp}
                  onChange={(e) => setEditingContact({...editingContact, whatsapp: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyPhone">Company Phone</Label>
                <Input
                  id="companyPhone"
                  value={editingContact.companyPhone}
                  onChange={(e) => setEditingContact({...editingContact, companyPhone: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={editingContact.location}
                  onChange={(e) => setEditingContact({...editingContact, location: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="linkedin">LinkedIn</Label>
                <Input
                  id="linkedin"
                  value={editingContact.linkedin}
                  onChange={(e) => setEditingContact({...editingContact, linkedin: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={editingContact.website}
                  onChange={(e) => setEditingContact({...editingContact, website: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={editingContact.status} onValueChange={(value) => setEditingContact({...editingContact, status: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Hot Lead">Hot Lead</SelectItem>
                    <SelectItem value="Warm Lead">Warm Lead</SelectItem>
                    <SelectItem value="Prospect">Prospect</SelectItem>
                    <SelectItem value="New Contact">New Contact</SelectItem>
                    <SelectItem value="Replied">Replied</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={editingContact.priority} onValueChange={(value) => setEditingContact({...editingContact, priority: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={editingContact.notes}
                  onChange={(e) => setEditingContact({...editingContact, notes: e.target.value})}
                  rows={3}
                />
              </div>
              <div className="col-span-2 flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setEditingContact(null)}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSaveContact}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* CSV Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import Contacts from CSV</DialogTitle>
            <DialogDescription>
              Paste your CSV data below. Expected format: Name, Email, Phone, Company, Role, Location
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="csv-data">CSV Data</Label>
              <Textarea
                id="csv-data"
                value={csvData}
                onChange={(e) => setCsvData(e.target.value)}
                placeholder={`Jennifer Fleming,jennifer@techcorp.com,+1-555-123-4567,TechCorp,VP Sales,San Francisco
David Chen,david@innovate.io,+1-555-987-6543,InnovateLabs,CTO,Austin
Sarah Williams,sarah@growth.com,+1-555-456-7890,GrowthMetrics,Marketing Head,New York`}
                rows={8}
                className="font-mono text-sm"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              <p><strong>Format:</strong> Name, Email, Phone, Company, Role, Location</p>
              <p><strong>Note:</strong> Each contact should be on a separate line</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowImportDialog(false)}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleImportContacts}>
                <Upload className="h-4 w-4 mr-2" />
                Import Contacts
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Search, View Toggle and Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
        <Card className="lg:col-span-2">
          <CardContent className="p-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, company..."
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">View:</span>
              <div className="flex rounded-lg border border-border overflow-hidden">
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleViewModeChange("list");
                  }}
                  className="rounded-none"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "tile" ? "default" : "ghost"}
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleViewModeChange("tile");
                  }}
                  className="rounded-none"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Contacts</CardTitle>
            <Users className="h-4 w-4 text-premium-purple" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">2,847</div>
            <p className="text-xs text-green-600 mt-1">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              +15 this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Hot Leads</CardTitle>
            <Star className="h-4 w-4 text-premium-orange" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">156</div>
            <p className="text-xs text-green-600 mt-1">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              +8 this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Replied</CardTitle>
            <MessageSquare className="h-4 w-4 text-premium-cyan" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">89</div>
            <p className="text-xs text-green-600 mt-1">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              +12 today
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search contacts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <select className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
            <option>All Status</option>
            <option>Hot Lead</option>
            <option>Warm Lead</option>
            <option>Replied</option>
            <option>Prospect</option>
            <option>New Contact</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            More Filters
          </Button>
        </div>
      </div>

      {/* Contacts Content - Conditional Rendering */}
      {viewMode === "list" ? (
        /* List View */
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900">Contacts List</CardTitle>
            <CardDescription>Detailed view of all your contacts</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contact</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Lead Score</TableHead>
                  <TableHead>Response Rate</TableHead>
                  <TableHead>Next Follow-up</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((contact) => (
                  <TableRow key={contact.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={contact.avatar} alt={contact.name} />
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {contact.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-gray-900">{contact.name}</div>
                          <div className="text-sm text-gray-600">{contact.role}</div>
                          <div className="text-xs text-gray-500">{contact.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-gray-400" />
                        <div>
                          <div className="font-medium">{contact.company}</div>
                          <div className="text-sm text-gray-500">{contact.location}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(contact.status)}
                        <Badge variant={getStatusColor(contact.status)}>
                          {contact.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPriorityColor(contact.priority)}>
                        {contact.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm font-medium">{contact.leadScore}/100</div>
                        <Progress value={contact.leadScore} className="h-1 w-16" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm font-medium">{contact.responseRate}%</div>
                        <Progress value={contact.responseRate} className="h-1 w-16" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Calendar className="h-3 w-3" />
                        {contact.nextFollowUp}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Mail className="h-4 w-4 mr-2" />
                            Send Email
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <MessageSquare className="h-4 w-4 mr-2" />
                            WhatsApp
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Add to Campaign
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleEditContact(contact)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Contact
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        /* Tile View - Enhanced Contact Cards */
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {contacts.map((contact) => (
            <Card key={contact.id} className="hover:shadow-lg transition-all duration-200 hover-scale">
              <CardContent className="p-6">
                {/* Card Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={contact.avatar} alt={contact.name} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                        {contact.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900">{contact.name}</h3>
                      <p className="text-lg text-premium-purple font-medium">{contact.role}</p>
                      <p className="text-gray-600">{contact.company}</p>
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Mail className="h-4 w-4 mr-2" />
                        Send Email
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <MessageSquare className="h-4 w-4 mr-2" />
                        WhatsApp
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add to Campaign
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleEditContact(contact)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Contact
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Status and Priority Badges */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center gap-1">
                    {getStatusIcon(contact.status)}
                    <Badge variant={getStatusColor(contact.status)}>
                      {contact.status}
                    </Badge>
                  </div>
                  <Badge className={getPriorityColor(contact.priority)}>
                    {contact.priority}
                  </Badge>
                </div>

                {/* Contact Details */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="truncate">{contact.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="h-4 w-4" />
                    <span>{contact.phone}</span>
                  </div>
                  {contact.companyPhone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-4 w-4 text-premium-cyan" />
                      <span>{contact.companyPhone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Globe className="h-4 w-4" />
                    <span className="truncate">{contact.website}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span>{contact.location}</span>
                  </div>
                </div>

                {/* Lead Score and Response Rate */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Lead Score</span>
                      <span className="text-sm font-medium">{contact.leadScore}/100</span>
                    </div>
                    <Progress value={contact.leadScore} className="h-2" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Response Rate</span>
                      <span className="text-sm font-medium">{contact.responseRate}%</span>
                    </div>
                    <Progress value={contact.responseRate} className="h-2" />
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Target className="h-4 w-4 text-premium-purple" />
                    </div>
                    <div className="text-lg font-semibold text-gray-900">{contact.campaigns}</div>
                    <div className="text-xs text-gray-600">Campaigns</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Calendar className="h-4 w-4 text-premium-cyan" />
                    </div>
                    <div className="text-lg font-semibold text-gray-900">{contact.meetings}</div>
                    <div className="text-xs text-gray-600">Meetings</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <DollarSign className="h-4 w-4 text-premium-orange" />
                    </div>
                    <div className="text-lg font-semibold text-premium-cyan">{contact.revenue}</div>
                    <div className="text-xs text-gray-600">Revenue</div>
                  </div>
                </div>

                {/* Tags */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-1">
                    {contact.tags.map((tag: string, index: number) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                {contact.notes && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Notes</h4>
                    <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded">{contact.notes}</p>
                  </div>
                )}

                {/* Next Follow-up */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>Next follow-up: {contact.nextFollowUp}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mb-2">
                  <Button size="sm" className="flex-1 animate-fade-in">
                    Email
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 animate-fade-in">
                    WhatsApp
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1 animate-fade-in">
                    Add to Campaign
                  </Button>
                  <Button size="sm" variant="outline" className="animate-fade-in" onClick={() => handleEditContact(contact)}>
                    <Edit className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}