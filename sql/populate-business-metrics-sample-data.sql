-- Populate sample business metrics data to test the system
-- This will update existing contacts with realistic business progression

-- Update some contacts to show connection acceptance (simulate LinkedIn connections)
WITH sample_contacts AS (
  SELECT id, created_at FROM contacts 
  WHERE workspace_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
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
  WHERE workspace_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
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
  WHERE workspace_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
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
  WHERE workspace_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
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
  WHERE workspace_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
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
UPDATE contacts SET 
  connection_accepted_at = NOW() - INTERVAL '2 days',
  sales_stage = 'connected',
  last_interaction_at = NOW() - INTERVAL '2 days'
WHERE id IN (
  SELECT id FROM contacts 
  WHERE workspace_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
    AND connection_accepted_at IS NULL
  ORDER BY RANDOM()
  LIMIT 12
);

-- Add some recent interest expressions (this week)
UPDATE contacts SET 
  interest_expressed_at = NOW() - INTERVAL '1 day',
  sales_stage = 'interested',
  last_interaction_at = NOW() - INTERVAL '1 day'
WHERE id IN (
  SELECT id FROM contacts 
  WHERE workspace_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
    AND connection_accepted_at IS NOT NULL
    AND interest_expressed_at IS NULL
  ORDER BY RANDOM()
  LIMIT 8
);

-- Add some recent meeting schedules (this week)
UPDATE contacts SET 
  meeting_scheduled_at = NOW() - INTERVAL '12 hours',
  sales_stage = 'meeting_scheduled',
  last_interaction_at = NOW() - INTERVAL '12 hours'
WHERE id IN (
  SELECT id FROM contacts 
  WHERE workspace_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
    AND interest_expressed_at IS NOT NULL
    AND meeting_scheduled_at IS NULL
  ORDER BY RANDOM()
  LIMIT 4
);

-- Test the function to make sure it's working
SELECT * FROM get_workspace_business_metrics('a1b2c3d4-e5f6-7890-abcd-ef1234567890');

-- Also check the view
SELECT * FROM contact_business_metrics WHERE workspace_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';