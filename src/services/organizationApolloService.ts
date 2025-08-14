/**
 * Organization Apollo Service
 * Wraps ApifyMcpService with user quota management and centralized API access
 */

import { ApifyMcpService } from './apifyMcp';
import { OrganizationQuotaService, type UserQuota } from './organizationQuotaService';
import type { ExtractionResult, Prospect } from './prospectOrchestrator';

export interface OrganizationExtractionResult extends ExtractionResult {
  quotaInfo: UserQuota;
  quotaExceeded?: boolean;
  availableQuota?: number;
}

export class OrganizationApolloService {
  private apifyService: ApifyMcpService;
  private quotaService = new OrganizationQuotaService();

  constructor() {
    this.apifyService = new ApifyMcpService();
  }

  /**
   * Initialize service with organization API token
   */
  private async initialize(): Promise<void> {
    if (!this.apifyService.isInitialized()) {
      const apiToken = await this.quotaService.getOrganizationApiToken();
      this.apifyService.initialize(apiToken);
    }
  }

  /**
   * Extract prospects with quota enforcement
   */
  async extractProspectsForUser(
    userId: string,
    workspaceId: string,
    searchUrl: string,
    maxResults: number = 100
  ): Promise<OrganizationExtractionResult> {
    await this.initialize();

    // 1. Check user quota
    const quotaCheck = await this.quotaService.canExtractContacts(userId, maxResults);
    if (!quotaCheck.allowed) {
      return {
        success: false,
        prospects: [],
        method_used: 'quota_exceeded',
        data_quality: 'poor',
        errors: [quotaCheck.reason || 'Quota exceeded'],
        warnings: [`You can extract up to ${quotaCheck.availableCount} more contacts this month`],
        extractedCount: 0,
        failedCount: 0,
        processing_time_ms: 0,
        quotaInfo: quotaCheck.quotaInfo,
        quotaExceeded: true,
        availableQuota: quotaCheck.availableCount
      };
    }

    // 2. Perform extraction (limited to available quota)
    const actualMaxResults = Math.min(maxResults, quotaCheck.availableCount);
    const startTime = Date.now();

    try {
      // Use Apollo scraper as primary method
      const result = await this.apifyService.extractLinkedInProfiles(searchUrl, {
        maxResults: actualMaxResults,
        extractEmails: true,
        extractPhones: false,
        preferredActor: 'jljBwyyQakqrL1wae' // Apollo scraper
      });

      const processingTime = Date.now() - startTime;

      // 3. Record usage if successful
      if (result.success && result.data && result.data.length > 0) {
        const prospects = this.convertToProspects(result.data);
        const estimatedCost = this.calculateCost(prospects.length, 'apollo');

        // Record extraction in quota system
        const updatedQuota = await this.quotaService.recordExtraction(userId, workspaceId, {
          contactsDelivered: prospects.length,
          contactsRequested: maxResults,
          costUsd: estimatedCost,
          extractionType: 'apollo',
          searchUrl,
          apifyRunId: result.runId,
          processingTimeMs: processingTime
        });

        return {
          success: true,
          prospects,
          method_used: 'apollo',
          data_quality: 'excellent',
          errors: result.errors || [],
          warnings: this.generateWarnings(result, updatedQuota),
          extractedCount: prospects.length,
          failedCount: (result.data?.length || 0) - prospects.length,
          processing_time_ms: processingTime,
          cost_estimate: estimatedCost,
          quotaInfo: updatedQuota,
          quotaExceeded: false,
          availableQuota: updatedQuota.remaining
        };
      }

      // 4. Extraction failed - try LinkedIn scraper as backup
      if (!result.success) {
        const backupResult = await this.apifyService.extractLinkedInProfiles(searchUrl, {
          maxResults: actualMaxResults,
          extractEmails: false,
          extractPhones: false,
          preferredActor: 'PEgClm7RgRD7YO94b' // LinkedIn scraper backup
        });

        const backupProcessingTime = Date.now() - startTime;

        if (backupResult.success && backupResult.data && backupResult.data.length > 0) {
          const prospects = this.convertToProspects(backupResult.data);
          const estimatedCost = this.calculateCost(prospects.length, 'linkedin');

          const updatedQuota = await this.quotaService.recordExtraction(userId, workspaceId, {
            contactsDelivered: prospects.length,
            contactsRequested: maxResults,
            costUsd: estimatedCost,
            extractionType: 'linkedin',
            searchUrl,
            apifyRunId: backupResult.runId,
            processingTimeMs: backupProcessingTime
          });

          return {
            success: true,
            prospects,
            method_used: 'linkedin_backup',
            data_quality: 'good',
            errors: backupResult.errors || [],
            warnings: [
              'Apollo scraper failed, used LinkedIn backup',
              ...this.generateWarnings(backupResult, updatedQuota)
            ],
            extractedCount: prospects.length,
            failedCount: (backupResult.data?.length || 0) - prospects.length,
            processing_time_ms: backupProcessingTime,
            cost_estimate: estimatedCost,
            quotaInfo: updatedQuota
          };
        }
      }

      // 5. Both methods failed - return failure with quota info
      return {
        success: false,
        prospects: [],
        method_used: 'failed',
        data_quality: 'poor',
        errors: result.errors || ['Extraction failed'],
        warnings: ['All extraction methods failed'],
        extractedCount: 0,
        failedCount: actualMaxResults,
        processing_time_ms: processingTime,
        quotaInfo: quotaCheck.quotaInfo
      };

    } catch (error) {
      console.error('Organization extraction error:', error);
      return {
        success: false,
        prospects: [],
        method_used: 'error',
        data_quality: 'poor',
        errors: [error instanceof Error ? error.message : 'Unknown extraction error'],
        warnings: [],
        extractedCount: 0,
        failedCount: 0,
        processing_time_ms: Date.now() - startTime,
        quotaInfo: quotaCheck.quotaInfo
      };
    }
  }

