// Helper functions
function getUser() {
  const token = localStorage.getItem('token');
  const email = localStorage.getItem('email');
  return token && email ? { token, email } : null;
}

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

// Load cart from localStorage or start fresh
let cart = [];
updateCart(); // Update UI immediately after loading cart

// Update cart display and save to localStorage
function updateCart() {
  const cartItemsList = document.getElementById("cart-items");
  const cartCount = document.getElementById("cart-count");
  const cartTotal = document.getElementById("cart-total");

  if (cartItemsList) {
    cartItemsList.innerHTML = ""; // Clear list
    let total = 0;
    cart.forEach((item, index) => {
      const li = document.createElement("li");
      li.className = "cart-item";
      li.innerHTML = `
        <span>${item.name} - KES ${item.price.toLocaleString()}</span>
        <div class="cart-quantity-controls">
          <button onclick="removeOneFromCart(${index})" aria-label="Remove one ${item.name}">-</button>
          <input type="number" value="${item.quantity}" min="1" onchange="updateQuantity(${index}, this.value)" aria-label="Quantity of ${item.name}">
          <button onclick="addOneToCart(${index})" aria-label="Add one ${item.name}">+</button>
          <button onclick="removeAllFromCart(${index})" aria-label="Remove all ${item.name}">❌ Remove All</button>
        </div>
      `;
      cartItemsList.appendChild(li);
      total += item.price * item.quantity;
    });
    if (cartCount) {
      // Sum all item quantities for an accurate count
      let totalQuantity = cart.reduce((sum, current) => sum + current.quantity, 0);
      cartCount.textContent = totalQuantity;
    }
    if (cartTotal) {
      cartTotal.innerHTML = `<strong>Total: KES ${total.toLocaleString()}</strong>`;
    }
  }
  
  // Save cart to localStorage
  localStorage.setItem("cart", JSON.stringify(cart));
}

// Add item to cart; if item exists, update quantity, else push new
function addToCart(name, price, quantity = 1) {
  const user = getUser();
  if (!user) {
    showNotification('Please login first! Redirecting to login page...');
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 1500);
    return;
  }

  // Use user-specific cart key to avoid conflicts
  const cartKey = `cart_${user.email}`;
  let cartObj = JSON.parse(localStorage.getItem(cartKey) || '{}');
  if (cartObj[name]) {
    cartObj[name].quantity += quantity;
  } else {
    cartObj[name] = { price, quantity };
  }
  localStorage.setItem(cartKey, JSON.stringify(cartObj));

  // Update the global cart array for compatibility
  cart = Object.entries(cartObj).map(([name, item]) => ({ name, price: item.price, quantity: item.quantity }));

  updateCart(); // update cart display and navbar count
  showNotification(`${quantity} x ${name} added to cart 🛒`);
}

function removeOneFromCart(index) {
  if (cart[index].quantity > 1) {
    cart[index].quantity--;
  } else {
    cart.splice(index, 1);
  }
  updateCart();
  showNotification("One item removed from cart ❌");
}

function removeAllFromCart(index) {
  cart.splice(index, 1);
  updateCart();
  showNotification("All items removed from cart ❌");
}

function addOneToCart(index) {
  cart[index].quantity++;
  updateCart();
  showNotification("One item added to cart 🛒");
}

function updateQuantity(index, newQuantity) {
  const qty = parseInt(newQuantity);
  if (qty > 0) {
    cart[index].quantity = qty;
    updateCart();
  }
}

// Clear entire cart
function clearCart() {
  cart = [];
  updateCart();
  showNotification("Cart cleared");
}

// Show a styled notification/toast
function showNotification(message) {
  const note = document.createElement("div");
  note.className = "notification";
  note.textContent = message;
  document.body.appendChild(note);
  setTimeout(() => note.classList.add("show"), 100);
  setTimeout(() => {
    note.classList.remove("show");
    note.remove();
  }, 2500);
}

