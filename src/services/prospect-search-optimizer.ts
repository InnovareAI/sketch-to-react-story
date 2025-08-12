// Prospect Search Optimization Service
// Handles error recovery, cost optimization, and performance monitoring

import { supabase } from '@/integrations/supabase/client';
import { enhancedBrightDataService } from '@/services/brightdata-proxy-secure';
import { ProspectSearchService } from '@/services/prospect-search';

export interface SearchOptimizationConfig {
  maxBudget: number;
  costPerProspectTarget: number;
  qualityScoreThreshold: number;
  duplicateDetectionEnabled: boolean;
  autoRetryEnabled: boolean;
  maxRetries: number;
  backoffMultiplier: number;
}

export interface CostOptimizationRecommendation {
  type: 'budget_alert' | 'quality_improvement' | 'efficiency_gain' | 'cost_reduction';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action: string;
  estimated_savings?: number;
  potential_quality_impact?: string;
}

export interface ErrorRecoveryStrategy {
  error_type: string;
  retry_strategy: 'immediate' | 'backoff' | 'fallback' | 'skip';
  fallback_method?: string;
  max_attempts: number;
  success_rate: number;
}

export class ProspectSearchOptimizer {
  private static config: SearchOptimizationConfig = {
    maxBudget: 5.00, // $5 monthly budget
    costPerProspectTarget: 0.10, // Target $0.10 per prospect
    qualityScoreThreshold: 0.7,
    duplicateDetectionEnabled: true,
    autoRetryEnabled: true,
    maxRetries: 3,
    backoffMultiplier: 2
  };

  private static errorRecoveryStrategies: ErrorRecoveryStrategy[] = [
    {
      error_type: 'rate_limit_exceeded',
      retry_strategy: 'backoff',
      max_attempts: 3,
      success_rate: 0.85
    },
    {
      error_type: 'proxy_blocked',
      retry_strategy: 'fallback',
      fallback_method: 'different_proxy_region',
      max_attempts: 2,
      success_rate: 0.75
    },
    {
      error_type: 'linkedin_captcha',
      retry_strategy: 'backoff',
      max_attempts: 2,
      success_rate: 0.60
    },
    {
      error_type: 'network_timeout',
      retry_strategy: 'immediate',
      max_attempts: 3,
      success_rate: 0.90
    },
    {
      error_type: 'budget_exceeded',
      retry_strategy: 'skip',
      max_attempts: 0,
      success_rate: 0
    },
    {
      error_type: 'invalid_credentials',
      retry_strategy: 'skip',
      max_attempts: 0,
      success_rate: 0
    }
  ];

