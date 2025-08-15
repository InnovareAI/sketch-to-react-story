/**
 * Unipile Calendar Service
 * Handles calendar integration through Unipile API
 */

interface UnipileConfig {
  apiKey: string;
  dsn: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: string;
  end: string;
  location?: string;
  attendees?: string[];
  isAllDay?: boolean;
  recurrence?: string;
}

interface CalendarAccount {
  id: string;
  email: string;
  provider: 'google' | 'outlook' | 'office365';
  name?: string;
  calendars?: any[];
}

export class UnipileCalendarService {
  private static instance: UnipileCalendarService;
  private config: UnipileConfig;
  private baseUrl: string;

  private constructor() {
    // Get config from environment variables
    this.config = {
      apiKey: import.meta.env.VITE_UNIPILE_API_KEY || '',
      dsn: import.meta.env.VITE_UNIPILE_DSN || 'api8.unipile.com:13851'
    };
    
    // Extract base URL from DSN
    this.baseUrl = `https://${this.config.dsn.replace(':13851', '')}`;
  }

  static getInstance(): UnipileCalendarService {
    if (!UnipileCalendarService.instance) {
      UnipileCalendarService.instance = new UnipileCalendarService();
    }
    return UnipileCalendarService.instance;
  }

  /**
   * Get OAuth authorization URL for calendar connection
   */
  async getAuthUrl(provider: 'google' | 'outlook'): Promise<string> {
    try {
      // For Unipile, we need to create an account connection first
      // The actual OAuth flow is handled by Unipile's hosted auth page
      
      // Get the redirect URL based on environment
      const redirectUrl = window.location.origin + '/auth/calendar/callback';
      
      // Construct Unipile hosted auth URL
      const authParams = new URLSearchParams({
        api_key: this.config.apiKey,
        provider: provider === 'google' ? 'GOOGLE' : 'OUTLOOK',
        redirect_uri: redirectUrl,
        type: 'calendar',
        scopes: 'calendar.read calendar.write'
      });
      
      // TODO: Replace with actual Unipile OAuth endpoint
      const authUrl = `${window.location.origin}/auth/calendar/init?${authParams.toString()}`;
      
      console.log('Generated Unipile auth URL:', authUrl);
      return authUrl;
    } catch (error) {
      console.error('Error generating auth URL:', error);
      
      // Return a fallback URL for demo purposes
      if (provider === 'google') {
        return `https://accounts.google.com/o/oauth2/v2/auth?client_id=demo&redirect_uri=${window.location.origin}/auth/calendar/callback&response_type=code&scope=https://www.googleapis.com/auth/calendar`;
      } else {
        return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=demo&redirect_uri=${window.location.origin}/auth/calendar/callback&response_type=code&scope=https://graph.microsoft.com/calendars.readwrite`;
      }
    }
  }

  /**
   * List all connected calendar accounts
   */
  async listCalendars(): Promise<CalendarAccount[]> {
    if (!this.config.apiKey) {
      console.log('No Unipile API key configured, returning empty list');
      return [];
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/v1/accounts`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to list calendars: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Filter for calendar accounts only
      const calendarAccounts = data.accounts?.filter((account: any) => 
        account.type === 'calendar' || 
        account.provider === 'GOOGLE' || 
        account.provider === 'OUTLOOK'
      ) || [];

      return calendarAccounts.map((account: any) => ({
        id: account.account_id,
        email: account.email,
        provider: account.provider.toLowerCase() as 'google' | 'outlook',
        name: account.display_name || account.email,
        calendars: account.calendars || []
      }));
    } catch (error) {
      console.error('Error listing calendars:', error);
      return [];
    }
  }

  /**
   * Connect a new calendar account
   */
  async connectCalendar(code: string, provider: 'google' | 'outlook'): Promise<CalendarAccount | null> {
    if (!this.config.apiKey) {
      console.log('No Unipile API key configured');
      return null;
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/v1/accounts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          provider: provider === 'google' ? 'GOOGLE' : 'OUTLOOK',
          type: 'calendar',
          authorization_code: code,
          redirect_uri: window.location.origin + '/auth/calendar/callback'
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to connect calendar: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        id: data.account_id,
        email: data.email,
        provider: provider,
        name: data.display_name || data.email,
        calendars: data.calendars || []
      };
    } catch (error) {
      console.error('Error connecting calendar:', error);
      return null;
    }
  }

  /**
   * Disconnect a calendar account
   */
  async disconnectCalendar(accountId: string): Promise<boolean> {
    if (!this.config.apiKey) {
      console.log('No Unipile API key configured');
      return true; // Return true for demo
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/v1/accounts/${accountId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Error disconnecting calendar:', error);
      return false;
    }
  }

  /**
   * Sync calendar events
   */
  async syncCalendar(accountId: string): Promise<boolean> {
    if (!this.config.apiKey) {
      console.log('No Unipile API key configured, simulating sync');
      return true;
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/v1/accounts/${accountId}/sync`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Error syncing calendar:', error);
      return false;
    }
  }

