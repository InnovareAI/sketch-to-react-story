import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease';
    period: string;
  };
  icon: LucideIcon;
  iconColor?: string;
  className?: string;
}

export function MetricCard({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  iconColor = 'text-blue-600',
  className = '' 
}: MetricCardProps) {
  const formatValue = (val: string | number) => {
    if (typeof val === 'number') {
      if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
      if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
      return val.toLocaleString();
    }
    return val;
  };

  return (
    <div className={`flat-metric-card ${className}`}>
      <div className="flex flex-row items-center justify-between mb-3">
        <div className="metric-label">
          {title}
        </div>
        <div className="p-2 rounded-lg bg-blue-50">
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
      </div>
      <div className="metric-value">
        {formatValue(value)}
      </div>
      {change && (
        <div className="flex items-center gap-2 mt-3">
          <span className={`metric-change ${change.type === 'increase' ? 'positive' : 'negative'}`}>
            {change.type === 'increase' ? '↑' : '↓'} {Math.abs(change.value)}%
          </span>
          <span className="caption-text">vs {change.period}</span>
        </div>
      )}
    </div>
  );
}