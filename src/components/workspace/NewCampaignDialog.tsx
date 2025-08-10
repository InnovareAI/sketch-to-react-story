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

export function NewCampaignDialog({ open, onOpenChange }: NewCampaignDialogProps) {
  const [step, setStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [campaignData, setCampaignData] = useState({
    name: "",
    objective: "",
    targetAudience: "",
    budget: "",
    duration: "",
    notes: ""
  });
  const { toast } = useToast();

  // Sample templates (in real app, this would come from an API/database)
  const templates = [
    {
      id: 1,
      name: "Sam Lead Funnel",
      type: "email",
      channel: "Email",
      subject: "Quick question about {{companyName}}'s growth strategy",
      content: "Hi {{firstName}},\n\nI've been following {{companyName}}'s journey and I'm impressed with your recent expansion into {{industry}}.\n\nMany companies at your stage struggle with scaling their lead generation while maintaining quality. I've helped similar companies like {{competitorExample}} increase qualified leads by 40% using our proven funnel approach.\n\nWould you be open to a brief 15-minute conversation about how we could help {{companyName}} achieve similar results?\n\nBest regards,\nSam",
      category: "Lead Generation",
      tags: ["Sam", "Lead Funnel", "Growth"],
      stats: {
        used: 156,
        openRate: "68%",
        responseRate: "24%"
      }
    },
    {
      id: 2,
      name: "Partnership Outreach",
      type: "linkedin",
      channel: "LinkedIn",
      subject: "Partnership opportunity with {{companyName}}",
      content: "Hi {{firstName}},\n\nI came across {{companyName}} and was impressed by your work in {{industry}}. I believe there could be a great synergy between our companies.\n\nWe've successfully partnered with companies like {{partnerExample}} to drive mutual growth and expand market reach.\n\nI'd love to explore how we could work together. Are you available for a quick call this week?\n\nBest,\n{{senderName}}",
      category: "Partnership",
      tags: ["Partnership", "Collaboration", "Business Development"],
      stats: {
        used: 89,
        openRate: "72%",
        responseRate: "31%"
      }
    },
    {
      id: 3,
      name: "Product Demo Request",
      type: "email",
      channel: "Email",
      subject: "Quick demo of our {{productName}} solution",
      content: "Hello {{firstName}},\n\nI noticed that {{companyName}} is in the {{industry}} space, and I thought you might be interested in seeing how {{productName}} has helped similar companies like {{clientExample}} achieve {{benefit}}.\n\nWould you be interested in a brief 15-minute demo to see how this could benefit {{companyName}}?\n\nI have availability {{timeSlots}} - would any of these work for you?\n\nBest regards,\n{{senderName}}",
      category: "Product Demo",
      tags: ["Demo", "Product", "Sales"],
      stats: {
        used: 234,
        openRate: "61%",
        responseRate: "18%"
      }
    },
    {
      id: 4,
      name: "Follow-up Sequence",
      type: "email",
      channel: "Email",
      subject: "Following up on {{previousContact}}",
      content: "Hi {{firstName}},\n\nI wanted to follow up on our previous conversation about {{topicDiscussed}}.\n\nI've been thinking about the challenges you mentioned regarding {{specificChallenge}}, and I have a few ideas that might help.\n\nWould you be open to a quick 10-minute call to discuss these solutions?\n\nLooking forward to hearing from you,\n{{senderName}}",
      category: "Follow-up",
      tags: ["Follow-up", "Nurturing", "Relationship"],
      stats: {
        used: 178,
        openRate: "74%",
        responseRate: "28%"
      }
    },
    {
      id: 5,
      name: "Event Invitation",
      type: "linkedin",
      channel: "LinkedIn",
      subject: "Exclusive invitation to {{eventName}}",
      content: "Hi {{firstName}},\n\nI hope this message finds you well. I wanted to personally invite you to {{eventName}}, an exclusive event for {{industry}} leaders.\n\nGiven your role at {{companyName}} and expertise in {{expertise}}, I think you'd find great value in the discussions and networking opportunities.\n\nThe event details:\n📅 {{eventDate}}\n📍 {{eventLocation}}\n🎯 Focus: {{eventFocus}}\n\nWould you like me to reserve a spot for you?\n\nBest regards,\n{{senderName}}",
      category: "Events",
      tags: ["Events", "Networking", "Invitation"],
      stats: {
        used: 67,
        openRate: "69%",
        responseRate: "35%"
      }
    }
  ];

  const handleTemplateSelect = (template: any) => {
    setSelectedTemplate(template);
    setCampaignData({
      ...campaignData,
      name: `${template.name} Campaign`
    });
  };

  const handleNext = () => {
    if (step === 1 && !selectedTemplate) {
      toast({
        title: "Template Required",
        description: "Please select a template to continue.",
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
    toast({
      title: "Campaign Created!",
      description: `"${campaignData.name}" has been created successfully using the ${selectedTemplate.name} template.`
    });
    
    // Reset form
    setStep(1);
    setSelectedTemplate(null);
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
            {step === 1 ? "Choose a template to get started" : step === 2 ? "Configure your campaign settings" : "Review and create your campaign"}
          </DialogDescription>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center justify-center space-x-4 py-4">
          <div className={`flex items-center space-x-2 ${step >= 1 ? 'text-primary' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-primary text-white' : 'bg-gray-200'}`}>
              1
            </div>
            <span className="text-sm font-medium">Choose Template</span>
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

        {/* Step 1: Template Selection */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Select a Template</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((template) => (
                <Card 
                  key={template.id} 
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedTemplate?.id === template.id ? 'ring-2 ring-primary border-primary' : ''
                  }`}
                  onClick={() => handleTemplateSelect(template)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getChannelIcon(template.channel)}
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                      </div>
                      {selectedTemplate?.id === template.id && (
                        <CheckCircle className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getCategoryColor(template.category)}>
                        {template.category}
                      </Badge>
                      <Badge variant="outline">{template.channel}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Subject:</p>
                        <p className="text-sm text-gray-600">{template.subject}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Preview:</p>
                        <p className="text-sm text-gray-600 line-clamp-3">{template.content.substring(0, 120)}...</p>
                      </div>
                      <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                        <div className="text-center">
                          <div className="text-sm font-semibold text-gray-900">{template.stats.used}</div>
                          <div className="text-xs text-gray-600">Used</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-semibold text-green-600">{template.stats.openRate}</div>
                          <div className="text-xs text-gray-600">Open Rate</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-semibold text-blue-600">{template.stats.responseRate}</div>
                          <div className="text-xs text-gray-600">Response</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
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
                  <CardTitle className="text-base">Selected Template</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedTemplate && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        {getChannelIcon(selectedTemplate.channel)}
                        <span className="font-medium">{selectedTemplate.name}</span>
                        <Badge className={getCategoryColor(selectedTemplate.category)}>
                          {selectedTemplate.category}
                        </Badge>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700">Subject:</span>
                        <p className="text-sm text-gray-900">{selectedTemplate.subject}</p>
                      </div>
                      <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                        <div className="text-center">
                          <div className="text-sm font-semibold text-green-600">{selectedTemplate.stats.openRate}</div>
                          <div className="text-xs text-gray-600">Open Rate</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-semibold text-blue-600">{selectedTemplate.stats.responseRate}</div>
                          <div className="text-xs text-gray-600">Response</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-semibold text-gray-900">{selectedTemplate.stats.used}</div>
                          <div className="text-xs text-gray-600">Used</div>
                        </div>
                      </div>
                    </div>
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