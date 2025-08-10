# Sam AI MCP Conversation Patterns

## Overview

This document defines conversation patterns for Sam AI's MCP-integrated 8-stage workflow. Each pattern demonstrates how natural language conversations trigger specific MCP tool calls and database operations.

## Core Conversation Architecture

```
User Input → Sam AI Processing → MCP Tool Selection → External API Call → Database Storage → User Response
```

## Stage 1: Lead Scraping Patterns

### Pattern 1.1: LinkedIn Profile Scraping
```
User: "Scrape LinkedIn profiles for software engineers at Microsoft in Seattle"

Sam AI Response:
I'll help you scrape LinkedIn profiles for software engineers at Microsoft in Seattle. Let me:

1. Configure the LinkedIn profile scraper
2. Set search parameters for Microsoft + Seattle + Software Engineer
3. Extract and store the profile data

[MCP Tool Calls]
- apify/linkedin-profile-scraper
- postgres_insert (contacts table)
- analytics_event (scraping_completed)

Result: 45 profiles scraped and stored in your contacts database
```

### Pattern 1.2: Company-Based Lead Generation
```
User: "Find all contacts at companies that are similar to our current customers"

Sam AI Response:
I'll analyze your existing customer base and find similar companies with their contact information.

1. Analyzing your current customer patterns from the database
2. Identifying similar companies using company data enrichment
3. Extracting contacts from these target companies

[MCP Tool Calls]
- postgres_query (accounts table analysis)
- apify/linkedin-company-scraper
- apify/google-maps-with-contact-details
- postgres_insert (accounts, contacts tables)

Result: 78 new companies identified with 234 potential contacts
```

### Pattern 1.3: Geographic Territory Expansion
```
User: "I want to expand into the Bay Area. Find tech companies with 100-500 employees"

Sam AI Response:
I'll help you identify tech companies in the San Francisco Bay Area within your target size range.

1. Searching for tech companies in SF Bay Area
2. Filtering by employee count (100-500)
3. Extracting key contacts and company data

[MCP Tool Calls]
- apify/web-scraper (company directories)
- apify/linkedin-company-scraper
- postgres_insert (accounts table with location data)

Result: 67 qualified tech companies identified in your target market
```

## Stage 2: Data Enrichment Patterns

### Pattern 2.1: Contact Enrichment
```
User: "Enrich all my contacts with missing company information and job titles"

Sam AI Response:
I'll enrich your contact database with missing information using multiple data sources.

1. Identifying contacts with incomplete data
2. Cross-referencing LinkedIn and company databases
3. Updating contact records with enriched information

[MCP Tool Calls]
- postgres_query (contacts with missing data)
- apify/linkedin-profile-scraper (profile updates)
- n8n_create_workflow (enrichment automation)
- postgres_update (contacts table)

Result: 156 contacts enriched with updated job titles and company data
```

### Pattern 2.2: Company Intelligence Gathering
```
User: "Get detailed information about all the companies in my 'Enterprise Prospects' campaign"

Sam AI Response:
I'll gather comprehensive company intelligence for your Enterprise Prospects campaign.

1. Retrieving companies from your Enterprise Prospects campaign
2. Collecting detailed company data including financials, news, and leadership
3. Updating company profiles with intelligence data

[MCP Tool Calls]
- postgres_query (campaign companies)
- apify/web-scraper (company websites and news)
- n8n_trigger_workflow (company intelligence workflow)
- postgres_update (accounts.enrichment_data)

Result: Intelligence gathered for 23 enterprise prospects with recent news and leadership changes
```

## Stage 3: Knowledge Base RAG Patterns

### Pattern 3.1: Sales Knowledge Training
```
User: "Train Sam on our new product features and pricing for the Q2 launch"

Sam AI Response:
I'll help you train my knowledge base with your new product information for Q2.

1. Processing your product documentation and pricing information
2. Creating structured knowledge entries for sales conversations
3. Updating my AI assistant configuration for accurate responses

[MCP Tool Calls]
- postgres_insert (ai_assistants knowledge_base_config)
- n8n_create_workflow (knowledge processing)
- postgres_update (ai_assistants system_prompt)

Result: Knowledge base updated with Q2 product features and pricing. Ready for sales conversations.
```

