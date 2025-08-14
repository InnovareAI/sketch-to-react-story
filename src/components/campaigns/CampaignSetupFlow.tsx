import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, 
  Users, 
  MessageSquare, 
  Play,
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2,
  Clock,
  Calendar,
  User,
  Building2,
  Briefcase,
  Hash,
  Save,
  ArrowLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AddPeopleTab } from './AddPeopleTab';

interface CampaignStep {
  id: string;
  type: 'connection' | 'message' | 'inmail' | 'follow_up';
  name: string;
  content: string;
  delay?: number;
  delayUnit?: 'hours' | 'days' | 'weeks';
  variants?: string[];
}

const placeholders = [
  { value: '{first_name}', label: 'First Name', icon: User },
  { value: '{last_name}', label: 'Last Name', icon: User },
  { value: '{job_title}', label: 'Job Title', icon: Briefcase },
  { value: '{company_name}', label: 'Company', icon: Building2 },
  { value: '{custom_field}', label: 'Custom Field', icon: Hash },
];

export default function CampaignSetupFlow() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const campaignType = searchParams.get('type') || 'connector';
  const campaignId = searchParams.get('id');
  
  const [activeTab, setActiveTab] = useState('name');
  const [campaignName, setCampaignName] = useState('');
  const [campaignSteps, setCampaignSteps] = useState<CampaignStep[]>([]);
  const [selectedPeople, setSelectedPeople] = useState<any[]>([]);
  const [campaignSettings, setCampaignSettings] = useState({
    dailyLimit: 50,
    timezone: 'America/New_York',
    workingDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
    workingHours: { start: '09:00', end: '17:00' },
    stopOnReply: true,
    trackOpens: true,
    trackClicks: true
  });

  useEffect(() => {
    // Initialize default steps based on campaign type
    if (campaignType === 'connector') {
      setCampaignSteps([
        {
          id: '1',
          type: 'connection',
          name: 'Connection Request',
          content: 'Hi {first_name}, I noticed you work at {company_name} as a {job_title}. I\'d love to connect and share insights about our industry.',
          variants: []
        },
        {
          id: '2',
          type: 'follow_up',
          name: 'Follow-up Message',
          content: 'Thanks for connecting, {first_name}! I wanted to reach out because...',
          delay: 2,
          delayUnit: 'days',
          variants: []
        }
      ]);
    } else if (campaignType === 'messenger') {
      setCampaignSteps([
        {
          id: '1',
          type: 'message',
          name: 'Initial Message',
          content: 'Hi {first_name}, I hope this message finds you well...',
          variants: []
        }
      ]);
    } else if (campaignType === 'open-inmail') {
      setCampaignSteps([
        {
          id: '1',
          type: 'inmail',
          name: 'InMail Message',
          content: 'Hi {first_name}, I came across your profile and was impressed by...',
          variants: []
        }
      ]);
    }
  }, [campaignType]);

  const addStep = () => {
    const newStep: CampaignStep = {
      id: Date.now().toString(),
      type: 'follow_up',
      name: `Follow-up ${campaignSteps.length}`,
      content: '',
      delay: 3,
      delayUnit: 'days',
      variants: []
    };
    setCampaignSteps([...campaignSteps, newStep]);
  };

  const removeStep = (stepId: string) => {
    setCampaignSteps(campaignSteps.filter(step => step.id !== stepId));
  };

  const updateStep = (stepId: string, updates: Partial<CampaignStep>) => {
    setCampaignSteps(campaignSteps.map(step => 
      step.id === stepId ? { ...step, ...updates } : step
    ));
  };

  const addVariant = (stepId: string) => {
    const step = campaignSteps.find(s => s.id === stepId);
    if (step) {
      const newVariant = `Variant ${(step.variants?.length || 0) + 1}`;
      updateStep(stepId, { 
        variants: [...(step.variants || []), newVariant] 
      });
    }
  };

  const insertPlaceholder = (stepId: string, placeholder: string) => {
    const step = campaignSteps.find(s => s.id === stepId);
    if (step) {
      // Insert placeholder at cursor position or append
      updateStep(stepId, { 
        content: step.content + ' ' + placeholder 
      });
    }
  };

  const saveCampaign = () => {
    // TODO: Save campaign to database
    console.log('Saving campaign:', {
      name: campaignName,
      type: campaignType,
      steps: campaignSteps,
      people: selectedPeople,
      settings: campaignSettings
    });
    navigate('/campaigns');
  };

  const tabs = [
    { id: 'name', label: 'Campaign name', icon: MessageSquare },
    { id: 'steps', label: 'Set steps', icon: MessageSquare },
    { id: 'people', label: 'Add people', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'activate', label: 'Activate', icon: Play }
  ];

  return (
    <div className="flex-1 bg-gray-50">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/campaigns')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Campaigns
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {campaignId ? 'Edit Campaign' : 'New Campaign Setup'}
              </h1>
              <p className="text-gray-600 mt-1">
                Campaign Type: <Badge variant="outline" className="ml-2">{campaignType}</Badge>
              </p>
            </div>
            <Button 
              onClick={saveCampaign}
              className="bg-primary hover:bg-primary/90"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Campaign
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-5 w-full">
            {tabs.map((tab, index) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="flex items-center gap-2"
              >
                <tab.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{index + 1}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Campaign Name Tab */}
          <TabsContent value="name" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Campaign Name & Description</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="campaign-name">Campaign Name</Label>
                  <Input
                    id="campaign-name"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    placeholder="e.g., Q1 2024 Sales Outreach"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="campaign-description">Description (Optional)</Label>
                  <Textarea
                    id="campaign-description"
                    placeholder="Describe the goal and target audience for this campaign..."
                    className="mt-1"
                    rows={4}
                  />
                </div>

                <div className="flex justify-end pt-4">
                  <Button onClick={() => setActiveTab('steps')}>
                    Next: Set Steps
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Campaign Steps Tab */}
          <TabsContent value="steps" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Campaign Steps</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {campaignSteps.map((step, index) => (
                  <div key={step.id} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <Input
                          value={step.name}
                          onChange={(e) => updateStep(step.id, { name: e.target.value })}
                          className="w-48"
                        />
                        <Badge variant="outline">{step.type}</Badge>
                      </div>
                      {index > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeStep(step.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    {index > 0 && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Wait</span>
                        <Input
                          type="number"
                          value={step.delay}
                          onChange={(e) => updateStep(step.id, { delay: parseInt(e.target.value) })}
                          className="w-16"
                        />
                        <select
                          value={step.delayUnit}
                          onChange={(e) => updateStep(step.id, { delayUnit: e.target.value as 'hours' | 'days' | 'weeks' })}
                          className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                        >
                          <option value="hours">hours</option>
                          <option value="days">days</option>
                          <option value="weeks">weeks</option>
                        </select>
                        <span className="text-sm text-gray-600">after previous step</span>
                      </div>
                    )}

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label>Message Content</Label>
                        <div className="flex gap-1">
                          {placeholders.map(placeholder => (
                            <Button
                              key={placeholder.value}
                              variant="ghost"
                              size="sm"
                              onClick={() => insertPlaceholder(step.id, placeholder.value)}
                              title={placeholder.label}
                            >
                              <placeholder.icon className="h-3 w-3" />
                            </Button>
                          ))}
                        </div>
                      </div>
                      <Textarea
                        value={step.content}
                        onChange={(e) => updateStep(step.id, { content: e.target.value })}
                        placeholder={`Enter your ${step.type} message...`}
                        rows={4}
                      />
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-500">
                          {step.type === 'connection' ? '275' : '1000'} characters remaining
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addVariant(step.id)}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add Variant
                        </Button>
                      </div>
                    </div>

                    {step.variants && step.variants.length > 0 && (
                      <div className="pl-11 space-y-2">
                        {step.variants.map((variant, vIndex) => (
                          <div key={vIndex} className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {variant}
                            </Badge>
                            <span className="text-xs text-gray-500">A/B Testing</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                <Button
                  variant="outline"
                  onClick={addStep}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Follow-up Step
                </Button>

                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={() => setActiveTab('name')}>
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>
                  <Button onClick={() => setActiveTab('people')}>
                    Next: Add People
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Add People Tab */}
          <TabsContent value="people" className="space-y-6">
            <AddPeopleTab 
              selectedPeople={selectedPeople}
              onPeopleChange={setSelectedPeople}
              campaignType={campaignType}
            />
            
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setActiveTab('steps')}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              <Button onClick={() => setActiveTab('settings')}>
                Next: Settings
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Campaign Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>Daily Limit</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      type="number"
                      value={campaignSettings.dailyLimit}
                      onChange={(e) => setCampaignSettings({
                        ...campaignSettings,
                        dailyLimit: parseInt(e.target.value)
                      })}
                      className="w-24"
                    />
                    <span className="text-sm text-gray-600">messages per day</span>
                  </div>
                </div>

                <div>
                  <Label>Working Hours</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      type="time"
                      value={campaignSettings.workingHours.start}
                      onChange={(e) => setCampaignSettings({
                        ...campaignSettings,
                        workingHours: { ...campaignSettings.workingHours, start: e.target.value }
                      })}
                      className="w-32"
                    />
                    <span className="text-sm text-gray-600">to</span>
                    <Input
                      type="time"
                      value={campaignSettings.workingHours.end}
                      onChange={(e) => setCampaignSettings({
                        ...campaignSettings,
                        workingHours: { ...campaignSettings.workingHours, end: e.target.value }
                      })}
                      className="w-32"
                    />
                  </div>
                </div>

                <div>
                  <Label>Working Days</Label>
                  <div className="flex gap-2 mt-2">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
                      <Button
                        key={day}
                        variant={campaignSettings.workingDays.includes(day.toLowerCase().slice(0, 3)) ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          const dayCode = day.toLowerCase().slice(0, 3);
                          const newDays = campaignSettings.workingDays.includes(dayCode)
                            ? campaignSettings.workingDays.filter(d => d !== dayCode)
                            : [...campaignSettings.workingDays, dayCode];
                          setCampaignSettings({
                            ...campaignSettings,
                            workingDays: newDays
                          });
                        }}
                      >
                        {day}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={campaignSettings.stopOnReply}
                      onChange={(e) => setCampaignSettings({
                        ...campaignSettings,
                        stopOnReply: e.target.checked
                      })}
                      className="rounded"
                    />
                    <span className="text-sm">Stop campaign when prospect replies</span>
                  </label>
                  
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={campaignSettings.trackOpens}
                      onChange={(e) => setCampaignSettings({
                        ...campaignSettings,
                        trackOpens: e.target.checked
                      })}
                      className="rounded"
                    />
                    <span className="text-sm">Track message opens</span>
                  </label>
                  
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={campaignSettings.trackClicks}
                      onChange={(e) => setCampaignSettings({
                        ...campaignSettings,
                        trackClicks: e.target.checked
                      })}
                      className="rounded"
                    />
                    <span className="text-sm">Track link clicks</span>
                  </label>
                </div>

                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={() => setActiveTab('people')}>
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>
                  <Button onClick={() => setActiveTab('activate')}>
                    Next: Review & Activate
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activate Tab */}
          <TabsContent value="activate" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Review & Activate Campaign</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b">
                    <span className="text-gray-600">Campaign Name</span>
                    <span className="font-medium">{campaignName || 'Not set'}</span>
                  </div>
                  
                  <div className="flex items-center justify-between py-3 border-b">
                    <span className="text-gray-600">Campaign Type</span>
                    <Badge variant="outline">{campaignType}</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between py-3 border-b">
                    <span className="text-gray-600">Total Steps</span>
                    <span className="font-medium">{campaignSteps.length}</span>
                  </div>
                  
                  <div className="flex items-center justify-between py-3 border-b">
                    <span className="text-gray-600">People Added</span>
                    <span className="font-medium">{selectedPeople.length}</span>
                  </div>
                  
                  <div className="flex items-center justify-between py-3 border-b">
                    <span className="text-gray-600">Daily Limit</span>
                    <span className="font-medium">{campaignSettings.dailyLimit} messages</span>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Ready to launch?</h4>
                  <p className="text-sm text-blue-700">
                    Your campaign will start sending messages according to your settings once activated.
                  </p>
                </div>

                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={() => setActiveTab('settings')}>
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={saveCampaign}>
                      Save as Draft
                    </Button>
                    <Button 
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => {
                        saveCampaign();
                        // TODO: Activate campaign
                      }}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Activate Campaign
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}