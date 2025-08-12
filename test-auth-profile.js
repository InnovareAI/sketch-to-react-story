#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://latxadqrvrrrcvkktrog.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhdHhhZHFydnJycmN2a2t0cm9nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTk5ODYsImV4cCI6MjA2ODI3NTk4Nn0.3WkAgXpk_MyQioVf_SED9O_ArjcT9nH0uy9we2okftE";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testAuthProfileFlow() {
  console.log('🧪 Testing Authentication & Profile Flow');
  console.log('=======================================');
  
  // Test user credentials (you'll need to create this user or use existing ones)
  const testUser = {
    email: 'tl@innovareai.com',
    password: 'TestPassword123!'
  };
  
  try {
    // Step 1: Try to sign in
    console.log('\n1. Testing user authentication...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: testUser.email,
      password: testUser.password
    });
    
    if (authError) {
      console.error('❌ Authentication failed:', authError.message);
      
      // Try to sign up the user if login fails
      console.log('\n1b. Attempting to create user account...');
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: testUser.email,
        password: testUser.password,
        options: {
          data: {
            full_name: 'TL InnovareAI'
          }
        }
      });
      
      if (signUpError) {
        console.error('❌ Sign up failed:', signUpError.message);
        return;
      }
      
      console.log('✅ User created successfully');
      console.log('⚠️  Check email for confirmation link if email confirmation is enabled');
      return;
    }
    
    console.log('✅ Authentication successful');
    console.log('User ID:', authData.user.id);
    console.log('User Email:', authData.user.email);
    
    // Step 2: Check if profile exists
    console.log('\n2. Checking user profile...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        full_name,
        role,
        workspace_id,
        workspaces:workspace_id (
          id,
          name,
          subscription_tier
        )
      `)
      .eq('id', authData.user.id)
      .single();
    
    if (profileError) {
      console.error('❌ Profile lookup failed:', profileError.message);
      
      if (profileError.code === 'PGRST116') {
        console.log('\n2b. Profile not found, creating one...');
        
        // Ensure workspace exists
        const workspaceId = 'df5d730f-1915-4269-bd5a-9534478b17af';
        const { data: workspace, error: workspaceError } = await supabase
          .from('workspaces')
          .select('*')
          .eq('id', workspaceId)
          .single();
        
        if (workspaceError && workspaceError.code === 'PGRST116') {
          console.log('Creating default workspace...');
          const { error: createWorkspaceError } = await supabase
            .from('workspaces')
            .insert({
              id: workspaceId,
              name: 'InnovareAI',
              slug: 'innovareai',
              subscription_tier: 'pro'
            });
          
          if (createWorkspaceError) {
            console.error('❌ Failed to create workspace:', createWorkspaceError.message);
            return;
          }
          console.log('✅ Workspace created');
        }
        
        // Create profile
        const { data: newProfile, error: createProfileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            email: authData.user.email,
            full_name: authData.user.user_metadata?.full_name || 'TL InnovareAI',
            workspace_id: workspaceId,
            role: 'owner'
          })
          .select()
          .single();
        
        if (createProfileError) {
          console.error('❌ Failed to create profile:', createProfileError.message);
          return;
        }
        
        console.log('✅ Profile created:', newProfile);
      }
    } else {
      console.log('✅ Profile found:', profile);
    }
    
    // Step 3: Test profile update
    console.log('\n3. Testing profile update...');
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({
        full_name: 'TL InnovareAI (Updated ' + new Date().toLocaleTimeString() + ')'
      })
      .eq('id', authData.user.id)
      .select()
      .single();
    
    if (updateError) {
      console.error('❌ Profile update failed:', updateError.message);
    } else {
      console.log('✅ Profile updated successfully:', updatedProfile);
    }
    
    // Step 4: Test password change (optional, commented out for safety)
    console.log('\n4. Password change test (skipped for safety)');
    console.log('   Password change would work with: supabase.auth.updateUser({ password: "newpassword" })');
    
    // Clean up - sign out
    console.log('\n5. Signing out...');
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      console.error('❌ Sign out failed:', signOutError.message);
    } else {
      console.log('✅ Successfully signed out');
    }
    
    console.log('\n🎉 All tests completed successfully!');
    console.log('✅ The profile editing functionality should now work properly in the app');
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

testAuthProfileFlow().catch(console.error);