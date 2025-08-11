// Search Recommendation Engine
// Provides AI-powered search optimization and recommendations

import { LinkedInSearchParams, SearchUrlResult } from './linkedin-url-generator';
import { SearchConfiguration, SearchType } from '@/types/prospect-search';

export interface SearchRecommendation {
  id: string;
  type: 'optimization' | 'expansion' | 'narrowing' | 'alternative';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: string;
  implementationSteps: string[];
  estimatedImprovement: number; // percentage
  category: 'targeting' | 'volume' | 'quality' | 'cost' | 'performance';
  params?: Partial<LinkedInSearchParams>;
  url?: string;
}

export interface SearchAnalytics {
  score: number;
  difficulty: 'easy' | 'medium' | 'hard';
  competitiveness: number;
  expectedResults: number;
  qualityScore: number;
  costEfficiency: number;
  recommendations: SearchRecommendation[];
  benchmarks: {
    industryAverage: number;
    topPerformers: number;
    yourHistorical: number;
  };
  predictedOutcomes: {
    responseRate: number;
    qualifiedLeads: number;
    estimatedCost: number;
    timeToComplete: number;
  };
}

export interface BenchmarkData {
  searchType: SearchType;
  averageResults: number;
  averageResponseRate: number;
  averageCostPerLead: number;
  successFactors: string[];
  commonPitfalls: string[];
}

export class SearchRecommendationEngine {
  private static readonly BENCHMARK_DATA: Record<SearchType, BenchmarkData> = {
    'basic-search': {
      searchType: 'basic-search',
      averageResults: 300,
      averageResponseRate: 0.05,
      averageCostPerLead: 15,
      successFactors: ['Specific job titles', 'Geographic targeting', 'Industry focus'],
      commonPitfalls: ['Too broad keywords', 'No location filter', 'Generic messaging']
    },
    'sales-navigator': {
      searchType: 'sales-navigator',
      averageResults: 150,
      averageResponseRate: 0.08,
      averageCostPerLead: 25,
      successFactors: ['Seniority targeting', 'Company size filters', 'Connection insights'],
      commonPitfalls: ['Over-filtering', 'Ignoring company growth', 'Poor timing']
    },
    'recruiter-search': {
      searchType: 'recruiter-search',
      averageResults: 500,
      averageResponseRate: 0.12,
      averageCostPerLead: 35,
      successFactors: ['Skills matching', 'Experience levels', 'Open to opportunities'],
      commonPitfalls: ['Skill keyword spam', 'Ignoring soft skills', 'Location mismatches']
    },
    'company-follower': {
      searchType: 'company-follower',
      averageResults: 200,
      averageResponseRate: 0.06,
      averageCostPerLead: 20,
      successFactors: ['Relevant company choice', 'Employee targeting', 'Brand alignment'],
      commonPitfalls: ['Competitor followers', 'Inactive followers', 'Generic approach']
    },
    'post-engagement': {
      searchType: 'post-engagement',
      averageResults: 100,
      averageResponseRate: 0.10,
      averageCostPerLead: 18,
      successFactors: ['Recent engagement', 'Relevant content', 'Engagement type'],
      commonPitfalls: ['Old posts', 'Irrelevant content', 'Mass outreach']
    },
    'group-search': {
      searchType: 'group-search',
      averageResults: 400,
      averageResponseRate: 0.07,
      averageCostPerLead: 22,
      successFactors: ['Active groups', 'Professional relevance', 'Regular participation'],
      commonPitfalls: ['Inactive groups', 'Off-topic groups', 'Immediate selling']
    },
    'event-search': {
      searchType: 'event-search',
      averageResults: 80,
      averageResponseRate: 0.15,
      averageCostPerLead: 30,
      successFactors: ['Recent events', 'Industry relevance', 'Attendee engagement'],
      commonPitfalls: ['Old events', 'Generic events', 'Poor timing']
    },
    'people-you-know': {
      searchType: 'people-you-know',
      averageResults: 50,
      averageResponseRate: 0.20,
      averageCostPerLead: 12,
      successFactors: ['Mutual connections', 'Warm introductions', 'Network relevance'],
      commonPitfalls: ['Cold connections', 'Irrelevant suggestions', 'No context']
    },
    'csv-import': {
      searchType: 'csv-import',
      averageResults: 0, // Variable
      averageResponseRate: 0.03,
      averageCostPerLead: 10,
      successFactors: ['Data quality', 'Recent data', 'Verified contacts'],
      commonPitfalls: ['Outdated data', 'Generic lists', 'Poor segmentation']
    }
  };

