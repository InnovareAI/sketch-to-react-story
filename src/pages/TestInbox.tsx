import { useState, useEffect } from "react";
import { supabase } from '@/integrations/supabase/client';
import { unipileRealTimeSync } from '@/services/unipile/UnipileRealTimeSync';

export default function TestInbox() {
  const [log, setLog] = useState<string[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDebug, setShowDebug] = useState(false); // Hide debug by default for cleaner UI
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [nextSync, setNextSync] = useState<Date | null>(null);
  const [contactCount, setContactCount] = useState<number>(0);

  const addLog = (msg: string) => {
    console.log(msg);
    setLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const loadMessages = async () => {
    setLoading(true);
    addLog('Loading messages...');
    
    try {
      // First try simple query
      const { data: simpleData, error: simpleError } = await supabase
        .from('inbox_conversations')
        .select('*')
        .order('last_message_at', { ascending: false });
      
      if (simpleError) {
        addLog(`❌ Simple query error: ${simpleError.message}`);
      } else {
        addLog(`✅ Simple query found ${simpleData?.length || 0} conversations`);
      }
      
      // Then try with join
      const { data, error } = await supabase
        .from('inbox_conversations')
        .select(`
          *,
          inbox_messages (*)
        `)
        .order('last_message_at', { ascending: false });
        
      if (error) {
        addLog(`❌ Error: ${JSON.stringify(error)}`);
        setMessages([]);
      } else {
        addLog(`✅ Found ${data?.length || 0} conversations`);
        setMessages(data || []);
      }
    } catch (err: any) {
      addLog(`❌ Exception: ${err.message}`);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const syncMessage = async () => {
    setLoading(true);
    addLog('Starting LinkedIn inbox sync...');
    
    try {
      // Check if API is configured
      if (!unipileRealTimeSync.isConfigured()) {
        addLog('❌ Unipile API not configured. Please configure API key in Netlify.');
        setLoading(false);
        return;
      }
      
      addLog('🔄 Connecting to Unipile API...');
      
      // Perform comprehensive sync
      await unipileRealTimeSync.syncAll();
      
      const status = unipileRealTimeSync.getStatus();
      
      if (status.messagessynced > 0) {
        addLog(`✅ Synced ${status.messagessynced} conversations`);
        
        // Update sync times on success
        const now = new Date();
        setLastSync(now);
        setNextSync(new Date(now.getTime() + 1800000)); // 30 minutes from now
        
        await loadMessages();
      } else {
        addLog('📭 No new messages found in LinkedIn inbox');
      }
      
      if (status.errors.length > 0) {
        status.errors.forEach(error => addLog(`⚠️ ${error}`));
      }
    } catch (err: any) {
      addLog(`❌ Sync error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const syncContacts = async () => {
    setLoading(true);
    addLog('Starting LinkedIn contacts sync...');
    
    try {
      // Use UnipileRealTimeSync for contacts
      if (!unipileRealTimeSync.isConfigured()) {
        addLog('❌ Unipile API not configured. Please configure API key in Netlify.');
        setLoading(false);
        return;
      }
      
      addLog('🔄 Fetching LinkedIn contacts from Unipile...');
      
      // Sync all data including contacts
      await unipileRealTimeSync.syncAll();
      const status = unipileRealTimeSync.getStatus();
      
      if (status.contactsSynced > 0) {
        addLog(`✅ Synced ${status.contactsSynced} LinkedIn contacts`);
        // Update contact count
        await loadContactCount();
      } else {
        addLog('📭 No new contacts found');
      }
    } catch (error: any) {
      addLog(`❌ Contact sync error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadContactCount = async () => {
    try {
      // Get workspace
      const { data: workspace } = await supabase
        .from('workspaces')
        .select('id')
        .limit(1)
        .single();
      
      if (!workspace) return;
      
      // Get contact count
      const { count } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', workspace.id);
      
      setContactCount(count || 0);
    } catch (error) {
      console.error('Error getting contact count:', error);
    }
  };

  // Auto-load messages on mount and set up auto-sync
  useEffect(() => {
    loadMessages();
    loadContactCount();
    
    // Auto-sync every 30 minutes only if API is configured
    const interval = setInterval(() => {
      if (unipileRealTimeSync.isConfigured()) {
        addLog('⏰ Auto-sync triggered (every 30 minutes)');
        syncMessage();
      }
    }, 1800000); // 30 minutes
    
    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Global Inbox</h1>
        <div className="text-sm text-gray-600">
          {lastSync && (
            <span>Last sync: {lastSync.toLocaleTimeString()} | </span>
          )}
          {nextSync && (
            <span>Next auto-sync: {nextSync.toLocaleTimeString()}</span>
          )}
        </div>
      </div>
      
      <div className="flex gap-4 mb-6">
        <button 
          onClick={loadMessages}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          Load Messages
        </button>
        <button 
          onClick={syncMessage}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 flex items-center"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Syncing...
            </>
          ) : (
            'Sync LinkedIn Inbox'
          )}
        </button>
        <button 
          onClick={syncContacts}
          disabled={loading}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 flex items-center"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Syncing...
            </>
          ) : (
            `Sync Contacts (${contactCount})`
          )}
        </button>
        <button 
          onClick={() => setShowDebug(!showDebug)}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          {showDebug ? 'Hide Debug' : 'Show Debug'}
        </button>
      </div>

      <div className={showDebug ? "grid grid-cols-1 lg:grid-cols-2 gap-6" : ""}>
        <div>
          <h2 className="text-xl font-semibold mb-4">Messages ({messages.length})</h2>
          <div className="space-y-3">
            {messages.length === 0 ? (
              <p className="text-gray-500">No messages found. Click "Load Messages" to fetch.</p>
            ) : (
              messages.map(conv => (
                <div key={conv.id} className="border rounded-lg p-4 bg-white shadow">
                  <div className="font-semibold">{conv.participant_name}</div>
                  <div className="text-sm text-gray-600">{conv.participant_company || 'No company'}</div>
                  <div className="text-sm text-gray-500 mt-1">
                    Messages: {conv.inbox_messages?.length || 0}
                  </div>
                  {conv.inbox_messages?.[0] && (
                    <div className="text-sm mt-2 italic text-gray-700">
                      "{conv.inbox_messages[0].content}"
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {showDebug && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Log</h2>
            <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm h-96 overflow-y-auto">
            {log.length === 0 ? (
              <p>No logs yet. Click a button to start.</p>
            ) : (
              log.map((line, i) => (
                <div key={i} className={line.includes('❌') ? 'text-red-400' : line.includes('✅') ? 'text-green-400' : ''}>
                  {line}
                </div>
              ))
            )}
            </div>
          </div>
        )}
      </div>

      {showDebug && (
        <div className="mt-6 p-4 bg-gray-100 rounded">
          <h3 className="font-semibold mb-2">Debug Info:</h3>
          <p>Supabase URL: {import.meta.env.VITE_SUPABASE_URL}</p>
          <p>Table: inbox_conversations</p>
          <p>Loading: {loading ? 'Yes' : 'No'}</p>
        </div>
      )}
    </div>
  );
}