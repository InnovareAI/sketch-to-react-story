import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { usePreviewSync } from '@/hooks/usePreviewSync';
import { 
  Database, 
  HardDrive, 
  RefreshCw, 
  Eye, 
  FileText,
  Clock,
  AlertCircle
} from 'lucide-react';

export default function PreviewSyncStatus() {
  const { syncStats, isSyncing, performPreviewSync } = usePreviewSync();
  
  const formatTime = (date: Date | null) => {
    if (!date) return 'Never';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minutes ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  const storagePercentage = (syncStats.storageUsedMB / 500) * 100; // 500MB free tier limit

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Preview Sync Status
            </CardTitle>
            <CardDescription>
              Efficient sync with preview mode for older messages
            </CardDescription>
          </div>
          <Button 
            onClick={performPreviewSync}
            disabled={isSyncing}
            size="sm"
          >
            {isSyncing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Sync Now
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Sync Statistics */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-4 w-4 text-green-600" />
              <span className="text-xs text-green-700 font-medium">Full Sync</span>
            </div>
            <div className="text-2xl font-bold text-green-800">
              {syncStats.fullSyncCount}
            </div>
            <p className="text-xs text-green-600">Recent conversations</p>
          </div>
          
          <div className="bg-amber-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Eye className="h-4 w-4 text-amber-600" />
              <span className="text-xs text-amber-700 font-medium">Preview Only</span>
            </div>
            <div className="text-2xl font-bold text-amber-800">
              {syncStats.previewOnlyCount}
            </div>
            <p className="text-xs text-amber-600">Older conversations</p>
          </div>
          
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Database className="h-4 w-4 text-blue-600" />
              <span className="text-xs text-blue-700 font-medium">Total</span>
            </div>
            <div className="text-2xl font-bold text-blue-800">
              {syncStats.totalConversations}
            </div>
            <p className="text-xs text-blue-600">All conversations</p>
          </div>
        </div>

        {/* Storage Usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1">
              <HardDrive className="h-4 w-4 text-gray-600" />
              Storage Used
            </span>
            <span className="font-medium">
              {syncStats.storageUsedMB.toFixed(1)} MB / 500 MB
            </span>
          </div>
          <Progress value={storagePercentage} className="h-2" />
          <p className="text-xs text-gray-500">
            {(100 - storagePercentage).toFixed(1)}% of free tier remaining
          </p>
        </div>

        {/* Last Sync Time */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <span className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-gray-600" />
            Last Sync
          </span>
          <Badge variant="outline">
            {formatTime(syncStats.lastSyncTime)}
          </Badge>
        </div>

        {/* Info Alert */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
            <div className="text-xs text-blue-800">
              <p className="font-medium mb-1">How Preview Sync Works:</p>
              <ul className="space-y-0.5 ml-2">
                <li>• First 500 conversations: Full message history</li>
                <li>• Next 2000 conversations: Preview only (last message)</li>
                <li>• Click "Load Full Conversation" on any preview to fetch all messages</li>
                <li>• Saves ~90% storage compared to full sync</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}