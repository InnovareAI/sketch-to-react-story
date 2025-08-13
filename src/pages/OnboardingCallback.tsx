import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function OnboardingCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processing LinkedIn connection...');

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      // Get OAuth callback parameters
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      if (error) {
        throw new Error(errorDescription || error);
      }

      if (!code) {
        throw new Error('No authorization code received');
      }

      // Exchange code for account details
      setMessage('Exchanging authorization code...');
      
      const response = await fetch('/.netlify/functions/unipile-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: '/accounts/callback',
          method: 'POST',
          body: {
            code,
            state,
            provider: 'LINKEDIN'
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to complete LinkedIn connection');
      }

      const data = await response.json();
      
      if (!data.account_id) {
        throw new Error('No account ID received from LinkedIn');
      }

      // Update workspace with LinkedIn account
      setMessage('Saving LinkedIn connection...');
      
      const workspaceId = sessionStorage.getItem('workspace_id') || localStorage.getItem('workspace_id');
      if (!workspaceId) {
        throw new Error('No workspace found. Please restart onboarding.');
      }

      const { error: updateError } = await supabase
        .from('workspaces')
        .update({
          unipile_account_id: data.account_id,
          integrations: {
            linkedin: {
              connected: true,
              account_id: data.account_id,
              connected_at: new Date().toISOString(),
              profile: data.profile || {}
            }
          }
        })
        .eq('id', workspaceId);

      if (updateError) throw updateError;

      // Store in localStorage for immediate use
      localStorage.setItem('linkedin_accounts', JSON.stringify([{
        id: data.account_id,
        unipileAccountId: data.account_id,
        provider: 'linkedin',
        connected_at: new Date().toISOString(),
        profile: data.profile
      }]));

      // Trigger initial sync
      setMessage('Starting initial contact sync...');
      
      const syncResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/linkedin-background-sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          workspace_id: workspaceId,
          account_id: data.account_id,
          sync_type: 'both',
          limit: 500
        })
      });

      if (syncResponse.ok) {
        toast.success('LinkedIn connected successfully! Syncing your contacts...');
      }

      setStatus('success');
      setMessage('LinkedIn connected successfully!');
      
      // Redirect back to onboarding to complete
      setTimeout(() => {
        const onboardingStep = sessionStorage.getItem('onboarding_step');
        if (onboardingStep) {
          navigate('/onboarding');
        } else {
          navigate('/dashboard');
        }
      }, 2000);

    } catch (error) {
      console.error('Error handling LinkedIn callback:', error);
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Failed to connect LinkedIn');
      
      // Allow user to retry
      setTimeout(() => {
        navigate('/onboarding');
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {status === 'processing' && <Loader2 className="h-5 w-5 animate-spin" />}
            {status === 'success' && <CheckCircle className="h-5 w-5 text-green-500" />}
            {status === 'error' && <AlertCircle className="h-5 w-5 text-red-500" />}
            LinkedIn Connection
          </CardTitle>
          <CardDescription>
            {status === 'processing' && 'Processing your LinkedIn connection...'}
            {status === 'success' && 'Successfully connected to LinkedIn'}
            {status === 'error' && 'Connection failed'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{message}</p>
          
          {status === 'processing' && (
            <div className="mt-4">
              <div className="animate-pulse flex space-x-4">
                <div className="flex-1 space-y-2">
                  <div className="h-2 bg-slate-200 rounded"></div>
                  <div className="h-2 bg-slate-200 rounded w-5/6"></div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}