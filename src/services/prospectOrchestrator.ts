/**
 * Prospect Extraction Orchestrator
 * 
 * Smart system that automatically chooses the best extraction method
 * based on URL type, available services, and data quality requirements.
 * User never needs to choose - the system decides intelligently.
 */

import { apifyMcp, type ApifyLinkedInResult } from './apifyMcp';
import { apolloMcp, type ApolloContact } from './apolloMcp';
import { toast } from 'sonner';

interface ProspectResult {
  first_name: string;
  last_name: string;
  email: string;
  title?: string;
  company?: string;
  linkedin_url?: string;
  phone?: string;
  location?: string;
  source: 'apollo' | 'apify' | 'simulation';
  email_verified?: boolean;
  confidence_score?: number;
}

interface ExtractionResult {
  success: boolean;
  prospects: ProspectResult[];
  method_used: 'apollo' | 'apify' | 'simulation';
  data_quality: 'excellent' | 'good' | 'fair' | 'poor';
  errors: string[];
  warnings: string[];
  extractedCount: number;
  failedCount: number;
  cost_estimate?: number;
  processing_time_ms: number;
}

interface ExtractionStrategy {
  method: 'apollo' | 'apify' | 'simulation';
  priority: number;
  reason: string;
  estimated_quality: 'excellent' | 'good' | 'fair' | 'poor';
  estimated_cost: number;
}

class ProspectOrchestrator {
  private strategies: ExtractionStrategy[] = [];
  
  /**
   * Main extraction method - automatically chooses best approach
   */
  async extractProspects(input: string, maxResults: number = 100): Promise<ExtractionResult> {
    const startTime = Date.now();
    
    try {
      // Step 1: Analyze input and determine strategies
      const strategies = await this.analyzeInput(input, maxResults);
      
      // Step 2: Execute strategies in priority order
      for (const strategy of strategies) {
        console.log(`🔄 Trying ${strategy.method}: ${strategy.reason}`);
        
        try {
          const result = await this.executeStrategy(strategy, input, maxResults);
          
          if (result.success && result.prospects.length > 0) {
            result.processing_time_ms = Date.now() - startTime;
            console.log(`✅ Success with ${strategy.method}: ${result.prospects.length} prospects`);
            return result;
          }
        } catch (error) {
          console.log(`❌ ${strategy.method} failed:`, error);
          continue; // Try next strategy
        }
      }
      
      // Step 3: All strategies failed - return simulation
      console.log('⚠️ All extraction methods failed, using simulation');
      return await this.simulateExtraction(input, maxResults, Date.now() - startTime);
      
    } catch (error) {
      console.error('Orchestrator error:', error);
      return await this.simulateExtraction(input, maxResults, Date.now() - startTime);
    }
  }

