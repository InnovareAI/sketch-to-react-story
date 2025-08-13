// Script to trigger a full message sync with improved fetching
import { unipileRealTimeSync } from './src/services/unipile/UnipileRealTimeSync.ts';

console.log('🚀 Triggering full LinkedIn sync with complete message threads...');

async function triggerSync() {
  try {
    // Clear localStorage to force fresh sync
    if (typeof window !== 'undefined') {
      localStorage.removeItem('linkedin_sync_undefined');
      localStorage.removeItem('linkedin_accounts');
    }
    
    console.log('📧 Starting comprehensive sync...');
    await unipileRealTimeSync.syncAll();
    
    console.log('✅ Sync complete! Check your inbox for full message threads.');
  } catch (error) {
    console.error('❌ Sync failed:', error);
  }
}

// For browser console execution
window.triggerFullSync = triggerSync;

console.log('To trigger sync, run: window.triggerFullSync()');