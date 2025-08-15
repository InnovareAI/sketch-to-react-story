/**
 * OnboardingPage - Complete onboarding experience with Devin-style interface
 * Integrates OnboardingInterface with AgentActivityBar
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { OnboardingInterface } from '@/components/onboarding/OnboardingInterface';
import { AgentActivityBar } from '@/components/ai/AgentActivityBar';
import { useAgentActivity, createAgentActivityHelpers } from '@/hooks/useAgentActivity';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Home } from 'lucide-react';

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const agentActivity = useAgentActivity();
  const agentHelpers = createAgentActivityHelpers(agentActivity);

  const handleOnboardingComplete = (trainingData: Record<string, unknown>) => {
    console.log('Onboarding completed with training data:', trainingData);
    
    // Store training data in localStorage for demo
    localStorage.setItem('sam_ai_training_data', JSON.stringify(trainingData));
    localStorage.setItem('sam_ai_onboarding_completed', 'true');
    
    // Show completion activity
    agentHelpers.complete(
      agentHelpers.onboardingFlow.generateTrainingData(),
      'Training data generated and stored successfully!'
    );

    // Auto-redirect to workspace after a brief delay
    setTimeout(() => {
      navigate('/workspace');
    }, 3000);
  };

  const handleActivityUpdate = (activity: any) => {
    // This is called from OnboardingInterface to update the activity bar
    agentActivity.addActivity({
      type: activity.type,
      message: activity.message,
      metadata: activity.metadata
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </Button>
              <div className="w-px h-4 bg-gray-300" />
              <h1 className="text-xl font-semibold text-gray-900">SAM AI Setup</h1>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/workspace')}
              className="flex items-center space-x-2"
            >
              <Home className="w-4 h-4" />
              <span>Skip to Workspace</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-[calc(100vh-200px)]">
          <OnboardingInterface
            onComplete={handleOnboardingComplete}
            onActivityUpdate={handleActivityUpdate}
            className="h-full"
          />
        </div>
      </div>

      {/* Agent Activity Bar */}
      <AgentActivityBar
        activities={agentActivity.activities}
        currentAgent="SAM AI"
        isActive={agentActivity.isActive}
      />

      {/* Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-green-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>
    </div>
  );
};

export default OnboardingPage;