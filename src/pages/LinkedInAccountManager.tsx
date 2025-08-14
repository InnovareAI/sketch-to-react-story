import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { unipileRealTimeSync } from '@/services/unipile/UnipileRealTimeSync';
import { toast } from 'sonner';
import { 
  Linkedin, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Plus,
  User,
  Link,
  Settings
} from 'lucide-react';

interface LinkedInAccount {
  id: string;
  name: string;
  email: string;
  profile_url: string;
  status: 'active' | 'expired' | 'error';
  connected_at: string;
  unipile_account_id?: string;
}

export default function LinkedInAccountManager() {
  const [accounts, setAccounts] = useState<LinkedInAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      
      // Check Unipile API for connected accounts
      if (unipileRealTimeSync.isConfigured()) {
        const response = await fetch('https://api6.unipile.com:13670/api/v1/accounts', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_UNIPILE_API_KEY}`,
            'X-API-KEY': import.meta.env.VITE_UNIPILE_API_KEY,
            'Accept': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          const unipileAccounts = data.items || data.accounts || data || [];
          
          // Filter for LinkedIn accounts
          const linkedInAccounts = unipileAccounts.filter((acc: any) => 
            acc.provider === 'LINKEDIN' || acc.provider === 'linkedin'
          );

          if (linkedInAccounts.length > 0) {
            // Save accounts to local storage for quick access
            localStorage.setItem('linkedin_accounts', JSON.stringify(linkedInAccounts));
            
            // Transform to our format
            const formattedAccounts = linkedInAccounts.map((acc: any) => ({
              id: acc.id,
              name: acc.name || acc.profile?.name || 'LinkedIn User',
              email: acc.email || acc.profile?.email || '',
              profile_url: acc.profile?.url || `https://linkedin.com/in/${acc.id}`,
              status: acc.status === 'CONNECTED' ? 'active' : 'expired',
              connected_at: acc.created_at || new Date().toISOString(),
              unipile_account_id: acc.id
            }));
            
            setAccounts(formattedAccounts);
            
            // Also save to database for persistence
            for (const account of formattedAccounts) {
              await saveAccountToDatabase(account);
            }
          } else {
            toast.info('No LinkedIn accounts found. Please connect an account.');
          }
        }
      } else {
        toast.error('Unipile API not configured');
      }
      
    } catch (error) {
      console.error('Error loading accounts:', error);
      toast.error('Failed to load LinkedIn accounts');
    } finally {
      setLoading(false);
    }
  };

  const saveAccountToDatabase = async (account: LinkedInAccount) => {
    try {
      // Get workspace
      const { data: workspace } = await supabase
        .from('workspaces')
        .select('id')
        .limit(1)
        .single();
      
      if (!workspace) {
        // Create default workspace if none exists
        const { data: newWorkspace } = await supabase
          .from('workspaces')
          .insert({
            name: 'Default Workspace',
            created_at: new Date().toISOString()
          })
          .select()
          .single();
        
        if (newWorkspace) {
          await saveAccountWithWorkspace(account, newWorkspace.id);
        }
      } else {
        await saveAccountWithWorkspace(account, workspace.id);
      }
    } catch (error) {
      console.error('Error saving account:', error);
    }
  };

  const saveAccountWithWorkspace = async (account: LinkedInAccount, workspaceId: string) => {
    await supabase
      .from('team_accounts')
      .upsert({
        id: account.id,
        workspace_id: workspaceId,
        provider: 'LINKEDIN',
        email: account.email,
        account_name: account.name,
        profile_url: account.profile_url,
        status: account.status,
        unipile_account_id: account.unipile_account_id,
        connected_at: account.connected_at,
        metadata: {
          synced_at: new Date().toISOString()
        }
      });
  };

  const handleConnectAccount = () => {
    // TODO: Implement proper Unipile OAuth flow
    toast.info('LinkedIn connection feature coming soon');
  };

  const handleSyncNow = async () => {
    setSyncing(true);
    try {
      await unipileRealTimeSync.syncAll();
      toast.success('Sync completed successfully');
    } catch (error) {
      toast.error('Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">LinkedIn Account Manager</h1>
        <p className="text-gray-600">Manage your connected LinkedIn accounts and sync settings</p>
      </div>

      {/* API Status */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings className="h-5 w-5 text-gray-500" />
            <div>
              <h3 className="font-semibold">Unipile API Status</h3>
              <p className="text-sm text-gray-600">
                {unipileRealTimeSync.isConfigured() ? 'Connected and ready' : 'Not configured'}
              </p>
            </div>
          </div>
          {unipileRealTimeSync.isConfigured() ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <XCircle className="h-5 w-5 text-red-500" />
          )}
        </div>
      </div>

      {/* Connected Accounts */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Connected Accounts</h2>
          <div className="flex gap-2">
            <button
              onClick={loadAccounts}
              className="px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
            <button
              onClick={handleConnectAccount}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Account
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading accounts...</p>
          </div>
        ) : accounts.length === 0 ? (
          <div className="text-center py-8">
            <Linkedin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No LinkedIn accounts connected</p>
            <button
              onClick={handleConnectAccount}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Connect LinkedIn Account
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {accounts.map(account => (
              <div key={account.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium">{account.name}</div>
                      <div className="text-sm text-gray-600">{account.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {account.status === 'active' ? (
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-800">Expired</Badge>
                    )}
                    <a
                      href={account.profile_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-600"
                    >
                      <Link className="h-4 w-4" />
                    </a>
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  Connected: {new Date(account.connected_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sync Actions */}
      {accounts.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4">Sync Actions</h2>
          <div className="flex gap-3">
            <button
              onClick={handleSyncNow}
              disabled={syncing}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync Now'}
            </button>
            <button
              onClick={() => unipileRealTimeSync.startAutoSync(30)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Enable Auto-Sync (30 min)
            </button>
            <button
              onClick={() => unipileRealTimeSync.stopAutoSync()}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Stop Auto-Sync
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Badge({ children, className }: { children: React.ReactNode; className: string }) {
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${className}`}>
      {children}
    </span>
  );
}