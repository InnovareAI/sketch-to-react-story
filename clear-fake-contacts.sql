-- Clear all fake test contacts from the database
-- Run this with: PGPASSWORD=TFyp3VGohZHBqhmP psql -h db.latxadqrvrrrcvkktrog.supabase.co -p 5432 -U postgres postgres -f clear-fake-contacts.sql

-- Delete all numbered fake contacts
DELETE FROM contacts 
WHERE (
  (email LIKE 'contact%@example.com' AND first_name = 'Contact' AND last_name LIKE 'Number%')
  OR email = 'test.import@example.com'
  OR email LIKE '%@example.com'
);

-- Show remaining contacts
SELECT 
  workspace_id,
  COUNT(*) as contact_count,
  array_agg(email ORDER BY email) as emails
FROM contacts
GROUP BY workspace_id;