/**
 * OnboardingInterface - Devin-style agent interface
 * Integrates with OnboardingAgent and displays activity in bottom bar
 */

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageCircle, 
  User, 
  Bot, 
  CheckCircle, 
  Clock,
  ArrowRight,
  Sparkles,
  Brain,
  Target
} from 'lucide-react';

interface OnboardingMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isTyping?: boolean;
  metadata?: {
    step?: string;
    progress?: number;
    extractedData?: Record<string, unknown>;
  };
}

interface AgentActivity {
  id: string;
  type: 'processing' | 'extracting' | 'generating' | 'storing' | 'complete';
  message: string;
  timestamp: Date;
  duration?: number;
  metadata?: Record<string, unknown>;
}

interface OnboardingInterfaceProps {
  onComplete?: (trainingData: Record<string, unknown>) => void;
  onActivityUpdate?: (activity: AgentActivity) => void;
  className?: string;
}

export const OnboardingInterface: React.FC<OnboardingInterfaceProps> = ({
  onComplete,
  onActivityUpdate,
  className = ''
}) => {
  const [messages, setMessages] = useState<OnboardingMessage[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [onboardingState, setOnboardingState] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState<any>(null);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Start onboarding when component mounts
  useEffect(() => {
    startOnboarding();
  }, []);

  const updateAgentActivity = (type: AgentActivity['type'], message: string, metadata?: Record<string, unknown>) => {
    const activity: AgentActivity = {
      id: `activity_${Date.now()}`,
      type,
      message,
      timestamp: new Date(),
      metadata
    };
    
    onActivityUpdate?.(activity);
  };

  const startOnboarding = async () => {
    setIsLoading(true);
    updateAgentActivity('processing', 'Initializing SAM AI onboarding agent...');

    try {
      // Mock the OnboardingAgent response for now
      // In real implementation, this would call the actual agent
      setTimeout(() => {
        const welcomeMessage = `👋 **Welcome to SAM AI!**

I'm SAM, your AI sales assistant, and I'm excited to help you succeed! 

I'm going to learn about your business so I can provide you with the most personalized sales assistance possible. This will be a quick conversation where I'll understand your needs, and then I'll be able to help you with everything from finding prospects to crafting perfect messages.

Ready to get started? Let's build something amazing together! 🚀

**Company Overview**
Let's start with the basics! What's your company name and what industry are you in?`;

        const mockState = {
          currentStep: 0,
          totalSteps: 3,
          completionPercentage: 0,
          steps: [
            { id: 'company_basics', title: 'Company Overview', completed: false },
            { id: 'target_market', title: 'Target Market & ICP', completed: false },
            { id: 'pain_points_solutions', title: 'Problems & Solutions', completed: false }
          ]
        };

        setMessages([{
          id: 'welcome_' + Date.now(),
          role: 'assistant',
          content: welcomeMessage,
          timestamp: new Date(),
          metadata: {
            step: 'Company Overview',
            progress: 0
          }
        }]);

        setOnboardingState(mockState);
        setCurrentStep(mockState.steps[0]);
        setProgress(0);
        setIsLoading(false);
        updateAgentActivity('complete', 'SAM AI onboarding ready');
      }, 2000);

    } catch (error) {
      console.error('Failed to start onboarding:', error);
      setIsLoading(false);
      updateAgentActivity('complete', 'Failed to initialize onboarding');
    }
  };

  const sendMessage = async () => {
    if (!currentInput.trim() || isLoading || isComplete) return;

    const userMessage: OnboardingMessage = {
      id: 'user_' + Date.now(),
      role: 'user',
      content: currentInput,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentInput('');
    setIsLoading(true);

    // Show agent activity
    updateAgentActivity('processing', 'Processing your response...');

    try {
      // Simulate agent processing
      setTimeout(() => {
        updateAgentActivity('extracting', 'Extracting structured data from your response...');
      }, 1000);

      setTimeout(() => {
        updateAgentActivity('generating', 'Generating personalized response...');
      }, 2000);

      setTimeout(() => {
        updateAgentActivity('storing', 'Storing insights in memory system...');
      }, 3000);

      // Mock response based on current step
      setTimeout(() => {
        let responseContent = '';
        let newProgress = progress;
        let nextStep = currentStep;
        let isOnboardingComplete = false;

        // Mock responses based on step
        if (progress === 0) {
          // After company basics
          responseContent = `Perfect! I can see that you're building something exciting in the industry. I'm already learning about your unique position and how I can help you scale your sales efforts.

Now let's dive into your ideal customers - this is where the magic happens! 🎯

**Target Market & ICP**
Perfect! Now tell me about your ideal customers. What types of companies do you typically sell to?`;
          newProgress = 33;
          nextStep = { id: 'target_market', title: 'Target Market & ICP', completed: false };
        } else if (progress === 33) {
          // After target market
          responseContent = `Excellent! I'm building a detailed profile of your ideal customer. This is exactly the kind of insight that will help me find perfect prospects for you and craft messages that resonate.

Let's get to the heart of your value proposition! 💡

**Problems & Solutions**
Great! What are the main problems or pain points that your ideal customers face that you help solve?`;
          newProgress = 66;
          nextStep = { id: 'pain_points_solutions', title: 'Problems & Solutions', completed: false };
        } else {
          // Completion
          responseContent = `🎉 **Fantastic! We're all set!**

Thank you for sharing all that valuable information with me! I now have a comprehensive understanding of your business, and I'm excited to help you succeed.

Here's what I've learned about you:
• **Your Company**: Innovative solutions in your industry
• **Your Ideal Customers**: Well-defined target market with specific characteristics  
• **Your Value Proposition**: Clear problems you solve with measurable results

**I'm now ready to help you with:**
✨ Finding perfect prospects that match your ICP
🎯 Crafting personalized messages that convert
📈 Managing campaigns across LinkedIn and email
🤖 Automating your entire sales workflow
📊 Analyzing performance and optimizing results

Your personalized AI assistant is now active! I've stored all your business context so every interaction will be tailored specifically to your needs.

**Ready to start generating leads and closing deals? Let's go! 🚀**`;
          newProgress = 100;
          isOnboardingComplete = true;
        }

        const assistantMessage: OnboardingMessage = {
          id: 'assistant_' + Date.now(),
          role: 'assistant',
          content: responseContent,
          timestamp: new Date(),
          metadata: {
            step: nextStep?.title,
            progress: newProgress,
            extractedData: {
              // Mock extracted data
              step_completed: currentStep?.id,
              insights_stored: true
            }
          }
        };

        setMessages(prev => [...prev, assistantMessage]);
        setProgress(newProgress);
        setCurrentStep(nextStep);
        setIsComplete(isOnboardingComplete);
        setIsLoading(false);

        if (isOnboardingComplete) {
          updateAgentActivity('complete', 'Onboarding complete! Training data generated.');
          onComplete?.({
            company_profile: { company_info: 'extracted' },
            ideal_customer_profile: { icp_data: 'extracted' },
            value_proposition: { solutions: 'extracted' }
          });
        } else {
          updateAgentActivity('complete', `Step ${currentStep?.id} completed - ready for next input`);
        }
      }, 4000);

    } catch (error) {
      console.error('Failed to process message:', error);
      setIsLoading(false);
      updateAgentActivity('complete', 'Error processing message');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">SAM AI Onboarding</h2>
            <p className="text-sm text-gray-600">
              {isComplete ? 'Setup Complete!' : `Step ${Math.floor(progress / 33) + 1} of 3`}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Progress value={progress} className="w-32" />
            <span className="text-sm font-medium text-gray-700">{progress}%</span>
          </div>
          
          {currentStep && (
            <Badge variant="secondary" className="flex items-center space-x-1">
              <Target className="w-3 h-3" />
              <span>{currentStep.title}</span>
            </Badge>
          )}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4 pb-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start space-x-3 ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}
              
              <Card className={`max-w-3xl ${
                message.role === 'user' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white border border-gray-200'
              }`}>
                <CardContent className="p-4">
                  <div className={`prose prose-sm max-w-none ${
                    message.role === 'user' ? 'prose-invert' : ''
                  }`}>
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200/20">
                    <div className="flex items-center space-x-2 text-xs opacity-70">
                      <Clock className="w-3 h-3" />
                      <span>{message.timestamp.toLocaleTimeString()}</span>
                    </div>
                    
                    {message.metadata?.progress !== undefined && (
                      <Badge variant="outline" className="text-xs">
                        {message.metadata.progress}% Complete
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              {message.role === 'user' && (
                <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-white animate-pulse" />
              </div>
              <Card className="bg-gray-50 border border-gray-200">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-sm text-gray-600">SAM is thinking...</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
        <div ref={messagesEndRef} />
      </ScrollArea>

      {/* Input */}
      {!isComplete && (
        <div className="p-4 border-t bg-white">
          <div className="flex space-x-2">
            <Input
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Tell SAM about your business..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button 
              onClick={sendMessage} 
              disabled={!currentInput.trim() || isLoading}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
          
          {currentStep && (
            <p className="text-xs text-gray-500 mt-2">
              💡 {currentStep.title}: Share detailed information for better personalization
            </p>
          )}
        </div>
      )}

      {/* Completion Actions */}
      {isComplete && (
        <div className="p-4 border-t bg-gradient-to-r from-green-50 to-blue-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-800">Onboarding Complete!</span>
            </div>
            <Button 
              onClick={() => window.location.href = '/workspace'}
              className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
            >
              Start Using SAM AI
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OnboardingInterface;