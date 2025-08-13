-- Update Workspace table to store Unipile credentials centrally
-- All features (Contacts, LinkedIn, Campaigns) will use these shared credentials

-- Add Unipile columns to workspaces table
ALTER TABLE workspaces 
ADD COLUMN IF NOT EXISTS unipile_account_id TEXT,
ADD COLUMN IF NOT EXISTS unipile_api_key TEXT,
ADD COLUMN IF NOT EXISTS unipile_dedicated_ip TEXT,
ADD COLUMN IF NOT EXISTS unipile_dsn TEXT,
ADD COLUMN IF NOT EXISTS integrations JSONB DEFAULT '{}';

-- Update existing workspaces with default Unipile credentials (for dev)
UPDATE workspaces 
SET 
  unipile_account_id = COALESCE(unipile_account_id, 'default-account'),
  unipile_api_key = COALESCE(unipile_api_key, 'TE3VJJ3-N3E63ND-MWXM462-RBPCWYQ'),
  unipile_dsn = COALESCE(unipile_dsn, 'api6.unipile.com:13443'),
  integrations = COALESCE(integrations, jsonb_build_object(
    'linkedin', jsonb_build_object(
      'connected', false,
      'account_id', null,
      'connected_at', null
    ),
    'email', jsonb_build_object(
      'connected', false,
      'provider', null,
      'account_id', null
    ),
    'calendar', jsonb_build_object(
      'connected', false,
      'provider', null,
      'account_id', null
    )
  ))
WHERE unipile_account_id IS NULL;

-- Create function to get workspace Unipile credentials
CREATE OR REPLACE FUNCTION get_workspace_unipile_credentials(p_workspace_id UUID)
RETURNS TABLE (
  account_id TEXT,
  api_key TEXT,
  dedicated_ip TEXT,
  dsn TEXT,
  linkedin_connected BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    w.unipile_account_id,
    w.unipile_api_key,
    w.unipile_dedicated_ip,
    w.unipile_dsn,
    (w.integrations->'linkedin'->>'connected')::boolean as linkedin_connected
  FROM workspaces w
  WHERE w.id = p_workspace_id;
END;
$$;

-- Grant permission to authenticated users
GRANT EXECUTE ON FUNCTION get_workspace_unipile_credentials TO authenticated;

-- Create trigger to ensure all contacts/campaigns use workspace's Unipile account
CREATE OR REPLACE FUNCTION ensure_shared_unipile_account()
RETURNS TRIGGER AS $$
DECLARE
  workspace_unipile_id TEXT;
  workspace_id_to_use UUID;
BEGIN
  -- Determine which field contains the workspace ID
  IF TG_TABLE_NAME = 'campaigns' THEN
    workspace_id_to_use := NEW.tenant_id;
  ELSE
    workspace_id_to_use := NEW.workspace_id;
  END IF;
  
  -- Get workspace's Unipile account
  SELECT unipile_account_id INTO workspace_unipile_id
  FROM workspaces
  WHERE id = workspace_id_to_use;
  
  -- For contacts/messages that have account_id as UUID, store in metadata
  IF TG_TABLE_NAME IN ('contacts', 'messages') AND workspace_unipile_id IS NOT NULL THEN
    NEW.metadata = jsonb_set(
      COALESCE(NEW.metadata, '{}'),
      '{unipile_account_id}',
      to_jsonb(workspace_unipile_id)
    );
  END IF;
  
  -- For campaigns, store in settings
  IF TG_TABLE_NAME = 'campaigns' AND workspace_unipile_id IS NOT NULL THEN
    NEW.settings = jsonb_set(
      COALESCE(NEW.settings, '{}'),
      '{unipile_account_id}',
      to_jsonb(workspace_unipile_id)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to contacts table
DROP TRIGGER IF EXISTS ensure_contacts_use_workspace_unipile ON contacts;
CREATE TRIGGER ensure_contacts_use_workspace_unipile
  BEFORE INSERT OR UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION ensure_shared_unipile_account();

-- Apply trigger to campaigns table (using tenant_id)
DROP TRIGGER IF EXISTS ensure_campaigns_use_workspace_unipile ON campaigns;
CREATE TRIGGER ensure_campaigns_use_workspace_unipile
  BEFORE INSERT OR UPDATE ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION ensure_shared_unipile_account();

-- Apply trigger to messages table
DROP TRIGGER IF EXISTS ensure_messages_use_workspace_unipile ON messages;
CREATE TRIGGER ensure_messages_use_workspace_unipile
  BEFORE INSERT OR UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION ensure_shared_unipile_account();

-- Update existing data to use workspace's Unipile account
-- Note: contacts.account_id is UUID, so we need to handle the type difference
UPDATE contacts c
SET account_id = w.id  -- Use workspace ID as a fallback since account_id is UUID
FROM workspaces w
WHERE c.workspace_id = w.id;

-- Store Unipile account in metadata for contacts
UPDATE contacts c
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'),
  '{unipile_account_id}',
  to_jsonb(w.unipile_account_id)
)
FROM workspaces w
WHERE c.workspace_id = w.id
AND w.unipile_account_id IS NOT NULL;

-- Update campaigns to store Unipile account in settings (using tenant_id)
UPDATE campaigns camp
SET settings = jsonb_set(
  COALESCE(camp.settings, '{}'),
  '{unipile_account_id}',
  to_jsonb(w.unipile_account_id)
)
FROM workspaces w
WHERE camp.tenant_id = w.id
AND w.unipile_account_id IS NOT NULL;

-- Comment for clarity
COMMENT ON COLUMN workspaces.unipile_account_id IS 'Shared Unipile account ID for all workspace features';
COMMENT ON COLUMN workspaces.unipile_dedicated_ip IS 'Dedicated IP for consistent LinkedIn access';
COMMENT ON COLUMN workspaces.unipile_api_key IS 'API key for Unipile access (encrypted in production)';
COMMENT ON COLUMN workspaces.unipile_dsn IS 'Unipile DSN endpoint (e.g., api6.unipile.com:13443)';