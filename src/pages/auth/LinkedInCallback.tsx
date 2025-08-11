/**
 * LinkedIn OAuth Callback Handler
 * Processes the OAuth redirect from Unipile after LinkedIn authentication
 */

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { unipileService } from '@/services/unipile/UnipileService';
import { toast } from 'sonner';

export default function LinkedInCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Connecting your LinkedIn account...');

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      // Get parameters from URL
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      // Check for errors from OAuth provider
      if (error) {
        throw new Error(errorDescription || 'LinkedIn authentication failed');
      }

      // Get the account ID from session storage
      const accountId = sessionStorage.getItem('unipile_account_id');
      if (!accountId) {
        throw new Error('Session expired. Please try connecting again.');
      }

      setMessage('Finalizing connection...');

      // Complete the OAuth flow
      const account = await unipileService.completeOAuthFlow(accountId, code || undefined);

      setStatus('success');
      setMessage(`Successfully connected ${account.name}'s LinkedIn account!`);
      
      toast.success('LinkedIn account connected successfully!');

      // Clean up session storage
      sessionStorage.removeItem('unipile_account_id');

      // Notify parent window if in popup
      if (window.opener) {
        window.opener.postMessage({
          type: 'linkedin_auth_success',
          email: account.email,
          name: account.name,
          profileUrl: account.profileUrl
        }, window.location.origin);
        
        // Close popup after short delay
        setTimeout(() => {
          window.close();
        }, 2000);
      } else {
        // Redirect to settings page after short delay
        setTimeout(() => {
          navigate('/workspace-settings?tab=linkedin');
        }, 2000);
      }
    } catch (error: any) {
      console.error('OAuth callback error:', error);
      setStatus('error');
      setMessage(error.message || 'Failed to connect LinkedIn account');
      
      toast.error(error.message || 'Connection failed');

      // Redirect to settings page after delay
      setTimeout(() => {
        if (window.opener) {
          window.close();
        } else {
          navigate('/workspace-settings?tab=linkedin');
        }
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            {status === 'processing' && (
              <>
                <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
                <h2 className="text-xl font-semibold">Processing...</h2>
                <p className="text-gray-600">{message}</p>
              </>
            )}

            {status === 'success' && (
              <>
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
                <h2 className="text-xl font-semibold text-green-600">Success!</h2>
                <p className="text-gray-600">{message}</p>
                <p className="text-sm text-gray-500">Redirecting...</p>
              </>
            )}

            {status === 'error' && (
              <>
                <XCircle className="h-12 w-12 text-red-600 mx-auto" />
                <h2 className="text-xl font-semibold text-red-600">Connection Failed</h2>
                <p className="text-gray-600">{message}</p>
                <p className="text-sm text-gray-500">Redirecting back...</p>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}