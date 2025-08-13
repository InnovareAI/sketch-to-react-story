// Netlify Function to proxy Unipile API requests
const https = require('https');

const UNIPILE_API_KEY = 'TE3VJJ3-N3E63ND-MWXM462-RBPCWYQ';
const UNIPILE_BASE_URL = 'api6.unipile.com';
const UNIPILE_PORT = 13443;

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  try {
    const { path, method = 'GET', body: requestBody } = JSON.parse(event.body || '{}');
    
    if (!path) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Path is required' }),
      };
    }

    console.log(`Proxying ${method} request to: ${path}`);

    // Make request to Unipile API
    const responseData = await new Promise((resolve, reject) => {
      const options = {
        hostname: UNIPILE_BASE_URL,
        port: UNIPILE_PORT,
        path: `/api/v1${path}`,
        method: method,
        headers: {
          'Authorization': `Bearer ${UNIPILE_API_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      };

      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          resolve({
            status: res.statusCode,
            data: data,
          });
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      if (requestBody && method !== 'GET') {
        req.write(JSON.stringify(requestBody));
      }

      req.end();
    });

    // Parse response
    let parsedData;
    try {
      parsedData = JSON.parse(responseData.data);
    } catch {
      parsedData = { text: responseData.data };
    }

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: responseData.status,
        ok: responseData.status >= 200 && responseData.status < 300,
        data: parsedData,
      }),
    };
  } catch (error) {
    console.error('Proxy error:', error);
    
    return {
      statusCode: 200, // Return 200 to avoid CORS issues
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 500,
        ok: false,
        error: error.message,
      }),
    };
  }
};