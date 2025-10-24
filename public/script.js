// Define modal function globally at the top
let modal = null;
let currentProduct = null;

window.openProductModal = function(name, description, imageSrc, price) {
  if (!modal) {
    setTimeout(() => openProductModal(name, description, imageSrc, price), 100);
    return;
  }
  
  const modalName = document.getElementById('modal-product-name');
  const modalDescription = document.getElementById('modal-product-description');
  const modalImage = document.getElementById('modal-product-image');
  const modalPrice = document.getElementById('modal-product-price');
  const quantityInput = document.getElementById('modal-quantity');
  
  currentProduct = { name, price };
  if (modalName) modalName.textContent = name;
  if (modalDescription) modalDescription.textContent = description;
  if (modalImage) {
    modalImage.src = imageSrc;
    modalImage.alt = name;
  }
  if (modalPrice) modalPrice.textContent = `KES ${price}`;
  if (quantityInput) quantityInput.value = 1;
  if (modal && modal.classList) modal.classList.add('show');
};

const cartItemsContainer = document.getElementById('cart-items');
const cartTotalElem = document.getElementById('cart-total');

// Cart loaded from main script.js
let cart = JSON.parse(localStorage.getItem('cart')) || [];

function getUserFromLocalStorage() {
  // Set default language to English if not set
  if (!localStorage.getItem('selectedLanguage')) {
    localStorage.setItem('selectedLanguage', 'en');
  }
  
  const email = localStorage.getItem('email');
  if (email) {
    return { email };
  }
  return null;
}

let user = getUserFromLocalStorage();

function saveCart() {
  localStorage.setItem('cart', JSON.stringify(cart));
}

function saveUser() {
  localStorage.setItem('user', JSON.stringify(user));
}

function renderUserArea() {
  const userArea = document.getElementById('user-area');
  if (!userArea) {
    // Try again after a short delay if user-area not found
    setTimeout(renderUserArea, 100);
    return;
  }
  
  const userEmail = localStorage.getItem('email');
  if (userEmail) {
    const initial = userEmail.charAt(0).toUpperCase();
    const profilePicture = localStorage.getItem(`profilePicture_${userEmail}`);
    const userDisplay = profilePicture ? 
  `<img src="${profilePicture}" alt="Profile" class="user-avatar">` : 
      initial;
    let adminLink = '';
    if (userEmail === 'andrewmunamwangi@gmail.com') {
      adminLink = `<a href="admin.html" class="nav-link">Admin</a>`;
    }
    userArea.innerHTML = `
      <div class="user-dropdown-container">
        <span class="user-initial" onclick="toggleUserDropdown()" title="${userEmail}">${userDisplay}</span>
        <div class="user-dropdown" id="user-dropdown">
          <a href="profile.html">Profile</a>
          <a href="#" class="logout-btn" onclick="logout()">Logout</a>
        </div>
      </div>
      ${adminLink}
    `;
  } else {
    userArea.innerHTML = `<a href="login.html" class="nav-link">Login</a>`;
  }
}

// Force render navbar immediately and on DOM load
function forceRenderNavbar() {
  renderUserArea();
  // Also try again after delays to ensure it renders
  setTimeout(renderUserArea, 50);
  setTimeout(renderUserArea, 200);
  setTimeout(renderUserArea, 500);
}

// Call immediately
forceRenderNavbar();

// Also call when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', forceRenderNavbar);
} else {
  forceRenderNavbar();
}

function toggleUserDropdown() {
  const dropdown = document.getElementById('user-dropdown');
  if (dropdown) {
    dropdown.classList.toggle('show');
  }
}

function logout() {
  localStorage.removeItem('email');
  localStorage.removeItem('user');
  user = null;
  renderUserArea();
  showCartToast('Logged out successfully');
  setTimeout(() => {
    window.location.href = 'index.html';
  }, 2000);
}

// Make functions globally available
window.toggleUserDropdown = toggleUserDropdown;
window.logout = logout;

