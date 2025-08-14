import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { unipileRealTimeSync } from '@/services/unipile/UnipileRealTimeSync';
import { enhancedLinkedInImport } from '@/services/EnhancedLinkedInImport';
import { linkedInOAuth } from '@/services/linkedin/LinkedInOAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  Loader2, 
  Link, 
  MapPin,
  ArrowRight,
  RefreshCw,
  Globe
} from 'lucide-react';
import { toast } from 'sonner';

export default function LinkedInOnboarding() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [autoDetecting, setAutoDetecting] = useState(false);
  const [location, setLocation] = useState('');
  
  const [status, setStatus] = useState({
    connected: false,
    authenticated: false,
    accountsFound: 0,
    locationDetected: false,
    contactsImported: false,
    contactCount: 0,
    syncComplete: false
  });

  // Check if user already has LinkedIn setup
  useEffect(() => {
    checkExistingSetup();
  }, []);

  const checkExistingSetup = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // First check if we have valid connected accounts
    const result = await unipileRealTimeSync.testConnection();
    
    if (result.success && result.accounts.length > 0) {
      // We have valid connected accounts - check if they have data
      const { count } = await supabase
        .from('inbox_conversations')
        .select('*', { count: 'exact', head: true })
        .eq('platform', 'linkedin');

      if (count && count > 0) {
        // Has both valid accounts AND data - redirect to inbox
        navigate('/inbox');
      } else {
        // Has accounts but no data yet - continue with setup
        setStatus(prev => ({
          ...prev,
          connected: true,
          authenticated: true,
          accountsFound: result.accounts.length
        }));
        
        // Auto-detect location when accounts are found
        await detectLocation();
      }
    } else {
      // No valid accounts - stay on onboarding page
      checkConnectedAccounts();
    }
  };

  const detectLocation = async () => {
    setAutoDetecting(true);
    try {
      // Try to get location from user's IP
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      
      // Map country/region to location
      const locationMap: { [key: string]: string } = {
        'US': data.region_code === 'CA' || data.region_code === 'WA' || data.region_code === 'OR' ? 'us-west' :
              data.region_code === 'NY' || data.region_code === 'MA' || data.region_code === 'FL' ? 'us-east' : 'us-central',
        'CA': 'canada',
        'GB': 'uk',
        'AU': 'australia',
        'DE': 'europe',
        'FR': 'europe',
        'ES': 'europe',
        'IT': 'europe',
        'NL': 'europe',
        'JP': 'asia',
        'CN': 'asia',
        'IN': 'asia',
        'SG': 'asia',
        'KR': 'asia'
      };
      
      const detectedLocation = locationMap[data.country_code] || 'other';
      setLocation(detectedLocation);
      
      // Get friendly name for location
      const locationNames: { [key: string]: string } = {
        'us-west': 'United States - West',
        'us-east': 'United States - East',
        'us-central': 'United States - Central',
        'canada': 'Canada',
        'uk': 'United Kingdom',
        'europe': 'Europe',
        'asia': 'Asia Pacific',
        'australia': 'Australia',
        'other': data.country_name || 'International'
      };
      
      setStatus(prev => ({ ...prev, locationDetected: true }));
      toast.success(`Location detected: ${locationNames[detectedLocation]}`);
      
      return detectedLocation;
    } catch (error) {
      console.error('Failed to auto-detect location:', error);
      // Default to US-Central if detection fails
      setLocation('us-central');
      return 'us-central';
    } finally {
      setAutoDetecting(false);
    }
  };

  const checkConnectedAccounts = async () => {
    setLoading(true);
    try {
      const result = await unipileRealTimeSync.testConnection();
      
      if (result.success && result.accounts.length > 0) {
        setStatus(prev => ({
          ...prev,
          connected: true,
          authenticated: true,
          accountsFound: result.accounts.length
        }));
        
        // Auto-detect location when accounts are found
        await detectLocation();
      }
    } catch (error) {
      console.error('Error checking accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      // Use the LinkedIn OAuth service to get the authorization URL
      const state = crypto.randomUUID();
      localStorage.setItem('linkedin_oauth_state', state);
      
      // Check if we have LinkedIn OAuth credentials configured
      const clientId = import.meta.env.VITE_LINKEDIN_CLIENT_ID;
      if (!clientId) {
        // Fallback to Unipile OAuth if LinkedIn direct OAuth is not configured
        toast.info('Redirecting to LinkedIn authorization...');
        
        // For now, navigate to the LinkedIn integration page in settings
        navigate('/linkedin-integration');
        return;
      }
      
      // Use direct LinkedIn OAuth
      const authUrl = linkedInOAuth.getAuthorizationUrl(state);
      window.location.href = authUrl;
    } catch (error) {
      console.error('Error initiating LinkedIn connection:', error);
      toast.error('Failed to connect to LinkedIn. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleCheckConnection = async () => {
    await checkConnectedAccounts();
  };

  const completeSetupAndSync = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get or create workspace
      let { data: workspace, error: wsError } = await supabase
        .from('workspaces')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (wsError || !workspace) {
        const { data: newWorkspace, error: createError } = await supabase
          .from('workspaces')
          .insert({
            owner_id: user.id,
            name: 'My Workspace',
            settings: {
              location,
              linkedInConfigured: true,
              syncEnabled: true,
              autoDetectedLocation: true
            }
          })
          .select('id')
          .single();

        if (createError) throw createError;
        workspace = newWorkspace;
      } else {
        // Update existing workspace
        await supabase
          .from('workspaces')
          .update({
            settings: {
              location,
              linkedInConfigured: true,
              syncEnabled: true,
              autoDetectedLocation: true
            }
          })
          .eq('id', workspace.id);
      }

      // Store location and workspace in localStorage
      localStorage.setItem('user_location', location);
      localStorage.setItem('workspace_id', workspace.id);

      // Step 1: Import LinkedIn contacts immediately after authentication
      toast.info('🚀 Importing your LinkedIn contacts...');
      try {
        enhancedLinkedInImport.initialize(workspace.id);
        
        const contactImportResult = await enhancedLinkedInImport.importContacts({
          limit: 1000, // Generous limit for onboarding
          preferredMethod: 'both', // Use all available methods
          useUnipile: true,
          useLinkedInAPI: true
        });

        if (contactImportResult.success && contactImportResult.contactsSynced > 0) {
          setStatus(prev => ({ 
            ...prev, 
            contactsImported: true, 
            contactCount: contactImportResult.contactsSynced 
          }));
          
          // Show detailed import results
          toast.success(`🎉 Imported ${contactImportResult.contactsSynced} LinkedIn contacts!`);
          
          // Show quality metrics
          if (contactImportResult.quality.firstDegree > 0) {
            toast.info(`🔗 ${contactImportResult.quality.firstDegree} 1st degree, ${contactImportResult.quality.secondDegree} 2nd degree connections`);
          }
          
          if (contactImportResult.quality.withJobTitles > 0) {
            toast.info(`✅ ${contactImportResult.quality.withJobTitles} contacts with job titles, ${contactImportResult.quality.withProfiles} with LinkedIn profiles`);
          }
        } else {
          // Still mark as success but with warning
          setStatus(prev => ({ ...prev, contactsImported: true, contactCount: 0 }));
          toast.warning('Contact import completed but no new contacts were found');
        }
      } catch (contactError) {
        console.error('Contact import during onboarding failed:', contactError);
        // Don't fail the entire onboarding due to contact import issues
        setStatus(prev => ({ ...prev, contactsImported: true, contactCount: 0 }));
        toast.warning('Contact import encountered issues but setup will continue');
      }

      // Step 2: Perform initial message sync
      toast.info('📨 Syncing your LinkedIn messages...');
      await unipileRealTimeSync.syncAll();
      
      setStatus(prev => ({ ...prev, syncComplete: true }));
      
      // Get final contact count from latest state
      const finalContactCount = contactImportResult.success ? contactImportResult.contactsSynced : 0;
      
      // Final success message with contact count
      if (finalContactCount > 0) {
        toast.success(`🎉 Setup complete! ${finalContactCount} contacts imported and messages synced.`);
      } else {
        toast.success('Setup complete! Your LinkedIn messages are ready.');
      }
      
      // Redirect to contacts if we imported any, otherwise to inbox
      setTimeout(() => {
        if (finalContactCount > 0) {
          navigate('/contacts'); // Show the user their imported contacts
        } else {
          navigate('/inbox'); // Go to messages if no contacts
        }
      }, 2000);
      
    } catch (error) {
      console.error('Onboarding setup error:', error);
      toast.error('Setup encountered issues. You can retry from the dashboard.');
      
      // Still redirect so they can use the app
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } finally {
      setLoading(false);
    }
  };

  // Simplified single-card view
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Connect Your LinkedIn</h1>
          <p className="text-gray-600">One-click setup to start syncing your LinkedIn messages</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link className="h-5 w-5" />
              LinkedIn Integration Setup
            </CardTitle>
            <CardDescription>
              Connect your account and we'll handle the rest automatically
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Status Display */}
            <div className="space-y-3">
              {/* Connection Status */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="flex items-center gap-2">
                  <Link className="h-4 w-4 text-gray-600" />
                  LinkedIn Account
                </span>
                {status.connected ? (
                  <span className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    {status.accountsFound} Connected
                  </span>
                ) : (
                  <span className="text-gray-500">Not Connected</span>
                )}
              </div>

              {/* Location Status */}
              {status.connected && (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-600" />
                    Location
                  </span>
                  {status.locationDetected ? (
                    <span className="flex items-center gap-1 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      Auto-detected
                    </span>
                  ) : autoDetecting ? (
                    <span className="flex items-center gap-1 text-blue-600">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Detecting...
                    </span>
                  ) : (
                    <span className="text-gray-500">Pending</span>
                  )}
                </div>
              )}

              {/* Contact Import Status */}
              {status.connected && status.locationDetected && (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-gray-600" />
                    LinkedIn Contacts
                  </span>
                  {status.contactsImported ? (
                    <span className="flex items-center gap-1 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      {status.contactCount > 0 ? `${status.contactCount} Imported` : 'Complete'}
                    </span>
                  ) : loading ? (
                    <span className="flex items-center gap-1 text-blue-600">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Importing...
                    </span>
                  ) : (
                    <span className="text-gray-500">Ready</span>
                  )}
                </div>
              )}

              {/* Message Sync Status */}
              {status.connected && status.locationDetected && (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 text-gray-600" />
                    Message Sync
                  </span>
                  {status.syncComplete ? (
                    <span className="flex items-center gap-1 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      Complete
                    </span>
                  ) : loading ? (
                    <span className="flex items-center gap-1 text-blue-600">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Syncing...
                    </span>
                  ) : (
                    <span className="text-gray-500">Ready</span>
                  )}
                </div>
              )}
            </div>

            {/* Action Section */}
            {!status.connected ? (
              <>
                <Alert>
                  <Globe className="h-4 w-4" />
                  <AlertDescription>
                    Click below to connect your LinkedIn account. This will open in a new window where you can authorize access.
                  </AlertDescription>
                </Alert>

                <div className="flex flex-col gap-3 items-center py-4">
                  <Button 
                    size="lg"
                    onClick={handleConnect}
                    disabled={isConnecting}
                    className="w-full max-w-sm"
                  >
                    {isConnecting ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Link className="h-5 w-5 mr-2" />
                        Connect LinkedIn Account
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={handleCheckConnection}
                    disabled={loading}
                    className="w-full max-w-sm"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Checking...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Check Connection
                      </>
                    )}
                  </Button>
                </div>
              </>
            ) : status.syncComplete ? (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>All done!</strong> Your LinkedIn is connected and messages are synced. Redirecting to inbox...
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <Alert className="bg-blue-50 border-blue-200">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    LinkedIn connected successfully! {status.locationDetected && 'Location auto-detected.'} Click below to complete setup.
                  </AlertDescription>
                </Alert>

                <div className="flex justify-center pt-4">
                  <Button 
                    size="lg"
                    onClick={completeSetupAndSync}
                    disabled={loading || !status.locationDetected}
                    className="w-full max-w-sm"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Setting up...
                      </>
                    ) : (
                      <>
                        Complete Setup
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}

            <div className="flex justify-center pt-2">
              <Button 
                variant="ghost"
                onClick={() => navigate('/dashboard')}
                className="text-sm"
              >
                Skip Setup (Configure Later)
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}