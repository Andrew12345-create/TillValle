// app-version.js - Display app version on all pages
async function loadAndDisplayVersion() {
  try {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const versionUrl = isLocal ? 'http://localhost:3000/api/version' : '/.netlify/functions/version';
    
    const response = await fetch(versionUrl);
    const data = await response.json();
    
    // Display version in page (optional - can be in footer, header, etc)
    const versionElement = document.getElementById('app-version');
    if (versionElement) {
      versionElement.textContent = `v${data.version}`;
    }
    
    // Store version in sessionStorage for access throughout the app
    sessionStorage.setItem('appVersion', data.version);
    
  } catch (error) {
    console.log('Could not load app version:', error);
    sessionStorage.setItem('appVersion', '1.0.0');
  }
}

// Auto-load on DOMContentLoaded if not already loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadAndDisplayVersion);
} else {
  loadAndDisplayVersion();
}
