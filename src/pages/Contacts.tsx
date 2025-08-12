import { useState } from "react";
import { useRealContacts, Contact } from "@/hooks/useRealContacts";
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
import { ContactsListView } from "@/components/contacts/ContactsListView";
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
  Grid3X3,
  List
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Contacts() {
  const [viewMode, setViewMode] = useState<"list" | "tile">("list");
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const { contacts, stats, loading, error, refreshData, createContact, updateContact, deleteContact } = useRealContacts();

  const handleEditContact = (contact: Contact) => {
    setEditingContact({ ...contact });
  };

  const handleSaveContact = () => {
    console.log("Saving contact:", editingContact);
    setEditingContact(null);
  };

  return (
    <div className="flex-1 bg-gray-50">
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Contacts</h1>
                <p className="text-gray-600 mt-1">Manage your LinkedIn contacts and prospects</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </Button>
                <Button className="bg-primary hover:bg-primary/90">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Contact
                </Button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Contacts</CardTitle>
                  <Users className="h-8 w-8 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{stats.totalContacts}</div>
                  <p className="text-xs text-gray-600 mt-1">
                    All workspace contacts
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Hot Leads</CardTitle>
                  <Star className="h-8 w-8 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{stats.hotLeads}</div>
                  <p className="text-xs text-gray-600 mt-1">
                    Engagement score ≥70%
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Response Rate</CardTitle>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{stats.responseRate}%</div>
                  <p className="text-xs text-gray-600 mt-1">
                    Average across campaigns
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Pipeline Value</CardTitle>
                  <DollarSign className="h-8 w-8 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{stats.pipelineValue}</div>
                  <p className="text-xs text-gray-600 mt-1">
                    Estimated total value
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* View Toggle */}
            <div className="flex items-center justify-end mb-6">
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
            </div>

            {/* Contact Display */}
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p>Loading contacts...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-600 mb-4">Error: {error}</p>
                <Button onClick={refreshData} variant="outline">
                  Try Again
                </Button>
              </div>
            ) : viewMode === "list" ? (
              <ContactsListView />
            ) : (
              <div>
                {/* Search and Filter for Tile View */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search contacts..."
                        className="pl-10 w-80"
                      />
                    </div>
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-2" />
                      Filter
                    </Button>
                  </div>
                </div>
                {contacts.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No contacts yet</h3>
                    <p className="text-gray-600 mb-6">Get started by adding your first contact</p>
                    <Button className="bg-primary hover:bg-primary/90">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Contact
                    </Button>
                  </div>
                ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {contacts.map((contact) => {
                  const fullName = `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Unknown Contact';
                  const status = contact.engagement_score >= 70 ? 'Hot Lead' : contact.engagement_score >= 40 ? 'Warm Lead' : 'Cold Lead';
                  
                  return (
                  <Card key={contact.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback className="bg-blue-100 text-blue-600">
                              {fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg text-gray-900">{fullName}</h3>
                            <p className="text-blue-600 font-medium">{contact.title || 'Unknown Title'}</p>
                            <p className="text-gray-600">{contact.accounts?.name || 'No Company'}</p>
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
                              LinkedIn Message
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

                      <div className="space-y-2 mb-4">
                        <Badge variant={status === "Hot Lead" ? "default" : "secondary"}>
                          {status}
                        </Badge>
                        <p className="text-xs text-gray-500">Added: {new Date(contact.created_at).toLocaleDateString()}</p>
                      </div>

                      <div className="space-y-3 mb-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="h-4 w-4" />
                          <span className="truncate">{contact.email}</span>
                        </div>
                        {contact.phone && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Phone className="h-4 w-4" />
                            <span>{contact.phone}</span>
                          </div>
                        )}
                        {contact.linkedin_url && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Building2 className="h-4 w-4" />
                            <span className="truncate">LinkedIn Profile</span>
                          </div>
                        )}
                      </div>

                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600">Engagement Score</span>
                          <span className="text-sm font-medium">{contact.engagement_score}%</span>
                        </div>
                        <Progress value={contact.engagement_score} className="h-2" />
                      </div>

                      <div className="flex gap-2">
                        <Button size="sm" className="flex-1">
                          <Mail className="h-3 w-3 mr-1" />
                          Email
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1">
                          <MessageSquare className="h-3 w-3 mr-1" />
                          LinkedIn
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                  );
                })}
                </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}