#!/bin/bash

# Deploy the updated edge function to the correct Supabase project
echo "Deploying updated direct-llm-processor to ktchrfgkbpaixbiwbieg.supabase.co..."

# Copy the function to a temporary location for deployment
mkdir -p /tmp/edge-function-deploy/functions/direct-llm-processor
cp supabase/functions/direct-llm-processor/index.ts /tmp/edge-function-deploy/functions/direct-llm-processor/

# Set the correct project reference
export SUPABASE_PROJECT_REF=ktchrfgkbpaixbiwbieg

# Deploy using the Supabase REST API
echo "Manual deployment using curl..."
curl -X PUT \
  "https://ktchrfgkbpaixbiwbieg.supabase.co/rest/v1/functions/direct-llm-processor" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d @supabase/functions/direct-llm-processor/index.ts

echo "Edge function deployment complete"
