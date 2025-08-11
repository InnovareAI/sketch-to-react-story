// Advanced Search Configuration Builder Component
// Provides comprehensive UI for building LinkedIn search parameters

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings,
  Target,
  MapPin,
  Building2,
  GraduationCap,
  Briefcase,
  Users,
  AlertCircle,
  Eye,
  RefreshCw,
  Lightbulb,
  CheckCircle,
  ExternalLink,
  Copy,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  LinkedInUrlGenerator,
  LinkedInSearchParams,
  SearchUrlResult,
  linkedInUrlUtils
} from '@/services/linkedin-url-generator';
import { SearchType } from '@/types/prospect-search';

interface SearchConfigurationBuilderProps {
  searchType: SearchType;
  initialParams?: LinkedInSearchParams;
  onConfigurationChange: (params: LinkedInSearchParams, urlResult: SearchUrlResult) => void;
  onUrlGenerated?: (url: string) => void;
  showPreview?: boolean;
  className?: string;
}

interface SearchPreset {
  id: string;
  name: string;
  description: string;
  params: Partial<LinkedInSearchParams>;
  category: 'sales' | 'recruiting' | 'marketing' | 'general';
}

const SEARCH_PRESETS: SearchPreset[] = [
  {
    id: 'tech-executives',
    name: 'Tech Executives',
    description: 'CEOs, CTOs, VPs in technology companies',
    category: 'sales',
    params: {
      title: 'CEO OR CTO OR "Vice President" OR VP',
      industryUrns: ['technology', 'software', 'internet'],
      seniorityLevel: ['director', 'vp', 'cxo']
    }
  },
  {
    id: 'software-developers',
    name: 'Software Developers',
    description: 'Frontend, backend, and full-stack developers',
    category: 'recruiting',
    params: {
      title: 'Software Engineer OR Developer OR "Full Stack"',
      functionAreas: ['engineering', 'information-technology'],
      yearsOfExperience: ['2-5', '5-10']
    }
  },
  {
    id: 'marketing-managers',
    name: 'Marketing Managers',
    description: 'Marketing managers and directors',
    category: 'marketing',
    params: {
      title: 'Marketing Manager OR "Marketing Director"',
      functionAreas: ['marketing'],
      seniorityLevel: ['manager', 'director']
    }
  },
  {
    id: 'startup-founders',
    name: 'Startup Founders',
    description: 'Founders and co-founders at startups',
    category: 'sales',
    params: {
      title: 'Founder OR "Co-founder" OR CEO',
      companySize: ['1-10', '11-50', '51-200']
    }
  }
];

const LOCATION_SUGGESTIONS = [
  'San Francisco Bay Area',
  'New York City Metropolitan Area',
  'Los Angeles Metropolitan Area',
  'Chicago Area',
  'Boston Area',
  'Seattle Area',
  'Austin, Texas Area',
  'Denver Area',
  'United States',
  'Canada',
  'United Kingdom',
  'Germany',
  'France',
  'Australia'
];

const INDUSTRY_OPTIONS = [
  { value: 'technology', label: 'Technology' },
  { value: 'software', label: 'Software' },
  { value: 'internet', label: 'Internet' },
  { value: 'financial-services', label: 'Financial Services' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'consulting', label: 'Management Consulting' },
  { value: 'education', label: 'Education' },
  { value: 'retail', label: 'Retail' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'real-estate', label: 'Real Estate' }
];

const COMPANY_SIZE_OPTIONS = [
  { value: '1-10', label: '1-10 employees' },
  { value: '11-50', label: '11-50 employees' },
  { value: '51-200', label: '51-200 employees' },
  { value: '201-500', label: '201-500 employees' },
  { value: '501-1000', label: '501-1,000 employees' },
  { value: '1001-5000', label: '1,001-5,000 employees' },
  { value: '5001-10000', label: '5,001-10,000 employees' },
  { value: '10000+', label: '10,001+ employees' }
];

