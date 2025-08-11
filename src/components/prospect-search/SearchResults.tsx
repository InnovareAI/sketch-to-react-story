// Search Results Management Component
// Displays search results with filters, bulk actions, and detailed prospect management

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Search,
  Filter,
  Download,
  Target,
  Users,
  Building2,
  MapPin,
  Calendar,
  Mail,
  Phone,
  ExternalLink,
  MoreHorizontal,
  Plus,
  History,
  Eye,
  MessageSquare,
  UserPlus,
  FileText,
  Star,
  Trash2,
  RefreshCw
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { CampaignCompatibilityChecker } from './CampaignCompatibilityChecker';
import { LeadProfile } from '@/services/campaign-rules-engine';
import { useBulkLeadValidation } from '@/hooks/useCampaignValidation';

interface ProspectResult {
  id: string;
  name: string;
  title?: string;
  company?: string;
  location?: string;
  email?: string;
  phone?: string;
  linkedin_url?: string;
  source: 'post_engagement' | 'basic_search' | 'sales_navigator' | 'csv_upload';
  engagement_type?: 'like' | 'comment' | 'share' | 'reaction';
  search_date: string;
  status: 'new' | 'contacted' | 'responded' | 'qualified' | 'unqualified';
  campaign_id?: string;
  tags?: string[];
  selected?: boolean;
}

interface SearchResultsProps {
  searchTitle?: string;
  searchDate?: string;
  className?: string;
}

