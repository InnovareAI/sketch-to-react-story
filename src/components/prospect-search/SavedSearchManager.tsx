// Saved Search Configuration Manager
// Allows users to save, organize, and reuse search configurations

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Save,
  Search,
  Star,
  Clock,
  MoreHorizontal,
  Edit,
  Trash2,
  Copy,
  Play,
  Users,
  Building2,
  MapPin,
  Target,
  Calendar,
  TrendingUp,
  Bookmark,
  Filter,
  SortAsc,
  SortDesc,
  Plus,
  Folder,
  Tag,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import { useSearchConfigurations } from '@/hooks/useProspectSearch';
import { SearchConfiguration, SearchType, SearchMethod } from '@/types/prospect-search';
import { LinkedInSearchParams, SearchUrlResult } from '@/services/linkedin-url-generator';

interface SavedSearchManagerProps {
  workspaceId: string;
  userId: string;
  onSearchSelect?: (config: SearchConfiguration) => void;
  onSearchExecute?: (config: SearchConfiguration) => void;
  showExecuteActions?: boolean;
  className?: string;
}

interface SavedSearchCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const SEARCH_CATEGORIES: SavedSearchCategory[] = [
  {
    id: 'sales',
    name: 'Sales Outreach',
    description: 'Lead generation and prospect searches',
    icon: Target,
    color: 'bg-blue-100 text-blue-700'
  },
  {
    id: 'recruiting',
    name: 'Talent Acquisition',
    description: 'Candidate and talent searches',
    icon: Users,
    color: 'bg-green-100 text-green-700'
  },
  {
    id: 'marketing',
    name: 'Marketing & PR',
    description: 'Influencer and marketing searches',
    icon: TrendingUp,
    color: 'bg-purple-100 text-purple-700'
  },
  {
    id: 'research',
    name: 'Market Research',
    description: 'Industry and competitor analysis',
    icon: Building2,
    color: 'bg-orange-100 text-orange-700'
  }
];

const SEARCH_TYPE_LABELS: Record<SearchType, string> = {
  'basic-search': 'Basic Search',
  'sales-navigator': 'Sales Navigator',
  'recruiter-search': 'Recruiter',
  'company-follower': 'Company Followers',
  'csv-import': 'CSV Import',
  'post-engagement': 'Post Engagement',
  'group-search': 'Group Members',
  'event-search': 'Event Attendees',
  'people-you-know': 'Network Suggestions'
};

