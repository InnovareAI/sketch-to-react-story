-- Populate business metrics data for the real InnovareAI workspace
-- This will update existing contacts with realistic business progression

-- Update some contacts to show connection acceptance (simulate LinkedIn connections)
WITH sample_contacts AS (
  SELECT id, created_at FROM contacts 
  WHERE workspace_id = 'df5d730f-1915-4269-bd5a-9534478b17af'
  ORDER BY RANDOM()
  LIMIT 50
)
UPDATE contacts SET 
  connection_requested_at = created_at + INTERVAL '1 hour',
  connection_accepted_at = created_at + INTERVAL '2 days',
  sales_stage = 'connected',
  interaction_count = 1,
  last_interaction_at = created_at + INTERVAL '2 days',
  interaction_type = 'connection_request'
WHERE id IN (SELECT id FROM sample_contacts);

-- Update some contacts to show they've been messaged (simulate first outreach)
WITH messaged_contacts AS (
  SELECT id, connection_accepted_at FROM contacts 
  WHERE workspace_id = 'df5d730f-1915-4269-bd5a-9534478b17af'
    AND connection_accepted_at IS NOT NULL
  ORDER BY RANDOM()
  LIMIT 35
)
UPDATE contacts SET 
  first_message_sent_at = connection_accepted_at + INTERVAL '1 day',
  sales_stage = 'contacted',
  interaction_count = interaction_count + 1,
  last_interaction_at = connection_accepted_at + INTERVAL '1 day',
  interaction_type = 'message'
WHERE id IN (SELECT id FROM messaged_contacts);

-- Update some contacts to show interest (simulate positive responses)
WITH interested_contacts AS (
  SELECT id, first_message_sent_at FROM contacts 
  WHERE workspace_id = 'df5d730f-1915-4269-bd5a-9534478b17af'
    AND first_message_sent_at IS NOT NULL
  ORDER BY RANDOM()
  LIMIT 18
)
UPDATE contacts SET 
  first_response_received_at = first_message_sent_at + INTERVAL '6 hours',
  interest_expressed_at = first_message_sent_at + INTERVAL '1 day',
  sales_stage = 'interested',
  interaction_count = interaction_count + 2,
  last_interaction_at = first_message_sent_at + INTERVAL '1 day',
  interaction_type = 'interested_response'
WHERE id IN (SELECT id FROM interested_contacts);

-- Update some contacts to show meeting requests and scheduled meetings
WITH meeting_contacts AS (
  SELECT id, interest_expressed_at FROM contacts 
  WHERE workspace_id = 'df5d730f-1915-4269-bd5a-9534478b17af'
    AND interest_expressed_at IS NOT NULL
  ORDER BY RANDOM()
  LIMIT 12
)
UPDATE contacts SET 
  meeting_requested_at = interest_expressed_at + INTERVAL '4 hours',
  sales_stage = 'interested',
  interaction_count = interaction_count + 1,
  last_interaction_at = interest_expressed_at + INTERVAL '4 hours',
  interaction_type = 'meeting_request'
WHERE id IN (SELECT id FROM meeting_contacts);

-- Mark some as actually having scheduled meetings
WITH scheduled_meetings AS (
  SELECT id, meeting_requested_at FROM contacts 
  WHERE workspace_id = 'df5d730f-1915-4269-bd5a-9534478b17af'
    AND meeting_requested_at IS NOT NULL
  ORDER BY RANDOM()
  LIMIT 7
)
UPDATE contacts SET 
  meeting_scheduled_at = meeting_requested_at + INTERVAL '2 hours',
  sales_stage = 'meeting_scheduled',
  interaction_count = interaction_count + 1,
  last_interaction_at = meeting_requested_at + INTERVAL '2 hours',
  interaction_type = 'meeting_scheduled'
WHERE id IN (SELECT id FROM scheduled_meetings);

-- Add some recent activity (this week) for trending metrics
WITH recent_connections AS (
  SELECT id FROM contacts 
  WHERE workspace_id = 'df5d730f-1915-4269-bd5a-9534478b17af'
    AND connection_accepted_at IS NULL
  ORDER BY RANDOM()
  LIMIT 12
)
UPDATE contacts SET 
  connection_requested_at = NOW() - INTERVAL '3 days',
  connection_accepted_at = NOW() - INTERVAL '2 days',
  sales_stage = 'connected',
  interaction_count = COALESCE(interaction_count, 0) + 1,
  last_interaction_at = NOW() - INTERVAL '2 days',
  interaction_type = 'connection_accepted'
WHERE id IN (SELECT id FROM recent_connections);

-- Add some recent interest expressions (this week)
WITH recent_interest AS (
  SELECT id FROM contacts 
  WHERE workspace_id = 'df5d730f-1915-4269-bd5a-9534478b17af'
    AND connection_accepted_at IS NOT NULL
    AND interest_expressed_at IS NULL
  ORDER BY RANDOM()
  LIMIT 8
)
UPDATE contacts SET 
  first_message_sent_at = COALESCE(first_message_sent_at, NOW() - INTERVAL '2 days'),
  interest_expressed_at = NOW() - INTERVAL '1 day',
  sales_stage = 'interested',
  interaction_count = COALESCE(interaction_count, 0) + 1,
  last_interaction_at = NOW() - INTERVAL '1 day',
  interaction_type = 'interested_response'
WHERE id IN (SELECT id FROM recent_interest);

-- Add some recent meeting schedules (this week)
WITH recent_meetings AS (
  SELECT id FROM contacts 
  WHERE workspace_id = 'df5d730f-1915-4269-bd5a-9534478b17af'
    AND interest_expressed_at IS NOT NULL
    AND meeting_scheduled_at IS NULL
  ORDER BY RANDOM()
  LIMIT 4
)
UPDATE contacts SET 
  meeting_requested_at = COALESCE(meeting_requested_at, NOW() - INTERVAL '1 day'),
  meeting_scheduled_at = NOW() - INTERVAL '12 hours',
  sales_stage = 'meeting_scheduled',
  interaction_count = COALESCE(interaction_count, 0) + 1,
  last_interaction_at = NOW() - INTERVAL '12 hours',
  interaction_type = 'meeting_scheduled'
WHERE id IN (SELECT id FROM recent_meetings);

-- Test the function to make sure it's working
SELECT 'Business Metrics for InnovareAI Workspace:' as title;
SELECT * FROM get_workspace_business_metrics('df5d730f-1915-4269-bd5a-9534478b17af');

-- Also check the view
SELECT 'Contact Business Metrics View:' as title;
SELECT * FROM contact_business_metrics WHERE workspace_id = 'df5d730f-1915-4269-bd5a-9534478b17af';

-- Show a sample of contacts with their progression
SELECT 'Sample Contact Progression:' as title;
SELECT 
  first_name || ' ' || last_name as name,
  sales_stage,
  connection_accepted_at IS NOT NULL as connected,
  interest_expressed_at IS NOT NULL as interested,
  meeting_scheduled_at IS NOT NULL as meeting_booked,
  interaction_count,
  last_interaction_at::date as last_interaction
FROM contacts 
WHERE workspace_id = 'df5d730f-1915-4269-bd5a-9534478b17af'
  AND (connection_accepted_at IS NOT NULL OR interest_expressed_at IS NOT NULL OR meeting_scheduled_at IS NOT NULL)
ORDER BY last_interaction_at DESC 
LIMIT 10;