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

/* Wishlist functionality (client-side, localStorage) */
function getWishlist() {
  try {
    const raw = localStorage.getItem('tillvalle_wishlist');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveWishlist(list) {
  try {
    localStorage.setItem('tillvalle_wishlist', JSON.stringify(list));
  } catch (e) { /* ignore */ }
}

function updateWishlistCount() {
  const list = getWishlist();
  const count = list.length || 0;
  const el = document.getElementById('wishlist-count');
  if (el) el.textContent = count;
  const mobile = document.getElementById('mobile-wishlist-count');
  if (mobile) mobile.textContent = count;
}

function isInWishlist(name) {
  const list = getWishlist();
  return list.some(i => i.name === name);
}

function toggleWishlist(product) {
  if (!product || !product.name) return;
  const list = getWishlist();
  const exists = list.findIndex(i => i.name === product.name);
  if (exists === -1) {
    list.unshift({ name: product.name, image: product.image || '', price: product.price || '', ts: Date.now() });
  } else {
    list.splice(exists, 1);
  }
  saveWishlist(list);
  updateWishlistCount();
  // update UI buttons (heart fill)
  const buttons = document.querySelectorAll('.wishlist-btn');
  buttons.forEach(b => {
    const n = b.dataset.name || '';
    if (n === product.name) {
      b.classList.toggle('in-wishlist', exists === -1);
      b.textContent = exists === -1 ? '♥' : '♡';
    }
  });
}

function renderWishlistModal() {
  const container = document.getElementById('wishlist-contents');
  if (!container) return;
  const list = getWishlist();
  container.innerHTML = '';
  if (!list.length) {
    container.innerHTML = '<div style="padding:18px;color:#666">Your wishlist is empty. Browse products and add items you like.</div>';
    return;
  }
  list.forEach(item => {
    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.alignItems = 'center';
    row.style.gap = '12px';
    row.style.padding = '8px';
    row.style.borderBottom = '1px solid rgba(0,0,0,0.06)';
    row.innerHTML = `
      <img src="${item.image || 'logo.jpg'}" alt="${item.name}" style="width:64px;height:54px;object-fit:cover;border-radius:8px;background:#fff">
      <div style="flex:1">
        <div style="font-weight:700">${item.name}</div>
        <div style="color:#666;font-size:0.95rem">KES ${item.price}</div>
      </div>
      <div style="display:flex;gap:8px;align-items:center">
        <button class="wishlist-to-cart" data-name="${item.name}" style="background:linear-gradient(90deg,#2d6a4f,#40916c);color:white;border:none;padding:6px 10px;border-radius:8px;cursor:pointer">Add to cart</button>
        <button class="wishlist-remove" data-name="${item.name}" style="background:transparent;border:1px solid #ef4444;color:#ef4444;padding:6px 10px;border-radius:8px;cursor:pointer">Remove</button>
      </div>
    `;
    container.appendChild(row);
  });
}

function openWishlistModal() {
  const modal = document.getElementById('wishlist-modal');
  if (!modal) return;
  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
  renderWishlistModal();
}

function closeWishlistModal() {
  const modal = document.getElementById('wishlist-modal');
  if (!modal) return;
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden', 'true');
}

// Inject wishlist buttons into product cards (non-destructive)
function injectWishlistButtons() {
  try {
    const products = document.querySelectorAll('.product');
    products.forEach(prod => {
      if (prod.querySelector('.wishlist-btn')) return; // already injected
      const name = prod.dataset.name || prod.querySelector('h4')?.textContent?.trim() || '';
      const image = prod.dataset.image || prod.querySelector('img')?.src || '';
      const price = prod.dataset.price || prod.querySelector('.price')?.dataset?.price || '';
      const btn = document.createElement('button');
      btn.className = 'wishlist-btn';
      btn.type = 'button';
      btn.title = 'Add to wishlist';
      btn.dataset.name = name;
      btn.dataset.image = image;
      btn.dataset.price = price;
      btn.style.border = 'none';
      btn.style.background = 'transparent';
      btn.style.cursor = 'pointer';
      btn.style.fontSize = '18px';
      btn.style.marginLeft = '6px';
      btn.textContent = isInWishlist(name) ? '♥' : '♡';

      // append to product-controls if exists, otherwise append to product
      const controls = prod.querySelector('.product-controls');
      if (controls) {
        controls.appendChild(btn);
      } else {
        prod.appendChild(btn);
      }
    });
  } catch (e) {
    console.warn('injectWishlistButtons failed', e);
  }
}

// Delegated click handlers for wishlist buttons & modal actions
document.addEventListener('click', function(e) {
  const wb = e.target.closest && e.target.closest('.wishlist-btn');
  if (wb) {
    e.stopPropagation();
    const product = { name: wb.dataset.name, image: wb.dataset.image, price: wb.dataset.price };
    toggleWishlist(product);
    return;
  }

  const wlLink = e.target.closest && e.target.closest('#wishlist-link');
  if (wlLink) {
    e.preventDefault();
    openWishlistModal();
    return;
  }

  const wlClose = e.target.closest && e.target.closest('#wishlist-close');
  if (wlClose) {
    closeWishlistModal();
    return;
  }

  const wlClear = e.target.closest && e.target.closest('#wishlist-clear');
  if (wlClear) {
    saveWishlist([]);
    updateWishlistCount();
    renderWishlistModal();
    return;
  }

  const wlCheckout = e.target.closest && e.target.closest('#wishlist-checkout');
  if (wlCheckout) {
    // move wishlist items to cart
    const list = getWishlist();
    list.forEach(it => {
      const existingItem = cart.find(ci => ci.name === it.name);
      if (existingItem) existingItem.quantity += 1; else cart.push({ name: it.name, price: parseFloat(it.price) || 0, quantity: 1, image: it.image });
    });
    saveCart(); renderCart(); updateCartCount();
    saveWishlist([]); updateWishlistCount(); closeWishlistModal();
    return;
  }

  const wlRemove = e.target.closest && e.target.closest('.wishlist-remove');
  if (wlRemove) {
    const name = wlRemove.dataset.name;
    const list = getWishlist().filter(i => i.name !== name);
    saveWishlist(list); updateWishlistCount(); renderWishlistModal();
    return;
  }

  const wlToCart = e.target.closest && e.target.closest('.wishlist-to-cart');
  if (wlToCart) {
    const name = wlToCart.dataset.name;
    const list = getWishlist();
    const item = list.find(i => i.name === name);
    if (item) {
      const existingItem = cart.find(ci => ci.name === item.name);
      if (existingItem) existingItem.quantity += 1; else cart.push({ name: item.name, price: parseFloat(item.price) || 0, quantity: 1, image: item.image });
      saveCart(); renderCart(); updateCartCount();
      // remove from wishlist
      saveWishlist(list.filter(i => i.name !== name)); updateWishlistCount(); renderWishlistModal();
    }
    return;
  }
});

// Initialize wishlist UI shortly after DOM ready
document.addEventListener('DOMContentLoaded', function() {
  try { injectWishlistButtons(); updateWishlistCount(); } catch (e) { /* ignore */ }
});

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
  const qtyElement = document.getElementById(`qty-${name.replace(/[^a-zA-Z0-9]+/g, '-')}`);
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
    const stockUrl = isLocal ? 'http://localhost:3001/stock' : '/api/stock';
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
    // Use API URL for production, localhost for development
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const stockUrl = isLocal ? 'http://localhost:3001/stock' : '/api/stock';
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

// Maintenance mode handling
async function checkMaintenanceMode() {
  try {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const maintenanceUrl = isLocal ? 'http://localhost:3001/maintenance' : '/api/maintenance';
    const response = await fetch(maintenanceUrl);
    const data = await response.json();
    return data.active || false;
  } catch (error) {
    console.warn('Failed to check maintenance mode:', error);
    return false;
  }
}

function showMaintenanceOverlay() {
  // Remove existing overlay if present
  const existingOverlay = document.getElementById('maintenance-overlay');
  if (existingOverlay) existingOverlay.remove();

  const overlay = document.createElement('div');
  overlay.id = 'maintenance-overlay';
  overlay.innerHTML = `
    <div class="maintenance-content">
      <h2>🚧 Site Under Maintenance</h2>
      <p>We're currently performing maintenance to improve your experience. Please check back soon!</p>
      <p>For urgent inquiries, contact us at <a href="mailto:support@tillvalle.com">support@tillvalle.com</a></p>
    </div>
  `;
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    font-family: Arial, sans-serif;
    text-align: center;
  `;
  overlay.querySelector('.maintenance-content').style.cssText = `
    background: white;
    color: #333;
    padding: 2rem;
    border-radius: 8px;
    max-width: 500px;
    margin: 1rem;
  `;
  overlay.querySelector('h2').style.cssText = `
    margin-top: 0;
    color: #f1c40f;
  `;
  overlay.querySelector('a').style.cssText = `
    color: #3498db;
    text-decoration: none;
  `;
  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';
}

// Cookie Consent Banner Functionality
function initCookieConsent() {
  const banner = document.getElementById('cookie-consent-banner');
  const acceptBtn = document.getElementById('cookie-accept');
  const declineBtn = document.getElementById('cookie-decline');

  if (!banner || !acceptBtn || !declineBtn) return;

  // Check if user has already made a choice (from localStorage or cookie)
  const cookieChoice = localStorage.getItem('cookie-consent') || getCookie('cookie_consent');
  if (cookieChoice) {
    banner.classList.add('hidden');
    // Enable features if accepted
    if (cookieChoice === 'accepted') {
      enableCookieFeatures();
    }
    return;
  }

  // Show banner after a short delay
  setTimeout(() => {
    banner.classList.remove('hidden');
  }, 1000);

  // Handle accept button
  acceptBtn.addEventListener('click', () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setCookie('cookie_consent', 'accepted', 365); // Set cookie for 1 year
    banner.classList.add('hidden');
    showCartToast('Cookies accepted! Thank you for your consent.');
    enableCookieFeatures();
  });

  // Handle decline button
  declineBtn.addEventListener('click', () => {
    localStorage.setItem('cookie-consent', 'declined');
    setCookie('cookie_consent', 'declined', 365); // Set cookie for 1 year
    banner.classList.add('hidden');
    showCartToast('Cookie preferences saved. Some features may be limited.');
  });
}

// Helper function to set cookies
function setCookie(name, value, days) {
  const expires = new Date();
  expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
  document.cookie = name + '=' + value + ';expires=' + expires.toUTCString() + ';path=/';
}

// Helper function to get cookies
function getCookie(name) {
  const nameEQ = name + '=';
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

// Function to enable features when cookies are accepted
function enableCookieFeatures() {
  // Enable analytics (Google Analytics or similar)
  if (typeof gtag !== 'undefined') {
    gtag('consent', 'update', {
      'analytics_storage': 'granted'
    });
  }

  // Set user preference cookies
  setCookie('user_theme', 'default', 365);
  setCookie('language_preference', localStorage.getItem('selectedLanguage') || 'en', 365);

  // Enable chatbot personalization
  setCookie('chatbot_enabled', 'true', 365);
  setCookie('chatbot_interactions', '0', 365); // Track interactions

  // Set shopping preferences
  setCookie('shopping_currency', 'KES', 365);
  setCookie('last_visit', new Date().toISOString(), 365);

  // Enable marketing cookies (for retargeting, etc.)
  setCookie('marketing_consent', 'true', 365);

  // Set session tracking
  setCookie('session_id', generateSessionId(), 1); // Expires in 1 day

  // Enable feature flags
  setCookie('features_enabled', 'analytics,personalization,marketing', 365);

  console.log('Cookie-dependent features enabled: analytics, personalization, marketing, session tracking.');
}

// Helper function to generate a simple session ID
function generateSessionId() {
  return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
  // Check maintenance mode first
  const isMaintenance = await checkMaintenanceMode();
  if (isMaintenance) {
    showMaintenanceOverlay();
    return; // Stop further initialization if maintenance mode
  }

  // Initialize cookie consent banner
  initCookieConsent();

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
        </div>
        <div class="modal-action-buttons">
          <button id="modal-increase-qty">+</button>
          <button id="add-to-cart-modal" class="add-to-cart-modal">✓</button>
        </div>
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

// Enhance navbar visuals and active state across pages
function enhanceNavbar() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return false;
  const current = window.location.pathname.split('/').pop() || 'index.html';
  navbar.querySelectorAll('.nav-link').forEach(a => {
    try {
      const href = (a.getAttribute('href') || '').split('/').pop();
      if (href === current) a.classList.add('active'); else a.classList.remove('active');
    } catch (e) { /* ignore */ }
  });
  return true;
}

// Try to initialize navbar enhancements a few times (in case navbar is fetched dynamically)
(function tryEnhanceNavbar() {
  if (enhanceNavbar()) return;
  let attempts = 0;
  const id = setInterval(() => {
    attempts++;
    if (enhanceNavbar() || attempts > 8) clearInterval(id);
  }, 300);
})();

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

// Event listeners for global search (navbar) and shop filtering
const searchBar = document.getElementById('search-bar');
const searchBtn = document.getElementById('search-btn');
const globalSearchForm = document.getElementById('global-search-form');
function handleGlobalSearch(term) {
  const trimmed = (term || '').trim();
  if (!trimmed) return;
  const current = (window.location.pathname || '').split('/').pop() || 'index.html';
  // If we're already on shop, filter in-place. Otherwise navigate to shop with query param.
  if (current === 'shop.html' || current === 'shop') {
    try { filterProducts(trimmed); } catch (e) { console.warn('filterProducts error', e); }
  } else {
    window.location.href = `shop.html?q=${encodeURIComponent(trimmed)}`;
  }
}

if (globalSearchForm) {
  globalSearchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    handleGlobalSearch(searchBar ? searchBar.value : '');
  });
}

if (searchBtn && searchBar) {
  searchBtn.addEventListener('click', (e) => {
    e.preventDefault();
    handleGlobalSearch(searchBar.value);
  });
  searchBar.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleGlobalSearch(searchBar.value);
    }
  });
}

// On shop page load, apply ?q= query param to filter immediately (so external nav/search works)
function applyQueryFilter() {
  try {
    const params = new URLSearchParams(window.location.search || '');
    const q = params.get('q');
    if (q && (window.location.pathname || '').endsWith('shop.html')) {
      // populate navbar search input if present
      if (searchBar) searchBar.value = q;
      filterProducts(q);
      // smooth scroll to products section
      const productsSection = document.querySelector('.shop-section');
      if (productsSection) productsSection.scrollIntoView({ behavior: 'smooth' });
    }
  } catch (e) {
    /* ignore parse errors */
  }
}

// Run immediately in case script executes after DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', applyQueryFilter);
} else {
  applyQueryFilter();
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
        const stockUrl = isLocal ? 'http://localhost:3001/stock' : '/api/stock';
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
    const chatbotUrl = isLocal ? 'http://localhost:3001/chatbot' : '/api/chatbot';
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

// Normalize inline product onclicks into data-attributes (non-destructive cleanup)
function normalizeProductInlineHandlers() {
  try {
    const products = document.querySelectorAll('.product[onclick]');
    products.forEach(product => {
      const onclick = product.getAttribute('onclick');
      if (!onclick) return;
      const match = onclick.match(/openProductModal\('([^']+)'\s*,\s*'([^']*)'\s*,\s*'([^']*)'\s*,\s*([0-9.]+)\)/);
      if (match) {
        const [, name, description, image, price] = match;
        product.dataset.name = name;
        product.dataset.description = description;
        product.dataset.image = image;
        product.dataset.price = price;
        product.removeAttribute('onclick');
      }

      // Normalize product control buttons
      const controlBtns = product.querySelectorAll('.product-controls .product-btn[onclick]');
      controlBtns.forEach(btn => {
        const cb = btn.getAttribute('onclick') || '';
        const addMatch = cb.match(/addToCart\('([^']+)'\s*,\s*([0-9.]+)\s*,\s*'([^']*)'\)/);
        const remMatch = cb.match(/removeFromCart\('([^']+)'\)/);
        if (addMatch) {
          btn.dataset.action = 'add';
          btn.dataset.name = addMatch[1];
          btn.dataset.price = addMatch[2];
          btn.dataset.image = addMatch[3] || '';
          btn.removeAttribute('onclick');
        } else if (remMatch) {
          btn.dataset.action = 'remove';
          btn.dataset.name = remMatch[1];
          btn.removeAttribute('onclick');
        }
      });
    });
  } catch (e) {
    console.warn('normalizeProductInlineHandlers error', e);
  }
}

// Delegated handlers for product cards and product controls in shop.html
document.addEventListener('click', (e) => {
  const productEl = e.target.closest && e.target.closest('.product');
  if (!productEl) return;

  // if click came from a product control button, handle add/remove
  const btn = e.target.closest && e.target.closest('.product-btn');
  if (btn) {
    e.stopPropagation();

    // Prefer data-action attributes normalized earlier
    const actionAttr = btn.dataset && btn.dataset.action;
    if (actionAttr === 'add') {
      const name = btn.dataset.name || productEl.dataset.name || productEl.querySelector('h4')?.textContent?.trim();
      const price = parseFloat(btn.dataset.price || productEl.dataset.price || productEl.querySelector('.price')?.dataset?.price || '0');
      const img = btn.dataset.image || productEl.dataset.image || productEl.querySelector('img')?.src || '';
      if (name) window.addToCart && window.addToCart(name, price, img);
      return;
    }
    if (actionAttr === 'remove') {
      const name = btn.dataset.name || productEl.dataset.name || productEl.querySelector('h4')?.textContent?.trim();
      if (name) window.removeFromCart && window.removeFromCart(name);
      return;
    }

    // Fallback to text content (+ / -)
    const action = (btn.textContent || '').trim();
    const nameEl = productEl.querySelector('h4');
    const name = nameEl ? nameEl.textContent.trim() : null;
    const price = parseFloat(productEl.querySelector('.price')?.dataset?.price || '0');
    const img = productEl.querySelector('img')?.src || '';
    if (!name) return;
    if (action === '+' || action === '＋') {
      window.addToCart && window.addToCart(name, price, img);
    } else if (action === '-' || action === '−' || action === '−') {
      window.removeFromCart && window.removeFromCart(name);
    }
    return;
  }

  // Product card click: prefer normalized data-* values, then onclick parsing, then DOM fallback
  const name = productEl.dataset.name || (productEl.getAttribute && (function(){
    const onclickAttr = productEl.getAttribute('onclick');
    if (onclickAttr) {
      const match = onclickAttr.match(/openProductModal\('([^']+)'\s*,\s*'([^']*)'\s*,\s*'([^']*)'\s*,\s*([0-9.]+)\)/);
      if (match) return match[1];
    }
    return null;
  })()) || productEl.querySelector('h4')?.textContent?.trim();

  const description = productEl.dataset.description || '';
  const image = productEl.dataset.image || productEl.querySelector('img')?.src || '';
  const price = parseFloat(productEl.dataset.price || productEl.querySelector('.price')?.dataset?.price || '0');

  if (name) openProductModal && openProductModal(name, description, image, price);
});


