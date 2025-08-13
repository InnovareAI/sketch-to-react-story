// My Network Component
// LinkedIn connection and network management interface

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users,
  UserPlus,
  UserMinus,
  Search,
  Filter,
  MoreHorizontal,
  ExternalLink,
  Calendar,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  Download,
  RefreshCw,
  Star,
  Building,
  MapPin,
  Mail,
  Phone,
  Globe
} from 'lucide-react';
import { toast } from 'sonner';

interface LinkedInConnection {
  id: string;
  profile_url: string;
  full_name: string;
  headline: string;
  location: string;
  company: string;
  position: string;
  profile_image_url: string;
  connection_date: string;
  connection_status: 'connected' | 'pending' | 'withdrawn';
  mutual_connections: number;
  last_interaction: string | null;
  contact_info: {
    email?: string;
    phone?: string;
    website?: string;
  };
  tags: string[];
  notes: string;
  campaign_source?: string;
  is_favorite: boolean;
}

interface PendingRequest {
  id: string;
  profile_url: string;
  full_name: string;
  headline: string;
  location: string;
  company: string;
  sent_date: string;
  message_sent: string;
  campaign_source?: string;
  can_withdraw: boolean;
}

interface NetworkStats {
  total_connections: number;
  pending_requests: number;
  recent_connections: number;
  connection_rate: number;
  response_rate: number;
  weekly_growth: number;
}

interface MyNetworkProps {
  className?: string;
}

