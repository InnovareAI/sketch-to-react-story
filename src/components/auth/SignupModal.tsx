import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Mail, User, Ticket, CheckCircle } from 'lucide-react';
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
    fullName: '',
    voucherCode: ''
  });

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.email || !formData.fullName || !formData.voucherCode) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    // Simple voucher validation for now - just check if it matches expected codes
    const validVoucherCodes = [
      { code: 'BETA-TL-2025', email: 'tl@innovareai.com' },
      { code: 'CLIENT-DEMO-001', email: 'demo@client1.com' },
      { code: 'CLIENT-DEMO-002', email: 'demo@client2.com' },
      { code: 'INTERNAL-TEAM-001', email: 'team@innovareai.com' },
      { code: 'PARTNER-ACCESS-001', email: 'partner@company.com' }
    ];
    
    const isValidVoucher = validVoucherCodes.some(
      v => v.code === formData.voucherCode.trim().toUpperCase() && 
           v.email === formData.email.toLowerCase()
    );
    
    if (!isValidVoucher) {
      toast.error('Invalid voucher code or email not authorized for this code');
      return;
    }
    
    setLoading(true);
    
    try {
      // Generate a secure password for the user
      const tempPassword = crypto.randomUUID();

      // Create the user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: tempPassword,
        options: {
          data: {
            full_name: formData.fullName,
            voucher_code: formData.voucherCode.trim().toUpperCase()
          }
        }
      });

      if (authError) {
        throw authError;
      }

      if (!authData.user) {
        throw new Error('No user data returned from signup');
      }

      // Create workspace
      const workspaceName = `${formData.fullName}'s Workspace`;
      const { data: workspace, error: workspaceError } = await supabase
        .from('workspaces')
        .insert({
          name: workspaceName,
          slug: workspaceName.toLowerCase().replace(/[^a-z0-9]/g, ''),
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

      // Sign the user in immediately
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: tempPassword
      });

      if (signInError) {
        console.error('Auto sign-in error:', signInError);
        // Continue anyway - user can login manually
      }

      // Set up authentication state for immediate access
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
      fullName: '',
      voucherCode: ''
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
              <Label htmlFor="voucherCode">Voucher Code *</Label>
              <div className="relative">
                <Ticket className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="voucherCode"
                  type="text"
                  placeholder="BETA-TL-2025"
                  className="pl-10 uppercase"
                  value={formData.voucherCode}
                  onChange={(e) => setFormData({ ...formData, voucherCode: e.target.value.toUpperCase() })}
                  disabled={loading}
                  required
                />
              </div>
              <p className="text-xs text-gray-500">
                Enter the voucher code provided to you via email
              </p>
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
                  'Get Started'
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