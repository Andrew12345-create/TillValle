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
  // Store product quantities in memory
  const productQuantities = {};

  // Quick Add to Cart function
  window.quickAddToCart = function(name, price, image) {
    addToCart(name, price, image, 1);
  };

  // Add to cart function
  function addToCart(name, price, image, quantity) {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const existingItem = cart.find(item => item.name === name);
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.push({ name, price, quantity, image });
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    showToast(`${name} added to cart!`);
    
    // Reset the product's quantity display
    const product = document.querySelector(`.product[data-name="${name}"]`);
    if (product) {
      productQuantities[name] = 0;
      updateProductDisplay(product, name);
    }
  }

  // Show toast notification
  function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      background: linear-gradient(135deg, #059669, #10b981);
      color: white;
      padding: 14px 24px;
      border-radius: 30px;
      z-index: 10001;
      font-weight: bold;
      box-shadow: 0 8px 25px rgba(5,150,105,0.4);
      animation: slideIn 0.3s ease;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  }

  // Update product display based on quantity
  function updateProductDisplay(product, name) {
    const qty = productQuantities[name] || 0;
    const qtyDisplay = product.querySelector('.qty-display');
    if (qtyDisplay) qtyDisplay.textContent = qty;
    
    if (qty > 0) {
      product.classList.add('has-quantity');
    } else {
      product.classList.remove('has-quantity');
    }
  }

  // Initialize product click handlers
  if (products && products.length > 0) {
    // Load existing cart to show quantities
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    products.forEach(product => {
      const name = product.dataset.name;
      const price = parseFloat(product.dataset.price) || 0;
      const image = product.dataset.image;
      
      // Check if item is already in cart
      const cartItem = cart.find(item => item.name === name);
      productQuantities[name] = cartItem ? cartItem.quantity : 0;
      updateProductDisplay(product, name);

      // Add to cart button handler
      const addToCartBtn = product.querySelector('.add-to-cart-toggle');
      if (addToCartBtn) {
        addToCartBtn.addEventListener('click', function(e) {
          e.stopPropagation();
          addToCart(name, price, image, 1);
        });
      }

      // Quantity buttons handler
      const qtyBtns = product.querySelectorAll('.qty-btn');
      qtyBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
          e.stopPropagation();
          const action = btn.dataset.action;
          if (!productQuantities[name]) productQuantities[name] = 0;
          
          if (action === 'add') {
            productQuantities[name]++;
            addToCart(name, price, image, 1);
          } else if (action === 'remove' && productQuantities[name] > 0) {
            productQuantities[name]--;
            addToCart(name, price, image, -1);
          }
          
          updateProductDisplay(product, name);
        });
      });

      // Product click handler - navigate to product page
      product.addEventListener('click', function(e) {
        // Don't navigate if clicking on buttons
        if (e.target.closest('.add-to-cart-toggle') || e.target.closest('.qty-btn') || e.target.closest('.quick-add-btn')) {
          return;
        }
        const productDescription = product.dataset.description || '';
        const url = `product.html?name=${encodeURIComponent(name)}&price=${encodeURIComponent(price)}&image=${encodeURIComponent(image)}&description=${encodeURIComponent(productDescription)}`;
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

  // Search and price filter functionality
  const searchInput = document.getElementById('search-bar');
  const searchBtn = document.getElementById('search-btn');
  const priceFilter = document.getElementById('price-filter');

  function filterProducts() {
    const searchTerm = searchInput ? (searchInput.value || '').toLowerCase() : '';
    const priceRange = priceFilter ? priceFilter.value : 'all';

    products.forEach(product => {
      const productName = (product.dataset.name || '').toLowerCase();
      const productPrice = parseFloat(product.dataset.price || 0);

      let matchesSearch = productName.includes(searchTerm);
      let matchesPrice = true;

      if (priceRange !== 'all') {
        if (priceRange === 'under-50') {
          matchesPrice = productPrice < 50;
        } else if (priceRange === '50-100') {
          matchesPrice = productPrice >= 50 && productPrice < 100;
        } else if (priceRange === '100-200') {
          matchesPrice = productPrice >= 100 && productPrice < 200;
        } else if (priceRange === 'over-200') {
          matchesPrice = productPrice >= 200;
        }
      }

      product.style.display = (matchesSearch && matchesPrice) ? 'block' : 'none';
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

  if (priceFilter) {
    priceFilter.addEventListener('change', filterProducts);
  }

  // Initialize cart count
  updateCartCount();
});
