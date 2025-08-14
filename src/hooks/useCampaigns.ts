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

  const getCurrentWorkspaceId = (): string => {
    // ALWAYS use the shared workspace for all users
    const SHARED_WORKSPACE = 'a0000000-0000-0000-0000-000000000000';
    
    // Store it for consistency
    localStorage.setItem('workspace_id', SHARED_WORKSPACE);
    
    console.log('✅ Using shared workspace:', SHARED_WORKSPACE);
    return SHARED_WORKSPACE;
  };

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      setError(null);

      const workspaceId = getCurrentWorkspaceId();
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