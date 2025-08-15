import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Mail, Lock, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { generateUUID } from '@/utils/uuid';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onSignupClick?: () => void;
}

export default function LoginModal({ isOpen, onClose, onSuccess, onSignupClick }: LoginModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.email || !formData.password) {
      toast.error('Please enter your email and password');
      return;
    }
    
    setLoading(true);
    
    try {
      // For demo purposes, accept any login
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if user exists in localStorage (from signup)
      const existingProfile = localStorage.getItem('user_auth_profile');
      let userData;
      
      if (existingProfile) {
        userData = JSON.parse(existingProfile);
        // Update email if different
        if (userData.email !== formData.email) {
          userData.email = formData.email;
        }
      } else {
        // Create new user data for demo
        // Always use proper UUID generation
        const userId = generateUUID();
        const workspaceId = generateUUID();
        
        userData = {
          id: userId,
          email: formData.email,
          full_name: formData.email.split('@')[0],
          workspace_id: workspaceId,
          workspace_name: `${formData.email.split('@')[0]}'s Workspace`,
          role: 'owner',
          created_at: new Date().toISOString()
        };
      }
      
      // Store auth data
      localStorage.setItem('user_auth_profile', JSON.stringify(userData));
      localStorage.setItem('user_email', formData.email);
      localStorage.setItem('is_authenticated', 'true');
      
      // Store user-specific workspace data
      localStorage.setItem(`user_${userData.id}_workspace_id`, userData.workspace_id);
      localStorage.setItem(`user_${userData.id}_app_workspace_id`, userData.workspace_id);
      
      // Keep legacy keys for backward compatibility during transition
      localStorage.setItem('app_workspace_id', userData.workspace_id);
      localStorage.setItem('workspace_id', userData.workspace_id);
      
      toast.success('Welcome back!');
      
      // Close modal and trigger success callback
      setTimeout(() => {
        onClose();
        if (onSuccess) onSuccess();
        window.location.reload(); // Refresh to apply auth state
      }, 500);
      
    } catch (err: any) {
      console.error('Login error details:', err);
      toast.error(`Login failed: ${err.message || 'Please try again'}`);
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: ''
    });
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
          <DialogTitle>Welcome back</DialogTitle>
          <DialogDescription>
            Sign in to your SAM AI account
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleLogin} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
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
                autoFocus
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                className="pl-10"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                disabled={loading}
                required
              />
            </div>
          </div>
          
          <div className="flex flex-col gap-2 pt-2">
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </Button>
            
            <div className="text-center text-sm text-gray-600">
              Don't have an account?{' '}
              <button
                type="button"
                className="text-primary hover:underline"
                onClick={() => {
                  onClose();
                  if (onSignupClick) onSignupClick();
                }}
              >
                Sign up
              </button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}