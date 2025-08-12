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
      const userAuthProfile = localStorage.getItem('user_auth_profile');
      if (userAuthProfile) {
        const profile = JSON.parse(userAuthProfile);
        return profile.workspace_id;
      }
      return null;
    } catch (err) {
      console.error('Error getting workspace ID:', err);
      return null;
    }
  };

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      setError(null);

      const workspaceId = getCurrentWorkspaceId();
      if (!workspaceId) {
        throw new Error('No workspace found. Please ensure you are logged in.');
      }

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
      const userAuthUser = localStorage.getItem('user_auth_user');
      
      if (!userAuthUser) {
        throw new Error('User not authenticated');
      }

      const user = JSON.parse(userAuthUser);

      const { data, error } = await supabase
        .from('campaigns')
        .insert({
          name,
          status,
          type: 'email', // Default type
          workspace_id: workspaceId,
          created_by: user.id,
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