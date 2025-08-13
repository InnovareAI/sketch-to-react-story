/**
 * Test Unipile Sync Functionality
 * This utility tests the complete sync flow and verifies data is correctly synced
 */

import { supabase } from '@/integrations/supabase/client';
import { unipileRealTimeSync } from '@/services/unipile/UnipileRealTimeSync';

interface TestResult {
  success: boolean;
  message: string;
  details?: any;
  duration?: number;
}

interface SyncTestResults {
  apiConnection: TestResult;
  accountsFound: TestResult;
  messagesSync: TestResult;
  contactsSync: TestResult;
  databaseVerification: TestResult;
  overall: TestResult;
}

/**
 * Comprehensive test of Unipile sync functionality
 */
export async function testUnipileSync(): Promise<SyncTestResults> {
  console.log('🧪 Starting comprehensive Unipile sync test...');
  
  const results: SyncTestResults = {
    apiConnection: { success: false, message: '' },
    accountsFound: { success: false, message: '' },
    messagesSync: { success: false, message: '' },
    contactsSync: { success: false, message: '' },
    databaseVerification: { success: false, message: '' },
    overall: { success: false, message: '' }
  };

  try {
    // Test 1: API Connection
    console.log('\n1️⃣ Testing API Connection...');
    const startTime = Date.now();
    
    const connectionTest = await unipileRealTimeSync.testConnection();
    results.apiConnection = {
      success: connectionTest.success,
      message: connectionTest.success 
        ? `Connected successfully. Found ${connectionTest.accounts.length} accounts.`
        : `Connection failed: ${connectionTest.error}`,
      details: connectionTest.accounts,
      duration: Date.now() - startTime
    };

    if (!connectionTest.success) {
      results.overall = {
        success: false,
        message: 'API connection failed. Cannot proceed with sync test.'
      };
      return results;
    }

    // Test 2: Verify Accounts Found
    console.log('\n2️⃣ Verifying LinkedIn Accounts...');
    const accounts = connectionTest.accounts;
    const thorstenAccount = accounts.find(acc => acc.name?.includes('Thorsten'));
    
    results.accountsFound = {
      success: accounts.length > 0,
      message: accounts.length > 0 
        ? `Found ${accounts.length} LinkedIn accounts. ${thorstenAccount ? 'Thorsten account detected.' : 'No Thorsten account.'}`
        : 'No LinkedIn accounts found',
      details: accounts.map(acc => ({ id: acc.id, name: acc.name, status: acc.status }))
    };

    // Test 3: Messages Sync
    console.log('\n3️⃣ Testing Messages Sync...');
    const messagesSyncStart = Date.now();
    
    // Get workspace
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('id')
      .limit(1)
      .single();

    if (workspaceError || !workspace) {
      results.messagesSync = {
        success: false,
        message: 'No workspace found for sync test',
        duration: Date.now() - messagesSyncStart
      };
    } else {
      // Clear existing test data
      await supabase
        .from('inbox_conversations')
        .delete()
        .eq('workspace_id', workspace.id)
        .eq('platform', 'linkedin');

      // Run sync for first account
      const testAccount = accounts[0];
      console.log(`Syncing messages for account: ${testAccount.name}`);
      
      try {
        await unipileRealTimeSync.syncAll();
        
        // Check if conversations were created
        const { data: conversations, error: convError } = await supabase
          .from('inbox_conversations')
          .select('id, participant_name, last_message_at')
          .eq('workspace_id', workspace.id)
          .eq('platform', 'linkedin')
          .limit(10);

        if (convError) {
          results.messagesSync = {
            success: false,
            message: `Database query error: ${convError.message}`,
            duration: Date.now() - messagesSyncStart
          };
        } else {
          results.messagesSync = {
            success: conversations.length > 0,
            message: conversations.length > 0
              ? `Synced ${conversations.length} conversations successfully`
              : 'No conversations were synced',
            details: conversations,
            duration: Date.now() - messagesSyncStart
          };
        }
      } catch (syncError) {
        results.messagesSync = {
          success: false,
          message: `Sync failed: ${syncError.message}`,
          duration: Date.now() - messagesSyncStart
        };
      }
    }

    // Test 4: Contacts Sync (verify contacts were extracted from messages)
    console.log('\n4️⃣ Testing Contacts Sync...');
    const contactsSyncStart = Date.now();
    
    if (workspace) {
      // Check contacts table for new LinkedIn contacts
      const { data: contacts, error: contactsError } = await supabase
        .from('contacts')
        .select('id, full_name, email, linkedin_url, connection_degree, engagement_score')
        .eq('workspace_id', workspace.id)
        .eq('source', 'linkedin')
        .limit(10);

      if (contactsError) {
        results.contactsSync = {
          success: false,
          message: `Contacts query error: ${contactsError.message}`,
          duration: Date.now() - contactsSyncStart
        };
      } else {
        results.contactsSync = {
          success: contacts.length > 0,
          message: contacts.length > 0
            ? `Found ${contacts.length} LinkedIn contacts in database`
            : 'No LinkedIn contacts found in database',
          details: contacts,
          duration: Date.now() - contactsSyncStart
        };
      }
    } else {
      results.contactsSync = {
        success: false,
        message: 'No workspace available for contacts test',
        duration: Date.now() - contactsSyncStart
      };
    }

    // Test 5: Database Verification
    console.log('\n5️⃣ Verifying Database Integrity...');
    const dbVerifyStart = Date.now();
    
    if (workspace) {
      try {
        // Check inbox_messages table
        const { data: messages, error: messagesError } = await supabase
          .from('inbox_messages')
          .select('id, content, role, conversation_id')
          .limit(5);

        // Check sync metadata
        const { data: syncMetadata, error: syncError } = await supabase
          .from('sync_metadata')
          .select('*')
          .eq('workspace_id', workspace.id);

        const hasMessages = !messagesError && messages && messages.length > 0;
        const hasSyncMetadata = !syncError && syncMetadata && syncMetadata.length > 0;

        results.databaseVerification = {
          success: hasMessages,
          message: hasMessages 
            ? `Database verification passed. Found ${messages.length} messages${hasSyncMetadata ? ' and sync metadata' : ''}.`
            : 'Database verification failed. No messages found.',
          details: {
            messages: messages?.length || 0,
            syncMetadata: syncMetadata?.length || 0,
            messagesError: messagesError?.message,
            syncError: syncError?.message
          },
          duration: Date.now() - dbVerifyStart
        };
      } catch (error) {
        results.databaseVerification = {
          success: false,
          message: `Database verification error: ${error.message}`,
          duration: Date.now() - dbVerifyStart
        };
      }
    } else {
      results.databaseVerification = {
        success: false,
        message: 'No workspace available for database verification',
        duration: Date.now() - dbVerifyStart
      };
    }

    // Overall Result
    const allTests = [
      results.apiConnection,
      results.accountsFound,
      results.messagesSync,
      results.contactsSync,
      results.databaseVerification
    ];
    
    const passedTests = allTests.filter(test => test.success).length;
    const totalTests = allTests.length;
    
    results.overall = {
      success: passedTests === totalTests,
      message: `Overall: ${passedTests}/${totalTests} tests passed. ${
        passedTests === totalTests 
          ? '✅ All systems operational!' 
          : '⚠️ Some issues detected.'
      }`,
      details: {
        passedTests,
        totalTests,
        testResults: results
      }
    };

  } catch (error) {
    console.error('❌ Test suite error:', error);
    results.overall = {
      success: false,
      message: `Test suite failed: ${error.message}`
    };
  }

  // Print results
  console.log('\n📊 Test Results Summary:');
  console.log('='.repeat(50));
  
  Object.entries(results).forEach(([testName, result]) => {
    if (testName === 'overall') return;
    
    const status = result.success ? '✅' : '❌';
    const duration = result.duration ? ` (${result.duration}ms)` : '';
    console.log(`${status} ${testName}: ${result.message}${duration}`);
  });
  
  console.log('='.repeat(50));
  console.log(`🎯 ${results.overall.message}`);

  return results;
}

