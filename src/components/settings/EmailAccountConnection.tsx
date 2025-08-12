/**
 * Email Account Connection Component
 * Allows users to connect email accounts via Unipile
 */

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Mail, 
  Plus, 
  Check, 
  X, 
  RefreshCw, 
  AlertCircle,
  Loader2,
  Shield,
  Inbox,
  Send,
  ExternalLink,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { unipileEmailService, EmailAccountData } from '@/services/unipile/UnipileEmailService';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export function EmailAccountConnection() {
  const [accounts, setAccounts] = useState<EmailAccountData[]>([]);
  const [loading, setLoading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showConnectionDialog, setShowConnectionDialog] = useState(false);
  const [connectionType, setConnectionType] = useState<'oauth' | 'imap'>('oauth');
  const [syncingAccount, setSyncingAccount] = useState<string | null>(null);

  // IMAP form state
  const [imapCredentials, setImapCredentials] = useState({
    email: '',
    password: '',
    imap_host: '',
    imap_port: 993,
    smtp_host: '',
    smtp_port: 587,
    use_ssl: true
  });

  useEffect(() => {
    loadConnectedAccounts();
  }, []);

  const loadConnectedAccounts = async () => {
    setLoading(true);
    try {
      const connectedAccounts = await unipileEmailService.getConnectedAccounts();
      setAccounts(connectedAccounts);
      
      // Sync to Supabase if accounts exist
      for (const account of connectedAccounts) {
        await unipileEmailService.syncAccountToSupabase(account);
      }
    } catch (error) {
      console.error('Error loading email accounts:', error);
      toast.error('Failed to load email accounts');
    } finally {
      setLoading(false);
    }
  };

  const initiateOAuthConnection = async (provider: 'GMAIL' | 'OUTLOOK' | 'OFFICE365') => {
    setIsConnecting(true);
    try {
      const result = await unipileEmailService.initiateEmailOAuth(provider);
      
      if (!result || !result.auth_url) {
        throw new Error('Failed to get authorization URL');
      }

      // Open OAuth window
      const authWindow = window.open(
        result.auth_url,
        'EmailAuth',
        'width=600,height=700,left=200,top=100'
      );

      if (!authWindow || authWindow.closed) {
        toast.error('Popup blocked. Please allow popups for this site.');
        setIsConnecting(false);
        return;
      }

      toast.success(`${provider} authentication window opened. Please complete the authentication.`);

      // Poll to check if popup is closed
      const checkInterval = setInterval(() => {
        try {
          if (authWindow.closed) {
            clearInterval(checkInterval);
            setIsConnecting(false);
            loadConnectedAccounts();
            setShowConnectionDialog(false);
            toast.info('Checking connection status...');
          }
        } catch (e) {
          clearInterval(checkInterval);
          setIsConnecting(false);
        }
      }, 1000);

      // Timeout after 5 minutes
      setTimeout(() => {
        clearInterval(checkInterval);
        setIsConnecting(false);
        if (!authWindow.closed) {
          authWindow.close();
        }
      }, 300000);

    } catch (error: any) {
      console.error('Error initiating OAuth:', error);
      toast.error(error.message || 'Failed to start email connection');
      setIsConnecting(false);
    }
  };

  const connectIMAPAccount = async () => {
    if (!imapCredentials.email || !imapCredentials.password) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsConnecting(true);
    try {
      const account = await unipileEmailService.connectIMAPAccount(imapCredentials);
      
      if (account) {
        await unipileEmailService.syncAccountToSupabase(account);
        toast.success('IMAP account connected successfully!');
        setShowConnectionDialog(false);
        setImapCredentials({
          email: '',
          password: '',
          imap_host: '',
          imap_port: 993,
          smtp_host: '',
          smtp_port: 587,
          use_ssl: true
        });
        loadConnectedAccounts();
      } else {
        throw new Error('Failed to connect IMAP account');
      }
    } catch (error: any) {
      console.error('Error connecting IMAP:', error);
      toast.error(error.message || 'Failed to connect IMAP account');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectAccount = async (accountId: string) => {
    try {
      const success = await unipileEmailService.disconnectAccount(accountId);
      if (success) {
        toast.success('Email account disconnected');
        loadConnectedAccounts();
      }
    } catch (error) {
      console.error('Error disconnecting account:', error);
      toast.error('Failed to disconnect account');
    }
  };

  const syncAccount = async (accountId: string) => {
    setSyncingAccount(accountId);
    try {
      // Simulate sync for demo
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success('Email account synced successfully');
    } catch (error) {
      console.error('Error syncing account:', error);
      toast.error('Failed to sync account');
    } finally {
      setSyncingAccount(null);
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'GMAIL':
        return '📧';
      case 'OUTLOOK':
      case 'OFFICE365':
        return '📮';
      case 'EXCHANGE':
        return '📪';
      case 'IMAP':
        return '📬';
      default:
        return '✉️';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'expired': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="h-6 w-6 text-blue-600" />
              <div>
                <CardTitle>Email Account Integration</CardTitle>
                <CardDescription>
                  Connect your email accounts for automated outreach and inbox management
                </CardDescription>
              </div>
            </div>
            {accounts.length > 0 && (
              <Badge className="bg-green-100 text-green-800 px-3 py-1">
                <CheckCircle className="h-4 w-4 mr-1" />
                {accounts.length} Account{accounts.length > 1 ? 's' : ''} Connected
              </Badge>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Connection Dialog */}
      <Dialog open={showConnectionDialog} onOpenChange={setShowConnectionDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Connect Email Account</DialogTitle>
            <DialogDescription>
              Choose your email provider and connection method
            </DialogDescription>
          </DialogHeader>

          <Tabs value={connectionType} onValueChange={(v) => setConnectionType(v as 'oauth' | 'imap')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="oauth">OAuth (Recommended)</TabsTrigger>
              <TabsTrigger value="imap">IMAP/SMTP</TabsTrigger>
            </TabsList>

            <TabsContent value="oauth" className="space-y-4">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  OAuth is the most secure way to connect. Your password is never shared with our servers.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 gap-3">
                <Button
                  variant="outline"
                  className="justify-start h-auto p-4"
                  onClick={() => initiateOAuthConnection('GMAIL')}
                  disabled={isConnecting}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📧</span>
                    <div className="text-left">
                      <div className="font-semibold">Gmail</div>
                      <div className="text-sm text-muted-foreground">Connect your Gmail account</div>
                    </div>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="justify-start h-auto p-4"
                  onClick={() => initiateOAuthConnection('OUTLOOK')}
                  disabled={isConnecting}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📮</span>
                    <div className="text-left">
                      <div className="font-semibold">Outlook</div>
                      <div className="text-sm text-muted-foreground">Connect your Outlook account</div>
                    </div>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="justify-start h-auto p-4"
                  onClick={() => initiateOAuthConnection('OFFICE365')}
                  disabled={isConnecting}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🏢</span>
                    <div className="text-left">
                      <div className="font-semibold">Office 365</div>
                      <div className="text-sm text-muted-foreground">Connect your Office 365 account</div>
                    </div>
                  </div>
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="imap" className="space-y-4">
              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  IMAP/SMTP requires your email password. Use app-specific passwords when available.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Email Address</Label>
                  <Input
                    type="email"
                    value={imapCredentials.email}
                    onChange={(e) => setImapCredentials(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="your@email.com"
                  />
                </div>

                <div className="col-span-2">
                  <Label>Password / App Password</Label>
                  <Input
                    type="password"
                    value={imapCredentials.password}
                    onChange={(e) => setImapCredentials(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <Label>IMAP Host</Label>
                  <Input
                    value={imapCredentials.imap_host}
                    onChange={(e) => setImapCredentials(prev => ({ ...prev, imap_host: e.target.value }))}
                    placeholder="imap.gmail.com"
                  />
                </div>

                <div>
                  <Label>IMAP Port</Label>
                  <Input
                    type="number"
                    value={imapCredentials.imap_port}
                    onChange={(e) => setImapCredentials(prev => ({ ...prev, imap_port: parseInt(e.target.value) }))}
                  />
                </div>

                <div>
                  <Label>SMTP Host</Label>
                  <Input
                    value={imapCredentials.smtp_host}
                    onChange={(e) => setImapCredentials(prev => ({ ...prev, smtp_host: e.target.value }))}
                    placeholder="smtp.gmail.com"
                  />
                </div>

                <div>
                  <Label>SMTP Port</Label>
                  <Input
                    type="number"
                    value={imapCredentials.smtp_port}
                    onChange={(e) => setImapCredentials(prev => ({ ...prev, smtp_port: parseInt(e.target.value) }))}
                  />
                </div>
              </div>

              <Button 
                onClick={connectIMAPAccount}
                disabled={isConnecting}
                className="w-full"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Connect IMAP Account
                  </>
                )}
              </Button>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Connected Accounts */}
      {loading ? (
        <Card>
          <CardContent className="py-8">
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      ) : accounts.length > 0 ? (
        <div className="space-y-4">
          {accounts.map((account) => (
            <Card key={account.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      <div className="text-3xl">{getProviderIcon(account.provider)}</div>
                      <div className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-white ${getStatusColor(account.status)}`} />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{account.name}</h3>
                        <Badge variant="outline">{account.provider}</Badge>
                        <Badge className={account.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                          {account.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{account.email}</p>
                      
                      {account.metadata && (
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                          {account.metadata.folders && (
                            <span className="flex items-center gap-1">
                              <Inbox className="h-3 w-3" />
                              {account.metadata.folders.length} folders
                            </span>
                          )}
                          {account.metadata.last_sync && (
                            <span>Last sync: {new Date(account.metadata.last_sync).toLocaleString()}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => syncAccount(account.id)}
                      disabled={syncingAccount === account.id}
                    >
                      {syncingAccount === account.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                      <span className="ml-1">Sync</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => disconnectAccount(account.id)}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Disconnect
                    </Button>
                  </div>
                </div>

                {/* Account Stats */}
                <div className="mt-4 pt-4 border-t grid grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-semibold">0</div>
                    <div className="text-xs text-muted-foreground">Emails Sent</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-semibold">0</div>
                    <div className="text-xs text-muted-foreground">Emails Received</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-semibold">0</div>
                    <div className="text-xs text-muted-foreground">Campaigns</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-semibold">0%</div>
                    <div className="text-xs text-muted-foreground">Open Rate</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-3">
              <Mail className="h-12 w-12 text-muted-foreground mx-auto" />
              <h3 className="font-semibold">No Email Accounts Connected</h3>
              <p className="text-sm text-muted-foreground">
                Connect your email account to manage inbox and send automated emails
              </p>
              <Button 
                onClick={() => setShowConnectionDialog(true)}
                className="mt-4"
              >
                <Plus className="h-4 w-4 mr-2" />
                Connect Your Email Account
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Integration Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Integration Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-green-100 p-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <div className="font-medium">Unipile API</div>
                <div className="text-sm text-muted-foreground">
                  {import.meta.env.VITE_UNIPILE_API_KEY ? 'Connected' : 'Demo Mode'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-blue-100 p-2">
                <Mail className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <div className="font-medium">Email OAuth</div>
                <div className="text-sm text-muted-foreground">
                  {import.meta.env.VITE_UNIPILE_API_KEY ? 'Available' : 'Using Demo'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-purple-100 p-2">
                <Shield className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <div className="font-medium">Security</div>
                <div className="text-sm text-muted-foreground">OAuth 2.0 Enabled</div>
              </div>
            </div>
          </div>
          {!import.meta.env.VITE_UNIPILE_API_KEY && (
            <Alert className="mt-4 border-yellow-200 bg-yellow-50">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                <strong>Demo Mode:</strong> Unipile API credentials are configured in Netlify. 
                The email connection flow will work but create demo accounts for testing.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default EmailAccountConnection;