  static analyzeSearch(
    params: LinkedInSearchParams,
    searchType: SearchType,
    historicalData?: SearchConfiguration[]
  ): SearchAnalytics {
    const benchmark = this.BENCHMARK_DATA[searchType];
    const recommendations: SearchRecommendation[] = [];

    // Calculate base scores
    let targetingScore = this.calculateTargetingScore(params);
    let volumeScore = this.calculateVolumeScore(params, searchType);
    let qualityScore = this.calculateQualityScore(params, searchType);
    let costScore = this.calculateCostScore(params, searchType);

    // Overall score calculation
    const score = Math.round((targetingScore + volumeScore + qualityScore + costScore) / 4);

    // Generate recommendations
    recommendations.push(...this.generateTargetingRecommendations(params, targetingScore));
    recommendations.push(...this.generateVolumeRecommendations(params, volumeScore, searchType));
    recommendations.push(...this.generateQualityRecommendations(params, qualityScore));
    recommendations.push(...this.generateCostRecommendations(params, costScore));

    // Calculate difficulty and competitiveness
    const difficulty = this.calculateDifficulty(params);
    const competitiveness = this.calculateCompetitiveness(params, searchType);

    // Predict outcomes
    const predictedOutcomes = this.predictOutcomes(params, searchType, benchmark);

    // Calculate benchmarks
    const benchmarks = this.calculateBenchmarks(historicalData, benchmark);

    return {
      score,
      difficulty,
      competitiveness,
      expectedResults: predictedOutcomes.expectedResults,
      qualityScore,
      costEfficiency: costScore,
      recommendations: recommendations.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }),
      benchmarks,
      predictedOutcomes: {
        responseRate: predictedOutcomes.responseRate,
        qualifiedLeads: Math.round(predictedOutcomes.expectedResults * predictedOutcomes.responseRate * 0.3),
        estimatedCost: predictedOutcomes.estimatedCost,
        timeToComplete: predictedOutcomes.timeToComplete
      }
    };
  }

  private static calculateTargetingScore(params: LinkedInSearchParams): number {
    let score = 40; // Base score

    // Add points for specific targeting
    if (params.title) score += 15;
    if (params.location) score += 10;
    if (params.industryUrns?.length) score += 10;
    if (params.companySize?.length) score += 8;
    if (params.seniorityLevel?.length) score += 7;
    if (params.functionAreas?.length) score += 5;
    if (params.yearsOfExperience?.length) score += 5;

    // Deduct points for over-targeting
    const totalFilters = [
      params.title,
      params.location,
      params.industryUrns?.length,
      params.companySize?.length,
      params.seniorityLevel?.length,
      params.functionAreas?.length,
      params.yearsOfExperience?.length
    ].filter(Boolean).length;

    if (totalFilters > 6) score -= 10; // Too many filters

    return Math.min(100, Math.max(0, score));
  }

  private static calculateVolumeScore(params: LinkedInSearchParams, searchType: SearchType): number {
    const benchmark = this.BENCHMARK_DATA[searchType];
    let score = 50; // Base score

    // Adjust based on search type potential
    switch (searchType) {
      case 'basic-search':
        score += params.keywords && !params.title ? 15 : 0;
        break;
      case 'recruiter-search':
        score += 20; // Generally higher volume
        break;
      case 'sales-navigator':
        score += params.seniorityLevel?.length ? 10 : -10;
        break;
      case 'company-follower':
        score += 15; // Usually good volume
        break;
    }

    // Adjust for filtering intensity
    const filterCount = [
      params.title,
      params.location,
      params.company,
      params.industryUrns?.length,
      params.companySize?.length
    ].filter(Boolean).length;

    if (filterCount < 2) score += 20; // Broader search
    if (filterCount > 4) score -= 15; // Too narrow

    return Math.min(100, Math.max(0, score));
  }

  private static calculateQualityScore(params: LinkedInSearchParams, searchType: SearchType): number {
    let score = 50; // Base score

    // Quality indicators
    if (params.title) score += 20; // Job title increases relevance
    if (params.seniorityLevel?.length) score += 15; // Seniority filtering
    if (params.industryUrns?.length) score += 10; // Industry relevance
    if (params.companySize?.length) score += 10; // Company size targeting
    if (params.excludedKeywords?.length) score += 5; // Negative filtering

    // Premium features boost quality
    if (searchType === 'sales-navigator' || searchType === 'recruiter-search') {
      score += 10;
    }

    // Deduct for overly broad searches
    if (!params.title && !params.industryUrns?.length && !params.location) {
      score -= 20;
    }

    return Math.min(100, Math.max(0, score));
  }

  private static calculateCostScore(params: LinkedInSearchParams, searchType: SearchType): number {
    const benchmark = this.BENCHMARK_DATA[searchType];
    let score = 70; // Base score (cost-effective)

    // Adjust based on search type costs
    switch (searchType) {
      case 'basic-search':
        score += 20; // Most cost-effective
        break;
      case 'sales-navigator':
        score -= 10; // Premium costs
        break;
      case 'recruiter-search':
        score -= 15; // Highest costs
        break;
      case 'people-you-know':
        score += 15; // Very cost-effective
        break;
    }

    // Efficient targeting improves cost score
    if (params.title && params.location) score += 10;
    if (params.companySize?.length === 1) score += 5; // Focused targeting

    // Over-filtering can increase costs per result
    const filterCount = [
      params.title,
      params.location,
      params.company,
      params.industryUrns?.length,
      params.companySize?.length,
      params.seniorityLevel?.length
    ].filter(Boolean).length;

    if (filterCount > 5) score -= 10;

    return Math.min(100, Math.max(0, score));
  }

  private static calculateDifficulty(params: LinkedInSearchParams): 'easy' | 'medium' | 'hard' {
    let difficultyPoints = 0;

    // Add difficulty points
    if (params.title && params.company) difficultyPoints += 3;
    if (params.seniorityLevel?.includes('executive') || params.seniorityLevel?.includes('director')) difficultyPoints += 2;
    if (params.excludedKeywords?.length) difficultyPoints += 1;
    if (params.connectionOf) difficultyPoints += 2;
    if (params.companySize?.length === 1 && params.companySize[0].includes('10000+')) difficultyPoints += 1;

    if (difficultyPoints >= 5) return 'hard';
    if (difficultyPoints >= 2) return 'medium';
    return 'easy';
  }

  private static calculateCompetitiveness(params: LinkedInSearchParams, searchType: SearchType): number {
    let competitiveness = 30; // Base competitiveness

    // High-competition indicators
    if (params.title?.toLowerCase().includes('ceo') || params.title?.toLowerCase().includes('founder')) {
      competitiveness += 40;
    }
    if (params.title?.toLowerCase().includes('vp') || params.title?.toLowerCase().includes('director')) {
      competitiveness += 30;
    }
    if (params.industryUrns?.includes('technology') || params.industryUrns?.includes('software')) {
      competitiveness += 20;
    }
    if (params.location?.includes('San Francisco') || params.location?.includes('New York')) {
      competitiveness += 15;
    }

    // Premium search types are more competitive
    if (searchType === 'sales-navigator' || searchType === 'recruiter-search') {
      competitiveness += 10;
    }

    return Math.min(100, competitiveness);
  }

  private static predictOutcomes(
    params: LinkedInSearchParams,
    searchType: SearchType,
    benchmark: BenchmarkData
  ) {
    const baseResults = benchmark.averageResults;
    const baseResponseRate = benchmark.averageResponseRate;
    const baseCost = benchmark.averageCostPerLead;

    // Adjust based on targeting specificity
    let resultsMultiplier = 1;
    let responseMultiplier = 1;
    let costMultiplier = 1;

    // More specific searches = fewer but higher quality results
    const specificityScore = [
      params.title,
      params.location,
      params.industryUrns?.length,
      params.companySize?.length,
      params.seniorityLevel?.length
    ].filter(Boolean).length;

    if (specificityScore >= 4) {
      resultsMultiplier = 0.6;
      responseMultiplier = 1.4;
      costMultiplier = 1.2;
    } else if (specificityScore >= 2) {
      resultsMultiplier = 0.8;
      responseMultiplier = 1.2;
      costMultiplier = 1.1;
    } else {
      resultsMultiplier = 1.3;
      responseMultiplier = 0.8;
      costMultiplier = 0.9;
    }

    return {
      expectedResults: Math.round(baseResults * resultsMultiplier),
      responseRate: Math.min(0.25, baseResponseRate * responseMultiplier),
      estimatedCost: Math.round(baseCost * costMultiplier),
      timeToComplete: Math.ceil((baseResults * resultsMultiplier) / 50) // Assume 50 prospects per day
    };
  }

  private static calculateBenchmarks(
    historicalData?: SearchConfiguration[],
    benchmark?: BenchmarkData
  ) {
    let yourHistorical = 50; // Default

    if (historicalData?.length) {
      const avgResults = historicalData.reduce((sum, config) => sum + config.results_count, 0) / historicalData.length;
      yourHistorical = Math.round((avgResults / (benchmark?.averageResults || 100)) * 100);
    }

    return {
      industryAverage: 65,
      topPerformers: 85,
      yourHistorical: Math.min(100, Math.max(20, yourHistorical))
    };
  }

  private static generateTargetingRecommendations(
    params: LinkedInSearchParams,
    currentScore: number
  ): SearchRecommendation[] {
    const recommendations: SearchRecommendation[] = [];

    if (!params.location && currentScore < 70) {
      recommendations.push({
        id: 'add-location',
        type: 'optimization',
        priority: 'high',
        title: 'Add Location Targeting',
        description: 'Specify geographic location to improve search relevance and response rates.',
        impact: 'Increases response rate by 15-20%',
        implementationSteps: [
          'Add specific city, state, or region',
          'Consider nearby metropolitan areas',
          'Test regional vs city-specific targeting'
        ],
        estimatedImprovement: 18,
        category: 'targeting',
        params: { location: 'San Francisco Bay Area' }
      });
    }

    if (!params.industryUrns?.length && currentScore < 75) {
      recommendations.push({
        id: 'add-industry',
        type: 'optimization',
        priority: 'medium',
        title: 'Specify Industry Focus',
        description: 'Add industry filters to target prospects in relevant sectors.',
        impact: 'Improves lead quality by 12-15%',
        implementationSteps: [
          'Select 2-3 relevant industries',
          'Focus on your ideal customer profile',
          'Avoid over-filtering with too many industries'
        ],
        estimatedImprovement: 13,
        category: 'targeting'
      });
    }

    if (!params.seniorityLevel?.length && params.title && currentScore < 80) {
      recommendations.push({
        id: 'add-seniority',
        type: 'optimization',
        priority: 'medium',
        title: 'Add Seniority Level Filters',
        description: 'Target specific seniority levels to match your ideal buyer persona.',
        impact: 'Increases conversion rate by 10-12%',
        implementationSteps: [
          'Identify decision-maker levels',
          'Focus on 2-3 relevant seniority levels',
          'Align with your sales process'
        ],
        estimatedImprovement: 11,
        category: 'targeting'
      });
    }

    return recommendations;
  }

  private static generateVolumeRecommendations(
    params: LinkedInSearchParams,
    currentScore: number,
    searchType: SearchType
  ): SearchRecommendation[] {
    const recommendations: SearchRecommendation[] = [];

    // Check if search is too narrow
    const filterCount = [
      params.title,
      params.location,
      params.company,
      params.industryUrns?.length,
      params.companySize?.length,
      params.seniorityLevel?.length
    ].filter(Boolean).length;

    if (filterCount > 4 && currentScore < 60) {
      recommendations.push({
        id: 'broaden-search',
        type: 'expansion',
        priority: 'high',
        title: 'Broaden Search Criteria',
        description: 'Your search may be too narrow. Consider removing some filters to increase volume.',
        impact: 'Could increase results by 40-60%',
        implementationSteps: [
          'Remove least important filter',
          'Expand location to include nearby areas',
          'Add similar job titles with OR operators'
        ],
        estimatedImprovement: 50,
        category: 'volume'
      });
    }

    // Suggest boolean operators for title searches
    if (params.title && !params.title.includes(' OR ') && currentScore < 70) {
      recommendations.push({
        id: 'use-boolean-operators',
        type: 'optimization',
        priority: 'medium',
        title: 'Use Boolean Operators',
        description: 'Add similar job titles using OR operators to increase search volume.',
        impact: 'Increases results by 25-35%',
        implementationSteps: [
          'Add similar titles: "CEO OR Founder OR President"',
          'Include common variations',
          'Test different combinations'
        ],
        estimatedImprovement: 30,
        category: 'volume',
        params: { 
          title: params.title + ' OR ' + this.getSimilarTitles(params.title).join(' OR ')
        }
      });
    }

    return recommendations;
  }

  private static generateQualityRecommendations(
    params: LinkedInSearchParams,
    currentScore: number
  ): SearchRecommendation[] {
    const recommendations: SearchRecommendation[] = [];

    if (!params.excludedKeywords?.length && currentScore < 75) {
      recommendations.push({
        id: 'add-exclusions',
        type: 'optimization',
        priority: 'medium',
        title: 'Add Exclusion Keywords',
        description: 'Exclude irrelevant prospects to improve lead quality.',
        impact: 'Improves lead quality by 15-20%',
        implementationSteps: [
          'Add "NOT student" to exclude students',
          'Exclude competitors or irrelevant companies',
          'Filter out job seekers if not relevant'
        ],
        estimatedImprovement: 17,
        category: 'quality'
      });
    }

    if (params.keywords && params.keywords.length > 50) {
      recommendations.push({
        id: 'simplify-keywords',
        type: 'optimization',
        priority: 'medium',
        title: 'Simplify Keyword Search',
        description: 'Long keyword strings may reduce search effectiveness.',
        impact: 'Improves search accuracy by 10-15%',
        implementationSteps: [
          'Focus on 3-5 key terms',
          'Use most important keywords only',
          'Test different keyword combinations'
        ],
        estimatedImprovement: 12,
        category: 'quality'
      });
    }

    return recommendations;
  }

  private static generateCostRecommendations(
    params: LinkedInSearchParams,
    currentScore: number
  ): SearchRecommendation[] {
    const recommendations: SearchRecommendation[] = [];

    if (currentScore < 60) {
      recommendations.push({
        id: 'improve-cost-efficiency',
        type: 'optimization',
        priority: 'low',
        title: 'Optimize Cost Efficiency',
        description: 'Adjust targeting to reduce cost per qualified lead.',
        impact: 'Reduces cost per lead by 10-20%',
        implementationSteps: [
          'Focus on high-converting demographics',
          'Avoid over-competitive segments',
          'Test different targeting combinations'
        ],
        estimatedImprovement: 15,
        category: 'cost'
      });
    }

    return recommendations;
  }

  private static getSimilarTitles(title: string): string[] {
    const titleMap: Record<string, string[]> = {
      'CEO': ['Chief Executive Officer', 'President', 'Founder'],
      'CTO': ['Chief Technology Officer', 'VP Engineering', 'Head of Technology'],
      'CMO': ['Chief Marketing Officer', 'VP Marketing', 'Head of Marketing'],
      'CFO': ['Chief Financial Officer', 'VP Finance', 'Head of Finance'],
      'VP': ['Vice President', 'Director', 'Head of'],
      'Manager': ['Director', 'Lead', 'Head of'],
      'Developer': ['Engineer', 'Programmer', 'Software Developer'],
      'Designer': ['UX Designer', 'UI Designer', 'Product Designer']
    };

    const lowerTitle = title.toLowerCase();
    for (const [key, values] of Object.entries(titleMap)) {
      if (lowerTitle.includes(key.toLowerCase())) {
        return values;
      }
    }

    return [];
  }

  static generateSearchVariations(params: LinkedInSearchParams): LinkedInSearchParams[] {
    const variations: LinkedInSearchParams[] = [];

    // Broader variation
    const broader = { ...params };
    if (broader.companySize?.length && broader.companySize.length > 1) {
      broader.companySize = broader.companySize.slice(0, -1);
    }
    if (broader.seniorityLevel?.length && broader.seniorityLevel.length > 1) {
      broader.seniorityLevel = broader.seniorityLevel.slice(0, -1);
    }
    variations.push(broader);

    // Location expansion
    if (params.location && !params.location.includes('United States')) {
      variations.push({
        ...params,
        location: `${params.location}, United States`
      });
    }

    // Title variations
    if (params.title) {
      const similarTitles = this.getSimilarTitles(params.title);
      if (similarTitles.length > 0) {
        variations.push({
          ...params,
          title: `${params.title} OR ${similarTitles[0]}`
        });
      }
    }

    return variations;
  }
}