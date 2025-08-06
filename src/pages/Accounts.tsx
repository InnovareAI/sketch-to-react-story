import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
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
  Search
} from "lucide-react";
import { Input } from "@/components/ui/input";

export default function Accounts() {
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
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            Add Account
          </Button>
        </div>
      </div>

      {/* Search and Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Search Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, company..."
                className="pl-10"
              />
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

      {/* Account List */}
      <div className="space-y-4">
        {accounts.map((account) => (
          <Card key={account.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Contact Info */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={account.avatar} alt={account.name} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                        {account.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-semibold text-gray-900">{account.name}</h3>
                        <Badge variant={
                          account.status === "Hot Lead" ? "default" :
                          account.status === "Warm Lead" ? "secondary" : "outline"
                        }>
                          {account.status}
                        </Badge>
                      </div>
                      <p className="text-lg text-premium-purple font-medium">{account.role}</p>
                      <p className="text-gray-600">{account.company}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="h-4 w-4" />
                      <span>{account.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="h-4 w-4" />
                      <span>{account.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Linkedin className="h-4 w-4" />
                      <span>{account.linkedin}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span>{account.location}</span>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Response Rate</span>
                      <span className="text-sm font-medium">{account.responseRate}%</span>
                    </div>
                    <Progress value={account.responseRate} className="h-2" />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <div className="text-lg font-semibold text-gray-900">{account.campaigns}</div>
                      <div className="text-xs text-gray-600">Campaigns</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-gray-900">{account.meetings}</div>
                      <div className="text-xs text-gray-600">Meetings</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-premium-cyan">{account.revenue}</div>
                      <div className="text-xs text-gray-600">Revenue</div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  <Button className="w-full bg-primary hover:bg-primary/90">
                    <Mail className="h-4 w-4 mr-2" />
                    Send Email
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Linkedin className="h-4 w-4 mr-2" />
                    LinkedIn Message
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Users className="h-4 w-4 mr-2" />
                    Add to Campaign
                  </Button>
                  <div className="text-xs text-gray-500 mt-2">
                    Last contact: {account.lastContact}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}