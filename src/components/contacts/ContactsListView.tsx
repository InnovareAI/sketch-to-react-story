// Contacts List View Component
// Manage LinkedIn contacts with filtering, search, and campaign assignment

import React, { useState, useEffect } from 'react';
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

interface Contact {
  id: string;
  name: string;
  status: 'Contact' | 'New Contact' | 'Withdrawn manually' | 'Connection request pending';
  occupation: string;
  company?: string;
  tags?: string[];
  connectionSince?: string;
  email?: string;
  phone?: string;
  linkedin_url?: string;
  openInMailAvailable?: boolean;
  emailAvailable?: boolean;
  profileImage?: string;
  selected?: boolean;
}

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

  // Mock data - in real app this would come from API
  const [contacts, setContacts] = useState<Contact[]>([
    {
      id: '1',
      name: 'Aimee Thomson',
      status: 'New Contact',
      occupation: 'Deputy General Counsel, Pennsylvania Office of General Counsel',
      connectionSince: '11 Aug, 2025 at 10:45 PM',
      linkedin_url: 'https://linkedin.com/in/aimee-thomson',
      emailAvailable: true,
      openInMailAvailable: true,
      selected: false
    },
    {
      id: '2',
      name: 'Nathan Truitt',
      status: 'Contact',
      occupation: 'Executive Vice President of Climate Funding at The American Forest Foundation',
      connectionSince: '04 Jan, 2022 at 11:48 PM',
      linkedin_url: 'https://linkedin.com/in/nathan-truitt',
      emailAvailable: false,
      openInMailAvailable: true,
      selected: false
    },
    {
      id: '3',
      name: 'Lucy Jodlowska',
      status: 'New Contact',
      occupation: 'Senior Director, US Programs',
      linkedin_url: 'https://linkedin.com/in/lucy-jodlowska',
      emailAvailable: true,
      openInMailAvailable: false,
      selected: false
    },
    {
      id: '4',
      name: 'Shawn Lesser',
      status: 'Contact',
      occupation: 'Co Founder & Managing Partner at Big Path Capital',
      linkedin_url: 'https://linkedin.com/in/shawn-lesser',
      emailAvailable: false,
      openInMailAvailable: true,
      selected: false
    },
    {
      id: '5',
      name: 'David Cooper',
      status: 'New Contact',
      occupation: 'Regenerative Harvest Fund - Co-Founder and Lead of Fund Development at Mission Driven Finance',
      linkedin_url: 'https://linkedin.com/in/david-cooper',
      emailAvailable: true,
      openInMailAvailable: true,
      selected: false
    },
    {
      id: '6',
      name: 'Michelle Buckles',
      status: 'Contact',
      occupation: 'VP, Investor Relations @ Intl Farming | MBA',
      linkedin_url: 'https://linkedin.com/in/michelle-buckles',
      emailAvailable: false,
      openInMailAvailable: false,
      selected: false
    },
    {
      id: '7',
      name: 'John Fullerton',
      status: 'Contact',
      occupation: 'Founder and President',
      linkedin_url: 'https://linkedin.com/in/john-fullerton',
      emailAvailable: true,
      openInMailAvailable: true,
      selected: false
    },
    {
      id: '8',
      name: 'Wendy Millet',
      status: 'Contact',
      occupation: 'Director',
      linkedin_url: 'https://linkedin.com/in/wendy-millet',
      emailAvailable: false,
      openInMailAvailable: true,
      selected: false
    },
    {
      id: '9',
      name: 'Aimee Christensen',
      status: 'Contact',
      occupation: 'Founder & CEO at Christensen Global',
      linkedin_url: 'https://linkedin.com/in/aimee-christensen',
      emailAvailable: true,
      openInMailAvailable: true,
      selected: false
    },
    {
      id: '10',
      name: 'William Sarni',
      status: 'Contact',
      occupation: 'Founder and General Partner at Colorado River Basin Fund',
      linkedin_url: 'https://linkedin.com/in/william-sarni',
      emailAvailable: false,
      openInMailAvailable: true,
      selected: false
    },
    {
      id: '11',
      name: 'Louisa Schibli',
      status: 'Contact',
      occupation: 'Director of Impact & Engagement',
      connectionSince: '26 Jan, 2022 at 11:52 PM',
      linkedin_url: 'https://linkedin.com/in/louisa-schibli',
      emailAvailable: true,
      openInMailAvailable: false,
      selected: false
    },
    {
      id: '12',
      name: 'Brian Collins',
      status: 'Contact',
      occupation: 'Strategic Partnerships at Thematic',
      linkedin_url: 'https://linkedin.com/in/brian-collins',
      emailAvailable: false,
      openInMailAvailable: true,
      selected: false
    },
    {
      id: '13',
      name: 'Matt Boitano',
      status: 'Contact',
      occupation: 'Director of Foundation Engagement at UC Davis',
      connectionSince: '27 Apr, 2022 at 03:32 PM',
      linkedin_url: 'https://linkedin.com/in/matt-boitano',
      emailAvailable: true,
      openInMailAvailable: true,
      selected: false
    },
    {
      id: '14',
      name: 'Jahed Momand',
      status: 'New Contact',
      occupation: 'Investor and Advisor',
      linkedin_url: 'https://linkedin.com/in/jahed-momand',
      emailAvailable: false,
      openInMailAvailable: true,
      selected: false
    },
    {
      id: '15',
      name: 'Holly Lichtenfeld',
      status: 'Contact',
      occupation: 'CMO & Sustainability Advisor (Fractional)',
      connectionSince: '03 Oct, 2023 at 05:08 PM',
      linkedin_url: 'https://linkedin.com/in/holly-lichtenfeld',
      emailAvailable: true,
      openInMailAvailable: false,
      selected: false
    }
  ]);

  const totalContacts = 25429; // Mock total from your data
  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = searchTerm === '' || 
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.occupation.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || contact.status === selectedStatus;
    const matchesOpenInMail = selectedOpenInMail === 'all' || 
      (selectedOpenInMail === 'available' && contact.openInMailAvailable) ||
      (selectedOpenInMail === 'unavailable' && !contact.openInMailAvailable);
    const matchesEmail = selectedEmail === 'all' || 
      (selectedEmail === 'available' && contact.emailAvailable) ||
      (selectedEmail === 'unavailable' && !contact.emailAvailable);

    return matchesSearch && matchesStatus && matchesOpenInMail && matchesEmail;
  });

  const selectedCount = contacts.filter(c => c.selected).length;

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    setContacts(contacts.map(c => ({ ...c, selected: checked })));
  };

  const handleSelectContact = (id: string, checked: boolean) => {
    setContacts(contacts.map(c => 
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
                <TableHead>Occupation</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Connection since</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContacts.map((contact) => (
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
                        <div className="font-medium text-gray-900">{contact.name}</div>
                        <div className="flex items-center gap-2 mt-1">
                          {contact.emailAvailable && (
                            <Badge variant="outline" className="text-xs">
                              <Mail className="h-3 w-3 mr-1" />
                              Email
                            </Badge>
                          )}
                          {contact.openInMailAvailable && (
                            <Badge variant="outline" className="text-xs">
                              <MessageSquare className="h-3 w-3 mr-1" />
                              InMail
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(contact.status)} variant="secondary">
                      {contact.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-md">
                      <div className="text-sm text-gray-900 truncate">{contact.occupation}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-500">-</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-500">
                      {contact.connectionSince || '-'}
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
                        <DropdownMenuItem>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Open LinkedIn
                        </DropdownMenuItem>
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
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}