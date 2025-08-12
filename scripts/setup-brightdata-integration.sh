#!/bin/bash

# SAM AI - Bright Data LinkedIn Integration Setup Script
# This script sets up the complete Bright Data proxy integration for LinkedIn scraping

set -e  # Exit on any error

echo "🚀 Starting Bright Data LinkedIn Integration Setup..."
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
    print_info "Checking dependencies..."
    
    if ! command -v supabase &> /dev/null; then
        print_error "Supabase CLI is not installed. Please install it first:"
        echo "  npm install -g supabase"
        exit 1
    fi
    
    if ! command -v netlify &> /dev/null; then
        print_warning "Netlify CLI not found. Install it for automatic deployment:"
        echo "  npm install -g netlify-cli"
    fi
    
    print_status "Dependencies checked"
}

# Get Bright Data credentials from user
get_brightdata_credentials() {
    print_info "Setting up Bright Data credentials..."
    echo ""
    echo "You need to create a Bright Data account and residential proxy zone:"
    echo "1. Go to https://brightdata.com"
    echo "2. Create an account"
    echo "3. Create a residential proxy zone named 'sam-ai-linkedin'"
    echo "4. Configure the zone with these settings:"
    echo "   - Name: sam-ai-linkedin"
    echo "   - IP Rotation: Per request"
    echo "   - Countries: US, CA, UK, AU"
    echo "   - Session Management: Enabled"
    echo ""
    
    # Get credentials from user
    read -p "Enter your Bright Data Customer ID: " BRIGHTDATA_CUSTOMER_ID
    read -s -p "Enter your Bright Data Zone Password: " BRIGHTDATA_PASSWORD
    echo ""
    read -p "Enter your Zone Name (default: sam-ai-linkedin): " BRIGHTDATA_ZONE
    BRIGHTDATA_ZONE=${BRIGHTDATA_ZONE:-sam-ai-linkedin}
    
    # Validate credentials are not empty
    if [[ -z "$BRIGHTDATA_CUSTOMER_ID" || -z "$BRIGHTDATA_PASSWORD" ]]; then
        print_error "Customer ID and Password are required!"
        exit 1
    fi
    
    print_status "Bright Data credentials collected"
}

# Update local environment file
update_local_env() {
    print_info "Updating local environment file..."
    
    # Backup existing .env.local if it exists
    if [[ -f ".env.local" ]]; then
        cp ".env.local" ".env.local.backup.$(date +%Y%m%d_%H%M%S)"
        print_status "Backed up existing .env.local"
    fi
    
    # Update or add Bright Data credentials
    if grep -q "VITE_BRIGHTDATA_CUSTOMER_ID" ".env.local" 2>/dev/null; then
        # Update existing entries
        sed -i.bak "s/^VITE_BRIGHTDATA_CUSTOMER_ID=.*/VITE_BRIGHTDATA_CUSTOMER_ID=${BRIGHTDATA_CUSTOMER_ID}/" ".env.local"
        sed -i.bak "s/^VITE_BRIGHTDATA_PASSWORD=.*/VITE_BRIGHTDATA_PASSWORD=${BRIGHTDATA_PASSWORD}/" ".env.local"
        sed -i.bak "s/^VITE_BRIGHTDATA_ZONE=.*/VITE_BRIGHTDATA_ZONE=${BRIGHTDATA_ZONE}/" ".env.local"
        rm ".env.local.bak" 2>/dev/null || true
    else
        # Add new entries
        echo "" >> ".env.local"
        echo "# Bright Data Configuration (Proxy Service)" >> ".env.local"
        echo "VITE_BRIGHTDATA_CUSTOMER_ID=${BRIGHTDATA_CUSTOMER_ID}" >> ".env.local"
        echo "VITE_BRIGHTDATA_PASSWORD=${BRIGHTDATA_PASSWORD}" >> ".env.local"
        echo "VITE_BRIGHTDATA_ZONE=${BRIGHTDATA_ZONE}" >> ".env.local"
    fi
    
    print_status "Local environment updated"
}

# Deploy Supabase Edge Function
deploy_edge_function() {
    print_info "Deploying Bright Data proxy edge function..."
    
    # Check if Supabase is linked
    if ! supabase status | grep -q "API URL"; then
        print_error "Supabase project not linked. Please run 'supabase link' first."
        exit 1
    fi
    
    # Deploy the edge function
    if supabase functions deploy brightdata-proxy; then
        print_status "Bright Data proxy edge function deployed"
    else
        print_error "Failed to deploy edge function"
        exit 1
    fi
}

