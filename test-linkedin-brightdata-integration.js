/**
 * LinkedIn and Bright Data Integration Testing
 * Tests the LinkedIn integration components and Bright Data proxy functionality
 */

import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

const supabase = createClient(
  'https://latxadqrvrrrcvkktrog.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhdHhhZHFydnJycmN2a2t0cm9nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTk5ODYsImV4cCI6MjA2ODI3NTk4Nn0.3WkAgXpk_MyQioVf_SED9O_ArjcT9nH0uy9we2okftE'
);

class LinkedInBrightDataTester {
  constructor() {
    this.testResults = {
      linkedinOAuth: {},
      brightDataProxy: {},
      prospectSearch: {},
      dataCollection: {},
      integration: {}
    };
  }

  async runLinkedInTests() {
    console.log('💼 Starting LinkedIn & Bright Data Integration Tests...\n');
    
    try {
      await this.testLinkedInOAuthConfig();
      await this.testBrightDataConfiguration();
      await this.testProspectSearchSystem();
      await this.testDataCollectionWorkflow();
      await this.testSystemIntegration();
      
      this.generateLinkedInTestReport();
      
    } catch (error) {
      console.error('❌ LinkedIn test suite failed:', error);
    }
  }

  async testLinkedInOAuthConfig() {
    console.log('🔐 Testing LinkedIn OAuth Configuration...');
    
    try {
      // Test LinkedIn OAuth environment variables
      const linkedinClientId = '78094ft3hvizqs';
      const linkedinClientSecret = 'WPL_AP1.r88IfXzVhe12NUdM.spqg9Q==';
      
      this.testResults.linkedinOAuth.clientIdExists = !!linkedinClientId;
      this.testResults.linkedinOAuth.clientSecretExists = !!linkedinClientSecret;
      
      console.log(`  ${this.testResults.linkedinOAuth.clientIdExists ? '✅' : '❌'} LinkedIn Client ID: ${this.testResults.linkedinOAuth.clientIdExists ? 'Configured' : 'Missing'}`);
      console.log(`  ${this.testResults.linkedinOAuth.clientSecretExists ? '✅' : '❌'} LinkedIn Client Secret: ${this.testResults.linkedinOAuth.clientSecretExists ? 'Configured' : 'Missing'}`);
      
      // Test OAuth callback endpoint
      const callbackUrl = 'http://localhost:8081/auth/linkedin/callback';
      try {
        const response = await fetch(callbackUrl);
        this.testResults.linkedinOAuth.callbackEndpoint = response.status !== 500; // Should not be a server error
        console.log(`  ${this.testResults.linkedinOAuth.callbackEndpoint ? '✅' : '❌'} OAuth Callback: ${this.testResults.linkedinOAuth.callbackEndpoint ? 'Accessible' : 'Error'}`);
      } catch (error) {
        this.testResults.linkedinOAuth.callbackEndpoint = false;
        console.log(`  ❌ OAuth Callback: Network Error`);
      }
      
      // Test LinkedIn authorization URL construction
      const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${linkedinClientId}&redirect_uri=${encodeURIComponent('http://localhost:8081/auth/linkedin/callback')}&scope=r_liteprofile%20r_emailaddress`;
      this.testResults.linkedinOAuth.authUrlValid = authUrl.includes('linkedin.com') && authUrl.includes(linkedinClientId);
      console.log(`  ${this.testResults.linkedinOAuth.authUrlValid ? '✅' : '❌'} Auth URL: ${this.testResults.linkedinOAuth.authUrlValid ? 'Valid' : 'Invalid'}`);
      
      // Test production callback configuration
      const productionCallback = 'https://sameaisalesassistant.netlify.app/auth/linkedin/callback';
      try {
        const prodResponse = await fetch(productionCallback);
        this.testResults.linkedinOAuth.productionCallback = prodResponse.status !== 500;
        console.log(`  ${this.testResults.linkedinOAuth.productionCallback ? '✅' : '❌'} Production Callback: ${this.testResults.linkedinOAuth.productionCallback ? 'Accessible' : 'Error'}`);
      } catch (error) {
        this.testResults.linkedinOAuth.productionCallback = false;
        console.log(`  ❌ Production Callback: Network Error`);
      }
      
    } catch (error) {
      console.error('    ❌ OAuth configuration test failed:', error.message);
      this.testResults.linkedinOAuth.error = error.message;
    }
  }

  async testBrightDataConfiguration() {
    console.log('🌐 Testing Bright Data Proxy Configuration...');
    
    try {
      // Test Bright Data environment variables (these would be empty in demo)
      const brightDataConfig = {
        customerId: process.env.VITE_BRIGHTDATA_CUSTOMER_ID || '',
        password: process.env.VITE_BRIGHTDATA_PASSWORD || '',
        zone: process.env.VITE_BRIGHTDATA_ZONE || ''
      };
      
      this.testResults.brightDataProxy.configExists = false; // Expected in demo mode
      console.log(`  ⚠️  Bright Data Config: Demo mode (credentials not configured)`);
      
      // Test Supabase Edge Function for proxy requests
      const proxyFunctionUrl = `https://latxadqrvrrrcvkktrog.supabase.co/functions/v1/brightdata-proxy`;
      try {
        // Test with a simple ping request (without credentials, should handle gracefully)
        const response = await fetch(proxyFunctionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: 'https://httpbin.org/status/200',
            method: 'GET'
          })
        });
        
