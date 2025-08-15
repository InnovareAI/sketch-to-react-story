/**
 * OnboardingAgent Test Harness
 * Test real conversational onboarding with live AI responses
 */

import { OnboardingAgent } from './src/services/agents/specialists/OnboardingAgent';
import { AgentConfig, TaskRequest } from './src/services/agents/types/AgentTypes';

// Mock configuration for testing
const testConfig: AgentConfig = {
  agentId: 'test-onboarding',
  name: 'Test Onboarding Agent',
  model: 'quality',
  temperature: 0.7,
  maxTokens: 1000,
  systemPrompt: 'You are SAM, an AI sales assistant conducting onboarding.',
  capabilities: []
};

// Test conversation context
const testContext = {
  sessionId: `test-session-${Date.now()}`,
  userId: 'test-user-123',
  workspaceId: 'test-workspace-456',
  conversationHistory: [],
  memory: {},
  preferences: {}
};

async function testOnboardingFlow() {
  console.log('🚀 Starting OnboardingAgent Test');
  console.log('=====================================\n');

  // Initialize the agent
  const agent = new OnboardingAgent(testConfig);
  await agent.initialize();

  console.log('✅ OnboardingAgent initialized\n');

  // Step 1: Start onboarding
  console.log('📋 Step 1: Starting Onboarding');
  console.log('-------------------------------');

  const startTask: TaskRequest = {
    id: 'test-start-' + Date.now(),
    type: 'start_onboarding',
    parameters: {},
    priority: 1,
    context: testContext
  };

  const startResponse = await agent.processTask(startTask, testContext);
  
  if (startResponse.success) {
    console.log('🎯 SAM says:');
    console.log(startResponse.result.message);
    console.log(`\n📊 Progress: ${startResponse.result.progress_percentage}%`);
    console.log(`🎪 Current Step: ${startResponse.result.current_step?.title}\n`);
  } else {
    console.error('❌ Start onboarding failed:', startResponse.error);
    return;
  }

  // Store the onboarding state for next steps
  let onboardingState = startResponse.result.onboarding_state;

  // Step 2: Simulate user response to company basics
  console.log('📋 Step 2: User Response - Company Basics');
  console.log('------------------------------------------');
  
  const userResponse1 = "Hi SAM! I'm excited to get started. My company is called TechFlow Solutions and we're in the B2B SaaS industry. We offer workflow automation tools for marketing teams. We've been in business for about 3 years, and I'm the Head of Sales.";
  
  console.log('👤 User says:');
  console.log(userResponse1);
  console.log();

  const responseTask1: TaskRequest = {
    id: 'test-response-1-' + Date.now(),
    type: 'process_onboarding_response',
    parameters: {
      user_response: userResponse1,
      onboarding_state: onboardingState
    },
    priority: 1,
    context: testContext
  };

  const response1 = await agent.processTask(responseTask1, testContext);
  
  if (response1.success) {
    console.log('🎯 SAM responds:');
    console.log(response1.result.message);
    console.log(`\n📊 Progress: ${response1.result.progress_percentage}%`);
    console.log(`📈 Extracted Data:`, JSON.stringify(response1.result.extracted_data, null, 2));
    console.log();
  } else {
    console.error('❌ Response processing failed:', response1.error);
    return;
  }

  // Update state
  onboardingState = response1.result.onboarding_state;

  // Step 3: Simulate user response to target market
  console.log('📋 Step 3: User Response - Target Market');
  console.log('----------------------------------------');
  
  const userResponse2 = "Our ideal customers are mid-market companies with 100-500 employees, typically in the $10M-$100M revenue range. We usually reach out to Marketing Directors, VP of Marketing, and CMOs. We focus on companies in tech, e-commerce, and professional services that are struggling with manual marketing processes.";
  
  console.log('👤 User says:');
  console.log(userResponse2);
  console.log();

  const responseTask2: TaskRequest = {
    id: 'test-response-2-' + Date.now(),
    type: 'process_onboarding_response',
    parameters: {
      user_response: userResponse2,
      onboarding_state: onboardingState
    },
    priority: 1,
    context: testContext
  };

  const response2 = await agent.processTask(responseTask2, testContext);
  
  if (response2.success) {
    console.log('🎯 SAM responds:');
    console.log(response2.result.message);
    console.log(`\n📊 Progress: ${response2.result.progress_percentage}%`);
    console.log(`📈 Extracted Data:`, JSON.stringify(response2.result.extracted_data, null, 2));
    console.log();
  } else {
    console.error('❌ Response processing failed:', response2.error);
    return;
  }

  // Update state
  onboardingState = response2.result.onboarding_state;

  // Step 4: Simulate user response to pain points/solutions
  console.log('📋 Step 4: User Response - Problems & Solutions');
  console.log('-----------------------------------------------');
  
  const userResponse3 = "The main problems our customers face are spending too much time on manual tasks like lead scoring, email sequences, and campaign optimization. They're drowning in data but can't act on it quickly. Our solution automates their entire marketing workflow, from lead generation to nurturing. What makes us different is our AI-powered personalization - we can create thousands of personalized touchpoints automatically. Customers typically see 40% time savings and 25% more qualified leads within the first 90 days.";
  
  console.log('👤 User says:');
  console.log(userResponse3);
  console.log();

  const responseTask3: TaskRequest = {
    id: 'test-response-3-' + Date.now(),
    type: 'process_onboarding_response',
    parameters: {
      user_response: userResponse3,
      onboarding_state: onboardingState
    },
    priority: 1,
    context: testContext
  };

  const response3 = await agent.processTask(responseTask3, testContext);
  
  if (response3.success) {
    console.log('🎯 SAM responds (COMPLETION):');
    console.log(response3.result.message);
    console.log(`\n📊 Progress: ${response3.result.progress_percentage}%`);
    console.log(`📈 Extracted Data:`, JSON.stringify(response3.result.extracted_data, null, 2));
    
    if (response3.result.action === 'complete') {
      console.log('\n🎉 ONBOARDING COMPLETED!');
      console.log('Training data has been generated and stored.');
    }
    console.log();
  } else {
    console.error('❌ Response processing failed:', response3.error);
    return;
  }

  // Test health check
  console.log('📋 Health Check');
  console.log('----------------');
  const isHealthy = await agent.healthCheck();
  console.log(`Agent Health: ${isHealthy ? '✅ Healthy' : '❌ Unhealthy'}`);

  console.log('\n🏁 OnboardingAgent Test Complete!');
  console.log('===================================');
}

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
  testOnboardingFlow().catch(console.error);
}

export { testOnboardingFlow };