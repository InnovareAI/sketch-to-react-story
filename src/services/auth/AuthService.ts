import { supabase } from '@/lib/supabase';
import { User, Session } from '@supabase/supabase-js';

export interface AuthUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  workspaceId?: string;
  permissions?: Record<string, boolean>;
}

export interface SignUpData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  companyName?: string;
  inviteToken?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

class AuthService {
  private static instance: AuthService;
  private currentUser: AuthUser | null = null;
  private session: Session | null = null;

  private constructor() {
    this.initializeAuth();
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  private async initializeAuth() {
    // Check for existing session
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      this.session = session;
      await this.loadUserProfile(session.user.id);
    }

    // Listen for auth changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      this.session = session;
      if (session) {
        await this.loadUserProfile(session.user.id);
      } else {
        this.currentUser = null;
      }
    });
  }

  private async loadUserProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, workspaces!inner(*)')
        .eq('id', userId)
        .single();

      if (error) throw error;

      this.currentUser = {
        id: data.id,
        email: data.email,
        firstName: data.first_name,
        lastName: data.last_name,
        role: data.role,
        workspaceId: data.workspace_id,
        permissions: data.permissions
      };
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  }

  async signUp(data: SignUpData): Promise<{ user: AuthUser | null; error: Error | null }> {
    try {
      // Check if this is an invite signup
      if (data.inviteToken) {
        return await this.signUpWithInvite(data);
      }

      // Regular signup with workspace creation
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            first_name: data.firstName,
            last_name: data.lastName
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('No user returned from signup');

      // Create workspace if company name provided
      let workspaceId = null;
      if (data.companyName) {
        const { data: workspace, error: workspaceError } = await supabase
          .from('workspaces')
          .insert({
            name: data.companyName,
            owner_id: authData.user.id,
            settings: {
              features: {
                linkedin: true,
                email: true,
                ai: true,
                workflows: true
              },
              limits: {
                users: 10,
                linkedin_accounts: 5,
                monthly_messages: 1000
              }
            }
          })
          .select()
          .single();

        if (workspaceError) {
          console.error('Workspace creation error:', workspaceError);
        } else {
          workspaceId = workspace.id;
        }
      }

      // Create user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: data.email,
          first_name: data.firstName,
          last_name: data.lastName,
          workspace_id: workspaceId,
          role: 'admin', // First user is admin
          permissions: {
            all: true // Admin has all permissions
          }
        })
        .select()
        .single();

      if (profileError) {
        console.error('Profile creation error:', profileError);
      }

      const user: AuthUser = {
        id: authData.user.id,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        role: 'admin',
        workspaceId: workspaceId || undefined,
        permissions: { all: true }
      };

      this.currentUser = user;
      return { user, error: null };
    } catch (error: any) {
      return { user: null, error };
    }
  }

  private async signUpWithInvite(data: SignUpData): Promise<{ user: AuthUser | null; error: Error | null }> {
    try {
      // Validate invite token
      const { data: invite, error: inviteError } = await supabase
        .from('user_invites')
        .select('*')
        .eq('id', data.inviteToken)
        .eq('email', data.email)
        .eq('status', 'pending')
        .single();

      if (inviteError || !invite) {
        throw new Error('Invalid or expired invitation');
      }

      // Check if invite is expired
      if (new Date(invite.expires_at) < new Date()) {
        throw new Error('Invitation has expired');
      }

      // Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            first_name: invite.first_name || data.firstName,
            last_name: invite.last_name || data.lastName
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('No user returned from signup');

      // Create user profile with invite data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: data.email,
          first_name: invite.first_name || data.firstName,
          last_name: invite.last_name || data.lastName,
          workspace_id: invite.workspace_id,
          role: invite.role,
          department: invite.department,
          permissions: invite.permissions
        })
        .select()
        .single();

      if (profileError) throw profileError;

      // Update invite status
      await supabase
        .from('user_invites')
        .update({ status: 'accepted', accepted_at: new Date().toISOString() })
        .eq('id', data.inviteToken);

      const user: AuthUser = {
        id: authData.user.id,
        email: data.email,
        firstName: invite.first_name || data.firstName,
        lastName: invite.last_name || data.lastName,
        role: invite.role,
        workspaceId: invite.workspace_id,
        permissions: invite.permissions
      };

      this.currentUser = user;
      return { user, error: null };
    } catch (error: any) {
      return { user: null, error };
    }
  }

  async signIn(data: SignInData): Promise<{ user: AuthUser | null; error: Error | null }> {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('No user returned from signin');

      await this.loadUserProfile(authData.user.id);
      
      return { user: this.currentUser, error: null };
    } catch (error: any) {
      return { user: null, error };
    }
  }

  async signOut(): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      this.currentUser = null;
      this.session = null;
      
      return { error: null };
    } catch (error: any) {
      return { error };
    }
  }

  async resetPassword(email: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });
      
      if (error) throw error;
      return { error: null };
    } catch (error: any) {
      return { error };
    }
  }

  async updatePassword(newPassword: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
      return { error: null };
    } catch (error: any) {
      return { error };
    }
  }

  async updateProfile(updates: Partial<AuthUser>): Promise<{ user: AuthUser | null; error: Error | null }> {
    try {
      if (!this.currentUser) throw new Error('No user logged in');

      const { data, error } = await supabase
        .from('profiles')
        .update({
          first_name: updates.firstName,
          last_name: updates.lastName,
          // Add other fields as needed
        })
        .eq('id', this.currentUser.id)
        .select()
        .single();

      if (error) throw error;

      // Update local user
      this.currentUser = {
        ...this.currentUser,
        ...updates
      };

      return { user: this.currentUser, error: null };
    } catch (error: any) {
      return { user: null, error };
    }
  }

  getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }

  getSession(): Session | null {
    return this.session;
  }

  isAuthenticated(): boolean {
    return !!this.session;
  }

  hasPermission(permission: string): boolean {
    if (!this.currentUser) return false;
    
    // Admin has all permissions
    if (this.currentUser.role === 'admin' || this.currentUser.permissions?.all) {
      return true;
    }
    
    // Check specific permission
    return !!this.currentUser.permissions?.[permission];
  }

  async refreshSession(): Promise<{ error: Error | null }> {
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();
      if (error) throw error;
      
      this.session = session;
      if (session) {
        await this.loadUserProfile(session.user.id);
      }
      
      return { error: null };
    } catch (error: any) {
      return { error };
    }
  }
}

export const authService = AuthService.getInstance();