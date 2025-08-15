import { supabase } from './src/integrations/supabase/client.js';

const migration = `
-- Create voucher_codes table
CREATE TABLE IF NOT EXISTS public.voucher_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  description TEXT,
  max_uses INTEGER DEFAULT 1,
  used_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add voucher_code_used field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS voucher_code_used TEXT;

-- Add owner_id field to workspaces table if it doesn't exist
ALTER TABLE public.workspaces 
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id);

-- Enable RLS on voucher_codes
ALTER TABLE public.voucher_codes ENABLE ROW LEVEL SECURITY;

-- Create policy for voucher_codes (read-only for authenticated users)
CREATE POLICY "Users can read voucher codes" ON public.voucher_codes
  FOR SELECT USING (true);

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_voucher_codes_updated_at 
    BEFORE UPDATE ON public.voucher_codes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert initial voucher codes
INSERT INTO public.voucher_codes (code, email, description, max_uses) VALUES
('BETA-TL-2025', 'tl@innovareai.com', 'Beta access for TL', 1),
('CLIENT-DEMO-001', 'demo@client1.com', 'Demo access for client 1', 1),
('CLIENT-DEMO-002', 'demo@client2.com', 'Demo access for client 2', 1),
('INTERNAL-TEAM-001', 'team@innovareai.com', 'Internal team access', 5),
('PARTNER-ACCESS-001', 'partner@company.com', 'Partner access', 3)
ON CONFLICT (code) DO NOTHING;
`;

async function applyMigration() {
  console.log('🚀 Applying voucher codes migration...');
  
  try {
    const { error } = await supabase.rpc('exec_sql', { sql: migration });
    
    if (error) {
      console.error('❌ Migration failed:', error);
      return;
    }
    
    console.log('✅ Migration applied successfully!');
    
    // Verify the table was created
    const { data: tables, error: tablesError } = await supabase
      .from('voucher_codes')
      .select('*')
      .limit(1);
      
    if (tablesError) {
      console.error('❌ Verification failed:', tablesError);
    } else {
      console.log('✅ Voucher codes table verified');
    }
    
  } catch (err) {
    console.error('❌ Migration error:', err);
  }
}

applyMigration();