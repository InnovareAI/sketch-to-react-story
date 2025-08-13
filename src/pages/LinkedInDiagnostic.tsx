import { useState } from 'react';
import { unipileRealTimeSync } from '@/services/unipile/UnipileRealTimeSync';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

export default function LinkedInDiagnostic() {
  const [checking, setChecking] = useState(false);
  const [results, setResults] = useState<any>({});

  const runDiagnostics = async () => {
    setChecking(true);
    const diagnostics: any = {};

    // 1. Check API Configuration
    diagnostics.apiConfigured = unipileRealTimeSync.isConfigured();
    diagnostics.apiKey = import.meta.env.VITE_UNIPILE_API_KEY ? 
      `${import.meta.env.VITE_UNIPILE_API_KEY.substring(0, 10)}...` : 'NOT SET';
    diagnostics.dsn = import.meta.env.VITE_UNIPILE_DSN || 'NOT SET';

    // 2. Check Database Connection
    try {
      const { data: workspace, error } = await supabase
        .from('workspaces')
        .select('id')
        .limit(1)
        .single();
      
      diagnostics.databaseConnected = !error;
      diagnostics.workspaceId = workspace?.id || 'No workspace';
    } catch (err) {
      diagnostics.databaseConnected = false;
    }

    // 3. Check Existing Data
    try {
      const { count: convCount } = await supabase
        .from('inbox_conversations')
        .select('*', { count: 'exact', head: true });
      
      const { count: msgCount } = await supabase
        .from('inbox_messages')
        .select('*', { count: 'exact', head: true });
      
      const { count: contactCount } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true });

      diagnostics.dataCount = {
        conversations: convCount || 0,
        messages: msgCount || 0,
        contacts: contactCount || 0
      };
    } catch (err) {
      diagnostics.dataCount = { error: 'Failed to count data' };
    }

    // 4. Test Unipile API Connection (if configured)
    if (diagnostics.apiConfigured) {
      try {
        const testResult = await unipileRealTimeSync.testConnection();
        diagnostics.apiReachable = testResult.success;
        diagnostics.linkedInAccountsFound = testResult.accounts;
        diagnostics.apiError = testResult.error;
        
        console.log('📊 Diagnostic test result:', testResult);
      } catch (err) {
        diagnostics.apiReachable = false;
        diagnostics.apiError = err.message;
      }
    }

    // 5. Check LinkedIn Account Storage
    diagnostics.linkedInAccounts = localStorage.getItem('linkedin_accounts') || 'None stored';
    diagnostics.workspaceSettings = localStorage.getItem('workspace_settings') || 'None stored';

    setResults(diagnostics);
    setChecking(false);
  };

  const attemptSync = async () => {
    setChecking(true);
    try {
      await unipileRealTimeSync.syncAll();
      const status = unipileRealTimeSync.getStatus();
      setResults(prev => ({
        ...prev,
        syncResult: status
      }));
    } catch (error) {
      setResults(prev => ({
        ...prev,
        syncError: error.message
      }));
    }
    setChecking(false);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">LinkedIn Data Diagnostic</h1>
      
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Quick Diagnostics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button onClick={runDiagnostics} disabled={checking}>
                <RefreshCw className={`h-4 w-4 mr-2 ${checking ? 'animate-spin' : ''}`} />
                Run Diagnostics
              </Button>
              <Button onClick={attemptSync} disabled={checking} variant="outline">
                Test Sync
              </Button>
            </div>
          </CardContent>
        </Card>

        {Object.keys(results).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Diagnostic Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* API Configuration */}
                <div className="flex items-center gap-2">
                  {results.apiConfigured ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <span className="font-medium">Unipile API Configured:</span>
                  <span>{results.apiConfigured ? 'Yes' : 'No'}</span>
                </div>

                <div className="pl-7 text-sm text-gray-600">
                  <div>API Key: {results.apiKey}</div>
                  <div>DSN: {results.dsn}</div>
                </div>

                {/* Database */}
                <div className="flex items-center gap-2">
                  {results.databaseConnected ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <span className="font-medium">Database Connected:</span>
                  <span>{results.databaseConnected ? 'Yes' : 'No'}</span>
                </div>

                {/* Data Count */}
                {results.dataCount && (
                  <div className="pl-7 text-sm">
                    <div className="font-medium mb-1">Current Data:</div>
                    <div>Conversations: {results.dataCount.conversations || 0}</div>
                    <div>Messages: {results.dataCount.messages || 0}</div>
                    <div>Contacts: {results.dataCount.contacts || 0}</div>
                  </div>
                )}

                {/* API Connection */}
                {results.apiReachable !== undefined && (
                  <div className="flex items-center gap-2">
                    {results.apiReachable ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <span className="font-medium">API Reachable:</span>
                    <span>{results.apiReachable ? 'Yes' : 'No'}</span>
                  </div>
                )}

                {/* LinkedIn Accounts Found */}
                {results.linkedInAccountsFound && (
                  <div className="pl-7 text-sm">
                    <div className="font-medium mb-1">LinkedIn Accounts Found:</div>
                    {results.linkedInAccountsFound.length > 0 ? (
                      results.linkedInAccountsFound.map((acc, i) => (
                        <div key={i} className="text-green-600">
                          • {acc.name || acc.username || acc.id} ({acc.status})
                        </div>
                      ))
                    ) : (
                      <div className="text-red-600">No LinkedIn accounts found</div>
                    )}
                  </div>
                )}

                {/* API Error */}
                {results.apiError && (
                  <div className="pl-7 text-sm text-red-600">
                    Error: {results.apiError}
                  </div>
                )}

                {/* Sync Result */}
                {results.syncResult && (
                  <div className="mt-4 p-3 bg-blue-50 rounded">
                    <div className="font-medium">Sync Result:</div>
                    <div className="text-sm">
                      Messages Synced: {results.syncResult.messagessynced || 0}<br/>
                      Contacts Synced: {results.syncResult.contactsSynced || 0}<br/>
                      Errors: {results.syncResult.errors?.join(', ') || 'None'}
                    </div>
                  </div>
                )}

                {/* Sync Error */}
                {results.syncError && (
                  <div className="mt-4 p-3 bg-red-50 rounded">
                    <div className="font-medium text-red-700">Sync Error:</div>
                    <div className="text-sm text-red-600">{results.syncError}</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Solution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p className="font-medium">To get real LinkedIn data:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Get your Unipile API key from the <a href="https://www.unipile.com/dashboard" target="_blank" className="text-blue-600 underline">Unipile Dashboard</a></li>
                <li>Update VITE_UNIPILE_API_KEY in your .env.local file (currently: {import.meta.env.VITE_UNIPILE_API_KEY || 'NOT SET'})</li>
                <li>Ensure VITE_UNIPILE_DSN is set correctly (currently: {import.meta.env.VITE_UNIPILE_DSN || 'NOT SET'})</li>
                <li>Your LinkedIn accounts should already be connected in Unipile</li>
                <li>Deploy to Netlify with the correct environment variables</li>
                <li>Click "Sync LinkedIn" in the Inbox</li>
              </ol>
              
              <div className="mt-4 p-3 bg-blue-50 rounded">
                <p className="font-medium text-blue-800">Fixed Issues:</p>
                <ul className="text-blue-700 list-disc list-inside">
                  <li>✅ Updated to use correct /chats endpoint instead of /conversations</li>
                  <li>✅ Fixed authentication to use only X-API-KEY header</li>
                  <li>✅ Updated DSN to api6.unipile.com:13670</li>
                  <li>✅ Added comprehensive error logging</li>
                  <li>✅ Improved account detection for multiple LinkedIn accounts</li>
                </ul>
              </div>
              
              <div className="mt-4 p-3 bg-yellow-50 rounded">
                <p className="font-medium text-yellow-800">Important:</p>
                <p className="text-yellow-700">The API key must be set to pull real data. Without it, the sync will show 0 messages even if accounts are connected in Unipile.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}