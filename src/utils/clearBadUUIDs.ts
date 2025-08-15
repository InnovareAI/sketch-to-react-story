/**
 * Clear Bad UUID Utility
 * Removes all invalid workspace IDs from localStorage
 */

export function clearAllBadUUIDs(): void {
  console.log('🧹 Clearing all bad UUID data from localStorage...');
  
  // List of all possible keys that might contain bad UUIDs
  const keysToCheck = [
    'workspace_id',
    'app_workspace_id',
    'user_auth_profile',
    'bypass_user'
  ];
  
  // Get all localStorage keys
  const allKeys = Object.keys(localStorage);
  
  // Check user-specific keys too
  for (const key of allKeys) {
    if (key.includes('workspace_id') || key.includes('app_workspace_id')) {
      keysToCheck.push(key);
    }
  }
  
  // Check and fix each key
  for (const key of keysToCheck) {
    const value = localStorage.getItem(key);
    if (value) {
      // Check if it's a JSON object with workspace_id
      try {
        const parsed = JSON.parse(value);
        if (parsed.workspace_id && !isValidUUID(parsed.workspace_id)) {
          console.log(`🔧 Fixing bad UUID in ${key}:`, parsed.workspace_id);
          parsed.workspace_id = generateUUID();
          localStorage.setItem(key, JSON.stringify(parsed));
        }
      } catch (e) {
        // Not JSON, check if it's a direct workspace ID
        if (!isValidUUID(value) && value.startsWith('workspace-')) {
          console.log(`🔧 Fixing bad UUID in ${key}:`, value);
          localStorage.setItem(key, generateUUID());
        }
      }
    }
  }
  
  console.log('✅ Cleaned all bad UUIDs');
}

function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Auto-run on import
if (typeof window !== 'undefined') {
  clearAllBadUUIDs();
}