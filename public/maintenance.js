// Global maintenance mode handler
(function() {
  'use strict';

  async function isMaintenanceActive() {
    try {
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const maintenanceUrl = isLocal ? 'http://localhost:3001/maintenance' : '/.netlify/functions/maintenance';
      const response = await fetch(maintenanceUrl);
      const data = await response.json();
      return data.active;
    } catch (e) {
      // Fallback to localStorage if server fails
      return localStorage.getItem('tillvalle_maintenance') === '1';
    }
  }

  function isAdminUser() {
    try {
      return localStorage.getItem('isAdmin') === 'true';
    } catch (e) {
      return false;
    }
  }

  function redirectToMaintenance() {
    // Redirect to maintenance page if not already there
    if (window.location.pathname !== '/maintenance.html' && window.location.pathname !== '/public/maintenance.html') {
      window.location.href = 'maintenance.html';
    }
  }

  // Check maintenance mode on page load
  (async () => {
    const maintenanceActive = await isMaintenanceActive();
    if (maintenanceActive && !isAdminUser()) {
      // Redirect to maintenance page immediately
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', redirectToMaintenance);
      } else {
        redirectToMaintenance();
      }
    }
  })();

  // Make functions globally available for admin panel
  window.isMaintenanceActive = isMaintenanceActive;
  window.showMaintenanceOverlay = showMaintenanceOverlay;
  window.isAdminUser = isAdminUser;

})();
