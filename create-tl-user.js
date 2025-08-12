#!/usr/bin/env node

/**
 * Script to create tl@innovareai.com user account in Supabase
 * 
 * This script:
 * 1. Creates the auth user with email tl@innovareai.com and password tl@innovareai.com
 * 2. Creates a profile in the profiles table
 * 3. Creates a default workspace if none exists
 * 4. Sets the user as admin/owner role
 * 5. Connects the user to the workspace
 */

import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const SUPABASE_URL = "https://latxadqrvrrrcvkktrog.supabase.co";

// You need to get the SERVICE ROLE KEY from your Supabase dashboard
// Go to: https://supabase.com/dashboard/project/latxadqrvrrrcvkktrog/settings/api
// Copy the "service_role" key (not the anon key)
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  console.log('\n📋 To get your service role key:');
  console.log('1. Go to: https://supabase.com/dashboard/project/latxadqrvrrrcvkktrog/settings/api');
  console.log('2. Copy the "service_role" key (not the anon key)');
  console.log('3. Run this script with: SUPABASE_SERVICE_ROLE_KEY=your_key_here node create-tl-user.js');
  console.log('\nOr add it to your .env.local file as SUPABASE_SERVICE_ROLE_KEY=your_key_here');
  process.exit(1);
}

// Create Supabase client with service role (admin privileges)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const USER_EMAIL = 'tl@innovareai.com';
const USER_PASSWORD = 'tl@innovareai.com';

async function createTLUser() {
  console.log('🚀 Starting user creation process for tl@innovareai.com...\n');

  try {
    // Step 1: Check if user already exists
    console.log('1️⃣ Checking if user already exists...');
    const { data: existingUser, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Error checking existing users:', listError.message);
      return;
    }

    const userExists = existingUser.users.find(user => user.email === USER_EMAIL);
    
    if (userExists) {
      console.log('⚠️  User already exists with ID:', userExists.id);
      console.log('Proceeding to check/create profile and workspace...\n');
    } else {
      // Step 2: Create the auth user
      console.log('2️⃣ Creating auth user...');
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: USER_EMAIL,
        password: USER_PASSWORD,
        email_confirm: true // Auto-confirm email
      });

      if (authError) {
        console.error('❌ Error creating auth user:', authError.message);
        return;
      }

      console.log('✅ Auth user created successfully:', authUser.user.id);
    }

    // Get the user ID (either existing or newly created)
    const userId = userExists?.id || (await supabase.auth.admin.listUsers()).data.users.find(u => u.email === USER_EMAIL)?.id;
    
    if (!userId) {
      console.error('❌ Could not get user ID');
      return;
    }

    // Step 3: Check if default workspace exists, create if not
    console.log('3️⃣ Checking for default workspace...');
    const { data: workspaces, error: workspaceQueryError } = await supabase
      .from('workspaces')
      .select('*')
      .limit(1);

    if (workspaceQueryError) {
      console.error('❌ Error querying workspaces:', workspaceQueryError.message);
      return;
    }

    let workspaceId;
    
    if (workspaces.length === 0) {
      // Create default workspace
      console.log('Creating default workspace...');
      const { data: newWorkspace, error: workspaceError } = await supabase
        .from('workspaces')
        .insert({
          name: 'InnovareAI Default Workspace',
          owner_id: userId,
          settings: {
            features: {
              linkedin: true,
              email: true,
              ai: true,
              campaigns: true,
              analytics: true
            }
          }
        })
        .select()
        .single();

      if (workspaceError) {
        console.error('❌ Error creating workspace:', workspaceError.message);
        return;
      }

      workspaceId = newWorkspace.id;
      console.log('✅ Default workspace created:', workspaceId);
    } else {
      workspaceId = workspaces[0].id;
      console.log('✅ Using existing workspace:', workspaceId);
    }

    // Step 4: Check if profile exists, create if not
    console.log('4️⃣ Checking/creating user profile...');
    const { data: existingProfile, error: profileQueryError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileQueryError && profileQueryError.code !== 'PGRST116') {
      console.error('❌ Error querying profile:', profileQueryError.message);
      return;
    }

    if (!existingProfile) {
      // Create profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: USER_EMAIL,
          first_name: 'TL',
          last_name: 'InnovareAI',
          workspace_id: workspaceId,
          role: 'owner',
          department: 'Leadership',
          permissions: {
            admin: true,
            manage_users: true,
            manage_campaigns: true,
            manage_integrations: true,
            view_analytics: true
          }
        })
        .select()
        .single();

      if (profileError) {
        console.error('❌ Error creating profile:', profileError.message);
        return;
      }

      console.log('✅ Profile created successfully');
    } else {
      console.log('✅ Profile already exists');
      
      // Update workspace_id if needed
      if (existingProfile.workspace_id !== workspaceId) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ workspace_id: workspaceId, role: 'owner' })
          .eq('id', userId);

        if (updateError) {
          console.error('❌ Error updating profile workspace:', updateError.message);
          return;
        }

        console.log('✅ Profile updated with workspace connection');
      }
    }

    // Step 5: Update workspace owner if needed
    console.log('5️⃣ Ensuring workspace ownership...');
    const { error: ownershipError } = await supabase
      .from('workspaces')
      .update({ owner_id: userId })
      .eq('id', workspaceId);

    if (ownershipError) {
      console.error('❌ Error updating workspace ownership:', ownershipError.message);
      return;
    }

    console.log('✅ Workspace ownership confirmed');

    // Success summary
    console.log('\n🎉 User setup completed successfully!');
    console.log('=====================================');
    console.log(`👤 User: ${USER_EMAIL}`);
    console.log(`🔐 Password: ${USER_PASSWORD}`);
    console.log(`📧 User ID: ${userId}`);
    console.log(`🏢 Workspace ID: ${workspaceId}`);
    console.log(`👑 Role: owner`);
    console.log('\n✅ The user can now login to the application!');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

// Run the script
createTLUser();