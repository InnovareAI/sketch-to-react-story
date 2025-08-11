// Netlify Function to handle LinkedIn OAuth callback securely
exports.handler = async (event, context) => {
  // Simple test response
  if (event.queryStringParameters?.test) {
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Function is working!' })
    };
  }
  console.log('LinkedIn callback received:', {
    method: event.httpMethod,
    headers: event.headers,
    query: event.queryStringParameters,
    body: event.body
  });
  const { code, state, error, error_description } = event.queryStringParameters || {};
  
  // Check for errors from LinkedIn
  if (error) {
    console.error('LinkedIn OAuth error:', error, error_description);
    return {
      statusCode: 302,
      headers: {
        Location: `/auth/linkedin/callback?error=${error}&error_description=${encodeURIComponent(error_description || error)}`
      }
    };
  }

  if (!code) {
    return {
      statusCode: 302,
      headers: {
        Location: '/auth/linkedin/callback?error=no_code'
      }
    };
  }

  try {
    // Log environment variables (without exposing secrets)
    console.log('Environment check:', {
      hasClientId: !!process.env.VITE_LINKEDIN_CLIENT_ID,
      hasClientSecret: !!process.env.VITE_LINKEDIN_CLIENT_SECRET,
      clientId: process.env.VITE_LINKEDIN_CLIENT_ID
    });
    
    // Exchange code for token
    const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: `https://sameaisalesassistant.netlify.app/.netlify/functions/linkedin-callback`,
        client_id: process.env.VITE_LINKEDIN_CLIENT_ID,
        client_secret: process.env.VITE_LINKEDIN_CLIENT_SECRET
      }).toString()
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Token exchange failed:', errorData);
      return {
        statusCode: 302,
        headers: {
          Location: '/auth/linkedin/callback?error=token_exchange_failed'
        }
      };
    }

    const tokenData = await tokenResponse.json();
    
    // Get user profile
    const profileResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`
      }
    });

    if (!profileResponse.ok) {
      return {
        statusCode: 302,
        headers: {
          Location: '/auth/linkedin/callback?error=profile_fetch_failed'
        }
      };
    }

    const profile = await profileResponse.json();
    
    // Create a temporary token to pass data to frontend
    const tempData = Buffer.from(JSON.stringify({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_in: tokenData.expires_in,
      profile: profile
    })).toString('base64');
    
    // Redirect back to the app with the data
    return {
      statusCode: 302,
      headers: {
        Location: `/auth/linkedin/callback?success=true&data=${tempData}&state=${state || ''}`
      }
    };
  } catch (error) {
    console.error('LinkedIn OAuth error:', error);
    return {
      statusCode: 302,
      headers: {
        Location: '/auth/linkedin/callback?error=server_error'
      }
    };
  }
};