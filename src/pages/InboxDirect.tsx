import { useState, useEffect } from "react";
import { supabase } from '@/integrations/supabase/client';

export default function InboxDirect() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const loadMessages = async () => {
    console.log('Starting to load messages...');
    setLoading(true);
    setError('');
    
    try {
      // Direct query - no workspace filtering
      const { data, error: queryError } = await supabase
        .from('inbox_conversations')
        .select('*')
        .order('last_message_at', { ascending: false });

      console.log('Query result:', { data, error: queryError });

      if (queryError) {
        setError(`Query error: ${queryError.message}`);
        console.error('Query error:', queryError);
      } else {
        setMessages(data || []);
        console.log(`Loaded ${data?.length || 0} conversations`);
      }
    } catch (err: any) {
      setError(`Exception: ${err.message}`);
      console.error('Exception:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Direct Inbox Query</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <p className="mb-4">Found {messages.length} conversations</p>
          
          {messages.length === 0 ? (
            <p className="text-gray-500">No messages found</p>
          ) : (
            <div className="space-y-2">
              {messages.map(msg => (
                <div key={msg.id} className="border p-3 rounded">
                  <div className="font-semibold">{msg.participant_name}</div>
                  <div className="text-sm text-gray-600">{msg.participant_company}</div>
                  <div className="text-xs text-gray-400">ID: {msg.id}</div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
      
      <button 
        onClick={loadMessages}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
      >
        Reload
      </button>
    </div>
  );
}