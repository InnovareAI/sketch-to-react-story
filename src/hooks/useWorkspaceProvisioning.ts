/**
 * Hook for workspace provisioning
 * Automatically provisions Unipile and other integrations when a workspace is created
 */

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { WorkspaceProvisioningService } from '@/services/workspace-provisioning';
import { toast } from 'sonner';

interface ProvisioningStatus {
  status: 'idle' | 'provisioning' | 'completed' | 'error';
  message?: string;
  progress?: number;
  integrations?: {
    linkedin?: boolean;
    email?: boolean;
    calendar?: boolean;
    whatsapp?: boolean;
  };
}

export function useWorkspaceProvisioning(workspaceId?: string) {
  const [provisioningStatus, setProvisioningStatus] = useState<ProvisioningStatus>({
    status: 'idle'
  });

  // Check provisioning status on mount
  useEffect(() => {
    if (!workspaceId) return;

    checkProvisioningStatus();
    
    // Subscribe to provisioning updates
    const subscription = supabase
      .channel(`workspace-provisioning-${workspaceId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'workspaces',
        filter: `id=eq.${workspaceId}`
      }, (payload) => {
        handleProvisioningUpdate(payload.new);
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [workspaceId]);

  const checkProvisioningStatus = async () => {
    if (!workspaceId) return;

    try {
      // Check workspace provisioning status
      const { data: workspace, error } = await supabase
        .from('workspaces')
        .select('provisioning_status, provisioning_error, unipile_account_id')
        .eq('id', workspaceId)
        .single();

      if (error) throw error;

      if (workspace.provisioning_status === 'completed') {
        // Check which integrations are enabled
        const { data: config } = await supabase
          .from('workspace_unipile_config')
          .select('linkedin_enabled, email_enabled, calendar_enabled, whatsapp_enabled')
          .eq('workspace_id', workspaceId)
          .single();

        setProvisioningStatus({
          status: 'completed',
          message: 'Workspace is fully provisioned',
          integrations: {
            linkedin: config?.linkedin_enabled ?? false,
            email: config?.email_enabled ?? false,
            calendar: config?.calendar_enabled ?? false,
            whatsapp: config?.whatsapp_enabled ?? false
          }
        });
      } else if (workspace.provisioning_status === 'error') {
        setProvisioningStatus({
          status: 'error',
          message: workspace.provisioning_error || 'Provisioning failed'
        });
      } else if (workspace.provisioning_status === 'in_progress') {
        setProvisioningStatus({
          status: 'provisioning',
          message: 'Setting up your workspace...',
          progress: 50
        });
      } else {
        setProvisioningStatus({
          status: 'idle',
          message: 'Workspace not yet provisioned'
        });
      }
    } catch (error) {
      console.error('Error checking provisioning status:', error);
      setProvisioningStatus({
        status: 'error',
        message: 'Failed to check provisioning status'
      });
    }
  };

  const handleProvisioningUpdate = (workspace: any) => {
    if (workspace.provisioning_status === 'completed') {
      setProvisioningStatus({
        status: 'completed',
        message: 'Workspace is ready!',
        progress: 100
      });
      
      toast.success('Your workspace is fully provisioned and ready to use!');
    } else if (workspace.provisioning_status === 'error') {
      setProvisioningStatus({
        status: 'error',
        message: workspace.provisioning_error || 'Provisioning failed'
      });
      
      toast.error('Failed to provision workspace. Please contact support.');
    } else if (workspace.provisioning_status === 'in_progress') {
      setProvisioningStatus({
        status: 'provisioning',
        message: 'Setting up your workspace...',
        progress: 50
      });
    }
  };

  const triggerProvisioning = async (
    workspaceName: string,
    ownerEmail: string,
    plan: 'free' | 'starter' | 'premium' | 'enterprise' = 'free'
  ) => {
    if (!workspaceId) {
      toast.error('No workspace ID provided');
      return;
    }

    setProvisioningStatus({
      status: 'provisioning',
      message: 'Starting workspace provisioning...',
      progress: 10
    });

    try {
      // Call the edge function to provision the workspace
      const { data, error } = await supabase.functions.invoke('provision-workspace', {
        body: {
          workspaceId,
          workspaceName,
          ownerEmail,
          userId: (await supabase.auth.getUser()).data.user?.id,
          plan
        }
      });

      if (error) throw error;

      if (data?.success) {
        setProvisioningStatus({
          status: 'completed',
          message: 'Workspace provisioned successfully!',
          progress: 100,
          integrations: data.integrations
        });
        
        toast.success('Your workspace has been set up successfully!');
      } else {
        throw new Error(data?.error || 'Provisioning failed');
      }
    } catch (error: any) {
      console.error('Provisioning error:', error);
      
      setProvisioningStatus({
        status: 'error',
        message: error.message || 'Failed to provision workspace'
      });
      
      toast.error('Failed to set up workspace. Please try again.');
    }
  };

  const retryProvisioning = async () => {
    if (!workspaceId) return;

    setProvisioningStatus({
      status: 'provisioning',
      message: 'Retrying provisioning...',
      progress: 10
    });

    try {
      const service = WorkspaceProvisioningService.getInstance();
      await service.retryProvisioning(workspaceId);
      
      setProvisioningStatus({
        status: 'completed',
        message: 'Workspace provisioned successfully!',
        progress: 100
      });
      
      toast.success('Workspace provisioning completed!');
    } catch (error: any) {
      console.error('Retry provisioning error:', error);
      
      setProvisioningStatus({
        status: 'error',
        message: error.message || 'Retry failed'
      });
      
      toast.error('Failed to retry provisioning. Please contact support.');
    }
  };

  return {
    provisioningStatus,
    triggerProvisioning,
    retryProvisioning,
    checkProvisioningStatus
  };
}