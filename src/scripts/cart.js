// Function to show the modal
function showModal(product) {
  const modal = document.querySelector('.modal');
  const modalContent = document.querySelector('.modal-content');
  const modalImage = modalContent.querySelector('.modal-image');
  const modalTitle = modalContent.querySelector('.modal-info h3');
  const modalPrice = modalContent.querySelector('#modal-product-price');

  // Set modal content
  modalImage.src = product.image; // Assuming product has an image property
  modalTitle.textContent = product.name; // Assuming product has a name property
  modalPrice.textContent = `$${product.price.toFixed(2)}`; // Assuming product has a price property

  // Show the modal
  modal.classList.add('show');
}

// Function to close the modal
function closeModal() {
  const modal = document.querySelector('.modal');
  modal.classList.remove('show');
}

// Event listener for close button
document.querySelector('.close').addEventListener('click', closeModal);

// Event listener for adding to cart
document.querySelectorAll('.add-to-cart-btn').forEach(button => {
  button.addEventListener('click', (event) => {
    const product = {
      name: event.target.dataset.productName, // Assuming data attributes are set
      price: event.target.dataset.productPrice,
      image: event.target.dataset.productImage
    };
    showModal(product);
  });
});
