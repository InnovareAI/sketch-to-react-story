# User Setup Script

This document explains how to use the `create-tl-user.js` script to create the tl@innovareai.com user account in Supabase.

## Quick Setup

1. **Get your Supabase Service Role Key:**
   - Go to: https://supabase.com/dashboard/project/latxadqrvrrrcvkktrog/settings/api
   - Copy the **service_role** key (NOT the anon key)

2. **Run the script:**
   ```bash
   cd /Users/tvonlinz/Dev_Master/InnovareAI/sketch-to-react-story
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here node create-tl-user.js
   ```

## Alternative: Add to Environment File

You can add the service role key to your `.env.local` file:

```bash
# Add this line to .env.local
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

Then run:
```bash
node create-tl-user.js
```

## What the Script Does

1. ✅ Creates auth user with email: `tl@innovareai.com`
2. ✅ Sets password to: `tl@innovareai.com`
3. ✅ Creates a default workspace if none exists
4. ✅ Creates user profile with owner/admin role
5. ✅ Connects user to the workspace
6. ✅ Sets appropriate permissions

## Login Credentials

After running the script successfully:
- **Email:** `tl@innovareai.com`
- **Password:** `tl@innovareai.com`

## Troubleshooting

- **"Invalid email or password" error:** The script hasn't been run yet or failed
- **Permission errors:** Make sure you're using the service_role key, not anon key
- **Database errors:** Check that all tables exist (run the setup-supabase-tables.sql first)

## Security Note

The service role key has admin privileges. Keep it secure and never commit it to version control.