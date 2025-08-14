/**
 * Migration utility to move LinkedIn accounts to user-specific storage
 * This fixes the critical issue where all users see the same LinkedIn accounts
 */

import { supabase } from '@/integrations/supabase/client';
import { setUserLinkedInAccounts, setUserWorkspaceId } from './userDataStorage';

export async function migrateLinkedInAccountsToUserStorage() {
  console.log('🔄 Starting LinkedIn accounts migration to user-specific storage...');
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.log('No user logged in, skipping migration');
    return;
  }
  
  // Check if old format exists
  const oldAccounts = localStorage.getItem('linkedin_accounts');
  const oldWorkspaceId = localStorage.getItem('workspace_id');
  
  if (!oldAccounts && !oldWorkspaceId) {
    console.log('No old format data to migrate');
    return;
  }
  
  // Check if we already have user-specific data
  const userKey = `user_${user.id}_linkedin_accounts`;
  const existingUserData = localStorage.getItem(userKey);
  
  if (existingUserData) {
    console.log('User-specific data already exists, cleaning up old format...');
    
    // Remove old format to prevent confusion
    localStorage.removeItem('linkedin_accounts');
    localStorage.removeItem('workspace_id');
    
    console.log('✅ Old format cleaned up');
    return;
  }
  
  // Migrate LinkedIn accounts
  if (oldAccounts) {
    try {
      const accounts = JSON.parse(oldAccounts);
      
      // Only migrate if accounts belong to current user
      // We can't determine ownership from the data, so we'll check workspace
      if (user.email === 'tvonlinz@mac.lan' || user.email === 'thorsten@example.com') {
        // This is likely Thorsten's account
        await setUserLinkedInAccounts(accounts);
        console.log(`✅ Migrated ${accounts.length} LinkedIn account(s) to user-specific storage`);
      } else {
        // For other users, don't migrate the shared accounts
        console.log('⚠️ Not migrating shared LinkedIn accounts for non-owner user');
        await setUserLinkedInAccounts([]);
      }
      
      // Remove old format
      localStorage.removeItem('linkedin_accounts');
    } catch (error) {
      console.error('Error migrating LinkedIn accounts:', error);
    }
  }
  
  // Migrate workspace ID
  if (oldWorkspaceId) {
    await setUserWorkspaceId(oldWorkspaceId);
    console.log('✅ Migrated workspace ID to user-specific storage');
    
    // Remove old format
    localStorage.removeItem('workspace_id');
  }
  
  console.log('✅ Migration complete');
}

/**
 * Clear all shared LinkedIn data (emergency cleanup)
 */
export function clearSharedLinkedInData() {
  localStorage.removeItem('linkedin_accounts');
  localStorage.removeItem('workspace_id');
  localStorage.removeItem('workspace_settings');
  localStorage.removeItem('linkedin_oauth_state');
  
  // Clear any other shared LinkedIn-related data
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && !key.startsWith('user_') && key.includes('linkedin')) {
      keysToRemove.push(key);
    }
  }
  
  keysToRemove.forEach(key => localStorage.removeItem(key));
  
  console.log('✅ Cleared all shared LinkedIn data');
}