### Pattern 3.2: Competitive Intelligence Integration
```
User: "Update my knowledge base with our competitive positioning against Salesforce and HubSpot"

Sam AI Response:
I'll integrate competitive positioning information into my knowledge base.

1. Organizing competitive intelligence data
2. Creating comparison frameworks and talking points
3. Training conversation models for competitive discussions

[MCP Tool Calls]
- postgres_query (existing competitive data)
- postgres_update (ai_assistants knowledge_base_config)
- analytics_event (knowledge_base_updated)

Result: Competitive positioning integrated. I can now handle questions about Salesforce and HubSpot comparisons.
```

## Stage 4: Lead Qualification Patterns

### Pattern 4.1: ICP Scoring
```
User: "Score all my contacts against our ideal customer profile and prioritize the top 50"

Sam AI Response:
I'll evaluate all contacts against your ICP criteria and identify the highest-priority prospects.

1. Retrieving your ICP criteria and contact database
2. Calculating engagement scores based on company size, industry, role, etc.
3. Ranking and prioritizing your contact list

[MCP Tool Calls]
- postgres_query (contacts and accounts data)
- n8n_trigger_workflow (ICP scoring algorithm)
- postgres_update (contacts.engagement_score, qualification_data)
- analytics_event (qualification_completed)

Result: 847 contacts scored. Top 50 high-priority prospects identified with scores above 85.
```

### Pattern 4.2: Engagement-Based Qualification
```
User: "Show me contacts who have visited our website multiple times but haven't responded to outreach"

Sam AI Response:
I'll identify high-engagement prospects who haven't responded yet - these are prime for follow-up.

1. Cross-referencing website analytics with outreach data
2. Identifying behavioral engagement without communication response
3. Prioritizing for personalized follow-up campaigns

[MCP Tool Calls]
- postgres_query (contacts, messages, analytics_events)
- n8n_create_workflow (engagement analysis)
- postgres_update (contacts.engagement_score)

Result: 23 high-engagement, non-responsive contacts identified for priority follow-up.
```

## Stage 5: Personalization Patterns

### Pattern 5.1: Message Template Personalization
```
User: "Create personalized LinkedIn messages for my top 25 prospects mentioning their recent company news"

Sam AI Response:
I'll create highly personalized LinkedIn messages incorporating recent company developments for your top prospects.

1. Identifying your top 25 prospects from the database
2. Researching recent company news and developments
3. Generating personalized message templates with relevant references

[MCP Tool Calls]
- postgres_query (top contacts by engagement_score)
- apify/web-scraper (recent company news)
- n8n_trigger_workflow (personalization engine)
- postgres_insert (messages table with personalization_data)

Result: 25 personalized LinkedIn messages created with company-specific news references.
```

### Pattern 5.2: Multi-Channel Personalization
```
User: "Personalize my email sequence for contacts in the healthcare industry"

Sam AI Response:
I'll customize your email sequence specifically for healthcare industry contacts.

1. Filtering contacts in healthcare industry
2. Adapting messaging for healthcare-specific pain points and compliance
3. Creating industry-tailored email sequence

[MCP Tool Calls]
- postgres_query (contacts WHERE industry = 'healthcare')
- postgres_query (ai_assistants healthcare knowledge)
- n8n_create_workflow (healthcare message sequence)
- postgres_insert (messages with healthcare personalization)

Result: Healthcare-specific email sequence created for 34 contacts with industry-relevant messaging.
```

## Stage 6: Multi-channel Outreach Patterns

### Pattern 6.1: LinkedIn Campaign Launch
```
User: "Launch a LinkedIn campaign to all qualified contacts in my Enterprise pipeline"

Sam AI Response:
I'll launch a comprehensive LinkedIn campaign for your Enterprise pipeline contacts.

1. Retrieving qualified Enterprise pipeline contacts
2. Setting up LinkedIn connection requests and message sequences
3. Launching automated outreach via Unipile integration

[MCP Tool Calls]
- postgres_query (campaign = 'Enterprise', engagement_score > 70)
- n8n_create_workflow (LinkedIn sequence automation)
- unipile_send_connection_request (bulk LinkedIn outreach)
- postgres_insert (messages table with status tracking)

Result: LinkedIn campaign launched to 89 Enterprise prospects with personalized connection requests.
```