  /**
   * Analyzes input and determines best extraction strategies in priority order
   */
  private async analyzeInput(input: string, maxResults: number): Promise<ExtractionStrategy[]> {
    const strategies: ExtractionStrategy[] = [];
    
    // Detect input type
    const inputType = this.detectInputType(input);
    
    switch (inputType) {
      case 'linkedin_search':
        // LinkedIn search URL - Apify is PRIMARY (directly handles URLs)
        strategies.push({
          method: 'apify',
          priority: 1,
          reason: 'Apify directly processes LinkedIn search URLs - perfect match for URL-based input',
          estimated_quality: 'excellent',
          estimated_cost: maxResults * 0.01 // $0.01 per prospect
        });
        
        strategies.push({
          method: 'apollo',
          priority: 2,
          reason: 'Apollo backup using parsed search criteria from URL',
          estimated_quality: 'excellent',
          estimated_cost: maxResults * 0.02 // $0.02 per prospect
        });
        break;
        
      case 'sales_navigator':
        // Sales Navigator - Apify excels at this
        strategies.push({
          method: 'apify',
          priority: 1,
          reason: 'Apify specialized for Sales Navigator URLs - native support',
          estimated_quality: 'excellent',
          estimated_cost: maxResults * 0.015
        });
        
        strategies.push({
          method: 'apollo',
          priority: 2,
          reason: 'Apollo backup by parsing Sales Navigator criteria',
          estimated_quality: 'good',
          estimated_cost: maxResults * 0.02
        });
        break;
        
      case 'search_keywords':
        // Text keywords - Apollo is ideal
        strategies.push({
          method: 'apollo',
          priority: 1,
          reason: 'Apollo database perfect for keyword-based searches',
          estimated_quality: 'excellent',
          estimated_cost: maxResults * 0.02
        });
        break;
        
      case 'company_domain':
        // Company domain - Apollo company search
        strategies.push({
          method: 'apollo',
          priority: 1,
          reason: 'Apollo company employee search',
          estimated_quality: 'excellent',
          estimated_cost: maxResults * 0.025
        });
        break;
    }
    
    // Always add simulation as last resort
    strategies.push({
      method: 'simulation',
      priority: 99,
      reason: 'Simulation for demo/development purposes',
      estimated_quality: 'fair',
      estimated_cost: 0
    });
    
    return strategies.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Detects the type of input provided
   */
  private detectInputType(input: string): 'linkedin_search' | 'sales_navigator' | 'search_keywords' | 'company_domain' | 'unknown' {
    const trimmed = input.trim().toLowerCase();
    
    // LinkedIn search URL
    if (trimmed.includes('linkedin.com/search/results/people/')) {
      return 'linkedin_search';
    }
    
    // Sales Navigator URL
    if (trimmed.includes('linkedin.com/sales/') || trimmed.includes('linkedin.com/talent/')) {
      return 'sales_navigator';
    }
    
    // Company domain
    if (trimmed.includes('.com') || trimmed.includes('.io') || trimmed.includes('.co')) {
      return 'company_domain';
    }
    
    // URL pattern
    if (trimmed.startsWith('http')) {
      return 'linkedin_search'; // Assume LinkedIn for now
    }
    
    // Text keywords
    return 'search_keywords';
  }

  /**
   * Executes a specific extraction strategy
   */
  private async executeStrategy(
    strategy: ExtractionStrategy, 
    input: string, 
    maxResults: number
  ): Promise<ExtractionResult> {
    
    switch (strategy.method) {
      case 'apollo':
        return await this.executeApolloStrategy(input, maxResults);
        
      case 'apify':
        return await this.executeApifyStrategy(input, maxResults);
        
      case 'simulation':
        return await this.simulateExtraction(input, maxResults, 0);
        
      default:
        throw new Error(`Unknown strategy: ${strategy.method}`);
    }
  }

  /**
   * Executes Apollo extraction strategy
   */
  private async executeApolloStrategy(input: string, maxResults: number): Promise<ExtractionResult> {
    const inputType = this.detectInputType(input);
    let searchCriteria: any = {};
    
    if (inputType === 'linkedin_search' || inputType === 'sales_navigator') {
      // Parse LinkedIn URL to extract search criteria
      searchCriteria = apolloMcp.parseLinkedInSearchUrl(input);
    } else if (inputType === 'search_keywords') {
      // Use input as keywords
      searchCriteria = { keywords: input };
    } else if (inputType === 'company_domain') {
      // Extract company name from domain
      const domain = input.replace(/https?:\/\//, '').split('.')[0];
      searchCriteria = { companies: [domain] };
    }
    
    const apolloResult = await apolloMcp.searchProspects({
      ...searchCriteria,
      maxResults
    });
    
    if (!apolloResult.success) {
      throw new Error(`Apollo search failed: ${apolloResult.errors.join(', ')}`);
    }
    
    const prospects = apolloMcp.convertToProspects(apolloResult.data);
    
    return {
      success: true,
      prospects,
      method_used: 'apollo',
      data_quality: this.assessDataQuality(prospects, 'apollo'),
      errors: apolloResult.errors,
      warnings: [],
      extractedCount: prospects.length,
      failedCount: apolloResult.data.length - prospects.length,
      cost_estimate: prospects.length * 0.02,
      processing_time_ms: 0 // Will be set by caller
    };
  }

  /**
   * Executes Apify extraction strategy
   */
  private async executeApifyStrategy(input: string, maxResults: number): Promise<ExtractionResult> {
    const apifyResult = await apifyMcp.extractLinkedInProfiles(input, {
      maxResults,
      extractEmails: true,
      extractPhones: false
    });
    
    if (!apifyResult.success) {
      throw new Error(`Apify extraction failed: ${apifyResult.errors.join(', ')}`);
    }
    
    const prospects = apifyMcp.convertToProspects(apifyResult.data);
    
    return {
      success: true,
      prospects,
      method_used: 'apify',
      data_quality: this.assessDataQuality(prospects, 'apify'),
      errors: apifyResult.errors,
      warnings: [],
      extractedCount: prospects.length,
      failedCount: apifyResult.data.length - prospects.length,
      cost_estimate: prospects.length * 0.01,
      processing_time_ms: 0
    };
  }

  /**
   * Simulation fallback method
   */
  private async simulateExtraction(input: string, maxResults: number, elapsedTime: number): Promise<ExtractionResult> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, Math.max(0, 2000 - elapsedTime)));
    
