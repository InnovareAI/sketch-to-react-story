import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft,
  Search,
  Target,
  Users,
  UserPlus,
  Building2,
  Upload,
  MessageSquare,
  Calendar,
  FileText,
  Plus,
  CheckCircle,
  Link,
  AlertCircle,
  Download,
  X,
  Settings,
  Eye,
  BookOpen,
  Zap,
  History
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from '@/contexts/AuthContext';
import { useSearchConfigurations, useProspectProfiles, useSearchExecution, useCsvUpload, useCampaignAssignments } from '@/hooks/useProspectSearch';
import { ProspectSearchService } from '@/services/prospect-search';
import { SearchConfigurationBuilder } from '@/components/prospect-search/SearchConfigurationBuilder';
import { SearchPreviewAnalytics } from '@/components/prospect-search/SearchPreviewAnalytics';
import { SavedSearchManager } from '@/components/prospect-search/SavedSearchManager';
import { LinkedInUrlGenerator, LinkedInSearchParams, SearchUrlResult, linkedInUrlUtils } from '@/services/linkedin-url-generator';
import type { SearchType as DatabaseSearchType, SearchMethod as DatabaseSearchMethod, CreateSearchConfigurationRequest, ProspectProfileInsert, SearchConfiguration } from '@/types/prospect-search';

type SearchTypeUI = {
  id: DatabaseSearchType;
  name: string;
  description: string;
  icon: any;
  color: string;
  category: 'recommended' | 'advanced';
  methods: SearchMethodUI[];
};

type SearchMethodUI = {
  id: DatabaseSearchMethod;
  name: string;
  description: string;
  icon: any;
  color: string;
  active?: boolean;
};

type ProspectData = {
  name: string;
  title: string;
  company: string;
  location?: string;
  email?: string;
  linkedin_url?: string;
  phone?: string;
  source: 'url_search' | 'csv_upload' | 'linkedin_enriched';
};

type CsvUploadError = {
  row: number;
  field: string;
  message: string;
};

