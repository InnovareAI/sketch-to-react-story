import { useState, useEffect } from "react";
import { supabase } from '@/integrations/supabase/client';
import { unipileRealTimeSync } from '@/services/unipile/UnipileRealTimeSync';
import { serverLinkedInImport } from '@/services/ServerLinkedInImport';
import { toast } from 'sonner';
import { 
  Search, 
  Filter, 
  Download, 
  Upload, 
  UserPlus, 
  Mail, 
  Phone, 
  Linkedin, 
  Building2,
  RefreshCw,
  MoreVertical,
  CheckCircle,
  XCircle,
  FileUp,
  Tag,
  Trash2,
  Edit3,
  Plus,
  X
} from "lucide-react";

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  title: string;
  department: string;
  linkedin_url: string;
  engagement_score: number;
  tags: string[];
  metadata: any;
  scraped_data: any;
  created_at: string;
  profile_picture_url?: string;
  company?: string;
  full_name?: string;
  last_message?: Array<{
    sent_at?: string;
    replied_at?: string;
    opened_at?: string;
    clicked_at?: string;
  }>;
}

// Profile image component with fallback
function ContactAvatar({ contact }: { contact: Contact }) {
  const [imageError, setImageError] = useState(false);
  
  // Try to get image URL from various sources
  const getImageUrl = () => {
    if (contact.profile_picture_url) return contact.profile_picture_url;
    if (contact.metadata?.profile_picture_url) return contact.metadata.profile_picture_url;
    if (contact.metadata?.avatar_url) return contact.metadata.avatar_url;
    if (contact.metadata?.profile_image_url) return contact.metadata.profile_image_url;
    if (contact.scraped_data?.profile_picture_url) return contact.scraped_data.profile_picture_url;
    if (contact.scraped_data?.profile_image_url) return contact.scraped_data.profile_image_url;
    if (contact.scraped_data?.avatar_url) return contact.scraped_data.avatar_url;
    
    // Generate professional avatar from DiceBear API
    const seed = `${contact.first_name}-${contact.last_name}`.toLowerCase();
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
  };
  
  const imageUrl = getImageUrl();
  const initials = `${contact.first_name[0]}${contact.last_name[0]}`;
  
  if (imageError || !imageUrl) {
    return (
      <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
        {initials}
      </div>
    );
  }
  
  return (
    <img 
      src={imageUrl} 
      alt={`${contact.first_name} ${contact.last_name}`}
      className="h-10 w-10 rounded-full object-cover border-2 border-gray-200"
      onError={() => setImageError(true)}
    />
  );
}