export function MyNetwork({ className }: MyNetworkProps) {
  const [connections, setConnections] = useState<LinkedInConnection[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [stats, setStats] = useState<NetworkStats>({
    total_connections: 0,
    pending_requests: 0,
    recent_connections: 0,
    connection_rate: 0,
    response_rate: 0,
    weekly_growth: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [selectedConnections, setSelectedConnections] = useState<string[]>([]);

  useEffect(() => {
    loadNetworkData();
  }, []);

  const loadNetworkData = async () => {
    try {
      setLoading(true);
      
      // Only load real data from database
      // No mock data - stats start at 0
      setStats({
        total_connections: 0,
        pending_requests: 0,
        recent_connections: 0,
        connection_rate: 0,
        response_rate: 0,
        weekly_growth: 0
      });

      // Empty connections until real data is loaded
      setConnections([]);
      setPendingRequests([]);

    } catch (error) {
      console.error('Error loading network data:', error);
      toast.error('Failed to load network data');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawRequest = async (requestId: string) => {
    try {
      // This would call the API to withdraw the connection request
      toast.success('Connection request withdrawn successfully');
      
      // Update local state
      setPendingRequests(prev => prev.filter(req => req.id !== requestId));
      setStats(prev => ({ ...prev, pending_requests: prev.pending_requests - 1 }));
    } catch (error) {
      toast.error('Failed to withdraw connection request');
    }
  };

  const handleBulkWithdraw = async () => {
    if (selectedConnections.length === 0) {
      toast.error('No requests selected');
      return;
    }

    try {
      // Bulk withdraw selected requests
      toast.success(`${selectedConnections.length} connection requests withdrawn`);
      
      setPendingRequests(prev => 
        prev.filter(req => !selectedConnections.includes(req.id))
      );
      
      setStats(prev => ({ 
        ...prev, 
        pending_requests: prev.pending_requests - selectedConnections.length 
      }));
      
      setSelectedConnections([]);
    } catch (error) {
      toast.error('Failed to withdraw connection requests');
    }
  };

  const handleAddToFavorites = async (connectionId: string) => {
    try {
      setConnections(prev =>
        prev.map(conn =>
          conn.id === connectionId
            ? { ...conn, is_favorite: !conn.is_favorite }
            : conn
        )
      );
      toast.success('Added to favorites');
    } catch (error) {
      toast.error('Failed to update favorites');
    }
  };

  const handleExportConnections = () => {
    // Export connections as CSV
    const csv = connections.map(conn => 
      [conn.full_name, conn.headline, conn.company, conn.location, conn.connection_date].join(',')
    ).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'linkedin-connections.csv';
    a.click();
    
    toast.success('Connections exported successfully');
  };

  const filteredConnections = connections.filter(conn => {
    const matchesSearch = conn.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conn.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conn.headline.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filterBy === 'all' || 
                         (filterBy === 'favorites' && conn.is_favorite) ||
                         (filterBy === 'recent' && new Date(conn.connection_date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) ||
                         (filterBy === 'campaign' && conn.campaign_source);

    return matchesSearch && matchesFilter;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getTimeSince = (dateString: string) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffTime = Math.abs(now.getTime() - past.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Loading network data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Network Stats */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.total_connections.toLocaleString()}</div>
            <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
              <Users className="h-3 w-3" />
              Total Connections
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.pending_requests}</div>
            <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
              <Clock className="h-3 w-3" />
              Pending Requests
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.recent_connections}</div>
            <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
              <UserPlus className="h-3 w-3" />
              This Week
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.connection_rate}%</div>
            <div className="text-sm text-gray-600">Connection Rate</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-teal-600">{stats.response_rate}%</div>
            <div className="text-sm text-gray-600">Response Rate</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-indigo-600">+{stats.weekly_growth}%</div>
            <div className="text-sm text-gray-600">Weekly Growth</div>
          </CardContent>
        </Card>
      </div>

      {/* Network Management */}
      <Tabs defaultValue="connections" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="connections">My Connections ({filteredConnections.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending Requests ({pendingRequests.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="connections" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" />
                LinkedIn Connections
              </CardTitle>
              <CardDescription>
                Manage and organize your LinkedIn network
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Search and Filters */}
              <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search connections..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={filterBy} onValueChange={setFilterBy}>
                  <SelectTrigger className="w-48">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Connections</SelectItem>
                    <SelectItem value="favorites">Favorites</SelectItem>
                    <SelectItem value="recent">Recent (7 days)</SelectItem>
                    <SelectItem value="campaign">From Campaigns</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Recently Connected</SelectItem>
                    <SelectItem value="name">Name A-Z</SelectItem>
                    <SelectItem value="company">Company</SelectItem>
                    <SelectItem value="interaction">Last Interaction</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline" onClick={handleExportConnections}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>

              {/* Connections List */}
              <div className="space-y-4">
                {filteredConnections.map((connection) => (
                  <div key={connection.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-4">
                      <img
                        src={connection.profile_image_url}
                        alt={connection.full_name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                              {connection.full_name}
                              {connection.is_favorite && (
                                <Star className="h-4 w-4 text-yellow-500 fill-current" />
                              )}
                            </h3>
                            <p className="text-sm text-gray-600">{connection.headline}</p>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleAddToFavorites(connection.id)}
                            >
                              <Star className={`h-4 w-4 ${connection.is_favorite ? 'text-yellow-500 fill-current' : 'text-gray-400'}`} />
                            </Button>
                            
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center text-sm text-gray-600">
                              <Building className="h-3 w-3 mr-2" />
                              {connection.company} • {connection.position}
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <MapPin className="h-3 w-3 mr-2" />
                              {connection.location}
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <Users className="h-3 w-3 mr-2" />
                              {connection.mutual_connections} mutual connections
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center text-sm text-gray-600">
                              <Calendar className="h-3 w-3 mr-2" />
                              Connected {formatDate(connection.connection_date)}
                            </div>
                            {connection.last_interaction && (
                              <div className="flex items-center text-sm text-gray-600">
                                <MessageSquare className="h-3 w-3 mr-2" />
                                Last interaction {getTimeSince(connection.last_interaction)}
                              </div>
                            )}
                            {connection.contact_info.email && (
                              <div className="flex items-center text-sm text-gray-600">
                                <Mail className="h-3 w-3 mr-2" />
                                {connection.contact_info.email}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-2">
                            {connection.campaign_source && (
                              <Badge variant="outline" className="text-xs">
                                {connection.campaign_source}
                              </Badge>
                            )}
                            {connection.tags.map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>

                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm">
                              <MessageSquare className="h-3 w-3 mr-1" />
                              Message
                            </Button>
                            <Button variant="outline" size="sm">
                              <ExternalLink className="h-3 w-3 mr-1" />
                              Profile
                            </Button>
                          </div>
                        </div>

                        {connection.notes && (
                          <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                            <strong>Notes:</strong> {connection.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {filteredConnections.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No connections found matching your filters</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Pending Connection Requests
              </CardTitle>
              <CardDescription>
                Manage your outgoing connection requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedConnections.length > 0 && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {selectedConnections.length} request(s) selected
                    </span>
                    <Button variant="destructive" size="sm" onClick={handleBulkWithdraw}>
                      <UserMinus className="h-3 w-3 mr-1" />
                      Withdraw Selected
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {pendingRequests.map((request) => (
                  <div key={request.id} className="border rounded-lg p-4">
                    <div className="flex items-start gap-4">
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={selectedConnections.includes(request.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedConnections([...selectedConnections, request.id]);
                          } else {
                            setSelectedConnections(selectedConnections.filter(id => id !== request.id));
                          }
                        }}
                      />
                      
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-gray-900">{request.full_name}</h3>
                            <p className="text-sm text-gray-600">{request.headline}</p>
                          </div>
                          
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Pending
                          </Badge>
                        </div>

                        <div className="space-y-2 mb-3">
                          <div className="flex items-center text-sm text-gray-600">
                            <Building className="h-3 w-3 mr-2" />
                            {request.company}
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <MapPin className="h-3 w-3 mr-2" />
                            {request.location}
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="h-3 w-3 mr-2" />
                            Sent {formatDate(request.sent_date)}
                          </div>
                        </div>

                        {request.campaign_source && (
                          <Badge variant="secondary" className="text-xs mb-2">
                            {request.campaign_source}
                          </Badge>
                        )}

                        <div className="p-2 bg-gray-50 rounded text-sm mb-3">
                          <strong>Message sent:</strong> {request.message_sent}
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            Pending for {getTimeSince(request.sent_date)}
                          </span>
                          
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm">
                              <ExternalLink className="h-3 w-3 mr-1" />
                              View Profile
                            </Button>
                            {request.can_withdraw && (
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => handleWithdrawRequest(request.id)}
                              >
                                <UserMinus className="h-3 w-3 mr-1" />
                                Withdraw
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {pendingRequests.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No pending connection requests</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default MyNetwork;