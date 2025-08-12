#!/usr/bin/env node

/**
 * SAM AI - LinkedIn Search Types Testing Script
 * Tests all 8 LinkedIn search types with Bright Data proxy integration
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  header: (msg) => console.log(`${colors.cyan}${msg}${colors.reset}`)
};

// Configuration
const config = {
  supabaseUrl: process.env.VITE_SUPABASE_URL || 'https://latxadqrvrrrcvkktrog.supabase.co',
  supabaseAnonKey: process.env.VITE_SUPABASE_ANON_KEY || '',
  testWorkspaceId: 'test-workspace-123',
  testUserId: 'test-user-123'
};

// Test data for different search types
const testCases = [
  {
    name: 'Proxy Connection Test',
    type: 'test',
    data: {
      action: 'test',
      country: 'US'
    },
    expectedFields: ['success', 'ip', 'country', 'linkedin_accessible']
  },
  {
    name: 'LinkedIn Basic Search',
    type: 'linkedin-basic-search',
    data: {
      action: 'linkedin-basic-search',
      searchUrl: 'https://linkedin.com/search/results/people/?keywords=software%20engineer&origin=GLOBAL_SEARCH_HEADER',
      maxResults: 10,
      country: 'US',
      workspaceId: config.testWorkspaceId,
      searchConfigId: 'test-config-1'
    },
    expectedFields: ['results', 'pagination', 'search_metadata']
  },
  {
    name: 'LinkedIn Sales Navigator Search',
    type: 'linkedin-sales-navigator',
    data: {
      action: 'linkedin-sales-navigator',
      searchUrl: 'https://linkedin.com/sales/search/people?keywords=software%20engineer',
      maxResults: 5,
      country: 'US',
      workspaceId: config.testWorkspaceId,
      searchConfigId: 'test-config-2'
    },
    expectedFields: ['results', 'pagination', 'premium_features']
  },
  {
    name: 'Company Followers Scraping',
    type: 'company-followers',
    data: {
      action: 'company-followers',
      searchUrl: 'https://linkedin.com/company/microsoft',
      maxFollowers: 20,
      country: 'US',
      workspaceId: config.testWorkspaceId,
      searchConfigId: 'test-config-3'
    },
    expectedFields: ['followers']
  },
  {
    name: 'Post Engagement Scraping',
    type: 'post-engagement',
    data: {
      action: 'post-engagement',
      searchUrl: 'https://linkedin.com/posts/example-post-123',
      maxEngagers: 15,
      country: 'US',
      workspaceId: config.testWorkspaceId,
      searchConfigId: 'test-config-4',
      engagementTypes: ['like', 'comment', 'share']
    },
    expectedFields: ['engagement']
  },
  {
    name: 'Group Members Scraping',
    type: 'group-members',
    data: {
      action: 'group-members',
      searchUrl: 'https://linkedin.com/groups/123456',
      maxMembers: 25,
      country: 'US',
      workspaceId: config.testWorkspaceId,
      searchConfigId: 'test-config-5'
    },
    expectedFields: ['members']
  },
  {
    name: 'Event Attendees Scraping',
    type: 'event-attendees',
    data: {
      action: 'event-attendees',
      searchUrl: 'https://linkedin.com/events/123456',
      maxAttendees: 20,
      country: 'US',
      workspaceId: config.testWorkspaceId,
      searchConfigId: 'test-config-6',
      attendanceTypes: ['attending', 'interested']
    },
    expectedFields: ['attendees']
  },
  {
    name: 'People You May Know Scraping',
    type: 'people-suggestions',
    data: {
      action: 'people-suggestions',
      maxSuggestions: 10,
      linkedInAccountId: 'test-linkedin-account-123',
      workspaceId: config.testWorkspaceId,
      searchConfigId: 'test-config-7'
    },
    expectedFields: ['suggestions']
  },
  {
    name: 'Single Profile Scraping',
    type: 'scrape',
    data: {
      action: 'scrape',
      profileUrl: 'https://linkedin.com/in/test-profile',
      country: 'US',
      state: 'NY'
    },
    expectedFields: ['profile_url', 'full_name', 'headline', 'proxy_info']
  }
];

// HTTP request helper
function makeRequest(url, data, headers = {}) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    const urlParts = new URL(url);
    
    const options = {
      hostname: urlParts.hostname,
      port: 443,
      path: urlParts.pathname + urlParts.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        ...headers
      }
    };

    const req = https.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => responseBody += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseBody);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: parsed
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: responseBody
          });
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// Validate response structure
function validateResponse(response, expectedFields) {
  const issues = [];
  
  if (response.status !== 200) {
    issues.push(`HTTP ${response.status} (expected 200)`);
  }
  
  if (typeof response.data !== 'object') {
    issues.push('Response is not JSON object');
    return issues;
  }
  
  if (!response.data.success) {
    issues.push(`API error: ${response.data.error || 'Unknown error'}`);
    return issues;
  }
  
  const data = response.data.data || response.data;
  
  for (const field of expectedFields) {
    if (!(field in data)) {
      issues.push(`Missing field: ${field}`);
    }
  }
  
  return issues;
}

// Run individual test
async function runTest(testCase) {
  log.info(`Testing ${testCase.name}...`);
  
  try {
    const url = `${config.supabaseUrl}/functions/v1/brightdata-proxy`;
    const headers = config.supabaseAnonKey ? {
      'Authorization': `Bearer ${config.supabaseAnonKey}`,
      'apikey': config.supabaseAnonKey
    } : {};
    
    const startTime = Date.now();
    const response = await makeRequest(url, testCase.data, headers);
    const duration = Date.now() - startTime;
    
    const issues = validateResponse(response, testCase.expectedFields);
    
    if (issues.length === 0) {
      log.success(`${testCase.name} - PASSED (${duration}ms)`);
      
      // Log some response details for successful tests
      if (response.data.data) {
        const data = response.data.data;
        if (data.results && Array.isArray(data.results)) {
          log.info(`  → Found ${data.results.length} results`);
        }
        if (data.followers && Array.isArray(data.followers)) {
          log.info(`  → Found ${data.followers.length} followers`);
        }
        if (data.engagement && Array.isArray(data.engagement)) {
          log.info(`  → Found ${data.engagement.length} engagements`);
        }
        if (data.members && Array.isArray(data.members)) {
          log.info(`  → Found ${data.members.length} members`);
        }
        if (data.attendees && Array.isArray(data.attendees)) {
          log.info(`  → Found ${data.attendees.length} attendees`);
        }
        if (data.suggestions && Array.isArray(data.suggestions)) {
          log.info(`  → Found ${data.suggestions.length} suggestions`);
        }
        if (data.profile_url) {
          log.info(`  → Scraped profile: ${data.full_name || 'Unknown'}`);
        }
        if (data.ip) {
          log.info(`  → Proxy IP: ${data.ip} (${data.country})`);
        }
      }
      
      return { success: true, duration, response: response.data };
    } else {
      log.error(`${testCase.name} - FAILED`);
      issues.forEach(issue => log.error(`  → ${issue}`));
      return { success: false, duration, issues, response: response.data };
    }
  } catch (error) {
    log.error(`${testCase.name} - ERROR: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Generate test report
function generateReport(results) {
  const totalTests = results.length;
  const passedTests = results.filter(r => r.success).length;
  const failedTests = totalTests - passedTests;
  
  const report = {
    summary: {
      total: totalTests,
      passed: passedTests,
      failed: failedTests,
      success_rate: ((passedTests / totalTests) * 100).toFixed(1),
      timestamp: new Date().toISOString()
    },
    results: results.map((result, index) => ({
      test_name: testCases[index].name,
      test_type: testCases[index].type,
      success: result.success,
      duration_ms: result.duration,
      issues: result.issues || [],
      error: result.error || null
    })),
    recommendations: []
  };
  
  // Add recommendations based on results
  if (failedTests > 0) {
    report.recommendations.push('Some tests failed. Check Bright Data credentials and zone configuration.');
  }
  
  if (results[0] && !results[0].success) {
    report.recommendations.push('Proxy connection test failed. Verify Bright Data account and network connectivity.');
  }
  
  const avgDuration = results
    .filter(r => r.duration)
    .reduce((sum, r) => sum + r.duration, 0) / results.filter(r => r.duration).length;
  
  if (avgDuration > 10000) {
    report.recommendations.push('High response times detected. Consider optimizing proxy configuration.');
  }
  
  report.recommendations.push('Monitor usage costs and adjust monthly budget as needed.');
  report.recommendations.push('Set up automated testing for continuous integration.');
  
  return report;
}

// Save report to file
function saveReport(report) {
  const reportPath = path.join(process.cwd(), 'brightdata-test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  log.success(`Test report saved: ${reportPath}`);
  
  // Also create a markdown report
  const mdReportPath = path.join(process.cwd(), 'brightdata-test-report.md');
  const mdContent = `# Bright Data LinkedIn Integration Test Report

Generated: ${report.summary.timestamp}

## Summary
- **Total Tests**: ${report.summary.total}
- **Passed**: ${report.summary.passed}
- **Failed**: ${report.summary.failed}
- **Success Rate**: ${report.summary.success_rate}%

## Test Results

${report.results.map(result => `
### ${result.test_name}
- **Type**: ${result.test_type}
- **Status**: ${result.success ? '✅ PASSED' : '❌ FAILED'}
- **Duration**: ${result.duration_ms}ms
${result.issues.length > 0 ? `- **Issues**: ${result.issues.join(', ')}` : ''}
${result.error ? `- **Error**: ${result.error}` : ''}
`).join('')}

## Recommendations

${report.recommendations.map(rec => `- ${rec}`).join('\n')}

## Next Steps

${report.summary.success_rate === '100.0' ? `
🎉 **All tests passed!** Your Bright Data integration is working correctly.

1. Start using LinkedIn scraping in your campaigns
2. Monitor usage and costs regularly  
3. Set up automated prospect search workflows
4. Configure budget alerts and limits
` : `
⚠️ **Some tests failed.** Please address the issues before using in production.

1. Check Bright Data credentials and zone configuration
2. Verify network connectivity and proxy settings
3. Review error messages and fix configuration issues
4. Re-run tests after making changes
`}
`;
  
  fs.writeFileSync(mdReportPath, mdContent);
  log.success(`Markdown report saved: ${mdReportPath}`);
}

// Main function
async function main() {
  log.header('🧪 SAM AI - LinkedIn Search Types Testing');
  log.header('==========================================');
  
  log.info('Testing Bright Data proxy integration with all 8 LinkedIn search types...\n');
  
  // Validate configuration
  if (!config.supabaseUrl) {
    log.error('VITE_SUPABASE_URL environment variable not set');
    process.exit(1);
  }
  
  const results = [];
  
  // Run all tests
  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    const result = await runTest(testCase);
    results.push(result);
    
    // Add delay between tests to avoid rate limiting
    if (i < testCases.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log(''); // Add spacing between tests
  }
  
  // Generate and save report
  const report = generateReport(results);
  saveReport(report);
  
  // Print summary
  log.header('\n📊 Test Summary');
  log.header('================');
  log.info(`Total Tests: ${report.summary.total}`);
  
  if (report.summary.passed > 0) {
    log.success(`Passed: ${report.summary.passed}`);
  }
  
  if (report.summary.failed > 0) {
    log.error(`Failed: ${report.summary.failed}`);
  }
  
  log.info(`Success Rate: ${report.summary.success_rate}%`);
  
  // Print recommendations
  if (report.recommendations.length > 0) {
    log.header('\n💡 Recommendations');
    log.header('==================');
    report.recommendations.forEach(rec => log.warning(rec));
  }
  
  console.log('');
  
  // Exit with appropriate code
  process.exit(report.summary.failed > 0 ? 1 : 0);
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
SAM AI - LinkedIn Search Types Testing Script

Usage: node test-linkedin-search-types.js [options]

Options:
  --help, -h     Show this help message
  --verbose, -v  Enable verbose output
  --single TYPE  Run only a specific test type

Environment Variables:
  VITE_SUPABASE_URL      Supabase project URL (required)
  VITE_SUPABASE_ANON_KEY Supabase anonymous key (optional)

Examples:
  node test-linkedin-search-types.js
  node test-linkedin-search-types.js --single test
  node test-linkedin-search-types.js --verbose
`);
  process.exit(0);
}

// Run specific test type if requested
const singleTestIndex = process.argv.indexOf('--single');
if (singleTestIndex !== -1 && process.argv[singleTestIndex + 1]) {
  const testType = process.argv[singleTestIndex + 1];
  const testCase = testCases.find(tc => tc.type === testType);
  
  if (!testCase) {
    log.error(`Unknown test type: ${testType}`);
    log.info('Available types: ' + testCases.map(tc => tc.type).join(', '));
    process.exit(1);
  }
  
  // Run single test
  runTest(testCase).then(result => {
    if (result.success) {
      log.success('Test passed!');
      process.exit(0);
    } else {
      log.error('Test failed!');
      process.exit(1);
    }
  });
} else {
  // Run all tests
  main().catch(error => {
    log.error(`Test runner error: ${error.message}`);
    process.exit(1);
  });
}