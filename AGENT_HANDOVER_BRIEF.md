# 🤝 SAM AI Agent Handover Brief

## 🎯 Project Overview
**SAM AI** - An AI-powered Sales Automation Platform with multi-tenant architecture, campaign management, and real-time messaging capabilities.

## 🚨 CRITICAL CONTEXT
- **Repository Confusion**: Lovable (the development tool) publishes to `sketch-to-react-story` repo, but the app is called "SAM AI" 
- **Current Working Directory**: `/Users/tvonlinz/Dev_Master/InnovareAI/sketch-to-react-story/`
- **Original Repo** (not used): `/Users/tvonlinz/Dev_Master/InnovareAI/sam-ai/`
- **Decision Made**: Work in sketch-to-react-story where Lovable actually publishes (Option 1)

## 📍 Current Status

### ✅ Completed
- [x] Staging branch created and pushed
- [x] Supabase staging credentials configured
- [x] Environment variables set up for Netlify
- [x] Database schema file created (`staging-schema.sql`)
- [x] Deployment instructions documented

### 🔄 In Progress
- [ ] Apply database schema to staging Supabase
- [ ] Configure Netlify branch deployments
- [ ] Create test user accounts
- [ ] Test staging deployment

### 📋 Pending Tasks
1. **Apply Database Schema**:
   - Go to: https://supabase.com/dashboard/project/latxadqrvrrrcvkktrog/sql/new
   - Copy contents of `staging-schema.sql`
   - Execute in SQL editor

2. **Configure Netlify Branch Deploys**:
   - Enable branch deploys at: https://app.netlify.com/sites/sameaisalesassistant/settings/deploys
   - Staging will deploy to: `https://staging--sameaisalesassistant.netlify.app`

3. **Create Test Users**:
   - Via Supabase Auth dashboard
   - Test credentials: test@samaisales.com / TestUser123!

4. **Verify Deployment**:
   - Push any change to staging branch
   - Monitor at: https://app.netlify.com/sites/sameaisalesassistant/deploys

## 🏗️ Architecture & Infrastructure

### Repositories
```
/Users/tvonlinz/Dev_Master/InnovareAI/
├── sketch-to-react-story/     ← ACTIVE REPO (Lovable publishes here)
│   ├── src/                   ← React application code
│   ├── supabase/              ← Edge functions
│   ├── public/                ← Static assets
│   ├── .env.local             ← Staging Supabase config
│   ├── staging-schema.sql     ← Database schema
│   ├── netlify.toml           ← Netlify configuration
│   └── package.json           ← Dependencies
│
└── sam-ai/                    ← LEGACY REPO (has schema files but not used by Lovable)
    └── Contains original database schemas and migrations
```

### Key Services
1. **Supabase (Staging)**:
   - URL: https://latxadqrvrrrcvkktrog.supabase.co
   - Dashboard: https://supabase.com/dashboard/project/latxadqrvrrrcvkktrog
   - Anon Key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhdHhhZHFydnJycmN2a2t0cm9nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTk5ODYsImV4cCI6MjA2ODI3NTk4Nn0.3WkAgXpk_MyQioVf_SED9O_ArjcT9nH0uy9we2okftE`

2. **Netlify**:
   - Site: https://app.netlify.com/sites/sameaisalesassistant
   - Production: https://sameaisalesassistant.netlify.app
   - Staging: https://staging--sameaisalesassistant.netlify.app (pending setup)

3. **GitHub**:
   - Active Repo: https://github.com/InnovareAI/sketch-to-react-story
   - Legacy Repo: https://github.com/InnovareAI/sam-ai

4. **Lovable**:
   - Project: https://lovable.dev/projects/bba3997b-0289-4c6b-aef5-aefb7e33e751
   - Auto-publishes to: sketch-to-react-story repo

## 📁 Important Files

### Configuration Files
- `.env.local` - Supabase staging credentials
- `netlify.toml` - Netlify build configuration
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration

### Database Files
- `staging-schema.sql` - Complete database schema for staging
- `/sam-ai/migrations/` - Original migration files (reference only)
- `/sam-ai/COMPLETE_DATABASE_SCHEMA.sql` - Full schema reference

### Documentation
- `STAGING_SETUP_INSTRUCTIONS.md` - Step-by-step staging setup
- `NETLIFY_DEPLOYMENT.md` - Netlify deployment guide
- `README.md` - Project overview

### Application Structure
```
src/
├── components/
│   ├── ui/           # shadcn/ui components
│   ├── workspace/    # Workspace layout components
│   └── dashboard/    # Dashboard widgets
├── pages/            # Route pages
├── hooks/            # Custom React hooks
├── lib/
│   ├── supabase.ts   # Supabase client
│   └── utils.ts      # Utility functions
└── integrations/
    └── supabase/     # Supabase types & client
