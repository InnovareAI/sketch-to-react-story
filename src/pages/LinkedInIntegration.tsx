import React, { useState } from 'react';
import { BrightDataIntegration } from '@/components/linkedin/BrightDataIntegration';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Linkedin, 
  Database, 
  MessageSquare, 
  Activity,
  Settings,
  Home,
  Shield,
  CheckCircle,
  AlertCircle,
  ExternalLink
} from 'lucide-react';

export default function LinkedInIntegrationPage() {
  const [activeTab, setActiveTab] = useState('scraping');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Linkedin className="w-8 h-8 text-blue-600" />
            LinkedIn Data Collection Platform
          </h1>
          <p className="text-gray-600 mt-2">
            Professional LinkedIn scraping with Bright Data residential proxies for maximum authenticity
          </p>
        </div>

        {/* Setup Status Alert */}
        <Alert className="mb-6 border-blue-200 bg-blue-50">
          <Shield className="w-4 h-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <div className="flex items-center justify-between">
              <span>
                <strong>Bright Data Residential Network:</strong> Install certificate for premium residential IPs
              </span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open('https://brightdata.com/cp/api_cert', '_blank')}
                className="ml-4"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Get Certificate
              </Button>
            </div>
          </AlertDescription>
        </Alert>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="scraping" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              Data Scraping
            </TabsTrigger>
            <TabsTrigger value="automation" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Automation
            </TabsTrigger>
            <TabsTrigger value="monitoring" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Monitoring
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Data Scraping Tab */}
          <TabsContent value="scraping" className="space-y-6">
            <div className="bg-white rounded-lg border p-6">
              <BrightDataIntegration />
            </div>
          </TabsContent>

          {/* Automation Tab */}
          <TabsContent value="automation" className="space-y-6">
            <div className="bg-white rounded-lg border p-6">
              <div className="text-center py-12">
                <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  LinkedIn Automation
                </h3>
                <p className="text-gray-600 mb-6">
                  Connect LinkedIn accounts via Unipile for messaging automation and outreach campaigns.
                </p>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Coming Soon
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Monitoring Tab */}
          <TabsContent value="monitoring" className="space-y-6">
            <div className="bg-white rounded-lg border p-6">
              <div className="text-center py-12">
                <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Performance Monitoring
                </h3>
                <p className="text-gray-600 mb-6">
                  Real-time monitoring of scraping jobs, proxy health, and data quality metrics.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <h4 className="font-medium text-green-900">Proxy Health</h4>
                    <p className="text-sm text-green-700">99.8% uptime</p>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <Database className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <h4 className="font-medium text-blue-900">Data Quality</h4>
                    <p className="text-sm text-blue-700">95% accuracy</p>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <Home className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                    <h4 className="font-medium text-purple-900">Residential IPs</h4>
                    <p className="text-sm text-purple-700">Active in 15 countries</p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div className="bg-white rounded-lg border p-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Platform Configuration
                  </h3>
                </div>

                {/* Bright Data Configuration */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <Home className="w-4 h-4 text-orange-600" />
                    Bright Data Residential Network
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div>
                        <p className="text-sm font-medium">Customer ID</p>
                        <p className="text-xs text-gray-600">hl_8aca120e</p>
                      </div>
                      <Badge variant="outline" className="bg-green-100 text-green-800">
                        Active
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div>
                        <p className="text-sm font-medium">Proxy Endpoint</p>
                        <p className="text-xs text-gray-600">brd.superproxy.io:22225</p>
                      </div>
                      <Badge variant="outline" className="bg-blue-100 text-blue-800">
                        Residential
                      </Badge>
                    </div>
                    <Alert className="border-orange-200 bg-orange-50">
                      <AlertCircle className="w-4 h-4 text-orange-600" />
                      <AlertDescription className="text-orange-800">
                        <div>
                          <p className="font-medium">Certificate Required</p>
                          <p className="text-sm mt-1">
                            Download and install the Bright Data certificate to access residential network.
                          </p>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="mt-2"
                            onClick={() => window.open('https://brightdata.com/cp/api_cert', '_blank')}
                          >
                            <ExternalLink className="w-3 h-3 mr-1" />
                            Download Certificate
                          </Button>
                        </div>
                      </AlertDescription>
                    </Alert>
                  </div>
                </div>

                {/* Location Intelligence */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-green-600" />
                    Smart Location Matching
                  </h4>
                  <div className="text-sm text-gray-600 space-y-2">
                    <p>• Automatically assigns proxy locations based on LinkedIn profile locations</p>
                    <p>• New York profiles → US-NY residential IPs</p>
                    <p>• London profiles → UK residential IPs</p>
                    <p>• Maximum authenticity and reduced detection risk</p>
                  </div>
                </div>

                {/* Environment Variables */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Environment Configuration</h4>
                  <div className="text-sm text-gray-600 space-y-2">
                    <p><code className="bg-gray-100 px-2 py-1 rounded">VITE_BRIGHT_DATA_PREFERRED_ZONE=residential</code></p>
                    <p><code className="bg-gray-100 px-2 py-1 rounded">VITE_BRIGHT_DATA_PASSWORD=[required]</code></p>
                    <p className="text-xs text-gray-500 mt-2">
                      Get your password from the Bright Data dashboard
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}