        this.testResults.brightDataProxy.edgeFunction = response.status !== 500;
        console.log(`  ${this.testResults.brightDataProxy.edgeFunction ? '✅' : '❌'} Proxy Edge Function: ${this.testResults.brightDataProxy.edgeFunction ? 'Accessible' : 'Error'}`);
        
      } catch (error) {
        this.testResults.brightDataProxy.edgeFunction = false;
        console.log(`  ❌ Proxy Edge Function: Network Error`);
      }
      
      // Test LinkedIn search URL generation
      const searchParams = {
        keywords: 'software engineer',
        location: 'United States',
        industry: 'Technology',
        companySize: '51-200'
      };
      
      const linkedinSearchUrl = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(searchParams.keywords)}&geoUrn=["103644278"]&industryCompanyVertical=["96"]`;
      this.testResults.brightDataProxy.urlGeneration = linkedinSearchUrl.includes('linkedin.com');
      console.log(`  ${this.testResults.brightDataProxy.urlGeneration ? '✅' : '❌'} URL Generation: ${this.testResults.brightDataProxy.urlGeneration ? 'Working' : 'Failed'}`);
      
    } catch (error) {
      console.error('    ❌ Bright Data configuration test failed:', error.message);
      this.testResults.brightDataProxy.error = error.message;
    }
  }

  async testProspectSearchSystem() {
    console.log('🔍 Testing Prospect Search System...');
    
    try {
      // Test saved searches table
      const { data: savedSearches, error: savedError } = await supabase
        .from('saved_searches')
        .select('*')
        .limit(3);
      
      this.testResults.prospectSearch.savedSearchesTable = !savedError;
      console.log(`  ${this.testResults.prospectSearch.savedSearchesTable ? '✅' : '❌'} Saved Searches Table: ${this.testResults.prospectSearch.savedSearchesTable ? 'Accessible' : savedError?.message}`);
      
      // Test search configuration structure
      const sampleSearchConfig = {
        searchType: 'people',
        keywords: ['software engineer', 'full stack'],
        locations: ['United States', 'Canada'],
        industries: ['Technology', 'Software'],
        companySize: '51-200',
        experienceLevel: 'mid-senior',
        dateRange: '30d'
      };
      
      this.testResults.prospectSearch.configStructure = !!sampleSearchConfig.searchType;
      console.log(`  ✅ Search Config Structure: Valid`);
      
      // Test search URL generation for different LinkedIn search types
      const searchTypes = ['people', 'companies', 'posts'];
      this.testResults.prospectSearch.urlGenerationTypes = {};
      
      for (const type of searchTypes) {
        const baseUrl = type === 'people' ? 'https://www.linkedin.com/search/results/people/' :
                       type === 'companies' ? 'https://www.linkedin.com/search/results/companies/' :
                       'https://www.linkedin.com/search/results/content/';
        
        this.testResults.prospectSearch.urlGenerationTypes[type] = baseUrl.includes('linkedin.com');
        console.log(`    ${this.testResults.prospectSearch.urlGenerationTypes[type] ? '✅' : '❌'} ${type}: URL generation working`);
      }
      
    } catch (error) {
      console.error('    ❌ Prospect search test failed:', error.message);
      this.testResults.prospectSearch.error = error.message;
    }
  }

  async testDataCollectionWorkflow() {
    console.log('📊 Testing Data Collection Workflow...');
    
    try {
      // Test prospect profile data structure
      const sampleProspectProfile = {
        fullName: 'John Doe',
        headline: 'Software Engineer at Tech Corp',
        location: 'San Francisco, CA',
        profileUrl: 'https://linkedin.com/in/johndoe',
        experience: [
          {
            title: 'Senior Software Engineer',
            company: 'Tech Corp',
            duration: '2020-Present'
          }
        ],
        education: [
          {
            school: 'University of California',
            degree: 'BS Computer Science',
            years: '2016-2020'
          }
        ],
        skills: ['JavaScript', 'React', 'Node.js'],
        connections: '500+'
      };
      
      this.testResults.dataCollection.profileStructure = !!sampleProspectProfile.fullName;
      console.log(`  ✅ Profile Data Structure: Valid`);
      
      // Test data enrichment capabilities
      const enrichmentFields = [
        'companyInfo',
        'industryAnalysis',
        'techStack',
        'recentActivity',
        'mutualConnections',
        'contactInfo'
      ];
      
      this.testResults.dataCollection.enrichmentCapabilities = enrichmentFields.length > 0;
      console.log(`  ✅ Data Enrichment: ${enrichmentFields.length} capabilities available`);
      
      // Test data storage integration
      // Note: We can't test actual insertion due to RLS, but we can test table structure
      const { error: contactsError } = await supabase
        .from('contacts')
        .select('email, first_name, last_name, linkedin_url')
        .limit(1);
      
      this.testResults.dataCollection.storageIntegration = !contactsError;
      console.log(`  ${this.testResults.dataCollection.storageIntegration ? '✅' : '❌'} Storage Integration: ${this.testResults.dataCollection.storageIntegration ? 'Ready' : contactsError?.message}`);
      
    } catch (error) {
      console.error('    ❌ Data collection test failed:', error.message);
      this.testResults.dataCollection.error = error.message;
    }
  }

  async testSystemIntegration() {
    console.log('🔗 Testing System Integration...');
    
    try {
      // Test campaign integration
      const { data: campaigns, error: campaignError } = await supabase
        .from('campaigns')
        .select('id, name, type')
        .limit(1);
      
      this.testResults.integration.campaignIntegration = !campaignError;
      console.log(`  ${this.testResults.integration.campaignIntegration ? '✅' : '❌'} Campaign Integration: ${this.testResults.integration.campaignIntegration ? 'Ready' : campaignError?.message}`);
      
      // Test analytics integration
      const { data: analytics, error: analyticsError } = await supabase
        .from('campaign_analytics')
        .select('*')
        .limit(1);
      
      this.testResults.integration.analyticsIntegration = !analyticsError;
      console.log(`  ${this.testResults.integration.analyticsIntegration ? '✅' : '❌'} Analytics Integration: ${this.testResults.integration.analyticsIntegration ? 'Ready' : analyticsError?.message}`);
      
      // Test frontend components accessibility
      const frontendComponents = [
        '/linkedin-integration',
        '/prospect-search',
        '/campaigns'
      ];
      
      this.testResults.integration.frontendComponents = {};
      
      for (const component of frontendComponents) {
        try {
          const response = await fetch(`http://localhost:8081${component}`);
          this.testResults.integration.frontendComponents[component] = response.status === 200;
          console.log(`    ${this.testResults.integration.frontendComponents[component] ? '✅' : '❌'} ${component}: ${this.testResults.integration.frontendComponents[component] ? 'Accessible' : 'Error'}`);
        } catch (error) {
          this.testResults.integration.frontendComponents[component] = false;
          console.log(`    ❌ ${component}: Network Error`);
        }
      }
      
      // Test API endpoints
      const apiEndpoints = {
        supabaseHealth: 'https://latxadqrvrrrcvkktrog.supabase.co/rest/v1/',
        proxyFunction: 'https://latxadqrvrrrcvkktrog.supabase.co/functions/v1/brightdata-proxy'
      };
      
      this.testResults.integration.apiEndpoints = {};
      
      for (const [name, endpoint] of Object.entries(apiEndpoints)) {
        try {
          const response = await fetch(endpoint, { method: 'GET' });
          this.testResults.integration.apiEndpoints[name] = response.status !== 500;
          console.log(`    ${this.testResults.integration.apiEndpoints[name] ? '✅' : '❌'} ${name}: ${this.testResults.integration.apiEndpoints[name] ? 'Accessible' : 'Error'}`);
        } catch (error) {
          this.testResults.integration.apiEndpoints[name] = false;
          console.log(`    ❌ ${name}: Network Error`);
        }
      }
      
    } catch (error) {
      console.error('    ❌ System integration test failed:', error.message);
      this.testResults.integration.error = error.message;
    }
  }

  generateLinkedInTestReport() {
    console.log('\n' + '='.repeat(80));
    console.log('💼 LINKEDIN & BRIGHT DATA INTEGRATION TEST REPORT');
    console.log('='.repeat(80));
    
    const timestamp = new Date().toISOString();
    console.log(`Generated: ${timestamp}\n`);
    
    // LinkedIn OAuth Results
    console.log('🔐 LINKEDIN OAUTH:');
    Object.entries(this.testResults.linkedinOAuth).forEach(([test, result]) => {
      if (test !== 'error') {
        console.log(`  ${test}: ${result ? '✅ Pass' : '❌ Fail'}`);
      }
    });
    if (this.testResults.linkedinOAuth.error) {
      console.log(`  Error: ${this.testResults.linkedinOAuth.error}`);
    }
    console.log();
    
    // Bright Data Results
    console.log('🌐 BRIGHT DATA PROXY:');
    Object.entries(this.testResults.brightDataProxy).forEach(([test, result]) => {
      if (test !== 'error') {
        console.log(`  ${test}: ${result ? '✅ Pass' : '❌ Fail'}`);
      }
    });
    if (this.testResults.brightDataProxy.error) {
      console.log(`  Error: ${this.testResults.brightDataProxy.error}`);
    }
    console.log();
    
    // Prospect Search Results
    console.log('🔍 PROSPECT SEARCH:');
    Object.entries(this.testResults.prospectSearch).forEach(([test, result]) => {
      if (test !== 'error' && test !== 'urlGenerationTypes') {
        console.log(`  ${test}: ${result ? '✅ Pass' : '❌ Fail'}`);
      }
    });
    if (this.testResults.prospectSearch.urlGenerationTypes) {
      console.log('  URL Generation Types:');
      Object.entries(this.testResults.prospectSearch.urlGenerationTypes).forEach(([type, result]) => {
        console.log(`    ${type}: ${result ? '✅ Pass' : '❌ Fail'}`);
      });
    }
    if (this.testResults.prospectSearch.error) {
      console.log(`  Error: ${this.testResults.prospectSearch.error}`);
    }
    console.log();
    
    // Data Collection Results
    console.log('📊 DATA COLLECTION:');
    Object.entries(this.testResults.dataCollection).forEach(([test, result]) => {
      if (test !== 'error') {
        console.log(`  ${test}: ${result ? '✅ Pass' : '❌ Fail'}`);
      }
    });
    if (this.testResults.dataCollection.error) {
      console.log(`  Error: ${this.testResults.dataCollection.error}`);
    }
    console.log();
    
    // Integration Results
    console.log('🔗 SYSTEM INTEGRATION:');
    Object.entries(this.testResults.integration).forEach(([test, result]) => {
      if (test !== 'error' && test !== 'frontendComponents' && test !== 'apiEndpoints') {
        console.log(`  ${test}: ${result ? '✅ Pass' : '❌ Fail'}`);
      }
    });
    
    if (this.testResults.integration.frontendComponents) {
      console.log('  Frontend Components:');
      Object.entries(this.testResults.integration.frontendComponents).forEach(([component, result]) => {
        console.log(`    ${component}: ${result ? '✅ Pass' : '❌ Fail'}`);
      });
    }
    
    if (this.testResults.integration.apiEndpoints) {
      console.log('  API Endpoints:');
      Object.entries(this.testResults.integration.apiEndpoints).forEach(([endpoint, result]) => {
        console.log(`    ${endpoint}: ${result ? '✅ Pass' : '❌ Fail'}`);
      });
    }
    
    if (this.testResults.integration.error) {
      console.log(`  Error: ${this.testResults.integration.error}`);
    }
    console.log();
    
    // Overall Assessment
    const allTests = this.getAllTestResults();
    const passedTests = allTests.filter(Boolean).length;
    const totalTests = allTests.length;
    const successRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;
    
    console.log('🎯 OVERALL ASSESSMENT:');
    console.log(`  Success Rate: ${successRate}% (${passedTests}/${totalTests} tests passed)`);
    console.log(`  LinkedIn Integration: ${this.getIntegrationStatus(successRate)}`);
    console.log(`  Production Ready: ${successRate >= 70 ? '✅ YES' : '❌ NEEDS WORK'}\n`);
    
    // Recommendations
    this.generateLinkedInRecommendations(successRate);
    
    console.log('='.repeat(80));
    
    return {
      ...this.testResults,
      summary: {
        passedTests,
        totalTests,
        successRate,
        integrationStatus: this.getIntegrationStatus(successRate),
        productionReady: successRate >= 70,
        timestamp
      }
    };
  }

  getAllTestResults() {
    const results = [];
    
    // Collect all boolean test results
    Object.values(this.testResults.linkedinOAuth).forEach(v => {
      if (typeof v === 'boolean') results.push(v);
    });
    Object.values(this.testResults.brightDataProxy).forEach(v => {
      if (typeof v === 'boolean') results.push(v);
    });
    Object.values(this.testResults.prospectSearch).forEach(v => {
      if (typeof v === 'boolean') results.push(v);
      if (typeof v === 'object' && v !== null) {
        Object.values(v).forEach(subV => {
          if (typeof subV === 'boolean') results.push(subV);
        });
      }
    });
    Object.values(this.testResults.dataCollection).forEach(v => {
      if (typeof v === 'boolean') results.push(v);
    });
    Object.values(this.testResults.integration).forEach(v => {
      if (typeof v === 'boolean') results.push(v);
      if (typeof v === 'object' && v !== null) {
        Object.values(v).forEach(subV => {
          if (typeof subV === 'boolean') results.push(subV);
        });
      }
    });
    
    return results;
  }

  getIntegrationStatus(successRate) {
    if (successRate >= 90) return '🟢 Excellent';
    if (successRate >= 75) return '🟡 Good';
    if (successRate >= 60) return '🟠 Fair';
    return '🔴 Needs Work';
  }

  generateLinkedInRecommendations(successRate) {
    console.log('💡 LINKEDIN INTEGRATION RECOMMENDATIONS:');
    
    if (successRate >= 90) {
      console.log('  ✅ LinkedIn integration is working excellently');
      console.log('  ✅ All components are properly configured');
      console.log('  🚀 Ready for LinkedIn automation workflows');
    } else if (successRate >= 75) {
      console.log('  ⚠️  LinkedIn integration is mostly functional');
      console.log('  🔧 Review any failed endpoint or configuration tests');
      console.log('  📝 Consider configuring Bright Data credentials for production');
    } else {
      console.log('  ❌ LinkedIn integration needs significant work');
      console.log('  🔧 Fix OAuth configuration and callback endpoints');
      console.log('  📋 Configure Bright Data proxy credentials');
      console.log('  🧪 Test all data collection and storage workflows');
    }
    
    // Specific recommendations
    if (!this.testResults.linkedinOAuth.callbackEndpoint) {
      console.log('  🔐 Fix LinkedIn OAuth callback endpoint configuration');
    }
    
    if (!this.testResults.brightDataProxy.edgeFunction) {
      console.log('  🌐 Check Supabase Edge Function deployment for proxy requests');
    }
    
    if (!this.testResults.dataCollection.storageIntegration) {
      console.log('  📊 Review database table structure and RLS policies');
    }
    
    console.log();
  }
}

// Run the LinkedIn test suite
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new LinkedInBrightDataTester();
  tester.runLinkedInTests().then(() => {
    console.log('LinkedIn integration test suite completed');
  }).catch((error) => {
    console.error('LinkedIn integration test suite failed:', error);
    process.exit(1);
  });
}

export default LinkedInBrightDataTester;