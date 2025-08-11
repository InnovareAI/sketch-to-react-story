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
    const { provider, apiKey, model, baseUrl } = await req.json()

    if (!provider || !apiKey) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Encrypt the API key before storage
    const encoder = new TextEncoder()
    const keyData = encoder.encode(apiKey)
    
    // Generate encryption key from workspace ID (in production, use proper KMS)
    const encryptionKey = await crypto.subtle.digest(
      'SHA-256',
      encoder.encode(profile.workspace_id + Deno.env.get('ENCRYPTION_SALT'))
    )

    // Simple XOR encryption (in production, use AES-GCM)
    const encryptedData = new Uint8Array(keyData.length)
    const keyBytes = new Uint8Array(encryptionKey)
    for (let i = 0; i < keyData.length; i++) {
      encryptedData[i] = keyData[i] ^ keyBytes[i % keyBytes.length]
    }

    // Convert to base64 for storage
    const encryptedBase64 = btoa(String.fromCharCode(...encryptedData))

    // Store encrypted API key with tenant isolation
    const { error: storeError } = await supabase
      .from('api_keys')
      .upsert({
        user_id: user.id,
        workspace_id: profile.workspace_id,
        provider,
        encrypted_key: encryptedBase64,
        model,
        base_url: baseUrl,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,provider'
      })

    if (storeError) {
      console.error('Error storing API key:', storeError)
      return new Response(
        JSON.stringify({ error: 'Failed to store API key' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Log the action for audit trail
    await supabase
      .from('audit_logs')
      .insert({
        workspace_id: profile.workspace_id,
        user_id: user.id,
        action: 'api_key_stored',
        entity_type: 'api_keys',
        entity_id: provider,
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
        user_agent: req.headers.get('user-agent')
      })

    return new Response(
      JSON.stringify({ success: true, message: 'API key stored securely' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in store-api-key function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})