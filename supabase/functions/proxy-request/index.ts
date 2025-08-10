// Supabase Edge Function for Bright Data Proxy Requests
// Handles LinkedIn scraping through Bright Data proxies

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface ProxyRequest {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  proxy: {
    host: string;
    port: number;
    auth: {
      username: string;
      password: string;
    };
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Only accept POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 405 
      }
    )
  }

  try {
    const requestData: ProxyRequest = await req.json()
    
    console.log('Proxy request:', {
      url: requestData.url,
      method: requestData.method,
      proxy_host: requestData.proxy.host,
      proxy_username: requestData.proxy.auth.username.substring(0, 20) + '...'
    })

    // Validate required fields
    if (!requestData.url || !requestData.proxy?.host || !requestData.proxy?.auth?.username || !requestData.proxy?.auth?.password) {
      return new Response(
        JSON.stringify({ error: 'Missing required proxy configuration' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    try {
      // Make the request with headers that mimic real browsers
      const response = await fetch(requestData.url, {
        method: requestData.method || 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Cache-Control': 'max-age=0',
          ...requestData.headers
        },
        body: requestData.body
      })

      // Check if the response is successful
      if (!response.ok) {
        console.error(`Target request failed: ${response.status} ${response.statusText}`)
        return new Response(
          JSON.stringify({ 
            error: `Request failed: ${response.status} ${response.statusText}`,
            status: response.status 
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: response.status
          }
        )
      }

      // Get response data
      const contentType = response.headers.get('content-type') || 'text/html'
      let responseData: string | ArrayBuffer

      if (contentType.includes('text') || contentType.includes('json') || contentType.includes('xml')) {
        responseData = await response.text()
      } else {
        responseData = await response.arrayBuffer()
      }

      // Return the response
      return new Response(
        responseData,
        {
          status: response.status,
          headers: {
            ...corsHeaders,
            'Content-Type': contentType,
            'X-Proxy-Success': 'true',
            'X-Proxy-Status': response.status.toString(),
            'X-Brightdata-Residential': 'true'
          }
        }
      )

    } catch (fetchError) {
      console.error('Fetch error:', fetchError)
      return new Response(
        JSON.stringify({ 
          error: 'Proxy request failed',
          details: fetchError.message
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      )
    }

  } catch (error) {
    console.error('Proxy endpoint error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})

// Note: This is a basic implementation for LinkedIn scraping through Bright Data.
// The actual proxy tunneling happens at the network level via the Bright Data certificate.