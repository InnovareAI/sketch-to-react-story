import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Campaign {
  id: string;
  tenant_id: string;
  user_id: string;
  name: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export function useCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user's workspace campaigns
      const { data, error: campaignError } = await supabase
        .from('campaigns')
        .select('*')
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

  const createCampaign = async (name: string, status: string = 'active') => {
    try {
      // Get current user ID from localStorage (development mode)
      const userAuthUser = localStorage.getItem('user_auth_user');
      const userAuthProfile = localStorage.getItem('user_auth_profile');
      
      if (!userAuthUser || !userAuthProfile) {
        throw new Error('User not authenticated');
      }

      const user = JSON.parse(userAuthUser);
      const profile = JSON.parse(userAuthProfile);

      const { data, error } = await supabase
        .from('campaigns')
        .insert({
          name,
          status,
          user_id: user.id,
          tenant_id: profile.workspace_id
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