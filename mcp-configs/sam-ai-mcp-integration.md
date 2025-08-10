# Sam AI MCP Integration Configuration

## Overview

This document configures the Model Context Protocol (MCP) integrations for the Sam AI system, enabling the 8-stage workflow automation through conversational interface.

## Architecture Overview

```
Sam AI (React Interface) → Claude → MCP Servers → External Services → Supabase Database
```

## MCP Server Configurations

### 1. Apify MCP (Stage 1 & 2: Lead Scraping & Data Enrichment)

**Purpose**: LinkedIn profile/company scraping and data collection
**Location**: `/Users/tvonlinz/mcp-servers/actors-mcp-server` (already installed)

#### Configuration
```json
{
  "command": "npx",
  "args": ["-y", "@apify/actors-mcp-server", "--actors", "lukaskrivka/google-maps-with-contact-details,apify/linkedin-company-scraper,apify/linkedin-profile-scraper,apify/web-scraper"],
  "env": {
    "APIFY_TOKEN": "${APIFY_TOKEN}"
  }
}
```

#### Key Actors for Sam AI
- `apify/linkedin-profile-scraper`: Extract LinkedIn profile data
- `apify/linkedin-company-scraper`: Extract company information
- `lukaskrivka/google-maps-with-contact-details`: Extract contact details from Google Maps
- `apify/web-scraper`: General web scraping for enrichment data

#### Data Flow
1. **Input**: LinkedIn URLs, company domains, search parameters
2. **Processing**: Apify actors scrape data according to configuration
3. **Output**: Structured JSON data stored in `contacts` and `accounts` tables
4. **Storage**: `scraped_data` JSONB field in both tables

#### Usage Example
```javascript
// Via Sam AI conversation
"Scrape the LinkedIn profile for https://linkedin.com/in/johndoe and store the data in our contacts database"

// MCP Tool Call
{
  "tool": "apify/linkedin-profile-scraper",
  "arguments": {
    "startUrls": ["https://linkedin.com/in/johndoe"],
    "maxItems": 1
  }
}
```

### 2. n8n MCP (All Stages: Workflow Automation)

**Purpose**: Workflow automation and orchestration
**Connection**: http://116.203.116.16:5678 (already configured)

#### Configuration
```json
{
  "command": "docker",
  "args": [
    "run", "-i", "--rm",
    "-e", "N8N_API_URL=${N8N_API_URL}",
    "-e", "N8N_API_KEY=${N8N_API_KEY}",
    "czlonkowski/n8n-mcp:latest"
  ]
}
```

#### Existing n8n Workflows
- **Sam Workflow (ID: CmaAhrPu63isdybY)**: 303 nodes - Main Sam AI orchestration
- **LinkedIn Job Posting Workflow (ID: 5WcuVajPawcQ9PKB)**: LinkedIn automation
- **3Cubed SEO Workflows**: Additional automation examples

#### Data Flow
1. **Trigger**: Sam AI conversation triggers workflow creation/execution
2. **Processing**: n8n workflows handle multi-step automation
3. **Integration**: Workflows connect multiple services (Apify, Unipile, etc.)
4. **Storage**: Workflow definitions in `workflows` table, execution logs in `analytics_events`

#### Usage Example
```javascript
// Via Sam AI conversation
"Create a workflow to scrape 100 LinkedIn profiles from a Sales Navigator search and enrich them with company data"

// MCP Tool Calls
{
  "tool": "n8n_create_workflow",
  "arguments": {
    "name": "LinkedIn Prospect Enrichment",
    "nodes": [...],
    "connections": {...}
  }
}
```

### 3. Unipile MCP (Stage 6 & 7: LinkedIn Outreach & Response Handling)

**Purpose**: LinkedIn messaging and connection management
**Location**: `/Users/tvonlinz/mcp-servers/mcp-unipile` (Docker-based)

