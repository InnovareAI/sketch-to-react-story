#!/bin/bash

echo "🚀 Setting up InnovareAI team accounts..."

# For CL
echo "Adding cl@innovareai.com..."
curl -X POST https://latxadqrvrrrcvkktrog.supabase.co/auth/v1/signup \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhdHhhZHFydnJycmN2a2t0cm9nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY2MDEwNzUsImV4cCI6MjA1MjE3NzA3NX0.niqLT5ue9wDzJKVp8J8jZRJRQwhZGTWJysN8nU2h4ek" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "cl@innovareai.com",
    "password": "InnovareAI2025!",
    "data": {
      "full_name": "CL - InnovareAI",
      "role": "admin",
      "department": "Leadership"
    }
  }'

echo ""
echo "Adding tl@innovareai.com..."
curl -X POST https://latxadqrvrrrcvkktrog.supabase.co/auth/v1/signup \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhdHhhZHFydnJycmN2a2t0cm9nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY2MDEwNzUsImV4cCI6MjA1MjE3NzA3NX0.niqLT5ue9wDzJKVp8J8jZRJRQwhZGTWJysN8nU2h4ek" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "tl@innovareai.com",
    "password": "InnovareAI2025!",
    "data": {
      "full_name": "TL - InnovareAI",
      "role": "admin",
      "department": "Technology"
    }
  }'

echo ""
echo "Adding cs@innovareai.com..."
curl -X POST https://latxadqrvrrrcvkktrog.supabase.co/auth/v1/signup \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhdHhhZHFydnJycmN2a2t0cm9nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY2MDEwNzUsImV4cCI6MjA1MjE3NzA3NX0.niqLT5ue9wDzJKVp8J8jZRJRQwhZGTWJysN8nU2h4ek" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "cs@innovareai.com", 
    "password": "InnovareAI2025!",
    "data": {
      "full_name": "CS - InnovareAI",
      "role": "member",
      "department": "Customer Success"
    }
  }'

echo ""
echo "✅ Team accounts created!"
echo ""
echo "📋 Login Credentials:"
echo "  Email: cl@innovareai.com"
echo "  Email: tl@innovareai.com"
echo "  Email: cs@innovareai.com"
echo "  Password: InnovareAI2025!"
echo ""
echo "🎯 They can now login at: https://sameaisalesassistant.netlify.app"
