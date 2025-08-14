import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { 
  Search as SearchIcon, 
  Filter, 
  MapPin, 
  Building2, 
  Users, 
  Mail, 
  Phone, 
  Globe, 
  Star, 
  Target, 
  TrendingUp,
  MoreHorizontal,
  UserPlus,
  Eye,
  Save,
  Download
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Search() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("people");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [savedSearchName, setSavedSearchName] = useState("");
  const [savedSearchDescription, setSavedSearchDescription] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any>({ people: [], companies: [] });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const mockSearchResults = {
    people: [
      {
        id: 1,
        name: "Alexandra Rodriguez",
        title: "VP of Engineering",
        company: "TechFlow Inc.",
        location: "San Francisco, CA",
        connections: "2nd",
        avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b829?w=400&h=400&fit=crop&crop=face",
        mutualConnections: 12,
        openToWork: false,
        premium: true
      },
      {
        id: 2,
        name: "Marcus Thompson",
        title: "Director of Sales",
        company: "ScaleUp Solutions",
        location: "Austin, TX",
        connections: "3rd",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face",
        mutualConnections: 8,
        openToWork: true,
        premium: false
      },
      {
        id: 3,
        name: "Sarah Chen",
        title: "Product Manager",
        company: "InnovateHub",
        location: "New York, NY",
        connections: "1st",
        avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face",
        mutualConnections: 25,
        openToWork: false,
        premium: true
      }
    ],
    companies: [
      {
        id: 1,
        name: "TechFlow Inc.",
        industry: "Technology Services",
        size: "201-500 employees",
        location: "San Francisco, CA",
        followers: "12.5K",
        logo: "https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=100&h=100&fit=crop",
        description: "Leading provider of enterprise software solutions"
      },
      {
        id: 2,
        name: "ScaleUp Solutions",
        industry: "Business Consulting",
        size: "51-200 employees",
        location: "Austin, TX",
        followers: "3.2K",
        logo: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=100&h=100&fit=crop",
        description: "Helping startups scale their operations efficiently"
      }
    ]
  };

  const getConnectionColor = (connection: string) => {
    switch (connection) {
      case "1st": return "bg-green-100 text-green-800";
      case "2nd": return "bg-blue-100 text-blue-800";
      case "3rd": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Handler for executing search
  const handleExecuteSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    setIsSearching(true);
    try {
      // Simulate search with mock data for now
      toast.info('Executing boolean search...');
      
      // In production, this would call your search API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setSearchResults(mockSearchResults);
      toast.success(`Found ${mockSearchResults.people.length + mockSearchResults.companies.length} results`);
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  // Handler for exporting results
  const handleExportResults = () => {
    if (searchResults.people.length === 0 && searchResults.companies.length === 0) {
      toast.error('No results to export');
      return;
    }

    try {
      // Create CSV content
      const csvContent = createCSVContent();
      
      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `search-results-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success('Results exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export results');
    }
  };

  // Create CSV content from results
  const createCSVContent = () => {
    const headers = ['Type', 'Name', 'Title/Industry', 'Company/Size', 'Location'];
    const rows = [
      ...searchResults.people.map((p: any) => 
        ['Person', p.name, p.title, p.company, p.location]
      ),
      ...searchResults.companies.map((c: any) => 
        ['Company', c.name, c.industry, c.size, c.location]
      )
    ];
    
    return [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
  };

  // Handler for saving search
  const handleSaveSearch = async () => {
    if (!savedSearchName.trim()) {
      toast.error('Please enter a name for the saved search');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please login to save searches');
        return;
      }

      // Save to localStorage for now (in production, save to database)
      const savedSearches = JSON.parse(localStorage.getItem('saved_searches') || '[]');
      savedSearches.push({
        id: Date.now(),
        name: savedSearchName,
        description: savedSearchDescription,
        query: searchQuery,
        filters: {}, // Add current filters
        created_at: new Date().toISOString()
      });
      localStorage.setItem('saved_searches', JSON.stringify(savedSearches));
      
      toast.success('Search saved successfully');
      setShowSaveDialog(false);
      setSavedSearchName('');
      setSavedSearchDescription('');
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save search');
    }
  };

  // Handler for loading saved search
  const handleLoadSearch = (search: any) => {
    setSearchQuery(search.query);
    toast.success(`Loaded search: ${search.name}`);
    setShowLoadDialog(false);
  };

  // Handler for uploading CSV list
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }

    try {
      const text = await file.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',');
      
      toast.success(`Uploaded ${lines.length - 1} records from ${file.name}`);
      setShowUploadDialog(false);
      
      // Process CSV data here
      console.log('CSV Headers:', headers);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload file');
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Advanced Search</h1>
          <p className="text-gray-600 mt-1">Boolean search with filters across database, campaigns, and uploaded lists</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowUploadDialog(true)}>
            <Filter className="h-4 w-4 mr-2" />
            Upload List
          </Button>
          <Button variant="outline" onClick={() => setShowSaveDialog(true)}>
            <Save className="h-4 w-4 mr-2" />
            Save Search
          </Button>
          <Button variant="outline" onClick={handleExportResults}>
            <Download className="h-4 w-4 mr-2" />
            Export Results
          </Button>
        </div>
      </div>

      {/* Boolean Search Interface */}
      <Card>
        <CardHeader>
          <CardTitle>Boolean Search Configuration</CardTitle>
          <CardDescription>Advanced search with boolean operators and data source selection</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Data Source Selection */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Search In</label>
                <Select defaultValue="all">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    <SelectItem value="database">Existing Database</SelectItem>
                    <SelectItem value="campaigns">Active Campaigns</SelectItem>
                    <SelectItem value="uploaded">Uploaded Lists</SelectItem>
                    <SelectItem value="crm">CRM Integration</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Boolean Operator</label>
                <Select defaultValue="AND">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AND">AND (All conditions)</SelectItem>
                    <SelectItem value="OR">OR (Any condition)</SelectItem>
                    <SelectItem value="NOT">NOT (Exclude)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Search Type</label>
                <Select defaultValue="contacts">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contacts">Contacts</SelectItem>
                    <SelectItem value="companies">Companies</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Match Type</label>
                <Select defaultValue="contains">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contains">Contains</SelectItem>
                    <SelectItem value="exact">Exact Match</SelectItem>
                    <SelectItem value="starts">Starts With</SelectItem>
                    <SelectItem value="ends">Ends With</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Boolean Query Builder */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Boolean Search Query</label>
                <textarea
                  placeholder="Example: (Marketing OR Sales) AND (Manager OR Director) NOT Intern"
                  className="w-full px-3 py-3 border border-gray-200 rounded-lg text-sm min-h-[100px] font-mono"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use AND, OR, NOT operators. Use parentheses for grouping, quotes for exact phrases, and * for wildcards
                </p>
              </div>
              
              {/* Quick Filter Builder */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Job Title</label>
                  <Input placeholder="e.g., Marketing Manager" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Company</label>
                  <Input placeholder="e.g., Microsoft" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Location</label>
                  <Input placeholder="e.g., San Francisco" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Industry</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technology">Technology</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="healthcare">Healthcare</SelectItem>
                      <SelectItem value="consulting">Consulting</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}>
                  <Filter className="h-4 w-4 mr-2" />
                  Advanced Filters
                </Button>
                <Button variant="outline" onClick={() => setShowLoadDialog(true)}>
                  Load Saved Search
                </Button>
              </div>
              <Button 
                className="bg-primary hover:bg-primary/90"
                onClick={handleExecuteSearch}
                disabled={isSearching}
              >
                <SearchIcon className="h-4 w-4 mr-2" />
                {isSearching ? 'Searching...' : 'Execute Search'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">1,247</div>
                <div className="text-sm text-gray-600">Total Results</div>
              </div>
              <SearchIcon className="h-8 w-8 text-premium-purple" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">892</div>
                <div className="text-sm text-gray-600">People</div>
              </div>
              <Users className="h-8 w-8 text-premium-cyan" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">355</div>
                <div className="text-sm text-gray-600">Companies</div>
              </div>
              <Building2 className="h-8 w-8 text-premium-orange" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">23</div>
                <div className="text-sm text-gray-600">Saved Searches</div>
              </div>
              <Star className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Results */}
      <Card>
        <CardHeader>
          <CardTitle>Search Results</CardTitle>
          <CardDescription>1,247 results found</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="people">People (892)</TabsTrigger>
              <TabsTrigger value="companies">Companies (355)</TabsTrigger>
            </TabsList>

            <TabsContent value="people" className="space-y-4 mt-6">
              {(searchResults.people.length > 0 ? searchResults.people : mockSearchResults.people).map((person) => (
                <Card key={person.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={person.avatar} alt={person.name} />
                        <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                          {person.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-xl font-semibold text-gray-900">{person.name}</h3>
                              {person.premium && (
                                <Badge className="bg-yellow-100 text-yellow-800">Premium</Badge>
                              )}
                              {person.openToWork && (
                                <Badge className="bg-green-100 text-green-800">#OpenToWork</Badge>
                              )}
                            </div>
                            <p className="text-lg text-premium-purple font-medium">{person.title}</p>
                            <p className="text-gray-600">{person.company}</p>
                            
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {person.location}
                              </div>
                              <div className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                {person.mutualConnections} mutual connections
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Badge className={getConnectionColor(person.connections)}>
                              {person.connections}
                            </Badge>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Profile
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <UserPlus className="h-4 w-4 mr-2" />
                                  Connect
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Mail className="h-4 w-4 mr-2" />
                                  Send Message
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                  <Target className="h-4 w-4 mr-2" />
                                  Add to Campaign
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 mt-4">
                          <Button size="sm">
                            <UserPlus className="h-3 w-3 mr-1" />
                            Connect
                          </Button>
                          <Button size="sm" variant="outline">
                            <Mail className="h-3 w-3 mr-1" />
                            Message
                          </Button>
                          <Button size="sm" variant="outline">
                            <Target className="h-3 w-3 mr-1" />
                            Add to Campaign
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="companies" className="space-y-4 mt-6">
              {(searchResults.companies.length > 0 ? searchResults.companies : mockSearchResults.companies).map((company) => (
                <Card key={company.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-16 w-16 rounded-lg">
                        <AvatarImage src={company.logo} alt={company.name} />
                        <AvatarFallback className="bg-primary text-primary-foreground text-lg rounded-lg">
                          {company.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900">{company.name}</h3>
                            <p className="text-lg text-premium-purple font-medium">{company.industry}</p>
                            <p className="text-gray-600">{company.description}</p>
                            
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {company.location}
                              </div>
                              <div className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                {company.size}
                              </div>
                              <div className="flex items-center gap-1">
                                <TrendingUp className="h-4 w-4" />
                                {company.followers} followers
                              </div>
                            </div>
                          </div>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="h-4 w-4 mr-2" />
                                View Company Page
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Users className="h-4 w-4 mr-2" />
                                See Employees
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <TrendingUp className="h-4 w-4 mr-2" />
                                Follow Company
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        
                        <div className="flex gap-2 mt-4">
                          <Button size="sm">
                            <Eye className="h-3 w-3 mr-1" />
                            View Company
                          </Button>
                          <Button size="sm" variant="outline">
                            <Users className="h-3 w-3 mr-1" />
                            See Employees
                          </Button>
                          <Button size="sm" variant="outline">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            Follow
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Save Search Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Search</DialogTitle>
            <DialogDescription>
              Save your current search configuration for later use
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="search-name">Search Name</Label>
              <Input
                id="search-name"
                value={savedSearchName}
                onChange={(e) => setSavedSearchName(e.target.value)}
                placeholder="e.g., Tech Leaders in Bay Area"
              />
            </div>
            <div>
              <Label htmlFor="search-description">Description (Optional)</Label>
              <Textarea
                id="search-description"
                value={savedSearchDescription}
                onChange={(e) => setSavedSearchDescription(e.target.value)}
                placeholder="Add notes about this search..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSearch}>Save Search</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Load Search Dialog */}
      <Dialog open={showLoadDialog} onOpenChange={setShowLoadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Load Saved Search</DialogTitle>
            <DialogDescription>
              Select a previously saved search to load
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {JSON.parse(localStorage.getItem('saved_searches') || '[]').map((search: any) => (
              <Card 
                key={search.id} 
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleLoadSearch(search)}
              >
                <CardContent className="p-4">
                  <div className="font-medium">{search.name}</div>
                  {search.description && (
                    <div className="text-sm text-gray-600 mt-1">{search.description}</div>
                  )}
                  <div className="text-xs text-gray-500 mt-2">
                    Created: {new Date(search.created_at).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            ))}
            {JSON.parse(localStorage.getItem('saved_searches') || '[]').length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No saved searches yet
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLoadDialog(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload List Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload CSV List</DialogTitle>
            <DialogDescription>
              Upload a CSV file with contacts to search within
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileUpload}
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                Choose CSV File
              </Button>
              <p className="text-sm text-gray-600 mt-2">
                or drag and drop your file here
              </p>
            </div>
            <div className="text-sm text-gray-600">
              <p className="font-medium">Expected format:</p>
              <ul className="list-disc list-inside mt-1">
                <li>First row should contain headers</li>
                <li>Include columns: Name, Title, Company, Email, etc.</li>
                <li>Maximum file size: 10MB</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Advanced Filters Panel */}
      {showAdvancedFilters && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Advanced Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Industry</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tech">Technology</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="healthcare">Healthcare</SelectItem>
                    <SelectItem value="retail">Retail</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Company Size</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-10">1-10 employees</SelectItem>
                    <SelectItem value="11-50">11-50 employees</SelectItem>
                    <SelectItem value="51-200">51-200 employees</SelectItem>
                    <SelectItem value="201-500">201-500 employees</SelectItem>
                    <SelectItem value="500+">500+ employees</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Location</Label>
                <Input placeholder="e.g., San Francisco, CA" />
              </div>
              <div>
                <Label>Job Title</Label>
                <Input placeholder="e.g., CEO, CTO, VP" />
              </div>
              <div>
                <Label>Years of Experience</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0-2">0-2 years</SelectItem>
                    <SelectItem value="3-5">3-5 years</SelectItem>
                    <SelectItem value="6-10">6-10 years</SelectItem>
                    <SelectItem value="10+">10+ years</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Connection Degree</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select degree" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1st">1st degree</SelectItem>
                    <SelectItem value="2nd">2nd degree</SelectItem>
                    <SelectItem value="3rd">3rd degree</SelectItem>
                    <SelectItem value="all">All</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowAdvancedFilters(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                toast.success('Filters applied');
                setShowAdvancedFilters(false);
              }}>
                Apply Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}