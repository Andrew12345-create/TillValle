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

  function showMaintenanceOverlay() {
    // Create maintenance overlay if it doesn't exist
    let overlay = document.getElementById('maintenance-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'maintenance-overlay';
      overlay.style.cssText = `
        position: fixed;
        inset: 0;
        background: linear-gradient(180deg, #0b3d2e, #072018);
        color: white;
        z-index: 99999;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding: 24px;
        font-family: Arial, sans-serif;
      `;
      overlay.innerHTML = `
        <div style="max-width: 900px; margin: auto;">
          <h1 style="font-size: 48px; margin-bottom: 12px; letter-spacing: 2px;">TILLVALLE IS IN MAINTENANCE PERIOD</h1>
          <p style="font-size: 20px; opacity: 0.95; margin-bottom: 18px;">We're performing important updates. Please check back later. For urgent matters contact support@tillvalle.com</p>
          <div style="display: flex; gap: 12px; justify-content: center;">
            <button id="maintenance-deactivate-inline" style="background: white; color: #0b3d2e; padding: 10px 16px; border-radius: 8px; border: none; font-weight: 700; cursor: pointer;">Deactivate (Admin)</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);

      // Add deactivate button handler
      const deactivateBtn = overlay.querySelector('#maintenance-deactivate-inline');
      if (deactivateBtn) {
        deactivateBtn.addEventListener('click', async function() {
          const pass = prompt('Enter admin password to confirm:');
          if (pass === null) return;
          if (pass === 'Stock101') {
            try {
              localStorage.removeItem('tillvalle_maintenance');
              overlay.style.display = 'none';
              document.body.style.overflow = '';
              location.reload();
            } catch (e) {
              alert('Error deactivating maintenance mode');
            }
          } else {
            alert('Incorrect password');
          }
        });
      }
    }

    overlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  // Check maintenance mode on page load
  (async () => {
    const maintenanceActive = await isMaintenanceActive();
    if (maintenanceActive && !isAdminUser()) {
      // Show maintenance overlay immediately
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', showMaintenanceOverlay);
      } else {
        showMaintenanceOverlay();
      }
    }
  })();

  // Make functions globally available for admin panel
  window.isMaintenanceActive = isMaintenanceActive;
  window.showMaintenanceOverlay = showMaintenanceOverlay;
  window.isAdminUser = isAdminUser;

})();
