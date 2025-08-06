import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { 
  Mail, 
  Linkedin, 
  Phone, 
  Building2, 
  MapPin, 
  Search,
  Filter,
  Plus,
  Users,
  Star,
  TrendingUp,
  MoreHorizontal,
  UserPlus,
  MessageSquare
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Contacts() {
  const contacts = [
    {
      id: 1,
      name: "Jennifer Fleming",
      email: "jennifer.fleming@techcorp.com",
      phone: "+1 (555) 123-4567",
      company: "TechCorp Solutions",
      role: "VP of Sales",
      location: "San Francisco, CA",
      linkedin: "linkedin.com/in/jennifer-fleming",
      status: "Hot Lead",
      lastContact: "2 days ago",
      avatar: "/placeholder.svg",
      tags: ["Enterprise", "Decision Maker"]
    },
    {
      id: 2,
      name: "David Chen",
      email: "david.chen@innovatelabs.io",
      phone: "+1 (555) 987-6543",
      company: "InnovateLabs",
      role: "CTO",
      location: "Austin, TX",
      linkedin: "linkedin.com/in/david-chen-cto",
      status: "Warm Lead",
      lastContact: "1 week ago",
      avatar: "/placeholder.svg",
      tags: ["Tech", "Startup"]
    },
    {
      id: 3,
      name: "Sarah Williams",
      email: "sarah.williams@growthmetrics.com",
      phone: "+1 (555) 456-7890",
      company: "GrowthMetrics",
      role: "Head of Marketing",
      location: "New York, NY",
      linkedin: "linkedin.com/in/sarahwilliams",
      status: "Prospect",
      lastContact: "3 days ago",
      avatar: "/placeholder.svg",
      tags: ["Marketing", "B2B"]
    },
    {
      id: 4,
      name: "Michael Rodriguez",
      email: "michael.r@scalecorp.com",
      phone: "+1 (555) 789-0123",
      company: "ScaleCorp",
      role: "Operations Director",
      location: "Chicago, IL",
      linkedin: "linkedin.com/in/michaelrodriguez",
      status: "New Contact",
      lastContact: "Never",
      avatar: "/placeholder.svg",
      tags: ["Operations", "Mid-Market"]
    },
    {
      id: 5,
      name: "Emily Johnson",
      email: "emily.johnson@financeplus.com",
      phone: "+1 (555) 234-5678",
      company: "FinancePlus",
      role: "CFO",
      location: "Boston, MA",
      linkedin: "linkedin.com/in/emilyjohnson-cfo",
      status: "Replied",
      lastContact: "1 day ago",
      avatar: "/placeholder.svg",
      tags: ["Finance", "C-Level"]
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Hot Lead": return "default";
      case "Warm Lead": return "secondary";
      case "Replied": return "outline";
      case "Prospect": return "outline";
      case "New Contact": return "destructive";
      default: return "outline";
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Contacts</h1>
          <p className="text-gray-600 mt-1">Manage your contact database and relationships</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            Add Contact
          </Button>
        </div>
      </div>

      {/* Search and Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-1">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search contacts..."
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">2,847</div>
                <div className="text-sm text-gray-600">Total Contacts</div>
              </div>
              <Users className="h-8 w-8 text-premium-purple" />
            </div>
            <p className="text-xs text-green-600 mt-2">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              +15 this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">156</div>
                <div className="text-sm text-gray-600">Hot Leads</div>
              </div>
              <Star className="h-8 w-8 text-premium-orange" />
            </div>
            <p className="text-xs text-green-600 mt-2">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              +8 this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">89</div>
                <div className="text-sm text-gray-600">Replied</div>
              </div>
              <MessageSquare className="h-8 w-8 text-premium-cyan" />
            </div>
            <p className="text-xs text-green-600 mt-2">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              +12 today
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Contacts List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {contacts.map((contact) => (
          <Card key={contact.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={contact.avatar} alt={contact.name} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {contact.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{contact.name}</h3>
                    <p className="text-sm text-premium-purple font-medium">{contact.role}</p>
                    <p className="text-sm text-gray-600">{contact.company}</p>
                  </div>
                </div>
                
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
                      Edit Contact
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600">
                      Delete Contact
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="h-3 w-3" />
                  <span className="truncate">{contact.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="h-3 w-3" />
                  <span>{contact.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="h-3 w-3" />
                  <span>{contact.location}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <Badge variant={getStatusColor(contact.status)}>
                  {contact.status}
                </Badge>
              </div>

              <div className="flex flex-wrap gap-1 mb-4">
                {contact.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>

              <div className="flex gap-2">
                <Button size="sm" className="flex-1">
                  <Mail className="h-3 w-3 mr-1" />
                  Email
                </Button>
                <Button size="sm" variant="outline" className="flex-1">
                  <Linkedin className="h-3 w-3 mr-1" />
                  LinkedIn
                </Button>
              </div>

              <div className="text-xs text-gray-500 mt-3">
                Last contact: {contact.lastContact}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}