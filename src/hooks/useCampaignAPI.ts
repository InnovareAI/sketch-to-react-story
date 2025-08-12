// Campaign API Integration Hooks
// React hooks that connect the frontend to the technical campaign API services

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CampaignAPIService, DatabaseCampaign, DatabaseLeadProfile, CampaignAssignment } from '@/services/campaign-api-service';
import { LeadEnrichmentService, EnrichmentRequest } from '@/services/lead-enrichment-service';
import { SAMCampaignRulesEngine, CampaignAssignmentResult } from '@/services/campaign-rules-engine';
import { toast } from 'sonner';

/**
 * Hook for managing campaigns
 */
export function useCampaigns(workspaceId: string) {
  const queryClient = useQueryClient();

  // Fetch campaigns
  const {
    data: campaigns = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['campaigns', workspaceId],
    queryFn: () => CampaignAPIService.getCampaigns(workspaceId),
    enabled: !!workspaceId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000 // 10 minutes
  });

  // Create campaign mutation
  const createCampaignMutation = useMutation({
    mutationFn: (campaign: Partial<DatabaseCampaign>) => CampaignAPIService.createCampaign(campaign),
    onSuccess: (newCampaign) => {
      queryClient.setQueryData(['campaigns', workspaceId], (old: DatabaseCampaign[] = []) => [
        newCampaign,
        ...old
      ]);
      toast.success('Campaign created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create campaign: ' + (error as Error).message);
    }
  });

  // Update campaign mutation
  const updateCampaignMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<DatabaseCampaign> }) => 
      CampaignAPIService.updateCampaign(id, updates),
    onSuccess: (updatedCampaign) => {
      queryClient.setQueryData(['campaigns', workspaceId], (old: DatabaseCampaign[] = []) =>
        old.map(campaign => campaign.id === updatedCampaign.id ? updatedCampaign : campaign)
      );
      toast.success('Campaign updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update campaign: ' + (error as Error).message);
    }
  });

  // Derived state
  const activeCampaigns = campaigns.filter(c => c.status === 'active');
  const draftCampaigns = campaigns.filter(c => c.status === 'draft');

  return {
    campaigns,
    activeCampaigns,
    draftCampaigns,
    isLoading,
    error,
    refetch,
    createCampaign: createCampaignMutation.mutate,
    updateCampaign: updateCampaignMutation.mutate,
    isCreating: createCampaignMutation.isPending,
    isUpdating: updateCampaignMutation.isPending
  };
}

/**
 * Hook for managing leads
 */
export function useLeads(workspaceId: string, filters?: {
  search_source?: string;
  quality_score_min?: number;
  enrichment_status?: string;
  limit?: number;
  offset?: number;
}) {
  const queryClient = useQueryClient();

  // Fetch leads
  const {
    data,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['leads', workspaceId, filters],
    queryFn: () => CampaignAPIService.getLeads(workspaceId, filters),
    enabled: !!workspaceId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    keepPreviousData: true
  });

  // Upsert lead mutation
  const upsertLeadMutation = useMutation({
    mutationFn: (lead: Partial<DatabaseLeadProfile>) => CampaignAPIService.upsertLead(lead),
    onSuccess: (updatedLead) => {
      // Update the leads cache
      queryClient.setQueryData(['leads', workspaceId, filters], (old: any) => {
        if (!old) return old;
        
        const existingIndex = old.leads.findIndex((l: DatabaseLeadProfile) => l.id === updatedLead.id);
        if (existingIndex >= 0) {
          old.leads[existingIndex] = updatedLead;
        } else {
          old.leads.unshift(updatedLead);
          old.total += 1;
        }
        return { ...old };
      });
      toast.success('Lead updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update lead: ' + (error as Error).message);
    }
  });

  // Batch create leads mutation
  const batchCreateLeadsMutation = useMutation({
    mutationFn: ({ leads, searchId }: { leads: Partial<DatabaseLeadProfile>[]; searchId?: string }) =>
      CampaignAPIService.batchCreateLeads(leads, searchId),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['leads', workspaceId] });
      toast.success(`Created ${result.created} leads${result.errors.length > 0 ? ` with ${result.errors.length} errors` : ''}`);
    },
    onError: (error) => {
      toast.error('Failed to create leads: ' + (error as Error).message);
    }
  });

  return {
    leads: data?.leads || [],
    total: data?.total || 0,
    isLoading,
    error,
    refetch,
    upsertLead: upsertLeadMutation.mutate,
    batchCreateLeads: batchCreateLeadsMutation.mutate,
    isUpserting: upsertLeadMutation.isPending,
    isBatchCreating: batchCreateLeadsMutation.isPending
  };
}

/**
 * Hook for campaign assignments with real-time validation
 */