// Close dropdown when clicking outside
document.addEventListener('click', (event) => {
  const dropdown = document.getElementById('user-dropdown');
  const container = document.querySelector('.user-dropdown-container');
  if (dropdown && container && !container.contains(event.target)) {
    dropdown.classList.remove('show');
  }
});

function updateCartCount() {
  const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartCountElem = document.getElementById('cart-count');
  if (cartCountElem) {
    cartCountElem.textContent = totalQuantity;
  }
  const logoCartCount = document.getElementById('logo-cart-count');
  if (logoCartCount) {
    logoCartCount.textContent = totalQuantity;
  }
  const floatingCartCount = document.getElementById('floating-cart-count');
  if (floatingCartCount) {
    floatingCartCount.textContent = totalQuantity;
  }
  const floatingCartBtn = document.getElementById('floating-cart-btn');
  if (floatingCartBtn) {
    floatingCartBtn.style.display = 'flex';
  }
}

function showCartToast(message, isError = false) {
  const cartToast = document.getElementById('cart-toast');
  if (!cartToast) return;
  
  cartToast.classList.remove('show', 'error');
  cartToast.innerHTML = `<span>${message}</span>`;
  
  if (isError) {
    cartToast.classList.add('error');
  }
  
  cartToast.classList.add('show');
  
  setTimeout(() => {
    cartToast.classList.remove('show');
  }, 3000);
}

function renderCart() {
  if (!cartItemsContainer) return;
  cartItemsContainer.innerHTML = '';
  let total = 0;

  cart.forEach((item, index) => {
    total += item.price * item.quantity;

    const li = document.createElement('li');
    li.className = 'cart-item';

    const itemSpan = document.createElement('span');
    itemSpan.textContent = `${item.name} - KES ${item.price}`;

    const controlsDiv = document.createElement('div');
    controlsDiv.className = 'cart-quantity-controls';

    const decreaseBtn = document.createElement('button');
    decreaseBtn.className = 'decrease-qty';
    decreaseBtn.textContent = '-';
    decreaseBtn.addEventListener('click', () => {
      if (item.quantity > 1) {
        item.quantity--;
        saveCart();
        renderCart();
        updateCartCount();
        showCartToast(`Decreased quantity of ${item.name}`);
      }
    });

    const qtyInput = document.createElement('input');
    qtyInput.type = 'text';
    qtyInput.className = 'item-qty';
    qtyInput.value = item.quantity;
    qtyInput.readOnly = true;

    const increaseBtn = document.createElement('button');
    increaseBtn.className = 'increase-qty';
    increaseBtn.textContent = '+';
    increaseBtn.addEventListener('click', () => {
      item.quantity++;
      saveCart();
      renderCart();
      updateCartCount();
      showCartToast(`Increased quantity of ${item.name}`);
    });

    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-item';
    removeBtn.textContent = 'Remove';
    removeBtn.style.background = 'transparent';
    removeBtn.style.border = 'none';
    removeBtn.style.color = '#ef4444';
    removeBtn.style.fontWeight = 'bold';
    removeBtn.style.cursor = 'pointer';
    removeBtn.addEventListener('click', () => {
      cart.splice(index, 1);
      saveCart();
      renderCart();
      updateCartCount();
      showCartToast(`Removed ${item.name} from cart`);
    });

    controlsDiv.appendChild(decreaseBtn);
    controlsDiv.appendChild(qtyInput);
    controlsDiv.appendChild(increaseBtn);
    controlsDiv.appendChild(removeBtn);

    li.appendChild(itemSpan);
    li.appendChild(controlsDiv);

    cartItemsContainer.appendChild(li);
  });

  if (cartTotalElem) {
    cartTotalElem.textContent = `Total: KSh ${total}`;
  }
}

// Modal elements will be referenced when modal is created

function closeProductModal() {
  if (!modal) return;
  try {
    modal.style.transform = 'scale(0.8)';
    modal.style.opacity = '0';
    setTimeout(() => {
      if (modal) {
        modal.classList.remove('show');
        modal.style.transform = 'scale(1)';
        modal.style.opacity = '1';
      }
    }, 300);
  } catch (err) {
    console.warn('closeProductModal error', err);
  }
}

