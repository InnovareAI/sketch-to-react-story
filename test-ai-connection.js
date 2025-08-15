#!/usr/bin/env node

/**
 * Test script to verify AI API connections for SAM AI
 */

// Check for environment variables
const openaiKey = process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
const anthropicKey = process.env.VITE_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY;
const openrouterKey = process.env.VITE_OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY;

console.log('🤖 Testing SAM AI Backend Connections\n');

console.log('📋 API Keys Status:');
console.log(`   OpenAI: ${openaiKey ? '✅ Found' : '❌ Missing'}`);
console.log(`   Anthropic: ${anthropicKey ? '✅ Found' : '❌ Missing'}`);
console.log(`   OpenRouter: ${openrouterKey ? '✅ Found' : '❌ Missing'}`);
console.log('');

async function testOpenAI() {
  if (!openaiKey) {
    console.log('⏭️  Skipping OpenAI test (no API key)');
    return false;
  }

  try {
    console.log('🧪 Testing OpenAI API...');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Hello! I am SAM AI. Please respond with exactly: "OpenAI connection successful!"' }],
        max_tokens: 50,
        temperature: 0.1
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    console.log(`   ✅ OpenAI Response: "${content}"`);
    return true;
  } catch (error) {
    console.log(`   ❌ OpenAI Error: ${error.message}`);
    return false;
  }
}

async function testAnthropic() {
  if (!anthropicKey) {
    console.log('⏭️  Skipping Anthropic test (no API key)');
    return false;
  }

  try {
    console.log('🧪 Testing Anthropic API...');
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 50,
        temperature: 0.1,
        messages: [{ role: 'user', content: 'Hello! I am SAM AI. Please respond with exactly: "Anthropic connection successful!"' }]
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    const content = data.content[0].text;
    console.log(`   ✅ Anthropic Response: "${content}"`);
    return true;
  } catch (error) {
    console.log(`   ❌ Anthropic Error: ${error.message}`);
    return false;
  }
}

async function testOpenRouter() {
  if (!openrouterKey) {
    console.log('⏭️  Skipping OpenRouter test (no API key)');
    return false;
  }

  try {
    console.log('🧪 Testing OpenRouter API...');
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openrouterKey}`,
        'HTTP-Referer': 'https://sameaisalesassistant.netlify.app',
        'X-Title': 'SAM AI Sales Assistant'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet',
        messages: [{ role: 'user', content: 'Hello! I am SAM AI. Please respond with exactly: "OpenRouter connection successful!"' }],
        max_tokens: 50,
        temperature: 0.1
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    console.log(`   ✅ OpenRouter Response: "${content}"`);
    return true;
  } catch (error) {
    console.log(`   ❌ OpenRouter Error: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting API Connection Tests\n');
  
  const results = await Promise.all([
    testOpenAI(),
    testAnthropic(), 
    testOpenRouter()
  ]);

  const working = results.filter(Boolean).length;
  const total = results.length;

  console.log('\n📊 Test Results Summary:');
  console.log(`   ${working}/${total} APIs working`);
  
  if (working > 0) {
    console.log('   ✅ SAM AI backend is ready for testing!');
    console.log('\n🎯 Next steps:');
    console.log('   1. Run: npm run dev');
    console.log('   2. Open the conversational interface');
    console.log('   3. Test real AI responses with SAM');
  } else {
    console.log('   ❌ No working API connections');
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Check your API keys in environment variables');
    console.log('   2. Verify API key permissions and quotas');
    console.log('   3. Test individual API endpoints manually');
  }
}

runTests().catch(console.error);