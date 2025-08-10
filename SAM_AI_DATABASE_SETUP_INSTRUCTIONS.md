# Sam AI Database Setup Instructions

## Status: Ready for Manual Schema Application

**Database URL**: `https://latxadqrvrrrcvkktrog.supabase.co`  
**Current State**: Missing core tables (0/12 tables exist)  
**Required Action**: Apply complete schema via Supabase SQL Editor

---

## 🚨 IMMEDIATE ACTION REQUIRED

### Step 1: Access Supabase SQL Editor
1. Go to: [https://supabase.com/dashboard/project/latxadqrvrrrcvkktrog/sql/new](https://supabase.com/dashboard/project/latxadqrvrrrcvkktrog/sql/new)
2. Sign in to your Supabase account if prompted

### Step 2: Apply Complete Schema
1. Copy the entire schema from the file: `COMPLETE_SAM_AI_SCHEMA.sql`
2. Paste it into the Supabase SQL Editor
3. Click "RUN" button to execute

**⚠️ Important**: This schema is idempotent - safe to run multiple times

### Step 3: Verify Installation
After running the schema, execute:
```bash
node check-database-status.js
```

Expected result: `✅ Existing tables: 12/12 - 📊 Completion: 100%`

---

## 🏗️ Schema Overview

### Created Tables (12 total):

| Table | Purpose | Sam AI Stage |
|-------|---------|--------------|
| `workspaces` | Multi-tenant foundation | Infrastructure |
| `profiles` | User management & roles | Infrastructure |
| **`accounts`** | Company data storage | **Stage 2 - Data Enrichment** |
| `contacts` | Lead/prospect data | Stage 1 - Lead Scraping |
| **`campaigns`** | Campaign management | **Stage 6 - Multi-channel Outreach** |
| `messages` | Message tracking | Stage 5 - Personalization |
| `ai_assistants` | Sam AI configuration | Stage 3 - Knowledge Base RAG |
| `conversations` | Conversation tracking | Stage 7 - Response Handling |
| `conversation_messages` | Chat history | Stage 7 - Response Handling |
| `integrations` | MCP credentials | All stages |
| `workflows` | n8n automation | Stage 8 - Follow-up Automation |
| `analytics_events` | Performance tracking | All stages |

### Key Features:
- ✅ **Complete Multi-tenancy**: Workspace-based isolation
- 🔐 **Row Level Security**: All tables protected with workspace-based RLS
- ⚡ **Performance Optimized**: 15+ indexes for high-volume operations  
- 🔄 **Auto-timestamps**: Automatic `updated_at` triggers
- 🎯 **Sam AI Optimized**: Fields specifically designed for 8-stage workflow

---

## 🎯 Critical Missing Tables Analysis

### `accounts` Table (Stage 2 - Data Enrichment)
**Purpose**: Store enriched company data from Apify/LinkedIn scraping

**Key Fields**:
- `linkedin_company_id` - LinkedIn company identifier
- `scraped_data` - Raw Apify scraping results  
- `enrichment_data` - Processed company insights
- `ideal_customer_profile` - ICP scoring data
- `company_size`, `annual_revenue` - Qualification fields

**MCP Integration**: Apify MCP stores results here

### `campaigns` Table (Stage 6 - Multi-channel Outreach)  
**Purpose**: Manage LinkedIn/email campaigns and sequences

**Key Fields**:
- `linkedin_sequence_config` - Campaign automation settings
- `n8n_workflow_id` - Associated n8n workflow
- `apify_actor_config` - Apify scraping configuration
- `personalization_settings` - Message personalization rules
- `performance_metrics` - Real-time campaign analytics

**MCP Integration**: n8n MCP workflows reference campaigns

---

## 🔗 MCP Integration Readiness

Once schema is applied, these MCP integrations will be fully supported:

### 1. Apify MCP
- **Storage**: `integrations` table (credentials)
- **Data Flow**: Scraping results → `contacts` & `accounts` tables
- **Configuration**: Actor configs in `campaigns.apify_actor_config`

### 2. n8n MCP
- **Storage**: `workflows` table (workflow definitions)
- **Integration**: `campaigns.n8n_workflow_id` references
- **Automation**: Trigger workflows from database events

### 3. Unipile MCP
- **Storage**: `integrations` table (LinkedIn API tokens)
- **Messaging**: Results stored in `messages` table
- **Campaigns**: LinkedIn sequences via `campaigns` table

### 4. PostgreSQL MCP
- **Direct Access**: All tables accessible via MCP
- **Real-time Queries**: Live data for Sam AI decision making
- **Analytics**: Complex queries on `analytics_events`

---

## 📊 Expected Performance Impact

### Database Operations (Monthly):
- **Lead Scraping**: ~50,000 contact inserts
- **Data Enrichment**: ~10,000 account updates  
- **Campaign Management**: ~5,000 campaign operations
- **Message Tracking**: ~100,000 message events
- **Analytics**: ~500,000 event inserts

### Supabase Tier Recommendations:
- **Development**: Free tier sufficient (500MB)
- **Production**: Pro tier ($25/month) for 8GB + better performance
- **Scale**: Team tier for high-volume operations

---

## 🔐 Security & Compliance

### Row Level Security (RLS):
- ✅ All tables protected with workspace isolation
- ✅ Users can only access their workspace data
- ✅ No cross-tenant data leakage possible
- ✅ Admin/owner role-based permissions

### Data Privacy:
- ✅ JSONB fields for flexible data storage
- ✅ Configurable data retention policies
- ✅ Audit trail via `analytics_events`
- ✅ Secure credential storage in `integrations`

---

## 🧪 Testing Checklist

After schema application, verify these functions:

### 1. Multi-tenancy
```sql
-- Should return demo workspace
SELECT * FROM workspaces WHERE slug = 'demo-workspace';
```

### 2. Table Relationships
```sql  
-- Should show proper foreign key relationships
\d+ accounts
\d+ campaigns
```

### 3. RLS Policies
```sql
-- Should list workspace isolation policies
SELECT * FROM pg_policies WHERE tablename IN ('accounts', 'campaigns');
```

### 4. Indexes
```sql
-- Should show performance indexes
SELECT indexname FROM pg_indexes WHERE tablename IN ('accounts', 'campaigns');
```

---

## 🚀 Next Steps After Schema Application

1. **Verify Installation**: Run `node check-database-status.js`
2. **Configure MCP Tools**: Set up Apify, n8n, and Unipile MCPs
3. **Test Multi-tenancy**: Create test workspace and verify isolation
4. **Initialize Sam AI**: Configure initial AI assistant and workflows
5. **Performance Testing**: Load test with sample data

---

## 📞 Support & Troubleshooting

### Common Issues:

**Schema fails to apply:**
- Ensure you're using Supabase SQL Editor (not external client)
- Check for existing conflicting tables
- Verify project permissions

**RLS policies conflict:**
- Drop existing policies if present: `DROP POLICY IF EXISTS [policy_name] ON [table];`
- Re-run schema application

**Performance issues:**
- Verify indexes were created: Check `pg_indexes` system table
- Monitor query performance in Supabase dashboard
- Consider upgrading Supabase tier

### Files Created:
- `COMPLETE_SAM_AI_SCHEMA.sql` - Complete schema for manual application
- `check-database-status.js` - Verification script
- `SAM_AI_DATABASE_SETUP_INSTRUCTIONS.md` - This document

---

## 🎉 Success Criteria

Schema application is successful when:
- ✅ 12/12 tables exist and accessible
- ✅ Demo workspace created
- ✅ RLS policies active on all tables  
- ✅ Performance indexes created
- ✅ Updated triggers functional
- ✅ No database errors in Supabase logs

**Ready for Sam AI 8-stage workflow implementation!** 🚀