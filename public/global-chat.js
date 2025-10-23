// Global Page Loader
document.addEventListener('DOMContentLoaded', function() {
  // Add loader to page if not exists
  if (!document.getElementById('page-loader')) {
    const loader = document.createElement('div');
    loader.id = 'page-loader';
    loader.innerHTML = `
      <div class="loader-content">
        <div class="loader-spinner"></div>
        <div class="loader-text">Loading TillValle...</div>
      </div>
    `;
    document.body.prepend(loader);

    // Hide loader after page loads
    window.addEventListener('load', () => {
      setTimeout(() => {
        loader.classList.add('fade-out');
        setTimeout(() => loader.remove(), 500);
      }, 800);
    });
  }

  // Enhanced Chatbot Sidebar Functionality
  const chatBtn = document.getElementById('floating-chatbot-btn');
  const chatSidebar = document.getElementById('chatbot-sidebar');
  const chatClose = document.getElementById('chatbot-close');
  const chatSend = document.getElementById('chatbot-send');
  const chatInput = document.getElementById('chatbot-input');
  const chatBackdrop = document.getElementById('chatbot-backdrop');

  if (chatBtn && chatSidebar) {
    chatBtn.addEventListener('click', () => {
      chatSidebar.classList.add('open');
      chatBackdrop.classList.add('show');
    });
  }

  if (chatClose && chatSidebar) {
    chatClose.addEventListener('click', () => {
      chatSidebar.classList.remove('open');
      chatBackdrop.classList.remove('show');
    });
  }

  if (chatBackdrop) {
    chatBackdrop.addEventListener('click', () => {
      chatSidebar.classList.remove('open');
      chatBackdrop.classList.remove('show');
    });
  }

  if (chatSend) {
    chatSend.addEventListener('click', sendMessage);
  }

  if (chatInput) {
    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendMessage();
    });
  }
  
  async function sendMessage() {
    const message = chatInput.value.trim();
    if (!message) return;

    const messagesDiv = document.getElementById('chatbot-messages');
    messagesDiv.innerHTML += `<div class="chatbot-message user">${message}</div>`;
    chatInput.value = '';

    // Enhanced typing indicator
    const typing = document.createElement('div');
    typing.className = 'chatbot-typing';
    typing.innerHTML = '🤖 TillieBot is thinking...';
    messagesDiv.appendChild(typing);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;

    try {
      const response = await getAIResponse(message);
      typing.remove();
      messagesDiv.innerHTML += `<div class="chatbot-message bot">${response}</div>`;
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    } catch (error) {
      typing.remove();
      messagesDiv.innerHTML += `<div class="chatbot-message bot">Sorry, I'm having trouble right now. Please try again.</div>`;
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
  }
  
  async function getAIResponse(message) {
    const stockInfo = await checkStock(message);
    return getBasicResponse(message.toLowerCase(), stockInfo);
  }
  
  async function checkStock(message) {
    try {
      const stockUrl = '/.netlify/functions/stock';
      const response = await fetch(stockUrl);
      
      if (response.ok) {
        const allStock = await response.json();
        const isFullStock = message.toLowerCase().includes('stock info') || message.toLowerCase().includes('all stock') || message.toLowerCase().includes('complete stock');
        
        if (isFullStock) {
          return allStock;
        } else {
          // Better product matching
          const filtered = allStock.filter(item => {
            if (!item.name) return false;
            const itemName = item.name.toLowerCase();
            const searchTerms = message.toLowerCase().split(' ');
            return searchTerms.some(term => 
              itemName.includes(term) || 
              term.includes(itemName.split(' ')[0])
            );
          });
          return filtered;
        }
      }
    } catch (error) {
      console.log('Stock check failed:', error);
    }
    return null;
  }
  
  function getBasicResponse(message, stockInfo) {
    // Greeting responses
    if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
      return '🌱 Hello! Welcome to TillValle! I\'m TillieBot, your smart farming assistant. I can help you with:<br><br>📦 Product information & stock levels<br>🚚 Delivery details<br>💰 Pricing & offers<br>🛒 Order assistance<br><br>What would you like to know?';
    }
    
    // Stock information
    let stockText = '';
    if (stockInfo && stockInfo.length > 0) {
      stockText = '<br><br>📊 <strong>Current Stock:</strong><br>';
      stockInfo.forEach(item => {
        if (item && item.name && typeof item.quantity !== 'undefined') {
          const status = item.quantity > 10 ? '✅ In Stock' : item.quantity > 0 ? '⚠️ Low Stock' : '❌ Out of Stock';
          stockText += `• ${item.name}: ${item.quantity} units ${status}<br>`;
        }
      });
    }
    
    if (message.includes('stock info') || message.includes('all stock') || message.includes('complete stock')) {
      if (!stockInfo || stockInfo.length === 0) {
        return '📦 <strong>Complete Stock Information:</strong><br>I\'m having trouble accessing our stock database right now. Please try again in a moment, or contact us directly for current availability.';
      }
      return '📦 <strong>Complete Stock Information:</strong>' + stockText;
    }
    
    // Product-specific responses
    const products = ['apple', 'milk', 'egg', 'banana', 'mango', 'avocado', 'kale', 'spinach', 'lettuce', 'basil', 'mint', 'chicken', 'ghee', 'butter'];
    const foundProduct = products.find(product => message.includes(product));
    
    if (foundProduct) {
      const productInfo = {
        apple: '🍎 <strong>Fresh Apples</strong> - KES 300/kg<br>Crisp, sweet apples perfect for snacking or cooking. Rich in fiber and vitamins!',
        milk: '🥛 <strong>Fresh Farm Milk</strong> - KES 120/liter<br>Pure, creamy milk from free-range cows. Delivered fresh daily from our partner farms!',
        egg: '🥚 <strong>Farm Fresh Eggs</strong> - KES 25/piece<br>Free-range eggs from happy, healthy chickens. Perfect for breakfast or baking!',
        banana: '🍌 <strong>Sweet Bananas</strong> - KES 150/bunch<br>Naturally sweet bananas, great for smoothies, snacks, or energy boosts!',
        mango: '🥭 <strong>Juicy Mangoes</strong> - KES 40/piece<br>Sweet, tropical mangoes bursting with flavor. Perfect for the season!',
        avocado: '🥑 <strong>Creamy Avocados</strong> - KES 30/piece<br>Rich, buttery avocados perfect for salads, toast, or guacamole!',
        kale: '🥬 <strong>Fresh Kales (Sukuma Wiki)</strong> - KES 30/bunch<br>Nutritious leafy greens, perfect for traditional Kenyan dishes!',
        spinach: '🥬 <strong>Baby Spinach</strong> - KES 30/bunch<br>Tender spinach leaves packed with iron and vitamins!',
        lettuce: '🥬 <strong>Crisp Lettuce</strong> - KES 80/head<br>Fresh, crunchy lettuce perfect for salads and sandwiches!',
        basil: '🌿 <strong>Fresh Basil</strong> - KES 50/bunch<br>Aromatic basil leaves perfect for cooking and garnishing!',
        mint: '🌿 <strong>Garden Mint</strong> - KES 40/bunch<br>Fresh mint leaves for teas, mojitos, and cooking!',
        chicken: '🐔 <strong>Free-Range Chicken</strong> - KES 800/kg<br>Healthy, naturally-raised chicken from local farms!',
        ghee: '🧈 <strong>Pure Ghee</strong> - KES 600/500g<br>Traditional clarified butter, perfect for cooking and health benefits!',
        butter: '🧈 <strong>Farm Butter</strong> - KES 400/250g<br>Creamy, fresh butter made from our farm milk!'
      };
      return productInfo[foundProduct] + stockText;
    }
    
    // Delivery information
    if (message.includes('deliver') || message.includes('shipping') || message.includes('transport')) {
      return '🚚 <strong>Delivery Information:</strong><br><br>📍 <strong>Nairobi:</strong> KES 200 (Same day delivery)<br>📍 <strong>Kiambu:</strong> KES 150<br>📍 <strong>Thika:</strong> KES 250<br><br>🎉 <strong>FREE delivery</strong> on orders over KES 2,000!<br><br>⏰ Order before 2 PM for same-day delivery!';
    }
    
    // Pricing information
    if (message.includes('price') || message.includes('cost') || message.includes('cheap') || message.includes('expensive')) {
      return '💰 <strong>Our Pricing:</strong><br><br>We offer competitive farm-to-table prices! Our products are:<br><br>✅ Directly from farmers<br>✅ No middleman markup<br>✅ Bulk discounts available<br>✅ Seasonal offers<br><br>Check specific product prices above or browse our shop!';
    }
    
    // Order help
    if (message.includes('order') || message.includes('buy') || message.includes('purchase') || message.includes('cart')) {
      return '🛒 <strong>How to Order:</strong><br><br>1️⃣ Browse our products<br>2️⃣ Click on any item to see details<br>3️⃣ Add to cart<br>4️⃣ Checkout with M-Pesa or card<br><br>Need help with your cart or have questions about an order? I\'m here to assist!';
    }
    
    // Payment information
    if (message.includes('pay') || message.includes('payment') || message.includes('mpesa') || message.includes('card')) {
      return '💳 <strong>Payment Options:</strong><br><br>📱 <strong>M-Pesa:</strong> Quick & secure mobile payments<br>💳 <strong>Card Payments:</strong> Visa, Mastercard accepted<br>💰 <strong>Cash on Delivery:</strong> Available in Nairobi<br><br>All payments are secure and encrypted!';
    }
    
    // Contact information
    if (message.includes('contact') || message.includes('support') || message.includes('help') || message.includes('phone') || message.includes('email')) {
      return '📞 <strong>Contact Us:</strong><br><br>📧 Email: support@tillvalle.com<br>📱 WhatsApp: +254 700 123 456<br>👩‍💼 Live Agent: Angela Wanjiru<br>📧 angelawanjiru@gmail.com<br><br>We\'re here to help 24/7!';
    }
    
    // Farming tips
    if (message.includes('farm') || message.includes('grow') || message.includes('plant') || message.includes('tips')) {
      return '👨‍🌾 <strong>Farming Tips:</strong><br><br>🌱 Start with quality seeds<br>💧 Proper watering schedule<br>🌞 Ensure adequate sunlight<br>🌿 Use organic fertilizers<br>🐛 Natural pest control<br><br>Want specific advice for a particular crop? Just ask!';
    }
    
    // Quality and freshness
    if (message.includes('fresh') || message.includes('quality') || message.includes('organic')) {
      return '🌟 <strong>Our Quality Promise:</strong><br><br>✅ Harvested within 24 hours<br>✅ No harmful pesticides<br>✅ Direct from certified farms<br>✅ Quality checked before delivery<br>✅ 100% satisfaction guarantee<br><br>Fresh from farm to your table!';
    }
    
    // General stock inquiry
    if (message.includes('stock') || message.includes('available') || message.includes('inventory')) {
      return '📦 <strong>Stock Check:</strong><br><br>Ask me about specific products like "apples" or "milk", or say "stock info" for our complete inventory.<br><br>I can also help you find alternatives if something is out of stock!' + stockText;
    }
    
    // Default response
    return '🌱 <strong>Hi there!</strong> I\'m TillieBot from TillValle! I can help you with:<br><br>📦 Product information & stock<br>💰 Pricing & offers<br>🚚 Delivery details<br>🛒 Order assistance<br>👨‍🌾 Farming tips<br><br>Try asking about specific products, delivery, or say "stock info" for everything!';
  }
});