// Delegated handlers for modal controls and close (works even if modal is created later)
document.addEventListener('click', (e) => {
  // close modal via close button
  if (e.target.closest && e.target.closest('.close-modal')) {
    closeProductModal();
    return;
  }

  // click outside modal to close
  const modalEl = document.getElementById('product-modal');
  if (modalEl && e.target === modalEl) {
    closeProductModal();
    return;
  }

  // Decrease quantity
  if (e.target && e.target.id === 'modal-decrease-qty') {
    const qtyInput = document.getElementById('modal-quantity');
    if (!qtyInput) return;
    let qty = parseInt(qtyInput.value) || 1;
    if (qty > 1) qtyInput.value = qty - 1;
    return;
  }

  // Increase quantity
  if (e.target && e.target.id === 'modal-increase-qty') {
    const qtyInput = document.getElementById('modal-quantity');
    if (!qtyInput) return;
    let qty = parseInt(qtyInput.value) || 0;
    qtyInput.value = qty + 1;
    return;
  }

  // Add to cart from modal
  if (e.target && e.target.id === 'add-to-cart-modal') {
    if (!user || !user.email) {
      showCartToast("Please log in to add items to cart", true);
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 2000);
      closeProductModal();
      return;
    }
    const qtyInput = document.getElementById('modal-quantity');
    const qty = qtyInput ? parseInt(qtyInput.value) || 1 : 1;
    if (currentProduct) {
      const existingItem = cart.find(item => item.name === currentProduct.name);
      if (existingItem) {
        existingItem.quantity += qty;
      } else {
        cart.push({ name: currentProduct.name, price: currentProduct.price, quantity: qty });
      }
      saveCart();
      renderCart();
      updateCartCount();
      closeProductModal();
      showCartToast(`${currentProduct.name} added to cart!`);
    }
    return;
  }
});

// Add product to cart from product cards without modal (fallback)
window.addToCart = function(name, price, imageSrc) {
  if (!user || !user.email) {
    showCartToast("Please log in to add items to cart", true);
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 2000);
    return;
  }
  const stockStatus = JSON.parse(localStorage.getItem('productStock')) || {};
  const productMapping = {
    'Fresh Milk': 'milk',
    'Farm Fresh Eggs': 'eggs',
    'Free-Range Chicken': 'chicken',
    'Pure Ghee': 'ghee'
  };
  const productId = productMapping[name];
  if (productId && stockStatus[productId] <= 0) {
    showCartToast('Sorry, this item is currently out of stock. We apologize for the inconvenience.', true);
    return;
  }
  const existingItem = cart.find(item => item.name === name);
  if (existingItem) {
    existingItem.quantity++;
  } else {
    cart.push({ name, price, quantity: 1, image: imageSrc });
  }
  saveCart();
  renderCart();
  updateCartCount();
  updateProductQuantityDisplay(name);
  showCartToast(`${name} added to cart!`);
};

// Remove product from cart from product cards
window.removeFromCart = function(name) {
  if (!user || !user.email) {
    showCartToast("Please log in to add items to cart", true);
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 2000);
    return;
  }
  const existingItem = cart.find(item => item.name === name);
  if (existingItem) {
    if (existingItem.quantity > 1) {
      existingItem.quantity--;
    } else {
      cart = cart.filter(item => item.name !== name);
    }
    saveCart();
    renderCart();
    updateCartCount();
    updateProductQuantityDisplay(name);
    showCartToast(`${name} quantity decreased!`);
  }
};

// Update product quantity display on cards
function updateProductQuantityDisplay(name) {
  const qtyElement = document.getElementById(`qty-${name.replace(/\s+/g, '-')}`);
  if (qtyElement) {
    const existingItem = cart.find(item => item.name === name);
    qtyElement.textContent = existingItem ? existingItem.quantity : 0;
  }
}

