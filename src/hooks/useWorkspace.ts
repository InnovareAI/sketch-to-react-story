/**
 * Workspace Hook
 * Provides workspace data management across the application
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface WorkspaceData {
  id: string;
  name: string;
  slug?: string;
  subscription_tier?: string;
  settings?: any;
}

export function useWorkspace() {
  const { user: authUser } = useAuth();
  
  // Use default workspace ID when user is not authenticated
  const DEFAULT_WORKSPACE_ID = 'df5d730f-1915-4269-bd5a-9534478b17af';
  const workspaceId = authUser?.workspace_id || DEFAULT_WORKSPACE_ID;
  
  const [workspace, setWorkspace] = useState<WorkspaceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadWorkspace = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Handle bypass user workspace
      if (workspaceId === 'bypass-workspace-id') {
        console.log('🚀 Loading workspace for bypass user');
        
        // Check if there's saved workspace data in localStorage
        const savedWorkspaceData = localStorage.getItem('bypass_workspace');
        if (savedWorkspaceData) {
          try {
            const parsedWorkspace = JSON.parse(savedWorkspaceData);
            console.log('Loaded saved workspace data:', parsedWorkspace);
            setWorkspace(parsedWorkspace);
            setLoading(false);
            return;
          } catch (error) {
            console.error('Error parsing saved workspace data:', error);
          }
        }
        
        // Default mock workspace if no saved data
        const mockWorkspace: WorkspaceData = {
          id: 'bypass-workspace-id',
          name: 'InnovareAI',
          slug: 'innovareai',
          subscription_tier: 'pro',
          settings: {
            website: 'https://innovareai.com',
            industry: 'Technology',
            companySize: '50-100',
            description: 'AI-powered sales automation platform',
            phone: '+1 (555) 123-4567',
            email: 'contact@innovareai.com',
            address: 'San Francisco, CA',
            timezone: 'UTC-8'
          }
        };
        setWorkspace(mockWorkspace);
        setLoading(false);
        return;
      }
      
      const { data, error: supabaseError } = await supabase
        .from('workspaces')
        .select('*')
        .eq('id', workspaceId)
        .single();
        
      if (supabaseError) {
        if (supabaseError.code === 'PGRST116') {
          // Workspace doesn't exist, create it
          console.log('Workspace not found, creating default workspace...');
          const { data: newWorkspace, error: createError } = await supabase
            .from('workspaces')
            .insert({
              id: workspaceId,
              name: 'My Company',
              slug: 'my-company',
              subscription_tier: 'pro',
              settings: {
                website: '',
                industry: '',
                companySize: '',
                description: '',
                phone: '',
                email: '',
                address: '',
                timezone: 'UTC-5'
              }
            })
            .select()
            .single();
            
          if (createError) {
            setError('Failed to create workspace');
            console.error('Error creating workspace:', createError);
            return;
          }
          
          setWorkspace(newWorkspace);
        } else {
          setError('Failed to load workspace');
          console.error('Error loading workspace:', supabaseError);
        }
        return;
      }
      
      setWorkspace(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load workspace');
      console.error('Error in loadWorkspace:', err);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  const refreshWorkspace = useCallback(() => {
    return loadWorkspace();
  }, [loadWorkspace]);

  return {
    workspace,
    workspaceId,
    loading,
    error,
    refreshWorkspace
  };
}