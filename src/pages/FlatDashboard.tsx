import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  MessageSquare, 
  Target,
  Activity,
  Mail,
  Calendar,
  DollarSign,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle,
  AlertCircle,
  UserPlus,
  Send,
  Link2
} from 'lucide-react';
import '../styles/flat-design.css';

export default function FlatDashboard() {
  // Sample data for charts
  const weeklyData = [
    { day: 'Mon', value: 42 },
    { day: 'Tue', value: 58 },
    { day: 'Wed', value: 35 },
    { day: 'Thu', value: 78 },
    { day: 'Fri', value: 65 },
    { day: 'Sat', value: 45 },
    { day: 'Sun', value: 52 }
  ];

  const recentActivities = [
    {
      icon: <UserPlus size={20} />,
      title: 'New LinkedIn Connection',
      description: 'John Doe accepted your connection request',
      time: '2 minutes ago',
      color: 'blue'
    },
    {
      icon: <Send size={20} />,
      title: 'Campaign Launched',
      description: 'Tech Leaders Outreach campaign is now active',
      time: '15 minutes ago',
      color: 'green'
    },
    {
      icon: <MessageSquare size={20} />,
      title: 'Message Received',
      description: 'Sarah Johnson replied to your message',
      time: '1 hour ago',
      color: 'purple'
    },
    {
      icon: <CheckCircle size={20} />,
      title: 'Profile Scraped',
      description: '250 new profiles added to database',
      time: '3 hours ago',
      color: 'orange'
    }
  ];

  const campaigns = [
    { name: 'Tech Leaders Outreach', progress: 75, status: 'active', sent: 842, replies: 124 },
    { name: 'Sales Professionals', progress: 45, status: 'active', sent: 356, replies: 48 },
    { name: 'Startup Founders', progress: 90, status: 'completing', sent: 1250, replies: 203 },
    { name: 'Marketing Managers', progress: 20, status: 'active', sent: 125, replies: 15 }
  ];

  return (
    <div className="flat-dashboard">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold" style={{ color: 'var(--flat-text-primary)' }}>
          Dashboard Overview
        </h1>
        <p className="mt-2" style={{ color: 'var(--flat-text-secondary)' }}>
          Welcome back! Here's what's happening with your campaigns today.
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="flat-grid flat-grid-4 mb-8">
        <div className="flat-metric-card">
          <div className="flat-metric-icon blue">
            <Users />
          </div>
          <div className="flat-metric-label">Total Connections</div>
          <div className="flat-metric-value">8,492</div>
          <div className="flat-metric-change positive">
            <ArrowUpRight size={16} />
            12.5%
          </div>
        </div>

        <div className="flat-metric-card success">
          <div className="flat-metric-icon green">
            <MessageSquare />
          </div>
          <div className="flat-metric-label">Messages Sent</div>
          <div className="flat-metric-value">2,573</div>
          <div className="flat-metric-change positive">
            <ArrowUpRight size={16} />
            8.2%
          </div>
        </div>

        <div className="flat-metric-card warning">
          <div className="flat-metric-icon orange">
            <Target />
          </div>
          <div className="flat-metric-label">Response Rate</div>
          <div className="flat-metric-value">24.8%</div>
          <div className="flat-metric-change negative">
            <ArrowDownRight size={16} />
            2.1%
          </div>
        </div>

        <div className="flat-metric-card danger">
          <div className="flat-metric-icon purple">
            <DollarSign />
          </div>
          <div className="flat-metric-label">Revenue</div>
          <div className="flat-metric-value">$45.2K</div>
          <div className="flat-metric-change positive">
            <ArrowUpRight size={16} />
            18.7%
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="flat-grid flat-grid-2 mb-8">
        {/* Campaign Performance */}
        <div className="flat-chart-container">
          <div className="flat-chart-header">
            <div>
              <h3 className="flat-chart-title">Campaign Performance</h3>
              <p className="flat-chart-subtitle">Active campaigns progress</p>
            </div>
            <button className="flat-button secondary">View All</button>
          </div>
          
          <div className="space-y-4 mt-4">
            {campaigns.map((campaign, index) => (
              <div key={index}>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium" style={{ color: 'var(--flat-text-primary)' }}>
                    {campaign.name}
                  </span>
                  <span className="text-sm" style={{ color: 'var(--flat-text-secondary)' }}>
                    {campaign.progress}%
                  </span>
                </div>
                <div className="flat-progress">
                  <div 
                    className={`flat-progress-bar ${index === 0 ? 'blue' : index === 1 ? 'green' : index === 2 ? 'orange' : 'purple'}`}
                    style={{ width: `${campaign.progress}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-xs" style={{ color: 'var(--flat-text-light)' }}>
                    {campaign.sent} sent • {campaign.replies} replies
                  </span>
                  <span className={`flat-badge ${campaign.status === 'completing' ? 'orange' : 'green'}`}>
                    {campaign.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly Activity Chart */}
        <div className="flat-chart-container">
          <div className="flat-chart-header">
            <div>
              <h3 className="flat-chart-title">Weekly Activity</h3>
              <p className="flat-chart-subtitle">Messages sent per day</p>
            </div>
            <select className="flat-button secondary" style={{ padding: '0.5rem 1rem' }}>
              <option>This Week</option>
              <option>Last Week</option>
              <option>This Month</option>
            </select>
          </div>
          
          <div className="mt-6">
            <div className="flex items-end justify-between h-48 px-2">
              {weeklyData.map((data, index) => (
                <div key={index} className="flex flex-col items-center flex-1">
                  <div 
                    className="w-full mx-1 rounded-t"
                    style={{
                      height: `${(data.value / 100) * 192}px`,
                      background: index === 3 ? 'var(--flat-blue)' : 'var(--flat-clouds)',
                      transition: 'all 0.3s ease'
                    }}
                  />
                  <span className="text-xs mt-2" style={{ color: 'var(--flat-text-secondary)' }}>
                    {data.day}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="flat-grid flat-grid-3 mb-8">
        {/* Recent Activity */}
        <div className="flat-card" style={{ gridColumn: 'span 2' }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--flat-text-primary)' }}>
            Recent Activity
          </h3>
          <div className="space-y-1">
            {recentActivities.map((activity, index) => (
              <div key={index} className="flat-activity-item">
                <div 
                  className="flat-activity-icon"
                  style={{ 
                    background: `rgba(${activity.color === 'blue' ? '52, 152, 219' : 
                                       activity.color === 'green' ? '46, 204, 113' :
                                       activity.color === 'purple' ? '155, 89, 182' : '243, 156, 18'}, 0.1)`,
                    color: activity.color === 'blue' ? 'var(--flat-blue)' : 
                           activity.color === 'green' ? 'var(--flat-emerald)' :
                           activity.color === 'purple' ? 'var(--flat-purple)' : 'var(--flat-orange)'
                  }}
                >
                  {activity.icon}
                </div>
                <div className="flat-activity-content">
                  <div className="flat-activity-title">{activity.title}</div>
                  <div className="flat-activity-description">{activity.description}</div>
                  <div className="flat-activity-time">{activity.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flat-card">
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--flat-text-primary)' }}>
            Quick Stats
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm" style={{ color: 'var(--flat-text-secondary)' }}>
                Profile Views
              </span>
              <span className="font-semibold" style={{ color: 'var(--flat-text-primary)' }}>
                1,429
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm" style={{ color: 'var(--flat-text-secondary)' }}>
                Search Appearances
              </span>
              <span className="font-semibold" style={{ color: 'var(--flat-text-primary)' }}>
                3,842
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm" style={{ color: 'var(--flat-text-secondary)' }}>
                Post Impressions
              </span>
              <span className="font-semibold" style={{ color: 'var(--flat-text-primary)' }}>
                12.5K
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm" style={{ color: 'var(--flat-text-secondary)' }}>
                Engagement Rate
              </span>
              <span className="font-semibold" style={{ color: 'var(--flat-text-primary)' }}>
                4.8%
              </span>
            </div>
          </div>
          
          <div className="mt-6">
            <button className="flat-button primary w-full">
              View Detailed Analytics
            </button>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 flex-wrap">
        <button className="flat-button primary">
          <Link2 className="inline mr-2" size={16} />
          Scrape Profiles
        </button>
        <button className="flat-button success">
          <Send className="inline mr-2" size={16} />
          Launch Campaign
        </button>
        <button className="flat-button secondary">
          <Calendar className="inline mr-2" size={16} />
          Schedule Messages
        </button>
        <button className="flat-button secondary">
          <BarChart3 className="inline mr-2" size={16} />
          Export Report
        </button>
      </div>
    </div>
  );
}