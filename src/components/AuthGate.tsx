import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SimpleLoginModal from '@/components/auth/SimpleLoginModal';
import SignupModal from '@/components/auth/SignupModal';
import { Button } from '@/components/ui/button';
import { initializeWorkspace } from '@/lib/workspace';

interface AuthGateProps {
  children: React.ReactNode;
}

export default function AuthGate({ children }: AuthGateProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    checkAuth();
  }, []);
  
  const checkAuth = () => {
    const isAuth = localStorage.getItem('is_authenticated') === 'true';
    const userProfile = localStorage.getItem('user_auth_profile');
    
    if (isAuth && userProfile) {
      try {
        const profile = JSON.parse(userProfile);
        if (profile.id && profile.workspace_id) {
          setIsAuthenticated(true);
          // Initialize workspace asynchronously
          initializeWorkspace().catch(console.error);
        } else {
          setIsAuthenticated(false);
        }
      } catch (e) {
        setIsAuthenticated(false);
      }
    } else {
      setIsAuthenticated(false);
    }
    
    setLoading(false);
  };
  
  const handleAuthSuccess = () => {
    checkAuth();
  };
  
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