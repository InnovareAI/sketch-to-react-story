/**
 * SAM AI Browser Testing Automation
 * Tests the actual web application through HTTP requests and API calls
 */

import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

const supabase = createClient(
  'https://latxadqrvrrrcvkktrog.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhdHhhZHFydnJycmN2a2t0cm9nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTk5ODYsImV4cCI6MjA2ODI3NTk4Nn0.3WkAgXpk_MyQioVf_SED9O_ArjcT9nH0uy9we2okftE'
);

class BrowserTester {
  constructor() {
    this.baseUrl = 'http://localhost:8081';
    this.productionUrl = 'https://sameaisalesassistant.netlify.app';
    this.testResults = {
      frontend: {},
      api: {},
      database: {},
      integrations: {},
      performance: {}
    };
  }

  async runAllTests() {
    console.log('🌐 Starting SAM AI Browser Testing...\n');
    
    try {
      await this.testFrontendAccess();
      await this.testDatabaseAPIs();
      await this.testWorkspaceIsolation();
      await this.testCampaignAPIs();
      await this.testContactAPIs();
      await this.testPerformanceMetrics();
      
      this.generateBrowserTestReport();
      
    } catch (error) {
      console.error('❌ Browser test suite failed:', error);
    }
  }

  async testFrontendAccess() {
    console.log('🌐 Testing Frontend Access...');
    
    const urls = [
      '/',
      '/login',
      '/dashboard',
      '/campaigns',
      '/contacts',
      '/templates',
      '/prospect-search'
    ];
    
    for (const url of urls) {
      try {
        const response = await fetch(`${this.baseUrl}${url}`);
        this.testResults.frontend[url] = {
          status: response.status,
          accessible: response.status < 400,
          loadTime: response.headers.get('x-response-time') || 'N/A'
        };
        
        console.log(`  ${response.status < 400 ? '✅' : '❌'} ${url}: ${response.status}`);
      } catch (error) {
        this.testResults.frontend[url] = {
          status: 'ERROR',
          accessible: false,
          error: error.message
        };
        console.log(`  ❌ ${url}: ${error.message}`);
      }
    }
    
    // Test production deployment
    try {
      const prodResponse = await fetch(this.productionUrl);
      this.testResults.frontend['production'] = {
        status: prodResponse.status,
        accessible: prodResponse.status < 400,
        url: this.productionUrl
      };
      console.log(`  ${prodResponse.status < 400 ? '✅' : '❌'} Production: ${prodResponse.status}`);
    } catch (error) {
      this.testResults.frontend['production'] = {
        accessible: false,
        error: error.message
      };
      console.log(`  ❌ Production: ${error.message}`);
    }
  }

  async testDatabaseAPIs() {
    console.log('🗄️  Testing Database APIs...');
    
    const tables = ['workspaces', 'campaigns', 'contacts', 'campaign_analytics'];
    
    for (const table of tables) {
      try {
        const startTime = Date.now();
        const { data, error, count } = await supabase
          .from(table)
          .select('*', { count: 'exact' })
          .limit(5);
        
        const queryTime = Date.now() - startTime;
        
        this.testResults.database[table] = {
          accessible: !error,
          recordCount: count || 0,
          queryTime: queryTime,
          hasData: data && data.length > 0,
          error: error?.message
        };
        
        console.log(`  ${!error ? '✅' : '❌'} ${table}: ${!error ? 'OK' : error.message} (${queryTime}ms)`);
        
      } catch (error) {
        this.testResults.database[table] = {
          accessible: false,
          error: error.message
        };
        console.log(`  ❌ ${table}: ${error.message}`);
      }
    }
  }

  async testWorkspaceIsolation() {
    console.log('🏢 Testing Workspace Isolation...');
    
    try {
      // Test if we can access workspace data without proper authentication
      const { data: workspaces, error } = await supabase
        .from('workspaces')
        .select('id, name')
        .limit(3);
      
      this.testResults.database.workspaceAccess = {
        accessible: !error,
        workspaceCount: workspaces?.length || 0,
        rlsEnabled: error?.message?.includes('policy') || false,
        error: error?.message
      };
      
      console.log(`  ${!error ? '⚠️ ' : '✅'} Workspace RLS: ${error ? 'Enforced' : 'Needs Review'}`);
      
    } catch (error) {
      console.log(`  ❌ Workspace test failed: ${error.message}`);
    }
  }