// Floating cart button click to open cart page
const floatingCartBtn = document.getElementById('floating-cart-btn');
if (floatingCartBtn) {
  floatingCartBtn.addEventListener('click', () => {
    window.location.href = 'cart.html';
  });
}

async function fetchStock() {
  try {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const stockUrl = isLocal ? 'http://localhost:3001/stock' : '/.netlify/functions/stock';
    const response = await fetch(stockUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const stockStatus = {};
    data.forEach(item => {
      stockStatus[item.product_id] = item.stock_quantity || (item.in_stock ? 100 : 0);
    });
    localStorage.setItem('productStock', JSON.stringify(stockStatus));
    updateProductOverlays(stockStatus);
    return data;
  } catch (error) {
    console.warn('Stock API unavailable:', error.message);
    const stockStatus = JSON.parse(localStorage.getItem('productStock')) || {};
    updateProductOverlays(stockStatus);
    return [];
  }
}

function updateProductOverlays(stockStatus) {
  const productMapping = {
    'Milk': 'milk',
    'Eggs': 'eggs',
    'Eggs (Kienyeji)': 'eggs-kienyeji',
    'Egg Crate (30 eggs)': 'egg-crate',
    'Butter': 'butter',
    'Chicken': 'chicken',
    'Ghee': 'ghee',
    'Apples': 'apples',
    'Raw Bananas': 'raw-bananas',
    'Bananas (ripe)': 'bananas-ripe',
    'Soursop Fruit': 'soursop-fruit',
    'Blueberries': 'blueberries',
    'Macadamia': 'macadamia',
    'Dragonfruit': 'dragonfruit',
    'Mangoes': 'mangoes',
    'Lemon': 'lemon',
    'Pawpaw': 'pawpaw',
    'Pixies': 'pixies',
    'Avocadoes': 'avocadoes',
    'Yellow Passion': 'yellow-passion',
    'Kiwi': 'kiwi',
    'Basil': 'basil',
    'Coriander': 'coriander',
    'Mint': 'mint',
    'Parsley': 'parsley',
    'Soursop Leaves': 'soursop-leaves',
    'Kales (Sukuma Wiki)': 'kales',
    'Lettuce': 'lettuce',
    'Managu': 'managu',
    'Terere': 'terere',
    'Salgaa': 'salgaa',
    'Spinach': 'spinach'
  };

  const products = document.querySelectorAll('.product');
  products.forEach(product => {
    const onclickAttr = product.getAttribute('onclick');
    if (onclickAttr) {
      const match = onclickAttr.match(/openProductModal\('([^']+)'/);
      if (match) {
        const productName = match[1];
        const productId = productMapping[productName];
        if (productId && stockStatus[productId] <= 0) {
          // Add out of stock overlay
          let overlay = product.querySelector('.out-of-stock-overlay');
          if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'out-of-stock-overlay';
            overlay.textContent = '😔 Sorry, Out of Stock';
            overlay.style.position = 'absolute';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '100%';
            overlay.style.height = '100%';
            overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
            overlay.style.color = 'white';
            overlay.style.display = 'flex';
            overlay.style.alignItems = 'center';
            overlay.style.justifyContent = 'center';
            overlay.style.fontSize = '14px';
            overlay.style.fontWeight = 'bold';
            overlay.style.borderRadius = '8px';
            overlay.style.zIndex = '10';
            product.style.position = 'relative';
            product.appendChild(overlay);
          }
        } else {
          // Remove overlay if exists
          const overlay = product.querySelector('.out-of-stock-overlay');
          if (overlay) {
            overlay.remove();
          }
        }
      }
    }
  });
}

