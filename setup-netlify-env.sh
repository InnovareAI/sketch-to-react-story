#!/bin/bash

echo "🚀 Setting up Netlify environment variables for Sam AI"
echo "======================================================="
echo ""

# Supabase staging credentials
SUPABASE_URL="https://latxadqrvrrrcvkktrog.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhdHhhZHFydnJycmN2a2t0cm9nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTk5ODYsImV4cCI6MjA2ODI3NTk4Nn0.3WkAgXpk_MyQioVf_SED9O_ArjcT9nH0uy9we2okftE"

echo "Setting VITE_SUPABASE_URL..."
netlify env:set VITE_SUPABASE_URL "$SUPABASE_URL"

echo "Setting VITE_SUPABASE_ANON_KEY..."
netlify env:set VITE_SUPABASE_ANON_KEY "$SUPABASE_ANON_KEY"

echo "Setting VITE_ENVIRONMENT..."
netlify env:set VITE_ENVIRONMENT "staging"

echo ""
echo "✅ Environment variables set successfully!"
echo ""
echo "📝 Note: These variables will be used in your next deployment."
echo "   To trigger a new deployment, push to your repository or run:"
echo "   netlify deploy --prod"