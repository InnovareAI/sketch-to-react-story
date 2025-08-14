import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Mail, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { clearAllBadUUIDs } from '@/utils/clearBadUUIDs';

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
      // Clear any bad UUIDs first
      clearAllBadUUIDs();
      
      // Simple delay for UX
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Generate proper UUIDs
      const generateUUID = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      };
      
      const userId = generateUUID();
      const workspaceId = generateUUID();
      
      const userData = {
        id: userId,
        email: formData.email,
        full_name: formData.email.split('@')[0],
        workspace_id: workspaceId,
        workspace_name: `${formData.email.split('@')[0]}'s Workspace`,
        role: 'owner',
        created_at: new Date().toISOString()
      };
      
      // Store all necessary keys
      localStorage.setItem('user_auth_profile', JSON.stringify(userData));
      localStorage.setItem('user_email', formData.email);
      localStorage.setItem('is_authenticated', 'true');
      localStorage.setItem('workspace_id', workspaceId);
      localStorage.setItem('app_workspace_id', workspaceId);
      
      // Also store user-specific keys
      localStorage.setItem(`user_${userId}_workspace_id`, workspaceId);
      localStorage.setItem(`user_${userId}_app_workspace_id`, workspaceId);
      
      toast.success('Welcome back!');
      
      // Simple reload to apply auth
      setTimeout(() => {
        window.location.reload();
      }, 100);
      
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