  async testCampaignAPIs() {
    console.log('📊 Testing Campaign APIs...');
    
    try {
      // Test campaign data access
      const { data: campaigns, error } = await supabase
        .from('campaigns')
        .select('id, name, status, type')
        .limit(5);
      
      this.testResults.api.campaigns = {
        accessible: !error,
        sampleData: campaigns?.length > 0,
        campaignTypes: campaigns ? [...new Set(campaigns.map(c => c.type))] : [],
        error: error?.message
      };
      
      console.log(`  ${!error ? '✅' : '❌'} Campaigns API: ${!error ? 'OK' : error.message}`);
      
      // Test campaign analytics
      const { data: analytics, error: analyticsError } = await supabase
        .from('campaign_analytics')
        .select('*')
        .limit(3);
      
      this.testResults.api.campaignAnalytics = {
        accessible: !analyticsError,
        hasData: analytics?.length > 0,
        error: analyticsError?.message
      };
      
      console.log(`  ${!analyticsError ? '✅' : '❌'} Analytics API: ${!analyticsError ? 'OK' : analyticsError.message}`);
      
    } catch (error) {
      console.log(`  ❌ Campaign API test failed: ${error.message}`);
    }
  }

  async testContactAPIs() {
    console.log('👥 Testing Contact APIs...');
    
    try {
      // Test contact data access
      const { data: contacts, error } = await supabase
        .from('contacts')
        .select('id, email, first_name, last_name, engagement_score')
        .limit(5);
      
      this.testResults.api.contacts = {
        accessible: !error,
        sampleData: contacts?.length > 0,
        avgEngagement: contacts?.length > 0 ? 
          contacts.reduce((sum, c) => sum + (c.engagement_score || 0), 0) / contacts.length : 0,
        error: error?.message
      };
      
      console.log(`  ${!error ? '✅' : '❌'} Contacts API: ${!error ? 'OK' : error.message}`);
      
    } catch (error) {
      console.log(`  ❌ Contact API test failed: ${error.message}`);
    }
  }

  async testPerformanceMetrics() {
    console.log('⚡ Testing Performance...');
    
    try {
      // Test multiple concurrent queries
      const startTime = Date.now();
      
      const promises = [
        supabase.from('workspaces').select('*').limit(1),
        supabase.from('campaigns').select('*').limit(1),
        supabase.from('contacts').select('*').limit(1),
        supabase.from('campaign_analytics').select('*').limit(1)
      ];
      
      const results = await Promise.all(promises);
      const totalTime = Date.now() - startTime;
      
      this.testResults.performance.concurrentQueries = {
        totalTime: totalTime,
        averageTime: totalTime / promises.length,
        allSuccessful: results.every(r => !r.error),
        grade: totalTime < 500 ? 'Excellent' : totalTime < 1000 ? 'Good' : 'Needs Improvement'
      };
      
      console.log(`  ⚡ Concurrent Queries: ${totalTime}ms (${this.testResults.performance.concurrentQueries.grade})`);
      
      // Test frontend page load
      const pageStartTime = Date.now();
      const response = await fetch(`${this.baseUrl}/dashboard`);
      const pageLoadTime = Date.now() - pageStartTime;
      
      this.testResults.performance.pageLoad = {
        dashboardLoadTime: pageLoadTime,
        status: response.status,
        grade: pageLoadTime < 1000 ? 'Excellent' : pageLoadTime < 2000 ? 'Good' : 'Needs Improvement'
      };
      
      console.log(`  🌐 Dashboard Load: ${pageLoadTime}ms (${this.testResults.performance.pageLoad.grade})`);
      
    } catch (error) {
      console.log(`  ❌ Performance test failed: ${error.message}`);
    }
  }

