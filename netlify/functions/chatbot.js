// Simple rule-based chatbot for TillValle
// This provides responses based on keywords without requiring external APIs

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 2,
  idleTimeoutMillis: 30000,
});

// Location-based delivery pricing
const deliveryPricing = {
  'nairobi town': 400,
  'muthaiga north gardens balozi': 400,
  'muthaiga': 400,
  'westlands': 350,
  'karen': 450,
  'kilimani': 300,
  'lavington': 350,
  'kileleshwa': 300,
  'parklands': 250,
  'eastleigh': 200,
  'kasarani': 300,
  'thika road': 350,
  'thika': 350,
  'ngong road': 400,
  'ngong': 400,
  'langata': 450,
  'embakasi': 300,
  'donholm': 350,
  'buruburu': 300,
  'umoja': 250,
  'kayole': 200,
  'dandora': 200,
  'githurai': 250,
  'ruiru': 300,
  'kiambu': 350,
  'kikuyu': 400,
  'runda': 450,
  'gigiri': 400,
  'spring valley': 350,
  'upperhill': 350,
  'hurlingham': 350,
  'south b': 300,
  'south c': 350,
  'adams arcade': 350,
  'kilimani': 300,
  'riverside': 350,
  'woodley': 300,
  'dagoretti': 250,
  'kawangware': 200,
  'kibera': 200,
  'mathare': 200
};

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
    "We offer same-day delivery across Nairobi and surrounding areas for orders placed before 2 PM. Delivery fees start from KES 200 depending on your location. Ask me about pricing for your specific location!",
    "Fast delivery service! Orders before 2 PM are delivered the same day. We cover Nairobi, Westlands, Karen, and nearby areas. I can tell you the exact delivery cost for your area!",
    "Same-day delivery available for orders placed before 2 PM. We deliver fresh produce right to your doorstep across Nairobi and surrounding areas. Just tell me your location for pricing!"
  ],

  liveChat: [
    "I'll connect you with our live chat agent Angela Wanjiru at angelawanjiru@gmail.com. She's available to provide real-time assistance with your TillValle needs!"
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
    "You can reach our customer support at support@tillvalle.com. For real-time chat with a human agent, contact Angela at angelawanjiru@gmail.com. We're here to help!",
    "Need help? Contact us at support@tillvalle.com or for live chat support, reach Angela at angelawanjiru@gmail.com. Our team is ready to assist you!",
    "For any questions or support, email us at support@tillvalle.com. For immediate assistance, contact Angela Wanjiru at angelawanjiru@gmail.com."
  ],

  default: [
    "I'm here to help with information about our fresh produce, delivery, payments, or ordering. What would you like to know?",
    "I can assist you with questions about our products, delivery service, payment options, or placing orders. How can I help?",
    "Feel free to ask me about our fresh farm products, delivery areas, payment methods, or anything else related to TillValle!"
  ]
};

