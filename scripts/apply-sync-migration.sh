#!/bin/bash

# Apply the cloud sync migration to Supabase

echo "🚀 Applying cloud sync migration to Supabase..."

# Get Supabase credentials
SUPABASE_URL="https://latxadqrvrrrcvkktrog.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhdHhhZHFydnJycmN2a2t0cm9nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ0NTgwNjAsImV4cCI6MjA1MDAzNDA2MH0.L3bTG-6vCUeOdKp0SdCAEPvKkN5SKwn49dnM1OFQvLg"
DB_PASSWORD="TFyp3VGohZHBqhmP"

# Apply migration
echo "📊 Creating sync tables and functions..."
PGPASSWORD=$DB_PASSWORD psql -h db.latxadqrvrrrcvkktrog.supabase.co -p 5432 -U postgres postgres -f supabase/migrations/create_background_sync_tables.sql

if [ $? -eq 0 ]; then
    echo "✅ Cloud sync migration applied successfully!"
    echo ""
    echo "☁️ Cloud sync is now enabled with the following features:"
    echo "  • Automatic sync every 30 minutes"
    echo "  • Continues syncing even when browser is closed"
    echo "  • Syncs both messages and contacts"
    echo "  • Automatic enablement on LinkedIn connection"
    echo ""
    echo "🔄 The app will now maintain sync in the cloud!"
else
    echo "❌ Migration failed. Please check the error messages above."
    exit 1
fi