  generateBrowserTestReport() {
    console.log('\n' + '='.repeat(80));
    console.log('🌐 SAM AI BROWSER TEST REPORT');
    console.log('='.repeat(80));
    
    const timestamp = new Date().toISOString();
    console.log(`Generated: ${timestamp}\n`);
    
    // Frontend Access Results
    console.log('🌐 FRONTEND ACCESS:');
    Object.entries(this.testResults.frontend).forEach(([url, result]) => {
      const status = result.accessible ? '✅ Accessible' : '❌ Failed';
      console.log(`  ${url}: ${status} (${result.status})`);
    });
    console.log();
    
    // Database API Results
    console.log('🗄️  DATABASE APIs:');
    Object.entries(this.testResults.database).forEach(([table, result]) => {
      if (result.accessible) {
        const dataInfo = result.hasData ? `${result.recordCount} records` : 'no data';
        console.log(`  ${table}: ✅ OK (${dataInfo}, ${result.queryTime}ms)`);
      } else {
        console.log(`  ${table}: ❌ Failed - ${result.error}`);
      }
    });
    console.log();
    
    // API Results
    console.log('🔌 API ENDPOINTS:');
    Object.entries(this.testResults.api).forEach(([api, result]) => {
      const status = result.accessible ? '✅ Working' : '❌ Failed';
      console.log(`  ${api}: ${status}`);
      if (result.error) console.log(`    Error: ${result.error}`);
    });
    console.log();
    
    // Performance Results
    console.log('⚡ PERFORMANCE:');
    if (this.testResults.performance.concurrentQueries) {
      const cq = this.testResults.performance.concurrentQueries;
      console.log(`  Concurrent Queries: ${cq.totalTime}ms (${cq.grade})`);
    }
    if (this.testResults.performance.pageLoad) {
      const pl = this.testResults.performance.pageLoad;
      console.log(`  Dashboard Load Time: ${pl.dashboardLoadTime}ms (${pl.grade})`);
    }
    console.log();
    
    // Overall Assessment
    const frontendPass = Object.values(this.testResults.frontend).filter(r => r.accessible).length;
    const frontendTotal = Object.values(this.testResults.frontend).length;
    const dbPass = Object.values(this.testResults.database).filter(r => r.accessible).length;
    const dbTotal = Object.values(this.testResults.database).length;
    
    const overallSuccess = Math.round(((frontendPass + dbPass) / (frontendTotal + dbTotal)) * 100);
    
    console.log('🎯 OVERALL ASSESSMENT:');
    console.log(`  Frontend Success: ${frontendPass}/${frontendTotal} (${Math.round((frontendPass/frontendTotal)*100)}%)`);
    console.log(`  Database Success: ${dbPass}/${dbTotal} (${Math.round((dbPass/dbTotal)*100)}%)`);
    console.log(`  Overall Success: ${overallSuccess}%`);
    console.log(`  System Status: ${this.getSystemStatus(overallSuccess)}`);
    console.log(`  Ready for Production: ${overallSuccess >= 80 ? '✅ YES' : '❌ NEEDS WORK'}\n`);
    
    // Recommendations
    this.generateBrowserTestRecommendations(overallSuccess);
    
    console.log('='.repeat(80));
    
    return {
      ...this.testResults,
      summary: {
        overallSuccess,
        frontendSuccess: Math.round((frontendPass/frontendTotal)*100),
        databaseSuccess: Math.round((dbPass/dbTotal)*100),
        systemStatus: this.getSystemStatus(overallSuccess),
        productionReady: overallSuccess >= 80,
        timestamp
      }
    };
  }

  getSystemStatus(successRate) {
    if (successRate >= 90) return '🟢 Excellent';
    if (successRate >= 75) return '🟡 Good';
    if (successRate >= 60) return '🟠 Fair';
    return '🔴 Needs Work';
  }

  generateBrowserTestRecommendations(successRate) {
    console.log('💡 BROWSER TEST RECOMMENDATIONS:');
    
    if (successRate >= 90) {
      console.log('  ✅ Application is performing excellently in browser tests');
      console.log('  ✅ All critical endpoints are accessible');
      console.log('  🚀 Ready for user acceptance testing');
    } else if (successRate >= 75) {
      console.log('  ⚠️  Application is mostly functional but has some issues');
      console.log('  🔧 Review failed endpoints and fix connectivity issues');
      console.log('  📝 Test missing database tables creation');
    } else {
      console.log('  ❌ Application needs significant work before production');
      console.log('  🔧 Fix database connectivity and table creation');
      console.log('  📋 Review all API endpoints and authentication flow');
      console.log('  🧪 Complete missing table schema deployment');
    }
    
    // Specific recommendations
    const failedFrontend = Object.entries(this.testResults.frontend).filter(([_, r]) => !r.accessible);
    if (failedFrontend.length > 0) {
      console.log('  🌐 Fix these frontend routes:');
      failedFrontend.forEach(([url, _]) => console.log(`      - ${url}`));
    }
    
    const failedDB = Object.entries(this.testResults.database).filter(([_, r]) => !r.accessible);
    if (failedDB.length > 0) {
      console.log('  🗄️  Fix these database issues:');
      failedDB.forEach(([table, result]) => console.log(`      - ${table}: ${result.error}`));
    }
    
    console.log();
  }
}

// Run the browser test suite
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new BrowserTester();
  tester.runAllTests().then(() => {
    console.log('Browser test suite completed');
  }).catch((error) => {
    console.error('Browser test suite failed:', error);
    process.exit(1);
  });
}

export default BrowserTester;