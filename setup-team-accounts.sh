#!/bin/bash

echo "Setting up Team Accounts in Supabase..."

# Database connection details
DB_HOST="aws-0-us-east-1.pooler.supabase.com"
DB_PORT="6543"
DB_NAME="postgres"
DB_USER="postgres.ktchrfgkbpaixbiwbieg"
DB_PASS="i0EiFpjnF4DtVyOV"

# Run migrations
echo "Creating tables..."
PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f supabase/migrations/create_team_accounts.sql

if [ $? -eq 0 ]; then
    echo "✅ Tables created successfully"
else
    echo "❌ Failed to create tables"
    exit 1
fi

echo "Inserting team members and LinkedIn accounts..."
PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f supabase/migrations/insert_team_data.sql

if [ $? -eq 0 ]; then
    echo "✅ Data inserted successfully"
else
    echo "❌ Failed to insert data"
    exit 1
fi

echo "Verifying data..."
PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
SELECT 'Team Members:' as info;
SELECT id, full_name, role, department FROM team_members;
SELECT '' as blank;
SELECT 'LinkedIn Accounts:' as info;
SELECT account_name, email, account_type, proxy_location FROM linkedin_accounts;
SELECT '' as blank;
SELECT 'Summary:' as info;
SELECT COUNT(*) as team_members FROM team_members;
SELECT COUNT(*) as linkedin_accounts FROM linkedin_accounts;
"

echo "✅ Team accounts setup complete!"
echo ""
echo "You now have:"
echo "- 2 team members (Sarah Johnson & Michael Chen)"
echo "- 10 LinkedIn accounts (5 for each team member)"
echo "- Different proxy locations (US, DE, AT, PH)"
echo "- Mix of Personal and Sales Navigator accounts"
echo ""
echo "Access them in your app at: Workspace Settings > Team Accounts"