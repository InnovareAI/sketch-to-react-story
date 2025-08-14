import { useState, useEffect } from "react";
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
import { LinkedInConnect } from "@/components/LinkedInConnect";
import { BackgroundSyncManager } from '@/services/BackgroundSyncManager';
import { enhancedLinkedInImport } from '@/services/EnhancedLinkedInImport';
import { toast } from 'sonner';
import { getUserLinkedInAccounts, getUserWorkspaceId } from '@/utils/userDataStorage';
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
  Linkedin
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
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [linkedinImportModalOpen, setLinkedinImportModalOpen] = useState(false);
  const [linkedinImporting, setLinkedinImporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDepartment, setFilterDepartment] = useState<string>("all");
  const [filterEngagement, setFilterEngagement] = useState<string>("all");
  const [filterTags, setFilterTags] = useState<string[]>([]);
  
  // Get dynamic workspace ID (synchronous version for immediate use)
  const getCurrentWorkspaceId = (): string => {
    const authProfile = JSON.parse(localStorage.getItem('user_auth_profile') || '{}');
    if (authProfile.workspace_id) return authProfile.workspace_id;
    
    const bypassUser = JSON.parse(localStorage.getItem('bypass_user') || '{}');
    if (bypassUser.workspace_id) return bypassUser.workspace_id;
    
    // Try to get from user-specific storage (if user is known)
    const { data: { user } } = { data: { user: null } }; // Sync check
    if (user) {
      const workspaceId = localStorage.getItem(`user_${user.id}_workspace_id`);
      if (workspaceId) return workspaceId;
    }
    
    const userEmail = localStorage.getItem('user_email') || 'default';
    const emailHash = userEmail.toLowerCase().replace(/[^a-z0-9]/g, '');
    return `workspace-${emailHash}-${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 8)}`;
  };
  
  const DEFAULT_WORKSPACE_ID = getCurrentWorkspaceId();
  const DEFAULT_ACCOUNT_ID = 'default-account';
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

  const handleLinkedInImport = () => {
    setLinkedinImportModalOpen(true);
  };

  const processLinkedInImport = async () => {
    setLinkedinImporting(true);
    console.log('🔍 DEBUG: Starting LinkedIn Import Process');
    console.log('═'.repeat(60));
    
    try {
      // Enhanced debugging for production
      console.log('📊 Import Configuration:');
      console.log(`   • Workspace ID: ${DEFAULT_WORKSPACE_ID}`);
      console.log(`   • Timestamp: ${new Date().toISOString()}`);
      console.log(`   • User Agent: ${navigator.userAgent}`);
      console.log(`   • Current URL: ${window.location.href}`);
      
      // Check user authentication first
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('❌ User authentication failed:', userError);
        toast.error('Please sign in to import contacts');
        return;
      }
      console.log('✅ User authenticated:', user.email);
      
      // Test basic database connectivity
      console.log('🔄 Testing database connectivity...');
      const { count: existingContactCount } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', DEFAULT_WORKSPACE_ID);
      
      console.log(`✅ Database accessible - existing contacts: ${existingContactCount || 0}`);
      
      toast.info('🚀 Starting Enhanced LinkedIn contact import...');
      console.log('🔄 Initializing enhanced LinkedIn import service...');
      
      // Initialize enhanced LinkedIn import service
      enhancedLinkedInImport.initialize(DEFAULT_WORKSPACE_ID);
      console.log('✅ Enhanced LinkedIn import service initialized');
      
      // Test connections before starting import
      console.log('🔄 Testing LinkedIn integration connections...');
      const connectionTests = await enhancedLinkedInImport.testConnections();
      console.log('📊 Connection test results:', connectionTests);
      
      if (!connectionTests.unipile.connected && !connectionTests.linkedinAPI.connected) {
        console.error('❌ No LinkedIn connections available');
        toast.error('No LinkedIn integrations are available. Please check your configuration.');
        return;
      }
      
      console.log('🚀 Starting enhanced LinkedIn contact import...');
      
      // Use enhanced import with both Unipile and LinkedIn API fallback
      const result = await enhancedLinkedInImport.importContacts({
        limit: 500,
        preferredMethod: 'both', // Try both Unipile and LinkedIn API
        useUnipile: true,
        useLinkedInAPI: true
      });
      
      console.log('📊 Import completed - results:', result);
      
      if (result.success) {
        // Use the enhanced service's built-in result display
        enhancedLinkedInImport.showImportResults(result);
        
        // Additional success logging
        console.log('✅ LinkedIn import successful!');
        console.log(`   • Total contacts: ${result.totalContacts}`);
        console.log(`   • Processing time: ${result.processingTime}ms`);
        console.log(`   • Sources used: ${Object.keys(result.sources).filter(key => result.sources[key] > 0).join(', ')}`);
      } else {
        console.error('❌ Import failed:', result.errors);
        toast.error(`❌ Import failed: ${result.errors.join(', ')}`);
      }

      setLinkedinImportModalOpen(false);
      await refreshData(); // Refresh the contacts list
      
    } catch (error) {
      console.error('❌ LinkedIn import error:', error);
      console.error('🔍 Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
        workspaceId: DEFAULT_WORKSPACE_ID
      });
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Failed to import LinkedIn contacts: ${errorMessage}. Check browser console for detailed error information.`);
    } finally {
      console.log('🏁 LinkedIn import process completed');
      setLinkedinImporting(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      setCsvFile(file);
    }
  };

  // Removed manual sync - now handled automatically by cloud sync

  // Check background sync status on mount
  useEffect(() => {
    const checkSyncStatus = async () => {
      const userProfile = JSON.parse(localStorage.getItem('user_auth_profile') || '{}');
      const workspaceId = userProfile.workspace_id || await getUserWorkspaceId() || DEFAULT_WORKSPACE_ID;
      
      try {
        const syncManager = BackgroundSyncManager.getInstance();
        const status = await syncManager.getSyncStatus(workspaceId);
        setBackgroundSyncEnabled(status?.isEnabled || false);
        
        // Automatically enable cloud sync if not already enabled
        if (!status?.isEnabled) {
          const accounts = await getUserLinkedInAccounts();
          if (accounts.length > 0) {
            const account = accounts[0];
            const accountId = account.unipileAccountId || account.id || account.account_id;
            
            if (accountId) {
              const result = await syncManager.enableBackgroundSync(
                workspaceId,
                accountId,
                30, // Sync every 30 minutes
                'contacts' // Sync contacts
              );
              
              if (result.success) {
                console.log('☁️ Cloud sync enabled for Contacts - will continue syncing when page is closed');
                setBackgroundSyncEnabled(true);
                toast.success('Cloud sync enabled for contacts', { duration: 3000 });
              }
            }
          }
        }
      } catch (error) {
        console.error('Error checking sync status:', error);
        setBackgroundSyncEnabled(false);
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
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];
    
    try {
      const text = await csvFile.text();
      const lines = text.split('\n').filter(line => line.trim()); // Remove empty lines
      
      if (lines.length < 2) {
        throw new Error('CSV file must have at least a header row and one data row');
      }

      // Parse CSV header (handle quoted values properly)
      const headers = parseCSVLine(lines[0]);
      console.log('CSV Headers detected:', headers);
      
      // Get current workspace ID with fallback
      const userProfile = JSON.parse(localStorage.getItem('user_auth_profile') || '{}');
      const workspaceId = userProfile.workspace_id || DEFAULT_WORKSPACE_ID;
      
      if (!workspaceId) {
        throw new Error('No workspace ID available for contact import');
      }

      // Parse CSV and create contacts
      const newContacts = [];
      for (let i = 1; i < lines.length; i++) {
        try {
          const values = parseCSVLine(lines[i]);
          
          // Skip if row is empty or missing required email
          if (values.length < 3 || !values[2]?.trim()) {
            console.warn(`Skipping row ${i + 1}: Missing or invalid email`);
            continue;
          }

          const contact = {
            first_name: values[0]?.trim() || null,
            last_name: values[1]?.trim() || null,
            email: values[2]?.trim(),
            title: values[3]?.trim() || null,
            department: values[4]?.trim() || null,
            phone: values[5]?.trim() || null,
            linkedin_url: values[6]?.trim() || null,
          };

          // Validate email format
          if (contact.email && !validateEmail(contact.email)) {
            errors.push(`Row ${i + 1}: Invalid email format "${contact.email}"`);
            continue;
          }

          newContacts.push(contact);
        } catch (rowError) {
          errors.push(`Row ${i + 1}: ${rowError instanceof Error ? rowError.message : 'Parse error'}`);
          errorCount++;
        }
      }

      if (newContacts.length === 0) {
        throw new Error('No valid contacts found in CSV file');
      }

      toast.info(`Processing ${newContacts.length} contacts...`);

      // Insert contacts into database with batch processing
      const batchSize = 10;
      for (let i = 0; i < newContacts.length; i += batchSize) {
        const batch = newContacts.slice(i, i + batchSize);
        
        for (const contact of batch) {
          try {
            const { data, error } = await supabase
              .from('contacts')
              .insert({
                ...contact,
                workspace_id: workspaceId,
                engagement_score: 50, // Default engagement score
                tags: [], // Default empty tags
                metadata: { 
                  source: 'csv_import',
                  imported_at: new Date().toISOString(),
                  file_name: csvFile.name
                }
              });

            if (error) {
              // Handle specific database errors
              if (error.code === '23505') { // Unique constraint violation
                errors.push(`Contact "${contact.email}" already exists`);
              } else {
                errors.push(`Contact "${contact.email}": ${error.message}`);
              }
              errorCount++;
            } else {
              successCount++;
            }
          } catch (insertError) {
            const errorMsg = insertError instanceof Error ? insertError.message : 'Database error';
            errors.push(`Contact "${contact.email}": ${errorMsg}`);
            errorCount++;
          }
        }
        
        // Add small delay between batches to prevent overwhelming the database
        if (i + batchSize < newContacts.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // Show results
      if (successCount > 0) {
        toast.success(`Successfully imported ${successCount} contacts!`);
      }
      
      if (errorCount > 0) {
        const errorSummary = errors.length > 5 
          ? `${errors.slice(0, 5).join('\n')}\n... and ${errors.length - 5} more errors`
          : errors.join('\n');
        
        toast.error(`${errorCount} contacts failed to import:\n${errorSummary}`);
        console.error('Import errors:', errors);
      }

      setImportModalOpen(false);
      setCsvFile(null);
      
      // Refresh contacts list
      await refreshData();
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown import error';
      console.error('CSV import error:', error);
      toast.error(`Import failed: ${errorMsg}`);
    } finally {
      setImporting(false);
    }
  };

  // Helper function to parse CSV lines with proper quote handling
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    let i = 0;
    
    while (i < line.length) {
      const char = line[i];
      const nextChar = line[i + 1];
      
      if (char === '"' && inQuotes && nextChar === '"') {
        // Handle escaped quotes inside quoted field
        current += '"';
        i += 2;
      } else if (char === '"') {
        // Toggle quote state
        inQuotes = !inQuotes;
        i++;
      } else if (char === ',' && !inQuotes) {
        // End of field
        result.push(current);
        current = '';
        i++;
      } else {
        current += char;
        i++;
      }
    }
    
    // Add the last field
    result.push(current);
    
    return result.map(field => field.trim());
  };

  // Helper function to validate email format
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  return (
    <div className="flex-1 bg-gray-50">
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="p-6 space-y-6">
            {/* Cloud sync status indicator */}
            {backgroundSyncEnabled && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm text-green-700">
                    Cloud sync active - Contacts sync automatically every 30 minutes
                  </span>
                </div>
              </div>
            )}
            
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Contacts</h1>
                <p className="text-gray-600 mt-1">Manage your LinkedIn contacts and prospects</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleExport} disabled={exporting || contacts.length === 0}>
                  <Download className="h-4 w-4 mr-2" />
                  {exporting ? 'Exporting...' : 'Export'}
                </Button>
                <Button variant="outline" onClick={handleLinkedInImport}>
                  <Linkedin className="h-4 w-4 mr-2" />
                  Import from LinkedIn
                </Button>
                <Button variant="outline" onClick={handleImport}>
                  <Upload className="h-4 w-4 mr-2" />
                  Import CSV
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
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Import Contacts from CSV</DialogTitle>
            <DialogDescription>
              Upload a CSV file to import your contacts. Email field is required for all contacts.
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
                <div className="text-sm space-y-1">
                  <p className="text-green-600 font-medium">
                    ✅ Selected: {csvFile.name}
                  </p>
                  <p className="text-gray-600">
                    📄 Size: {(csvFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              )}
            </div>
            
            {/* CSV Format Guide */}
            <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
              <h4 className="font-medium text-sm text-gray-900 mb-2">📋 Expected CSV Format:</h4>
              <div className="text-xs text-gray-600 space-y-1">
                <div className="font-mono bg-white p-2 rounded border text-xs">
                  First Name,Last Name,Email,Title,Department,Phone,LinkedIn URL
                </div>
                <ul className="space-y-0.5 mt-2">
                  <li>• <strong>First Name</strong> - Contact's first name</li>
                  <li>• <strong>Last Name</strong> - Contact's last name</li>
                  <li>• <strong>Email</strong> - <span className="text-red-600">Required</span> - Valid email address</li>
                  <li>• <strong>Title</strong> - Job title or position</li>
                  <li>• <strong>Department</strong> - Department or team</li>
                  <li>• <strong>Phone</strong> - Phone number (optional)</li>
                  <li>• <strong>LinkedIn URL</strong> - LinkedIn profile URL</li>
                </ul>
                <p className="text-xs text-gray-500 mt-2">
                  💡 Fields with commas or quotes should be wrapped in double quotes
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={processImport} 
              disabled={!csvFile || importing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {importing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Import Contacts
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* LinkedIn Import Modal */}
      <Dialog open={linkedinImportModalOpen} onOpenChange={setLinkedinImportModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Linkedin className="h-5 w-5 text-blue-600" />
              Import from LinkedIn
            </DialogTitle>
            <DialogDescription>
              Import your LinkedIn connections and contacts directly using the Unipile API integration.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* LinkedIn Import Info */}
            <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
              <h4 className="font-medium text-blue-900 mb-2">🚀 Enhanced Multi-Source Import:</h4>
              <div className="text-sm text-blue-700 space-y-1">
                <ul className="space-y-1">
                  <li>• <strong>Primary: Unipile API</strong> - LinkedIn chats, messages, and connections</li>
                  <li>• <strong>Fallback: LinkedIn Developer API</strong> - Verified profile data</li>
                  <li>• <strong>Smart Deduplication</strong> - Combines data from multiple sources</li>
                  <li>• <strong>Rich Metadata</strong> - Job titles, companies, network distance</li>
                  <li>• <strong>Quality Scoring</strong> - Engagement scores based on connection level</li>
                </ul>
                <div className="mt-3 p-2 bg-blue-100 rounded text-xs">
                  <strong>📊 Expected Results:</strong> 200-1000+ contacts with 90%+ having job titles and LinkedIn profile URLs. Automatic fallback ensures maximum success rate.
                </div>
              </div>
            </div>

            {/* Import Options */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="import-chats"
                  checked={true}
                  readOnly
                  className="rounded"
                />
                <label htmlFor="import-chats" className="text-sm font-medium">
                  Import from LinkedIn chats and conversations
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="import-messages"
                  checked={true}
                  readOnly
                  className="rounded"
                />
                <label htmlFor="import-messages" className="text-sm font-medium">
                  Import message senders and recipients
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="deduplicate"
                  checked={true}
                  readOnly
                  className="rounded"
                />
                <label htmlFor="deduplicate" className="text-sm font-medium">
                  Automatically deduplicate contacts
                </label>
              </div>
            </div>

            {/* Technical Info */}
            <div className="bg-gray-50 border rounded-lg p-3">
              <h4 className="font-medium text-gray-900 text-sm mb-1">🔧 Technical Details:</h4>
              <div className="text-xs text-gray-600 space-y-1">
                <p>• <strong>Dual-Source Strategy:</strong> Unipile API (primary) + LinkedIn Developer API (fallback)</p>
                <p>• <strong>Smart Import Logic:</strong> Processes up to 500 contacts per session with intelligent deduplication</p>
                <p>• <strong>Rate Limiting:</strong> Respects all LinkedIn API guidelines and Unipile rate limits</p>
                <p>• <strong>Data Security:</strong> All contacts stored securely in your isolated workspace</p>
                <p>• <strong>Progressive Enhancement:</strong> Enriches contacts with data from multiple sources</p>
                <p>• <strong>Retry Logic:</strong> Automatic fallback if primary method fails</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkedinImportModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={processLinkedInImport} 
              disabled={linkedinImporting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {linkedinImporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Importing LinkedIn Contacts...
                </>
              ) : (
                <>
                  <Linkedin className="h-4 w-4 mr-2" />
                  Start LinkedIn Import
                </>
              )}
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