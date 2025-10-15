// Universal navbar script for all pages
document.addEventListener('DOMContentLoaded', function() {
  const userEmail = localStorage.getItem('email');
  const loginBtn = document.getElementById('login-btn');
  const profileAvatar = document.getElementById('profile-avatar');
  const adminBtn = document.getElementById('admin-btn');
  
  // Update profile avatar
  if (userEmail && profileAvatar) {
    const profilePicture = localStorage.getItem(`profilePicture_${userEmail}`);
    if (profilePicture) {
      profileAvatar.innerHTML = `<img src="${profilePicture}" alt="Profile" style="width:30px;height:30px;border-radius:50%;object-fit:cover;">`;
    } else {
      profileAvatar.textContent = userEmail.charAt(0).toUpperCase();
    }
    profileAvatar.style.display = 'inline-block';
    if (loginBtn) loginBtn.style.display = 'none';
    
    // Show admin for admin user
    if (adminBtn && userEmail === 'andrewmunamwangi@gmail.com') {
      adminBtn.style.display = 'inline-block';
    }
  } else {
    // Not logged in
    if (profileAvatar) profileAvatar.style.display = 'none';
    if (adminBtn) adminBtn.style.display = 'none';
    if (loginBtn) loginBtn.style.display = 'inline-block';
  }
});

function toggleDropdown() {
  const dropdown = document.getElementById('user-dropdown');
  if (dropdown) {
    dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
  }
}

function logout() {
  localStorage.removeItem('email');
  localStorage.removeItem('user');
  window.location.href = 'login.html';
}

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
  const dropdown = document.getElementById('user-dropdown');
  const avatar = document.getElementById('profile-avatar');
  if (dropdown && avatar && !avatar.contains(event.target) && !dropdown.contains(event.target)) {
    dropdown.style.display = 'none';
  }
});

// Make functions global
window.toggleDropdown = toggleDropdown;
window.logout = logout;