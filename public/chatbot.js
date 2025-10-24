// Chatbot functionality for TillValle
document.addEventListener('DOMContentLoaded', function() {
  // Chatbot functions
  const floatingChatbotBtn = document.getElementById('floating-chatbot-btn');
  const chatbotSidebar = document.getElementById('chatbot-sidebar');
  const chatbotClose = document.getElementById('chatbot-close');
  const chatbotSend = document.getElementById('chatbot-send');
  const chatbotInput = document.getElementById('chatbot-input');

  if (floatingChatbotBtn) {
    floatingChatbotBtn.addEventListener('click', () => {
      if (chatbotSidebar) chatbotSidebar.classList.add('open');
      floatingChatbotBtn.style.display = 'none';
    });
  }
  if (chatbotClose) {
    chatbotClose.addEventListener('click', () => {
      if (chatbotSidebar) chatbotSidebar.classList.remove('open');
      if (floatingChatbotBtn) floatingChatbotBtn.style.display = 'flex';
    });
  }
  if (chatbotSend) {
    chatbotSend.addEventListener('click', sendMessage);
  }
  if (chatbotInput) {
    chatbotInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendMessage();
    });
  }

  async function sendMessage() {
    if (!chatbotInput) return;
    const message = (chatbotInput.value || '').trim();
    if (!message) return;

    const messagesDiv = document.getElementById('chatbot-messages');
    if (!messagesDiv) return;
  // Append user message safely
  const userDiv = document.createElement('div');
  userDiv.className = 'chatbot-message user';
  userDiv.textContent = message;
  messagesDiv.appendChild(userDiv);
  chatbotInput.value = '';
  const loadingDiv = document.createElement('div');
  loadingDiv.className = 'chatbot-message bot';
  loadingDiv.textContent = 'Thinking...';
  messagesDiv.appendChild(loadingDiv);
  const loadingMessage = loadingDiv;
  messagesDiv.scrollTop = messagesDiv.scrollHeight;

    try {
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const chatbotUrl = isLocal ? 'http://localhost:3001/chatbot' : '/.netlify/functions/chatbot';
      const response = await fetch(chatbotUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });
      const data = await response.json();
  if (loadingMessage) loadingMessage.remove();
  const botDiv = document.createElement('div');
  botDiv.className = 'chatbot-message bot';
  // Treat server responses as text to avoid HTML injection
  botDiv.textContent = data.message;
  messagesDiv.appendChild(botDiv);
    } catch (error) {
      if (loadingMessage) loadingMessage.remove();
      const currentLang = localStorage.getItem('selectedLanguage') || 'en';
      const lowerMessage = message.toLowerCase();
      const offlineResponses = {
        en: {
          human: "I'll connect you with our live chat agent Angela Wanjiru at angelawanjiru@gmail.com.",
          default: "Hello! I'm TillieBot from TillValle! 🌱 I can help you with product information, stock levels, and delivery details. What would you like to know?"
        },
        sw: {
          human: "Nitakuunganisha na wakala wetu Angela Wanjiru kwa angelawanjiru@gmail.com.",
          default: "Hujambo! Mimi ni TillieBot kutoka TillValle! 🌱 Ninaweza kukusaidia na habari za bidhaa na uongozaji. Unahitaji nini?"
        },
        fr: {
          human: "Je vais vous connecter avec notre agent Angela Wanjiru à angelawanjiru@gmail.com.",
          default: "Bonjour! Je suis TillieBot de TillValle! 🌱 Je peux vous aider avec les informations produits et la livraison. Que voulez-vous savoir?"
        }
      };
      const responses = offlineResponses[currentLang] || offlineResponses.en;
      if (lowerMessage.includes('human') || lowerMessage.includes('agent') || lowerMessage.includes('live')) {
        const botDiv = document.createElement('div');
        botDiv.className = 'chatbot-message bot';
        botDiv.textContent = responses.human;
        messagesDiv.appendChild(botDiv);
      } else {
        const botDiv2 = document.createElement('div');
        botDiv2.className = 'chatbot-message bot';
        botDiv2.textContent = responses.default;
        messagesDiv.appendChild(botDiv2);
      }
    }
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }
});
