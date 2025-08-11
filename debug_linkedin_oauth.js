/**
 * LinkedIn OAuth Debug Script
 * Tests the complete OAuth flow to identify issues
 */

import fetch from 'node-fetch';

// Test configuration
const LINKEDIN_CLIENT_ID = '78094ft3hvizqs';
const LINKEDIN_CLIENT_SECRET = 'WPL_AP1.r88IfXzVhe12NUdM.spqg9Q==';
const REDIRECT_URI = 'https://sameaisalesassistant.netlify.app/.netlify/functions/linkedin-callback';

async function debugLinkedInOAuth() {
  console.log('🔍 LinkedIn OAuth Debug Script');
  console.log('================================\n');

  // Step 1: Test authorization URL generation
  console.log('1. Testing Authorization URL Generation...');
  const state = 'test_' + Date.now();
  const scope = ['openid', 'profile', 'email'].join(' ');
  
  const authUrl = `https://www.linkedin.com/oauth/v2/authorization?${new URLSearchParams({
    response_type: 'code',
    client_id: LINKEDIN_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    state: state,
    scope: scope
  }).toString()}`;
  
  console.log('✅ Authorization URL:', authUrl);
  console.log('');

  // Step 2: Test Netlify function accessibility
  console.log('2. Testing Netlify Function Accessibility...');
  try {
    const testResponse = await fetch(`${REDIRECT_URI}?test=1`);
    const testResult = await testResponse.text();
    console.log('✅ Netlify function status:', testResponse.status);
    console.log('✅ Netlify function response:', testResult);
  } catch (error) {
    console.log('❌ Error accessing Netlify function:', error.message);
  }
  console.log('');

  // Step 3: Test LinkedIn API endpoints (without token)
  console.log('3. Testing LinkedIn API Endpoints...');
  try {
    const tokenEndpoint = 'https://www.linkedin.com/oauth/v2/accessToken';
    const userInfoEndpoint = 'https://api.linkedin.com/v2/userinfo';
    
    console.log('✅ Token endpoint URL:', tokenEndpoint);
    console.log('✅ UserInfo endpoint URL:', userInfoEndpoint);
    
    // Test token endpoint with invalid parameters to see error response
    const tokenResponse = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: 'invalid_code',
        redirect_uri: REDIRECT_URI,
        client_id: LINKEDIN_CLIENT_ID,
        client_secret: LINKEDIN_CLIENT_SECRET
      }).toString()
    });
    
    const tokenResult = await tokenResponse.text();
    console.log('ℹ️  Token endpoint test status:', tokenResponse.status);
    console.log('ℹ️  Token endpoint test response:', tokenResult);
    
  } catch (error) {
    console.log('❌ Error testing LinkedIn endpoints:', error.message);
  }
  console.log('');

  // Step 4: Check environment configuration
  console.log('4. Checking Configuration...');
  console.log('✅ Client ID:', LINKEDIN_CLIENT_ID ? 'Present' : 'Missing');
  console.log('✅ Client Secret:', LINKEDIN_CLIENT_SECRET ? 'Present' : 'Missing');
  console.log('✅ Redirect URI:', REDIRECT_URI);
  console.log('✅ Scope:', scope);
  console.log('');

  // Step 5: Simulate common issues
  console.log('5. Common Issue Analysis...');
  
  // Check if redirect URI matches exactly
  const expectedRedirectUri = 'https://sameaisalesassistant.netlify.app/.netlify/functions/linkedin-callback';
  console.log('✅ Redirect URI match:', REDIRECT_URI === expectedRedirectUri ? 'Exact match' : 'Mismatch detected');
  
  // Check for common OAuth errors
  console.log('ℹ️  Common issues to check:');
  console.log('   - LinkedIn Developer Portal redirect URI must match exactly');
  console.log('   - App must be in "Live" status, not "Draft"');
  console.log('   - Correct OAuth 2.0 scopes configured');
  console.log('   - Client credentials are valid and not expired');
  console.log('   - Netlify environment variables are set correctly');
  console.log('');

  console.log('🎯 Next Steps:');
  console.log('1. Verify LinkedIn Developer Portal configuration');
  console.log('2. Check browser network tab during OAuth flow');
  console.log('3. Check Netlify function logs for errors');
  console.log('4. Test with a simple authorization_code flow manually');
}

// Run the debug script
debugLinkedInOAuth().catch(console.error);