import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { linkedInDirectAPI } from '@/services/linkedin/LinkedInDirectAPI';
import { toast } from 'sonner';

export default function LinkedInCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processing LinkedIn authentication...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        if (error) {
          throw new Error(errorDescription || error);
        }

        if (!code) {
          throw new Error('No authorization code received from LinkedIn');
        }

        setMessage('Exchanging authorization code for access token...');
        
        // Handle OAuth callback
        const success = await linkedInDirectAPI.handleOAuthCallback(code);
        
        if (success) {
          setStatus('success');
          setMessage('Successfully connected to LinkedIn! You can now access your full network.');
          toast.success('LinkedIn account connected successfully!');
          
          // Auto-redirect after 3 seconds
          setTimeout(() => {
            navigate('/contacts');
          }, 3000);
        } else {
          throw new Error('Failed to exchange authorization code');
        }
      } catch (error) {
        console.error('LinkedIn OAuth error:', error);
        setStatus('error');
        setMessage(error.message || 'Failed to connect LinkedIn account');
        toast.error('LinkedIn connection failed');
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  const handleRetry = () => {
    linkedInDirectAPI.initiateOAuth();
  };

  const handleBackToContacts = () => {
    navigate('/contacts');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            {status === 'processing' && (
              <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
            )}
            {status === 'success' && (
              <CheckCircle className="h-12 w-12 text-green-600" />
            )}
            {status === 'error' && (
              <AlertCircle className="h-12 w-12 text-red-600" />
            )}
          </div>
          <CardTitle>
            {status === 'processing' && 'Connecting LinkedIn'}
            {status === 'success' && 'LinkedIn Connected!'}
            {status === 'error' && 'Connection Failed'}
          </CardTitle>
          <CardDescription>
            LinkedIn API authentication
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-gray-600">{message}</p>
          </div>
          
          {status === 'success' && (
            <div className="space-y-3">
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-green-800">
                  ✅ LinkedIn API access granted<br/>
                  🔗 Full network access enabled<br/>
                  📊 Enhanced contact sync available
                </p>
              </div>
              <p className="text-xs text-gray-500 text-center">
                Redirecting to contacts page in 3 seconds...
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-3">
              <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                <p className="text-sm text-red-800">
                  {message}
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleRetry} 
                  variant="outline" 
                  className="flex-1"
                >
                  Try Again
                </Button>
                <Button 
                  onClick={handleBackToContacts} 
                  variant="default" 
                  className="flex-1"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Contacts
                </Button>
              </div>
            </div>
          )}

          {status === 'processing' && (
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  Please wait while we establish the connection to LinkedIn's API...
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}