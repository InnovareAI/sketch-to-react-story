/**
 * Organization Quota Service
 * Manages user-based quotas across all workspaces (3,000 contacts per user per month)
 */

import { supabase } from '@/integrations/supabase/client';

export interface UserQuota {
  totalQuota: number;
  used: number;
  remaining: number;
  resetDate: Date;
  monthYear: string;
}

export interface QuotaCheck {
  allowed: boolean;
  availableCount: number;
  reason?: string;
  quotaInfo: UserQuota;
}

export interface ExtractionDetails {
  contactsDelivered: number;
  costUsd: number;
  extractionType: 'apollo' | 'linkedin' | 'simulation';
  searchUrl: string;
  apifyRunId?: string;
  processingTimeMs: number;
  contactsRequested?: number;
}

export class OrganizationQuotaService {
  private readonly MONTHLY_QUOTA = 3000; // Contacts per user per month

  /**
   * Get current month in YYYY-MM format
   */
  private getCurrentMonth(): string {
    return new Date().toISOString().slice(0, 7);
  }

  /**
   * Get next reset date (first day of next month)
   */
  private getNextResetDate(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 1);
  }

  /**
   * Initialize user quota for current month if it doesn't exist
   */
  private async initializeUserQuota(userId: string, monthYear: string): Promise<void> {
    const { error } = await supabase
      .from('user_quota_usage')
      .insert({
        user_id: userId,
        month_year: monthYear,
        contacts_extracted: 0,
        contacts_remaining: this.MONTHLY_QUOTA
      });

    if (error && !error.message.includes('duplicate')) {
      throw new Error(`Failed to initialize user quota: ${error.message}`);
    }
  }

  /**
   * Get user's current quota information
   */
  async getUserQuota(userId: string): Promise<UserQuota> {
    const currentMonth = this.getCurrentMonth();
    
    const { data: quota, error } = await supabase
      .from('user_quota_usage')
      .select('*')
      .eq('user_id', userId)
      .eq('month_year', currentMonth)
      .single();

    if (error && error.code === 'PGRST116') {
      // No quota record exists, create one
      await this.initializeUserQuota(userId, currentMonth);
      return {
        totalQuota: this.MONTHLY_QUOTA,
        used: 0,
        remaining: this.MONTHLY_QUOTA,
        resetDate: this.getNextResetDate(),
        monthYear: currentMonth
      };
    }

    if (error) {
      throw new Error(`Failed to fetch user quota: ${error.message}`);
    }

    return {
      totalQuota: this.MONTHLY_QUOTA,
      used: quota.contacts_extracted || 0,
      remaining: Math.max(0, quota.contacts_remaining || 0),
      resetDate: this.getNextResetDate(),
      monthYear: currentMonth
    };
  }

  /**
   * Check if user can extract the requested number of contacts
   */
  async canExtractContacts(userId: string, requestedCount: number): Promise<QuotaCheck> {
    const quotaInfo = await this.getUserQuota(userId);
    
    if (requestedCount > quotaInfo.remaining) {
      return {
        allowed: false,
        availableCount: quotaInfo.remaining,
        reason: `Request for ${requestedCount.toLocaleString()} contacts exceeds remaining quota of ${quotaInfo.remaining.toLocaleString()}`,
        quotaInfo
      };
    }
    
    return {
      allowed: true,
      availableCount: Math.min(requestedCount, quotaInfo.remaining),
      quotaInfo
    };
  }

  /**
   * Record successful extraction and update quota
   */
  async recordExtraction(
    userId: string,
    workspaceId: string,
    extractionDetails: ExtractionDetails
  ): Promise<UserQuota> {
    const currentMonth = this.getCurrentMonth();
    
    try {
      // Update user quota using stored procedure
      const { error: quotaError } = await supabase.rpc('increment_user_quota_usage', {
        p_user_id: userId,
        p_month_year: currentMonth,
        p_contacts_used: extractionDetails.contactsDelivered
      });

      if (quotaError) {
        throw new Error(`Failed to update quota: ${quotaError.message}`);
      }

      // Log extraction for audit trail
      const { error: logError } = await supabase
        .from('extraction_audit_log')
        .insert({
          user_id: userId,
          workspace_id: workspaceId,
          extraction_type: extractionDetails.extractionType,
          search_url: extractionDetails.searchUrl,
          contacts_requested: extractionDetails.contactsRequested || extractionDetails.contactsDelivered,
          contacts_delivered: extractionDetails.contactsDelivered,
          cost_usd: extractionDetails.costUsd,
          apify_run_id: extractionDetails.apifyRunId,
          processing_time_ms: extractionDetails.processingTimeMs,
          status: 'completed'
        });

      if (logError) {
        console.error('Failed to log extraction:', logError);
        // Don't throw here - quota update succeeded, logging is secondary
      }

      // Return updated quota
      return await this.getUserQuota(userId);
    } catch (error) {
      console.error('Error recording extraction:', error);
      throw error;
    }
  }

  /**
   * Get organization API token (centralized Apify access)
   */
  async getOrganizationApiToken(): Promise<string> {
    const { data, error } = await supabase
      .from('organization_api_keys')
      .select('apify_api_token')
      .eq('organization_name', 'InnovareAI')
      .eq('active', true)
      .single();

    if (error) {
      throw new Error(`Failed to fetch organization API token: ${error.message}`);
    }

    return data.apify_api_token;
  }

  /**
   * Get user's extraction history
   */
  async getUserExtractionHistory(
    userId: string,
    limit: number = 50
  ): Promise<Array<{
    id: string;
    extractionType: string;
    searchUrl: string;
    contactsDelivered: number;
    costUsd: number;
    processingTimeMs: number;
    createdAt: string;
    status: string;
  }>> {
    const { data, error } = await supabase
      .from('extraction_audit_log')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch extraction history: ${error.message}`);
    }

    return data.map(item => ({
      id: item.id,
      extractionType: item.extraction_type,
      searchUrl: item.search_url || '',
      contactsDelivered: item.contacts_delivered || 0,
      costUsd: parseFloat(item.cost_usd || '0'),
      processingTimeMs: item.processing_time_ms || 0,
      createdAt: item.created_at,
      status: item.status
    }));
  }

  /**
   * Get workspace-wide quota usage summary
   */
  async getWorkspaceQuotaSummary(workspaceId: string): Promise<{
    totalUsers: number;
    totalQuotaAllocation: number;
    totalUsed: number;
    totalRemaining: number;
    heaviestUsers: Array<{ userId: string; used: number; remaining: number }>;
  }> {
    const currentMonth = this.getCurrentMonth();
    
    const { data, error } = await supabase
      .from('user_quota_usage')
      .select('user_id, contacts_extracted, contacts_remaining')
      .eq('month_year', currentMonth);

    if (error) {
      throw new Error(`Failed to fetch workspace quota summary: ${error.message}`);
    }

    // Filter by workspace users (would need to join with profiles table)
    const totalUsers = data.length;
    const totalQuotaAllocation = totalUsers * this.MONTHLY_QUOTA;
    const totalUsed = data.reduce((sum, item) => sum + (item.contacts_extracted || 0), 0);
    const totalRemaining = data.reduce((sum, item) => sum + (item.contacts_remaining || 0), 0);
    
    const heaviestUsers = data
      .map(item => ({
        userId: item.user_id,
        used: item.contacts_extracted || 0,
        remaining: item.contacts_remaining || 0
      }))
      .sort((a, b) => b.used - a.used)
      .slice(0, 10);

    return {
      totalUsers,
      totalQuotaAllocation,
      totalUsed,
      totalRemaining,
      heaviestUsers
    };
  }
}