# Netlify Environment Variables - Same Values for All Deploy Contexts

## Overview
All deploy contexts (Production, Deploy Previews, Branch Deploys) use the **SAME** environment variable values. This ensures consistency across all environments.

## Required Environment Variables

Add these to Netlify Dashboard → Site Settings → Environment Variables:

```bash
# Supabase Configuration (Required)
VITE_SUPABASE_URL=https://latxadqrvrrrcvkktrog.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Unipile Configuration (Required for LinkedIn sync)
VITE_UNIPILE_API_KEY=your_unipile_api_key_here
VITE_UNIPILE_DSN=api6.unipile.com:13670

# Bright Data Configuration (Optional - for proxy scraping)
VITE_BRIGHTDATA_CUSTOMER_ID=your_customer_id_here
VITE_BRIGHTDATA_PASSWORD=your_password_here
VITE_BRIGHTDATA_ZONE=sam-ai-linkedin
VITE_BRIGHT_DATA_PREFERRED_ZONE=residential

# AI Models (Required for AI features)
VITE_OPENAI_API_KEY=your_openai_key_here
VITE_ANTHROPIC_API_KEY=your_anthropic_key_here
VITE_DEFAULT_MODEL=claude

# n8n Workflow Automation (Optional)
VITE_N8N_URL=https://workflows.innovareai.com

# Feature Flags (Optional)
VITE_ENABLE_VOICE=true
VITE_ENABLE_LINKEDIN=true
VITE_ENABLE_EMAIL=true

# Production URL (Required for OAuth callbacks)
VITE_PRODUCTION_URL=https://sameaisalesassistant.netlify.app
```

## Setting Up in Netlify

### Method 1: Via Netlify UI (Recommended)
1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Select your site: `sameaisalesassistant`
3. Navigate to: **Site Configuration** → **Environment Variables**
4. Click **Add a variable**
5. For each variable:
   - **Key**: Enter the variable name (e.g., `VITE_SUPABASE_URL`)
   - **Values**: Enter the value
   - **Deploy contexts**: Select **"Same value for all deploy contexts"** ✅
6. Click **Save**

### Method 2: Via Netlify CLI
```bash
# Install Netlify CLI if not already installed
npm install -g netlify-cli

# Login to Netlify
netlify login

# Link to your site
netlify link --name sameaisalesassistant

# Set environment variables (same for all contexts)
netlify env:set VITE_SUPABASE_URL "https://latxadqrvrrrcvkktrog.supabase.co"
netlify env:set VITE_SUPABASE_ANON_KEY "your_key_here"
netlify env:set VITE_UNIPILE_API_KEY "your_key_here"
# ... repeat for all variables
```

### Method 3: Via netlify.toml (NOT Recommended for Secrets)
```toml
# netlify.toml - Only for non-sensitive values
[build.environment]
  NODE_VERSION = "18"
  VITE_ENABLE_VOICE = "true"
  VITE_ENABLE_LINKEDIN = "true"
  VITE_ENABLE_EMAIL = "true"
  VITE_DEFAULT_MODEL = "claude"
  # DO NOT put API keys here - use Netlify UI instead
```

## Deploy Context Behavior

With **"Same value for all deploy contexts"** selected:

| Deploy Context | Uses These Values | URL |
|---------------|------------------|-----|
| **Production** | Same env vars | sameaisalesassistant.netlify.app |
| **Deploy Previews** | Same env vars | deploy-preview-{PR}--sameaisalesassistant.netlify.app |
| **Branch Deploys** | Same env vars | {branch}--sameaisalesassistant.netlify.app |
| **Local Development** | From .env.local | localhost:5173 |

## Important Notes

### ✅ Benefits of Same Values
- **Consistency**: All previews work exactly like production
- **Simplicity**: One set of credentials to manage
- **Testing**: Deploy previews accurately represent production behavior
- **No Surprises**: What works in preview works in production

### ⚠️ Considerations
- **Database**: All contexts use the SAME Supabase database
- **API Limits**: All contexts share the same API quotas
- **LinkedIn Sync**: All contexts sync to the same LinkedIn accounts
- **Cost**: All usage counts against production quotas

### 🔒 Security Best Practices
1. **Never commit .env files** to Git
2. **Use Netlify UI** for setting production secrets
3. **Rotate keys regularly** and update in Netlify
4. **Monitor usage** across all deploy contexts
5. **Use Row Level Security** in Supabase if needed

## Local Development Setup

For local development, create `.env.local` with the same values:

```bash
# Copy from .env.example
cp .env.example .env.local

# Edit .env.local with your values
# These should match what's in Netlify for consistency
```

## Verification

After setting up, verify environment variables are working:

1. **Check Production**: 
   - Visit: https://sameaisalesassistant.netlify.app
   - Open DevTools Console
   - Check for any API errors

2. **Check Deploy Preview**:
   - Create a test PR
   - Visit the deploy preview URL
   - Verify LinkedIn sync and other features work

3. **Check Build Logs**:
   - In Netlify dashboard → Deploys
   - Click on any deploy
   - Check for environment variable warnings

## Troubleshooting

### Variables Not Working?
- **Clear build cache**: Netlify Dashboard → Deploys → Trigger Deploy → Clear cache and deploy
- **Check spelling**: Variable names are case-sensitive
- **Verify prefix**: All frontend vars must start with `VITE_`
- **Rebuild**: Sometimes a fresh deploy is needed

### Different Values Per Context?
If you later need different values per context:
1. Go to Environment Variables in Netlify
2. Click on the variable
3. Choose "Different value for each deploy context"
4. Set specific values for Production, Deploy previews, etc.

## Current Status
As of the latest deployment, all environment variables should be configured with the same values across all deploy contexts for the SAM AI platform.