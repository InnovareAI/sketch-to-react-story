/**
 * Unipile Test Page
 * A comprehensive testing interface for Unipile API integration
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RefreshCw, CheckCircle, XCircle, Clock, Users, MessageSquare } from 'lucide-react';
import { testUnipileSync, quickSyncTest, manualSyncTest } from '@/utils/testUnipileSync';
import { unipileRealTimeSync } from '@/services/unipile/UnipileRealTimeSync';
import { toast } from 'sonner';

interface TestResult {
  success: boolean;
  message: string;
  details?: any;
  duration?: number;
}

export default function UnipileTestPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [quickTestResult, setQuickTestResult] = useState<boolean | null>(null);
  const [fullTestResults, setFullTestResults] = useState<any>(null);
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const [apiConnection, setApiConnection] = useState<any>(null);

  // Load initial sync status
  useEffect(() => {
    const status = unipileRealTimeSync.getStatus();
    setSyncStatus(status);
  }, []);

  const handleQuickTest = async () => {
    setIsRunning(true);
    toast.info('Running quick connectivity test...');
    
    try {
      const result = await quickSyncTest();
      setQuickTestResult(result);
      
      if (result) {
        toast.success('Quick test passed! API is connected.');
      } else {
        toast.error('Quick test failed. Check API configuration.');
      }
    } catch (error) {
      toast.error(`Quick test error: ${error.message}`);
      setQuickTestResult(false);
    } finally {
      setIsRunning(false);
    }
  };

  const handleFullTest = async () => {
    setIsRunning(true);
    toast.info('Running comprehensive sync test...');
    
    try {
      const results = await testUnipileSync();
      setFullTestResults(results);
      
      if (results.overall.success) {
        toast.success('All tests passed! Sync is working correctly.');
      } else {
        toast.warning('Some tests failed. Check results for details.');
      }
    } catch (error) {
      toast.error(`Test suite error: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleManualSync = async () => {
    setIsRunning(true);
    toast.info('Starting manual sync...');
    
    try {
      await manualSyncTest();
      
      // Refresh sync status
      const status = unipileRealTimeSync.getStatus();
      setSyncStatus(status);
      
      toast.success('Manual sync completed! Check status below.');
    } catch (error) {
      toast.error(`Manual sync error: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleTestConnection = async () => {
    setIsRunning(true);
    toast.info('Testing API connection...');
    
    try {
      const result = await unipileRealTimeSync.testConnection();
      setApiConnection(result);
      
      if (result.success) {
        toast.success(`API connection successful! Found ${result.accounts.length} accounts.`);
      } else {
        toast.error(`API connection failed: ${result.error}`);
      }
    } catch (error) {
      toast.error(`Connection test error: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const getResultIcon = (success: boolean | null) => {
    if (success === null) return <Clock className="h-4 w-4 text-gray-400" />;
    return success ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getResultBadge = (success: boolean | null) => {
    if (success === null) return <Badge variant="secondary">Not Run</Badge>;
    return success ? <Badge variant="default" className="bg-green-500">Passed</Badge> : <Badge variant="destructive">Failed</Badge>;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Unipile API Test Suite</h1>
          <p className="text-gray-600">Comprehensive testing for LinkedIn contact and message synchronization</p>
        </div>

        {/* Control Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Test Controls
            </CardTitle>
            <CardDescription>
              Run different types of tests to verify your Unipile integration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Button
                onClick={handleTestConnection}
                disabled={isRunning}
                variant="outline"
                className="w-full"
              >
                {isRunning ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : null}
                Test Connection
              </Button>
              
              <Button
                onClick={handleQuickTest}
                disabled={isRunning}
                variant="outline"
                className="w-full"
              >
                {isRunning ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : null}
                Quick Test
              </Button>
              
              <Button
                onClick={handleFullTest}
                disabled={isRunning}
                className="w-full"
              >
                {isRunning ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : null}
                Full Test Suite
              </Button>
              
              <Button
                onClick={handleManualSync}
                disabled={isRunning}
                variant="secondary"
                className="w-full"
              >
                {isRunning ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : null}
                Manual Sync
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* API Connection Status */}
        {apiConnection && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getResultIcon(apiConnection.success)}
                API Connection Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>Connection Status:</span>
                  {getResultBadge(apiConnection.success)}
                </div>
                
                <div>
                  <p className="text-sm text-gray-600">{apiConnection.success ? apiConnection.message : apiConnection.error}</p>
                </div>
                
                {apiConnection.accounts && apiConnection.accounts.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Connected Accounts ({apiConnection.accounts.length}):</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {apiConnection.accounts.map((account: any, index: number) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg">
                          <div className="font-medium">{account.name}</div>
                          <div className="text-sm text-gray-500">ID: {account.id}</div>
                          <div className="text-sm text-gray-500">Status: {account.status}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Test Results */}
        {quickTestResult !== null && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getResultIcon(quickTestResult)}
                Quick Test Result
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <span>API Connectivity:</span>
                {getResultBadge(quickTestResult)}
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {quickTestResult 
                  ? 'API is accessible and LinkedIn accounts are connected.' 
                  : 'API connection failed. Check your configuration.'}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Full Test Results */}
        {fullTestResults && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getResultIcon(fullTestResults.overall.success)}
                Comprehensive Test Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Overall Status */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Overall Status:</span>
                    {getResultBadge(fullTestResults.overall.success)}
                  </div>
                  <p className="text-sm text-gray-600">{fullTestResults.overall.message}</p>
                </div>

                <Separator />

                {/* Individual Test Results */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(fullTestResults).map(([testName, result]: [string, any]) => {
                    if (testName === 'overall') return null;
                    
                    return (
                      <div key={testName} className="p-3 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          {getResultIcon(result.success)}
                          <span className="font-medium capitalize">
                            {testName.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{result.message}</p>
                        {result.duration && (
                          <p className="text-xs text-gray-400">{result.duration}ms</p>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Details for Messages and Contacts */}
                {fullTestResults.messagesSync?.details && (
                  <div>
                    <h4 className="font-medium mb-2">Recent Conversations:</h4>
                    <div className="space-y-2">
                      {fullTestResults.messagesSync.details.slice(0, 5).map((conv: any, index: number) => (
                        <div key={index} className="p-2 bg-blue-50 rounded text-sm">
                          <div className="font-medium">{conv.participant_name}</div>
                          <div className="text-gray-500">Last message: {new Date(conv.last_message_at).toLocaleString()}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {fullTestResults.contactsSync?.details && (
                  <div>
                    <h4 className="font-medium mb-2">Synced Contacts:</h4>
                    <div className="space-y-2">
                      {fullTestResults.contactsSync.details.slice(0, 5).map((contact: any, index: number) => (
                        <div key={index} className="p-2 bg-green-50 rounded text-sm">
                          <div className="font-medium">{contact.full_name}</div>
                          <div className="text-gray-500">
                            {contact.connection_degree} • Score: {contact.engagement_score}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Current Sync Status */}
        {syncStatus && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Current Sync Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{syncStatus.contactsSynced || 0}</div>
                  <div className="text-sm text-gray-500">Contacts Synced</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{syncStatus.messagessynced || 0}</div>
                  <div className="text-sm text-gray-500">Messages Synced</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {syncStatus.isRunning ? 'Running' : 'Idle'}
                  </div>
                  <div className="text-sm text-gray-500">Sync Status</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{syncStatus.errors?.length || 0}</div>
                  <div className="text-sm text-gray-500">Errors</div>
                </div>
              </div>
              
              {syncStatus.lastSync && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm">
                    <strong>Last Sync:</strong> {new Date(syncStatus.lastSync).toLocaleString()}
                  </div>
                  {syncStatus.nextSync && (
                    <div className="text-sm">
                      <strong>Next Sync:</strong> {new Date(syncStatus.nextSync).toLocaleString()}
                    </div>
                  )}
                </div>
              )}

              {syncStatus.errors && syncStatus.errors.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Recent Errors:</h4>
                  <div className="space-y-1">
                    {syncStatus.errors.map((error: string, index: number) => (
                      <div key={index} className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                        {error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>How to Use This Test Suite</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <h4 className="font-medium">Test Connection</h4>
              <p className="text-sm text-gray-600">
                Verifies that the Unipile API is accessible and returns connected LinkedIn accounts.
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Quick Test</h4>
              <p className="text-sm text-gray-600">
                Fast connectivity check to ensure the API is responding and accounts are detected.
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Full Test Suite</h4>
              <p className="text-sm text-gray-600">
                Comprehensive test that checks API connectivity, runs a sync operation, and verifies data is correctly stored in the database.
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Manual Sync</h4>
              <p className="text-sm text-gray-600">
                Triggers a full sync operation and updates the sync status display.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}