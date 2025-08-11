// Search Preview and Analytics Component
// Provides search URL parsing, preview, and optimization recommendations

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  BarChart3,
  TrendingUp,
  Users,
  Target,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  RefreshCw,
  Lightbulb,
  Zap,
  Globe,
  Building2,
  MapPin,
  Star,
  Info
} from 'lucide-react';
import { 
  LinkedInUrlGenerator,
  linkedInUrlUtils,
  ParsedLinkedInUrl,
  LinkedInSearchParams
} from '@/services/linkedin-url-generator';
import { toast } from 'sonner';

interface SearchPreviewAnalyticsProps {
  searchUrl?: string;
  onUrlChange?: (url: string) => void;
  showVariations?: boolean;
  showOptimization?: boolean;
  className?: string;
}

interface SearchAnalytics {
  difficulty: 'easy' | 'medium' | 'hard';
  competitiveness: number;
  estimatedCost: number;
  recommendedBudget: number;
  targetAudience: string[];
  optimizationScore: number;
  suggestions: string[];
  warnings: string[];
}

interface SearchVariation {
  id: string;
  name: string;
  description: string;
  url: string;
  estimatedResults: number;
  difficulty: 'easy' | 'medium' | 'hard';
  params: LinkedInSearchParams;
}

export function SearchPreviewAnalytics({
  searchUrl = '',
  onUrlChange,
  showVariations = true,
  showOptimization = true,
  className
}: SearchPreviewAnalyticsProps) {
  const [inputUrl, setInputUrl] = useState(searchUrl);
  const [parsedUrl, setParsedUrl] = useState<ParsedLinkedInUrl | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analytics, setAnalytics] = useState<SearchAnalytics | null>(null);
  const [searchVariations, setSearchVariations] = useState<SearchVariation[]>([]);

  // Parse URL whenever it changes
  useEffect(() => {
    if (inputUrl && linkedInUrlUtils.isValidLinkedInUrl(inputUrl)) {
      setIsAnalyzing(true);
      
      const parsed = LinkedInUrlGenerator.parseLinkedInUrl(inputUrl);
      setParsedUrl(parsed);
      
      // Generate analytics
      generateAnalytics(parsed);
      
      // Generate variations
      if (parsed.isValid && showVariations) {
        generateVariations(parsed);
      }
      
      setIsAnalyzing(false);
    } else {
      setParsedUrl(null);
      setAnalytics(null);
      setSearchVariations([]);
    }
  }, [inputUrl, showVariations]);

  // Generate analytics based on parsed URL
  const generateAnalytics = (parsed: ParsedLinkedInUrl) => {
    if (!parsed.isValid) {
      setAnalytics(null);
      return;
    }

    const params = parsed.parameters;
    const suggestions: string[] = [];
    const warnings: string[] = [];
    
    // Calculate difficulty based on search constraints
    let difficulty: 'easy' | 'medium' | 'hard' = 'easy';
    let competitiveness = 30;
    
    if (params.title || params.company || params.seniorityLevel?.length) {
      difficulty = 'medium';
      competitiveness = 60;
    }
    
    if ((params.title && params.company) || params.excludedKeywords?.length || params.connectionOf) {
      difficulty = 'hard';
      competitiveness = 85;
    }

    // Optimization score calculation
    let optimizationScore = 50;
    
    if (params.keywords) optimizationScore += 15;
    if (params.location) optimizationScore += 10;
    if (params.industryUrns?.length) optimizationScore += 10;
    if (params.companySize?.length) optimizationScore += 10;
    if (params.seniorityLevel?.length) optimizationScore += 5;
    
    // Generate suggestions
    if (!params.location) {
      suggestions.push('Add location filters to improve targeting');
    }
    
    if (!params.industryUrns?.length) {
      suggestions.push('Specify industry to increase relevance');
    }
    
    if (params.keywords && params.keywords.length > 50) {
      warnings.push('Long keyword searches may return limited results');
    }
    
    if (!params.companySize?.length) {
      suggestions.push('Filter by company size for better prospect quality');
    }

    // Estimated costs (example ranges)
    const estimatedCost = difficulty === 'easy' ? 25 : difficulty === 'medium' ? 50 : 100;
    const recommendedBudget = estimatedCost * 10; // 10x for full campaign

    // Target audience analysis
    const targetAudience: string[] = [];
    if (params.title) targetAudience.push(`${params.title} professionals`);
    if (params.industryUrns?.length) targetAudience.push(`${params.industryUrns.join(', ')} industry`);
    if (params.location) targetAudience.push(`Located in ${params.location}`);
    if (params.companySize?.length) targetAudience.push(`Companies: ${params.companySize.join(', ')} employees`);

    setAnalytics({
      difficulty,
      competitiveness,
      estimatedCost,
      recommendedBudget,
      targetAudience,
      optimizationScore: Math.min(100, optimizationScore),
      suggestions,
      warnings
    });
  };

  // Generate search variations
  const generateVariations = (parsed: ParsedLinkedInUrl) => {
    if (!parsed.isValid || !parsed.parameters) return;

    const baseParams = parsed.parameters as LinkedInSearchParams;
    const variations: SearchVariation[] = [];

    try {
      // Generate broader search
      const broaderParams = { ...baseParams };
      if (broaderParams.title) {
        // Make title search broader
        broaderParams.title = broaderParams.title.split(' OR ')[0]; // Take first part
      }
      if (broaderParams.companySize?.length && broaderParams.companySize.length > 1) {
        broaderParams.companySize = broaderParams.companySize.slice(0, -1); // Remove strictest filter
      }

      const broaderUrl = LinkedInUrlGenerator.generateBasicSearchUrl(broaderParams);
      if (broaderUrl.isValid) {
        variations.push({
          id: 'broader',
          name: 'Broader Search',
          description: 'Expanded criteria for more results',
          url: broaderUrl.url,
          estimatedResults: broaderUrl.estimatedResults || 0,
          difficulty: 'easy',
          params: broaderParams
        });
      }

      // Generate more targeted search
      const targetedParams = { ...baseParams };
      if (!targetedParams.seniorityLevel?.length) {
        targetedParams.seniorityLevel = ['director', 'executive'];
      }
      if (!targetedParams.companySize?.length) {
        targetedParams.companySize = ['501-1000', '1001-5000', '5001-10000'];
      }

      const targetedUrl = LinkedInUrlGenerator.generateBasicSearchUrl(targetedParams);
      if (targetedUrl.isValid) {
        variations.push({
          id: 'targeted',
          name: 'More Targeted',
          description: 'Refined criteria for quality leads',
          url: targetedUrl.url,
          estimatedResults: targetedUrl.estimatedResults || 0,
          difficulty: 'hard',
          params: targetedParams
        });
      }

      // Generate location variation
      if (baseParams.location && !baseParams.location.includes('United States')) {
        const locationParams = { 
          ...baseParams, 
          location: baseParams.location.includes(',') 
            ? baseParams.location 
            : `${baseParams.location}, United States`
        };
        
        const locationUrl = LinkedInUrlGenerator.generateBasicSearchUrl(locationParams);
        if (locationUrl.isValid) {
          variations.push({
            id: 'location-expanded',
            name: 'Location Expanded',
            description: 'Include broader geographic area',
            url: locationUrl.url,
            estimatedResults: locationUrl.estimatedResults || 0,
            difficulty: 'medium',
            params: locationParams
          });
        }
      }

      setSearchVariations(variations);
    } catch (error) {
      console.error('Error generating variations:', error);
      setSearchVariations([]);
    }
  };

  // Handle URL input change
  const handleUrlChange = (newUrl: string) => {
    setInputUrl(newUrl);
    if (onUrlChange) {
      onUrlChange(newUrl);
    }
  };

  // Validate and preview URL
  const validateUrl = () => {
    const validation = linkedInUrlUtils.validateSearchUrl(inputUrl);
    if (validation.isValid) {
      toast.success('URL is valid and ready for search');
    } else {
      toast.error(`Invalid URL: ${validation.errors.join(', ')}`);
    }
  };

  // Get difficulty color
  const getDifficultyColor = (difficulty: 'easy' | 'medium' | 'hard') => {
    switch (difficulty) {
      case 'easy': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'hard': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  // Get difficulty badge variant
  const getDifficultyVariant = (difficulty: 'easy' | 'medium' | 'hard') => {
    switch (difficulty) {
      case 'easy': return 'default';
      case 'medium': return 'secondary';
      case 'hard': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* URL Input */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">LinkedIn Search URL Analysis</CardTitle>
          <CardDescription className="text-xs">
            Paste a LinkedIn search URL to analyze targeting and generate variations
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          <div>
            <Label htmlFor="search-url" className="text-sm">Search URL</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="search-url"
                value={inputUrl}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="https://www.linkedin.com/search/results/people/..."
                className="flex-1"
              />
              <Button size="sm" variant="outline" onClick={validateUrl}>
                {isAnalyzing ? <RefreshCw className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
              </Button>
            </div>
          </div>

          {/* URL Status */}
          {inputUrl && (
            <div className="flex items-center gap-2 text-sm">
              <Badge variant={parsedUrl?.isValid ? "default" : "destructive"} className="text-xs">
                {parsedUrl?.isValid ? 'Valid URL' : 'Invalid URL'}
              </Badge>
              {parsedUrl?.searchType && (
                <Badge variant="outline" className="text-xs capitalize">
                  {parsedUrl.searchType.replace('-', ' ')}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search Analytics */}
      {analytics && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Search Analytics
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded">
                <div className="text-lg font-bold">{analytics.optimizationScore}%</div>
                <div className="text-xs text-gray-600">Optimization Score</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded">
                <div className={`text-lg font-bold capitalize ${getDifficultyColor(analytics.difficulty)}`}>
                  {analytics.difficulty}
                </div>
                <div className="text-xs text-gray-600">Difficulty</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded">
                <div className="text-lg font-bold">{analytics.competitiveness}%</div>
                <div className="text-xs text-gray-600">Competitiveness</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded">
                <div className="text-lg font-bold">${analytics.estimatedCost}</div>
                <div className="text-xs text-gray-600">Est. Cost</div>
              </div>
            </div>

            {/* Optimization Score Progress */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Optimization Score</span>
                <span className="text-sm text-gray-600">{analytics.optimizationScore}%</span>
              </div>
              <Progress value={analytics.optimizationScore} className="h-2" />
              <p className="text-xs text-gray-500 mt-1">
                {analytics.optimizationScore >= 80 ? 'Excellent targeting' :
                 analytics.optimizationScore >= 60 ? 'Good targeting, room for improvement' :
                 'Consider adding more specific filters'}
              </p>
            </div>

            {/* Target Audience */}
            {analytics.targetAudience.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  Target Audience
                </h4>
                <div className="flex flex-wrap gap-1">
                  {analytics.targetAudience.map((audience, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {audience}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Optimization Recommendations */}
      {showOptimization && analytics && (analytics.suggestions.length > 0 || analytics.warnings.length > 0) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Optimization Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            {analytics.suggestions.map((suggestion, index) => (
              <Alert key={`suggestion-${index}`}>
                <Zap className="h-4 w-4" />
                <AlertDescription className="text-sm">{suggestion}</AlertDescription>
              </Alert>
            ))}
            {analytics.warnings.map((warning, index) => (
              <Alert key={`warning-${index}`} className="border-amber-200 bg-amber-50">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-sm text-amber-800">{warning}</AlertDescription>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Search Variations */}
      {showVariations && searchVariations.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              Search Variations
            </CardTitle>
            <CardDescription className="text-xs">
              Alternative search configurations to try
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            {searchVariations.map(variation => (
              <div key={variation.id} className="p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      {variation.name}
                      <Badge variant={getDifficultyVariant(variation.difficulty)} className="text-xs">
                        {variation.difficulty}
                      </Badge>
                    </h4>
                    <p className="text-xs text-gray-600 mt-1">{variation.description}</p>
                  </div>
                  <div className="text-right text-xs text-gray-500">
                    ~{variation.estimatedResults.toLocaleString()} results
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mt-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleUrlChange(variation.url)}
                    className="text-xs"
                  >
                    Use This Search
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => window.open(variation.url, '_blank')}
                    className="text-xs"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Preview
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Parsed URL Details */}
      {parsedUrl?.isValid && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Info className="h-4 w-4" />
              URL Parameters
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {Object.entries(parsedUrl.parameters).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                  <span className="font-medium text-right">
                    {Array.isArray(value) ? value.join(', ') : value?.toString() || 'N/A'}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}