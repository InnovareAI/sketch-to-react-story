#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://latxadqrvrrrcvkktrog.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhdHhhZHFydnJycmN2a2t0cm9nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTk5ODYsImV4cCI6MjA2ODI3NTk4Nn0.3WkAgXpk_MyQioVf_SED9O_ArjcT9nH0uy9we2okftE";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testLogin() {
  console.log('🧪 Testing Login Flow');
  console.log('==================');
  
  // Use the test credentials we created
  const testEmail = 'test-1755018100009@example.com';
  const testPassword = 'TestPassword123!';
  
  console.log('\n1. Testing direct Supabase login...');
  console.log('Email:', testEmail);
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });
    
    if (error) {
      console.error('❌ Login failed:', error.message);
      console.error('Error details:', error);
      return;
    }
    
    console.log('✅ Auth successful! User ID:', data.user?.id);
    console.log('✅ Session exists:', !!data.session);
    
    // Test profile loading
    console.log('\n2. Testing profile loading...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        full_name,
        role,
        workspace_id,
        avatar_url,
        workspaces:workspace_id (
          id,
          name,
          subscription_tier
        )
      `)
      .eq('id', data.user.id)
      .single();
    
    if (profileError) {
      console.error('❌ Profile loading failed:', profileError.message);
      console.error('Profile error details:', profileError);
    } else {
      console.log('✅ Profile loaded successfully:', {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        role: profile.role,
        workspace_name: profile.workspaces?.name
      });
    }
    
    console.log('\n✅ Login test successful! The credentials are working.');
    console.log('📋 Use these credentials in the app:');
    console.log('   Email:', testEmail);
    console.log('   Password:', testPassword);
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  } finally {
    // Clean up
    await supabase.auth.signOut();
  }
}

testLogin().catch(console.error);