# Staging Environment Setup Instructions

## Current Status
✅ Staging branch created and pushed to GitHub  
✅ Supabase staging credentials configured  
✅ Environment variables ready for Netlify  
📋 Database schema ready to apply  

## Staging Supabase Details
- **URL**: https://latxadqrvrrrcvkktrog.supabase.co
- **Dashboard**: https://supabase.com/dashboard/project/latxadqrvrrrcvkktrog

## Apply Database Schema

### Option 1: Via Supabase Dashboard (Easiest)
1. Go to: https://supabase.com/dashboard/project/latxadqrvrrrcvkktrog/sql/new
2. Copy the entire contents of `staging-schema.sql`
3. Paste into the SQL editor
4. Click "Run" button
5. Schema will be created with all tables, indexes, and RLS policies

### Option 2: Via Supabase CLI
```bash
# Install Supabase CLI if not already installed
brew install supabase/tap/supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref latxadqrvrrrcvkktrog

# Apply the schema
supabase db push staging-schema.sql
```

## Configure Netlify Branch Deployments

1. Go to Netlify Dashboard: https://app.netlify.com/sites/sameaisalesassistant/settings/deploys

2. Under "Branch deploys", configure:
   - **Production branch**: main
   - **Branch deploys**: All branches
   - **Deploy previews**: Automatically build deploy previews for all pull requests

3. The staging branch will automatically deploy to:
   - `https://staging--sameaisalesassistant.netlify.app`

## Environment Variables in Netlify

Already configured via script, but verify in Netlify dashboard:
- `VITE_SUPABASE_URL`: https://latxadqrvrrrcvkktrog.supabase.co
- `VITE_SUPABASE_ANON_KEY`: eyJhbGc...
- `VITE_ENVIRONMENT`: staging

## Test the Staging Environment

1. **Push to staging branch**:
```bash
git checkout staging
# Make a small change to trigger deployment
echo "// Staging test" >> src/App.tsx
git add .
git commit -m "test: staging deployment"
git push origin staging
```

2. **Monitor deployment**:
   - Watch at: https://app.netlify.com/sites/sameaisalesassistant/deploys
   - Staging URL will be: https://staging--sameaisalesassistant.netlify.app

3. **Test functionality**:
   - Login/signup should work with staging Supabase
   - Data should be isolated from production
   - Check browser console for any errors

## Create Test User

After schema is applied, create a test user:

1. Go to: https://supabase.com/dashboard/project/latxadqrvrrrcvkktrog/auth/users
2. Click "Add user" → "Create new user"
3. Enter test credentials:
   - Email: test@samaisales.com
   - Password: TestUser123!
4. Auto-confirm email

Or via SQL in Supabase dashboard:
```sql
-- This will be handled by Supabase Auth UI
-- Users can sign up directly through the app
```

## Deployment Workflow

### For Developers (via Lovable):
1. Work in Lovable editor
2. Changes auto-commit to `main` branch
3. Production auto-deploys

### For Testing:
1. Merge changes to `staging` branch:
```bash
git checkout staging
git merge main
git push origin staging
```
2. Test at staging URL
3. If good, changes are already in production

### For Manual Changes:
1. Work in `sketch-to-react-story` directory
2. Push to `staging` first:
```bash
git checkout staging
git add .
git commit -m "feat: your changes"
git push origin staging
```
3. After testing, merge to main:
```bash
git checkout main
git merge staging
git push origin main
```

## Current Repository Structure
```
/Users/tvonlinz/Dev_Master/InnovareAI/
├── sketch-to-react-story/     ← We are here (Lovable publishes here)
│   ├── src/
│   ├── .env.local             ← Staging Supabase config
│   ├── staging-schema.sql     ← Database schema
│   └── package.json
└── sam-ai/                    ← Original repo (not used by Lovable)
```

## Important Notes
- Lovable publishes to `sketch-to-react-story` repo
- Netlify deploys from `sketch-to-react-story` repo
- Staging branch enables preview deployments
- All work should be done in staging environment, not local