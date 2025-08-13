-- Add Sample Contacts for Testing
-- Uses the default workspace ID for dev mode

-- Clear existing test contacts first (optional)
-- DELETE FROM contacts WHERE workspace_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

-- Insert sample contacts
INSERT INTO contacts (
  workspace_id,
  email,
  first_name,
  last_name,
  title,
  department,
  phone,
  linkedin_url,
  engagement_score,
  tags,
  metadata
) VALUES 
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'john.smith@techcorp.com', 'John', 'Smith', 'VP of Sales', 'Sales', '+1-555-0101', 'https://linkedin.com/in/johnsmith', 85, ARRAY['hot-lead', 'decision-maker'], '{"company": "TechCorp", "location": "San Francisco, CA"}'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'sarah.johnson@innovate.io', 'Sarah', 'Johnson', 'Director of Marketing', 'Marketing', '+1-555-0102', 'https://linkedin.com/in/sarahjohnson', 72, ARRAY['qualified', 'marketing'], '{"company": "Innovate.io", "location": "New York, NY"}'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'michael.chen@enterprise.com', 'Michael', 'Chen', 'CTO', 'Technology', '+1-555-0103', 'https://linkedin.com/in/michaelchen', 90, ARRAY['hot-lead', 'c-suite', 'tech'], '{"company": "Enterprise Solutions", "location": "Austin, TX"}'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'emily.davis@startup.co', 'Emily', 'Davis', 'Product Manager', 'Product', '+1-555-0104', 'https://linkedin.com/in/emilydavis', 65, ARRAY['prospect', 'product'], '{"company": "StartupCo", "location": "Seattle, WA"}'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'robert.wilson@finance.com', 'Robert', 'Wilson', 'CFO', 'Finance', '+1-555-0105', 'https://linkedin.com/in/robertwilson', 78, ARRAY['qualified', 'c-suite', 'finance'], '{"company": "Finance Corp", "location": "Chicago, IL"}'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'lisa.anderson@retail.net', 'Lisa', 'Anderson', 'Head of Operations', 'Operations', '+1-555-0106', 'https://linkedin.com/in/lisaanderson', 70, ARRAY['qualified', 'operations'], '{"company": "Retail Network", "location": "Los Angeles, CA"}'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'james.taylor@consulting.com', 'James', 'Taylor', 'Senior Consultant', 'Consulting', '+1-555-0107', 'https://linkedin.com/in/jamestaylor', 60, ARRAY['prospect'], '{"company": "Consulting Group", "location": "Boston, MA"}'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'maria.garcia@healthcare.org', 'Maria', 'Garcia', 'VP of Strategy', 'Strategy', '+1-555-0108', 'https://linkedin.com/in/mariagarcia', 82, ARRAY['hot-lead', 'healthcare', 'strategy'], '{"company": "Healthcare Innovations", "location": "Miami, FL"}'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'david.brown@manufacturing.com', 'David', 'Brown', 'Operations Manager', 'Operations', '+1-555-0109', 'https://linkedin.com/in/davidbrown', 55, ARRAY['prospect', 'manufacturing'], '{"company": "Manufacturing Co", "location": "Detroit, MI"}'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'jennifer.lee@education.edu', 'Jennifer', 'Lee', 'Director of Technology', 'Technology', '+1-555-0110', 'https://linkedin.com/in/jenniferlee', 75, ARRAY['qualified', 'education', 'tech'], '{"company": "Education Institute", "location": "Phoenix, AZ"}')
ON CONFLICT (workspace_id, email) DO UPDATE
SET 
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  title = EXCLUDED.title,
  department = EXCLUDED.department,
  phone = EXCLUDED.phone,
  linkedin_url = EXCLUDED.linkedin_url,
  engagement_score = EXCLUDED.engagement_score,
  tags = EXCLUDED.tags,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- Verify the contacts were added
SELECT COUNT(*) as total_contacts FROM contacts WHERE workspace_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';