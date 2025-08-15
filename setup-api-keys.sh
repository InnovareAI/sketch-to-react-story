#!/bin/bash

# Setup API Keys for SAM AI Testing
echo "🤖 SAM AI - API Keys Setup"
echo ""

echo "You mentioned you have OpenAI and Anthropic API keys available."
echo "To connect the AI backend for real-time conversational testing, we need to set them up."
echo ""

echo "📋 Choose your setup method:"
echo ""
echo "Option 1: Environment Variables (Recommended for testing)"
echo "   export VITE_OPENAI_API_KEY=\"sk-...your-openai-key...\""
echo "   export VITE_ANTHROPIC_API_KEY=\"sk-ant-...your-anthropic-key...\""
echo ""

echo "Option 2: Create .env.local file (Persists locally)"
echo "   echo 'VITE_OPENAI_API_KEY=sk-...your-openai-key...' > .env.local"
echo "   echo 'VITE_ANTHROPIC_API_KEY=sk-ant-...your-anthropic-key...' >> .env.local"
echo ""

echo "Option 3: Netlify Dashboard (Production deployment)"
echo "   1. Go to: https://app.netlify.com/sites/sameaisalesassistant/settings/deploys"
echo "   2. Add environment variables:"
echo "      VITE_OPENAI_API_KEY=sk-...your-openai-key..."
echo "      VITE_ANTHROPIC_API_KEY=sk-ant-...your-anthropic-key..."
echo ""

echo "🧪 After setting up API keys, test the connection:"
echo "   node test-ai-connection.js"
echo ""

echo "🚀 Then start the development server:"
echo "   npm run dev"
echo ""

echo "💡 SAM AI will automatically detect and use the available APIs:"
echo "   - Anthropic Claude 3.5 Sonnet (Primary)"  
echo "   - OpenAI GPT-4 Turbo (Fallback)"
echo "   - Mock responses (No API key)"