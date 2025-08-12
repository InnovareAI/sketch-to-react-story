// Premium Account Validation Service
// Validates LinkedIn Premium requirements for different campaign types

import { supabase } from '@/integrations/supabase/client';

export interface LinkedInAccountStatus {
  id: string;
  email: string;
  name: string;
  premium_status: 'basic' | 'premium' | 'sales_navigator' | 'recruiter';
  two_factor_enabled: boolean;
  account_verified: boolean;
  daily_limits: {
    connections: number;
    messages: number;
    inmails: number;
  };
  features: string[];
  last_verified: string;
}

export interface CampaignTypeRequirements {
  premium_required: boolean;
  sales_navigator_required: boolean;
  two_factor_required: boolean;
  verified_account_required: boolean;
  minimum_premium_level: 'basic' | 'premium' | 'sales_navigator' | 'recruiter';
}

class PremiumValidationService {
  private static instance: PremiumValidationService;
  
  // Campaign type requirements mapping
  private readonly campaignRequirements: Record<string, CampaignTypeRequirements> = {
    mobile_connector: {
      premium_required: false,
      sales_navigator_required: false,
      two_factor_required: true,
      verified_account_required: true,
      minimum_premium_level: 'basic'
    },
    connector: {
      premium_required: false,
      sales_navigator_required: false,
      two_factor_required: true,
      verified_account_required: true,
      minimum_premium_level: 'basic'
    },
    messenger: {
      premium_required: false,
      sales_navigator_required: false,
      two_factor_required: false,
      verified_account_required: true,
      minimum_premium_level: 'basic'
    },
    open_inmail: {
      premium_required: true,
      sales_navigator_required: true,
      two_factor_required: false,
      verified_account_required: true,
      minimum_premium_level: 'sales_navigator'
    },
    event_invite: {
      premium_required: false,
      sales_navigator_required: false,
      two_factor_required: false,
      verified_account_required: true,
      minimum_premium_level: 'basic'
    },
    company_follow_invite: {
      premium_required: false,
      sales_navigator_required: false,
      two_factor_required: false,
      verified_account_required: true,
      minimum_premium_level: 'basic'
    },
    group: {
      premium_required: false,
      sales_navigator_required: false,
      two_factor_required: false,
      verified_account_required: true,
      minimum_premium_level: 'basic'
    },
    inbound: {
      premium_required: true,
      sales_navigator_required: false,
      two_factor_required: false,
      verified_account_required: true,
      minimum_premium_level: 'premium'
    },
    event_participants: {
      premium_required: false,
      sales_navigator_required: false,
      two_factor_required: false,
      verified_account_required: true,
      minimum_premium_level: 'basic'
    },
    recovery: {
      premium_required: false,
      sales_navigator_required: false,
      two_factor_required: false,
      verified_account_required: true,
      minimum_premium_level: 'basic'
    }
  };

  static getInstance(): PremiumValidationService {
    if (!PremiumValidationService.instance) {
      PremiumValidationService.instance = new PremiumValidationService();
    }
    return PremiumValidationService.instance;
  }

