-- Remove perplexity_content column from submissions table
-- This column is no longer needed as we're using OpenAI and Anthropic directly

-- For Supabase (latxadqrvrrrcvkktrog.supabase.co)
ALTER TABLE submissions 
DROP COLUMN IF EXISTS perplexity_content;

-- Verify the column has been removed
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'submissions' 
AND column_name = 'perplexity_content';