#### Configuration
```json
{
  "command": "docker",
  "args": [
    "run", "-i", "--rm",
    "-e", "UNIPILE_DSN=${UNIPILE_DSN}",
    "-e", "UNIPILE_API_KEY=${UNIPILE_API_KEY}",
    "buryhuang/mcp-unipile:latest"
  ]
}
```

#### Capabilities
- **LinkedIn Messaging**: Send personalized messages
- **Connection Requests**: Automated connection requests with notes
- **Message Management**: Read and respond to LinkedIn messages
- **Multi-platform**: WhatsApp, Instagram, Messenger, Telegram support

#### Data Flow
1. **Input**: Personalized messages from `messages` table
2. **Processing**: Unipile API sends messages via LinkedIn
3. **Response Handling**: Incoming messages stored in `conversations` table
4. **Storage**: Message status updates and conversation tracking

#### Usage Example
```javascript
// Via Sam AI conversation
"Send a personalized LinkedIn message to john.doe@company.com using the template from campaign 'Q1 Outreach'"

// MCP Tool Call
{
  "tool": "unipile_send_message",
  "arguments": {
    "platform": "linkedin",
    "recipient": "linkedin_user_id",
    "message": "Personalized message content..."
  }
}
```

### 4. Supabase PostgreSQL MCP (All Stages: Database Operations)

**Purpose**: Direct database access for Sam AI data operations
**Connection**: latxadqrvrrrcvkktrog.supabase.co

#### Configuration
```json
{
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-postgres", "${SUPABASE_CONNECTION_STRING}"]
}
```

#### Database Schema Integration
- **Multi-tenant**: Workspace-based data isolation
- **Sam AI Tables**: 12 tables supporting all 8 stages
- **RLS Policies**: Row-level security for tenant data protection

#### Data Flow
1. **Query**: Sam AI conversations trigger database queries
2. **Processing**: Direct SQL operations via PostgreSQL MCP
3. **Results**: Structured data returned to Sam AI interface
4. **Analytics**: All operations tracked in `analytics_events`

#### Usage Example
```javascript
// Via Sam AI conversation
"Show me all contacts from the 'Enterprise Prospects' campaign with an engagement score above 80"

// MCP Tool Call
{
  "tool": "postgres_query",
  "arguments": {
    "query": "SELECT * FROM contacts WHERE campaign_id = ? AND engagement_score > 80",
    "params": ["campaign_uuid"]
  }
}
```

## Sam AI 8-Stage Workflow Integration

### Stage 1: Lead Scraping
- **MCP**: Apify MCP
- **Tools**: `apify/linkedin-profile-scraper`, `apify/web-scraper`
- **Data Storage**: `contacts` table with `scraped_data` JSONB

### Stage 2: Data Enrichment
- **MCP**: Apify MCP + n8n MCP
- **Tools**: `apify/linkedin-company-scraper`, n8n enrichment workflows
- **Data Storage**: `accounts` table with `enrichment_data` JSONB

### Stage 3: Knowledge Base RAG
- **MCP**: Supabase MCP + n8n MCP
- **Tools**: Database queries, AI model configuration
- **Data Storage**: `ai_assistants` table with `knowledge_base_config`

### Stage 4: Lead Qualification
- **MCP**: Supabase MCP + n8n MCP
- **Tools**: Scoring algorithms, qualification workflows
- **Data Storage**: `contacts.qualification_data`, `contacts.engagement_score`

### Stage 5: Personalization
- **MCP**: n8n MCP + Supabase MCP
- **Tools**: Message generation workflows, template processing
- **Data Storage**: `messages` table with `personalization_data`

### Stage 6: Multi-channel Outreach
- **MCP**: Unipile MCP + n8n MCP
- **Tools**: Message sending, campaign orchestration
- **Data Storage**: `campaigns`, `messages` tables with status tracking

### Stage 7: Response Handling
- **MCP**: Unipile MCP + Supabase MCP
- **Tools**: Message monitoring, conversation tracking
- **Data Storage**: `conversations`, `conversation_messages` tables

### Stage 8: Follow-up Automation
- **MCP**: n8n MCP + Supabase MCP
- **Tools**: Automated workflows, scheduling
- **Data Storage**: `workflows`, `analytics_events` tables

