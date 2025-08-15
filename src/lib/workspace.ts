/**
 * Workspace Management Utility
 * Handles workspace ID generation and persistence
 * Now with user-specific storage to prevent data leakage
 */

import { supabase } from '@/integrations/supabase/client';

/**
 * Generate a proper UUID v4
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Get or create a workspace ID for the current user
 * This ensures consistency across the application and prevents data leakage
 */
export async function getWorkspaceId(): Promise<string> {
  // Get current user for user-specific storage
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id || getUserId();
  
  const WORKSPACE_KEY = `user_${userId}_app_workspace_id`;
  
  // Check if we already have a workspace ID stored for this user
  let workspaceId = localStorage.getItem(WORKSPACE_KEY);
  
  // If not, generate a new one and store it
  if (!workspaceId || workspaceId === 'a0000000-0000-0000-0000-000000000000') {
    workspaceId = generateUUID();
    localStorage.setItem(WORKSPACE_KEY, workspaceId);
    console.log('🏢 Generated new workspace ID for user:', workspaceId);
  }
  
  return workspaceId;
}

/**
 * Synchronous version for backward compatibility
 * WARNING: This may not be user-specific if auth is not initialized
 */
export function getWorkspaceIdSync(): string {
  // Try to get from user auth profile first
  const authProfile = localStorage.getItem('user_auth_profile');
  if (authProfile) {
    try {
      const profile = JSON.parse(authProfile);
      if (profile.workspace_id) return profile.workspace_id;
    } catch (e) {}
  }
  
  // Fallback to legacy key (temporary)
  const WORKSPACE_KEY = 'app_workspace_id';
  let workspaceId = localStorage.getItem(WORKSPACE_KEY);
  
  if (!workspaceId || workspaceId === 'a0000000-0000-0000-0000-000000000000') {
    workspaceId = generateUUID();
    localStorage.setItem(WORKSPACE_KEY, workspaceId);
  }
  
  return workspaceId;
}

/**
 * Get or create a user ID for the current session
 */
export function getUserId(): string {
  // First check if user has auth profile
  try {
    const authProfile = localStorage.getItem('user_auth_profile');
    if (authProfile) {
      const profile = JSON.parse(authProfile);
      if (profile.id && profile.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
        return profile.id;
      }
    }
  } catch (e) {
    console.warn('Failed to parse auth profile:', e);
  }
  
  // Check bypass user
  try {
    const bypassUser = localStorage.getItem('bypass_user');
    if (bypassUser) {
      const user = JSON.parse(bypassUser);
      if (user.id && user.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
        return user.id;
      }
    }
  } catch (e) {
    console.warn('Failed to parse bypass user:', e);
  }
  
  // Check if we have a stored user ID
  const USER_KEY = 'app_user_id';
  let userId = localStorage.getItem(USER_KEY);
  
  // If not valid, generate a new one
  if (!userId || !userId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
    userId = generateUUID();
    localStorage.setItem(USER_KEY, userId);
    console.log('👤 Generated new user ID:', userId);
  }
  
  return userId;
}

/**
 * Clear workspace and user IDs (useful for logout)
 */
export async function clearWorkspaceData(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id || getUserId();
  
  // Clear user-specific keys
  localStorage.removeItem(`user_${userId}_app_workspace_id`);
  localStorage.removeItem(`user_${userId}_workspace_id`);
  localStorage.removeItem(`user_${userId}_linkedin_accounts`);
  localStorage.removeItem(`user_${userId}_workspace_settings`);
  localStorage.removeItem(`user_${userId}_workspace_unipile_config`);
  localStorage.removeItem(`user_${userId}_whisper_sync_config`);
  
  // Clear legacy keys too
  localStorage.removeItem('app_workspace_id');
  localStorage.removeItem('app_user_id');
  
  console.log('🧹 Cleared workspace data for user:', userId);
}

/**
 * Initialize workspace for a new session
 */
export async function initializeWorkspace(): Promise<{ workspaceId: string; userId: string }> {
  const workspaceId = await getWorkspaceId();
  const userId = getUserId();
  
  // Store in user-specific keys
  const { data: { user } } = await supabase.auth.getUser();
  const authUserId = user?.id || userId;
  localStorage.setItem(`user_${authUserId}_workspace_id`, workspaceId);
  
  console.log('🚀 Workspace initialized for user:', { workspaceId, userId });
  
  return { workspaceId, userId };
}