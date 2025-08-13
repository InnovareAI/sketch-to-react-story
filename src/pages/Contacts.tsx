import { useState } from "react";
import { useRealContacts, Contact } from "@/hooks/useRealContacts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from '@/integrations/supabase/client';
import { ContactsListView } from "@/components/contacts/ContactsListView";
import { DebugLinkedInSync } from "@/components/DebugLinkedInSync";
import { contactMessageSync } from '@/services/unipile/ContactMessageSync';
import { backgroundSyncManager } from '@/services/BackgroundSyncManager';
import { testUnipileConnection } from '@/utils/testUnipileConnection';
import { toast } from 'sonner';
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
  List,
  RefreshCw,
  Linkedin
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Make test functions available globally
if (typeof window !== 'undefined') {
  import('@/utils/testUnipileConnection').then(module => {
    (window as any).testUnipileConnection = module.testUnipileConnection;
    console.log('🧪 LinkedIn Sync Test Available: window.testUnipileConnection(accountId)');
  });
  
  import('@/utils/testContactSync').then(module => {
    (window as any).testContactSync = module.testContactSync;
    console.log('🧪 Contact Sync Test Available: window.testContactSync()');
  });
}

export default function Contacts() {
  const [viewMode, setViewMode] = useState<"list" | "tile">("list");
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDepartment, setFilterDepartment] = useState<string>("all");
  const [filterEngagement, setFilterEngagement] = useState<string>("all");
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [backgroundSyncEnabled, setBackgroundSyncEnabled] = useState(false);
  const { contacts, stats, loading, error, refreshData, createContact, updateContact, deleteContact } = useRealContacts();

  // Filter contacts based on search and filters
  const filteredContacts = contacts.filter(contact => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        contact.first_name?.toLowerCase().includes(query) ||
        contact.last_name?.toLowerCase().includes(query) ||
        contact.email?.toLowerCase().includes(query) ||
        contact.title?.toLowerCase().includes(query) ||
        contact.company?.toLowerCase().includes(query) ||
        contact.department?.toLowerCase().includes(query) ||
        contact.phone?.toLowerCase().includes(query);
      
      if (!matchesSearch) return false;
    }
    
    // Department filter
    if (filterDepartment !== "all" && contact.department !== filterDepartment) {
      return false;
    }
    
    // Engagement score filter
    if (filterEngagement !== "all") {
      const score = contact.engagement_score || 0;
      if (filterEngagement === "high" && score < 70) return false;
      if (filterEngagement === "medium" && (score < 40 || score >= 70)) return false;
      if (filterEngagement === "low" && score >= 40) return false;
    }
    
    // Tags filter
    if (filterTags.length > 0) {
      const contactTags = contact.tags || [];
      const hasMatchingTag = filterTags.some(tag => contactTags.includes(tag));
      if (!hasMatchingTag) return false;
    }
    
    return true;
  });

  // Get unique departments for filter
  const uniqueDepartments = Array.from(new Set(
    contacts.map(c => c.department).filter(Boolean)
  )).sort();

  // Get unique tags for filter
  const uniqueTags = Array.from(new Set(
    contacts.flatMap(c => c.tags || [])
  )).sort();

  const handleEditContact = (contact: Contact) => {
    setEditingContact({ ...contact });
  };

  const handleSaveContact = async () => {
    if (!editingContact) return;
    
    try {
      await updateContact(editingContact.id, {
        first_name: editingContact.first_name,
        last_name: editingContact.last_name,
        email: editingContact.email,
        title: editingContact.title,
        phone: editingContact.phone,
        linkedin_url: editingContact.linkedin_url,
        department: editingContact.department,
      });
      setEditingContact(null);
      refreshData();
    } catch (error) {
      console.error('Error updating contact:', error);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      // Create CSV content
      const csvHeaders = ['First Name', 'Last Name', 'Email', 'Title', 'Department', 'Phone', 'LinkedIn URL'];
      const csvRows = contacts.map(contact => [
        contact.first_name || '',
        contact.last_name || '',
        contact.email || '',
        contact.title || '',
        contact.department || '',
        contact.phone || '',
        contact.linkedin_url || ''
      ]);
      
      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.map(field => `"${field}"`).join(','))
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `contacts_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting contacts:', error);
    } finally {
      setExporting(false);
    }
  };

  const handleImport = () => {
    setImportModalOpen(true);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      setCsvFile(file);
    }
  };

  const handleLinkedInSync = async () => {
    setIsSyncing(true);
    try {
      // Get workspace ID
      const userProfile = JSON.parse(localStorage.getItem('user_auth_profile') || '{}');
      const workspaceId = userProfile.workspace_id || localStorage.getItem('workspace_id');
      
      if (!workspaceId) {
        toast.error('No workspace found. Please ensure you are logged in.');
        return;
      }

      // Get LinkedIn account
      const linkedInAccounts = JSON.parse(localStorage.getItem('linkedin_accounts') || '[]');
      if (linkedInAccounts.length === 0) {
        toast.error('No LinkedIn account connected. Please connect your LinkedIn account in Settings.');
        return;
      }

      const account = linkedInAccounts[0];
      const accountId = account.unipileAccountId || account.id;

      // Debug: Test the connection first
      console.log('Testing Unipile connection with account:', account);
      const testResult = await testUnipileConnection(accountId);
      
      if (testResult.errors.length > 0) {
        console.error('Unipile API test failed:', testResult);
        toast.error('LinkedIn API connection issue. Check console for details.');
        return;
      }

      toast.info('Starting LinkedIn contacts sync...');
      
      // Check if background sync is enabled
      const syncStatus = await backgroundSyncManager.getSyncStatus(workspaceId);
      
      if (!syncStatus?.isEnabled) {
        // Enable background sync for continuous syncing
        const enableResult = await backgroundSyncManager.enableBackgroundSync(
          workspaceId,
          accountId,
          30, // Sync every 30 minutes
          'both' // Sync both contacts and messages
        );
        
        if (enableResult.success) {
          setBackgroundSyncEnabled(true);
          toast.success('Background sync enabled! Your contacts will sync automatically every 30 minutes, even when you leave this page.');
        }
      } else {
        // Trigger immediate sync
        const syncResult = await backgroundSyncManager.triggerImmediateSync(
          workspaceId,
          accountId,
          'contacts'
        );
        
        if (syncResult.success && syncResult.data) {
          const { contactsSynced, errors } = syncResult.data;
          if (errors && errors.length > 0) {
            toast.warning(`Synced ${contactsSynced} contacts with ${errors.length} errors`);
          } else {
            toast.success(`Successfully synced ${contactsSynced} LinkedIn contacts`);
          }
        }
      }

      // Refresh the contacts list
      await refreshData();
    } catch (error) {
      console.error('LinkedIn sync error:', error);
      toast.error('Failed to sync LinkedIn contacts');
    } finally {
      setIsSyncing(false);
    }
  };

  // Check background sync status on mount
  useEffect(() => {
    const checkSyncStatus = async () => {
      const userProfile = JSON.parse(localStorage.getItem('user_auth_profile') || '{}');
      const workspaceId = userProfile.workspace_id || localStorage.getItem('workspace_id');
      
      if (workspaceId) {
        const status = await backgroundSyncManager.getSyncStatus(workspaceId);
        setBackgroundSyncEnabled(status?.isEnabled || false);
      }
    };
    
    checkSyncStatus();
    
    // Listen for sync status updates
    const handleSyncStatusUpdate = (event: CustomEvent) => {
      const status = event.detail;
      setBackgroundSyncEnabled(status.isEnabled);
      
      // Show notification if sync just completed
      if (status.recentSyncs && status.recentSyncs.length > 0) {
        const latestSync = status.recentSyncs[0];
        if (new Date(latestSync.synced_at).getTime() > Date.now() - 60000) {
          toast.info(`Background sync completed: ${latestSync.contacts_synced} contacts, ${latestSync.messages_synced} messages`);
          refreshData();
        }
      }
    };
    
    window.addEventListener('linkedin-sync-status', handleSyncStatusUpdate as EventListener);
    
    return () => {
      window.removeEventListener('linkedin-sync-status', handleSyncStatusUpdate as EventListener);
    };
  }, [refreshData]);

  const processImport = async () => {
    if (!csvFile) return;
    
    setImporting(true);
    try {
      const text = await csvFile.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
      
      // Parse CSV and create contacts
      const newContacts = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
        if (values.length >= 3 && values[2]) { // Must have email
          const contact = {
            first_name: values[0] || null,
            last_name: values[1] || null,
            email: values[2],
            title: values[3] || null,
            department: values[4] || null,
            phone: values[5] || null,
            linkedin_url: values[6] || null,
          };
          newContacts.push(contact);
        }
      }

      // Get current workspace ID
      const userProfile = JSON.parse(localStorage.getItem('user_auth_profile') || '{}');
      const workspaceId = userProfile.workspace_id;

      if (!workspaceId) {
        throw new Error('No workspace found');
      }

      // Insert contacts into database
      for (const contact of newContacts) {
        try {
          await supabase
            .from('contacts')
            .insert({
              ...contact,
              workspace_id: workspaceId,
            });
        } catch (error) {
          console.error('Error inserting contact:', error);
          // Continue with other contacts even if one fails
        }
      }

      setImportModalOpen(false);
      setCsvFile(null);
      refreshData();
    } catch (error) {
      console.error('Error importing contacts:', error);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="flex-1 bg-gray-50">
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="p-6 space-y-6">
            {/* Debug Component - Remove this after testing */}
            <DebugLinkedInSync />
            
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Contacts</h1>
                <p className="text-gray-600 mt-1">Manage your LinkedIn contacts and prospects</p>
              </div>
              <div className="flex gap-2">
                {/* Debug Button - Temporary */}
                <Button 
                  variant="destructive" 
                  onClick={async () => {
                    console.log('🔍 DEBUG: Starting comprehensive contact sync test...');
                    toast.info('Running contact sync test. Check console for details.');
                    
                    if ((window as any).testContactSync) {
                      const results = await (window as any).testContactSync();
                      
                      if (results.errors.length === 0 && results.contactsFetched > 0) {
                        toast.success(`Test passed! ${results.contactsFetched} contacts available.`);
                      } else if (results.errors.length > 0) {
                        toast.error(`Test failed with ${results.errors.length} errors. Check console.`);
                      } else {
                        toast.warning('Test completed. Check console for details.');
                      }
                    } else {
                      console.error('Test function not loaded yet. Try again in a moment.');
                      toast.error('Test not ready. Please try again.');
                    }
                  }}
                  title="Run comprehensive contact sync test"
                >
                  🧪 Test Sync
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleLinkedInSync} 
                  disabled={isSyncing}
                  className={backgroundSyncEnabled ? "bg-green-50 hover:bg-green-100 border-green-200" : "bg-blue-50 hover:bg-blue-100 border-blue-200"}
                >
                  {isSyncing ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Syncing...
                    </>
                  ) : backgroundSyncEnabled ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Sync Now (Auto-sync ON)
                    </>
                  ) : (
                    <>
                      <Linkedin className="h-4 w-4 mr-2" />
                      Enable Auto-Sync
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={handleExport} disabled={exporting || contacts.length === 0}>
                  <Download className="h-4 w-4 mr-2" />
                  {exporting ? 'Exporting...' : 'Export'}
                </Button>
                <Button variant="outline" onClick={handleImport}>
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </Button>
                <Button className="bg-primary hover:bg-primary/90">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Contact
                </Button>
              </div>
            </div>

            {/* Search and Filters */}
            <Card className="p-4">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Search Bar */}
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search contacts by name, email, title, company..."
                      className="pl-10 pr-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2"
                        onClick={() => setSearchQuery('')}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                
                {/* Department Filter */}
                <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {uniqueDepartments.map(dept => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {/* Engagement Filter */}
                <Select value={filterEngagement} onValueChange={setFilterEngagement}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Engagement" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Engagement</SelectItem>
                    <SelectItem value="high">High (70%+)</SelectItem>
                    <SelectItem value="medium">Medium (40-69%)</SelectItem>
                    <SelectItem value="low">Low (&lt;40%)</SelectItem>
                  </SelectContent>
                </Select>
                
                {/* Clear Filters */}
                {(searchQuery || filterDepartment !== 'all' || filterEngagement !== 'all') && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery('');
                      setFilterDepartment('all');
                      setFilterEngagement('all');
                      setFilterTags([]);
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
              
              {/* Active Filters Display */}
              <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                <Filter className="h-4 w-4" />
                <span>
                  Showing {filteredContacts.length} of {contacts.length} contacts
                </span>
                {searchQuery && (
                  <Badge variant="secondary">
                    Search: "{searchQuery}"
                  </Badge>
                )}
                {filterDepartment !== 'all' && (
                  <Badge variant="secondary">
                    Dept: {filterDepartment}
                  </Badge>
                )}
                {filterEngagement !== 'all' && (
                  <Badge variant="secondary">
                    Engagement: {filterEngagement}
                  </Badge>
                )}
              </div>
            </Card>

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

      {/* Import CSV Modal */}
      <Dialog open={importModalOpen} onOpenChange={setImportModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Import Contacts</DialogTitle>
            <DialogDescription>
              Upload a CSV file to import your contacts. The file should have columns: First Name, Last Name, Email, Title, Department, Phone, LinkedIn URL.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="csv-file">CSV File</Label>
              <Input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
              />
              {csvFile && (
                <p className="text-sm text-green-600">
                  Selected: {csvFile.name}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={processImport} disabled={!csvFile || importing}>
              {importing ? 'Importing...' : 'Import Contacts'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Contact Modal */}
      {editingContact && (
        <Dialog open={!!editingContact} onOpenChange={() => setEditingContact(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Contact</DialogTitle>
              <DialogDescription>
                Update the contact information below.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="first-name">First Name</Label>
                  <Input
                    id="first-name"
                    value={editingContact.first_name || ''}
                    onChange={(e) => setEditingContact({ ...editingContact, first_name: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="last-name">Last Name</Label>
                  <Input
                    id="last-name"
                    value={editingContact.last_name || ''}
                    onChange={(e) => setEditingContact({ ...editingContact, last_name: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={editingContact.email}
                  onChange={(e) => setEditingContact({ ...editingContact, email: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="title">Job Title</Label>
                <Input
                  id="title"
                  value={editingContact.title || ''}
                  onChange={(e) => setEditingContact({ ...editingContact, title: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={editingContact.department || ''}
                  onChange={(e) => setEditingContact({ ...editingContact, department: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={editingContact.phone || ''}
                  onChange={(e) => setEditingContact({ ...editingContact, phone: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="linkedin">LinkedIn URL</Label>
                <Input
                  id="linkedin"
                  value={editingContact.linkedin_url || ''}
                  onChange={(e) => setEditingContact({ ...editingContact, linkedin_url: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingContact(null)}>
                Cancel
              </Button>
              <Button onClick={handleSaveContact}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}