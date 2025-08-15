-- Add business metrics tracking fields to contacts table
-- These fields will track the progression of each contact through the sales funnel

-- Add columns one by one to avoid syntax issues
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS connection_requested_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS connection_accepted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS first_message_sent_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS first_response_received_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS interest_expressed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS meeting_requested_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS meeting_scheduled_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS meeting_completed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS sales_stage TEXT DEFAULT 'prospect';
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS interaction_count INTEGER DEFAULT 0;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS last_interaction_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS interaction_type TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS business_metrics JSONB DEFAULT '{}';

-- Add check constraint for sales_stage
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contacts_sales_stage_check') THEN
    ALTER TABLE contacts ADD CONSTRAINT contacts_sales_stage_check 
    CHECK (sales_stage IN ('prospect', 'connected', 'contacted', 'interested', 'meeting_scheduled', 'meeting_completed', 'qualified', 'closed_won', 'closed_lost'));
  END IF;
END $$;

-- Add indexes for business metrics queries
CREATE INDEX IF NOT EXISTS idx_contacts_connection_accepted ON contacts(connection_accepted_at) WHERE connection_accepted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_interest_expressed ON contacts(interest_expressed_at) WHERE interest_expressed_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_meeting_scheduled ON contacts(meeting_scheduled_at) WHERE meeting_scheduled_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_sales_stage ON contacts(sales_stage);
CREATE INDEX IF NOT EXISTS idx_contacts_last_interaction ON contacts(last_interaction_at);

-- Create a function to update business metrics automatically
CREATE OR REPLACE FUNCTION update_contact_business_metrics()
RETURNS TRIGGER AS $$
BEGIN
  -- Update interaction count and last interaction time
  NEW.interaction_count = COALESCE(NEW.interaction_count, 0) + 1;
  NEW.last_interaction_at = NOW();
  
  -- Auto-update sales stage based on key milestones
  IF NEW.connection_accepted_at IS NOT NULL AND NEW.sales_stage = 'prospect' THEN
    NEW.sales_stage = 'connected';
  END IF;
  
  IF NEW.first_message_sent_at IS NOT NULL AND NEW.sales_stage = 'connected' THEN
    NEW.sales_stage = 'contacted';
  END IF;
  
  IF NEW.interest_expressed_at IS NOT NULL AND NEW.sales_stage IN ('connected', 'contacted') THEN
    NEW.sales_stage = 'interested';
  END IF;
  
  IF NEW.meeting_scheduled_at IS NOT NULL AND NEW.sales_stage = 'interested' THEN
    NEW.sales_stage = 'meeting_scheduled';
  END IF;
  
  IF NEW.meeting_completed_at IS NOT NULL AND NEW.sales_stage = 'meeting_scheduled' THEN
    NEW.sales_stage = 'meeting_completed';
  END IF;
  
  -- Update business_metrics JSONB with calculated data
  NEW.business_metrics = COALESCE(NEW.business_metrics, '{}') || jsonb_build_object(
    'days_in_funnel', EXTRACT(EPOCH FROM (NOW() - COALESCE(NEW.connection_requested_at, NEW.created_at))) / 86400,
    'response_time_hours', CASE 
      WHEN NEW.first_message_sent_at IS NOT NULL AND NEW.first_response_received_at IS NOT NULL 
      THEN EXTRACT(EPOCH FROM (NEW.first_response_received_at - NEW.first_message_sent_at)) / 3600
      ELSE NULL 
    END,
    'is_responsive', NEW.first_response_received_at IS NOT NULL,
    'stage_progression', ARRAY[
      CASE WHEN NEW.connection_accepted_at IS NOT NULL THEN 'connected' ELSE NULL END,
      CASE WHEN NEW.first_message_sent_at IS NOT NULL THEN 'contacted' ELSE NULL END,
      CASE WHEN NEW.interest_expressed_at IS NOT NULL THEN 'interested' ELSE NULL END,
      CASE WHEN NEW.meeting_scheduled_at IS NOT NULL THEN 'meeting_scheduled' ELSE NULL END
    ]
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update business metrics
DROP TRIGGER IF EXISTS trigger_update_contact_metrics ON contacts;
CREATE TRIGGER trigger_update_contact_metrics
  BEFORE UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_contact_business_metrics();

-- Create a view for easy business metrics reporting
CREATE OR REPLACE VIEW contact_business_metrics AS
SELECT 
  w.id as workspace_id,
  w.name as workspace_name,
  COUNT(*) as total_contacts,
  COUNT(CASE WHEN c.connection_accepted_at IS NOT NULL THEN 1 END) as connections_accepted,
  COUNT(CASE WHEN c.interest_expressed_at IS NOT NULL THEN 1 END) as interested_contacts,
  COUNT(CASE WHEN c.meeting_scheduled_at IS NOT NULL THEN 1 END) as meetings_scheduled,
  COUNT(CASE WHEN c.meeting_completed_at IS NOT NULL THEN 1 END) as meetings_completed,
  COUNT(CASE WHEN c.first_response_received_at IS NOT NULL THEN 1 END) as responsive_contacts,
  ROUND(AVG(c.engagement_score), 1) as avg_engagement_score,
  COUNT(CASE WHEN c.connection_accepted_at > NOW() - INTERVAL '7 days' THEN 1 END) as new_connections_this_week,
  COUNT(CASE WHEN c.interest_expressed_at > NOW() - INTERVAL '7 days' THEN 1 END) as new_interested_this_week,
  COUNT(CASE WHEN c.meeting_scheduled_at > NOW() - INTERVAL '7 days' THEN 1 END) as new_meetings_this_week
FROM workspaces w
LEFT JOIN contacts c ON c.workspace_id = w.id
GROUP BY w.id, w.name;

-- Grant access to the view
GRANT SELECT ON contact_business_metrics TO authenticated;

-- Create a function to get business metrics for a specific workspace
CREATE OR REPLACE FUNCTION get_workspace_business_metrics(p_workspace_id UUID)
RETURNS TABLE(
  total_messages BIGINT,
  connections_accepted BIGINT,
  interested_contacts BIGINT,
  meetings_booked BIGINT,
  connections_this_week BIGINT,
  interested_this_week BIGINT,
  meetings_this_week BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM inbox_conversations WHERE workspace_id = p_workspace_id) as total_messages,
    (SELECT COUNT(*) FROM contacts WHERE workspace_id = p_workspace_id AND connection_accepted_at IS NOT NULL) as connections_accepted,
    (SELECT COUNT(*) FROM contacts WHERE workspace_id = p_workspace_id AND interest_expressed_at IS NOT NULL) as interested_contacts,
    (SELECT COUNT(*) FROM contacts WHERE workspace_id = p_workspace_id AND meeting_scheduled_at IS NOT NULL) as meetings_booked,
    (SELECT COUNT(*) FROM contacts WHERE workspace_id = p_workspace_id AND connection_accepted_at > NOW() - INTERVAL '7 days') as connections_this_week,
    (SELECT COUNT(*) FROM contacts WHERE workspace_id = p_workspace_id AND interest_expressed_at > NOW() - INTERVAL '7 days') as interested_this_week,
    (SELECT COUNT(*) FROM contacts WHERE workspace_id = p_workspace_id AND meeting_scheduled_at > NOW() - INTERVAL '7 days') as meetings_this_week;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_workspace_business_metrics TO authenticated;

COMMENT ON TABLE contacts IS 'Enhanced with business metrics tracking for sales funnel progression';
COMMENT ON FUNCTION get_workspace_business_metrics IS 'Returns real-time business metrics for a workspace including connections, interested contacts, and meetings';