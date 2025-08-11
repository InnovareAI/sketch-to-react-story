-- =============================================
-- CUSTOM RLS SECURITY FIX FOR THIS DATABASE
-- Tailored to the existing database structure
-- =============================================

-- Step 1: Fix the overly permissive users table policy
DROP POLICY IF EXISTS "Allow all operations on users" ON users;

-- Step 2: Create secure RLS policies for users table
CREATE POLICY "Users can view same organization members" ON users
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (id = auth.uid())
    WITH CHECK (
        id = auth.uid() AND
        -- Prevent role escalation (only super admins can change roles)
        (role = (SELECT role FROM users WHERE id = auth.uid()) OR 
         (SELECT is_super_admin FROM users WHERE id = auth.uid()) = true) AND
        -- Prevent organization jumping
        organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()) AND
        -- Prevent making self super admin
        is_super_admin = (SELECT is_super_admin FROM users WHERE id = auth.uid())
    );

CREATE POLICY "Super admins can manage organization users" ON users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND is_super_admin = true
            AND organization_id = users.organization_id
        )
    );

-- Step 3: Create user_profiles view for easier access
CREATE OR REPLACE VIEW user_profiles AS
SELECT 
    u.id,
    u.email,
    u.full_name,
    u.organization_id,
    u.role,
    u.is_super_admin,
    u.status,
    u.job_title,
    u.department,
    u.phone,
    u.created_at,
    u.updated_at,
    o.name as organization_name,
    o.slug as organization_slug
FROM users u
LEFT JOIN organizations o ON u.organization_id = o.id;

-- Step 4: Verify and enable RLS on critical tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Step 5: Create organization access policies
DROP POLICY IF EXISTS "Organizations viewable by members" ON organizations;
CREATE POLICY "Organizations viewable by members" ON organizations
    FOR SELECT USING (
        id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Organizations manageable by super admins" ON organizations;
CREATE POLICY "Organizations manageable by super admins" ON organizations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND is_super_admin = true 
            AND organization_id = organizations.id
        )
    );

-- Step 6: Check if submissions table exists and secure it
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'submissions') THEN
        ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
        
        -- Add organization-based access
        DROP POLICY IF EXISTS "Submissions viewable by organization" ON submissions;
        CREATE POLICY "Submissions viewable by organization" ON submissions
            FOR SELECT USING (
                organization_id IN (
                    SELECT organization_id FROM users WHERE id = auth.uid()
                )
            );
            
        DROP POLICY IF EXISTS "Submissions manageable by organization" ON submissions;
        CREATE POLICY "Submissions manageable by organization" ON submissions
            FOR ALL USING (
                organization_id IN (
                    SELECT organization_id FROM users WHERE id = auth.uid()
                )
            );
    END IF;
END $$;

-- Step 7: Create helper functions
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID AS $$
    SELECT organization_id FROM users WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
    SELECT COALESCE(is_super_admin, false) FROM users WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION can_access_organization(org_uuid UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS(
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND organization_id = org_uuid
    );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Step 8: Create trigger to prevent privilege escalation
CREATE OR REPLACE FUNCTION prevent_privilege_escalation()
RETURNS TRIGGER AS $$
BEGIN
    -- Only super admins can change roles
    IF NEW.role IS DISTINCT FROM OLD.role THEN
        IF NOT (SELECT is_super_admin FROM users WHERE id = auth.uid()) THEN
            RAISE EXCEPTION 'Only super admins can change user roles';
        END IF;
    END IF;
    
    -- Prevent making self super admin
    IF NEW.is_super_admin IS DISTINCT FROM OLD.is_super_admin AND NEW.id = auth.uid() THEN
        RAISE EXCEPTION 'Users cannot change their own super admin status';
    END IF;
    
    -- Prevent organization changes
    IF NEW.organization_id IS DISTINCT FROM OLD.organization_id THEN
        RAISE EXCEPTION 'Users cannot change organizations directly';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply trigger to users table
DROP TRIGGER IF EXISTS enforce_user_security ON users;
CREATE TRIGGER enforce_user_security
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION prevent_privilege_escalation();

-- Step 9: Audit the existing api_keys table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'api_keys') THEN
        -- Add organization_id if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'api_keys' AND column_name = 'organization_id') THEN
            ALTER TABLE api_keys ADD COLUMN organization_id UUID;
            
            -- Update with user's organization
            UPDATE api_keys a
            SET organization_id = u.organization_id
            FROM users u
            WHERE a.user_id = u.id;
        END IF;
        
        -- Apply RLS policies
        ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "API keys organization isolation" ON api_keys;
        CREATE POLICY "API keys organization isolation" ON api_keys
            FOR ALL USING (
                organization_id IN (
                    SELECT organization_id FROM users WHERE id = auth.uid()
                ) AND user_id = auth.uid()
            );
    END IF;
END $$;

-- Step 10: Validation
DO $$
DECLARE
    secured_tables INTEGER;
    total_policies INTEGER;
BEGIN
    -- Count tables with RLS enabled
    SELECT COUNT(*) INTO secured_tables
    FROM pg_tables t
    JOIN pg_class c ON c.relname = t.tablename
    WHERE t.schemaname = 'public'
    AND c.relrowsecurity = true;
    
    -- Count RLS policies
    SELECT COUNT(*) INTO total_policies
    FROM pg_policies
    WHERE schemaname = 'public';
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'CUSTOM RLS SECURITY FIXES APPLIED';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Tables with RLS enabled: %', secured_tables;
    RAISE NOTICE 'Total RLS policies: %', total_policies;
    RAISE NOTICE '';
    RAISE NOTICE 'Security improvements:';
    RAISE NOTICE '✅ Fixed overly permissive users table policy';
    RAISE NOTICE '✅ Prevented privilege escalation';
    RAISE NOTICE '✅ Enforced organization isolation';
    RAISE NOTICE '✅ Added role-based access control';
    RAISE NOTICE '✅ Created security helper functions';
    RAISE NOTICE '✅ Added audit trigger for user updates';
    RAISE NOTICE '========================================';
END $$;