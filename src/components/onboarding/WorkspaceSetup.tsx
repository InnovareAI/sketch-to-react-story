import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Linkedin, 
  Mail, 
  Calendar,
  CheckCircle, 
  Loader2, 
  ArrowRight,
  Sparkles,
  Users,
  MessageSquare,
  Target,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface WorkspaceSetupProps {
  userId?: string;
  onComplete?: () => void;
}

export function WorkspaceSetup({ userId, onComplete }: WorkspaceSetupProps) {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [workspaceData, setWorkspaceData] = useState({
    name: '',
    company: '',
    industry: '',
    team_size: ''
  });
  const [unipileAccount, setUnipileAccount] = useState<any>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const totalSteps = 3;
  const progress = (currentStep / totalSteps) * 100;

  // Check if workspace already exists
  useEffect(() => {
    checkExistingWorkspace();
  }, []);

  const checkExistingWorkspace = async () => {
    try {
      const userProfile = JSON.parse(localStorage.getItem('user_auth_profile') || '{}');
      if (userProfile.workspace_id) {
        // Check if LinkedIn is connected
        const { data: workspace } = await supabase
          .from('workspaces')
          .select('*')
          .eq('id', userProfile.workspace_id)
          .single();

        if (workspace?.unipile_account_id) {
          // Already set up, redirect to dashboard
          navigate('/dashboard');
        }
      }
    } catch (error) {
      console.error('Error checking workspace:', error);
    }
  };

  const handleCreateWorkspace = async () => {
    if (!workspaceData.name || !workspaceData.company) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      // Create workspace
      const { data: workspace, error } = await supabase
        .from('workspaces')
        .insert({
          name: workspaceData.name,
          settings: {
            company: workspaceData.company,
            industry: workspaceData.industry,
            team_size: workspaceData.team_size
          }
        })
        .select()
        .single();

      if (error) throw error;

      // Update user profile with workspace
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          workspace_id: workspace.id,
          role: 'owner'
        })
        .eq('id', userId || localStorage.getItem('user_id'));

      if (profileError) throw profileError;

      // Store in localStorage for immediate use
      localStorage.setItem('workspace_id', workspace.id);
      const profile = JSON.parse(localStorage.getItem('user_auth_profile') || '{}');
      profile.workspace_id = workspace.id;
      localStorage.setItem('user_auth_profile', JSON.stringify(profile));

      toast.success('Workspace created successfully!');
      setCurrentStep(2);
    } catch (error) {
      console.error('Error creating workspace:', error);
      toast.error('Failed to create workspace');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectLinkedIn = async () => {
    setIsConnecting(true);
    try {
      // Initialize Unipile OAuth flow
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
            scopes: ['profile', 'contacts', 'messages'],
            redirect_uri: `${window.location.origin}/onboarding/callback`
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to initiate LinkedIn connection');
      }

      const data = await response.json();
      
      if (data.auth_url) {
        // Store current state
        sessionStorage.setItem('onboarding_step', '2');
        sessionStorage.setItem('workspace_id', localStorage.getItem('workspace_id') || '');
        
        // Redirect to LinkedIn OAuth
        window.location.href = data.auth_url;
      } else if (data.account_id) {
        // Direct connection successful
        await handleConnectionSuccess(data.account_id);
      }
    } catch (error) {
      console.error('Error connecting LinkedIn:', error);
      toast.error('Failed to connect LinkedIn. You can set this up later in Settings.');
      // Allow skipping LinkedIn for now
      setCurrentStep(3);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleConnectionSuccess = async (accountId: string) => {
    try {
      const workspaceId = localStorage.getItem('workspace_id');
      if (!workspaceId) throw new Error('No workspace found');

      // Update workspace with Unipile account
      const { error } = await supabase
        .from('workspaces')
        .update({
          unipile_account_id: accountId,
          integrations: {
            linkedin: {
              connected: true,
              account_id: accountId,
              connected_at: new Date().toISOString()
            }
          }
        })
        .eq('id', workspaceId);

      if (error) throw error;

      // Store LinkedIn account
      localStorage.setItem('linkedin_accounts', JSON.stringify([{
        id: accountId,
        unipileAccountId: accountId,
        provider: 'linkedin',
        connected_at: new Date().toISOString()
      }]));

      setUnipileAccount({ id: accountId });
      toast.success('LinkedIn connected successfully!');
      
      // Trigger initial sync
      await triggerInitialSync(accountId, workspaceId);
      
      setCurrentStep(3);
    } catch (error) {
      console.error('Error saving connection:', error);
      toast.error('Failed to save LinkedIn connection');
    }
  };

  const triggerInitialSync = async (accountId: string, workspaceId: string) => {
    try {
      // Trigger background sync
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/linkedin-background-sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          workspace_id: workspaceId,
          account_id: accountId,
          sync_type: 'both',
          limit: 500
        })
      });

      if (response.ok) {
        toast.success('Initial sync started! Your contacts will appear shortly.');
      }
    } catch (error) {
      console.error('Error triggering sync:', error);
    }
  };

  const handleComplete = () => {
    if (onComplete) {
      onComplete();
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-6">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Step {currentStep} of {totalSteps}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step 1: Workspace Setup */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-6 w-6" />
                Create Your Workspace
              </CardTitle>
              <CardDescription>
                Set up your team workspace to get started with SAM AI
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="workspace-name">Workspace Name *</Label>
                <Input
                  id="workspace-name"
                  placeholder="e.g., Acme Sales Team"
                  value={workspaceData.name}
                  onChange={(e) => setWorkspaceData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">Company Name *</Label>
                <Input
                  id="company"
                  placeholder="e.g., Acme Inc."
                  value={workspaceData.company}
                  onChange={(e) => setWorkspaceData(prev => ({ ...prev, company: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Input
                  id="industry"
                  placeholder="e.g., SaaS, Healthcare, Finance"
                  value={workspaceData.industry}
                  onChange={(e) => setWorkspaceData(prev => ({ ...prev, industry: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="team-size">Team Size</Label>
                <select
                  id="team-size"
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                  value={workspaceData.team_size}
                  onChange={(e) => setWorkspaceData(prev => ({ ...prev, team_size: e.target.value }))}
                >
                  <option value="">Select team size</option>
                  <option value="1-5">1-5 people</option>
                  <option value="6-20">6-20 people</option>
                  <option value="21-50">21-50 people</option>
                  <option value="50+">50+ people</option>
                </select>
              </div>

              <Button 
                className="w-full" 
                onClick={handleCreateWorkspace}
                disabled={isLoading || !workspaceData.name || !workspaceData.company}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Workspace...
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: LinkedIn Connection */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Linkedin className="h-6 w-6 text-blue-600" />
                Connect Your LinkedIn Account
              </CardTitle>
              <CardDescription>
                This powers all features: contacts, messaging, and campaigns
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-500" />
                    <span className="font-medium">Sync Contacts</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Import all your LinkedIn connections automatically
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-green-500" />
                    <span className="font-medium">Manage Messages</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Send and receive LinkedIn messages from SAM AI
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-purple-500" />
                    <span className="font-medium">Run Campaigns</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Automate outreach and follow-ups
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-500" />
                    <span className="font-medium">Real-time Sync</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Always up-to-date with your LinkedIn data
                  </p>
                </div>
              </div>

              <Alert>
                <Sparkles className="h-4 w-4" />
                <AlertDescription>
                  <strong>One-time setup:</strong> Connect once and all features work automatically. 
                  Your LinkedIn credentials are securely managed by Unipile.
                </AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button 
                  className="flex-1"
                  onClick={handleConnectLinkedIn}
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
                      Connect LinkedIn Account
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setCurrentStep(3)}
                >
                  Skip for now
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Complete */}
        {currentStep === 3 && (
          <Card className="border-green-200 bg-green-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <CheckCircle className="h-6 w-6" />
                Setup Complete!
              </CardTitle>
              <CardDescription>
                Your workspace is ready. Let's get started!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>Workspace created</span>
                </div>
                {unipileAccount && (
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span>LinkedIn connected</span>
                    <Badge variant="outline" className="ml-auto">
                      Syncing contacts...
                    </Badge>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>Ready to use all features</span>
                </div>
              </div>

              <Alert>
                <AlertDescription>
                  <strong>What's next?</strong>
                  <ul className="mt-2 space-y-1 text-sm">
                    <li>• Your contacts are syncing in the background</li>
                    <li>• Set up your first campaign</li>
                    <li>• Invite team members to collaborate</li>
                    <li>• Configure email integration (optional)</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <Button 
                className="w-full" 
                size="lg"
                onClick={handleComplete}
              >
                Go to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}