import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Hash, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Copy, 
  FileText,
  Code,
  Type,
  Calendar,
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  Globe,
  TrendingUp,
  Target,
  MoreHorizontal
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Placeholders() {
  const [newPlaceholder, setNewPlaceholder] = useState({ name: "", description: "", value: "", category: "contact" });

  const placeholders = [
    {
      id: 1,
      name: "firstName",
      description: "Contact's first name",
      value: "{{firstName}}",
      category: "Contact Info",
      usage: 245,
      type: "text",
      examples: ["John", "Sarah", "Michael"],
      icon: <User className="h-4 w-4" />
    },
    {
      id: 2,
      name: "lastName",
      description: "Contact's last name",
      value: "{{lastName}}",
      category: "Contact Info",
      usage: 189,
      type: "text",
      examples: ["Smith", "Johnson", "Williams"],
      icon: <User className="h-4 w-4" />
    },
    {
      id: 3,
      name: "companyName",
      description: "Contact's company name",
      value: "{{companyName}}",
      category: "Company Info",
      usage: 312,
      type: "text",
      examples: ["TechCorp Inc.", "InnovateLabs", "ScaleUp Solutions"],
      icon: <Building2 className="h-4 w-4" />
    },
    {
      id: 4,
      name: "jobTitle",
      description: "Contact's job title",
      value: "{{jobTitle}}",
      category: "Contact Info",
      usage: 278,
      type: "text",
      examples: ["VP of Sales", "CTO", "Marketing Director"],
      icon: <User className="h-4 w-4" />
    },
    {
      id: 5,
      name: "email",
      description: "Contact's email address",
      value: "{{email}}",
      category: "Contact Info",
      usage: 156,
      type: "email",
      examples: ["john@company.com", "sarah@example.org"],
      icon: <Mail className="h-4 w-4" />
    },
    {
      id: 6,
      name: "phone",
      description: "Contact's phone number",
      value: "{{phone}}",
      category: "Contact Info",
      usage: 89,
      type: "phone",
      examples: ["+1 (555) 123-4567", "+1 (555) 987-6543"],
      icon: <Phone className="h-4 w-4" />
    },
    {
      id: 7,
      name: "city",
      description: "Contact's city",
      value: "{{city}}",
      category: "Location",
      usage: 134,
      type: "text",
      examples: ["San Francisco", "New York", "Austin"],
      icon: <MapPin className="h-4 w-4" />
    },
    {
      id: 8,
      name: "website",
      description: "Company website",
      value: "{{website}}",
      category: "Company Info",
      usage: 98,
      type: "url",
      examples: ["techcorp.com", "innovatelabs.io"],
      icon: <Globe className="h-4 w-4" />
    },
    {
      id: 9,
      name: "currentDate",
      description: "Today's date",
      value: "{{currentDate}}",
      category: "Dynamic",
      usage: 67,
      type: "date",
      examples: ["January 15, 2024", "2024-01-15"],
      icon: <Calendar className="h-4 w-4" />
    },
    {
      id: 10,
      name: "senderName",
      description: "Your name",
      value: "{{senderName}}",
      category: "Sender Info",
      usage: 234,
      type: "text",
      examples: ["Jennifer Smith", "Alex Johnson"],
      icon: <User className="h-4 w-4" />
    }
  ];

  const categories = ["Contact Info", "Company Info", "Location", "Dynamic", "Sender Info"];

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Contact Info": return <User className="h-4 w-4 text-blue-600" />;
      case "Company Info": return <Building2 className="h-4 w-4 text-purple-600" />;
      case "Location": return <MapPin className="h-4 w-4 text-green-600" />;
      case "Dynamic": return <Calendar className="h-4 w-4 text-orange-600" />;
      case "Sender Info": return <User className="h-4 w-4 text-cyan-600" />;
      default: return <Hash className="h-4 w-4" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "text": return <Type className="h-3 w-3" />;
      case "email": return <Mail className="h-3 w-3" />;
      case "phone": return <Phone className="h-3 w-3" />;
      case "url": return <Globe className="h-3 w-3" />;
      case "date": return <Calendar className="h-3 w-3" />;
      default: return <Code className="h-3 w-3" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Placeholders</h1>
          <p className="text-gray-600 mt-1">Manage dynamic variables for your templates</p>
        </div>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Placeholder
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Placeholder</DialogTitle>
                <DialogDescription>
                  Create a new placeholder variable for your templates
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Placeholder Name</label>
                  <Input
                    placeholder="e.g., companySize"
                    value={newPlaceholder.name}
                    onChange={(e) => setNewPlaceholder({...newPlaceholder, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Input
                    placeholder="Brief description of what this placeholder represents"
                    value={newPlaceholder.description}
                    onChange={(e) => setNewPlaceholder({...newPlaceholder, description: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <Select value={newPlaceholder.category} onValueChange={(value) => setNewPlaceholder({...newPlaceholder, category: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category.toLowerCase().replace(' ', '-')}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Default Value</label>
                  <Textarea
                    placeholder="Optional default value or fallback text"
                    value={newPlaceholder.value}
                    onChange={(e) => setNewPlaceholder({...newPlaceholder, value: e.target.value})}
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline">Cancel</Button>
                  <Button>Create Placeholder</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search and Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-1">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search placeholders..."
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">{placeholders.length}</div>
                <div className="text-sm text-gray-600">Total Placeholders</div>
              </div>
              <Hash className="h-8 w-8 text-premium-purple" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">{categories.length}</div>
                <div className="text-sm text-gray-600">Categories</div>
              </div>
              <FileText className="h-8 w-8 text-premium-cyan" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {Math.round(placeholders.reduce((sum, p) => sum + p.usage, 0) / placeholders.length)}
                </div>
                <div className="text-sm text-gray-600">Avg Usage</div>
              </div>
              <TrendingUp className="h-8 w-8 text-premium-orange" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Placeholders by Category */}
      <div className="space-y-6">
        {categories.map((category) => {
          const categoryPlaceholders = placeholders.filter(p => p.category === category);
          if (categoryPlaceholders.length === 0) return null;

          return (
            <Card key={category}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  {getCategoryIcon(category)}
                  <CardTitle className="text-lg">{category}</CardTitle>
                  <Badge variant="outline">{categoryPlaceholders.length} placeholders</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryPlaceholders.map((placeholder) => (
                    <Card key={placeholder.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {placeholder.icon}
                            <span className="font-mono text-sm font-medium text-primary">
                              {placeholder.value}
                            </span>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6">
                                <MoreHorizontal className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Copy className="h-4 w-4 mr-2" />
                                Copy
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">{placeholder.name}</h4>
                          <p className="text-xs text-gray-600">{placeholder.description}</p>
                          
                          <div className="flex items-center gap-2">
                            {getTypeIcon(placeholder.type)}
                            <span className="text-xs text-gray-500 capitalize">{placeholder.type}</span>
                            <span className="text-xs text-gray-500">•</span>
                            <span className="text-xs text-gray-500">{placeholder.usage} uses</span>
                          </div>

                          {placeholder.examples && placeholder.examples.length > 0 && (
                            <div className="mt-3">
                              <div className="text-xs font-medium text-gray-700 mb-1">Examples:</div>
                              <div className="space-y-1">
                                {placeholder.examples.slice(0, 2).map((example, index) => (
                                  <div key={index} className="text-xs text-gray-600 font-mono bg-gray-50 px-2 py-1 rounded">
                                    {example}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full mt-3"
                            onClick={() => navigator.clipboard.writeText(placeholder.value)}
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Copy Placeholder
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Usage Guide */}
      <Card>
        <CardHeader>
          <CardTitle>How to Use Placeholders</CardTitle>
          <CardDescription>Guidelines for using placeholders in your templates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Basic Usage</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <p>• Use double curly braces: <code className="bg-gray-100 px-1 rounded">{{`{{placeholder}}`}}</code></p>
                <p>• Placeholders are case-sensitive</p>
                <p>• Use camelCase for placeholder names</p>
                <p>• Avoid spaces and special characters</p>
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Example Template</h4>
              <div className="bg-gray-50 p-3 rounded-lg text-sm font-mono">
                <div>Hi {'{{firstName}}'},</div>
                <br />
                <div>I noticed {'{{companyName}}'} has been growing rapidly...</div>
                <br />
                <div>Best regards,</div>
                <div>{'{{senderName}}'}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}