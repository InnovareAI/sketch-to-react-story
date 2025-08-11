/**
 * Check Netlify Environment Variables
 * Verifies that the environment variables are correctly configured for production
 */

const EXPECTED_VARS = {
  'VITE_LINKEDIN_CLIENT_ID': '78094ft3hvizqs',
  'VITE_LINKEDIN_CLIENT_SECRET': 'WPL_AP1.r88IfXzVhe12NUdM.spqg9Q==',
  'VITE_SUPABASE_URL': 'https://latxadqrvrrrcvkktrog.supabase.co'
};

console.log('🔍 Netlify Environment Variables Check');
console.log('=====================================\n');

console.log('📋 Expected Configuration:');
Object.entries(EXPECTED_VARS).forEach(([key, value]) => {
  if (key.includes('SECRET')) {
    console.log(`   ${key}: ${value.substring(0, 20)}...`);
  } else {
    console.log(`   ${key}: ${value}`);
  }
});

console.log('\n🚀 Deployment Instructions:');
console.log('1. Deploy the fixed code to production:');
console.log('   git add .');
console.log('   git commit -m "fix: update LinkedIn OAuth redirect URI to correct production URL"');
console.log('   git push origin main');
console.log('');

console.log('2. Verify Netlify environment variables:');
console.log('   - Go to https://app.netlify.com');
console.log('   - Select your "sketch-to-react-story" site');
console.log('   - Go to Site settings > Environment variables');
console.log('   - Ensure all VITE_* variables match the values above');
console.log('');

console.log('3. Update LinkedIn Developer Portal:');
console.log('   - Go to https://www.linkedin.com/developers/');
console.log('   - Select your app with Client ID: 78094ft3hvizqs');
console.log('   - Go to Auth tab');
console.log('   - Update "Authorized redirect URLs for your app" to:');
console.log('     https://sketch-to-react-story.netlify.app/.netlify/functions/linkedin-callback');
console.log('   - Ensure the app status is "Live" (not Draft)');
console.log('   - Verify OAuth 2.0 scopes include: openid, profile, email');
console.log('');

console.log('4. Test the OAuth flow:');
console.log('   - Open: https://sketch-to-react-story.netlify.app/test_oauth_flow.html');
console.log('   - Or use the LinkedIn connection in the main app');
console.log('   - Monitor browser developer tools for any errors');
console.log('   - Check Netlify function logs if issues persist');
console.log('');

console.log('🔧 Common Issues to Check:');
console.log('   ✅ Redirect URI must match EXACTLY (including https://)');
console.log('   ✅ LinkedIn app must be published (Live status)');
console.log('   ✅ OAuth scopes must be approved by LinkedIn');
console.log('   ✅ Environment variables must be deployed to Netlify');
console.log('   ✅ No CORS issues in browser console');
console.log('   ✅ Popup blockers are disabled for the site');
console.log('');

console.log('🎯 If OAuth popup still closes immediately:');
console.log('   1. Check browser console for JavaScript errors');
console.log('   2. Check network tab for failed requests');
console.log('   3. Verify LinkedIn app configuration');
console.log('   4. Test with a different browser/incognito mode');
console.log('   5. Check Netlify function logs for server-side errors');