  /**
   * Get user's LinkedIn accounts with premium status
   */
  async getUserLinkedInAccounts(): Promise<LinkedInAccountStatus[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('team_accounts')
        .select(`
          id,
          email,
          name,
          status,
          metadata,
          last_sync,
          unipile_account_id
        `)
        .eq('user_id', user.id)
        .eq('provider', 'LINKEDIN')
        .eq('status', 'active');

      if (error) throw error;

      // Transform data to include premium status
      return (data || []).map(account => ({
        id: account.id,
        email: account.email || '',
        name: account.name || '',
        premium_status: this.detectPremiumStatus(account.metadata),
        two_factor_enabled: account.metadata?.two_factor_enabled || false,
        account_verified: account.metadata?.verified || false,
        daily_limits: this.getDailyLimits(account.metadata?.premium_status || 'basic'),
        features: account.metadata?.available_features || [],
        last_verified: account.last_sync || account.metadata?.last_verified || new Date().toISOString()
      }));
    } catch (error) {
      console.error('Error getting LinkedIn accounts:', error);
      return [];
    }
  }

  /**
   * Validate if user can create a specific campaign type
   */
  async validateCampaignType(campaignType: string, accountId?: string): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
    suggestions: string[];
  }> {
    const requirements = this.campaignRequirements[campaignType];
    if (!requirements) {
      return {
        valid: false,
        errors: ['Invalid campaign type'],
        warnings: [],
        suggestions: []
      };
    }

    const accounts = await this.getUserLinkedInAccounts();
    const account = accountId ? accounts.find(a => a.id === accountId) : accounts[0];

    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    if (!account) {
      errors.push('No LinkedIn account connected');
      suggestions.push('Connect a LinkedIn account to proceed');
      return { valid: false, errors, warnings, suggestions };
    }

    // Check premium requirements
    if (requirements.premium_required && account.premium_status === 'basic') {
      errors.push('This campaign type requires LinkedIn Premium or Sales Navigator');
      suggestions.push('Upgrade to LinkedIn Premium to use this campaign type');
    }

    if (requirements.sales_navigator_required && account.premium_status !== 'sales_navigator' && account.premium_status !== 'recruiter') {
      errors.push('This campaign type requires LinkedIn Sales Navigator');
      suggestions.push('Upgrade to Sales Navigator to use Open InMail campaigns');
    }

    // Check 2FA requirements
    if (requirements.two_factor_required && !account.two_factor_enabled) {
      errors.push('Two-Factor Authentication is required for this campaign type');
      suggestions.push('Enable 2FA in your LinkedIn account settings');
    }

    // Check account verification
    if (requirements.verified_account_required && !account.account_verified) {
      warnings.push('Account verification recommended for better deliverability');
      suggestions.push('Complete LinkedIn account verification');
    }

    // Check minimum premium level
    const premiumHierarchy = ['basic', 'premium', 'sales_navigator', 'recruiter'];
    const userLevel = premiumHierarchy.indexOf(account.premium_status);
    const requiredLevel = premiumHierarchy.indexOf(requirements.minimum_premium_level);

    if (userLevel < requiredLevel) {
      errors.push(`Minimum ${requirements.minimum_premium_level.replace('_', ' ')} account required`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  /**
   * Get daily limits for different account types
   */
  getDailyLimits(premiumStatus: string): LinkedInAccountStatus['daily_limits'] {
    const limits = {
      basic: { connections: 100, messages: 50, inmails: 0 },
      premium: { connections: 150, messages: 100, inmails: 5 },
      sales_navigator: { connections: 200, messages: 200, inmails: 50 },
      recruiter: { connections: 300, messages: 300, inmails: 100 }
    };

    return limits[premiumStatus as keyof typeof limits] || limits.basic;
  }

  /**
   * Detect premium status from account metadata
   */
  private detectPremiumStatus(metadata: any): LinkedInAccountStatus['premium_status'] {
    if (!metadata) return 'basic';

    // Check for premium indicators in metadata
    if (metadata.premium_status) return metadata.premium_status;
    if (metadata.sales_navigator) return 'sales_navigator';
    if (metadata.recruiter) return 'recruiter';
    if (metadata.premium) return 'premium';

    // Check features to determine premium status
    const features = metadata.available_features || metadata.features || [];
    if (features.includes('sales_navigator')) return 'sales_navigator';
    if (features.includes('recruiter_lite')) return 'recruiter';
    if (features.includes('premium_insights')) return 'premium';

    return 'basic';
  }

  /**
   * Refresh premium status for an account
   */
  async refreshAccountStatus(accountId: string): Promise<void> {
    try {
      // This would typically call the Unipile API to refresh account status
      const { data, error } = await supabase
        .from('team_accounts')
        .update({
          last_sync: new Date().toISOString(),
          metadata: {
            // Updated metadata would come from Unipile API
            last_premium_check: new Date().toISOString()
          }
        })
        .eq('id', accountId);

      if (error) throw error;
    } catch (error) {
      console.error('Error refreshing account status:', error);
      throw error;
    }
  }

  /**
   * Get campaign type requirements
   */
  getCampaignRequirements(campaignType: string): CampaignTypeRequirements | null {
    return this.campaignRequirements[campaignType] || null;
  }

  /**
   * Check if user has sufficient limits for campaign
   */
  async validateCampaignLimits(
    campaignType: string,
    dailyLimit: number,
    accountId?: string
  ): Promise<{
    valid: boolean;
    recommended_limit: number;
    warnings: string[];
  }> {
    const accounts = await this.getUserLinkedInAccounts();
    const account = accountId ? accounts.find(a => a.id === accountId) : accounts[0];

    if (!account) {
      return {
        valid: false,
        recommended_limit: 10,
        warnings: ['No LinkedIn account connected']
      };
    }

    const accountLimits = this.getDailyLimits(account.premium_status);
    const warnings: string[] = [];
    let recommendedLimit = dailyLimit;

    // Check based on campaign type
    if (['connector', 'mobile_connector'].includes(campaignType)) {
      if (dailyLimit > accountLimits.connections) {
        warnings.push(`Daily limit exceeds your account limit of ${accountLimits.connections} connections/day`);
        recommendedLimit = accountLimits.connections;
      }
    } else if (['messenger', 'group'].includes(campaignType)) {
      if (dailyLimit > accountLimits.messages) {
        warnings.push(`Daily limit exceeds your account limit of ${accountLimits.messages} messages/day`);
        recommendedLimit = accountLimits.messages;
      }
    } else if (campaignType === 'open_inmail') {
      if (dailyLimit > accountLimits.inmails) {
        warnings.push(`Daily limit exceeds your account limit of ${accountLimits.inmails} InMails/day`);
        recommendedLimit = accountLimits.inmails;
      }
    }

    // Safety recommendations
    if (dailyLimit > recommendedLimit * 0.8) {
      warnings.push('Consider using 80% of your daily limit to avoid potential restrictions');
      recommendedLimit = Math.floor(recommendedLimit * 0.8);
    }

    return {
      valid: warnings.length === 0,
      recommended_limit: recommendedLimit,
      warnings
    };
  }
}

export const premiumValidationService = PremiumValidationService.getInstance();
export default PremiumValidationService;