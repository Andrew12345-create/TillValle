// Hero animation JavaScript
document.addEventListener('DOMContentLoaded', function() {
  // Add interactive hover effects to floating items
  document.querySelectorAll('.floating-item').forEach(item => {
    item.addEventListener('mouseenter', () => {
      item.style.transform = 'scale(1.2) rotate(10deg)';
      item.style.transition = 'transform 0.3s ease';
    });
    
    item.addEventListener('mouseleave', () => {
      item.style.transform = 'scale(1) rotate(0deg)';
    });
  });

  // Parallax scroll effect
  window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const parallax = document.querySelector('.floating-elements');
    if (parallax) {
      const speed = scrolled * 0.5;
      parallax.style.transform = `translateY(${speed}px)`;
    }
  });
});