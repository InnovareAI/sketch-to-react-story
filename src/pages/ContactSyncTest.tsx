import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ContactSyncTest() {
  const [results, setResults] = useState<any>(null);
  const [testing, setTesting] = useState(false);

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
          // Test API
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

            if (response.ok) {
              const data = await response.json();
              testResults.apiData = data;
              const contacts = data.connections || data.items || data.data || [];
              testResults.contactCount = contacts.length;
              testResults.sampleContacts = contacts.slice(0, 3);
            } else {
              testResults.apiError = await response.text();
            }
          } catch (error: any) {
            testResults.apiException = error.message;
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
                  <h3 className="font-semibold">API Test:</h3>
                  <p className={results.apiOk ? 'text-green-600' : 'text-red-600'}>
                    Status: {results.apiStatus} {results.apiOk ? '✅' : '❌'}
                  </p>
                  {results.contactCount !== undefined && (
                    <p>Contacts Found: {results.contactCount}</p>
                  )}
                  {results.apiError && (
                    <div className="mt-2 p-2 bg-red-50 text-red-600 text-sm rounded">
                      Error: {results.apiError}
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}