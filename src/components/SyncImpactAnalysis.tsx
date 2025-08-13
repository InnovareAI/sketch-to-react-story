import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Database, HardDrive, Activity, DollarSign, Clock, AlertTriangle } from 'lucide-react';

export default function SyncImpactAnalysis() {
  // Calculate Supabase impacts
  const SYNC_METRICS = {
    conversations: 500,
    messagesPerConversation: 20,
    totalMessages: 500 * 20, // 10,000 messages
    avgMessageSize: 500, // bytes
    avgConversationSize: 2000, // bytes
    updateFrequency: '5 minutes (whisper), 60 minutes (full)'
  };

  const SUPABASE_IMPACTS = {
    // Database storage
    storageUsed: {
      conversations: (SYNC_METRICS.conversations * SYNC_METRICS.avgConversationSize / 1024 / 1024).toFixed(2), // MB
      messages: (SYNC_METRICS.totalMessages * SYNC_METRICS.avgMessageSize / 1024 / 1024).toFixed(2), // MB
      total: ((SYNC_METRICS.conversations * SYNC_METRICS.avgConversationSize + 
               SYNC_METRICS.totalMessages * SYNC_METRICS.avgMessageSize) / 1024 / 1024).toFixed(2) // MB
    },
    
    // API calls per sync
    apiCalls: {
      perFullSync: SYNC_METRICS.conversations + 100, // Conversations + checks
      perWhisperSync: 50, // Only check recent
      dailyEstimate: (24 * 12 * 50) + (24 * 1 * 600), // Whisper every 5min + full hourly
      monthlyEstimate: 30 * ((24 * 12 * 50) + (24 * 1 * 600))
    },
    
    // Bandwidth
    bandwidth: {
      perFullSync: ((SYNC_METRICS.conversations * 5000 + SYNC_METRICS.totalMessages * 1000) / 1024 / 1024).toFixed(2), // MB
      perWhisperSync: (50 * 5000 / 1024 / 1024).toFixed(2), // MB
      dailyEstimate: ((24 * 12 * 50 * 5000 + 24 * 1 * SYNC_METRICS.conversations * 5000) / 1024 / 1024).toFixed(2), // MB
    },
    
    // Cost estimates (Supabase free tier)
    costEstimates: {
      storage: 'Free (< 500MB)',
      apiCalls: 'Free (< 2M/month)',
      bandwidth: 'Free (< 5GB/month)',
      database: 'Free (< 500MB)',
      totalMonthly: '$0'
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Sync Configuration & Impact
          </CardTitle>
          <CardDescription>
            Understanding your LinkedIn sync's impact on Supabase resources
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Configuration */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Sync Limits</h3>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Recent Conversations:</span>
                  <Badge variant="outline">{SYNC_METRICS.conversations}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Messages per Thread:</span>
                  <Badge variant="outline">{SYNC_METRICS.messagesPerConversation}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Messages:</span>
                  <Badge variant="outline">~{SYNC_METRICS.totalMessages.toLocaleString()}</Badge>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Sync Schedule</h3>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Initial Sync:</span>
                  <Badge variant="outline">All 500 threads</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Whisper Sync:</span>
                  <Badge variant="outline">Every 5 min</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Full Refresh:</span>
                  <Badge variant="outline">Every 60 min</Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Storage Impact */}
          <div className="border-t pt-4">
            <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <HardDrive className="h-4 w-4" />
              Database Storage Impact
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-2xl font-bold">{SUPABASE_IMPACTS.storageUsed.conversations} MB</div>
                <div className="text-xs text-gray-600">Conversations</div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-2xl font-bold">{SUPABASE_IMPACTS.storageUsed.messages} MB</div>
                <div className="text-xs text-gray-600">Messages</div>
              </div>
              <div className="bg-green-50 p-3 rounded">
                <div className="text-2xl font-bold text-green-700">{SUPABASE_IMPACTS.storageUsed.total} MB</div>
                <div className="text-xs text-gray-600">Total Storage</div>
              </div>
            </div>
          </div>

          {/* API Calls Impact */}
          <div className="border-t pt-4">
            <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <Activity className="h-4 w-4" />
              API Calls & Bandwidth
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-xl font-bold">{SUPABASE_IMPACTS.apiCalls.dailyEstimate.toLocaleString()}</div>
                <div className="text-xs text-gray-600">Daily API Calls</div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-xl font-bold">{SUPABASE_IMPACTS.bandwidth.dailyEstimate} MB</div>
                <div className="text-xs text-gray-600">Daily Bandwidth</div>
              </div>
              <div className="bg-blue-50 p-3 rounded">
                <div className="text-xl font-bold text-blue-700">{SUPABASE_IMPACTS.bandwidth.perFullSync} MB</div>
                <div className="text-xs text-gray-600">Per Full Sync</div>
              </div>
            </div>
          </div>

          {/* Cost Analysis */}
          <div className="border-t pt-4">
            <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Supabase Cost Impact
            </h3>
            <Alert className="bg-green-50 border-green-200">
              <AlertDescription>
                <div className="space-y-1">
                  <div className="font-semibold text-green-800">✅ Within Free Tier Limits</div>
                  <div className="text-sm text-green-700">
                    • Storage: {SUPABASE_IMPACTS.storageUsed.total} MB of 500 MB free
                  </div>
                  <div className="text-sm text-green-700">
                    • API Calls: ~{(SUPABASE_IMPACTS.apiCalls.monthlyEstimate / 1000000).toFixed(2)}M of 2M free/month
                  </div>
                  <div className="text-sm text-green-700">
                    • Bandwidth: ~{(parseFloat(SUPABASE_IMPACTS.bandwidth.dailyEstimate) * 30 / 1024).toFixed(2)} GB of 5 GB free/month
                  </div>
                  <div className="text-sm font-semibold text-green-800 mt-2">
                    Estimated Monthly Cost: {SUPABASE_IMPACTS.costEstimates.totalMonthly}
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          </div>

          {/* Optimization Tips */}
          <div className="border-t pt-4">
            <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Optimization Recommendations
            </h3>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <Badge variant="outline" className="mt-0.5">1</Badge>
                <div className="text-sm">
                  <strong>Current Setting:</strong> 500 conversations with 20 messages each is optimal for most users
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Badge variant="outline" className="mt-0.5">2</Badge>
                <div className="text-sm">
                  <strong>Whisper Sync:</strong> Checks only recent 20 conversations every 5 minutes for minimal impact
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Badge variant="outline" className="mt-0.5">3</Badge>
                <div className="text-sm">
                  <strong>Incremental Updates:</strong> Only new/changed messages are synced, not entire conversations
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Badge variant="outline" className="mt-0.5">4</Badge>
                <div className="text-sm">
                  <strong>Scale Estimate:</strong> Can support ~100 users on free tier, ~1000 on Pro ($25/mo)
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}