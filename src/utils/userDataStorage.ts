/**
 * User-specific data storage utilities
 * Ensures data isolation between different users
 */

import { supabase } from '@/integrations/supabase/client';

/**
 * Get the current user's ID
 */
async function getCurrentUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
}

/**
 * Store data specific to the current user
 */
export async function setUserData(key: string, value: any): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) {
    console.error('No user ID available for storing data');
    return;
  }
  
  const userKey = `user_${userId}_${key}`;
  localStorage.setItem(userKey, JSON.stringify(value));
}

/**
 * Get data specific to the current user
 */
export async function getUserData<T>(key: string, defaultValue: T): Promise<T> {
  const userId = await getCurrentUserId();
  if (!userId) {
    console.error('No user ID available for retrieving data');
    return defaultValue;
  }
  
  const userKey = `user_${userId}_${key}`;
  const stored = localStorage.getItem(userKey);
  
  if (!stored) {
    return defaultValue;
  }
  
  try {
    return JSON.parse(stored) as T;
  } catch (error) {
    console.error('Error parsing stored data:', error);
    return defaultValue;
  }
}

/**
 * Remove data specific to the current user
 */
export async function removeUserData(key: string): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) {
    console.error('No user ID available for removing data');
    return;
  }
  
  const userKey = `user_${userId}_${key}`;
  localStorage.removeItem(userKey);
}

/**
 * Get LinkedIn accounts for the current user
 */
export async function getUserLinkedInAccounts(): Promise<any[]> {
  return getUserData('linkedin_accounts', []);
}

/**
 * Set LinkedIn accounts for the current user
 */
export async function setUserLinkedInAccounts(accounts: any[]): Promise<void> {
  await setUserData('linkedin_accounts', accounts);
}

/**
 * Get workspace ID for the current user
 */
export async function getUserWorkspaceId(): Promise<string | null> {
  const workspaceId = await getUserData<string | null>('workspace_id', null);
  
  // Fallback to checking user metadata
  if (!workspaceId) {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.user_metadata?.workspace_id || null;
  }
  
  return workspaceId;
}

/**
 * Set workspace ID for the current user
 */
export async function setUserWorkspaceId(workspaceId: string): Promise<void> {
  await setUserData('workspace_id', workspaceId);
}

/**
 * Clear all user-specific data (useful for logout)
 */
export async function clearUserData(): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) return;
  
  // Find all keys for this user
  const userPrefix = `user_${userId}_`;
  const keysToRemove: string[] = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(userPrefix)) {
      keysToRemove.push(key);
    }
  }
  
  // Remove all user-specific keys
  keysToRemove.forEach(key => localStorage.removeItem(key));
}