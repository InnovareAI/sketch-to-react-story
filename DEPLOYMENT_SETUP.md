# SAM AI Deployment Setup Guide

## Environment Variables Required

### Frontend (Netlify)
Add these environment variables in your Netlify deployment settings:

```bash
# Unipile API Configuration
VITE_UNIPILE_API_KEY=aQzsD1+H.EJ60hU0LkPAxRaCU6nlvk3ypn9Rn9BUwqo9LGY24zZU=

# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Supabase Edge Functions
Set these secrets in your Supabase dashboard under Settings > Edge Functions:

```bash
# Unipile API Configuration
UNIPILE_API_KEY=aQzsD1+H.EJ60hU0LkPAxRaCU6nlvk3ypn9Rn9BUwqo9LGY24zZU=
UNIPILE_BASE_URL=https://api6.unipile.com:13670/api/v1

# These are automatically available in edge functions:
# SUPABASE_URL
# SUPABASE_SERVICE_ROLE_KEY
```

## Database Migrations

Run the following migration to ensure your database has all required tables and columns:

```bash
# Apply the LinkedIn sync schema migration
supabase db push
```

The migration file `20250814_linkedin_sync_schema.sql` includes:
- Enhanced contacts table with LinkedIn sync fields
- inbox_conversations table for message sync
- inbox_messages table for individual messages
- Proper RLS policies and indexes

## Edge Functions Deployment

Deploy all edge functions to your Supabase project:

```bash
# Deploy LinkedIn background sync function
supabase functions deploy linkedin-background-sync --project-ref your-project-ref

# Verify deployment
supabase functions list --project-ref your-project-ref
```

## LinkedIn Sync Features Included

### ✅ Automatic Cloud Sync
- Runs every 5 minutes via edge function
- Syncs contacts from LinkedIn chats
- Syncs conversations and messages
- Background processing with error handling

### ✅ Contact Management
- LinkedIn connection degree tracking
- Profile picture sync
- Company and title information
- Engagement scoring
- Workspace isolation (multi-tenant safe)

### ✅ Message Sync
- Conversation threading
- InMail detection
- Message history preservation
- Real-time updates

### ✅ Multi-Tenant Architecture
- Workspace-based data isolation
- RLS policies for security
- Per-workspace sync settings
- Admin and member role support

## Verification Steps

1. **Check Edge Function**: Verify the linkedin-background-sync function is deployed and active
2. **Test API Connection**: Use the simple-sync-test.mjs script to verify Unipile API access
3. **Database Schema**: Confirm all migrations are applied successfully
4. **Environment Variables**: Ensure all required env vars are set in both Netlify and Supabase

## Support

For any issues with deployment or sync functionality, check:
- Supabase logs for edge function errors
- Database permissions and RLS policies
- Environment variable configuration
- Unipile API key validity

## Security Notes

- API keys are centrally configured and can be updated via environment variables
- Database access is protected by Row Level Security (RLS)
- All sync operations respect workspace boundaries
- No hardcoded credentials in production code