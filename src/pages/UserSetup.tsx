import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Lock, 
  User, 
  Linkedin, 
  CheckCircle, 
  AlertCircle,
  ArrowRight,
  Loader2,
  Mail
} from 'lucide-react';
import { toast } from 'sonner';

export default function UserSetup() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'password' | 'linkedin' | 'complete'>('password');
  const [progress, setProgress] = useState(33);
  const [inviteData, setInviteData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [passwordForm, setPasswordForm] = useState({
    tempPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    validateToken();
  }, [token]);

  const validateToken = () => {
    // Check if token is valid
    const invitedUsers = JSON.parse(localStorage.getItem('invited_users') || '[]');
    const user = invitedUsers.find((u: any) => u.invite_token === token);
    
    if (!user) {
      setError('Invalid or expired invitation link');
      return;
    }
    
    setInviteData(user);
  };

  const handlePasswordSetup = async () => {
    // Validation
    if (!passwordForm.tempPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }
    
    if (passwordForm.tempPassword !== inviteData?.temp_password) {
      toast.error('Incorrect temporary password');
      return;
    }
    
    if (passwordForm.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    setLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update user password (in production, this would be a secure API call)
      const invitedUsers = JSON.parse(localStorage.getItem('invited_users') || '[]');
      const userIndex = invitedUsers.findIndex((u: any) => u.invite_token === token);
      if (userIndex !== -1) {
        invitedUsers[userIndex].password_set = true;
        invitedUsers[userIndex].requires_password_change = false;
        localStorage.setItem('invited_users', JSON.stringify(invitedUsers));
      }
      
      toast.success('Password set successfully!');
      
      // Move to LinkedIn step if required
      if (inviteData?.requires_linkedin) {
        setStep('linkedin');
        setProgress(66);
      } else {
        completeSetup();
      }
    } catch (error) {
      toast.error('Failed to set password');
    } finally {
      setLoading(false);
    }
  };

  const handleLinkedInConnect = async () => {
    setLoading(true);
    
    try {
      // Simulate LinkedIn OAuth flow
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update user LinkedIn status
      const invitedUsers = JSON.parse(localStorage.getItem('invited_users') || '[]');
      const userIndex = invitedUsers.findIndex((u: any) => u.invite_token === token);
      if (userIndex !== -1) {
        invitedUsers[userIndex].linkedin_connected = true;
        localStorage.setItem('invited_users', JSON.stringify(invitedUsers));
      }
      
      toast.success('LinkedIn account connected!');
      completeSetup();
    } catch (error) {
      toast.error('Failed to connect LinkedIn');
    } finally {
      setLoading(false);
    }
  };

  const completeSetup = () => {
    setStep('complete');
    setProgress(100);
    
    // Mark user as active
    const invitedUsers = JSON.parse(localStorage.getItem('invited_users') || '[]');
    const userIndex = invitedUsers.findIndex((u: any) => u.invite_token === token);
    if (userIndex !== -1) {
      const user = invitedUsers[userIndex];
      user.status = 'active';
      user.setup_completed_at = new Date().toISOString();
      
      // Create active user session
      localStorage.setItem('user_auth_profile', JSON.stringify({
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        workspace_id: user.workspace_id,
        workspace_name: user.workspace_name,
        role: user.role
      }));
      localStorage.setItem('app_workspace_id', user.workspace_id);
      localStorage.setItem('workspace_id', user.workspace_id);
      localStorage.setItem('user_email', user.email);
      localStorage.setItem('is_authenticated', 'true');
      
      invitedUsers[userIndex] = user;
      localStorage.setItem('invited_users', JSON.stringify(invitedUsers));
    }
    
    // Redirect to dashboard after delay
    setTimeout(() => {
      navigate('/');
    }, 3000);
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="rounded-full bg-red-100 p-3">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold">Invalid Invitation</h2>
              <p className="text-gray-600">{error}</p>
              <Button onClick={() => navigate('/login')} className="mt-4">
                Go to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!inviteData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Account Setup</span>
            <span>{progress}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Welcome Card */}
        <Card>
          <CardHeader>
            <CardTitle>Welcome to {inviteData.workspace_name}!</CardTitle>
            <CardDescription>
              You've been invited to join the workspace. Let's get your account set up.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <User className="h-5 w-5 text-gray-600" />
              <div>
                <p className="font-medium">{inviteData.full_name}</p>
                <p className="text-sm text-gray-600">{inviteData.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step Content */}
        {step === 'password' && (
          <Card>
            <CardHeader>
              <CardTitle>Set Your Password</CardTitle>
              <CardDescription>
                Create a secure password for your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Mail className="h-4 w-4" />
                <AlertDescription>
                  Check your email for the temporary password sent by your administrator
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <Label htmlFor="tempPassword">Temporary Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="tempPassword"
                    type="password"
                    placeholder="Enter temporary password"
                    className="pl-10"
                    value={passwordForm.tempPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, tempPassword: e.target.value })}
                    disabled={loading}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="Min. 8 characters"
                    className="pl-10"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    disabled={loading}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Re-enter new password"
                    className="pl-10"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    disabled={loading}
                  />
                </div>
              </div>
              
              <Button 
                className="w-full" 
                onClick={handlePasswordSetup}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Setting password...
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 'linkedin' && (
          <Card>
            <CardHeader>
              <CardTitle>Connect LinkedIn Account</CardTitle>
              <CardDescription>
                Link your LinkedIn account to enable messaging and contact import
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-blue-50 p-4">
                <div className="flex">
                  <Linkedin className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-900">Why connect LinkedIn?</p>
                    <ul className="mt-2 space-y-1 text-blue-700">
                      <li>• Send personalized messages to prospects</li>
                      <li>• Import your connections automatically</li>
                      <li>• Track engagement and responses</li>
                      <li>• Manage campaigns from one dashboard</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <Button 
                className="w-full" 
                onClick={handleLinkedInConnect}
                disabled={loading}
              >
                {loading ? (
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
              
              <Button 
                variant="outline"
                className="w-full" 
                onClick={completeSetup}
                disabled={loading}
              >
                Skip for now
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 'complete' && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="rounded-full bg-green-100 p-3">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-xl font-semibold">Setup Complete!</h2>
                <p className="text-gray-600">
                  Your account is ready. Redirecting to dashboard...
                </p>
                <div className="animate-pulse text-sm text-gray-500">
                  Please wait...
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}