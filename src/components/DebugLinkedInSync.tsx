import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { testUnipileConnection } from '@/utils/testUnipileConnection';
import { contactMessageSync } from '@/services/unipile/ContactMessageSync';

export function DebugLinkedInSync() {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [testing, setTesting] = useState(false);

  const runDebug = async () => {
    setTesting(true);
    const debug: any = {
      localStorage: {},
      apiTest: null,
      syncTest: null
    };

    try {
      // 1. Check localStorage
      debug.localStorage = {
        workspace_id: localStorage.getItem('workspace_id'),
        user_auth_profile: JSON.parse(localStorage.getItem('user_auth_profile') || '{}'),
        linkedin_accounts: JSON.parse(localStorage.getItem('linkedin_accounts') || '[]'),
      };

      console.log('📦 LocalStorage Data:', debug.localStorage);

      // 2. Get account ID
      const linkedInAccounts = debug.localStorage.linkedin_accounts;
      if (linkedInAccounts.length === 0) {
        debug.error = 'No LinkedIn account found in localStorage';
        setDebugInfo(debug);
        setTesting(false);
        return;
      }

      const account = linkedInAccounts[0];
      const accountId = account.unipileAccountId || account.id || account.account_id;
      
      debug.accountInfo = {
        fullAccount: account,
        accountId: accountId,
        possibleIds: {
          unipileAccountId: account.unipileAccountId,
          id: account.id,
          account_id: account.account_id,
          provider_account_id: account.provider_account_id
        }
      };

      console.log('🔑 Account Info:', debug.accountInfo);

      // 3. Test Unipile API
      if (accountId) {
        console.log('🧪 Testing Unipile API with account ID:', accountId);
        debug.apiTest = await testUnipileConnection(accountId);
      } else {
        debug.error = 'No valid account ID found';
      }

      // 4. Try manual sync with detailed logging
      const workspaceId = debug.localStorage.user_auth_profile?.workspace_id || 
                         debug.localStorage.workspace_id;

      if (workspaceId && accountId) {
        console.log('🔄 Attempting manual sync...');
        try {
          debug.syncTest = await contactMessageSync.syncContactsAndMessages(
            accountId,
            workspaceId,
            {
              syncContacts: true,
              syncMessages: false,
              contactLimit: 5, // Small limit for testing
              onlyFirstDegree: false
            }
          );
          console.log('✅ Sync Test Result:', debug.syncTest);
        } catch (syncError: any) {
          debug.syncError = syncError.message;
          console.error('❌ Sync Error:', syncError);
        }
      }

    } catch (error: any) {
      debug.error = error.message;
      console.error('Debug error:', error);
    }

    setDebugInfo(debug);
    setTesting(false);
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>🔍 LinkedIn Sync Debugger</CardTitle>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={runDebug} 
          disabled={testing}
          className="mb-4"
        >
          {testing ? 'Testing...' : 'Run Debug Test'}
        </Button>

        {debugInfo && (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">1. LocalStorage Check:</h3>
              <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-40">
                {JSON.stringify(debugInfo.localStorage, null, 2)}
              </pre>
            </div>

            {debugInfo.accountInfo && (
              <div>
                <h3 className="font-semibold mb-2">2. Account ID Detection:</h3>
                <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-40">
                  {JSON.stringify(debugInfo.accountInfo, null, 2)}
                </pre>
              </div>
            )}

            {debugInfo.apiTest && (
              <div>
                <h3 className="font-semibold mb-2">3. API Test Results:</h3>
                <div className="space-y-2">
                  <p className="text-sm">
                    ✅ Successful: {[debugInfo.apiTest.accountInfo, debugInfo.apiTest.connections, debugInfo.apiTest.chats].filter(Boolean).length}
                  </p>
                  <p className="text-sm">
                    ❌ Failed: {debugInfo.apiTest.errors?.length || 0}
                  </p>
                  {debugInfo.apiTest.errors?.length > 0 && (
                    <div className="bg-red-50 p-2 rounded">
                      {debugInfo.apiTest.errors.map((err: string, i: number) => (
                        <p key={i} className="text-xs text-red-600">{err}</p>
                      ))}
                    </div>
                  )}
                  {debugInfo.apiTest.connections && (
                    <div className="bg-green-50 p-2 rounded">
                      <p className="text-xs text-green-600">
                        Connections found: {debugInfo.apiTest.connections?.connections?.length || debugInfo.apiTest.connections?.items?.length || 0}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {debugInfo.syncTest && (
              <div>
                <h3 className="font-semibold mb-2">4. Sync Test Results:</h3>
                <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-40">
                  {JSON.stringify(debugInfo.syncTest, null, 2)}
                </pre>
              </div>
            )}

            {debugInfo.error && (
              <div className="bg-red-50 p-3 rounded">
                <p className="text-sm text-red-600 font-semibold">Error:</p>
                <p className="text-xs text-red-600">{debugInfo.error}</p>
              </div>
            )}
          </div>
        )}

        <div className="mt-4 p-3 bg-blue-50 rounded">
          <p className="text-xs text-blue-800">
            💡 This debugger tests the LinkedIn sync connection. Check the browser console for detailed logs.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}