const SENIORITY_LEVELS = [
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'training', label: 'Training' },
  { value: 'entry', label: 'Entry level' },
  { value: 'associate', label: 'Associate' },
  { value: 'mid-senior', label: 'Mid-Senior level' },
  { value: 'director', label: 'Director' },
  { value: 'executive', label: 'Executive' }
];

export function SearchConfigurationBuilder({
  searchType,
  initialParams = {},
  onConfigurationChange,
  onUrlGenerated,
  showPreview = true,
  className
}: SearchConfigurationBuilderProps) {
  const [params, setParams] = useState<LinkedInSearchParams>(initialParams);
  const [urlResult, setUrlResult] = useState<SearchUrlResult | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [customKeywords, setCustomKeywords] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Generate URL whenever parameters change
  useEffect(() => {
    const generateUrl = () => {
      setIsGenerating(true);
      
      try {
        let result: SearchUrlResult;
        
        switch (searchType) {
          case 'basic-search':
            result = LinkedInUrlGenerator.generateBasicSearchUrl(params);
            break;
          case 'sales-navigator':
            result = LinkedInUrlGenerator.generateSalesNavigatorUrl(params);
            break;
          case 'recruiter-search':
            result = LinkedInUrlGenerator.generateRecruiterSearchUrl(params);
            break;
          default:
            result = LinkedInUrlGenerator.generateBasicSearchUrl(params);
        }
        
        setUrlResult(result);
        onConfigurationChange(params, result);
        
        if (result.isValid && onUrlGenerated) {
          onUrlGenerated(result.url);
        }
      } catch (error) {
        console.error('Error generating URL:', error);
        toast.error('Failed to generate search URL');
      } finally {
        setIsGenerating(false);
      }
    };

    const debounceTimer = setTimeout(generateUrl, 300);
    return () => clearTimeout(debounceTimer);
  }, [params, searchType, onConfigurationChange, onUrlGenerated]);

  // Apply preset configuration
  const applyPreset = (presetId: string) => {
    const preset = SEARCH_PRESETS.find(p => p.id === presetId);
    if (preset) {
      const newParams = { ...params, ...preset.params };
      setParams(newParams);
      setSelectedPreset(presetId);
      toast.success(`Applied "${preset.name}" preset`);
    }
  };

  // Update specific parameter
  const updateParam = (key: keyof LinkedInSearchParams, value: any) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  // Handle multi-select arrays
  const toggleArrayValue = (key: keyof LinkedInSearchParams, value: string) => {
    setParams(prev => {
      const currentArray = (prev[key] as string[]) || [];
      const newArray = currentArray.includes(value)
        ? currentArray.filter(v => v !== value)
        : [...currentArray, value];
      return { ...prev, [key]: newArray };
    });
  };

  // Get optimization suggestions
  const optimizationSuggestions = useMemo(() => {
    const { suggestions, warnings } = LinkedInUrlGenerator.optimizeSearchParameters(params);
    return { suggestions, warnings };
  }, [params]);

  // Copy URL to clipboard
  const copyUrl = () => {
    if (urlResult?.url) {
      navigator.clipboard.writeText(urlResult.url);
      toast.success('URL copied to clipboard');
    }
  };

  // Reset configuration
  const resetConfiguration = () => {
    setParams({});
    setSelectedPreset('');
    setCustomKeywords('');
    toast.info('Configuration reset');
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Preset Selection */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <CardTitle className="text-sm font-medium">Quick Presets</CardTitle>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={resetConfiguration}
              className="h-7 px-2 text-xs"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Reset
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {SEARCH_PRESETS.map(preset => (
              <Button
                key={preset.id}
                variant={selectedPreset === preset.id ? "default" : "outline"}
                size="sm"
                onClick={() => applyPreset(preset.id)}
                className="justify-start text-xs h-8"
              >
                <div className="text-left">
                  <div className="font-medium">{preset.name}</div>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Configuration */}
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic" className="flex items-center gap-1">
            <Target className="h-3 w-3" />
            Basic
          </TabsTrigger>
          <TabsTrigger value="location" className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            Location
          </TabsTrigger>
          <TabsTrigger value="company" className="flex items-center gap-1">
            <Building2 className="h-3 w-3" />
            Company
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-1">
            <Settings className="h-3 w-3" />
            Advanced
          </TabsTrigger>
        </TabsList>

        {/* Basic Search Parameters */}
        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="keywords" className="text-sm font-medium">Keywords</Label>
                  <Input
                    id="keywords"
                    value={params.keywords || ''}
                    onChange={(e) => updateParam('keywords', e.target.value)}
                    placeholder="e.g., Software Engineer, Marketing Manager"
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Use OR, AND, quotes for exact phrases
                  </p>
                </div>

                <div>
                  <Label htmlFor="title" className="text-sm font-medium">Job Title</Label>
                  <Input
                    id="title"
                    value={params.title || ''}
                    onChange={(e) => updateParam('title', e.target.value)}
                    placeholder="e.g., CEO, CTO, Marketing Manager"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="firstName" className="text-sm font-medium">First Name</Label>
                  <Input
                    id="firstName"
                    value={params.firstName || ''}
                    onChange={(e) => updateParam('firstName', e.target.value)}
                    placeholder="e.g., John, Sarah"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="lastName" className="text-sm font-medium">Last Name</Label>
                  <Input
                    id="lastName"
                    value={params.lastName || ''}
                    onChange={(e) => updateParam('lastName', e.target.value)}
                    placeholder="e.g., Smith, Johnson"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="company" className="text-sm font-medium">Company</Label>
                <Input
                  id="company"
                  value={params.company || ''}
                  onChange={(e) => updateParam('company', e.target.value)}
                  placeholder="e.g., Google, Microsoft, Apple"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="school" className="text-sm font-medium">School</Label>
                <Input
                  id="school"
                  value={params.school || ''}
                  onChange={(e) => updateParam('school', e.target.value)}
                  placeholder="e.g., Stanford University, MIT"
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Location Parameters */}
        <TabsContent value="location" className="space-y-4">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div>
                <Label htmlFor="location" className="text-sm font-medium">Location</Label>
                <Select value={params.location || ''} onValueChange={(value) => updateParam('location', value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select location or type custom..." />
                  </SelectTrigger>
                  <SelectContent>
                    {LOCATION_SUGGESTIONS.map(location => (
                      <SelectItem key={location} value={location}>{location}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  value={params.location || ''}
                  onChange={(e) => updateParam('location', e.target.value)}
                  placeholder="Or type custom location..."
                  className="mt-2"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="country" className="text-sm font-medium">Country</Label>
                  <Input
                    id="country"
                    value={params.country || ''}
                    onChange={(e) => updateParam('country', e.target.value)}
                    placeholder="e.g., United States, Canada"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="region" className="text-sm font-medium">Region/State</Label>
                  <Input
                    id="region"
                    value={params.region || ''}
                    onChange={(e) => updateParam('region', e.target.value)}
                    placeholder="e.g., California, New York"
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Company Parameters */}
        <TabsContent value="company" className="space-y-4">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div>
                <Label className="text-sm font-medium">Current Company</Label>
                <Textarea
                  value={(params.currentCompany || []).join(', ')}
                  onChange={(e) => updateParam('currentCompany', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                  placeholder="Enter company names separated by commas..."
                  rows={3}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-sm font-medium">Company Size</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                  {COMPANY_SIZE_OPTIONS.map(size => (
                    <div key={size.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`company-size-${size.value}`}
                        checked={(params.companySize || []).includes(size.value)}
                        onCheckedChange={() => toggleArrayValue('companySize', size.value)}
                      />
                      <Label htmlFor={`company-size-${size.value}`} className="text-xs">
                        {size.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Industry</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                  {INDUSTRY_OPTIONS.map(industry => (
                    <div key={industry.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`industry-${industry.value}`}
                        checked={(params.industryUrns || []).includes(industry.value)}
                        onCheckedChange={() => toggleArrayValue('industryUrns', industry.value)}
                      />
                      <Label htmlFor={`industry-${industry.value}`} className="text-xs">
                        {industry.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Parameters */}
        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div>
                <Label className="text-sm font-medium">Seniority Level</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                  {SENIORITY_LEVELS.map(level => (
                    <div key={level.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`seniority-${level.value}`}
                        checked={(params.seniorityLevel || []).includes(level.value)}
                        onCheckedChange={() => toggleArrayValue('seniorityLevel', level.value)}
                      />
                      <Label htmlFor={`seniority-${level.value}`} className="text-xs">
                        {level.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="connectionOf" className="text-sm font-medium">Connection Of</Label>
                  <Input
                    id="connectionOf"
                    value={params.connectionOf || ''}
                    onChange={(e) => updateParam('connectionOf', e.target.value)}
                    placeholder="LinkedIn profile URL"
                    className="mt-1"
                  />
                </div>

                <div className="flex items-center space-x-2 pt-6">
                  <Checkbox
                    id="openToOpportunities"
                    checked={params.openToOpportunities || false}
                    onCheckedChange={(checked) => updateParam('openToOpportunities', checked)}
                  />
                  <Label htmlFor="openToOpportunities" className="text-sm">
                    Open to opportunities
                  </Label>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Excluded Keywords</Label>
                <Input
                  value={(params.excludedKeywords || []).join(', ')}
                  onChange={(e) => updateParam('excludedKeywords', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                  placeholder="Keywords to exclude, separated by commas..."
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Optimization Suggestions */}
      {(optimizationSuggestions.suggestions.length > 0 || optimizationSuggestions.warnings.length > 0) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Optimization Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            {optimizationSuggestions.suggestions.map((suggestion, index) => (
              <Alert key={index}>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">{suggestion}</AlertDescription>
              </Alert>
            ))}
            {optimizationSuggestions.warnings.map((warning, index) => (
              <Alert key={index} className="border-amber-200 bg-amber-50">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-sm text-amber-800">{warning}</AlertDescription>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      {/* URL Preview */}
      {showPreview && urlResult && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Generated URL Preview
                {isGenerating && <RefreshCw className="h-3 w-3 animate-spin" />}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant={urlResult.isValid ? "default" : "destructive"} className="text-xs">
                  {urlResult.isValid ? 'Valid' : 'Invalid'}
                </Badge>
                {urlResult.premiumRequired && (
                  <Badge variant="secondary" className="text-xs">Premium</Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex-1 p-2 bg-gray-50 rounded text-sm font-mono text-gray-700 truncate">
                {urlResult.url}
              </div>
              <Button size="sm" variant="outline" onClick={copyUrl} className="shrink-0">
                <Copy className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => window.open(urlResult.url, '_blank')} className="shrink-0">
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Search Type:</span>
                <div className="font-medium capitalize">{urlResult.searchType.replace('-', ' ')}</div>
              </div>
              <div>
                <span className="text-gray-500">Estimated Results:</span>
                <div className="font-medium">{urlResult.estimatedResults?.toLocaleString() || 'Unknown'}</div>
              </div>
              <div>
                <span className="text-gray-500">Premium Required:</span>
                <div className="font-medium">{urlResult.premiumRequired ? 'Yes' : 'No'}</div>
              </div>
            </div>

            {urlResult.validationErrors.length > 0 && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription>
                  <div className="space-y-1">
                    <p className="font-medium text-red-800">Validation Errors:</p>
                    {urlResult.validationErrors.map((error, index) => (
                      <div key={index} className="text-xs text-red-700">• {error}</div>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}