export default function ContactsView() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [filterTag, setFilterTag] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [syncing, setSyncing] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [editingTags, setEditingTags] = useState<string | null>(null);
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    loadContacts();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdown) {
        setOpenDropdown(null);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdown]);

  const loadContacts = async () => {
    try {
      setLoading(true);
      
      // Get workspace ID from localStorage (demo mode)
      const workspaceId = localStorage.getItem('demo_workspace_id') || 
                         localStorage.getItem('workspace_id') ||
                         localStorage.getItem('current_workspace_id') ||
                         'df5d730f-1915-4269-bd5a-9534478b17af'; // Default demo workspace

      // Load contacts with last interaction data
      const { data, error } = await supabase
        .from('contacts')
        .select(`
          *,
          last_message:messages(sent_at, replied_at, opened_at, clicked_at)
        `)
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setContacts(data || []);
      // No console logs for clean UX
      
    } catch (error) {
      console.error('Error loading contacts:', error);
      toast.error('Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    console.log('🔍 DEBUG: Starting LinkedIn Sync Process (ContactsView)');
    console.log('═'.repeat(60));
    
    try {
      // Enhanced debugging for production
      console.log('📊 Sync Configuration:');
      console.log(`   • Timestamp: ${new Date().toISOString()}`);
      console.log(`   • User Agent: ${navigator.userAgent}`);
      console.log(`   • Current URL: ${window.location.href}`);
      
      // Check localStorage authentication (demo mode)
      const isAuthenticated = localStorage.getItem('is_authenticated');
      const userEmail = localStorage.getItem('user_email');
      
      if (!isAuthenticated) {
        console.error('❌ User not authenticated in demo mode');
        toast.error('Please ensure you are logged in to sync contacts');
        return;
      }
      console.log('✅ User authenticated (demo mode):', userEmail || 'demo user');
      
      // Get workspace ID from localStorage
      const workspaceId = localStorage.getItem('demo_workspace_id') || 
                         localStorage.getItem('workspace_id') ||
                         localStorage.getItem('current_workspace_id') ||
                         'df5d730f-1915-4269-bd5a-9534478b17af'; // Default demo workspace
      
      console.log('✅ Using workspace ID:', workspaceId);
      
      // Test basic database connectivity
      console.log('🔄 Testing database connectivity...');
      const { count: existingContactCount } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId);
      
      console.log(`✅ Database accessible - existing contacts: ${existingContactCount || 0}`);
      
      // Try enhanced LinkedIn import first
      console.log('🔄 Attempting Enhanced LinkedIn Import...');
      toast.info('🚀 Starting Enhanced LinkedIn contact sync...');
      
      try {
        // Use the enhanced import service
        const { enhancedLinkedInImport } = await import('@/services/EnhancedLinkedInImport');
        enhancedLinkedInImport.initialize(workspaceId);
        
        // Test connections before starting
        console.log('🔄 Testing LinkedIn integration connections...');
        const connectionTests = await enhancedLinkedInImport.testConnections();
        console.log('📊 Connection test results:', connectionTests);
        
        if (connectionTests.unipile.connected || connectionTests.linkedinAPI.connected) {
          console.log('🚀 Starting enhanced LinkedIn contact import...');
          
          const result = await enhancedLinkedInImport.importContacts({
            limit: 500,
            preferredMethod: 'both',
            useUnipile: true,
            useLinkedInAPI: true
          });
          
          console.log('📊 Enhanced import results:', result);
          
          if (result.success && result.totalContacts > 0) {
            enhancedLinkedInImport.showImportResults(result);
            console.log('✅ Enhanced import successful, refreshing contacts...');
            await loadContacts();
            return;
          } else if (result.success && result.totalContacts === 0) {
            console.log('⚠️ Enhanced import succeeded but no contacts found');
            toast.info('Enhanced sync completed but no new contacts found');
          } else {
            console.log('❌ Enhanced import failed, falling back to legacy sync...');
            toast.warning('Enhanced import had issues, trying legacy sync...');
          }
        } else {
          console.log('⚠️ No enhanced connections available, using legacy sync...');
          toast.info('No enhanced integrations available, using legacy sync...');
        }
      } catch (enhancedError) {
        console.error('❌ Enhanced import failed:', enhancedError);
        console.log('🔄 Falling back to legacy sync method...');
        toast.warning('Enhanced import failed, trying legacy sync...');
      }
      
      // Fallback to legacy sync method
      console.log('🔄 Using legacy unipileRealTimeSync method...');
      
      // Check if API is configured
      if (!unipileRealTimeSync.isConfigured()) {
        console.error('❌ Unipile sync not configured');
        toast.error('LinkedIn sync not configured. Please check settings.');
        setSyncing(false);
        return;
      }
      
      console.log('✅ Unipile sync configured, starting legacy sync...');
      toast.info('Syncing LinkedIn connections via legacy method...');
      
      // Sync all data including contacts
      await unipileRealTimeSync.syncAll();
      const status = unipileRealTimeSync.getStatus();
      console.log('📊 Legacy sync status:', status);
      
      if (status.contactsSynced > 0) {
        toast.success(`Synced ${status.contactsSynced} LinkedIn connections`);
        console.log('✅ Legacy sync successful, refreshing contacts...');
        await loadContacts();
      } else if (status.messagessynced > 0) {
        toast.info(`Synced ${status.messagessynced} messages. Contacts sync pending.`);
      } else {
        toast.info('No new contacts found in LinkedIn');
        console.log('⚠️ No new data found in legacy sync');
      }
      
    } catch (error) {
      console.error('❌ LinkedIn sync error:', error);
      console.error('🔍 Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });
      toast.error(`Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}. Check console for details.`);
    } finally {
      console.log('🏁 LinkedIn sync process completed');
      setSyncing(false);
    }
  };

  const handleServerSync = async () => {
    setSyncing(true);
    console.log('🔍 DEBUG: Starting Server-Side LinkedIn Import');
    console.log('═'.repeat(60));
    
    try {
      // Check localStorage authentication (demo mode)
      const isAuthenticated = localStorage.getItem('is_authenticated');
      const userEmail = localStorage.getItem('user_email');
      
      if (!isAuthenticated) {
        console.error('❌ User not authenticated in demo mode');
        toast.error('Please ensure you are logged in to start server import');
        return;
      }
      
      console.log('✅ User authenticated (demo mode):', userEmail || 'demo user');
      
      // Get workspace ID from localStorage
      const workspaceId = localStorage.getItem('demo_workspace_id') || 
                         localStorage.getItem('workspace_id') ||
                         localStorage.getItem('current_workspace_id') ||
                         'df5d730f-1915-4269-bd5a-9534478b17af'; // Default demo workspace
      
      console.log('✅ Using workspace:', workspaceId);
      
      // Check server availability
      toast.info('🔍 Checking server availability...');
      const availability = await serverLinkedInImport.checkServerAvailability();
      
      if (!availability.available) {
        console.error('❌ Server import not available:', availability.error);
        toast.error(`Server import not available: ${availability.error || 'Unknown error'}`);
        return;
      }
      
      console.log('✅ Server import available');
      
      // Initialize server import
      serverLinkedInImport.initialize(workspaceId);
      
      // Show server import advantages
      const importInfo = serverLinkedInImport.getImportInfo();
      toast.info('🖥️ Starting server-side import - continues even if you close the browser!', {
        duration: 6000
      });
      
      console.log('🚀 Server import advantages:', importInfo.advantages);
      
      // Start server import with progress tracking
      const result = await serverLinkedInImport.startImport({
        limit: 500,
        method: 'both',
        onProgress: (progress) => {
          console.log(`📊 Server import progress: ${progress.status} - ${progress.message}`);
          
          switch (progress.status) {
            case 'starting':
              toast.info(progress.message);
              break;
            case 'running':
              toast.info(`🔄 ${progress.message}${progress.progress ? ` (${progress.progress}%)` : ''}`);
              break;
            case 'completed':
              toast.success(progress.message);
              break;
            case 'failed':
              toast.error(progress.message);
              break;
          }
        }
      });
      
      console.log('📊 Server import final result:', result);
      
      if (result.success) {
        console.log('✅ Server import successful, refreshing contacts...');
        await loadContacts();
      }
      
    } catch (error) {
      console.error('❌ Server sync error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Server import failed: ${errorMessage}. Check console for details.`);
    } finally {
      console.log('🏁 Server import process completed');
      setSyncing(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedContacts.length === filteredContacts.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(filteredContacts.map(c => c.id));
    }
  };

  const handleSelectContact = (id: string) => {
    if (selectedContacts.includes(id)) {
      setSelectedContacts(selectedContacts.filter(cId => cId !== id));
    } else {
      setSelectedContacts([...selectedContacts, id]);
    }
  };

  const handleBulkEmail = () => {
    if (selectedContacts.length === 0) {
      toast.error('No contacts selected');
      return;
    }
    toast.success(`Preparing email for ${selectedContacts.length} contacts`);
  };

  const handleExport = () => {
    const csv = [
      ['First Name', 'Last Name', 'Connection Status', 'Job Title', 'Tags', 'Last Interaction', 'LinkedIn URL'].join(','),
      ...filteredContacts.map(c => [
        c.first_name,
        c.last_name,
        (c.metadata?.connection_degree || c.scraped_data?.connection_degree || '1st') + ' degree',
        c.title || '',
        (c.tags || []).join('; '),
        (() => {
          // Get the most recent interaction from messages
          if (c.last_message && c.last_message.length > 0) {
            const lastMsg = c.last_message[0];
            const interactionDate = lastMsg.replied_at || 
                                  lastMsg.clicked_at || 
                                  lastMsg.opened_at || 
                                  lastMsg.sent_at;
            
            if (interactionDate) {
              return new Date(interactionDate).toLocaleDateString();
            }
          }
          
          // Fallback: Check synced_at from metadata  
          if (c.metadata?.synced_at) {
            return new Date(c.metadata.synced_at).toLocaleDateString();
          }
          
          return 'No interaction';
        })(),
        c.linkedin_url
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contacts_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    
    toast.success(`Exported ${filteredContacts.length} contacts`);
  };

  const handleAddTag = async (contactId: string, tag: string) => {
    if (!tag.trim()) return;
    
    try {
      const contact = contacts.find(c => c.id === contactId);
      if (!contact) return;
      
      const updatedTags = [...(contact.tags || []), tag.trim()];
      
      const { error } = await supabase
        .from('contacts')
        .update({ tags: updatedTags })
        .eq('id', contactId);
      
      if (error) throw error;
      
      // Update local state
      setContacts(contacts.map(c => 
        c.id === contactId ? { ...c, tags: updatedTags } : c
      ));
      
      toast.success(`Added tag "${tag}" to ${contact.first_name} ${contact.last_name}`);
      setNewTag('');
      setEditingTags(null);
    } catch (error) {
      console.error('Error adding tag:', error);
      toast.error('Failed to add tag');
    }
  };

  const handleRemoveTag = async (contactId: string, tagToRemove: string) => {
    try {
      const contact = contacts.find(c => c.id === contactId);
      if (!contact) return;
      
      const updatedTags = (contact.tags || []).filter(tag => tag !== tagToRemove);
      
      const { error } = await supabase
        .from('contacts')
        .update({ tags: updatedTags })
        .eq('id', contactId);
      
      if (error) throw error;
      
      // Update local state
      setContacts(contacts.map(c => 
        c.id === contactId ? { ...c, tags: updatedTags } : c
      ));
      
      toast.success(`Removed tag "${tagToRemove}" from ${contact.first_name} ${contact.last_name}`);
    } catch (error) {
      console.error('Error removing tag:', error);
      toast.error('Failed to remove tag');
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    if (!confirm('Are you sure you want to delete this contact?')) return;
    
    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', contactId);
      
      if (error) throw error;
      
      // Update local state
      setContacts(contacts.filter(c => c.id !== contactId));
      
      toast.success('Contact deleted successfully');
      setOpenDropdown(null);
    } catch (error) {
      console.error('Error deleting contact:', error);
      toast.error('Failed to delete contact');
    }
  };

  const handleImportCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }

    setLoading(true);
    toast.info('Processing CSV file...');
    
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        toast.error('CSV file is empty or has no data rows');
        return;
      }
      
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, '').toLowerCase());
      
      // Get workspace ID from localStorage (demo mode)
      const workspaceId = localStorage.getItem('demo_workspace_id') || 
                         localStorage.getItem('workspace_id') ||
                         localStorage.getItem('current_workspace_id') ||
                         'df5d730f-1915-4269-bd5a-9534478b17af'; // Default demo workspace

      const contactsToImport = [];
      let skippedCount = 0;

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        
        const contact: any = {
          workspace_id: workspaceId,
          first_name: '',
          last_name: '',
          email: '',
          title: '',
          department: '',
          linkedin_url: '',
          engagement_score: 50,
          tags: [],
          metadata: {}
        };

        // Map CSV columns to contact fields
        headers.forEach((header, index) => {
          const value = values[index] || '';
          
          if (header.includes('first') && header.includes('name')) {
            contact.first_name = value;
          } else if (header.includes('last') && header.includes('name')) {
            contact.last_name = value;
          } else if (header.includes('email')) {
            contact.email = value;
          } else if (header.includes('title') || header.includes('position')) {
            contact.title = value;
          } else if (header.includes('company')) {
            contact.metadata.company = value;
          } else if (header.includes('department')) {
            contact.department = value;
          } else if (header.includes('linkedin')) {
            contact.linkedin_url = value;
          } else if (header.includes('phone')) {
            contact.metadata.phone = value;
          }
        });

        // Skip if no identifying information
        if (!contact.email && !contact.first_name && !contact.last_name) {
          skippedCount++;
          continue;
        }

        // Generate email if missing
        if (!contact.email && (contact.first_name || contact.last_name)) {
          const fname = contact.first_name.toLowerCase().replace(/\s+/g, '');
          const lname = contact.last_name.toLowerCase().replace(/\s+/g, '');
          contact.email = `${fname}${fname && lname ? '.' : ''}${lname}@imported.contact`;
        }

        contactsToImport.push(contact);
      }

      if (contactsToImport.length === 0) {
        toast.error('No valid contacts found in CSV');
        return;
      }

      // Import contacts in batches
      const batchSize = 50;
      let importedCount = 0;
      let failedCount = 0;

      for (let i = 0; i < contactsToImport.length; i += batchSize) {
        const batch = contactsToImport.slice(i, i + batchSize);
        
        const { data, error } = await supabase
          .from('contacts')
          .upsert(batch, { 
            onConflict: 'workspace_id,email'
          });

        if (error) {
          console.error('Batch import error:', error);
          failedCount += batch.length;
        } else {
          importedCount += batch.length;
        }
      }

      // Show results
      if (importedCount > 0) {
        toast.success(`Successfully imported ${importedCount} contacts`);
        await loadContacts(); // Refresh the list
      }
      
      if (failedCount > 0) {
        toast.warning(`Failed to import ${failedCount} contacts`);
      }
      
      if (skippedCount > 0) {
        toast.info(`Skipped ${skippedCount} invalid rows`);
      }
      
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to import CSV file: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  // Filter and sort contacts
  const filteredContacts = contacts
    .filter(contact => {
      const matchesSearch = searchTerm === '' || 
        `${contact.first_name} ${contact.last_name} ${contact.email} ${contact.title}`.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesTag = filterTag === 'all' || contact.tags?.includes(filterTag);
      
      return matchesSearch && matchesTag;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`);
        case 'recent':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

  // Get unique tags
  const allTags = [...new Set(contacts.flatMap(c => c.tags || []))];


  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">LinkedIn Contacts</h1>
          <p className="text-gray-600 mt-1">
            {contacts.length} total contacts • {selectedContacts.length} selected
          </p>
        </div>
        <div className="flex gap-3">
          <label className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2 cursor-pointer">
            <Upload className="h-4 w-4" />
            Import CSV
            <input
              type="file"
              accept=".csv"
              onChange={handleImportCSV}
              className="hidden"
            />
          </label>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[300px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search contacts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <select
            value={filterTag}
            onChange={(e) => setFilterTag(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Tags</option>
            {allTags.map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="recent">Most Recent</option>
            <option value="name">Name (A-Z)</option>
          </select>
        </div>
        
        {selectedContacts.length > 0 && (
          <div className="flex gap-3 mt-4 pt-4 border-t">
            <button
              onClick={handleBulkEmail}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
            >
              <Mail className="h-4 w-4" />
              Email Selected ({selectedContacts.length})
            </button>
            <button
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              onClick={() => setSelectedContacts([])}
            >
              Clear Selection
            </button>
          </div>
        )}
      </div>

      {/* Contacts List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading contacts...</p>
        </div>
      ) : filteredContacts.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No contacts found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm ? 'Try adjusting your search criteria' : 'Your LinkedIn contacts will appear here automatically'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedContacts.length === filteredContacts.length && filteredContacts.length > 0}
                    onChange={handleSelectAll}
                    className="rounded"
                  />
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Name</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Job Title</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Tags</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Last Interaction</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredContacts.map((contact, index) => (
                <tr key={contact.id} className={`border-b hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selectedContacts.includes(contact.id)}
                      onChange={() => handleSelectContact(contact.id)}
                      className="rounded"
                    />
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <ContactAvatar contact={contact} />
                      <div className="font-medium text-gray-900">
                        {contact.first_name} {contact.last_name}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {contact.metadata?.connection_degree || contact.scraped_data?.connection_degree || '1st'} degree
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="font-medium text-gray-900">{contact.title || 'No title'}</div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-1">
                      {contact.tags?.slice(0, 2).map(tag => (
                        <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          {tag}
                        </span>
                      ))}
                      {contact.tags?.length > 2 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          +{contact.tags.length - 2}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm text-gray-600">
                      {(() => {
                        // Get the most recent interaction from messages
                        if (contact.last_message && contact.last_message.length > 0) {
                          const lastMsg = contact.last_message[0];
                          const interactionDate = lastMsg.replied_at || 
                                                lastMsg.clicked_at || 
                                                lastMsg.opened_at || 
                                                lastMsg.sent_at;
                          
                          if (interactionDate) {
                            return new Date(interactionDate).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric', 
                              year: 'numeric' 
                            });
                          }
                        }
                        
                        // Fallback: Check synced_at from metadata  
                        if (contact.metadata?.synced_at) {
                          return new Date(contact.metadata.synced_at).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          });
                        }
                        
                        return 'No interaction';
                      })()}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <a
                        href={contact.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        title="View LinkedIn Profile"
                      >
                        <Linkedin className="h-4 w-4" />
                      </a>
                      <button
                        onClick={() => window.location.href = `mailto:${contact.email}`}
                        className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                        title="Send Email"
                      >
                        <Mail className="h-4 w-4" />
                      </button>
                      <div className="relative">
                        <button 
                          className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                          onClick={() => setOpenDropdown(openDropdown === contact.id ? null : contact.id)}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        
                        {openDropdown === contact.id && (
                          <div className="absolute right-0 top-8 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                            <div className="py-1">
                              <button
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                onClick={() => {
                                  setEditingTags(contact.id);
                                  setOpenDropdown(null);
                                }}
                              >
                                <Tag className="h-4 w-4" />
                                Manage Tags
                              </button>
                              <button
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                onClick={() => {
                                  navigator.clipboard.writeText(contact.linkedin_url);
                                  toast.success('LinkedIn URL copied to clipboard');
                                  setOpenDropdown(null);
                                }}
                              >
                                <Edit3 className="h-4 w-4" />
                                Copy LinkedIn URL
                              </button>
                              <hr className="my-1" />
                              <button
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                onClick={() => handleDeleteContact(contact.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete Contact
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tag Management Modal */}
      {editingTags && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Manage Tags - {contacts.find(c => c.id === editingTags)?.first_name} {contacts.find(c => c.id === editingTags)?.last_name}
              </h3>
              <button
                className="text-gray-400 hover:text-gray-600"
                onClick={() => setEditingTags(null)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Current Tags */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Current Tags</label>
              <div className="flex flex-wrap gap-2">
                {(contacts.find(c => c.id === editingTags)?.tags || []).map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded"
                  >
                    {tag}
                    <button
                      className="text-gray-500 hover:text-red-600"
                      onClick={() => handleRemoveTag(editingTags, tag)}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                {(contacts.find(c => c.id === editingTags)?.tags || []).length === 0 && (
                  <span className="text-gray-500 text-sm">No tags yet</span>
                )}
              </div>
            </div>

            {/* Add New Tag */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Add New Tag</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Enter tag name..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddTag(editingTags, newTag);
                    }
                  }}
                />
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-1"
                  onClick={() => handleAddTag(editingTags, newTag)}
                >
                  <Plus className="h-4 w-4" />
                  Add
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                onClick={() => setEditingTags(null)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}