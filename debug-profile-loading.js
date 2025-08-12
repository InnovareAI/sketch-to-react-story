/**
 * Debug Profile Loading Issue
 * Tests if the profile exists and can be loaded
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing environment variables:');
  console.error('VITE_SUPABASE_URL:', !!SUPABASE_URL);
  console.error('SUPABASE_SERVICE_KEY:', !!SUPABASE_SERVICE_KEY);
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const USER_ID = '3d0cafd6-57cd-4bcb-a105-af7784038105';
const EMAIL = 'tl@innovareai.com';
const WORKSPACE_ID = 'df5d730f-1915-4269-bd5a-9534478b17af';

async function debugProfileLoading() {
  console.log('\n=== SAM AI Profile Loading Debug ===\n');
  
  try {
    // Test 1: Check if profiles table exists
    console.log('1. Testing profiles table access...');
    const { data: tableTest, error: tableError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (tableError) {
      console.error('❌ Profiles table access failed:', tableError.message);
      return;
    }
    console.log('✅ Profiles table accessible');

    // Test 2: Check if user profile exists
    console.log('\n2. Checking if user profile exists...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', USER_ID)
      .single();
    
    if (profileError) {
      console.error('❌ User profile not found:', profileError.message);
      
      // Test 3: Create profile if missing
      console.log('\n3. Attempting to create missing profile...');
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: USER_ID,
          email: EMAIL,
          full_name: 'Tony Lee',
          workspace_id: WORKSPACE_ID,
          role: 'owner'
        })
        .select()
        .single();
      
      if (createError) {
        console.error('❌ Failed to create profile:', createError.message);
        return;
      }
      console.log('✅ Profile created successfully:', newProfile);
    } else {
      console.log('✅ User profile found:', profile);
    }

    // Test 4: Check workspace exists
    console.log('\n4. Checking workspace...');
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('*')
      .eq('id', WORKSPACE_ID)
      .single();
    
    if (workspaceError) {
      console.error('❌ Workspace not found:', workspaceError.message);
      
      // Create workspace if missing
      console.log('\n5. Creating missing workspace...');
      const { data: newWorkspace, error: createWorkspaceError } = await supabase
        .from('workspaces')
        .insert({
          id: WORKSPACE_ID,
          name: 'InnovareAI',
          slug: 'innovareai',
          subscription_tier: 'pro'
        })
        .select()
        .single();
      
      if (createWorkspaceError) {
        console.error('❌ Failed to create workspace:', createWorkspaceError.message);
        return;
      }
      console.log('✅ Workspace created successfully:', newWorkspace);
    } else {
      console.log('✅ Workspace found:', workspace);
    }

    // Test 5: Test the exact query from AuthContext
    console.log('\n6. Testing AuthContext query...');
    const { data: userRecord, error: userError } = await supabase
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
      .eq('id', USER_ID)
      .single();

    if (userError) {
      console.error('❌ AuthContext query failed:', userError.message);
      return;
    }
    
    console.log('✅ AuthContext query successful:', userRecord);
    
    // Test the exact profile formatting
    const userProfile = {
      id: userRecord.id,
      email: userRecord.email,
      full_name: userRecord.full_name ? 
        (userRecord.full_name.length > 2 ? 
          userRecord.full_name.charAt(0).toUpperCase() + userRecord.full_name.slice(1) : 
          userRecord.full_name.toUpperCase()
        ) : 
        userRecord.email.split('@')[0].toUpperCase(),
      role: userRecord.role || 'member',
      workspace_id: userRecord.workspace_id,
      workspace_name: userRecord.workspaces?.name || 'Unknown Workspace',
      workspace_plan: userRecord.workspaces?.subscription_tier || 'free',
      status: 'active'
    };
    
    console.log('\n✅ Formatted user profile:', userProfile);
    console.log('\n🎉 Profile loading should now work!');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

debugProfileLoading().catch(console.error);