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
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Check if accessing from allowed domain
  useEffect(() => {
    const hostname = window.location.hostname;
    const isAllowedDomain = hostname === 'innovareai.com' || 
                           hostname === 'www.innovareai.com' || 
                           hostname === 'localhost' ||
                           hostname.includes('netlify.app'); // For staging

    if (!isAllowedDomain) {
      setError('Access denied. This page is only accessible from innovareai.com domain.');
      return;
    }

    // Check if already logged in
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Check if user is super admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, workspace_id')
        .eq('id', user.id)
        .single();
      
      if (profile?.role === 'super_admin') {
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

      // Sign in with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // Check if user has super admin role
        let { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role, workspace_id, full_name')
          .eq('id', data.user.id)
          .single();

        // If profile doesn't exist, create it for admin@innovareai.com
        if (profileError && data.user.email === 'admin@innovareai.com') {
          console.log('Creating super admin profile for:', data.user.email);
          
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              workspace_id: 'a0000000-0000-0000-0000-000000000000',
              email: data.user.email,
              full_name: 'InnovareAI Administrator',
              role: 'super_admin'
            })
            .select('role, workspace_id, full_name')
            .single();
          
          if (createError) {
            console.error('Failed to create super admin profile:', createError);
            throw new Error('Failed to create admin profile. Contact system administrator.');
          }
          
          profile = newProfile;
        } else if (profileError || !profile) {
          throw new Error('User profile not found. Contact system administrator.');
        }

        if (profile.role !== 'super_admin') {
          await supabase.auth.signOut();
          throw new Error('Access denied. Super admin privileges required.');
        }

        toast.success(`Welcome back, ${profile.full_name || 'Admin'}!`);
        navigate('/admin/dashboard');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const hostname = window.location.hostname;
  const isAllowedDomain = hostname === 'innovareai.com' || 
                         hostname === 'www.innovareai.com' || 
                         hostname === 'localhost' ||
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