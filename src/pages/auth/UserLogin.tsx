/**
 * Regular User Login Page
 * For workspace members who have been invited by super admin
 */

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  LogIn, 
  Eye, 
  EyeOff, 
  Loader2,
  Users,
  AlertCircle,
  Building2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function UserLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Load saved email if exists
    const savedEmail = localStorage.getItem('user_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }

    // Check if already logged in
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Check if user exists in our users table and is not super admin
      const { data: userRecord } = await supabase
        .from('users')
        .select('role, tenant_id, name')
        .eq('id', user.id)
        .single();
      
      if (userRecord && userRecord.role !== 'owner') {
        // Regular user, redirect to main dashboard
        navigate('/dashboard');
        return;
      }
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // For development mode, check if this is a test user or invited user
      if (email.includes('@example.com') || email.includes('@test.com') || password === email) {
        console.log('Using development mode for user login');
        
        // Check if user exists in users table
        const { data: userRecord, error: userError } = await supabase
          .from('users')
          .select(`
            id,
            email,
            name,
            role,
            tenant_id,
            status,
            tenants:tenant_id (
              id,
              name,
              plan
            )
          `)
          .eq('email', email.toLowerCase())
          .single();

        if (userError || !userRecord) {
          throw new Error('User account not found. Please contact your workspace administrator.');
        }

        if (userRecord.role === 'owner') {
          throw new Error('Super admin accounts cannot login here. Please use the admin login page.');
        }

        // For invited users, accept email as password (development mode)
        if (userRecord.status === 'invited' && password !== email) {
          throw new Error('For invited users in development mode, please use your email address as the password.');
        }

        // Mock successful authentication for development
        const mockUser = {
          id: userRecord.id,
          email: userRecord.email
        };

        const profile = {
          role: userRecord.role,
          workspace_id: userRecord.tenant_id,
          workspace_name: userRecord.tenants?.name || 'Unknown Workspace',
          workspace_plan: userRecord.tenants?.plan || 'free',
          full_name: userRecord.name || userRecord.email.split('@')[0]
        };

        // Save credentials if requested
        if (rememberMe) {
          localStorage.setItem('user_email', email);
        } else {
          localStorage.removeItem('user_email');
        }

        // Store auth state for development
        localStorage.setItem('user_auth_user', JSON.stringify(mockUser));
        localStorage.setItem('user_auth_profile', JSON.stringify(profile));

        toast.success(`Welcome, ${profile.full_name}! (Dev Mode)`);
        navigate('/dashboard');
        return;
      }

      // Normal Supabase Auth flow
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase(),
        password,
      });

      if (error) throw error;

      if (data.user) {
        // Check if user exists in our users table and get their workspace info
        const { data: userRecord, error: userError } = await supabase
          .from('users')
          .select(`
            id,
            email,
            name,
            role,
            tenant_id,
            status,
            tenants:tenant_id (
              id,
              name,
              plan
            )
          `)
          .eq('id', data.user.id)
          .single();

        if (userError || !userRecord) {
          console.error('User lookup failed:', userError);
          await supabase.auth.signOut();
          throw new Error('User account not found. Please contact your workspace administrator.');
        }

        // Check if user is super admin (should use admin login)
        if (userRecord.role === 'owner') {
          await supabase.auth.signOut();
          throw new Error('Super admin accounts cannot login here. Please use the admin login page.');
        }

        // Check if account setup is complete
        if (userRecord.status === 'invited') {
          await supabase.auth.signOut();
          throw new Error('Account setup incomplete. Please use "Set up password" below to activate your account.');
        }

        const profile = {
          role: userRecord.role,
          workspace_id: userRecord.tenant_id,
          workspace_name: userRecord.tenants?.name || 'Unknown Workspace',
          workspace_plan: userRecord.tenants?.plan || 'free',
          full_name: userRecord.name || data.user.email?.split('@')[0] || 'User'
        };

        // Save credentials if requested
        if (rememberMe) {
          localStorage.setItem('user_email', email);
        } else {
          localStorage.removeItem('user_email');
        }

        toast.success(`Welcome back, ${profile.full_name}!`);
        navigate('/dashboard');
      }
    } catch (error: any) {
      console.error('Login error details:', error);
      
      let errorMessage = 'Login failed. Please try again.';
      
      if (error.message?.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password. Please check your credentials.';
      } else if (error.message?.includes('Failed to fetch')) {
        errorMessage = 'Connection failed. Please check your internet connection and try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      toast.error('Please enter your email address first');
      return;
    }

    setResetLoading(true);
    try {
      // First check if this user exists in our users table
      const { data: userRecord, error: userError } = await supabase
        .from('users')
        .select('id, email, status')
        .eq('email', email.toLowerCase())
        .single();

      if (userError || !userRecord) {
        throw new Error('Email not found. Please check your email address or contact your workspace administrator.');
      }

      if (userRecord.status === 'invited') {
        // For development mode, show instructions instead of trying to send real email
        toast.success(
          `Account found! Since this is development mode, please contact your administrator to complete account setup. ` +
          `Your email: ${email}`,
          { duration: 8000 }
        );
        return;
      }

      // Try the normal password reset flow
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`
      });

      if (error) throw error;

      toast.success(
        'Password setup email sent! Check your inbox and follow the link to create your password.',
        { duration: 6000 }
      );
    } catch (error: any) {
      console.error('Password reset error details:', error);
      
      let errorMessage = 'Password setup failed. Please try again.';
      if (error.message?.includes('Failed to fetch')) {
        errorMessage = 'Connection failed. Please check your internet connection and try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="rounded-full bg-blue-100 p-3 w-fit mx-auto mb-4">
            <Users className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Welcome Back</CardTitle>
          <CardDescription>
            Sign in to your SAM AI workspace
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  {error}
                </AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@company.com"
                required
                disabled={loading}
                className="pl-4"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  disabled={loading}
                  className="pl-4 pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember-me"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                disabled={loading}
              />
              <Label htmlFor="remember-me" className="text-sm text-gray-600">
                Remember my email
              </Label>
            </div>

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
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In
                </>
              )}
            </Button>
          </form>

          <div className="mt-4 text-center space-y-3">
            <div className="bg-blue-50 p-3 rounded-lg text-center">
              <p className="text-sm text-blue-800 font-medium mb-2">
                Development Mode - Invited Users
              </p>
              <p className="text-xs text-blue-700 mb-1">
                <strong>For invited users:</strong> Use your email address as the password
              </p>
              <p className="text-xs text-blue-600">
                Example: If your email is john@company.com, use "john@company.com" as password
              </p>
            </div>
            
            <button
              type="button"
              onClick={handlePasswordReset}
              disabled={resetLoading || loading}
              className="text-sm text-gray-600 hover:text-gray-800 disabled:text-gray-400"
            >
              {resetLoading ? 'Sending...' : 'Need help with account setup?'}
            </button>
          </div>

          <div className="mt-6 text-center space-y-2">
            <p className="text-xs text-gray-500">
              Don't have an account? Contact your workspace administrator
            </p>
            <Link 
              to="/admin/login" 
              className="text-xs text-gray-400 hover:text-gray-600 block"
            >
              Administrator Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}