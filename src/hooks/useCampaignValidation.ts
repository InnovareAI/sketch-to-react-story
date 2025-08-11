// Campaign Validation Hook
// React hook for validating lead assignments and campaign compatibility

import { useState, useEffect, useMemo } from 'react';
import { 
  SAMCampaignRulesEngine, 
  LeadProfile, 
  CampaignProfile, 
  CampaignAssignmentResult 
} from '@/services/campaign-rules-engine';
import { toast } from 'sonner';

export interface ValidationState {
  isLoading: boolean;
  canAssign: boolean;
  validationResult: CampaignAssignmentResult | null;
  error: string | null;
}

export interface CampaignCompatibility {
  campaign: CampaignProfile;
  compatibleLeads: number;
  totalLeads: number;
  compatibilityScore: number;
  topIssues: string[];
}

/**
 * Hook for validating single lead against campaign
 */
export function useLeadValidation(lead: LeadProfile | null, campaign: CampaignProfile | null) {
  const [state, setState] = useState<ValidationState>({
    isLoading: false,
    canAssign: false,
    validationResult: null,
    error: null
  });

  useEffect(() => {
    if (!lead || !campaign) {
      setState({
        isLoading: false,
        canAssign: false,
        validationResult: null,
        error: null
      });
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = SAMCampaignRulesEngine.validateLeadForCampaign(lead, campaign);
      
      setState({
        isLoading: false,
        canAssign: result.canAssign,
        validationResult: result,
        error: null
      });
    } catch (error) {
      setState({
        isLoading: false,
        canAssign: false,
        validationResult: null,
        error: error instanceof Error ? error.message : 'Validation failed'
      });
    }
  }, [lead, campaign]);

  const validateAndAssign = async (onSuccess?: () => void, onError?: (error: string) => void) => {
    if (!state.validationResult || !state.canAssign) {
      const errorMsg = state.validationResult?.blockedReasons.join(', ') || 'Cannot assign lead to campaign';
      toast.error(errorMsg);
      onError?.(errorMsg);
      return false;
    }

    if (state.validationResult.warnings.length > 0) {
      toast.warning(`Assignment successful with warnings: ${state.validationResult.warnings.join(', ')}`);
    } else {
      toast.success('Lead successfully assigned to campaign');
    }

    onSuccess?.();
    return true;
  };

  return {
    ...state,
    validateAndAssign,
    warnings: state.validationResult?.warnings || [],
    suggestions: state.validationResult?.suggestions || [],
    blockedReasons: state.validationResult?.blockedReasons || [],
    estimatedSuccessRate: state.validationResult?.estimatedSuccessRate
  };
}

/**
 * Hook for validating multiple leads against campaign
 */
export function useBulkLeadValidation(leads: LeadProfile[], campaign: CampaignProfile | null) {
  const [state, setState] = useState<ValidationState>({
    isLoading: false,
    canAssign: false,
    validationResult: null,
    error: null
  });

  useEffect(() => {
    if (leads.length === 0 || !campaign) {
      setState({
        isLoading: false,
        canAssign: false,
        validationResult: null,
        error: null
      });
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = SAMCampaignRulesEngine.validateLeadsForCampaign(leads, campaign);
      
      setState({
        isLoading: false,
        canAssign: result.canAssign,
        validationResult: result,
        error: null
      });
    } catch (error) {
      setState({
        isLoading: false,
        canAssign: false,
        validationResult: null,
        error: error instanceof Error ? error.message : 'Validation failed'
      });
    }
  }, [leads, campaign]);

  const validateAndAssignBulk = async (
    onSuccess?: (validCount: number, totalCount: number) => void,
    onError?: (error: string) => void
  ) => {
    if (!state.validationResult) {
      const errorMsg = 'No validation result available';
      toast.error(errorMsg);
      onError?.(errorMsg);
      return false;
    }

    const { validLeadsCount, totalLeadsCount } = state.validationResult;

    if (validLeadsCount === 0) {
      const errorMsg = state.validationResult.blockedReasons.join(', ') || 'No leads can be assigned to this campaign';
      toast.error(errorMsg);
      onError?.(errorMsg);
      return false;
    }

    if (validLeadsCount < totalLeadsCount) {
      const blockedCount = totalLeadsCount - validLeadsCount;
      toast.warning(`${validLeadsCount}/${totalLeadsCount} leads assigned successfully. ${blockedCount} leads blocked.`);
    } else {
      toast.success(`All ${validLeadsCount} leads successfully assigned to campaign`);
    }

    if (state.validationResult.warnings.length > 0) {
      toast.info(`Warnings: ${state.validationResult.warnings.slice(0, 2).join(', ')}`);
    }

    onSuccess?.(validLeadsCount, totalLeadsCount);
    return true;
  };

  return {
    ...state,
    validateAndAssignBulk,
    warnings: state.validationResult?.warnings || [],
    suggestions: state.validationResult?.suggestions || [],
    blockedReasons: state.validationResult?.blockedReasons || [],
    validLeadsCount: state.validationResult?.validLeadsCount || 0,
    totalLeadsCount: state.validationResult?.totalLeadsCount || 0,
    estimatedSuccessRate: state.validationResult?.estimatedSuccessRate
  };
}

