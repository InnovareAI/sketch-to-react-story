import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { linkedInOAuth } from '@/services/linkedin/LinkedInOAuth';
import { supabase } from '@/integrations/supabase/client';

export default function LinkedInCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      // Check for OAuth errors
      if (error) {
        throw new Error(errorDescription || error);
      }

      // Verify state parameter
      const savedState = sessionStorage.getItem('linkedin_oauth_state');
      if (state !== savedState) {
        throw new Error('Invalid state parameter. Possible CSRF attack.');
      }

      if (!code) {
        throw new Error('No authorization code received');
      }

      // Exchange code for token
      const tokenData = await linkedInOAuth.exchangeCodeForToken(code);
      
      // Get user profile
      const profile = await linkedInOAuth.getUserProfile(tokenData.access_token);
      
      // Save to Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const proxyLocation = sessionStorage.getItem('linkedin_proxy_location') || 'US';
      
      const { error: dbError } = await supabase
        .from('team_accounts')
        .upsert({
          user_id: user.id,
          provider: 'LINKEDIN',
          email: profile.email,
          name: profile.name,
          profile_url: `https://www.linkedin.com/in/${profile.sub}`,
          profile_picture: profile.picture,
          status: 'active',
          unipile_account_id: `linkedin_${profile.sub}`,
          metadata: {
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
            proxy_location: proxyLocation,
            locale: profile.locale,
            email_verified: profile.email_verified
          },
          connected_at: new Date().toISOString(),
          last_sync: new Date().toISOString()
        });

      if (dbError) throw dbError;

      // Clean up session storage
      sessionStorage.removeItem('linkedin_oauth_state');
      sessionStorage.removeItem('linkedin_proxy_location');

      // Notify parent window if in popup
      if (window.opener) {
        window.opener.postMessage({
          type: 'linkedin_auth_success',
          profile: profile
        }, window.location.origin);
        window.close();
      } else {
        // Redirect to settings
        toast.success('LinkedIn account connected successfully!');
        navigate('/settings/workspace');
      }
    } catch (error: any) {
      console.error('LinkedIn OAuth callback error:', error);
      setError(error.message);
      setProcessing(false);
      
      // Notify parent window of error if in popup
      if (window.opener) {
        window.opener.postMessage({
          type: 'linkedin_auth_error',
          error: error.message
        }, window.location.origin);
        setTimeout(() => window.close(), 3000);
      } else {
        toast.error(error.message);
        setTimeout(() => navigate('/settings/workspace'), 3000);
      }
    }
  };

  if (processing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <h2 className="text-lg font-semibold">Connecting your LinkedIn account...</h2>
          <p className="text-sm text-muted-foreground">Please wait while we complete the authentication.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <div className="rounded-full bg-red-100 p-3 w-fit mx-auto">
            <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold">Connection Failed</h2>
          <p className="text-sm text-muted-foreground">{error}</p>
          <p className="text-xs text-muted-foreground">Redirecting back to settings...</p>
        </div>
      </div>
    );
  }

  return null;
}