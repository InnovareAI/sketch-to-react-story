/**
 * Complete Data Migration Utility
 * Migrates ALL localStorage data to user-specific keys
 * This prevents data leakage between users
 */

import { supabase } from '@/integrations/supabase/client';

export async function migrateAllDataToUserSpecific(): Promise<void> {
  console.log('🔄 Starting complete data migration to user-specific storage...');
  
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('No authenticated user found - skipping migration');
      return;
    }
    
    const userId = user.id;
    console.log(`Migrating data for user: ${userId}`);
    
    // List of keys to migrate
    const keysToMigrate = [
      'workspace_id',
      'workspace_settings',
      'linkedin_accounts',
      'workspace_unipile_config',
      'whisper_sync_config',
      'app_workspace_id',
      'unipile_account_id',
      'linkedin_sync_status',
      'background_sync_enabled',
      'campaign_drafts',
      'message_templates',
      'contact_filters',
      'inbox_preferences'
    ];
    
    // Migrate each key to user-specific version
    for (const key of keysToMigrate) {
      const oldValue = localStorage.getItem(key);
      if (oldValue) {
        const newKey = `user_${userId}_${key}`;
        
        // Check if already migrated
        const existingValue = localStorage.getItem(newKey);
        if (!existingValue) {
          // Migrate the data
          localStorage.setItem(newKey, oldValue);
          console.log(`✅ Migrated ${key} -> ${newKey}`);
          
          // Remove old key to prevent confusion
          localStorage.removeItem(key);
        } else {
          console.log(`⏭️ ${newKey} already exists - skipping`);
        }
      }
    }
    
    // Special handling for linkedin_sync_ pattern
    const allKeys = Object.keys(localStorage);
    for (const key of allKeys) {
      if (key.startsWith('linkedin_sync_') && !key.startsWith(`user_${userId}_`)) {
        // This is an old pattern key
        const newKey = `user_${userId}_linkedin_sync`;
        const oldValue = localStorage.getItem(key);
        
        if (oldValue && !localStorage.getItem(newKey)) {
          localStorage.setItem(newKey, oldValue);
          localStorage.removeItem(key);
          console.log(`✅ Migrated ${key} -> ${newKey}`);
        }
      }
    }
    
    // Mark migration as complete
    localStorage.setItem(`user_${userId}_migration_complete`, new Date().toISOString());
    console.log('✅ Data migration complete!');
    
  } catch (error) {
    console.error('❌ Error during data migration:', error);
  }
}

/**
 * Check if migration is needed for current user
 */
export async function isMigrationNeeded(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  
  // Check if migration has been done
  const migrationComplete = localStorage.getItem(`user_${user.id}_migration_complete`);
  if (migrationComplete) return false;
  
  // Check if any old keys exist
  const oldKeys = [
    'workspace_id',
    'linkedin_accounts',
    'workspace_settings'
  ];
  
  for (const key of oldKeys) {
    if (localStorage.getItem(key)) {
      return true; // Migration needed
    }
  }
  
  return false;
}

/**
 * Clear all non-user-specific data (for cleanup)
 */
export function clearSharedData(): void {
  const keysToRemove = [
    'workspace_id',
    'workspace_settings',
    'linkedin_accounts',
    'workspace_unipile_config',
    'whisper_sync_config',
    'app_workspace_id',
    'unipile_account_id',
    'linkedin_sync_status',
    'background_sync_enabled'
  ];
  
  for (const key of keysToRemove) {
    localStorage.removeItem(key);
  }
  
  console.log('🧹 Cleared all shared localStorage data');
}

/**
 * Initialize migration on app load
 */
export async function initializeDataMigration(): Promise<void> {
  if (await isMigrationNeeded()) {
    console.log('📦 Migration needed - starting...');
    await migrateAllDataToUserSpecific();
  } else {
    console.log('✨ No migration needed');
  }
}