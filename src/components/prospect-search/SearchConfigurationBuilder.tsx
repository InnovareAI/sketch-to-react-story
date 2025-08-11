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
      industry: ['technology', 'software', 'internet'],
      seniority_level: ['director', 'vp', 'cxo']
    }
  },
  {
    id: 'software-developers',
    name: 'Software Developers',
    description: 'Frontend, backend, and full-stack developers',
    category: 'recruiting',
    params: {
      title: 'Software Engineer OR Developer OR "Full Stack"',
      function_area: ['engineering', 'information-technology'],
      years_of_experience: { min: 2, max: 10 }
    }
  },
  {
    id: 'marketing-managers',
    name: 'Marketing Managers',
    description: 'Marketing managers and directors',
    category: 'marketing',
    params: {
      title: 'Marketing Manager OR "Marketing Director"',
      function_area: ['marketing'],
      seniority_level: ['manager', 'director']
    }
  },
  {
    id: 'startup-founders',
    name: 'Startup Founders',
    description: 'Founders and co-founders at startups',
    category: 'sales',
    params: {
      title: 'Founder OR "Co-founder" OR CEO',
      company_size: ['1-10', '11-50', '51-200']
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

const FUNCTION_AREAS = [
  { value: 'accounting', label: 'Accounting' },
  { value: 'administrative', label: 'Administrative' },
  { value: 'arts', label: 'Arts and Design' },
  { value: 'business-development', label: 'Business Development' },
  { value: 'consulting', label: 'Consulting' },
  { value: 'education', label: 'Education' },
  { value: 'engineering', label: 'Engineering' },
  { value: 'entrepreneurship', label: 'Entrepreneurship' },
  { value: 'finance', label: 'Finance' },
  { value: 'healthcare', label: 'Healthcare Services' },
  { value: 'human-resources', label: 'Human Resources' },
  { value: 'information-technology', label: 'Information Technology' },
  { value: 'legal', label: 'Legal' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'media', label: 'Media and Communications' },
  { value: 'military', label: 'Military and Protective Services' },
  { value: 'operations', label: 'Operations' },
  { value: 'product-management', label: 'Product Management' },
  { value: 'program-management', label: 'Program and Project Management' },
  { value: 'purchasing', label: 'Purchasing' },
  { value: 'quality-assurance', label: 'Quality Assurance' },
  { value: 'real-estate', label: 'Real Estate' },
  { value: 'research', label: 'Research' },
  { value: 'sales', label: 'Sales' },
  { value: 'support', label: 'Support' }
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
            result = linkedInUrlUtils.generateRecruiterUrl(params);
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
    try {
      const optimizer = LinkedInUrlGenerator.optimizeSearchParameters(searchType, params);
      return { 
        suggestions: optimizer.suggestions || [], 
        warnings: [] 
      };
    } catch (error) {
      return { suggestions: [], warnings: [] };
    }
  }, [params, searchType]);

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
                    value={params.first_name || ''}
                    onChange={(e) => updateParam('first_name', e.target.value)}
                    placeholder="e.g., John, Sarah"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="lastName" className="text-sm font-medium">Last Name</Label>
                  <Input
                    id="lastName"
                    value={params.last_name || ''}
                    onChange={(e) => updateParam('last_name', e.target.value)}
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
                <Input
                  id="location"
                  value={params.location || ''}
                  onChange={(e) => updateParam('location', e.target.value)}
                  placeholder="e.g., San Francisco Bay Area"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Start typing to see suggestions
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium">Quick Location Suggestions</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                  {LOCATION_SUGGESTIONS.map(location => (
                    <Button
                      key={location}
                      variant={params.location === location ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateParam('location', location)}
                      className="justify-start text-xs h-8"
                    >
                      {location}
                    </Button>
                  ))}
                </div>
              </div>

              {params.location && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">Selected Location:</span>
                    <span className="text-sm text-blue-700">{params.location}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Company Parameters */}
        <TabsContent value="company" className="space-y-4">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div>
                <Label className="text-sm font-medium">Industries</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                  {INDUSTRY_OPTIONS.map(industry => (
                    <div key={industry.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`industry-${industry.value}`}
                        checked={(params.industry || []).includes(industry.value)}
                        onCheckedChange={() => toggleArrayValue('industry', industry.value)}
                      />
                      <Label
                        htmlFor={`industry-${industry.value}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {industry.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Company Size</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                  {COMPANY_SIZE_OPTIONS.map(size => (
                    <div key={size.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`size-${size.value}`}
                        checked={(params.company_size || []).includes(size.value)}
                        onCheckedChange={() => toggleArrayValue('company_size', size.value)}
                      />
                      <Label
                        htmlFor={`size-${size.value}`}
                        className="text-xs font-normal cursor-pointer"
                      >
                        {size.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="currentCompany" className="text-sm font-medium">Current Company</Label>
                <Input
                  id="currentCompany"
                  value={(params.current_company || []).join(', ')}
                  onChange={(e) => updateParam('current_company', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                  placeholder="e.g., Google, Microsoft, Apple"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Separate multiple companies with commas
                </p>
              </div>

              <div>
                <Label htmlFor="pastCompany" className="text-sm font-medium">Past Company</Label>
                <Input
                  id="pastCompany"
                  value={(params.past_company || []).join(', ')}
                  onChange={(e) => updateParam('past_company', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                  placeholder="e.g., Facebook, Amazon, Netflix"
                  className="mt-1"
                />
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
                        checked={(params.seniority_level || []).includes(level.value)}
                        onCheckedChange={() => toggleArrayValue('seniority_level', level.value)}
                      />
                      <Label
                        htmlFor={`seniority-${level.value}`}
                        className="text-xs font-normal cursor-pointer"
                      >
                        {level.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Function Areas</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2 max-h-60 overflow-y-auto">
                  {FUNCTION_AREAS.map(area => (
                    <div key={area.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`function-${area.value}`}
                        checked={(params.function_area || []).includes(area.value)}
                        onCheckedChange={() => toggleArrayValue('function_area', area.value)}
                      />
                      <Label
                        htmlFor={`function-${area.value}`}
                        className="text-xs font-normal cursor-pointer"
                      >
                        {area.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Years of Experience</Label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <Label htmlFor="minExperience" className="text-xs text-gray-500">Minimum</Label>
                    <Input
                      id="minExperience"
                      type="number"
                      value={params.years_of_experience?.min || ''}
                      onChange={(e) => updateParam('years_of_experience', {
                        ...params.years_of_experience,
                        min: parseInt(e.target.value) || undefined
                      })}
                      placeholder="0"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxExperience" className="text-xs text-gray-500">Maximum</Label>
                    <Input
                      id="maxExperience"
                      type="number"
                      value={params.years_of_experience?.max || ''}
                      onChange={(e) => updateParam('years_of_experience', {
                        ...params.years_of_experience,
                        max: parseInt(e.target.value) || undefined
                      })}
                      placeholder="10"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {searchType === 'sales-navigator' && (
                <div>
                  <Label htmlFor="leadInterests" className="text-sm font-medium">Lead Interests</Label>
                  <Input
                    id="leadInterests"
                    value={(params.lead_interests || []).join(', ')}
                    onChange={(e) => updateParam('lead_interests', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                    placeholder="e.g., artificial intelligence, machine learning"
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Sales Navigator premium feature
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* URL Preview and Optimization */}
      {showPreview && urlResult && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                <CardTitle className="text-sm">Generated URL</CardTitle>
                {isGenerating && (
                  <RefreshCw className="h-3 w-3 animate-spin text-blue-600" />
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={urlResult.isValid ? "default" : "destructive"} className="text-xs">
                  {urlResult.isValid ? "Valid" : "Invalid"}
                </Badge>
                {urlResult.isValid && (
                  <Badge variant="secondary" className="text-xs">
                    {searchType.replace('-', ' ').toUpperCase()}
                  </Badge>
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
              {urlResult.isValid && (
                <Button size="sm" variant="outline" onClick={() => window.open(urlResult.url, '_blank')} className="shrink-0">
                  <ExternalLink className="h-3 w-3" />
                </Button>
              )}
            </div>

            {urlResult.isValid && (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Search Type:</span>
                  <div className="font-medium capitalize">{urlResult.searchType?.replace('-', ' ')}</div>
                </div>
                <div>
                  <span className="text-gray-500">Parameters:</span>
                  <div className="font-medium">{Object.keys(params).length} configured</div>
                </div>
              </div>
            )}

            {urlResult.errors && urlResult.errors.length > 0 && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription>
                  <div className="space-y-1">
                    <p className="font-medium text-red-800">Validation Errors:</p>
                    {urlResult.errors.map((error, index) => (
                      <div key={index} className="text-xs text-red-700">• {error}</div>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {optimizationSuggestions.suggestions.length > 0 && (
              <Alert className="border-amber-200 bg-amber-50">
                <Lightbulb className="h-4 w-4 text-amber-600" />
                <AlertDescription>
                  <div className="space-y-1">
                    <p className="font-medium text-amber-800">Optimization Suggestions:</p>
                    {optimizationSuggestions.suggestions.slice(0, 3).map((suggestion, index) => (
                      <div key={index} className="text-xs text-amber-700">• {suggestion}</div>
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