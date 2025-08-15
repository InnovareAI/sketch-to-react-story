/**
 * Simple auth utility for demo purposes
 * Sets up a default user context to work with RLS policies
 */

import { supabase } from '@/integrations/supabase/client';

const DEFAULT_WORKSPACE_ID = 'df5d730f-1915-4269-bd5a-9534478b17af';
const DEFAULT_USER_ID = 'cc000000-0000-0000-0000-000000000001';

/**
 * Initialize simple auth session for demo
 */
export async function initSimpleAuth(): Promise<void> {
  try {
    // Check if already authenticated
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      // Sign in with a demo user (this should work with anon key for demo purposes)
      localStorage.setItem('demo_workspace_id', DEFAULT_WORKSPACE_ID);
      localStorage.setItem('demo_user_id', DEFAULT_USER_ID);
      console.log('🔑 Demo auth initialized');
    }
  } catch (error) {
    console.error('Error initializing auth:', error);
    // Fallback to localStorage-based auth
    localStorage.setItem('demo_workspace_id', DEFAULT_WORKSPACE_ID);
    localStorage.setItem('demo_user_id', DEFAULT_USER_ID);
  }
}

/**
 * Get current workspace ID (demo version)
 */
export function getDemoWorkspaceId(): string {
  return localStorage.getItem('demo_workspace_id') || DEFAULT_WORKSPACE_ID;
}

/**
 * Get current user ID (demo version)
 */
export function getDemoUserId(): string {
  return localStorage.getItem('demo_user_id') || DEFAULT_USER_ID;
}

/**
 * Check if user is authenticated (demo version)
 */
export function isDemoAuthenticated(): boolean {
  return !!(localStorage.getItem('demo_workspace_id') && localStorage.getItem('demo_user_id'));
}