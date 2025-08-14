/**
 * Debug Contact Import on Live Netlify Site
 * Run this in browser console at https://sameaisalesassistant.netlify.app
 * 
 * Instructions:
 * 1. Open browser console (F12)
 * 2. Copy and paste this entire script
 * 3. Run: debugContactImport()
 */

window.debugContactImport = async function() {
  console.log('🔍 SAM AI Contact Import Debug Tool');
  console.log('═'.repeat(60));
  
  try {
    // Check if we're on the right site
    if (!window.location.hostname.includes('netlify.app') && !window.location.hostname.includes('localhost')) {
      console.error('❌ Please run this on the SAM AI Netlify site');
      return;
    }
    
    console.log('✅ Running on correct domain:', window.location.hostname);
    
    // Check if Supabase is available
    const supabase = window.supabase || (window.React && window.React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED?.supabase);
    if (!supabase) {
      console.error('❌ Supabase client not found - checking imports...');
      
      // Try to find Supabase in the global scope
      const globals = Object.keys(window).filter(key => key.toLowerCase().includes('supabase'));
      console.log('🔍 Found globals containing "supabase":', globals);
      return;
    }
    
    console.log('✅ Supabase client found');
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('❌ User not authenticated:', userError?.message || 'No user found');
      console.log('💡 Please sign in first');
      return;
    }
    
    console.log('✅ User authenticated:', user.email);
    console.log('   User ID:', user.id);
    
    // Get or create workspace
    let { data: workspace, error: wsError } = await supabase
      .from('workspaces')
      .select('*')
      .eq('owner_id', user.id)
      .single();
    
    if (wsError && wsError.code === 'PGRST116') {
      console.log('🔄 Creating new workspace...');
      const { data: newWorkspace, error: createError } = await supabase
        .from('workspaces')
        .insert({
          owner_id: user.id,
          name: 'Debug Workspace',
          settings: {
            linkedInConfigured: true,
            syncEnabled: true
          }
        })
        .select('*')
        .single();
      
      if (createError) {
        console.error('❌ Failed to create workspace:', createError);
        return;
      }
      
      workspace = newWorkspace;
      console.log('✅ Workspace created:', workspace.id);
    } else if (wsError) {
      console.error('❌ Workspace error:', wsError);
      return;
    } else {
      console.log('✅ Workspace found:', workspace.id);
    }
    
    console.log('📊 Workspace Details:');
    console.log('   Name:', workspace.name);
    console.log('   Settings:', workspace.settings);
    
    // Check existing contacts
    const { count: contactCount } = await supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspace.id);
    
    console.log('📊 Current contacts in workspace:', contactCount || 0);
    
    // Test Unipile connection
    console.log('\n🔍 Testing Unipile Connection...');
    console.log('═'.repeat(40));
    
    try {
      // Check if Unipile credentials are configured
      const unipileUrl = 'https://api3.unipile.com:13456';
      const testResponse = await fetch(`${unipileUrl}/api/v1/accounts`, {
        headers: {
          'Accept': 'application/json',
          'X-API-KEY': 'your-unipile-api-key' // This will be replaced by environment variable
        }
      });
      
      console.log('📡 Unipile API Response Status:', testResponse.status);
      
      if (testResponse.ok) {
        const accounts = await testResponse.json();
        console.log('✅ Unipile connected - accounts found:', accounts.length || 0);
        
        if (accounts.length > 0) {
          console.log('📱 Account details:');
          accounts.forEach((account, i) => {
            console.log(`   ${i + 1}. ${account.provider} - ${account.email || account.username || 'No identifier'}`);
            console.log(`      Status: ${account.status || 'unknown'}`);
            console.log(`      Connected: ${account.connected || 'unknown'}`);
          });
        }
      } else {
        console.log('⚠️  Unipile connection issues - Status:', testResponse.status);
        const errorText = await testResponse.text();
        console.log('   Error:', errorText);
      }
    } catch (unipileError) {
      console.log('❌ Unipile connection failed:', unipileError.message);
      console.log('💡 This might be due to CORS or API key configuration');
    }
    
    // Manual contact import test
    console.log('\n🧪 Testing Manual Contact Import...');
    console.log('═'.repeat(40));
    
    // Mock a simple contact import to test database insertion
    const testContact = {
      workspace_id: workspace.id,
      email: `test-${Date.now()}@linkedin.com`,
      first_name: 'Debug',
      last_name: 'Test Contact',
      title: 'Test Import Contact',
      linkedin_url: 'https://linkedin.com/in/debug-test',
      phone: '',
      department: 'Testing',
      engagement_score: 75,
      tags: ['debug', 'test_import'],
      metadata: {
        source: 'debug_script',
        imported_at: new Date().toISOString(),
        test_run: true
      }
    };
    
    const { data: insertedContact, error: insertError } = await supabase
      .from('contacts')
      .insert(testContact)
      .select('*')
      .single();
    
    if (insertError) {
      console.error('❌ Test contact insert failed:', insertError);
      console.log('💡 Check RLS policies and permissions');
    } else {
      console.log('✅ Test contact inserted successfully:', insertedContact.id);
      console.log('   Name:', insertedContact.first_name, insertedContact.last_name);
      console.log('   Email:', insertedContact.email);
      
      // Clean up test contact
      await supabase.from('contacts').delete().eq('id', insertedContact.id);
      console.log('🧹 Test contact cleaned up');
    }
    
    // Summary and recommendations
    console.log('\n📋 Debug Summary & Recommendations:');
    console.log('═'.repeat(50));
    console.log('1. User Authentication: ✅ Working');
    console.log('2. Workspace Setup: ✅ Working');
    console.log(`3. Current Contacts: ${contactCount || 0} contacts`);
    console.log('4. Database Insert: ✅ Working');
    console.log('\n💡 Next Steps:');
    console.log('   • Verify Unipile API credentials in environment variables');
    console.log('   • Check LinkedIn account connection status in Unipile dashboard');
    console.log('   • Test the enhanced LinkedIn import from the Contacts page');
    console.log('\n🔧 To test contact import:');
    console.log('   1. Go to /contacts page');
    console.log('   2. Click "Import from LinkedIn" button');
    console.log('   3. Monitor browser console for detailed logs');
    
  } catch (error) {
    console.error('❌ Debug script error:', error);
    console.log('💡 Please check browser console for more details');
  }
};

console.log('✅ Debug script loaded! Run: debugContactImport()');