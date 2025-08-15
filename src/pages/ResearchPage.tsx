/**
 * ResearchPage - Lead research with agent activity
 */

import React from 'react';
import { ResearchInterface } from '@/components/research/ResearchInterface';
import { AgentActivityBar } from '@/components/ai/AgentActivityBar';
import { useAgentActivity } from '@/hooks/useAgentActivity';

export const ResearchPage: React.FC = () => {
  const agentActivity = useAgentActivity();

  const handleActivityUpdate = (activity: any) => {
    agentActivity.addActivity({
      type: activity.type,
      message: activity.message,
      metadata: activity.metadata
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <ResearchInterface
        onActivityUpdate={handleActivityUpdate}
        className="h-screen"
      />
      
      <AgentActivityBar
        activities={agentActivity.activities}
        currentAgent="Research Agent"
        isActive={agentActivity.isActive}
      />
    </div>
  );
};

export default ResearchPage;