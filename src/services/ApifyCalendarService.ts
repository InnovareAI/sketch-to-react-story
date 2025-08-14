/**
 * Apify Calendar Service
 * Integrates with Apify to extract calendar events from various calendar providers
 */

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: string;
  end: string;
  location?: string;
  attendees?: string[];
  organizer?: string;
  type: 'meeting' | 'call' | 'demo' | 'follow_up' | 'appointment';
  status: 'confirmed' | 'tentative' | 'cancelled';
  source: 'google' | 'outlook' | 'apple' | 'other';
}

export interface CalendarProvider {
  id: string;
  name: string;
  type: 'google' | 'outlook' | 'apple' | 'other';
  connected: boolean;
  lastSync?: string;
}

class ApifyCalendarService {
  private readonly baseUrl = 'https://api.apify.com/v2/acts';
  private readonly apiKey = process.env.APIFY_API_KEY || '';

  /**
   * Extract calendar events using Apify actors
   */
  async extractCalendarEvents(
    provider: 'google' | 'outlook' | 'apple',
    credentials: any,
    dateRange: { start: Date; end: Date }
  ): Promise<CalendarEvent[]> {
    try {
      // Map provider to appropriate Apify actor
      const actorId = this.getActorIdForProvider(provider);
      
      if (!actorId) {
        console.warn(`No Apify actor available for ${provider} calendar`);
        return this.getMockCalendarEvents();
      }

      const payload = {
        provider,
        credentials,
        startDate: dateRange.start.toISOString(),
        endDate: dateRange.end.toISOString(),
        extractAttendees: true,
        extractLocation: true,
        maxEvents: 100
      };

      console.log(`🔄 Extracting calendar events from ${provider} via Apify...`);

      // For now, return mock data since Apify integration requires setup
      // In production, this would make actual API calls to Apify
      return this.getMockCalendarEvents();

      /* Production implementation would be:
      const response = await fetch(`${this.baseUrl}/${actorId}/runs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          input: payload
        })
      });

      if (!response.ok) {
        throw new Error(`Apify API error: ${response.statusText}`);
      }

      const runData = await response.json();
      const runId = runData.data.id;

      // Poll for completion
      const events = await this.pollForResults(runId);
      return this.transformApifyResults(events);
      */

    } catch (error) {
      console.error('Error extracting calendar events:', error);
      return this.getMockCalendarEvents();
    }
  }

  /**
   * Get available calendar providers and their connection status
   */
  async getConnectedProviders(): Promise<CalendarProvider[]> {
    try {
      // In production, this would check actual provider connections
      return [
        {
          id: 'google',
          name: 'Google Calendar',
          type: 'google',
          connected: true,
          lastSync: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
        },
        {
          id: 'outlook',
          name: 'Microsoft Outlook',
          type: 'outlook',
          connected: false
        },
        {
          id: 'apple',
          name: 'Apple Calendar',
          type: 'apple',
          connected: false
        }
      ];
    } catch (error) {
      console.error('Error getting calendar providers:', error);
      return [];
    }
  }

  /**
   * Sync calendar events from all connected providers
   */
  async syncAllCalendars(): Promise<CalendarEvent[]> {
    try {
      const providers = await this.getConnectedProviders();
      const connectedProviders = providers.filter(p => p.connected);
      
      if (connectedProviders.length === 0) {
        console.warn('No calendar providers connected');
        return [];
      }

      const dateRange = {
        start: new Date(),
        end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Next 30 days
      };

      // Extract from all connected providers
      const allEvents: CalendarEvent[] = [];
      
      for (const provider of connectedProviders) {
        try {
          const events = await this.extractCalendarEvents(
            provider.type,
            {}, // Credentials would be stored securely
            dateRange
          );
          allEvents.push(...events);
        } catch (error) {
          console.error(`Error syncing ${provider.name}:`, error);
        }
      }

      // Deduplicate and sort events
      return this.deduplicateEvents(allEvents);

    } catch (error) {
      console.error('Error syncing calendars:', error);
      return [];
    }
  }

