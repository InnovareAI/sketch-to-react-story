#!/usr/bin/env node

/**
 * LinkedIn OAuth Deployment Script
 * Ensures all configuration is ready and deploys to production
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration from .env.local
const CONFIG = {
  clientId: '78094ft3hvizqs',
  productionUrl: 'https://sameaisalesassistant.netlify.app',
  netlifyFunction: '/.netlify/functions/linkedin-callback'
};

function checkLocalEnvironment() {
  console.log('📂 Checking local environment...');
  
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env.local file not found!');
    return false;
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};
  
  envContent.split('\n').forEach(line => {
    if (line.includes('=') && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      const value = valueParts.join('=').trim();
      if (value) {
        envVars[key] = value;
      }
    }
  });
  
  const requiredVars = [
    'VITE_LINKEDIN_CLIENT_ID',
    'VITE_LINKEDIN_CLIENT_SECRET',
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY'
  ];
  
  let allPresent = true;
  console.log('Environment variables:');
  for (const variable of requiredVars) {
    if (envVars[variable]) {
      const maskedValue = variable.includes('SECRET') || variable.includes('KEY') 
        ? `${envVars[variable].slice(0, 8)}...` 
        : envVars[variable];
      console.log(`  ✅ ${variable} = ${maskedValue}`);
    } else {
      console.log(`  ❌ ${variable} is missing`);
      allPresent = false;
    }
  }
  
  return { valid: allPresent, envVars };
}

function generateNetlifyEnvCommands(envVars) {
  console.log('\n🌐 Netlify Environment Variable Commands:');
  console.log('Run these commands OR add via Netlify Dashboard:');
  console.log('Dashboard: https://app.netlify.com/sites/sameaisalesassistant/settings/env\n');
  
  const commands = [
    `netlify env:set VITE_LINKEDIN_CLIENT_ID "${envVars['VITE_LINKEDIN_CLIENT_ID']}"`,
    `netlify env:set VITE_LINKEDIN_CLIENT_SECRET "${envVars['VITE_LINKEDIN_CLIENT_SECRET']}"`,
    `netlify env:set VITE_SUPABASE_URL "${envVars['VITE_SUPABASE_URL']}"`,
    `netlify env:set VITE_SUPABASE_ANON_KEY "${envVars['VITE_SUPABASE_ANON_KEY']}"`,
  ];
  
  if (envVars['VITE_OPENAI_API_KEY']) {
    commands.push(`netlify env:set VITE_OPENAI_API_KEY "${envVars['VITE_OPENAI_API_KEY']}"`);
  }
  
  if (envVars['VITE_ANTHROPIC_API_KEY']) {
    commands.push(`netlify env:set VITE_ANTHROPIC_API_KEY "${envVars['VITE_ANTHROPIC_API_KEY']}"`);
  }
  
  commands.forEach(cmd => console.log(cmd));
  
  return commands;
}

function generateLinkedInConfiguration() {
  const redirectUris = [
    `${CONFIG.productionUrl}${CONFIG.netlifyFunction}`,
    `http://localhost:5173${CONFIG.netlifyFunction}`
  ];
  
  console.log('\n🔧 LinkedIn Developer Portal Configuration:');
  console.log('═══════════════════════════════════════════');
  console.log(`1. Go to: https://www.linkedin.com/developers/apps`);
  console.log(`2. Find app with Client ID: ${CONFIG.clientId}`);
  console.log(`3. In Auth tab → Authorized redirect URLs, add EXACTLY:`);
  redirectUris.forEach((uri, index) => {
    console.log(`   ${uri}`);
  });
  console.log(`4. Required OAuth 2.0 scopes: openid, profile, email`);
  console.log(`5. Products required: "Sign In with LinkedIn using OpenID Connect"`);
  console.log(`6. App status must be: "Live" (not Draft)`);
  console.log(`7. Privacy policy URL (if required): ${CONFIG.productionUrl}/privacy`);
  
  return redirectUris;
}

async function testConfiguration() {
  console.log('\n🧪 Testing Configuration:');
  console.log('═══════════════════════════');
  
  try {
    // Test Netlify function
    console.log('Testing Netlify function...');
    const { default: fetch } = await import('node-fetch');
    const response = await fetch(`${CONFIG.productionUrl}${CONFIG.netlifyFunction}?test=1`);
    const data = await response.json();
    
    if (data.message === 'Function is working!') {
      console.log('✅ Netlify function is accessible');
    } else {
      console.log('❌ Netlify function returned unexpected response');
    }
  } catch (error) {
    console.log(`❌ Netlify function test failed: ${error.message}`);
  }
  
  // Generate test URLs
  const state = 'test_' + Date.now();
  const prodTestUrl = `https://www.linkedin.com/oauth/v2/authorization?` +
    `response_type=code&client_id=${CONFIG.clientId}&` +
    `redirect_uri=${encodeURIComponent(CONFIG.productionUrl + CONFIG.netlifyFunction)}&` +
    `state=${state}&scope=openid+profile+email`;
  
  console.log('\n📱 Production OAuth Test URL:');
  console.log(prodTestUrl);
  
  console.log('\n📋 Manual Test Steps:');
  console.log('1. Open the OAuth test URL above in a browser');
  console.log('2. If popup closes immediately → LinkedIn Developer Portal misconfiguration');
  console.log('3. If LinkedIn login appears → Configuration is correct!');
  console.log('4. Complete login to test full OAuth flow');
}

function generateDeploymentChecklist() {
  console.log('\n📋 Deployment Checklist:');
  console.log('═══════════════════════════');
  console.log('□ Local environment variables are configured (.env.local)');
  console.log('□ LinkedIn Developer Portal redirect URIs are configured');
  console.log('□ LinkedIn app is in "Live" status');
  console.log('□ Required LinkedIn products are added to app');
  console.log('□ Netlify environment variables are configured');
  console.log('□ Latest code is pushed to main branch');
  console.log('□ Netlify deployment completed successfully');
  console.log('□ OAuth flow tested and working');
  
  console.log('\n🚀 Ready to Deploy:');
  console.log('git add . && git commit -m "feat: complete LinkedIn OAuth configuration" && git push origin main');
}

async function main() {
  console.log('🎯 LinkedIn OAuth Deployment Configuration');
  console.log('═══════════════════════════════════════════════');
  
  const { valid, envVars } = checkLocalEnvironment();
  
  if (!valid) {
    console.log('\n❌ Local environment is not properly configured.');
    console.log('Please fix the missing environment variables in .env.local first.');
    return;
  }
  
  generateNetlifyEnvCommands(envVars);
  generateLinkedInConfiguration();
  await testConfiguration();
  generateDeploymentChecklist();
  
  console.log('\n💡 Next Steps:');
  console.log('1. Configure LinkedIn Developer Portal (see above)');
  console.log('2. Set Netlify environment variables (see commands above)');
  console.log('3. Deploy to production using git commands');
  console.log('4. Test OAuth flow using the test URL provided');
  
  console.log('\n🔗 Quick Links:');
  console.log('• LinkedIn Apps: https://www.linkedin.com/developers/apps');
  console.log('• Netlify Dashboard: https://app.netlify.com/sites/sameaisalesassistant');
  console.log('• Production Site: https://sameaisalesassistant.netlify.app');
  console.log('• OAuth Test Page: https://sameaisalesassistant.netlify.app/linkedin-oauth-test.html');
}

main().catch(console.error);