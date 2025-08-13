-- Populate Analytics Data for Testing
-- This script adds sample data to campaigns and messages tables

-- Add more test campaigns
INSERT INTO campaigns (
  tenant_id,
  name,
  type,
  status,
  total_sent,
  total_responses,
  total_connections,
  success_rate,
  created_at
) VALUES 
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Q1 2025 Enterprise Outreach', 'linkedin', 'active', 450, 95, 67, 21.1, NOW() - INTERVAL '7 days'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'SaaS Decision Makers', 'linkedin', 'active', 325, 78, 45, 24.0, NOW() - INTERVAL '14 days'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Tech Leaders Campaign', 'linkedin', 'completed', 680, 156, 98, 22.9, NOW() - INTERVAL '30 days'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Startup Founders', 'linkedin', 'paused', 215, 43, 28, 20.0, NOW() - INTERVAL '21 days'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Financial Services', 'linkedin', 'active', 390, 89, 55, 22.8, NOW() - INTERVAL '5 days')
ON CONFLICT DO NOTHING;

-- Add sample messages for the campaigns
WITH campaign_ids AS (
  SELECT id, name, total_sent 
  FROM campaigns 
  WHERE tenant_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
  LIMIT 5
)
INSERT INTO messages (
  workspace_id,
  campaign_id,
  contact_id,
  content,
  status,
  opened_at,
  replied_at,
  created_at
)
SELECT 
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890' as workspace_id,
  c.id as campaign_id,
  gen_random_uuid() as contact_id,
  'Sample outreach message for ' || c.name as content,
  CASE 
    WHEN random() < 0.2 THEN 'replied'
    WHEN random() < 0.6 THEN 'opened'
    ELSE 'sent'
  END as status,
  CASE 
    WHEN random() < 0.6 THEN NOW() - INTERVAL '1 day' * floor(random() * 7)
    ELSE NULL
  END as opened_at,
  CASE 
    WHEN random() < 0.2 THEN NOW() - INTERVAL '1 day' * floor(random() * 7)
    ELSE NULL
  END as replied_at,
  NOW() - INTERVAL '1 day' * floor(random() * 30) as created_at
FROM campaign_ids c,
     generate_series(1, LEAST(c.total_sent, 50)) as i
ON CONFLICT DO NOTHING;

-- Add more contacts for analytics
INSERT INTO contacts (
  workspace_id,
  email,
  first_name,
  last_name,
  title,
  department,
  linkedin_url,
  engagement_score
)
SELECT
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890' as workspace_id,
  'contact' || i || '@example.com' as email,
  'Contact' as first_name,
  'Number' || i as last_name,
  CASE 
    WHEN i % 5 = 0 THEN 'CEO'
    WHEN i % 5 = 1 THEN 'CTO'
    WHEN i % 5 = 2 THEN 'VP Sales'
    WHEN i % 5 = 3 THEN 'Director'
    ELSE 'Manager'
  END as title,
  CASE 
    WHEN i % 4 = 0 THEN 'Executive'
    WHEN i % 4 = 1 THEN 'Technology'
    WHEN i % 4 = 2 THEN 'Sales'
    ELSE 'Marketing'
  END as department,
  'https://linkedin.com/in/contact' || i as linkedin_url,
  floor(random() * 100) as engagement_score
FROM generate_series(1, 100) as i
ON CONFLICT (workspace_id, email) DO NOTHING;

-- Verify the data
SELECT 
  'Campaigns' as table_name, 
  COUNT(*) as count 
FROM campaigns
UNION ALL
SELECT 
  'Messages' as table_name, 
  COUNT(*) as count 
FROM messages
UNION ALL
SELECT 
  'Contacts' as table_name, 
  COUNT(*) as count 
FROM contacts;