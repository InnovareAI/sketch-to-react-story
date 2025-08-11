#!/bin/bash

# SAM AI Platform - Service Configuration Setup Script
# This script helps you configure all required services

set -e

echo "======================================"
echo "SAM AI Platform Configuration Setup"
echo "======================================"
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to prompt for input
prompt_for_value() {
    local var_name=$1
    local prompt_text=$2
    local is_secret=$3
    
    if [ "$is_secret" = "true" ]; then
        read -sp "$prompt_text: " value
        echo ""
    else
        read -p "$prompt_text: " value
    fi
    
    echo "$value"
}

# Check if .env.local exists
if [ -f .env.local ]; then
    echo -e "${YELLOW}Warning: .env.local already exists.${NC}"
    read -p "Do you want to backup and create a new one? (y/n): " backup_choice
    if [ "$backup_choice" = "y" ]; then
        mv .env.local .env.local.backup.$(date +%Y%m%d_%H%M%S)
        echo -e "${GREEN}Backup created.${NC}"
    else
        echo "Exiting without changes."
        exit 0
    fi
fi

echo ""
echo "Let's configure your services step by step..."
echo ""

# Supabase Configuration
echo "1. SUPABASE CONFIGURATION"
echo "-------------------------"
echo "Visit: https://app.supabase.com"
echo "Go to: Settings → API"
echo ""
SUPABASE_URL=$(prompt_for_value "SUPABASE_URL" "Enter Supabase Project URL" false)
SUPABASE_ANON_KEY=$(prompt_for_value "SUPABASE_ANON_KEY" "Enter Supabase Anon Key" false)

# Unipile Configuration
echo ""
echo "2. UNIPILE CONFIGURATION (LinkedIn OAuth)"
echo "-----------------------------------------"
echo "Visit: https://app.unipile.com"
echo "Go to: Settings → API Keys"
echo ""
read -p "Do you have a Unipile account? (y/n): " has_unipile
if [ "$has_unipile" = "y" ]; then
    UNIPILE_API_KEY=$(prompt_for_value "UNIPILE_API_KEY" "Enter Unipile API Key" true)
    UNIPILE_ACCOUNT_ID=$(prompt_for_value "UNIPILE_ACCOUNT_ID" "Enter Unipile Account ID" false)
else
    echo -e "${YELLOW}Skipping Unipile - Demo mode will be used${NC}"
    UNIPILE_API_KEY="demo_key_not_configured"
    UNIPILE_ACCOUNT_ID="demo_account"
fi

# Bright Data Configuration
echo ""
echo "3. BRIGHT DATA CONFIGURATION (Proxy Service)"
echo "--------------------------------------------"
echo "Visit: https://brightdata.com"
echo "Product: Residential Proxies"
echo ""
read -p "Do you have a Bright Data account? (y/n): " has_brightdata
if [ "$has_brightdata" = "y" ]; then
    BRIGHTDATA_CUSTOMER_ID=$(prompt_for_value "BRIGHTDATA_CUSTOMER_ID" "Enter Customer ID" false)
    BRIGHTDATA_PASSWORD=$(prompt_for_value "BRIGHTDATA_PASSWORD" "Enter Zone Password" true)
    BRIGHTDATA_ZONE=$(prompt_for_value "BRIGHTDATA_ZONE" "Enter Zone Name (default: sam-ai-linkedin)" false)
    BRIGHTDATA_ZONE=${BRIGHTDATA_ZONE:-sam-ai-linkedin}
else
    echo -e "${YELLOW}Skipping Bright Data - Proxy features disabled${NC}"
    BRIGHTDATA_CUSTOMER_ID=""
    BRIGHTDATA_PASSWORD=""
    BRIGHTDATA_ZONE=""
fi

# n8n Configuration
echo ""
echo "4. N8N WORKFLOW CONFIGURATION"
echo "-----------------------------"
N8N_URL="https://workflows.innovareai.com"
echo "Using n8n URL: $N8N_URL"
read -p "Do you need to add an n8n API key? (y/n): " needs_n8n_key
if [ "$needs_n8n_key" = "y" ]; then
    N8N_API_KEY=$(prompt_for_value "N8N_API_KEY" "Enter n8n API Key" true)
