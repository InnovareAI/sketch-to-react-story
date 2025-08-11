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
  Smartphone, 
  Users, 
  MessageSquare, 
  Mail, 
  Calendar,
  Building2,
  UserPlus,
  TrendingUp,
  Users as GroupIcon,
  RotateCcw,
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
    id: 'mobile_connector',
    name: 'Mobile Connector',
    description: 'Send additional ~10-15 connection requests per day',
    icon: Smartphone,
    dailyLimit: 15,
    requirements: ['LinkedIn 2FA Required'],
    connectionDegree: ['1st', '2nd', '3rd'],
    twoFARequired: true,
    features: ['Mobile-only sending', 'Connection note required', 'Lower daily limits']
  },
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
  {
    id: 'recovery',
    name: 'Recovery',
    description: 'Recover contacts and last message that was sent to them',
    icon: RotateCcw,
    dailyLimit: 20,
    requirements: ['Previous contact history'],
    connectionDegree: ['Any'],
    features: ['Contact recovery', 'Previous conversations', 'Re-engagement']
  }
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

  const handleCreateCampaign = () => {
    if (!selectedCampaignType || !campaignName.trim()) {
      toast.error('Please provide campaign name');
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
      settings: {
        campaign_type_features: selectedCampaignType.features,
        connection_degrees_allowed: selectedCampaignType.connectionDegree
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