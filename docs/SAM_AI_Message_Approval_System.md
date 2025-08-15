# SAM AI Message Approval System

## Overview
SAM AI implements a human-in-the-loop approval system for all outbound messages (LinkedIn and Email) to maintain quality control and ensure client oversight of automated communications.

## Core Architecture

### Multi-Agent System (Following Anthropic Best Practices)
```
Master SAM Agent (Coordinator - Claude Opus 4)
├── Lead Research Agent (Claude Sonnet 4)
├── Content Analysis Agent (Claude Sonnet 4) 
├── Personalization Agent (Claude Sonnet 4)
└── Reply Agent (Claude Sonnet 4)
```

### Anti-Hallucination Implementation
- **RAG-First Approach**: All agents query user's RAG database before generating responses
- **Evidence Citations**: Every AI response cites sources from RAG database
- **"I Don't Know" Permission**: Agents admit when they need more client information
- **External Knowledge Restriction**: Agents only use client's uploaded content, not general knowledge

## SAM Orchestration Workflow (8 Steps)

1. **Scraping** - Apify LinkedIn/web scraping
2. **Enrichment** - Contact data enhancement
3. **Scoring** - ICP matching and lead qualification
4. **Personalization** - AI message generation
5. **Broadcasting** - Unipile LinkedIn + ReachInbox email
6. **Reply Handling** - Unipile inbox monitoring
7. **Reply Drafting** - AI response generation → human approval
8. **Follow-up & Meeting Booking** - Persistent nurturing

## Message Approval Process

### Unified Draft Approval System
- **Channels**: Both LinkedIn and Email messages
- **Delivery**: Email-based approval (WhatsApp backup for future)
- **Processing**: Immediate approval requests after draft generation

### Approval Email Template
```
Subject: SAM Draft: [LinkedIn/Email] - [Prospect Name] at [Company]

Hi [Client Name],

I've drafted a [LinkedIn/Email] message for [Prospect Name] ([Title] at [Company]):

---
DRAFT MESSAGE:
[Generated message content]
---

PROSPECT CONTEXT:
• Title: [Position]
• Company: [Company Name] ([Employee Count] employees)
• Recent news: [Relevant news/trigger]
• Pain point match: [Identified pain points]

Please choose:
🟢 APPROVE - Send as is
🟡 MODIFY - Send with changes (reply with modifications)  
🔴 SKIP - I'll handle this myself

⏰ Please reply within 2 hours or I'll send a reminder.

- SAM
```

### Approval Rules

#### Timing
- ✅ **Immediate Processing**: Send approval requests immediately after draft generation
- ⏰ **2-Hour Timeout**: Send reminder if no response within 2 hours
- 🔄 **Reminder System**: Automated follow-up for pending approvals

#### Approval Types
- ❌ **NO Auto-Approve**: First-touch messages always require human approval
- 📋 **Future Rules**: Additional approval thresholds to be configured later

#### Response Processing
```
Client Response Actions:
├── "APPROVE" → Schedule & send message immediately
├── "MODIFY: [changes]" → Apply changes → Send final approval request
└── "SKIP" → Mark prospect as client-managed, remove from SAM automation
```

## RAG Database Structure (Per-User)

### Client Learning Sources
```
User RAG Database:
├── Client Profile
│   ├── Training Documents (PDFs, guides)
│   ├── Website messaging & positioning  
│   ├── ICP definition & targeting criteria
│   ├── Customer pain points & solutions
│   └── Tone of voice guidelines
├── Communication Patterns
│   ├── Email message history (ReachInbox)
│   ├── LinkedIn message history (Unipile)
│   └── Successful response templates
└── Prospect Intelligence
    ├── Cross-channel interactions
    └── Response patterns & timing
```

### Content Ingestion Process
1. **Training Documents** → PDF processing → Extract methodology/approach
2. **Website Analysis** → Web scraping → Extract messaging/positioning
3. **ICP Documents** → Document analysis → Target criteria
4. **Pain Points Guide** → Content processing → Problem/solution mapping
5. **Tone of Voice Guide** → Style analysis → Communication patterns
6. **YouTube Videos** → Transcript analysis → Extract messaging patterns

## N8N Workflow Integration

