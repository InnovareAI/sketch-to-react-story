#!/usr/bin/env node

/**
 * Configuration Checker for SAM AI Platform
 * This script verifies all required services are configured
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Check if .env.local exists
const envPath = path.join(__dirname, '..', '.env.local');
const envExists = fs.existsSync(envPath);

console.log('\n' + colors.cyan + '===================================' + colors.reset);
console.log(colors.cyan + 'SAM AI Configuration Checker' + colors.reset);
console.log(colors.cyan + '===================================' + colors.reset + '\n');

if (!envExists) {
  console.log(colors.red + '❌ .env.local file not found!' + colors.reset);
  console.log(colors.yellow + '   Run: ./scripts/setup-services.sh' + colors.reset);
  process.exit(1);
}

// Load environment variables
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};

envContent.split('\n').forEach(line => {
  if (line && !line.startsWith('#') && line.includes('=')) {
    const [key, ...valueParts] = line.split('=');
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

// Configuration checks
const checks = [
  {
    name: 'Supabase',
    required: true,
    vars: ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'],
    validate: (vars) => {
      const url = vars['VITE_SUPABASE_URL'];
      const key = vars['VITE_SUPABASE_ANON_KEY'];
      return url && url.includes('supabase.co') && key && key.length > 20;
    }
  },
  {
    name: 'Unipile (LinkedIn OAuth)',
    required: false,
    vars: ['VITE_UNIPILE_API_KEY', 'VITE_UNIPILE_ACCOUNT_ID'],
    validate: (vars) => {
      const apiKey = vars['VITE_UNIPILE_API_KEY'];
      const accountId = vars['VITE_UNIPILE_ACCOUNT_ID'];
      return apiKey && apiKey !== 'demo_key_not_configured' && accountId && accountId !== 'demo_account';
    }
  },
  {
    name: 'Bright Data (Proxy)',
    required: false,
    vars: ['VITE_BRIGHTDATA_CUSTOMER_ID', 'VITE_BRIGHTDATA_PASSWORD'],
    validate: (vars) => {
      const customerId = vars['VITE_BRIGHTDATA_CUSTOMER_ID'];
      const password = vars['VITE_BRIGHTDATA_PASSWORD'];
      return customerId && customerId.length > 0 && password && password.length > 0;
    }
  },
  {
    name: 'n8n Workflows',
    required: true,
    vars: ['VITE_N8N_URL'],
    validate: (vars) => {
      const url = vars['VITE_N8N_URL'];
      return url && (url.includes('workflows.innovareai.com') || url.includes('localhost'));
    }
  },
  {
    name: 'OpenAI',
    required: false,
    vars: ['VITE_OPENAI_API_KEY'],
    validate: (vars) => {
      const key = vars['VITE_OPENAI_API_KEY'];
      return key && key.startsWith('sk-');
    }
  },
  {
    name: 'Anthropic (Claude)',
    required: false,
    vars: ['VITE_ANTHROPIC_API_KEY'],
    validate: (vars) => {
      const key = vars['VITE_ANTHROPIC_API_KEY'];
      return key && key.startsWith('sk-ant-');
    }
  }
];

// Run checks
console.log('Checking configuration...\n');

let allRequiredPass = true;
let optionalConfigured = 0;
let optionalTotal = 0;

checks.forEach(check => {
  const varsExist = check.vars.every(v => envVars[v]);
  const isValid = varsExist && check.validate(envVars);
  
  if (check.required) {
    if (isValid) {
      console.log(colors.green + `✅ ${check.name}: Configured` + colors.reset);
    } else {
      console.log(colors.red + `❌ ${check.name}: Not configured (REQUIRED)` + colors.reset);
      check.vars.forEach(v => {
        if (!envVars[v]) {
          console.log(colors.yellow + `   Missing: ${v}` + colors.reset);
        }
      });
      allRequiredPass = false;
    }
  } else {
    optionalTotal++;
    if (isValid) {
      console.log(colors.green + `✅ ${check.name}: Configured` + colors.reset);
      optionalConfigured++;
    } else {
      console.log(colors.yellow + `⚠️  ${check.name}: Not configured (optional)` + colors.reset);
    }
  }
});

// Feature flags check
console.log('\n' + colors.blue + 'Feature Flags:' + colors.reset);
const features = [
  'VITE_ENABLE_VOICE',
  'VITE_ENABLE_LINKEDIN',
  'VITE_ENABLE_EMAIL'
];

features.forEach(feature => {
  const value = envVars[feature];
  const icon = value === 'true' ? '✅' : '❌';
  console.log(`${icon} ${feature.replace('VITE_ENABLE_', '')}: ${value || 'not set'}`);
});

// Summary
console.log('\n' + colors.cyan + '===================================' + colors.reset);
console.log(colors.cyan + 'Configuration Summary' + colors.reset);
console.log(colors.cyan + '===================================' + colors.reset + '\n');

if (allRequiredPass) {
  console.log(colors.green + '✅ All required services configured!' + colors.reset);
} else {
  console.log(colors.red + '❌ Some required services are not configured.' + colors.reset);
}

console.log(`📊 Optional services: ${optionalConfigured}/${optionalTotal} configured`);

// Test connections (optional)
console.log('\n' + colors.blue + 'Testing connections...' + colors.reset);

// Test Supabase
const supabaseUrl = envVars['VITE_SUPABASE_URL'];
if (supabaseUrl) {
  https.get(supabaseUrl + '/rest/v1/', (res) => {
    if (res.statusCode === 200 || res.statusCode === 401) {
      console.log(colors.green + '✅ Supabase: Reachable' + colors.reset);
    } else {
      console.log(colors.yellow + `⚠️  Supabase: HTTP ${res.statusCode}` + colors.reset);
    }
  }).on('error', (err) => {
    console.log(colors.red + '❌ Supabase: Connection failed' + colors.reset);
  });
}

// Test n8n
const n8nUrl = envVars['VITE_N8N_URL'];
if (n8nUrl) {
  https.get(n8nUrl, (res) => {
    if (res.statusCode === 200 || res.statusCode === 301 || res.statusCode === 302) {
      console.log(colors.green + '✅ n8n: Reachable' + colors.reset);
    } else {
      console.log(colors.yellow + `⚠️  n8n: HTTP ${res.statusCode}` + colors.reset);
    }
  }).on('error', (err) => {
    console.log(colors.red + '❌ n8n: Connection failed' + colors.reset);
  });
}

// Recommendations
setTimeout(() => {
  console.log('\n' + colors.blue + 'Recommendations:' + colors.reset);
  
  if (!allRequiredPass) {
    console.log('1. Run ./scripts/setup-services.sh to configure required services');
  }
  
  if (optionalConfigured < optionalTotal) {
    console.log('2. Consider setting up optional services for full functionality:');
    if (!envVars['VITE_UNIPILE_API_KEY'] || envVars['VITE_UNIPILE_API_KEY'] === 'demo_key_not_configured') {
      console.log('   - Unipile: For real LinkedIn OAuth integration');
    }
    if (!envVars['VITE_BRIGHTDATA_CUSTOMER_ID']) {
      console.log('   - Bright Data: For proxy-based LinkedIn connections');
    }
    if (!envVars['VITE_OPENAI_API_KEY']) {
      console.log('   - OpenAI: For GPT model access');
    }
    if (!envVars['VITE_ANTHROPIC_API_KEY']) {
      console.log('   - Anthropic: For Claude model access');
    }
  }
  
  console.log('\n3. Don\'t forget to add these variables to Netlify:');
  console.log('   https://app.netlify.com/sites/sameaisalesassistant/settings/env\n');
  
  process.exit(allRequiredPass ? 0 : 1);
}, 1000);