#!/usr/bin/env node

// Debug script to test profile database connectivity
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://latxadqrvrrrcvkktrog.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhdHhhZHFydnJycmN2a2t0cm9nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTk5ODYsImV4cCI6MjA2ODI3NTk4Nn0.3WkAgXpk_MyQioVf_SED9O_ArjcT9nH0uy9we2okftE";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function debugDatabase() {
  console.log('🔍 SAM AI Database Connection Debug');
  console.log('=====================================');
  
  try {
    // Test 1: Basic connection
    console.log('\n1. Testing basic database connection...');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('profiles')
      .select('count', { count: 'exact', head: true });
    
    if (connectionError) {
      console.error('❌ Connection failed:', connectionError.message);
      console.log('Error details:', connectionError);
      return;
    }
    
    console.log('✅ Database connection successful');
    console.log(`📊 Profiles table has ${connectionTest.count || 0} records`);
    
    // Test 2: Check table structure
    console.log('\n2. Checking profiles table structure...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.error('❌ Table structure check failed:', tableError.message);
    } else {
      console.log('✅ Table structure accessible');
      if (tableInfo && tableInfo.length > 0) {
        console.log('📝 Sample record fields:', Object.keys(tableInfo[0]));
      }
    }
    
    // Test 3: Check for specific user ID from profile page
    const testUserId = '3d0cafd6-57cd-4bcb-a105-af7784038105';
    console.log(`\n3. Testing specific user lookup (${testUserId})...`);
    
    const { data: userRecord, error: userError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', testUserId);
    
    if (userError) {
      console.error('❌ User lookup failed:', userError.message);
    } else {
      console.log('✅ User lookup query executed');
      if (userRecord && userRecord.length > 0) {
        console.log('👤 User found:', {
          id: userRecord[0].id,
          email: userRecord[0].email,
          full_name: userRecord[0].full_name,
          role: userRecord[0].role
        });
      } else {
        console.log('⚠️  User not found in database');
        console.log('🔧 This explains why profile updates aren\'t persisting');
      }
    }
    
    // Test 4: Try creating/upserting the user record
    console.log('\n4. Testing upsert operation...');
    const testData = {
      id: testUserId,
      email: 'tl@innovareai.com',
      full_name: 'TL InnovareAI Test',
      role: 'admin',
      workspace_id: 'df5d730f-1915-4269-bd5a-9534478b17af'
    };
    
    const { data: upsertResult, error: upsertError } = await supabase
      .from('profiles')
      .upsert(testData, { onConflict: 'id' })
      .select();
    
    if (upsertError) {
      console.error('❌ Upsert failed:', upsertError.message);
      console.log('Full error:', upsertError);
    } else {
      console.log('✅ Upsert successful');
      console.log('💾 Created/updated record:', upsertResult[0]);
    }
    
    // Test 5: Check all profiles to understand the database state
    console.log('\n5. Listing all profiles in database...');
    const { data: allProfiles, error: listError } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, workspace_id')
      .limit(10);
    
    if (listError) {
      console.error('❌ List profiles failed:', listError.message);
    } else {
      console.log('✅ Successfully retrieved profiles');
      console.log('👥 Current profiles in database:');
      allProfiles.forEach((profile, index) => {
        console.log(`   ${index + 1}. ${profile.full_name || 'No name'} (${profile.email}) - Role: ${profile.role}`);
      });
      
      if (allProfiles.length === 0) {
        console.log('⚠️  No profiles found in database - this is the main issue!');
      }
    }
    
    // Test 6: Check if auth.users table exists and has our user
    console.log('\n6. Checking auth.users table...');
    const { data: authUsers, error: authError } = await supabase
      .from('auth.users')
      .select('id, email')
      .eq('id', testUserId);
    
    if (authError) {
      console.log('⚠️  Cannot access auth.users directly (expected for RLS)');
      console.log('Error:', authError.message);
    } else {
      console.log('✅ Auth user check:', authUsers);
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

// Test RLS policies
async function testRLS() {
  console.log('\n🔐 Testing Row Level Security (RLS) policies...');
  
  // This should fail without proper authentication
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', '3d0cafd6-57cd-4bcb-a105-af7784038105');
  
  if (error) {
    console.log('⚠️  RLS is active - queries require authentication');
    console.log('Error:', error.message);
  } else {
    console.log('✅ RLS allows anonymous access (or user is authenticated)');
    console.log('Data:', data);
  }
}

async function main() {
  await debugDatabase();
  await testRLS();
  
  console.log('\n🔧 DIAGNOSIS SUMMARY:');
  console.log('=====================================');
  console.log('1. If user is not found, create the profile record first');
  console.log('2. Check if RLS policies are blocking unauthenticated requests');
  console.log('3. Ensure the hardcoded user ID actually exists in auth.users');
  console.log('4. Consider using dynamic user ID from auth context instead of hardcoded');
  
  process.exit(0);
}

main().catch(console.error);