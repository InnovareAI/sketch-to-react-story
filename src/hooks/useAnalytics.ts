import { useState, useEffect } from 'react';

export interface AnalyticsData {
  totalCampaigns: number;
  activeCampaigns: number;
  totalContacts: number;
  responseRate: number;
  openRate: number;
  connectionRate: number;
  messagesSent: number;
  repliesReceived: number;
}

export interface ChartData {
  name: string;
  value: number;
  date?: string;
}

export interface CampaignMetrics {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'completed';
  sent: number;
  opened: number;
  replied: number;
  connected: number;
  responseRate: number;
  startDate: string;
}

// Simulated analytics data - in a real app this would come from your backend/API
export function useAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalCampaigns: 24,
    activeCampaigns: 8,
    totalContacts: 15420,
    responseRate: 12.4,
    openRate: 67.8,
    connectionRate: 23.1,
    messagesSent: 8924,
    repliesReceived: 1107
  });

  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [campaignMetrics, setCampaignMetrics] = useState<CampaignMetrics[]>([]);

  useEffect(() => {
    // Simulate loading analytics data
    const loadData = () => {
      // Response rate over time
      const responseData = Array.from({ length: 30 }, (_, i) => ({
        name: `Day ${i + 1}`,
        value: Math.floor(Math.random() * 25) + 5,
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }));

      // Campaign performance data
      const campaigns: CampaignMetrics[] = [
        {
          id: '1',
          name: 'Q1 Sales Outreach',
          status: 'active',
          sent: 1245,
          opened: 834,
          replied: 156,
          connected: 89,
          responseRate: 12.5,
          startDate: '2024-01-15'
        },
        {
          id: '2', 
          name: 'Product Demo Follow-up',
          status: 'active',
          sent: 892,
          opened: 623,
          replied: 104,
          connected: 67,
          responseRate: 11.7,
          startDate: '2024-01-20'
        },
        {
          id: '3',
          name: 'Executive Outreach',
          status: 'paused',
          sent: 456,
          opened: 298,
          replied: 67,
          connected: 34,
          responseRate: 14.7,
          startDate: '2024-01-10'
        },
        {
          id: '4',
          name: 'Partnership Outreach',
          status: 'completed',
          sent: 234,
          opened: 167,
          replied: 31,
          connected: 18,
          responseRate: 13.2,
          startDate: '2023-12-15'
        }
      ];

      setChartData(responseData);
      setCampaignMetrics(campaigns);
    };

    loadData();
  }, []);

  const refreshData = () => {
    // Simulate data refresh
    setAnalytics(prev => ({
      ...prev,
      responseRate: Math.round((Math.random() * 10 + 8) * 10) / 10,
      openRate: Math.round((Math.random() * 20 + 60) * 10) / 10,
      connectionRate: Math.round((Math.random() * 10 + 18) * 10) / 10,
    }));
  };

  return {
    analytics,
    chartData,
    campaignMetrics,
    refreshData,
    isLoading: false
  };
}