### Core Workflow Architecture
- **N8N Workspace**: https://workflows.innovareai.com/projects/E9Xq0Sqn9jUGEbhJ/folders/SnksL8ALgkPaT9yw/workflows
- **Main Orchestration Workflow**: 8-step SAM workflow that coordinates all automation
- **Campaign Workflows**: Additional workflows that layer on top of main workflow
- **AI Processing Workflows**: MCP-integrated workflows for content analysis and generation

### Workflow Integration Points
```
Conversational Interface → N8N Main Workflow Trigger
                       ↓
            8-Step SAM Orchestration Process
                       ↓
            Campaign Workflows (optional add-ons)
                       ↓
            Direct API Integration (Unipile/ReachInbox)
                       ↓
            Reply Monitoring → Back to N8N for processing
```

### MCP Integration for AI Processing
- All AI processing (content analysis, message generation, reply classification) handled via N8N MCP
- Centralized AI operations in N8N workflows
- Consistent processing across all SAM agents

## SAM Onboarding & Training Process

### Conversational Onboarding Flow

#### Phase 1: Technical Setup
```
SAM: "Welcome! I'm SAM, your AI sales assistant. Let me get you set up."

Step 1: Account Connections
- "Let me connect your LinkedIn account..." → Unipile OAuth flow
- "Now let's connect your email..." → ReachInbox integration  
- "Finally, your calendar..." → Unipile calendar setup

Step 2: Integration Verification
- Test LinkedIn connection and permissions
- Verify email sending capabilities
- Confirm calendar booking functionality
```

#### Phase 2: Business Intelligence Gathering
```
SAM: "Now I need to learn about your business so I can sound exactly like you."

Content Ingestion Options:
• "Share your website URL" → Apify web scraping → Website analysis
• "Upload training documents" → PDF processing → Company methodology
• "Send demo videos" → YouTube transcript extraction → Messaging analysis
• "Share your ICP document" → Document processing → Target criteria
• "Upload tone of voice guide" → Style analysis → Communication patterns

After each upload:
SAM: "I've analyzed [content type]. Here's what I learned:
[Summarized insights]
Does this look accurate? What should I add or correct?"
```

#### Phase 3: Campaign Configuration
```
SAM: "Based on your content, I've built your ideal customer profile:
- Industry: [extracted]
- Company size: [extracted]  
- Pain points: [extracted]
- Your solution: [extracted]

Ready to find prospects matching this profile?"

User: "Yes"

SAM: "I'm now:
🔍 Searching LinkedIn for matching prospects via Apify
📊 Scoring leads against your ICP
✍️ Writing personalized messages in your voice
📧 Preparing email and LinkedIn sequences

Campaign ready! 247 prospects found, 3 message variations created. 
Should I send the first batch for your approval?"
```

### SAM Training Components

#### 1. Client Voice Cloning
```
Training Sources → RAG Database Processing:
├── Website content → Messaging patterns, value propositions
├── Training documents → Company methodology, approach
├── Previous emails → Tone, style, successful patterns  
├── LinkedIn messages → Connection strategies, follow-ups
├── Demo videos → Product positioning, pain point language
├── Case studies → Success stories, ROI metrics
└── Tone guide → Specific voice and style rules
```

#### 2. ICP & Pain Point Mapping
```
SAM learns:
├── Target Industries → From client documents and successful campaigns
├── Company Sizes → Based on client's ideal customer data
├── Job Titles → Decision makers and influencers client targets
├── Pain Points → Problems client's solution addresses
├── Buying Triggers → Events that indicate sales opportunity
└── Objection Handling → How client typically addresses concerns
```

#### 3. Personalization Intelligence
```
SAM develops:
├── Industry-specific messaging → Tailored value props per vertical
├── Role-based communication → Different approach for different titles
├── Company-size adaptation → Startup vs enterprise messaging
├── Geographic considerations → Regional business practices
├── Timing optimization → Best times for different prospect types
└── Channel preferences → Email vs LinkedIn effectiveness by segment
```

### Training Verification Process
```
SAM: "Let me test my understanding. For a VP of Sales at a 200-person SaaS company 
dealing with manual lead qualification, I would say:

'Hi [Name], I noticed [Company] just hit the 200-employee milestone - exciting growth! 
I imagine coordinating lead qualification across your expanding sales team is getting 
complex. We've helped similar SaaS companies like [Similar Company] reduce manual 
qualification by 67% while improving lead quality. Worth a brief conversation?'

Does this sound like something you would write? What should I adjust?"
```

