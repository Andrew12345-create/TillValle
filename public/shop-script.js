// Shop functionality
document.addEventListener('DOMContentLoaded', function() {
  const modal = document.getElementById('product-modal');
  const closeBtn = document.querySelector('.close');
  const products = document.querySelectorAll('.product');
  const addToCartBtn = document.getElementById('add-to-cart');
  const quantityInput = document.getElementById('quantity');
  const decreaseBtn = document.getElementById('decrease-qty');
  const increaseBtn = document.getElementById('increase-qty');
  
  let currentProduct = null;

  // Create chatbot
  const chatbotBtn = document.createElement('div');
  chatbotBtn.id = 'chatbot-float';
  chatbotBtn.innerHTML = '💬';
  document.body.appendChild(chatbotBtn);

  // Product click handlers
  if (products && products.length > 0) {
    products.forEach(product => {
      product.addEventListener('click', function() {
        const name = this.dataset.name;
        const price = this.dataset.price;
        const image = this.dataset.image;
        const description = this.dataset.description || '';

        // Redirect to product details page
        const url = `product.html?name=${encodeURIComponent(name)}&price=${encodeURIComponent(price)}&image=${encodeURIComponent(image)}&description=${encodeURIComponent(description)}`;
        window.location.href = url;
      });
    });
  }

  // Close modal
  if (closeBtn) {
    closeBtn.addEventListener('click', function() {
      if (modal) modal.style.display = 'none';
    });
  }

  window.addEventListener('click', function(event) {
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  });

  // Quantity controls
  if (decreaseBtn && quantityInput) {
    decreaseBtn.addEventListener('click', function() {
      if (parseInt(quantityInput.value) > 1) {
        quantityInput.value = parseInt(quantityInput.value) - 1;
      }
    });
  }

  if (increaseBtn && quantityInput) {
    increaseBtn.addEventListener('click', function() {
      quantityInput.value = parseInt(quantityInput.value) + 1;
    });
  }

  // Add to cart
  if (addToCartBtn) {
    addToCartBtn.addEventListener('click', function() {
      if (currentProduct) {
        const quantity = quantityInput ? parseInt(quantityInput.value) : 1;
        const cart = JSON.parse(localStorage.getItem('cart')) || [];

        const existingItem = cart.find(item => item.name === currentProduct.name);
        if (existingItem) {
          existingItem.quantity += quantity;
        } else {
          cart.push({
            name: currentProduct.name,
            price: currentProduct.price,
            quantity: quantity
          });
        }

        localStorage.setItem('cart', JSON.stringify(cart));
        if (typeof updateCartCount === 'function') updateCartCount();

        if (modal) modal.style.display = 'none';
        if (quantityInput) quantityInput.value = 1;

        // Show toast
        showToast(`${currentProduct.name} added to cart!`);
      }
    });
  }

  // Update cart count
  function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartCountElem = document.getElementById('cart-count');
    if (cartCountElem) {
      cartCountElem.textContent = totalQuantity;
    }
  }

  // Show toast notification
  function showToast(message) {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #2d6a4f;
      color: white;
      padding: 12px 20px;
      border-radius: 5px;
      z-index: 10001;
      font-weight: bold;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }

  // Search functionality
  const searchInput = document.getElementById('search-bar');
  const searchBtn = document.getElementById('search-btn');
  
  function filterProducts() {
    const searchTerm = searchInput ? (searchInput.value || '').toLowerCase() : '';
    products.forEach(product => {
      const productName = (product.dataset.name || '').toLowerCase();
      product.style.display = productName.includes(searchTerm) ? 'block' : 'none';
    });
  }

  if (searchBtn && searchInput) {
    searchBtn.addEventListener('click', filterProducts);
    searchInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        filterProducts();
      }
    });
  }

  // Initialize cart count
  updateCartCount();
});