-- Update Campaign Types for SAM AI
-- Support the actual campaign types from the platform (excluding Builder)

-- Update the campaign type constraint to include all SAM AI campaign types
ALTER TABLE campaigns DROP CONSTRAINT IF EXISTS campaigns_type_check;
ALTER TABLE campaigns ADD CONSTRAINT campaigns_type_check CHECK (
    type IN (
        'mobile_connector',
        'connector', 
        'messenger',
        'open_inmail',
        'event_invite',
        'company_follow_invite',
        'group',
        'inbound',
        'event_participants',
        'recovery'
    )
);

-- Add campaign-specific configuration fields
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS daily_connection_limit INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS requires_2fa BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS messaging_sequence JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS follow_up_days INTEGER[] DEFAULT ARRAY[1, 3, 7],
ADD COLUMN IF NOT EXISTS profile_visit_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS company_follow_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS event_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS linkedin_group_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS recovery_timeframe_days INTEGER DEFAULT 30;

-- Create campaign type templates with specific rules
INSERT INTO campaigns (
    tenant_id, user_id, name, description, type, status,
    connection_required, premium_required, email_required,
    max_connection_degree, min_profile_completeness, daily_connection_limit,
    allowed_search_sources, requires_2fa, settings
) VALUES 
-- Mobile Connector Template
(
    (SELECT id FROM tenants LIMIT 1),
    (SELECT id FROM users LIMIT 1),
    'Mobile Connector Template',
    'Send additional 10-15 connection requests per day via mobile',
    'mobile_connector',
    'draft',
    false, false, false,
    '3rd', 60, 15,
    ARRAY['basic_search', 'sales_navigator', 'post_engagement'],
    false,
    '{"mobile_only": true, "daily_limit": 15, "connection_note_required": true}'
),

-- Connector Template  
(
    (SELECT id FROM tenants LIMIT 1),
    (SELECT id FROM users LIMIT 1),
    'Connector Template',
    'Reach out to 2nd and 3rd+ degree connections with personalised requests',
    'connector',
    'draft',
    false, false, false,
    '3rd', 70, 100,
    ARRAY['basic_search', 'sales_navigator', 'recruiter_search'],
    true,
    '{"personalization_required": true, "follow_up_sequence": true}'
),

-- Messenger Template
(
    (SELECT id FROM tenants LIMIT 1),
    (SELECT id FROM users LIMIT 1),
    'Messenger Template', 
    'Send direct messages to contacts that approved your request',
    'messenger',
    'draft',
    true, false, false,
    '1st', 0, 50,
    ARRAY['basic_search', 'sales_navigator'],
    false,
    '{"requires_accepted_connection": true, "message_sequence": true}'
),

-- Open InMail Template
(
    (SELECT id FROM tenants LIMIT 1),
    (SELECT id FROM users LIMIT 1),
    'Open InMail Template',
    'Send messages to prospects without connection request',
    'open_inmail',
    'draft',
    false, true, false,
    null, 80, 25,
    ARRAY['sales_navigator', 'recruiter_search'],
    false,
    '{"premium_required": true, "inmail_credits": true}'
),

-- Event Invite Template
(
    (SELECT id FROM tenants LIMIT 1),
    (SELECT id FROM users LIMIT 1),
    'Event Invite Template',
    'Invite first-degree connections to LinkedIn events',
    'event_invite', 
    'draft',
    true, false, false,
    '1st', 0, 200,
    ARRAY['basic_search'],
    false,
    '{"event_required": true, "first_degree_only": true}'
),

-- Company Follow Template
(
    (SELECT id FROM tenants LIMIT 1),
    (SELECT id FROM users LIMIT 1),
    'Company Follow Template',
    'Invite 1st degree connections to follow your company',
    'company_follow_invite',
    'draft',
    true, false, false,
    '1st', 0, 100,
    ARRAY['basic_search', 'sales_navigator'],
    false,
    '{"company_page_required": true, "first_degree_only": true}'
),

