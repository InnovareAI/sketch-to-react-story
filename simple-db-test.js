#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://latxadqrvrrrcvkktrog.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhdHhhZHFydnJycmN2a2t0cm9nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTk5ODYsImV4cCI6MjA2ODI3NTk4Nn0.3WkAgXpk_MyQioVf_SED9O_ArjcT9nH0uy9we2okftE";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testConnection() {
  console.log('🧪 Simple Database Test');
  console.log('======================');
  
  // Test 1: Check if profiles table exists
  console.log('\n1. Testing profiles table access...');
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
    .limit(5);
  
  if (profilesError) {
    console.error('❌ Profiles table error:', profilesError.message);
    console.log('Full error:', profilesError);
  } else {
    console.log('✅ Profiles table accessible');
    console.log(`📊 Found ${profiles.length} profiles`);
    if (profiles.length > 0) {
      console.log('Sample profile:', profiles[0]);
    }
  }
  
  // Test 2: Check specific user
  const testUserId = '3d0cafd6-57cd-4bcb-a105-af7784038105';
  console.log(`\n2. Looking for user: ${testUserId}`);
  
  const { data: userProfile, error: userError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', testUserId)
    .single();
  
  if (userError) {
    console.error('❌ User lookup error:', userError.message);
    if (userError.code === 'PGRST116') {
      console.log('🔍 User not found - this explains the save issue!');
    }
  } else {
    console.log('✅ User found:', userProfile);
  }
  
  // Test 3: Try to create the user profile
  console.log('\n3. Attempting to create user profile...');
  const testProfile = {
    id: testUserId,
    email: 'tl@innovareai.com',
    full_name: 'TL InnovareAI',
    role: 'admin',
    workspace_id: 'df5d730f-1915-4269-bd5a-9534478b17af'
  };
  
  const { data: insertResult, error: insertError } = await supabase
    .from('profiles')
    .insert(testProfile)
    .select()
    .single();
  
  if (insertError) {
    console.error('❌ Insert failed:', insertError.message);
    console.log('Error code:', insertError.code);
    console.log('Error details:', insertError.details);
    
    // If insert fails, try upsert
    console.log('\n3b. Trying upsert instead...');
    const { data: upsertResult, error: upsertError } = await supabase
      .from('profiles')
      .upsert(testProfile)
      .select()
      .single();
    
    if (upsertError) {
      console.error('❌ Upsert also failed:', upsertError.message);
    } else {
      console.log('✅ Upsert successful:', upsertResult);
    }
  } else {
    console.log('✅ Insert successful:', insertResult);
  }
  
  // Test 4: Check workspaces table
  console.log('\n4. Checking workspaces table...');
  const { data: workspaces, error: workspacesError } = await supabase
    .from('workspaces')
    .select('*')
    .limit(3);
  
  if (workspacesError) {
    console.error('❌ Workspaces error:', workspacesError.message);
  } else {
    console.log('✅ Workspaces accessible');
    console.log(`📊 Found ${workspaces.length} workspaces`);
    workspaces.forEach(ws => {
      console.log(`  - ${ws.name} (${ws.id})`);
    });
  }
}

testConnection().catch(console.error);