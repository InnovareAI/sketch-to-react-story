import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Link
} from "lucide-react";

type SearchType = {
  id: string;
  name: string;
  description: string;
  icon: any;
  color: string;
  category: 'recommended' | 'advanced';
  methods: SearchMethod[];
};

type SearchMethod = {
  id: string;
  name: string;
  description: string;
  icon: any;
  color: string;
  active?: boolean;
};

export default function ProspectSearch() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedSearchType, setSelectedSearchType] = useState<SearchType | null>(null);
  const [linkedInUrl, setLinkedInUrl] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const campaignName = searchParams.get('campaign') || 'Current Campaign';

  const searchTypes: SearchType[] = [
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

  const handleStartSearch = async () => {
    if (!linkedInUrl.trim()) return;
    
    setIsSearching(true);
    
    // Simulate search API call
    try {
      // This would integrate with Unipile/n8n workflow
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock results
      setSearchResults([
        { name: 'John Doe', title: 'CEO', company: 'TechCorp', location: 'San Francisco' },
        { name: 'Jane Smith', title: 'CTO', company: 'InnovateLabs', location: 'Austin' },
        { name: 'Mike Johnson', title: 'VP Sales', company: 'GrowthCo', location: 'New York' }
      ]);
    } finally {
      setIsSearching(false);
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
                    {selectedSearchType.methods.find(m => m.active)?.id === 'url-search' && (
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
                  </CardContent>
                </Card>

                {/* Search Methods */}
                <Card>
                  <CardHeader>
                    <CardTitle>Available Methods</CardTitle>
                    <CardDescription>Choose how you want to add prospects</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedSearchType.methods.map((method) => (
                      <div key={method.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${method.color}`}>
                          <method.icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{method.name}</h4>
                          <p className="text-xs text-gray-600">{method.description}</p>
                        </div>
                        {method.active && (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        )}
                      </div>
                    ))}
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
                          <div key={index} className="p-3 border rounded-lg">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium text-gray-900">{result.name}</h4>
                                <p className="text-sm text-gray-600">{result.title} at {result.company}</p>
                                <p className="text-xs text-gray-500">{result.location}</p>
                              </div>
                              <Badge variant="outline">New</Badge>
                            </div>
                          </div>
                        ))}
                        
                        <div className="pt-4 border-t">
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