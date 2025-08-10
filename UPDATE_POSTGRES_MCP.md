# 🔧 Update PostgreSQL MCP Configuration for SAM AI

## Current Situation
The PostgreSQL MCP is currently connected to the **3Cubed SEO database** (wrong project).
We need to update it to connect to the **SAM AI staging Supabase** instance.

## Steps to Update

### 1. Get the PostgreSQL Connection String

Go to your Supabase Dashboard:
1. Navigate to: https://supabase.com/dashboard/project/latxadqrvrrrcvkktrog/settings/database
2. Find the **Connection string** section
3. Click on the **URI** tab
4. Copy the connection string (it will look like one of these formats):
   ```
   postgresql://postgres.latxadqrvrrrcvkktrog:[password]@aws-0-[region].pooler.supabase.com:5432/postgres
   ```
   OR
   ```
   postgresql://postgres:[password]@db.latxadqrvrrrcvkktrog.supabase.co:5432/postgres
   ```

### 2. Update MCP Configuration

Edit the file: `~/.claude-code/mcp_config.json`

Replace the current postgres configuration:

**Current (3Cubed SEO):**
```json
"postgres": {
  "command": "npx",
  "args": [
    "-y",
    "@modelcontextprotocol/server-postgres@latest",
    "postgresql://postgres.ktchrfgkbpaixbiwbieg:i0EiFpjnF4DtVyOV@aws-0-us-east-1.pooler.supabase.com:5432/postgres"
  ]
}
```

**New (SAM AI Staging):**
```json
"postgres": {
  "command": "npx",
  "args": [
    "-y",
    "@modelcontextprotocol/server-postgres@latest",
    "YOUR_CONNECTION_STRING_HERE"
  ]
}
```

### 3. Restart Claude Desktop

After updating the configuration:
1. Quit Claude Desktop completely
2. Restart Claude Desktop
3. The PostgreSQL MCP will now connect to the SAM AI staging database

### 4. Test the Connection

Once restarted, test by asking:
- "Can you query the PostgreSQL database to show all tables?"
- "Show me the schema of the workspaces table"
- "List all tables in the public schema"

## Expected Tables After Schema Applied

Once the staging schema is applied (from `staging-schema.sql`), you should see these tables:
- `workspaces` - Multi-tenant foundation
- `profiles` - User profiles
- `accounts` - CRM accounts
- `contacts` - CRM contacts  
- `campaigns` - Marketing campaigns
- `messages` - Message queue
- `ai_assistants` - AI configurations
- `conversations` - Chat threads
- `conversation_messages` - Chat messages
- `integrations` - Third-party integrations
- `workflows` - Automation workflows
- `analytics_events` - Event tracking

## Current Database Password Location

The database password can be found in:
1. **Supabase Dashboard**: Settings → Database → Connection string
2. **Database Password**: This is NOT the same as the anon key
3. **Service Role Key**: Different from both anon key and database password

## Environment Variables Reference

For the application (already configured):
```env
# .env.local
VITE_SUPABASE_URL=https://latxadqrvrrrcvkktrog.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhdHhhZHFydnJycmN2a2t0cm9nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTk5ODYsImV4cCI6MjA2ODI3NTk4Nn0.3WkAgXpk_MyQioVf_SED9O_ArjcT9nH0uy9we2okftE
VITE_ENVIRONMENT=staging
```

## Important Notes

⚠️ **Security**: Never commit the database password to git
⚠️ **Different Passwords**: The database password, anon key, and service role key are all different
✅ **MCP Benefits**: Once connected, you can run SQL queries directly through Claude