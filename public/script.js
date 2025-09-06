// ====== Helper Functions ======

// Show toast notification
function showToast(message) {
  const toast = document.getElementById('cart-toast');
  if (!toast) return; // prevent errors if toast not on page
  toast.innerText = message;
  toast.style.display = 'block';
  toast.style.opacity = 1;
  toast.style.transition = 'opacity 0.3s ease';
  toast.style.position = 'fixed';
  toast.style.top = '20px';
  toast.style.right = '20px';
  toast.style.backgroundColor = '#f0c419';  // shade of yellow matching top right icon
  toast.style.color = '#000';
  toast.style.padding = '10px 20px';
  toast.style.borderRadius = '5px';
  toast.style.zIndex = 1000;
  setTimeout(() => {
    toast.style.opacity = 0;
    setTimeout(() => (toast.style.display = 'none'), 300);
  }, 2000);
}

// Check if user is logged in
function getUser() {
  const token = localStorage.getItem('token');
  const email = localStorage.getItem('email');
  return token && email ? { token, email } : null;
}

// Get initials from email
function getInitials(email) {
  if (!email) return '';
  const name = email.split('@')[0];
  return name
    .split(/[._-]/)
    .map(part => part[0].toUpperCase())
    .join('');
}

// Update navbar login area
function updateNavbar() {
  const userArea = document.getElementById('user-area');
  if (!userArea) return;
  const user = getUser();
  if (user) {
    userArea.innerHTML = `<a href="profile.html" class="nav-link user-initials">${getInitials(user.email)}</a>`;
  } else {
    userArea.innerHTML = `<a href="login.html" class="nav-link" id="login-link">Login</a>`;
  }
}

// ====== Cart Logic ======
function addToCart(productName, price) {
  const user = getUser();
  if (!user) {
    showToast('Please login first! Redirecting to login page...');
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 1500);
    return;
  }

  // Use user-specific cart key to avoid conflicts
  const cartKey = `cart_${user.email}`;
  let cart = JSON.parse(localStorage.getItem(cartKey) || '{}');
  if (cart[productName]) {
    cart[productName].quantity += 1;
  } else {
    cart[productName] = { price, quantity: 1 };
  }
  localStorage.setItem(cartKey, JSON.stringify(cart));
  updateCartCount();

  // Trigger a custom event to notify other parts of the app about cart update
  const event = new Event('cartUpdated');
  window.dispatchEvent(event);

  showToast(`${productName} added to cart`);

  // Add order to order history
  addToOrderHistory(productName, price);
}

// Update cart count to use user-specific cart key
function updateCartCount() {
  const user = getUser();
  if (!user) {
    const cartCountEl = document.getElementById('cart-count');
    if (cartCountEl) cartCountEl.innerText = '0';
    return;
  }
  const cartKey = `cart_${user.email}`;
  const cart = JSON.parse(localStorage.getItem(cartKey) || '{}');
  const count = Object.values(cart).reduce((sum, item) => sum + item.quantity, 0);
  const cartCountEl = document.getElementById('cart-count');
  if (cartCountEl) cartCountEl.innerText = count;
}

// Add order to order history in localStorage
function addToOrderHistory(productName, price) {
  const user = getUser();
  if (!user) return; // Should not happen since checked in addToCart
  const key = `orderHistory_${user.email}`;
  let orderHistory = JSON.parse(localStorage.getItem(key) || '[]');
  const newOrder = {
    id: orderHistory.length + 1,
    date: new Date().toISOString(),
    items: [{ name: productName, quantity: 1, price }],
    total: price
  };
  orderHistory.push(newOrder);
  localStorage.setItem(key, JSON.stringify(orderHistory));
}

function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem('cart') || '{}');
  const count = Object.values(cart).reduce((sum, item) => sum + item.quantity, 0);
  const cartCountEl = document.getElementById('cart-count');
  if (cartCountEl) cartCountEl.innerText = count;
}

// ====== Contact Form Test ======
function testContactForm() {
  // Removed emailjs call to fix ReferenceError
  console.log("testContactForm called - emailjs call removed to fix error");
}

// ====== Search Functionality ======
function searchProducts() {
  const input = document.getElementById("search-bar").value.toLowerCase();
  const products = document.querySelectorAll(".product");

  products.forEach(product => {
    const productName = product.querySelector("h4").textContent.toLowerCase();
    if (productName.includes(input)) {
      product.style.display = "block";
    } else {
      product.style.display = "none";
    }
  });
}

// ====== Init ======
document.addEventListener('DOMContentLoaded', () => {
  updateNavbar();
  updateCartCount();
  testContactForm(); // Call the test function

  // Add search event listener
  const searchBtn = document.getElementById('search-btn');
  if (searchBtn) {
    searchBtn.addEventListener('click', searchProducts);
  }
});

// Function to open product modal with image and details
function openProductModal(name, description, imageSrc, price) {
  // Create modal elements if not already present
  let modal = document.getElementById('product-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'product-modal';
    modal.className = 'product-modal';
    modal.innerHTML = `
      <div class="product-modal-content">
        <div class="product-modal-header">
          <h3 id="modal-product-name"></h3>
          <button class="close-modal" id="close-product-modal">&times;</button>
        </div>
        <div class="product-modal-body">
          <img id="modal-product-image" class="product-image" src="" alt="">
          <p id="modal-product-description" class="product-description"></p>
          <p id="modal-product-price" class="product-price-modal"></p>
          <button id="modal-add-to-cart" class="add-to-cart-modal">Add to Cart</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    // Close modal event
    document.getElementById('close-product-modal').addEventListener('click', () => {
      modal.style.display = 'none';
    });

    // Close modal on outside click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    });
  }

  // Set modal content
  document.getElementById('modal-product-name').textContent = name;
  const img = document.getElementById('modal-product-image');
  img.src = imageSrc;
  img.alt = name;
  document.getElementById('modal-product-description').textContent = description;
  document.getElementById('modal-product-price').textContent = `KES ${price} / unit`;

  // Set add to cart button action
  const addToCartBtn = document.getElementById('modal-add-to-cart');
  addToCartBtn.onclick = () => {
    addToCart(name, price);
    // Do not close modal on add to cart click to keep popup visible
    // modal.style.display = 'none';
  };

  // Show modal
  modal.style.display = 'block';
}

// ====== API Calls ======
function getLoginUrl() {
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  return isLocal ? '/login' : '/.netlify/functions/login';
}

function getSignupUrl() {
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  return isLocal ? '/signup' : '/.netlify/functions/signup';
}

// Example usage of the URLs
async function login(email, password) {
  const response = await fetch(getLoginUrl(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  return response.json();
}

async function signup(email, password) {
  const response = await fetch(getSignupUrl(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  return response.json();
}
