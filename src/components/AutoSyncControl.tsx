import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Clock, CheckCircle, AlertCircle, RefreshCw, Zap, Mail, Calendar, Users } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { backgroundSyncManager } from '@/services/BackgroundSyncManager';
import { emailCalendarSync } from '@/services/unipile/EmailCalendarSync';
import { workspaceUnipile } from '@/services/WorkspaceUnipileService';

interface AutoSyncControlProps {
  workspaceId: string;
  accountId?: string; // Make optional since we'll load it from WorkspaceUnipileService
}

export function AutoSyncControl({ workspaceId, accountId: propAccountId }: AutoSyncControlProps) {
  const [isEnabled, setIsEnabled] = useState(false);
  const [interval, setInterval] = useState(30);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [nextSync, setNextSync] = useState<Date | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [accountId, setAccountId] = useState<string>(''); // Load from workspace service
  const [linkedInConnected, setLinkedInConnected] = useState(false);
  const [syncOptions, setSyncOptions] = useState({
    contacts: true,
    messages: true,
    emails: false,
    calendar: false
  });

  // Initialize workspace service and check sync status
  useEffect(() => {
    initializeWorkspaceService();
  }, [workspaceId]);

  // Check sync status when accountId changes
  useEffect(() => {
    if (accountId) {
      checkSyncStatus();
      const interval = setInterval(checkSyncStatus, 60000); // Check every minute
      return () => clearInterval(interval);
    }
  }, [workspaceId, accountId]);

  const initializeWorkspaceService = async () => {
    try {
      const config = await workspaceUnipile.initialize(workspaceId);
      setAccountId(config.account_id);
      setLinkedInConnected(config.linkedin_connected);
    } catch (error) {
      console.error('Error initializing workspace service:', error);
      setLinkedInConnected(false);
    }
  };

  const checkSyncStatus = async () => {
    try {
      const status = await backgroundSyncManager.getSyncStatus(workspaceId, accountId);
      setIsEnabled(status.isEnabled);
      setInterval(status.intervalMinutes);
      if (status.lastSyncAt) setLastSync(new Date(status.lastSyncAt));
      if (status.nextSyncAt) setNextSync(new Date(status.nextSyncAt));
    } catch (error) {
      console.error('Error checking sync status:', error);
    }
  };

  const handleToggleSync = async () => {
    setIsLoading(true);
    try {
      if (!isEnabled) {
        // Enable sync
        const result = await backgroundSyncManager.enableSync(workspaceId, accountId, interval);
        if (result.success) {
          setIsEnabled(true);
          toast.success('🚀 Auto-sync enabled! Contacts will sync every ' + interval + ' minutes');
          
          // Trigger immediate sync
          setSyncStatus('syncing');
          await backgroundSyncManager.triggerManualSync(workspaceId, accountId);
          setSyncStatus('success');
          setLastSync(new Date());
          setNextSync(new Date(Date.now() + interval * 60000));
        }
      } else {
        // Disable sync
        await backgroundSyncManager.disableSync(workspaceId, accountId);
        setIsEnabled(false);
        toast.info('Auto-sync disabled');
        setNextSync(null);
      }
    } catch (error) {
      console.error('Error toggling sync:', error);
      toast.error('Failed to update sync settings');
      setSyncStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleIntervalChange = async (newInterval: string) => {
    const intervalNum = parseInt(newInterval);
    setInterval(intervalNum);
    
    if (isEnabled) {
      setIsLoading(true);
      try {
        await backgroundSyncManager.updateSyncInterval(workspaceId, accountId, intervalNum);
        toast.success('Sync interval updated to ' + intervalNum + ' minutes');
        setNextSync(new Date(Date.now() + intervalNum * 60000));
      } catch (error) {
        console.error('Error updating interval:', error);
        toast.error('Failed to update sync interval');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleManualSync = async () => {
    if (!accountId) {
      toast.error('No account ID available. Please check workspace configuration.');
      return;
    }

    setSyncStatus('syncing');
    toast.info('Starting sync with Unipile LinkedIn API...');
    try {
      // Use centralized workspace service with proper account ID
      const config = await workspaceUnipile.getConfig();
      
      // Sync LinkedIn data via centralized service
      if (syncOptions.contacts || syncOptions.messages) {
        if (!linkedInConnected || !config.linkedin_connected) {
          toast.warning('LinkedIn not connected. Please complete onboarding to sync contacts.');
          setSyncStatus('error');
          return;
        }
        
        // Sync contacts using workspace's Unipile account (enhanced)
        const result = await workspaceUnipile.syncContacts(200);
        
        if (result.contactsSynced > 0) {
          // Show comprehensive sync results
          const details = [];
          if (result.firstDegree > 0) details.push(`${result.firstDegree} 1st degree`);
          if (result.secondDegree > 0) details.push(`${result.secondDegree} 2nd degree`);
          if (result.thirdDegree > 0) details.push(`${result.thirdDegree} 3rd degree`);
          
          const detailText = details.length > 0 ? ` (${details.join(', ')})` : '';
          
          toast.success(`🎉 Synced ${result.contactsSynced} LinkedIn contacts${detailText}!`);
          
          // Show additional stats if significant numbers
          if (result.totalFound > result.contactsSynced) {
            toast.info(`Found ${result.totalFound} total contacts, ${result.withJobTitles} with job titles`);
          }
        } else {
          // Fallback to background sync with correct account ID
          const syncResult = await backgroundSyncManager.triggerManualSync(workspaceId, accountId);
          if (!syncResult.success) {
            throw new Error('LinkedIn sync failed');
          }
        }
      }
      
      // Sync Email and Calendar (use the correct account ID)
      if (syncOptions.emails || syncOptions.calendar) {
        const emailCalResult = await emailCalendarSync.syncAll(accountId, workspaceId, {
          syncEmails: syncOptions.emails,
          syncCalendar: syncOptions.calendar,
          emailLimit: 50,
          calendarLimit: 50
        });
        
        if (emailCalResult.errors.length > 0) {
          console.warn('Some items failed to sync:', emailCalResult.errors);
        }
        
        const message = [];
        if (emailCalResult.emailsSynced > 0) message.push(`${emailCalResult.emailsSynced} emails`);
        if (emailCalResult.eventsSynced > 0) message.push(`${emailCalResult.eventsSynced} events`);
        
        if (message.length > 0) {
          toast.success(`Synced: ${message.join(', ')}`);
        }
      }
      
      setSyncStatus('success');
      toast.success('Manual sync completed successfully!');
      setLastSync(new Date());
      if (isEnabled) {
        setNextSync(new Date(Date.now() + interval * 60000));
      }
    } catch (error) {
      console.error('Error during manual sync:', error);
      setSyncStatus('error');
      toast.error('Sync failed. Please try again.');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Background Auto-Sync
        </CardTitle>
        <CardDescription>
          Automatically sync LinkedIn, Email, and Calendar data even when you're not on the page
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="auto-sync">Enable Auto-Sync</Label>
            <p className="text-sm text-muted-foreground">
              Runs in the background on our servers
            </p>
          </div>
          <Switch
            id="auto-sync"
            checked={isEnabled}
            onCheckedChange={handleToggleSync}
            disabled={isLoading}
          />
        </div>

        {/* Sync Options */}
        <div className="space-y-2">
          <Label>Sync Options</Label>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="sync-contacts"
                checked={syncOptions.contacts}
                onCheckedChange={(checked) => 
                  setSyncOptions(prev => ({ ...prev, contacts: checked as boolean }))
                }
              />
              <label 
                htmlFor="sync-contacts" 
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-1"
              >
                <Users className="h-3 w-3" />
                LinkedIn Contacts
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="sync-messages"
                checked={syncOptions.messages}
                onCheckedChange={(checked) => 
                  setSyncOptions(prev => ({ ...prev, messages: checked as boolean }))
                }
              />
              <label 
                htmlFor="sync-messages" 
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-1"
              >
                <Users className="h-3 w-3" />
                LinkedIn Messages
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="sync-emails"
                checked={syncOptions.emails}
                onCheckedChange={(checked) => 
                  setSyncOptions(prev => ({ ...prev, emails: checked as boolean }))
                }
              />
              <label 
                htmlFor="sync-emails" 
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-1"
              >
                <Mail className="h-3 w-3" />
                Emails
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="sync-calendar"
                checked={syncOptions.calendar}
                onCheckedChange={(checked) => 
                  setSyncOptions(prev => ({ ...prev, calendar: checked as boolean }))
                }
              />
              <label 
                htmlFor="sync-calendar" 
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-1"
              >
                <Calendar className="h-3 w-3" />
                Calendar
              </label>
            </div>
          </div>
        </div>

        {/* Sync Interval */}
        <div className="space-y-2">
          <Label htmlFor="sync-interval">Sync Interval</Label>
          <Select
            value={interval.toString()}
            onValueChange={handleIntervalChange}
            disabled={!isEnabled || isLoading}
          >
            <SelectTrigger id="sync-interval">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">Every 5 minutes</SelectItem>
              <SelectItem value="15">Every 15 minutes</SelectItem>
              <SelectItem value="30">Every 30 minutes</SelectItem>
              <SelectItem value="60">Every hour</SelectItem>
              <SelectItem value="120">Every 2 hours</SelectItem>
              <SelectItem value="360">Every 6 hours</SelectItem>
              <SelectItem value="720">Every 12 hours</SelectItem>
              <SelectItem value="1440">Daily</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sync Status */}
        <div className="space-y-3 pt-2 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Status</span>
            <div className="flex items-center gap-2">
              {syncStatus === 'syncing' && (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <Badge variant="secondary">Syncing...</Badge>
                </>
              )}
              {syncStatus === 'success' && (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <Badge variant="default" className="bg-green-500">Success</Badge>
                </>
              )}
              {syncStatus === 'error' && (
                <>
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <Badge variant="destructive">Error</Badge>
                </>
              )}
              {syncStatus === 'idle' && isEnabled && (
                <>
                  <Clock className="h-4 w-4" />
                  <Badge variant="outline">Scheduled</Badge>
                </>
              )}
              {syncStatus === 'idle' && !isEnabled && (
                <Badge variant="secondary">Disabled</Badge>
              )}
            </div>
          </div>

          {lastSync && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Last Sync</span>
              <span>{lastSync.toLocaleString()}</span>
            </div>
          )}

          {nextSync && isEnabled && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Next Sync</span>
              <span className="text-green-600 font-medium">
                {nextSync.toLocaleTimeString()}
              </span>
            </div>
          )}
        </div>

        {/* Manual Sync Button */}
        <Button
          onClick={handleManualSync}
          disabled={syncStatus === 'syncing'}
          variant="outline"
          className="w-full"
        >
          {syncStatus === 'syncing' ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Syncing...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Sync Now
            </>
          )}
        </Button>

        {/* Info Alert */}
        {isEnabled && (
          <div className="rounded-lg border bg-muted/50 p-3">
            <p className="text-sm text-muted-foreground">
              ✅ Auto-sync is running on our servers. You can close this page and syncing will continue every {interval} minutes.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}