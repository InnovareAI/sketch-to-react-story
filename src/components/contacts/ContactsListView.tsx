// Contacts List View Component
// Manage LinkedIn contacts with filtering, search, and campaign assignment

import React, { useState, useEffect } from 'react';
import { useRealContacts, Contact } from '@/hooks/useRealContacts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search,
  Filter,
  Download,
  Target,
  Plus,
  Eye,
  MoreHorizontal,
  Calendar,
  Building2,
  User,
  Mail,
  MessageSquare,
  ExternalLink,
  FileText,
  Trash2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';

interface ContactsListViewProps {
  className?: string;
}

export function ContactsListView({ className }: ContactsListViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedTags, setSelectedTags] = useState<string>('all');
  const [selectedCampaign, setSelectedCampaign] = useState<string>('all');
  const [selectedOpenInMail, setSelectedOpenInMail] = useState<string>('all');
  const [selectedEmail, setSelectedEmail] = useState<string>('all');
  const [selectAll, setSelectAll] = useState(false);

  // Use real contacts from database
  const { contacts: realContacts, loading, error, refreshData } = useRealContacts();
  
  // Add selection state to contacts
  const [contactsWithSelection, setContactsWithSelection] = useState<(Contact & { selected?: boolean })[]>([]);

  // Update contacts with selection when real contacts change
  useEffect(() => {
    setContactsWithSelection(realContacts.map(contact => ({ ...contact, selected: false })));
  }, [realContacts]);

  const totalContacts = realContacts.length;
  
  // Helper functions to map database fields to display format
  const getContactName = (contact: Contact) => {
    return `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Unknown';
  };
  
  const getContactStatus = (contact: Contact) => {
    if (contact.engagement_score >= 70) return 'New Contact';
    return 'Contact';
  };

  const filteredContacts = contactsWithSelection.filter(contact => {
    const fullName = getContactName(contact);
    const matchesSearch = searchTerm === '' || 
      fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const contactStatus = getContactStatus(contact);
    const matchesStatus = selectedStatus === 'all' || contactStatus === selectedStatus;
    
    // For now, assume all contacts have email/InMail available since we're syncing from LinkedIn
    const matchesOpenInMail = selectedOpenInMail === 'all' || selectedOpenInMail === 'available';
    const matchesEmail = selectedEmail === 'all' || (contact.email ? selectedEmail === 'available' : selectedEmail === 'unavailable');

    return matchesSearch && matchesStatus && matchesOpenInMail && matchesEmail;
  });

  const selectedCount = contactsWithSelection.filter(c => c.selected).length;

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    setContactsWithSelection(contactsWithSelection.map(c => ({ ...c, selected: checked })));
  };

  const handleSelectContact = (id: string, checked: boolean) => {
    setContactsWithSelection(contactsWithSelection.map(c => 
      c.id === id ? { ...c, selected: checked } : c
    ));
  };

  const handleAssignToCampaign = () => {
    if (selectedCount === 0) {
      toast.error('No contacts selected');
      return;
    }
    toast.success(`Assigned ${selectedCount} contacts to campaign`);
  };

  const handleExport = () => {
    toast.success(`Exported ${filteredContacts.length} contacts`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New Contact': return 'bg-blue-100 text-blue-800';
      case 'Contact': return 'bg-green-100 text-green-800';
      case 'Withdrawn manually': return 'bg-red-100 text-red-800';
      case 'Connection request pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900">My contacts</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4 mr-2" />
            Jump into page...
          </Button>
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add new
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <CardTitle className="text-lg">Filter</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Type to search</Label>
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-8"
              />
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Status:</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Contact">Contact</SelectItem>
                  <SelectItem value="New Contact">New Contact</SelectItem>
                  <SelectItem value="Withdrawn manually">Withdrawn manually</SelectItem>
                  <SelectItem value="Connection request pending">Connection request pending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Tags</Label>
              <Select value={selectedTags} onValueChange={setSelectedTags}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tags</SelectItem>
                  <SelectItem value="high-priority">High Priority</SelectItem>
                  <SelectItem value="investor">Investor</SelectItem>
                  <SelectItem value="founder">Founder</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Campaign */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Campaign</Label>
              <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Campaigns</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Open InMail availability */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Open InMail availability</Label>
              <Select value={selectedOpenInMail} onValueChange={setSelectedOpenInMail}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="unavailable">Unavailable</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Email availability */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Email availability</Label>
              <Select value={selectedEmail} onValueChange={setSelectedEmail}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="unavailable">Unavailable</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>Selected: {selectedCount}</span>
          <span>Filtered: {filteredContacts.length}</span>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            onClick={handleAssignToCampaign}
            disabled={selectedCount === 0}
            size="sm"
          >
            <Target className="h-4 w-4 mr-2" />
            Assign selected to campaign
          </Button>
          <Button variant="outline" onClick={handleExport} size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreHorizontal className="h-4 w-4 mr-2" />
                More
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <FileText className="h-4 w-4 mr-2" />
                Export as PDF
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Mail className="h-4 w-4 mr-2" />
                Send Bulk Email
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Selected
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Contacts Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p>Loading contacts...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <p className="text-red-600 mb-4">Error: {error}</p>
                <Button onClick={refreshData} variant="outline" size="sm">
                  Try Again
                </Button>
              </div>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <User className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No contacts found</h3>
                <p className="text-gray-600 mb-6">
                  {realContacts.length === 0 
                    ? "Get started by syncing your LinkedIn contacts" 
                    : "Try adjusting your filters"}
                </p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={selectAll}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Engagement</TableHead>
                  <TableHead>Synced</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContacts.map((contact) => {
                  const fullName = getContactName(contact);
                  const contactStatus = getContactStatus(contact);
                  
                  return (
                    <TableRow key={contact.id} className="hover:bg-gray-50">
                      <TableCell>
                        <Checkbox
                          checked={contact.selected || false}
                          onCheckedChange={(checked) => handleSelectContact(contact.id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                            <User className="h-4 w-4 text-gray-500" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{fullName}</div>
                            <div className="flex items-center gap-2 mt-1">
                              {contact.email && (
                                <Badge variant="outline" className="text-xs">
                                  <Mail className="h-3 w-3 mr-1" />
                                  Email
                                </Badge>
                              )}
                              {contact.linkedin_url && (
                                <Badge variant="outline" className="text-xs">
                                  <MessageSquare className="h-3 w-3 mr-1" />
                                  LinkedIn
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(contactStatus)} variant="secondary">
                          {contactStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-md">
                          <div className="text-sm text-gray-900 truncate">{contact.title || 'Unknown'}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-600">{contact.accounts?.name || '-'}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-600">{contact.engagement_score || 0}%</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-500">
                          {contact.created_at ? new Date(contact.created_at).toLocaleDateString() : '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              View Profile
                            </DropdownMenuItem>
                            {contact.linkedin_url && (
                              <DropdownMenuItem onClick={() => window.open(contact.linkedin_url!, '_blank')}>
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Open LinkedIn
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Send Message
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Target className="h-4 w-4 mr-2" />
                              Add to Campaign
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}