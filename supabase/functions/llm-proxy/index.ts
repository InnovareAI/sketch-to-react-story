import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { crypto } from 'https://deno.land/std@0.177.0/crypto/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify user authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get user's workspace for tenant validation
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('workspace_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.workspace_id) {
      return new Response(
        JSON.stringify({ error: 'User workspace not found' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const { provider, payload } = await req.json()

    if (!provider || !payload) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Retrieve encrypted API key with tenant validation
    const { data: apiKeyData, error: keyError } = await supabase
      .from('api_keys')
      .select('encrypted_key, model, base_url')
      .eq('user_id', user.id)
      .eq('workspace_id', profile.workspace_id) // Tenant validation
      .eq('provider', provider)
      .single()

    if (keyError || !apiKeyData) {
      return new Response(
        JSON.stringify({ error: 'API key not found for provider' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Decrypt the API key
    const encoder = new TextEncoder()
    const decoder = new TextDecoder()
    
    // Generate decryption key
    const decryptionKey = await crypto.subtle.digest(
      'SHA-256',
      encoder.encode(profile.workspace_id + Deno.env.get('ENCRYPTION_SALT'))
    )

    // Decode from base64
    const encryptedData = Uint8Array.from(atob(apiKeyData.encrypted_key), c => c.charCodeAt(0))
    
    // Simple XOR decryption
    const decryptedData = new Uint8Array(encryptedData.length)
    const keyBytes = new Uint8Array(decryptionKey)
    for (let i = 0; i < encryptedData.length; i++) {
      decryptedData[i] = encryptedData[i] ^ keyBytes[i % keyBytes.length]
    }
    
    const apiKey = decoder.decode(decryptedData)

    // Make the API call based on provider
    let response
    
    if (provider === 'openrouter') {
      response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://sam-ai.app',
          'X-Title': 'SAM AI Platform'
        },
        body: JSON.stringify({
          model: apiKeyData.model || 'anthropic/claude-3.5-sonnet',
          messages: payload.messages,
          max_tokens: payload.maxTokens || 1000,
          temperature: payload.temperature || 0.7
        })
      })
    } else if (provider === 'openai') {
      response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: apiKeyData.model || 'gpt-4-turbo-preview',
          messages: payload.messages,
          max_tokens: payload.maxTokens || 1000,
          temperature: payload.temperature || 0.7
        })
      })
    } else if (provider === 'anthropic') {
      response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: apiKeyData.model || 'claude-3-sonnet-20240229',
          messages: payload.messages,
          max_tokens: payload.maxTokens || 1000
        })
      })
    } else if (provider === 'custom' && apiKeyData.base_url) {
      response = await fetch(`${apiKeyData.base_url}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })
    } else {
      return new Response(
        JSON.stringify({ error: 'Unsupported provider' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!response.ok) {
      const errorText = await response.text()
      return new Response(
        JSON.stringify({ error: `API call failed: ${errorText}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const result = await response.json()

    // Extract the response content based on provider format
    let content = ''
    if (provider === 'anthropic') {
      content = result.content?.[0]?.text || ''
    } else {
      content = result.choices?.[0]?.message?.content || ''
    }

    // Log API usage for billing/monitoring
    await supabase
      .from('api_usage')
      .insert({
        workspace_id: profile.workspace_id,
        user_id: user.id,
        provider,
        tokens_used: result.usage?.total_tokens || 0,
        cost_estimate: calculateCost(provider, result.usage),
        created_at: new Date().toISOString()
      })

    return new Response(
      JSON.stringify({ content, usage: result.usage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in llm-proxy function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function calculateCost(provider: string, usage: any): number {
  if (!usage) return 0
  
  // Rough cost estimates per 1K tokens
  const costs: Record<string, { input: number; output: number }> = {
    'openrouter': { input: 0.001, output: 0.003 },
    'openai': { input: 0.01, output: 0.03 },
    'anthropic': { input: 0.008, output: 0.024 }
  }
  
  const providerCosts = costs[provider] || { input: 0, output: 0 }
  const inputCost = (usage.prompt_tokens || 0) * providerCosts.input / 1000
  const outputCost = (usage.completion_tokens || 0) * providerCosts.output / 1000
  
  return inputCost + outputCost
}