  /**
   * Optimize search parameters for cost efficiency
   */
  static async optimizeSearchParameters(
    searchType: string,
    targetProspectCount: number,
    currentBudget: number
  ): Promise<{
    optimized_params: {
      max_results: number;
      proxy_regions: string[];
      search_batches: number;
      estimated_cost: number;
    };
    recommendations: CostOptimizationRecommendation[];
  }> {
    const analytics = await enhancedBrightDataService.getUsageAnalytics();
    const remainingBudget = currentBudget - analytics.cost_tracker.current_spend;
    const avgCostPerProspect = analytics.monthly_summary.average_cost_per_prospect || 0.05;
    
    const recommendations: CostOptimizationRecommendation[] = [];
    
    // Calculate optimal batch size based on remaining budget
    const maxAffordableProspects = Math.floor(remainingBudget / avgCostPerProspect);
    const actualTargetCount = Math.min(targetProspectCount, maxAffordableProspects);
    
    // Optimize based on search type
    let searchMultiplier = 1;
    let proxyRegions = ['US'];
    
    switch (searchType) {
      case 'basic-search':
        searchMultiplier = 1.0;
        proxyRegions = ['US', 'CA', 'UK']; // Multiple regions for better success rate
        break;
      case 'sales-navigator':
        searchMultiplier = 1.5; // Premium searches cost more
        proxyRegions = ['US']; // Premium searches work best from US
        if (avgCostPerProspect > this.config.costPerProspectTarget * 2) {
          recommendations.push({
            type: 'cost_reduction',
            priority: 'high',
            title: 'Sales Navigator searches are expensive',
            description: `Current cost per prospect: $${avgCostPerProspect.toFixed(2)}`,
            action: 'Consider using basic search for initial prospecting, then Sales Navigator for top-tier prospects',
            estimated_savings: avgCostPerProspect * 0.4 * targetProspectCount
          });
        }
        break;
      case 'recruiter-search':
        searchMultiplier = 2.0; // Most expensive
        proxyRegions = ['US'];
        recommendations.push({
          type: 'budget_alert',
          priority: 'high',
          title: 'Recruiter searches have high cost',
          description: 'Recruiter searches are the most expensive option',
          action: 'Use sparingly and ensure high-quality targeting',
          estimated_savings: 0
        });
        break;
      case 'company-follower':
        searchMultiplier = 0.5; // Cheaper than individual searches
        break;
      case 'post-engagement':
      case 'group-search':
      case 'event-search':
        searchMultiplier = 0.3; // Most cost-effective
        recommendations.push({
          type: 'efficiency_gain',
          priority: 'medium',
          title: 'High-efficiency search type',
          description: 'This search type typically provides good quality prospects at low cost',
          action: 'Consider using this method more frequently',
          estimated_savings: 0
        });
        break;
    }
    
    const estimatedCostPerProspect = avgCostPerProspect * searchMultiplier;
    const estimatedTotalCost = estimatedCostPerProspect * actualTargetCount;
    
    // Calculate optimal batch size (to manage rate limits and errors)
    const optimalBatchSize = Math.min(50, Math.max(10, Math.floor(actualTargetCount / 3)));
    const searchBatches = Math.ceil(actualTargetCount / optimalBatchSize);
    
    // Generate budget recommendations
    const budgetUtilization = (analytics.cost_tracker.current_spend + estimatedTotalCost) / currentBudget;
    
    if (budgetUtilization > 0.9) {
      recommendations.push({
        type: 'budget_alert',
        priority: 'high',
        title: 'Approaching budget limit',
        description: `This search will use ${(budgetUtilization * 100).toFixed(1)}% of monthly budget`,
        action: 'Consider reducing target prospect count or waiting for next month',
        estimated_savings: 0
      });
    }
    
    // Quality vs cost recommendations
    if (estimatedCostPerProspect > this.config.costPerProspectTarget) {
      recommendations.push({
        type: 'quality_improvement',
        priority: 'medium',
        title: 'Cost per prospect above target',
        description: `Current: $${estimatedCostPerProspect.toFixed(2)}, Target: $${this.config.costPerProspectTarget.toFixed(2)}`,
        action: 'Use more specific search criteria to improve targeting',
        potential_quality_impact: 'Higher precision targeting may reduce quantity but improve quality'
      });
    }
    
    return {
      optimized_params: {
        max_results: actualTargetCount,
        proxy_regions: proxyRegions,
        search_batches: searchBatches,
        estimated_cost: estimatedTotalCost
      },
      recommendations
    };
  }
  
  /**
   * Implement intelligent retry logic with fallback strategies
   */
  static async executeWithRetry<T>(
    operation: () => Promise<T>,
    errorContext: { search_type: string; search_id: string }
  ): Promise<T> {
    let lastError: Error;
    let attempts = 0;
    
    while (attempts < this.config.maxRetries) {
      try {
        return await operation();
      } catch (error) {
        attempts++;
        lastError = error as Error;
        
        // Determine error type and strategy
        const errorType = this.classifyError(error as Error);
        const strategy = this.errorRecoveryStrategies.find(s => s.error_type === errorType);
        
        // Log error for analysis
        await this.logError(error as Error, errorContext, attempts);
        
        if (!strategy || strategy.retry_strategy === 'skip') {
          break;
        }
        
        if (attempts >= strategy.max_attempts) {
          break;
        }
        
        // Apply recovery strategy
        switch (strategy.retry_strategy) {
          case 'immediate':
            // No delay, retry immediately
            break;
          case 'backoff':
            const delay = Math.pow(this.config.backoffMultiplier, attempts) * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
            break;
          case 'fallback':
            await this.applyFallbackStrategy(strategy.fallback_method || '', errorContext);
            await new Promise(resolve => setTimeout(resolve, 2000));
            break;
        }
      }
    }
    
    throw lastError!;
  }
  
