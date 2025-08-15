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
 * Get workspace ID for the authenticated user
 * Uses the workspace ID from the user's profile instead of generating fake ones
 */
export async function getWorkspaceId(): Promise<string> {
  // Get workspace ID from authenticated user profile
  try {
    const authProfile = localStorage.getItem('user_auth_profile');
    if (authProfile) {
      const profile = JSON.parse(authProfile);
      if (profile.workspace_id) {
        return profile.workspace_id;
      }
    }
  } catch (e) {
    console.warn('Failed to parse auth profile:', e);
  }
  
  // If no workspace found, user needs to be properly authenticated
  throw new Error('No workspace found. Please log in.');
}

/**
 * Synchronous version for getting workspace ID from authenticated user
 */
export function getWorkspaceIdSync(): string {
  // Get workspace ID from authenticated user profile
  try {
    const authProfile = localStorage.getItem('user_auth_profile');
    if (authProfile) {
      const profile = JSON.parse(authProfile);
      if (profile.workspace_id) {
        return profile.workspace_id;
      }
    }
  } catch (e) {
    console.warn('Failed to parse auth profile:', e);
  }
  
  // If no workspace found, user needs to be properly authenticated
  throw new Error('No workspace found. Please log in.');
}

/**
 * Get authenticated user ID from Supabase session or user profile
 */
export function getUserId(): string {
  // Get user ID from authenticated user profile
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
  
  // If no authenticated user found, throw error instead of generating fake ID
  throw new Error('No authenticated user found. Please log in.');
}

/**
 * Clear workspace and user authentication data (useful for logout)
 */
export async function clearWorkspaceData(): Promise<void> {
  try {
    const userId = getUserId();
    
    // Clear user-specific keys
    localStorage.removeItem(`user_${userId}_app_workspace_id`);
    localStorage.removeItem(`user_${userId}_workspace_id`);
    localStorage.removeItem(`user_${userId}_linkedin_accounts`);
    localStorage.removeItem(`user_${userId}_workspace_settings`);
    localStorage.removeItem(`user_${userId}_workspace_unipile_config`);
    localStorage.removeItem(`user_${userId}_whisper_sync_config`);
    
    // Clear authentication data
    localStorage.removeItem('user_auth_profile');
    localStorage.removeItem('is_authenticated');
    localStorage.removeItem('user_email');
    
    // Clear any legacy keys
    localStorage.removeItem('app_workspace_id');
    localStorage.removeItem('app_user_id');
    localStorage.removeItem('workspace_id');
    
    console.log('🧹 Cleared workspace data for user:', userId);
  } catch (e) {
    // If getUserId fails (no auth), just clear common keys
    localStorage.removeItem('user_auth_profile');
    localStorage.removeItem('is_authenticated');
    localStorage.removeItem('user_email');
    localStorage.removeItem('app_workspace_id');
    localStorage.removeItem('app_user_id');
    localStorage.removeItem('workspace_id');
    console.log('🧹 Cleared authentication data');
  }
}

/**
 * Initialize workspace for an authenticated user session
 */
export async function initializeWorkspace(): Promise<{ workspaceId: string; userId: string }> {
  try {
    const workspaceId = await getWorkspaceId();
    const userId = getUserId();
    
    // Store workspace ID in user-specific key for consistency
    localStorage.setItem(`user_${userId}_workspace_id`, workspaceId);
    
    console.log('🚀 Workspace initialized for authenticated user:', { workspaceId, userId });
    
    return { workspaceId, userId };
  } catch (error) {
    console.error('Failed to initialize workspace:', error);
    throw new Error('Cannot initialize workspace - user not authenticated');
  }
}