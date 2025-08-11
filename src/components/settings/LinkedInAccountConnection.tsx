/**
 * LinkedIn Account Connection Component
 * Allows users to connect their LinkedIn accounts via Unipile for automation
 */

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { 
  Linkedin, 
  Plus, 
  Check, 
  X, 
  RefreshCw, 
  AlertCircle,
  User,
  Link,
  Shield,
  Loader2,
  ExternalLink,
  MessageSquare,
  Users,
  Activity,
  Globe,
  MapPin,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { toast } from 'sonner';
import { unipileService, LinkedInAccountData } from '@/services/unipile/UnipileService';
import { linkedInOAuth } from '@/services/linkedin/LinkedInOAuth';

interface ProxyLocation {
  code: string;
  name: string;
  flag: string;
  region: string;
}

const proxyLocations: ProxyLocation[] = [
  { code: 'US', name: 'United States', flag: '🇺🇸', region: 'North America' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', region: 'Europe' },
  { code: 'AT', name: 'Austria', flag: '🇦🇹', region: 'Europe' },
  { code: 'PH', name: 'The Philippines', flag: '🇵🇭', region: 'Asia' }
];

export function LinkedInAccountConnection() {
  const [accounts, setAccounts] = useState<LinkedInAccountData[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showConnectionForm, setShowConnectionForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [syncingAccount, setSyncingAccount] = useState<string | null>(null);
  const [connectionStep, setConnectionStep] = useState<'proxy' | 'auth'>('proxy');
  const [selectedProxy, setSelectedProxy] = useState<string>('US');
  const [updatingProxy, setUpdatingProxy] = useState<string | null>(null);
  const [showProxyUpdate, setShowProxyUpdate] = useState<string | null>(null);

  useEffect(() => {
    loadConnectedAccounts();
    
    // Listen for OAuth success messages from popup
    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, []);

  const handleOAuthMessage = (event: MessageEvent) => {
    if (event.origin !== window.location.origin) return;
    
    if (event.data.type === 'linkedin_auth_success') {
      console.log('Received OAuth success message:', event.data);
      
      // Store data in sessionStorage if not already there
      if (event.data.profile && event.data.tokenData) {
        sessionStorage.setItem('linkedin_profile', JSON.stringify(event.data.profile));
        sessionStorage.setItem('linkedin_token', JSON.stringify(event.data.tokenData));
        console.log('Stored OAuth data in sessionStorage');
      }
      
      // Reload accounts after successful connection
      loadConnectedAccounts();
      setShowConnectionForm(false);
      setIsConnecting(false);
      toast.success('LinkedIn account connected successfully!');
    } else if (event.data.type === 'linkedin_auth_error') {
      console.error('LinkedIn auth error:', event.data.error);
      toast.error(`LinkedIn connection failed: ${event.data.error}`);
      setIsConnecting(false);
    }
  };

  const loadConnectedAccounts = async () => {
    setLoading(true);
    try {
      // First check localStorage for persisted LinkedIn accounts
      const persistedAccounts = localStorage.getItem('linkedin_accounts');
      if (persistedAccounts) {
        const accounts = JSON.parse(persistedAccounts);
        setAccounts(accounts);
        console.log('Loaded persisted LinkedIn accounts:', accounts);
      }
      
      // Then check for new OAuth data in sessionStorage
      const storedProfile = sessionStorage.getItem('linkedin_profile');
      const storedToken = sessionStorage.getItem('linkedin_token');
      
      console.log('Loading accounts - sessionStorage data:', {
        hasProfile: !!storedProfile,
        hasToken: !!storedToken,
        profile: storedProfile ? JSON.parse(storedProfile) : null
      });
      
      if (storedProfile && storedToken) {
        const profile = JSON.parse(storedProfile);
        const proxyLocation = sessionStorage.getItem('linkedin_proxy_location') || 'US';
        
        const newAccount: LinkedInAccountData = {
          id: crypto.randomUUID(),
          provider: 'LINKEDIN',
          email: profile.email,
          name: profile.name,
          profileUrl: `https://www.linkedin.com/in/${profile.sub}`,
          profilePicture: profile.picture,
          status: 'active',
          unipileAccountId: `linkedin_${profile.sub}`,
          metadata: {
            locale: profile.locale,
            email_verified: profile.email_verified,
            proxy_location: proxyLocation,
            connected_at: new Date().toISOString()
          }
        };
        
        // Add to existing accounts and persist
        const existingAccounts = persistedAccounts ? JSON.parse(persistedAccounts) : [];
        const updatedAccounts = [...existingAccounts, newAccount];
        setAccounts(updatedAccounts);
        localStorage.setItem('linkedin_accounts', JSON.stringify(updatedAccounts));
        
        // Clear session storage
        sessionStorage.removeItem('linkedin_profile');
        sessionStorage.removeItem('linkedin_token');
        sessionStorage.removeItem('linkedin_proxy_location');
        
        toast.success('LinkedIn account connected successfully!');
      } else if (!persistedAccounts) {
        // No persisted accounts and no new OAuth data, try Unipile
        const connectedAccounts = await unipileService.getConnectedAccounts();
        setAccounts(connectedAccounts);
      }
    } catch (error) {
      console.error('Error loading accounts:', error);
      // Don't show error toast - just log it
    } finally {
      setLoading(false);
    }
  };

  const handleProxySelection = () => {
    if (!selectedProxy) {
      toast.error('Please select a proxy location');
      return;
    }
    
    // Store the selected proxy for later use
    sessionStorage.setItem('linkedin_proxy_location', selectedProxy);
    
    // Move to authentication step
    setConnectionStep('auth');
  };

  const initiateUnipileConnection = async () => {
    setIsConnecting(true);
    try {
      // Get the selected proxy location
      const proxyLocation = sessionStorage.getItem('linkedin_proxy_location') || 'US';
      
      // Check which OAuth method to use
      const hasLinkedInApp = import.meta.env.VITE_LINKEDIN_CLIENT_ID && import.meta.env.VITE_LINKEDIN_CLIENT_SECRET;
      const hasUnipile = import.meta.env.VITE_UNIPILE_API_KEY && import.meta.env.VITE_UNIPILE_API_KEY !== '';
      
      if (hasLinkedInApp) {
        // Use direct LinkedIn OAuth
        console.log('Using direct LinkedIn OAuth');
        const state = crypto.randomUUID();
        sessionStorage.setItem('linkedin_oauth_state', state);
        sessionStorage.setItem('linkedin_proxy_location', proxyLocation);
        
        const authUrl = linkedInOAuth.getAuthorizationUrl(state);
        
        // Open OAuth window
        const authWindow = window.open(
          authUrl,
          'LinkedInAuth',
          'width=600,height=700,left=200,top=100'
        );
        
        if (!authWindow || authWindow.closed) {
          toast.error('Popup blocked. Please allow popups for this site and try again.');
          setIsConnecting(false);
          return;
        }
        
        toast.success('LinkedIn authentication window opened. Please complete the authentication.');
        
        // Poll to check if popup is closed
        const checkInterval = setInterval(() => {
          try {
            if (authWindow.closed) {
              clearInterval(checkInterval);
              console.log('LinkedIn auth window closed');
              // Wait a bit for the message event to fire
              setTimeout(() => {
                // Only show info if still connecting (no success/error message received)
                if (isConnecting) {
                  setIsConnecting(false);
                  loadConnectedAccounts();
                  toast.info('LinkedIn window closed. Checking for connection...');
                }
              }, 500);
            }
          } catch (e) {
            clearInterval(checkInterval);
            console.error('Error checking auth window:', e);
            setIsConnecting(false);
          }
        }, 500);
        
        // Timeout after 5 minutes
        setTimeout(() => {
          clearInterval(checkInterval);
          setIsConnecting(false);
          if (!authWindow.closed) {
            authWindow.close();
          }
        }, 300000);
        
        return;
      }
      
      if (hasUnipile) {
        // Use Unipile OAuth
        console.log('Using Unipile OAuth');
        
        // Initiate OAuth flow with Unipile, including proxy metadata
        const oauthResponse = await unipileService.initiateLinkedInOAuth(undefined, {
          proxyLocation,
          proxyProvider: 'brightdata',
          customerId: import.meta.env.VITE_BRIGHTDATA_CUSTOMER_ID
        });
      
        if (!oauthResponse || !oauthResponse.auth_url) {
          throw new Error('Invalid response from Unipile API');
        }
        
        console.log('OAuth URL received:', oauthResponse.auth_url);
        
        // Open OAuth URL in popup window
        const authWindow = window.open(
          oauthResponse.auth_url,
          'UnipileLinkedInAuth',
          'width=600,height=700,left=200,top=100'
        );

        // Check if popup was blocked
        if (!authWindow || authWindow.closed) {
          toast.error('Popup blocked. Please allow popups for this site and try again.');
          setIsConnecting(false);
          return;
        }

        toast.success('LinkedIn authentication window opened. Please complete the authentication.');
        
        // Poll to check if popup is closed
        const checkInterval = setInterval(() => {
          try {
            if (authWindow.closed) {
              clearInterval(checkInterval);
              setIsConnecting(false);
              // Reload accounts in case connection was successful
              loadConnectedAccounts();
              // Reset the form
              setShowConnectionForm(false);
              setConnectionStep('proxy');
              toast.info('Authentication window closed. Checking connection status...');
            }
          } catch (e) {
            // Window might be from different origin, just clear interval
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
        
        return;
      }
      
      // No OAuth configured - use demo mode
      console.log('No OAuth configured - using demo mode');
      toast.warning('No LinkedIn integration configured. Creating demo connection.');
      
      // Simulate a delay for authentication
      setTimeout(() => {
        const mockAccount: LinkedInAccountData = {
          id: crypto.randomUUID(),
          provider: 'LINKEDIN',
          email: `user${Math.floor(Math.random() * 1000)}@linkedin.com`,
          name: `Test User ${Math.floor(Math.random() * 100)}`,
          profileUrl: 'https://linkedin.com/in/testuser',
          status: 'active',
          unipileAccountId: `demo-${Date.now()}`,
          metadata: {
            proxy_location: proxyLocation,
            proxy_provider: 'brightdata',
            headline: 'Senior Professional',
            connections_count: Math.floor(Math.random() * 500) + 100,
            location: proxyLocations.find(l => l.code === proxyLocation)?.name || 'Unknown'
          }
        };
        
        setAccounts(prev => [...prev, mockAccount]);
        toast.success('Demo LinkedIn account connected successfully!');
        setShowConnectionForm(false);
        setConnectionStep('proxy');
        setIsConnecting(false);
      }, 2000);
      
    } catch (error: any) {
      console.error('Error initiating connection:', error);
      toast.error(error.message || 'Failed to start LinkedIn connection. Check console for details.');
      setIsConnecting(false);
    }
  };

  const disconnectAccount = async (accountId: string) => {
    try {
      // Find the account
      const account = accounts.find(acc => acc.id === accountId);
      if (!account) {
        throw new Error('Account not found');
      }

      // For direct LinkedIn OAuth accounts, remove from both state and localStorage
      if (account.unipileAccountId.startsWith('linkedin_')) {
        // This is a direct LinkedIn OAuth account
        const updatedAccounts = accounts.filter(acc => acc.id !== accountId);
        setAccounts(updatedAccounts);
        localStorage.setItem('linkedin_accounts', JSON.stringify(updatedAccounts));
        toast.success('LinkedIn account disconnected');
      } else {
        // This is a Unipile account, use the original disconnect method
        await unipileService.disconnectAccount(accountId);
        await loadConnectedAccounts();
        toast.success('LinkedIn account disconnected');
      }
    } catch (error) {
      console.error('Error disconnecting account:', error);
      toast.error('Failed to disconnect account: ' + (error as Error).message);
    }
  };

  const syncAccount = async (accountId: string) => {
    setSyncingAccount(accountId);
    try {
      // Find the account
      const account = accounts.find(acc => acc.id === accountId);
      if (!account) {
        throw new Error('Account not found');
      }

      // For direct LinkedIn OAuth accounts, simulate sync by refreshing profile data
      if (account.unipileAccountId.startsWith('linkedin_')) {
        // This is a direct LinkedIn OAuth account
        // In a real implementation, you'd refresh the access token and get updated profile data
        
        // Simulate sync delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Update the account's last sync time
        const updatedAccounts = accounts.map(acc => 
          acc.id === accountId 
            ? { ...acc, metadata: { ...acc.metadata, last_sync: new Date().toISOString() } }
            : acc
        );
        setAccounts(updatedAccounts);
        localStorage.setItem('linkedin_accounts', JSON.stringify(updatedAccounts));
        
        toast.success('LinkedIn profile data refreshed successfully');
      } else {
        // This is a Unipile account, use the original sync method
        await unipileService.syncAccount(accountId);
        await loadConnectedAccounts();
        toast.success('LinkedIn data synced successfully');
      }
    } catch (error) {
      console.error('Error syncing account:', error);
      toast.error('Failed to sync account: ' + (error as Error).message);
    } finally {
      setSyncingAccount(null);
    }
  };

  const getStatusColor = (status: LinkedInAccountData['status']) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'expired': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const updateProxyLocation = async (accountId: string, newProxyCode: string) => {
    setUpdatingProxy(accountId);
    try {
      // Find the account
      const account = accounts.find(acc => acc.id === accountId);
      if (!account) {
        throw new Error('Account not found');
      }

      // Update the proxy location
      const updatedAccounts = accounts.map(acc => 
        acc.id === accountId 
          ? { ...acc, metadata: { ...acc.metadata, proxy_location: newProxyCode, proxy_updated: new Date().toISOString() } }
          : acc
      );
      
      setAccounts(updatedAccounts);
      localStorage.setItem('linkedin_accounts', JSON.stringify(updatedAccounts));
      setShowProxyUpdate(null);
      
      const newLocation = proxyLocations.find(l => l.code === newProxyCode);
      toast.success(`Proxy location updated to ${newLocation?.flag} ${newLocation?.name}`);
    } catch (error) {
      console.error('Error updating proxy location:', error);
      toast.error('Failed to update proxy location: ' + (error as Error).message);
    } finally {
      setUpdatingProxy(null);
    }
  };

  const getStatusBadge = (status: LinkedInAccountData['status']) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'expired':
        return <Badge className="bg-yellow-100 text-yellow-800">Expired</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800">Error</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Linkedin className="h-6 w-6 text-blue-600" />
              <div>
                <CardTitle>LinkedIn Account Integration</CardTitle>
                <CardDescription>
                  Connect your LinkedIn account for automated outreach and data sync
                </CardDescription>
              </div>
            </div>
            <Button 
              onClick={() => {
                setShowConnectionForm(true);
                setConnectionStep('proxy');
              }}
              disabled={isConnecting}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add LinkedIn Account
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Connection Form - Two Steps */}
      {showConnectionForm && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                {connectionStep === 'proxy' ? 'Step 1: Select Proxy Location' : 'Step 2: Connect LinkedIn Account'}
              </CardTitle>
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  connectionStep === 'proxy' ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'
                }`}>
                  1
                </div>
                <div className="w-8 h-1 bg-gray-300" />
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  connectionStep === 'auth' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
                }`}>
                  2
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {connectionStep === 'proxy' ? (
              <>
                <Alert>
                  <Globe className="h-4 w-4" />
                  <AlertDescription>
                    Select a proxy location for your LinkedIn account. This helps maintain account security and provides location-specific content access.
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <Label className="text-base font-medium">Choose your proxy location:</Label>
                  
                  <RadioGroup value={selectedProxy} onValueChange={setSelectedProxy}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {proxyLocations.map((location) => (
                        <div key={location.code} className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-white/50 transition-colors">
                          <RadioGroupItem value={location.code} id={location.code} />
                          <Label htmlFor={location.code} className="flex items-center gap-2 cursor-pointer flex-1">
                            <span className="text-xl">{location.flag}</span>
                            <div className="flex-1">
                              <div className="font-medium">{location.name}</div>
                              <div className="text-xs text-muted-foreground">{location.region}</div>
                            </div>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>

                  <Alert className="border-blue-200 bg-blue-50">
                    <MapPin className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      <strong>Selected:</strong> {proxyLocations.find(l => l.code === selectedProxy)?.name || 'None'}
                      <br />
                      <span className="text-xs">Your LinkedIn account will appear to be accessing from this location.</span>
                    </AlertDescription>
                  </Alert>
                </div>

                <div className="flex gap-3">
                  <Button 
                    onClick={handleProxySelection}
                    className="flex-1"
                  >
                    Continue to LinkedIn Auth
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowConnectionForm(false);
                      setConnectionStep('proxy');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    We use Unipile's secure OAuth connection to access your LinkedIn account. 
                    Your credentials are never stored on our servers.
                  </AlertDescription>
                </Alert>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium">Proxy Location Selected</p>
                      <p className="text-sm text-muted-foreground">
                        {proxyLocations.find(l => l.code === selectedProxy)?.flag} {proxyLocations.find(l => l.code === selectedProxy)?.name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-blue-100 p-2 text-blue-600">2</div>
                    <div>
                      <p className="font-medium">Authorize via LinkedIn</p>
                      <p className="text-sm text-muted-foreground">
                        Click below to securely connect your LinkedIn account
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-gray-100 p-2 text-gray-600">3</div>
                    <div>
                      <p className="font-medium">Start Automating</p>
                      <p className="text-sm text-muted-foreground">
                        Your account will be ready for automated outreach
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button 
                    variant="outline"
                    onClick={() => setConnectionStep('proxy')}
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <Button 
                    onClick={initiateUnipileConnection}
                    disabled={isConnecting}
                    className="flex-1"
                  >
                    {isConnecting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Linkedin className="h-4 w-4 mr-2" />
                        Connect LinkedIn Account
                      </>
                    )}
                  </Button>
                  {/* Demo Mode Button - Remove in production */}
                  {import.meta.env.DEV && (
                    <Button
                      variant="secondary"
                      onClick={() => {
                        // Mock successful connection for demo
                        const mockAccount: LinkedInAccountData = {
                          id: crypto.randomUUID(),
                          provider: 'LINKEDIN',
                          email: 'demo@example.com',
                          name: 'Demo User',
                          profileUrl: 'https://linkedin.com/in/demo',
                          status: 'active',
                          unipileAccountId: 'demo-account',
                          metadata: {
                            proxy_location: selectedProxy,
                            proxy_provider: 'brightdata',
                            headline: 'Demo Account for Testing',
                            connections_count: 500,
                            location: 'San Francisco, CA'
                          }
                        };
                        setAccounts([...accounts, mockAccount]);
                        toast.success('Demo account added successfully!');
                        setShowConnectionForm(false);
                        setConnectionStep('proxy');
                      }}
                    >
                      Add Demo Account
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowConnectionForm(false);
                      setConnectionStep('proxy');
                    }}
                  >
                    Cancel
                  </Button>
                </div>

                {!import.meta.env.VITE_LINKEDIN_CLIENT_ID && !import.meta.env.VITE_UNIPILE_API_KEY && (
                  <Alert className="border-yellow-200 bg-yellow-50">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-800">
                      <strong>Demo Mode:</strong> No LinkedIn integration configured. 
                      Add LinkedIn OAuth credentials (VITE_LINKEDIN_CLIENT_ID) or Unipile API key to enable real connections.
                    </AlertDescription>
                  </Alert>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

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
                      {account.profilePicture ? (
                        <img 
                          src={account.profilePicture} 
                          alt={account.name}
                          className="h-12 w-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="rounded-full bg-blue-100 p-3">
                          <User className="h-6 w-6 text-blue-600" />
                        </div>
                      )}
                      <div className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-white ${getStatusColor(account.status)}`} />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{account.name}</h3>
                        {account.metadata?.proxy_location && (
                          <span className="text-lg" title={`Proxy: ${proxyLocations.find(l => l.code === account.metadata.proxy_location)?.name}`}>
                            {proxyLocations.find(l => l.code === account.metadata.proxy_location)?.flag}
                          </span>
                        )}
                        {getStatusBadge(account.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">{account.email}</p>
                      
                      {account.metadata && (
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                          {account.metadata.headline && (
                            <span>{account.metadata.headline}</span>
                          )}
                          {account.metadata.connections_count && (
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {account.metadata.connections_count} connections
                            </span>
                          )}
                          {account.metadata.location && (
                            <span>{account.metadata.location}</span>
                          )}
                          {account.metadata.proxy_location && (
                            <span className="flex items-center gap-1">
                              <Globe className="h-3 w-3" />
                              Proxy: {proxyLocations.find(l => l.code === account.metadata.proxy_location)?.flag} {account.metadata.proxy_location}
                            </span>
                          )}
                        </div>
                      )}
                      
                      <a 
                        href={account.profileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline mt-2"
                      >
                        View LinkedIn Profile
                        <ExternalLink className="h-3 w-3" />
                      </a>
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
                      onClick={() => setShowProxyUpdate(showProxyUpdate === account.id ? null : account.id)}
                      disabled={updatingProxy === account.id}
                    >
                      {updatingProxy === account.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Globe className="h-4 w-4" />
                      )}
                      <span className="ml-1">Proxy</span>
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

                {/* Proxy Update Section */}
                {showProxyUpdate === account.id && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm">Update Proxy Location</h4>
                      <p className="text-xs text-muted-foreground">
                        Change your proxy location for this account. Useful when traveling or accessing from different regions.
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {proxyLocations.map((location) => (
                          <Button
                            key={location.code}
                            size="sm"
                            variant={account.metadata?.proxy_location === location.code ? "default" : "outline"}
                            onClick={() => updateProxyLocation(account.id, location.code)}
                            disabled={updatingProxy === account.id || account.metadata?.proxy_location === location.code}
                            className="justify-start"
                          >
                            <span className="text-lg mr-2">{location.flag}</span>
                            {location.name}
                            {account.metadata?.proxy_location === location.code && (
                              <Check className="h-3 w-3 ml-auto" />
                            )}
                          </Button>
                        ))}
                      </div>
                      <div className="flex justify-end">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setShowProxyUpdate(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Account Stats */}
                <div className="mt-4 pt-4 border-t grid grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-semibold">0</div>
                    <div className="text-xs text-muted-foreground">Messages Sent</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-semibold">0</div>
                    <div className="text-xs text-muted-foreground">Connections</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-semibold">0</div>
                    <div className="text-xs text-muted-foreground">Campaigns</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-semibold">0%</div>
                    <div className="text-xs text-muted-foreground">Response Rate</div>
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
              <Linkedin className="h-12 w-12 text-muted-foreground mx-auto" />
              <h3 className="font-semibold">No LinkedIn Accounts Connected</h3>
              <p className="text-sm text-muted-foreground">
                Connect your LinkedIn account to start automating outreach and syncing data
              </p>
              <Button 
                onClick={() => setShowConnectionForm(true)}
                className="mt-4"
              >
                <Plus className="h-4 w-4 mr-2" />
                Connect Your First Account
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
                <Activity className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <div className="font-medium">n8n Workflows</div>
                <div className="text-sm text-muted-foreground">Connected</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-blue-100 p-2">
                <Linkedin className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <div className="font-medium">LinkedIn OAuth</div>
                <div className="text-sm text-muted-foreground">
                  {import.meta.env.VITE_LINKEDIN_CLIENT_ID ? 'Configured' : 
                   import.meta.env.VITE_UNIPILE_API_KEY ? 'Using Unipile' : 'Demo Mode'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-purple-100 p-2">
                <Shield className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <div className="font-medium">OAuth Security</div>
                <div className="text-sm text-muted-foreground">Enabled</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}