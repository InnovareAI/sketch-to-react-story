#!/bin/bash

# LinkedIn OAuth Setup Script for SAM AI Platform

echo "========================================"
echo "LinkedIn OAuth Setup for SAM AI"
echo "========================================"
echo ""

echo "This script will help you set up LinkedIn OAuth for real account connections."
echo ""

echo "Step 1: Create a LinkedIn App"
echo "------------------------------"
echo "1. Open your browser and go to: https://www.linkedin.com/developers/"
echo "2. Sign in with your LinkedIn account"
echo "3. Click 'Create App'"
echo "4. Fill in the following:"
echo "   - App name: SAM AI Assistant"
echo "   - Company: Your company name"
echo "   - App logo: Upload any logo"
echo "   - Check the legal agreement"
echo "5. Click 'Create app'"
echo ""
read -p "Press Enter when you've created the app..."

echo ""
echo "Step 2: Configure OAuth Settings"
echo "--------------------------------"
echo "1. In your app dashboard, click on the 'Auth' tab"
echo "2. Add these Authorized redirect URLs:"
echo "   - http://localhost:8083/auth/linkedin/callback"
echo "   - https://sameaisalesassistant.netlify.app/auth/linkedin/callback"
echo "3. Find your credentials in the 'Application credentials' section"
echo ""
read -p "Press Enter when ready to input credentials..."

echo ""
echo "Step 3: Enter Your Credentials"
echo "------------------------------"
read -p "Enter your LinkedIn Client ID: " CLIENT_ID
read -sp "Enter your LinkedIn Client Secret: " CLIENT_SECRET
echo ""

echo ""
echo "Step 4: Request API Access"
echo "--------------------------"
echo "1. Go to the 'Products' tab in your LinkedIn app"
echo "2. Request access to:"
echo "   - Sign In with LinkedIn using OpenID Connect"
echo "   - Share on LinkedIn (optional)"
echo "3. These are usually auto-approved"
echo ""
read -p "Press Enter when you've requested the products..."

echo ""
echo "Updating .env.local with LinkedIn credentials..."

# Update .env.local
if [ -f .env.local ]; then
    # Update existing file
    sed -i.bak "s/VITE_LINKEDIN_CLIENT_ID=.*/VITE_LINKEDIN_CLIENT_ID=$CLIENT_ID/" .env.local
    sed -i.bak "s/VITE_LINKEDIN_CLIENT_SECRET=.*/VITE_LINKEDIN_CLIENT_SECRET=$CLIENT_SECRET/" .env.local
else
    # Create new file
    cat > .env.local << EOF
# LinkedIn OAuth
VITE_LINKEDIN_CLIENT_ID=$CLIENT_ID
VITE_LINKEDIN_CLIENT_SECRET=$CLIENT_SECRET
EOF
fi

echo "✅ LinkedIn OAuth configured successfully!"
echo ""
echo "Next steps:"
echo "1. Restart your development server (npm run dev)"
echo "2. Go to Settings → Workspace Settings"
echo "3. Click 'Add LinkedIn Account'"
echo "4. You should now see the real LinkedIn OAuth flow"
echo ""
echo "For production deployment:"
echo "Add these environment variables to Netlify:"
echo "  VITE_LINKEDIN_CLIENT_ID=$CLIENT_ID"
echo "  VITE_LINKEDIN_CLIENT_SECRET=[your_secret]"
echo ""
echo "Documentation: LINKEDIN_SETUP.md"