export default function ProspectSearch() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [selectedSearchType, setSelectedSearchType] = useState<SearchTypeUI | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<DatabaseSearchMethod | null>(null);
  const [linkedInUrl, setLinkedInUrl] = useState("");
  const [searchResults, setSearchResults] = useState<ProspectData[]>([]);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Enhanced search configuration state
  const [activeTab, setActiveTab] = useState<'search' | 'builder' | 'analytics' | 'saved'>('search');
  const [currentSearchParams, setCurrentSearchParams] = useState<LinkedInSearchParams>({});
  const [currentUrlResult, setCurrentUrlResult] = useState<SearchUrlResult | null>(null);
  const [selectedSavedSearch, setSelectedSavedSearch] = useState<SearchConfiguration | null>(null);
  const [isProcessingCsv, setIsProcessingCsv] = useState(false);
  const [csvErrors, setCsvErrors] = useState<CsvUploadError[]>([]);

  const campaignName = searchParams.get('campaign') || 'Current Campaign';
  const workspaceId = user?.workspace_id || '';
  const userId = user?.id || '';

  // Database hooks
  const { configurations, createConfiguration } = useSearchConfigurations(workspaceId);
  const { prospects, bulkCreateProspects } = useProspectProfiles(workspaceId);
  const { isSearching, executeSearch } = useSearchExecution();
  const { uploadSession, isUploading, isProcessing, validationErrors, createUploadSession, processUpload, validateCsvData } = useCsvUpload(workspaceId, userId);
  const { assignProspectsToCampaign } = useCampaignAssignments(workspaceId, userId);

  const searchTypes: SearchTypeUI[] = [
    {
      id: 'basic-search' as DatabaseSearchType,
      name: 'Basic search',
      description: 'Here you can upload a list of leads from LinkedIn\'s basic search functionality.',
      icon: Search,
      color: 'bg-blue-100 text-blue-600',
      category: 'recommended',
      methods: [
        {
          id: 'url-search',
          name: 'New URL search',
          description: 'Initiate a new search',
          icon: Search,
          color: 'bg-blue-100 text-blue-600',
          active: true
        },
        {
          id: 'csv-upload',
          name: 'Upload CSV',
          description: 'Upload leads from CSV file',
          icon: Upload,
          color: 'bg-orange-100 text-orange-600'
        },
        {
          id: 'connected-apps',
          name: 'Connected Apps',
          description: 'Add contacts from your connected apps',
          icon: Building2,
          color: 'bg-purple-100 text-purple-600'
        },
        {
          id: 'paste-url',
          name: 'Paste LinkedIn URL',
          description: 'Find prospects in LinkedIn, copy link and paste it here.',
          icon: Link,
          color: 'bg-green-100 text-green-600'
        }
      ]
    },
    {
      id: 'sales-navigator',
      name: 'Sales navigator search',
      description: 'If you have a Sales Navigator subscription you can upload your lead list from your premium search here.',
      icon: Target,
      color: 'bg-indigo-100 text-indigo-600',
      category: 'recommended',
      methods: [
        {
          id: 'url-search',
          name: 'New URL search',
          description: 'Initiate a new search',
          icon: Search,
          color: 'bg-blue-100 text-blue-600',
          active: true
        },
        {
          id: 'csv-upload',
          name: 'Upload CSV',
          description: 'Upload leads from CSV file',
          icon: Upload,
          color: 'bg-orange-100 text-orange-600'
        },
        {
          id: 'connected-apps',
          name: 'Connected Apps',
          description: 'Add contacts from your connected apps',
          icon: Building2,
          color: 'bg-purple-100 text-purple-600'
        },
        {
          id: 'paste-url',
          name: 'Paste LinkedIn URL',
          description: 'Find prospects in LinkedIn, copy link and paste it here.',
          icon: Link,
          color: 'bg-green-100 text-green-600'
        }
      ]
    },
    {
      id: 'recruiter-search',
      name: 'Recruiter search',
      description: 'If you have a Recruiter or Recruiter lite subscription you can upload your lead list from your premium search here.',
      icon: UserPlus,
      color: 'bg-green-100 text-green-600',
      category: 'recommended',
      methods: [
        {
          id: 'url-search',
          name: 'New URL search',
          description: 'Initiate a new search',
          icon: Search,
          color: 'bg-blue-100 text-blue-600',
          active: true
        },
        {
          id: 'csv-upload',
          name: 'Upload CSV',
          description: 'Upload leads from CSV file',
          icon: Upload,
          color: 'bg-orange-100 text-orange-600'
        }
      ]
    },
    {
      id: 'company-follower',
      name: 'Company follower search',
      description: 'If you own a company on LinkedIn you can scrape the people who follow your company and outreach them.',
      icon: Building2,
      color: 'bg-purple-100 text-purple-600',
      category: 'advanced',
      methods: [
        {
          id: 'company-select',
          name: 'Select Company',
          description: 'Choose your company page',
          icon: Building2,
          color: 'bg-purple-100 text-purple-600',
          active: true
        }
      ]
    },
    {
      id: 'csv-import',
      name: 'Imported by CSV',
      description: 'Here you can upload a lead list from a CSV. It is important to include a LinkedIn profile URL within the file.',
      icon: Upload,
      color: 'bg-orange-100 text-orange-600',
      category: 'advanced',
      methods: [
        {
          id: 'csv-upload',
          name: 'Upload CSV',
          description: 'Upload leads from CSV file',
          icon: Upload,
          color: 'bg-orange-100 text-orange-600',
          active: true
        }
      ]
    },
    {
      id: 'post-engagement',
      name: 'Post engagement',
      description: 'You can take any public post off LinkedIn and scrape those who have interacted with it. If you post a poll on your own LinkedIn you are also able to scrape those who have voted, and how they have voted.',
      icon: MessageSquare,
      color: 'bg-pink-100 text-pink-600',
      category: 'advanced',
      methods: [
        {
          id: 'post-url',
          name: 'Post URL',
          description: 'Paste LinkedIn post URL',
          icon: Link,
          color: 'bg-pink-100 text-pink-600',
          active: true
        }
      ]
    },
    {
      id: 'group-search',
      name: 'Group search',
      description: 'If you are a part of a LinkedIn group you are able to scrape the rest of the members of that group to outreach.',
      icon: Users,
      color: 'bg-teal-100 text-teal-600',
      category: 'advanced',
      methods: [
        {
          id: 'group-select',
          name: 'Select Group',
          description: 'Choose LinkedIn group',
          icon: Users,
          color: 'bg-teal-100 text-teal-600',
          active: true
        }
      ]
    },
    {
      id: 'event-search',
      name: 'Event search',
      description: 'If you host, or attend an event on LinkedIn you can scrape the rest of the attendees for outreach.',
      icon: Calendar,
      color: 'bg-yellow-100 text-yellow-600',
      category: 'advanced',
      methods: [
        {
          id: 'event-url',
          name: 'Event URL',
          description: 'Paste LinkedIn event URL',
          icon: Link,
          color: 'bg-yellow-100 text-yellow-600',
          active: true
        }
      ]
    },
    {
      id: 'people-you-know',
      name: 'People you may know',
      description: 'LinkedIn will suggest a list of people you may know. To automatically connect with the list you should simply set a name for the search and Innovareai will load the list from your My Network list in LinkedIn.',
      icon: UserPlus,
      color: 'bg-cyan-100 text-cyan-600',
      category: 'advanced',
      methods: [
        {
          id: 'network-sync',
          name: 'Sync Network',
          description: 'Load from My Network',
          icon: UserPlus,
          color: 'bg-cyan-100 text-cyan-600',
          active: true
        }
      ]
    }
  ];

  const handleStartSearch = async () => {
    if (!linkedInUrl.trim()) return;
    
    // Validate URL first
    const validation = linkedInUrlUtils.validateSearchUrl(linkedInUrl, selectedSearchType?.id.replace('-search', '').replace('-', ' '));
    if (!validation.isValid) {
      toast.error(`Invalid LinkedIn URL: ${validation.errors.join(', ')}`);
      return;
    }
    
    try {
      // Create search configuration if using URL builder
      if (currentUrlResult?.isValid) {
        const searchConfig = await createConfiguration({
          name: `Search - ${new Date().toLocaleDateString()}`,
          search_type: selectedSearchType!.id,
          search_method: selectedMethod || 'url-search',
          parameters: currentSearchParams,
          filters: {}
        }, userId);
        
        // Execute the search
        const result = await executeSearch({
          search_configuration_id: searchConfig.id,
          searchUrl: linkedInUrl,
          brightDataOptions: {
            maxResults: 50,
            country: currentSearchParams.country,
            filters: {
              location: currentSearchParams.location ? [currentSearchParams.location] : undefined,
              industry: currentSearchParams.industryUrns,
              currentCompany: currentSearchParams.currentCompany,
              jobTitle: currentSearchParams.title ? [currentSearchParams.title] : undefined
            }
          }
        });
        
        if (result.status === 'started') {
          toast.success(`Search started! Tracking ID: ${result.search_history_id}`);
          
          // Show budget status if relevant
          if (result.budget_status === 'warning') {
            toast.warning('Budget utilization is high - monitor usage carefully');
          }
          
          // Mock results for immediate feedback
          const mockResults: ProspectData[] = [
            { name: 'John Doe', title: 'CEO', company: 'TechCorp', location: 'San Francisco', source: 'url_search' },
            { name: 'Jane Smith', title: 'CTO', company: 'InnovateLabs', location: 'Austin', source: 'url_search' },
            { name: 'Mike Johnson', title: 'VP Sales', company: 'GrowthCo', location: 'New York', source: 'url_search' }
          ];
          setSearchResults(mockResults);
        }
      } else {
        // Fallback to simple mock search
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const mockResults: ProspectData[] = [
          { name: 'John Doe', title: 'CEO', company: 'TechCorp', location: 'San Francisco', source: 'url_search' },
          { name: 'Jane Smith', title: 'CTO', company: 'InnovateLabs', location: 'Austin', source: 'url_search' },
          { name: 'Mike Johnson', title: 'VP Sales', company: 'GrowthCo', location: 'New York', source: 'url_search' }
        ];
        setSearchResults(mockResults);
      }
    } catch (error) {
      console.error('Search execution error:', error);
      toast.error('Failed to execute search');
    }
  };

  // CSV Parsing Functions
  const parseCsvFile = async (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const csv = e.target?.result as string;
          const lines = csv.split('\n').map(line => line.trim()).filter(line => line);
          
          if (lines.length < 2) {
            reject(new Error('CSV file must have at least a header row and one data row'));
            return;
          }

          const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
          const data = lines.slice(1).map((line, index) => {
            const values = line.split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
            const row: any = { _rowNumber: index + 2 }; // +2 because we start from line 2
            headers.forEach((header, i) => {
              row[header] = values[i] || '';
            });
            return row;
          });

          resolve(data);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read CSV file'));
      reader.readAsText(file);
    });
  };

  const validateCsvDataLocal = (data: any[]): { prospects: ProspectData[]; errors: CsvUploadError[] } => {
    const prospects: ProspectData[] = [];
    const errors: CsvUploadError[] = [];
    
    // Required field mappings
    const fieldMappings = {
      name: ['name', 'full_name', 'fullname', 'full name'],
      title: ['title', 'position', 'job_title', 'job title', 'role'],
      company: ['company', 'company_name', 'company name', 'organization'],
      location: ['location', 'city', 'region', 'country'],
      email: ['email', 'email_address', 'email address'],
      linkedin_url: ['linkedin_url', 'linkedin', 'linkedin_profile', 'profile_url', 'linkedin url'],
      phone: ['phone', 'phone_number', 'phone number', 'mobile']
    };

    data.forEach((row, index) => {
      const prospect: Partial<ProspectData> = { source: 'csv_upload' };
      
      // Map fields using flexible field names
      Object.entries(fieldMappings).forEach(([targetField, possibleNames]) => {
        const foundField = possibleNames.find(name => row[name] && row[name].trim());
        if (foundField) {
          (prospect as any)[targetField] = row[foundField].trim();
        }
      });

      // Validate required fields
      if (!prospect.name) {
        errors.push({
          row: row._rowNumber,
          field: 'name',
          message: 'Name is required'
        });
      }
      
      if (!prospect.company) {
        errors.push({
          row: row._rowNumber,
          field: 'company',
          message: 'Company is required'
        });
      }

      // Validate LinkedIn URL format if provided
      if (prospect.linkedin_url && !prospect.linkedin_url.includes('linkedin.com')) {
        errors.push({
          row: row._rowNumber,
          field: 'linkedin_url',
          message: 'LinkedIn URL must contain "linkedin.com"'
        });
      }

      // Validate email format if provided
      if (prospect.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(prospect.email)) {
        errors.push({
          row: row._rowNumber,
          field: 'email',
          message: 'Invalid email format'
        });
      }

      // If required fields are present, add to prospects
      if (prospect.name && prospect.company) {
        prospects.push(prospect as ProspectData);
      }
    });

    return { prospects, errors };
  };

  const handleCsvUpload = async (file: File) => {
    if (!file) return;

    setIsProcessingCsv(true);
    setCsvErrors([]);
    
    try {
      // Parse CSV file
      const rawData = await parseCsvFile(file);
      
      // Validate and clean data
      const { prospects, errors } = validateCsvDataLocal(rawData);
      
      setCsvData(rawData);
      setCsvErrors(errors);
      
      if (errors.length > 0) {
        toast.error(`Found ${errors.length} validation errors in CSV file`);
      }
      
      if (prospects.length > 0) {
        // Check if we have LinkedIn URLs for enrichment
        const prospectsWithLinkedIn = prospects.filter(p => p.linkedin_url);
        
        if (prospectsWithLinkedIn.length > 0) {
          toast.info(`Found ${prospectsWithLinkedIn.length} prospects with LinkedIn URLs - enrichment available`);
        }
        
        setSearchResults(prospects);
        toast.success(`Successfully loaded ${prospects.length} prospects from CSV`);
      } else {
        toast.warning('No valid prospects found in CSV file');
      }
      
    } catch (error) {
      console.error('CSV processing error:', error);
      toast.error(`Failed to process CSV: ${(error as Error).message}`);
    } finally {
      setIsProcessingCsv(false);
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.csv')) {
        toast.error('Please select a CSV file');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('File size must be less than 5MB');
        return;
      }
      
      setCsvFile(file);
      handleCsvUpload(file);
    }
  };

  const downloadSampleCsv = () => {
    const sampleData = `name,title,company,location,email,linkedin_url
John Doe,CEO,TechCorp,San Francisco,john@techcorp.com,https://linkedin.com/in/johndoe
Jane Smith,CTO,StartupXYZ,Austin,jane@startup.com,https://linkedin.com/in/janesmith
Mike Johnson,VP Sales,GrowthCo,New York,mike@growth.co,https://linkedin.com/in/mikejohnson`;
    
    const blob = new Blob([sampleData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'prospect_sample.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast.success('Sample CSV downloaded');
  };
  
  // Handle search configuration changes
  const handleConfigurationChange = (params: LinkedInSearchParams, urlResult: SearchUrlResult) => {
    setCurrentSearchParams(params);
    setCurrentUrlResult(urlResult);
    if (urlResult.isValid) {
      setLinkedInUrl(urlResult.url);
    }
  };
  
  // Handle URL generation
  const handleUrlGenerated = (url: string) => {
    setLinkedInUrl(url);
  };
  
  // Handle saved search selection
  const handleSavedSearchSelect = (config: SearchConfiguration) => {
    setSelectedSavedSearch(config);
    
    // Find corresponding search type UI
    const searchTypeUI = searchTypes.find(st => st.id === config.search_type);
    if (searchTypeUI) {
      setSelectedSearchType(searchTypeUI);
      setSelectedMethod(config.search_method);
      
      // Try to generate URL from saved parameters
      const params = config.parameters as LinkedInSearchParams;
      setCurrentSearchParams(params);
      
      // Generate URL based on search type
      let urlResult: SearchUrlResult;
      switch (config.search_type) {
        case 'basic-search':
          urlResult = LinkedInUrlGenerator.generateBasicSearchUrl(params);
          break;
        case 'sales-navigator':
          urlResult = LinkedInUrlGenerator.generateSalesNavigatorUrl(params);
          break;
        case 'recruiter-search':
          urlResult = LinkedInUrlGenerator.generateRecruiterSearchUrl(params);
          break;
        default:
          urlResult = LinkedInUrlGenerator.generateBasicSearchUrl(params);
      }
      
      if (urlResult.isValid) {
        setLinkedInUrl(urlResult.url);
        setCurrentUrlResult(urlResult);
      }
      
      toast.success(`Loaded search configuration: ${config.name}`);
    }
  };
  
  // Handle saved search execution
  const handleSavedSearchExecute = async (config: SearchConfiguration) => {
    try {
      const result = await executeSearch({
        search_configuration_id: config.id,
        execution_type: 'manual'
      });
      
      if (result.status === 'started') {
        toast.success(`Search "${config.name}" started successfully!`);
      } else {
        toast.error(`Failed to start search: ${result.message}`);
      }
    } catch (error) {
      toast.error('Failed to execute saved search');
    }
  };

  if (selectedSearchType) {
    return (
      <div className="flex-1 bg-gray-50">
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <Button variant="ghost" onClick={() => setSelectedSearchType(null)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Search Types
              </Button>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900">{selectedSearchType.name}</h1>
                <p className="text-gray-600">Create new search for {campaignName}</p>
              </div>
              {selectedSavedSearch && (
                <Badge variant="outline" className="px-3 py-1">
                  <BookOpen className="h-3 w-3 mr-1" />
                  Using: {selectedSavedSearch.name}
                </Badge>
              )}
            </div>
            
            {/* Enhanced Tabs Navigation */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="search" className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Quick Search
                </TabsTrigger>
                <TabsTrigger value="builder" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Advanced Builder
                </TabsTrigger>
                <TabsTrigger value="analytics" className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  URL Analytics
                </TabsTrigger>
                <TabsTrigger value="saved" className="flex items-center gap-2">
                  <History className="h-4 w-4" />
                  Saved Searches
                </TabsTrigger>
              </TabsList>
              
              {/* Quick Search Tab */}
              <TabsContent value="search">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Side - Search Configuration */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${selectedSearchType.color}`}>
                        <selectedSearchType.icon className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle>{selectedSearchType.name}</CardTitle>
                        <CardDescription>{selectedSearchType.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                {/* Search Method Configuration */}
                <Card>
                  <CardHeader>
                    <CardTitle>Search Configuration</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* URL Search Configuration */}
                    {(selectedMethod === 'url-search' || (!selectedMethod && selectedSearchType.methods.find(m => m.active)?.id === 'url-search')) && (
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="linkedin-url" className="text-sm font-medium">URL to LinkedIn search</Label>
                          <Input 
                            id="linkedin-url"
                            value={linkedInUrl}
                            onChange={(e) => setLinkedInUrl(e.target.value)}
                            placeholder="Paste LinkedIn search URL here..."
                            className="mt-2"
                          />
                        </div>
                        
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <h5 className="font-medium text-sm mb-2">How to get the link</h5>
                          <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
                            <li>Go to LinkedIn and make a search</li>
                            <li>Copy the URL of the search</li>
                            <li>Paste the URL from LinkedIn</li>
                          </ol>
                          <p className="text-sm text-gray-600 mt-2">
                            {selectedSearchType.id === 'sales-navigator' 
                              ? 'Take into account the search results could be different due to the interaction with LinkedIn.'
                              : 'Please note that the search results may vary in lead quantity due to the content available'
                            }
                          </p>
                        </div>
                        
                        <Button 
                          onClick={handleStartSearch} 
                          disabled={!linkedInUrl.trim() || isSearching}
                          className="w-full"
                        >
                          {isSearching ? (
                            <>
                              <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Searching...
                            </>
                          ) : (
                            <>
                              <Search className="h-4 w-4 mr-2" />
                              Start Search
                            </>
                          )}
                        </Button>
                      </div>
                    )}

                    {/* CSV Upload Configuration */}
                    {selectedMethod === 'csv-upload' && (
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium">Upload CSV File</Label>
                          <div className="mt-2 space-y-3">
                            <div 
                              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
                              onClick={handleFileSelect}
                            >
                              <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                              <p className="text-sm font-medium text-gray-900">
                                {csvFile ? csvFile.name : 'Click to upload CSV file'}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                CSV files up to 5MB
                              </p>
                            </div>
                            
                            <input
                              type="file"
                              ref={fileInputRef}
                              onChange={handleFileChange}
                              accept=".csv"
                              className="hidden"
                            />
                          </div>
                        </div>

                        {csvFile && (
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-gray-600" />
                              <span className="text-sm font-medium">{csvFile.name}</span>
                              <span className="text-xs text-gray-500">
                                ({(csvFile.size / 1024).toFixed(1)} KB)
                              </span>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setCsvFile(null);
                                setCsvData([]);
                                setCsvErrors([]);
                                setSearchResults([]);
                                if (fileInputRef.current) {
                                  fileInputRef.current.value = '';
                                }
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        )}

                        {/* CSV Errors Display */}
                        {csvErrors.length > 0 && (
                          <Alert className="border-red-200 bg-red-50">
                            <AlertCircle className="h-4 w-4 text-red-600" />
                            <AlertDescription>
                              <div className="space-y-2">
                                <p className="font-medium text-red-800">Found {csvErrors.length} validation errors:</p>
                                <div className="max-h-32 overflow-y-auto space-y-1">
                                  {csvErrors.slice(0, 5).map((error, index) => (
                                    <div key={index} className="text-xs text-red-700">
                                      Row {error.row}: {error.message} ({error.field})
                                    </div>
                                  ))}
                                  {csvErrors.length > 5 && (
                                    <div className="text-xs text-red-600">
                                      ... and {csvErrors.length - 5} more errors
                                    </div>
                                  )}
                                </div>
                              </div>
                            </AlertDescription>
                          </Alert>
                        )}

                        <div className="bg-orange-50 p-4 rounded-lg">
                          <h5 className="font-medium text-sm mb-2">CSV Format Requirements</h5>
                          <div className="text-sm text-gray-700 space-y-1">
                            <p><strong>Required fields:</strong> name, company</p>
                            <p><strong>Optional fields:</strong> title, location, email, linkedin_url, phone</p>
                            <p className="text-xs text-gray-600 mt-2">
                              Field names are flexible (e.g., "full_name" or "name", "position" or "title")
                            </p>
                          </div>
                          
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={downloadSampleCsv}
                            className="mt-3"
                          >
                            <Download className="h-3 w-3 mr-2" />
                            Download Sample CSV
                          </Button>
                        </div>

                        {isProcessingCsv && (
                          <div className="flex items-center justify-center p-4">
                            <div className="w-6 h-6 mr-2 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                            <span className="text-sm text-gray-600">Processing CSV file...</span>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Search Methods */}
                <Card>
                  <CardHeader>
                    <CardTitle>Available Methods</CardTitle>
                    <CardDescription>Choose how you want to add prospects</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedSearchType.methods.map((method) => {
                      const isSelected = selectedMethod === method.id || (!selectedMethod && method.active);
                      
                      return (
                        <div 
                          key={method.id} 
                          className={`flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-all ${
                            isSelected ? 'border-blue-200 bg-blue-50' : ''
                          }`}
                          onClick={() => setSelectedMethod(method.id)}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${method.color}`}>
                            <method.icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{method.name}</h4>
                            <p className="text-xs text-gray-600">{method.description}</p>
                          </div>
                          {isSelected && (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          )}
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              </div>

              {/* Right Side - Search Results */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Search Results</CardTitle>
                    <CardDescription>
                      {searchResults.length > 0 
                        ? `Found ${searchResults.length} prospects`
                        : 'Results will appear here after starting a search'
                      }
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {searchResults.length > 0 ? (
                      <div className="space-y-3">
                        {searchResults.map((result, index) => (
                          <div key={index} className="p-4 border rounded-lg hover:shadow-sm transition-shadow">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-medium text-gray-900">{result.name}</h4>
                                  <Badge variant="secondary" className="text-xs">
                                    {result.source === 'csv_upload' ? 'CSV' : 
                                     result.source === 'url_search' ? 'URL' : 'Enriched'}
                                  </Badge>
                                </div>
                                
                                {result.title && (
                                  <p className="text-sm text-gray-600 mb-1">
                                    {result.title} {result.company && `at ${result.company}`}
                                  </p>
                                )}
                                
                                {result.location && (
                                  <p className="text-xs text-gray-500 mb-2">{result.location}</p>
                                )}
                                
                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                  {result.email && (
                                    <span className="flex items-center gap-1">
                                      <span>📧</span> {result.email}
                                    </span>
                                  )}
                                  {result.linkedin_url && (
                                    <span className="flex items-center gap-1">
                                      <span>💼</span> LinkedIn
                                    </span>
                                  )}
                                  {result.phone && (
                                    <span className="flex items-center gap-1">
                                      <span>📱</span> Phone
                                    </span>
                                  )}
                                </div>
                              </div>
                              <Badge 
                                variant="outline" 
                                className={result.source === 'csv_upload' ? 'border-orange-200 text-orange-700' : 'border-blue-200 text-blue-700'}
                              >
                                New
                              </Badge>
                            </div>
                          </div>
                        ))}
                        
                        <div className="pt-4 border-t space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">
                              Ready to add {searchResults.length} prospects
                            </span>
                            <div className="flex items-center gap-2">
                              {searchResults.filter(r => r.linkedin_url).length > 0 && (
                                <span className="text-xs text-blue-600">
                                  {searchResults.filter(r => r.linkedin_url).length} with LinkedIn
                                </span>
                              )}
                              {searchResults.filter(r => r.email).length > 0 && (
                                <span className="text-xs text-green-600">
                                  {searchResults.filter(r => r.email).length} with email
                                </span>
                              )}
                            </div>
                          </div>
                          <Button className="w-full" onClick={() => navigate('/campaign-setup')}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add {searchResults.length} Prospects to Campaign
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>No search results yet</p>
                        <p className="text-sm">Configure your search and click "Start Search"</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
                </div>
              </TabsContent>
              
              {/* Advanced Builder Tab */}
              <TabsContent value="builder">
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  <div className="xl:col-span-2">
                    <SearchConfigurationBuilder
                      searchType={selectedSearchType.id}
                      initialParams={currentSearchParams}
                      onConfigurationChange={handleConfigurationChange}
                      onUrlGenerated={handleUrlGenerated}
                      showPreview={true}
                      className=""
                    />
                  </div>
                  
                  {/* Search Results Preview */}
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <Zap className="h-4 w-4" />
                          Quick Actions
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <Button 
                          onClick={handleStartSearch} 
                          disabled={!currentUrlResult?.isValid || isSearching}
                          className="w-full"
                        >
                          {isSearching ? (
                            <>
                              <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Searching...
                            </>
                          ) : (
                            <>
                              <Search className="h-4 w-4 mr-2" />
                              Start Search
                            </>
                          )}
                        </Button>
                        
                        {currentUrlResult?.isValid && (
                          <Button 
                            variant="outline" 
                            onClick={() => window.open(currentUrlResult.url, '_blank')}
                            className="w-full"
                          >
                            <Link className="h-4 w-4 mr-2" />
                            Preview in LinkedIn
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                    
                    {/* Search Results */}
                    {searchResults.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Search Results Preview</CardTitle>
                          <CardDescription>
                            Showing {searchResults.length} prospects found
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3 max-h-96 overflow-y-auto">
                          {searchResults.slice(0, 5).map((result, index) => (
                            <div key={index} className="p-3 border rounded-lg">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium text-sm">{result.name}</h4>
                                <Badge variant="secondary" className="text-xs">
                                  {result.source === 'url_search' ? 'LinkedIn' : 'CSV'}
                                </Badge>
                              </div>
                              {result.title && (
                                <p className="text-xs text-gray-600">
                                  {result.title} {result.company && `at ${result.company}`}
                                </p>
                              )}
                              {result.location && (
                                <p className="text-xs text-gray-500">{result.location}</p>
                              )}
                            </div>
                          ))}
                          
                          {searchResults.length > 5 && (
                            <p className="text-xs text-gray-500 text-center py-2">
                              +{searchResults.length - 5} more prospects
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </TabsContent>
              
              {/* URL Analytics Tab */}
              <TabsContent value="analytics">
                <SearchPreviewAnalytics
                  searchUrl={linkedInUrl}
                  onUrlChange={setLinkedInUrl}
                  showVariations={true}
                  showOptimization={true}
                  className=""
                />
              </TabsContent>
              
              {/* Saved Searches Tab */}
              <TabsContent value="saved">
                <SavedSearchManager
                  workspaceId={workspaceId}
                  userId={userId}
                  onSearchSelect={handleSavedSearchSelect}
                  onSearchExecute={handleSavedSearchExecute}
                  showExecuteActions={true}
                  className=""
                />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50">
      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate('/campaign-setup')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Campaign
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Choose Search Type or Paste Link</h1>
                <p className="text-gray-600">Select how you want to find and add prospects to {campaignName}</p>
              </div>
            </div>
          </div>

          {/* Search Types Grid */}
          <div className="space-y-8">
            {/* Recommended */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Recommended</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {searchTypes
                  .filter(type => type.category === 'recommended')
                  .map((searchType) => (
                    <Card 
                      key={searchType.id}
                      className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-blue-200"
                      onClick={() => setSelectedSearchType(searchType)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${searchType.color}`}>
                            <searchType.icon className="h-6 w-6" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-2">{searchType.name}</h3>
                            <p className="text-sm text-gray-600">{searchType.description}</p>
                            <div className="mt-3">
                              <Badge variant="outline" className="text-xs">
                                {searchType.methods.length} methods available
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                }
              </div>
            </div>

            {/* Advanced */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Advanced</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {searchTypes
                  .filter(type => type.category === 'advanced')
                  .map((searchType) => (
                    <Card 
                      key={searchType.id}
                      className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-blue-200"
                      onClick={() => setSelectedSearchType(searchType)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${searchType.color}`}>
                            <searchType.icon className="h-6 w-6" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-2">{searchType.name}</h3>
                            <p className="text-sm text-gray-600">{searchType.description}</p>
                            <div className="mt-3">
                              <Badge variant="outline" className="text-xs">
                                {searchType.methods.length} method{searchType.methods.length > 1 ? 's' : ''} available
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                }
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}