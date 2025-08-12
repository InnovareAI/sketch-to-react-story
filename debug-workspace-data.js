#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://latxadqrvrrrcvkktrog.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhdHhhZHFydnJycmN2a2t0cm9nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTk5ODYsImV4cCI6MjA2ODI3NTk4Nn0.3WkAgXpk_MyQioVf_SED9O_ArjcT9nH0uy9we2okftE";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function debugWorkspaceData() {
  console.log('🏢 Workspace & Integration Data Debug');
  console.log('====================================');
  
  // Use our test user
  const testCredentials = {
    email: 'test-1754977579723@example.com',
    password: 'NewTestPassword123!'
  };
  
  try {
    // Authenticate
    console.log('\n1. 🔐 Authenticating...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword(testCredentials);
    
    if (authError) {
      console.error('❌ Auth failed:', authError.message);
      return;
    }
    
    console.log('✅ Authenticated:', authData.user.email);
    
    // Check profile with detailed workspace info (exactly like AuthContext does)
    console.log('\n2. 📋 Loading profile with workspace details...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        full_name,
        role,
        workspace_id,
        avatar_url,
        settings,
        created_at,
        updated_at,
        workspaces:workspace_id (
          id,
          name,
          subscription_tier,
          subscription_status,
          settings,
          created_at
        )
      `)
      .eq('id', authData.user.id)
      .single();
    
    if (profileError) {
      console.error('❌ Profile load failed:', profileError.message);
      return;
    }
    
    console.log('✅ Profile loaded with workspace data:');
    console.log('Profile:', {
      id: profile.id,
      email: profile.email,
      full_name: profile.full_name,
      role: profile.role,
      workspace_id: profile.workspace_id
    });
    console.log('Workspace:', profile.workspaces);
    
    // Format user profile like AuthContext does
    const userProfile = {
      id: profile.id,
      email: profile.email,
      full_name: profile.full_name || profile.email.split('@')[0].toUpperCase(),
      role: profile.role || 'member',
      workspace_id: profile.workspace_id,
      workspace_name: profile.workspaces?.name || 'Unknown Workspace',
      workspace_plan: profile.workspaces?.subscription_tier || 'free',
      status: 'active'
    };
    
    console.log('\n3. 🎯 Formatted user profile (as seen by Profile page):');
    console.log(JSON.stringify(userProfile, null, 2));
    
    // Check if workspace data is missing and why
    if (!profile.workspaces) {
      console.log('\n⚠️  ISSUE FOUND: Workspace data is missing!');
      
      // Check if workspace exists
      console.log('\n4. 🔍 Checking workspace directly...');
      const { data: workspace, error: workspaceError } = await supabase
        .from('workspaces')
        .select('*')
        .eq('id', profile.workspace_id)
        .single();
      
      if (workspaceError) {
        console.error('❌ Workspace not found:', workspaceError.message);
        console.log('🔧 This explains why workspace data is missing!');
      } else {
        console.log('✅ Workspace exists:', workspace);
        console.log('🤔 Workspace exists but join is not working - check foreign key constraint');
      }
    }
    
    // Check all workspaces to understand the data structure
    console.log('\n5. 📊 All workspaces in database:');
    const { data: allWorkspaces, error: workspacesError } = await supabase
      .from('workspaces')
      .select('*');
    
    if (workspacesError) {
      console.error('❌ Could not load workspaces:', workspacesError.message);
    } else {
      console.log('Workspaces:', allWorkspaces);
    }
    
    // Check all profiles to see workspace relationships
    console.log('\n6. 👥 All profiles and their workspaces:');
    const { data: allProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        full_name,
        workspace_id,
        workspaces:workspace_id (name, subscription_tier)
      `)
      .limit(5);
    
    if (profilesError) {
      console.error('❌ Could not load profiles:', profilesError.message);
    } else {
      console.log('Profiles with workspaces:');
      allProfiles.forEach(p => {
        console.log(`  - ${p.email}: workspace_id=${p.workspace_id}, workspace=${p.workspaces?.name || 'MISSING'}`);
      });
    }
    
    await supabase.auth.signOut();
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

debugWorkspaceData().catch(console.error);