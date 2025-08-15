import { createClient } from '@supabase/supabase-js';

// Use environment variables or hardcode for testing
const supabaseUrl = 'https://mvpgnfnwlxgqtbvxgtka.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12cGduZm53bHhncXRidnhndGthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM5NzI4NDksImV4cCI6MjA0OTU0ODg0OX0.fK8M-d8EEpwYaL0zj8zWsNaEOPIAMfgN5bIlgRHPJZ0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSignupFlow() {
  console.log('🧪 Testing signup flow...');
  
  const testEmail = 'test-' + Date.now() + '@test.com';
  const testName = 'Test User';
  const tempPassword = crypto.randomUUID();
  
  try {
    console.log('1️⃣ Testing Supabase auth signup...');
    
    // Test auth signup
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: tempPassword,
      options: {
        data: {
          full_name: testName,
          voucher_code: 'TEST-CODE'
        }
      }
    });

    if (authError) {
      console.error('❌ Auth signup failed:', authError.message);
      return false;
    }

    console.log('✅ Auth signup successful:', authData.user?.id);
    
    if (!authData.user) {
      console.error('❌ No user returned from auth');
      return false;
    }

    console.log('2️⃣ Testing workspace creation...');
    
    // Test workspace creation
    const workspaceName = `${testName}'s Workspace`;
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .insert({
        name: workspaceName,
        slug: workspaceName.toLowerCase().replace(/[^a-z0-9]/g, ''),
        subscription_tier: 'pro',
        settings: {
          features: {
            linkedin: true,
            email: true,
            ai: true,
            workflows: true
          }
        }
      })
      .select()
      .single();

    if (workspaceError) {
      console.error('❌ Workspace creation failed:', workspaceError.message);
      return false;
    }

    console.log('✅ Workspace created:', workspace.id);

    console.log('3️⃣ Testing profile creation...');
    
    // Test profile creation
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: testEmail,
        full_name: testName,
        workspace_id: workspace.id,
        role: 'owner'
      })
      .select()
      .single();

    if (profileError) {
      console.error('❌ Profile creation failed:', profileError.message);
      return false;
    }

    console.log('✅ Profile created:', profile.id);

    console.log('4️⃣ Testing auto login...');
    
    // Test auto login
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: tempPassword
    });

    if (signInError) {
      console.error('❌ Auto login failed:', signInError.message);
      // Not a critical failure - user can login manually
    } else {
      console.log('✅ Auto login successful');
    }

    console.log('5️⃣ Cleaning up test data...');
    
    // Cleanup - delete profile and workspace
    await supabase.from('profiles').delete().eq('id', authData.user.id);
    await supabase.from('workspaces').delete().eq('id', workspace.id);
    
    console.log('✅ Test cleanup completed');
    console.log('🎉 SIGNUP FLOW TEST PASSED!');
    
    return true;
    
  } catch (err) {
    console.error('❌ Test failed with error:', err);
    return false;
  }
}

testSignupFlow();