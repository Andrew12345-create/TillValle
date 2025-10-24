document.addEventListener('DOMContentLoaded', function() {
  const chatBtn = document.getElementById('chat-btn');
  const chatWindow = document.getElementById('chat-window');
  const chatClose = document.getElementById('chat-close');
  const chatSend = document.getElementById('chat-send');
  const chatInput = document.getElementById('chat-input');
  
  if (chatBtn) {
    chatBtn.addEventListener('click', () => {
      if (chatWindow) chatWindow.style.display = 'flex';
    });
  }
  if (chatClose) {
    chatClose.addEventListener('click', () => {
      if (chatWindow) chatWindow.style.display = 'none';
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
    const message = chatInput ? (chatInput.value || '').trim() : '';
    if (!message) return;

  const messagesDiv = document.getElementById('chat-messages');
  if (!messagesDiv) return;
  const userDiv = document.createElement('div');
  userDiv.className = 'user-msg';
  userDiv.textContent = message;
  messagesDiv.appendChild(userDiv);
  if (chatInput) chatInput.value = '';
    
    const typing = document.createElement('div');
  typing.className = 'typing-indicator show';
  typing.textContent = '🤖 Checking stock...';
    messagesDiv.appendChild(typing);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
    
    try {
      const response = await getAIResponse(message);
  typing.remove();
  const botDiv = document.createElement('div');
  botDiv.className = 'bot-msg';
  botDiv.innerHTML = response; // site-generated
  messagesDiv.appendChild(botDiv);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
    } catch (error) {
  typing.remove();
  const errDiv = document.createElement('div');
  errDiv.className = 'bot-msg';
  errDiv.textContent = 'Sorry, I am having trouble. Please try again.';
  messagesDiv.appendChild(errDiv);
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
        const isFullStock = message.toLowerCase().includes('stock info') || message.toLowerCase().includes('all stock');
        
        if (isFullStock) {
          return allStock;
        } else {
          const filtered = allStock.filter(item => 
            item.name && item.name.toLowerCase().includes(message.toLowerCase())
          );
          return filtered;
        }
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
    
    if (message.includes('stock info') || message.includes('all stock')) {
      if (!stockInfo || stockInfo.length === 0) {
        return '📦 <strong>Complete Stock Information:</strong><br>Database connection failed or no products in stock table.';
      }
      return '📦 <strong>Complete Stock Information:</strong>' + stockText;
    }
    
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
      return productInfo[foundProduct] + stockText;
    }
    
    if (message.includes('stock')) {
      return '📦 <strong>Stock Check:</strong><br>Ask me about specific products or say "stock info" for everything.' + stockText;
    }
    
    return '🌱 Hi! I can help with products, stock, pricing, and orders. Try asking about specific products or say "stock info" for everything!';
  }
});