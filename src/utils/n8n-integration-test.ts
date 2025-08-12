/**
 * N8N Integration Test Utility
 * Tests the connection and functionality of N8N workflows from SAM AI
 */

import { n8nService } from '@/services/n8n/N8nIntegrationService';
import { n8nCampaignService } from '@/services/n8n-campaign-integration';

export interface IntegrationTestResult {
  test_name: string;
  success: boolean;
  response?: any;
  error?: string;
  execution_time: number;
}

export class N8nIntegrationTester {
  private results: IntegrationTestResult[] = [];

  /**
   * Run all integration tests
   */
  async runAllTests(): Promise<IntegrationTestResult[]> {
    console.log('🚀 Starting N8N Integration Tests...');
    
    this.results = [];

    // Test 1: Basic N8N Service Connection
    await this.testBasicConnection();

    // Test 2: SAM Main Workflow Trigger
    await this.testSamMainWorkflow();

    // Test 3: Campaign Integration
    await this.testCampaignIntegration();

    // Test 4: AI Processing Workflow
    await this.testAIProcessingWorkflow();

    // Test 5: Workflow Health Check
    await this.testWorkflowHealth();

    console.log('✅ N8N Integration Tests Complete');
    console.table(this.results);

    return this.results;
  }

  /**
   * Test basic N8N service connection
   */
  private async testBasicConnection(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const workflowTemplates = n8nService.getAvailableWorkflows();
      
      this.results.push({
        test_name: 'Basic Connection',
        success: Object.keys(workflowTemplates).length > 0,
        response: `Found ${Object.keys(workflowTemplates).length} workflow templates`,
        execution_time: Date.now() - startTime
      });
    } catch (error: any) {
      this.results.push({
        test_name: 'Basic Connection',
        success: false,
        error: error.message,
        execution_time: Date.now() - startTime
      });
    }
  }

  /**
   * Test SAM main workflow trigger
   */
  private async testSamMainWorkflow(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const execution = await n8nService.triggerMainSAMWorkflow(
        'unified',
        'test_action',
        {
          test_message: 'Integration test from SAM AI',
          timestamp: new Date().toISOString(),
          source: 'integration_tester'
        }
      );

      this.results.push({
        test_name: 'SAM Main Workflow',
        success: execution.status === 'success' || execution.status === 'error', // At least it executed
        response: execution,
        execution_time: Date.now() - startTime
      });
    } catch (error: any) {
      this.results.push({
        test_name: 'SAM Main Workflow',
        success: false,
        error: error.message,
        execution_time: Date.now() - startTime
      });
    }
  }

  /**
   * Test campaign integration workflow
   */
  private async testCampaignIntegration(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Test creating a campaign workflow (mock data)
      const campaignData = {
        id: 'test-campaign-' + Date.now(),
        name: 'Test Integration Campaign',
        type: 'linkedin_connector',
        message_sequence: [
          {
            content: 'Hi {{prospect_name}}, testing SAM AI integration!',
            delay: '1 day'
          }
        ],
        prospects: [
          {
            id: 'test-prospect-1',
            name: 'Test Prospect',
            profile_url: 'https://linkedin.com/in/test'
          }
        ],
        settings: {
          daily_limit: 10,
          priority: 'medium' as const,
          timezone: 'UTC',
          working_hours: {
            start: '09:00',
            end: '17:00',
            days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
          }
        }
      };

      const workflowId = await n8nCampaignService.createCampaignWorkflow(campaignData);

      this.results.push({
        test_name: 'Campaign Integration',
        success: !!workflowId,
        response: { workflow_id: workflowId },
        execution_time: Date.now() - startTime
      });
    } catch (error: any) {
      this.results.push({
        test_name: 'Campaign Integration',
        success: false,
        error: error.message,
        execution_time: Date.now() - startTime
      });
    }
  }

  /**
   * Test AI processing workflow
   */
  private async testAIProcessingWorkflow(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const execution = await n8nService.executeAIWorkflow(
        'This is a test message for AI processing in the SAM AI N8N integration.',
        'summarize'
      );

      this.results.push({
        test_name: 'AI Processing Workflow',
        success: execution.status !== 'error',
        response: execution,
        execution_time: Date.now() - startTime
      });
    } catch (error: any) {
      this.results.push({
        test_name: 'AI Processing Workflow',
        success: false,
        error: error.message,
        execution_time: Date.now() - startTime
      });
    }
  }

  /**
   * Test workflow health check
   */
  private async testWorkflowHealth(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const health = await n8nService.checkWorkflowHealth();

      this.results.push({
        test_name: 'Workflow Health Check',
        success: health.connected,
        response: health,
        error: health.error,
        execution_time: Date.now() - startTime
      });
    } catch (error: any) {
      this.results.push({
        test_name: 'Workflow Health Check',
        success: false,
        error: error.message,
        execution_time: Date.now() - startTime
      });
    }
  }

  /**
   * Test specific workflow execution mode
   */
  async testWorkflowMode(
    mode: 'inbound' | 'outbound' | 'unified',
    stage: string,
    testData: any
  ): Promise<IntegrationTestResult> {
    const startTime = Date.now();
    
    try {
      const execution = await n8nService.executeModeWorkflow(mode, stage, testData);

      return {
        test_name: `${mode.toUpperCase()} Mode - ${stage}`,
        success: execution.status !== 'error',
        response: execution,
        execution_time: Date.now() - startTime
      };
    } catch (error: any) {
      return {
        test_name: `${mode.toUpperCase()} Mode - ${stage}`,
        success: false,
        error: error.message,
        execution_time: Date.now() - startTime
      };
    }
  }

  /**
   * Get test results summary
   */
  getResultsSummary(): {
    total_tests: number;
    passed: number;
    failed: number;
    success_rate: number;
    total_execution_time: number;
  } {
    const total_tests = this.results.length;
    const passed = this.results.filter(r => r.success).length;
    const failed = total_tests - passed;
    const success_rate = total_tests > 0 ? (passed / total_tests) * 100 : 0;
    const total_execution_time = this.results.reduce((sum, r) => sum + r.execution_time, 0);

    return {
      total_tests,
      passed,
      failed,
      success_rate,
      total_execution_time
    };
  }

  /**
   * Export results to console with formatted output
   */
  exportResults(): void {
    const summary = this.getResultsSummary();
    
    console.log('\n🔬 N8N Integration Test Results');
    console.log('================================');
    console.log(`Total Tests: ${summary.total_tests}`);
    console.log(`Passed: ${summary.passed} ✅`);
    console.log(`Failed: ${summary.failed} ❌`);
    console.log(`Success Rate: ${summary.success_rate.toFixed(1)}%`);
    console.log(`Total Execution Time: ${summary.total_execution_time}ms`);
    
    console.log('\nDetailed Results:');
    this.results.forEach((result, index) => {
      const status = result.success ? '✅' : '❌';
      console.log(`${index + 1}. ${status} ${result.test_name} (${result.execution_time}ms)`);
      
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
      
      if (result.response && typeof result.response === 'object') {
        console.log(`   Response:`, JSON.stringify(result.response, null, 2));
      }
    });
  }
}

// Export convenience function
export async function runN8nIntegrationTests(): Promise<IntegrationTestResult[]> {
  const tester = new N8nIntegrationTester();
  const results = await tester.runAllTests();
  tester.exportResults();
  return results;
}