-- Group Template
(
    (SELECT id FROM tenants LIMIT 1),
    (SELECT id FROM users LIMIT 1),
    'Group Template',
    'Send message requests to fellow LinkedIn group members',
    'group',
    'draft',
    false, false, false,
    null, 50, 50,
    ARRAY['basic_search'],
    false,
    '{"group_membership_required": true, "same_group_only": true}'
),

-- Inbound Template
(
    (SELECT id FROM tenants LIMIT 1),
    (SELECT id FROM users LIMIT 1),
    'Inbound Template',
    'Outreach users who have viewed your profile',
    'inbound',
    'draft',
    false, false, false,
    null, 40, 30,
    ARRAY['post_engagement'],
    false,
    '{"profile_visitors_only": true, "recent_visitors": true}'
),

-- Event Participants Template
(
    (SELECT id FROM tenants LIMIT 1),
    (SELECT id FROM users LIMIT 1),
    'Event Participants Template',
    'Send message requests to event participants',
    'event_participants',
    'draft',
    false, false, false,
    null, 60, 40,
    ARRAY['basic_search'],
    false,
    '{"event_participation_required": true, "same_event_only": true}'
),

-- Recovery Template
(
    (SELECT id FROM tenants LIMIT 1),
    (SELECT id FROM users LIMIT 1),
    'Recovery Template',
    'Recover contacts and continue previous conversations',
    'recovery',
    'draft',
    false, false, false,
    null, 0, 20,
    ARRAY['csv_upload'],
    false,
    '{"previous_contact_required": true, "recovery_timeframe": 30}'
)
ON CONFLICT (tenant_id, name) DO NOTHING;

-- Update existing campaigns to use new types (example migration)
UPDATE campaigns 
SET type = 'connector', 
    description = 'Reach out to 2nd and 3rd+ degree connections with personalised requests',
    requires_2fa = true,
    settings = '{"personalization_required": true, "follow_up_sequence": true}'
WHERE type = 'connection_request';

-- Create campaign type validation function
CREATE OR REPLACE FUNCTION validate_campaign_type_requirements(
    campaign_type VARCHAR(50),
    lead_connection_degree VARCHAR(20),
    lead_premium_account BOOLEAN,
    campaign_settings JSONB
) RETURNS BOOLEAN AS $$
BEGIN
    CASE campaign_type
        WHEN 'mobile_connector' THEN
            -- Mobile connector: any connection degree, lower daily limits
            RETURN true;
            
        WHEN 'connector' THEN 
            -- Connector: 2nd and 3rd degree connections
            RETURN lead_connection_degree IN ('2nd', '3rd');
            
        WHEN 'messenger' THEN
            -- Messenger: only 1st degree (accepted connections)
            RETURN lead_connection_degree = '1st';
            
        WHEN 'open_inmail' THEN
            -- Open InMail: requires premium, any connection degree
            RETURN lead_premium_account = true;
            
        WHEN 'event_invite' THEN
            -- Event invite: only 1st degree connections
            RETURN lead_connection_degree = '1st';
            
        WHEN 'company_follow_invite' THEN
            -- Company follow: only 1st degree connections
            RETURN lead_connection_degree = '1st';
            
        WHEN 'group' THEN
            -- Group messages: any degree if same group
            RETURN true; -- Additional group validation would be needed
            
        WHEN 'inbound' THEN
            -- Inbound: profile visitors, any degree
            RETURN true;
            
        WHEN 'event_participants' THEN
            -- Event participants: any degree if same event
            RETURN true;
            
        WHEN 'recovery' THEN
            -- Recovery: any degree if previous contact exists
            RETURN true;
            
        ELSE
            RETURN false;
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Test the validation function
SELECT 
    type,
    name,
    validate_campaign_type_requirements(
        type, 
        '2nd'::VARCHAR(20), 
        false::BOOLEAN, 
        settings
    ) as accepts_2nd_degree_non_premium
FROM campaigns 
WHERE type IS NOT NULL
ORDER BY type;