export function useCampaignAssignments(campaignId?: string, filters?: {
  status?: string;
  limit?: number;
  offset?: number;
}) {
  const queryClient = useQueryClient();

  // Fetch assignments
  const {
    data,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['campaign-assignments', campaignId, filters],
    queryFn: () => campaignId ? CampaignAPIService.getCampaignAssignments(campaignId, filters) : null,
    enabled: !!campaignId,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000 // Refetch every minute for real-time updates
  });

  // Assign leads mutation with validation
  const assignLeadsMutation = useMutation({
    mutationFn: async ({ 
      leadIds, 
      campaignId, 
      workspaceId, 
      assignedBy 
    }: { 
      leadIds: string[]; 
      campaignId: string; 
      workspaceId: string; 
      assignedBy: string; 
    }) => {
      // Run validation first
      const validationResult = await CampaignAPIService.validateLeadsForCampaign(leadIds, campaignId);
      
      if (!validationResult.canAssign) {
        throw new Error(`Validation failed: ${validationResult.blockedReasons.join(', ')}`);
      }

      // Show validation warnings if any
      if (validationResult.warnings.length > 0) {
        toast.warning(`Proceeding with warnings: ${validationResult.warnings.slice(0, 2).join(', ')}`);
      }

      return CampaignAPIService.assignLeadsToCampaign(leadIds, campaignId, workspaceId, assignedBy);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['campaign-assignments', campaignId] });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      
      if (result.assigned > 0) {
        toast.success(`Successfully assigned ${result.assigned} leads to campaign`);
      }
      if (result.failed > 0) {
        toast.warning(`${result.failed} leads failed assignment. Check validation requirements.`);
      }
    },
    onError: (error) => {
      toast.error('Assignment failed: ' + (error as Error).message);
    }
  });

  // Update assignment status mutation
  const updateAssignmentMutation = useMutation({
    mutationFn: ({ 
      assignmentId, 
      status, 
      customFields 
    }: { 
      assignmentId: string; 
      status: CampaignAssignment['status']; 
      customFields?: any 
    }) => 
      CampaignAPIService.updateAssignmentStatus(assignmentId, status, customFields),
    onSuccess: (updatedAssignment) => {
      queryClient.setQueryData(
        ['campaign-assignments', campaignId, filters], 
        (old: any) => {
          if (!old) return old;
          
          const updatedAssignments = old.assignments.map((a: CampaignAssignment) =>
            a.id === updatedAssignment.id ? updatedAssignment : a
          );
          
          return { ...old, assignments: updatedAssignments };
        }
      );
      toast.success('Assignment status updated');
    },
    onError: (error) => {
      toast.error('Failed to update status: ' + (error as Error).message);
    }
  });

  return {
    assignments: data?.assignments || [],
    total: data?.total || 0,
    isLoading,
    error,
    refetch,
    assignLeads: assignLeadsMutation.mutate,
    updateAssignmentStatus: updateAssignmentMutation.mutate,
    isAssigning: assignLeadsMutation.isPending,
    isUpdatingStatus: updateAssignmentMutation.isPending
  };
}

/**
 * Hook for lead validation with caching
 */
export function useLeadValidation(leadIds: string[], campaignId?: string) {
  const [validationResult, setValidationResult] = useState<CampaignAssignmentResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Memoize validation key to prevent unnecessary re-validations
  const validationKey = useMemo(() => 
    `${leadIds.sort().join(',')}-${campaignId}`, 
    [leadIds, campaignId]
  );

  const validateLeads = useCallback(async (forceRefresh = false) => {
    if (!campaignId || leadIds.length === 0) {
      setValidationResult(null);
      return;
    }

    setIsValidating(true);
    setError(null);

    try {
      const result = await CampaignAPIService.validateLeadsForCampaign(leadIds, campaignId);
      setValidationResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Validation failed');
      setValidationResult(null);
    } finally {
      setIsValidating(false);
    }
  }, [leadIds, campaignId]);

  // Auto-validate when inputs change
  useEffect(() => {
    validateLeads();
  }, [validationKey, validateLeads]);

  return {
    validationResult,
    isValidating,
    error,
    validateLeads,
    canAssign: validationResult?.canAssign || false,
    validLeadsCount: validationResult?.validLeadsCount || 0,
    totalLeadsCount: validationResult?.totalLeadsCount || 0,
    blockedReasons: validationResult?.blockedReasons || [],
    warnings: validationResult?.warnings || [],
    suggestions: validationResult?.suggestions || [],
    estimatedSuccessRate: validationResult?.estimatedSuccessRate
  };
}

/**
 * Hook for lead enrichment
 */
