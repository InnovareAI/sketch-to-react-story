import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Building2, 
  Mail, 
  Linkedin, 
  Users, 
  TrendingUp, 
  Phone,
  Globe,
  MapPin,
  Star,
  Plus,
  Filter,
  Search,
  Download,
  Upload,
  Edit,
  Grid3X3,
  List,
  MoreHorizontal,
  UserPlus,
  MessageSquare,
  Calendar,
  DollarSign,
  Target
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Accounts() {
  const [viewMode, setViewMode] = useState<"list" | "tile">("tile");
  
  const accounts = [
    {
      id: 1,
      name: "Jennifer Fleming",
      company: "TechCorp Solutions",
      role: "VP of Sales",
      email: "jennifer.fleming@techcorp.com",
      phone: "+1 (555) 123-4567",
      linkedin: "linkedin.com/in/jennifer-fleming",
      website: "techcorp.com",
      location: "San Francisco, CA",
      status: "Hot Lead",
      lastContact: "2 days ago",
      responseRate: 85,
      avatar: "/placeholder.svg",
      campaigns: 3,
      meetings: 2,
      revenue: "$45,000"
    },
    {
      id: 2,
      name: "David Chen",
      company: "InnovateLabs",
      role: "CTO",
      email: "david.chen@innovatelabs.io",
      phone: "+1 (555) 987-6543",
      linkedin: "linkedin.com/in/david-chen-cto",
      website: "innovatelabs.io",
      location: "Austin, TX",
      status: "Warm Lead",
      lastContact: "1 week ago",
      responseRate: 72,
      avatar: "/placeholder.svg",
      campaigns: 2,
      meetings: 1,
      revenue: "$28,500"
    },
    {
      id: 3,
      name: "Sarah Williams",
      company: "GrowthMetrics",
      role: "Head of Marketing",
      email: "sarah.williams@growthmetrics.com",
      phone: "+1 (555) 456-7890",
      linkedin: "linkedin.com/in/sarahwilliams",
      website: "growthmetrics.com",
      location: "New York, NY",
      status: "Prospect",
      lastContact: "3 days ago",
      responseRate: 68,
      avatar: "/placeholder.svg",
      campaigns: 1,
      meetings: 0,
      revenue: "$0"
    }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Accounts</h1>
          <p className="text-gray-600 mt-1">Manage your contacts and target accounts</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Upload
          </Button>
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            Add Account
          </Button>
        </div>
      </div>

      {/* Search, View Toggle and Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
        <Card className="lg:col-span-2">
          <CardContent className="p-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, company..."
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">View:</span>
              <div className="flex rounded-lg border border-border overflow-hidden">
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="rounded-none"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "tile" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("tile")}
                  className="rounded-none"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Accounts</CardTitle>
            <Building2 className="h-4 w-4 text-premium-purple" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">247</div>
            <p className="text-xs text-green-600 mt-1">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              +15 this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Hot Leads</CardTitle>
            <Star className="h-4 w-4 text-premium-orange" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">23</div>
            <p className="text-xs text-green-600 mt-1">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              +8 this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pipeline Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-premium-cyan" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">$1.2M</div>
            <p className="text-xs text-green-600 mt-1">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              +22% vs last quarter
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Accounts Content - Conditional Rendering */}
      {viewMode === "list" ? (
        /* List View */
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900">Accounts List</CardTitle>
            <CardDescription>Detailed view of all your accounts</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contact</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Response Rate</TableHead>
                  <TableHead>Campaigns</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Last Contact</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map((account) => (
                  <TableRow key={account.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={account.avatar} alt={account.name} />
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {account.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-gray-900">{account.name}</div>
                          <div className="text-sm text-gray-600">{account.role}</div>
                          <div className="text-xs text-gray-500">{account.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-gray-400" />
                        <div>
                          <div className="font-medium">{account.company}</div>
                          <div className="text-sm text-gray-500">{account.location}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        account.status === "Hot Lead" ? "default" :
                        account.status === "Warm Lead" ? "secondary" : "outline"
                      }>
                        {account.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm font-medium">{account.responseRate}%</div>
                        <Progress value={account.responseRate} className="h-1 w-16" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-center">
                        <div className="text-lg font-semibold">{account.campaigns}</div>
                        <div className="text-xs text-gray-500">active</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-premium-cyan">{account.revenue}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-600">{account.lastContact}</div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Mail className="h-4 w-4 mr-2" />
                            Send Email
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Linkedin className="h-4 w-4 mr-2" />
                            LinkedIn Message
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Add to Campaign
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Account
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        /* Tile View - Enhanced Trello-like Cards */
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {accounts.map((account) => (
            <Card key={account.id} className="hover:shadow-lg transition-all duration-200 hover-scale">
              <CardContent className="p-6">
                {/* Card Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={account.avatar} alt={account.name} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                        {account.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900">{account.name}</h3>
                      <p className="text-lg text-premium-purple font-medium">{account.role}</p>
                      <p className="text-gray-600">{account.company}</p>
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
                        <Mail className="h-4 w-4 mr-2" />
                        Send Email
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Linkedin className="h-4 w-4 mr-2" />
                        LinkedIn Message
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add to Campaign
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Account
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Status Badge */}
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant={
                    account.status === "Hot Lead" ? "default" :
                    account.status === "Warm Lead" ? "secondary" : "outline"
                  }>
                    {account.status}
                  </Badge>
                  <div className="text-xs text-gray-500">Last contact: {account.lastContact}</div>
                </div>

                {/* Contact Details */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="h-4 w-4" />
                    <span className="truncate">{account.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="h-4 w-4" />
                    <span>{account.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Linkedin className="h-4 w-4" />
                    <span className="truncate">{account.linkedin}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span>{account.location}</span>
                  </div>
                </div>

                {/* Response Rate */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Response Rate</span>
                    <span className="text-sm font-medium">{account.responseRate}%</span>
                  </div>
                  <Progress value={account.responseRate} className="h-2" />
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Target className="h-4 w-4 text-premium-purple" />
                    </div>
                    <div className="text-lg font-semibold text-gray-900">{account.campaigns}</div>
                    <div className="text-xs text-gray-600">Campaigns</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Calendar className="h-4 w-4 text-premium-cyan" />
                    </div>
                    <div className="text-lg font-semibold text-gray-900">{account.meetings}</div>
                    <div className="text-xs text-gray-600">Meetings</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <DollarSign className="h-4 w-4 text-premium-orange" />
                    </div>
                    <div className="text-lg font-semibold text-premium-cyan">{account.revenue}</div>
                    <div className="text-xs text-gray-600">Revenue</div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1 animate-fade-in">
                    <Mail className="h-3 w-3 mr-1" />
                    Email
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 animate-fade-in">
                    <Linkedin className="h-3 w-3 mr-1" />
                    LinkedIn
                  </Button>
                  <Button size="sm" variant="outline" className="animate-fade-in">
                    <MessageSquare className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}