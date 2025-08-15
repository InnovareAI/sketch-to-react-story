#!/bin/bash

# Apply RLS fix for user_quota_usage table
# This resolves the "new row violates row-level security policy" error

echo "🔧 Applying RLS fix for user_quota_usage table..."

# Get Supabase credentials from environment or use defaults
SUPABASE_DB_URL="${SUPABASE_DB_URL:-postgresql://postgres.latxadqrvrrrcvkktrog:TFyp3VGohZHBqhmP@db.latxadqrvrrrcvkktrog.supabase.co:5432/postgres}"

# Apply the fix
psql "$SUPABASE_DB_URL" -f sql/fix-user-quota-rls.sql

if [ $? -eq 0 ]; then
    echo "✅ RLS policies successfully updated!"
    echo ""
    echo "Changes applied:"
    echo "1. ✅ Added INSERT policy for user_quota_usage"
    echo "2. ✅ Updated SELECT and UPDATE policies"  
    echo "3. ✅ Added service role policy for backend operations"
    echo "4. ✅ Made workspace_id nullable for user-based quotas"
    echo ""
    echo "The app should now work without RLS errors!"
else
    echo "❌ Failed to apply RLS fix. Please check your database connection."
    exit 1
fi