export function SavedSearchManager({
  workspaceId,
  userId,
  onSearchSelect,
  onSearchExecute,
  showExecuteActions = true,
  className
}: SavedSearchManagerProps) {
  const { configurations, loading, createConfiguration, updateConfiguration, deleteConfiguration, fetchConfigurations } = useSearchConfigurations(workspaceId);
  
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'created_at' | 'last_run_at' | 'results_count'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFavorites, setShowFavorites] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<SearchConfiguration | null>(null);
  const [newSearchName, setNewSearchName] = useState('');
  const [newSearchDescription, setNewSearchDescription] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);

  // Load favorites from localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem(`search-favorites-${workspaceId}`);
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  }, [workspaceId]);

  // Save favorites to localStorage
  const saveFavorites = (newFavorites: string[]) => {
    setFavorites(newFavorites);
    localStorage.setItem(`search-favorites-${workspaceId}`, JSON.stringify(newFavorites));
  };

  // Toggle favorite
  const toggleFavorite = (configId: string) => {
    const newFavorites = favorites.includes(configId)
      ? favorites.filter(id => id !== configId)
      : [...favorites, configId];
    saveFavorites(newFavorites);
    
    toast.success(
      favorites.includes(configId) 
        ? 'Removed from favorites' 
        : 'Added to favorites'
    );
  };

  // Filter and sort configurations
  const filteredConfigurations = React.useMemo(() => {
    let filtered = configurations;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(config => 
        config.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        config.search_type.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by category (based on search type and parameters)
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(config => {
        const category = getCategoryFromConfig(config);
        return category === selectedCategory;
      });
    }

    // Filter by favorites
    if (showFavorites) {
      filtered = filtered.filter(config => favorites.includes(config.id));
    }

    // Sort configurations
    filtered.sort((a, b) => {
      let aValue: any = a[sortBy];
      let bValue: any = b[sortBy];

      if (sortBy === 'created_at' || sortBy === 'last_run_at') {
        aValue = new Date(aValue || 0).getTime();
        bValue = new Date(bValue || 0).getTime();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [configurations, searchQuery, selectedCategory, showFavorites, sortBy, sortOrder, favorites]);

  // Get category from configuration
  const getCategoryFromConfig = (config: SearchConfiguration): string => {
    const params = config.parameters as LinkedInSearchParams;
    
    // Basic heuristics to categorize searches
    if (config.search_type === 'recruiter-search') return 'recruiting';
    if (config.search_type === 'company-follower') return 'marketing';
    if (params.title?.toLowerCase().includes('recruiter') || 
        params.keywords?.toLowerCase().includes('hr')) return 'recruiting';
    if (params.title?.toLowerCase().includes('marketing') || 
        params.title?.toLowerCase().includes('pr')) return 'marketing';
    
    return 'sales'; // Default category
  };

  // Save new search configuration
  const handleSaveSearch = async (params: LinkedInSearchParams, urlResult: SearchUrlResult) => {
    if (!newSearchName.trim()) {
      toast.error('Search name is required');
      return;
    }

    try {
      await createConfiguration({
        name: newSearchName,
        search_type: urlResult.searchType as SearchType,
        search_method: 'url-search' as SearchMethod,
        parameters: params,
        filters: {}
      }, userId);

      setNewSearchName('');
      setNewSearchDescription('');
      setIsDialogOpen(false);
      toast.success('Search configuration saved');
    } catch (error) {
      toast.error('Failed to save search configuration');
    }
  };

  // Duplicate search configuration
  const duplicateSearch = async (config: SearchConfiguration) => {
    try {
      await createConfiguration({
        name: `${config.name} (Copy)`,
        search_type: config.search_type,
        search_method: config.search_method,
        parameters: config.parameters,
        filters: config.filters
      }, userId);

      toast.success('Search configuration duplicated');
    } catch (error) {
      toast.error('Failed to duplicate search configuration');
    }
  };

  // Delete search configuration
  const handleDeleteSearch = async (config: SearchConfiguration) => {
    try {
      await deleteConfiguration(config.id);
      
      // Remove from favorites if present
      if (favorites.includes(config.id)) {
        saveFavorites(favorites.filter(id => id !== config.id));
      }
      
      toast.success('Search configuration deleted');
    } catch (error) {
      toast.error('Failed to delete search configuration');
    }
  };

  // Format last run date
  const formatLastRun = (dateString?: string) => {
    if (!dateString) return 'Never';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    
    return date.toLocaleDateString();
  };

  // Get search type icon
  const getSearchTypeIcon = (searchType: SearchType) => {
    switch (searchType) {
      case 'basic-search': return Search;
      case 'sales-navigator': return Target;
      case 'recruiter-search': return Users;
      case 'company-follower': return Building2;
      case 'group-search': return Users;
      case 'event-search': return Calendar;
      case 'post-engagement': return TrendingUp;
      default: return Search;
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Saved Searches</h2>
          <p className="text-sm text-gray-600">
            Manage and reuse your LinkedIn search configurations
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Save New Search
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Save Search Configuration</DialogTitle>
              <DialogDescription>
                Give your search configuration a name and description for easy reference.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label htmlFor="search-name">Search Name *</Label>
                <Input
                  id="search-name"
                  value={newSearchName}
                  onChange={(e) => setNewSearchName(e.target.value)}
                  placeholder="e.g., Tech Executives - Bay Area"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="search-description">Description (Optional)</Label>
                <Input
                  id="search-description"
                  value={newSearchDescription}
                  onChange={(e) => setNewSearchDescription(e.target.value)}
                  placeholder="Describe this search configuration..."
                  className="mt-1"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => handleSaveSearch({}, { isValid: true } as SearchUrlResult)}>
                  Save Search
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex-1 space-y-2 md:space-y-0 md:space-x-2 md:flex md:items-center">
          {/* Search Input */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search configurations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>

          {/* Category Filter */}
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-auto">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
              {SEARCH_CATEGORIES.map(category => (
                <TabsTrigger key={category.id} value={category.id} className="text-xs">
                  {category.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        <div className="flex items-center gap-2">
          {/* Favorites Toggle */}
          <Button
            variant={showFavorites ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFavorites(!showFavorites)}
          >
            <Star className={`h-4 w-4 mr-2 ${showFavorites ? 'fill-current' : ''}`} />
            Favorites
          </Button>

          {/* Sort Options */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setSortBy('name')}>
                Sort by Name
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('created_at')}>
                Sort by Created Date
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('last_run_at')}>
                Sort by Last Run
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('results_count')}>
                Sort by Results
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}>
                {sortOrder === 'asc' ? 'Descending' : 'Ascending'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Search Configurations Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-4"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredConfigurations.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Bookmark className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No saved searches found</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery || selectedCategory !== 'all' || showFavorites 
                ? 'Try adjusting your filters to see more results.'
                : 'Save your LinkedIn search configurations for easy reuse.'}
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Save Your First Search
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredConfigurations.map(config => {
            const SearchIcon = getSearchTypeIcon(config.search_type);
            const isFavorite = favorites.includes(config.id);
            
            return (
              <Card key={config.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-2">
                      <div className="p-1 bg-gray-100 rounded">
                        <SearchIcon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm truncate">{config.name}</h3>
                        <p className="text-xs text-gray-500">
                          {SEARCH_TYPE_LABELS[config.search_type]}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleFavorite(config.id)}
                        className="h-6 w-6 p-0"
                      >
                        <Star className={`h-3 w-3 ${isFavorite ? 'fill-current text-yellow-500' : 'text-gray-400'}`} />
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {onSearchSelect && (
                            <DropdownMenuItem onClick={() => onSearchSelect(config)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Search
                            </DropdownMenuItem>
                          )}
                          {showExecuteActions && onSearchExecute && (
                            <DropdownMenuItem onClick={() => onSearchExecute(config)}>
                              <Play className="h-4 w-4 mr-2" />
                              Execute Search
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => duplicateSearch(config)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem 
                                className="text-red-600"
                                onSelect={(e) => e.preventDefault()}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Search Configuration</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{config.name}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDeleteSearch(config)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <div className="space-y-2 mb-3">
                    <Badge className={`text-xs ${getStatusColor(config.status)}`}>
                      {config.status}
                    </Badge>
                    
                    <div className="text-xs text-gray-500 space-y-1">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Last run: {formatLastRun(config.last_run_at)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {config.results_count.toLocaleString()} results
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {onSearchSelect && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1 text-xs"
                        onClick={() => onSearchSelect(config)}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                    )}
                    {showExecuteActions && onSearchExecute && (
                      <Button 
                        size="sm" 
                        className="flex-1 text-xs"
                        onClick={() => onSearchExecute(config)}
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Run
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}