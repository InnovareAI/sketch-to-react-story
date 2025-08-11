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
      console.log('LinkedIn callback URL params:', Object.fromEntries(searchParams.entries()));
      
      const success = searchParams.get('success');
      const data = searchParams.get('data');
      const state = searchParams.get('state');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      // Check for OAuth errors
      if (error) {
        throw new Error(errorDescription || error);
      }

      // Check if we have success data from Netlify function
      if (success === 'true' && data) {
        // Decode the data from Netlify function
        const decodedData = JSON.parse(atob(data));
        const { access_token, refresh_token, expires_in, profile } = decodedData;
        
        // Use this data instead of making API calls
        var tokenData = { access_token, refresh_token, expires_in };
      } else {
        // Fallback to client-side exchange (for local development)
        const code = searchParams.get('code');
        
        // Verify state parameter
        const savedState = sessionStorage.getItem('linkedin_oauth_state');
        if (state && state !== savedState) {
          throw new Error('Invalid state parameter. Possible CSRF attack.');
        }

        if (!code) {
          throw new Error('No authorization code received');
        }

        // Exchange code for token
        var tokenData = await linkedInOAuth.exchangeCodeForToken(code);
        
        // Get user profile
        var profile = await linkedInOAuth.getUserProfile(tokenData.access_token);
      }
      
      // Try to save to Supabase if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // User is authenticated, save to database
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

        if (dbError) {
          console.error('Database error:', dbError);
          // Don't throw - still mark as success since OAuth worked
        }
      } else {
        // No user authenticated - store in session for later
        console.log('No authenticated user - storing LinkedIn data in session');
        sessionStorage.setItem('linkedin_profile', JSON.stringify(profile));
        sessionStorage.setItem('linkedin_token', JSON.stringify(tokenData));
      }

      // Clean up session storage
      sessionStorage.removeItem('linkedin_oauth_state');
      sessionStorage.removeItem('linkedin_proxy_location');

      // Notify parent window if in popup
      if (window.opener) {
        // Store data in parent window's sessionStorage
        try {
          window.opener.sessionStorage.setItem('linkedin_profile', JSON.stringify(profile));
          window.opener.sessionStorage.setItem('linkedin_token', JSON.stringify(tokenData));
        } catch (e) {
          console.error('Could not access parent sessionStorage:', e);
        }
        
        window.opener.postMessage({
          type: 'linkedin_auth_success',
          profile: profile,
          tokenData: tokenData
        }, window.location.origin);
        window.close();
      } else {
        // Redirect to settings
        toast.success('LinkedIn account connected successfully!');
        navigate('/workspace-settings');
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