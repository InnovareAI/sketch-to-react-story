# SAM AI - Sketch to React Story Platform

## Current Repository & Deployment
- **GitHub Repository**: https://github.com/InnovareAI/sketch-to-react-story
- **Live Production URL**: https://sameaisalesassistant.netlify.app
- **Project Path**: `/Users/tvonlinz/Dev_Master/InnovareAI/sketch-to-react-story`

## Deployment Protocol
- **ALWAYS deploy directly to MAIN branch for production**
- **NO staging environment** - deploy directly to live
- **Netlify automatically deploys from main branch**

## Project Overview
SAM AI platform with LinkedIn data scraping and professional intelligence gathering:
- React + TypeScript + Vite + Supabase
- LinkedIn Profile Scraping via Bright Data proxies
- Campaign automation and message sequences
- CSV prospect upload and management
- Real-time analytics and performance tracking

## Tech Stack
- **Frontend**: React 18, TypeScript, Vite, shadcn/ui, Tailwind CSS
- **Backend**: Supabase (database, auth, edge functions)
- **Integrations**: Bright Data (residential proxies), LinkedIn automation
- **Deployment**: Netlify (auto-deploy from main branch)

## Key Components
- **Profile.tsx** - Complete user profile management (RECENTLY COMPLETED)
- **CampaignSetup.tsx** - LinkedIn campaign management interface
- **WorkspaceSidebar.tsx** - Navigation sidebar
- **LinkedInIntegration.tsx** - Bright Data proxy integration
- **MessageQueue.tsx** - Message queue management

## Recent Major Updates
### Admin User Management System (COMPLETED)
✅ **Dual user invitation methods** - Direct invite with temp password OR LinkedIn URL import
✅ **AddUserModal component** - Clean modal UI with two tabs for different invitation methods
✅ **UserSetup flow** - 3-step onboarding: password setup, LinkedIn auth, completion
✅ **Admin-only controls** - "Add User" button only visible to admins
✅ **Temporary passwords** - Auto-generated secure passwords for invited users
✅ **LinkedIn integration** - Import users directly from LinkedIn profiles
✅ **Role management** - Assign Admin/Member roles during invitation
✅ **Setup links** - Unique token-based URLs for user onboarding

### Profile Page (Previously Completed)
✅ **Profile page fully functional** - All features working without authentication
✅ **No authentication required** - Uses static mock data for immediate functionality
✅ **All CTA buttons working** - Every button has proper functionality
✅ **Name editing persists** - Profile changes save and update UI immediately
✅ **Responsive design** - Works on all devices

## Deployment Commands
```bash
cd /Users/tvonlinz/Dev_Master/InnovareAI/sketch-to-react-story
git add .
git commit -m "feat: description"
git push origin main
```

## Environment Variables (Netlify)
- Bright Data proxy credentials
- Supabase connection strings
- LinkedIn API configurations

## Important Notes for Next Assistant
- **Admin User Management COMPLETE** - Full invitation system with two methods
- **UserSetup route FUNCTIONAL** - `/setup/:token` handles invited user onboarding
- **Members page ENHANCED** - Shows "Add User" button for admins only
- **Profile page COMPLETE** - No more work needed on /profile route
- **Authentication removed** - Works with localStorage-based auth
- **All routes work** - No ProtectedRoute wrappers causing issues
- **Auto-deploy active** - Every push to main goes live immediately

## Status: Admin User Management COMPLETE ✅