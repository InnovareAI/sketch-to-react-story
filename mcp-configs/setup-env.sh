#!/bin/bash

# Sam AI MCP Environment Setup
# This script sets up all required environment variables for MCP integration

echo "🔧 Setting up Sam AI MCP Environment Variables..."

# Supabase Configuration
export SUPABASE_URL="https://latxadqrvrrrcvkktrog.supabase.co"
export SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhdHhhZHFydnJycmN2a2t0cm9nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTk5ODYsImV4cCI6MjA2ODI3NTk4Nn0.3WkAgXpk_MyQioVf_SED9O_ArjcT9nH0uy9we2okftE"
export SUPABASE_CONNECTION_STRING="postgresql://postgres.latxadqrvrrrcvkktrog:YourPassword@aws-0-us-west-1.pooler.supabase.com:6543/postgres"

# n8n Configuration (already working)
export N8N_API_URL="http://116.203.116.16:5678"
export N8N_API_KEY="your_n8n_api_key_here"

# Apify Configuration (required for LinkedIn scraping)
echo "⚠️  APIFY_TOKEN is required for LinkedIn scraping. Get one from: https://console.apify.com/settings/integrations"
echo "   Then run: export APIFY_TOKEN=your_apify_token_here"
# export APIFY_TOKEN="your_apify_token_here"

# Unipile Configuration (required for LinkedIn messaging)  
echo "⚠️  UNIPILE_DSN and UNIPILE_API_KEY are required for LinkedIn messaging. Get them from: https://www.unipile.com/"
echo "   Then run: export UNIPILE_DSN=api8.unipile.com:13851"
echo "   And run: export UNIPILE_API_KEY=your_unipile_api_key_here"
# export UNIPILE_DSN="api8.unipile.com:13851"
# export UNIPILE_API_KEY="your_unipile_api_key_here"

# Verify environment setup
echo ""
echo "✅ Environment variables configured:"
echo "   SUPABASE_URL: $SUPABASE_URL"
echo "   SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY:0:20}..."
echo "   N8N_API_URL: $N8N_API_URL"
echo ""

# Check required but missing variables
missing_vars=()

if [ -z "$APIFY_TOKEN" ]; then
    missing_vars+=("APIFY_TOKEN")
fi

if [ -z "$UNIPILE_DSN" ]; then
    missing_vars+=("UNIPILE_DSN")
fi

if [ -z "$UNIPILE_API_KEY" ]; then
    missing_vars+=("UNIPILE_API_KEY")
fi

if [ ${#missing_vars[@]} -gt 0 ]; then
    echo "⚠️  Missing required environment variables:"
    for var in "${missing_vars[@]}"; do
        echo "   - $var"
    done
    echo ""
    echo "🔗 Get your API keys from:"
    echo "   • Apify: https://console.apify.com/settings/integrations"
    echo "   • Unipile: https://www.unipile.com/dashboard"
    echo ""
else
    echo "🎉 All required environment variables are configured!"
fi

echo "To test MCP integration with current settings, run:"
echo "   node mcp-configs/test-mcp-integrations.js"