export function useLeadEnrichment() {
  const queryClient = useQueryClient();

  // Single lead enrichment
  const enrichLeadMutation = useMutation({
    mutationFn: (request: EnrichmentRequest) => LeadEnrichmentService.enrichLead(request),
    onSuccess: (result, variables) => {
      if (result.success) {
        // Invalidate lead queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['leads'] });
        toast.success(`Enriched ${result.fields_enriched.length} fields for lead`);
      } else {
        toast.error(`Enrichment failed: ${result.errors.join(', ')}`);
      }
    }
  });

  // Bulk enrichment
  const bulkEnrichMutation = useMutation({
    mutationFn: (params: {
      requests: EnrichmentRequest[];
      options?: {
        batch_size?: number;
        delay_between_batches?: number;
        max_concurrent?: number;
        budget_limit?: number;
      };
    }) => LeadEnrichmentService.enrichLeadsBulk(params.requests, params.options),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success(
        `Bulk enrichment completed: ${result.success_count} successful, ${result.error_count} failed. Cost: $${result.total_cost.toFixed(2)}`
      );
    },
    onError: (error) => {
      toast.error('Bulk enrichment failed: ' + (error as Error).message);
    }
  });

  // Auto-enrich for validation
  const autoEnrichForValidationMutation = useMutation({
    mutationFn: ({ leadIds, campaignId }: { leadIds: string[]; campaignId: string }) =>
      LeadEnrichmentService.autoEnrichForValidation(leadIds, campaignId),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      if (result.enriched_count > 0) {
        toast.success(`Auto-enriched ${result.enriched_count} leads for better validation`);
      }
      if (result.errors.length > 0) {
        toast.warning(`Some enrichments failed: ${result.errors.slice(0, 2).join(', ')}`);
      }
    }
  });

  // Get enrichment status
  const getEnrichmentStatus = useCallback(async (leadIds: string[]) => {
    try {
      return await LeadEnrichmentService.getEnrichmentStatus(leadIds);
    } catch (error) {
      toast.error('Failed to get enrichment status');
      return {};
    }
  }, []);

  return {
    enrichLead: enrichLeadMutation.mutate,
    bulkEnrich: bulkEnrichMutation.mutate,
    autoEnrichForValidation: autoEnrichForValidationMutation.mutate,
    getEnrichmentStatus,
    isEnriching: enrichLeadMutation.isPending,
    isBulkEnriching: bulkEnrichMutation.isPending,
    isAutoEnriching: autoEnrichForValidationMutation.isPending
  };
}

/**
 * Hook for campaign analytics
 */
export function useCampaignAnalytics(campaignId?: string, dateRange?: { from: string; to: string }) {
  const {
    data: analytics,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['campaign-analytics', campaignId, dateRange],
    queryFn: () => campaignId ? CampaignAPIService.getCampaignAnalytics(campaignId, dateRange) : null,
    enabled: !!campaignId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000 // Auto-refresh every 5 minutes
  });

  return {
    analytics,
    dailyData: analytics?.daily || [],
    totals: analytics?.totals || {},
    responseRate: analytics?.response_rate || 0,
    connectionRate: analytics?.connection_rate || 0,
    isLoading,
    error,
    refetch
  };
}

/**
 * Hook for comprehensive campaign management
 */
export function useCampaignManager(workspaceId: string, userId: string) {
  const campaigns = useCampaigns(workspaceId);
  const leads = useLeads(workspaceId);
  const enrichment = useLeadEnrichment();

  // Smart campaign assignment with validation and enrichment
  const smartAssignLeads = useCallback(async (
    leadIds: string[],
    campaignId: string,
    options: {
      auto_enrich?: boolean;
      validation_threshold?: number;
      budget_limit?: number;
    } = {}
  ) => {
    const {
      auto_enrich = true,
      validation_threshold = 0.7,
      budget_limit = 50
    } = options;

    try {
      // Step 1: Auto-enrich leads if needed
      if (auto_enrich) {
        toast.info('Enriching leads for better validation...');
        await new Promise<void>((resolve, reject) => {
          enrichment.autoEnrichForValidation({ leadIds, campaignId });
          // Wait for enrichment to complete
          setTimeout(() => resolve(), 2000);
        });
      }

      // Step 2: Validate leads
      const validationResult = await CampaignAPIService.validateLeadsForCampaign(leadIds, campaignId);
      
      if (validationResult.validLeadsCount === 0) {
        throw new Error(`No leads passed validation: ${validationResult.blockedReasons.join(', ')}`);
      }

      const validationScore = validationResult.validLeadsCount / validationResult.totalLeadsCount;
      if (validationScore < validation_threshold) {
        // Show warning toast instead of blocking modal
        toast.warning(
          `Only ${Math.round(validationScore * 100)}% of leads passed validation (threshold: ${Math.round(validation_threshold * 100)}%). Proceeding with assignment.`,
          { duration: 5000 }
        );
      }

      // Step 3: Assign leads
      const assignmentResult = await CampaignAPIService.assignLeadsToCampaign(
        leadIds, 
        campaignId, 
        workspaceId, 
        userId
      );

      return assignmentResult;
    } catch (error) {
      toast.error('Smart assignment failed: ' + (error as Error).message);
      throw error;
    }
  }, [workspaceId, userId, enrichment]);

  return {
    ...campaigns,
    ...leads,
    enrichment,
    smartAssignLeads,
    
    // Combined loading states
    isLoading: campaigns.isLoading || leads.isLoading,
    
    // Utility functions
    getCampaignById: (id: string) => campaigns.campaigns.find(c => c.id === id),
    getLeadById: (id: string) => leads.leads.find(l => l.id === id),
    
    // Statistics
    totalLeads: leads.total,
    totalCampaigns: campaigns.campaigns.length,
    activeCampaignsCount: campaigns.activeCampaigns.length
  };
}