# Set Supabase secrets
set_supabase_secrets() {
    print_info "Setting Supabase edge function secrets..."
    
    # Set secrets for the edge function
    supabase secrets set VITE_BRIGHTDATA_CUSTOMER_ID="$BRIGHTDATA_CUSTOMER_ID"
    supabase secrets set VITE_BRIGHTDATA_PASSWORD="$BRIGHTDATA_PASSWORD"
    supabase secrets set VITE_BRIGHTDATA_ZONE="$BRIGHTDATA_ZONE"
    
    print_status "Supabase secrets configured"
}

# Set Netlify environment variables
set_netlify_env() {
    print_info "Setting up Netlify environment variables..."
    
    if command -v netlify &> /dev/null; then
        # Check if site is linked
        if netlify status | grep -q "Site Name"; then
            netlify env:set VITE_BRIGHTDATA_CUSTOMER_ID "$BRIGHTDATA_CUSTOMER_ID"
            netlify env:set VITE_BRIGHTDATA_PASSWORD "$BRIGHTDATA_PASSWORD" 
            netlify env:set VITE_BRIGHTDATA_ZONE "$BRIGHTDATA_ZONE"
            print_status "Netlify environment variables set"
        else
            print_warning "Netlify site not linked. Please run 'netlify link' and then set environment variables manually:"
            echo "  netlify env:set VITE_BRIGHTDATA_CUSTOMER_ID \"$BRIGHTDATA_CUSTOMER_ID\""
            echo "  netlify env:set VITE_BRIGHTDATA_PASSWORD \"$BRIGHTDATA_PASSWORD\""
            echo "  netlify env:set VITE_BRIGHTDATA_ZONE \"$BRIGHTDATA_ZONE\""
        fi
    else
        print_warning "Netlify CLI not available. Set environment variables manually in Netlify dashboard:"
        echo "  VITE_BRIGHTDATA_CUSTOMER_ID = $BRIGHTDATA_CUSTOMER_ID"
        echo "  VITE_BRIGHTDATA_PASSWORD = [hidden]"
        echo "  VITE_BRIGHTDATA_ZONE = $BRIGHTDATA_ZONE"
    fi
}

# Test the integration
test_integration() {
    print_info "Testing Bright Data integration..."
    
    # Get the Supabase URL
    SUPABASE_URL=$(supabase status | grep "API URL" | cut -d: -f2- | xargs)
    
    if [[ -z "$SUPABASE_URL" ]]; then
        print_error "Could not get Supabase URL for testing"
        return 1
    fi
    
    # Test the proxy connection
    print_info "Testing proxy connection..."
    
    RESPONSE=$(curl -s -X POST "${SUPABASE_URL}/functions/v1/brightdata-proxy" \
        -H "Content-Type: application/json" \
        -d '{"action": "test", "country": "US"}' || echo "ERROR")
    
    if echo "$RESPONSE" | grep -q '"success":true'; then
        print_status "Proxy connection test successful"
    else
        print_error "Proxy connection test failed"
        echo "Response: $RESPONSE"
        return 1
    fi
    
    print_status "Integration test completed"
}