    const mockProspects: ProspectResult[] = [
      {
        first_name: 'Sarah',
        last_name: 'Johnson',
        email: 'sarah.johnson@techcorp.com',
        title: 'Marketing Director',
        company: 'TechCorp Solutions',
        linkedin_url: 'https://linkedin.com/in/sarah-johnson-marketing',
        source: 'simulation',
        email_verified: true,
        confidence_score: 0.95
      },
      {
        first_name: 'Michael',
        last_name: 'Chen',
        email: 'michael.chen@innovate.io',
        title: 'Product Manager',
        company: 'Innovate Labs',
        linkedin_url: 'https://linkedin.com/in/michael-chen-pm',
        source: 'simulation',
        email_verified: true,
        confidence_score: 0.92
      },
      {
        first_name: 'Emma',
        last_name: 'Wilson',
        email: 'emma.wilson@startup.com',
        title: 'VP Sales',
        company: 'Growth Startup',
        linkedin_url: 'https://linkedin.com/in/emma-wilson-sales',
        source: 'simulation',
        email_verified: false,
        confidence_score: 0.78
      }
    ];
    
    const slicedResults = mockProspects.slice(0, Math.min(maxResults, mockProspects.length));
    
    return {
      success: true,
      prospects: slicedResults,
      method_used: 'simulation',
      data_quality: 'fair',
      errors: [],
      warnings: ['Using simulated data for demonstration'],
      extractedCount: slicedResults.length,
      failedCount: 0,
      cost_estimate: 0,
      processing_time_ms: Date.now() - (Date.now() - elapsedTime)
    };
  }

  /**
   * Assesses data quality based on source and completeness
   */
  private assessDataQuality(prospects: ProspectResult[], source: string): 'excellent' | 'good' | 'fair' | 'poor' {
    if (prospects.length === 0) return 'poor';
    
    const emailVerifiedCount = prospects.filter(p => p.email_verified !== false).length;
    const completeProfilesCount = prospects.filter(p => 
      p.first_name && p.last_name && p.email && p.title && p.company
    ).length;
    
    const emailVerificationRate = emailVerifiedCount / prospects.length;
    const completenessRate = completeProfilesCount / prospects.length;
    
    if (source === 'apollo' && emailVerificationRate > 0.8 && completenessRate > 0.9) {
      return 'excellent';
    }
    
    if (completenessRate > 0.7 && emailVerificationRate > 0.6) {
      return 'good';
    }
    
    if (completenessRate > 0.5) {
      return 'fair';
    }
    
    return 'poor';
  }

  /**
   * Public method to get extraction strategies without executing
   */
  async getStrategiesForInput(input: string, maxResults: number = 100): Promise<ExtractionStrategy[]> {
    return await this.analyzeInput(input, maxResults);
  }
}

// Export singleton instance
export const prospectOrchestrator = new ProspectOrchestrator();
export type { ProspectResult, ExtractionResult, ExtractionStrategy };