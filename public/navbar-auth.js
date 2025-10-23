// Simple navbar authentication handler
function updateNavbarAuth() {
  const userEmail = localStorage.getItem('email');
  const loginBtn = document.getElementById('login-btn');
  const profileBtn = document.getElementById('profile-btn');
  const adminBtn = document.getElementById('admin-btn');
  const logoutBtn = document.getElementById('logout-btn');
  
  if (userEmail) {
    // User is logged in - hide login button
    if (loginBtn) loginBtn.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'none';
    
    // Show profile picture with dropdown
    if (profileBtn) {
      const profilePicture = localStorage.getItem(`profilePicture_${userEmail}`);
      const initial = userEmail.charAt(0).toUpperCase();
      
      profileBtn.innerHTML = `
        <div class="user-dropdown-container" style="position:relative;">
          <div class="profile-trigger" style="cursor:pointer;">
            ${profilePicture ? 
              `<img src="${profilePicture}" alt="Profile" class="user-avatar">` : 
              `<span class="user-initial">${initial}</span>`
            }
          </div>
          <div class="user-dropdown" id="user-dropdown" style="display:none;">
            <a href="profile.html">Profile</a>
            <a href="#" onclick="logout()">Logout</a>
          </div>
        </div>
      `;
      profileBtn.style.display = 'inline-block';
      profileBtn.href = '#';
      profileBtn.onclick = (e) => {
        e.preventDefault();
        toggleUserDropdown();
      };
    }
    
    // Show admin button for admin user
    if (adminBtn) {
      if (userEmail === 'andrewmunamwangi@gmail.com') {
        adminBtn.style.display = 'inline-block';
      } else {
        adminBtn.style.display = 'none';
      }
    }
  } else {
    // User not logged in - show login button only
    if (loginBtn) loginBtn.style.display = 'inline-block';
    if (profileBtn) profileBtn.style.display = 'none';
    if (adminBtn) adminBtn.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'none';
  }
}

// Toggle dropdown
function toggleUserDropdown() {
  const dropdown = document.getElementById('user-dropdown');
  if (dropdown) {
    const isVisible = dropdown.style.display === 'block';
    dropdown.style.display = isVisible ? 'none' : 'block';
  }
}

// Close dropdown when clicking outside
document.addEventListener('click', (event) => {
  const dropdown = document.getElementById('user-dropdown');
  const container = document.querySelector('.user-dropdown-container');
  if (dropdown && container && !container.contains(event.target)) {
    dropdown.style.display = 'none';
  }
});

// Logout function
function logout() {
  localStorage.removeItem('email');
  localStorage.removeItem('user');
  updateNavbarAuth();
  window.location.href = 'login.html';
}

// Make functions global
window.toggleUserDropdown = toggleUserDropdown;
window.logout = logout;

// Update navbar on page load
document.addEventListener('DOMContentLoaded', updateNavbarAuth);

// Also update immediately if script loads after DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', updateNavbarAuth);
} else {
  updateNavbarAuth();
}