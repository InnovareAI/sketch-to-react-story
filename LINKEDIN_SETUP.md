# LinkedIn OAuth Setup Guide

## Step 1: Create LinkedIn App

1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/)
2. Click "Create App"
3. Fill in the required information:
   - **App Name**: SAM AI Assistant
   - **LinkedIn Page**: Select or create a company page
   - **App Logo**: Upload a logo
   - **Legal Agreement**: Check the box

## Step 2: Configure OAuth Settings

1. In your app dashboard, go to the **Auth** tab
2. Add Redirect URLs:
   - `http://localhost:8083/auth/linkedin/callback` (for local development)
   - `https://sameaisalesassistant.netlify.app/auth/linkedin/callback` (for production)

3. Note down your credentials:
   - **Client ID**: (will be shown)
   - **Client Secret**: (will be shown)

## Step 3: Request API Access

1. Go to the **Products** tab
2. Request access to:
   - **Sign In with LinkedIn using OpenID Connect**
   - **Share on LinkedIn**
   - **Advertising API** (if needed for advanced features)

## Step 4: Add Credentials to Environment

Add these to your `.env.local`:

```env
VITE_LINKEDIN_CLIENT_ID=your_client_id_here
VITE_LINKEDIN_CLIENT_SECRET=your_client_secret_here
```

## Step 5: Test the Integration

1. Start the development server
2. Go to Settings → Workspace Settings
3. Click "Add LinkedIn Account"
4. You should be redirected to LinkedIn's OAuth page

## API Permissions Available

With basic access, you can:
- Get user profile information
- Post updates on behalf of the user
- Access basic profile data

For advanced features (requires approval):
- Send direct messages
- Access full connection list
- Perform searches
- Access company pages

## Alternative: Use Existing Integration

If you already have a LinkedIn app or prefer to use a service:

### Option 1: RapidAPI LinkedIn
- Sign up at [RapidAPI](https://rapidapi.com)
- Subscribe to LinkedIn API
- Use the provided API key

### Option 2: Phantombuster
- Create account at [Phantombuster](https://phantombuster.com)
- Use their LinkedIn automation APIs
- No OAuth required

### Option 3: Apify LinkedIn Scraper
- Already configured in your MCP
- Can be used for data extraction
- Check Apify actors for LinkedIn tools

## Quick Start with Test Account

For immediate testing without creating an app:

```env
# Test credentials (limited functionality)
VITE_LINKEDIN_CLIENT_ID=78h5r3mkw6xfvs
VITE_LINKEDIN_CLIENT_SECRET=WPL_AP1.4fKHxW3rBRZmAJqe.MzY5MjYxMA==
```

**Note**: These are example credentials and won't work. You need to create your own LinkedIn app.

## Troubleshooting

- **Error: Invalid redirect URI**: Make sure the redirect URI in your app matches exactly
- **Error: Scope not authorized**: You may need to request additional products in the LinkedIn app
- **Error: Invalid client**: Double-check your Client ID and Secret

## Support Links

- [LinkedIn OAuth Documentation](https://learn.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow)
- [LinkedIn API Reference](https://learn.microsoft.com/en-us/linkedin/shared/api-guide/concepts)
- [LinkedIn Developer Support](https://www.linkedin.com/help/linkedin/ask/uas)