  /**
   * Get calendar events
   */
  async getEvents(accountId: string, startDate?: Date, endDate?: Date): Promise<CalendarEvent[]> {
    if (!this.config.apiKey) {
      // Return mock data for demo
      return [
        {
          id: '1',
          title: 'Team Meeting',
          start: new Date().toISOString(),
          end: new Date(Date.now() + 3600000).toISOString(),
          description: 'Weekly team sync',
          location: 'Conference Room A'
        },
        {
          id: '2',
          title: 'Client Call',
          start: new Date(Date.now() + 86400000).toISOString(),
          end: new Date(Date.now() + 90000000).toISOString(),
          description: 'Quarterly review with client',
          attendees: ['client@example.com']
        }
      ];
    }

    try {
      const params = new URLSearchParams();
      if (startDate) params.append('start', startDate.toISOString());
      if (endDate) params.append('end', endDate.toISOString());

      const response = await fetch(
        `${this.baseUrl}/api/v1/accounts/${accountId}/events?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get events: ${response.statusText}`);
      }

      const data = await response.json();
      
      return data.events?.map((event: any) => ({
        id: event.id,
        title: event.subject || event.title,
        description: event.body || event.description,
        start: event.start_time,
        end: event.end_time,
        location: event.location,
        attendees: event.attendees?.map((a: any) => a.email) || [],
        isAllDay: event.is_all_day,
        recurrence: event.recurrence
      })) || [];
    } catch (error) {
      console.error('Error getting events:', error);
      return [];
    }
  }

  /**
   * Create a calendar event
   */
  async createEvent(accountId: string, event: Partial<CalendarEvent>): Promise<CalendarEvent | null> {
    if (!this.config.apiKey) {
      // Return mock event for demo
      return {
        id: `event-${Date.now()}`,
        title: event.title || 'New Event',
        start: event.start || new Date().toISOString(),
        end: event.end || new Date(Date.now() + 3600000).toISOString(),
        description: event.description,
        location: event.location
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/v1/accounts/${accountId}/events`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subject: event.title,
          body: event.description,
          start_time: event.start,
          end_time: event.end,
          location: event.location,
          attendees: event.attendees?.map(email => ({ email })),
          is_all_day: event.isAllDay
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to create event: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        id: data.id,
        title: data.subject || data.title,
        description: data.body || data.description,
        start: data.start_time,
        end: data.end_time,
        location: data.location,
        attendees: data.attendees?.map((a: any) => a.email) || []
      };
    } catch (error) {
      console.error('Error creating event:', error);
      return null;
    }
  }

  /**
   * Check availability for a time slot
   */
  async checkAvailability(
    accountId: string, 
    startTime: Date, 
    endTime: Date
  ): Promise<boolean> {
    const events = await this.getEvents(accountId, startTime, endTime);
    
    // Check if there are any conflicting events
    const hasConflict = events.some(event => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      
      return (
        (startTime >= eventStart && startTime < eventEnd) ||
        (endTime > eventStart && endTime <= eventEnd) ||
        (startTime <= eventStart && endTime >= eventEnd)
      );
    });
    
    return !hasConflict;
  }
}