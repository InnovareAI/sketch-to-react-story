#!/bin/bash

echo "🚀 Deploying Unipile Proxy Edge Function..."

# Deploy the edge function
npx supabase functions deploy unipile-proxy

echo "✅ Unipile proxy deployed!"
echo ""
echo "The proxy will handle:"
echo "- CORS issues when calling Unipile API from browser"
echo "- Authentication with the API key"
echo "- Error handling and response formatting"
echo ""
echo "Test it at: /test-sync"