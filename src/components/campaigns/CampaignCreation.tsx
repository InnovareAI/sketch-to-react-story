// Campaign Creation Component
// Create new campaigns with SAM AI supported types

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, 
  MessageSquare, 
  Mail, 
  Calendar,
  Building2,
  UserPlus,
  TrendingUp,
  Users as GroupIcon,
  ArrowRight,
  Info,
  Zap,
  Shield,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';

interface CampaignType {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  dailyLimit: number;
  requirements: string[];
  connectionDegree: string[];
  premiumRequired?: boolean;
  twoFARequired?: boolean;
  features: string[];
}

const campaignTypes: CampaignType[] = [
  {
    id: 'connector',
    name: 'Connector', 
    description: 'Reach out to 2nd and 3rd+ degree connections with personalised connection requests and follow-ups',
    icon: Users,
    dailyLimit: 100,
    requirements: ['LinkedIn 2FA Required'],
    connectionDegree: ['2nd', '3rd'],
    twoFARequired: true,
    features: ['Personalized requests', 'Follow-up sequences', 'Professional circle growth']
  },
  {
    id: 'messenger',
    name: 'Messenger',
    description: 'Send direct messages to contacts that approved your request',
    icon: MessageSquare,
    dailyLimit: 50,
    requirements: ['Accepted connections only'],
    connectionDegree: ['1st'],
    features: ['Direct messaging', 'Message sequences', 'Accepted connections']
  },
  {
    id: 'open_inmail',
    name: 'Open In-Mail',
    description: 'Send messages to your prospects without using a connection request',
    icon: Mail,
    dailyLimit: 25,
    requirements: ['LinkedIn Premium Required'],
    connectionDegree: ['Any'],
    premiumRequired: true,
    features: ['No connection needed', 'Premium credits used', 'Higher response rates']
  },
  {
    id: 'event_invite',
    name: 'Event Invite',
    description: 'Invite your first-degree connections to attend a LinkedIn event',
    icon: Calendar,
    dailyLimit: 200,
    requirements: ['1st degree connections', 'LinkedIn event required'],
    connectionDegree: ['1st'],
    features: ['Event promotion', 'First-degree only', 'High engagement']
  },
  {
    id: 'company_follow_invite',
    name: 'Company Follow Invite',
    description: 'Invite 1st degree connections to follow your company',
    icon: Building2,
    dailyLimit: 100,
    requirements: ['1st degree connections', 'Company page required'],
    connectionDegree: ['1st'],
    features: ['Company growth', 'First-degree only', 'Brand building']
  },
  {
    id: 'group',
    name: 'Group',
    description: 'Send message requests to fellow LinkedIn group members',
    icon: GroupIcon,
    dailyLimit: 50,
    requirements: ['Same LinkedIn group membership'],
    connectionDegree: ['Any'],
    features: ['Group networking', 'Shared interests', 'Community building']
  },
  {
    id: 'inbound',
    name: 'Inbound',
    description: 'Outreach the users who have viewed your profile',
    icon: TrendingUp,
    dailyLimit: 30,
    requirements: ['Profile visitors only'],
    connectionDegree: ['Any'],
    features: ['Profile visitors', 'Warm leads', 'Interest-based outreach']
  },
  {
    id: 'event_participants',
    name: 'Event Participants',
    description: 'Send message requests to the participants of the event',
    icon: UserPlus,
    dailyLimit: 40,
    requirements: ['Event participation'],
    connectionDegree: ['Any'],
    features: ['Event networking', 'Shared experience', 'Targeted outreach']
  },
];

interface CampaignCreationProps {
  onCreateCampaign?: (campaignData: any) => void;
  className?: string;
}

