import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { WorkspaceHeader } from "@/components/workspace/WorkspaceHeader";
import { WorkspaceSidebar } from "@/components/workspace/WorkspaceSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { 
  ArrowLeft,
  Target,
  Users,
  Settings,
  BarChart3,
  Webhook,
  History,
  AlertCircle,
  Upload,
  Download,
  Search,
  Plus,
  Play,
  Pause,
  Save,
  FileText,
  Trash2,
  Edit,
  Copy,
  CheckCircle2,
  Clock,
  MessageSquare,
  UserPlus,
  Building2
} from "lucide-react";

interface Message {
  id: number;
  type: 'connection' | 'followup';
  delay?: string;
  subject?: string;
  body: string;
  isActive: boolean;
  placeholders: string[];
}

export default function CampaignSetup() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isConversational, setIsConversational] = useState(false);
  const [activeTab, setActiveTab] = useState("people");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [campaignName, setCampaignName] = useState(searchParams.get('name') || "Connector Campaign");
  const [campaignType] = useState(searchParams.get('type') || "Connector");
  
  const [prospectMethod, setProspectMethod] = useState<"search" | "existing" | "csv">("search");
  const [connectionDegrees, setConnectionDegrees] = useState<string[]>(["2nd", "3rd"]);
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      type: 'connection',
      subject: '',
      body: 'Hi {first_name}, \n\nI am Vanessa,working for an AI startup as a Growth Hacker here in Silicon Valley. I just became a member of Startups Investors Group. I always try to connect with people that share similar interests and are open to learning from each other.\n\nLet\'s connect?',
      isActive: true,
      placeholders: ['{first_name}', '{last_name}', '{job_title}', '{company_name}']
    },
    {
      id: 2,
      type: 'followup',
      delay: '30 min after',
      subject: '',
      body: 'In the spirit of LinkedIn networking, if you would like an intro to anyone in my network here in Silicon Valley, please let me know ;) Happy to help.\n\nAbout me - I am a Growth Hacker of an AI company that developed a platform for customer development. We help businesses to experiment to get to their product market fit faster. You can always meet us every Wednesday at the Startup Ideation Meetup where we talk about challenges of Entrepreneurship, Go To Market Strategies, etc (https://www.meetup.com/start-up-ideation).\n\nSince I am always interested to learn more about my connections I am curious to learn a bit about you.\n\nHave a wonderful day.\n\nCheers!\nVanessa',
      isActive: true,
      placeholders: ['{first_name}', '{last_name}', '{job_title}', '{company_name}']
    },
    {
      id: 3,
      type: 'followup',
      delay: '2 days',
      subject: '',
      body: 'I just wanted to say thank you again for connecting with me a few days ago.\n\nWe recently published a sales automation blueprint for B2B companies that shows how you can automate your customer discovery and sales without spending a dollar on ads or lead generation agencies.\n\nIf this is something that could be useful for you, I am happy to send you a download link.',
      isActive: true,
      placeholders: ['{first_name}', '{last_name}', '{job_title}', '{company_name}']
    },
    {
      id: 4,
      type: 'followup',
      delay: '3 days',
      subject: '',
      body: 'Just in case you missed my last message, We just published an automation blueprint that reveals how B2B companies can automate their customer discovery and sales without spending a dollar on ads or lead generation agencies. It comes with the entire step-by-step process on how to build your automatic sales automation engine.\n\nIf this is interesting to you, I am happy to send the download link.',
      isActive: true,
      placeholders: ['{first_name}', '{last_name}', '{job_title}', '{company_name}']
    },
    {
      id: 5,
      type: 'followup',
      delay: '4 days',
      subject: '',
      body: 'I just wanted to get my message on your radar again because I know how busy we are these days. :-)\n\nYou can still ping me if you want to get a copy of our automation blueprint. But I don\'t want to be one of these LinkedIn spammers and won\'t bother you anymore.\n\nHave a wonderful day.\nVanessa',
      isActive: true,
      placeholders: ['{first_name}', '{last_name}', '{job_title}', '{company_name}']
    }
  ]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'text/csv') {
        toast({
          title: "Invalid File Type",
          description: "Please upload a CSV file.",
          variant: "destructive"
        });
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "File Too Large",
          description: "CSV file must be under 5MB.",
          variant: "destructive"
        });
        return;
      }
      
      setCsvFile(file);
      toast({
        title: "CSV Uploaded",
        description: `${file.name} has been uploaded successfully.`
      });
    }
  };

  const handleDownloadExample = () => {
    const csvContent = "profile_link,first_name,last_name,job_title,company_name,email\nhttps://linkedin.com/in/johndoe,John,Doe,CEO,TechCorp,john@techcorp.com\nhttps://linkedin.com/in/janedoe,Jane,Doe,CTO,InnovateCorp,jane@innovate.com";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'campaign_example.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleProcessCsv = () => {
    if (!csvFile) {
      toast({
        title: "No File Selected",
        description: "Please upload a CSV file first.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Processing CSV",
      description: "Your CSV file is being processed and prospects will be added to the campaign."
    });
    
    // Here you would typically send the file to your backend
    setTimeout(() => {
      toast({
        title: "CSV Processed Successfully",
        description: "1,234 prospects have been added to your campaign."
      });
    }, 2000);
  };

  const addFollowUpMessage = () => {
    const newMessage: Message = {
      id: messages.length + 1,
      type: 'followup',
      delay: '1 day',
      body: '',
      isActive: true,
      placeholders: ['{first_name}', '{last_name}', '{job_title}', '{company_name}']
    };
    setMessages([...messages, newMessage]);
  };

  const deleteMessage = (id: number) => {
    if (id === 1) return; // Don't allow deleting the main connection message
    setMessages(messages.filter(m => m.id !== id));
  };

  const updateMessage = (id: number, updates: Partial<Message>) => {
    setMessages(messages.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const handleSaveCampaign = () => {
    toast({
      title: "Campaign Saved",
      description: `${campaignName} has been saved successfully.`
    });
  };

  const handleActivateCampaign = () => {
    toast({
      title: "Campaign Activated",
      description: `${campaignName} is now active and will start processing prospects.`
    });
  };

  return (
    <SidebarProvider open={true} onOpenChange={() => {}}>
      <div className="min-h-screen flex w-full bg-gray-50">
        <WorkspaceSidebar isConversational={isConversational} />
        <div className="flex-1 flex flex-col">
          <WorkspaceHeader isConversational={isConversational} onToggleMode={setIsConversational} />
          <main className="flex-1 p-8">
            <div className="max-w-7xl mx-auto">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <Button variant="ghost" onClick={() => navigate('/campaigns')}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Campaigns
                  </Button>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                      <span className="text-2xl">🤝</span>
                      {campaignType}
                    </h1>
                    <p className="text-gray-600">{campaignName} - {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleSaveCampaign}>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                  <Button onClick={handleActivateCampaign}>
                    <Play className="h-4 w-4 mr-2" />
                    Activate
                  </Button>
                </div>
              </div>

              {/* Campaign Navigation Tabs */}
              <div className="mb-6">
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Input 
                      value={campaignName}
                      onChange={(e) => setCampaignName(e.target.value)}
                      className="font-medium border-none bg-transparent p-0 h-auto text-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Main Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="grid w-full grid-cols-7">
                  <TabsTrigger value="people" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    People
                  </TabsTrigger>
                  <TabsTrigger value="steps" className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Steps
                  </TabsTrigger>
                  <TabsTrigger value="settings" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Settings
                  </TabsTrigger>
                  <TabsTrigger value="stats" className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Stats
                  </TabsTrigger>
                  <TabsTrigger value="webhooks" className="flex items-center gap-2">
                    <Webhook className="h-4 w-4" />
                    Webhooks
                  </TabsTrigger>
                  <TabsTrigger value="history" className="flex items-center gap-2">
                    <History className="h-4 w-4" />
                    History
                  </TabsTrigger>
                  <TabsTrigger value="troubleshooting" className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Troubleshooting
                  </TabsTrigger>
                </TabsList>

                {/* People Tab */}
                <TabsContent value="people" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>How you want to add prospects?</CardTitle>
                      <CardDescription>
                        Prospects from this campaign display here. To launch the campaign please add prospects from this page or you can add prospects from search page assigning to the campaign
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Connection Degrees */}
                      <div className="space-y-3">
                        <Label className="text-base font-medium">For this type of campaign use prospects with:</Label>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="2nd-degree"
                              checked={connectionDegrees.includes("2nd")}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setConnectionDegrees([...connectionDegrees, "2nd"]);
                                } else {
                                  setConnectionDegrees(connectionDegrees.filter(d => d !== "2nd"));
                                }
                              }}
                            />
                            <Label htmlFor="2nd-degree">2nd connection degree</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="3rd-degree"
                              checked={connectionDegrees.includes("3rd")}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setConnectionDegrees([...connectionDegrees, "3rd"]);
                                } else {
                                  setConnectionDegrees(connectionDegrees.filter(d => d !== "3rd"));
                                }
                              }}
                            />
                            <Label htmlFor="3rd-degree">3rd connection degree</Label>
                          </div>
                        </div>
                      </div>

                      {/* Prospect Methods */}
                      <RadioGroup value={prospectMethod} onValueChange={setProspectMethod as any}>
                        <div className="space-y-4">
                          <div className="flex items-start space-x-3 p-4 border rounded-lg">
                            <RadioGroupItem value="search" id="search" />
                            <div className="flex-1">
                              <Label htmlFor="search" className="font-medium cursor-pointer">New URL search</Label>
                              <p className="text-sm text-gray-600 mt-1">Initiate a new search</p>
                              {prospectMethod === "search" && (
                                <Button className="mt-2" size="sm">
                                  <Search className="h-4 w-4 mr-2" />
                                  Start New Search
                                </Button>
                              )}
                            </div>
                          </div>

                          <div className="flex items-start space-x-3 p-4 border rounded-lg">
                            <RadioGroupItem value="existing" id="existing" />
                            <div className="flex-1">
                              <Label htmlFor="existing" className="font-medium cursor-pointer">Existing search</Label>
                              <p className="text-sm text-gray-600 mt-1">Add prospects from the list you have already created</p>
                              {prospectMethod === "existing" && (
                                <Select>
                                  <SelectTrigger className="mt-2 w-64">
                                    <SelectValue placeholder="Select existing search" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="search1">Tech CEOs - Silicon Valley</SelectItem>
                                    <SelectItem value="search2">Marketing Directors - SaaS</SelectItem>
                                    <SelectItem value="search3">Startup Founders - Series A</SelectItem>
                                  </SelectContent>
                                </Select>
                              )}
                            </div>
                          </div>

                          <div className="flex items-start space-x-3 p-4 border rounded-lg">
                            <RadioGroupItem value="csv" id="csv" />
                            <div className="flex-1">
                              <Label htmlFor="csv" className="font-medium cursor-pointer">Upload CSV</Label>
                              <p className="text-sm text-gray-600 mt-1">Upload leads from CSV file</p>
                              
                              {prospectMethod === "csv" && (
                                <div className="mt-4 space-y-4">
                                  {/* CSV Instructions */}
                                  <div className="bg-blue-50 p-4 rounded-lg">
                                    <h4 className="font-medium text-blue-900 mb-2">How to perform the CSV</h4>
                                    <ul className="text-sm text-blue-800 space-y-1">
                                      <li>• Every row should have a value at least for "profile_link" (this is the link to a LinkedIn contact profile)</li>
                                      <li>• All other values are optional and will be considered temporary values, until the person gets messaged and the actual values from LinkedIn are acquired</li>
                                      <li>• Any additional columns will be saved as dynamic placeholders.</li>
                                    </ul>
                                  </div>

                                  {/* CSV Example */}
                                  <div>
                                    <h4 className="font-medium mb-2">CSV example</h4>
                                    <p className="text-sm text-gray-600 mb-3">
                                      An example of the format, in which an uploaded CSV should be, can be downloaded by clicking the button.
                                    </p>
                                    <Button variant="outline" onClick={handleDownloadExample}>
                                      <Download className="h-4 w-4 mr-2" />
                                      Download Example CSV
                                    </Button>
                                  </div>

                                  {/* File Upload */}
                                  <div className="space-y-3">
                                    <div className="flex items-center space-x-2">
                                      <Checkbox id="duplicates" />
                                      <Label htmlFor="duplicates" className="text-sm">Manually select duplicates to keep</Label>
                                    </div>
                                    
                                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                                      <div className="space-y-4">
                                        <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                                        <div>
                                          <p className="text-gray-600">Drop a CSV file here or browse a file to upload</p>
                                          <p className="text-xs text-gray-500 mt-1">Max 5000 leads can be imported to the campaign</p>
                                        </div>
                                        <input
                                          type="file"
                                          accept=".csv"
                                          onChange={handleFileUpload}
                                          className="hidden"
                                          id="csv-upload"
                                        />
                                        <Label 
                                          htmlFor="csv-upload"
                                          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
                                        >
                                          <Upload className="h-4 w-4 mr-2" />
                                          Browse File
                                        </Label>
                                      </div>
                                    </div>

                                    {csvFile && (
                                      <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                                        <div className="flex items-center gap-2">
                                          <FileText className="h-4 w-4 text-green-600" />
                                          <span className="text-sm font-medium text-green-900">{csvFile.name}</span>
                                          <span className="text-xs text-green-600">({(csvFile.size / 1024).toFixed(1)}KB)</span>
                                        </div>
                                        <Button size="sm" onClick={handleProcessCsv}>
                                          Send CSV for processing
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </RadioGroup>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Steps Tab */}
                <TabsContent value="steps" className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">Set campaign steps</h3>
                      <p className="text-gray-600">From here you can setup your connection request message and follow up messages</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={addFollowUpMessage}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add follow up
                      </Button>
                      <Button onClick={handleSaveCampaign}>
                        <Save className="h-4 w-4 mr-2" />
                        Save messages
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {messages.map((message, index) => (
                      <Card key={message.id} className="overflow-hidden">
                        <CardHeader className="pb-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                                {index + 1}
                              </div>
                              <div>
                                <CardTitle className="text-base">
                                  {message.type === 'connection' ? 'Connector message' : `Follow up message ${index}`}
                                </CardTitle>
                                {message.type === 'connection' ? (
                                  <CardDescription>Personalized message you enter here will be sent along a connection request.</CardDescription>
                                ) : (
                                  <CardDescription>
                                    {index === 1 ? 'Once your connection request is accepted, you can effortlessly configure automated follow-up messages to be sent.' : 'This message will be scheduled after the delay period of the previous step is over.'}
                                  </CardDescription>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {message.type === 'followup' && (
                                <>
                                  <Select value={message.delay} onValueChange={(value) => updateMessage(message.id, { delay: value })}>
                                    <SelectTrigger className="w-32">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="30 min after">30 min after</SelectItem>
                                      <SelectItem value="1 hour">1 hour</SelectItem>
                                      <SelectItem value="2 hours">2 hours</SelectItem>
                                      <SelectItem value="1 day">1 day</SelectItem>
                                      <SelectItem value="2 days">2 days</SelectItem>
                                      <SelectItem value="3 days">3 days</SelectItem>
                                      <SelectItem value="4 days">4 days</SelectItem>
                                      <SelectItem value="1 week">1 week</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => deleteMessage(message.id)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <Label className="text-sm font-medium">
                              {message.type === 'connection' ? 'Personalized message' : 'Body'}
                            </Label>
                            <Textarea
                              value={message.body}
                              onChange={(e) => updateMessage(message.id, { body: e.target.value })}
                              className="mt-2 min-h-[120px]"
                              placeholder="Enter your message here..."
                            />
                            <div className="flex justify-between items-center mt-2">
                              <p className="text-xs text-gray-500">
                                Characters remaining: {275 - message.body.length}/275
                              </p>
                            </div>
                          </div>

                          {message.type === 'connection' && (
                            <div>
                              <Label className="text-sm font-medium">Enter alternative message</Label>
                              <Textarea
                                className="mt-2 min-h-[60px]"
                                placeholder="Alternative message..."
                              />
                              <p className="text-xs text-gray-500 mt-1">Characters remaining: 115/115</p>
                            </div>
                          )}

                          <div className="border-t pt-4">
                            <h4 className="text-sm font-medium mb-2">Personalize your message with placeholders</h4>
                            <div className="flex flex-wrap gap-2">
                              {message.placeholders.map((placeholder) => (
                                <Badge 
                                  key={placeholder}
                                  variant="outline"
                                  className="cursor-pointer hover:bg-gray-100"
                                  onClick={() => {
                                    const textarea = document.querySelector(`textarea[value*="${message.body}"]`) as HTMLTextAreaElement;
                                    if (textarea) {
                                      const cursorPos = textarea.selectionStart;
                                      const textBefore = message.body.substring(0, cursorPos);
                                      const textAfter = message.body.substring(cursorPos);
                                      updateMessage(message.id, { body: textBefore + placeholder + textAfter });
                                    }
                                  }}
                                >
                                  {placeholder}
                                </Badge>
                              ))}
                              <Badge variant="outline" className="cursor-pointer hover:bg-gray-100">Hyperise</Badge>
                              <Badge variant="outline" className="cursor-pointer hover:bg-gray-100">Dynamic Placeholder</Badge>
                            </div>
                          </div>

                          <div className="border-t pt-4">
                            <div className="flex items-center justify-between">
                              <Label className="text-sm font-medium">Select Hyperise Image</Label>
                              <Button variant="outline" size="sm">
                                Select Image
                              </Button>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Current active Hyperise:</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                {/* Settings Tab */}
                <TabsContent value="settings" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Campaign Settings</CardTitle>
                      <CardDescription>Configure your campaign parameters and behavior</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="daily-limit">Daily connection requests limit</Label>
                            <Input id="daily-limit" type="number" defaultValue="15" />
                          </div>
                          <div>
                            <Label htmlFor="weekly-limit">Weekly connection requests limit</Label>
                            <Input id="weekly-limit" type="number" defaultValue="100" />
                          </div>
                          <div>
                            <Label htmlFor="timezone">Timezone</Label>
                            <Select defaultValue="pst">
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pst">Pacific Standard Time (PST)</SelectItem>
                                <SelectItem value="est">Eastern Standard Time (EST)</SelectItem>
                                <SelectItem value="utc">Coordinated Universal Time (UTC)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="start-time">Start time</Label>
                            <Input id="start-time" type="time" defaultValue="09:00" />
                          </div>
                          <div>
                            <Label htmlFor="end-time">End time</Label>
                            <Input id="end-time" type="time" defaultValue="17:00" />
                          </div>
                          <div className="space-y-2">
                            <Label>Active days</Label>
                            <div className="flex gap-2">
                              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                                <div key={day} className="flex items-center space-x-2">
                                  <Checkbox id={day} defaultChecked={day !== 'Sat' && day !== 'Sun'} />
                                  <Label htmlFor={day} className="text-sm">{day}</Label>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Stats Tab */}
                <TabsContent value="stats" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-2xl font-bold text-gray-900">0</div>
                            <div className="text-sm text-gray-600">Total Prospects</div>
                          </div>
                          <Users className="h-8 w-8 text-blue-600" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-2xl font-bold text-gray-900">0</div>
                            <div className="text-sm text-gray-600">Connections Sent</div>
                          </div>
                          <UserPlus className="h-8 w-8 text-green-600" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-2xl font-bold text-gray-900">0</div>
                            <div className="text-sm text-gray-600">Connections Accepted</div>
                          </div>
                          <CheckCircle2 className="h-8 w-8 text-purple-600" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-2xl font-bold text-gray-900">0%</div>
                            <div className="text-sm text-gray-600">Acceptance Rate</div>
                          </div>
                          <BarChart3 className="h-8 w-8 text-orange-600" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Campaign Performance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center text-gray-500 py-12">
                        <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>No data available yet. Activate your campaign to start collecting statistics.</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Webhooks Tab */}
                <TabsContent value="webhooks" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Webhook Configuration</CardTitle>
                      <CardDescription>Set up webhooks to receive real-time updates about your campaign</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="webhook-url">Webhook URL</Label>
                          <Input 
                            id="webhook-url" 
                            placeholder="https://your-domain.com/webhook" 
                            type="url"
                          />
                        </div>
                        <div>
                          <Label>Events to receive</Label>
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            {[
                              'Connection sent',
                              'Connection accepted',
                              'Connection declined',
                              'Message sent',
                              'Message replied',
                              'Campaign completed'
                            ].map((event) => (
                              <div key={event} className="flex items-center space-x-2">
                                <Checkbox id={event} />
                                <Label htmlFor={event} className="text-sm">{event}</Label>
                              </div>
                            ))}
                          </div>
                        </div>
                        <Button>
                          <Save className="h-4 w-4 mr-2" />
                          Save Webhook
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* History Tab */}
                <TabsContent value="history" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Campaign History</CardTitle>
                      <CardDescription>View all activities and changes made to this campaign</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center text-gray-500 py-12">
                        <History className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>No history available yet. Campaign activities will appear here once you start the campaign.</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Troubleshooting Tab */}
                <TabsContent value="troubleshooting" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Troubleshooting</CardTitle>
                      <CardDescription>Common issues and solutions for your campaign</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-r-lg">
                          <h4 className="font-medium text-blue-900">LinkedIn Connection Limits</h4>
                          <p className="text-sm text-blue-800 mt-1">
                            LinkedIn limits connection requests to 100-300 per week depending on your account type and history.
                          </p>
                        </div>

                        <div className="border-l-4 border-yellow-500 bg-yellow-50 p-4 rounded-r-lg">
                          <h4 className="font-medium text-yellow-900">2FA Requirements</h4>
                          <p className="text-sm text-yellow-800 mt-1">
                            Some campaign types require LinkedIn 2FA to be enabled for security purposes.
                          </p>
                        </div>

                        <div className="border-l-4 border-red-500 bg-red-50 p-4 rounded-r-lg">
                          <h4 className="font-medium text-red-900">Account Safety</h4>
                          <p className="text-sm text-red-800 mt-1">
                            Always follow LinkedIn's terms of service to avoid account restrictions or suspension.
                          </p>
                        </div>

                        <div className="border-l-4 border-green-500 bg-green-50 p-4 rounded-r-lg">
                          <h4 className="font-medium text-green-900">Best Practices</h4>
                          <p className="text-sm text-green-800 mt-1">
                            Personalize your messages, respect daily limits, and maintain a professional tone for better results.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}