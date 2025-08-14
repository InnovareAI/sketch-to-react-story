#!/bin/bash

echo "🧪 Testing Server-Side LinkedIn Import Function"
echo "═══════════════════════════════════════════════"

PROJECT_REF="latxadqrvrrrcvkktrog"
FUNCTION_URL="https://${PROJECT_REF}.supabase.co/functions/v1/linkedin-import"

echo "🌐 Function URL: $FUNCTION_URL"
echo ""

echo "📡 Testing CORS preflight (OPTIONS request)..."
OPTIONS_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X OPTIONS "$FUNCTION_URL" \
  -H "Origin: https://sameaisalesassistant.netlify.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type,Authorization")

echo "OPTIONS Response:"
echo "$OPTIONS_RESPONSE"
echo ""

echo "🔍 Testing basic function availability (GET request)..."
GET_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X GET "$FUNCTION_URL")

echo "GET Response:"
echo "$GET_RESPONSE"
echo ""

echo "📮 Testing POST request with sample data..."
POST_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$FUNCTION_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{
    "workspaceId": "test-workspace",
    "options": {
      "limit": 5,
      "method": "unipile"
    }
  }')

echo "POST Response:"
echo "$POST_RESPONSE"
echo ""

echo "📊 Test Summary:"
echo "=================="
echo "If you see HTTP_CODE:200 responses, the function is working!"
echo "If you see errors, check the Supabase dashboard for logs:"
echo "https://supabase.com/dashboard/project/${PROJECT_REF}/functions"
echo ""
echo "🎯 Next Steps:"
echo "1. Configure environment variables as shown in previous output"
echo "2. Test from the SAM AI app using 'Server Sync LinkedIn' button"
echo "3. Monitor function logs for any issues"