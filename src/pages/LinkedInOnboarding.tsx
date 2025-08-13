import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { unipileRealTimeSync } from '@/services/unipile/UnipileRealTimeSync';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Link, 
  Database, 
  Globe,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

export default function LinkedInOnboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState({
    unipileApiKey: '',
    unipileDsn: 'api6.unipile.com:13670',
    brightdataCustomerId: '',
    brightdataPassword: '',
    brightdataZone: ''
  });
  
  const [status, setStatus] = useState({
    unipileConnected: false,
    accountsFound: 0,
    brightdataConnected: false,
    syncComplete: false
  });

  // Check if user already has credentials
  useEffect(() => {
    checkExistingSetup();
  }, []);

  const checkExistingSetup = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Check if user already has LinkedIn setup
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('settings')
      .eq('owner_id', user.id)
      .single();

    if (workspace?.settings?.unipileConfigured) {
      // Already configured, redirect to inbox
      navigate('/inbox');
    }
  };

  const testUnipileConnection = async () => {
    setLoading(true);
    try {
      // Test the API key
      const response = await fetch(`https://${credentials.unipileDsn}/api/v1/accounts`, {
        method: 'GET',
        headers: {
          'X-API-KEY': credentials.unipileApiKey,
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const linkedInAccounts = (data.items || []).filter(
          (acc: any) => acc.type === 'LINKEDIN' && acc.sources?.some((s: any) => s.status === 'OK')
        );
        
        setStatus(prev => ({
          ...prev,
          unipileConnected: true,
          accountsFound: linkedInAccounts.length
        }));
        
        if (linkedInAccounts.length > 0) {
          toast.success(`Found ${linkedInAccounts.length} LinkedIn accounts!`);
          return linkedInAccounts;
        } else {
          toast.warning('No LinkedIn accounts found. Please connect accounts in Unipile first.');
          return [];
        }
      } else {
        toast.error('Invalid Unipile API key');
        return [];
      }
    } catch (error) {
      toast.error('Failed to connect to Unipile');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const saveCredentials = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Save credentials to workspace settings
    const { error } = await supabase
      .from('workspaces')
      .upsert({
        owner_id: user.id,
        name: 'My Workspace',
        settings: {
          unipileApiKey: credentials.unipileApiKey,
          unipileDsn: credentials.unipileDsn,
          brightdataCustomerId: credentials.brightdataCustomerId,
          brightdataPassword: credentials.brightdataPassword,
          brightdataZone: credentials.brightdataZone,
          unipileConfigured: true
        }
      });

    if (error) {
      toast.error('Failed to save credentials');
      return false;
    }

    // Store in localStorage for immediate use
    localStorage.setItem('unipile_config', JSON.stringify({
      apiKey: credentials.unipileApiKey,
      dsn: credentials.unipileDsn
    }));

    return true;
  };

  const performInitialSync = async () => {
    setLoading(true);
    try {
      // Configure the sync service with new credentials
      const syncService = new (unipileRealTimeSync.constructor as any)();
      syncService.apiKey = credentials.unipileApiKey;
      syncService.baseUrl = `https://${credentials.unipileDsn}/api/v1`;
      
      // Perform sync
      await syncService.syncAll();
      
      setStatus(prev => ({ ...prev, syncComplete: true }));
      toast.success('Initial sync complete! Your LinkedIn messages are ready.');
      
      // Redirect to inbox after delay
      setTimeout(() => {
        navigate('/inbox');
      }, 2000);
      
    } catch (error) {
      toast.error('Sync failed. You can retry from the inbox.');
      // Still redirect as they can retry
      setTimeout(() => {
        navigate('/inbox');
      }, 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    if (step === 1) {
      // Test Unipile connection
      const accounts = await testUnipileConnection();
      if (accounts.length > 0) {
        setStep(2);
      }
    } else if (step === 2) {
      // Save and sync
      const saved = await saveCredentials();
      if (saved) {
        await performInitialSync();
      }
    }
  };

  const skipBrightData = () => {
    setStep(2);
    handleNext();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Connect Your LinkedIn</h1>
          <p className="text-gray-600">Set up your LinkedIn integration to start syncing messages</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className={`flex items-center ${step >= 1 ? 'text-primary' : 'text-gray-400'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              status.unipileConnected ? 'bg-green-500 text-white' : step >= 1 ? 'bg-primary text-white' : 'bg-gray-200'
            }`}>
              {status.unipileConnected ? <CheckCircle className="h-5 w-5" /> : '1'}
            </div>
            <span className="ml-2 font-medium">Unipile API</span>
          </div>
          
          <div className="w-20 h-0.5 bg-gray-300 mx-4" />
          
          <div className={`flex items-center ${step >= 2 ? 'text-primary' : 'text-gray-400'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              status.syncComplete ? 'bg-green-500 text-white' : step >= 2 ? 'bg-primary text-white' : 'bg-gray-200'
            }`}>
              {status.syncComplete ? <CheckCircle className="h-5 w-5" /> : '2'}
            </div>
            <span className="ml-2 font-medium">Sync Messages</span>
          </div>
        </div>

        {/* Step 1: Unipile Configuration */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link className="h-5 w-5" />
                Connect Unipile API
              </CardTitle>
              <CardDescription>
                Unipile connects to your LinkedIn accounts to sync messages
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertDescription>
                  <strong>Don't have a Unipile account?</strong><br />
                  1. Sign up at <a href="https://unipile.com" target="_blank" className="text-primary underline">unipile.com</a><br />
                  2. Connect your LinkedIn accounts<br />
                  3. Get your API key from the dashboard
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="api-key">Unipile API Key</Label>
                  <Input
                    id="api-key"
                    type="password"
                    placeholder="Your Unipile API key"
                    value={credentials.unipileApiKey}
                    onChange={(e) => setCredentials(prev => ({ ...prev, unipileApiKey: e.target.value }))}
                  />
                  <p className="text-sm text-gray-500">Found in your Unipile dashboard</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dsn">Unipile DSN (optional)</Label>
                  <Input
                    id="dsn"
                    placeholder="api6.unipile.com:13670"
                    value={credentials.unipileDsn}
                    onChange={(e) => setCredentials(prev => ({ ...prev, unipileDsn: e.target.value }))}
                  />
                  <p className="text-sm text-gray-500">Default: api6.unipile.com:13670</p>
                </div>
              </div>

              {status.unipileConnected && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Connected! Found {status.accountsFound} LinkedIn account(s)
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => navigate('/dashboard')}>
                  Skip Setup
                </Button>
                <Button 
                  onClick={handleNext}
                  disabled={!credentials.unipileApiKey || loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      Test Connection
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Initial Sync */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Syncing Your Messages
              </CardTitle>
              <CardDescription>
                We're importing your LinkedIn conversations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-gray-600" />
                    LinkedIn Accounts
                  </span>
                  <span className="font-medium">{status.accountsFound} connected</span>
                </div>

                {loading && (
                  <div className="flex flex-col items-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                    <p className="text-gray-600">Syncing messages from LinkedIn...</p>
                    <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
                  </div>
                )}

                {status.syncComplete && (
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      <strong>Success!</strong> Your LinkedIn messages have been synced.
                      Redirecting to your inbox...
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {!loading && !status.syncComplete && (
                <div className="flex justify-end pt-4">
                  <Button 
                    onClick={handleNext}
                    disabled={loading}
                  >
                    Start Sync
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Optional: Bright Data Config */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Need advanced scraping capabilities?</p>
          <Button variant="link" className="text-primary">
            Configure Bright Data (Optional)
          </Button>
        </div>
      </div>
    </div>
  );
}