async function getResponse(message, isAdmin = false, language = 'en') {
  const lowerMessage = message.toLowerCase();
  
  // Chatbot responses in multiple languages
  const chatbotTranslations = {
    en: {
      greeting: "Hello! Welcome to TilleValle! How can I help you with fresh produce delivery today?",
      products: "We offer fresh products: fruits, vegetables, dairy, and herbs from local Kenyan farmers!",
      delivery: "Same-day delivery across Nairobi for orders before 2 PM. Delivery fees start from KES 200.",
      liveChat: "I'll connect you with our live chat agent Angela Wanjiru at angelawanjiru@gmail.com. She's available to provide real-time assistance!",
      default: "I'm here to help with information about our fresh produce, delivery, payments, or ordering. What would you like to know?"
    },
    sw: {
      greeting: "Hujambo! Karibu TilleValle! Ninawezaje kukusaidia na utoaji wa mazao safi leo?",
      products: "Tunauza mazao safi: matunda, mboga, maziwa, na viungo kutoka kwa wakulima wa Kenya!",
      delivery: "Utoaji siku moja Nairobi kwa maagizo kabla ya saa 2 mchana. Ada za utoaji kuanzia KES 200.",
      liveChat: "Nitakuunganisha na wakala wetu wa mazungumzo ya moja kwa moja Angela Wanjiru kwa angelawanjiru@gmail.com. Yupo tayari kutoa msaada!",
      default: "Nipo hapa kusaidia na taarifa kuhusu mazao yetu safi, utoaji, malipo, au kuagiza. Ungependa kujua nini?"
    },
    fr: {
      greeting: "Bonjour! Bienvenue chez TilleValle! Comment puis-je vous aider avec la livraison de produits frais aujourd'hui?",
      products: "Nous offrons des produits frais: fruits, légumes, produits laitiers et herbes des fermiers kényans!",
      delivery: "Livraison le jour même à Nairobi pour les commandes avant 14h. Frais de livraison à partir de 200 KES.",
      liveChat: "Je vais vous connecter avec notre agent de chat en direct Angela Wanjiru à angelawanjiru@gmail.com. Elle est disponible pour une assistance en temps réel!",
      default: "Je suis là pour vous aider avec des informations sur nos produits frais, livraison, paiements ou commandes. Que souhaitez-vous savoir?"
    },
    zh: {
      greeting: "您好！欢迎来到 TilleValle！今天我如何帮助您订购新鲜农产品？",
      products: "我们提供新鲜产品：来自肯尼亚当地农民的水果、蔬菜、乳制品和香草！",
      delivery: "内罗毕地区下午2点前下单可当日送达。配送费从200肯尼亚先令起。",
      liveChat: "我将为您联系我们的在线客服代表 Angela Wanjiru，邮箱：angelawanjiru@gmail.com。她可以提供实时帮助！",
      default: "我在这里帮助您了解我们的新鲜农产品、配送、付款或订购信息。您想了解什么？"
    }
  };
  
  const responses = chatbotTranslations[language] || chatbotTranslations.en;

  // Check for location-based delivery pricing queries
  if (lowerMessage.includes('delivery') || lowerMessage.includes('cost') || lowerMessage.includes('price') || lowerMessage.includes('how much') || lowerMessage.includes('location')) {
    // Look for location mentions in the message
    const locations = Object.keys(deliveryPricing);
    const mentionedLocation = locations.find(location => lowerMessage.includes(location));
    
    if (mentionedLocation) {
      const price = deliveryPricing[mentionedLocation];
      const locationName = mentionedLocation.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
      return `🚚 Delivery to ${locationName} costs KES ${price}. We offer same-day delivery for orders placed before 2 PM!\n\nExample: Nairobi Town to Muthaiga North Gardens Balozi = KES 400 ✅`;
    } else if (lowerMessage.includes('nairobi') || lowerMessage.includes('area') || lowerMessage.includes('where')) {
      return `📍 Here are our delivery rates for popular areas:\n\n` +
             `• Nairobi Town: KES 400\n` +
             `• Westlands: KES 350\n` +
             `• Karen: KES 450\n` +
             `• Kilimani: KES 300\n` +
             `• Parklands: KES 250\n` +
             `• Eastleigh: KES 200\n` +
             `• Muthaiga: KES 400\n\n` +
             `💡 Just tell me your specific location (e.g., "How much to Westlands?") and I'll give you the exact delivery cost!`;
    }
  }

  // Check for live chat requests
  if (lowerMessage.includes('live chat') || lowerMessage.includes('human') || lowerMessage.includes('agent') || lowerMessage.includes('real person') || lowerMessage.includes('angela') || lowerMessage.includes('talk to someone') || lowerMessage.includes('speak to')) {
    return responses.liveChat;
  }

  // Check if user typed just a product name
  const products = ['milk', 'eggs', 'butter', 'apples', 'mangoes', 'kales', 'spinach', 'basil', 'mint', 'bananas', 'avocados', 'chicken', 'ghee', 'coriander', 'parsley', 'lettuce', 'managu', 'terere', 'salgaa'];
  const exactProduct = products.find(product => lowerMessage.trim() === product);
  
  if (exactProduct) {
    try {
      const { Pool } = require('pg');
      const stockPool = new Pool({
        connectionString: process.env.STOCK_DB_URL,
        ssl: { rejectUnauthorized: false },
      });
      
      const result = await stockPool.query('SELECT * FROM product_stock WHERE LOWER(product_name) LIKE $1', [`%${exactProduct}%`]);
      
      if (result.rows.length > 0) {
        const item = result.rows[0];
        const response = item.stock_quantity > 0 
          ? `✅ ${item.product_name}: ${item.stock_quantity} available in stock!`
          : `❌ ${item.product_name} is currently out of stock. We'll restock soon!`;
        await stockPool.end();
        return response;
      } else {
        await stockPool.end();
        return `I couldn't find ${exactProduct} in our inventory. Please check our shop page for available items.`;
      }
    } catch (error) {
      console.error('Stock query error:', error);
      return `Let me check ${exactProduct} for you... Please visit our shop page to see current availability.`;
    }
  }

  // Check for stock inquiries
  if (lowerMessage.includes('stock') || lowerMessage.includes('in stock') || lowerMessage.includes('available')) {
    try {
      const { Pool } = require('pg');
      const stockPool = new Pool({
        connectionString: process.env.STOCK_DB_URL,
        ssl: { rejectUnauthorized: false },
      });
      
      // Check for specific item queries
      const products = ['milk', 'eggs', 'butter', 'apples', 'mangoes', 'kales', 'spinach', 'basil', 'mint', 'bananas', 'avocados', 'chicken', 'ghee', 'coriander', 'parsley', 'lettuce', 'managu', 'terere', 'salgaa'];
      const mentionedProduct = products.find(product => lowerMessage.includes(product));
      
      if (mentionedProduct) {
        // Query for specific item
        const result = await stockPool.query('SELECT * FROM product_stock WHERE LOWER(product_name) LIKE $1', [`%${mentionedProduct}%`]);
        
        if (result.rows.length > 0) {
          const item = result.rows[0];
          const response = item.stock_quantity > 0 
            ? `✅ ${item.product_name}: ${item.stock_quantity} available in stock!`
            : `❌ ${item.product_name} is currently out of stock. We'll restock soon!`;
          await stockPool.end();
          return response;
        } else {
          await stockPool.end();
          return `I couldn't find ${mentionedProduct} in our inventory. Please check our shop page for available items.`;
        }
      } else {
        // General stock query - show all items
        const result = await stockPool.query('SELECT * FROM product_stock ORDER BY product_name');
        const inStockItems = result.rows.filter(item => item.stock_quantity > 0);
        const outOfStockItems = result.rows.filter(item => item.stock_quantity <= 0);
        
        let response = 'Current stock levels:\n\n';
        
        if (inStockItems.length > 0) {
          response += '✅ In Stock:\n';
          inStockItems.forEach(item => {
            response += `• ${item.product_name}: ${item.stock_quantity} available\n`;
          });
          response += '\n';
        }
        
        if (outOfStockItems.length > 0) {
          response += '❌ Out of Stock:\n';
          outOfStockItems.forEach(item => {
            response += `• ${item.product_name}\n`;
          });
        }
        
        await stockPool.end();
        return response;
      }
    } catch (error) {
      console.error('Stock query error:', error);
      return "We have fresh produce available including: Milk, Eggs, Butter, Apples, Mangoes, Kales, Spinach, Basil, Mint, and many more! Visit our shop page to see current stock levels.";
    }
  }

  // Check for keywords and return appropriate response
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey') || lowerMessage.includes('hujambo') || lowerMessage.includes('bonjour') || lowerMessage.includes('你好')) {
    return responses.greeting;
  }

  if (lowerMessage.includes('product') || lowerMessage.includes('fruit') || lowerMessage.includes('vegetable') || lowerMessage.includes('dairy') || lowerMessage.includes('herb') || lowerMessage.includes('mazao') || lowerMessage.includes('produit') || lowerMessage.includes('产品')) {
    return responses.products;
  }

  if (lowerMessage.includes('deliver') || lowerMessage.includes('shipping') || lowerMessage.includes('when') || lowerMessage.includes('time') || lowerMessage.includes('utoaji') || lowerMessage.includes('livraison') || lowerMessage.includes('配送')) {
    return responses.delivery;
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
  return responses.default;
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

    const { message, isAdmin, language } = parsedBody;

    if (!message) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Message is required' }),
      };
    }

    // Get response based on message content
    const botMessage = await getResponse(message, isAdmin || false, language || 'en');
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
