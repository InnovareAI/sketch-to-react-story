/**
 * useAgentActivity - Hook for managing agent activities
 * Provides state management for Devin-style agent activity tracking
 */

import { useState, useCallback } from 'react';

export interface AgentActivity {
  id: string;
  type: 'processing' | 'extracting' | 'generating' | 'storing' | 'searching' | 'analyzing' | 'complete' | 'error';
  message: string;
  timestamp: Date;
  duration?: number;
  metadata?: Record<string, unknown>;
  progress?: number;
}

interface UseAgentActivityReturn {
  activities: AgentActivity[];
  currentActivity: AgentActivity | null;
  isActive: boolean;
  addActivity: (activity: Omit<AgentActivity, 'id' | 'timestamp'>) => string;
  updateActivity: (id: string, updates: Partial<AgentActivity>) => void;
  completeActivity: (id: string, message?: string) => void;
  clearActivities: () => void;
  setProgress: (id: string, progress: number) => void;
}

export const useAgentActivity = (): UseAgentActivityReturn => {
  const [activities, setActivities] = useState<AgentActivity[]>([]);

  const addActivity = useCallback((activity: Omit<AgentActivity, 'id' | 'timestamp'>) => {
    const id = `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newActivity: AgentActivity = {
      ...activity,
      id,
      timestamp: new Date()
    };
    
    setActivities(prev => [...prev, newActivity]);
    return id;
  }, []);

  const updateActivity = useCallback((id: string, updates: Partial<AgentActivity>) => {
    setActivities(prev => prev.map(activity => 
      activity.id === id 
        ? { ...activity, ...updates }
        : activity
    ));
  }, []);

  const completeActivity = useCallback((id: string, message?: string) => {
    setActivities(prev => prev.map(activity => 
      activity.id === id 
        ? { 
            ...activity, 
            type: 'complete' as const,
            message: message || activity.message,
            duration: Date.now() - activity.timestamp.getTime()
          }
        : activity
    ));
  }, []);

  const clearActivities = useCallback(() => {
    setActivities([]);
  }, []);

  const setProgress = useCallback((id: string, progress: number) => {
    updateActivity(id, { progress });
  }, [updateActivity]);

  const currentActivity = activities.length > 0 ? activities[activities.length - 1] : null;
  const isActive = activities.some(activity => 
    !['complete', 'error'].includes(activity.type)
  );

  return {
    activities,
    currentActivity,
    isActive,
    addActivity,
    updateActivity,
    completeActivity,
    clearActivities,
    setProgress
  };
};

// Utility functions for common agent activity patterns
export const createAgentActivityHelpers = (agentHook: UseAgentActivityReturn) => {
  const { addActivity, completeActivity, setProgress, updateActivity } = agentHook;

  return {
    // Start a processing task
    startProcessing: (message: string, metadata?: Record<string, unknown>) => {
      return addActivity({
        type: 'processing',
        message,
        metadata
      });
    },

    // Start data extraction
    startExtracting: (message: string, metadata?: Record<string, unknown>) => {
      return addActivity({
        type: 'extracting',
        message,
        metadata
      });
    },

    // Start content generation
    startGenerating: (message: string, metadata?: Record<string, unknown>) => {
      return addActivity({
        type: 'generating',
        message,
        metadata
      });
    },

    // Start data storage
    startStoring: (message: string, metadata?: Record<string, unknown>) => {
      return addActivity({
        type: 'storing',
        message,
        metadata
      });
    },

    // Start searching
    startSearching: (message: string, metadata?: Record<string, unknown>) => {
      return addActivity({
        type: 'searching',
        message,
        metadata
      });
    },

    // Start analyzing
    startAnalyzing: (message: string, metadata?: Record<string, unknown>) => {
      return addActivity({
        type: 'analyzing',
        message,
        metadata
      });
    },

    // Complete any activity
    complete: (id: string, message?: string) => {
      completeActivity(id, message);
    },

    // Mark activity as error
    error: (id: string, errorMessage: string) => {
      updateActivity(id, {
        type: 'error',
        message: errorMessage
      });
    },

    // Update progress
    progress: (id: string, progress: number) => {
      setProgress(id, progress);
    },

    // Chain of activities for onboarding
    onboardingFlow: {
      initialize: () => addActivity({
        type: 'processing',
        message: 'Initializing SAM AI onboarding agent...'
      }),
      
      processResponse: (step: string) => addActivity({
        type: 'processing',
        message: `Processing your response for ${step}...`
      }),
      
      extractData: () => addActivity({
        type: 'extracting',
        message: 'Extracting structured data from your response...'
      }),
      
      generateResponse: () => addActivity({
        type: 'generating',
        message: 'Generating personalized response...'
      }),
      
      storeInsights: () => addActivity({
        type: 'storing',
        message: 'Storing insights in memory system...'
      }),
      
      generateTrainingData: () => addActivity({
        type: 'analyzing',
        message: 'Generating training data for personalization...'
      })
    },

    // Chain of activities for research
    researchFlow: {
      initiate: (criteria: string) => addActivity({
        type: 'processing',
        message: `Initiating research for: ${criteria}`
      }),
      
      scrapeData: (source: string) => addActivity({
        type: 'searching',
        message: `Scraping data from ${source}...`
      }),
      
      enrichProspects: (count: number) => addActivity({
        type: 'analyzing',
        message: `Enriching ${count} prospect profiles...`
      }),
      
      scoreLeads: () => addActivity({
        type: 'analyzing',
        message: 'Scoring leads based on your ICP...'
      }),
      
      storeResults: (count: number) => addActivity({
        type: 'storing',
        message: `Storing ${count} qualified prospects...`
      })
    }
  };
};