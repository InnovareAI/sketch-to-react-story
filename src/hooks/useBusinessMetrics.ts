import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface BusinessMetrics {
  totalMessages: number;
  connectionsAccepted: number;
  interestedContacts: number;
  meetingsBooked: number;
  connectionsThisWeek: number;
  interestedThisWeek: number;
  meetingsThisWeek: number;
  loading: boolean;
  error: string | null;
}

export function useBusinessMetrics() {
  const [metrics, setMetrics] = useState<BusinessMetrics>({
    totalMessages: 0,
    connectionsAccepted: 0,
    interestedContacts: 0,
    meetingsBooked: 0,
    connectionsThisWeek: 0,
    interestedThisWeek: 0,
    meetingsThisWeek: 0,
    loading: true,
    error: null
  });

  const fetchMetrics = async () => {
    try {
      setMetrics(prev => ({ ...prev, loading: true, error: null }));
      
      // Get the current workspace ID
      const { data: workspace } = await supabase
        .from('workspaces')
        .select('id')
        .limit(1)
        .single();
        
      if (!workspace) {
        throw new Error('No workspace found');
      }
      
      // Call the database function to get business metrics
      const { data, error } = await supabase
        .rpc('get_workspace_business_metrics', { 
          p_workspace_id: workspace.id 
        });
      
      if (error) {
        throw error;
      }
      
      if (data && data.length > 0) {
        const metricsData = data[0];
        setMetrics({
          totalMessages: Number(metricsData.total_messages) || 0,
          connectionsAccepted: Number(metricsData.connections_accepted) || 0,
          interestedContacts: Number(metricsData.interested_contacts) || 0,
          meetingsBooked: Number(metricsData.meetings_booked) || 0,
          connectionsThisWeek: Number(metricsData.connections_this_week) || 0,
          interestedThisWeek: Number(metricsData.interested_this_week) || 0,
          meetingsThisWeek: Number(metricsData.meetings_this_week) || 0,
          loading: false,
          error: null
        });
      } else {
        // No data returned, use zeros
        setMetrics(prev => ({
          ...prev,
          loading: false,
          error: null
        }));
      }
    } catch (error) {
      console.error('Error fetching business metrics:', error);
      setMetrics(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch metrics'
      }));
    }
  };

  // Fetch metrics on mount
  useEffect(() => {
    fetchMetrics();
  }, []);

  return {
    ...metrics,
    refetch: fetchMetrics
  };
}