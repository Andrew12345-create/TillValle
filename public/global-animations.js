// Global animations for entire website
document.addEventListener('DOMContentLoaded', function() {
  // Add floating background shapes
  const body = document.body;
  const floatingBg = document.createElement('div');
  floatingBg.className = 'floating-bg';
  floatingBg.innerHTML = `
    <div class="floating-shape"></div>
    <div class="floating-shape"></div>
    <div class="floating-shape"></div>
  `;
  body.appendChild(floatingBg);

  // Add page enter animation
  document.body.classList.add('page-enter');

  // Intersection Observer for scroll animations
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, observerOptions);

  // Observe elements for scroll animations
  const animateElements = document.querySelectorAll('.product, .profile-card, .about-preview, .contact, .faq-item');
  animateElements.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'all 0.6s ease-out';
    observer.observe(el);
  });

  // Enhanced button interactions
  document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('mouseenter', () => {
      btn.style.transform = 'translateY(-3px) scale(1.05)';
    });
    
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = 'translateY(0) scale(1)';
    });
  });

  // Parallax effect for floating background
  window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const shapes = document.querySelectorAll('.floating-shape');
    shapes.forEach((shape, index) => {
      const speed = (index + 1) * 0.2;
      shape.style.transform = `translateY(${scrolled * speed}px) rotate(${scrolled * 0.1}deg)`;
    });
    // Toggle navbar scrolled backdrop for a sleek sticky effect
    const navbar = document.querySelector('.navbar');
    if (navbar) {
      if (scrolled > 20) navbar.classList.add('scrolled'); else navbar.classList.remove('scrolled');
    }
  });

  // Add ripple effect to clickable elements
  function createRipple(event) {
    const button = event.currentTarget;
    const circle = document.createElement('span');
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;

    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${event.clientX - button.offsetLeft - radius}px`;
    circle.style.top = `${event.clientY - button.offsetTop - radius}px`;
    circle.classList.add('ripple');

    const ripple = button.getElementsByClassName('ripple')[0];
    if (ripple) {
      ripple.remove();
    }

    button.appendChild(circle);
  }

  // Add ripple CSS
  const rippleCSS = `
    .ripple {
      position: absolute;
      border-radius: 50%;
      transform: scale(0);
      animation: ripple 600ms linear;
      background-color: rgba(255, 255, 255, 0.6);
    }
    @keyframes ripple {
      to {
        transform: scale(4);
        opacity: 0;
      }
    }
  `;
  
  const style = document.createElement('style');
  style.textContent = rippleCSS;
  document.head.appendChild(style);

  // Apply ripple to buttons
  document.querySelectorAll('.btn, .nav-link, .profile-card').forEach(el => {
    el.style.position = 'relative';
    el.style.overflow = 'hidden';
    el.addEventListener('click', createRipple);
  });

  // Highlight active nav link based on current path
  const current = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(a => {
    try {
      const href = (a.getAttribute('href') || '').split('/').pop();
      if (href === current) a.classList.add('active');
    } catch (e) {}
  });
});