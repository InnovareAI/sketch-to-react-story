/**
 * n8n Workflow Manager Component
 * UI for managing and triggering n8n workflows in SAM AI
 */

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Workflow, 
  Play, 
  Pause, 
  CheckCircle, 
  XCircle, 
  Clock,
  Send,
  Inbox,
  Sparkles,
  Activity,
  RefreshCw,
  Zap,
  Users,
  Target,
  Mail,
  Filter,
  MessageSquare,
  Brain,
  Globe,
  Database
} from 'lucide-react';
import { n8nService, N8nWorkflowExecution } from '@/services/n8n/N8nIntegrationService';
import { toast } from 'sonner';

interface WorkflowTemplate {
  id: string;
  name: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  mode: 'outbound' | 'inbound' | 'unified';
  color: string;
}

export function N8nWorkflowManager() {
  const [executions, setExecutions] = useState<N8nWorkflowExecution[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'outbound' | 'inbound' | 'unified'>('outbound');
  const [workflowHealth, setWorkflowHealth] = useState<{
    connected: boolean;
    activeWorkflows: number;
    lastExecution?: Date;
  }>({ connected: false, activeWorkflows: 0 });

  // Define workflow templates with proper icons and categorization
  const workflowTemplates: WorkflowTemplate[] = [
    // Outbound workflows
    {
      id: 'leadDiscovery',
      name: 'Lead Discovery & Research',
      description: 'Find and research potential leads based on criteria',
      icon: Users,
      mode: 'outbound',
      color: 'from-blue-500 to-purple-600'
    },
    {
      id: 'campaignAutomation',
      name: 'Campaign Automation',
      description: 'Automated outbound campaign management',
      icon: Target,
      mode: 'outbound',
      color: 'from-purple-500 to-pink-600'
    },
    {
      id: 'linkedInOutreach',
      name: 'LinkedIn Outreach',
      description: 'Automated LinkedIn connection and messaging',
      icon: Globe,
      mode: 'outbound',
      color: 'from-blue-600 to-cyan-600'
    },
    
    // Inbound workflows
    {
      id: 'emailTriage',
      name: 'Email Triage & Classification',
      description: 'Classify and prioritize incoming emails',
      icon: Mail,
      mode: 'inbound',
      color: 'from-green-500 to-teal-600'
    },
    {
      id: 'autoResponse',
      name: 'Intelligent Auto-Response',
      description: 'Generate contextual automatic responses',
      icon: MessageSquare,
      mode: 'inbound',
      color: 'from-teal-500 to-cyan-600'
    },
    
    // Unified workflows
    {
      id: 'multiChannelSync',
      name: 'Multi-Channel Sync',
      description: 'Sync across email, LinkedIn, and CRM',
      icon: Database,
      mode: 'unified',
      color: 'from-purple-600 to-blue-600'
    },
    {
      id: 'aiProcessing',
      name: 'AI Content Processing',
      description: 'Process content with AI models',
      icon: Brain,
      mode: 'unified',
      color: 'from-pink-500 to-purple-600'
    }
  ];

  useEffect(() => {
    checkConnection();
    loadExecutionHistory();
  }, []);

  const checkConnection = async () => {
    setLoading(true);
    try {
      const health = await n8nService.checkWorkflowHealth();
      setWorkflowHealth(health);
      setIsConnected(health.connected);
    } catch (error) {
      console.error('Error checking n8n connection:', error);
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  };

  const loadExecutionHistory = async () => {
    try {
      const history = await n8nService.getExecutionHistory();
      setExecutions(history);
    } catch (error) {
      console.error('Error loading execution history:', error);
    }
  };

  const triggerWorkflow = async (workflowId: string) => {
    setLoading(true);
    try {
      const workflow = workflowTemplates.find(w => w.id === workflowId);
      if (!workflow) return;

      toast.info(`Starting ${workflow.name}...`);
      
      const execution = await n8nService.triggerWorkflow(workflowId as any, {
        mode: workflow.mode,
        data: {
          triggered_from: 'ui',
          timestamp: new Date().toISOString()
        }
      });

      if (execution.status === 'success') {
        toast.success(`${workflow.name} completed successfully!`);
      } else if (execution.status === 'error') {
        toast.error(`${workflow.name} failed: ${execution.error}`);
      }

      // Reload execution history
      await loadExecutionHistory();
    } catch (error: any) {
      toast.error(`Failed to trigger workflow: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredWorkflows = (mode: 'outbound' | 'inbound' | 'unified') => {
    return workflowTemplates.filter(w => w.mode === mode);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Workflow className="h-5 w-5" />
              <CardTitle>n8n Workflow Automation</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={isConnected ? "default" : "destructive"}>
                {isConnected ? "Connected" : "Disconnected"}
              </Badge>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={checkConnection}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
          <CardDescription>
            Manage and trigger automated workflows for SAM AI
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Status</div>
              <div className="flex items-center gap-2 mt-1">
                <Activity className={`h-4 w-4 ${isConnected ? 'text-green-500' : 'text-red-500'}`} />
                <span>{isConnected ? 'Online' : 'Offline'}</span>
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Active Workflows</div>
              <div className="mt-1 font-medium">{workflowHealth.activeWorkflows}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Last Execution</div>
              <div className="mt-1">
                {workflowHealth.lastExecution 
                  ? new Date(workflowHealth.lastExecution).toLocaleTimeString()
                  : 'Never'
                }
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Workflow Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Available Workflows</CardTitle>
          <CardDescription>
            Click to trigger workflows based on your current mode
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="outbound" className="flex items-center gap-2">
                <Send className="h-4 w-4" />
                Outbound
              </TabsTrigger>
              <TabsTrigger value="inbound" className="flex items-center gap-2">
                <Inbox className="h-4 w-4" />
                Inbound
              </TabsTrigger>
              <TabsTrigger value="unified" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Unified
              </TabsTrigger>
            </TabsList>

            <TabsContent value="outbound" className="space-y-3 mt-4">
              {getFilteredWorkflows('outbound').map((workflow) => (
                <WorkflowCard
                  key={workflow.id}
                  workflow={workflow}
                  onTrigger={() => triggerWorkflow(workflow.id)}
                  disabled={!isConnected || loading}
                />
              ))}
            </TabsContent>

            <TabsContent value="inbound" className="space-y-3 mt-4">
              {getFilteredWorkflows('inbound').map((workflow) => (
                <WorkflowCard
                  key={workflow.id}
                  workflow={workflow}
                  onTrigger={() => triggerWorkflow(workflow.id)}
                  disabled={!isConnected || loading}
                />
              ))}
            </TabsContent>

            <TabsContent value="unified" className="space-y-3 mt-4">
              {getFilteredWorkflows('unified').map((workflow) => (
                <WorkflowCard
                  key={workflow.id}
                  workflow={workflow}
                  onTrigger={() => triggerWorkflow(workflow.id)}
                  disabled={!isConnected || loading}
                />
              ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Execution History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Executions</CardTitle>
            <Button
              size="sm"
              variant="ghost"
              onClick={loadExecutionHistory}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            {executions.length > 0 ? (
              <div className="space-y-2">
                {executions.map((execution, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg border bg-gray-50 dark:bg-gray-900"
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(execution.status)}
                      <div>
                        <div className="font-medium text-sm">
                          {execution.workflowId}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(execution.startedAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <Badge variant={
                      execution.status === 'success' ? 'default' :
                      execution.status === 'error' ? 'destructive' :
                      'secondary'
                    }>
                      {execution.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                No executions yet
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

// Workflow Card Component
function WorkflowCard({ 
  workflow, 
  onTrigger, 
  disabled 
}: { 
  workflow: WorkflowTemplate; 
  onTrigger: () => void;
  disabled: boolean;
}) {
  const Icon = workflow.icon;
  
  return (
    <div className={`p-4 rounded-lg border bg-gradient-to-r ${workflow.color} bg-opacity-10`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-white/10">
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="font-medium text-white">{workflow.name}</div>
            <div className="text-sm text-gray-300">{workflow.description}</div>
          </div>
        </div>
        <Button
          size="sm"
          onClick={onTrigger}
          disabled={disabled}
          className="bg-white/20 hover:bg-white/30 text-white border-white/30"
        >
          <Play className="h-4 w-4 mr-1" />
          Run
        </Button>
      </div>
    </div>
  );
}

export default N8nWorkflowManager;