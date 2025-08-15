#!/bin/bash

# Setup OpenRouter API Key for SAM AI Testing
echo "🤖 Setting up OpenRouter API Key for SAM AI"
echo ""

if [ -z "$1" ]; then
    echo "Usage: ./setup-openrouter-key.sh <YOUR_OPENROUTER_API_KEY>"
    echo ""
    echo "1. Get your API key from: https://openrouter.ai/keys"
    echo "2. Run: ./setup-openrouter-key.sh sk-or-v1-xxxxx"
    echo ""
    exit 1
fi

API_KEY="$1"

# Create local .env.local file
echo "VITE_OPENROUTER_API_KEY=$API_KEY" > .env.local

echo "✅ OpenRouter API Key set in .env.local"
echo ""
echo "🚀 Now you can test the SAM AI conversational flow:"
echo "   npm run dev"
echo ""
echo "🧪 Test the API connection:"
echo "   curl -X POST 'https://openrouter.ai/api/v1/chat/completions' \\"
echo "        -H 'Authorization: Bearer $API_KEY' \\"
echo "        -H 'Content-Type: application/json' \\"
echo "        -d '{\"model\": \"anthropic/claude-3.5-sonnet\", \"messages\": [{\"role\": \"user\", \"content\": \"Hello SAM!\"}]}'"
echo ""
echo "💡 Available models through OpenRouter:"
echo "   - anthropic/claude-3.5-sonnet (Primary)"
echo "   - openai/gpt-4-turbo"
echo "   - meta-llama/llama-3.1-70b-instruct"
echo "   - mistralai/mixtral-8x7b-instruct"