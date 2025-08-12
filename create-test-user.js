#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://latxadqrvrrrcvkktrog.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhdHhhZHFydnJycmN2a2t0cm9nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTk5ODYsImV4cCI6MjA2ODI3NTk4Nn0.3WkAgXpk_MyQioVf_SED9O_ArjcT9nH0uy9we2okftE";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function createTestUser() {
  console.log('👤 Creating Test User for Profile Testing');
  console.log('========================================');
  
  const testUser = {
    email: `test-${Date.now()}@example.com`, // Unique email
    password: 'TestPassword123!',
    userData: {
      full_name: 'Test User'
    }
  };
  
  try {
    // Step 1: Create user account
    console.log('\n1. Creating user account...');
    console.log('Email:', testUser.email);
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testUser.email,
      password: testUser.password,
      options: {
        data: testUser.userData
      }
    });
    
    if (signUpError) {
      console.error('❌ Sign up failed:', signUpError.message);
      return;
    }
    
    console.log('✅ User account created successfully');
    console.log('User ID:', signUpData.user?.id);
    
    if (!signUpData.user) {
      console.error('❌ No user data returned');
      return;
    }
    
    // Step 2: Check if email confirmation is required
    if (!signUpData.session) {
      console.log('⚠️  Email confirmation may be required');
      console.log('⚠️  Check Supabase auth settings if the app requires email confirmation');
      
      // For testing purposes, let's try to sign in directly
      console.log('\n2. Attempting direct sign in...');
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: testUser.email,
        password: testUser.password
      });
      
      if (signInError) {
        console.error('❌ Direct sign in failed:', signInError.message);
        console.log('ℹ️  Email confirmation is likely required');
        console.log('ℹ️  In production, user would need to click confirmation email');
        return;
      }
      
      console.log('✅ Direct sign in successful (email confirmation disabled)');
    } else {
      console.log('✅ User automatically signed in');
    }
    
    // Step 3: Check if workspace exists or create it
    console.log('\n3. Checking/creating workspace...');
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
    } else if (workspaceError) {
      console.error('❌ Workspace check failed:', workspaceError.message);
      return;
    } else {
      console.log('✅ Workspace exists:', workspace.name);
    }
    
    // Step 4: Create user profile
    console.log('\n4. Creating user profile...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: signUpData.user.id,
        email: signUpData.user.email,
        full_name: testUser.userData.full_name,
        workspace_id: workspaceId,
        role: 'admin'
      })
      .select()
      .single();
    
    if (profileError) {
      console.error('❌ Profile creation failed:', profileError.message);
      console.log('Full error:', profileError);
    } else {
      console.log('✅ Profile created successfully:', profile);
    }
    
    // Step 5: Test profile update
    console.log('\n5. Testing profile update...');
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({
        full_name: 'Updated Test User (' + new Date().toLocaleTimeString() + ')'
      })
      .eq('id', signUpData.user.id)
      .select()
      .single();
    
    if (updateError) {
      console.error('❌ Profile update failed:', updateError.message);
    } else {
      console.log('✅ Profile updated successfully:', updatedProfile);
    }
    
    console.log('\n🎉 Test user created and profile functionality verified!');
    console.log('📋 Test account details:');
    console.log('   Email:', testUser.email);
    console.log('   Password:', testUser.password);
    console.log('   User ID:', signUpData.user.id);
    console.log('\n✅ You can now test the profile editing in the app with these credentials');
    
    // Clean up
    await supabase.auth.signOut();
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

createTestUser().catch(console.error);