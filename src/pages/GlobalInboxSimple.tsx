import { useState, useEffect } from "react";
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, MessageSquare } from "lucide-react";

export default function GlobalInboxSimple() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Loading messages...');
      
      // Simple direct query - no workspace check
      const { data, error: queryError } = await supabase
        .from('inbox_conversations')
        .select(`
          *,
          inbox_messages (*)
        `)
        .order('last_message_at', { ascending: false });

      if (queryError) {
        console.error('Query error:', queryError);
        setError(queryError.message);
        setMessages([]);
      } else {
        console.log(`Found ${data?.length || 0} conversations`);
        setMessages(data || []);
      }
    } catch (err) {
      console.error('Load error:', err);
      setError(err.message);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const syncMessages = async () => {
    try {
      setLoading(true);
      toast.info('Syncing LinkedIn messages...');
      
      // Get dynamic workspace ID
      const getCurrentWorkspaceId = (): string => {
        const authProfile = JSON.parse(localStorage.getItem('user_auth_profile') || '{}');
        if (authProfile.workspace_id) return authProfile.workspace_id;
        
        const bypassUser = JSON.parse(localStorage.getItem('bypass_user') || '{}');
        if (bypassUser.workspace_id) return bypassUser.workspace_id;
        
        const workspaceId = localStorage.getItem('workspace_id');
        if (workspaceId) return workspaceId;
        
        const userEmail = localStorage.getItem('user_email') || 'default';
        const emailHash = userEmail.toLowerCase().replace(/[^a-z0-9]/g, '');
        return `workspace-${emailHash}-${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 8)}`;
      };
      
      // Simple sync - just add one test message
      const { error: syncError } = await supabase
        .from('inbox_conversations')
        .upsert({
          workspace_id: getCurrentWorkspaceId(),
          platform: 'linkedin',
          platform_conversation_id: 'test_sync_' + Date.now(),
          participant_name: 'Sync Test User',
          participant_company: 'Sync Test Company',
          participant_avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=SyncTest',
          status: 'active'
        });
        
      if (syncError) {
        console.error('Sync error:', syncError);
        toast.error('Sync failed: ' + syncError.message);
      } else {
        toast.success('Sync completed!');
        await loadMessages();
      }
    } catch (err) {
      console.error('Sync error:', err);
      toast.error('Sync failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Global Inbox (Simple)</h1>
          <Button onClick={syncMessages} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Sync Messages
          </Button>
        </div>

        {error && (
          <Card className="mb-4 border-red-500">
            <CardContent className="p-4">
              <p className="text-red-500">Error: {error}</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Messages ({messages.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Loading...</p>
            ) : messages.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No messages yet</p>
                <p className="text-sm text-gray-400 mt-2">Click "Sync Messages" to add test data</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((conv) => (
                  <div key={conv.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{conv.participant_name}</h3>
                        <p className="text-sm text-gray-600">{conv.participant_company}</p>
                        <p className="text-sm text-gray-500 mt-2">
                          {conv.inbox_messages?.length || 0} messages
                        </p>
                        {conv.inbox_messages?.[0] && (
                          <p className="text-sm mt-2">{conv.inbox_messages[0].content}</p>
                        )}
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(conv.last_message_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-4 text-sm text-gray-500">
          <p>Debug Info:</p>
          <p>- Messages loaded: {messages.length}</p>
          <p>- Loading: {loading ? 'Yes' : 'No'}</p>
          <p>- Error: {error || 'None'}</p>
        </div>
      </div>
    </div>
  );
}