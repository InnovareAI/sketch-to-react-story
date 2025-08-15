import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Mail, Lock, User, Building2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function SignupModal({ isOpen, onClose, onSuccess }: SignupModalProps) {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    companyName: ''
  });

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.email || !formData.password || !formData.fullName) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    setLoading(true);
    
    try {
      // Use proper Supabase authentication
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            company_name: formData.companyName
          }
        }
      });

      if (authError) {
        throw authError;
      }

      if (!authData.user) {
        throw new Error('No user data returned from signup');
      }

      // Create workspace first
      const workspaceName = formData.companyName || `${formData.fullName}'s Workspace`;
      const { data: workspace, error: workspaceError } = await supabase
        .from('workspaces')
        .insert({
          name: workspaceName,
          slug: workspaceName.toLowerCase().replace(/[^a-z0-9]/g, ''),
          owner_id: authData.user.id,
          subscription_tier: 'pro',
          settings: {
            features: {
              linkedin: true,
              email: true,
              ai: true,
              workflows: true
            },
            limits: {
              users: 10,
              linkedin_accounts: 5,
              monthly_messages: 1000
            }
          }
        })
        .select()
        .single();

      if (workspaceError) {
        console.error('Workspace creation error:', workspaceError);
        throw new Error('Failed to create workspace');
      }

      // Create user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: formData.email,
          full_name: formData.fullName,
          workspace_id: workspace.id,
          role: 'owner'
        })
        .select()
        .single();

      if (profileError) {
        console.error('Profile creation error:', profileError);
        throw new Error('Failed to create user profile');
      }

      // Set up authentication state for immediate login
      const userProfile = {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        role: profile.role,
        workspace_id: profile.workspace_id,
        workspace_name: workspace.name,
        workspace_plan: workspace.subscription_tier,
        status: 'active'
      };

      localStorage.setItem('is_authenticated', 'true');
      localStorage.setItem('user_auth_profile', JSON.stringify(userProfile));
      
      // Show success
      setStep('success');
      toast.success('Account created successfully!');
      
      // Close modal and trigger success callback after delay
      setTimeout(() => {
        onClose();
        if (onSuccess) onSuccess();
        window.location.href = '/dashboard';
      }, 2000);
      
    } catch (err: any) {
      console.error('Signup error:', err);
      toast.error(err.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      fullName: '',
      companyName: ''
    });
    setStep('form');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        resetForm();
        onClose();
      }
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === 'form' ? 'Create your account' : 'Welcome to SAM AI!'}
          </DialogTitle>
          <DialogDescription>
            {step === 'form' 
              ? 'Get started with SAM AI in just a few seconds'
              : 'Your account has been created successfully'}
          </DialogDescription>
        </DialogHeader>
        
        {step === 'form' ? (
          <form onSubmit={handleSignup} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  className="pl-10"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  disabled={loading}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  className="pl-10"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={loading}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name (Optional)</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="companyName"
                  type="text"
                  placeholder="Acme Inc."
                  className="pl-10"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  disabled={loading}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Min. 6 characters"
                  className="pl-10"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  disabled={loading}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Re-enter password"
                  className="pl-10"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  disabled={loading}
                  required
                />
              </div>
            </div>
            
            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  resetForm();
                  onClose();
                }}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Sign up'
                )}
              </Button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-center text-gray-600">
              Your account has been created successfully!<br />
              Redirecting to dashboard...
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}