/**
 * Quick sync test that just verifies API connectivity
 */
export async function quickSyncTest(): Promise<boolean> {
  try {
    console.log('⚡ Quick sync test...');
    
    const connectionTest = await unipileRealTimeSync.testConnection();
    
    if (connectionTest.success && connectionTest.accounts.length > 0) {
      console.log(`✅ Quick test passed: ${connectionTest.accounts.length} accounts connected`);
      return true;
    } else {
      console.log(`❌ Quick test failed: ${connectionTest.error}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Quick test error: ${error.message}`);
    return false;
  }
}

/**
 * Manual trigger for sync testing (can be called from browser console)
 */
export async function manualSyncTest() {
  console.log('🔧 Manual sync test triggered...');
  
  try {
    // First run quick test
    const quickResult = await quickSyncTest();
    
    if (!quickResult) {
      console.log('❌ Quick test failed. Check API connection.');
      return;
    }
    
    // Run full sync
    console.log('🔄 Running full sync...');
    await unipileRealTimeSync.syncAll();
    
    // Get status
    const status = unipileRealTimeSync.getStatus();
    console.log('📊 Sync status:', status);
    
    if (status.errors.length > 0) {
      console.log('⚠️ Sync completed with errors:', status.errors);
    } else {
      console.log('✅ Sync completed successfully');
      console.log(`📈 Synced: ${status.contactsSynced} contacts, ${status.messagessynced} messages`);
    }
    
  } catch (error) {
    console.error('❌ Manual sync test failed:', error);
  }
}

// Make functions available globally for testing
declare global {
  interface Window {
    testUnipileSync: typeof testUnipileSync;
    quickSyncTest: typeof quickSyncTest;
    manualSyncTest: typeof manualSyncTest;
  }
}

// Expose to window for manual testing
if (typeof window !== 'undefined') {
  window.testUnipileSync = testUnipileSync;
  window.quickSyncTest = quickSyncTest;
  window.manualSyncTest = manualSyncTest;
}