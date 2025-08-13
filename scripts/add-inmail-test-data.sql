-- Add test InMail conversations to demonstrate the InMail vs regular LinkedIn message differentiation
-- InMail messages typically have subject lines and are from people not in your network

-- Add InMail conversations (marked with metadata)
INSERT INTO inbox_conversations (
  workspace_id, 
  platform, 
  platform_conversation_id, 
  participant_name, 
  participant_company, 
  participant_avatar_url, 
  status, 
  last_message_at,
  metadata
)
VALUES 
  -- InMail messages (with metadata marking them as InMail)
  (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 
    'linkedin', 
    'inmail_' || gen_random_uuid()::text,
    'Robert Johnson', 
    'Executive Search Partners', 
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Robert', 
    'active', 
    NOW() - INTERVAL '30 minutes',
    jsonb_build_object(
      'message_type', 'inmail',
      'has_subject', true,
      'subject', 'Executive Opportunity - VP of Sales',
      'is_connected', false
    )
  ),
  (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 
    'linkedin', 
    'inmail_' || gen_random_uuid()::text,
    'Sarah Williams', 
    'Venture Capital Group', 
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah', 
    'active', 
    NOW() - INTERVAL '1 hour',
    jsonb_build_object(
      'message_type', 'inmail',
      'has_subject', true,
      'subject', 'Investment Opportunity Discussion',
      'is_connected', false
    )
  ),
  (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 
    'linkedin', 
    'inmail_' || gen_random_uuid()::text,
    'Michael Chen', 
    'TechCorp International', 
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael', 
    'active', 
    NOW() - INTERVAL '2 hours',
    jsonb_build_object(
      'message_type', 'inmail',
      'has_subject', true,
      'subject', 'Partnership Proposal - AI Integration',
      'is_connected', false
    )
  ),
  -- Regular LinkedIn messages (no InMail metadata)
  (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 
    'linkedin', 
    'msg_' || gen_random_uuid()::text,
    'Emily Davis', 
    'Marketing Solutions Inc', 
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily', 
    'active', 
    NOW() - INTERVAL '3 hours',
    jsonb_build_object(
      'is_connected', true,
      'connection_degree', '1st'
    )
  ),
  (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 
    'linkedin', 
    'msg_' || gen_random_uuid()::text,
    'James Wilson', 
    'Sales Automation Co', 
    'https://api.dicebear.com/7.x/avataaars/svg?seed=James', 
    'active', 
    NOW() - INTERVAL '4 hours',
    jsonb_build_object(
      'is_connected', true,
      'connection_degree', '2nd'
    )
  )
ON CONFLICT (workspace_id, platform_conversation_id) DO UPDATE
SET 
  metadata = EXCLUDED.metadata,
  last_message_at = EXCLUDED.last_message_at
RETURNING id, participant_name, metadata->>'message_type' as message_type;

-- Add corresponding messages for the InMail conversations
WITH inmail_convs AS (
  SELECT id, participant_name, metadata->>'subject' as subject
  FROM inbox_conversations
  WHERE metadata->>'message_type' = 'inmail'
  LIMIT 3
)
INSERT INTO inbox_messages (conversation_id, role, content, metadata)
SELECT 
  id,
  'assistant',
  CASE 
    WHEN participant_name = 'Robert Johnson' THEN 
      'Hi, I''m reaching out regarding an exciting VP of Sales opportunity with one of our Fortune 500 clients. Your background in B2B sales automation caught my attention. Would you be open to a confidential discussion about this role?'
    WHEN participant_name = 'Sarah Williams' THEN
      'I''ve been following your company''s progress in the AI space. We''re actively investing in B2B automation platforms and would love to explore potential synergies. Are you available for a call next week?'
    WHEN participant_name = 'Michael Chen' THEN
      'Your recent article on sales automation was impressive. We''re looking for strategic partners to integrate our AI solutions. I believe there could be significant mutual benefits. Can we schedule a meeting?'
    ELSE 
      'This is an InMail message.'
  END,
  jsonb_build_object(
    'type', 'inmail',
    'sender_name', participant_name,
    'subject', subject
  )
FROM inmail_convs
ON CONFLICT DO NOTHING;

-- Add messages for regular LinkedIn conversations
WITH regular_convs AS (
  SELECT id, participant_name
  FROM inbox_conversations
  WHERE metadata->>'message_type' IS NULL 
    AND platform = 'linkedin'
  ORDER BY created_at DESC
  LIMIT 2
)
INSERT INTO inbox_messages (conversation_id, role, content, metadata)
SELECT 
  id,
  'assistant',
  CASE 
    WHEN participant_name = 'Emily Davis' THEN 
      'Hey! Great connecting with you at the conference. Would love to continue our discussion about marketing automation strategies.'
    WHEN participant_name = 'James Wilson' THEN
      'Thanks for accepting my connection request! I see we''re both in the sales automation space. Perhaps we could share insights?'
    ELSE 
      'Thanks for connecting!'
  END,
  jsonb_build_object(
    'type', 'message',
    'sender_name', participant_name
  )
FROM regular_convs
ON CONFLICT DO NOTHING;

-- Verify the data
SELECT 
  participant_name,
  platform,
  metadata->>'message_type' as message_type,
  metadata->>'has_subject' as has_subject,
  metadata->>'subject' as subject,
  metadata->>'is_connected' as is_connected
FROM inbox_conversations
WHERE platform = 'linkedin'
ORDER BY last_message_at DESC
LIMIT 10;