import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Mail, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onSignupClick?: () => void;
}

export default function SimpleLoginModal({ isOpen, onClose, onSuccess, onSignupClick }: LoginModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast.error('Please enter your email and password');
      return;
    }
    
    setLoading(true);
    
    try {
      // Use proper Supabase authentication
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });
      
      if (authError) {
        throw authError;
      }
      
      if (!authData.user) {
        throw new Error('No user data returned');
      }
      
      // Get user profile from database
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          full_name,
          role,
          workspace_id,
          workspaces (
            name,
            plan
          )
        `)
        .eq('id', authData.user.id)
        .single();
      
      if (profileError) {
        console.error('Profile fetch error:', profileError);
        throw new Error('Failed to load user profile');
      }
      
      // Set up proper authentication state
      const userProfile = {
        id: profileData.id,
        email: profileData.email,
        full_name: profileData.full_name || profileData.email.split('@')[0],
        role: profileData.role,
        workspace_id: profileData.workspace_id,
        workspace_name: profileData.workspaces?.name || 'Workspace',
        workspace_plan: profileData.workspaces?.plan || 'free',
        status: 'active'
      };
      
      localStorage.setItem('is_authenticated', 'true');
      localStorage.setItem('user_auth_profile', JSON.stringify(userProfile));
      
      toast.success('Successfully logged in!');
      onClose();
      onSuccess?.();
      
    } catch (err: any) {
      console.error('Login error:', err);
      toast.error('Login failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
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
          
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </Button>
          
          {onSignupClick && (
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={onSignupClick}
              disabled={loading}
            >
              Don't have an account? Sign up
            </Button>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}