  /**
   * Classify error type for appropriate recovery strategy
   */
  private static classifyError(error: Error): string {
    const errorMessage = error.message.toLowerCase();
    
    if (errorMessage.includes('rate limit') || errorMessage.includes('too many requests')) {
      return 'rate_limit_exceeded';
    }
    if (errorMessage.includes('blocked') || errorMessage.includes('forbidden')) {
      return 'proxy_blocked';
    }
    if (errorMessage.includes('captcha') || errorMessage.includes('verification')) {
      return 'linkedin_captcha';
    }
    if (errorMessage.includes('timeout') || errorMessage.includes('network')) {
      return 'network_timeout';
    }
    if (errorMessage.includes('budget') || errorMessage.includes('quota')) {
      return 'budget_exceeded';
    }
    if (errorMessage.includes('unauthorized') || errorMessage.includes('credentials')) {
      return 'invalid_credentials';
    }
    
    return 'unknown_error';
  }
  
  /**
   * Apply fallback strategies for different error types
   */
  private static async applyFallbackStrategy(
    strategy: string,
    context: { search_type: string; search_id: string }
  ): Promise<void> {
    switch (strategy) {
      case 'different_proxy_region':
        // This would be handled by the Bright Data service
        console.log('Switching to different proxy region');
        break;
      case 'reduce_concurrency':
        // Reduce the number of concurrent requests
        console.log('Reducing request concurrency');
        break;
      case 'switch_search_method':
        console.log('Attempting alternative search method');
        break;
    }
  }
  
