import { useState } from "react";
import { WorkspaceHeader } from "@/components/workspace/WorkspaceHeader";
import { WorkspaceSidebar } from "@/components/workspace/WorkspaceSidebar";
import { ConversationalInterface } from "@/components/workspace/ConversationalInterface";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const [isConversational, setIsConversational] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("people");

  const searchResults = {
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
  
  if (isConversational) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <WorkspaceSidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <WorkspaceHeader 
              isConversational={isConversational}
              onToggleMode={setIsConversational}
            />
            <div className="flex-1 overflow-auto">
              <ConversationalInterface />
            </div>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <WorkspaceSidebar />
        <div className="flex-1 flex flex-col">
          <WorkspaceHeader isConversational={isConversational} onToggleMode={setIsConversational} />
          <main className="flex-1 p-8">
            <div className="max-w-7xl mx-auto">
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Advanced Search</h1>
          <p className="text-gray-600 mt-1">Boolean search with filters across database, campaigns, and uploaded lists</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Upload List
          </Button>
          <Button variant="outline">
            <Save className="h-4 w-4 mr-2" />
            Save Search
          </Button>
          <Button variant="outline">
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
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Advanced Filters
                </Button>
                <Button variant="outline">
                  Load Saved Search
                </Button>
              </div>
              <Button className="bg-primary hover:bg-primary/90">
                <SearchIcon className="h-4 w-4 mr-2" />
                Execute Search
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
              {searchResults.people.map((person) => (
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
              {searchResults.companies.map((company) => (
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
      </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}