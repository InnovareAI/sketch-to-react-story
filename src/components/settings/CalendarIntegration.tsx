import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Calendar, CheckCircle, AlertCircle, Plus, Trash2, RefreshCw, Settings, Clock, Users, Mail } from 'lucide-react';
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
        return (
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-50 to-red-50 border border-gray-200 flex items-center justify-center">
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          </div>
        );
      case 'outlook':
      case 'office365':
        return (
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 flex items-center justify-center">
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path fill="#0078D4" d="M24 7.5v9l-8 3.5V24l8-3.5v-13zM16 4.5v13L8 21V7.5L0 4v13l8 3.5V24l8-3.5v-16L8 1 0 4.5z"/>
            </svg>
          </div>
        );
      case 'exchange':
        return (
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 flex items-center justify-center">
            <Mail className="w-6 h-6 text-orange-600" />
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
            <Calendar className="w-6 h-6 text-gray-600" />
          </div>
        );
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
      <Card className="border border-gray-200 bg-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <CardTitle className="font-light text-xl">Calendar Integration</CardTitle>
                <CardDescription className="text-sm text-gray-500 mt-1">
                  Connect Google Calendar or Microsoft Outlook for seamless scheduling
                </CardDescription>
              </div>
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
            <div className="text-center py-12 space-y-4">
              <div className="flex justify-center">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl flex items-center justify-center border border-purple-100">
                  <Calendar className="h-10 w-10 text-purple-600" />
                </div>
              </div>
              <div>
                <h3 className="font-light text-xl text-gray-900 mb-2">No calendars connected</h3>
                <p className="text-gray-500 text-sm max-w-md mx-auto">
                  Connect your Google Calendar or Microsoft Outlook to automatically sync events, manage availability, and schedule meetings
                </p>
              </div>
              <div className="flex justify-center gap-3 mt-6">
                <Button 
                  onClick={() => {
                    setSelectedProvider('google');
                    setShowConnectionDialog(true);
                  }} 
                  className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google Calendar
                </Button>
                <Button 
                  onClick={() => {
                    setSelectedProvider('outlook');
                    setShowConnectionDialog(true);
                  }}
                  className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                    <path fill="#0078D4" d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
                  </svg>
                  Microsoft Outlook
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className="border border-gray-200 rounded-xl p-5 space-y-4 bg-white hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getProviderIcon(account.provider)}
                      <div className="flex-1">
                        <div className="font-light text-lg text-gray-900">{account.name}</div>
                        <div className="text-sm text-gray-500">{account.email}</div>
                        {account.syncedAt && (
                          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Last synced: {new Date(account.syncedAt).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {account.status === 'connected' ? (
                        <Badge className="bg-green-50 text-green-700 border-green-200">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Connected
                        </Badge>
                      ) : (
                        <Badge className="bg-red-50 text-red-700 border-red-200">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Error
                        </Badge>
                      )}
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
                    <div className="border-t border-gray-100 pt-4">
                      <div className="text-sm font-light text-gray-700 mb-3">Selected Calendars:</div>
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
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="font-medium mb-2">Connected calendars enable:</p>
                  <ul className="space-y-1 text-blue-800">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      <span>Real-time availability checking for meeting scheduling</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      <span>Automatic time blocking for scheduled campaigns</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      <span>Event syncing with LinkedIn outreach schedule</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      <span>Smart follow-up reminders and task management</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
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