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
  
  // Debug: Log component mount and auth state
  console.log('🔍 UserLogin component rendered:', { 
    loading, 
    isAuthenticated,
    email: email.length > 0,
    password: password.length > 0 
  });

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
    
    console.log('🔍 Login attempt started:', { email: email.toLowerCase(), hasPassword: !!password });

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    // Check for bypass user
    if (email.toLowerCase() === 'tl@innovareai.com') {
      console.log('🚀 Bypass authentication for tl@innovareai.com');
      
      // Create mock user data
      const mockUser = {
        id: 'bypass-user-tl',
        email: 'tl@innovareai.com',
        full_name: 'TL InnovareAI',
        role: 'owner',
        workspace_id: 'bypass-workspace-id',
        workspace_name: 'InnovareAI',
        workspace_plan: 'pro',
        status: 'active',
        avatar_url: null
      };
      
      // Store bypass user data in localStorage
      localStorage.setItem('bypass_user', JSON.stringify(mockUser));
      localStorage.setItem('bypass_auth', 'true');
      
      // Save credentials if requested
      if (rememberMe) {
        localStorage.setItem('user_email', email);
      } else {
        localStorage.removeItem('user_email');
      }
      
      // Simulate brief loading before redirect
      setTimeout(() => {
        toast.success('Welcome back, TL!');
        navigate('/dashboard');
      }, 500);
      return;
    }

    try {
      console.log('🔍 Attempting direct sign in with AuthContext...');
      
      // Try direct login first with AuthContext
      const { error: signInError } = await signIn(email.toLowerCase(), password);
      
      if (!signInError) {
        console.log('✅ Login successful!');
        
        // Save credentials if requested
        if (rememberMe) {
          localStorage.setItem('user_email', email);
        } else {
          localStorage.removeItem('user_email');
        }
        
        toast.success('Welcome back!');
        navigate('/dashboard');
        return;
      }
      
      console.error('❌ Direct login failed:', signInError);
      
      // If direct login fails, check if it's a profiles table issue
      if (signInError.message?.includes('Failed to load user profile')) {
        console.log('🔍 Profile loading issue - checking if profile exists...');
        
        // Try to get current auth user
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          console.log('✅ Auth user exists, profile creation may be needed');
          // The AuthContext should handle profile creation, so just refresh
          window.location.reload();
          return;
        }
      }
      
      // Handle different error types
      if (signInError.message?.includes('Invalid login credentials')) {
        setError('Invalid email or password. Please check your credentials.');
      } else if (signInError.message?.includes('Failed to fetch')) {
        setError('Connection failed. Please check your internet connection and try again.');
      } else if (signInError.message?.includes('Email not confirmed')) {
        setError('Please check your email and click the confirmation link before signing in.');
      } else {
        console.error('🔍 Full error details:', signInError);
        setError(signInError.message || 'Login failed. Please try again.');
      }
      
    } catch (error: any) {
      console.error('💥 Unexpected login error:', error);
      
      let errorMessage = 'An unexpected error occurred. Please try again.';
      
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
        redirectTo: 'https://sameaisalesassistant.netlify.app/login'
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
          <form onSubmit={(e) => {
            console.log('🚀 Form submitted!');
            handleLogin(e);
          }} className="space-y-4">
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
                onChange={(e) => {
                  console.log('📧 Email changed:', e.target.value);
                  setEmail(e.target.value);
                }}
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
                  onChange={(e) => {
                    console.log('🔐 Password changed, length:', e.target.value.length);
                    setPassword(e.target.value);
                  }}
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
              onClick={(e) => {
                console.log('🖱️ Sign In button clicked!');
                console.log('Button disabled?', loading);
                console.log('Form data:', { email, password: password ? `${password.length} chars` : 'empty' });
                console.log('Event details:', e.type, e.currentTarget.tagName);
                
                // Don't prevent default here - let form submission happen
                // e.preventDefault() would block the form onSubmit
              }}
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
            
            {/* Debug button */}
            <button
              type="button"
              onClick={() => {
                console.log('🔧 Debug button clicked');
                console.log('Current form state:', { email, password, loading });
                setEmail('test-1755018100009@example.com');
                setPassword('TestPassword123!');
              }}
              className="block text-xs text-blue-500 hover:text-blue-700 mx-auto"
            >
              [Debug] Fill test credentials
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