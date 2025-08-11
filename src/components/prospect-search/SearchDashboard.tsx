// Comprehensive Search Dashboard
// Main dashboard for LinkedIn search management and analytics

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3,
  TrendingUp,
  Users,
  Target,
  DollarSign,
  Clock,
  Award,
  AlertTriangle,
  CheckCircle,
  Zap,
  Eye,
  Settings,
  BookOpen,
  RefreshCw,
  Filter,
  Download,
  Share,
  Calendar,
  MapPin,
  Building2
} from 'lucide-react';
import { SearchConfigurationBuilder } from './SearchConfigurationBuilder';
import { SearchPreviewAnalytics } from './SearchPreviewAnalytics';
import { SavedSearchManager } from './SavedSearchManager';
import { useSearchConfigurations, useSearchHistory, useProspectProfiles } from '@/hooks/useProspectSearch';
import { SearchRecommendationEngine, SearchAnalytics } from '@/services/search-recommendation-engine';
import { LinkedInSearchParams, SearchUrlResult } from '@/services/linkedin-url-generator';
import { SearchType, SearchConfiguration } from '@/types/prospect-search';
import { toast } from 'sonner';

interface SearchDashboardProps {
  workspaceId: string;
  userId: string;
  className?: string;
}

interface DashboardStats {
  totalSearches: number;
  activeSearches: number;
  totalProspects: number;
  avgResponseRate: number;
  totalBudgetUsed: number;
  monthlyBudget: number;
  topPerformingSearch?: SearchConfiguration;
  recentActivity: Array<{
    id: string;
    type: 'search' | 'prospect' | 'campaign';
    description: string;
    timestamp: string;
    status: 'success' | 'warning' | 'error';
  }>;
}

