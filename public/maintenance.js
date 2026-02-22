// Global maintenance mode handler — runs immediately on page load
(function() {
  'use strict';

  async function isMaintenanceActive() {
    try {
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      // Use port 3000 for local server
      const maintenanceUrl = isLocal ? 'http://localhost:3000/maintenance' : '/.netlify/functions/maintenance';
      const response = await fetch(maintenanceUrl, { cache: 'no-store' });
      if (!response.ok) return localStorage.getItem('tillvalle_maintenance') === '1';
      const data = await response.json();
      return data.active === true;
    } catch (e) {
      // Fallback to localStorage if server unreachable
      return localStorage.getItem('tillvalle_maintenance') === '1';
    }
  }

  function isAdminUser() {
    try {
      const email = localStorage.getItem('email') || '';
      return localStorage.getItem('isAdmin') === 'true' || email === 'andrewmunamwangi@gmail.com';
    } catch (e) {
      return false;
    }
  }

  function redirectToMaintenance() {
    const path = window.location.pathname;
    // Don't redirect if already on maintenance page or admin page
    if (!path.endsWith('maintenance.html') && !path.endsWith('admin.html') && !path.endsWith('app-admin.html')) {
      window.location.replace('maintenance.html');
    }
  }

  // Run maintenance check IMMEDIATELY — before DOM is ready
  // This ensures users are redirected as fast as possible
  isMaintenanceActive().then(function(active) {
    if (active && !isAdminUser()) {
      redirectToMaintenance();
    }
  });

  // Make functions globally available for admin panel
  window.isMaintenanceActive = isMaintenanceActive;
  window.redirectToMaintenance = redirectToMaintenance;
  window.isAdminUser = isAdminUser;

})();
