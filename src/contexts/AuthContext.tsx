/**
 * Authentication Context
 * Provides centralized authentication state management
 * with proper workspace isolation and user data
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  workspace_id: string;
  workspace_name: string;
  workspace_plan: string;
  status: string;
}

export interface AuthContextType {
  user: UserProfile | null;
  authUser: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUserProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
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
        .eq('id', userId)
        .single();

      if (userError) {
        console.error('Error loading user profile:', userError);
        return null;
      }

      if (!userRecord) {
        console.error('No user record found');
        return null;
      }

      // Format user profile
      const userProfile: UserProfile = {
        id: userRecord.id,
        email: userRecord.email,
        full_name: userRecord.name ? 
          (userRecord.name.length > 2 ? 
            userRecord.name.charAt(0).toUpperCase() + userRecord.name.slice(1) : 
            userRecord.name.toUpperCase()
          ) : 
          userRecord.email.split('@')[0].toUpperCase(),
        role: userRecord.role,
        workspace_id: userRecord.tenant_id,
        workspace_name: userRecord.tenants?.name || 'Unknown Workspace',
        workspace_plan: userRecord.tenants?.plan || 'free',
        status: userRecord.status || 'active'
      };

      return userProfile;
    } catch (error) {
      console.error('Error in loadUserProfile:', error);
      return null;
    }
  };

  const refreshUser = async () => {
    if (!authUser) return;
    
    const profile = await loadUserProfile(authUser.id);
    setUser(profile);
  };

  const signIn = async (email: string, password: string): Promise<{ error: Error | null }> => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return { error };
      }

      if (data.user) {
        setAuthUser(data.user);
        const profile = await loadUserProfile(data.user.id);
        setUser(profile);
        
        if (!profile) {
          await supabase.auth.signOut();
          return { error: new Error('Failed to load user profile') };
        }
      }

      return { error: null };
    } catch (error: any) {
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setAuthUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Error signing out');
    }
  };

  // Initialize auth state and listen for changes
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setLoading(false);
          return;
        }

        if (session?.user && mounted) {
          setAuthUser(session.user);
          const profile = await loadUserProfile(session.user.id);
          if (mounted) {
            setUser(profile);
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log('Auth state changed:', event, session?.user?.id);

        if (session?.user) {
          setAuthUser(session.user);
          const profile = await loadUserProfile(session.user.id);
          setUser(profile);
        } else {
          setAuthUser(null);
          setUser(null);
        }
        
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const contextValue: AuthContextType = {
    user,
    authUser,
    loading,
    signIn,
    signOut,
    refreshUser,
    isAuthenticated: !!authUser && !!user
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};