#!/bin/bash

# Deploy Background LinkedIn Sync to Supabase

echo "🚀 Deploying Background LinkedIn Sync..."

# Deploy the edge function
echo "📦 Deploying Edge Function..."
npx supabase functions deploy linkedin-background-sync

# Run the SQL to create tables and scheduler
echo "🗄️ Setting up database tables and scheduler..."
npx supabase db push --file sql-scripts/create-background-sync-scheduler.sql

echo "✅ Background sync deployment complete!"
echo ""
echo "📝 Next steps:"
echo "1. Enable pg_cron extension in Supabase dashboard if not already enabled"
echo "2. The background sync will automatically run every 30 minutes"
echo "3. Users can trigger immediate syncs from the Contacts page"
echo ""
echo "🔧 To manually trigger sync for a workspace:"
echo "SELECT set_linkedin_sync_schedule('workspace-id', 'account-id', true, 30, 'both');"
echo ""
echo "✨ Background sync is now active and will continue even when users leave the page!"