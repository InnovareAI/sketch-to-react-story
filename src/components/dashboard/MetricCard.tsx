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
    <Card className={`group relative overflow-hidden backdrop-blur-xl bg-white/80 border border-white/20 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1 animate-fade-in ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent opacity-50" />
      <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-600">
          {title}
        </CardTitle>
        <div className="p-2 rounded-xl bg-gradient-to-br from-white/80 to-white/40 backdrop-blur-sm shadow-lg">
          <Icon className={`h-4 w-4 ${iconColor}`} />
        </div>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
          {formatValue(value)}
        </div>
        {change && (
          <div className="flex items-center gap-1 mt-2">
            <Badge 
              variant={change.type === 'increase' ? 'default' : 'destructive'}
              className={`text-xs px-2 py-1 backdrop-blur-sm ${
                change.type === 'increase' 
                  ? 'bg-emerald-100/80 text-emerald-700 border-emerald-200' 
                  : 'bg-red-100/80 text-red-700 border-red-200'
              }`}
            >
              {change.type === 'increase' ? '+' : '-'}{Math.abs(change.value)}%
            </Badge>
            <span className="text-xs text-slate-500">vs {change.period}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}