#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://latxadqrvrrrcvkktrog.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhdHhhZHFydnJycmN2a2t0cm9nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTk5ODYsImV4cCI6MjA2ODI3NTk4Nn0.3WkAgXpk_MyQioVf_SED9O_ArjcT9nH0uy9we2okftE";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkAuthState() {
  console.log('🔍 Checking Authentication State');
  console.log('==============================');
  
  try {
    // Check if there's an existing session
    console.log('\n1. Checking for existing session...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Session error:', sessionError.message);
    } else if (session) {
      console.log('✅ Active session found:', session.user.email);
      console.log('User ID:', session.user.id);
    } else {
      console.log('ℹ️  No active session');
    }
    
    // Check if we can access profiles (should be empty without auth)
    console.log('\n2. Testing profile access without authentication...');
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .limit(5);
    
    if (profileError) {
      console.log('ℹ️  Profile access blocked (expected):', profileError.message);
    } else {
      console.log('⚠️  Profiles accessible without auth:', profiles);
    }
    
    // Test with a simple email/password that might exist
    console.log('\n3. Testing with admin credentials...');
    
    // Try common test credentials
    const testCredentials = [
      { email: 'admin@innovareai.com', password: 'admin123' },
      { email: 'tl@innovareai.com', password: 'password123' },
      { email: 'test@innovareai.com', password: 'test123' }
    ];
    
    for (const creds of testCredentials) {
      console.log(`\nTrying ${creds.email}...`);
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword(creds);
      
      if (!authError && authData.user) {
        console.log('✅ Successfully authenticated with:', creds.email);
        console.log('User ID:', authData.user.id);
        
        // Try to get profile
        const { data: profile, error: profileErr } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .single();
        
        if (profileErr) {
          console.log('❌ Profile not found:', profileErr.message);
          
          // Try to create profile
          console.log('Attempting to create profile...');
          const { data: newProfile, error: createErr } = await supabase
            .from('profiles')
            .insert({
              id: authData.user.id,
              email: authData.user.email,
              full_name: 'Admin User',
              workspace_id: 'df5d730f-1915-4269-bd5a-9534478b17af',
              role: 'admin'
            })
            .select()
            .single();
          
          if (createErr) {
            console.error('❌ Failed to create profile:', createErr.message);
          } else {
            console.log('✅ Profile created:', newProfile);
          }
        } else {
          console.log('✅ Profile found:', profile);
        }
        
        // Test profile update
        const { data: updated, error: updateErr } = await supabase
          .from('profiles')
          .update({ full_name: 'Updated at ' + new Date().toLocaleTimeString() })
          .eq('id', authData.user.id)
          .select()
          .single();
        
        if (updateErr) {
          console.error('❌ Update failed:', updateErr.message);
        } else {
          console.log('✅ Profile updated:', updated);
        }
        
        await supabase.auth.signOut();
        return; // Exit after first successful auth
      } else {
        console.log('❌ Failed:', authError?.message);
      }
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

checkAuthState().catch(console.error);