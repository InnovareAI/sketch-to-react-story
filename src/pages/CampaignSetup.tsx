import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import CampaignSetupFlow from "@/components/campaigns/CampaignSetupFlow";
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
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useWorkspace } from '@/hooks/useWorkspace';
import { useAuth } from '@/contexts/AuthContext';
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
  Building2,
  Calendar
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
  const { toast: showToast } = useToast();
  
  // If a campaign type is specified in the URL, use the new flow
  const campaignTypeParam = searchParams.get('type');
  if (campaignTypeParam) {
    return <CampaignSetupFlow />;
  }
  
  const [activeTab, setActiveTab] = useState("people");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [campaignName, setCampaignName] = useState(searchParams.get('name') || "Connector Campaign");
  const [campaignType] = useState("Connector");
  const [campaignId, setCampaignId] = useState<string | null>(searchParams.get('id'));
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchUrl, setSearchUrl] = useState<string>("");
  
  const [prospectMethod, setProspectMethod] = useState<"search" | "existing" | "csv">("search");
  const [connectionDegrees, setConnectionDegrees] = useState<string[]>(["2nd", "3rd"]);
  const [dailyContactLimit, setDailyContactLimit] = useState(20);
  const [dailyFollowupLimit, setDailyFollowupLimit] = useState(50);
  const [campaignPriority, setCampaignPriority] = useState<"low" | "medium" | "high">("medium");
  const [usePriority, setUsePriority] = useState(false);
  const [startImmediately, setStartImmediately] = useState(true);
  const [scheduledDate, setScheduledDate] = useState<string>("");
  const [autoSaving, setAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [selectedPeople, setSelectedPeople] = useState<any[]>([]);
  const { workspace, workspaceId } = useWorkspace();
  const { user } = useAuth();
  
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

  // Load workspace on mount
  useEffect(() => {
    // Workspace is now loaded via useWorkspace hook
    if (campaignId) {
      loadCampaign(campaignId);
    }
  }, [campaignId]);

  // Workspace loading now handled by useWorkspace hook

  const loadCampaign = async (id: string) => {
    setLoading(true);
    try {
      const { data: campaign, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      if (campaign) {
        setCampaignName(campaign.name);
        setDailyContactLimit(campaign.settings?.daily_contact_limit || 20);
        setDailyFollowupLimit(campaign.settings?.daily_followup_limit || 50);
        setCampaignPriority(campaign.settings?.priority || 'medium');
        setUsePriority(campaign.settings?.use_priority || false);
        setStartImmediately(campaign.settings?.start_immediately !== false);
        setScheduledDate(campaign.settings?.scheduled_date || '');
        
        // Load messages
        if (campaign.settings?.messages) {
          setMessages(campaign.settings.messages);
        }
      }
    } catch (error) {
      console.error('Error loading campaign:', error);
      toast.error('Failed to load campaign');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCampaign = async (isAutoSave = false) => {
    console.log('Attempting to save campaign, workspaceId:', workspaceId);
    if (!workspaceId) {
      if (!isAutoSave) toast.error('No workspace found. Please try refreshing the page.');
      console.error('workspaceId is missing:', { workspace, workspaceId });
      return false;
    }
    
    if (!user?.id) {
      if (!isAutoSave) toast.error('User not found. Please try refreshing the page.');
      console.error('user is missing:', { user });
      return false;
    }
    
    if (!campaignName.trim()) {
      if (!isAutoSave) toast.error('Please enter a campaign name');
      return false;
    }

    if (isAutoSave) {
      setAutoSaving(true);
    } else {
      setSaving(true);
    }
    
    try {
      const campaignData = {
        workspace_id: workspaceId,
        tenant_id: workspaceId, // Required NOT NULL field
        user_id: user.id, // Required NOT NULL field for RLS policy
        name: campaignName,
        type: campaignType.toLowerCase(),
        status: 'draft',
        description: `${campaignType} campaign created on ${new Date().toLocaleDateString()}`,
        settings: {
          daily_contact_limit: dailyContactLimit,
          daily_followup_limit: dailyFollowupLimit,
          priority: campaignPriority,
          use_priority: usePriority,
          start_immediately: startImmediately,
          scheduled_date: scheduledDate,
          prospect_method: prospectMethod,
          connection_degrees: connectionDegrees,
          messages: messages,
          csv_file: csvFile?.name || null,
          search_url: searchUrl || null,
          selected_people: selectedPeople || []
        }
      };

      if (campaignId) {
        // Update existing campaign
        const { error } = await supabase
          .from('campaigns')
          .update(campaignData)
          .eq('id', campaignId);
        
        if (error) throw error;
        
        if (!isAutoSave) toast.success('Campaign updated successfully');
      } else {
        // Create new campaign
        const { data, error } = await supabase
          .from('campaigns')
          .insert(campaignData)
          .select()
          .single();
        
        if (error) throw error;
        
        if (data) {
          setCampaignId(data.id);
          // Update URL with campaign ID
          const newParams = new URLSearchParams(searchParams);
          newParams.set('id', data.id);
          window.history.replaceState({}, '', `${window.location.pathname}?${newParams}`);
        }
        
        if (!isAutoSave) toast.success('Campaign created successfully');
      }
      
      setLastSaved(new Date());
      return true;
    } catch (error) {
      console.error('Error saving campaign:', error);
      if (!isAutoSave) toast.error(`Failed to save campaign: ${error.message || 'Unknown error'}`);
      return false;
    } finally {
      if (isAutoSave) {
        setAutoSaving(false);
      } else {
        setSaving(false);
      }
    }
  };

  // Auto-save function
  const performAutoSave = async () => {
    if (!workspaceId || !user?.id || !campaignName.trim()) {
      return; // Skip auto-save if missing required data
    }
    
    console.log('Performing auto-save...');
    await handleSaveCampaign(true);
  };

  // Auto-save effect - save every 30 seconds when there are changes
  useEffect(() => {
    if (!campaignName.trim() || !workspaceId || !user?.id) {
      return; // Skip setting up auto-save if required data missing
    }

    const autoSaveInterval = setInterval(() => {
      performAutoSave();
    }, 30000); // Auto-save every 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [campaignName, workspaceId, user?.id]); // Reduced dependencies to prevent frequent re-creation

  // Auto-save when user leaves the page or switches tabs
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (campaignName.trim() && workspaceId && user?.id) {
        performAutoSave();
        event.preventDefault();
        event.returnValue = '';
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden && campaignName.trim() && workspaceId && user?.id) {
        performAutoSave();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [campaignName, workspaceId, user?.id]);

  const handleActivateCampaign = async () => {
    if (!campaignId) {
      toast.error('Please save the campaign first');
      return;
    }

    try {
      const { error } = await supabase
        .from('campaigns')
        .update({ 
          status: 'active',
          started_at: new Date().toISOString()
        })
        .eq('id', campaignId);
      
      if (error) throw error;
      
      toast.success(`${campaignName} is now active and will start processing prospects.`);
      navigate('/campaigns');
    } catch (error) {
      console.error('Error activating campaign:', error);
      toast.error('Failed to activate campaign');
    }
  };

  return (
    <div className="flex-1 bg-gray-50">
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
                  <Button 
                    variant="outline" 
                    onClick={() => handleSaveCampaign(false)}
                    disabled={saving || autoSaving}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Saving...' : autoSaving ? 'Auto-saving...' : 'Save'}
                  </Button>
                  <Button onClick={handleActivateCampaign}>
                    <Play className="h-4 w-4 mr-2" />
                    Activate
                  </Button>
                </div>
              </div>

              {/* Campaign Navigation Tabs */}
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Input 
                        value={campaignName}
                        onChange={(e) => setCampaignName(e.target.value)}
                        className="font-medium border-none bg-transparent p-0 h-auto text-lg"
                      />
                    </div>
                  </div>
                  
                  {/* Auto-save Status */}
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    {autoSaving && (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                        <span>Auto-saving...</span>
                      </>
                    )}
                    {lastSaved && !autoSaving && (
                      <>
                        <CheckCircle2 className="h-3 w-3 text-green-600" />
                        <span>Last saved: {lastSaved.toLocaleTimeString()}</span>
                      </>
                    )}
                    {!lastSaved && !autoSaving && campaignName.trim() && (
                      <>
                        <Clock className="h-3 w-3 text-orange-500" />
                        <span>Unsaved changes</span>
                      </>
                    )}
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
                      {/* Search URL Field */}
                      <div className="space-y-2">
                        <Label htmlFor="search-url">LinkedIn or Sales Navigator Search URL</Label>
                        <Textarea
                          id="search-url"
                          value={searchUrl}
                          onChange={(e) => setSearchUrl(e.target.value)}
                          placeholder="Paste your LinkedIn or Sales Navigator search URL here...
Example: https://www.linkedin.com/search/results/people/?keywords=marketing%20manager
Example: https://www.linkedin.com/sales/search/people?..."
                          className="min-h-[80px]"
                        />
                        <p className="text-sm text-muted-foreground">
                          Add your search URL to automatically extract and save prospects from LinkedIn or Sales Navigator
                        </p>
                      </div>

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

                      {/* New Search Method */}
                      <div className="space-y-4">
                        <div className="text-center py-8">
                          <div className="max-w-md mx-auto">
                            <Target className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Add Prospects to Campaign</h3>
                            <p className="text-gray-600 text-sm mb-6">
                              Choose from multiple search methods to find and add prospects to your campaign. Select the method that best fits your targeting strategy.
                            </p>
                            <Button size="lg" onClick={() => navigate('/prospect-search')} className="bg-blue-600 hover:bg-blue-700">
                              <Search className="h-5 w-5 mr-2" />
                              Choose Search Type
                            </Button>
                          </div>
                        </div>

                        <div className="border-t pt-6">
                          <div className="flex items-center justify-between text-sm text-gray-500">
                            <span>Prospects added: 0</span>
                            <span>Campaign ready to launch once prospects are added</span>
                          </div>
                        </div>
                      </div>
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
                      <Button className="bg-primary hover:bg-primary/90" onClick={() => handleSaveCampaign(false)}>
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
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">Set campaign parameters to run the campaign</h3>
                      </div>
                      <Button className="bg-primary hover:bg-primary/90" onClick={() => handleSaveCampaign(false)}>
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                    </div>

                    {/* Campaign Name */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Campaign name</CardTitle>
                        <CardDescription>Rename your campaign here for easier campaign management.</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <Label htmlFor="campaign-name-settings">Enter campaign name</Label>
                          <Input 
                            id="campaign-name-settings"
                            value={campaignName}
                            onChange={(e) => setCampaignName(e.target.value)}
                            placeholder="New Campaign - 11 Aug, 2025"
                            maxLength={100}
                          />
                          <p className="text-xs text-gray-500">Characters: {campaignName.length}/100</p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Campaign Limits */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Campaign limits</CardTitle>
                        <CardDescription>Specify the daily limit for this campaign. These limits will be applied to reach out to your leads.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label htmlFor="daily-contacts">Set the number of new people to be contacted by this campaign daily:</Label>
                          <Input 
                            id="daily-contacts" 
                            type="number" 
                            value={dailyContactLimit}
                            onChange={(e) => setDailyContactLimit(parseInt(e.target.value) || 20)}
                            className="mt-2" 
                          />
                        </div>
                        <div>
                          <Label htmlFor="daily-followups">Set the number of follow up messages to be sent from this campaign daily:</Label>
                          <Input 
                            id="daily-followups" 
                            type="number" 
                            value={dailyFollowupLimit}
                            onChange={(e) => setDailyFollowupLimit(parseInt(e.target.value) || 50)}
                            className="mt-2" 
                          />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Campaign Priority */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Campaign Priority</CardTitle>
                        <CardDescription>If enabled, each campaign will have a default priority value "Medium". If a campaign priority is changed to "High" more actions will be scheduled to be sent from it in comparison to campaigns with lower priority.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label>Priority level</Label>
                          <div className="flex items-center gap-3">
                            <Checkbox 
                              id="use-priority" 
                              checked={usePriority}
                              onCheckedChange={(checked) => setUsePriority(checked as boolean)}
                            />
                            <Label htmlFor="use-priority" className="text-sm">Use priority</Label>
                            <Select 
                              value={campaignPriority}
                              onValueChange={(value) => setCampaignPriority(value as "low" | "medium" | "high")}
                              disabled={!usePriority}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Schedule Campaign */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Schedule campaign</CardTitle>
                        <CardDescription>You can schedule when campaign will be active. Just set date and time. Once the campaign is set to active, messages will start being sent as soon as the associated LinkedIn profile has entered its active hours</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label>Select date and time</Label>
                          <div className="flex items-center gap-3 mt-2">
                            <RadioGroup 
                              value={startImmediately ? "immediately" : "scheduled"}
                              onValueChange={(value) => setStartImmediately(value === "immediately")}
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="immediately" id="start-immediately" />
                                <Label htmlFor="start-immediately">Start immediately</Label>
                              </div>
                              <div className="flex items-center space-x-2 mt-2">
                                <RadioGroupItem value="scheduled" id="scheduled" />
                                <Label htmlFor="scheduled">Schedule for:</Label>
                              </div>
                            </RadioGroup>
                            <Input type="datetime-local" placeholder="mm/dd/yyyy, --:-- --" className="ml-4" />
                          </div>
                          <p className="text-xs text-gray-500 mt-2">Times are set according to the time zone US/Mountain (GMT -0600), which can also be set from the account settings.</p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Prospects */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Prospects</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Override and allow outreaching to LinkedIn profiles from the same company</Label>
                          </div>
                          <Checkbox id="override-company" />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Override LinkedIn profiles</Label>
                          </div>
                          <Checkbox id="override-profiles" />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Enable duplicating leads between company campaigns</Label>
                          </div>
                          <Checkbox id="duplicate-leads" />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Campaign Status */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Campaign status</CardTitle>
                        <CardDescription>You can turn this campaign on and off. An active campaign will send out actions according to your campaign and profile settings. If the campaign is disabled, all campaign activity will be paused.</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-gray-600">
                            Inactive
                          </Badge>
                          <Button onClick={handleActivateCampaign}>
                            <Play className="h-4 w-4 mr-2" />
                            Activate Campaign
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Delete Campaign */}
                    <Card className="border-red-200">
                      <CardHeader>
                        <CardTitle className="text-red-600">Delete campaign</CardTitle>
                        <CardDescription>Deleting a campaign will stop all the campaign's activity. Contacts from the campaign will remain in 'My Network' and in your 'Inbox', however, they will no longer receive messages from the deleted campaign. You will be able to continue manual communication with these contacts.</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button variant="destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete campaign
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Stats Tab */}
                <TabsContent value="stats" className="space-y-6">
                  {/* Connection Statistics Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Connection Statistics</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-2xl font-bold">0</span>
                            <span className="text-sm text-gray-600">Connected out of all requests sent</span>
                          </div>
                          <Progress value={0} className="h-2" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Reply Statistics</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-2xl font-bold">0</span>
                            <span className="text-sm text-gray-600">Total replied after connecting</span>
                          </div>
                          <Progress value={0} className="h-2" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Day by Day Statistics */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Day by day statistics</CardTitle>
                        <div className="flex items-center gap-2">
                          <Input 
                            type="date" 
                            className="w-36"
                            placeholder="Start date"
                          />
                          <span className="text-gray-500">to</span>
                          <Input 
                            type="date" 
                            className="w-36"
                            placeholder="End date"
                          />
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Download CSV
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Chart Area */}
                      <div className="h-64 flex items-center justify-center border rounded-lg bg-gray-50">
                        <div className="text-center text-gray-500">
                          <BarChart3 className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                          <p>No data available for the selected period</p>
                        </div>
                      </div>
                      
                      {/* Filter Checkboxes */}
                      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox id="company-follows" defaultChecked />
                          <Label htmlFor="company-follows" className="text-sm font-normal">
                            Company follows
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="connected" defaultChecked />
                          <Label htmlFor="connected" className="text-sm font-normal">
                            Connected
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="emails" defaultChecked />
                          <Label htmlFor="emails" className="text-sm font-normal">
                            Emails
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="failed-connections" defaultChecked />
                          <Label htmlFor="failed-connections" className="text-sm font-normal">
                            Failed connections
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="follow-message" defaultChecked />
                          <Label htmlFor="follow-message" className="text-sm font-normal">
                            Follow message
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="invitations" defaultChecked />
                          <Label htmlFor="invitations" className="text-sm font-normal">
                            Invitations
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="invitations-sent" defaultChecked />
                          <Label htmlFor="invitations-sent" className="text-sm font-normal">
                            Invitations sent
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="network-size" defaultChecked />
                          <Label htmlFor="network-size" className="text-sm font-normal">
                            Network size
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="pending" defaultChecked />
                          <Label htmlFor="pending" className="text-sm font-normal">
                            Pending
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="people-follows" defaultChecked />
                          <Label htmlFor="people-follows" className="text-sm font-normal">
                            People follows
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="profile-viewed" defaultChecked />
                          <Label htmlFor="profile-viewed" className="text-sm font-normal">
                            Profile viewed
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="replied" defaultChecked />
                          <Label htmlFor="replied" className="text-sm font-normal">
                            Replied
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="skills-endorsed" defaultChecked />
                          <Label htmlFor="skills-endorsed" className="text-sm font-normal">
                            Skills endorsed
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="successful-calls" defaultChecked />
                          <Label htmlFor="successful-calls" className="text-sm font-normal">
                            Successful calls
                          </Label>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Detailed Statistics Table */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Campaign Performance Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-lg border">
                        <table className="w-full">
                          <thead className="bg-gray-50 border-b">
                            <tr>
                              <th className="text-left p-3 font-medium text-gray-700">Metric</th>
                              <th className="text-center p-3 font-medium text-gray-700">Total</th>
                              <th className="text-center p-3 font-medium text-gray-700">This Week</th>
                              <th className="text-center p-3 font-medium text-gray-700">Today</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-b">
                              <td className="p-3 text-gray-900">Invitations Sent</td>
                              <td className="p-3 text-center">0</td>
                              <td className="p-3 text-center">0</td>
                              <td className="p-3 text-center">0</td>
                            </tr>
                            <tr className="border-b">
                              <td className="p-3 text-gray-900">Connections Made</td>
                              <td className="p-3 text-center">0</td>
                              <td className="p-3 text-center">0</td>
                              <td className="p-3 text-center">0</td>
                            </tr>
                            <tr className="border-b">
                              <td className="p-3 text-gray-900">Messages Sent</td>
                              <td className="p-3 text-center">0</td>
                              <td className="p-3 text-center">0</td>
                              <td className="p-3 text-center">0</td>
                            </tr>
                            <tr className="border-b">
                              <td className="p-3 text-gray-900">Replies Received</td>
                              <td className="p-3 text-center">0</td>
                              <td className="p-3 text-center">0</td>
                              <td className="p-3 text-center">0</td>
                            </tr>
                            <tr className="border-b">
                              <td className="p-3 text-gray-900">Profile Views</td>
                              <td className="p-3 text-center">0</td>
                              <td className="p-3 text-center">0</td>
                              <td className="p-3 text-center">0</td>
                            </tr>
                            <tr>
                              <td className="p-3 text-gray-900 font-medium">Response Rate</td>
                              <td className="p-3 text-center font-medium">0%</td>
                              <td className="p-3 text-center font-medium">0%</td>
                              <td className="p-3 text-center font-medium">0%</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Analytics Tab */}
                <TabsContent value="analytics" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
  );
}