export function CampaignCreation({ 
  onCreateCampaign,
  className 
}: CampaignCreationProps) {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [campaignName, setCampaignName] = useState('');
  const [campaignDescription, setCampaignDescription] = useState('');
  const [dailyLimit, setDailyLimit] = useState<number>(50);
  const [step, setStep] = useState<'type' | 'configure'>('type');
  
  // Enhanced campaign settings
  const [campaignPriority, setCampaignPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [maxCampaignSize, setMaxCampaignSize] = useState<number>(5000);
  const [enableABTesting, setEnableABTesting] = useState(false);
  const [campaignTags, setCampaignTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  
  // Campaign filters
  const [audienceFilters, setAudienceFilters] = useState({
    industries: [] as string[],
    companySize: [] as string[],
    seniority: [] as string[],
    location: ''
  });
  
  // Message settings
  const [messageVariants, setMessageVariants] = useState([
    { id: 1, name: 'Variant A', message: '', isActive: true }
  ]);

  const selectedCampaignType = campaignTypes.find(type => type.id === selectedType);

  const handleTypeSelect = (typeId: string) => {
    const campaignType = campaignTypes.find(t => t.id === typeId);
    if (campaignType) {
      setSelectedType(typeId);
      setDailyLimit(campaignType.dailyLimit);
      setCampaignName(`${campaignType.name} Campaign`);
      setCampaignDescription(campaignType.description);
      setStep('configure');
    }
  };

  // Tag management
  const addTag = () => {
    if (newTag.trim() && !campaignTags.includes(newTag.trim())) {
      setCampaignTags([...campaignTags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setCampaignTags(campaignTags.filter(tag => tag !== tagToRemove));
  };

  // Message variant management
  const addMessageVariant = () => {
    const newId = Math.max(...messageVariants.map(v => v.id)) + 1;
    setMessageVariants([
      ...messageVariants,
      { id: newId, name: `Variant ${String.fromCharCode(65 + messageVariants.length)}`, message: '', isActive: true }
    ]);
  };

  const updateMessageVariant = (id: number, updates: Partial<typeof messageVariants[0]>) => {
    setMessageVariants(messageVariants.map(variant => 
      variant.id === id ? { ...variant, ...updates } : variant
    ));
  };

  const removeMessageVariant = (id: number) => {
    if (messageVariants.length > 1) {
      setMessageVariants(messageVariants.filter(variant => variant.id !== id));
    }
  };

  // Premium validation
  const validatePremiumRequirement = () => {
    if (selectedCampaignType?.premiumRequired) {
      // This would typically check against user's account status
      // For now, just show a warning
      toast.error('This campaign type requires LinkedIn Premium or Sales Navigator');
      return false;
    }
    return true;
  };

  const handleCreateCampaign = () => {
    if (!selectedCampaignType || !campaignName.trim()) {
      toast.error('Please provide campaign name');
      return;
    }

    // Validate premium requirements
    if (!validatePremiumRequirement()) {
      return;
    }

    // Validate campaign size limit
    if (maxCampaignSize > 5000) {
      toast.error('Campaign size cannot exceed 5000 prospects for safety compliance');
      return;
    }

    const campaignData = {
      name: campaignName,
      description: campaignDescription,
      type: selectedType,
      daily_connection_limit: dailyLimit,
      requires_2fa: selectedCampaignType.twoFARequired || false,
      premium_required: selectedCampaignType.premiumRequired || false,
      max_connection_degree: selectedCampaignType.connectionDegree.includes('3rd') ? '3rd' : 
                           selectedCampaignType.connectionDegree.includes('2nd') ? '2nd' : '1st',
      allowed_search_sources: ['basic_search', 'sales_navigator', 'post_engagement'],
      status: 'draft',
      
      // Enhanced campaign settings
      priority: campaignPriority,
      max_campaign_size: maxCampaignSize,
      tags: campaignTags,
      
      // A/B Testing settings
      ab_testing_enabled: enableABTesting,
      message_variants: enableABTesting ? messageVariants.filter(v => v.isActive) : [messageVariants[0]],
      
      // Audience filters
      audience_filters: audienceFilters,
      
      // Safety features
      can_be_paused: true,
      auto_pause_on_limit: true,
      
      settings: {
        campaign_type_features: selectedCampaignType.features,
        connection_degrees_allowed: selectedCampaignType.connectionDegree,
        safety_features: {
          daily_limit_enforcement: true,
          premium_validation: selectedCampaignType.premiumRequired || false,
          campaign_size_limit: maxCampaignSize
        }
      }
    };

    onCreateCampaign?.(campaignData);
    toast.success(`${selectedCampaignType.name} campaign created successfully!`);
  };

  const renderTypeSelection = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Campaign</h2>
        <p className="text-gray-600">Select the type of campaign to get started</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campaignTypes.map((type) => {
          const Icon = type.icon;
          return (
            <Card 
              key={type.id}
              className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-blue-300"
              onClick={() => handleTypeSelect(type.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Icon className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{type.name}</CardTitle>
                      {type.premiumRequired && (
                        <Badge variant="outline" className="text-xs mt-1">
                          <Zap className="h-3 w-3 mr-1" />
                          Premium
                        </Badge>
                      )}
                      {type.twoFARequired && (
                        <Badge variant="outline" className="text-xs mt-1 ml-1">
                          <Shield className="h-3 w-3 mr-1" />
                          2FA Required
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Clock className="h-3 w-3" />
                      <span>{type.dailyLimit}/day</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm mb-3">
                  {type.description}
                </CardDescription>
                
                <div className="space-y-2">
                  <div className="text-xs text-gray-500">
                    <strong>Connection Degrees:</strong> {type.connectionDegree.join(', ')}
                  </div>
                  
                  {type.requirements.length > 0 && (
                    <div className="text-xs text-gray-500">
                      <strong>Requirements:</strong>
                      <ul className="mt-1 list-disc list-inside">
                        {type.requirements.map((req, idx) => (
                          <li key={idx}>{req}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <div className="pt-2">
                    <Button className="w-full" variant="outline" size="sm">
                      <ArrowRight className="h-4 w-4 mr-2" />
                      Configure Campaign
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );

  const renderCampaignConfiguration = () => {
    if (!selectedCampaignType) return null;

    const Icon = selectedCampaignType.icon;

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => setStep('type')}
            size="sm"
          >
            ← Back to Types
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Icon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{selectedCampaignType.name}</h2>
              <p className="text-gray-600">{selectedCampaignType.description}</p>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Campaign Configuration</CardTitle>
            <CardDescription>
              Configure your campaign settings and messaging sequence
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Campaign Name */}
            <div className="space-y-2">
              <Label htmlFor="campaign-name">Campaign Name</Label>
              <Input
                id="campaign-name"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="Enter campaign name"
              />
            </div>

            {/* Campaign Description */}
            <div className="space-y-2">
              <Label htmlFor="campaign-description">Description</Label>
              <Textarea
                id="campaign-description"
                value={campaignDescription}
                onChange={(e) => setCampaignDescription(e.target.value)}
                placeholder="Describe your campaign goals and strategy"
                rows={3}
              />
            </div>

            {/* Daily Limit */}
            <div className="space-y-2">
              <Label htmlFor="daily-limit">Daily Connection/Message Limit</Label>
              <Input
                id="daily-limit"
                type="number"
                value={dailyLimit}
                onChange={(e) => setDailyLimit(parseInt(e.target.value) || 0)}
                min={1}
                max={selectedCampaignType.dailyLimit}
              />
              <p className="text-sm text-gray-500">
                Maximum: {selectedCampaignType.dailyLimit} per day for {selectedCampaignType.name}
              </p>
            </div>

            {/* Campaign Priority */}
            <div className="space-y-2">
              <Label htmlFor="campaign-priority">Campaign Priority</Label>
              <Select value={campaignPriority} onValueChange={(value: 'low' | 'medium' | 'high') => setCampaignPriority(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low Priority</SelectItem>
                  <SelectItem value="medium">Medium Priority</SelectItem>
                  <SelectItem value="high">High Priority</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500">Higher priority campaigns will be processed first</p>
            </div>

            {/* Campaign Size Limit */}
            <div className="space-y-2">
              <Label htmlFor="max-campaign-size">Maximum Campaign Size</Label>
              <Input
                id="max-campaign-size"
                type="number"
                value={maxCampaignSize}
                onChange={(e) => setMaxCampaignSize(parseInt(e.target.value) || 5000)}
                min={1}
                max={5000}
              />
              <p className="text-sm text-gray-500">
                Maximum 5000 prospects per campaign for LinkedIn compliance
              </p>
            </div>

            {/* Campaign Tags */}
            <div className="space-y-2">
              <Label>Campaign Tags</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add tag..."
                  onKeyPress={(e) => e.key === 'Enter' && addTag()}
                />
                <Button type="button" onClick={addTag} variant="outline" size="sm">
                  Add
                </Button>
              </div>
              {campaignTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {campaignTags.map(tag => (
                    <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                      {tag} ×
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* A/B Testing */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>A/B Message Testing</Label>
                  <p className="text-sm text-gray-500">Test multiple message variants automatically</p>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="ab-testing"
                    checked={enableABTesting}
                    onChange={(e) => setEnableABTesting(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="ab-testing">Enable A/B Testing</Label>
                </div>
              </div>

              {enableABTesting && (
                <div className="space-y-4 border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Message Variants</h4>
                    <Button type="button" onClick={addMessageVariant} variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      Add Variant
                    </Button>
                  </div>
                  
                  {messageVariants.map((variant) => (
                    <div key={variant.id} className="space-y-2 border rounded p-3">
                      <div className="flex items-center justify-between">
                        <Input
                          value={variant.name}
                          onChange={(e) => updateMessageVariant(variant.id, { name: e.target.value })}
                          className="max-w-xs"
                        />
                        <div className="flex items-center gap-2">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={variant.isActive}
                              onChange={(e) => updateMessageVariant(variant.id, { isActive: e.target.checked })}
                              className="rounded"
                            />
                            <Label>Active</Label>
                          </div>
                          {messageVariants.length > 1 && (
                            <Button
                              type="button"
                              onClick={() => removeMessageVariant(variant.id)}
                              variant="outline"
                              size="sm"
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                      </div>
                      <Textarea
                        value={variant.message}
                        onChange={(e) => updateMessageVariant(variant.id, { message: e.target.value })}
                        placeholder="Enter your message..."
                        rows={3}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Audience Filters */}
            <div className="space-y-4">
              <Label>Audience Filters (Optional)</Label>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location-filter">Location</Label>
                  <Input
                    id="location-filter"
                    value={audienceFilters.location}
                    onChange={(e) => setAudienceFilters(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="e.g., San Francisco, CA"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Company Size</Label>
                  <Select 
                    value={audienceFilters.companySize[0] || ''} 
                    onValueChange={(value) => setAudienceFilters(prev => ({ ...prev, companySize: value ? [value] : [] }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select company size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-10">1-10 employees</SelectItem>
                      <SelectItem value="11-50">11-50 employees</SelectItem>
                      <SelectItem value="51-200">51-200 employees</SelectItem>
                      <SelectItem value="201-500">201-500 employees</SelectItem>
                      <SelectItem value="501-1000">501-1000 employees</SelectItem>
                      <SelectItem value="1000+">1000+ employees</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator />

            {/* Campaign Features Info */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Campaign Features:</strong>
                <ul className="mt-2 list-disc list-inside space-y-1">
                  {selectedCampaignType.features.map((feature, idx) => (
                    <li key={idx} className="text-sm">{feature}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>

            {/* Requirements Alert */}
            {selectedCampaignType.requirements.length > 0 && (
              <Alert variant="destructive">
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  <strong>Requirements:</strong>
                  <ul className="mt-2 list-disc list-inside space-y-1">
                    {selectedCampaignType.requirements.map((req, idx) => (
                      <li key={idx} className="text-sm">{req}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-6">
              <div className="text-sm text-gray-500">
                Target: {selectedCampaignType.connectionDegree.join(', ')} degree connections
              </div>
              <Button onClick={handleCreateCampaign} className="px-8">
                Create Campaign
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className={`p-6 ${className}`}>
      {step === 'type' ? renderTypeSelection() : renderCampaignConfiguration()}
    </div>
  );
}