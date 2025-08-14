import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Campaign {
  id: string;
  workspace_id: string;
  created_by: string | null;
  name: string;
  type: string;
  status: string;
  objective: string | null;
  target_audience: any;
  linkedin_sequence_config: any;
  n8n_workflow_id: string | null;
  apify_actor_config: any;
  personalization_settings: any;
  scheduling_config: any;
  performance_metrics: any;
  budget: number | null;
  start_date: string | null;
  end_date: string | null;
  settings: any;
  created_at: string;
  updated_at: string;
}

export function useCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getCurrentWorkspaceId = (): string | null => {
    try {
      console.log('🔍 DEBUG: Getting workspace ID...');
      
      // Primary: Check auth profile first
      const userAuthProfile = localStorage.getItem('user_auth_profile');
      if (userAuthProfile) {
        try {
          const profile = JSON.parse(userAuthProfile);
          if (profile?.workspace_id) {
            console.log('✅ Found workspace_id in user_auth_profile:', profile.workspace_id);
            return profile.workspace_id;
          }
        } catch (parseError) {
          console.warn('Failed to parse user_auth_profile:', parseError);
        }
      }
      
      // Secondary: Check bypass user data
      const bypassUser = localStorage.getItem('bypass_user');
      if (bypassUser) {
        try {
          const userData = JSON.parse(bypassUser);
          if (userData?.workspace_id) {
            console.log('✅ Found workspace_id in bypass_user:', userData.workspace_id);
            return userData.workspace_id;
          }
        } catch (parseError) {
          console.warn('Failed to parse bypass_user:', parseError);
        }
      }
      
      // Tertiary: Check direct storage
      const workspaceId = localStorage.getItem('workspace_id');
      if (workspaceId && workspaceId !== 'null' && workspaceId !== 'undefined') {
        console.log('✅ Found direct workspace_id:', workspaceId);
        return workspaceId;
      }
      
      // Fallback: Generate workspace ID for authenticated users
      const userEmail = localStorage.getItem('user_email');
      if (userEmail && userEmail !== 'null') {
        const innovareEmails = ['cl@innovareai.com', 'cs@innovareai.com', 'tl@innovareai.com'];
        if (innovareEmails.includes(userEmail.toLowerCase())) {
          const sharedWorkspace = 'workspace-innovareai-shared-team';
          console.log('✅ Using shared InnovareAI workspace:', sharedWorkspace);
          localStorage.setItem('workspace_id', sharedWorkspace);
          return sharedWorkspace;
        }
        
        // Generate user-specific workspace
        const emailHash = userEmail.toLowerCase().replace(/[^a-z0-9]/g, '');
        const fallbackWorkspace = `workspace-${emailHash}-${Date.now().toString().slice(-6)}`;
        console.log('✅ Generated fallback workspace:', fallbackWorkspace);
        localStorage.setItem('workspace_id', fallbackWorkspace);
        return fallbackWorkspace;
      }
      
      console.log('❌ No workspace ID sources available');
      return null;
    } catch (err) {
      console.error('❌ Error getting workspace ID:', err);
      return null;
    }
  };

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      setError(null);

      const workspaceId = getCurrentWorkspaceId();
      console.log('🔍 DEBUG: Final workspaceId result:', workspaceId);
      if (!workspaceId) {
        console.log('❌ CAMPAIGNS ERROR: No workspace ID found');
        throw new Error('No workspace found. Please ensure you are logged in.');
      }
      console.log('✅ CAMPAIGNS: Using workspaceId:', workspaceId);

      // Get current user's workspace campaigns
      const { data, error: campaignError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (campaignError) {
        throw campaignError;
      }

      setCampaigns(data || []);
    } catch (err: any) {
      console.error('Error fetching campaigns:', err);
      setError(err.message || 'Failed to fetch campaigns');
    } finally {
      setLoading(false);
    }
  };

  const createCampaign = async (name: string, status: string = 'draft') => {
    try {
      const workspaceId = getCurrentWorkspaceId();
      if (!workspaceId) {
        throw new Error('No workspace found. Please ensure you are logged in.');
      }

      // Get current user ID from localStorage (development mode)
      let userId = null;
      
      // Check regular auth user
      const userAuthUser = localStorage.getItem('user_auth_user');
      if (userAuthUser) {
        const user = JSON.parse(userAuthUser);
        userId = user.id;
      } else {
        // Check bypass user
        const bypassUser = localStorage.getItem('bypass_user');
        if (bypassUser) {
          const userData = JSON.parse(bypassUser);
          userId = userData.id;
        }
      }
      
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('campaigns')
        .insert({
          name,
          status,
          type: 'email', // Default type
          workspace_id: workspaceId,
          created_by: userId,
          target_audience: {},
          linkedin_sequence_config: {},
          apify_actor_config: {},
          personalization_settings: {},
          scheduling_config: {},
          performance_metrics: {
            sent: 0,
            delivered: 0,
            opened: 0,
            clicked: 0,
            replied: 0,
            converted: 0
          },
          settings: {}
        })
        .select()
        .single();

      if (error) throw error;

      // Refresh campaigns list
      await fetchCampaigns();
      return data;
    } catch (err: any) {
      console.error('Error creating campaign:', err);
      throw err;
    }
  };

  const updateCampaignStatus = async (campaignId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('campaigns')
        .update({ status: newStatus })
        .eq('id', campaignId);

      if (error) throw error;

      // Refresh campaigns list
      await fetchCampaigns();
    } catch (err: any) {
      console.error('Error updating campaign status:', err);
      throw err;
    }
  };

  const deleteCampaign = async (campaignId: string) => {
    try {
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', campaignId);

      if (error) throw error;

      // Refresh campaigns list
      await fetchCampaigns();
    } catch (err: any) {
      console.error('Error deleting campaign:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  return {
    campaigns,
    loading,
    error,
    refetch: fetchCampaigns,
    createCampaign,
    updateCampaignStatus,
    deleteCampaign
  };
}