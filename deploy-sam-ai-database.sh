#!/bin/bash

# Deploy SAM AI Complete Database Schema
echo "🚀 Deploying SAM AI Database Schema to Supabase"
echo ""

# Configuration
SUPABASE_URL="https://ktchrfgkbpaixbiwbieg.supabase.co"
SUPABASE_SERVICE_KEY="${SUPABASE_SERVICE_KEY:-your-service-key-here}"

if [ "$SUPABASE_SERVICE_KEY" = "your-service-key-here" ]; then
    echo "❌ Error: SUPABASE_SERVICE_KEY environment variable not set"
    echo ""
    echo "Please set your Supabase service key:"
    echo "   export SUPABASE_SERVICE_KEY='your-actual-service-key'"
    echo ""
    echo "You can find your service key in the Supabase dashboard:"
    echo "   https://app.supabase.com/project/ktchrfgkbpaixbiwbieg/settings/api"
    echo ""
    exit 1
fi

# Check dependencies
if ! command -v psql &> /dev/null; then
    echo "❌ Error: PostgreSQL client (psql) not found"
    echo "Install with: brew install postgresql"
    exit 1
fi

echo "📋 Deployment Configuration:"
echo "   Supabase URL: $SUPABASE_URL"
echo "   Service Key: ${SUPABASE_SERVICE_KEY:0:20}..."
echo ""

echo "🔍 Testing database connection..."
if ! psql "postgresql://postgres:$SUPABASE_SERVICE_KEY@db.ktchrfgkbpaixbiwbieg.supabase.co:5432/postgres" -c "SELECT version();" &> /dev/null; then
    echo "❌ Database connection failed. Please check your service key."
    exit 1
fi
echo "✅ Database connection successful"
echo ""

# Function to execute SQL file
execute_sql_file() {
    local file_path=$1
    local description=$2
    
    echo "📦 $description..."
    if psql "postgresql://postgres:$SUPABASE_SERVICE_KEY@db.ktchrfgkbpaixbiwbieg.supabase.co:5432/postgres" -f "$file_path" > /dev/null 2>&1; then
        echo "   ✅ $description completed successfully"
    else
        echo "   ❌ $description failed"
        echo "   Running with verbose output..."
        psql "postgresql://postgres:$SUPABASE_SERVICE_KEY@db.ktchrfgkbpaixbiwbieg.supabase.co:5432/postgres" -f "$file_path"
        return 1
    fi
}

# Deploy schemas in order
echo "🚀 Starting schema deployment..."
echo ""

# 1. Deploy main SAM AI schema
if [ -f "sql/sam-ai-complete-schema.sql" ]; then
    execute_sql_file "sql/sam-ai-complete-schema.sql" "Deploying SAM AI Complete Schema"
else
    echo "❌ Main schema file not found: sql/sam-ai-complete-schema.sql"
    exit 1
fi

# 2. Deploy N8N integration schema
if [ -f "sql/n8n-integration-schema.sql" ]; then
    execute_sql_file "sql/n8n-integration-schema.sql" "Deploying N8N Integration Schema"
else
    echo "❌ N8N schema file not found: sql/n8n-integration-schema.sql"
    exit 1
fi

echo ""
echo "🎉 Database Schema Deployment Complete!"
echo ""

# Verify deployment
echo "🔍 Verifying deployment..."

# Check core tables
CORE_TABLES=(
    "workspaces"
    "profiles" 
    "kb_documents"
    "kb_chunks"
    "conversation_sessions"
    "conversation_messages"
    "sam_memory"
    "campaigns"
    "contacts"
    "n8n_workflows"
    "workflow_queue"
)

echo "📋 Checking core tables..."
for table in "${CORE_TABLES[@]}"; do
    if psql "postgresql://postgres:$SUPABASE_SERVICE_KEY@db.ktchrfgkbpaixbiwbieg.supabase.co:5432/postgres" -c "SELECT COUNT(*) FROM $table;" &> /dev/null; then
        echo "   ✅ $table"
    else
        echo "   ❌ $table (missing or error)"
    fi
