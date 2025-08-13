/**
 * Supabase Paid Plan Configuration
 * Optimized settings for paid Supabase plan
 */

export const SUPABASE_PLAN = {
  tier: 'PRO', // or 'TEAM' depending on your plan
  
  limits: {
    database: '8 GB',      // Pro plan
    storage: '100 GB',     // Pro plan  
    bandwidth: '250 GB',   // Pro plan
    apiCalls: 'Unlimited', // No hard limit on Pro
    edgeFunctions: '2 million invocations',
    realtimeConnections: '500 concurrent',
    vectorDimensions: '1536'
  },
  
  // Optimized sync settings for paid plan
  syncSettings: {
    MAX_CONVERSATIONS: 1000,           // Increased from 500
    MAX_MESSAGES_PER_CONVERSATION: 50, // Increased from 20
    CONVERSATIONS_PER_PAGE: 100,       // Faster fetching
    WHISPER_SYNC_INTERVAL: 3,          // More frequent (every 3 min)
    FULL_SYNC_INTERVAL: 30,            // Every 30 minutes
    ENABLE_REAL_TIME: true,             // Enable real-time updates
    ENABLE_ATTACHMENTS: true,           // Sync attachments
    ENABLE_REACTIONS: true,             // Sync reactions
    ARCHIVE_OLD_MESSAGES: 90,           // Archive after 90 days
  },
  
  // Storage estimates for your current settings
  estimates: {
    perUser: {
      conversations: 1000,
      messagesTotal: 50000,      // 1000 × 50
      storageUsed: '50 MB',       // Approximate
      monthlyApiCalls: '~500K',
      monthlyBandwidth: '~1 GB'
    },
    
    // You can handle many users on Pro plan
    maxUsersEstimate: {
      storage: 2000,    // 100 GB / 50 MB per user
      database: 160,    // 8 GB / 50 MB per user  
      bandwidth: 250,   // 250 GB / 1 GB per user
      practical: 150    // Conservative estimate
    }
  },
  
  // Cost breakdown
  costs: {
    monthly: 25,        // Pro plan base
    perUser: 0.17,      // $25 / 150 users = $0.17 per user
    breakEven: 150,     // Users needed to justify Pro plan
    scalePoint: 500     // Consider Team plan at this point
  }
};

export const SYNC_PROFILES = {
  // Different sync profiles based on needs
  minimal: {
    conversations: 100,
    messagesPerChat: 10,
    syncInterval: 60
  },
  
  standard: {
    conversations: 500,
    messagesPerChat: 30,
    syncInterval: 30
  },
  
  premium: {
    conversations: 1000,
    messagesPerChat: 50,
    syncInterval: 15
  },
  
  maximum: {
    conversations: 2000,
    messagesPerChat: 100,
    syncInterval: 5
  }
};