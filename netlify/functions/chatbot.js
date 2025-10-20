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
  
  if (msg.includes('hello') || msg.includes('hi')) return responses.greeting;
  if (msg.includes('stock') || msg.includes('inventory') || msg.includes('available')) {
    return await getStockInfo(msg);
  }
  if (msg.includes('product') || msg.includes('fruit') || msg.includes('vegetable')) return responses.products;
  if (msg.includes('deliver') || msg.includes('shipping')) return responses.delivery;
  if (msg.includes('pay') || msg.includes('payment') || msg.includes('mpesa')) return responses.payment;
  if (msg.includes('order') || msg.includes('buy')) return responses.order;
  if (msg.includes('contact') || msg.includes('support')) return responses.contact;
  
  return responses.default;
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
