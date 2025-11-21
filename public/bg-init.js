// Initialize creative backgrounds on all pages
document.addEventListener('DOMContentLoaded', function() {
  // Add page-specific class to body
  const path = window.location.pathname;
  const body = document.body;
  
  if (path.includes('index.html') || path === '/') {
    body.classList.add('home-page');
  } else if (path.includes('shop.html')) {
    body.classList.add('shop-page');
  } else if (path.includes('cart.html')) {
    body.classList.add('cart-page');
  } else if (path.includes('admin.html')) {
    body.classList.add('admin-page');
  } else if (path.includes('payment.html')) {
    body.classList.add('payment-page');
  }
  
  // Add glass morphism to content areas
  const contentAreas = document.querySelectorAll('.navbar, .hero, .about-preview, .shop-section, .cart-section, .payment-container, .admin-content, footer, .payment-card');
  contentAreas.forEach(area => {
    area.classList.add('content-glass');
  });
  
  // Create floating shapes
  const shapesContainer = document.createElement('div');
  shapesContainer.className = 'bg-shapes';
  
  for (let i = 0; i < 5; i++) {
    const shape = document.createElement('div');
    shape.className = 'shape';
    shapesContainer.appendChild(shape);
  }
  
  // Create particles
  const particlesContainer = document.createElement('div');
  particlesContainer.className = 'particles';
  
  for (let i = 0; i < 8; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particlesContainer.appendChild(particle);
  }
  
  // Create mesh gradient
  const meshGradient = document.createElement('div');
  meshGradient.className = 'mesh-gradient';
  
  // Add scroll indicator only
  const scrollIndicator = document.createElement('div');
  scrollIndicator.className = 'scroll-indicator';
  body.appendChild(scrollIndicator);
  
  // Update scroll indicator
  window.addEventListener('scroll', () => {
    const scrolled = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
    scrollIndicator.style.transform = `scaleX(${scrolled / 100})`;
  });
});