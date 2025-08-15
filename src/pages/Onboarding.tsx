import { WorkspaceSetup } from '@/components/onboarding/WorkspaceSetup';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export default function Onboarding() {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user already has a workspace with LinkedIn connected
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const userProfile = JSON.parse(localStorage.getItem('user_auth_profile') || '{}');
      
      if (userProfile.workspace_id) {
        // Check if workspace has LinkedIn connected
        const { data: workspace } = await supabase
          .from('workspaces')
          .select('unipile_account_id, integrations')
          .eq('id', userProfile.workspace_id)
          .single();

        if (workspace?.unipile_account_id) {
          // Already onboarded, redirect to agent space
          navigate('/agent');
        }
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
    }
  };

  const handleComplete = () => {
    // Navigate to dashboard after successful onboarding
    navigate('/dashboard');
  };

  return (
    <WorkspaceSetup 
      userId={localStorage.getItem('user_id') || undefined}
      onComplete={handleComplete}
    />
  );
}