#!/usr/bin/env node

const https = require('https');

const UNIPILE_API_KEY = 'TE3VJJ3-N3E63ND-MWXM462-RBPCWYQ';
const accountId = '4jyMc-EDT1-hE5pOoT7EaQ';

// Test different endpoints
const endpoints = [
  '/users/' + accountId,
  '/users/' + accountId + '/connections?limit=5',
  '/users/' + accountId + '/chats?limit=5&provider=LINKEDIN',
  '/accounts',
];

async function testEndpoint(path) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'api6.unipile.com',
      port: 13443,
      path: '/api/v1' + path,
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + UNIPILE_API_KEY,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    };

    console.log(`\nTesting: ${options.path}`);

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        console.log(`Headers:`, res.headers);
        
        try {
          const parsed = JSON.parse(data);
          console.log('Response:', JSON.stringify(parsed, null, 2).substring(0, 500));
        } catch (e) {
          console.log('Response (raw):', data.substring(0, 500));
        }
        
        resolve();
      });
    });

    req.on('error', (error) => {
      console.error('Error:', error.message);
      resolve();
    });

    req.end();
  });
}

async function runTests() {
  console.log('Testing Unipile API...');
  console.log('API Key:', UNIPILE_API_KEY);
  console.log('Account ID:', accountId);
  
  for (const endpoint of endpoints) {
    await testEndpoint(endpoint);
  }
}

runTests();