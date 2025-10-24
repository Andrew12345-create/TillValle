const responses = {
  greeting: "Hello! Welcome to TillValle! How can I help you today?",
  products: "We offer fresh fruits, vegetables, dairy, and herbs from local Kenyan farmers!",
  delivery: "Same-day delivery across Nairobi for orders before 2 PM. Delivery fees start from KES 200.",
  payment: "We accept M-Pesa and card payments.",
  order: "Visit our shop page, add items to cart, and checkout with M-Pesa or card.",
  contact: "Contact us at support@tillvalle.com or Angela at angelawanjiru@gmail.com.",
  default: "I can help with products, delivery, payments, or orders. What would you like to know?"
};

async function getStockInfo(query) {
  try {
    const stockFunctionUrl = `${process.env.URL}/.netlify/functions/stock`;
    const isAllStockQuery = query.includes('all') || query.includes('complete') || query.includes('full');

    const response = await fetch(stockFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: isAllStockQuery ? '' : query, type: isAllStockQuery ? 'all' : 'specific' }),
    });

    if (!response.ok) {
      console.error('Error fetching stock from Netlify function:', response.status, response.statusText);
      return "📦 Complete Stock Information:\nI'm having trouble accessing our stock database right now. Please try again in a moment, or contact us directly for current availability.";
    }

    const stockData = await response.json();

    if (stockData.length === 0) {
      return isAllStockQuery
        ? "📦 No products found in our stock database."
        : `📦 Sorry, I couldn't find "${query}" in our stock. Try asking for "all stock" to see everything available.`;
    }

    let stockList = isAllStockQuery ? "📦 Complete Stock Information:\n\n" : "📦 Stock Information:\n\n";
    stockData.forEach(item => {
      stockList += `• ${item.name}: ${item.quantity} units\n`;
    });
    return stockList;

  } catch (error) {
    console.error('Stock query error:', error);
    return "📦 Complete Stock Information:\nI'm having trouble accessing our stock database right now. Please try again in a moment, or contact us directly for current availability.";
  }
}

async function getResponse(message) {
  const msg = message.toLowerCase();
  // For stock-related queries use the stock function (keeps that logic local)
  if (msg.includes('stock') || msg.includes('inventory') || msg.includes('available')) {
    return await getStockInfo(msg);
  }

  // If a GEMINI API key and URL are configured in the environment, use the AI backend
  // NOTE: Do NOT put your API key in source control. Set GEMINI_API_KEY and GEMINI_API_URL
  // in your Netlify environment variables (or use a secure server-side secret store).
  if (process.env.GEMINI_API_KEY) {
    try {
      const ai = await getAIGeneratedResponse(message);
      if (ai) return ai;
      // fall through to rule-based responses if AI returns nothing
    } catch (err) {
      console.error('AI generation error:', err.message || err);
      // continue to fallback rule-based responses
    }
  }

  // Fallback rule-based responses (quick replies)
  if (msg.includes('hello') || msg.includes('hi')) return responses.greeting;
  if (msg.includes('product') || msg.includes('fruit') || msg.includes('vegetable')) return responses.products;
  if (msg.includes('deliver') || msg.includes('shipping')) return responses.delivery;
  if (msg.includes('pay') || msg.includes('payment') || msg.includes('mpesa')) return responses.payment;
  if (msg.includes('order') || msg.includes('buy')) return responses.order;
  if (msg.includes('contact') || msg.includes('support')) return responses.contact;

  return responses.default;
}


/**
 * Call external generative AI endpoint using environment-configured values.
 * Requires:
 *  - GEMINI_API_KEY: the API key (set in Netlify env vars or your server environment)
 *  - GEMINI_API_URL: the full URL to POST to (recommended). If not provided we try a
 *    sensible default for the Google Generative Language API (may require enabling the API).
 *
 * The implementation here does a minimal, generic POST with JSON { message } and expects
 * a JSON response with a top-level `message` string. You can adapt GEMINI_API_URL to
 * point to a proxy or a provider-compatible endpoint that accepts `{ message }`.
 */
async function getAIGeneratedResponse(message) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  // Allow user to configure a custom URL to match their provider/proxy
  const apiUrl = process.env.GEMINI_API_URL || null;

  // If no custom URL provided, attempt Google Generative Language v1 endpoint using model env var
  const defaultModel = process.env.GEMINI_MODEL || 'text-bison-001';
  const googleUrl = `https://generativelanguage.googleapis.com/v1/models/${defaultModel}:generateText`;
  const targetUrl = apiUrl || googleUrl;

  const payload = apiUrl ? { message } : { // Google-style minimal payload
    "prompt": { "text": message },
    "temperature": 0.2,
    "maxOutputTokens": 250
  };

  const res = await fetch(targetUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`AI API error ${res.status}: ${text}`);
  }

  const data = await res.json().catch(() => null);
  if (!data) return null;

  // Normalize common response shapes: accept data.message, data.output, or Google-style
  if (typeof data.message === 'string') return data.message;
  if (data.output && typeof data.output === 'string') return data.output;
  if (data.output && Array.isArray(data.output) && data.output[0] && data.output[0].content) {
    return String(data.output[0].content || '');
  }
  // Google v1: data.candidates[0].output
  if (data.candidates && data.candidates[0] && data.candidates[0].output) {
    return data.candidates[0].output;
  }

  // Last-resort: stringify
  return String(data);
}

exports.handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }
  
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { message } = JSON.parse(event.body);
    if (!message) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Message required' }) };
    }

    const response = await getResponse(message);
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({ message: response })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Server error', message: 'Please try again later.' })
    };
  }
};
