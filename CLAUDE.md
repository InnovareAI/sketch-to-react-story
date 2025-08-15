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
- AI-powered pharmaceutical content generation with 4-stage development prompts
- Medical accuracy validation and compliance scoring
- SEO optimization for drug submissions with audience differentiation
- Workflow management for pharmaceutical content review

## Tech Stack
- **Frontend**: React 18, TypeScript, Vite, shadcn/ui, Tailwind CSS
- **Backend**: Supabase (PostgreSQL database, auth, edge functions)
- **AI Processing**: Supabase Edge Functions with direct-llm-processor
- **Forms**: HTML5 forms with direct database integration
- **Database**: PostgreSQL with submissions table, RLS security
- **Deployment**: Netlify (auto-deploy from main branch)

## Key Features - 4-Stage Pharmaceutical SEO System
### STAGE 1: Market Shaping
- **Disease education content** without brand names
- Builds disease category awareness before product promotion
- Based on regulatory examples (ntmfacts.com, yourattentionplease.com)

### STAGE 2: Phase III Clinical Trial
- **Pre-launch clinical focus** with trial data emphasis
- Regulatory pathway and approval timeline content
- Clinical efficacy and safety findings

### STAGE 3: Market Launch 1-6 Months
- **Early adoption focus** highlighting NEW availability
- FDA approval and innovative treatment messaging
- Access and availability information

### STAGE 4: Market Launch 7-12 Months
- **Established experience focus** with proven efficacy
- Real-world evidence and outcomes
- Widespread prescriber adoption messaging

## Target Audience Differentiation
- **HCP Content**: Medical terminology, clinical data, prescribing information
- **Patient Content**: Accessible language, quality of life focus, prescription safety

## SEO Formatting Requirements
- **Title Format**: `Condition | BRAND® (generic)` (Stages 2-4 only)
- **Meta Description**: Condition descriptors, NO clinical trials (except Phase III)
- **H1 Tags**: NO brand names, treatment/condition focus only

## Current Database Status
- **100+ pharmaceutical submissions** in production database
- **Active drugs**: Keytruda, Ozempic, Ibrance, Kisqali, Skyrizi, Rinvoq, AUTOTEST-DRUG
- **Therapeutic areas**: Oncology, Immunology, Endocrinology, Dermatology
- **Target audiences**: Both HCP and Patient content fully operational
- **AI processing pipeline**: 4-stage prompts with auto-triggers functional
- **Database connection**: PostgreSQL via Supabase with real-time processing

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
- OPENROUTER_API_KEY - AI processing via Claude-3.5-Sonnet

## Important Notes for Next Assistant
- **Pharmaceutical focus only** - Complete 4-stage SEO system operational
- **Real prescription drugs only** - No fake data or test compounds
- **Stage-specific prompts**: Market Shaping (disease education), Phase III (clinical), Launch 1-6mo (new), Launch 7-12mo (proven)
- **Target audience feature**: HCP vs Patient content differentiation implemented
- **AI processing**: `direct-llm-processor` Edge Function with OpenRouter/Claude
- **Database operational** - 100+ pharmaceutical submissions with auto-processing
- **Workflow stages**: pending_review → processing → ai_processed → seo_review
- **Medical compliance**: Accuracy scoring and regulatory compliance checks
- **SEO dashboard**: `/seo-review` shows all generated content with audience badges

## Status: 4-Stage Pharmaceutical SEO Platform FULLY OPERATIONAL ✅
