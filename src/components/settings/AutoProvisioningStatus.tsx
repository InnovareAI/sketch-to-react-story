/**
 * Auto Provisioning Status Component
 * Shows the status of automated workspace provisioning
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Loader2,
  Linkedin,
  Mail,
  Calendar,
  MessageCircle,
  Globe,
  Zap,
  Shield
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useWorkspace } from '@/hooks/useWorkspace';

interface ProvisioningStatus {
  unipile: {
    status: 'pending' | 'active' | 'error';
    linkedinEnabled: boolean;
    emailEnabled: boolean;
    calendarEnabled: boolean;
    whatsappEnabled: boolean;
    accountId?: string;
  };
  brightData: {
    status: 'pending' | 'active' | 'error';
    zoneId?: string;
    bandwidthUsed: number;
    bandwidthLimit: number;
  };
  overall: 'provisioning' | 'active' | 'partial' | 'error';
}

export function AutoProvisioningStatus() {
  const { workspaceId } = useWorkspace();
  const [status, setStatus] = useState<ProvisioningStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkProvisioningStatus();
  }, [workspaceId]);

  const checkProvisioningStatus = async () => {
    if (!workspaceId) {
      setLoading(false);
      return;
    }

    try {
      // Check Unipile configuration
      const { data: unipileConfig } = await supabase
        .from('workspace_unipile_config')
        .select('*')
        .eq('workspace_id', workspaceId)
        .single();

      // Check Bright Data configuration
      const { data: brightDataConfig } = await supabase
        .from('workspace_brightdata_config')
        .select('*')
        .eq('workspace_id', workspaceId)
        .single();

      const provisioningStatus: ProvisioningStatus = {
        unipile: {
          status: unipileConfig ? 'active' : 'pending',
          linkedinEnabled: unipileConfig?.linkedin_enabled || false,
          emailEnabled: unipileConfig?.email_enabled || false,
          calendarEnabled: unipileConfig?.calendar_enabled || false,
          whatsappEnabled: unipileConfig?.whatsapp_enabled || false,
          accountId: unipileConfig?.account_id
        },
        brightData: {
          status: brightDataConfig ? 'active' : 'pending',
          zoneId: brightDataConfig?.zone_id,
          bandwidthUsed: brightDataConfig?.bandwidth_used_gb || 0,
          bandwidthLimit: brightDataConfig?.bandwidth_limit_gb || 10
        },
        overall: 'active'
      };

      // Determine overall status
      if (!unipileConfig && !brightDataConfig) {
        provisioningStatus.overall = 'provisioning';
      } else if (unipileConfig && brightDataConfig) {
        provisioningStatus.overall = 'active';
      } else {
        provisioningStatus.overall = 'partial';
      }

      setStatus(provisioningStatus);
    } catch (error) {
      console.error('Error checking provisioning status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
            <span className="text-muted-foreground">Checking provisioning status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!status) {
    return null;
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'pending':
        return <Loader2 className="h-5 w-5 animate-spin text-yellow-600" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getOverallStatusBadge = () => {
    switch (status.overall) {
      case 'active':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Fully Provisioned
          </Badge>
        );
      case 'provisioning':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Provisioning...
          </Badge>
        );
      case 'partial':
        return (
          <Badge className="bg-orange-100 text-orange-800 border-orange-200">
            <AlertCircle className="h-3 w-3 mr-1" />
            Partially Configured
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            Unknown Status
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Simple Status Card */}
      <Card className="border border-gray-200 bg-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-100">
                <Zap className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="font-light text-xl">Automated Setup</CardTitle>
                <CardDescription className="text-sm text-gray-500">
                  Your workspace is automatically configured
                </CardDescription>
              </div>
            </div>
            {getOverallStatusBadge()}
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              All necessary integrations and configurations are handled automatically. 
              No manual setup required.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AutoProvisioningStatus;