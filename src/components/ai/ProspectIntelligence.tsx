// AI-Powered Prospect Intelligence Dashboard
// Handles scraping, enrichment, scoring, and AI-driven prospect analysis

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Brain,
  Zap,
  Target,
  TrendingUp,
  Database,
  Search,
  Filter,
  RefreshCw,
  Download,
  Upload,
  Star,
  AlertCircle,
  CheckCircle,
  Clock,
  Users,
  Building,
  MapPin,
  Globe,
  Mail,
  Phone,
  LinkedinIcon,
  Twitter,
  Instagram,
  MessageSquare,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Sparkles,
  Eye,
  Edit,
  Trash2,
  Plus
} from 'lucide-react';
import { toast } from 'sonner';

interface ProspectProfile {
  id: string;
  // Basic Info
  full_name: string;
  email: string;
  phone?: string;
  company: string;
  position: string;
  location: string;
  
  // Social Profiles
  linkedin_url?: string;
  twitter_url?: string;
  instagram_url?: string;
  website?: string;
  
  // AI Enrichment Data
  ai_enrichment: {
    personality_profile: {
      communication_style: 'direct' | 'collaborative' | 'analytical' | 'expressive';
      decision_making: 'quick' | 'deliberate' | 'consensus-driven';
      interests: string[];
      pain_points: string[];
      goals: string[];
    };
    company_intelligence: {
      revenue_range: string;
      employee_count: number;
      growth_stage: 'startup' | 'scale-up' | 'enterprise' | 'mature';
      tech_stack: string[];
      recent_news: string[];
      funding_status: string;
    };
    engagement_history: {
      platforms: string[];
      activity_level: 'low' | 'medium' | 'high';
      content_preferences: string[];
      optimal_contact_times: string[];
    };
  };
  
  // AI Scoring
  ai_score: {
    overall_score: number; // 0-100
    buying_intent: number;
    engagement_likelihood: number;
    conversion_probability: number;
    timing_score: number;
    fit_score: number;
    urgency_indicator: 'low' | 'medium' | 'high' | 'critical';
  };
  
  // AI-Generated Insights
  ai_insights: {
    recommended_approach: string;
    key_talking_points: string[];
    suggested_channels: string[];
    optimal_timing: string;
    personalization_hooks: string[];
    risk_factors: string[];
  };
  
  // Engagement Status
  status: 'new' | 'contacted' | 'engaged' | 'qualified' | 'converted' | 'not_interested';
  last_enriched: string;
  created_at: string;
  updated_at: string;
}

interface EnrichmentJob {
  id: string;
  name: string;
  source_type: 'csv_upload' | 'linkedin_search' | 'website_scrape' | 'api_import';
  total_prospects: number;
  processed: number;
  enriched: number;
  ai_scored: number;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  started_at: string;
  completed_at?: string;
  ai_models_used: string[];
  cost_estimate: number;
}

interface IntelligenceStats {
  total_prospects: number;
  enriched_today: number;
  ai_scored_prospects: number;
  high_intent_prospects: number;
  avg_prospect_score: number;
  enrichment_accuracy: number;
}

interface ProspectIntelligenceProps {
  className?: string;
}

