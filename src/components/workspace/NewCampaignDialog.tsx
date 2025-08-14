import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { 
  Target, 
  Mail, 
  MessageSquare, 
  Users, 
  Star, 
  FileText,
  ArrowRight,
  ArrowLeft,
  CheckCircle
} from "lucide-react";

interface NewCampaignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CampaignType {
  id: number;
  name: string;
  type: string;
  description: string;
  requirements: string;
  icon: string;
  category: string;
  features: string[];
  recommended: boolean;
}

export function NewCampaignDialog({ open, onOpenChange }: NewCampaignDialogProps) {
  const [step, setStep] = useState(1);
  const [selectedCampaignType, setSelectedCampaignType] = useState<CampaignType | null>(null);
  const [campaignMode, setCampaignMode] = useState<"type" | "blank" | "template">("type");
  const [campaignData, setCampaignData] = useState({
    name: "",
    objective: "",
    targetAudience: "",
    budget: "",
    duration: "",
    notes: ""
  });
  const { toast } = useToast();

  // Campaign types based on user requirements
  const campaignTypes = [
    {
      id: 1,
      name: "Connector",
      type: "connector",
      description: "Reach out to 2nd and 3rd+ degree connections with personalised connection requests and follow-ups",
      requirements: "LinkedIn 2FA Required",
      icon: "🤝",
      category: "Connection",
      features: ["2nd/3rd degree outreach", "Personalized requests", "Follow-up sequences"],
      recommended: true
    },
    {
      id: 2,
      name: "Messenger",
      type: "messenger",
      description: "Send direct messages to contacts that approved your request",
      requirements: null,
      icon: "💬",
      category: "Messaging",
      features: ["Direct messages", "Contact targeting", "Message sequences"],
      recommended: true
    },
    {
      id: 3,
      name: "Open In-Mail",
      type: "open_inmail",
      description: "Send messages to your prospects without using a connection request",
      requirements: "LinkedIn Premium Required",
      icon: "📧",
      category: "Premium",
      features: ["No connection needed", "Premium credits used", "Higher response rates"],
      recommended: false
    },
    {
      id: 4,
      name: "Event Invite",
      type: "event_invite",
      description: "Invite your first-degree connections to attend a LinkedIn event",
      requirements: "1st degree connections & LinkedIn event required",
      icon: "📅",
      category: "Events",
      features: ["Event promotion", "First-degree only", "High engagement"],
      recommended: false
    },
    {
      id: 5,
      name: "Company Follow Invite",
      type: "company_follow_invite",
      description: "Invite 1st degree connections to follow your company",
      requirements: "1st degree connections & Company page required",
      icon: "🏢",
      category: "Company",
      features: ["Company growth", "First-degree only", "Brand building"],
      recommended: false
    },
    {
      id: 6,
      name: "Group",
      type: "group",
      description: "Send message requests to fellow LinkedIn group members",
      requirements: "Same LinkedIn group membership",
      icon: "👥",
      category: "Groups",
      features: ["Group networking", "Shared interests", "Community building"],
      recommended: false
    },
    {
      id: 7,
      name: "Inbound",
      type: "inbound",
      description: "Outreach the users who have viewed your profile",
      requirements: "Profile visitors only",
      icon: "📈",
      category: "Inbound",
      features: ["Profile visitors", "Warm leads", "Interest-based outreach"],
      recommended: false
    },
    {
      id: 8,
      name: "Event Participants",
      type: "event_participants",
      description: "Send message requests to participants of LinkedIn events",
      requirements: "Event participation",
      icon: "👤",
      category: "Events",
      features: ["Event networking", "Shared experience", "Targeted outreach"],
      recommended: false
    }
  ];

  const handleCampaignTypeSelect = (campaignType: CampaignType) => {
    setSelectedCampaignType(campaignType);
    setCampaignData({
      ...campaignData,
      name: `${campaignType.name} Campaign`
    });
  };

  const handleNext = () => {
    if (step === 1 && campaignMode === "type" && !selectedCampaignType) {
      toast({
        title: "Campaign Type Required",
        description: "Please select a campaign type to continue.",
        variant: "destructive"
      });
      return;
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleCreateCampaign = () => {
    // Here you would typically call an API to create the campaign
    const typeText = selectedCampaignType ? `using the ${selectedCampaignType.name} type` : 
                     campaignMode === "blank" ? "as a blank campaign" : "from template";
    toast({
      title: "Campaign Created!",
      description: `"${campaignData.name}" has been created successfully ${typeText}.`
    });
    
    // Reset form
    setStep(1);
    setSelectedCampaignType(null);
    setCampaignMode("type");
    setCampaignData({
      name: "",
      objective: "",
      targetAudience: "",
      budget: "",
      duration: "",
      notes: ""
    });
    onOpenChange(false);
  };

  const getChannelIcon = (channel: string) => {
    switch (channel.toLowerCase()) {
      case "email": return <Mail className="h-4 w-4 text-blue-600" />;
      case "linkedin": return <MessageSquare className="h-4 w-4 text-blue-700" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Lead Generation": return "bg-green-100 text-green-800";
      case "Partnership": return "bg-purple-100 text-purple-800";
      case "Product Demo": return "bg-blue-100 text-blue-800";
      case "Follow-up": return "bg-orange-100 text-orange-800";
      case "Events": return "bg-pink-100 text-pink-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Create New Campaign
          </DialogTitle>
          <DialogDescription>
            {step === 1 ? "Select campaign type to get started" : step === 2 ? "Configure your campaign settings" : "Review and create your campaign"}
          </DialogDescription>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center justify-center space-x-4 py-4">
          <div className={`flex items-center space-x-2 ${step >= 1 ? 'text-primary' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-primary text-white' : 'bg-gray-200'}`}>
              1
            </div>
            <span className="text-sm font-medium">Select Type</span>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-400" />
          <div className={`flex items-center space-x-2 ${step >= 2 ? 'text-primary' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-primary text-white' : 'bg-gray-200'}`}>
              2
            </div>
            <span className="text-sm font-medium">Configure</span>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-400" />
          <div className={`flex items-center space-x-2 ${step >= 3 ? 'text-primary' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-primary text-white' : 'bg-gray-200'}`}>
              3
            </div>
            <span className="text-sm font-medium">Review</span>
          </div>
        </div>

        {/* Step 1: Campaign Type Selection */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">To create campaign select type of campaign</h3>
              <p className="text-gray-600 text-sm">
                Using a campaign, you have the power to configure an automated messaging sequence, 
                specifying when, what, and to whom each message should be sent. Once you've selected 
                the campaign name and type, the remaining settings will become accessible for your customization.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {campaignTypes.map((campaignType) => (
                <Card 
                  key={campaignType.id} 
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedCampaignType?.id === campaignType.id ? 'ring-2 ring-primary border-primary' : ''
                  } ${campaignType.recommended ? 'border-green-200 bg-green-50/30' : ''}`}
                  onClick={() => handleCampaignTypeSelect(campaignType)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{campaignType.icon}</span>
                        <div>
                          <CardTitle className="text-base flex items-center gap-2">
                            {campaignType.name}
                            {campaignType.recommended && (
                              <Badge className="bg-green-100 text-green-800 text-xs">Recommended</Badge>
                            )}
                          </CardTitle>
                          {campaignType.requirements && (
                            <p className="text-xs text-orange-600 font-medium mt-1">{campaignType.requirements}</p>
                          )}
                        </div>
                      </div>
                      {selectedCampaignType?.id === campaignType.id && (
                        <CheckCircle className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <Badge className={getCategoryColor(campaignType.category)} variant="outline">
                      {campaignType.category}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <p className="text-sm text-gray-700">{campaignType.description}</p>
                      
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-gray-600">Features:</p>
                        <ul className="space-y-1">
                          {campaignType.features.map((feature: string, index: number) => (
                            <li key={index} className="text-xs text-gray-600 flex items-center gap-1">
                              <CheckCircle className="h-3 w-3 text-green-500" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Additional Options */}
            <div className="flex flex-col gap-2 pt-4 border-t">
              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button variant="outline" onClick={() => {
                  setCampaignMode("blank");
                  setCampaignData({...campaignData, name: "New Campaign"});
                  setStep(2);
                }}>
                  Create blank campaign
                </Button>
                <Button variant="outline" onClick={() => {
                  setCampaignMode("template");
                  setStep(2);
                }}>
                  Create campaign from template
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Campaign Configuration */}
        {step === 2 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Configure Campaign Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="campaign-name">Campaign Name *</Label>
                  <Input
                    id="campaign-name"
                    value={campaignData.name}
                    onChange={(e) => setCampaignData({...campaignData, name: e.target.value})}
                    placeholder="Enter campaign name"
                  />
                </div>

                <div>
                  <Label htmlFor="objective">Campaign Objective</Label>
                  <Select value={campaignData.objective} onValueChange={(value) => setCampaignData({...campaignData, objective: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select objective" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lead-generation">Lead Generation</SelectItem>
                      <SelectItem value="brand-awareness">Brand Awareness</SelectItem>
                      <SelectItem value="product-demo">Product Demo</SelectItem>
                      <SelectItem value="partnership">Partnership</SelectItem>
                      <SelectItem value="event-promotion">Event Promotion</SelectItem>
                      <SelectItem value="nurturing">Nurturing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="target-audience">Target Audience</Label>
                  <Input
                    id="target-audience"
                    value={campaignData.targetAudience}
                    onChange={(e) => setCampaignData({...campaignData, targetAudience: e.target.value})}
                    placeholder="e.g., CEOs in SaaS companies, 50-500 employees"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="budget">Monthly Budget</Label>
                  <Select value={campaignData.budget} onValueChange={(value) => setCampaignData({...campaignData, budget: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select budget range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="500-1000">$500 - $1,000</SelectItem>
                      <SelectItem value="1000-2500">$1,000 - $2,500</SelectItem>
                      <SelectItem value="2500-5000">$2,500 - $5,000</SelectItem>
                      <SelectItem value="5000-10000">$5,000 - $10,000</SelectItem>
                      <SelectItem value="10000+">$10,000+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="duration">Campaign Duration</Label>
                  <Select value={campaignData.duration} onValueChange={(value) => setCampaignData({...campaignData, duration: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-week">1 Week</SelectItem>
                      <SelectItem value="2-weeks">2 Weeks</SelectItem>
                      <SelectItem value="1-month">1 Month</SelectItem>
                      <SelectItem value="3-months">3 Months</SelectItem>
                      <SelectItem value="6-months">6 Months</SelectItem>
                      <SelectItem value="ongoing">Ongoing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    value={campaignData.notes}
                    onChange={(e) => setCampaignData({...campaignData, notes: e.target.value})}
                    placeholder="Any specific requirements or notes..."
                    rows={3}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Review Campaign Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Campaign Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Name:</span>
                    <p className="text-sm text-gray-900">{campaignData.name || "Not specified"}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Objective:</span>
                    <p className="text-sm text-gray-900">{campaignData.objective || "Not specified"}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Target Audience:</span>
                    <p className="text-sm text-gray-900">{campaignData.targetAudience || "Not specified"}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Budget:</span>
                    <p className="text-sm text-gray-900">{campaignData.budget || "Not specified"}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Duration:</span>
                    <p className="text-sm text-gray-900">{campaignData.duration || "Not specified"}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Campaign Type</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedCampaignType ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{selectedCampaignType.icon}</span>
                        <span className="font-medium">{selectedCampaignType.name}</span>
                        <Badge className={getCategoryColor(selectedCampaignType.category)}>
                          {selectedCampaignType.category}
                        </Badge>
                        {selectedCampaignType.recommended && (
                          <Badge className="bg-green-100 text-green-800 text-xs">Recommended</Badge>
                        )}
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700">Description:</span>
                        <p className="text-sm text-gray-900">{selectedCampaignType.description}</p>
                      </div>
                      {selectedCampaignType.requirements && (
                        <div>
                          <span className="text-sm font-medium text-gray-700">Requirements:</span>
                          <p className="text-sm text-orange-600">{selectedCampaignType.requirements}</p>
                        </div>
                      )}
                      <div className="space-y-1">
                        <span className="text-sm font-medium text-gray-700">Features:</span>
                        <ul className="space-y-1">
                          {selectedCampaignType.features.map((feature: string, index: number) => (
                            <li key={index} className="text-sm text-gray-600 flex items-center gap-1">
                              <CheckCircle className="h-3 w-3 text-green-500" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">
                      {campaignMode === "blank" ? "Blank Campaign" : 
                       campaignMode === "template" ? "Template-based Campaign" : "No type selected"}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {campaignData.notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Additional Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-900">{campaignData.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-4 border-t">
          <div>
            {step > 1 && (
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            {step < 3 ? (
              <Button onClick={handleNext}>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleCreateCampaign}>
                <Target className="h-4 w-4 mr-2" />
                Create Campaign
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}