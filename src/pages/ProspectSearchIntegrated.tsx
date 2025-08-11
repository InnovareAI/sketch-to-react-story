import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { useSearchConfigurations, useProspectProfiles, useSearchExecution, useCsvUpload, useCampaignAssignments } from '@/hooks/useProspectSearch';
import { ProspectSearchService } from '@/services/prospect-search';
import type { 
  SearchType as DatabaseSearchType, 
  SearchMethod as DatabaseSearchMethod, 
  CreateSearchConfigurationRequest, 
  ProspectProfileInsert,
  ProspectProfile 
} from '@/types/prospect-search';

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

export default function ProspectSearchIntegrated() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedSearchType, setSelectedSearchType] = useState<SearchTypeUI | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<DatabaseSearchMethod | null>(null);
  const [linkedInUrl, setLinkedInUrl] = useState("");
  const [searchResults, setSearchResults] = useState<ProspectData[]>([]);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentSearchConfig, setCurrentSearchConfig] = useState<string | null>(null);

  const campaignName = searchParams.get('campaign') || 'Current Campaign';
  const workspaceId = 'temp-workspace-id'; // TODO: Get from auth context
  const userId = 'temp-user-id'; // TODO: Get from auth context

  // Database hooks
  const { configurations, createConfiguration } = useSearchConfigurations(workspaceId);
  const { prospects, bulkCreateProspects } = useProspectProfiles(workspaceId);
  const { isSearching, executeSearch } = useSearchExecution();
  const { 
    uploadSession, 
    isUploading, 
    isProcessing, 
    validationErrors, 
    createUploadSession, 
    processUpload, 
    validateCsvData,
    setUploadSession 
  } = useCsvUpload(workspaceId, userId);
  const { assignProspectsToCampaign } = useCampaignAssignments(workspaceId, userId);

  const searchTypes: SearchTypeUI[] = [
    {
      id: 'basic-search',
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

  // Create search configuration and execute search
  const handleStartSearch = async () => {
    if (!linkedInUrl.trim() || !selectedSearchType) return;
    
    try {
      // Create search configuration
      const configRequest: CreateSearchConfigurationRequest = {
        name: `${selectedSearchType.name} - ${new Date().toLocaleDateString()}`,
        search_type: selectedSearchType.id,
        search_method: selectedMethod || 'url-search',
        parameters: {
          search_url: linkedInUrl,
          execution_date: new Date().toISOString(),
        },
        filters: {},
      };

      const config = await createConfiguration(configRequest, userId);
      setCurrentSearchConfig(config.id);

      // Execute the search
      const response = await executeSearch({
        search_configuration_id: config.id,
        execution_type: 'manual',
        search_url: linkedInUrl,
      });

      if (response.status === 'started') {
        // For demo purposes, create some mock results
        // In production, this would be handled by background jobs
        const mockResults: ProspectData[] = [
          { 
            name: 'John Doe', 
            title: 'CEO', 
            company: 'TechCorp', 
            location: 'San Francisco', 
            linkedin_url: 'https://linkedin.com/in/johndoe',
            source: 'url_search' 
          },
          { 
            name: 'Jane Smith', 
            title: 'CTO', 
            company: 'InnovateLabs', 
            location: 'Austin', 
            email: 'jane@innovatelabs.com',
            source: 'url_search' 
          },
          { 
            name: 'Mike Johnson', 
            title: 'VP Sales', 
            company: 'GrowthCo', 
            location: 'New York', 
            phone: '+1-555-0123',
            source: 'url_search' 
          }
        ];
        
        setSearchResults(mockResults);
        
        // Convert to database format and bulk create
        const prospectsToCreate: ProspectProfileInsert[] = mockResults.map(result => ({
          workspace_id: workspaceId,
          full_name: result.name,
          title: result.title,
          company_name: result.company,
          location: result.location,
          email: result.email,
          profile_url: result.linkedin_url,
          phone: result.phone,
          source: 'linkedin_search',
          source_details: {
            search_config_id: config.id,
            search_url: linkedInUrl,
          },
        }));

        await bulkCreateProspects(prospectsToCreate);
      }
    } catch (error) {
      console.error('Search execution error:', error);
      toast.error(error instanceof Error ? error.message : 'Search execution failed');
    }
  };

  // CSV Parsing Functions (updated to use database service)
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
            const row: any = { _rowNumber: index + 2 };
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

  const handleCsvUpload = async (file: File) => {
    if (!file || !selectedSearchType) return;

    try {
      // Parse CSV file first
      const rawData = await parseCsvFile(file);
      setCsvData(rawData);

      // Create field mappings (simplified for demo)
      const fieldMappings = {
        full_name: 'name',
        company_name: 'company',
        title: 'title',
        email: 'email',
        profile_url: 'linkedin_url',
        location: 'location',
        phone: 'phone',
      };

      // Validate CSV data
      const validation = validateCsvData(rawData, fieldMappings);
      
      if (validation.errors.length > 0) {
        toast.error(`Found ${validation.errors.length} validation errors in CSV`);
        return;
      }

      // Create upload session
      const uploadResponse = await createUploadSession({
        filename: file.name,
        file_size: file.size,
        field_mappings: fieldMappings,
      });

      if (uploadResponse.status === 'created' && uploadResponse.session_id) {
        // Process the upload
        const processResponse = await processUpload({
          session_id: uploadResponse.session_id,
          create_prospects: true,
          auto_enrich: true,
          deduplicate: true,
        });

        if (processResponse.status === 'processing') {
          // Convert CSV data to prospects and create them
          const prospectsToCreate: ProspectProfileInsert[] = rawData.map(row => ({
            workspace_id: workspaceId,
            full_name: row[fieldMappings.full_name] || '',
            company_name: row[fieldMappings.company_name] || '',
            title: row[fieldMappings.title],
            email: row[fieldMappings.email],
            profile_url: row[fieldMappings.profile_url],
            location: row[fieldMappings.location],
            phone: row[fieldMappings.phone],
            source: 'csv_upload',
            source_details: {
              upload_session_id: uploadResponse.session_id,
              filename: file.name,
            },
          }));

          const result = await bulkCreateProspects(prospectsToCreate, true);
          
          // Convert to display format
          const displayResults: ProspectData[] = result.created.map(prospect => ({
            name: prospect.full_name,
            title: prospect.title || '',
            company: prospect.company_name || '',
            location: prospect.location,
            email: prospect.email,
            linkedin_url: prospect.profile_url,
            phone: prospect.phone,
            source: 'csv_upload',
          }));

          setSearchResults(displayResults);
        }
      }
    } catch (error) {
      console.error('CSV processing error:', error);
      toast.error(`Failed to process CSV: ${(error as Error).message}`);
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

  // Handle adding prospects to campaign
  const handleAddProspectsToCampaign = async () => {
    if (searchResults.length === 0) return;

    try {
      // First, we need to get the prospect IDs from the database
      // For demo purposes, we'll use the prospects from our hook
      const prospectIds = prospects.slice(0, searchResults.length).map(p => p.id);
      
      if (prospectIds.length === 0) {
        toast.error('No prospects found to assign');
        return;
      }

      const campaignId = 'temp-campaign-id'; // TODO: Get actual campaign ID
      
      await assignProspectsToCampaign({
        prospect_ids: prospectIds,
        campaign_id: campaignId,
        segment: selectedSearchType?.name,
        priority: 1,
        custom_fields: {
          search_type: selectedSearchType?.id,
          search_method: selectedMethod,
          import_date: new Date().toISOString(),
        },
      });

      navigate('/campaign-setup');
    } catch (error) {
      console.error('Assignment error:', error);
      toast.error('Failed to assign prospects to campaign');
    }
  };

  if (selectedSearchType) {
    return (
      <div className="flex-1 bg-gray-50">
        <main className="flex-1 p-8">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <Button variant="ghost" onClick={() => setSelectedSearchType(null)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Search Types
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{selectedSearchType.name}</h1>
                <p className="text-gray-600">Create new search for {campaignName}</p>
              </div>
            </div>

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
                              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
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
                                setSearchResults([]);
                                setUploadSession(null);
                                if (fileInputRef.current) {
                                  fileInputRef.current.value = '';
                                }
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        )}

                        {/* CSV Processing Status */}
                        {uploadSession && (
                          <div className="bg-blue-50 p-4 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              {isProcessing ? (
                                <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
                              ) : (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              )}
                              <span className="text-sm font-medium">
                                CSV Status: {uploadSession.status.replace('_', ' ').toUpperCase()}
                              </span>
                            </div>
                            {uploadSession.total_rows > 0 && (
                              <div className="text-xs text-gray-600 space-y-1">
                                <p>Total rows: {uploadSession.total_rows}</p>
                                <p>Valid rows: {uploadSession.valid_rows}</p>
                                <p>Invalid rows: {uploadSession.invalid_rows}</p>
                                <p>Processed: {uploadSession.processed_rows}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* CSV Validation Errors */}
                        {validationErrors.length > 0 && (
                          <Alert className="border-red-200 bg-red-50">
                            <AlertCircle className="h-4 w-4 text-red-600" />
                            <AlertDescription>
                              <div className="space-y-2">
                                <p className="font-medium text-red-800">Found {validationErrors.length} validation errors:</p>
                                <div className="max-h-32 overflow-y-auto space-y-1">
                                  {validationErrors.slice(0, 5).map((error, index) => (
                                    <div key={index} className="text-xs text-red-700">
                                      Row {error.row}: {error.message} ({error.field})
                                    </div>
                                  ))}
                                  {validationErrors.length > 5 && (
                                    <div className="text-xs text-red-600">
                                      ... and {validationErrors.length - 5} more errors
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

                        {(isUploading || isProcessing) && (
                          <div className="flex items-center justify-center p-4">
                            <RefreshCw className="w-6 h-6 mr-2 animate-spin text-blue-600" />
                            <span className="text-sm text-gray-600">
                              {isUploading ? 'Uploading CSV file...' : 'Processing CSV data...'}
                            </span>
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
                          <Button className="w-full" onClick={handleAddProspectsToCampaign}>
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