```

## 🔧 Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run Netlify dev server (with env vars)
netlify dev

# Deploy to staging
git checkout staging
git push origin staging

# Deploy to production
git checkout main
git push origin main

# Set Netlify environment variables
./setup-netlify-env.sh
```

## 🚀 Deployment Workflow

### Via Lovable (Auto)
1. Make changes in Lovable editor
2. Auto-commits to `main` branch
3. Netlify auto-deploys to production

### Manual Testing Flow
1. Work in staging branch:
   ```bash
   git checkout staging
   git add .
   git commit -m "feat: description"
   git push origin staging
   ```
2. Test at: https://staging--sameaisalesassistant.netlify.app
3. If good, merge to main:
   ```bash
   git checkout main
   git merge staging
   git push origin main
   ```

## ⚠️ Known Issues & Solutions

### Issue 1: Lovable publishes to wrong repo
- **Problem**: Lovable configured to push to sketch-to-react-story instead of sam-ai
- **Solution**: Accepted to work in sketch-to-react-story (Option 1)
- **Status**: Working as intended now

### Issue 2: Database schema not applied
- **Problem**: Staging Supabase doesn't have tables yet
- **Solution**: Apply `staging-schema.sql` via Supabase dashboard
- **Status**: Pending

### Issue 3: Branch deployments not configured
- **Problem**: Netlify not set up for staging branch deploys
- **Solution**: Configure in Netlify dashboard settings
- **Status**: Pending

## 🎯 Immediate Next Steps

1. **Apply Database Schema** (5 min):
   - Copy `staging-schema.sql` 
   - Paste in Supabase SQL editor
   - Execute

2. **Enable Branch Deploys** (2 min):
   - Go to Netlify settings
   - Enable "All branches" under Branch deploys
   - Save

3. **Test Deployment** (5 min):
   - Make small change in staging branch
   - Push and verify deployment
   - Check staging URL works

4. **Create Test User** (2 min):
   - Use Supabase Auth dashboard
   - Create user with test credentials

## 📊 Database Schema Overview

### Core Tables
- `workspaces` - Multi-tenant isolation
- `profiles` - User profiles with roles
- `accounts` - CRM accounts
- `contacts` - CRM contacts
- `campaigns` - Marketing campaigns
- `messages` - Email/message queue
- `ai_assistants` - AI agent configurations
- `conversations` - AI chat threads
- `conversation_messages` - Chat messages
- `integrations` - Third-party integrations
- `workflows` - Automation workflows
- `analytics_events` - Event tracking

### Security
- Row Level Security (RLS) enabled on all tables
- Workspace-based data isolation
- Role-based access control (owner, admin, member, viewer)

## 🔗 Quick Links

### Development
- Lovable: https://lovable.dev/projects/bba3997b-0289-4c6b-aef5-aefb7e33e751
- GitHub (Active): https://github.com/InnovareAI/sketch-to-react-story
- Local Dev: http://localhost:5173

### Staging Environment
- Supabase: https://supabase.com/dashboard/project/latxadqrvrrrcvkktrog
- Netlify: https://staging--sameaisalesassistant.netlify.app (pending)

### Production
- Live App: https://sameaisalesassistant.netlify.app
- Netlify Dashboard: https://app.netlify.com/sites/sameaisalesassistant

## 💡 Tips for New Agent

1. **Always work in sketch-to-react-story directory** - This is where Lovable publishes
2. **Test in staging branch first** - Don't push directly to main unless via Lovable
3. **Check Supabase dashboard** for database state before making schema changes
4. **Use netlify dev** for local development with proper env vars
5. **Reference sam-ai directory** for original schemas and migrations
6. **Monitor Netlify deploys** at dashboard after pushing changes

## 📝 Final Notes

The project is in a transition state where:
- Code lives in `sketch-to-react-story` (unexpected name but correct repo)
- App is called "SAM AI" (branding)
- Staging environment is partially configured
- Database schema needs to be applied
- User chose to work with current setup rather than fix Lovable configuration

Focus on completing the staging setup and ensuring smooth deployment workflow.