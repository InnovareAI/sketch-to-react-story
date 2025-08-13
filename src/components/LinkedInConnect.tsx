import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Linkedin, Loader2, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

interface LinkedInConnectProps {
  onConnect?: (accountId: string) => void;
}

export function LinkedInConnect({ onConnect }: LinkedInConnectProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [accountId, setAccountId] = useState('');
  const [step, setStep] = useState<'intro' | 'connect' | 'success'>('intro');

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      // Step 1: Initialize Unipile connection
      const response = await fetch('/.netlify/functions/unipile-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: '/accounts/connect',
          method: 'POST',
          body: {
            provider: 'LINKEDIN',
            redirect_uri: `${window.location.origin}/settings/integrations/callback`
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to initiate LinkedIn connection');
      }

      const data = await response.json();
      
      if (data.auth_url) {
        // Open Unipile OAuth in new window
        const authWindow = window.open(
          data.auth_url,
          'LinkedIn Authorization',
          'width=600,height=700'
        );

        // Poll for completion
        const pollInterval = setInterval(() => {
          if (authWindow?.closed) {
            clearInterval(pollInterval);
            checkConnectionStatus();
          }
        }, 1000);
      } else if (data.account_id) {
        // Direct connection successful
        handleConnectionSuccess(data.account_id);
      }
    } catch (error) {
      console.error('Error connecting LinkedIn:', error);
      toast.error('Failed to connect LinkedIn. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  const checkConnectionStatus = async () => {
    try {
      // Check if account was connected
      const response = await fetch('/.netlify/functions/unipile-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: '/accounts',
          method: 'GET'
        })
      });

      if (response.ok) {
        const data = await response.json();
        const linkedInAccount = data.items?.find((acc: any) => 
          acc.provider === 'LINKEDIN' || acc.provider === 'linkedin'
        );
        
        if (linkedInAccount) {
          handleConnectionSuccess(linkedInAccount.id);
        } else {
          toast.error('LinkedIn connection not found. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error checking connection status:', error);
      toast.error('Failed to verify LinkedIn connection');
    }
  };

  const handleConnectionSuccess = (accountId: string) => {
    // Store account info in localStorage
    const accountData = {
      id: accountId,
      unipileAccountId: accountId,
      provider: 'linkedin',
      connected_at: new Date().toISOString()
    };
    
    localStorage.setItem('linkedin_accounts', JSON.stringify([accountData]));
    
    setAccountId(accountId);
    setStep('success');
    toast.success('LinkedIn connected successfully!');
    
    if (onConnect) {
      onConnect(accountId);
    }
  };

  const handleManualConnect = () => {
    if (!accountId.trim()) {
      toast.error('Please enter your Unipile Account ID');
      return;
    }
    
    handleConnectionSuccess(accountId);
  };

  if (step === 'success') {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700">
            <CheckCircle className="h-5 w-5" />
            LinkedIn Connected Successfully
          </CardTitle>
          <CardDescription>
            Your LinkedIn account is connected and ready to sync contacts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="bg-white">
            <AlertDescription>
              Account ID: <code className="font-mono text-sm">{accountId}</code>
            </AlertDescription>
          </Alert>
          <Button 
            className="mt-4 w-full"
            onClick={() => window.location.reload()}
          >
            Start Syncing Contacts
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Linkedin className="h-5 w-5 text-blue-600" />
          Connect Your LinkedIn Account
        </CardTitle>
        <CardDescription>
          Connect your LinkedIn to sync real contacts, messages, and network data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {step === 'intro' && (
          <>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="mt-1 h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-semibold text-blue-600">
                  1
                </div>
                <div>
                  <p className="font-medium">Authorize LinkedIn Access</p>
                  <p className="text-sm text-muted-foreground">
                    We'll redirect you to LinkedIn to authorize access
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1 h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-semibold text-blue-600">
                  2
                </div>
                <div>
                  <p className="font-medium">Sync Your Network</p>
                  <p className="text-sm text-muted-foreground">
                    Import all your LinkedIn connections and conversations
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1 h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-semibold text-blue-600">
                  3
                </div>
                <div>
                  <p className="font-medium">Start Engaging</p>
                  <p className="text-sm text-muted-foreground">
                    Send messages, track responses, and manage campaigns
                  </p>
                </div>
              </div>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Privacy First:</strong> We only access data you explicitly authorize. 
                Your LinkedIn password is never shared with us.
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button 
                className="flex-1"
                onClick={handleConnect}
                disabled={isConnecting}
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Linkedin className="mr-2 h-4 w-4" />
                    Connect LinkedIn
                  </>
                )}
              </Button>
              <Button 
                variant="outline"
                onClick={() => setStep('connect')}
              >
                Manual Setup
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </>
        )}

        {step === 'connect' && (
          <>
            <Alert>
              <AlertDescription>
                If you already have a Unipile account ID, enter it below to connect manually.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <Label htmlFor="account-id">Unipile Account ID</Label>
              <Input
                id="account-id"
                placeholder="Enter your Unipile account ID"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                You can find this in your Unipile dashboard or API response
              </p>
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={() => setStep('intro')}
              >
                Back
              </Button>
              <Button 
                className="flex-1"
                onClick={handleManualConnect}
                disabled={!accountId.trim()}
              >
                Connect Account
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}