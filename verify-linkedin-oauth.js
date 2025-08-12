#!/usr/bin/env node

/**
 * LinkedIn OAuth Integration Verification Script
 * Checks all components needed for LinkedIn OAuth to work properly
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  clientId: '78094ft3hvizqs',
  productionUrl: 'https://sameaisalesassistant.netlify.app',
  localUrl: 'http://localhost:5173',
  netlifyFunction: '/.netlify/functions/linkedin-callback'
};

async function checkNetlifyFunction() {
  console.log('\n🔧 Testing Netlify Function...');
  
  try {
    const testUrl = `${CONFIG.productionUrl}${CONFIG.netlifyFunction}?test=1`;
    const response = await fetch(testUrl);
    const data = await response.json();
    
    if (data.message === 'Function is working!') {
      console.log('✅ Netlify function is accessible and working');
      return true;
    } else {
      console.log('❌ Netlify function returned unexpected response:', data);
      return false;
    }
  } catch (error) {
    console.log('❌ Netlify function test failed:', error.message);
    return false;
  }
}

function checkLocalEnvironment() {
  console.log('\n📂 Checking Local Environment Variables...');
  
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    console.log('❌ .env.local file not found');
    return false;
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const requiredVars = [
    'VITE_LINKEDIN_CLIENT_ID',
    'VITE_LINKEDIN_CLIENT_SECRET',
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY'
  ];
  
  let allPresent = true;
  for (const variable of requiredVars) {
    if (envContent.includes(`${variable}=`) && !envContent.includes(`${variable}=\n`)) {
      console.log(`✅ ${variable} is set`);
    } else {
      console.log(`❌ ${variable} is missing or empty`);
      allPresent = false;
    }
  }
  
  // Check if Client ID matches expected
  if (envContent.includes(`VITE_LINKEDIN_CLIENT_ID=${CONFIG.clientId}`)) {
    console.log('✅ LinkedIn Client ID matches configuration');
  } else {
    console.log(`❌ LinkedIn Client ID mismatch or missing`);
    allPresent = false;
  }
  
  return allPresent;
}

function checkLinkedInCallbackComponent() {
  console.log('\n🔗 Checking LinkedInCallback Component...');
  
  const callbackPath = path.join(process.cwd(), 'src/pages/auth/LinkedInCallback.tsx');
  if (!fs.existsSync(callbackPath)) {
    console.log('❌ LinkedInCallback.tsx not found');
    return false;
  }
  
  const callbackContent = fs.readFileSync(callbackPath, 'utf8');
  
  // Check for key components
  const checks = [
    { check: callbackContent.includes('useSearchParams'), msg: 'URL parameter handling' },
    { check: callbackContent.includes('linkedInOAuth'), msg: 'LinkedIn OAuth service import' },
    { check: callbackContent.includes('team_accounts'), msg: 'Database integration' },
    { check: callbackContent.includes('window.opener'), msg: 'Popup handling' },
    { check: callbackContent.includes('error handling'), msg: 'Error handling' }
  ];
  
  let allPresent = true;
  for (const { check, msg } of checks) {
    if (check) {
      console.log(`✅ ${msg} present`);
    } else {
      console.log(`❌ ${msg} missing`);
      allPresent = false;
    }
  }
  
  return allPresent;
}

function checkNetlifyFunctionCode() {
  console.log('\n⚡ Checking Netlify Function Code...');
  
  const functionPath = path.join(process.cwd(), 'netlify/functions/linkedin-callback.js');
  if (!fs.existsSync(functionPath)) {
    console.log('❌ linkedin-callback.js function not found');
    return false;
  }
  
  const functionContent = fs.readFileSync(functionPath, 'utf8');
  
  // Check for key components
  const checks = [
    { check: functionContent.includes('oauth/v2/accessToken'), msg: 'Token exchange endpoint' },
    { check: functionContent.includes('userinfo'), msg: 'Profile fetch endpoint' },
    { check: functionContent.includes('process.env.VITE_LINKEDIN_CLIENT_ID'), msg: 'Client ID from env' },
    { check: functionContent.includes('process.env.VITE_LINKEDIN_CLIENT_SECRET'), msg: 'Client secret from env' },
    { check: functionContent.includes('base64'), msg: 'Data encoding for frontend' }
  ];
  
  let allPresent = true;
  for (const { check, msg } of checks) {
    if (check) {
      console.log(`✅ ${msg} implemented`);
    } else {
      console.log(`❌ ${msg} missing`);
      allPresent = false;
    }
  }
  
  return allPresent;
}

async function generateOAuthTestURL() {
  console.log('\n🔗 OAuth Test URLs:');
  
  const baseParams = {
    response_type: 'code',
    client_id: CONFIG.clientId,
    state: 'test_' + Date.now(),
    scope: 'openid profile email'
  };
  
  // Production URL
  const prodParams = new URLSearchParams({
    ...baseParams,
    redirect_uri: `${CONFIG.productionUrl}${CONFIG.netlifyFunction}`
  });
  const prodUrl = `https://www.linkedin.com/oauth/v2/authorization?${prodParams.toString()}`;
  
  // Local URL
  const localParams = new URLSearchParams({
    ...baseParams,
    redirect_uri: `${CONFIG.localUrl}${CONFIG.netlifyFunction}`
  });
  const localUrl = `https://www.linkedin.com/oauth/v2/authorization?${localParams.toString()}`;
  
  console.log('\n📱 Production OAuth URL:');
  console.log(prodUrl);
  
  console.log('\n💻 Local Development OAuth URL:');
  console.log(localUrl);
  
  return { prodUrl, localUrl };
}

function printLinkedInConfiguration() {
  console.log('\n🔧 LinkedIn Developer Portal Configuration Required:');
  console.log('\n1. Go to: https://www.linkedin.com/developers/apps');
  console.log(`2. Find app with Client ID: ${CONFIG.clientId}`);
  console.log('3. In Auth tab, add these Authorized redirect URLs:');
  console.log(`   • ${CONFIG.productionUrl}${CONFIG.netlifyFunction}`);
  console.log(`   • ${CONFIG.localUrl}${CONFIG.netlifyFunction}`);
  console.log('4. Required OAuth 2.0 scopes: openid, profile, email');
  console.log('5. Ensure app status is "Live" (not Draft)');
  console.log('6. Products: Add "Sign In with LinkedIn using OpenID Connect"');
}

function printNetlifyConfiguration() {
  console.log('\n🌐 Netlify Environment Variables Required:');
  console.log('\n1. Go to: https://app.netlify.com/sites/sameaisalesassistant/settings/env');
  console.log('2. Add these environment variables:');
  console.log('   • VITE_LINKEDIN_CLIENT_ID = 78094ft3hvizqs');
  console.log('   • VITE_LINKEDIN_CLIENT_SECRET = [from .env.local]');
  console.log('   • VITE_SUPABASE_URL = [from .env.local]');
  console.log('   • VITE_SUPABASE_ANON_KEY = [from .env.local]');
  console.log('3. Trigger a new deployment after adding variables');
}

async function main() {
  console.log('🚀 LinkedIn OAuth Integration Verification');
  console.log('==========================================');
  
  const checks = [
    { name: 'Local Environment', fn: checkLocalEnvironment },
    { name: 'LinkedInCallback Component', fn: checkLinkedInCallbackComponent },
    { name: 'Netlify Function Code', fn: checkNetlifyFunctionCode },
    { name: 'Netlify Function Accessibility', fn: checkNetlifyFunction }
  ];
  
  const results = [];
  for (const { name, fn } of checks) {
    const result = await fn();
    results.push({ name, passed: result });
  }
  
  console.log('\n📊 Verification Summary:');
  console.log('========================');
  
  results.forEach(({ name, passed }) => {
    console.log(`${passed ? '✅' : '❌'} ${name}`);
  });
  
  const allPassed = results.every(r => r.passed);
  
  if (allPassed) {
    console.log('\n🎉 All technical components are ready!');
    console.log('\n🔄 Next Steps:');
    console.log('1. Configure LinkedIn Developer Portal (see below)');
    console.log('2. Add environment variables to Netlify (see below)');
    console.log('3. Test OAuth flow using the generated URLs');
  } else {
    console.log('\n⚠️  Some components need attention before OAuth will work.');
  }
  
  await generateOAuthTestURL();
  printLinkedInConfiguration();
  printNetlifyConfiguration();
  
  console.log('\n🧪 Testing Tools:');
  console.log('• Test page: linkedin-oauth-test.html');
  console.log('• Manual URL test: Use the OAuth URLs generated above');
  console.log('• Function test: curl "https://sameaisalesassistant.netlify.app/.netlify/functions/linkedin-callback?test=1"');
}

// Add fetch polyfill and run main
(async () => {
  if (typeof fetch === 'undefined') {
    const { default: fetch } = await import('node-fetch');
    global.fetch = fetch;
  }
  await main();
})().catch(console.error);