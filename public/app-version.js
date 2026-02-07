// app-version.js - Display app version on all pages
async function loadAndDisplayVersion() {
  try {
    const candidates = ['/api/version', '/.netlify/functions/version'];
    let data = null;
    for (const url of candidates) {
      try {
        const resp = await fetch(url, { cache: 'no-store' });
        const contentType = resp.headers.get('content-type') || '';
        if (!resp.ok || contentType.includes('text/html')) {
          continue;
        }
        data = await resp.json();
        break;
      } catch (e) {
        continue;
      }
    }

    if (!data) throw new Error('No version endpoint available');

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
