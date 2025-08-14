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
  avatar_url?: string | null;
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
  const [loading, setLoading] = useState(true); // Start with loading true for proper auth check

  // Check for bypass user on mount
  const checkBypassUser = (): UserProfile | null => {
    const bypassAuth = localStorage.getItem('bypass_auth');
    const bypassUserData = localStorage.getItem('bypass_user');
    
    if (bypassAuth === 'true' && bypassUserData) {
      try {
        return JSON.parse(bypassUserData) as UserProfile;
      } catch (error) {
        console.error('Error parsing bypass user data:', error);
        localStorage.removeItem('bypass_auth');
        localStorage.removeItem('bypass_user');
      }
    }
    return null;
  };

  // Timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      console.log('Auth loading timeout - forcing loading to false');
      setLoading(false);
    }, 5000);
    
    return () => clearTimeout(timeout);
  }, []);

  const createMissingProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      console.log('Creating missing profile for user:', userId);
      
      // Get user email from auth
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser?.email) {
        console.error('No authenticated user email found');
        return null;
      }

      // Create a new workspace for this user
      let workspaceId = crypto.randomUUID();
      
      const { data: workspace, error: workspaceError } = await supabase
        .from('workspaces')
        .select('*')
        .eq('id', workspaceId)
        .single();
      
      if (workspaceError && workspaceError.code === 'PGRST116') {
        // Create default workspace
        const { data: newWorkspace, error: createWorkspaceError } = await supabase
          .from('workspaces')
          .insert({
            id: workspaceId,
            name: `${authUser.email.split('@')[0]}'s Workspace`,
            slug: authUser.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, ''),
            subscription_tier: 'pro'
          })
          .select()
          .single();
          
        if (createWorkspaceError) {
          console.error('Failed to create default workspace:', createWorkspaceError);
          return null;
        }
        console.log('Default workspace created:', newWorkspace);
      }

      // Create profile
      const { data: newProfile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: authUser.email,
          full_name: authUser.user_metadata?.full_name || authUser.email.split('@')[0],
          workspace_id: workspaceId,
          role: 'owner'
        })
        .select(`
          id,
          email,
          full_name,
          role,
          workspace_id,
          avatar_url,
          workspaces:workspace_id (
            id,
            name,
            subscription_tier
          )
        `)
        .single();

      if (profileError) {
        console.error('Failed to create profile:', profileError);
        return null;
      }

      console.log('Profile created successfully:', newProfile);
      
      // Format user profile
      const userProfile: UserProfile = {
        id: newProfile.id,
        email: newProfile.email,
        full_name: newProfile.full_name ? 
          (newProfile.full_name.length > 2 ? 
            newProfile.full_name.charAt(0).toUpperCase() + newProfile.full_name.slice(1) : 
            newProfile.full_name.toUpperCase()
          ) : 
          newProfile.email.split('@')[0].toUpperCase(),
        role: newProfile.role || 'owner',
        workspace_id: newProfile.workspace_id,
        workspace_name: newProfile.workspaces?.name || 'Unknown Workspace',
        workspace_plan: newProfile.workspaces?.subscription_tier || 'free',
        status: 'active',
        avatar_url: newProfile.avatar_url
      };

      return userProfile;
    } catch (error) {
      console.error('Error creating missing profile:', error);
      return null;
    }
  };

  const loadUserProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      console.log('Loading user profile for userId:', userId);
      
      const { data: userRecord, error: userError } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          full_name,
          role,
          workspace_id,
          avatar_url,
          workspaces:workspace_id (
            id,
            name,
            subscription_tier
          )
        `)
        .eq('id', userId)
        .single();

      if (userError) {
        console.error('Error loading user profile:', userError);
        console.error('Supabase error details:', {
          message: userError.message,
          details: userError.details,
          hint: userError.hint,
          code: userError.code
        });
        
        // If profile doesn't exist, try to create one
        if (userError.code === 'PGRST116') {
          console.log('Profile not found, attempting to create one...');
          return await createMissingProfile(userId);
        }
        
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
        full_name: userRecord.full_name ? 
          (userRecord.full_name.length > 2 ? 
            userRecord.full_name.charAt(0).toUpperCase() + userRecord.full_name.slice(1) : 
            userRecord.full_name.toUpperCase()
          ) : 
          userRecord.email.split('@')[0].toUpperCase(),
        role: userRecord.role || 'member',
        workspace_id: userRecord.workspace_id,
        workspace_name: userRecord.workspaces?.name || 'Unknown Workspace',
        workspace_plan: userRecord.workspaces?.subscription_tier || 'free',
        status: 'active',
        avatar_url: userRecord.avatar_url
      };

      return userProfile;
    } catch (error) {
      console.error('Error in loadUserProfile:', error);
      return null;
    }
  };

  const refreshUser = async () => {
    // Check if this is a bypass user
    const bypassAuth = localStorage.getItem('bypass_auth');
    if (bypassAuth === 'true') {
      const bypassUser = checkBypassUser();
      if (bypassUser) {
        setUser(bypassUser);
      }
      return;
    }
    
    if (!authUser) return;
    
    const profile = await loadUserProfile(authUser.id);
    setUser(profile);
  };

  const signIn = async (email: string, password: string): Promise<{ error: Error | null }> => {
    try {
      console.log('AuthContext signIn called:', { email });
      setLoading(true);
      
      // Check for bypass users
      const bypassEmails = ['tl@innovareai.com', 'cl@innovareai.com', 'cs@innovareai.com'];
      if (bypassEmails.includes(email.toLowerCase())) {
        console.log(`Using bypass authentication for ${email}`);
        
        // Create mock user profile based on email
        const userEmail = email.toLowerCase();
        let mockUser: UserProfile;
        
        if (userEmail === 'cl@innovareai.com') {
          mockUser = {
            id: 'cc000000-0000-0000-0000-000000000001',
            email: userEmail,
            full_name: 'Christopher Lee',
            role: 'admin',
            workspace_id: null, // Will be set dynamically
            workspace_name: 'Loading...',
            workspace_plan: 'pro',
            status: 'active',
            avatar_url: null
          };
        } else if (userEmail === 'cs@innovareai.com') {
          mockUser = {
            id: 'cc000000-0000-0000-0000-000000000003',
            email: userEmail,
            full_name: 'Charissa Saniel',
            role: 'member',
            workspace_id: null, // Will be set dynamically
            workspace_name: 'Loading...',
            workspace_plan: 'pro',
            status: 'active',
            avatar_url: null
          };
        } else {
          // TL
          mockUser = {
            id: 'cc000000-0000-0000-0000-000000000002',
            email: userEmail,
            full_name: 'Thorsten Linz',
            role: 'owner',
            workspace_id: null, // Will be set dynamically
            workspace_name: 'Loading...',
            workspace_plan: 'pro',
            status: 'active',
            avatar_url: null
          };
        }
        
        // Create mock auth user
        const mockAuthUser = {
          id: mockUser.id,
          email: mockUser.email,
          user_metadata: { full_name: mockUser.full_name }
        } as User;
        
        // Store bypass data in localStorage
        localStorage.setItem('bypass_user', JSON.stringify(mockUser));
        localStorage.setItem('bypass_auth', 'true');
        // Also store in the key that other components expect
        localStorage.setItem('user_auth_profile', JSON.stringify(mockUser));
        
        setAuthUser(mockAuthUser);
        setUser(mockUser);
        
        console.log('Bypass authentication successful:', mockUser.email);
        
        return { error: null };
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('❌ Supabase auth error:', error);
        return { error };
      }

      console.log('✅ Supabase auth successful:', { userId: data.user?.id });

      if (data.user) {
        setAuthUser(data.user);
        console.log('🔄 Loading user profile...');
        
        const profile = await loadUserProfile(data.user.id);
        setUser(profile);
        
        if (!profile) {
          console.error('❌ Profile loading failed, signing out user');
          await supabase.auth.signOut();
          return { error: new Error('Failed to load user profile') };
        }
        
        console.log('✅ Profile loaded successfully:', profile.email);
      }

      return { error: null };
    } catch (error: any) {
      console.error('💥 Unexpected error in signIn:', error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      // Check if this is a bypass user
      const bypassAuth = localStorage.getItem('bypass_auth');
      if (bypassAuth === 'true') {
        // Clear bypass data
        localStorage.removeItem('bypass_auth');
        localStorage.removeItem('bypass_user');
        console.log('🚀 Bypass user signed out');
      } else {
        await supabase.auth.signOut();
      }
      
      setUser(null);
      setAuthUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Error signing out');
    }
  };

  // Initialize auth state and listen for changes
  useEffect(() => {
    console.log('Initializing authentication system...');
    
    // Get initial session
    const initializeAuth = async () => {
      try {
        // First check for bypass user
        const bypassUser = checkBypassUser();
        if (bypassUser) {
          console.log('🚀 Found bypass user on initialization:', bypassUser.email);
          setUser(bypassUser);
          // Ensure user_auth_profile is also set
          localStorage.setItem('user_auth_profile', JSON.stringify(bypassUser));
          // Create mock auth user for bypass
          const mockAuthUser = {
            id: bypassUser.id,
            email: bypassUser.email,
            user_metadata: { full_name: bypassUser.full_name }
          } as User;
          setAuthUser(mockAuthUser);
          setLoading(false);
          return;
        }
        
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          console.log('Found existing session for user:', session.user.id);
          setAuthUser(session.user);
          const profile = await loadUserProfile(session.user.id);
          if (profile) {
            setUser(profile);
            console.log('User profile loaded successfully:', profile.email);
          } else {
            console.error('Failed to load user profile');
          }
        } else {
          console.log('No existing session found');
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
    
    // Listen for auth state changes (but not for bypass users)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        
        // Don't override bypass user state
        const bypassAuth = localStorage.getItem('bypass_auth');
        if (bypassAuth === 'true') {
          console.log('🚀 Ignoring auth state change for bypass user');
          return;
        }
        
        if (session?.user) {
          setAuthUser(session.user);
          const profile = await loadUserProfile(session.user.id);
          if (profile) {
            setUser(profile);
          }
        } else {
          setAuthUser(null);
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => {
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
    isAuthenticated: !!user // Return true if user profile exists (covers both bypass and regular auth)
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};