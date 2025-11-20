// Authentication and Cart Management
function isUserLoggedIn() {
  return localStorage.getItem('email') !== null;
}

function clearUnauthorizedCart() {
  if (!isUserLoggedIn()) {
    localStorage.removeItem('cart');
    localStorage.removeItem('tillvalle_recent_purchases');
  }
}

function showLoginNotification() {
  const notification = document.createElement('div');
  notification.className = 'login-notification';
  notification.innerHTML = `
    <div class="notification-content">
      <div class="notification-icon">🔐</div>
      <div class="notification-text">
        <h3>Login Required</h3>
        <p>Please log in to add items to your cart</p>
      </div>
      <button class="notification-btn" onclick="goToLogin()">Login Now</button>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => notification.classList.add('show'), 100);
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => document.body.removeChild(notification), 300);
  }, 4000);
}

function goToLogin() {
  window.location.href = 'login.html';
}

function handleAddToCart(productName, price, image) {
  if (!isUserLoggedIn()) {
    clearUnauthorizedCart();
    showLoginNotification();
    return false;
  }
  return true;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  clearUnauthorizedCart();
  
  // Override existing add to cart functions
  document.addEventListener('click', function(e) {
    const addBtn = e.target.closest('.product-btn[data-action="add"]');
    if (addBtn && !isUserLoggedIn()) {
      e.preventDefault();
      e.stopPropagation();
      clearUnauthorizedCart();
      showLoginNotification();
      return false;
    }
  });
});