/**
 * KnowledgePage - Knowledge ingestion with agent activity
 */

import React from 'react';
import { KnowledgeIngestionInterface } from '@/components/knowledge/KnowledgeIngestionInterface';
import { AgentActivityBar } from '@/components/ai/AgentActivityBar';
import { useAgentActivity } from '@/hooks/useAgentActivity';

export const KnowledgePage: React.FC = () => {
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
      <KnowledgeIngestionInterface
        onActivityUpdate={handleActivityUpdate}
        className="h-screen"
      />
      
      <AgentActivityBar
        activities={agentActivity.activities}
        currentAgent="Knowledge Agent"
        isActive={agentActivity.isActive}
      />
    </div>
  );
};

export default KnowledgePage;