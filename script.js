// Load cart from localStorage or start fresh
let cart = JSON.parse(localStorage.getItem("cart")) || [];

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
      li.innerHTML = `
        ${item.name} - KES ${item.price.toLocaleString()} x ${item.quantity}
        <button onclick="removeFromCart(${index})">❌ Remove</button>
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
function addToCart(name, price) {
  const existingItem = cart.find(item => item.name === name);
  if (existingItem) {
    existingItem.quantity++;
  } else {
    cart.push({ name, price, quantity: 1 });
  }
  updateCart(); // update cart display and navbar count
  showNotification(`${name} added to cart 🛒`);
}

// Remove item from cart at specific index
function removeFromCart(index) {
  cart.splice(index, 1);
  updateCart();
  showNotification("Item removed from cart ❌");
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
    const name = product.getAttribute("data-name") || product.querySelector("h3").innerText;
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

// Run updateCart on page load
document.addEventListener("DOMContentLoaded", updateCart);