# Create configuration summary
create_config_summary() {
    print_info "Creating configuration summary..."
    
    cat > "BRIGHTDATA_SETUP_SUMMARY.md" << EOF
# Bright Data LinkedIn Integration - Setup Summary

## Configuration Completed
- **Date**: $(date)
- **Zone**: $BRIGHTDATA_ZONE
- **Customer ID**: ${BRIGHTDATA_CUSTOMER_ID:0:10}...
- **Edge Function**: Deployed to Supabase
- **Environment**: Local and Production configured

## Available LinkedIn Search Types

### 1. Basic LinkedIn Search
- **URL Pattern**: \`linkedin.com/search/results/people/\`
- **Max Results**: 100 per search
- **Cost**: ~\$0.05 per prospect

### 2. Sales Navigator Search
- **URL Pattern**: \`linkedin.com/sales/search/people/\`
- **Max Results**: 25 per search (premium)
- **Cost**: ~\$0.075 per prospect
- **Requirements**: LinkedIn Sales Navigator account

### 3. Recruiter Search
- **URL Pattern**: \`linkedin.com/talent/search\`
- **Max Results**: 25 per search (premium)
- **Cost**: ~\$0.10 per prospect
- **Requirements**: LinkedIn Recruiter account

### 4. Company Followers
- **URL Pattern**: \`linkedin.com/company/*/followers/\`
- **Max Results**: 500 per company
- **Cost**: ~\$0.025 per prospect

### 5. Post Engagement
- **URL Pattern**: \`linkedin.com/posts/*\`
- **Max Results**: 200 engagers
- **Cost**: ~\$0.015 per engager

### 6. Group Members
- **URL Pattern**: \`linkedin.com/groups/*/members/\`
- **Max Results**: 500 per group
- **Cost**: ~\$0.02 per member

### 7. Event Attendees
- **URL Pattern**: \`linkedin.com/events/*/attendees/\`
- **Max Results**: 300 per event
- **Cost**: ~\$0.015 per attendee

### 8. People You May Know
- **Requirements**: Connected LinkedIn account
- **Max Results**: 50 suggestions
- **Cost**: ~\$0.01 per suggestion

## Usage Guidelines

### Budget Management
- **Monthly Budget**: \$5.00 (default)
- **Cost Tracking**: Enabled
- **Budget Alerts**: At 80% utilization
- **Auto-stop**: At 100% budget

### Rate Limits
- **Requests per minute**: 20
- **Requests per hour**: 100
- **Concurrent requests**: 5
- **Cool-down period**: 30 seconds

### Error Handling
- **Auto-retry**: 3 attempts
- **Backoff strategy**: Exponential
- **Fallback regions**: US → CA → UK
- **Proxy rotation**: Per request

## Testing Your Setup

1. **Basic Connection Test**:
   \`\`\`bash
   curl -X POST "${SUPABASE_URL}/functions/v1/brightdata-proxy" \\
     -H "Content-Type: application/json" \\
     -d '{"action": "test", "country": "US"}'
   \`\`\`

2. **Profile Scraping Test**:
   \`\`\`bash
   curl -X POST "${SUPABASE_URL}/functions/v1/brightdata-proxy" \\
     -H "Content-Type: application/json" \\
     -d '{
       "action": "scrape",
       "profileUrl": "https://linkedin.com/in/test-profile",
       "country": "US"
     }'
   \`\`\`

3. **LinkedIn Search Test**:
   \`\`\`bash
   curl -X POST "${SUPABASE_URL}/functions/v1/brightdata-proxy" \\
     -H "Content-Type: application/json" \\
     -d '{
       "action": "linkedin-basic-search",
       "searchUrl": "https://linkedin.com/search/results/people/?keywords=software%20engineer",
       "maxResults": 10,
       "country": "US"
     }'
   \`\`\`

## Security Notes

- **Credentials**: Stored securely in Supabase secrets and Netlify environment
- **Local Environment**: Credentials in .env.local (gitignored)
- **Proxy Rotation**: Automatic IP rotation for each request
- **Session Management**: Sticky sessions for complex scraping workflows

## Troubleshooting

### Common Issues
1. **"Bright Data credentials not configured"**: Check environment variables
2. **"Proxy test failed"**: Verify zone configuration and password
3. **"LinkedIn access blocked"**: Use different proxy region
4. **"Rate limit exceeded"**: Wait for cool-down period

### Support
- **Bright Data Dashboard**: https://brightdata.com/cp
- **Zone Management**: Configure IP rotation and countries
- **Usage Analytics**: Monitor costs and success rates

## Next Steps

1. **Test Integration**: Run the test commands above
2. **Configure Budget**: Adjust monthly budget in optimizer settings
3. **Set Up Campaigns**: Create LinkedIn search campaigns
4. **Monitor Usage**: Check analytics dashboard regularly

---
Generated on $(date)
EOF
    
    print_status "Configuration summary created: BRIGHTDATA_SETUP_SUMMARY.md"
}

# Main execution
main() {
    echo ""
    echo "This script will set up Bright Data LinkedIn integration for SAM AI."
    echo "You'll need Bright Data account credentials to continue."
    echo ""
    read -p "Continue? (y/n): " -n 1 -r
    echo ""
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Setup cancelled."
        exit 0
    fi
    
    check_dependencies
    get_brightdata_credentials
    update_local_env
    deploy_edge_function
    set_supabase_secrets
    set_netlify_env
    test_integration
    create_config_summary
    
    echo ""
    echo "=================================================="
    echo -e "${GREEN}✅ Bright Data LinkedIn Integration Setup Complete!${NC}"
    echo "=================================================="
    echo ""
    echo "📋 Summary:"
    echo "  ✓ Bright Data credentials configured"
    echo "  ✓ Edge function deployed to Supabase"
    echo "  ✓ Environment variables set (local and production)"
    echo "  ✓ Integration tested successfully"
    echo "  ✓ Configuration summary created"
    echo ""
    echo "📖 Next Steps:"
    echo "  1. Review BRIGHTDATA_SETUP_SUMMARY.md for detailed information"
    echo "  2. Test LinkedIn scraping in the SAM AI interface"
    echo "  3. Configure your first prospect search campaign"
    echo "  4. Monitor usage and costs in the analytics dashboard"
    echo ""
    echo "🔗 Quick Links:"
    echo "  - Bright Data Dashboard: https://brightdata.com/cp"
    echo "  - SAM AI Platform: https://sameaisalesassistant.netlify.app"
    echo "  - Support Documentation: ./BRIGHTDATA_SETUP_SUMMARY.md"
    echo ""
}

# Run main function
main "$@"