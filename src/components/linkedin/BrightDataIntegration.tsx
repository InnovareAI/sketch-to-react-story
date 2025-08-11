import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { 
  Search, 
  Globe, 
  Users, 
  Download,
  Eye,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Database,
  Target
} from 'lucide-react';
import { secureBrightDataService, type LinkedInScrapedProfile } from '@/services/brightdata-proxy-secure';

interface BrightDataJob {
  id: string;
  type: 'profile_scrape' | 'profile_search' | 'bulk_scrape';
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  created_at: string;
  completed_at?: string;
  results_count: number;
  target_url?: string;
  search_params?: Record<string, unknown>;
  error_message?: string;
}

export function BrightDataIntegration() {
  const [profileUrl, setProfileUrl] = useState('');
  const [searchKeywords, setSearchKeywords] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [searchCompany, setSearchCompany] = useState('');
  const [bulkUrls, setBulkUrls] = useState('');
  const [proxyCountry, setProxyCountry] = useState('US');
  const [proxyState, setProxyState] = useState('');
  
  const [jobs, setJobs] = useState<BrightDataJob[]>([]);
  const [scrapedProfiles, setScrapedProfiles] = useState<LinkedInScrapedProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [proxyStatus, setProxyStatus] = useState<{ success: boolean; ip: string; country: string } | null>(null);

  // Test proxy connection
  const testProxyConnection = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await secureBrightDataService.testProxyConnection(proxyCountry);
      setProxyStatus(result);
      
      if (!result.success) {
        setError(`Proxy test failed: ${result.error}`);
      }
    } catch (err) {
      setError(`Proxy test error: ${err.message}`);
      setProxyStatus(null);
    } finally {
      setLoading(false);
    }
  };

  // Scrape single LinkedIn profile
  const scrapeProfile = async () => {
    if (!profileUrl) {
      setError('Please enter a LinkedIn profile URL');
      return;
    }

    setLoading(true);
    setError(null);
    
    const jobId = `profile_${Date.now()}`;
    const newJob: BrightDataJob = {
      id: jobId,
      type: 'profile_scrape',
      status: 'running',
      progress: 0,
      created_at: new Date().toISOString(),
      results_count: 0,
      target_url: profileUrl
    };
    
    setJobs(prev => [newJob, ...prev]);

    try {
      const profile = await secureBrightDataService.scrapeLinkedInProfile(profileUrl, {
        country: proxyCountry,
        state: proxyState || undefined
      });

      setScrapedProfiles(prev => [profile, ...prev]);
      
      // Update job status
      setJobs(prev => prev.map(job => 
        job.id === jobId 
          ? { ...job, status: 'completed', progress: 100, results_count: 1, completed_at: new Date().toISOString() }
          : job
      ));
      
      setProfileUrl('');
    } catch (err) {
      setError(`Profile scraping failed: ${err.message}`);
      
      // Update job status
      setJobs(prev => prev.map(job => 
        job.id === jobId 
          ? { ...job, status: 'failed', error_message: err.message }
          : job
      ));
    } finally {
      setLoading(false);
    }
  };

  // Search LinkedIn profiles
  const searchProfiles = async () => {
    if (!searchKeywords) {
      setError('Please enter search keywords');
      return;
    }

    setLoading(true);
    setError(null);
    
    const jobId = `search_${Date.now()}`;
    const searchParams = {
      keywords: searchKeywords,
      location: searchLocation,
      company: searchCompany,
      limit: 10,
      proxyCountry,
      proxyState: proxyState || undefined
    };
    
    const newJob: BrightDataJob = {
      id: jobId,
      type: 'profile_search',
      status: 'running',
      progress: 0,
      created_at: new Date().toISOString(),
      results_count: 0,
      search_params: searchParams
    };
    
    setJobs(prev => [newJob, ...prev]);

    try {
      const profiles = await secureBrightDataService.searchLinkedInProfiles(searchParams);
      
      setScrapedProfiles(prev => [...profiles, ...prev]);
      
      // Update job status
      setJobs(prev => prev.map(job => 
        job.id === jobId 
          ? { ...job, status: 'completed', progress: 100, results_count: profiles.length, completed_at: new Date().toISOString() }
          : job
      ));
      
      // Clear search form
      setSearchKeywords('');
      setSearchLocation('');
      setSearchCompany('');
    } catch (err) {
      setError(`Profile search failed: ${err.message}`);
      
      // Update job status
      setJobs(prev => prev.map(job => 
        job.id === jobId 
          ? { ...job, status: 'failed', error_message: err.message }
          : job
      ));
    } finally {
      setLoading(false);
    }
  };

  // Export scraped data
  const exportData = () => {
    if (scrapedProfiles.length === 0) {
      setError('No data to export');
      return;
    }

    const dataStr = JSON.stringify(scrapedProfiles, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `linkedin_data_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const getJobStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'running': return <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />;
      default: return <RefreshCw className="w-4 h-4 text-gray-400" />;
    }
  };

  const getJobStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'running': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Database className="w-6 h-6 text-orange-600" />
            Bright Data LinkedIn Scraping
          </h2>
          <p className="text-gray-600 mt-1">
            Advanced LinkedIn data collection with residential proxy network
          </p>
        </div>
        
        {scrapedProfiles.length > 0 && (
          <Button onClick={exportData} variant="outline" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export Data ({scrapedProfiles.length})
          </Button>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Proxy Configuration & Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Proxy Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="proxy-country">Target Country</Label>
              <Input
                id="proxy-country"
                value={proxyCountry}
                onChange={(e) => setProxyCountry(e.target.value)}
                placeholder="US, GB, DE, FR, etc."
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="proxy-state">State (US only)</Label>
              <Input
                id="proxy-state"
                value={proxyState}
                onChange={(e) => setProxyState(e.target.value)}
                placeholder="NY, CA, TX, etc."
                className="mt-1"
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={testProxyConnection}
                disabled={loading}
                className="w-full"
                variant="outline"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Target className="w-4 h-4 mr-2" />}
                Test Connection
              </Button>
            </div>
          </div>
          
          {proxyStatus && (
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              {proxyStatus.success ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-500" />
              )}
              <span className="text-sm">
                {proxyStatus.success 
                  ? `🏠 Residential IP ${proxyStatus.country} (${proxyStatus.ip})`
                  : 'Connection failed'
                }
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scraping Tools */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Single Profile Scraper */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Single Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="profile-url">LinkedIn Profile URL</Label>
              <Input
                id="profile-url"
                value={profileUrl}
                onChange={(e) => setProfileUrl(e.target.value)}
                placeholder="https://linkedin.com/in/..."
                className="mt-1"
              />
            </div>
            <Button 
              onClick={scrapeProfile}
              disabled={loading || !profileUrl}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
              Scrape Profile
            </Button>
          </CardContent>
        </Card>

        {/* Profile Search */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Profile Search
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="search-keywords">Keywords</Label>
              <Input
                id="search-keywords"
                value={searchKeywords}
                onChange={(e) => setSearchKeywords(e.target.value)}
                placeholder="Software Engineer, Marketing..."
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="search-location">Location</Label>
              <Input
                id="search-location"
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                placeholder="New York, London..."
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="search-company">Company</Label>
              <Input
                id="search-company"
                value={searchCompany}
                onChange={(e) => setSearchCompany(e.target.value)}
                placeholder="Google, Microsoft..."
                className="mt-1"
              />
            </div>
            <Button 
              onClick={searchProfiles}
              disabled={loading || !searchKeywords}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Search className="w-4 h-4 mr-2" />}
              Search Profiles
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Jobs Status */}
      {jobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Scraping Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {jobs.slice(0, 5).map((job) => (
                <div key={job.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getJobStatusIcon(job.status)}
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {job.type === 'profile_scrape' && '👤 Profile Scrape'}
                        {job.type === 'profile_search' && '🔍 Profile Search'}
                        {job.type === 'bulk_scrape' && '📊 Bulk Scrape'}
                      </p>
                      <p className="text-xs text-gray-600">
                        {job.target_url && `${job.target_url.substring(0, 50)}...`}
                        {job.search_params && `${job.search_params.keywords} in ${job.search_params.location || 'Any location'}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Badge className={getJobStatusColor(job.status)}>
                      {job.status}
                    </Badge>
                    <div className="text-xs text-gray-500">
                      Results: {job.results_count}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scraped Profiles */}
      {scrapedProfiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Scraped Profiles ({scrapedProfiles.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {scrapedProfiles.slice(0, 10).map((profile) => (
                <div key={profile.profile_url} className="flex items-center space-x-4 p-4 border rounded-lg">
                  {profile.profile_image_url ? (
                    <img 
                      src={profile.profile_image_url} 
                      alt={profile.full_name}
                      className="w-12 h-12 rounded-full"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{profile.full_name}</h3>
                    <p className="text-sm text-gray-600">{profile.headline}</p>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-xs text-gray-500">{profile.location}</span>
                      <span className="text-xs text-gray-500">{profile.current_company}</span>
                      <Badge variant="outline" className="text-xs">
                        🏠 {profile.proxy_info.country} {profile.proxy_info.ip}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}