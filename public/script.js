// ====== Helper Functions ======

// Show toast notification
function showToast(message) {
  const toast = document.getElementById('cart-toast');
  if (!toast) return; // prevent errors if toast not on page
  toast.innerText = message;
  toast.style.display = 'block';
  toast.style.opacity = 1;
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
}

function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem('cart') || '{}');
  const count = Object.values(cart).reduce((sum, item) => sum + item.quantity, 0);
  const cartCountEl = document.getElementById('cart-count');
  if (cartCountEl) cartCountEl.innerText = count;
}

// ====== Contact Form Test ======
function testContactForm() {
  const testForm = {
    from_name: "Test User",
    from_email: "test@example.com",
    message: "This is a test message."
  };

  emailjs.send('service_0ths8yr', 'template_5ozpuzs', testForm)
    .then(() => {
      console.log("Test message sent successfully!");
    }, (error) => {
      console.error('Test EmailJS Error:', error);
    });
}

// ====== Init ======
document.addEventListener('DOMContentLoaded', () => {
  updateNavbar();
  updateCartCount();
  testContactForm(); // Call the test function
});

// ====== API Calls ======
const loginUrl = 'https://your-render-url/login';
const signupUrl = 'https://your-render-url/signup';

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