export function SearchDashboard({
  workspaceId,
  userId,
  className
}: SearchDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'builder' | 'analytics' | 'saved'>('overview');
  const [selectedSearchType, setSelectedSearchType] = useState<SearchType>('basic-search');
  const [currentAnalytics, setCurrentAnalytics] = useState<SearchAnalytics | null>(null);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Hooks
  const { configurations, loading: configLoading } = useSearchConfigurations(workspaceId);
  const { history, loading: historyLoading } = useSearchHistory(workspaceId);
  const { prospects, loading: prospectsLoading } = useProspectProfiles(workspaceId);

  // Load dashboard data
  useEffect(() => {
    const loadDashboardStats = async () => {
      setIsLoading(true);
      
      try {
        // Calculate statistics from loaded data
        const totalSearches = configurations.length;
        const activeSearches = configurations.filter(c => c.status === 'active').length;
        const totalProspects = prospects.length;
        
        // Find top performing search (most results)
        const topPerformingSearch = configurations.reduce((top, current) => 
          !top || current.results_count > top.results_count ? current : top
        , undefined as SearchConfiguration | undefined);

        // Mock recent activity (in real app, this would come from API)
        const recentActivity = [
          {
            id: '1',
            type: 'search' as const,
            description: 'New search "Tech Executives - SF" completed',
            timestamp: '2 hours ago',
            status: 'success' as const
          },
          {
            id: '2', 
            type: 'prospect' as const,
            description: '25 new prospects added from LinkedIn search',
            timestamp: '3 hours ago',
            status: 'success' as const
          },
          {
            id: '3',
            type: 'search' as const,
            description: 'Search budget 80% utilized this month',
            timestamp: '1 day ago',
            status: 'warning' as const
          }
        ];

        setDashboardStats({
          totalSearches,
          activeSearches,
          totalProspects,
          avgResponseRate: 0.08, // Mock data
          totalBudgetUsed: 750, // Mock data
          monthlyBudget: 1000, // Mock data
          topPerformingSearch,
          recentActivity
        });
      } catch (error) {
        console.error('Error loading dashboard stats:', error);
        toast.error('Failed to load dashboard statistics');
      } finally {
        setIsLoading(false);
      }
    };

    if (!configLoading && !historyLoading && !prospectsLoading) {
      loadDashboardStats();
    }
  }, [configurations, history, prospects, configLoading, historyLoading, prospectsLoading]);

  // Handle configuration changes in builder
  const handleConfigurationChange = (params: LinkedInSearchParams, urlResult: SearchUrlResult) => {
    if (urlResult.isValid) {
      const analytics = SearchRecommendationEngine.analyzeSearch(
        params,
        selectedSearchType,
        configurations
      );
      setCurrentAnalytics(analytics);
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return CheckCircle;
      case 'warning': return AlertTriangle;
      case 'error': return AlertTriangle;
      default: return CheckCircle;
    }
  };

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-64 bg-gray-200 rounded"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">LinkedIn Search Dashboard</h1>
          <p className="text-gray-600">Manage your prospect search campaigns and analytics</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="builder" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Search Builder
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="saved" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Saved Searches
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          {dashboardStats && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Searches</p>
                        <p className="text-2xl font-bold">{dashboardStats.totalSearches}</p>
                      </div>
                      <div className="p-2 bg-blue-100 rounded">
                        <Target className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {dashboardStats.activeSearches} active
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Prospects</p>
                        <p className="text-2xl font-bold">{dashboardStats.totalProspects.toLocaleString()}</p>
                      </div>
                      <div className="p-2 bg-green-100 rounded">
                        <Users className="h-5 w-5 text-green-600" />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      +12% this month
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Response Rate</p>
                        <p className="text-2xl font-bold">{(dashboardStats.avgResponseRate * 100).toFixed(1)}%</p>
                      </div>
                      <div className="p-2 bg-purple-100 rounded">
                        <TrendingUp className="h-5 w-5 text-purple-600" />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Above industry avg
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Budget Used</p>
                        <p className="text-2xl font-bold">${dashboardStats.totalBudgetUsed}</p>
                      </div>
                      <div className="p-2 bg-orange-100 rounded">
                        <DollarSign className="h-5 w-5 text-orange-600" />
                      </div>
                    </div>
                    <Progress 
                      value={(dashboardStats.totalBudgetUsed / dashboardStats.monthlyBudget) * 100} 
                      className="mt-2 h-1" 
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {Math.round((dashboardStats.totalBudgetUsed / dashboardStats.monthlyBudget) * 100)}% of ${dashboardStats.monthlyBudget}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Budget Alert */}
              {(dashboardStats.totalBudgetUsed / dashboardStats.monthlyBudget) > 0.8 && (
                <Alert className="border-amber-200 bg-amber-50">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800">
                    <strong>Budget Warning:</strong> You've used {Math.round((dashboardStats.totalBudgetUsed / dashboardStats.monthlyBudget) * 100)}% of your monthly budget. 
                    Consider optimizing your searches or increasing your budget limit.
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Top Performing Search */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Award className="h-5 w-5" />
                      Top Performing Search
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {dashboardStats.topPerformingSearch ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium">{dashboardStats.topPerformingSearch.name}</h3>
                            <p className="text-sm text-gray-600 capitalize">
                              {dashboardStats.topPerformingSearch.search_type.replace('-', ' ')}
                            </p>
                          </div>
                          <Badge variant="default">
                            {dashboardStats.topPerformingSearch.results_count.toLocaleString()} results
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Status</span>
                            <div className="font-medium capitalize">
                              {dashboardStats.topPerformingSearch.status}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-500">Last Run</span>
                            <div className="font-medium">
                              {dashboardStats.topPerformingSearch.last_run_at 
                                ? new Date(dashboardStats.topPerformingSearch.last_run_at).toLocaleDateString()
                                : 'Never'
                              }
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-500">Created</span>
                            <div className="font-medium">
                              {new Date(dashboardStats.topPerformingSearch.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6 text-gray-500">
                        <Target className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                        <p>No searches completed yet</p>
                        <p className="text-sm">Run your first search to see performance data</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {dashboardStats.recentActivity.map(activity => {
                        const StatusIcon = getStatusIcon(activity.status);
                        return (
                          <div key={activity.id} className="flex items-start gap-3 p-2 rounded hover:bg-gray-50">
                            <StatusIcon className={`h-4 w-4 mt-0.5 ${getStatusColor(activity.status)}`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{activity.description}</p>
                              <p className="text-xs text-gray-500">{activity.timestamp}</p>
                            </div>
                          </div>
                        );
                      })}
                      
                      {dashboardStats.recentActivity.length === 0 && (
                        <div className="text-center py-4 text-gray-500">
                          <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                          <p className="text-sm">No recent activity</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* Search Builder Tab */}
        <TabsContent value="builder" className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2">
              <SearchConfigurationBuilder
                searchType={selectedSearchType}
                onConfigurationChange={handleConfigurationChange}
                showPreview={true}
                className=""
              />
            </div>
            
            <div className="space-y-6">
              {/* Search Type Selector */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Search Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <select
                    value={selectedSearchType}
                    onChange={(e) => setSelectedSearchType(e.target.value as SearchType)}
                    className="w-full p-2 border rounded-md text-sm"
                  >
                    <option value="basic-search">Basic Search</option>
                    <option value="sales-navigator">Sales Navigator</option>
                    <option value="recruiter-search">Recruiter Search</option>
                    <option value="company-follower">Company Followers</option>
                    <option value="post-engagement">Post Engagement</option>
                    <option value="group-search">Group Members</option>
                    <option value="event-search">Event Attendees</option>
                    <option value="people-you-know">Network Suggestions</option>
                  </select>
                </CardContent>
              </Card>

              {/* Analytics Preview */}
              {currentAnalytics && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Search Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-500">Score</span>
                        <div className="font-bold text-lg">{currentAnalytics.score}%</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Difficulty</span>
                        <div className="font-medium capitalize">{currentAnalytics.difficulty}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Expected Results</span>
                        <div className="font-medium">{currentAnalytics.expectedResults.toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Quality Score</span>
                        <div className="font-medium">{currentAnalytics.qualityScore}%</div>
                      </div>
                    </div>
                    
                    {currentAnalytics.recommendations.slice(0, 2).map(rec => (
                      <Alert key={rec.id} className="text-sm">
                        <Zap className="h-3 w-3" />
                        <AlertDescription>
                          <strong>{rec.title}:</strong> {rec.description}
                        </AlertDescription>
                      </Alert>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <SearchPreviewAnalytics
            showVariations={true}
            showOptimization={true}
            className=""
          />
        </TabsContent>

        {/* Saved Searches Tab */}
        <TabsContent value="saved" className="space-y-6">
          <SavedSearchManager
            workspaceId={workspaceId}
            userId={userId}
            showExecuteActions={true}
            className=""
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}