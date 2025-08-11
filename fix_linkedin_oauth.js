/**
 * LinkedIn OAuth Configuration Fix
 * Identifies and fixes URL configuration issues
 */

import { readFile, writeFile } from 'fs/promises';
import { glob } from 'glob';

// Configuration based on CLAUDE.md context
const CORRECT_PRODUCTION_URL = 'https://sketch-to-react-story.netlify.app';
const INCORRECT_URL = 'https://sameaisalesassistant.netlify.app';

async function analyzeAndFixOAuthConfig() {
  console.log('🔧 LinkedIn OAuth Configuration Fix');
  console.log('=====================================\n');

  // Step 1: Identify all files with incorrect URL
  console.log('1. Scanning for URL configuration issues...');
  const files = await glob('**/*.{js,ts,tsx,json,md,html,sh}', {
    ignore: ['node_modules/**', 'dist/**', '.git/**', '*.log']
  });

  const filesToFix = [];
  
  for (const file of files) {
    try {
      const content = await readFile(file, 'utf-8');
      if (content.includes(INCORRECT_URL)) {
        filesToFix.push(file);
        console.log(`   ❌ Found incorrect URL in: ${file}`);
      }
    } catch (error) {
      // Skip files that can't be read
    }
  }

  if (filesToFix.length === 0) {
    console.log('   ✅ No URL configuration issues found');
  }
  console.log('');

  // Step 2: Show specific issues found
  console.log('2. OAuth Configuration Analysis:');
  
  // Check Netlify function
  try {
    const netlifyFunction = await readFile('netlify/functions/linkedin-callback.js', 'utf-8');
    if (netlifyFunction.includes(INCORRECT_URL)) {
      console.log('   ❌ Netlify function has incorrect redirect URI');
    } else {
      console.log('   ✅ Netlify function redirect URI looks correct');
    }
  } catch (error) {
    console.log('   ❓ Could not check Netlify function');
  }

  // Check OAuth service
  try {
    const oauthService = await readFile('src/services/linkedin/LinkedInOAuth.ts', 'utf-8');
    if (oauthService.includes('window.location.origin')) {
      console.log('   ✅ OAuth service uses dynamic origin (good)');
    } else {
      console.log('   ❌ OAuth service may have hardcoded URL');
    }
  } catch (error) {
    console.log('   ❓ Could not check OAuth service');
  }

  // Check environment variables
  try {
    const envLocal = await readFile('.env.local', 'utf-8');
    console.log('   📋 Environment variables status:');
    console.log(`      LINKEDIN_CLIENT_ID: ${envLocal.includes('VITE_LINKEDIN_CLIENT_ID=78094ft3hvizqs') ? 'Set' : 'Missing'}`);
    console.log(`      LINKEDIN_CLIENT_SECRET: ${envLocal.includes('VITE_LINKEDIN_CLIENT_SECRET=') ? 'Set' : 'Missing'}`);
  } catch (error) {
    console.log('   ❓ Could not check environment variables');
  }
  console.log('');

  // Step 3: Show what needs to be done
  console.log('3. Required Actions:');
  console.log('   📱 LinkedIn Developer Portal:');
  console.log(`      - Update redirect URI to: ${CORRECT_PRODUCTION_URL}/.netlify/functions/linkedin-callback`);
  console.log(`      - Ensure app status is "Live" not "Draft"`);
  console.log(`      - Verify OAuth 2.0 scopes: openid, profile, email`);
  console.log('');
  
  console.log('   🔧 Code Changes Needed:');
  if (filesToFix.length > 0) {
    console.log('      - Update hardcoded URLs in the following files:');
    filesToFix.forEach(file => console.log(`        * ${file}`));
  } else {
    console.log('      - No hardcoded URL changes needed (using dynamic origin)');
  }
  console.log('');

  console.log('   🌐 Netlify Environment Variables:');
  console.log('      - Verify VITE_LINKEDIN_CLIENT_ID matches LinkedIn app');
  console.log('      - Verify VITE_LINKEDIN_CLIENT_SECRET is correct');
  console.log('      - Ensure variables are deployed to production');
  console.log('');

  // Step 4: Test current configuration
  console.log('4. Testing Current OAuth Flow:');
  
  const testState = 'test_' + Date.now();
  const testAuthUrl = `https://www.linkedin.com/oauth/v2/authorization?${new URLSearchParams({
    response_type: 'code',
    client_id: '78094ft3hvizqs',
    redirect_uri: `${CORRECT_PRODUCTION_URL}/.netlify/functions/linkedin-callback`,
    state: testState,
    scope: 'openid profile email'
  }).toString()}`;
  
  console.log('   🔗 Test Authorization URL:');
  console.log(`      ${testAuthUrl}`);
  console.log('');

  // Step 5: Debugging steps
  console.log('5. Debugging Steps:');
  console.log('   1. Open browser developer tools');
  console.log('   2. Go to Network tab');
  console.log('   3. Try LinkedIn OAuth flow');
  console.log('   4. Check for failed requests or CORS errors');
  console.log('   5. Verify popup window behavior');
  console.log('   6. Check Netlify function logs at https://app.netlify.com');
  console.log('');

  return {
    filesToFix,
    correctUrl: CORRECT_PRODUCTION_URL,
    testAuthUrl
  };
}

// Run the analysis
analyzeAndFixOAuthConfig().then(result => {
  console.log('🎯 Summary:');
  console.log(`   Files with URL issues: ${result.filesToFix.length}`);
  console.log(`   Correct production URL: ${result.correctUrl}`);
  console.log('\n✅ Analysis complete! Follow the actions above to fix OAuth flow.');
}).catch(console.error);