import { useState, useEffect } from "react";
import { supabase } from '@/integrations/supabase/client';

export interface Account {
  id: number;
  name: string;
  email: string;
  phone: string;
  whatsapp: string;
  companyPhone: string;
  company: string;
  role: string;
  location: string;
  linkedin: string;
  status: string;
  lastContact: string;
  responseRate: number;
  avatar: string;
  campaigns: number;
  meetings: number;
  revenue: string;
  currentCampaigns: string[];
}
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Building2, 
  Mail, 
  Linkedin, 
  Users, 
  TrendingUp, 
  Phone,
  Globe,
  MapPin,
  Star,
  Plus,
  Filter,
  Search,
  Download,
  Upload,
  Edit,
  Grid3X3,
  List,
  MoreHorizontal,
  UserPlus,
  MessageSquare,
  Calendar,
  DollarSign,
  Target,
  Save,
  X
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Accounts() {
  const [viewMode, setViewMode] = useState<"list" | "tile">("tile");
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load contacts from database
      const { data: contacts, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform contacts to Account format
      const accountsData: Account[] = (contacts || []).map((contact, index) => ({
        id: index + 1,
        name: contact.name || 'Unknown',
        email: contact.email || '',
        phone: contact.phone || '',
        whatsapp: contact.phone || '',
        companyPhone: '',
        company: contact.company || '',
        role: contact.role || '',
        location: contact.location || '',
        linkedin: contact.linkedin_url || '',
        status: contact.status || 'active',
        lastContact: new Date(contact.updated_at || contact.created_at).toLocaleDateString(),
        responseRate: Math.floor(Math.random() * 30) + 70, // Random for demo
        avatar: contact.metadata?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${contact.name}`,
        campaigns: 0,
        meetings: 0,
        revenue: '$0',
        currentCampaigns: []
      }));

      setAccounts(accountsData);
    } catch (error) {
      console.error('Error loading contacts:', error);
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEditAccount = (account: Account) => {
    setEditingAccount({ ...account });
  };

  const handleSaveAccount = () => {
    // Here you would typically save to your backend
    console.log("Saving account:", editingAccount);
    setEditingAccount(null);
  };

  return (
    <div className="flex-1 bg-gray-50">
      <main className="flex-1 p-8">
            <div className="max-w-7xl mx-auto">
              <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Accounts</h1>
          <p className="text-gray-600 mt-1">Manage your contacts and target accounts</p>
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
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Upload
          </Button>
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            Add Account
          </Button>
        </div>
      </div>

      {/* Edit Account Dialog */}
      <Dialog open={!!editingAccount} onOpenChange={() => setEditingAccount(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Account</DialogTitle>
            <DialogDescription>
              Update the account information and contact details.
            </DialogDescription>
          </DialogHeader>
          {editingAccount && (
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={editingAccount.name}
                  onChange={(e) => setEditingAccount({...editingAccount, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Input
                  id="role"
                  value={editingAccount.role}
                  onChange={(e) => setEditingAccount({...editingAccount, role: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={editingAccount.company}
                  onChange={(e) => setEditingAccount({...editingAccount, company: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={editingAccount.email}
                  onChange={(e) => setEditingAccount({...editingAccount, email: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Personal Phone</Label>
                <Input
                  id="phone"
                  value={editingAccount.phone}
                  onChange={(e) => setEditingAccount({...editingAccount, phone: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  value={editingAccount.whatsapp}
                  onChange={(e) => setEditingAccount({...editingAccount, whatsapp: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyPhone">Company Phone</Label>
                <Input
                  id="companyPhone"
                  value={editingAccount.companyPhone}
                  onChange={(e) => setEditingAccount({...editingAccount, companyPhone: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={editingAccount.location}
                  onChange={(e) => setEditingAccount({...editingAccount, location: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="linkedin">LinkedIn</Label>
                <Input
                  id="linkedin"
                  value={editingAccount.linkedin}
                  onChange={(e) => setEditingAccount({...editingAccount, linkedin: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={editingAccount.status} onValueChange={(value) => setEditingAccount({...editingAccount, status: value})}>
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
              <div className="col-span-2 flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setEditingAccount(null)}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSaveAccount}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>
          )}
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
                  onClick={() => setViewMode("list")}
                  className="rounded-none"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "tile" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("tile")}
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
            <CardTitle className="text-sm font-medium text-gray-600">Total Accounts</CardTitle>
            <Building2 className="h-8 w-8 text-premium-purple" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{accounts.length}</div>
            <p className="text-xs text-green-600 mt-1">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              {accounts.length > 0 ? `${accounts.length} synced` : 'Sync to add'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Hot Leads</CardTitle>
            <Star className="h-8 w-8 text-premium-orange" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">23</div>
            <p className="text-xs text-green-600 mt-1">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              +8 this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pipeline Value</CardTitle>
            <TrendingUp className="h-8 w-8 text-premium-cyan" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">$1.2M</div>
            <p className="text-xs text-green-600 mt-1">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              +22% vs last quarter
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Accounts Content - Conditional Rendering */}
      {loading ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <p className="text-muted-foreground">Loading contacts...</p>
            </div>
          </CardContent>
        </Card>
      ) : accounts.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Users className="h-12 w-12 text-muted-foreground" />
              <p className="text-lg font-medium text-gray-900">No contacts yet</p>
              <p className="text-muted-foreground text-center max-w-md">
                Connect your LinkedIn account and sync to import your contacts, or add them manually.
              </p>
              <Button className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Add First Contact
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : viewMode === "list" ? (
        /* List View */
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900">Accounts List</CardTitle>
            <CardDescription>Detailed view of all your accounts</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contact</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Response Rate</TableHead>
                  <TableHead>Campaigns</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Last Contact</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map((account) => (
                  <TableRow key={account.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={account.avatar} alt={account.name} />
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {account.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-gray-900">{account.name}</div>
                          <div className="text-sm text-gray-600">{account.role}</div>
                          <div className="text-xs text-gray-500">{account.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-gray-400" />
                        <div>
                          <div className="font-medium">{account.company}</div>
                          <div className="text-sm text-gray-500">{account.location}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        account.status === "Hot Lead" ? "default" :
                        account.status === "Warm Lead" ? "secondary" : "outline"
                      }>
                        {account.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm font-medium">{account.responseRate}%</div>
                        <Progress value={account.responseRate} className="h-1 w-16" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-center">
                        <div className="text-lg font-semibold">{account.campaigns}</div>
                        <div className="text-xs text-gray-500">active</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-premium-cyan">{account.revenue}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-600">{account.lastContact}</div>
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
                            <Linkedin className="h-4 w-4 mr-2" />
                            LinkedIn Message
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Add to Campaign
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleEditAccount(account)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Account
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
        /* Tile View - Enhanced Trello-like Cards */
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {accounts.map((account) => (
            <Card key={account.id} className="hover:shadow-lg transition-all duration-200 hover-scale">
              <CardContent className="p-6">
                {/* Card Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={account.avatar} alt={account.name} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                        {account.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900">{account.name}</h3>
                      <p className="text-lg text-premium-purple font-medium">{account.role}</p>
                      <p className="text-gray-600">{account.company}</p>
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
                        <Linkedin className="h-4 w-4 mr-2" />
                        LinkedIn Message
                      </DropdownMenuItem>
                          <DropdownMenuItem>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Add to Campaign
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleEditAccount(account)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Account
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                </div>

                {/* Status Badge */}
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant={
                    account.status === "Hot Lead" ? "default" :
                    account.status === "Warm Lead" ? "secondary" : "outline"
                  }>
                    {account.status}
                  </Badge>
                  <div className="text-xs text-gray-500">Last contact: {account.lastContact}</div>
                </div>

                {/* Contact Details */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="truncate">{account.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="h-4 w-4" />
                    <span>{account.phone}</span>
                  </div>
                  {account.whatsapp && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>{account.whatsapp}</span>
                    </div>
                  )}
                  {account.companyPhone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-4 w-4 text-premium-cyan" />
                      <span>{account.companyPhone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="truncate">{account.linkedin}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span>{account.location}</span>
                  </div>
                </div>

                {/* Response Rate */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Response Rate</span>
                    <span className="text-sm font-medium">{account.responseRate}%</span>
                  </div>
                  <Progress value={account.responseRate} className="h-2" />
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Target className="h-4 w-4 text-premium-purple" />
                    </div>
                    <div className="text-lg font-semibold text-gray-900">{account.campaigns}</div>
                    <div className="text-xs text-gray-600">Campaigns</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Calendar className="h-4 w-4 text-premium-cyan" />
                    </div>
                    <div className="text-lg font-semibold text-gray-900">{account.meetings}</div>
                    <div className="text-xs text-gray-600">Meetings</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <DollarSign className="h-4 w-4 text-premium-orange" />
                    </div>
                    <div className="text-lg font-semibold text-premium-cyan">{account.revenue}</div>
                    <div className="text-xs text-gray-600">Revenue</div>
                  </div>
                </div>

                {/* Current Campaigns */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Current Campaigns</h4>
                  {account.currentCampaigns && account.currentCampaigns.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {account.currentCampaigns.map((campaign: string, index: number) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {campaign}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500">No active campaigns</p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mb-2">
                  <Button size="sm" className="flex-1 animate-fade-in">
                    Email
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 animate-fade-in">
                    LinkedIn
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1 animate-fade-in">
                    WhatsApp
                  </Button>
                  <Button size="sm" variant="outline" className="animate-fade-in" onClick={() => handleEditAccount(account)}>
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
  );
}