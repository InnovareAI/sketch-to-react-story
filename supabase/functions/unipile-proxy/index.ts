import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const UNIPILE_API_KEY = 'TE3VJJ3-N3E63ND-MWXM462-RBPCWYQ'
const UNIPILE_BASE_URL = 'https://api6.unipile.com:13443/api/v1'

serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  }

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the request body and path
    const { path, method = 'GET', body } = await req.json()

    console.log(`Proxying ${method} request to: ${path}`)

    // Make the request to Unipile API
    // Note: Using full URL with proper headers
    const fullUrl = `${UNIPILE_BASE_URL}${path}`
    console.log(`Making request to: ${fullUrl}`)
    
    const requestOptions: RequestInit = {
      method,
      headers: {
        'Authorization': `Bearer ${UNIPILE_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Supabase Edge Function',
      },
    }
    
    if (body && method !== 'GET') {
      requestOptions.body = JSON.stringify(body)
    }
    
    const unipileResponse = await fetch(fullUrl, requestOptions)

    // Get the response
    const responseText = await unipileResponse.text()
    
    console.log(`Unipile response status: ${unipileResponse.status}`)

    // Try to parse as JSON
    let responseData
    try {
      responseData = JSON.parse(responseText)
    } catch {
      responseData = { text: responseText }
    }

    // Return the response with CORS headers
    return new Response(
      JSON.stringify({
        status: unipileResponse.status,
        ok: unipileResponse.ok,
        data: responseData,
      }),
      {
        status: 200, // Always return 200 to avoid CORS issues
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )
  } catch (error: any) {
    console.error('Proxy error:', error)
    
    return new Response(
      JSON.stringify({
        status: 500,
        ok: false,
        error: error.message,
      }),
      {
        status: 200, // Return 200 even for errors to avoid CORS issues
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )
  }
})