## Technical Implementation

### Current Integrations
- **Web Scraping**: Apify MCP service (LinkedIn/Apollo actors)
- **LinkedIn Automation**: Unipile service (OAuth, messaging, connections)
- **Email Automation**: ReachInbox API integration
- **Calendar**: Unipile calendar integration
- **AI Processing**: N8N workflows with MCP integration
- **Database**: Supabase with per-user RAG storage

### System Flow
```
Conversational Onboarding → Content Ingestion → User RAG Database
                        ↓
            Main SAM Workflow (8 steps via n8n)
                        ↓
            Direct Unipile/ReachInbox Integration
                        ↓
            Draft Generation → Email Approval → Send/Modify/Skip
                        ↓
            Reply Monitoring → RAG Context → AI Response Draft → Approval
```

### Reply Agent Enhancement
- **Unified Inbox**: Monitor both email (ReachInbox) and LinkedIn (Unipile)
- **Cross-Channel Context**: Track same prospect across multiple channels
- **RAG-Enhanced Responses**: Use full conversation history and client voice
- **Pattern Learning**: Analyze successful message types and timing

## Quick Actions Interface

### 6 Core SAM Actions (Post-Onboarding)
After initial setup, users access SAM's main functionality through Quick Actions:

1. **Upload Knowledge Documents**
   - Company information, training materials
   - Tone of voice guides, methodology docs
   - Case studies and success stories
   - Feeds directly into user's RAG database

2. **Research**
   - Deep prospect intelligence gathering
   - Company analysis and recent news extraction
   - Decision maker identification and mapping
   - Buying trigger detection and timing analysis
   - Triggers N8N enrichment workflow (step 2)

3. **Find Qualified Leads**
   - LinkedIn/web scraping via Apify integration
   - ICP matching and lead scoring
   - Prospect intelligence gathering
   - Triggers N8N orchestration workflow (steps 1-3)

4. **Write Messaging**
   - AI-powered personalized message generation
   - Uses RAG database for client voice cloning
   - Multi-channel support (LinkedIn + Email)
   - Triggers N8N personalization workflow (step 4)

5. **Setup A/B Testing**
   - Message variation generation and testing
   - Performance comparison and optimization
   - Statistical significance tracking
   - Automated winner selection

6. **Analyze Performance**
   - Campaign metrics and ROI analysis
   - Response rate and conversion tracking
   - Prospect engagement insights
   - Performance optimization recommendations

### Quick Actions Integration
```
Quick Action Selected → N8N Workflow Trigger
                    ↓
            SAM Orchestration Process
                    ↓
            Real-time Progress Updates
                    ↓
            Results Delivered to Interface
```

**Note**: Connect LinkedIn removed from Quick Actions (one-time onboarding task)

### Implementation Status ✅
Quick Actions UI has been implemented in `/src/components/workspace/WorkspaceDashboard.tsx`:
- 6 buttons with appropriate icons and gradient styling
- Integrated into existing premium workspace design
- Ready for N8N workflow trigger integration
- Visual design consistent with SAM AI brand

## Future Enhancements

### Approval Channels
- Slack integration for team approvals
- Microsoft Teams integration
- WhatsApp Business API for mobile approvals

### Advanced Approval Rules
- Auto-approve simple follow-ups (to be configured)
- Different thresholds for different message types
- Bulk approval for similar message batches
- A/B testing approval for message variations

### Campaign Workflows
- Layer additional n8n campaign workflows on top of main workflow
- Unified reply handling for both main and campaign workflows
- Cross-campaign learning and optimization

## Security & Privacy

### Data Handling
- Per-user RAG isolation
- No cross-client data sharing
- Encrypted storage of sensitive information
- Audit logs for all approved/sent messages

### Quality Control
- Human approval prevents inappropriate messaging
- RAG-based responses ensure accuracy
- Evidence-based AI responses with citations
- Temperature control for consistency

---

**Last Updated**: January 2025  
**Version**: 1.0  
**Author**: SAM AI Development Team