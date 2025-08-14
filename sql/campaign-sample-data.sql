-- Sample data for campaign management system
-- Insert test campaigns, prospects, and related data

-- Test workspace (assuming exists)
-- Will use existing workspace: df5d730f-1915-4269-bd5a-9534478b17af

-- =============================================
-- SAMPLE CAMPAIGNS
-- =============================================

-- Insert sample campaigns
INSERT INTO campaigns (
    id,
    workspace_id,
    name,
    description,
    type,
    channel,
    status,
    campaign_steps,
    total_steps,
    target_audience,
    daily_limit,
    created_by
) VALUES 
(
    '11111111-1111-1111-1111-111111111111',
    'df5d730f-1915-4269-bd5a-9534478b17af',
    'SaaS CTO Outreach Q1',
    'Targeting CTOs and VPs of Engineering at SaaS companies for our AI automation platform',
    'linkedin',
    'linkedin', 
    'draft',
    '[
        {
            "id": "step_1",
            "type": "connection",
            "name": "Connection Request",
            "content": "Hi {first_name}, I noticed you''re leading technology at {company_name}. I''d love to connect and share insights about AI automation in the SaaS space.",
            "delay": 0,
            "delayUnit": "hours"
        },
        {
            "id": "step_2", 
            "type": "follow_up",
            "name": "Value Introduction",
            "content": "Thanks for connecting, {first_name}! I wanted to reach out because I''ve been helping SaaS CTOs like yourself reduce operational costs by 40% through AI automation. Would you be open to a brief conversation about your current challenges?",
            "delay": 2,
            "delayUnit": "days"
        },
        {
            "id": "step_3",
            "type": "follow_up", 
            "name": "Case Study Share",
            "content": "Hi {first_name}, I hope you''re doing well. I just helped a similar SaaS company (100+ employees) automate their customer onboarding process, reducing manual work by 60%. Would you like to see how this might apply to {company_name}?",
            "delay": 5,
            "delayUnit": "days"
        }
    ]'::jsonb,
    3,
    '{
        "job_titles": ["CTO", "VP Engineering", "Head of Technology", "Chief Technology Officer"],
        "company_types": ["SaaS", "Software", "Technology"],
        "company_size": "50-500",
        "location": "United States"
    }'::jsonb,
    25,
    'cc000000-0000-0000-0000-000000000002'
),
(
    '22222222-2222-2222-2222-222222222222',
    'df5d730f-1915-4269-bd5a-9534478b17af',
    'Fintech Founders Network',
    'Building relationships with fintech startup founders and CEOs',
    'linkedin',
    'linkedin',
    'active', 
    '[
        {
            "id": "step_1",
            "type": "connection",
            "name": "Founder Connect",
            "content": "Hi {first_name}, Fellow entrepreneur here! I''ve been following {company_name}''s journey in fintech. Would love to connect and potentially collaborate.",
            "delay": 0,
            "delayUnit": "hours"
        },
        {
            "id": "step_2",
            "type": "follow_up", 
            "name": "Industry Insights",
            "content": "Thanks for connecting, {first_name}! The fintech space is moving so fast right now. I''d love to hear your thoughts on where you see the industry heading, especially around AI integration.",
            "delay": 3,
            "delayUnit": "days"
        }
    ]'::jsonb,
    2,
    '{
        "job_titles": ["CEO", "Founder", "Co-founder"],
        "company_types": ["Fintech", "Financial Services", "Banking"],
        "company_size": "10-100",
        "location": "United States, United Kingdom"
    }'::jsonb,
    15,
    'cc000000-0000-0000-0000-000000000001'
);

-- =============================================
-- SAMPLE PROSPECTS
-- =============================================