// Search products functionality (single definition)
function searchProducts() {
  const input = document.getElementById("search-bar").value.toLowerCase();
  const products = document.querySelectorAll(".product");
  products.forEach(product => {
    const name = product.getAttribute("data-name") || product.querySelector("h4").innerText;
    if (name.toLowerCase().includes(input)) {
      product.style.display = "block";
    } else {
      product.style.display = "none";
    }
  });
}

// New function to buy immediately and go to checkout
function buyNow(name, price) {
  addToCart(name, price);
  setTimeout(() => {
    window.location.href = "cart.html";
  }, 500);
}

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
          <div class="quantity-controls">
            <button id="modal-quantity-minus">-</button>
            <input type="number" id="modal-quantity" value="1" min="1">
            <button id="modal-quantity-plus">+</button>
          </div>
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

  // Always set up quantity controls when modal opens
  setTimeout(() => {
    const minusBtn = document.getElementById('modal-quantity-minus');
    const plusBtn = document.getElementById('modal-quantity-plus');
    const quantityInput = document.getElementById('modal-quantity');

    if (minusBtn && plusBtn && quantityInput) {
      // Remove existing event listeners to prevent duplicates
      minusBtn.replaceWith(minusBtn.cloneNode(true));
      plusBtn.replaceWith(plusBtn.cloneNode(true));

      // Re-get references after cloning
      const newMinusBtn = document.getElementById('modal-quantity-minus');
      const newPlusBtn = document.getElementById('modal-quantity-plus');

      newMinusBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const current = parseInt(quantityInput.value);
        if (current > 1) {
          quantityInput.value = current - 1;
        }
      });

      newPlusBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const current = parseInt(quantityInput.value);
        quantityInput.value = current + 1;
      });

      quantityInput.addEventListener('input', () => {
        const current = parseInt(quantityInput.value);
        if (isNaN(current) || current < 1) {
          quantityInput.value = 1;
        }
      });
    }
  }, 10);

  // Set modal content
  document.getElementById('modal-product-name').textContent = name;
  const img = document.getElementById('modal-product-image');
  img.src = imageSrc;
  img.alt = name;

  // Add error handling for image loading
  img.onerror = function() {
    this.src = 'placeholder.png'; // Fallback image
    this.alt = 'Image not available';
  };

  // Ensure image loads properly
  img.onload = function() {
    console.log('Image loaded successfully:', imageSrc);
  };

  document.getElementById('modal-product-description').textContent = description;
  document.getElementById('modal-product-price').textContent = `KES ${price} / unit`;

  // Reset quantity to 1
  document.getElementById('modal-quantity').value = 1;

  // Set add to cart button action
  const addToCartBtn = document.getElementById('modal-add-to-cart');
  addToCartBtn.onclick = () => {
    const quantity = parseInt(document.getElementById('modal-quantity').value);
    addToCart(name, price, quantity);
    // Do not close modal on add to cart click to keep popup visible
    // modal.style.display = 'none';
  };

  // Show modal
  modal.style.display = 'block';
}

document.addEventListener('DOMContentLoaded', () => {
  updateCart();

  // Add click event listeners to all product divs
  document.querySelectorAll('.product').forEach(product => {
    product.addEventListener('click', () => {
      const name = product.querySelector('h4').textContent;
      const description = 'Fresh farm product'; // Generic description, can be customized per product
      const price = product.querySelector('.price').getAttribute('data-price');
      const imageSrc = name.toLowerCase().replace(/\s+/g, '-') + '.png'; // e.g., 'milk.png', 'eggs-kienyeji.png'
      openProductModal(name, description, imageSrc, price);
    });

    // Fix plus button inside shop.html modal quantity controls
    const plusBtn = product.querySelector('.modal-quantity-plus') || document.getElementById('modal-quantity-plus');
    if (plusBtn) {
      plusBtn.addEventListener('click', () => {
        const quantityInput = document.getElementById('modal-quantity');
        if (quantityInput) {
          let current = parseInt(quantityInput.value);
          if (isNaN(current)) current = 0;
          quantityInput.value = current + 1;
        }
      });
    }
  });
});
