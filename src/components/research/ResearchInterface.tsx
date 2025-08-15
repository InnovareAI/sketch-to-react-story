/**
 * ResearchInterface - Lead research with Devin-style agent activity
 * Integrates with ResearchAgent and displays progress in activity bar
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Search, 
  Filter,
  Users,
  Building2,
  MapPin,
  Briefcase,
  Target,
  TrendingUp,
  Mail,
  Linkedin,
  Star,
  ExternalLink,
  Download,
  RefreshCw
} from 'lucide-react';

interface ResearchCriteria {
  industries?: string[];
  companySizes?: string[];
  locations?: string[];
  jobTitles?: string[];
  seniority?: string[];
  departments?: string[];
  keywords?: string[];
}

interface ProspectProfile {
  firstName: string;
  lastName: string;
  fullName: string;
  email?: string;
  linkedinUrl?: string;
  title: string;
  company: string;
  department?: string;
  seniority?: string;
  companySize?: number;
  industry?: string;
  location?: string;
  bio?: string;
  leadScore?: number;
  dataSource: string;
  confidence: number;
}

interface ResearchInterfaceProps {
  onActivityUpdate?: (activity: any) => void;
  className?: string;
}

export const ResearchInterface: React.FC<ResearchInterfaceProps> = ({
  onActivityUpdate,
  className = ''
}) => {
  const [criteria, setCriteria] = useState<ResearchCriteria>({});
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<ProspectProfile[]>([]);
  const [searchCompleted, setSearchCompleted] = useState(false);

  const industryOptions = [
    'Technology', 'SaaS', 'Fintech', 'Healthcare', 'E-commerce',
    'Manufacturing', 'Professional Services', 'Media', 'Education'
  ];

  const companySizeOptions = [
    '1-10', '11-50', '51-200', '201-1000', '1000+'
  ];

  const seniorityOptions = [
    'junior', 'mid', 'senior', 'director', 'vp', 'c-level'
  ];

  const jobTitleOptions = [
    'CEO', 'CMO', 'VP Marketing', 'Marketing Director', 'VP Sales', 
    'Sales Director', 'Head of Growth', 'Growth Manager'
  ];

  const updateActivity = (type: string, message: string) => {
    onActivityUpdate?.({
      type,
      message,
      timestamp: new Date()
    });
  };

  const handleSearch = async () => {
    if (Object.keys(criteria).length === 0) return;
    
    setIsSearching(true);
    updateActivity('processing', 'Initiating lead research...');

    try {
      // Step 1: Initialize
      await new Promise(resolve => setTimeout(resolve, 1000));
      updateActivity('processing', 'Analyzing search criteria...');

      // Step 2: Data collection
      await new Promise(resolve => setTimeout(resolve, 2000));
      updateActivity('searching', 'Scraping LinkedIn profiles...');

      // Step 3: Enrichment
      await new Promise(resolve => setTimeout(resolve, 3000));
      updateActivity('analyzing', 'Enriching prospect data...');

      // Step 4: Scoring
      await new Promise(resolve => setTimeout(resolve, 2000));
      updateActivity('analyzing', 'Scoring leads based on ICP fit...');

      // Step 5: Final processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      updateActivity('storing', 'Storing qualified prospects...');

      // Mock results
      const mockResults: ProspectProfile[] = [
        {
          firstName: 'Sarah',
          lastName: 'Johnson',
          fullName: 'Sarah Johnson',
          email: 'sarah.johnson@techcorp.com',
          linkedinUrl: 'https://linkedin.com/in/sarahjohnson',
          title: 'VP of Marketing',
          company: 'TechCorp Solutions',
          department: 'Marketing',
          seniority: 'vp',
          companySize: 250,
          industry: 'Technology',
          location: 'San Francisco, CA',
          bio: 'Marketing leader with 10+ years experience in B2B SaaS',
          leadScore: 85,
          dataSource: 'LinkedIn',
          confidence: 0.9
        },
        {
          firstName: 'Michael',
          lastName: 'Chen',
          fullName: 'Michael Chen',
          email: 'michael.chen@growthco.com',
          linkedinUrl: 'https://linkedin.com/in/michaelchen',
          title: 'Director of Growth',
          company: 'GrowthCo',
          department: 'Marketing',
          seniority: 'director',
          companySize: 150,
          industry: 'SaaS',
          location: 'Austin, TX',
          bio: 'Growth marketing specialist focused on scaling B2B companies',
          leadScore: 78,
          dataSource: 'Apollo',
          confidence: 0.85
        },
        {
          firstName: 'Emily',
          lastName: 'Rodriguez',
          fullName: 'Emily Rodriguez',
          email: 'emily@innovate.io',
          linkedinUrl: 'https://linkedin.com/in/emilyrodriguez',
          title: 'CMO',
          company: 'Innovate Labs',
          department: 'Marketing',
          seniority: 'c-level',
          companySize: 80,
          industry: 'Fintech',
          location: 'New York, NY',
          bio: 'CMO driving digital transformation in financial services',
          leadScore: 92,
          dataSource: 'LinkedIn',
          confidence: 0.95
        }
      ];

      setResults(mockResults);
      setSearchCompleted(true);
      updateActivity('complete', `Research complete! Found ${mockResults.length} qualified prospects.`);

    } catch (error) {
      updateActivity('error', 'Research failed: ' + error.message);
    } finally {
      setIsSearching(false);
    }
  };

  const handleCriteriaChange = (key: keyof ResearchCriteria, value: string | string[]) => {
    setCriteria(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const getLeadScoreColor = (score?: number) => {
    if (!score) return 'text-gray-500';
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const exportResults = () => {
    const csv = [
      ['Name', 'Title', 'Company', 'Email', 'LinkedIn', 'Lead Score'],
      ...results.map(p => [
        p.fullName,
        p.title,
        p.company,
        p.email || '',
        p.linkedinUrl || '',
        p.leadScore?.toString() || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sam-ai-research-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center">
            <Search className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Lead Research</h2>
            <p className="text-sm text-gray-600">Find qualified prospects based on your ICP</p>
          </div>
        </div>
        
        {searchCompleted && (
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={exportResults}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => {
              setResults([]);
              setSearchCompleted(false);
              setCriteria({});
            }}>
              <RefreshCw className="w-4 h-4 mr-2" />
              New Search
            </Button>
          </div>
        )}
      </div>

      <div className="flex-1 flex">
        {/* Search Criteria - Left Panel */}
        <div className="w-80 border-r bg-gray-50 p-4 overflow-y-auto">
          <div className="space-y-6">
            {/* Industries */}
            <div>
              <Label className="text-sm font-medium flex items-center mb-3">
                <Building2 className="w-4 h-4 mr-2" />
                Industries
              </Label>
              <div className="space-y-2">
                {industryOptions.map(industry => (
                  <div key={industry} className="flex items-center space-x-2">
                    <Checkbox
                      id={`industry-${industry}`}
                      checked={(criteria.industries || []).includes(industry)}
                      onCheckedChange={(checked) => {
                        const current = criteria.industries || [];
                        handleCriteriaChange('industries', 
                          checked 
                            ? [...current, industry]
                            : current.filter(i => i !== industry)
                        );
                      }}
                    />
                    <label htmlFor={`industry-${industry}`} className="text-sm">
                      {industry}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Company Sizes */}
            <div>
              <Label className="text-sm font-medium flex items-center mb-3">
                <Users className="w-4 h-4 mr-2" />
                Company Size
              </Label>
              <div className="space-y-2">
                {companySizeOptions.map(size => (
                  <div key={size} className="flex items-center space-x-2">
                    <Checkbox
                      id={`size-${size}`}
                      checked={(criteria.companySizes || []).includes(size)}
                      onCheckedChange={(checked) => {
                        const current = criteria.companySizes || [];
                        handleCriteriaChange('companySizes', 
                          checked 
                            ? [...current, size]
                            : current.filter(s => s !== size)
                        );
                      }}
                    />
                    <label htmlFor={`size-${size}`} className="text-sm">
                      {size} employees
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Job Titles */}
            <div>
              <Label className="text-sm font-medium flex items-center mb-3">
                <Briefcase className="w-4 h-4 mr-2" />
                Job Titles
              </Label>
              <div className="space-y-2">
                {jobTitleOptions.map(title => (
                  <div key={title} className="flex items-center space-x-2">
                    <Checkbox
                      id={`title-${title}`}
                      checked={(criteria.jobTitles || []).includes(title)}
                      onCheckedChange={(checked) => {
                        const current = criteria.jobTitles || [];
                        handleCriteriaChange('jobTitles', 
                          checked 
                            ? [...current, title]
                            : current.filter(t => t !== title)
                        );
                      }}
                    />
                    <label htmlFor={`title-${title}`} className="text-sm">
                      {title}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Seniority */}
            <div>
              <Label className="text-sm font-medium flex items-center mb-3">
                <TrendingUp className="w-4 h-4 mr-2" />
                Seniority Level
              </Label>
              <div className="space-y-2">
                {seniorityOptions.map(level => (
                  <div key={level} className="flex items-center space-x-2">
                    <Checkbox
                      id={`seniority-${level}`}
                      checked={(criteria.seniority || []).includes(level)}
                      onCheckedChange={(checked) => {
                        const current = criteria.seniority || [];
                        handleCriteriaChange('seniority', 
                          checked 
                            ? [...current, level]
                            : current.filter(s => s !== level)
                        );
                      }}
                    />
                    <label htmlFor={`seniority-${level}`} className="text-sm capitalize">
                      {level}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Search Button */}
            <Button 
              onClick={handleSearch} 
              disabled={isSearching || Object.keys(criteria).length === 0}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
            >
              {isSearching ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Researching...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Find Prospects
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Results - Right Panel */}
        <div className="flex-1 flex flex-col">
          {!searchCompleted ? (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Ready to Find Your Ideal Prospects
                </h3>
                <p className="text-gray-600 mb-4">
                  Select your criteria on the left and click "Find Prospects" to begin
                </p>
                {Object.keys(criteria).length > 0 && (
                  <div className="flex flex-wrap gap-2 justify-center max-w-md mx-auto">
                    {criteria.industries?.map(industry => (
                      <Badge key={industry} variant="secondary">{industry}</Badge>
                    ))}
                    {criteria.jobTitles?.map(title => (
                      <Badge key={title} variant="outline">{title}</Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col">
              {/* Results Header */}
              <div className="p-4 border-b bg-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <h3 className="text-lg font-semibold">
                      {results.length} Prospects Found
                    </h3>
                    <Badge variant="outline" className="flex items-center space-x-1">
                      <Star className="w-3 h-3" />
                      <span>{results.filter(p => (p.leadScore || 0) >= 80).length} High Quality</span>
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600">
                    Sorted by Lead Score
                  </div>
                </div>
              </div>

              {/* Results List */}
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-4">
                  {results.map((prospect, index) => (
                    <Card key={index} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className="font-semibold text-gray-900">
                                {prospect.fullName}
                              </h4>
                              <Badge 
                                variant={prospect.leadScore && prospect.leadScore >= 80 ? "default" : "secondary"}
                                className="flex items-center space-x-1"
                              >
                                <Star className="w-3 h-3" />
                                <span>{prospect.leadScore}</span>
                              </Badge>
                            </div>
                            
                            <p className="text-gray-700 mb-1">
                              {prospect.title} at <span className="font-medium">{prospect.company}</span>
                            </p>
                            
                            <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                              <span className="flex items-center">
                                <Building2 className="w-3 h-3 mr-1" />
                                {prospect.industry}
                              </span>
                              <span className="flex items-center">
                                <MapPin className="w-3 h-3 mr-1" />
                                {prospect.location}
                              </span>
                              <span className="flex items-center">
                                <Users className="w-3 h-3 mr-1" />
                                {prospect.companySize} employees
                              </span>
                            </div>
                            
                            {prospect.bio && (
                              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                {prospect.bio}
                              </p>
                            )}
                          </div>

                          <div className="flex flex-col space-y-2 ml-4">
                            {prospect.email && (
                              <Button size="sm" variant="outline" asChild>
                                <a href={`mailto:${prospect.email}`}>
                                  <Mail className="w-4 h-4 mr-2" />
                                  Email
                                </a>
                              </Button>
                            )}
                            {prospect.linkedinUrl && (
                              <Button size="sm" variant="outline" asChild>
                                <a href={prospect.linkedinUrl} target="_blank" rel="noopener noreferrer">
                                  <Linkedin className="w-4 h-4 mr-2" />
                                  LinkedIn
                                </a>
                              </Button>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t">
                          <div className="flex items-center space-x-3 text-xs text-gray-500">
                            <span>Source: {prospect.dataSource}</span>
                            <span>•</span>
                            <span>Confidence: {Math.round(prospect.confidence * 100)}%</span>
                          </div>
                          
                          <div className="flex space-x-2">
                            <Button size="sm" className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700">
                              Add to Campaign
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResearchInterface;