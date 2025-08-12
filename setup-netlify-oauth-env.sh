#!/bin/bash

# LinkedIn OAuth Environment Variables for Netlify
# Run this script to set up environment variables in Netlify for OAuth to work

echo "🔧 Setting up LinkedIn OAuth Environment Variables for Netlify..."
echo ""
echo "You need to add these environment variables to your Netlify site:"
echo "https://app.netlify.com/sites/sameaisalesassistant/settings/env"
echo ""

cat << 'EOF'
Environment Variables to Add:

1. VITE_LINKEDIN_CLIENT_ID
   Value: 78094ft3hvizqs

2. VITE_LINKEDIN_CLIENT_SECRET
   Value: WPL_AP1.r88IfXzVhe12NUdM.spqg9Q==

3. VITE_SUPABASE_URL
   Value: https://latxadqrvrrrcvkktrog.supabase.co

4. VITE_SUPABASE_ANON_KEY
   Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhdHhhZHFydnJycmN2a2t0cm9nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU2NzE3NjEsImV4cCI6MjA1MTI0Nzc2MX0.example_key_replace_with_real

5. VITE_OPENAI_API_KEY
   Value: [REDACTED - Use your actual OpenAI key]

6. VITE_ANTHROPIC_API_KEY
   Value: [REDACTED - Use your actual Anthropic key]

EOF

echo ""
echo "📋 Steps to Deploy:"
echo "1. Go to: https://app.netlify.com/sites/sameaisalesassistant/settings/env"
echo "2. Click 'Add environment variable' for each variable above"
echo "3. After adding all variables, go to Deploys tab and click 'Trigger deploy'"
echo "4. Wait for deployment to complete"
echo "5. Test OAuth using the linkedin-oauth-test.html file"
echo ""
echo "🎯 Critical for LinkedIn OAuth:"
echo "- VITE_LINKEDIN_CLIENT_ID must match LinkedIn Developer Portal"
echo "- VITE_LINKEDIN_CLIENT_SECRET must be correct"
echo "- LinkedIn Developer Portal redirect URI must be:"
echo "  https://sameaisalesassistant.netlify.app/.netlify/functions/linkedin-callback"
echo ""
echo "🧪 Test OAuth after deployment:"
echo "Open: https://sameaisalesassistant.netlify.app/linkedin-oauth-test.html"