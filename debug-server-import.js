/**
 * Debug Server Import - Run this in browser console on live site
 * Tests the server-side LinkedIn import functionality
 */

window.debugServerImport = async function() {
  console.log('🔍 DEBUG: Testing Server-Side LinkedIn Import');
  
  try {
    // Import the necessary modules (assuming they're available)
    const { supabase } = window.imports || {};
    
    if (!supabase) {
      console.log('❌ Supabase client not found. Trying to access from window...');
      
      // Check if supabase is available globally
      if (window.supabase) {
        console.log('✅ Found window.supabase');
      } else {
        console.log('❌ No supabase client found. Cannot test server import.');
        return;
      }
    }
    
    const client = window.supabase || supabase;
    
    // Test 1: Check authentication
    console.log('\n📋 Test 1: Checking authentication...');
    const { data: { session }, error: sessionError } = await client.auth.getSession();
    
    if (sessionError || !session) {
      console.log('❌ No active session found');
      console.log('Please log in to test server import');
      return;
    }
    
    console.log('✅ User session active:', session.user.email);
    
    // Test 2: Test edge function availability
    console.log('\n🧪 Test 2: Testing Edge Function availability...');
    
    const { data: testData, error: testError } = await client.functions.invoke('linkedin-import', {
      body: { test: true }
    });
    
    if (testError) {
      console.log('❌ Edge function test error:', testError);
      return;
    }
    
    console.log('✅ Edge function available:', testData);
    
    // Test 3: Get workspace info
    console.log('\n🏢 Test 3: Getting workspace info...');
    
    const { data: workspaces, error: wsError } = await client
      .from('workspaces')
      .select('id, name')
      .limit(1);
    
    if (wsError || !workspaces?.length) {
      console.log('❌ No workspace found:', wsError);
      return;
    }
    
    const workspace = workspaces[0];
    console.log('✅ Workspace found:', workspace);
    
    // Test 4: Attempt actual server import (small test)
    console.log('\n🚀 Test 4: Testing actual server import...');
    
    const { data: importData, error: importError } = await client.functions.invoke('linkedin-import', {
      body: {
        workspaceId: workspace.id,
        options: {
          limit: 5, // Small test import
          method: 'unipile',
          importId: `test_${Date.now()}`
        }
      }
    });
    
    if (importError) {
      console.log('❌ Server import error:', importError);
      console.log('This might be expected if Unipile account is not set up properly');
      return;
    }
    
    console.log('✅ Server import response:', importData);
    
    console.log('\n🎉 Server import debugging complete!');
    console.log('If you see successful responses above, the system is working correctly.');
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  }
};

console.log('🧪 Debug function loaded! Run: debugServerImport()');
console.log('Go to https://sameaisalesassistant.netlify.app and run this in the browser console');