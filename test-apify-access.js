#!/usr/bin/env node

/**
 * Apify API Access Test Script
 * 
 * This script tests if your Apify API token is working correctly
 * and verifies access to LinkedIn scraping actors.
 * 
 * Usage:
 * 1. Set APIFY_API_TOKEN environment variable
 * 2. Run: node test-apify-access.js
 */

const API_TOKEN = process.env.APIFY_API_TOKEN || process.env.VITE_APIFY_TOKEN;

if (!API_TOKEN) {
  console.error('❌ No API token found!');
  console.log('📝 Set your token: export APIFY_API_TOKEN=your_token_here');
  console.log('🔗 Get token from: https://console.apify.com/account/integrations');
  process.exit(1);
}

async function testApifyAccess() {
  console.log('🔍 Testing Apify API access...\n');

  try {
    // Test 1: Basic API connectivity
    console.log('1️⃣ Testing basic API connectivity...');
    const userResponse = await fetch('https://api.apify.com/v2/users/me', {
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`
      }
    });

    if (!userResponse.ok) {
      throw new Error(`API request failed: ${userResponse.status} ${userResponse.statusText}`);
    }

    const userData = await userResponse.json();
    console.log(`✅ Connected as: ${userData.data.username}`);
    console.log(`💰 Account plan: ${userData.data.plan}`);
    console.log(`💳 Credits: ${userData.data.usageStats?.monthlyUsage?.computeUnits || 'N/A'}\n`);

    // Test 2: Check available actors
    console.log('2️⃣ Checking available LinkedIn actors...');
    const actorsResponse = await fetch('https://api.apify.com/v2/store?search=linkedin', {
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`
      }
    });

    if (actorsResponse.ok) {
      const actorsData = await actorsResponse.json();
      const linkedinActors = actorsData.data.items.filter(item => 
        item.name.toLowerCase().includes('linkedin') || 
        item.title.toLowerCase().includes('linkedin')
      );

      console.log(`✅ Found ${linkedinActors.length} LinkedIn actors in store`);
      
      // Show top 3 LinkedIn actors
      linkedinActors.slice(0, 3).forEach((actor, index) => {
        console.log(`   ${index + 1}. ${actor.title} (${actor.username}/${actor.name})`);
      });
      console.log();
    }

    // Test 3: Test actor run (dry run)
    console.log('3️⃣ Testing actor run capability...');
    const testActorId = 'apify/linkedin-scraper'; // Official LinkedIn scraper
    
    const runResponse = await fetch(`https://api.apify.com/v2/acts/${testActorId}`, {
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`
      }
    });

    if (runResponse.ok) {
      const actorData = await runResponse.json();
      console.log(`✅ Can access actor: ${actorData.data.title}`);
      console.log(`📊 Actor stats: ${actorData.data.stats.totalRuns} total runs`);
      console.log(`⭐ Rating: ${actorData.data.stats.rating}/5`);
    } else {
      console.log(`⚠️ Cannot access actor ${testActorId} (may need different permissions)`);
    }

    console.log('\n🎉 Apify API access test completed successfully!');
    console.log('✅ Your token is working correctly');
    console.log('🚀 Ready to integrate with SAM AI');

    // Provide next steps
    console.log('\n📋 Next Steps:');
    console.log('1. Add to Netlify: APIFY_API_TOKEN=' + API_TOKEN.substring(0, 15) + '...');
    console.log('2. Choose a LinkedIn actor from the list above');
    console.log('3. Test with a real LinkedIn search URL');

  } catch (error) {
    console.error('❌ Apify API test failed:', error.message);
    
    if (error.message.includes('401')) {
      console.log('🔑 Token appears to be invalid or expired');
      console.log('📝 Get a new token: https://console.apify.com/account/integrations');
    }
    
    if (error.message.includes('403')) {
      console.log('🚫 Token valid but insufficient permissions');
      console.log('💡 Try using an organization token or upgrade account');
    }
    
    if (error.message.includes('429')) {
      console.log('⏰ Rate limited - wait a moment and try again');
    }
    
    process.exit(1);
  }
}

// Token type detection
function detectTokenType(token) {
  if (token.startsWith('apify_api_')) {
    console.log('🔑 Token type: Personal API Token');
    console.log('✅ Perfect for testing and prototyping');
    console.log('💡 Consider organization token for production\n');
  } else {
    console.log('🔑 Token type: Unknown format');
    console.log('⚠️ Make sure this is a valid Apify API token\n');
  }
}

// Run the test
if (require.main === module) {
  detectTokenType(API_TOKEN);
  testApifyAccess();
}

module.exports = { testApifyAccess };