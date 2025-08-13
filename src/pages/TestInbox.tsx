import { useState, useEffect } from "react";
import { supabase } from '@/integrations/supabase/client';
import InboxTest from '@/components/InboxTest';

export default function TestInbox() {
  const [log, setLog] = useState<string[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDebug, setShowDebug] = useState(true); // Show debug by default to see what's happening
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [nextSync, setNextSync] = useState<Date | null>(null);

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
    addLog('Starting sync...');
    
    try {
      // Generate unique IDs for each message
      const timestamp = Date.now();
      const randomNum = Math.floor(Math.random() * 1000);
      
      // Sample LinkedIn messages to sync
      const sampleMessages = [
        {
          name: 'Emma Wilson',
          company: 'TechStart Inc',
          message: 'Hi! I noticed your work in AI development. Would love to connect and discuss potential collaborations.'
        },
        {
          name: 'James Chen',
          company: 'Innovation Labs',
          message: 'Thanks for accepting my connection! Our team is looking for solutions like yours.'
        },
        {
          name: 'Sofia Rodriguez',
          company: 'Digital Ventures',
          message: 'Great presentation at the conference! Let\'s schedule a follow-up call to explore synergies.'
        }
      ];
      
      // Pick a random message
      const sample = sampleMessages[Math.floor(Math.random() * sampleMessages.length)];
      const conversationId = `linkedin_${timestamp}_${randomNum}`;
      
      // Create conversation
      const { data: conv, error: convError } = await supabase
        .from('inbox_conversations')
        .upsert({
          workspace_id: 'a0000000-0000-0000-0000-000000000000',
          platform: 'linkedin',
          platform_conversation_id: conversationId,
          participant_name: sample.name,
          participant_company: sample.company,
          participant_avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${sample.name}`,
          status: 'active',
          last_message_at: new Date().toISOString()
        })
        .select()
        .single();
        
      if (convError) {
        addLog(`❌ Conversation error: ${JSON.stringify(convError)}`);
        setLoading(false);
        return;
      }
      
      addLog(`✅ Created conversation: ${conv.id}`);
      
      // Create message
      const { error: msgError } = await supabase
        .from('inbox_messages')
        .upsert({
          conversation_id: conv.id,
          platform_message_id: `msg_${conversationId}`,
          role: 'assistant',
          content: sample.message,
          metadata: {
            sender_name: sample.name,
            sender_company: sample.company,
            type: 'inbound'
          }
        });
        
      if (msgError) {
        addLog(`❌ Message error: ${JSON.stringify(msgError)}`);
      } else {
        addLog(`✅ Synced message from ${sample.name}`);
        
        // Update sync times on success
        const now = new Date();
        setLastSync(now);
        setNextSync(new Date(now.getTime() + 1800000)); // 30 minutes from now
        
        await loadMessages();
      }
    } catch (err: any) {
      addLog(`❌ Exception: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Auto-load messages on mount and set up auto-sync
  useEffect(() => {
    loadMessages();
    
    // Auto-sync every 30 minutes (1800000 ms)
    const interval = setInterval(() => {
      addLog('⏰ Auto-sync triggered (every 30 minutes)');
      syncMessage();
    }, 1800000); // 30 minutes
    
    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Add test component at the top */}
      <InboxTest />
      
      <div className="flex justify-between items-center mb-6 mt-6">
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