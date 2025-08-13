/**
 * Email and Calendar Sync Service
 * Integrates with Gmail, Outlook, and other providers via Unipile API
 */

import { supabase } from '@/integrations/supabase/client';

interface EmailMessage {
  id: string;
  thread_id?: string;
  subject: string;
  snippet?: string;
  body?: {
    text?: string;
    html?: string;
  };
  from: {
    email: string;
    name?: string;
  };
  to: Array<{ email: string; name?: string }>;
  cc?: Array<{ email: string; name?: string }>;
  bcc?: Array<{ email: string; name?: string }>;
  date: string;
  is_read?: boolean;
  is_starred?: boolean;
  labels?: string[];
  attachments?: Array<{
    filename: string;
    mime_type: string;
    size: number;
    id: string;
  }>;
}

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  location?: string;
  start: {
    date_time: string;
    timezone?: string;
  };
  end: {
    date_time: string;
    timezone?: string;
  };
  all_day?: boolean;
  status?: 'confirmed' | 'tentative' | 'cancelled';
  organizer?: {
    email: string;
    name?: string;
  };
  attendees?: Array<{
    email: string;
    name?: string;
    response_status?: 'accepted' | 'declined' | 'tentative' | 'needsAction';
    required?: boolean;
  }>;
  recurrence?: string;
  reminders?: Array<{
    method: 'email' | 'popup';
    minutes: number;
  }>;
  conference_data?: {
    entry_points?: Array<{
      entry_point_type: string;
      uri: string;
      label?: string;
    }>;
  };
}

interface SyncResult {
  emailsSynced: number;
  eventsSynced: number;
  errors: string[];
  duration: number;
}

class EmailCalendarSyncService {
  private readonly UNIPILE_API_KEY = 'TE3VJJ3-N3E63ND-MWXM462-RBPCWYQ';
  private readonly UNIPILE_BASE_URL = 'https://api6.unipile.com:13443/api/v1';

  /**
   * Connect an email account (Gmail, Outlook, etc.)
   */
  async connectEmailAccount(provider: 'gmail' | 'outlook', workspaceId: string) {
    try {
      // Initiate OAuth flow with Unipile
      const response = await fetch(`${UNIPILE_BASE_URL}/accounts/connect`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.UNIPILE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: provider.toUpperCase(),
          scopes: ['email.read', 'email.send', 'calendar.read', 'calendar.write'],
          redirect_uri: `${window.location.origin}/settings/integrations/callback`
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to initiate connection: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Store the OAuth URL and redirect user
      if (data.auth_url) {
        window.location.href = data.auth_url;
      }

      return data;
    } catch (error) {
      console.error('Error connecting email account:', error);
      throw error;
    }
  }

  /**
   * Sync emails from connected account
   */
  async syncEmails(
    accountId: string,
    workspaceId: string,
    options: {
      limit?: number;
      since?: Date;
      folder?: string;
    } = {}
  ): Promise<SyncResult> {
    const startTime = Date.now();
    const result: SyncResult = {
      emailsSynced: 0,
      eventsSynced: 0,
      errors: [],
      duration: 0
    };

    try {
      // Fetch emails from Unipile
      const params = new URLSearchParams({
        limit: (options.limit || 100).toString(),
        ...(options.since && { since: options.since.toISOString() }),
        ...(options.folder && { folder: options.folder })
      });

      const response = await fetch(
        `${this.UNIPILE_BASE_URL}/users/${accountId}/messages?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${this.UNIPILE_API_KEY}`,
            'Accept': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch emails: ${response.statusText}`);
      }

      const data = await response.json();
      const emails = data.items || [];

      // Get email account info
      const { data: emailAccount } = await supabase
        .from('email_accounts')
        .select('id')
        .eq('workspace_id', workspaceId)
        .eq('unipile_account_id', accountId)
        .single();

      if (!emailAccount) {
        // Create email account if it doesn't exist
        const { data: newAccount, error } = await supabase
          .from('email_accounts')
          .insert({
            workspace_id: workspaceId,
            provider: 'gmail', // TODO: Detect from account
            email_address: emails[0]?.from?.email || 'unknown',
            unipile_account_id: accountId,
            last_sync_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) throw error;
        emailAccount.id = newAccount.id;
      }

      // Store emails in database
      for (const email of emails) {
        try {
          const emailData = {
            workspace_id: workspaceId,
            email_account_id: emailAccount.id,
            unipile_message_id: email.id,
            thread_id: email.thread_id,
            subject: email.subject,
            snippet: email.snippet,
            body_text: email.body?.text,
            body_html: email.body?.html,
            from_email: email.from?.email,
            from_name: email.from?.name,
            to_emails: email.to?.map((t: any) => t.email) || [],
            cc_emails: email.cc?.map((c: any) => c.email) || [],
            bcc_emails: email.bcc?.map((b: any) => b.email) || [],
            date_received: new Date(email.date).toISOString(),
            is_read: email.is_read || false,
            is_starred: email.is_starred || false,
            labels: email.labels || [],
            attachments: email.attachments || [],
            metadata: {
              unipile_data: email
            }
          };

          const { error } = await supabase
            .from('emails')
            .upsert(emailData, {
              onConflict: 'unipile_message_id'
            });

          if (!error) {
            result.emailsSynced++;
          } else {
            console.error('Error storing email:', error);
            result.errors.push(`Email ${email.id}: ${error.message}`);
          }
        } catch (err: any) {
          console.error('Error processing email:', err);
          result.errors.push(`Email ${email.id}: ${err.message}`);
        }
      }

      // Update last sync time
      await supabase
        .from('email_accounts')
        .update({ last_sync_at: new Date().toISOString() })
        .eq('id', emailAccount.id);

    } catch (error: any) {
      console.error('Error syncing emails:', error);
      result.errors.push(`Sync error: ${error.message}`);
    }

    result.duration = Date.now() - startTime;
    return result;
  }

  /**
   * Sync calendar events from connected account
   */
  async syncCalendarEvents(
    accountId: string,
    workspaceId: string,
    options: {
      limit?: number;
      timeMin?: Date;
      timeMax?: Date;
    } = {}
  ): Promise<SyncResult> {
    const startTime = Date.now();
    const result: SyncResult = {
      emailsSynced: 0,
      eventsSynced: 0,
      errors: [],
      duration: 0
    };

    try {
      // Fetch calendar events from Unipile
      const params = new URLSearchParams({
        limit: (options.limit || 100).toString(),
        ...(options.timeMin && { time_min: options.timeMin.toISOString() }),
        ...(options.timeMax && { time_max: options.timeMax.toISOString() })
      });

      const response = await fetch(
        `${this.UNIPILE_BASE_URL}/users/${accountId}/events?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${this.UNIPILE_API_KEY}`,
            'Accept': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch calendar events: ${response.statusText}`);
      }

      const data = await response.json();
      const events = data.items || [];

      // Get email account (calendar is linked to email account)
      const { data: emailAccount } = await supabase
        .from('email_accounts')
        .select('id')
        .eq('workspace_id', workspaceId)
        .eq('unipile_account_id', accountId)
        .single();

      if (!emailAccount) {
        throw new Error('Email account not found. Please connect email first.');
      }

      // Store calendar events in database
      for (const event of events) {
        try {
          const eventData = {
            workspace_id: workspaceId,
            email_account_id: emailAccount.id,
            unipile_event_id: event.id,
            title: event.title || 'Untitled Event',
            description: event.description,
            location: event.location,
            start_time: new Date(event.start.date_time).toISOString(),
            end_time: new Date(event.end.date_time).toISOString(),
            all_day: event.all_day || false,
            timezone: event.start.timezone,
            status: event.status || 'confirmed',
            organizer_email: event.organizer?.email,
            organizer_name: event.organizer?.name,
            attendees: event.attendees || [],
            recurrence_rule: event.recurrence,
            reminders: event.reminders || [],
            conference_data: event.conference_data,
            metadata: {
              unipile_data: event
            }
          };

          const { error } = await supabase
            .from('calendar_events')
            .upsert(eventData, {
              onConflict: 'unipile_event_id'
            });

          if (!error) {
            result.eventsSynced++;
          } else {
            console.error('Error storing calendar event:', error);
            result.errors.push(`Event ${event.id}: ${error.message}`);
          }
        } catch (err: any) {
          console.error('Error processing calendar event:', err);
          result.errors.push(`Event ${event.id}: ${err.message}`);
        }
      }

    } catch (error: any) {
      console.error('Error syncing calendar events:', error);
      result.errors.push(`Sync error: ${error.message}`);
    }

    result.duration = Date.now() - startTime;
    return result;
  }

