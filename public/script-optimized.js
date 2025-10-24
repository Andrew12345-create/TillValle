const cartItemsContainer = document.getElementById('cart-items');
const cartTotalElem = document.getElementById('cart-total');

// Cart loaded from main script.js
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Product mapping constant - extracted to avoid duplication
const PRODUCT_MAPPING = {
  'Milk': 'milk', 'Eggs': 'eggs', 'Eggs (Kienyeji)': 'eggs-kienyeji',
  'Egg Crate (30 eggs)': 'egg-crate', 'Butter': 'butter', 'Chicken': 'chicken',
  'Ghee': 'ghee', 'Apples': 'apples', 'Raw Bananas': 'raw-bananas',
  'Bananas (ripe)': 'bananas-ripe', 'Soursop Fruit': 'soursop-fruit',
  'Blueberries': 'blueberries', 'Macadamia': 'macadamia', 'Dragonfruit': 'dragonfruit',
  'Mangoes': 'mangoes', 'Lemon': 'lemon', 'Pawpaw': 'pawpaw', 'Pixies': 'pixies',
  'Avocadoes': 'avocadoes', 'Yellow Passion': 'yellow-passion', 'Kiwi': 'kiwi',
  'Basil': 'basil', 'Coriander': 'coriander', 'Mint': 'mint', 'Parsley': 'parsley',
  'Soursop Leaves': 'soursop-leaves', 'Kales (Sukuma Wiki)': 'kales',
  'Lettuce': 'lettuce', 'Managu': 'managu', 'Terere': 'terere',
  'Salgaa': 'salgaa', 'Spinach': 'spinach'
};

// API URL helper
const getApiUrl = (endpoint) => {
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  return isLocal ? `http://localhost:3001/${endpoint}` : `/.netlify/functions/${endpoint}`;
};

function getUserFromLocalStorage() {
  const email = localStorage.getItem('email');
  return email ? { email } : null;
}

let user = getUserFromLocalStorage();

function saveCart() {
  localStorage.setItem('cart', JSON.stringify(cart));
}

