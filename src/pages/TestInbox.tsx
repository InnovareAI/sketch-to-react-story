import { useState } from "react";
import { supabase } from '@/integrations/supabase/client';

export default function TestInbox() {
  const [log, setLog] = useState<string[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const addLog = (msg: string) => {
    console.log(msg);
    setLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const loadMessages = async () => {
    setLoading(true);
    addLog('Loading messages...');
    
    try {
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
    addLog('Adding test message...');
    
    try {
      const testId = 'test_' + Date.now();
      
      // Create conversation
      const { data: conv, error: convError } = await supabase
        .from('inbox_conversations')
        .insert({
          workspace_id: 'a0000000-0000-0000-0000-000000000000',
          platform: 'linkedin',
          platform_conversation_id: testId,
          participant_name: 'Test User ' + new Date().toLocaleTimeString(),
          participant_company: 'Test Company',
          status: 'active'
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
        .insert({
          conversation_id: conv.id,
          role: 'assistant',
          content: 'Test message created at ' + new Date().toLocaleString()
        });
        
      if (msgError) {
        addLog(`❌ Message error: ${JSON.stringify(msgError)}`);
      } else {
        addLog('✅ Message created successfully');
        await loadMessages();
      }
    } catch (err: any) {
      addLog(`❌ Exception: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">LinkedIn Inbox Test Page</h1>
      
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
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          Add Test Message
        </button>
        <button 
          onClick={() => setLog([])}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Clear Log
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
      </div>

      <div className="mt-6 p-4 bg-gray-100 rounded">
        <h3 className="font-semibold mb-2">Debug Info:</h3>
        <p>Supabase URL: {import.meta.env.VITE_SUPABASE_URL}</p>
        <p>Table: inbox_conversations</p>
        <p>Loading: {loading ? 'Yes' : 'No'}</p>
      </div>
    </div>
  );
}