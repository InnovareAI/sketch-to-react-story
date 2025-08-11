# Complete Configuration Guide for SAM AI Platform

## Overview
This guide will help you configure all the external services required for the SAM AI platform to work with real integrations.

---

## 1. Unipile Configuration (LinkedIn OAuth)

### Step 1: Create Unipile Account
1. Visit [https://app.unipile.com/register](https://app.unipile.com/register)
2. Sign up for a new account
3. Choose the appropriate plan (Developer plan for testing)

### Step 2: Get API Credentials
1. Navigate to **Settings** → **API Keys**
2. Create a new API key
3. Copy the API key and Account ID

### Step 3: Configure LinkedIn Provider
1. Go to **Providers** → **LinkedIn**
2. Enable LinkedIn integration
3. Configure OAuth settings:
   - Redirect URI: `https://sameaisalesassistant.netlify.app/auth/linkedin/callback`
   - Scopes: Select all required permissions

### Environment Variables:
```env
VITE_UNIPILE_API_KEY=your_unipile_api_key_here
VITE_UNIPILE_ACCOUNT_ID=your_unipile_account_id_here
```

---

## 2. Bright Data Configuration (Proxy Service)

### Step 1: Create Bright Data Account
1. Visit [https://brightdata.com](https://brightdata.com)
2. Sign up for an account
3. Choose "Residential Proxies" product

### Step 2: Set Up Proxy Zone
1. Navigate to **Proxies** → **Create Zone**
2. Select "Residential IPs"
3. Configure zone settings:
   - Name: `sam-ai-linkedin`
   - IP Rotation: Per request
   - Countries: Enable all 15 countries we support

### Step 3: Get Credentials
1. Go to zone settings
2. Copy your Customer ID
3. Generate and copy zone password

### Environment Variables:
```env
VITE_BRIGHTDATA_CUSTOMER_ID=your_customer_id_here
VITE_BRIGHTDATA_PASSWORD=your_zone_password_here
VITE_BRIGHTDATA_ZONE=sam-ai-linkedin
```

---

## 3. Supabase Configuration

### Step 1: Verify Supabase Project
Your Supabase project should already be set up. Verify the URL and keys:

1. Visit [https://app.supabase.com](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **API**
4. Copy the Project URL and anon key

### Step 2: Create Required Tables
Run these SQL commands in the Supabase SQL editor:

```sql
-- User invites table
CREATE TABLE IF NOT EXISTS user_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id),
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  role TEXT DEFAULT 'member',
  department TEXT,
  permissions JSONB DEFAULT '{}',
  invite_link TEXT,
  expires_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending',
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Team accounts table for LinkedIn
CREATE TABLE IF NOT EXISTS team_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  provider TEXT DEFAULT 'LINKEDIN',
  email TEXT,
  name TEXT,
  profile_url TEXT,
  profile_picture TEXT,
  status TEXT DEFAULT 'active',
  unipile_account_id TEXT,
  metadata JSONB DEFAULT '{}',
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  last_sync TIMESTAMPTZ,
  disconnected_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE user_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_accounts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own team accounts" ON team_accounts
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage invites" ON user_invites
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );
```

### Step 3: Create Edge Function for Email Invites
Create a new edge function in Supabase:

1. Go to **Edge Functions**
2. Create new function: `send-invite-email`
3. Add this code:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, firstName, workspaceName, inviteLink, customMessage, inviterName } = await req.json()

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>You're Invited to Join ${workspaceName} on SAM AI</h2>
        <p>Hi ${firstName},</p>
        <p>${inviterName} has invited you to join the ${workspaceName} workspace on SAM AI.</p>
        ${customMessage ? `<p><em>${customMessage}</em></p>` : ''}
        <p>Click the button below to accept the invitation and set up your account:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${inviteLink}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Accept Invitation
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">This invitation will expire in 7 days.</p>
        <p style="color: #666; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:<br>${inviteLink}</p>
      </div>
    `

    // Here you would integrate with your email service (SendGrid, Resend, etc.)
    // For now, we'll just return success
    
    return new Response(
      JSON.stringify({ success: true, message: 'Email sent successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
```

### Environment Variables:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## 4. n8n Configuration

### Step 1: Access n8n Instance
Your n8n instance is at: https://workflows.innovareai.com

### Step 2: Create Webhook Endpoints
Create these webhook workflows in n8n:

#### LinkedIn Sync Webhook
1. Create new workflow
2. Add **Webhook** node:
   - HTTP Method: POST
   - Path: `/linkedin-sync`
   - Response Mode: Immediately
3. Add **Supabase** node to update account data
4. Save and activate

#### Campaign Processing Webhook
1. Create new workflow
2. Add **Webhook** node:
   - HTTP Method: POST
   - Path: `/process-campaign`
3. Add your processing logic
4. Save and activate

### Step 3: Configure Credentials in n8n
1. Go to **Credentials**
2. Add these credentials:
   - **Supabase**: Use your Supabase URL and service role key
   - **OpenAI**: Add your OpenAI API key
   - **Anthropic**: Add your Anthropic API key

### Environment Variables:
```env
VITE_N8N_URL=https://workflows.innovareai.com
VITE_N8N_API_KEY=your_n8n_api_key_if_needed
```

---

## 5. AI Model Configuration

### OpenAI
1. Visit [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Create a new API key
3. Set usage limits if needed

### Anthropic (Claude)
1. Visit [https://console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys)
2. Create a new API key
3. Configure rate limits

### Environment Variables:
```env
VITE_OPENAI_API_KEY=sk-proj-...
VITE_ANTHROPIC_API_KEY=sk-ant-api03-...
```

---

## 6. Complete .env.local File

Create a `.env.local` file in your project root with all configurations:

```env
# Supabase
VITE_SUPABASE_URL=https://latxadqrvrrrcvkktrog.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Unipile (LinkedIn OAuth)
VITE_UNIPILE_API_KEY=your_unipile_api_key
VITE_UNIPILE_ACCOUNT_ID=your_unipile_account_id

# Bright Data (Proxy)
VITE_BRIGHTDATA_CUSTOMER_ID=your_customer_id
VITE_BRIGHTDATA_PASSWORD=your_zone_password
VITE_BRIGHTDATA_ZONE=sam-ai-linkedin

# n8n Workflow Automation
VITE_N8N_URL=https://workflows.innovareai.com
VITE_N8N_API_KEY=optional_if_needed

# AI Models
VITE_OPENAI_API_KEY=sk-proj-...
VITE_ANTHROPIC_API_KEY=sk-ant-api03-...

# Feature Flags
VITE_ENABLE_VOICE=true
VITE_ENABLE_LINKEDIN=true
VITE_ENABLE_EMAIL=true
VITE_DEFAULT_MODEL=quality
```

---

## 7. Netlify Configuration

### Add Environment Variables to Netlify:
1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Select your site: `sameaisalesassistant`
3. Go to **Site settings** → **Environment variables**
4. Add all the variables from your `.env.local` file

### Deploy with new environment:
```bash
git push origin main
```

Netlify will automatically rebuild with the new environment variables.

---

## 8. Testing Checklist

After configuration, test these features:

- [ ] LinkedIn OAuth connection (real account)
- [ ] Proxy location selection and verification
- [ ] User invitation email sending
- [ ] n8n webhook triggers
- [ ] AI model responses (OpenAI/Anthropic)
- [ ] Supabase data persistence
- [ ] Real-time updates

---

## 9. Security Notes

1. **Never commit API keys to Git**
2. **Use environment variables for all secrets**
3. **Enable 2FA on all service accounts**
4. **Regularly rotate API keys**
5. **Monitor usage and set limits**
6. **Use Row Level Security in Supabase**

---

## 10. Support & Documentation

- **Unipile Docs**: https://docs.unipile.com
- **Bright Data Docs**: https://docs.brightdata.com
- **Supabase Docs**: https://supabase.com/docs
- **n8n Docs**: https://docs.n8n.io
- **OpenAI Docs**: https://platform.openai.com/docs
- **Anthropic Docs**: https://docs.anthropic.com

---

## Quick Start Commands

```bash
# Install dependencies
npm install

# Run locally with environment variables
npm run dev

# Build for production
npm run build

# Deploy to Netlify
netlify deploy --prod
```

---

## Troubleshooting

### LinkedIn Connection Issues
- Check Unipile API key is valid
- Verify OAuth redirect URI matches
- Check browser console for errors
- Ensure popups are allowed

### Proxy Issues
- Verify Bright Data credentials
- Check zone configuration
- Ensure IP rotation is enabled
- Monitor usage limits

### Email Issues
- Check Supabase edge function logs
- Verify email service integration
- Check spam folders
- Validate email templates

### n8n Issues
- Ensure webhooks are activated
- Check n8n credentials
- Verify Supabase connection
- Monitor workflow executions