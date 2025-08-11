-- Test Campaign Rules Integration
-- Insert test data and verify the campaign rules engine integration

-- Get the first tenant/workspace for testing
\set tenant_id (SELECT id FROM tenants LIMIT 1)

-- Insert test campaigns with enhanced fields
UPDATE campaigns 
SET 
    description = 'LinkedIn outreach for software professionals',
    type = 'connection_request',
    target_audience = 'tech_professionals',
    connection_required = false,
    premium_required = false,
    email_required = false,
    phone_required = false,
    min_mutual_connections = 5,
    max_connection_degree = '2nd',
    min_profile_completeness = 70,
    excluded_industries = ARRAY['Insurance', 'Real Estate'],
    excluded_titles = ARRAY['intern', 'student'],
    allowed_search_sources = ARRAY['basic_search', 'sales_navigator'],
    max_leads_per_day = 50,
    max_leads_total = 1000
WHERE id = (SELECT id FROM campaigns WHERE name IS NOT NULL LIMIT 1);

-- Insert test lead profiles with validation data
INSERT INTO lead_profiles (
    workspace_id, name, title, company, location, email, linkedin_url,
    connection_degree, premium_account, profile_completeness, 
    mutual_connections, search_source, quality_score, industry,
    seniority_level, additional_data
) VALUES 
(
    (SELECT id FROM tenants LIMIT 1),
    'Alex Rodriguez', 'Senior Software Engineer', 'TechFlow Solutions', 'Seattle, WA',
    'alex.r@techflow.com', 'https://linkedin.com/in/alexrodriguez',
    '2nd', false, 85, 12, 'basic_search', 0.88, 'Technology',
    'senior', '{"skills": ["React", "Node.js", "AWS"], "years_experience": 8}'
),
(
    (SELECT id FROM tenants LIMIT 1),
    'Jessica Wong', 'Marketing Director', 'GrowthCorp', 'Austin, TX',
    null, 'https://linkedin.com/in/jessicawong',
    '1st', true, 92, 25, 'sales_navigator', 0.94, 'Marketing',
    'director', '{"skills": ["Digital Marketing", "Analytics"], "years_experience": 12}'
),
(
    (SELECT id FROM tenants LIMIT 1),
    'David Kim', 'Data Science Intern', 'StartupXYZ', 'San Francisco, CA',
    'david.kim@student.edu', 'https://linkedin.com/in/davidkim',
    '3rd', false, 45, 2, 'post_engagement', 0.35, 'Technology',
    'entry', '{"skills": ["Python", "Machine Learning"], "years_experience": 0}'
)
ON CONFLICT (workspace_id, linkedin_url) DO NOTHING;

-- Test campaign assignment logic
INSERT INTO enhanced_campaign_assignments (
    campaign_id, lead_id, tenant_id, assigned_by, status, priority,
    validation_passed, validation_warnings, estimated_success_rate
) 
SELECT 
    c.id as campaign_id,
    lp.id as lead_id,
    c.tenant_id,
    c.user_id as assigned_by,
    'assigned' as status,
    1 as priority,
    (lp.quality_score > 0.7 AND lp.profile_completeness > 70) as validation_passed,
    CASE 
        WHEN lp.quality_score <= 0.7 THEN ARRAY['Low quality score']
        WHEN lp.profile_completeness <= 70 THEN ARRAY['Incomplete profile']
        ELSE ARRAY[]::TEXT[]
    END as validation_warnings,
    ROUND((lp.quality_score * 100)::numeric, 2) as estimated_success_rate
FROM campaigns c
CROSS JOIN lead_profiles lp
WHERE c.name IS NOT NULL
AND lp.workspace_id = c.tenant_id
LIMIT 3
ON CONFLICT (campaign_id, lead_id) DO NOTHING;

-- Verify the integration
SELECT 
    'CAMPAIGNS WITH RULES' as test_name,
    COUNT(*) as count
FROM campaigns 
WHERE type IS NOT NULL;

SELECT 
    'LEAD PROFILES' as test_name,
    COUNT(*) as count,
    AVG(quality_score) as avg_quality_score,
    AVG(profile_completeness) as avg_completeness
FROM lead_profiles;

SELECT 
    'CAMPAIGN ASSIGNMENTS' as test_name,
    COUNT(*) as count,
    COUNT(CASE WHEN validation_passed THEN 1 END) as passed_validation,
    AVG(estimated_success_rate) as avg_success_rate
FROM enhanced_campaign_assignments;

-- Test validation logic query
SELECT 
    c.name as campaign_name,
    c.type,
    c.max_connection_degree,
    c.min_profile_completeness,
    c.min_mutual_connections,
    lp.name as lead_name,
    lp.connection_degree,
    lp.profile_completeness,
    lp.mutual_connections,
    lp.quality_score,
    CASE 
        WHEN lp.connection_degree = ANY(ARRAY['1st', '2nd', '3rd']) 
            AND (c.max_connection_degree IS NULL OR lp.connection_degree <= c.max_connection_degree)
            AND (c.min_profile_completeness IS NULL OR lp.profile_completeness >= c.min_profile_completeness)
            AND (c.min_mutual_connections IS NULL OR lp.mutual_connections >= c.min_mutual_connections)
        THEN 'VALID'
        ELSE 'BLOCKED'
    END as validation_result
FROM campaigns c
CROSS JOIN lead_profiles lp
WHERE c.type IS NOT NULL
AND lp.workspace_id = c.tenant_id
LIMIT 5;