## Environment Variables Required

```env
# Apify Integration
APIFY_TOKEN=your_apify_token_here

# Unipile Integration
UNIPILE_DSN=api8.unipile.com:13851
UNIPILE_API_KEY=your_unipile_api_key_here

# n8n Integration
N8N_API_URL=http://116.203.116.16:5678
N8N_API_KEY=your_n8n_api_key_here

# Supabase Integration
SUPABASE_CONNECTION_STRING=postgresql://user:pass@db.latxadqrvrrrcvkktrog.supabase.co:5432/postgres
SUPABASE_URL=https://latxadqrvrrrcvkktrog.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

## Sam AI Conversation Examples

### Example 1: Complete Prospect Pipeline
```
User: "Help me set up a complete prospect pipeline for SaaS companies in California with 50-200 employees"

Sam AI Response:
1. I'll use Apify to scrape LinkedIn for target companies
2. Enrich the data with company details and contact information
3. Qualify leads based on your ICP criteria
4. Create personalized outreach messages
5. Set up automated LinkedIn connection requests
6. Monitor responses and schedule follow-ups

[Triggers multiple MCP calls across Apify, n8n, and Supabase]
```

### Example 2: Campaign Optimization
```
User: "Analyze my current LinkedIn campaign performance and suggest improvements"

Sam AI Response:
1. Querying your campaign data from the database...
2. Analyzing message performance metrics...
3. Reviewing response patterns and engagement scores...
4. Here are my recommendations for improvement...

[Uses Supabase MCP for data analysis and n8n MCP for optimization workflows]
```

### Example 3: Real-time Response Management
```
User: "I got a response from John at TechCorp. How should I follow up?"

Sam AI Response:
1. Let me check John's profile and conversation history...
2. Based on his engagement pattern and company data...
3. I recommend this personalized follow-up approach...
4. Should I schedule this message or send it now?

[Uses Unipile MCP for message retrieval and Supabase MCP for context]
```

## Error Handling & Retry Logic

### MCP Connection Failures
- Automatic retry with exponential backoff
- Fallback to alternative data sources when possible
- User notification of service unavailability

### Data Consistency
- Transaction-based operations for critical data
- Rollback mechanisms for failed multi-step operations
- Data validation at each stage

### Rate Limiting
- Respect API rate limits for external services
- Queue system for batch operations
- Intelligent scheduling for optimal throughput

## Security Considerations

### API Key Management
- Environment variable storage only
- No hardcoded credentials
- Regular key rotation recommended

### Data Privacy
- Multi-tenant RLS policies in Supabase
- Encrypted storage for sensitive data
- GDPR compliance for contact data

### Access Control
- Workspace-based permissions
- Role-based access control (owner, admin, member, viewer)
- Audit logging for all operations

## Performance Optimization

### Database Operations
- Indexed queries for high-volume operations
- Connection pooling via Supabase
- Query optimization for complex analytics

### MCP Response Caching
- Cache frequently accessed data
- Invalidate cache on data updates
- Optimize for conversational context

### Batch Processing
- Bulk operations for large datasets
- Background processing for non-critical tasks
- Progress reporting for long-running operations

## Monitoring & Analytics

### System Health
- MCP server availability monitoring
- Database connection health checks
- API rate limit monitoring

### Performance Metrics
- Response time tracking
- Error rate monitoring
- User engagement analytics

### Business Metrics
- Campaign performance tracking
- Lead conversion rates
- ROI calculations per workflow stage

## Next Steps

1. **Environment Setup**: Configure all required API keys and credentials
2. **Testing**: Validate each MCP connection individually
3. **Integration Testing**: Test end-to-end workflow execution
4. **User Training**: Document Sam AI conversation patterns
5. **Monitoring Setup**: Implement logging and alerting systems
6. **Performance Tuning**: Optimize based on actual usage patterns

This configuration provides the foundation for a fully integrated Sam AI system with comprehensive MCP support across all 8 workflow stages.