import { useState, useEffect } from 'react';
import { AlertTriangle, Clock, Info, X, RefreshCw, Pause } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface RateLimitInfo {
  isLimited: boolean;
  limitType: 'daily' | 'weekly' | 'connection_request' | 'message' | 'search';
  currentCount: number;
  maxLimit: number;
  resetTime?: Date;
  pausedUntil?: Date;
  message?: string;
}

interface LinkedInRateLimitWarningProps {
  rateLimitInfo?: RateLimitInfo;
  onDismiss?: () => void;
  onRetry?: () => void;
  className?: string;
  variant?: 'inline' | 'modal' | 'banner';
}

export function LinkedInRateLimitWarning({
  rateLimitInfo,
  onDismiss,
  onRetry,
  className,
  variant = 'inline'
}: LinkedInRateLimitWarningProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [timeUntilReset, setTimeUntilReset] = useState<string>('');

  useEffect(() => {
    if (!rateLimitInfo?.resetTime && !rateLimitInfo?.pausedUntil) return;

    const updateTimer = () => {
      const targetTime = rateLimitInfo.pausedUntil || rateLimitInfo.resetTime;
      if (!targetTime) return;

      const now = new Date();
      const diff = targetTime.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeUntilReset('Ready to resume');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (hours > 0) {
        setTimeUntilReset(`${hours}h ${minutes}m`);
      } else if (minutes > 0) {
        setTimeUntilReset(`${minutes}m ${seconds}s`);
      } else {
        setTimeUntilReset(`${seconds}s`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [rateLimitInfo]);

  if (!rateLimitInfo?.isLimited || !isVisible) {
    return null;
  }

  const percentageUsed = (rateLimitInfo.currentCount / rateLimitInfo.maxLimit) * 100;

  const getLimitTypeLabel = () => {
    switch (rateLimitInfo.limitType) {
      case 'daily':
        return 'Daily Limit';
      case 'weekly':
        return 'Weekly Limit';
      case 'connection_request':
        return 'Connection Request Limit';
      case 'message':
        return 'Message Limit';
      case 'search':
        return 'Search Limit';
      default:
        return 'Rate Limit';
    }
  };

  const getLimitTypeDescription = () => {
    switch (rateLimitInfo.limitType) {
      case 'daily':
        return 'LinkedIn has paused your daily messaging to prevent account restrictions.';
      case 'weekly':
        return 'You\'ve reached LinkedIn\'s weekly messaging limit.';
      case 'connection_request':
        return 'LinkedIn limits connection requests to protect your account from being flagged.';
      case 'message':
        return 'Message sending has been paused to comply with LinkedIn\'s rate limits.';
      case 'search':
        return 'Search functionality has been temporarily limited.';
      default:
        return 'Activity has been paused due to LinkedIn rate limits.';
    }
  };

  const getRecommendations = () => {
    const recommendations = [];
    
    if (rateLimitInfo.limitType === 'connection_request') {
      recommendations.push('Consider personalizing your connection messages');
      recommendations.push('Space out your connection requests throughout the day');
      recommendations.push('Focus on quality over quantity');
    } else if (rateLimitInfo.limitType === 'message') {
      recommendations.push('Schedule messages for off-peak hours');
      recommendations.push('Use message templates sparingly');
      recommendations.push('Ensure messages are personalized and relevant');
    }
    
    return recommendations;
  };

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  if (variant === 'banner') {
    return (
      <div className={cn(
        "fixed top-0 left-0 right-0 z-50 bg-yellow-50 border-b border-yellow-200 px-4 py-3",
        className
      )}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <div>
              <p className="font-medium text-yellow-900">
                LinkedIn {getLimitTypeLabel()} Reached
              </p>
              <p className="text-sm text-yellow-700">
                {rateLimitInfo.message || getLimitTypeDescription()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {timeUntilReset && (
              <Badge variant="outline" className="bg-white">
                <Clock className="h-3 w-3 mr-1" />
                Resumes in {timeUntilReset}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'modal') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="max-w-lg w-full mx-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                LinkedIn Rate Limit Detected
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDismiss}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="bg-yellow-50 border-yellow-200">
              <Pause className="h-4 w-4 text-yellow-600" />
              <AlertTitle className="text-yellow-900">
                {getLimitTypeLabel()} - {rateLimitInfo.currentCount}/{rateLimitInfo.maxLimit}
              </AlertTitle>
              <AlertDescription className="text-yellow-700">
                {rateLimitInfo.message || getLimitTypeDescription()}
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Usage</span>
                <span className="font-medium">{Math.round(percentageUsed)}%</span>
              </div>
              <Progress value={percentageUsed} className="h-2" />
            </div>

            {timeUntilReset && (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Time until reset</span>
                </div>
                <Badge variant="secondary">{timeUntilReset}</Badge>
              </div>
            )}

            {getRecommendations().length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Info className="h-4 w-4 text-blue-500" />
                  Recommendations
                </h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {getRecommendations().map((rec, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-3">
              {onRetry && (
                <Button
                  variant="outline"
                  onClick={onRetry}
                  className="flex-1"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              )}
              <Button
                onClick={handleDismiss}
                className="flex-1"
              >
                Got it
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Default inline variant
  return (
    <Alert className={cn(
      "border-yellow-200 bg-yellow-50",
      className
    )}>
      <AlertTriangle className="h-4 w-4 text-yellow-600" />
      <AlertTitle className="text-yellow-900">
        {getLimitTypeLabel()} Reached ({rateLimitInfo.currentCount}/{rateLimitInfo.maxLimit})
      </AlertTitle>
      <AlertDescription className="text-yellow-700">
        <p className="mb-2">
          {rateLimitInfo.message || getLimitTypeDescription()}
        </p>
        {timeUntilReset && (
          <div className="flex items-center gap-2 mt-2">
            <Clock className="h-3 w-3" />
            <span className="text-sm">Resumes in {timeUntilReset}</span>
          </div>
        )}
        <div className="flex items-center gap-4 mt-3">
          <Progress value={percentageUsed} className="flex-1 h-2" />
          <span className="text-sm font-medium">{Math.round(percentageUsed)}%</span>
        </div>
      </AlertDescription>
    </Alert>
  );
}