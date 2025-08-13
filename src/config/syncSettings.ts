/**
 * Sync Settings Configuration
 * Control how much data is synced from LinkedIn
 */

export const SYNC_SETTINGS = {
  // Maximum number of conversations to sync
  MAX_CONVERSATIONS: 500,
  
  // Maximum number of messages to sync per conversation
  MAX_MESSAGES_PER_CONVERSATION: 20,
  
  // Number of conversations to fetch per API call
  CONVERSATIONS_PER_PAGE: 50,
  
  // How often to auto-sync (in minutes)
  AUTO_SYNC_INTERVAL: 60,
  
  // Skip conversations that haven't been updated since last sync
  SKIP_UNCHANGED_CONVERSATIONS: true,
  
  // Only sync conversations from the last N days (0 = no limit)
  SYNC_DAYS_BACK: 30,
  
  // Maximum pages to fetch (safety limit)
  MAX_PAGES: 20
};

// Performance presets
export const SYNC_PRESETS = {
  minimal: {
    MAX_CONVERSATIONS: 100,
    MAX_MESSAGES_PER_CONVERSATION: 10,
    SYNC_DAYS_BACK: 7
  },
  standard: {
    MAX_CONVERSATIONS: 500,
    MAX_MESSAGES_PER_CONVERSATION: 20,
    SYNC_DAYS_BACK: 30
  },
  comprehensive: {
    MAX_CONVERSATIONS: 1000,
    MAX_MESSAGES_PER_CONVERSATION: 50,
    SYNC_DAYS_BACK: 90
  }
};