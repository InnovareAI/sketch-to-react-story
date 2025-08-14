import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { unipileRealTimeSync } from '@/services/unipile/UnipileRealTimeSync';
import { getUserLinkedInAccounts, setUserLinkedInAccounts } from '@/utils/userDataStorage';

export default function LinkedInAccountSetup() {
  const [syncing, setSyncing] = useState(false);

  const setupAccount = async () => {
    // Store a LinkedIn account in localStorage to bypass detection issues
    const account = {
      id: 'manual-linkedin-account',
      name: 'LinkedIn Account (Manual)',
      provider: 'LINKEDIN',
      status: 'CONNECTED',
      email: 'user@linkedin.com',
      unipile_account_id: 'manual-account'
    };

    await setUserLinkedInAccounts([account]);
    
    // Also store in workspace settings format (user-specific)
    // Note: We should create a user-specific workspace settings function too

    toast.success('LinkedIn account configured in localStorage');
    console.log('✅ Account stored:', account);
  };

  const clearAccounts = async () => {
    await setUserLinkedInAccounts([]);
    // Clear workspace settings too
    toast.info('Cleared stored LinkedIn accounts');
  };

  const checkStatus = async () => {
    const storedAccounts = await getUserLinkedInAccounts();
    const workspaceSettings = null; // TODO: Get user workspace settings
    
    console.log('📊 Current Status:');
    console.log('Stored Accounts:', storedAccounts ? JSON.parse(storedAccounts) : 'None');
    console.log('Workspace Settings:', workspaceSettings ? JSON.parse(workspaceSettings) : 'None');
    console.log('API Configured:', unipileRealTimeSync.isConfigured());
    
    toast.info('Check console for detailed status');
  };

  const testSync = async () => {
    setSyncing(true);
    try {
      console.log('🚀 Starting test sync...');
      await unipileRealTimeSync.syncAll();
      const status = unipileRealTimeSync.getStatus();
      
      console.log('✅ Sync completed:', status);
      
      if (status.messagessynced > 0 || status.contactsSynced > 0) {
        toast.success(`Synced ${status.messagessynced} messages and ${status.contactsSynced} contacts`);
      } else {
        toast.warning('No data synced - check console for details');
      }
    } catch (error) {
      console.error('❌ Sync error:', error);
      toast.error('Sync failed - check console');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">LinkedIn Account Setup Helper</h1>
      
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <p className="text-yellow-800">
          <strong>⚠️ Development Tool:</strong> This page helps bypass account detection issues by manually configuring a LinkedIn account.
        </p>
      </div>

      <div className="space-y-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Setup</h2>
          <div className="flex gap-3">
            <Button onClick={setupAccount} variant="default">
              Setup LinkedIn Account
            </Button>
            <Button onClick={clearAccounts} variant="outline">
              Clear Accounts
            </Button>
            <Button onClick={checkStatus} variant="outline">
              Check Status
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Test Sync</h2>
          <div className="space-y-3">
            <p className="text-gray-600">
              After setting up an account above, test the sync functionality:
            </p>
            <Button 
              onClick={testSync} 
              disabled={syncing}
              className="w-full"
            >
              {syncing ? 'Syncing...' : 'Test LinkedIn Sync'}
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">API Configuration</h2>
          <div className="space-y-2">
            <p className="text-sm">
              <strong>API Key Configured:</strong> {unipileRealTimeSync.isConfigured() ? '✅ Yes' : '❌ No'}
            </p>
            <p className="text-sm">
              <strong>API URL:</strong> {import.meta.env.VITE_UNIPILE_DSN || 'Not set'}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Configure VITE_UNIPILE_API_KEY in Netlify environment variables for production.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Navigation</h2>
          <div className="flex gap-3">
            <Button 
              onClick={() => window.location.href = '/test-inbox'}
              variant="outline"
            >
              Go to Test Inbox
            </Button>
            <Button 
              onClick={() => window.location.href = '/workspace-settings'}
              variant="outline"
            >
              Workspace Settings
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}