// New function to populate admin stock table
function populateAdminStockTable(stockData) {
  const tbody = document.querySelector('#stock-table tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  stockData.forEach(item => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item.product_id}</td>
      <td>${item.product_name}</td>
      <td>${item.stock_quantity}</td>
      <td>
        <button onclick="toggleStock('${item.product_id}', ${item.stock_quantity})">
          Update Quantity
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// Expose populateAdminStockTable globally for admin.html
window.populateAdminStockTable = populateAdminStockTable;

// Expose fetchStock globally for admin.html
window.fetchStock = fetchStock;

window.toggleStock = async function(productId, currentQuantity) {
  const stockToast = document.getElementById('stock-toast');
  function showStockToast(message) {
    if (!stockToast) return;
    stockToast.textContent = message;
    stockToast.classList.add('show');
    setTimeout(() => {
      stockToast.classList.remove('show');
    }, 3000);
  }

  const newQuantity = prompt(`Enter new quantity for ${productId}:`, currentQuantity);
  if (newQuantity === null) return; // User cancelled
  const quantity = parseInt(newQuantity);
  if (isNaN(quantity) || quantity < 0) {
    showStockToast('Invalid quantity. Please enter a non-negative number.');
    return;
  }

  showStockToast('WAITING...');
  try {
    // Use Netlify function URL for production, localhost for development
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const stockUrl = isLocal ? 'http://localhost:3001/stock' : '/.netlify/functions/stock';
    const response = await fetch(stockUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: productId, stock_quantity: quantity })
    });
    if (!response.ok) throw new Error('Failed to update stock');
    showStockToast(`${productId} quantity updated to ${quantity}`);
    const stockData = await window.fetchStock();
    window.populateAdminStockTable(stockData);
  } catch (error) {
    showStockToast('Error updating stock: ' + error.message);
  }
};

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
  // Create modal
  modal = document.createElement('div');
  modal.id = 'product-modal';
  modal.className = 'product-modal';
  modal.innerHTML = `
    <div class="product-modal-content">
      <div class="product-modal-header">
        <h3 id="modal-product-name"></h3>
        <button class="close-modal" aria-label="Close modal">&times;</button>
      </div>
      <div class="product-modal-body">
        <img id="modal-product-image" src="" alt="" class="product-image" />
        <p id="modal-product-description"></p>
        <p id="modal-product-price"></p>
        <div class="quantity-controls">
          <button id="modal-decrease-qty">-</button>
          <input type="text" id="modal-quantity" value="1" readonly />
          <button id="modal-increase-qty">+</button>
        </div>
        <button id="add-to-cart-modal" class="add-to-cart-modal">Add to Cart</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  
  // Setup modal event listeners
  const closeModalBtn = modal.querySelector('.close-modal');
  closeModalBtn.addEventListener('click', closeProductModal);
  
  renderUserArea();
  renderCart();
  updateCartCount();
  await fetchStock();
});

// Also call renderUserArea immediately for pages that load script.js after DOM
renderUserArea();

// Robust navbar initialization - ensure it always renders
function ensureNavbarRenders() {
  const userArea = document.getElementById('user-area');
  if (userArea && userArea.innerHTML.trim() === '') {
    renderUserArea();
  }
}

// Check every 500ms for the first 5 seconds to ensure navbar renders
let navbarCheckCount = 0;
const navbarInterval = setInterval(() => {
  ensureNavbarRenders();
  navbarCheckCount++;
  if (navbarCheckCount >= 10) { // Stop after 5 seconds (10 * 500ms)
    clearInterval(navbarInterval);
  }
}, 500);

// Also check when window loads
window.addEventListener('load', () => {
  setTimeout(ensureNavbarRenders, 100);
});

// Search functionality for shop.html
function filterProducts(searchTerm) {
  const products = document.querySelectorAll('.product');
  const lowerSearchTerm = (searchTerm || '').toLowerCase();
  products.forEach(product => {
    const h4 = product.querySelector('h4');
    const productName = h4 ? (h4.textContent || '').toLowerCase() : '';
    product.style.display = productName.includes(lowerSearchTerm) ? 'block' : 'none';
  });
}

// Search functionality for admin.html
function filterAdminStock(searchTerm) {
  const rows = document.querySelectorAll('#stock-table tbody tr');
  const lowerSearchTerm = (searchTerm || '').toLowerCase();
  rows.forEach(row => {
    const cell = row.cells[1];
    const productName = cell ? (cell.textContent || '').toLowerCase() : '';
    row.style.display = productName.includes(lowerSearchTerm) ? '' : 'none';
  });
}

// Event listeners for search on shop.html
const searchBar = document.getElementById('search-bar');
const searchBtn = document.getElementById('search-btn');
if (searchBar && searchBtn) {
  searchBtn.addEventListener('click', () => {
    filterProducts(searchBar.value);
  });
  searchBar.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      filterProducts(searchBar.value);
    }
  });
}

// Event listeners for search on admin.html
const adminSearchBar = document.getElementById('admin-search-bar');
const adminSearchBtn = document.getElementById('admin-search-btn');
if (adminSearchBar && adminSearchBtn) {
  adminSearchBtn.addEventListener('click', () => {
    filterAdminStock(adminSearchBar.value);
  });
  adminSearchBar.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      filterAdminStock(adminSearchBar.value);
    }
  });
}

// Event listener for "Update All Stock Quantities" button
const toggleAllStockBtn = document.getElementById('toggle-all-stock-btn');
if (toggleAllStockBtn) {
  toggleAllStockBtn.addEventListener('click', async () => {
    const stockToast = document.getElementById('stock-toast');
    function showStockToast(message) {
      if (!stockToast) return;
      stockToast.textContent = message;
      stockToast.classList.add('show');
      setTimeout(() => {
        stockToast.classList.remove('show');
      }, 3000);
    }

    const newQuantity = prompt('Enter new quantity for all products:');
    if (newQuantity === null) return; // User cancelled
    const quantity = parseInt(newQuantity);
    if (isNaN(quantity) || quantity < 0) {
      showStockToast('Invalid quantity. Please enter a non-negative number.');
      return;
    }

    showStockToast('Updating all stock quantities...');
    try {
      const stockData = await window.fetchStock();

      const updatePromises = stockData.map(item => {
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const stockUrl = isLocal ? 'http://localhost:3001/stock' : '/.netlify/functions/stock';
        return fetch(stockUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ product_id: item.product_id, stock_quantity: quantity })
        });
      });

      await Promise.all(updatePromises);
      showStockToast(`All products quantity updated to ${quantity}`);
      const updatedStockData = await window.fetchStock();
      window.populateAdminStockTable(updatedStockData);
    } catch (error) {
      showStockToast('Error updating stock: ' + error.message);
    }
  });
}

// Chatbot functionality
const floatingChatbotBtn = document.getElementById('floating-chatbot-btn');
const chatbotSidebar = document.getElementById('chatbot-sidebar');
const chatbotClose = document.getElementById('chatbot-close');
const chatbotInput = document.getElementById('chatbot-input');
const chatbotSend = document.getElementById('chatbot-send');
const chatbotMessages = document.getElementById('chatbot-messages');

function showChatbotSidebar() {
  if (chatbotSidebar) {
    chatbotSidebar.classList.add('open');
  }
  // On mobile, hide the floating button when chatbot is open
  if (floatingChatbotBtn && window.innerWidth <= 480) {
    floatingChatbotBtn.style.display = 'none';
  }
}

function hideChatbotSidebar() {
  if (chatbotSidebar) {
    chatbotSidebar.classList.remove('open');
  }
  if (floatingChatbotBtn) {
    floatingChatbotBtn.style.display = 'flex';
  }
}

function appendMessage(message, isBot = false) {
  if (!chatbotMessages) return;
  const messageDiv = document.createElement('div');
  messageDiv.className = `chatbot-message ${isBot ? 'bot' : 'user'}`;
  messageDiv.textContent = message;
  chatbotMessages.appendChild(messageDiv);
  chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
}

async function sendChatbotMessage() {
  if (!chatbotInput || !chatbotMessages) return;
  const message = (chatbotInput.value || '').trim();
  if (!message) return;

  appendMessage(message, false);
  chatbotInput.value = '';

  // Show loading
  appendMessage('Thinking...', true);
  const loadingMessage = chatbotMessages.lastElementChild;

  try {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const chatbotUrl = isLocal ? 'http://localhost:3001/chatbot' : '/.netlify/functions/chatbot';
    const user = getUserFromLocalStorage();
    const isAdmin = user && user.email === 'andrewmunamwangi@gmail.com';
    const response = await fetch(chatbotUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, isAdmin })
    });

    if (!response.ok) throw new Error('Failed to get response');

    const data = await response.json();
    if (loadingMessage) loadingMessage.remove();
    appendMessage(data.message, true);
  } catch (error) {
    console.error('Chatbot error:', error);
    if (loadingMessage) loadingMessage.remove();
    
    // Local fallback responses
    const currentLang = localStorage.getItem('selectedLanguage') || 'en';
    const lowerMessage = message.toLowerCase();
    
    const offlineResponses = {
      en: {
        human: "I'll connect you with our live chat agent Angela Wanjiru at angelawanjiru@gmail.com.",
        stock: "I can help you check our product availability! What specific product are you looking for?",
        hello: "Hello! Welcome to TillValle! 🌱 I'm TillieBot, your farm-fresh assistant. How can I help you today?",
        default: "Hello! I'm TillieBot from TillValle! 🌱 I can help you with product information, stock levels, and delivery details. What would you like to know?"
      },
      sw: {
        human: "Nitakuunganisha na wakala wetu Angela Wanjiru kwa angelawanjiru@gmail.com.",
        stock: "Ninaweza kukusaidia kuangalia upatikanaji wa bidhaa zetu! Unatafuta bidhaa gani?",
        hello: "Hujambo! Karibu TillValle! 🌱 Mimi ni TillieBot, msaidizi wako wa mazao safi. Ninawezaje kukusaidia?",
        default: "Hujambo! Mimi ni TillieBot kutoka TillValle! 🌱 Ninaweza kukusaidia na habari za bidhaa na uongozaji. Unahitaji nini?"
      },
      fr: {
        human: "Je vais vous connecter avec notre agent Angela Wanjiru à angelawanjiru@gmail.com.",
        stock: "Je peux vous aider à vérifier la disponibilité de nos produits! Quel produit recherchez-vous?",
        hello: "Bonjour! Bienvenue chez TillValle! 🌱 Je suis TillieBot, votre assistant produits frais. Comment puis-je vous aider?",
        default: "Bonjour! Je suis TillieBot de TillValle! 🌱 Je peux vous aider avec les informations produits et la livraison. Que voulez-vous savoir?"
      }
    };
    
    const responses = offlineResponses[currentLang] || offlineResponses.en;
    let fallbackResponse = responses.default;
    
    if (lowerMessage.includes('human') || lowerMessage.includes('agent') || lowerMessage.includes('live')) {
      fallbackResponse = responses.human;
    } else if (lowerMessage.includes('stock') || lowerMessage.includes('available')) {
      fallbackResponse = responses.stock;
    } else if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hujambo') || lowerMessage.includes('bonjour')) {
      fallbackResponse = responses.hello;
    }
    
    appendMessage(fallbackResponse, true);
  }
}

if (floatingChatbotBtn) {
  floatingChatbotBtn.addEventListener('click', showChatbotSidebar);
}

if (chatbotClose) {
  chatbotClose.addEventListener('click', hideChatbotSidebar);
}

if (chatbotSend) {
  chatbotSend.addEventListener('click', sendChatbotMessage);
}

if (chatbotInput) {
  chatbotInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      sendChatbotMessage();
    }
  });
  
  // Prevent zoom on iOS
  chatbotInput.addEventListener('touchstart', () => {
    chatbotInput.style.fontSize = '16px';
  });
}

// Handle window resize for chatbot button visibility
window.addEventListener('resize', () => {
  if (chatbotSidebar && chatbotSidebar.classList.contains('open') && window.innerWidth <= 480) {
    if (floatingChatbotBtn) {
      floatingChatbotBtn.style.display = 'none';
    }
  } else if (floatingChatbotBtn && !chatbotSidebar.classList.contains('open')) {
    floatingChatbotBtn.style.display = 'flex';
  }
});


