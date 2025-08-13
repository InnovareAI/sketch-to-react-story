import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  UserPlus, 
  MessageSquare, 
  Send, 
  Calendar,
  Users,
  Building2,
  UserCheck,
  RefreshCw,
  Globe,
  Smartphone,
  Hammer,
  ChevronRight,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface CampaignType {
  id: string;
  name: string;
  icon: React.ElementType;
  description: string;
  requirements?: string[];
  tag?: string;
  available: boolean;
}

const campaignTypes: CampaignType[] = [
  {
    id: 'mobile-connector',
    name: 'Mobile Connector',
    icon: Smartphone,
    description: 'Send connection requests from mobile devices with higher acceptance rates',
    requirements: ['Mobile app installed', 'LinkedIn Sales Navigator'],
    tag: 'Premium',
    available: true
  },
  {
    id: 'connector',
    name: 'Connector',
    icon: UserPlus,
    description: 'Automated connection requests with personalized messages',
    requirements: ['LinkedIn account connected'],
    available: true
  },
  {
    id: 'builder',
    name: 'Builder',
    icon: Hammer,
    description: 'Build relationships through strategic engagement before connecting',
    requirements: ['LinkedIn account connected', 'Content strategy'],
    tag: 'Advanced',
    available: true
  },
  {
    id: 'messenger',
    name: 'Messenger',
    icon: MessageSquare,
    description: 'Send messages to existing connections with follow-up sequences',
    requirements: ['Existing connections'],
    available: true
  },
  {
    id: 'open-inmail',
    name: 'Open InMail',
    icon: Send,
    description: 'Send InMail messages without connection requests',
    requirements: ['LinkedIn Premium', 'InMail credits'],
    tag: 'Premium',
    available: true
  },
  {
    id: 'event-invite',
    name: 'Event invite',
    icon: Calendar,
    description: 'Invite prospects to webinars, demos, or events',
    requirements: ['Event details', 'Target audience'],
    available: true
  },
  {
    id: 'company-follow',
    name: 'Company follow invite',
    icon: Building2,
    description: 'Invite people to follow your company page',
    requirements: ['Company page admin access'],
    available: true
  },
  {
    id: 'group',
    name: 'Group',
    icon: Users,
    description: 'Engage with members of LinkedIn groups',
    requirements: ['Group membership'],
    available: true
  },
  {
    id: 'inbound',
    name: 'Inbound',
    icon: UserCheck,
    description: 'Automatically accept and message incoming connection requests',
    requirements: ['LinkedIn account connected'],
    tag: 'Automation',
    available: true
  },
  {
    id: 'event-participants',
    name: 'Event participants',
    icon: Globe,
    description: 'Connect with attendees from events you participated in',
    requirements: ['Event attendance history'],
    available: true
  },
  {
    id: 'recovery',
    name: 'Recovery',
    icon: RefreshCw,
    description: 'Re-engage with cold or unresponsive connections',
    requirements: ['Historical campaign data'],
    tag: 'Re-engagement',
    available: true
  }
];

interface CampaignCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectType?: (typeId: string) => void;
}

export default function CampaignCreationModal({ 
  isOpen, 
  onClose,
  onSelectType 
}: CampaignCreationModalProps) {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [hoveredType, setHoveredType] = useState<string | null>(null);

  const handleSelectType = (typeId: string) => {
    setSelectedType(typeId);
    // Navigate to campaign setup with the selected type
    setTimeout(() => {
      navigate(`/campaign-setup?type=${typeId}`);
      onClose();
    }, 200);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold">Create New Campaign</DialogTitle>
              <DialogDescription className="mt-2">
                Choose a campaign type to start engaging with your prospects
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {campaignTypes.map((type) => (
              <Card
                key={type.id}
                className={cn(
                  "relative cursor-pointer transition-all duration-200 hover:shadow-lg",
                  selectedType === type.id && "ring-2 ring-blue-500",
                  hoveredType === type.id && "transform scale-[1.02]",
                  !type.available && "opacity-50 cursor-not-allowed"
                )}
                onClick={() => type.available && handleSelectType(type.id)}
                onMouseEnter={() => setHoveredType(type.id)}
                onMouseLeave={() => setHoveredType(null)}
              >
                <CardContent className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-lg",
                        hoveredType === type.id 
                          ? "bg-blue-100 text-blue-600" 
                          : "bg-gray-100 text-gray-600"
                      )}>
                        <type.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{type.name}</h3>
                        {type.tag && (
                          <Badge variant="secondary" className="mt-1 text-xs">
                            {type.tag}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {hoveredType === type.id && type.available && (
                      <ChevronRight className="h-5 w-5 text-blue-500 animate-pulse" />
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-600 mb-3">
                    {type.description}
                  </p>

                  {/* Requirements */}
                  {type.requirements && type.requirements.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-gray-500 mb-1">Requirements:</p>
                      <ul className="space-y-0.5">
                        {type.requirements.map((req, index) => (
                          <li key={index} className="text-xs text-gray-500 flex items-center gap-1">
                            <span className="w-1 h-1 bg-gray-400 rounded-full" />
                            {req}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Coming Soon overlay for unavailable types */}
                  {!type.available && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg">
                      <Badge variant="outline" className="text-gray-500">
                        Coming Soon
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Help Section */}
          <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-2">Not sure which campaign to choose?</h3>
            <p className="text-sm text-blue-700 mb-3">
              Here are our most popular campaign types based on your goals:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-3 rounded-lg">
                <h4 className="font-medium text-gray-900 text-sm mb-1">Build Network</h4>
                <p className="text-xs text-gray-600">Start with <span className="font-semibold">Connector</span> campaign</p>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <h4 className="font-medium text-gray-900 text-sm mb-1">Nurture Leads</h4>
                <p className="text-xs text-gray-600">Use <span className="font-semibold">Messenger</span> for follow-ups</p>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <h4 className="font-medium text-gray-900 text-sm mb-1">Direct Outreach</h4>
                <p className="text-xs text-gray-600">Try <span className="font-semibold">Open InMail</span> for cold contacts</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}