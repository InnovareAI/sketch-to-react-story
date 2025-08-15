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
SAM AI - Advanced multi-agent sales automation platform:
- Conversational onboarding with human-in-the-loop message approval
- 8-step orchestration workflow via N8N integration
- LinkedIn + Email automation via Unipile and ReachInbox
- Per-user RAG database for personalized AI responses
- Real-time prospect intelligence and campaign management

## Tech Stack
- **Frontend**: React 18, TypeScript, Vite, shadcn/ui, Tailwind CSS
- **Backend**: Supabase (database, auth, edge functions, per-user RAG)
- **Workflow Orchestration**: N8N (8-step SAM automation process)
- **Integrations**: 
  - Apify MCP (LinkedIn/web scraping)
  - Unipile (LinkedIn automation, calendar)
  - ReachInbox (email automation)
  - YouTube transcript analysis
- **AI Processing**: N8N MCP integration with Anthropic best practices
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

## SAM AI Implementation Status

### 🎯 Current Focus: Conversational Onboarding Agent
🔄 **In Progress**: Building conversational interface that orchestrates full SAM workflow

### ✅ Completed Components
- **Admin User Management System** - Full invitation system with LinkedIn import
- **Profile Management** - Complete user profile functionality
- **Message Approval Architecture** - Human-in-the-loop draft approval system
- **N8N Workflow Integration** - Connection to orchestration workflows
- **RAG Database Design** - Per-user knowledge base architecture
- **Quick Actions Interface** - 6 core SAM workflow triggers in WorkspaceDashboard

### 🔄 In Development
- **Conversational Onboarding Agent** - SAM's interactive setup process
- **Content Ingestion System** - Website, PDF, YouTube processing
- **Real-time Workspace Updates** - Live workflow execution status

### 📋 Next Phase
- **Human Approval System Implementation** - Email-based draft approval (2hr timeout)
- **Reply Agent Enhancement** - Cross-channel reply monitoring and drafting
- **Campaign Workflow Integration** - Layer additional campaigns on main workflow

### 📍 Key SAM AI Files
- `/docs/SAM_AI_Message_Approval_System.md` - Complete system documentation
- `/src/components/workspace/WorkspaceDashboard.tsx` - Main dashboard with 6 Quick Actions
- `/src/services/apifyMcp.ts` - LinkedIn/web scraping integration
- `/src/services/unipile/UnipileService.ts` - LinkedIn automation
- `/src/services/agents/specialists/KnowledgeBaseAgent.ts` - RAG-based responses
- `/src/components/ai/AIMessageEngine.tsx` - AI message generation interface

### 🔗 N8N Integration
- **Workspace**: https://workflows.innovareai.com/projects/E9Xq0Sqn9jUGEbhJ/folders/SnksL8ALgkPaT9yw/workflows
- **Main Orchestration**: 8-step SAM workflow (scraping → enrichment → scoring → personalization → broadcasting → reply handling → drafting → follow-up)
- **MCP Integration**: All AI processing handled via N8N MCP workflows

## Status: SAM AI Architecture Designed ✅ | Implementation In Progress 🔄