else
    N8N_API_KEY=""
fi

# AI Models Configuration
echo ""
echo "5. AI MODELS CONFIGURATION"
echo "--------------------------"
echo ""
echo "OpenAI Configuration"
echo "Visit: https://platform.openai.com/api-keys"
read -p "Do you have an OpenAI API key? (y/n): " has_openai
if [ "$has_openai" = "y" ]; then
    OPENAI_API_KEY=$(prompt_for_value "OPENAI_API_KEY" "Enter OpenAI API Key" true)
else
    OPENAI_API_KEY=""
fi

echo ""
echo "Anthropic (Claude) Configuration"
echo "Visit: https://console.anthropic.com/settings/keys"
read -p "Do you have an Anthropic API key? (y/n): " has_anthropic
if [ "$has_anthropic" = "y" ]; then
    ANTHROPIC_API_KEY=$(prompt_for_value "ANTHROPIC_API_KEY" "Enter Anthropic API Key" true)
else
    ANTHROPIC_API_KEY=""
fi

# Feature Flags
echo ""
echo "6. FEATURE FLAGS"
echo "----------------"
echo "Using default feature flags..."
ENABLE_VOICE="true"
ENABLE_LINKEDIN="true"
ENABLE_EMAIL="true"
DEFAULT_MODEL="quality"

# Create .env.local file
echo ""
echo "Creating .env.local file..."

cat > .env.local << EOF
# SAM AI Platform Environment Configuration
# Generated on: $(date)

# Supabase Configuration
VITE_SUPABASE_URL=$SUPABASE_URL
VITE_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY

# Unipile Configuration (LinkedIn OAuth)
VITE_UNIPILE_API_KEY=$UNIPILE_API_KEY
VITE_UNIPILE_ACCOUNT_ID=$UNIPILE_ACCOUNT_ID

# Bright Data Configuration (Proxy Service)
VITE_BRIGHTDATA_CUSTOMER_ID=$BRIGHTDATA_CUSTOMER_ID
VITE_BRIGHTDATA_PASSWORD=$BRIGHTDATA_PASSWORD
VITE_BRIGHTDATA_ZONE=$BRIGHTDATA_ZONE

# n8n Workflow Automation
VITE_N8N_URL=$N8N_URL
VITE_N8N_API_KEY=$N8N_API_KEY

# AI Models
VITE_OPENAI_API_KEY=$OPENAI_API_KEY
VITE_ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY

# Feature Flags
VITE_ENABLE_VOICE=$ENABLE_VOICE
VITE_ENABLE_LINKEDIN=$ENABLE_LINKEDIN
VITE_ENABLE_EMAIL=$ENABLE_EMAIL
VITE_DEFAULT_MODEL=$DEFAULT_MODEL
EOF

echo -e "${GREEN}✓ .env.local file created successfully!${NC}"

# Create .env.production for Netlify
echo ""
read -p "Do you want to create a .env.production file for Netlify? (y/n): " create_prod
if [ "$create_prod" = "y" ]; then
    cp .env.local .env.production
    echo -e "${GREEN}✓ .env.production file created!${NC}"
fi

# Display next steps
echo ""
echo "======================================"
echo "Configuration Complete!"
echo "======================================"
echo ""
echo "Next Steps:"
echo "1. Review the .env.local file to ensure all values are correct"
echo "2. Add these environment variables to Netlify:"
echo "   - Go to: https://app.netlify.com/sites/sameaisalesassistant/settings/env"
echo "   - Add each variable from .env.local"
echo "3. Run 'npm run dev' to test locally"
echo "4. Deploy with 'netlify deploy --prod'"
echo ""

# Ask if user wants to start the dev server
read -p "Do you want to start the development server now? (y/n): " start_dev
if [ "$start_dev" = "y" ]; then
    echo "Starting development server..."
    npm run dev
fi