export function ProspectIntelligence({ className }: ProspectIntelligenceProps) {
  const [prospects, setProspects] = useState<ProspectProfile[]>([]);
  const [enrichmentJobs, setEnrichmentJobs] = useState<EnrichmentJob[]>([]);
  const [stats, setStats] = useState<IntelligenceStats>({
    total_prospects: 0,
    enriched_today: 0,
    ai_scored_prospects: 0,
    high_intent_prospects: 0,
    avg_prospect_score: 0,
    enrichment_accuracy: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [scoreFilter, setScoreFilter] = useState('all');
  const [intentFilter, setIntentFilter] = useState('all');
  const [selectedProspects, setSelectedProspects] = useState<string[]>([]);
  const [showEnrichmentDialog, setShowEnrichmentDialog] = useState(false);

  useEffect(() => {
    loadIntelligenceData();
  }, []);

  const loadIntelligenceData = async () => {
    try {
      setLoading(true);
      
      // Mock data for demonstration
      setStats({
        total_prospects: 15749,
        enriched_today: 247,
        ai_scored_prospects: 14832,
        high_intent_prospects: 1247,
        avg_prospect_score: 73.2,
        enrichment_accuracy: 94.7
      });

      setProspects([
        {
          id: '1',
          full_name: 'Sarah Chen',
          email: 'sarah.chen@technovate.com',
          phone: '+1-555-0123',
          company: 'TechNovate Solutions',
          position: 'VP of Sales',
          location: 'San Francisco, CA',
          linkedin_url: 'https://linkedin.com/in/sarahchen',
          ai_enrichment: {
            personality_profile: {
              communication_style: 'analytical',
              decision_making: 'deliberate',
              interests: ['Sales Technology', 'AI/ML', 'Team Leadership'],
              pain_points: ['Manual lead qualification', 'Sales team efficiency'],
              goals: ['Increase conversion rates', 'Scale sales operations']
            },
            company_intelligence: {
              revenue_range: '$10M - $50M',
              employee_count: 150,
              growth_stage: 'scale-up',
              tech_stack: ['Salesforce', 'HubSpot', 'Outreach'],
              recent_news: ['Series B funding $25M', 'New product launch'],
              funding_status: 'Series B funded'
            },
            engagement_history: {
              platforms: ['LinkedIn', 'Email', 'Twitter'],
              activity_level: 'high',
              content_preferences: ['Industry reports', 'Case studies', 'Webinars'],
              optimal_contact_times: ['Tuesday 10-11 AM PST', 'Thursday 2-3 PM PST']
            }
          },
          ai_score: {
            overall_score: 92,
            buying_intent: 88,
            engagement_likelihood: 94,
            conversion_probability: 85,
            timing_score: 96,
            fit_score: 89,
            urgency_indicator: 'high'
          },
          ai_insights: {
            recommended_approach: 'Lead with ROI data and case studies from similar scale-ups. Focus on sales efficiency gains.',
            key_talking_points: ['50% reduction in manual qualifying', 'Proven results with 100-200 person sales teams', 'AI-powered lead scoring'],
            suggested_channels: ['LinkedIn message', 'Email follow-up', 'Phone call'],
            optimal_timing: 'Best to contact Tuesday morning or Thursday afternoon',
            personalization_hooks: ['Recent Series B funding', 'Company\'s focus on sales automation', 'Her background in sales ops'],
            risk_factors: ['Currently using HubSpot - may have contract', 'Decision-making process involves multiple stakeholders']
          },
          status: 'new',
          last_enriched: '2024-01-22T10:30:00Z',
          created_at: '2024-01-22T09:00:00Z',
          updated_at: '2024-01-22T10:30:00Z'
        }
        // More mock prospects...
      ]);

      setEnrichmentJobs([
        {
          id: '1',
          name: 'LinkedIn SaaS VPs Import',
          source_type: 'linkedin_search',
          total_prospects: 500,
          processed: 423,
          enriched: 401,
          ai_scored: 398,
          status: 'processing',
          started_at: '2024-01-22T08:00:00Z',
          ai_models_used: ['GPT-4', 'Claude-3', 'Perplexity-Sonar'],
          cost_estimate: 47.50
        },
        {
          id: '2',
          name: 'Tech Conference Attendees',
          source_type: 'csv_upload',
          total_prospects: 1200,
          processed: 1200,
          enriched: 1147,
          ai_scored: 1147,
          status: 'completed',
          started_at: '2024-01-21T14:00:00Z',
          completed_at: '2024-01-21T16:30:00Z',
          ai_models_used: ['GPT-4', 'Claude-3'],
          cost_estimate: 89.20
        }
      ]);

    } catch (error) {
      console.error('Error loading intelligence data:', error);
      toast.error('Failed to load prospect intelligence data');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkEnrichment = async () => {
    if (selectedProspects.length === 0) {
      toast.error('No prospects selected');
      return;
    }

    try {
      // This would trigger AI enrichment for selected prospects
      toast.success(`AI enrichment started for ${selectedProspects.length} prospects`);
      setSelectedProspects([]);
    } catch (error) {
      toast.error('Failed to start bulk enrichment');
    }
  };

  const handleAIScoring = async (prospectId: string) => {
    try {
      // This would trigger AI scoring for a specific prospect
      toast.success('AI scoring initiated - results in 2-3 minutes');
    } catch (error) {
      toast.error('Failed to start AI scoring');
    }
  };

  const filteredProspects = prospects.filter(prospect => {
    const matchesSearch = prospect.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prospect.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prospect.position.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesScore = scoreFilter === 'all' ||
                        (scoreFilter === 'high' && prospect.ai_score.overall_score >= 80) ||
                        (scoreFilter === 'medium' && prospect.ai_score.overall_score >= 50 && prospect.ai_score.overall_score < 80) ||
                        (scoreFilter === 'low' && prospect.ai_score.overall_score < 50);

    const matchesIntent = intentFilter === 'all' ||
                         intentFilter === prospect.ai_score.urgency_indicator;

    return matchesSearch && matchesScore && matchesIntent;
  });

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Loading AI prospect intelligence...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* AI Intelligence Stats */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.total_prospects.toLocaleString()}</div>
            <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
              <Database className="h-3 w-3" />
              Total Prospects
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.enriched_today}</div>
            <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
              <Sparkles className="h-3 w-3" />
              Enriched Today
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.ai_scored_prospects.toLocaleString()}</div>
            <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
              <Brain className="h-3 w-3" />
              AI Scored
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.high_intent_prospects.toLocaleString()}</div>
            <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
              <Target className="h-3 w-3" />
              High Intent
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-teal-600">{stats.avg_prospect_score}</div>
            <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Avg Score
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-indigo-600">{stats.enrichment_accuracy}%</div>
            <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
              <CheckCircle className="h-3 w-3" />
              AI Accuracy
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="prospects" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="prospects">AI-Scored Prospects ({filteredProspects.length})</TabsTrigger>
          <TabsTrigger value="enrichment">Enrichment Jobs ({enrichmentJobs.length})</TabsTrigger>
          <TabsTrigger value="insights">AI Insights Dashboard</TabsTrigger>
        </TabsList>

        <TabsContent value="prospects" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI-Powered Prospect Intelligence
              </CardTitle>
              <CardDescription>
                Comprehensive AI analysis of prospects with enrichment, scoring, and personalization insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Search and Filters */}
              <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search prospects..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={scoreFilter} onValueChange={setScoreFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Scores</SelectItem>
                    <SelectItem value="high">High Score (80+)</SelectItem>
                    <SelectItem value="medium">Medium Score (50-79)</SelectItem>
                    <SelectItem value="low">Low Score (&lt;50)</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={intentFilter} onValueChange={setIntentFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Intent Levels</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High Intent</SelectItem>
                    <SelectItem value="medium">Medium Intent</SelectItem>
                    <SelectItem value="low">Low Intent</SelectItem>
                  </SelectContent>
                </Select>

                <Button onClick={handleBulkEnrichment} disabled={selectedProspects.length === 0}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Bulk Enrich ({selectedProspects.length})
                </Button>
              </div>

              {/* Prospects List */}
              <div className="space-y-6">
                {filteredProspects.map((prospect) => (
                  <div key={prospect.id} className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start gap-6">
                      <input
                        type="checkbox"
                        className="mt-2"
                        checked={selectedProspects.includes(prospect.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedProspects([...selectedProspects, prospect.id]);
                          } else {
                            setSelectedProspects(selectedProspects.filter(id => id !== prospect.id));
                          }
                        }}
                      />
                      
                      <div className="flex-1">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{prospect.full_name}</h3>
                            <p className="text-sm text-gray-600">{prospect.position} at {prospect.company}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <MapPin className="h-3 w-3 text-gray-400" />
                              <span className="text-xs text-gray-500">{prospect.location}</span>
                              {prospect.ai_enrichment.company_intelligence.employee_count && (
                                <>
                                  <span className="text-gray-300">•</span>
                                  <span className="text-xs text-gray-500">{prospect.ai_enrichment.company_intelligence.employee_count} employees</span>
                                </>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <Badge className={getUrgencyColor(prospect.ai_score.urgency_indicator)}>
                              {prospect.ai_score.urgency_indicator.toUpperCase()} INTENT
                            </Badge>
                            <div className="text-center">
                              <div className={`text-2xl font-bold ${getScoreColor(prospect.ai_score.overall_score)}`}>
                                {prospect.ai_score.overall_score}
                              </div>
                              <div className="text-xs text-gray-500">AI Score</div>
                            </div>
                          </div>
                        </div>

                        {/* AI Scoring Breakdown */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                          <div className="text-center p-2 bg-gray-50 rounded">
                            <div className="text-sm font-semibold text-blue-600">{prospect.ai_score.buying_intent}</div>
                            <div className="text-xs text-gray-600">Buying Intent</div>
                          </div>
                          <div className="text-center p-2 bg-gray-50 rounded">
                            <div className="text-sm font-semibold text-green-600">{prospect.ai_score.engagement_likelihood}</div>
                            <div className="text-xs text-gray-600">Engagement</div>
                          </div>
                          <div className="text-center p-2 bg-gray-50 rounded">
                            <div className="text-sm font-semibold text-purple-600">{prospect.ai_score.conversion_probability}</div>
                            <div className="text-xs text-gray-600">Conversion</div>
                          </div>
                          <div className="text-center p-2 bg-gray-50 rounded">
                            <div className="text-sm font-semibold text-orange-600">{prospect.ai_score.timing_score}</div>
                            <div className="text-xs text-gray-600">Timing</div>
                          </div>
                          <div className="text-center p-2 bg-gray-50 rounded">
                            <div className="text-sm font-semibold text-teal-600">{prospect.ai_score.fit_score}</div>
                            <div className="text-xs text-gray-600">Fit Score</div>
                          </div>
                        </div>

                        {/* AI Insights */}
                        <div className="bg-blue-50 rounded-lg p-4 mb-4">
                          <h4 className="font-medium text-blue-900 flex items-center gap-2 mb-2">
                            <Brain className="h-4 w-4" />
                            AI Recommended Approach
                          </h4>
                          <p className="text-sm text-blue-800">{prospect.ai_insights.recommended_approach}</p>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                            <div>
                              <h5 className="text-xs font-medium text-blue-900 mb-1">Key Talking Points:</h5>
                              <ul className="text-xs text-blue-700 space-y-1">
                                {prospect.ai_insights.key_talking_points.map((point, idx) => (
                                  <li key={idx} className="flex items-start gap-1">
                                    <span className="text-blue-500 mt-0.5">•</span>
                                    {point}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            
                            <div>
                              <h5 className="text-xs font-medium text-blue-900 mb-1">Personalization Hooks:</h5>
                              <ul className="text-xs text-blue-700 space-y-1">
                                {prospect.ai_insights.personalization_hooks.map((hook, idx) => (
                                  <li key={idx} className="flex items-start gap-1">
                                    <span className="text-blue-500 mt-0.5">•</span>
                                    {hook}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>

                        {/* Company Intelligence */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="space-y-2">
                            <h5 className="text-sm font-medium text-gray-900">Company Intelligence</h5>
                            <div className="space-y-1 text-xs text-gray-600">
                              <div>Revenue: {prospect.ai_enrichment.company_intelligence.revenue_range}</div>
                              <div>Stage: {prospect.ai_enrichment.company_intelligence.growth_stage}</div>
                              <div>Funding: {prospect.ai_enrichment.company_intelligence.funding_status}</div>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <h5 className="text-sm font-medium text-gray-900">Engagement Profile</h5>
                            <div className="space-y-1 text-xs text-gray-600">
                              <div>Style: {prospect.ai_enrichment.personality_profile.communication_style}</div>
                              <div>Activity: {prospect.ai_enrichment.engagement_history.activity_level}</div>
                              <div>Best Time: {prospect.ai_insights.optimal_timing}</div>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-4 border-t">
                          <div className="flex items-center gap-2">
                            {prospect.ai_insights.suggested_channels.map((channel) => (
                              <Badge key={channel} variant="outline" className="text-xs">
                                {channel}
                              </Badge>
                            ))}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm">
                              <Eye className="h-3 w-3 mr-1" />
                              Full Profile
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleAIScoring(prospect.id)}>
                              <RefreshCw className="h-3 w-3 mr-1" />
                              Re-score
                            </Button>
                            <Button size="sm">
                              <MessageSquare className="h-3 w-3 mr-1" />
                              AI Message
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {filteredProspects.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <Database className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">No prospects found</p>
                    <p className="text-sm">Try adjusting your filters or search criteria</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="enrichment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-5 w-5" />
                AI Enrichment Jobs
              </CardTitle>
              <CardDescription>
                Monitor and manage AI-powered data enrichment processes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {enrichmentJobs.map((job) => (
                  <div key={job.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-gray-900">{job.name}</h4>
                        <p className="text-sm text-gray-600">
                          {job.source_type.replace('_', ' ').toUpperCase()} • {job.total_prospects} prospects
                        </p>
                      </div>
                      
                      <Badge variant={job.status === 'completed' ? 'default' : job.status === 'failed' ? 'destructive' : 'secondary'}>
                        {job.status.toUpperCase()}
                      </Badge>
                    </div>

                    <div className="space-y-2 mb-3">
                      <div className="flex justify-between text-sm">
                        <span>Processing Progress</span>
                        <span>{job.processed}/{job.total_prospects}</span>
                      </div>
                      <Progress value={(job.processed / job.total_prospects) * 100} className="h-2" />
                      
                      <div className="grid grid-cols-3 gap-4 text-center text-sm">
                        <div>
                          <div className="font-medium text-blue-600">{job.enriched}</div>
                          <div className="text-xs text-gray-600">Enriched</div>
                        </div>
                        <div>
                          <div className="font-medium text-purple-600">{job.ai_scored}</div>
                          <div className="text-xs text-gray-600">AI Scored</div>
                        </div>
                        <div>
                          <div className="font-medium text-green-600">${job.cost_estimate}</div>
                          <div className="text-xs text-gray-600">Est. Cost</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-4">
                        <span>AI Models: {job.ai_models_used.join(', ')}</span>
                        <span>Started: {new Date(job.started_at).toLocaleString()}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-3 w-3 mr-1" />
                          Details
                        </Button>
                        {job.status === 'completed' && (
                          <Button variant="outline" size="sm">
                            <Download className="h-3 w-3 mr-1" />
                            Export
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">AI Performance Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">94.7%</div>
                    <div className="text-sm text-gray-600">Enrichment Accuracy</div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-gray-50 rounded">
                      <div className="text-lg font-bold text-blue-600">73.2</div>
                      <div className="text-xs text-gray-600">Avg AI Score</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded">
                      <div className="text-lg font-bold text-purple-600">8.7%</div>
                      <div className="text-xs text-gray-600">High Intent Rate</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent AI Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="font-medium text-blue-900">Trending: SaaS VPs</div>
                    <div className="text-blue-700">High engagement on Tuesday mornings</div>
                  </div>
                  
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="font-medium text-green-900">Best Performing: Tech Stack Mentions</div>
                    <div className="text-green-700">Messages mentioning existing tools get 34% more responses</div>
                  </div>
                  
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <div className="font-medium text-orange-900">Opportunity: Funding Events</div>
                    <div className="text-orange-700">Companies with recent funding show 67% higher intent</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default ProspectIntelligence;