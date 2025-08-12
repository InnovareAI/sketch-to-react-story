/**
 * Super Admin Login Page
 * Restricted access for innovareai.com domain only
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Lock, 
  Eye, 
  EyeOff, 
  Loader2,
  Shield,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function SuperAdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [savePassword, setSavePassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Check if accessing from allowed domain and load saved credentials
  useEffect(() => {
    const hostname = window.location.hostname;
    const isAllowedDomain = hostname === 'innovareai.com' || 
                           hostname === 'www.innovareai.com' || 
                           hostname.includes('netlify.app'); // For staging

    if (!isAllowedDomain) {
      setError('Access denied. This page is only accessible from innovareai.com domain.');
      return;
    }

    // Check for dev auth state and clear if needed
    const devAuthUser = localStorage.getItem('dev_auth_user');
    if (devAuthUser) {
      console.log('Development auth state detected:', devAuthUser);
    }

    // Load saved credentials
    const savedEmail = localStorage.getItem('superadmin_email');
    const savedPassword = localStorage.getItem('superadmin_password');
    
    if (savedEmail) {
      setEmail(savedEmail);
      setSavePassword(true);
    }
    if (savedPassword) {
      setPassword(savedPassword);
    }

    // Check if already logged in
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Check if user is owner (super admin)
      const { data: userRecord } = await supabase
        .from('users')
        .select('role, tenant_id')
        .eq('id', user.id)
        .single();
      
      if (userRecord?.role === 'owner') {
        navigate('/admin/dashboard');
        return;
      }
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate email domain for super admin
      if (!email.endsWith('@innovareai.com')) {
        throw new Error('Super admin access requires @innovareai.com email address');
      }

      // TEMPORARY DEV BYPASS: If this is the known admin email and password, skip Supabase Auth
      if (email === 'admin@innovareai.com' && password === 'dev123') {
        console.log('Using development bypass for admin login');
        
        // Mock successful authentication data
        const mockUser = {
          id: '73a184bc-ec9b-4ca2-b7c6-301ba08cfc97',
          email: 'admin@innovareai.com'
        };

        // Directly check the users table
        const { data: userRecord, error: userError } = await supabase
          .from('users')
          .select('role, tenant_id, name, organization_id')
          .eq('id', mockUser.id)
          .single();

        if (userError || !userRecord) {
          throw new Error(`User record not found: ${userError?.message || 'Unknown error'}`);
        }

        if (userRecord.role !== 'owner') {
          throw new Error('Access denied. Super admin privileges required.');
        }

        // Get user profile for display name
        const { data: userProfile } = await supabase
          .from('user_profiles')
          .select('first_name, last_name')
          .eq('id', mockUser.id)
          .single();

        const profile = {
          role: userRecord.role,
          workspace_id: userRecord.tenant_id,
          full_name: userProfile ? `${userProfile.first_name} ${userProfile.last_name}`.trim() : userRecord.name || 'Administrator'
        };

        // Save credentials if requested
        if (savePassword) {
          localStorage.setItem('superadmin_email', email);
          localStorage.setItem('superadmin_password', password);
        } else {
          localStorage.removeItem('superadmin_email');
          localStorage.removeItem('superadmin_password');
        }

        // Store mock auth state
        localStorage.setItem('dev_auth_user', JSON.stringify(mockUser));
        localStorage.setItem('dev_auth_profile', JSON.stringify(profile));

        toast.success(`Welcome back, ${profile.full_name || 'Admin'}! (Dev Mode)`);
        navigate('/admin/dashboard');
        return;
      }

      // Normal Supabase Auth flow
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // Check if user has super admin role in users table
        let { data: userRecord, error: userError } = await supabase
          .from('users')
          .select('role, tenant_id, name, organization_id')
          .eq('id', data.user.id)
          .single();

        if (userError || !userRecord) {
          console.error('User lookup failed:', userError);
          throw new Error(`User record not found: ${userError?.message || 'Unknown error'}`);
        }

        // Check if user is owner (equivalent to super admin in this system)
        if (userRecord.role !== 'owner') {
          await supabase.auth.signOut();
          throw new Error('Access denied. Super admin privileges required.');
        }

        // Get user profile for display name
        const { data: userProfile } = await supabase
          .from('user_profiles')
          .select('first_name, last_name')
          .eq('id', data.user.id)
          .single();

        const profile = {
          role: userRecord.role,
          workspace_id: userRecord.tenant_id,
          full_name: userProfile ? `${userProfile.first_name} ${userProfile.last_name}`.trim() : userRecord.name || 'Administrator'
        };

        // Save credentials if requested
        if (savePassword) {
          localStorage.setItem('superadmin_email', email);
          localStorage.setItem('superadmin_password', password);
        } else {
          // Clear saved credentials if unchecked
          localStorage.removeItem('superadmin_email');
          localStorage.removeItem('superadmin_password');
        }

        toast.success(`Welcome back, ${profile.full_name || 'Admin'}!`);
        navigate('/admin/dashboard');
      }
    } catch (error: any) {
      console.error('Login error details:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Login failed. Please try again.';
      
      if (error.message?.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password. Please check your credentials.';
      } else if (error.message?.includes('Failed to fetch')) {
        errorMessage = 'Connection failed. Please check your internet connection and try again.';
      } else if (error.message?.includes('User record not found')) {
        errorMessage = 'User account not found. Please contact support.';
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

    if (!email.endsWith('@innovareai.com')) {
      toast.error('Password reset only available for @innovareai.com emails');
      return;
    }

    setResetLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://sameaisalesassistant.netlify.app/admin/login'
      });

      if (error) throw error;

      toast.success('Password reset email sent! Check your inbox.');
    } catch (error: any) {
      console.error('Password reset error details:', error);
      
      let errorMessage = 'Password reset failed. Please try again.';
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

  const hostname = window.location.hostname;
  const isAllowedDomain = hostname === 'innovareai.com' || 
                         hostname === 'www.innovareai.com' || 
                         hostname.includes('netlify.app');

  if (!isAllowedDomain) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="rounded-full bg-red-100 p-3 w-fit mx-auto mb-4">
              <Shield className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-2xl">Access Restricted</CardTitle>
            <CardDescription>
              This page is only accessible from the innovareai.com domain.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>Current domain:</strong> {hostname}
                <br />
                <strong>Required domain:</strong> innovareai.com
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="rounded-full bg-blue-100 p-3 w-fit mx-auto mb-4">
            <Shield className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Super Admin Login</CardTitle>
          <CardDescription>
            Access restricted to InnovareAI administrators
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
                placeholder="admin@innovareai.com"
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
                id="save-password"
                checked={savePassword}
                onCheckedChange={(checked) => setSavePassword(checked as boolean)}
                disabled={loading}
              />
              <Label htmlFor="save-password" className="text-sm text-gray-600">
                Save password for this device
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
                  <Lock className="mr-2 h-4 w-4" />
                  Sign In
                </>
              )}
            </Button>
          </form>

          <div className="mt-4 text-center space-y-2">
            <button
              type="button"
              onClick={handlePasswordReset}
              disabled={resetLoading || loading}
              className="text-sm text-blue-600 hover:text-blue-500 disabled:text-gray-400 block mx-auto"
            >
              {resetLoading ? 'Sending...' : 'Forgot your password?'}
            </button>
            
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem('dev_auth_user');
                localStorage.removeItem('dev_auth_profile');
                localStorage.removeItem('superadmin_email');
                localStorage.removeItem('superadmin_password');
                setEmail('');
                setPassword('');
                setSavePassword(false);
                toast.success('Development state cleared');
              }}
              className="text-xs text-red-600 hover:text-red-500 block mx-auto"
            >
              Clear Development State
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Super admin access only • InnovareAI Systems
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}