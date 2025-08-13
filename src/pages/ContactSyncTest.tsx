import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { unipileProxy } from '@/services/unipile/UnipileProxy';

export default function ContactSyncTest() {
  const [results, setResults] = useState<any>(null);
  const [testing, setTesting] = useState(false);

  const testAlternativeEndpointsViaProxy = async (accountId: string) => {
    const endpoints = [
      { name: 'Connections', path: `/users/${accountId}/connections?limit=5` },
      { name: 'Chats', path: `/users/${accountId}/chats?limit=5&provider=LINKEDIN` },
      { name: 'User Info', path: `/users/${accountId}` },
    ];
    
    const results: any[] = [];
    
    for (const endpoint of endpoints) {
      try {
        const response = await unipileProxy.request(endpoint.path);
        results.push({
          endpoint: endpoint.name,
          status: response.status,
          ok: response.ok
        });
      } catch (error: any) {
        results.push({
          endpoint: endpoint.name,
          status: 0,
          error: error.message
        });
      }
    }
    
    return results;
  };

  const testAlternativeEndpoints = async (accountId: string) => {
    const endpoints = [
      { name: 'Connections', url: `/users/${accountId}/connections?limit=5` },
      { name: 'Chats', url: `/users/${accountId}/chats?limit=5&provider=LINKEDIN` },
      { name: 'User Info', url: `/users/${accountId}` },
      { name: 'Accounts List', url: `/accounts` },
    ];
    
    const results: any[] = [];
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(
          `https://api6.unipile.com:13443/api/v1${endpoint.url}`,
          {
            headers: {
              'Authorization': 'Bearer TE3VJJ3-N3E63ND-MWXM462-RBPCWYQ',
              'Accept': 'application/json'
            }
          }
        );
        
        results.push({
          endpoint: endpoint.name,
          status: response.status,
          ok: response.ok
        });
      } catch (error: any) {
        results.push({
          endpoint: endpoint.name,
          status: 0,
          error: error.message
        });
      }
    }
    
    return results;
  };

  const runTest = async () => {
    setTesting(true);
    const testResults: any = {};

    try {
      // Check LinkedIn account
      const accounts = JSON.parse(localStorage.getItem('linkedin_accounts') || '[]');
      testResults.accountFound = accounts.length > 0;
      
      if (accounts.length > 0) {
        const account = accounts[0];
        testResults.account = {
          name: account.name,
          email: account.email,
          ids: {
            unipileAccountId: account.unipileAccountId,
            id: account.id,
            account_id: account.account_id
          }
        };

        // Get the account ID
        const accountId = account.unipileAccountId || account.id || account.account_id;
        testResults.accountId = accountId;

        if (accountId) {
          // Test API using proxy
          try {
            console.log('Testing via Supabase proxy...');
            const response = await unipileProxy.getConnections(accountId, 5);
            
            testResults.apiStatus = response.status;
            testResults.apiOk = response.ok;
            testResults.usingProxy = true;
            console.log('Proxy Response:', response);

            if (response.ok) {
              const data = response.data;
              testResults.apiData = data;
              const contacts = data.connections || data.items || data.data || [];
              testResults.contactCount = contacts.length;
              testResults.sampleContacts = contacts.slice(0, 3);
            } else {
              testResults.apiError = JSON.stringify(response.data, null, 2);
              
              // Test alternative endpoints via proxy
              console.log('Testing alternative endpoints via proxy...');
              testResults.alternativeEndpoints = await testAlternativeEndpointsViaProxy(accountId);
            }
          } catch (error: any) {
            console.error('Proxy request failed, trying direct...', error);
            
            // Fallback to direct request
            try {
              const response = await fetch(
                `https://api6.unipile.com:13443/api/v1/users/${accountId}/connections?limit=5`,
                {
                  headers: {
                    'Authorization': 'Bearer TE3VJJ3-N3E63ND-MWXM462-RBPCWYQ',
                    'Accept': 'application/json'
                  }
                }
              );

              testResults.apiStatus = response.status;
              testResults.apiOk = response.ok;
              testResults.usingProxy = false;
              
              if (response.ok) {
                const data = await response.json();
                testResults.apiData = data;
                const contacts = data.connections || data.items || data.data || [];
                testResults.contactCount = contacts.length;
                testResults.sampleContacts = contacts.slice(0, 3);
              } else {
                testResults.apiError = await response.text();
              }
            } catch (directError: any) {
              testResults.apiStatus = 0;
              testResults.apiException = directError.message;
              testResults.proxyError = error.message;
            }
          }
        }
      }
    } catch (error: any) {
      testResults.error = error.message;
    }

    setResults(testResults);
    setTesting(false);

    // Log to console
    console.log('Contact Sync Test Results:', testResults);
  };

  return (
    <div className="p-8">
      <Card>
        <CardHeader>
          <CardTitle>Contact Sync Test</CardTitle>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={runTest} 
            disabled={testing}
            className="mb-4"
          >
            {testing ? 'Testing...' : 'Run Contact Sync Test'}
          </Button>

          {results && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">LinkedIn Account:</h3>
                <p className={results.accountFound ? 'text-green-600' : 'text-red-600'}>
                  {results.accountFound ? '✅ Found' : '❌ Not Found'}
                </p>
                {results.account && (
                  <div className="ml-4 text-sm">
                    <p>Name: {results.account.name}</p>
                    <p>Email: {results.account.email}</p>
                    <p>Account ID: {results.accountId}</p>
                  </div>
                )}
              </div>

              {results.accountId && (
                <div>
                  <h3 className="font-semibold">API Test {results.usingProxy ? '(via Proxy)' : '(Direct)'}:</h3>
                  <p className={results.apiOk ? 'text-green-600' : 'text-red-600'}>
                    Status: {results.apiStatus || 'No response'} {results.apiOk ? '✅' : '❌'}
                  </p>
                  {results.apiStatus && (
                    <div className="text-sm text-gray-600 mt-1">
                      {results.apiStatus === 401 && '401 Unauthorized - API key may be invalid'}
                      {results.apiStatus === 403 && '403 Forbidden - Access denied to this account'}
                      {results.apiStatus === 404 && '404 Not Found - Account ID may be incorrect or API endpoint changed'}
                      {results.apiStatus === 500 && '500 Server Error - Unipile API is having issues'}
                      {results.apiStatus === 0 && 'Network error - Could not reach API'}
                    </div>
                  )}
                  {results.contactCount !== undefined && (
                    <p>Contacts Found: {results.contactCount}</p>
                  )}
                  {results.apiError && (
                    <div className="mt-2 p-2 bg-red-50 text-red-600 text-sm rounded">
                      <strong>Error Details:</strong>
                      <pre className="mt-1 text-xs overflow-auto">{results.apiError}</pre>
                    </div>
                  )}
                  {results.apiException && (
                    <div className="mt-2 p-2 bg-red-50 text-red-600 text-sm rounded">
                      <strong>Exception:</strong> {results.apiException}
                      {results.proxyError && (
                        <div className="mt-1">
                          <strong>Proxy Error:</strong> {results.proxyError}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {results.sampleContacts && results.sampleContacts.length > 0 && (
                <div>
                  <h3 className="font-semibold">Sample Contacts:</h3>
                  <ul className="list-disc ml-5">
                    {results.sampleContacts.map((contact: any, i: number) => (
                      <li key={i}>{contact.name || 'Unknown'} - {contact.company || 'No company'}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {results.alternativeEndpoints && (
                <div>
                  <h3 className="font-semibold">Alternative Endpoints Test:</h3>
                  <div className="text-sm space-y-1">
                    {results.alternativeEndpoints.map((test: any, i: number) => (
                      <div key={i} className={test.ok ? 'text-green-600' : 'text-red-600'}>
                        {test.endpoint}: {test.status} {test.ok ? '✅' : '❌'}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}