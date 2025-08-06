import { create } from 'zustand';

export interface DashboardMetric {
  id: string;
  title: string;
  value: string | number;
  change: number; // percentage change
  trend: 'up' | 'down' | 'neutral';
  period: string;
}

export interface CampaignData {
  name: string;
  sent: number;
  opened: number;
  replied: number;
  date: string;
}

export interface ActivityData {
  date: string;
  messages: number;
  responses: number;
  meetings: number;
}

interface AnalyticsStore {
  metrics: DashboardMetric[];
  campaignData: CampaignData[];
  activityData: ActivityData[];
  isLoading: boolean;
  lastUpdated: Date;
  refreshData: () => void;
}

// Mock data generator functions
const generateMetrics = (): DashboardMetric[] => [
  {
    id: 'total-contacts',
    title: 'Total Contacts',
    value: 2847,
    change: 12.5,
    trend: 'up',
    period: 'vs last month'
  },
  {
    id: 'response-rate',
    title: 'Response Rate',
    value: '18.4%',
    change: -2.1,
    trend: 'down',
    period: 'vs last month'
  },
  {
    id: 'meetings-booked',
    title: 'Meetings Booked',
    value: 47,
    change: 28.6,
    trend: 'up',
    period: 'this month'
  },
  {
    id: 'revenue-pipeline',
    title: 'Revenue Pipeline',
    value: '$124,500',
    change: 15.3,
    trend: 'up',
    period: 'projected'
  }
];

const generateCampaignData = (): CampaignData[] => [
  { name: 'Q1 SaaS Outreach', sent: 450, opened: 178, replied: 34, date: '2024-01-15' },
  { name: 'Enterprise Follow-up', sent: 120, opened: 89, replied: 23, date: '2024-01-10' },
  { name: 'Product Demo Sequence', sent: 280, opened: 156, replied: 41, date: '2024-01-08' },
  { name: 'LinkedIn Connect Series', sent: 95, opened: 67, replied: 18, date: '2024-01-05' },
  { name: 'Warm Lead Nurture', sent: 340, opened: 201, replied: 52, date: '2024-01-03' },
];

const generateActivityData = (): ActivityData[] => {
  const data: ActivityData[] = [];
  const today = new Date();
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    data.push({
      date: date.toISOString().split('T')[0],
      messages: Math.floor(Math.random() * 50) + 10,
      responses: Math.floor(Math.random() * 15) + 2,
      meetings: Math.floor(Math.random() * 5),
    });
  }
  
  return data;
};

export const useAnalyticsStore = create<AnalyticsStore>((set, get) => ({
  metrics: generateMetrics(),
  campaignData: generateCampaignData(),
  activityData: generateActivityData(),
  isLoading: false,
  lastUpdated: new Date(),

  refreshData: () => {
    set({ isLoading: true });
    
    // Simulate API call delay
    setTimeout(() => {
      set({
        metrics: generateMetrics(),
        campaignData: generateCampaignData(),
        activityData: generateActivityData(),
        isLoading: false,
        lastUpdated: new Date(),
      });
    }, 1000);
  },
}));

// Legacy exports for compatibility
export const useAnalytics = () => {
  const store = useAnalyticsStore();
  return {
    analytics: {
      totalContacts: 15420,
      responseRate: 12.4,
      openRate: 67.8,
      activeCampaigns: 8,
      totalCampaigns: 24,
      connectionRate: 23.1,
      messagesSent: 8924,
      repliesReceived: 1107
    },
    chartData: store.activityData.map(d => ({ name: d.date, value: d.responses })),
    campaignMetrics: store.campaignData.map((c, i) => ({
      id: i.toString(),
      name: c.name,
      status: 'active' as const,
      sent: c.sent,
      opened: c.opened,
      replied: c.replied,
      connected: Math.floor(c.replied * 0.6),
      responseRate: Number(((c.replied / c.sent) * 100).toFixed(1)),
      startDate: c.date
    })),
    refreshData: store.refreshData,
    isLoading: store.isLoading
  };
};