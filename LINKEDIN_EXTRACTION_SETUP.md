# LinkedIn Data Extraction Setup Guide

## Overview
The SAM AI platform supports multiple methods for extracting LinkedIn profile data from search URLs:

1. **Apify Integration** (Recommended for production)
2. **Custom Backend API** (With Bright Data proxies)
3. **Simulation Mode** (For development/demo)

## Method 1: Apify Integration (Recommended)

### Why Apify?
- **Professional LinkedIn scraper** with 99% uptime
- **Built-in proxy rotation** and CAPTCHA handling
- **Legal compliance** - respects robots.txt and rate limits
- **Cost-effective** - ~$0.10-0.50 per 1000 profiles
- **No infrastructure needed** - cloud-based

### Setup Steps:

1. **Create Apify Account**
   ```bash
   # Sign up at https://apify.com
   # Get API token from Account > Integrations
   ```

2. **Add Environment Variable**
   ```bash
   # Add to Netlify environment variables
   VITE_APIFY_TOKEN=your_apify_token_here
   ```

3. **Test the Integration**
   ```javascript
   // The extractor will automatically use Apify when token is available
   // Test with a LinkedIn search URL like:
   // https://www.linkedin.com/search/results/people/?keywords=marketing%20manager
   ```

### Apify Actor Configuration:
```javascript
{
  "startUrls": [{ "url": "LINKEDIN_SEARCH_URL" }],
  "maxResults": 100,
  "extractEmails": true,
  "extractPhones": false,
  "saveToKVS": false
}
```

### Pricing:
- **Free tier**: 1,000 results/month
- **Paid plans**: Start at $49/month for 10,000 results
- **Pay per use**: $0.10-0.50 per 1000 profiles

## Method 2: Custom Backend API

### With Bright Data (Your Current Setup)

Since you already have Bright Data proxies configured, you can build a custom scraper:

1. **Create Backend Endpoint**
   ```typescript
   // Backend API endpoint: /api/linkedin/extract
   app.post('/api/linkedin/extract', async (req, res) => {
     const { url, maxProfiles } = req.body;
     
     // Use Puppeteer + Bright Data proxies
     const browser = await puppeteer.launch({
       args: ['--proxy-server=your-bright-data-proxy']
     });
     
     // Scrape LinkedIn search results
     const results = await scrapeLinkedInSearch(url, maxProfiles);
     
     res.json({ prospects: results });
   });
   ```

2. **Bright Data Configuration**
   ```javascript
   const proxyConfig = {
     host: 'brd-customer-hl_XXXXXXXX-zone-residential',
     port: 22225,
     username: 'brd-customer-hl_XXXXXXXX-zone-residential',
     password: 'your_password'
   };
   ```

## Method 3: Alternative Services

### RapidAPI LinkedIn Scrapers
- Multiple LinkedIn scraping APIs available
- Simpler integration than Apify
- Various pricing models

### PhantomBuster
- LinkedIn automation platform
- Good for small-scale extraction
- Higher cost per profile

## Implementation Priority

**For immediate deployment:**
1. ✅ **Use simulation mode** (already implemented)
2. 🔄 **Set up Apify integration** (add token to Netlify)
3. 📋 **Consider custom backend** (if you need more control)

## Current Implementation Status

The `linkedinExtractor.ts` service supports all three methods:

```typescript
// Automatically chooses best available method:
// 1. Apify (if token available)
// 2. Backend API (if available)
// 3. Simulation (fallback for demo)

const result = await linkedInExtractor.extractFromSearchUrl(searchUrl);
```

## Security & Compliance

### Legal Considerations:
- ✅ **Respect robots.txt**
- ✅ **Rate limiting**
- ✅ **Don't overload LinkedIn servers**
- ✅ **Use for legitimate business purposes only**

### Data Privacy:
- 🔒 **Only extract publicly available data**
- 🔒 **Implement data retention policies**
- 🔒 **Comply with GDPR/CCPA requirements**

## Next Steps

1. **For Demo/Development**: Current simulation works perfectly
2. **For Production**: Add Apify token to environment variables
3. **For Scale**: Consider custom backend with Bright Data

## Cost Comparison

| Method | Setup Time | Monthly Cost | Maintenance | Reliability |
|--------|------------|--------------|-------------|-------------|
| Apify | 30 minutes | $49+ | None | Very High |
| Custom Backend | 2-3 days | $30+ (proxies) | High | Medium |
| Simulation | ✅ Ready | $0 | None | Demo Only |

**Recommendation**: Start with Apify for production due to reliability and ease of use.