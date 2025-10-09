// Simple rule-based chatbot for TillValle
// This provides responses based on keywords without requiring external APIs

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 2,
  idleTimeoutMillis: 30000,
});

const responses = {
  greeting: [
    "Hello! Welcome to TillValle! How can I help you with fresh produce delivery today?",
    "Hi there! I'm here to help you with your fresh farm product needs. What can I assist you with?",
    "Welcome to TillValle! Ready to get some fresh fruits and vegetables delivered?"
  ],

  products: [
    "We offer a wide variety of fresh products: fruits (mangoes, avocados, bananas), vegetables (kales, tomatoes, onions), dairy (eggs, milk, butter), and herbs (mint, coriander, basil). All sourced directly from local Kenyan farmers!",
    "Our fresh selection includes seasonal fruits, leafy greens, dairy products, and aromatic herbs. Everything is farm-fresh and delivered straight to your door!",
    "Check out our shop for the freshest produce: eggs, butter, greens, herbs, and seasonal fruits from Gilgil farms!"
  ],

  delivery: [
    "We offer same-day delivery across Nairobi and surrounding areas for orders placed before 2 PM. Delivery fees start from KES 200 depending on your location.",
    "Fast delivery service! Orders before 2 PM are delivered the same day. We cover Nairobi, Westlands, Karen, and nearby areas.",
    "Same-day delivery available for orders placed before 2 PM. We deliver fresh produce right to your doorstep across Nairobi and surrounding areas."
  ],

  payment: [
    "We accept M-Pesa payments and credit/debit cards for your convenience. M-Pesa is our most popular payment method!",
    "Pay securely with M-Pesa or card payments. M-Pesa is instant and widely used across Kenya.",
    "Multiple payment options: M-Pesa (recommended), Visa, Mastercard, and other card payments accepted."
  ],

  order: [
    "Ready to order? Visit our shop page, add items to your cart, and checkout. We accept M-Pesa and card payments with same-day delivery!",
    "To place an order: browse our shop, add products to cart, login or signup, and complete payment. Same-day delivery available!",
    "Ordering is easy! Select your fresh produce, add to cart, choose delivery time, and pay with M-Pesa or card."
  ],

  quality: [
    "All our products are sourced directly from trusted local farmers in Gilgil. We guarantee freshness and quality - if you're not satisfied, we'll make it right!",
    "Quality is our priority! Our produce comes straight from the farm to your table, ensuring maximum freshness and nutritional value.",
    "We work directly with local farmers to bring you the freshest, highest quality produce available in Kenya."
  ],

  contact: [
    "You can reach our customer support at support@tillvalle.com or call us at +254 XXX XXX XXX. We're here to help!",
    "Need help? Contact us at support@tillvalle.com or visit our contact page. Our team is ready to assist you!",
    "For any questions or support, email us at support@tillvalle.com or use the contact form on our website."
  ],

  default: [
    "I'm here to help with information about our fresh produce, delivery, payments, or ordering. What would you like to know?",
    "I can assist you with questions about our products, delivery service, payment options, or placing orders. How can I help?",
    "Feel free to ask me about our fresh farm products, delivery areas, payment methods, or anything else related to TillValle!"
  ]
};

async function getResponse(message, isAdmin = false) {
  const lowerMessage = message.toLowerCase();

  // Check for stock inquiries
  if (lowerMessage.includes('stock') || lowerMessage.includes('in stock') || lowerMessage.includes('available')) {
    return "We have fresh produce available including: Milk, Eggs, Butter, Apples, Mangoes, Kales, Spinach, Basil, Mint, and many more! Visit our shop page to see all available items and current stock levels.";
  }

  // Check for keywords and return appropriate response
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
    return responses.greeting[Math.floor(Math.random() * responses.greeting.length)];
  }

  if (lowerMessage.includes('product') || lowerMessage.includes('fruit') || lowerMessage.includes('vegetable') || lowerMessage.includes('dairy') || lowerMessage.includes('herb')) {
    return responses.products[Math.floor(Math.random() * responses.products.length)];
  }

  if (lowerMessage.includes('deliver') || lowerMessage.includes('shipping') || lowerMessage.includes('when') || lowerMessage.includes('time')) {
    return responses.delivery[Math.floor(Math.random() * responses.delivery.length)];
  }

  if (lowerMessage.includes('pay') || lowerMessage.includes('payment') || lowerMessage.includes('mpesa') || lowerMessage.includes('card')) {
    return responses.payment[Math.floor(Math.random() * responses.payment.length)];
  }

  if (lowerMessage.includes('order') || lowerMessage.includes('buy') || lowerMessage.includes('purchase') || lowerMessage.includes('cart')) {
    return responses.order[Math.floor(Math.random() * responses.order.length)];
  }

  if (lowerMessage.includes('quality') || lowerMessage.includes('fresh') || lowerMessage.includes('farm') || lowerMessage.includes('farmer')) {
    return responses.quality[Math.floor(Math.random() * responses.quality.length)];
  }

  if (lowerMessage.includes('contact') || lowerMessage.includes('support') || lowerMessage.includes('help') || lowerMessage.includes('email') || lowerMessage.includes('call')) {
    return responses.contact[Math.floor(Math.random() * responses.contact.length)];
  }

  // Default response
  return responses.default[Math.floor(Math.random() * responses.default.length)];
}

exports.handler = async (event, context) => {
  console.log('Chatbot function invoked with event:', event);

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const parsedBody = JSON.parse(event.body);
    console.log('Parsed request body:', parsedBody);

    const { message, isAdmin } = parsedBody;

    if (!message) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Message is required' }),
      };
    }

    // Get response based on message content
    const botMessage = await getResponse(message, isAdmin || false);
    console.log('Bot response:', botMessage);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: JSON.stringify({
        message: botMessage,
      }),
    };

  } catch (error) {
    console.error('Chatbot error:', error);

    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: JSON.stringify({
        error: 'Internal server error',
        message: 'Sorry, I encountered an error. Please try again later.',
      }),
    };
  }
};
