/**
 * Test Contact Sync
 * Comprehensive test for LinkedIn contact synchronization
 */

import { supabase } from '@/integrations/supabase/client';

const UNIPILE_API_KEY = 'TE3VJJ3-N3E63ND-MWXM462-RBPCWYQ';
const UNIPILE_BASE_URL = 'https://api6.unipile.com:13443/api/v1';

export async function testContactSync() {
  console.log('🧪 Starting Contact Sync Test...\n');
  
  const results = {
    linkedInAccount: null as any,
    apiConnection: false,
    contactsFetched: 0,
    contactsSaved: 0,
    errors: [] as string[],
    sampleContacts: [] as any[]
  };

  try {
    // Step 1: Check LinkedIn Account
    console.log('📋 Step 1: Checking LinkedIn Account...');
    const accounts = JSON.parse(localStorage.getItem('linkedin_accounts') || '[]');
    
    if (accounts.length === 0) {
      results.errors.push('No LinkedIn account found in localStorage');
      console.error('❌ No LinkedIn account connected');
      return results;
    }
    
    const account = accounts[0];
    results.linkedInAccount = account;
    const accountId = account.unipileAccountId || account.id || account.account_id;
    
    console.log('✅ Found LinkedIn account:', {
      name: account.name,
      email: account.email,
      accountId: accountId,
      allIds: {
        unipileAccountId: account.unipileAccountId,
        id: account.id,
        account_id: account.account_id
      }
    });

    // Step 2: Test Unipile API Connection
    console.log('\n🔌 Step 2: Testing Unipile API Connection...');
    try {
      const testResponse = await fetch(
        `${UNIPILE_BASE_URL}/users/${accountId}`,
        {
          headers: {
            'Authorization': `Bearer ${UNIPILE_API_KEY}`,
            'Accept': 'application/json'
          }
        }
      );
      
      if (testResponse.ok) {
        results.apiConnection = true;
        console.log('✅ API connection successful');
      } else {
        const errorText = await testResponse.text();
        results.errors.push(`API connection failed: ${testResponse.status} - ${errorText}`);
        console.error('❌ API connection failed:', testResponse.status, errorText);
      }
    } catch (error: any) {
      results.errors.push(`API connection error: ${error.message}`);
      console.error('❌ API connection error:', error);
    }

    // Step 3: Fetch Contacts from LinkedIn
    console.log('\n👥 Step 3: Fetching LinkedIn Contacts...');
    try {
      const contactsResponse = await fetch(
        `${UNIPILE_BASE_URL}/users/${accountId}/connections?limit=20`,
        {
          headers: {
            'Authorization': `Bearer ${UNIPILE_API_KEY}`,
            'Accept': 'application/json'
          }
        }
      );
      
      if (contactsResponse.ok) {
        const data = await contactsResponse.json();
        const contacts = data.connections || data.items || data.data || [];
        
        results.contactsFetched = contacts.length;
        console.log(`✅ Fetched ${contacts.length} contacts from LinkedIn`);
        
        // Show sample contacts
        if (contacts.length > 0) {
          results.sampleContacts = contacts.slice(0, 3).map((c: any) => ({
            name: c.name || `${c.first_name} ${c.last_name}`,
            company: c.company || c.current_company,
            title: c.title || c.headline,
            degree: c.degree || c.connection_degree
          }));
          
          console.log('\n📝 Sample Contacts:');
          results.sampleContacts.forEach((c, i) => {
            console.log(`  ${i + 1}. ${c.name} - ${c.title} at ${c.company} (${c.degree} degree)`);
          });
        }
      } else {
        const errorText = await contactsResponse.text();
        results.errors.push(`Failed to fetch contacts: ${contactsResponse.status} - ${errorText}`);
        console.error('❌ Failed to fetch contacts:', errorText);
      }
    } catch (error: any) {
      results.errors.push(`Contact fetch error: ${error.message}`);
      console.error('❌ Contact fetch error:', error);
    }

    // Step 4: Check Database for Saved Contacts
    console.log('\n💾 Step 4: Checking Database for Saved Contacts...');
    try {
      // Get workspace ID
      const userProfile = JSON.parse(localStorage.getItem('user_auth_profile') || '{}');
      const workspaceId = userProfile.workspace_id || localStorage.getItem('workspace_id');
      
      if (workspaceId) {
        const { data: dbContacts, error, count } = await supabase
          .from('contacts')
          .select('*', { count: 'exact', head: false })
          .eq('workspace_id', workspaceId)
          .limit(5);
        
        if (error) {
          results.errors.push(`Database query error: ${error.message}`);
          console.error('❌ Database query error:', error);
        } else {
          results.contactsSaved = count || 0;
          console.log(`✅ Found ${count} contacts in database`);
          
          if (dbContacts && dbContacts.length > 0) {
            console.log('\n📝 Sample Database Contacts:');
            dbContacts.forEach((c: any, i: number) => {
              console.log(`  ${i + 1}. ${c.full_name || `${c.first_name} ${c.last_name}`} - ${c.email}`);
            });
          }
        }
      } else {
        results.errors.push('No workspace ID found');
        console.error('❌ No workspace ID found');
      }
    } catch (error: any) {
      results.errors.push(`Database error: ${error.message}`);
      console.error('❌ Database error:', error);
    }

    // Step 5: Test Manual Sync Function
    console.log('\n🔄 Step 5: Testing Manual Sync Function...');
    try {
      const { contactMessageSync } = await import('@/services/unipile/ContactMessageSync');
      
      if (contactMessageSync) {
        console.log('✅ ContactMessageSync service is available');
        
        // Get workspace ID
        const userProfile = JSON.parse(localStorage.getItem('user_auth_profile') || '{}');
        const workspaceId = userProfile.workspace_id || localStorage.getItem('workspace_id');
        
        if (workspaceId && accountId) {
          console.log('\n🚀 Attempting to sync 5 contacts as a test...');
          const syncResult = await contactMessageSync.syncContactsAndMessages(
            accountId,
            workspaceId,
            {
              syncContacts: true,
              syncMessages: false,
              contactLimit: 5,
              onlyFirstDegree: false
            }
          );
          
          console.log('✅ Sync test completed:', {
            contactsSynced: syncResult.contactsSynced,
            firstDegreeContacts: syncResult.firstDegreeContacts,
            errors: syncResult.errors.length
          });
          
          if (syncResult.errors.length > 0) {
            console.log('⚠️ Sync errors:', syncResult.errors);
            results.errors.push(...syncResult.errors);
          }
        }
      } else {
        results.errors.push('ContactMessageSync service not available');
        console.error('❌ ContactMessageSync service not available');
      }
    } catch (error: any) {
      results.errors.push(`Sync test error: ${error.message}`);
      console.error('❌ Sync test error:', error);
    }

  } catch (error: any) {
    results.errors.push(`Test error: ${error.message}`);
    console.error('❌ Test error:', error);
  }

  // Final Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(50));
  console.log(`✅ LinkedIn Account: ${results.linkedInAccount ? 'Connected' : 'Not Connected'}`);
  console.log(`✅ API Connection: ${results.apiConnection ? 'Working' : 'Failed'}`);
  console.log(`✅ Contacts Fetched: ${results.contactsFetched}`);
  console.log(`✅ Contacts in Database: ${results.contactsSaved}`);
  console.log(`❌ Errors: ${results.errors.length}`);
  
  if (results.errors.length > 0) {
    console.log('\n🚨 Errors Found:');
    results.errors.forEach((err, i) => {
      console.log(`  ${i + 1}. ${err}`);
    });
  }

  return results;
}

// Make it available globally for testing
if (typeof window !== 'undefined') {
  (window as any).testContactSync = testContactSync;
  console.log('🧪 Contact Sync Test Available: window.testContactSync()');
}