  /**
   * Log errors for analysis and improvement
   */
  private static async logError(
    error: Error,
    context: { search_type: string; search_id: string },
    attempt: number
  ): Promise<void> {
    try {
      await supabase.from('prospect_search_errors').insert({
        search_id: context.search_id,
        search_type: context.search_type,
        error_type: this.classifyError(error),
        error_message: error.message,
        attempt_number: attempt,
        stack_trace: error.stack,
        timestamp: new Date().toISOString()
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
  }
  
  /**
   * Analyze search performance and generate optimization recommendations
   */
  static async analyzeSearchPerformance(
    workspaceId: string,
    dateRange: { from: string; to: string }
  ): Promise<{
    performance_metrics: {
      total_searches: number;
      success_rate: number;
      average_cost_per_prospect: number;
      average_quality_score: number;
      total_prospects_found: number;
    };
    cost_analysis: {
      total_spent: number;
      budget_utilization: number;
      cost_trend: 'increasing' | 'decreasing' | 'stable';
      most_expensive_search_type: string;
      most_efficient_search_type: string;
    };
    recommendations: CostOptimizationRecommendation[];
  }> {
    try {
      // Get search history data
      const { data: searchHistory, error } = await supabase
        .from('search_history')
        .select(`
          *,
          search_configuration:search_configurations(search_type, search_method)
        `)
        .eq('workspace_id', workspaceId)
        .gte('started_at', dateRange.from)
        .lte('started_at', dateRange.to);
      
      if (error) throw error;
      
      const totalSearches = searchHistory.length;
      const successfulSearches = searchHistory.filter(h => h.status === 'completed').length;
      const successRate = totalSearches > 0 ? successfulSearches / totalSearches : 0;
      
      let totalCost = 0;
      let totalProspects = 0;
      const searchTypeCosts: Record<string, { cost: number; prospects: number; count: number }> = {};
      
      searchHistory.forEach(search => {
        const cost = search.bright_data_usage?.estimated_cost || 0;
        const prospects = search.results_found || 0;
        const searchType = search.search_configuration?.search_type || 'unknown';
        
        totalCost += cost;
        totalProspects += prospects;
        
        if (!searchTypeCosts[searchType]) {
          searchTypeCosts[searchType] = { cost: 0, prospects: 0, count: 0 };
        }
        
        searchTypeCosts[searchType].cost += cost;
        searchTypeCosts[searchType].prospects += prospects;
        searchTypeCosts[searchType].count += 1;
      });
      
      const avgCostPerProspect = totalProspects > 0 ? totalCost / totalProspects : 0;
      
      // Find most expensive and most efficient search types
      let mostExpensive = { type: '', costPerProspect: 0 };
      let mostEfficient = { type: '', costPerProspect: Infinity };
      
      Object.entries(searchTypeCosts).forEach(([type, data]) => {
        if (data.prospects > 0) {
          const costPerProspect = data.cost / data.prospects;
          if (costPerProspect > mostExpensive.costPerProspect) {\n            mostExpensive = { type, costPerProspect };\n          }\n          if (costPerProspect < mostEfficient.costPerProspect) {\n            mostEfficient = { type, costPerProspect };\n          }\n        }\n      });\n      \n      // Generate recommendations\n      const recommendations: CostOptimizationRecommendation[] = [];\n      \n      if (successRate < 0.8) {\n        recommendations.push({\n          type: 'quality_improvement',\n          priority: 'high',\n          title: 'Low search success rate',\n          description: `Only ${(successRate * 100).toFixed(1)}% of searches completed successfully`,\n          action: 'Review error logs and optimize search parameters'\n        });\n      }\n      \n      if (avgCostPerProspect > this.config.costPerProspectTarget) {\n        recommendations.push({\n          type: 'cost_reduction',\n          priority: 'medium',\n          title: 'Cost per prospect above target',\n          description: `Current: $${avgCostPerProspect.toFixed(2)}, Target: $${this.config.costPerProspectTarget.toFixed(2)}`,\n          action: `Consider using ${mostEfficient.type} search type more frequently`,\n          estimated_savings: (avgCostPerProspect - this.config.costPerProspectTarget) * totalProspects\n        });\n      }\n      \n      if (mostExpensive.type && mostExpensive.costPerProspect > mostEfficient.costPerProspect * 2) {\n        recommendations.push({\n          type: 'efficiency_gain',\n          priority: 'medium',\n          title: 'Significant cost variation between search types',\n          description: `${mostExpensive.type} costs ${mostExpensive.costPerProspect.toFixed(2)} per prospect vs ${mostEfficient.costPerProspect.toFixed(2)} for ${mostEfficient.type}`,\n          action: `Consider replacing some ${mostExpensive.type} searches with ${mostEfficient.type}`,\n          estimated_savings: (mostExpensive.costPerProspect - mostEfficient.costPerProspect) * searchTypeCosts[mostExpensive.type].prospects * 0.5\n        });\n      }\n      \n      return {\n        performance_metrics: {\n          total_searches: totalSearches,\n          success_rate: successRate,\n          average_cost_per_prospect: avgCostPerProspect,\n          average_quality_score: 0.75, // This would come from actual quality scoring\n          total_prospects_found: totalProspects\n        },\n        cost_analysis: {\n          total_spent: totalCost,\n          budget_utilization: totalCost / this.config.maxBudget,\n          cost_trend: 'stable', // This would be calculated from historical data\n          most_expensive_search_type: mostExpensive.type,\n          most_efficient_search_type: mostEfficient.type\n        },\n        recommendations\n      };\n    } catch (error) {\n      console.error('Error analyzing search performance:', error);\n      throw error;\n    }\n  }\n  \n  /**\n   * Update optimization configuration\n   */\n  static updateConfig(newConfig: Partial<SearchOptimizationConfig>): void {\n    this.config = { ...this.config, ...newConfig };\n  }\n  \n  /**\n   * Get current optimization configuration\n   */\n  static getConfig(): SearchOptimizationConfig {\n    return { ...this.config };\n  }\n}