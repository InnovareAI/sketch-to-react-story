import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface RateLimitStatus {
  isLimited: boolean;
  limitType: 'daily' | 'weekly' | 'connection_request' | 'message' | 'search';
  currentCount: number;
  maxLimit: number;
  resetTime?: Date;
  pausedUntil?: Date;
  message?: string;
  accountId?: string;
}

interface UnipileRateLimitResponse {
  rate_limit_reached?: boolean;
  rate_limit_type?: string;
  current_count?: number;
  max_limit?: number;
  reset_at?: string;
  paused_until?: string;
  message?: string;
}

export function useLinkedInRateLimit(accountId?: string) {
  const [rateLimitStatus, setRateLimitStatus] = useState<RateLimitStatus | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  // Check rate limit status from Unipile API
  const checkRateLimit = useCallback(async () => {
    if (!accountId) return;

    setIsChecking(true);
    try {
      // Call edge function to check Unipile rate limit status
      const { data, error } = await supabase.functions.invoke('check-linkedin-rate-limit', {
        body: { accountId }
      });

      if (error) {
        console.error('Error checking rate limit:', error);
        return;
      }

      const response = data as UnipileRateLimitResponse;

      if (response.rate_limit_reached) {
        const limitStatus: RateLimitStatus = {
          isLimited: true,
          limitType: (response.rate_limit_type as RateLimitStatus['limitType']) || 'message',
          currentCount: response.current_count || 0,
          maxLimit: response.max_limit || 100,
          resetTime: response.reset_at ? new Date(response.reset_at) : undefined,
          pausedUntil: response.paused_until ? new Date(response.paused_until) : undefined,
          message: response.message,
          accountId
        };

        setRateLimitStatus(limitStatus);
        
        // Store in database for tracking
        await storeRateLimitEvent(limitStatus);
        
        // Show toast notification
        toast.warning('LinkedIn Rate Limit Detected', {
          description: response.message || 'Message sending has been paused to protect your account.',
        });
      } else {
        setRateLimitStatus(null);
      }

      setLastChecked(new Date());
    } catch (error) {
      console.error('Failed to check rate limit:', error);
    } finally {
      setIsChecking(false);
    }
  }, [accountId]);

  // Store rate limit events in database for analytics
  const storeRateLimitEvent = async (status: RateLimitStatus) => {
    try {
      await supabase.from('linkedin_rate_limit_events').insert({
        account_id: status.accountId,
        limit_type: status.limitType,
        current_count: status.currentCount,
        max_limit: status.maxLimit,
        reset_time: status.resetTime?.toISOString(),
        paused_until: status.pausedUntil?.toISOString(),
        message: status.message,
        created_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to store rate limit event:', error);
    }
  };

  // Check for rate limit warnings (approaching limits)
  const checkRateLimitWarning = useCallback(async () => {
    if (!accountId) return;

    try {
      const { data, error } = await supabase.functions.invoke('check-linkedin-usage', {
        body: { accountId }
      });

      if (error) return;

      // Warning thresholds
      const WARNING_THRESHOLD = 0.8; // 80% of limit
      const CRITICAL_THRESHOLD = 0.9; // 90% of limit

      if (data.usage_percentage >= CRITICAL_THRESHOLD) {
        toast.error('Critical: Approaching LinkedIn Rate Limit', {
          description: `You've used ${Math.round(data.usage_percentage * 100)}% of your ${data.limit_type} limit.`,
        });
      } else if (data.usage_percentage >= WARNING_THRESHOLD) {
        toast.warning('Warning: High LinkedIn Usage', {
          description: `You've used ${Math.round(data.usage_percentage * 100)}% of your ${data.limit_type} limit.`,
        });
      }
    } catch (error) {
      console.error('Failed to check usage warning:', error);
    }
  }, [accountId]);

  // Monitor message sending for rate limits
  const monitorMessageSending = useCallback(async (messageId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('status, error_message')
        .eq('id', messageId)
        .single();

      if (error) return;

      // Check if message was rate limited
      if (data.status === 'failed' && 
          (data.error_message?.includes('rate limit') || 
           data.error_message?.includes('limit reached') ||
           data.error_message?.includes('too many'))) {
        
        // Trigger rate limit check
        await checkRateLimit();
      }
    } catch (error) {
      console.error('Failed to monitor message:', error);
    }
  }, [checkRateLimit]);

  // Auto-check rate limits periodically
  useEffect(() => {
    if (!accountId) return;

    // Initial check
    checkRateLimit();

    // Check every 5 minutes
    const interval = setInterval(() => {
      checkRateLimit();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [accountId, checkRateLimit]);

  // Subscribe to real-time updates for rate limit events
  useEffect(() => {
    if (!accountId) return;

    const subscription = supabase
      .channel(`rate-limit-${accountId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'linkedin_rate_limit_events',
          filter: `account_id=eq.${accountId}`
        },
        (payload) => {
          const event = payload.new as any;
          setRateLimitStatus({
            isLimited: true,
            limitType: event.limit_type,
            currentCount: event.current_count,
            maxLimit: event.max_limit,
            resetTime: event.reset_time ? new Date(event.reset_time) : undefined,
            pausedUntil: event.paused_until ? new Date(event.paused_until) : undefined,
            message: event.message,
            accountId: event.account_id
          });
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [accountId]);

  const clearRateLimit = useCallback(() => {
    setRateLimitStatus(null);
  }, []);

  const retryAfterRateLimit = useCallback(async () => {
    if (!rateLimitStatus) return;

    const now = new Date();
    const pausedUntil = rateLimitStatus.pausedUntil || rateLimitStatus.resetTime;

    if (pausedUntil && pausedUntil > now) {
      toast.error('Still rate limited', {
        description: `Please wait until ${pausedUntil.toLocaleTimeString()} before retrying.`,
      });
      return false;
    }

    // Clear the rate limit and retry
    clearRateLimit();
    await checkRateLimit();
    return true;
  }, [rateLimitStatus, clearRateLimit, checkRateLimit]);

  return {
    rateLimitStatus,
    isChecking,
    lastChecked,
    checkRateLimit,
    checkRateLimitWarning,
    monitorMessageSending,
    clearRateLimit,
    retryAfterRateLimit
  };
}