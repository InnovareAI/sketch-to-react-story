#!/bin/bash

echo "🚀 Deploying Server-Side LinkedIn Import System"
echo "═════════════════════════════════════════════"

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Installing..."
    npm install -g supabase
fi

# Check if logged in to Supabase
echo "🔍 Checking Supabase authentication..."
if ! supabase projects list &> /dev/null; then
    echo "❌ Not authenticated with Supabase. Please run:"
    echo "   supabase login"
    exit 1
fi

echo "✅ Supabase CLI authenticated"

# Link to project (if not already linked)
echo "🔗 Linking to Supabase project..."
if [ ! -f "supabase/.env" ]; then
    echo "⚠️  Project not linked. Please run:"
    echo "   supabase link --project-ref YOUR_PROJECT_REF"
    echo ""
    echo "You can find your project ref in your Supabase dashboard URL:"
    echo "https://supabase.com/dashboard/project/YOUR_PROJECT_REF"
    exit 1
fi

# Deploy the Edge Function
echo "📦 Deploying linkedin-import edge function..."
supabase functions deploy linkedin-import

if [ $? -eq 0 ]; then
    echo "✅ Edge function deployed successfully!"
    echo ""
    echo "🔧 Next Steps:"
    echo "1. Set environment variables in Supabase dashboard:"
    echo "   - UNIPILE_API_KEY: Your Unipile API key"
    echo "   - UNIPILE_URL: Your Unipile API URL (optional)"
    echo ""
    echo "2. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT_REF/functions"
    echo "3. Click on 'linkedin-import' function"
    echo "4. Add environment variables in the 'Environment Variables' section"
    echo ""
    echo "5. Test the function at:"
    echo "   https://YOUR_PROJECT_REF.supabase.co/functions/v1/linkedin-import"
    echo ""
    echo "🎉 Server-side import is now available!"
else
    echo "❌ Failed to deploy edge function"
    echo "Please check the error messages above"
    exit 1
fi