### Pattern 6.2: Multi-Touch Campaign Setup
```
User: "Set up a 7-touch campaign mixing LinkedIn, email, and phone calls for my hottest prospects"

Sam AI Response:
I'll create a sophisticated 7-touch multi-channel campaign for your highest-priority prospects.

1. Identifying your hottest prospects (engagement score > 90)
2. Designing touch sequence: LinkedIn → Email → LinkedIn → Call → Email → LinkedIn → Email
3. Setting up automation with proper timing intervals

[MCP Tool Calls]
- postgres_query (contacts WHERE engagement_score > 90)
- n8n_create_workflow (7-touch multi-channel sequence)
- postgres_insert (campaigns table with multi-channel config)
- unipile_schedule_messages (LinkedIn touches)

Result: 7-touch multi-channel campaign configured for 17 hottest prospects.
```

## Stage 7: Response Handling Patterns

### Pattern 7.1: Response Monitoring and Classification
```
User: "Check for new LinkedIn responses and categorize them by interest level"

Sam AI Response:
I'll check for new LinkedIn responses and automatically categorize them for you.

1. Retrieving new messages from LinkedIn via Unipile
2. Analyzing response content for interest level indicators
3. Updating conversation records with categorized responses

[MCP Tool Calls]
- unipile_get_chat_messages (recent LinkedIn responses)
- n8n_trigger_workflow (response classification)
- postgres_insert (conversation_messages)
- postgres_update (contacts.engagement_score based on response)

Result: 12 new responses received - 4 high interest, 6 medium interest, 2 not interested.
```

### Pattern 7.2: Automated Response Handling
```
User: "Set up automatic responses for common questions about our pricing and features"

Sam AI Response:
I'll configure intelligent automatic responses for frequently asked questions.

1. Analyzing common question patterns from conversation history
2. Creating automated response templates with knowledge base integration
3. Setting up conditional response triggers

[MCP Tool Calls]
- postgres_query (conversation_messages for pattern analysis)
- n8n_create_workflow (auto-response logic)
- postgres_update (ai_assistants with response templates)
- unipile_setup_auto_responses (LinkedIn auto-response)

Result: Automatic responses configured for 8 common questions about pricing and features.
```

## Stage 8: Follow-up Automation Patterns

### Pattern 8.1: Sequence Automation
```
User: "Set up automated follow-ups for contacts who don't respond within 5 business days"

Sam AI Response:
I'll create an automated follow-up system for non-responsive contacts.

1. Setting up monitoring for message response timeframes
2. Creating escalating follow-up sequences
3. Implementing smart timing and frequency controls

[MCP Tool Calls]
- n8n_create_workflow (follow-up automation with 5-day trigger)
- postgres_query (messages with no response after 5 days)
- postgres_insert (workflows table with follow-up config)
- unipile_schedule_messages (automated follow-ups)

Result: Follow-up automation active - will automatically send follow-ups after 5 business days of no response.
```

### Pattern 8.2: Performance Optimization
```
User: "Analyze my campaign performance and automatically optimize low-performing sequences"

Sam AI Response:
I'll analyze your campaign performance data and implement automated optimizations.

1. Analyzing campaign metrics across all channels
2. Identifying low-performing message templates and timing
3. Implementing A/B test variations and automatic optimization

[MCP Tool Calls]
- postgres_query (campaigns, messages performance data)
- n8n_trigger_workflow (performance analysis and optimization)
- postgres_update (campaigns.performance_metrics)
- analytics_event (optimization_applied)

Result: Performance analysis complete. 3 underperforming sequences optimized with new templates and timing.
```

## Advanced Conversation Patterns

### Cross-Stage Integration
```
User: "I want to completely rebuild my sales process for the European market"

Sam AI Response:
I'll help you build a comprehensive European market sales process from scratch.

This is a complex multi-stage operation that will involve:

**Stage 1-2: Market Research & Lead Generation**
- Scraping European companies in your target industries
- Enriching with GDPR-compliant data sources

**Stage 3-4: Knowledge Base & Qualification**
- Training AI with European market knowledge
- Creating Europe-specific ICP criteria

**Stage 5-6: Personalization & Outreach**
- Developing European cultural messaging
- Setting up multi-language campaigns

**Stage 7-8: Response Management & Automation**
- Configuring timezone-appropriate follow-ups
- Setting up European business hour automation

[Multiple MCP Tool Calls across all stages]
- 15+ Apify scraping operations
- n8n workflow creation for each stage
- Comprehensive database setup
- Unipile multi-language configuration

Result: Complete European market sales process deployed with 340+ prospects and automated workflows.
```

