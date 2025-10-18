document.addEventListener('DOMContentLoaded', function() {
  // Create MAX CSS styles
  const style = document.createElement('style');
  style.textContent = `
    @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
    @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(45, 106, 79, 0.7); } 70% { box-shadow: 0 0 0 10px rgba(45, 106, 79, 0); } 100% { box-shadow: 0 0 0 0 rgba(45, 106, 79, 0); } }
    @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    .max-chat-btn { position: fixed !important; bottom: 30px !important; right: 30px !important; width: 70px !important; height: 70px !important; background: linear-gradient(135deg, #2d6a4f, #1e4a36) !important; border-radius: 50% !important; display: flex !important; align-items: center !important; justify-content: center !important; cursor: pointer !important; z-index: 10000 !important; color: white !important; font-size: 28px !important; box-shadow: 0 8px 25px rgba(45, 106, 79, 0.4) !important; animation: float 3s ease-in-out infinite, pulse 2s infinite !important; transition: all 0.3s ease !important; border: 3px solid rgba(255,255,255,0.2) !important; }
    .max-chat-btn:hover { transform: scale(1.1) translateY(-5px) !important; box-shadow: 0 15px 35px rgba(45, 106, 79, 0.6) !important; }
    .max-chat-panel { position: fixed !important; top: 0 !important; right: -450px !important; width: 420px !important; height: 100vh !important; background: linear-gradient(180deg, #ffffff 0%, #f8fffe 100%) !important; z-index: 9999 !important; transition: right 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important; box-shadow: -10px 0 30px rgba(0,0,0,0.15) !important; border-left: 1px solid rgba(45, 106, 79, 0.1) !important; }
    .max-chat-panel.open { right: 0 !important; animation: slideIn 0.4s ease !important; }
    .max-chat-header { background: linear-gradient(135deg, #2d6a4f, #1e4a36) !important; color: white !important; padding: 25px !important; display: flex !important; justify-content: space-between !important; align-items: center !important; box-shadow: 0 2px 10px rgba(0,0,0,0.1) !important; }
    .max-chat-header h3 { margin: 0 !important; font-size: 20px !important; font-weight: 600 !important; }
    .max-chat-close { background: rgba(255,255,255,0.2) !important; border: none !important; color: white !important; font-size: 24px !important; cursor: pointer !important; width: 35px !important; height: 35px !important; border-radius: 50% !important; display: flex !important; align-items: center !important; justify-content: center !important; transition: all 0.3s ease !important; }
    .max-chat-close:hover { background: rgba(255,255,255,0.3) !important; transform: rotate(90deg) !important; }
    .max-chat-messages { flex: 1 !important; overflow-y: auto !important; padding: 20px !important; background: linear-gradient(180deg, #ffffff 0%, #f8fffe 100%) !important; height: calc(100vh - 160px) !important; display: flex !important; flex-direction: column !important; }
    .max-chat-input-area { padding: 20px !important; background: white !important; border-top: 1px solid rgba(45, 106, 79, 0.1) !important; box-shadow: 0 -2px 10px rgba(0,0,0,0.05) !important; position: relative !important; }
    .max-chat-input { width: 100% !important; padding: 15px !important; border: 2px solid rgba(45, 106, 79, 0.2) !important; border-radius: 25px !important; outline: none !important; font-size: 14px !important; transition: all 0.3s ease !important; background: rgba(248, 255, 254, 0.5) !important; }
    .max-chat-input:focus { border-color: #2d6a4f !important; box-shadow: 0 0 0 3px rgba(45, 106, 79, 0.1) !important; }
    .max-chat-send { position: absolute !important; right: 25px !important; top: 50% !important; transform: translateY(-50%) !important; background: linear-gradient(135deg, #2d6a4f, #1e4a36) !important; color: white !important; border: none !important; width: 45px !important; height: 45px !important; border-radius: 50% !important; cursor: pointer !important; display: flex !important; align-items: center !important; justify-content: center !important; font-size: 16px !important; transition: all 0.3s ease !important; box-shadow: 0 2px 10px rgba(45, 106, 79, 0.3) !important; }
    .max-chat-send:hover { transform: translateY(-50%) scale(1.1) !important; box-shadow: 0 4px 15px rgba(45, 106, 79, 0.5) !important; }
    .max-user-msg { text-align: right !important; margin: 15px 0 !important; animation: fadeIn 0.3s ease !important; }
    .max-user-msg span { background: linear-gradient(135deg, #2d6a4f, #1e4a36) !important; color: white !important; padding: 12px 18px !important; border-radius: 20px 20px 5px 20px !important; display: inline-block !important; max-width: 80% !important; box-shadow: 0 2px 10px rgba(45, 106, 79, 0.2) !important; }
    .max-bot-msg { margin: 15px 0 !important; animation: fadeIn 0.3s ease !important; }
    .max-bot-msg span { background: linear-gradient(135deg, #e8f5e8, #f0f9f0) !important; color: #2d6a4f !important; padding: 12px 18px !important; border-radius: 20px 20px 20px 5px !important; display: inline-block !important; max-width: 80% !important; border-left: 4px solid #2d6a4f !important; box-shadow: 0 2px 10px rgba(45, 106, 79, 0.1) !important; }
    .max-typing { display: flex !important; align-items: center !important; gap: 5px !important; color: #666 !important; font-style: italic !important; margin: 10px 0 !important; }
    .max-typing::after { content: '' !important; width: 8px !important; height: 8px !important; border-radius: 50% !important; background: #2d6a4f !important; animation: pulse 1.5s infinite !important; }
  `;
  document.head.appendChild(style);
  
  // Create chatbot button
  const btn = document.createElement('div');
  btn.id = 'max-chatbot-btn';
  btn.className = 'max-chat-btn';
  btn.innerHTML = '💬';
  btn.onclick = openMaxChat;
  document.body.appendChild(btn);
  
  // Create chatbot panel
  const panel = document.createElement('div');
  panel.id = 'max-chat-panel';
  panel.className = 'max-chat-panel';
  panel.innerHTML = `
    <div class="max-chat-header">
      <h3>🌱 TillValle Assistant</h3>
      <button class="max-chat-close" onclick="closeMaxChat()">&times;</button>
    </div>
    <div id="max-chat-messages" class="max-chat-messages">
      <div class="max-bot-msg">
        <span>👋 Hello! I'm your TillValle assistant. I can help you with products, delivery, and orders. How can I assist you today?</span>
      </div>
    </div>
    <div class="max-chat-input-area">
      <input type="text" id="max-chat-input" class="max-chat-input" placeholder="Ask me anything about TillValle...">
      <button class="max-chat-send" onclick="sendMaxMessage()">➤</button>
    </div>
  `;
  document.body.appendChild(panel);
  
  // Add event listeners
  document.getElementById('max-chat-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') sendMaxMessage();
  });
  
  // Global functions
  window.openMaxChat = function() {
    document.getElementById('max-chat-panel').classList.add('open');
    document.getElementById('max-chatbot-btn').style.display = 'none';
    document.getElementById('max-chat-input').focus();
  };
  
  window.closeMaxChat = function() {
    document.getElementById('max-chat-panel').classList.remove('open');
    setTimeout(function() {
      document.getElementById('max-chatbot-btn').style.display = 'flex';
    }, 200);
  };
  
  window.addMaxTypingIndicator = function() {
    var messages = document.getElementById('max-chat-messages');
    var typing = document.createElement('div');
    typing.className = 'max-typing';
    typing.id = 'max-typing-indicator';
    typing.innerHTML = 'TillValle is typing';
    messages.appendChild(typing);
    messages.scrollTop = messages.scrollHeight;
  };
  
  window.removeMaxTypingIndicator = function() {
    var typing = document.getElementById('max-typing-indicator');
    if (typing) typing.remove();
  };
  
  window.sendMaxMessage = async function() {
    var input = document.getElementById('max-chat-input');
    var messages = document.getElementById('max-chat-messages');
    var message = input.value.trim();
    
    if (!message) return;
    
    var userDiv = document.createElement('div');
    userDiv.className = 'max-user-msg';
    userDiv.innerHTML = '<span>' + message + '</span>';
    messages.appendChild(userDiv);
    
    input.value = '';
    messages.scrollTop = messages.scrollHeight;
    
    addMaxTypingIndicator();
    
    try {
      var isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      var apiUrl = isLocal ? 'http://localhost:8888/.netlify/functions/chatbot' : '/.netlify/functions/chatbot';
      
      var response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message })
      });
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
      var data = await response.json();
      
      setTimeout(function() {
        removeMaxTypingIndicator();
        var botDiv = document.createElement('div');
        botDiv.className = 'max-bot-msg';
        botDiv.innerHTML = '<span>' + data.message + '</span>';
        messages.appendChild(botDiv);
        messages.scrollTop = messages.scrollHeight;
      }, 1000);
      
    } catch (error) {
      setTimeout(function() {
        removeMaxTypingIndicator();
        var errorDiv = document.createElement('div');
        errorDiv.className = 'max-bot-msg';
        errorDiv.innerHTML = '<span>😔 Sorry, I am having trouble connecting. Please try again or contact us at support@tillvalle.com</span>';
        messages.appendChild(errorDiv);
        messages.scrollTop = messages.scrollHeight;
      }, 1000);
    }
  };
});