function renderUserArea() {
  const userArea = document.getElementById('user-area');
  if (!userArea) return;
  user = getUserFromLocalStorage();
  if (user?.email) {
    const initial = user.email.charAt(0).toUpperCase();
    const adminLink = user.email === 'andrewmunamwangi@gmail.com' 
      ? `<a href="admin.html" class="nav-link">Admin</a>` : '';
    userArea.innerHTML = `
      <div class="user-dropdown-container">
        <span class="user-initial" onclick="toggleUserDropdown()" title="${user.email}">${initial}</span>
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

function toggleUserDropdown() {
  document.getElementById('user-dropdown')?.classList.toggle('show');
}

function logout() {
  localStorage.removeItem('email');
  localStorage.removeItem('user');
  user = null;
  renderUserArea();
  showCartToast('Logged out successfully');
  setTimeout(() => window.location.href = 'index.html', 2000);
}

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
  ['cart-count', 'logo-cart-count', 'floating-cart-count'].forEach(id => {
    const elem = document.getElementById(id);
    if (elem) elem.textContent = totalQuantity;
  });
  const floatingCartBtn = document.getElementById('floating-cart-btn');
  if (floatingCartBtn) floatingCartBtn.style.display = 'flex';
}

function showCartToast(message) {
  const cartToast = document.getElementById('cart-toast');
  if (!cartToast) return;
  cartToast.textContent = message;
  cartToast.classList.add('show');
  setTimeout(() => cartToast.classList.remove('show'), 2000);
}

function renderCart() {
  if (!cartItemsContainer) return;
  cartItemsContainer.innerHTML = '';
  let total = 0;

  cart.forEach((item, index) => {
    total += item.price * item.quantity;
    const li = document.createElement('li');
    li.className = 'cart-item';
    li.innerHTML = `
      <span>${item.name} - KES ${item.price}</span>
      <div class="cart-quantity-controls">
        <button class="decrease-qty">-</button>
        <input type="text" class="item-qty" value="${item.quantity}" readonly>
        <button class="increase-qty">+</button>
        <button class="remove-item" style="background:transparent;border:none;color:#ef4444;font-weight:bold;cursor:pointer">Remove</button>
      </div>
    `;

    // Event listeners
    li.querySelector('.decrease-qty').onclick = () => {
      if (item.quantity > 1) {
        item.quantity--;
        saveCart();
        renderCart();
        updateCartCount();
        showCartToast(`Decreased quantity of ${item.name}`);
      }
    };

    li.querySelector('.increase-qty').onclick = () => {
      item.quantity++;
      saveCart();
      renderCart();
      updateCartCount();
      showCartToast(`Increased quantity of ${item.name}`);
    };

    li.querySelector('.remove-item').onclick = () => {
      cart.splice(index, 1);
      saveCart();
      renderCart();
      updateCartCount();
      showCartToast(`Removed ${item.name} from cart`);
    };

    cartItemsContainer.appendChild(li);
  });

  if (cartTotalElem) {
    cartTotalElem.textContent = `Total: KSh ${total}`;
  }
}

// Modal setup
const modal = document.createElement('div');
modal.id = 'product-modal';
modal.className = 'product-modal';
modal.style.display = 'none';
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

const modalElements = {
  name: document.getElementById('modal-product-name'),
  description: document.getElementById('modal-product-description'),
  image: document.getElementById('modal-product-image'),
  price: document.getElementById('modal-product-price'),
  quantity: document.getElementById('modal-quantity'),
  addBtn: document.getElementById('add-to-cart-modal'),
  closeBtn: modal.querySelector('.close-modal'),
  decreaseBtn: document.getElementById('modal-decrease-qty'),
  increaseBtn: document.getElementById('modal-increase-qty')
};

let currentProduct = null;

window.openProductModal = function(name, description, imageSrc, price) {
  const stockStatus = JSON.parse(localStorage.getItem('productStock')) || {};
  const productId = PRODUCT_MAPPING[name];
  const stockQty = productId ? stockStatus[productId] : undefined;

  currentProduct = { name, price };
  modalElements.name.textContent = name;
  modalElements.description.textContent = description;
  modalElements.image.src = imageSrc;
  modalElements.image.alt = name;
  modalElements.price.textContent = `KES ${price}`;

  // Stock info
  let stockInfoElem = document.getElementById('modal-stock-info');
  if (!stockInfoElem) {
    stockInfoElem = document.createElement('p');
    stockInfoElem.id = 'modal-stock-info';
    stockInfoElem.style.fontWeight = 'bold';
    stockInfoElem.style.marginTop = '0.5rem';
    modalElements.price.parentNode.insertBefore(stockInfoElem, modalElements.quantity.parentNode);
  }
  
  if (stockQty === undefined) {
    stockInfoElem.textContent = 'Stock information not available';
    modalElements.addBtn.disabled = false;
  } else if (stockQty <= 0) {
    stockInfoElem.textContent = 'Out of stock';
    modalElements.addBtn.disabled = true;
  } else {
    stockInfoElem.textContent = `In stock: ${stockQty}`;
    modalElements.addBtn.disabled = false;
  }

  modalElements.quantity.value = 1;
  modal.style.display = 'block';
};

function closeProductModal() {
  modal.style.display = 'none';
}

// Modal event listeners
modalElements.closeBtn.addEventListener('click', closeProductModal);
window.addEventListener('click', (event) => {
  if (event.target === modal) closeProductModal();
});

modalElements.decreaseBtn.addEventListener('click', () => {
  let qty = parseInt(modalElements.quantity.value);
  if (qty > 1) modalElements.quantity.value = qty - 1;
});

modalElements.increaseBtn.addEventListener('click', () => {
  let qty = parseInt(modalElements.quantity.value);
  modalElements.quantity.value = qty + 1;
});

modalElements.addBtn.addEventListener('click', () => {
  if (!user?.email) {
    showCartToast("Please log in to add items to cart");
    setTimeout(() => window.location.href = 'login.html', 2000);
    closeProductModal();
    return;
  }
  const qty = parseInt(modalElements.quantity.value);
  if (currentProduct) {
    const existingItem = cart.find(item => item.name === currentProduct.name);
    if (existingItem) {
      existingItem.quantity += qty;
    } else {
      cart.push({ name: currentProduct.name, price: currentProduct.price, quantity: qty });
    }
    saveCart();
    renderCart();
    closeProductModal();
    showCartToast(`${currentProduct.name} added to cart`);
  }
});

// Add to cart fallback
window.addToCart = function(name, price) {
  if (!user?.email) {
    showCartToast("Please log in to add items to cart");
    setTimeout(() => window.location.href = 'login.html', 2000);
    return;
  }
  const stockStatus = JSON.parse(localStorage.getItem('productStock')) || {};
  const productId = PRODUCT_MAPPING[name];
  if (productId && stockStatus[productId] <= 0) {
    showCartToast('Sorry, this item is currently out of stock. We apologize for the inconvenience.');
    return;
  }
  const existingItem = cart.find(item => item.name === name);
  if (existingItem) {
    existingItem.quantity++;
  } else {
    cart.push({ name, price, quantity: 1 });
  }
  saveCart();
  renderCart();
  showCartToast(`${name} added to cart`);
};

// Stock management
async function fetchStock() {
  try {
    const response = await fetch(getApiUrl('stock'));
    if (!response.ok) throw new Error('Failed to fetch stock');
    const data = await response.json();
    const stockStatus = {};
    data.forEach(item => {
      stockStatus[item.product_id] = item.stock_quantity;
    });
    localStorage.setItem('productStock', JSON.stringify(stockStatus));
    updateProductOverlays(stockStatus);
    return data;
  } catch (error) {
    console.error('Error fetching stock:', error);
    const stockStatus = JSON.parse(localStorage.getItem('productStock')) || {};
    updateProductOverlays(stockStatus);
    return [];
  }
}

function updateProductOverlays(stockStatus) {
  document.querySelectorAll('.product').forEach(product => {
    const onclickAttr = product.getAttribute('onclick');
    if (onclickAttr) {
      const match = onclickAttr.match(/openProductModal\('([^']+)'/);
      if (match) {
        const productName = match[1];
        const productId = PRODUCT_MAPPING[productName];
        if (productId && stockStatus[productId] <= 0) {
          let overlay = product.querySelector('.out-of-stock-overlay');
          if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'out-of-stock-overlay';
            overlay.textContent = '😔 Sorry, Out of Stock';
            Object.assign(overlay.style, {
              position: 'absolute', top: '0', left: '0', width: '100%', height: '100%',
              backgroundColor: 'rgba(0, 0, 0, 0.7)', color: 'white', display: 'flex',
              alignItems: 'center', justifyContent: 'center', fontSize: '14px',
              fontWeight: 'bold', borderRadius: '8px', zIndex: '10'
            });
            product.style.position = 'relative';
            product.appendChild(overlay);
          }
        } else {
          product.querySelector('.out-of-stock-overlay')?.remove();
        }
      }
    }
  });
}

// Admin functions
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

window.populateAdminStockTable = populateAdminStockTable;
window.fetchStock = fetchStock;

window.toggleStock = async function(productId, currentQuantity) {
  const stockToast = document.getElementById('stock-toast');
  const showStockToast = (message) => {
    if (!stockToast) return;
    stockToast.textContent = message;
    stockToast.classList.add('show');
    setTimeout(() => stockToast.classList.remove('show'), 3000);
  };

  const newQuantity = prompt(`Enter new quantity for ${productId}:`, currentQuantity);
  if (newQuantity === null) return;
  const quantity = parseInt(newQuantity);
  if (isNaN(quantity) || quantity < 0) {
    showStockToast('Invalid quantity. Please enter a non-negative number.');
    return;
  }

  showStockToast('WAITING...');
  try {
    const response = await fetch(getApiUrl('stock'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: productId, stock_quantity: quantity })
    });
    if (!response.ok) throw new Error('Failed to update stock');
    showStockToast(`${productId} quantity updated to ${quantity}`);
    const stockData = await fetchStock();
    populateAdminStockTable(stockData);
  } catch (error) {
    showStockToast('Error updating stock: ' + error.message);
  }
};

// Chatbot functionality
const chatbotElements = {
  btn: document.getElementById('floating-chatbot-btn'),
  sidebar: document.getElementById('chatbot-sidebar'),
  close: document.getElementById('chatbot-close'),
  input: document.getElementById('chatbot-input'),
  send: document.getElementById('chatbot-send'),
  messages: document.getElementById('chatbot-messages')
};

function showChatbotSidebar() {
  chatbotElements.sidebar?.classList.add('open');
}

function hideChatbotSidebar() {
  chatbotElements.sidebar?.classList.remove('open');
}

function appendMessage(message, isBot = false) {
  if (!chatbotElements.messages) return;
  const messageDiv = document.createElement('div');
  messageDiv.className = `chatbot-message ${isBot ? 'bot' : 'user'}`;
  messageDiv.textContent = message;
  chatbotElements.messages.appendChild(messageDiv);
  chatbotElements.messages.scrollTop = chatbotElements.messages.scrollHeight;
}

async function sendChatbotMessage() {
  const message = chatbotElements.input ? (chatbotElements.input.value || '').trim() : '';
  if (!message) return;

  appendMessage(message, false);
  chatbotElements.input.value = '';

  appendMessage('Thinking...', true);
  const loadingMessage = chatbotElements.messages.lastElementChild;

  try {
    const user = getUserFromLocalStorage();
    const isAdmin = user?.email === 'andrewmunamwangi@gmail.com';
    const response = await fetch(getApiUrl('chatbot'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, isAdmin })
    });

    if (!response.ok) throw new Error('Failed to get response');
    const data = await response.json();
    loadingMessage?.remove();
    appendMessage(data.message, true);
  } catch (error) {
    console.error('Chatbot error:', error);
    loadingMessage?.remove();
    appendMessage('Sorry, I encountered an error. Please try again.', true);
  }
}

// Event listeners
chatbotElements.btn?.addEventListener('click', showChatbotSidebar);
chatbotElements.close?.addEventListener('click', hideChatbotSidebar);
chatbotElements.send?.addEventListener('click', sendChatbotMessage);
chatbotElements.input?.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendChatbotMessage();
});

// Search functionality
function filterProducts(searchTerm) {
  const lowerSearchTerm = (searchTerm || '').toLowerCase();
  document.querySelectorAll('.product').forEach(product => {
    const h4 = product.querySelector('h4');
    const productName = h4 ? (h4.textContent || '').toLowerCase() : '';
    product.style.display = productName.includes(lowerSearchTerm) ? 'block' : 'none';
  });
}

function filterAdminStock(searchTerm) {
  const lowerSearchTerm = (searchTerm || '').toLowerCase();
  document.querySelectorAll('#stock-table tbody tr').forEach(row => {
    const cell = row.cells[1];
    const productName = cell ? (cell.textContent || '').toLowerCase() : '';
    row.style.display = productName.includes(lowerSearchTerm) ? '' : 'none';
  });
}

// Search event listeners
const searchBar = document.getElementById('search-bar');
const searchBtn = document.getElementById('search-btn');
if (searchBar && searchBtn) {
  searchBtn.addEventListener('click', () => filterProducts(searchBar.value));
  searchBar.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') filterProducts(searchBar.value);
  });
}

const adminSearchBar = document.getElementById('admin-search-bar');
const adminSearchBtn = document.getElementById('admin-search-btn');
if (adminSearchBar && adminSearchBtn) {
  adminSearchBtn.addEventListener('click', () => filterAdminStock(adminSearchBar.value));
  adminSearchBar.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') filterAdminStock(adminSearchBar.value);
  });
}

// Bulk stock update
document.getElementById('toggle-all-stock-btn')?.addEventListener('click', async () => {
  const stockToast = document.getElementById('stock-toast');
  const showStockToast = (message) => {
    if (!stockToast) return;
    stockToast.textContent = message;
    stockToast.classList.add('show');
    setTimeout(() => stockToast.classList.remove('show'), 3000);
  };

  const newQuantity = prompt('Enter new quantity for all products:');
  if (newQuantity === null) return;
  const quantity = parseInt(newQuantity);
  if (isNaN(quantity) || quantity < 0) {
    showStockToast('Invalid quantity. Please enter a non-negative number.');
    return;
  }

  showStockToast('Updating all stock quantities...');
  try {
    const stockData = await fetchStock();
    const updatePromises = stockData.map(item => 
      fetch(getApiUrl('stock'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: item.product_id, stock_quantity: quantity })
      })
    );

    await Promise.all(updatePromises);
    showStockToast(`All products quantity updated to ${quantity}`);
    const updatedStockData = await fetchStock();
    populateAdminStockTable(updatedStockData);
  } catch (error) {
    showStockToast('Error updating stock: ' + error.message);
  }
});

// Initialize
renderUserArea();
renderCart();
updateCartCount();

// Fetch stock on page load
document.addEventListener('DOMContentLoaded', async () => {
  await fetchStock();
});

// Floating cart button
document.getElementById('floating-cart-btn')?.addEventListener('click', () => {
  window.location.href = 'cart.html';
});