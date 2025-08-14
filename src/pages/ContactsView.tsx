import { useState, useEffect } from "react";
import { supabase } from '@/integrations/supabase/client';
import { unipileRealTimeSync } from '@/services/unipile/UnipileRealTimeSync';
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
  TrendingUp,
  RefreshCw,
  MoreVertical,
  CheckCircle,
  XCircle
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
}

export default function ContactsView() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [filterTag, setFilterTag] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      setLoading(true);
      
      // Get workspace
      const { data: workspace } = await supabase
        .from('workspaces')
        .select('id')
        .limit(1)
        .single();
      
      if (!workspace) {
        toast.error('No workspace found');
        return;
      }

      // Load contacts
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('workspace_id', workspace.id)
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
      
      // Check user authentication first
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('❌ User authentication failed:', userError);
        toast.error('Please sign in to sync LinkedIn contacts');
        return;
      }
      console.log('✅ User authenticated:', user.email);
      
      // Get or find workspace ID
      let { data: workspace, error: wsError } = await supabase
        .from('workspaces')
        .select('id')
        .eq('owner_id', user.id)
        .single();
        
      if (wsError || !workspace) {
        console.log('⚠️ No workspace found for user, using default');
        workspace = { id: 'a0000000-0000-0000-0000-000000000000' }; // Default workspace
      }
      
      console.log('✅ Workspace ID:', workspace.id);
      
      // Test basic database connectivity
      console.log('🔄 Testing database connectivity...');
      const { count: existingContactCount } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', workspace.id);
      
      console.log(`✅ Database accessible - existing contacts: ${existingContactCount || 0}`);
      
      // Try enhanced LinkedIn import first
      console.log('🔄 Attempting Enhanced LinkedIn Import...');
      toast.info('🚀 Starting Enhanced LinkedIn contact sync...');
      
      try {
        // Use the enhanced import service
        const { enhancedLinkedInImport } = await import('@/services/EnhancedLinkedInImport');
        enhancedLinkedInImport.initialize(workspace.id);
        
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
      ['First Name', 'Last Name', 'Email', 'Title', 'Company', 'Engagement Score', 'LinkedIn URL'].join(','),
      ...filteredContacts.map(c => [
        c.first_name,
        c.last_name,
        c.email,
        c.title,
        c.metadata?.company || '',
        c.engagement_score,
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
        case 'engagement':
          return b.engagement_score - a.engagement_score;
        case 'recent':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

  // Get unique tags
  const allTags = [...new Set(contacts.flatMap(c => c.tags || []))];

  const getEngagementColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-gray-600 bg-gray-50';
  };

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
          <button
            onClick={handleSync}
            disabled={syncing}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            Sync LinkedIn
          </button>
          <button
            onClick={async () => {
              console.log('🔄 Starting detailed sync test...');
              setSyncing(true);
              try {
                // Test the sync with detailed logging
                const testScript = document.createElement('script');
                testScript.src = '/test-unipile-sync-now.js';
                document.body.appendChild(testScript);
                testScript.onload = async () => {
                  if (window.testUnipileContactSync) {
                    await window.testUnipileContactSync();
                    await loadContacts(); // Reload contacts after sync
                  }
                };
              } catch (error) {
                console.error('Test failed:', error);
              } finally {
                setSyncing(false);
              }
            }}
            disabled={syncing}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            Test Sync (Console)
          </button>
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
            <option value="engagement">Engagement Score</option>
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
            {searchTerm ? 'Try adjusting your search criteria' : 'Click "Sync LinkedIn" to import contacts'}
          </p>
          {!searchTerm && (
            <button
              onClick={handleSync}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Sync LinkedIn Contacts
            </button>
          )}
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
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Contact</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Title & Company</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Engagement</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Tags</th>
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
                      <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {contact.first_name[0]}{contact.last_name[0]}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {contact.first_name} {contact.last_name}
                        </div>
                        <div className="text-sm text-gray-600">{contact.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div>
                      <div className="font-medium text-gray-900">{contact.title}</div>
                      <div className="text-sm text-gray-600 flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {contact.metadata?.company || contact.department}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium ${getEngagementColor(contact.engagement_score)}`}>
                      <TrendingUp className="h-3 w-3" />
                      {contact.engagement_score}%
                    </div>
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
                      <button className="p-1 text-gray-600 hover:bg-gray-100 rounded">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}