done

echo ""

# Check functions
echo "📋 Checking database functions..."
FUNCTIONS=(
    "queue_n8n_workflow"
    "process_n8n_webhook"
    "stage_kb_document_for_n8n"
    "update_updated_at_column"
)

for func in "${FUNCTIONS[@]}"; do
    if psql "postgresql://postgres:$SUPABASE_SERVICE_KEY@db.ktchrfgkbpaixbiwbieg.supabase.co:5432/postgres" -c "SELECT proname FROM pg_proc WHERE proname = '$func';" | grep -q "$func"; then
        echo "   ✅ $func()"
    else
        echo "   ❌ $func() (missing)"
    fi
done

echo ""

# Sample data check
echo "📊 Sample data status:"
SAMPLE_WORKSPACE_COUNT=$(psql "postgresql://postgres:$SUPABASE_SERVICE_KEY@db.ktchrfgkbpaixbiwbieg.supabase.co:5432/postgres" -t -c "SELECT COUNT(*) FROM workspaces WHERE name = 'SAM AI Demo Workspace';" 2>/dev/null | tr -d ' ')

if [ "$SAMPLE_WORKSPACE_COUNT" = "1" ]; then
    echo "   ✅ Sample workspace created"
    
    SAMPLE_USER_COUNT=$(psql "postgresql://postgres:$SUPABASE_SERVICE_KEY@db.ktchrfgkbpaixbiwbieg.supabase.co:5432/postgres" -t -c "SELECT COUNT(*) FROM profiles WHERE email = 'demo@sameai.com';" 2>/dev/null | tr -d ' ')
    
    if [ "$SAMPLE_USER_COUNT" = "1" ]; then
        echo "   ✅ Sample user created"
    else
        echo "   ⚠️  Sample user not found"
    fi
else
    echo "   ⚠️  Sample workspace not found"
fi

echo ""
echo "🎯 Next Steps:"
echo ""
echo "1. 🔐 Set up API Keys:"
echo "   export VITE_OPENAI_API_KEY='your-openai-key'"
echo "   export VITE_ANTHROPIC_API_KEY='your-anthropic-key'"
echo ""
echo "2. 🧪 Test the AI connection:"
echo "   node test-ai-connection.js"
echo ""
echo "3. 🚀 Start the development server:"
echo "   npm run dev"
echo ""
echo "4. 📊 Access the SAM AI interface:"
echo "   http://localhost:5173"
echo ""
echo "5. 🗄️ Supabase Dashboard:"
echo "   https://app.supabase.com/project/ktchrfgkbpaixbiwbieg"
echo ""

# Final database stats
echo "📈 Database Statistics:"
TABLE_COUNT=$(psql "postgresql://postgres:$SUPABASE_SERVICE_KEY@db.ktchrfgkbpaixbiwbieg.supabase.co:5432/postgres" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ')
FUNCTION_COUNT=$(psql "postgresql://postgres:$SUPABASE_SERVICE_KEY@db.ktchrfgkbpaixbiwbieg.supabase.co:5432/postgres" -t -c "SELECT COUNT(*) FROM pg_proc WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');" 2>/dev/null | tr -d ' ')
INDEX_COUNT=$(psql "postgresql://postgres:$SUPABASE_SERVICE_KEY@db.ktchrfgkbpaixbiwbieg.supabase.co:5432/postgres" -t -c "SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public';" 2>/dev/null | tr -d ' ')

echo "   📊 Total Tables: $TABLE_COUNT"
echo "   ⚙️  Total Functions: $FUNCTION_COUNT"
echo "   🔍 Total Indexes: $INDEX_COUNT"
echo ""

echo "✨ SAM AI Database is ready for conversational testing!"