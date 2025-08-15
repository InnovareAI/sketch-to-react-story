# 3Cubed Pharmaceutical SEO Platform

## Current Repository & Deployment
- **GitHub Repository**: https://github.com/InnovareAI/sketch-to-react-story
- **Live Production URL**: https://app.3c-seo.com
- **Project Path**: `/Users/tvonlinz/Dev_Master/3cubed/SEO_Platform`

## Deployment Protocol
- **ALWAYS deploy directly to MAIN branch for production**
- **NO staging environment** - deploy directly to live
- **Netlify automatically deploys from main branch**

## Project Overview
Pharmaceutical SEO content automation platform for drug information management:
- React + TypeScript + Vite + Supabase
- AI-powered pharmaceutical content generation
- Medical accuracy validation and compliance scoring
- SEO optimization for drug submissions
- Workflow management for pharmaceutical content review

## Tech Stack
- **Frontend**: React 18, TypeScript, Vite, shadcn/ui, Tailwind CSS
- **Backend**: Supabase (PostgreSQL database, auth, edge functions)
- **AI Processing**: Supabase Edge Functions with direct-llm-processor
- **Forms**: HTML5 forms with direct database integration
- **Database**: PostgreSQL with submissions table, RLS security
- **Deployment**: Netlify (auto-deploy from main branch)

## Key Components
- **Submissions Form** - HTML form at `/dist/WORKING_FORM.html` for drug submissions
- **Target Audience Selection** - HCP vs Patient content differentiation
- **AI Content Generation** - Edge function generates audience-specific SEO content
- **Database Integration** - Direct PostgreSQL submissions table with 86+ entries
- **Medical Validation** - Compliance scoring and accuracy verification
- **SEO Optimization** - Meta tags, keywords, schema markup generation

## Current Database Status
- **86+ pharmaceutical submissions** in production database (as of 2025-08-15)
- **Active drugs**: Keytruda, Ozempic, Ibrance, Kisqali, Skyrizi, Rinvoq, Advil, Metformin
- **Therapeutic areas**: Oncology, Immunology, Endocrinology, Dermatology, Pain Management
- **Target audiences**: Both HCP and Patient content supported
- **AI processing pipeline**: Fully operational with audience-specific content generation
- **Database connection**: PostgreSQL via Supabase with auto-processing triggers

## Deployment Commands
```bash
cd /Users/tvonlinz/Dev_Master/3cubed/SEO_Platform
git add .
git commit -m "feat: description"
git push origin main
```

## Environment Variables (Supabase Edge Functions)
- SUPABASE_URL - Database connection
- SUPABASE_SERVICE_ROLE_KEY - Admin access
- SUPABASE_ANON_KEY - Public API access (for forms)

## Important Notes for Next Assistant
- **Pharmaceutical focus only** - No LinkedIn, social media, N8N, Perplexity, or OpenRouter
- **Current tech stack**: React + Supabase + Edge Functions ONLY
- **Form submission**: `/dist/WORKING_FORM.html` connects directly to PostgreSQL
- **Target audience feature**: HCP vs Patient content differentiation implemented
- **AI processing**: `direct-llm-processor` Edge Function handles content generation
- **Database operational** - 86+ pharmaceutical submissions with auto-processing
- **Workflow stages**: pending_review → processing → ai_processed → seo_review
- **Medical compliance validation** - Accuracy scoring and regulatory compliance checks

## Status: Pharmaceutical SEO Platform OPERATIONAL ✅