/**
 * Hook for campaign compatibility analysis
 */
export function useCampaignCompatibility(leads: LeadProfile[]) {
  const [campaigns] = useState<CampaignProfile[]>(() => 
    SAMCampaignRulesEngine.getCampaignTemplates()
  );

  const compatibility = useMemo(() => {
    if (leads.length === 0) return [];
    
    return SAMCampaignRulesEngine.getCampaignCompatibility(leads, campaigns)
      .sort((a, b) => b.compatibilityScore - a.compatibilityScore); // Sort by best compatibility
  }, [leads, campaigns]);

  const bestCampaign = compatibility.length > 0 ? compatibility[0] : null;
  const averageCompatibility = compatibility.length > 0 
    ? Math.round(compatibility.reduce((sum, c) => sum + c.compatibilityScore, 0) / compatibility.length)
    : 0;

  return {
    compatibility,
    bestCampaign,
    averageCompatibility,
    campaigns,
    totalCampaigns: campaigns.length
  };
}

/**
 * Hook for real-time validation feedback
 */
export function useValidationFeedback(
  leads: LeadProfile[], 
  selectedCampaignId: string | null
) {
  const campaigns = SAMCampaignRulesEngine.getCampaignTemplates();
  const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId) || null;
  
  const { 
    canAssign, 
    validationResult, 
    warnings, 
    suggestions, 
    blockedReasons,
    validLeadsCount,
    totalLeadsCount,
    estimatedSuccessRate
  } = useBulkLeadValidation(leads, selectedCampaign);

  const feedback = useMemo(() => {
    if (!validationResult || !selectedCampaign) {
      return {
        status: 'idle' as const,
        message: 'Select a campaign to see compatibility',
        color: 'gray'
      };
    }

    if (!canAssign) {
      return {
        status: 'blocked' as const,
        message: `Cannot assign leads: ${blockedReasons[0] || 'Unknown restriction'}`,
        color: 'red'
      };
    }

    if (validLeadsCount < totalLeadsCount) {
      const percentage = Math.round((validLeadsCount / totalLeadsCount) * 100);
      return {
        status: 'partial' as const,
        message: `${validLeadsCount}/${totalLeadsCount} leads compatible (${percentage}%)`,
        color: 'yellow'
      };
    }

    return {
      status: 'success' as const,
      message: `All ${validLeadsCount} leads are compatible`,
      color: 'green'
    };
  }, [validationResult, selectedCampaign, canAssign, blockedReasons, validLeadsCount, totalLeadsCount]);

  return {
    feedback,
    canAssign,
    warnings,
    suggestions,
    blockedReasons,
    validLeadsCount,
    totalLeadsCount,
    estimatedSuccessRate,
    selectedCampaign
  };
}