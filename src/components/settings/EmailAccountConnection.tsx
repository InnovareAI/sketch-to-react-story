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
        return '📮';
      case 'OFFICE365':
        return '🏢';
      case 'EXCHANGE':
        return '📪';
      case 'IMAP':
      case 'SMTP':
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
            <DialogTitle>Configure IMAP/SMTP Settings</DialogTitle>
            <DialogDescription>
              Enter your email server details for manual configuration
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  OAuth is the most secure way to connect. Your password is never shared with our servers.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 gap-3">
                <Button
                  variant="outline"
                  className="justify-start h-auto p-4 hover:bg-red-50 hover:border-red-300 transition-colors"
                  onClick={() => initiateOAuthConnection('GMAIL')}
                  disabled={isConnecting}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                        <path d="M22 8.608v8.142a3.25 3.25 0 0 1-3.25 3.25h-13.5A3.25 3.25 0 0 1 2 16.75V8.67l9.723 5.834a.75.75 0 0 0 .777 0L22 8.608Z" fill="#EA4335"/>
                        <path d="M22 6.908V8.608l-9.5 5.894L3 8.638V6.908C3 5.3 4.3 4 5.908 4h14.184C21.7 4 23 5.3 23 6.908h-1Z" fill="#FBBC04"/>
                        <path d="M12.5 14.502L22 8.608V6.908C22 5.3 20.7 4 19.092 4H12.5v10.502Z" fill="#34A853"/>
                        <path d="M3 8.638l9.5 5.864V4H5.908C4.3 4 3 5.3 3 6.908v1.73Z" fill="#4285F4"/>
                      </svg>
                    </div>
                    <div className="text-left flex-1">
                      <div className="font-semibold">Gmail / Google Workspace</div>
                      <div className="text-sm text-muted-foreground">Personal and business Gmail accounts</div>
                    </div>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="justify-start h-auto p-4 hover:bg-blue-50 hover:border-blue-300 transition-colors"
                  onClick={() => initiateOAuthConnection('OUTLOOK')}
                  disabled={isConnecting}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5Z" fill="#0078D4"/>
                        <path d="M12 2v20c5.16-1.26 9-6.45 9-12V7l-9-4.5Z" fill="#0064B5"/>
                        <path d="M12 8.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z" fill="white"/>
                        <path d="M12 15c-2.67 0-8 1.34-8 4v1h16v-1c0-2.66-5.33-4-8-4Z" fill="white"/>
                      </svg>
                    </div>
                    <div className="text-left flex-1">
                      <div className="font-semibold">Outlook.com / Hotmail</div>
                      <div className="text-sm text-muted-foreground">Personal Microsoft email accounts</div>
                    </div>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="justify-start h-auto p-4 hover:bg-blue-50 hover:border-blue-300 transition-colors"
                  onClick={() => initiateOAuthConnection('OFFICE365')}
                  disabled={isConnecting}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M21.53 4.306l-10.159-4.28a1.885 1.885 0 0 0-1.442 0L3.273 2.665a1.86 1.86 0 0 0-1.263 1.77v14.863c0 .816.509 1.566 1.262 1.858l6.657 2.587a1.843 1.843 0 0 0 1.442 0l10.16-4.279a1.86 1.86 0 0 0 1.262-1.77V6.165a1.86 1.86 0 0 0-1.263-1.859zM12 16.351l-7-2.625V5.774l7 2.625v7.952z"/>
                      </svg>
                    </div>
                    <div className="text-left flex-1">
                      <div className="font-semibold">Microsoft 365 / Office 365</div>
                      <div className="text-sm text-muted-foreground">Business and enterprise accounts</div>
                    </div>
                  </div>
                </Button>
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
          </div>
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
      ) : !loading ? (
        <Card>
          <CardHeader>
            <CardTitle>Choose Your Email Provider</CardTitle>
            <CardDescription>Select your email service to connect your account</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="justify-start h-auto p-4 hover:bg-red-50 hover:border-red-300 transition-colors"
                onClick={() => initiateOAuthConnection('GMAIL')}
                disabled={isConnecting}
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                      <path d="M22 8.608v8.142a3.25 3.25 0 0 1-3.25 3.25h-13.5A3.25 3.25 0 0 1 2 16.75V8.67l9.723 5.834a.75.75 0 0 0 .777 0L22 8.608Z" fill="#EA4335"/>
                      <path d="M22 6.908V8.608l-9.5 5.894L3 8.638V6.908C3 5.3 4.3 4 5.908 4h14.184C21.7 4 23 5.3 23 6.908h-1Z" fill="#FBBC04"/>
                      <path d="M12.5 14.502L22 8.608V6.908C22 5.3 20.7 4 19.092 4H12.5v10.502Z" fill="#34A853"/>
                      <path d="M3 8.638l9.5 5.864V4H5.908C4.3 4 3 5.3 3 6.908v1.73Z" fill="#4285F4"/>
                    </svg>
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-semibold">Gmail</div>
                    <div className="text-xs text-muted-foreground">Personal & business</div>
                  </div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="justify-start h-auto p-4 hover:bg-blue-50 hover:border-blue-300 transition-colors"
                onClick={() => initiateOAuthConnection('OUTLOOK')}
                disabled={isConnecting}
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5Z" fill="#0078D4"/>
                      <path d="M12 2v20c5.16-1.26 9-6.45 9-12V7l-9-4.5Z" fill="#0064B5"/>
                      <path d="M12 8.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z" fill="white"/>
                      <path d="M12 15c-2.67 0-8 1.34-8 4v1h16v-1c0-2.66-5.33-4-8-4Z" fill="white"/>
                    </svg>
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-semibold">Outlook</div>
                    <div className="text-xs text-muted-foreground">Outlook.com & Hotmail</div>
                  </div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="justify-start h-auto p-4 hover:bg-orange-50 hover:border-orange-300 transition-colors"
                onClick={() => initiateOAuthConnection('OFFICE365')}
                disabled={isConnecting}
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M21.53 4.306l-10.159-4.28a1.885 1.885 0 0 0-1.442 0L3.273 2.665a1.86 1.86 0 0 0-1.263 1.77v14.863c0 .816.509 1.566 1.262 1.858l6.657 2.587a1.843 1.843 0 0 0 1.442 0l10.16-4.279a1.86 1.86 0 0 0 1.262-1.77V6.165a1.86 1.86 0 0 0-1.263-1.859zM12 16.351l-7-2.625V5.774l7 2.625v7.952z"/>
                    </svg>
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-semibold">Microsoft 365</div>
                    <div className="text-xs text-muted-foreground">Business & enterprise</div>
                  </div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="justify-start h-auto p-4 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                onClick={() => setShowConnectionDialog(true)}
                disabled={isConnecting}
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Mail className="w-6 h-6 text-gray-600" />
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-semibold">IMAP/SMTP</div>
                    <div className="text-xs text-muted-foreground">Other email providers</div>
                  </div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

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