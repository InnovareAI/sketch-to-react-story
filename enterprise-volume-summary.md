# Enterprise Volume Analysis Summary

## Key Constraint: Daily Scraping Limits

### Volume Requirements
- **30K contacts/month**: 1,000 contacts/day needed
- **50K contacts/month**: 1,667 contacts/day needed

### Actor Capabilities

#### Apollo Scraper (Primary Choice)
- **Daily Capacity**: Unlimited (can handle 50K+ per search)
- **Cost**: $1.20 per 1,000 contacts
- **Monthly Cost**: 
  - 30K: $36.00/month
  - 50K: $60.00/month
- **Advantages**: No daily limits, enterprise-ready scaling

#### LinkedIn Scraper (Backup)
- **Daily Capacity**: 350 profiles/day maximum
- **Monthly Maximum**: 10,500 contacts
- **Limitation**: Cannot meet enterprise volume requirements
- **Best for**: Profile enrichment within daily limits

### Enterprise Strategy

1. **Primary**: Apollo scraper for bulk extraction
2. **Backup**: LinkedIn scraper for specific profile enrichment
3. **Smart selection**: System automatically chooses optimal actor
4. **Cost tracking**: Real-time budget monitoring

### Production Configuration
- Actor IDs: jljBwyyQakqrL1wae (Apollo), PEgClm7RgRD7YO94b (LinkedIn)
- Environment variables for API tokens
- Graceful fallback system
- Daily quota management