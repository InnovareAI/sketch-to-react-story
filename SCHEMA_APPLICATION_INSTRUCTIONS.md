# 🚀 Sam AI Database Schema Application Instructions

## Critical Priority Task: Apply Complete Sam AI Schema

**Current Status**: 0/12 Sam AI tables exist in production database  
**Target**: https://latxadqrvrrrcvkktrog.supabase.co  
**Schema File**: `COMPLETE_SAM_AI_SCHEMA.sql`

## 📋 Step-by-Step Application Process

### Step 1: Access Supabase SQL Editor
1. Open: https://supabase.com/dashboard/project/latxadqrvrrrcvkktrog/sql/new
2. Login with your Supabase account credentials
3. Ensure you have admin access to the project

### Step 2: Apply Complete Schema
1. **Open the schema file**: `COMPLETE_SAM_AI_SCHEMA.sql` (17.36 KB)
2. **Copy the entire contents** (lines 1-438)
3. **Paste into Supabase SQL Editor**
4. **Execute the script** (Click "Run" button)

### Step 3: Verify Installation
```bash
node verify-schema.js
```

Expected output:
```
✅ workspaces - OK
✅ profiles - OK  
✅ accounts - OK
✅ contacts - OK
✅ campaigns - OK
✅ messages - OK
✅ ai_assistants - OK
✅ conversations - OK
✅ conversation_messages - OK
✅ integrations - OK
✅ workflows - OK
✅ analytics_events - OK

📊 Result: 12/12 tables verified
🎉 Sam AI Database Schema: 100% Complete!
```

## 🏗️ What Gets Created

### Core Tables (12 Total)
- `workspaces` - Multi-tenant foundation
- `profiles` - User management  
- `accounts` - Company data (Stage 2)
- `contacts` - Lead data (Stage 1)
- `campaigns` - Outreach campaigns (Stage 6)
- `messages` - Personalized messages (Stage 5)
- `ai_assistants` - AI models (Stage 3)
- `conversations` - Response handling (Stage 7)
- `conversation_messages` - Chat history
- `integrations` - External APIs
- `workflows` - Automation (Stage 8)
- `analytics_events` - Performance tracking

### Security Features
- ✅ **Row Level Security (RLS)** enabled on all tables
- ✅ **Workspace isolation** policies prevent cross-tenant access
- ✅ **Role-based permissions** (owner, admin, member, viewer)
- ✅ **Auth integration** with Supabase Auth

### Performance Optimizations  
- ✅ **25 strategic indexes** for high-performance queries
- ✅ **Automatic timestamp updates** via triggers
- ✅ **Optimized foreign key relationships**
- ✅ **JSONB fields** for flexible metadata storage

### Demo Data
- ✅ **Demo workspace** pre-configured for testing
- ✅ **Sample workspace ID**: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`
- ✅ **Slug**: `demo-workspace`

## 🎯 Sam AI 8-Stage Workflow Support

| Stage | Description | Database Table | Status |
|-------|-------------|----------------|--------|
| 1 | Lead Scraping | `contacts` | Ready |
| 2 | Data Enrichment | `accounts` | Ready |  
| 3 | Knowledge Base RAG | `ai_assistants` | Ready |
| 4 | ICP Matching | `contacts.qualification_data` | Ready |
| 5 | Personalization | `messages` | Ready |
| 6 | Multi-channel Outreach | `campaigns` | Ready |
| 7 | Response Handling | `conversations` | Ready |
| 8 | Follow-up Automation | `workflows` | Ready |

## 🔄 Post-Installation Steps

### 1. Verify Schema
```bash
node verify-schema.js
```

### 2. Test Database Connectivity  
```bash
node check-database-status.js
```

### 3. Create Initial Test Data
```bash
node setup-multi-tenant.js
```

## 🐛 Troubleshooting

### If Schema Application Fails:
1. **Check permissions**: Ensure you have admin access
2. **Clear existing policies**: Drop any conflicting RLS policies first
3. **Apply in sections**: If full schema fails, apply table by table

### If Tables Don't Appear:
1. **Refresh browser**: Hard reload the Supabase dashboard
2. **Check public schema**: Ensure tables are in `public` schema
3. **Verify permissions**: Run `GRANT` statements manually

### If RLS Errors Occur:
1. **Disable RLS temporarily**: `ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;`
2. **Apply policies one by one**: Test each policy individually
3. **Check auth context**: Ensure proper user authentication

## ⚡ Expected Performance Impact

**Schema Application Time**: 2-5 minutes  
**Verification Time**: 30 seconds  
**Database Size Impact**: ~10MB for empty schema  
**Query Performance**: Optimized with indexes

## 🎉 Success Criteria

- ✅ All 12 Sam AI tables created successfully
- ✅ RLS policies active and enforcing workspace isolation  
- ✅ Demo workspace exists and accessible
- ✅ Basic CRUD operations work with workspace filtering
- ✅ React app can connect and query all tables

## 🚨 Critical Notes

1. **Backup First**: Create database backup before applying schema
2. **Service Role Required**: Schema creation requires elevated privileges
3. **One-Time Application**: Schema is idempotent but should only be run once
4. **Multi-Tenant Ready**: All tables include `workspace_id` for isolation

---

**Priority**: CRITICAL (blocks 67% of Sam AI functionality)  
**Time Required**: 15-30 minutes total  
**Risk Level**: LOW (idempotent schema with safeguards)