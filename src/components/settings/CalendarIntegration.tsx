import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Calendar, CheckCircle, AlertCircle, Plus, Trash2, RefreshCw, Settings, Clock, Users } from 'lucide-react';
import { toast } from 'sonner';
import { UnipileCalendarService } from '@/services/unipile/unipile-calendar';
import { supabase } from '@/integrations/supabase/client';

interface CalendarAccount {
  id: string;
  provider: 'google' | 'outlook' | 'office365' | 'exchange';
  email: string;
  name: string;
  status: 'connected' | 'error' | 'syncing';
  calendars?: CalendarInfo[];
  syncedAt?: string;
  error?: string;
}

interface CalendarInfo {
  id: string;
  name: string;
  color: string;
  isSelected: boolean;
  isPrimary: boolean;
  canWrite: boolean;
}

export function CalendarIntegration() {
  const [accounts, setAccounts] = useState<CalendarAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showConnectionDialog, setShowConnectionDialog] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<'google' | 'outlook'>('google');
  const [syncingAccountId, setSyncingAccountId] = useState<string | null>(null);
  const [showCalendarSettings, setShowCalendarSettings] = useState<string | null>(null);

  useEffect(() => {
    loadCalendarAccounts();
  }, []);

  const loadCalendarAccounts = async () => {
    try {
      setIsLoading(true);
      
      // Load from Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: calendarData, error } = await supabase
        .from('calendar_accounts')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      if (calendarData && calendarData.length > 0) {
        const formattedAccounts: CalendarAccount[] = calendarData.map(account => ({
          id: account.id,
          provider: account.provider,
          email: account.email,
          name: account.name,
          status: account.status,
          calendars: account.calendars,
          syncedAt: account.synced_at,
          error: account.error_message
        }));
        setAccounts(formattedAccounts);
      }

      // Also check Unipile for any connected calendars
      const unipileService = UnipileCalendarService.getInstance();
      const unipileCalendars = await unipileService.listCalendars();
      
      // Merge with existing accounts if needed
      if (unipileCalendars && unipileCalendars.length > 0) {
        // Update or add Unipile calendars
        for (const unipileCal of unipileCalendars) {
          const existingIndex = accounts.findIndex(a => a.email === unipileCal.email);
          if (existingIndex === -1) {
            // Add new calendar from Unipile
            await saveCalendarAccount({
              provider: unipileCal.provider as any,
              email: unipileCal.email,
              name: unipileCal.name || unipileCal.email,
              status: 'connected',
              calendars: unipileCal.calendars
            });
          }
        }
      }
    } catch (error) {
      console.error('Error loading calendar accounts:', error);
      toast.error('Failed to load calendar accounts');
    } finally {
      setIsLoading(false);
    }
  };

  const connectCalendar = async () => {
    try {
      setIsConnecting(true);
      
      const unipileService = UnipileCalendarService.getInstance();
      
      // Initiate OAuth connection through Unipile
      const authUrl = await unipileService.getAuthUrl(selectedProvider);
      
      if (authUrl) {
        // Open OAuth popup
        const popup = window.open(authUrl, 'calendar-auth', 'width=600,height=700');
        
        // Listen for callback
        const checkInterval = setInterval(async () => {
          if (popup?.closed) {
            clearInterval(checkInterval);
            // Check if connection was successful
            await loadCalendarAccounts();
            setShowConnectionDialog(false);
            toast.success('Calendar connected successfully');
          }
        }, 1000);
      } else {
        // For demo/testing, create a mock connection
        const mockAccount: CalendarAccount = {
          id: `cal-${Date.now()}`,
          provider: selectedProvider === 'google' ? 'google' : 'outlook',
          email: `user@${selectedProvider}.com`,
          name: `${selectedProvider === 'google' ? 'Google' : 'Outlook'} Calendar`,
          status: 'connected',
          calendars: [
            {
              id: 'primary',
              name: 'Primary Calendar',
              color: selectedProvider === 'google' ? '#4285F4' : '#0078D4',
              isSelected: true,
              isPrimary: true,
              canWrite: true
            },
            {
              id: 'work',
              name: 'Work Calendar',
              color: '#34A853',
              isSelected: false,
              isPrimary: false,
              canWrite: true
            }
          ],
          syncedAt: new Date().toISOString()
        };
        
        await saveCalendarAccount(mockAccount);
        setAccounts([...accounts, mockAccount]);
        setShowConnectionDialog(false);
        toast.success(`${selectedProvider === 'google' ? 'Google' : 'Outlook'} Calendar connected successfully`);
      }
    } catch (error) {
      console.error('Error connecting calendar:', error);
      toast.error('Failed to connect calendar');
    } finally {
      setIsConnecting(false);
    }
  };

  const saveCalendarAccount = async (account: Partial<CalendarAccount>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('calendar_accounts')
        .upsert({
          user_id: user.id,
          provider: account.provider,
          email: account.email,
          name: account.name,
          status: account.status,
          calendars: account.calendars,
          synced_at: account.syncedAt || new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving calendar account:', error);
    }
  };

  const disconnectCalendar = async (accountId: string) => {
    try {
      // Remove from Unipile if connected
      const unipileService = UnipileCalendarService.getInstance();
      await unipileService.disconnectCalendar(accountId);
      
      // Remove from Supabase
      const { error } = await supabase
        .from('calendar_accounts')
        .delete()
        .eq('id', accountId);

      if (error) throw error;

      setAccounts(accounts.filter(a => a.id !== accountId));
      toast.success('Calendar disconnected');
    } catch (error) {
      console.error('Error disconnecting calendar:', error);
      toast.error('Failed to disconnect calendar');
    }
  };

  const syncCalendar = async (accountId: string) => {
    try {
      setSyncingAccountId(accountId);
      
      const unipileService = UnipileCalendarService.getInstance();
      await unipileService.syncCalendar(accountId);
      
      // Update sync time
      const updatedAccounts = accounts.map(account => 
        account.id === accountId 
          ? { ...account, syncedAt: new Date().toISOString() }
          : account
      );
      setAccounts(updatedAccounts);
      
      toast.success('Calendar synced successfully');
    } catch (error) {
      console.error('Error syncing calendar:', error);
      toast.error('Failed to sync calendar');
    } finally {
      setSyncingAccountId(null);
    }
  };

  const toggleCalendarSelection = async (accountId: string, calendarId: string) => {
    const updatedAccounts = accounts.map(account => {
      if (account.id === accountId && account.calendars) {
        const updatedCalendars = account.calendars.map(cal =>
          cal.id === calendarId ? { ...cal, isSelected: !cal.isSelected } : cal
        );
        return { ...account, calendars: updatedCalendars };
      }
      return account;
    });
    
    setAccounts(updatedAccounts);
    
    // Save to database
    const account = updatedAccounts.find(a => a.id === accountId);
    if (account) {
      await saveCalendarAccount(account);
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'google':
        return '📅';
      case 'outlook':
      case 'office365':
        return '📆';
      case 'exchange':
        return '🗓️';
      default:
        return '📅';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Calendar Integration
              </CardTitle>
              <CardDescription className="mt-1.5">
                Connect your calendar accounts for scheduling and availability management
              </CardDescription>
            </div>
            {accounts.length > 0 && (
              <Button onClick={() => setShowConnectionDialog(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Calendar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {accounts.length === 0 ? (
            <div className="text-center py-8 space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <Calendar className="h-8 w-8 text-primary" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">No calendars connected</h3>
                <p className="text-muted-foreground text-sm">
                  Connect your Google or Outlook calendar to sync events and manage availability
                </p>
              </div>
              <Button onClick={() => setShowConnectionDialog(true)} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Connect Calendar
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">{getProviderIcon(account.provider)}</div>
                      <div>
                        <div className="font-medium">{account.name}</div>
                        <div className="text-sm text-muted-foreground">{account.email}</div>
                        {account.syncedAt && (
                          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Last synced: {new Date(account.syncedAt).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={account.status === 'connected' ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        {account.status === 'connected' ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Connected
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Error
                          </>
                        )}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowCalendarSettings(account.id)}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => syncCalendar(account.id)}
                        disabled={syncingAccountId === account.id}
                      >
                        {syncingAccountId === account.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => disconnectCalendar(account.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>

                  {account.calendars && account.calendars.length > 0 && (
                    <div className="border-t pt-3">
                      <div className="text-sm font-medium mb-2">Selected Calendars:</div>
                      <div className="space-y-2">
                        {account.calendars.map((calendar) => (
                          <label
                            key={calendar.id}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={calendar.isSelected}
                              onChange={() => toggleCalendarSelection(account.id, calendar.id)}
                              className="rounded border-gray-300"
                            />
                            <div className="flex items-center gap-2 flex-1">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: calendar.color }}
                              />
                              <span className="text-sm">{calendar.name}</span>
                              {calendar.isPrimary && (
                                <Badge variant="outline" className="text-xs">Primary</Badge>
                              )}
                              {calendar.canWrite && (
                                <Badge variant="outline" className="text-xs">Write Access</Badge>
                              )}
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {account.error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{account.error}</AlertDescription>
                    </Alert>
                  )}
                </div>
              ))}
            </div>
          )}

          {accounts.length > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Connected calendars will be used for:
                <ul className="mt-2 ml-4 text-sm list-disc">
                  <li>Checking your availability for meeting scheduling</li>
                  <li>Automatically blocking time for scheduled campaigns</li>
                  <li>Syncing events with your LinkedIn outreach schedule</li>
                  <li>Managing follow-up reminders and tasks</li>
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Connection Dialog */}
      <Dialog open={showConnectionDialog} onOpenChange={setShowConnectionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect Calendar Account</DialogTitle>
            <DialogDescription>
              Choose your calendar provider to sync events and manage availability
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Calendar Provider</Label>
              <Select
                value={selectedProvider}
                onValueChange={(value: 'google' | 'outlook') => setSelectedProvider(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="google">
                    <div className="flex items-center gap-2">
                      <span>📅</span>
                      Google Calendar
                    </div>
                  </SelectItem>
                  <SelectItem value="outlook">
                    <div className="flex items-center gap-2">
                      <span>📆</span>
                      Outlook Calendar
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You will be redirected to {selectedProvider === 'google' ? 'Google' : 'Microsoft'} to
                authorize access to your calendar. We only request permissions to:
                <ul className="mt-2 ml-4 text-sm list-disc">
                  <li>View your calendar events</li>
                  <li>Check your availability</li>
                  <li>Create events for scheduled campaigns</li>
                </ul>
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConnectionDialog(false)}>
              Cancel
            </Button>
            <Button onClick={connectCalendar} disabled={isConnecting}>
              {isConnecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Calendar className="h-4 w-4 mr-2" />
                  Connect {selectedProvider === 'google' ? 'Google' : 'Outlook'} Calendar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}