export function SearchResults({
  searchTitle = "Post engagement",
  searchDate = "11 Aug, 2025",
  className
}: SearchResultsProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedSource, setSelectedSource] = useState<string>("all");
  const [selectedCampaign, setSelectedCampaign] = useState<string>("all");
  const [selectedEngagement, setSelectedEngagement] = useState<string>("all");
  const [selectedEmail, setSelectedEmail] = useState<string>("all");
  const [selectedTags, setSelectedTags] = useState<string>("all");
  const [selectAll, setSelectAll] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [showCompatibilityChecker, setShowCompatibilityChecker] = useState(false);

  // Mock data - in real app this would come from props/API
  const [results, setResults] = useState<ProspectResult[]>([
    {
      id: '1',
      name: 'Sarah Johnson',
      title: 'Marketing Manager',
      company: 'TechCorp Inc',
      location: 'San Francisco, CA',
      email: 'sarah.j@techcorp.com',
      linkedin_url: 'https://linkedin.com/in/sarahjohnson',
      source: 'post_engagement',
      engagement_type: 'comment',
      search_date: '2025-08-11',
      status: 'new',
      tags: ['high-priority', 'marketing'],
      selected: false
    },
    {
      id: '2',
      name: 'Michael Chen',
      title: 'Senior Developer',
      company: 'StartupXYZ',
      location: 'Austin, TX',
      linkedin_url: 'https://linkedin.com/in/michaelchen',
      source: 'post_engagement',
      engagement_type: 'like',
      search_date: '2025-08-11',
      status: 'contacted',
      tags: ['tech', 'senior-level'],
      selected: false
    },
    {
      id: '3',
      name: 'Emily Rodriguez',
      title: 'VP Sales',
      company: 'Growth Solutions',
      location: 'New York, NY',
      email: 'emily@growthsolutions.com',
      phone: '+1-555-0123',
      linkedin_url: 'https://linkedin.com/in/emilyrodriguez',
      source: 'post_engagement',
      engagement_type: 'share',
      search_date: '2025-08-11',
      status: 'responded',
      campaign_id: 'campaign-123',
      tags: ['sales', 'executive'],
      selected: false
    }
  ]);

  const totalResults = results.length;
  const filteredResults = results.filter(result => {
    const matchesSearch = searchTerm === "" || 
      result.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.title?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === "all" || result.status === selectedStatus;
    const matchesSource = selectedSource === "all" || result.source === selectedSource;
    const matchesCampaign = selectedCampaign === "all" || 
      (selectedCampaign === "assigned" && result.campaign_id) ||
      (selectedCampaign === "unassigned" && !result.campaign_id);
    const matchesEngagement = selectedEngagement === "all" || result.engagement_type === selectedEngagement;
    const matchesEmail = selectedEmail === "all" || 
      (selectedEmail === "available" && result.email) ||
      (selectedEmail === "unavailable" && !result.email);

    return matchesSearch && matchesStatus && matchesSource && matchesCampaign && matchesEngagement && matchesEmail;
  });

  const selectedCount = results.filter(r => r.selected).length;
  const selectedResults = results.filter(r => r.selected);

  // Convert ProspectResult to LeadProfile for validation
  const convertToLeadProfile = (result: ProspectResult): LeadProfile => ({
    id: result.id,
    name: result.name,
    title: result.title,
    company: result.company,
    location: result.location,
    email: result.email,
    phone: result.phone,
    linkedin_url: result.linkedin_url,
    connection_degree: '2nd', // Default - in real app this would come from data
    premium_account: false, // Default - in real app this would come from data
    open_to_work: false,
    profile_visibility: 'public',
    profile_completeness: 75,
    mutual_connections: Math.floor(Math.random() * 20), // Mock data
    search_source: result.source === 'post_engagement' ? 'basic_search' : result.source as any,
    industry: 'Technology', // Mock - in real app this would come from data
    seniority_level: result.title?.toLowerCase().includes('manager') ? 'manager' : 
                    result.title?.toLowerCase().includes('director') ? 'director' :
                    result.title?.toLowerCase().includes('vp') ? 'executive' : 'associate'
  });

  const selectedLeads = selectedResults.map(convertToLeadProfile);

  // Use validation hook for bulk assignment
  const { 
    canAssign, 
    validLeadsCount, 
    validateAndAssignBulk, 
    blockedReasons 
  } = useBulkLeadValidation(selectedLeads, null);

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    setResults(results.map(r => ({ ...r, selected: checked })));
  };

  const handleSelectResult = (id: string, checked: boolean) => {
    setResults(results.map(r => 
      r.id === id ? { ...r, selected: checked } : r
    ));
  };

  const handleBulkAssignToCampaign = () => {
    if (selectedCount === 0) {
      toast.error("No prospects selected");
      return;
    }
    
    // Show compatibility checker for smart assignment
    setShowCompatibilityChecker(true);
  };

  const handleCampaignAssignment = (campaignId: string, validLeadsCount: number) => {
    // In real app, this would make API call to assign leads
    toast.success(`Successfully assigned ${validLeadsCount} leads to campaign`);
    
    // Reset selections
    setResults(results.map(r => ({ ...r, selected: false })));
    setSelectAll(false);
    setShowCompatibilityChecker(false);
  };

  const handleBulkExportCSV = () => {
    if (selectedCount === 0) {
      toast.error("No prospects selected");
      return;
    }
    toast.success(`Exported ${selectedCount} prospects as CSV`);
  };

  const getEngagementIcon = (type?: string) => {
    switch (type) {
      case 'like': return '👍';
      case 'comment': return '💬';
      case 'share': return '🔄';
      case 'reaction': return '❤️';
      default: return '👀';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'contacted': return 'bg-yellow-100 text-yellow-800';
      case 'responded': return 'bg-green-100 text-green-800';
      case 'qualified': return 'bg-purple-100 text-purple-800';
      case 'unqualified': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Search: {searchTitle}</h1>
            <p className="text-sm text-gray-600">{searchDate}</p>
          </div>
          <Badge variant="outline" className="text-xs">
            {filteredResults.length} results
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4 mr-2" />
            Jump into page...
          </Button>
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add new search
          </Button>
          <Button variant="outline" size="sm">
            <History className="h-4 w-4 mr-2" />
            SearchHistory
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Filters</CardTitle>
            <Button variant="ghost" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset Filters
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {/* Search by name */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Search by name</Label>
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-8"
              />
              <Badge variant="secondary" className="text-xs">({filteredResults.length})</Badge>
            </div>

            {/* Filter by search name */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Filter by search name</Label>
              <Select value={selectedSource} onValueChange={setSelectedSource}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="post_engagement">Post Engagement</SelectItem>
                  <SelectItem value="basic_search">Basic Search</SelectItem>
                  <SelectItem value="sales_navigator">Sales Navigator</SelectItem>
                  <SelectItem value="csv_upload">CSV Upload</SelectItem>
                </SelectContent>
              </Select>
              <Badge variant="secondary" className="text-xs">(69)</Badge>
            </div>

            {/* Search type */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Search type</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="responded">Responded</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
                  <SelectItem value="unqualified">Unqualified</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Status</Label>
              <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Campaign */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Campaign</Label>
              <Select>
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="campaign-1">Campaign 1</SelectItem>
                  <SelectItem value="campaign-2">Campaign 2</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Reaction */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Reaction</Label>
              <Select value={selectedEngagement} onValueChange={setSelectedEngagement}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="like">Like 👍</SelectItem>
                  <SelectItem value="comment">Comment 💬</SelectItem>
                  <SelectItem value="share">Share 🔄</SelectItem>
                  <SelectItem value="reaction">Reaction ❤️</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Comment activity */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Comment activity</Label>
              <Select>
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="commented">Commented</SelectItem>
                  <SelectItem value="no-comment">No Comment</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Open InMail availability */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Open InMail availability</Label>
              <Select>
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="unavailable">Unavailable</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Email availability */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Email availability</Label>
              <Select value={selectedEmail} onValueChange={setSelectedEmail}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="unavailable">Unavailable</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Tags</Label>
              <Select value={selectedTags} onValueChange={setSelectedTags}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tags</SelectItem>
                  <SelectItem value="high-priority">High Priority</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="tech">Tech</SelectItem>
                  <SelectItem value="sales">Sales</SelectItem>
                  <SelectItem value="executive">Executive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary and Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>Selected: {selectedCount}</span>
          <span>Filtered: {filteredResults.length}</span>
          <span>Total: {totalResults}</span>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            onClick={handleBulkAssignToCampaign}
            disabled={selectedCount === 0}
            size="sm"
            variant={selectedCount > 0 ? "default" : "outline"}
          >
            <Target className="h-4 w-4 mr-2" />
            {selectedCount > 0 
              ? `Smart assign ${selectedCount} selected` 
              : `Assign all (${totalResults}) to campaign`
            }
          </Button>
          <Button 
            variant="outline" 
            onClick={handleBulkExportCSV}
            disabled={selectedCount === 0}
            size="sm"
          >
            <Download className="h-4 w-4 mr-2" />
            Export all ({totalResults}) as CSV
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreHorizontal className="h-4 w-4 mr-2" />
                More
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <FileText className="h-4 w-4 mr-2" />
                Export as PDF
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Users className="h-4 w-4 mr-2" />
                Bulk Add to List
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Star className="h-4 w-4 mr-2" />
                Add Tags
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Selected
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Results Table */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Checkbox
                checked={selectAll}
                onCheckedChange={handleSelectAll}
                className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <CardTitle className="text-lg">Search Results</CardTitle>
            </div>
            <Badge variant="outline">{filteredResults.length} prospects</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredResults.map((result) => (
              <div key={result.id} className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <Checkbox
                  checked={result.selected || false}
                  onCheckedChange={(checked) => handleSelectResult(result.id, checked as boolean)}
                  className="mt-1"
                />
                
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      {/* Name and status */}
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{result.name}</h3>
                        <Badge className={getStatusColor(result.status)} variant="secondary">
                          {result.status}
                        </Badge>
                        {result.engagement_type && (
                          <span className="text-lg" title={result.engagement_type}>
                            {getEngagementIcon(result.engagement_type)}
                          </span>
                        )}
                      </div>

                      {/* Title and company */}
                      {(result.title || result.company) && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          {result.title && (
                            <>
                              <span>{result.title}</span>
                              {result.company && <span>•</span>}
                            </>
                          )}
                          {result.company && (
                            <div className="flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              <span>{result.company}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Location and contact info */}
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        {result.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span>{result.location}</span>
                          </div>
                        )}
                        {result.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            <span className="text-blue-600">Email available</span>
                          </div>
                        )}
                        {result.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            <span className="text-green-600">Phone available</span>
                          </div>
                        )}
                      </div>

                      {/* Tags */}
                      {result.tags && result.tags.length > 0 && (
                        <div className="flex items-center gap-1">
                          {result.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="h-4 w-4 mr-2" />
                          View Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Open LinkedIn
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Connect
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Send Message
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Target className="h-4 w-4 mr-2" />
                          Add to Campaign
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <Star className="h-4 w-4 mr-2" />
                          Add Tag
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            ))}

            {filteredResults.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No results match your current filters</p>
                <p className="text-sm">Try adjusting your search criteria</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Campaign Compatibility Checker */}
      {showCompatibilityChecker && selectedLeads.length > 0 && (
        <CampaignCompatibilityChecker
          leads={selectedLeads}
          selectedCampaignId={selectedCampaignId}
          onCampaignSelect={setSelectedCampaignId}
          onAssignToCampaign={handleCampaignAssignment}
          className="mt-6"
        />
      )}
    </div>
  );
}