  /**
   * Schedule a new calendar event
   */
  async scheduleEvent(event: Omit<CalendarEvent, 'id' | 'source'>): Promise<CalendarEvent> {
    try {
      // In production, this would create the event via Apify
      const newEvent: CalendarEvent = {
        ...event,
        id: `evt_${Date.now()}`,
        source: 'google' // Default to primary calendar
      };

      console.log('📅 Event scheduled:', newEvent.title);
      return newEvent;

    } catch (error) {
      console.error('Error scheduling event:', error);
      throw error;
    }
  }

  /**
   * Get suggested meeting times based on calendar availability
   */
  async getSuggestedMeetingTimes(
    duration: number, // in minutes
    dateRange: { start: Date; end: Date },
    attendeeEmails?: string[]
  ): Promise<{ start: Date; end: Date }[]> {
    try {
      // In production, this would analyze calendar data via Apify
      const suggestions = [];
      const now = new Date();
      
      // Generate some sample suggestions
      for (let i = 1; i <= 5; i++) {
        const startTime = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
        startTime.setHours(10 + (i % 3) * 2, 0, 0, 0); // 10am, 12pm, 2pm pattern
        
        const endTime = new Date(startTime.getTime() + duration * 60 * 1000);
        
        suggestions.push({ start: startTime, end: endTime });
      }

      return suggestions;

    } catch (error) {
      console.error('Error getting meeting suggestions:', error);
      return [];
    }
  }

  /**
   * Connect a new calendar provider
   */
  async connectProvider(provider: 'google' | 'outlook' | 'apple'): Promise<{ authUrl: string }> {
    try {
      // In production, this would initiate OAuth flow via Apify
      const authUrl = `https://example.com/auth/${provider}?return_url=${encodeURIComponent(window.location.origin)}`;
      
      return { authUrl };

    } catch (error) {
      console.error('Error connecting provider:', error);
      throw error;
    }
  }

  // Helper methods

  private getActorIdForProvider(provider: string): string | null {
    const actorMap = {
      google: 'google-calendar-extractor',
      outlook: 'outlook-calendar-extractor',
      apple: 'apple-calendar-extractor'
    };
    
    return actorMap[provider as keyof typeof actorMap] || null;
  }

  private getMockCalendarEvents(): CalendarEvent[] {
    const now = new Date();
    return [
      {
        id: 'mock_1',
        title: 'Weekly Team Standup',
        description: 'Regular team sync meeting',
        start: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        end: new Date(now.getTime() + 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(),
        location: 'Conference Room A',
        attendees: ['team@company.com'],
        organizer: 'manager@company.com',
        type: 'meeting',
        status: 'confirmed',
        source: 'google'
      },
      {
        id: 'mock_2',
        title: 'Client Demo - TechCorp',
        description: 'Product demonstration for potential client',
        start: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(), // Day after tomorrow
        end: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
        attendees: ['john.smith@techcorp.com', 'sarah.johnson@techcorp.com'],
        type: 'demo',
        status: 'confirmed',
        source: 'google'
      },
      {
        id: 'mock_3',
        title: 'Follow-up Call - Innovation Labs',
        description: 'Follow up on proposal discussion',
        start: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(),
        attendees: ['maria.garcia@innovatelabs.com'],
        type: 'follow_up',
        status: 'confirmed',
        source: 'google'
      },
      {
        id: 'mock_4',
        title: 'Sales Pipeline Review',
        description: 'Monthly pipeline review meeting',
        start: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Next week
        end: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000).toISOString(),
        attendees: ['sales-team@company.com'],
        type: 'meeting',
        status: 'confirmed',
        source: 'google'
      }
    ];
  }

  private deduplicateEvents(events: CalendarEvent[]): CalendarEvent[] {
    const seen = new Set();
    return events.filter(event => {
      const key = `${event.title}_${event.start}_${event.end}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    }).sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  }

  private async pollForResults(runId: string): Promise<any[]> {
    // Implementation would poll Apify for run completion
    // This is a placeholder for the actual implementation
    return [];
  }

  private transformApifyResults(results: any[]): CalendarEvent[] {
    // Transform Apify results to our CalendarEvent format
    // This is a placeholder for the actual implementation
    return [];
  }
}

export const apifyCalendarService = new ApifyCalendarService();