-- Insert sample prospects
INSERT INTO prospects (
    id,
    workspace_id,
    linkedin_profile_id,
    linkedin_url,
    full_name,
    first_name,
    last_name,
    email,
    current_title,
    current_company,
    headline,
    industry,
    location,
    experience,
    connections_count,
    data_completeness_score,
    engagement_score,
    source,
    created_by
) VALUES 
(
    '33333333-3333-3333-3333-333333333333',
    'df5d730f-1915-4269-bd5a-9534478b17af',
    'john-smith-cto-salesforce',
    'https://linkedin.com/in/john-smith-cto-salesforce',
    'John Smith',
    'John', 
    'Smith',
    'john.smith@salesforce.com',
    'Chief Technology Officer',
    'Salesforce',
    'CTO at Salesforce | Building the future of customer relationships',
    'Software',
    'San Francisco, CA',
    '[
        {
            "title": "Chief Technology Officer",
            "company": "Salesforce",
            "duration": "2020-Present",
            "description": "Leading technology strategy and engineering teams"
        },
        {
            "title": "VP of Engineering", 
            "company": "Salesforce",
            "duration": "2018-2020",
            "description": "Scaled engineering team from 50 to 200+"
        }
    ]'::jsonb,
    2500,
    85,
    9,
    'search',
    'cc000000-0000-0000-0000-000000000002'
),
(
    '44444444-4444-4444-4444-444444444444',
    'df5d730f-1915-4269-bd5a-9534478b17af',
    'sarah-chen-vp-engineering-slack',
    'https://linkedin.com/in/sarah-chen-vp-engineering-slack',
    'Sarah Chen',
    'Sarah',
    'Chen', 
    'sarah.chen@slack.com',
    'VP of Engineering',
    'Slack',
    'VP Engineering at Slack | Scaling distributed teams and systems',
    'Software',
    'San Francisco, CA',
    '[
        {
            "title": "VP of Engineering",
            "company": "Slack", 
            "duration": "2021-Present",
            "description": "Leading engineering for collaboration tools"
        },
        {
            "title": "Senior Director of Engineering",
            "company": "Slack",
            "duration": "2019-2021", 
            "description": "Built platform infrastructure team"
        }
    ]'::jsonb,
    1800,
    90,
    8,
    'search',
    'cc000000-0000-0000-0000-000000000002'
),
(
    '55555555-5555-5555-5555-555555555555',
    'df5d730f-1915-4269-bd5a-9534478b17af',
    'mike-rodriguez-founder-stripe',
    'https://linkedin.com/in/mike-rodriguez-founder-stripe',
    'Mike Rodriguez',
    'Mike',
    'Rodriguez',
    null, -- No email found
    'Co-founder & CTO',
    'Stripe',
    'Co-founder & CTO at Stripe | Building financial infrastructure for the internet',
    'Financial Services',
    'San Francisco, CA',
    '[
        {
            "title": "Co-founder & CTO",
            "company": "Stripe",
            "duration": "2016-Present",
            "description": "Co-founded and scaled payments infrastructure"
        }
    ]'::jsonb,
    3200,
    75,
    10,
    'manual',
    'cc000000-0000-0000-0000-000000000001'
);

-- =============================================
-- CAMPAIGN-PROSPECT RELATIONSHIPS
-- =============================================

-- Link prospects to campaigns
INSERT INTO campaign_prospects (
    campaign_id,
    prospect_id,
    status,
    review_score,
    approved_by,
    approved_at
) VALUES 
(
    '11111111-1111-1111-1111-111111111111',
    '33333333-3333-3333-3333-333333333333',
    'approved',
    9,
    'cc000000-0000-0000-0000-000000000002',
    NOW()
),
(
    '11111111-1111-1111-1111-111111111111', 
    '44444444-4444-4444-4444-444444444444',
    'approved',
    8,
    'cc000000-0000-0000-0000-000000000002',
    NOW()
),
(
    '22222222-2222-2222-2222-222222222222',
    '55555555-5555-5555-5555-555555555555',
    'pending_review',
    null,
    null,
    null
);

-- =============================================
-- SAMPLE EXTRACTION JOB
-- =============================================

