// Test the real-time sync directly instead of edge function
const path = require('path');
process.env.NODE_PATH = path.join(__dirname, 'src');

// Mock localStorage for Node.js
global.localStorage = {
  data: {},
  getItem(key) { return this.data[key] || null; },
  setItem(key, value) { this.data[key] = value; },
  removeItem(key) { delete this.data[key]; }
};

// Mock window for Node.js
global.window = {
  dispatchEvent: () => {},
  addEventListener: () => {}
};

// Mock toast
global.toast = {
  success: (msg) => console.log('✅', msg),
  error: (msg) => console.log('❌', msg),
  info: (msg) => console.log('ℹ️', msg)
};

// Mock supabase client
const mockSupabase = {
  auth: {
    getUser: () => Promise.resolve({ 
      data: { 
        user: { 
          id: 'test-user-id',
          email: 'test@example.com'
        }
      }
    })
  },
  from: (table) => ({
    select: () => ({ 
      eq: () => ({ 
        single: () => Promise.resolve({ 
          data: { id: 'test-workspace-id' }
        })
      }),
      limit: () => ({ 
        single: () => Promise.resolve({ 
          data: { id: 'test-workspace-id' }
        })
      })
    }),
    insert: () => ({ 
      select: () => ({ 
        single: () => Promise.resolve({ 
          data: { id: 'test-insert-id' }
        })
      })
    }),
    upsert: () => ({ 
      select: () => ({ 
        single: () => Promise.resolve({ 
          data: { id: 'test-upsert-id' }
        })
      })
    })
  })
};

// Set up localStorage with LinkedIn account
localStorage.setItem('user_test-user-id_linkedin_accounts', JSON.stringify([{
  id: '4jyMc-EDT1-hE5pOoT7EaQ',
  name: 'Test LinkedIn Account',
  unipileAccountId: '4jyMc-EDT1-hE5pOoT7EaQ',
  provider: 'LINKEDIN',
  status: 'CONNECTED'
}]));

localStorage.setItem('user_test-user-id_workspace_id', 'df5d730f-1915-4269-bd5a-9534478b17af');

async function testDirectSync() {
  console.log('🧪 Testing Direct UnipileRealTimeSync...');
  
  try {
    // Import and configure the sync service
    const { UnipileRealTimeSync } = await import('./src/services/unipile/UnipileRealTimeSync.js');
    
    const sync = new UnipileRealTimeSync();
    
    // Configure with API key
    sync.configure({
      apiKey: 'TE3VJJ3-N3E63ND-MWXM462-RBPCWYQ',
      accountId: '4jyMc-EDT1-hE5pOoT7EaQ'
    });
    
    console.log('✅ Sync service configured');
    console.log('🔍 Testing API connection...');
    
    // Test connection first
    const testResult = await sync.testConnection();
    console.log('📊 Connection test result:', testResult);
    
    if (testResult.success) {
      console.log('🔄 Starting full sync...');
      await sync.syncAll();
      console.log('✅ Sync completed!');
      
      const status = sync.getStatus();
      console.log('📈 Final status:', status);
    } else {
      console.log('❌ Connection test failed:', testResult.error);
    }
    
  } catch (error) {
    console.error('💥 Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testDirectSync();