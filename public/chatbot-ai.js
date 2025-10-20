async function sendMessage() {
  const input = document.getElementById('chat-input');
  const messages = document.getElementById('chat-messages');
  const message = input.value.trim();
  
  if (!message) return;
  
  messages.innerHTML += '<div class="user-msg">' + message + '</div>';
  input.value = '';
  
  const typing = document.createElement('div');
  typing.className = 'typing-indicator show';
  typing.innerHTML = '🤖 Checking stock and thinking...';
  messages.appendChild(typing);
  messages.scrollTop = messages.scrollHeight;
  
  try {
    const response = await getAIResponse(message);
    typing.remove();
    messages.innerHTML += '<div class="bot-msg">' + response + '</div>';
    messages.scrollTop = messages.scrollHeight;
  } catch (error) {
    typing.remove();
    messages.innerHTML += '<div class="bot-msg">Sorry, I am having trouble. Please try again.</div>';
    messages.scrollTop = messages.scrollHeight;
  }
}

async function getAIResponse(message) {
  const stockInfo = await checkStock(message);
  return getBasicResponse(message.toLowerCase(), stockInfo);
}

async function checkStock(message) {
  try {
    const isLocal = window.location.hostname === 'localhost';
    const stockUrl = isLocal ? 'http://localhost:3001/stock' : '/.netlify/functions/stock';
    
    console.log('Fetching stock from:', stockUrl);
    
    const response = await fetch(stockUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log('Stock response status:', response.status);
    
    if (response.ok) {
      const allStock = await response.json();
      console.log('Stock data received:', allStock);
      
      // Filter based on message
      const isFullStock = message.toLowerCase().includes('stock info') || message.toLowerCase().includes('all stock');
      
      if (isFullStock) {
        return allStock;
      } else {
        // Filter for specific product
        const filtered = allStock.filter(item => 
          item.name && item.name.toLowerCase().includes(message.toLowerCase())
        );
        console.log('Filtered stock:', filtered);
        return filtered;
      }
    } else {
      console.log('Stock response not ok:', await response.text());
    }
  } catch (error) {
    console.log('Stock check failed:', error);
  }
  return null;
}

function getBasicResponse(message, stockInfo) {
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
  
  // Full stock info request
  if (message.includes('stock info') || message.includes('all stock') || message.includes('everything stock')) {
    console.log('Stock info request, stockInfo:', stockInfo);
    if (!stockInfo || stockInfo.length === 0) {
      return '📦 <strong>Complete Stock Information:</strong><br>Database connection failed or no products in stock table.';
    }
    return '📦 <strong>Complete Stock Information:</strong>' + stockText;
  }
  
  // Individual product checks
  const products = ['apple', 'milk', 'egg', 'banana', 'mango', 'avocado', 'kale', 'spinach', 'lettuce', 'basil', 'mint', 'chicken'];
  const foundProduct = products.find(product => message.includes(product));
  
  if (foundProduct) {
    const productInfo = {
      apple: '🍎 <strong>Apples</strong> - KES 300/kg',
      milk: '🥛 <strong>Fresh Milk</strong> - KES 120/liter',
      egg: '🥚 <strong>Farm Fresh Eggs</strong> - KES 25/piece',
      banana: '🍌 <strong>Bananas</strong> - KES 150/bunch',
      mango: '🥭 <strong>Mangoes</strong> - KES 40/piece',
      avocado: '🥑 <strong>Avocados</strong> - KES 30/piece',
      kale: '🥬 <strong>Kales</strong> - KES 30/bunch',
      spinach: '🥬 <strong>Spinach</strong> - KES 30/bunch',
      lettuce: '🥬 <strong>Lettuce</strong> - KES 80/head',
      basil: '🌿 <strong>Basil</strong> - KES 50/bunch',
      mint: '🌿 <strong>Mint</strong> - KES 40/bunch',
      chicken: '🐔 <strong>Free-Range Chicken</strong> - KES 800/kg'
    };
    
    // Find specific product stock
    let specificStock = '';
    if (stockInfo && stockInfo.length > 0) {
      const productStock = stockInfo.find(item => 
        item.name.toLowerCase().includes(foundProduct) || 
        foundProduct.includes(item.name.toLowerCase().split(' ')[0])
      );
      
      if (productStock) {
        const status = productStock.quantity > 10 ? '✅ In Stock' : productStock.quantity > 0 ? '⚠️ Low Stock' : '❌ Out of Stock';
        specificStock = `<br><br>📊 <strong>Stock:</strong> ${productStock.quantity} units ${status}`;
      }
    }
    
    return productInfo[foundProduct] + specificStock;
  }
  
  if (message.includes('stock')) {
    return '📦 <strong>Stock Check:</strong><br>Ask me about specific products like "apples" or "milk", or say "stock info" for everything.' + stockText;
  }
  
  return '🌱 Hi! I can help with products, stock, pricing, and orders. Try asking about specific products or say "stock info" for everything!' + stockText;
}