  /**
   * Get user's current quota information
   */
  async getUserQuota(userId: string): Promise<UserQuota> {
    return this.quotaService.getUserQuota(userId);
  }

  /**
   * Get user's extraction history
   */
  async getUserExtractionHistory(userId: string, limit: number = 50) {
    return this.quotaService.getUserExtractionHistory(userId, limit);
  }

  /**
   * Get workspace quota summary
   */
  async getWorkspaceQuotaSummary(workspaceId: string) {
    return this.quotaService.getWorkspaceQuotaSummary(workspaceId);
  }

  /**
   * Convert Apify data to Prospect format
   */
  private convertToProspects(data: any[]): Prospect[] {
    return data
      .filter(item => item && (item.fullName || (item.firstName && item.lastName)))
      .map(item => ({
        firstName: item.firstName || this.extractFirstName(item.fullName || ''),
        lastName: item.lastName || this.extractLastName(item.fullName || ''),
        fullName: item.fullName || `${item.firstName || ''} ${item.lastName || ''}`.trim(),
        email: item.email || item.emailAddress || '',
        company: item.companyName || item.company || '',
        title: item.title || item.position || '',
        linkedinUrl: item.linkedinUrl || item.url || item.profileUrl || '',
        location: item.location || '',
        summary: item.summary || item.description || '',
        source: 'apollo_extraction'
      }));
  }

  /**
   * Extract first name from full name
   */
  private extractFirstName(fullName: string): string {
    return fullName.split(' ')[0] || '';
  }

  /**
   * Extract last name from full name
   */
  private extractLastName(fullName: string): string {
    const parts = fullName.split(' ');
    return parts.length > 1 ? parts[parts.length - 1] : '';
  }

  /**
   * Calculate extraction cost based on method and volume
   */
  private calculateCost(contactCount: number, method: 'apollo' | 'linkedin'): number {
    const baseCostPer1000 = method === 'apollo' ? 1.70 : 1.50; // Including Apify CU costs
    return (contactCount / 1000) * baseCostPer1000;
  }

  /**
   * Generate appropriate warnings based on results and quota
   */
  private generateWarnings(result: any, quota: UserQuota): string[] {
    const warnings: string[] = [];

    // Quota warnings
    const percentageUsed = (quota.used / quota.totalQuota) * 100;
    if (percentageUsed > 90) {
      warnings.push(`⚠️ Quota almost exhausted: ${quota.remaining} contacts remaining`);
    } else if (percentageUsed > 70) {
      warnings.push(`📊 High quota usage: ${quota.remaining} contacts remaining this month`);
    }

    // Extraction quality warnings
    if (result.errors && result.errors.length > 0) {
      warnings.push(`${result.errors.length} profiles had extraction issues`);
    }

    // Daily limit warnings (though Apollo doesn't have daily limits)
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    if (quota.used > 350) {
      warnings.push('💡 Using Apollo database - no daily LinkedIn scraping limits');
    }

    return warnings;
  }
}