  /**
   * Send an email
   */
  async sendEmail(
    accountId: string,
    email: {
      to: string[];
      cc?: string[];
      bcc?: string[];
      subject: string;
      body: string;
      isHtml?: boolean;
      attachments?: any[];
    }
  ) {
    try {
      const response = await fetch(
        `${this.UNIPILE_BASE_URL}/users/${accountId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.UNIPILE_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            to: email.to.map(e => ({ email: e })),
            cc: email.cc?.map(e => ({ email: e })),
            bcc: email.bcc?.map(e => ({ email: e })),
            subject: email.subject,
            body: {
              [email.isHtml ? 'html' : 'text']: email.body
            },
            attachments: email.attachments
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to send email: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  /**
   * Create a calendar event
   */
  async createCalendarEvent(
    accountId: string,
    event: {
      title: string;
      description?: string;
      start: Date;
      end: Date;
      location?: string;
      attendees?: string[];
      reminders?: Array<{ method: string; minutes: number }>;
    }
  ) {
    try {
      const response = await fetch(
        `${this.UNIPILE_BASE_URL}/users/${accountId}/events`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.UNIPILE_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            title: event.title,
            description: event.description,
            start: {
              date_time: event.start.toISOString()
            },
            end: {
              date_time: event.end.toISOString()
            },
            location: event.location,
            attendees: event.attendees?.map(email => ({
              email,
              response_status: 'needsAction'
            })),
            reminders: event.reminders
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to create calendar event: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating calendar event:', error);
      throw error;
    }
  }

  /**
   * Combined sync for emails and calendar
   */
  async syncAll(
    accountId: string,
    workspaceId: string,
    options: {
      syncEmails?: boolean;
      syncCalendar?: boolean;
      emailLimit?: number;
      calendarLimit?: number;
    } = { syncEmails: true, syncCalendar: true }
  ): Promise<SyncResult> {
    const result: SyncResult = {
      emailsSynced: 0,
      eventsSynced: 0,
      errors: [],
      duration: 0
    };

    if (options.syncEmails) {
      const emailResult = await this.syncEmails(accountId, workspaceId, {
        limit: options.emailLimit || 100
      });
      result.emailsSynced = emailResult.emailsSynced;
      result.errors.push(...emailResult.errors);
    }

    if (options.syncCalendar) {
      const calendarResult = await this.syncCalendarEvents(accountId, workspaceId, {
        limit: options.calendarLimit || 100,
        timeMin: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        timeMax: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)  // Next 90 days
      });
      result.eventsSynced = calendarResult.eventsSynced;
      result.errors.push(...calendarResult.errors);
    }

    return result;
  }
}

export const emailCalendarSync = new EmailCalendarSyncService();