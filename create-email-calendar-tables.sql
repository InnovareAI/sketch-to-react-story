-- Create Email and Calendar Tables for Unipile Integration
-- Supports Gmail, Outlook, and other email providers via Unipile

-- Email Accounts Table
CREATE TABLE IF NOT EXISTS email_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('gmail', 'outlook', 'office365', 'yahoo', 'other')),
  email_address TEXT NOT NULL,
  account_name TEXT,
  unipile_account_id TEXT,
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(workspace_id, email_address)
);

-- Emails Table
CREATE TABLE IF NOT EXISTS emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  email_account_id UUID REFERENCES email_accounts(id) ON DELETE CASCADE,
  unipile_message_id TEXT UNIQUE,
  thread_id TEXT,
  subject TEXT,
  snippet TEXT,
  body_text TEXT,
  body_html TEXT,
  from_email TEXT,
  from_name TEXT,
  to_emails TEXT[],
  cc_emails TEXT[],
  bcc_emails TEXT[],
  reply_to TEXT,
  date_sent TIMESTAMP WITH TIME ZONE,
  date_received TIMESTAMP WITH TIME ZONE,
  is_read BOOLEAN DEFAULT false,
  is_starred BOOLEAN DEFAULT false,
  is_important BOOLEAN DEFAULT false,
  is_draft BOOLEAN DEFAULT false,
  is_sent BOOLEAN DEFAULT false,
  is_trash BOOLEAN DEFAULT false,
  is_spam BOOLEAN DEFAULT false,
  labels TEXT[],
  folders TEXT[],
  attachments JSONB,
  headers JSONB,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Calendar Events Table
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  email_account_id UUID REFERENCES email_accounts(id) ON DELETE CASCADE,
  unipile_event_id TEXT UNIQUE,
  calendar_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  all_day BOOLEAN DEFAULT false,
  timezone TEXT,
  status TEXT CHECK (status IN ('confirmed', 'tentative', 'cancelled')),
  visibility TEXT CHECK (visibility IN ('public', 'private', 'confidential')),
  organizer_email TEXT,
  organizer_name TEXT,
  attendees JSONB, -- Array of {email, name, status, required}
  recurrence_rule TEXT,
  recurring_event_id TEXT,
  reminders JSONB, -- Array of {method, minutes}
  conference_data JSONB, -- Video call links, phone numbers
  attachments JSONB,
  categories TEXT[],
  is_organizer BOOLEAN DEFAULT false,
  response_status TEXT CHECK (response_status IN ('accepted', 'declined', 'tentative', 'needsAction')),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email Threads Table (for conversation grouping)
CREATE TABLE IF NOT EXISTS email_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  thread_id TEXT UNIQUE NOT NULL,
  subject TEXT,
  participants TEXT[],
  last_message_at TIMESTAMP WITH TIME ZONE,
  message_count INTEGER DEFAULT 0,
  is_unread BOOLEAN DEFAULT false,
  labels TEXT[],
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email Templates Table (for campaign emails)
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT,
  body_text TEXT,
  variables JSONB, -- Dynamic variables like {{first_name}}
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email Campaign Tracking
CREATE TABLE IF NOT EXISTS email_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id UUID REFERENCES emails(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  replied_at TIMESTAMP WITH TIME ZONE,
  bounced_at TIMESTAMP WITH TIME ZONE,
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  open_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  links_clicked JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_emails_workspace ON emails(workspace_id);
CREATE INDEX IF NOT EXISTS idx_emails_account ON emails(email_account_id);
CREATE INDEX IF NOT EXISTS idx_emails_thread ON emails(thread_id);
CREATE INDEX IF NOT EXISTS idx_emails_from ON emails(from_email);
CREATE INDEX IF NOT EXISTS idx_emails_date ON emails(date_received DESC);
CREATE INDEX IF NOT EXISTS idx_emails_unread ON emails(workspace_id, is_read) WHERE is_read = false;

CREATE INDEX IF NOT EXISTS idx_calendar_workspace ON calendar_events(workspace_id);
CREATE INDEX IF NOT EXISTS idx_calendar_account ON calendar_events(email_account_id);
CREATE INDEX IF NOT EXISTS idx_calendar_start ON calendar_events(start_time);
CREATE INDEX IF NOT EXISTS idx_calendar_organizer ON calendar_events(organizer_email);

CREATE INDEX IF NOT EXISTS idx_email_threads_workspace ON email_threads(workspace_id);
CREATE INDEX IF NOT EXISTS idx_email_threads_thread ON email_threads(thread_id);

-- RLS Policies
ALTER TABLE email_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_tracking ENABLE ROW LEVEL SECURITY;

-- Policies for email_accounts
CREATE POLICY "Users can view email accounts in their workspace" ON email_accounts
  FOR SELECT USING (workspace_id IN (
    SELECT workspace_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can manage email accounts in their workspace" ON email_accounts
  FOR ALL USING (workspace_id IN (
    SELECT workspace_id FROM profiles WHERE id = auth.uid()
  ));

-- Policies for emails
CREATE POLICY "Users can view emails in their workspace" ON emails
  FOR SELECT USING (workspace_id IN (
    SELECT workspace_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can manage emails in their workspace" ON emails
  FOR ALL USING (workspace_id IN (
    SELECT workspace_id FROM profiles WHERE id = auth.uid()
  ));

-- Policies for calendar_events
CREATE POLICY "Users can view calendar events in their workspace" ON calendar_events
  FOR SELECT USING (workspace_id IN (
    SELECT workspace_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can manage calendar events in their workspace" ON calendar_events
  FOR ALL USING (workspace_id IN (
    SELECT workspace_id FROM profiles WHERE id = auth.uid()
  ));

-- Grant permissions
GRANT ALL ON email_accounts TO authenticated;
GRANT ALL ON emails TO authenticated;
GRANT ALL ON calendar_events TO authenticated;
GRANT ALL ON email_threads TO authenticated;
GRANT ALL ON email_templates TO authenticated;
GRANT ALL ON email_tracking TO authenticated;