### Real-time Decision Support
```
User: "I'm on a call with TechCorp's CEO right now. What should I know about them?"

Sam AI Response:
Here's everything you need to know about TechCorp for your call:

**Quick Intel** (Retrieved in 2 seconds):
- CEO: Sarah Johnson, 8 years experience
- Company: 150 employees, $25M ARR, Series B funded
- Recent news: Just acquired competitor MicroSoft Inc.
- Previous interactions: 3 email touches, opened all, no response yet
- Engagement score: 78/100 (high priority)

**Recommended talking points**:
- Congratulate on recent acquisition
- Mention how we helped similar post-acquisition companies
- Reference their growth trajectory aligning with our enterprise tier

[MCP Tool Calls executed in real-time]
- postgres_query (TechCorp company and contact data)
- apify/web-scraper (recent company news)
- postgres_query (previous interaction history)

Result: Real-time intelligence provided for successful call preparation.
```

## Error Handling Patterns

### Graceful Degradation
```
User: "Scrape 500 LinkedIn profiles for startup founders in Silicon Valley"

Sam AI Response:
I'll help you scrape LinkedIn profiles for startup founders in Silicon Valley. 

⚠️ Note: I'm currently experiencing rate limits with LinkedIn scraping. I'll implement a smart approach:

1. Starting with 50 profiles using current quota
2. Scheduling remaining 450 profiles across the next 24 hours
3. Setting up automatic retry logic for failed attempts

[MCP Tool Calls with error handling]
- Rate limit detection and queue management
- Automatic scheduling and retry logic
- Progress reporting and user notifications

Result: 50 profiles scraped immediately, 450 scheduled for gradual processing over 24 hours.
```

### Service Fallback
```
User: "Send LinkedIn messages to my top 100 prospects"

Sam AI Response:
I'll send LinkedIn messages to your top prospects. I noticed Unipile service is temporarily unavailable.

**Fallback Strategy**:
1. Generating message content and recipient list now
2. Storing messages in queue for automatic sending when service returns
3. Providing manual export option as backup

[MCP Tool Calls with fallback]
- Message generation and queuing
- Service health monitoring
- Alternative delivery methods

Result: 100 personalized messages queued. Will auto-send when LinkedIn service is restored (estimated 2 hours).
```

## Best Practices for Sam AI Conversations

### 1. Specificity Drives Accuracy
- **Good**: "Scrape tech companies in Austin with 50-200 employees"
- **Better**: "Scrape B2B SaaS companies in Austin, Texas with 50-200 employees, focusing on VP+ level contacts"

### 2. Context Preservation
- Sam AI maintains conversation context across multiple interactions
- Reference previous requests for continuity
- Build complex workflows through iterative conversation

### 3. Batch Operations
- Prefer batch requests over individual operations
- Sam AI optimizes MCP calls for efficiency
- Automatic progress reporting for long-running operations

### 4. Error Communication
- Sam AI proactively communicates limitations and workarounds
- Provides ETA for retry operations
- Suggests alternative approaches when primary methods fail

## Conversation Flow Optimization

### 1. Multi-step Confirmation
```
User: "Set up a complete outreach campaign for the fintech industry"

Sam AI: "I'll set up a comprehensive fintech outreach campaign. Here's my plan:
1. Scrape fintech companies (500-1000 targets)
2. Enrich with regulatory compliance data
3. Create fintech-specific messaging
4. Launch multi-channel campaign
5. Set up automated follow-ups

Shall I proceed with all steps, or would you like to modify anything?"
```

### 2. Progress Reporting
```
Sam AI: "Fintech campaign setup in progress:
✅ Company scraping (750 companies found)
✅ Data enrichment (compliance data added)
🔄 Message personalization (67% complete)
⏳ Campaign launch (pending approval)
⏳ Automation setup (queued)"
```

### 3. Proactive Suggestions
```
Sam AI: "I noticed 23% of your fintech prospects have recent funding news. Should I:
1. Create a separate 'Recent Funding' campaign segment?
2. Adjust messaging to reference their growth phase?
3. Prioritize these contacts for immediate outreach?"
```

This conversation pattern system ensures Sam AI provides intelligent, context-aware assistance across all 8 stages of the sales automation workflow, leveraging MCP integrations for maximum effectiveness.