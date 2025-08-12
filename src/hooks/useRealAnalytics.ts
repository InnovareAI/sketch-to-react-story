import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AnalyticsData {
  totalContacts: number;
  totalCampaigns: number;
  activeCampaigns: number;
  responseRate: number;
  openRate: number;
  connectionRate: number;
  messagesSent: number;
  repliesReceived: number;
}

export interface CampaignMetric {
  id: string;
  name: string;
  status: string;
  sent: number;
  opened: number;
  replied: number;
  connected: number;
  responseRate: number;
  startDate: string;
}

export interface ChartDataPoint {
  name: string;
  value: number;
}

interface ActivityData {
  date: string;
  responses: number;
}

export function useRealAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalContacts: 0,
    totalCampaigns: 0,
    activeCampaigns: 0,
    responseRate: 0,
    openRate: 0,
    connectionRate: 0,
    messagesSent: 0,
    repliesReceived: 0,
  });

  const [campaignMetrics, setCampaignMetrics] = useState<CampaignMetric[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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

  const fetchAnalyticsData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const workspaceId = getCurrentWorkspaceId();
      if (!workspaceId) {
        throw new Error('No workspace found. Please ensure you are logged in.');
      }

      // Fetch contacts count
      const { count: contactsCount, error: contactsError } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId);

      if (contactsError) throw contactsError;

      // Fetch campaigns data
      const { data: campaigns, error: campaignsError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('workspace_id', workspaceId);

      if (campaignsError) throw campaignsError;

      // Fetch messages data
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('workspace_id', workspaceId);

      if (messagesError) throw messagesError;

      // Calculate analytics
      const totalCampaigns = campaigns?.length || 0;
      const activeCampaigns = campaigns?.filter(c => c.status === 'active').length || 0;
      const messagesSent = messages?.length || 0;
      const repliesReceived = messages?.filter(m => m.replied_at !== null).length || 0;
      const messagesOpened = messages?.filter(m => m.opened_at !== null).length || 0;
      
      const responseRate = messagesSent > 0 ? (repliesReceived / messagesSent) * 100 : 0;
      const openRate = messagesSent > 0 ? (messagesOpened / messagesSent) * 100 : 0;

      setAnalytics({
        totalContacts: contactsCount || 0,
        totalCampaigns,
        activeCampaigns,
        responseRate: Math.round(responseRate * 10) / 10,
        openRate: Math.round(openRate * 10) / 10,
        connectionRate: Math.round(Math.random() * 30 + 15), // Mock for now
        messagesSent,
        repliesReceived,
      });

      // Calculate campaign metrics
      const campaignMetricsData: CampaignMetric[] = campaigns?.map(campaign => {
        const campaignMessages = messages?.filter(m => m.campaign_id === campaign.id) || [];
        const sent = campaignMessages.length;
        const opened = campaignMessages.filter(m => m.opened_at !== null).length;
        const replied = campaignMessages.filter(m => m.replied_at !== null).length;
        const responseRate = sent > 0 ? (replied / sent) * 100 : 0;

        return {
          id: campaign.id,
          name: campaign.name,
          status: campaign.status,
          sent,
          opened,
          replied,
          connected: Math.floor(replied * 0.6), // Estimate connections from replies
          responseRate: Math.round(responseRate * 10) / 10,
          startDate: new Date(campaign.created_at).toLocaleDateString(),
        };
      }) || [];

      setCampaignMetrics(campaignMetricsData);

      // Generate chart data from actual message activity
      const last30Days = Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));
        return date.toISOString().split('T')[0];
      });

      const chartDataPoints: ChartDataPoint[] = last30Days.map(date => {
        const dayMessages = messages?.filter(m => {
          const messageDate = new Date(m.created_at).toISOString().split('T')[0];
          return messageDate === date;
        }) || [];

        const responses = dayMessages.filter(m => m.replied_at !== null).length;

        return {
          name: date,
          value: responses,
        };
      });

      setChartData(chartDataPoints);

    } catch (err: any) {
      console.error('Error fetching analytics:', err);
      setError(err.message || 'Failed to fetch analytics data');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = async () => {
    await fetchAnalyticsData();
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  return {
    analytics,
    campaignMetrics,
    chartData,
    isLoading,
    error,
    refreshData,
  };
}