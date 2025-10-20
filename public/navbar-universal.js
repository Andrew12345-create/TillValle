// Universal navbar functionality for all pages
document.addEventListener('DOMContentLoaded', function() {
  const userArea = document.getElementById('user-area');
  const userEmail = localStorage.getItem('email');
  
  if (userEmail && userArea) {
    const initial = userEmail.charAt(0).toUpperCase();
    const profilePicture = localStorage.getItem(`profilePicture_${userEmail}`);
    const userDisplay = profilePicture ? 
      `<img src="${profilePicture}" alt="Profile" style="width:35px;height:35px;border-radius:50%;object-fit:cover;border:2px solid rgba(255,255,255,0.3);">` : 
      initial;
    
    let adminLink = '';
    if (userEmail === 'andrewmunamwangi@gmail.com') {
      adminLink = `<a href="admin.html" class="nav-link">Admin</a>`;
    }
    
    userArea.innerHTML = `
      <div class="user-dropdown-container">
        <span class="user-initial" onclick="toggleUserDropdown()" title="${userEmail}">${userDisplay}</span>
        <div class="user-dropdown" id="user-dropdown">
          <a href="profile.html">Profile</a>
          <a href="#" onclick="logout()">Logout</a>
        </div>
      </div>
      ${adminLink}
    `;
  } else if (userArea) {
    userArea.innerHTML = `<a href="login.html" class="nav-link">Login</a>`;
  }
  
  // Global functions
  window.toggleUserDropdown = function() {
    const dropdown = document.getElementById('user-dropdown');
    if (dropdown) dropdown.classList.toggle('show');
  };
  
  window.logout = function() {
    localStorage.removeItem('email');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
  };
  
  // Close dropdown when clicking outside
  document.addEventListener('click', (event) => {
    const dropdown = document.getElementById('user-dropdown');
    const container = document.querySelector('.user-dropdown-container');
    if (dropdown && container && !container.contains(event.target)) {
      dropdown.classList.remove('show');
    }
  });
  
  // Update cart counter
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartCountElem = document.getElementById('cart-count');
  if (cartCountElem) cartCountElem.textContent = totalQuantity;
});