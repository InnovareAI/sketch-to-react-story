-- Create calendar_accounts table for storing connected calendar accounts
CREATE TABLE IF NOT EXISTS public.calendar_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'outlook', 'office365', 'exchange')),
  email TEXT NOT NULL,
  name TEXT,
  status TEXT DEFAULT 'connected' CHECK (status IN ('connected', 'error', 'syncing')),
  calendars JSONB DEFAULT '[]'::jsonb,
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique calendar per user and email
  CONSTRAINT unique_user_calendar UNIQUE (user_id, email)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_calendar_accounts_user_id ON public.calendar_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_accounts_provider ON public.calendar_accounts(provider);
CREATE INDEX IF NOT EXISTS idx_calendar_accounts_status ON public.calendar_accounts(status);

-- Enable RLS (Row Level Security)
ALTER TABLE public.calendar_accounts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own calendar accounts" ON public.calendar_accounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own calendar accounts" ON public.calendar_accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own calendar accounts" ON public.calendar_accounts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own calendar accounts" ON public.calendar_accounts
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_calendar_accounts_updated_at
  BEFORE UPDATE ON public.calendar_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE public.calendar_accounts IS 'Stores connected calendar accounts for users';
COMMENT ON COLUMN public.calendar_accounts.provider IS 'Calendar provider (google, outlook, office365, exchange)';
COMMENT ON COLUMN public.calendar_accounts.calendars IS 'JSON array of calendar details including id, name, color, isSelected, isPrimary, canWrite';
COMMENT ON COLUMN public.calendar_accounts.status IS 'Connection status of the calendar account';
COMMENT ON COLUMN public.calendar_accounts.synced_at IS 'Last time the calendar was synced';