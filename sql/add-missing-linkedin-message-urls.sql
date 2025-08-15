-- Add LinkedIn messaging URLs to existing conversations that have LinkedIn profile URLs
-- This fixes conversations that were synced before the messaging URL feature was added

UPDATE inbox_conversations 
SET metadata = metadata || jsonb_build_object(
  'linkedin_message_url', 
  CASE 
    WHEN metadata->>'participant_linkedin_url' IS NOT NULL AND metadata->>'participant_linkedin_url' != '' THEN
      'https://www.linkedin.com/messaging/compose/?recipient=' || 
      CASE 
        WHEN metadata->>'participant_linkedin_url' ~ 'linkedin\.com/in/([^/\?]+)' THEN
          (regexp_match(metadata->>'participant_linkedin_url', 'linkedin\.com/in/([^/\?]+)'))[1]
        ELSE 
          COALESCE(metadata->>'attendee_provider_id', 'unknown')
      END
    ELSE ''
  END
)
WHERE metadata->>'participant_linkedin_url' IS NOT NULL 
  AND metadata->>'participant_linkedin_url' != ''
  AND (metadata->>'linkedin_message_url' IS NULL OR metadata->>'linkedin_message_url' = '');

-- Show results
SELECT 
  participant_name,
  participant_company,
  metadata->>'participant_linkedin_url' as profile_url,
  metadata->>'linkedin_message_url' as message_url
FROM inbox_conversations 
WHERE metadata->>'linkedin_message_url' IS NOT NULL 
  AND metadata->>'linkedin_message_url' != ''
ORDER BY participant_name
LIMIT 10;