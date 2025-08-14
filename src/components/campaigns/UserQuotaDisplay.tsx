/**
 * User Quota Display Component
 * Shows user's monthly contact extraction quota and usage
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, TrendingUp, Calendar, Users } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { OrganizationApolloService } from '@/services/organizationApolloService';
import type { UserQuota } from '@/services/organizationQuotaService';

interface UserQuotaDisplayProps {
  userId: string;
  onQuotaUpdate?: (quota: UserQuota) => void;
  showDetails?: boolean;
}

export function UserQuotaDisplay({ userId, onQuotaUpdate, showDetails = true }: UserQuotaDisplayProps) {
  const [quota, setQuota] = useState<UserQuota | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const organizationService = new OrganizationApolloService();

  useEffect(() => {
    loadQuotaInfo();
  }, [userId]);

  const loadQuotaInfo = async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const quotaInfo = await organizationService.getUserQuota(userId);
      setQuota(quotaInfo);
      onQuotaUpdate?.(quotaInfo);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load quota information';
      setError(errorMessage);
      console.error('Error loading user quota:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span className="text-sm text-muted-foreground">Loading quota...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!quota) return null;

  const percentageUsed = (quota.used / quota.totalQuota) * 100;
  const isNearLimit = percentageUsed > 90;
  const isHighUsage = percentageUsed > 70;

  return (
    <Card className={isNearLimit ? "border-destructive/50" : isHighUsage ? "border-warning/50" : ""}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Monthly Quota</CardTitle>
            <CardDescription>Contact extraction allowance</CardDescription>
          </div>
          <Badge variant={isNearLimit ? "destructive" : isHighUsage ? "secondary" : "default"}>
            {quota.remaining.toLocaleString()} remaining
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Usage Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Used this month</span>
            <span className="font-medium">
              {quota.used.toLocaleString()} / {quota.totalQuota.toLocaleString()}
            </span>
          </div>
          <Progress 
            value={percentageUsed} 
            className="h-2"
          />
          <div className="text-xs text-muted-foreground text-right">
            {percentageUsed.toFixed(1)}% of monthly allowance
          </div>
        </div>

        {/* Quota Status Alert */}
        {isNearLimit && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Quota almost exhausted!</strong> Only {quota.remaining.toLocaleString()} contacts remaining.
              Contact support to increase your quota.
            </AlertDescription>
          </Alert>
        )}

        {isHighUsage && !isNearLimit && (
          <Alert>
            <TrendingUp className="h-4 w-4" />
            <AlertDescription>
              <strong>High usage detected.</strong> You've used {percentageUsed.toFixed(0)}% of your monthly quota.
              Consider monitoring your extraction pace.
            </AlertDescription>
          </Alert>
        )}

        {/* Additional Details */}
        {showDetails && (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="font-medium">Resets on</div>
                <div className="text-muted-foreground">
                  {quota.resetDate.toLocaleDateString()}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="font-medium">Daily Average</div>
                <div className="text-muted-foreground">
                  {Math.round(quota.used / new Date().getDate())} per day
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex justify-between items-center pt-2 border-t">
          <div className="text-xs text-muted-foreground">
            Organization: InnovareAI
          </div>
          <button 
            onClick={loadQuotaInfo}
            className="text-xs text-primary hover:underline"
          >
            Refresh
          </button>
        </div>
      </CardContent>
    </Card>
  );
}