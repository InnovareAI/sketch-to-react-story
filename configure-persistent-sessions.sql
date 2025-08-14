-- Configure 2-week persistent sessions for InnovareAI
-- This extends JWT token lifetime to 14 days (1209600 seconds)

-- Update auth configuration for longer session duration
UPDATE auth.config 
SET config = jsonb_set(
    config, 
    '{JWT_EXPIRY}', 
    '"1209600"'  -- 14 days in seconds
)
WHERE key = 'jwt';

-- Insert or update JWT config if it doesn't exist
INSERT INTO auth.config (key, config, created_at, updated_at)
VALUES (
    'jwt',
    jsonb_build_object(
        'JWT_EXPIRY', '1209600',
        'JWT_AUD', 'authenticated',
        'JWT_DEFAULT_GROUP_NAME', 'authenticated'
    ),
    NOW(),
    NOW()
)
ON CONFLICT (key) DO UPDATE SET
    config = jsonb_set(
        auth.config.config,
        '{JWT_EXPIRY}',
        '"1209600"'
    ),
    updated_at = NOW();

-- Also update refresh token expiry to 30 days for extra safety
INSERT INTO auth.config (key, config, created_at, updated_at)
VALUES (
    'refresh_token',
    jsonb_build_object(
        'REFRESH_TOKEN_ROTATION_ENABLED', true,
        'REFRESH_TOKEN_REUSE_INTERVAL', '10',
        'REFRESH_TOKEN_EXPIRY', '2592000'  -- 30 days
    ),
    NOW(),
    NOW()
)
ON CONFLICT (key) DO UPDATE SET
    config = jsonb_set(
        jsonb_set(
            auth.config.config,
            '{REFRESH_TOKEN_EXPIRY}',
            '"2592000"'
        ),
        '{REFRESH_TOKEN_ROTATION_ENABLED}',
        'true'
    ),
    updated_at = NOW();

-- Verify configuration
SELECT key, config 
FROM auth.config 
WHERE key IN ('jwt', 'refresh_token');