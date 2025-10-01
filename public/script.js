const cartItemsContainer = document.getElementById('cart-items');
const cartTotalElem = document.getElementById('cart-total');

// Load cart from localStorage or initialize empty
let cart = JSON.parse(localStorage.getItem('cart')) || [];

function getUserFromLocalStorage() {
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
  if (!userArea) return;
  user = getUserFromLocalStorage();
  if (user && user.email) {
    const initial = user.email.charAt(0).toUpperCase();
    userArea.innerHTML = `
      <a href="profile.html" class="nav-link user-initial-link" title="${user.email}">
        <span class="user-initial">${initial}</span>
      </a>
    `;
  } else {
    userArea.innerHTML = `<a href="login.html" class="nav-link">Login</a>`;
  }
}

function updateCartCount() {
  const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartCountElem = document.getElementById('cart-count');
  if (cartCountElem) {
    cartCountElem.textContent = totalQuantity;
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

function showCartToast(message) {
  const cartToast = document.getElementById('cart-toast');
  if (!cartToast) return;
  cartToast.textContent = message;
  cartToast.classList.add('show');
  setTimeout(() => {
    cartToast.classList.remove('show');
  }, 2000);
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

// Modal related elements
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

const modalName = document.getElementById('modal-product-name');
const modalDescription = document.getElementById('modal-product-description');
const modalImage = document.getElementById('modal-product-image');
const modalPrice = document.getElementById('modal-product-price');
const quantityInput = document.getElementById('modal-quantity');
const addToCartModalBtn = document.getElementById('add-to-cart-modal');
const closeModalBtn = modal.querySelector('.close-modal');
const decreaseQtyBtn = document.getElementById('modal-decrease-qty');
const increaseQtyBtn = document.getElementById('modal-increase-qty');

let currentProduct = null;

window.openProductModal = function(name, description, imageSrc, price) {
  currentProduct = { name, price };
  modalName.textContent = name;
  modalDescription.textContent = description;
  modalImage.src = imageSrc;
  modalImage.alt = name;
  modalPrice.textContent = `KES ${price}`;
  quantityInput.value = 1;
  modal.style.display = 'block';
};

function closeProductModal() {
  modal.style.display = 'none';
}

closeModalBtn.addEventListener('click', closeProductModal);

window.addEventListener('click', (event) => {
  if (event.target === modal) {
    closeProductModal();
  }
});

decreaseQtyBtn.addEventListener('click', () => {
  let qty = parseInt(quantityInput.value);
  if (qty > 1) {
    quantityInput.value = qty - 1;
  }
});

increaseQtyBtn.addEventListener('click', () => {
  let qty = parseInt(quantityInput.value);
  quantityInput.value = qty + 1;
});

addToCartModalBtn.addEventListener('click', () => {
  if (!user || !user.email) {
    showCartToast("Please log in to add items to cart");
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 2000);
    closeProductModal();
    return;
  }
  const qty = parseInt(quantityInput.value);
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

// Add product to cart from product cards without modal (fallback)
window.addToCart = function(name, price) {
  if (!user || !user.email) {
    showCartToast("Please log in to add items to cart");
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 2000);
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

// Floating cart button click to open cart page
const floatingCartBtn = document.getElementById('floating-cart-btn');
if (floatingCartBtn) {
  floatingCartBtn.addEventListener('click', () => {
    window.location.href = 'cart.html';
  });
}

renderUserArea();
renderCart();

// Navbar fix: Remove "Home" link and ensure navbar is straight on phone with max 2 lines
document.addEventListener('DOMContentLoaded', () => {
  // Remove all "Home" links from navbars
  const homeLinks = document.querySelectorAll('.nav-link');
  homeLinks.forEach(link => {
    if (link.textContent.trim().toLowerCase() === 'home') {
      link.remove();
    }
  });

  // Fix navbar layout on small screens only
  const navbar = document.querySelector('.navbar');
  if (navbar && window.innerWidth <= 480) {
    // Add CSS class to navbar for responsive fix
    navbar.classList.add('navbar-responsive-fix');
  }
});

/* Add CSS for navbar-responsive-fix in JS for demonstration, ideally should be in CSS file */
const style = document.createElement('style');
style.textContent = `
  .navbar-responsive-fix {
    flex-wrap: wrap !important;
    max-height: none !important; /* Remove max height to prevent scrolling */
    overflow-y: visible !important; /* Make all content visible */
  }
  .navbar-responsive-fix .nav-left, .navbar-responsive-fix .nav-right {
    flex: 1 1 100%;
    justify-content: flex-start;
  }
`;
document.head.appendChild(style);
