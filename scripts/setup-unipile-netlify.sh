#!/bin/bash

# Unipile Netlify Deployment Script
# This script configures Unipile environment variables in Netlify

echo "🚀 Setting up Unipile integration for Netlify deployment..."

# Check if netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo "❌ Netlify CLI not found. Installing..."
    npm install -g netlify-cli
fi

# Check if user is logged in to Netlify
if ! netlify status &> /dev/null; then
    echo "🔐 Please log in to Netlify CLI:"
    netlify login
fi

# Prompt for Unipile credentials
echo ""
echo "📝 Enter your Unipile credentials:"
echo "   Get these from: https://www.unipile.com/dashboard"
echo ""

read -p "Unipile API Key: " UNIPILE_API_KEY
read -p "Unipile DSN (e.g., api8.unipile.com:13851): " UNIPILE_DSN

# Validate inputs
if [ -z "$UNIPILE_API_KEY" ]; then
    echo "❌ API Key is required"
    exit 1
fi

if [ -z "$UNIPILE_DSN" ]; then
    echo "❌ DSN is required"
    exit 1
fi

echo ""
echo "🔧 Setting Netlify environment variables..."

# Set environment variables in Netlify
netlify env:set VITE_UNIPILE_API_KEY "$UNIPILE_API_KEY"
netlify env:set VITE_UNIPILE_DSN "$UNIPILE_DSN"

# Also set webhook URL for Unipile
SITE_URL=$(netlify status | grep "Site URL" | cut -d' ' -f3)
WEBHOOK_URL="${SITE_URL}/.netlify/functions/unipile-webhook"
netlify env:set UNIPILE_WEBHOOK_URL "$WEBHOOK_URL"

echo "✅ Environment variables set successfully!"
echo ""
echo "📋 Configured:"
echo "   - VITE_UNIPILE_API_KEY: [HIDDEN]"
echo "   - VITE_UNIPILE_DSN: $UNIPILE_DSN"
echo "   - UNIPILE_WEBHOOK_URL: $WEBHOOK_URL"
echo ""

# Update local .env.local file
echo "📝 Updating local .env.local file..."
sed -i.bak "s/VITE_UNIPILE_API_KEY=.*/VITE_UNIPILE_API_KEY=$UNIPILE_API_KEY/" .env.local
sed -i.bak "s/VITE_UNIPILE_DSN=.*/VITE_UNIPILE_DSN=$UNIPILE_DSN/" .env.local

echo "✅ Local environment updated!"
echo ""

# Deploy to Netlify
echo "🚀 Deploying to Netlify..."
netlify deploy --build --prod

echo ""
echo "🎉 Unipile integration setup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Go to your Unipile dashboard: https://www.unipile.com/dashboard"
echo "   2. Configure webhook endpoint: $WEBHOOK_URL"
echo "   3. Enable events: message.received, message.sent, conversation.created, conversation.updated"
echo "   4. Test LinkedIn account connection in the app"
echo "   5. Create your first campaign with Unipile messaging"
echo ""
echo "🔗 Your deployed app: $SITE_URL"
echo ""

# Test connectivity
echo "🧪 Testing API connectivity..."
if curl -s -f -H "Authorization: Bearer $UNIPILE_API_KEY" "https://$UNIPILE_DSN/api/v1/accounts" > /dev/null; then
    echo "✅ Unipile API connection successful!"
else
    echo "⚠️  Could not connect to Unipile API. Please verify your credentials."
fi

echo ""
echo "✨ Setup completed successfully!"