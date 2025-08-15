import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import SimpleLoginModal from '@/components/auth/SimpleLoginModal';
import SignupModal from '@/components/auth/SignupModal';
import { Button } from '@/components/ui/button';
import { initializeWorkspace } from '@/lib/workspace';
import { supabase } from '@/integrations/supabase/client';

interface AuthGateProps {
  children: React.ReactNode;
}

export default function AuthGate({ children }: AuthGateProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  
  // Define public routes that don't require authentication
  const publicRoutes = [
    '/follow-ups-public',
    '/follow-ups',
    '/test-inbox',
    '/inbox-direct',
    '/simple-inbox',
    '/linkedin-setup',
    '/linkedin-manager',
    '/linkedin-diagnostic',
    '/linkedin-onboarding',
    '/onboarding',
    '/login',
    '/auth/login',
    '/admin/login'
  ];
  
  // Check if current route is public
  const isPublicRoute = publicRoutes.some(route => location.pathname.startsWith(route));
  
  useEffect(() => {
    checkAuth();
  }, []);
  
  const checkAuth = async () => {
    try {
      // Check for existing Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // User is authenticated with Supabase, check if profile exists
        const isAuth = localStorage.getItem('is_authenticated') === 'true';
        const userProfile = localStorage.getItem('user_auth_profile');
        
        if (isAuth && userProfile) {
          try {
            const profile = JSON.parse(userProfile);
            if (profile.id && profile.workspace_id) {
              setIsAuthenticated(true);
              // Initialize workspace asynchronously
              initializeWorkspace().catch(console.error);
              setLoading(false);
              return;
            }
          } catch (e) {
            // Clear bad data
            localStorage.removeItem('is_authenticated');
            localStorage.removeItem('user_auth_profile');
          }
        }
      }
      
      // No valid session or profile, user needs to authenticate
      setIsAuthenticated(false);
      setLoading(false);
    } catch (error) {
      console.error('Error checking auth:', error);
      setIsAuthenticated(false);
      setLoading(false);
    }
  };
  
  const handleAuthSuccess = () => {
    // After successful auth, check if we have valid credentials now
    if (checkAuthFromStorage()) {
      return; // Already authenticated
    }
    
    // Give a moment for auth to complete, then try again
    setTimeout(() => {
      if (checkAuthFromStorage()) {
        return;
      }
      
      // Still not authenticated, recheck auth state
      checkAuth();
    }, 500);
  };
  
  const checkAuthFromStorage = () => {
    const isAuth = localStorage.getItem('is_authenticated') === 'true';
    const userProfile = localStorage.getItem('user_auth_profile');
    
    if (isAuth && userProfile) {
      try {
        const profile = JSON.parse(userProfile);
        if (profile.id && profile.workspace_id) {
          setIsAuthenticated(true);
          // Initialize workspace asynchronously
          initializeWorkspace().catch(console.error);
          return true;
        }
      } catch (e) {
        // Clear bad data
        localStorage.removeItem('is_authenticated');
        localStorage.removeItem('user_auth_profile');
      }
    }
    
    return false;
  };
  
  // Allow public routes to bypass authentication entirely
  if (isPublicRoute) {
    return <>{children}</>;
  }
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="max-w-md w-full mx-auto p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">SAM AI</h1>
            <p className="text-gray-600">Sales AI Assistant Platform</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Welcome</h2>
            <p className="text-gray-600 mb-6">
              Please sign in or create an account to continue
            </p>
            
            <div className="space-y-3">
              <Button 
                className="w-full" 
                size="lg"
                onClick={() => setShowLogin(true)}
              >
                Sign In
              </Button>
              
              <Button 
                className="w-full" 
                size="lg" 
                variant="outline"
                onClick={() => setShowSignup(true)}
              >
                Create Account
              </Button>
            </div>
          </div>
        </div>
        
        <SimpleLoginModal
          isOpen={showLogin}
          onClose={() => setShowLogin(false)}
          onSuccess={handleAuthSuccess}
          onSignupClick={() => {
            setShowLogin(false);
            setShowSignup(true);
          }}
        />
        
        <SignupModal
          isOpen={showSignup}
          onClose={() => setShowSignup(false)}
          onSuccess={handleAuthSuccess}
        />
      </div>
    );
  }
  
  return <>{children}</>;
}