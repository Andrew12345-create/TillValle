const fetch = require('node-fetch');

const apiBaseUrl = 'https://ep-billowing-mode-adkbmnzk.apirest.c-2.us-east-1.aws.neon.tech/neondb/rest/v1';
const apiKey = 'napi_aa19lsyo2ekw2lgwkph6nor6vepupxx24kq0jkt0y79lfqd9zyu608n7nh7x6te9';

exports.handler = async function(event, context) {
  try {
    if (event.httpMethod === 'GET') {
      // Fetch all product stock from Neon REST API
      const res = await fetch(`${apiBaseUrl}/product_stock?select=product_id,product_name,in_stock`, {
        headers: {
          'apikey': apiKey,
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      if (!res.ok) {
        return { statusCode: res.status, body: 'Failed to fetch stock data' };
      }
      const data = await res.json();
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      };
    } else if (event.httpMethod === 'POST') {
      // Update stock status via Neon REST API
      const { product_id, in_stock } = JSON.parse(event.body);
      if (!product_id || typeof in_stock !== 'boolean') {
        return { statusCode: 400, body: 'Invalid request body' };
      }
      const res = await fetch(`${apiBaseUrl}/product_stock?product_id=eq.${product_id}`, {
        method: 'PATCH',
        headers: {
          'apikey': apiKey,
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ in_stock, last_updated: new Date().toISOString() })
      });
      if (!res.ok) {
        return { statusCode: res.status, body: 'Failed to update stock' };
      }
      const updated = await res.json();
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Stock updated', updated })
      };
    } else {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }
  } catch (error) {
    console.error('API error:', error);
    return {
      statusCode: 500,
      body: 'Internal Server Error'
    };
  }
};