-- Insert sample extraction job
INSERT INTO extraction_jobs (
    id,
    workspace_id,
    campaign_id,
    job_type,
    source_type,
    status,
    total_records,
    processed_records,
    successful_records,
    failed_records,
    estimated_cost,
    actual_cost,
    started_at,
    completed_at,
    created_by
) VALUES (
    '66666666-6666-6666-6666-666666666666',
    'df5d730f-1915-4269-bd5a-9534478b17af',
    '11111111-1111-1111-1111-111111111111',
    'prospect_extraction',
    'linkedin',
    'completed',
    50,
    50,
    47,
    3,
    5.00,
    4.70,
    NOW() - INTERVAL '2 hours',
    NOW() - INTERVAL '1 hour',
    'cc000000-0000-0000-0000-000000000002'
);

-- =============================================
-- CAMPAIGN STEP TEMPLATES
-- =============================================

-- Insert step templates
INSERT INTO campaign_step_templates (
    workspace_id,
    name,
    category,
    step_type,
    content_template,
    default_delay,
    default_delay_unit
) VALUES 
(
    'df5d730f-1915-4269-bd5a-9534478b17af',
    'SaaS CTO Connection',
    'saas_outreach',
    'connection',
    'Hi {first_name}, I noticed you''re leading technology at {company_name}. I''d love to connect and share insights about {industry} innovation.',
    0,
    'hours'
),
(
    'df5d730f-1915-4269-bd5a-9534478b17af',
    'Value Prop Follow-up',
    'follow_up',
    'follow_up',
    'Thanks for connecting, {first_name}! I''ve been helping {job_title}s like yourself at {company_size} companies achieve {value_proposition}. Would you be open to a brief conversation?',
    2,
    'days'
),
(
    'df5d730f-1915-4269-bd5a-9534478b17af',
    'Case Study Share',
    'social_proof',
    'follow_up',
    'Hi {first_name}, I just helped a similar {industry} company reduce {pain_point} by {improvement_percentage}%. Would you like to see how this might apply to {company_name}?',
    5,
    'days'
);

-- =============================================
-- SAMPLE CAMPAIGN MESSAGES
-- =============================================

-- Insert sample messages sent
INSERT INTO campaign_messages (
    campaign_id,
    prospect_id,
    step_number,
    step_name,
    message_type,
    message_content,
    status,
    sent_at
) VALUES 
(
    '11111111-1111-1111-1111-111111111111',
    '33333333-3333-3333-3333-333333333333',
    1,
    'Connection Request',
    'linkedin_connection',
    'Hi John, I noticed you''re leading technology at Salesforce. I''d love to connect and share insights about AI automation in the SaaS space.',
    'sent',
    NOW() - INTERVAL '12 hours'
),
(
    '22222222-2222-2222-2222-222222222222',
    '55555555-5555-5555-5555-555555555555',
    1,
    'Founder Connect',
    'linkedin_connection',
    'Hi Mike, Fellow entrepreneur here! I''ve been following Stripe''s journey in fintech. Would love to connect and potentially collaborate.',
    'delivered',
    NOW() - INTERVAL '6 hours'
);

-- =============================================
-- SAMPLE ANALYTICS DATA
-- =============================================

-- Insert daily analytics
INSERT INTO campaign_analytics_daily (
    campaign_id,
    date,
    messages_sent,
    connections_made,
    responses_received,
    positive_responses,
    click_through_rate,
    response_rate,
    conversion_rate
) VALUES 
(
    '11111111-1111-1111-1111-111111111111',
    CURRENT_DATE - INTERVAL '1 day',
    25,
    18,
    3,
    2,
    0.12,
    0.16,
    0.08
),
(
    '22222222-2222-2222-2222-222222222222',
    CURRENT_DATE - INTERVAL '1 day', 
    15,
    12,
    5,
    4,
    0.20,
    0.33,
    0.27
);

-- Success message
DO $$
BEGIN
    RAISE NOTICE '🎉 Sample campaign data inserted successfully!';
    RAISE NOTICE '📊 Created 2 sample campaigns with different configurations';
    RAISE NOTICE '👥 Added 3 sample prospects with realistic LinkedIn profiles';
    RAISE NOTICE '🔗 Linked prospects to campaigns with approval status';
    RAISE NOTICE '⚙️ Added extraction job, step templates, and message history';  
    RAISE NOTICE '📈 Included sample analytics data for testing dashboards';
    RAISE NOTICE '✅ Campaign database is ready for React integration!';
END $$;