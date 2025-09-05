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

  let cart = JSON.parse(localStorage.getItem('cart') || '{}');
  if (cart[productName]) {
    cart[productName].quantity += 1;
  } else {
    cart[productName] = { price, quantity: 1 };
  }
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
  showToast(`${productName} added to cart`);

  // Add order to order history
  addToOrderHistory(productName, price);
}

// Add order to order history in localStorage
function addToOrderHistory(productName, price) {
  let orderHistory = JSON.parse(localStorage.getItem('orderHistory') || '[]');
  const newOrder = {
    id: orderHistory.length + 1,
    date: new Date().toISOString(),
    items: [{ name: productName, quantity: 1, price }],
    total: price
  };
  orderHistory.push(newOrder);
  localStorage.setItem('orderHistory', JSON.stringify(orderHistory));
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

// ====== API Calls ======
const loginUrl = '/login';
const signupUrl = '/signup';

// Example usage of the URLs
async function login(email, password) {
  const response = await fetch(loginUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  return response.json();
}

async function signup(email, password) {
  const response = await fetch(signupUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  return response.json();
}
