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
      {/* Overall Status Card */}
      <Card className="border-2 border-purple-200 bg-purple-50/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <Zap className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <CardTitle>Automated Workspace Provisioning</CardTitle>
                <CardDescription>
                  All integrations are automatically configured for your workspace
                </CardDescription>
              </div>
            </div>
            {getOverallStatusBadge()}
          </div>
        </CardHeader>
        <CardContent>
          <Alert className="bg-purple-100/50 border-purple-200">
            <Shield className="h-4 w-4 text-purple-600" />
            <AlertDescription className="text-purple-900">
              <strong>Zero Manual Setup Required!</strong> Your workspace is being automatically provisioned with all necessary integrations. 
              This includes LinkedIn automation, email accounts, calendar sync, and IP rotation proxies.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Integration Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Unipile Status */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-600" />
                Unipile Integration
              </CardTitle>
              {getStatusIcon(status.unipile.status)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Linkedin className="h-4 w-4 text-blue-600" />
                  LinkedIn
                </span>
                {status.unipile.linkedinEnabled ? (
                  <Badge className="bg-green-100 text-green-700">Enabled</Badge>
                ) : (
                  <Badge variant="secondary">Disabled</Badge>
                )}
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-red-600" />
                  Email
                </span>
                {status.unipile.emailEnabled ? (
                  <Badge className="bg-green-100 text-green-700">Enabled</Badge>
                ) : (
                  <Badge variant="secondary">Disabled</Badge>
                )}
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-purple-600" />
                  Calendar
                </span>
                {status.unipile.calendarEnabled ? (
                  <Badge className="bg-green-100 text-green-700">Enabled</Badge>
                ) : (
                  <Badge variant="secondary">Disabled</Badge>
                )}
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-green-600" />
                  WhatsApp
                </span>
                {status.unipile.whatsappEnabled ? (
                  <Badge className="bg-green-100 text-green-700">Enabled</Badge>
                ) : (
                  <Badge variant="secondary">Coming Soon</Badge>
                )}
              </div>
              {status.unipile.accountId && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground">
                    Account ID: {status.unipile.accountId}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Bright Data Status */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Globe className="h-5 w-5 text-orange-600" />
                Bright Data Proxies
              </CardTitle>
              {getStatusIcon(status.brightData.status)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span>Residential IPs</span>
                <Badge className="bg-green-100 text-green-700">Active</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Zone Status</span>
                {status.brightData.zoneId ? (
                  <Badge className="bg-green-100 text-green-700">Configured</Badge>
                ) : (
                  <Badge variant="secondary">Pending</Badge>
                )}
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span>Bandwidth Usage</span>
                  <span className="text-muted-foreground">
                    {status.brightData.bandwidthUsed.toFixed(2)} / {status.brightData.bandwidthLimit} GB
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
                    style={{ 
                      width: `${(status.brightData.bandwidthUsed / status.brightData.bandwidthLimit) * 100}%` 
                    }}
                  />
                </div>
              </div>
              {status.brightData.zoneId && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground">
                    Zone ID: {status.brightData.zoneId}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Provisioning Timeline */}
      {status.overall === 'provisioning' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Provisioning Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="text-sm">Workspace created</span>
              </div>
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-yellow-600" />
                <span className="text-sm">Creating Unipile sub-account...</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                <span className="text-sm text-muted-foreground">Configuring Bright Data proxies</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                <span className="text-sm text-muted-foreground">Activating integrations</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default AutoProvisioningStatus;