/**
 * N8N Integration Status Component
 * Displays the status of N8N workflow integration and provides testing capabilities
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle, 
  XCircle, 
  Activity, 
  Zap, 
  Clock, 
  AlertTriangle,
  RefreshCw,
  Play,
  Settings,
  Database
} from 'lucide-react';
import { n8nIntegrationManager } from '@/services/n8n-integration-manager';
import type { N8nIntegrationStatus } from '@/services/n8n-integration-manager';

export function N8nIntegrationStatus() {
  const [status, setStatus] = useState<N8nIntegrationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [testingInProgress, setTestingInProgress] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    loadIntegrationStatus();
    loadIntegrationLogs();
  }, []);

  const loadIntegrationStatus = async () => {
    try {
      setLoading(true);
      const integrationStatus = await n8nIntegrationManager.getIntegrationStatus();
      setStatus(integrationStatus);
    } catch (error) {
      console.error('Failed to load integration status:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadIntegrationLogs = async () => {
    try {
      const integrationLogs = await n8nIntegrationManager.getIntegrationLogs(20);
      setLogs(integrationLogs);
    } catch (error) {
      console.error('Failed to load integration logs:', error);
    }
  };

  const runIntegrationTests = async () => {
    try {
      setTestingInProgress(true);
      const results = await n8nIntegrationManager.runIntegrationTests();
      setTestResults(results);
    } catch (error) {
      console.error('Integration tests failed:', error);
      setTestResults([{
        test_name: 'Integration Test',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        execution_time: 0
      }]);
    } finally {
      setTestingInProgress(false);
    }
  };

  const testWorkflowTrigger = async (mode: 'inbound' | 'outbound' | 'unified', stage: string) => {
    try {
      const result = await n8nIntegrationManager.triggerWorkflow(
        mode,
        stage,
        {
          test_message: `Test trigger from admin panel - ${mode}/${stage}`,
          timestamp: new Date().toISOString()
        },
        {
          triggerType: 'manual',
          source: 'admin_panel_test'
        }
      );
      
      alert(`Workflow triggered successfully! Execution ID: ${result.executionId || 'N/A'}`);
      loadIntegrationStatus(); // Refresh status
    } catch (error) {
      alert(`Workflow trigger failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          Loading N8N integration status...
        </CardContent>
      </Card>
    );
  }

  if (!status) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Failed to load N8N integration status. Please check your configuration.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = () => {
    if (status.connected && status.samWorkflowActive) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    } else if (status.connected) {
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    } else {
      return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getStatusText = () => {
    if (status.connected && status.samWorkflowActive) {
      return 'Fully Connected';
    } else if (status.connected) {
      return 'Connected (Workflow Inactive)';
    } else {
      return 'Disconnected';
    }
  };

  const successRate = status.executionCount > 0 
    ? ((status.executionCount - status.errorCount) / status.executionCount) * 100 
    : 0;

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon()}
            N8N Workflow Integration Status
            <Badge variant={status.connected ? 'default' : 'destructive'}>
              {getStatusText()}
            </Badge>
          </CardTitle>
          <CardDescription>
            Real-time status of N8N workflow automation integration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Total Executions</p>
                <p className="text-2xl font-bold">{status.executionCount}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Zap className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm font-medium">Success Rate</p>
                <p className="text-2xl font-bold">{successRate.toFixed(1)}%</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-sm font-medium">Last Execution</p>
                <p className="text-sm text-muted-foreground">
                  {status.lastExecution 
                    ? new Date(status.lastExecution).toLocaleString()
                    : 'Never'
                  }
                </p>
              </div>
            </div>
          </div>
          
          {status.executionCount > 0 && (
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Success Rate</span>
                <span>{successRate.toFixed(1)}%</span>
              </div>
              <Progress value={successRate} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configuration Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium">N8N Instance URL</p>
              <p className="text-muted-foreground">{status.configuration.n8nUrl}</p>
            </div>
            <div>
              <p className="font-medium">API Key Configured</p>
              <Badge variant={status.configuration.hasApiKey ? 'default' : 'destructive'}>
                {status.configuration.hasApiKey ? 'Yes' : 'No'}
              </Badge>
            </div>
            <div>
              <p className="font-medium">SAM Workflow ID</p>
              <p className="text-muted-foreground font-mono text-xs">
                {status.configuration.workflowId}
              </p>
            </div>
            <div>
              <p className="font-medium">Webhook URL</p>
              <p className="text-muted-foreground font-mono text-xs">
                {status.webhookUrl}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Testing and Logs */}
      <Tabs defaultValue="testing" className="w-full">
        <TabsList>
          <TabsTrigger value="testing">Testing</TabsTrigger>
          <TabsTrigger value="logs">Integration Logs</TabsTrigger>
        </TabsList>
        
        <TabsContent value="testing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Integration Testing</CardTitle>
              <CardDescription>
                Test N8N workflow triggers and integration functionality
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                <Button 
                  onClick={runIntegrationTests}
                  disabled={testingInProgress}
                  className="flex items-center gap-2"
                >
                  <Play className="h-4 w-4" />
                  {testingInProgress ? 'Running Tests...' : 'Run Full Test Suite'}
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => testWorkflowTrigger('unified', 'ai_processing')}
                >
                  Test AI Processing
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => testWorkflowTrigger('outbound', 'linkedin')}
                >
                  Test LinkedIn Outbound
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => testWorkflowTrigger('inbound', 'triage')}
                >
                  Test Inbound Triage
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={loadIntegrationStatus}
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh Status
                </Button>
              </div>

              {testResults.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Test Results</h4>
                  <div className="space-y-2">
                    {testResults.map((result, index) => (
                      <div 
                        key={index}
                        className={`p-3 rounded border ${
                          result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {result.success ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                          <span className="font-medium">{result.test_name}</span>
                          <span className="text-sm text-muted-foreground">
                            ({result.execution_time}ms)
                          </span>
                        </div>
                        {result.error && (
                          <p className="text-sm text-red-600 mt-1">{result.error}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Integration Logs
              </CardTitle>
              <CardDescription>
                Recent N8N integration activity and events
              </CardDescription>
            </CardHeader>
            <CardContent>
              {logs.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No integration logs available yet
                </p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {logs.map((log, index) => (
                    <div 
                      key={index}
                      className={`p-3 rounded border text-sm ${
                        log.log_level === 'error' ? 'border-red-200 bg-red-50' :
                        log.log_level === 'warn' ? 'border-yellow-200 bg-yellow-50' :
                        'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{log.event_type}</p>
                          <p className="text-muted-foreground">{log.message}</p>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(log.created_at).toLocaleString()}
                        </div>
                      </div>
                      {log.context_data && Object.keys(log.context_data).length > 0 && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-xs text-muted-foreground">
                            View Details
                          </summary>
                          <pre className="text-xs mt-1 p-2 bg-white rounded border">
                            {JSON.stringify(log.context_data, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}