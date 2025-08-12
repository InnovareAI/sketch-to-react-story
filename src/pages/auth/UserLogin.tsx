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
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export default function UserLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { signIn, loading, isAuthenticated } = useAuth();

  useEffect(() => {
    // Load saved email if exists
    const savedEmail = localStorage.getItem('user_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }

    // Check if already logged in
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      // First check if user exists in our users table
      const { data: userRecord, error: userError } = await supabase
        .from('users')
        .select('id, email, status')
        .eq('email', email.toLowerCase())
        .single();

      if (userError || !userRecord) {
        setError('Email not found. Please check your email address or contact your workspace administrator.');
        return;
      }

      if (userRecord.status === 'invited') {
        // User exists but hasn't completed signup - create auth account
        try {
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: email.toLowerCase(),
            password: password,
            options: {
              data: {
                user_id: userRecord.id
              }
            }
          });

          if (signUpError) {
            console.error('Signup error:', signUpError);
            setError('Failed to create account. Please try again or contact support.');
            return;
          }

          // Update user status to active
          await supabase
            .from('users')
            .update({ status: 'active' })
            .eq('id', userRecord.id);

          toast.success('Account created! Welcome to SAM AI!');
          navigate('/dashboard');
          return;
        } catch (signupError) {
          console.error('Account creation error:', signupError);
          setError('Failed to create account. Please try again.');
          return;
        }
      }

      // Normal login flow
      const { error } = await signIn(email.toLowerCase(), password);
      
      if (error) {
        throw error;
      }

      // Save credentials if requested
      if (rememberMe) {
        localStorage.setItem('user_email', email);
      } else {
        localStorage.removeItem('user_email');
      }

      toast.success('Welcome back!');
      navigate('/dashboard');
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
        toast.info(
          'Your account is ready! Please enter a password to complete your setup.',
          { duration: 6000 }
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
            <button
              type="button"
              onClick={handlePasswordReset}
              disabled={resetLoading || loading}
              className="text-sm text-gray-600 hover:text-gray-800 disabled:text-gray-400"
            >
              {resetLoading ? 'Sending...' : 'Forgot your password?'}
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