// Cookie Consent Widget with Advanced Settings
class CookieManager {
  constructor() {
    this.storageKey = 'tillvalle_cookie_preferences';
    this.preferences = this.loadPreferences();
    this.createWidget();
    this.applyPreferences();
  }

  loadPreferences() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      return saved ? JSON.parse(saved) : {
        necessary: true,
        analytics: false,
        marketing: false,
        functional: false,
        timestamp: null
      };
    } catch (e) {
      return {
        necessary: true,
        analytics: false,
        marketing: false,
        functional: false,
        timestamp: null
      };
    }
  }

  savePreferences() {
    try {
      this.preferences.timestamp = Date.now();
      localStorage.setItem(this.storageKey, JSON.stringify(this.preferences));
      this.applyPreferences();
    } catch (e) {
      console.warn('Could not save cookie preferences');
    }
  }

  applyPreferences() {
    // Set global consent object for other scripts to check
    window.COOKIE_CONSENT = this.preferences;
    
    // Apply analytics
    if (this.preferences.analytics) {
      this.enableAnalytics();
    } else {
      this.disableAnalytics();
    }
    
    // Apply marketing
    if (this.preferences.marketing) {
      this.enableMarketing();
    } else {
      this.disableMarketing();
    }
    
    // Apply functional
    if (this.preferences.functional) {
      this.enableFunctional();
    } else {
      this.disableFunctional();
    }
  }

  enableAnalytics() {
    // Enable Google Analytics, Hotjar, etc.
    if (typeof gtag !== 'undefined') {
      gtag('consent', 'update', {
        'analytics_storage': 'granted'
      });
    }
  }

  disableAnalytics() {
    // Disable analytics
    if (typeof gtag !== 'undefined') {
      gtag('consent', 'update', {
        'analytics_storage': 'denied'
      });
    }
  }

  enableMarketing() {
    // Enable marketing cookies
    if (typeof gtag !== 'undefined') {
      gtag('consent', 'update', {
        'ad_storage': 'granted'
      });
    }
  }

  disableMarketing() {
    // Disable marketing cookies
    if (typeof gtag !== 'undefined') {
      gtag('consent', 'update', {
        'ad_storage': 'denied'
      });
    }
  }

  enableFunctional() {
    // Enable functional cookies (preferences, etc.)
    document.cookie = "functional_enabled=true; path=/; max-age=31536000";
  }

  disableFunctional() {
    // Disable functional cookies
    document.cookie = "functional_enabled=false; path=/; max-age=0";
  }

  createWidget() {
    // Create floating button
    const btn = document.createElement('button');
    btn.className = 'cookie-widget-btn';
    btn.innerHTML = '🍪';
    btn.title = 'Cookie Preferences';
    
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'cookie-widget-modal';
    
    const hasPreferences = this.preferences.timestamp !== null;
    
    modal.innerHTML = `
      <div class="cookie-widget-content">
        <button class="cookie-close">&times;</button>
        <div class="cookie-header">
          <h2>🍪 Cookie Preferences</h2>
          <p>Manage your cookie settings and privacy preferences</p>
        </div>
        
        ${hasPreferences ? '<div class="cookie-status">✓ Your preferences have been saved</div>' : ''}
        
        <div class="cookie-option">
          <div class="cookie-option-header">
            <span class="cookie-option-title">Necessary Cookies</span>
            <div class="cookie-toggle active" data-type="necessary">
            </div>
          </div>
          <div class="cookie-option-desc">
            Required for basic site functionality. These cannot be disabled.
          </div>
        </div>
        
        <div class="cookie-option">
          <div class="cookie-option-header">
            <span class="cookie-option-title">Analytics Cookies</span>
            <div class="cookie-toggle ${this.preferences.analytics ? 'active' : ''}" data-type="analytics">
            </div>
          </div>
          <div class="cookie-option-desc">
            Help us understand how visitors interact with our website (Google Analytics, Hotjar).
          </div>
        </div>
        
        <div class="cookie-option">
          <div class="cookie-option-header">
            <span class="cookie-option-title">Marketing Cookies</span>
            <div class="cookie-toggle ${this.preferences.marketing ? 'active' : ''}" data-type="marketing">
            </div>
          </div>
          <div class="cookie-option-desc">
            Used to deliver personalized advertisements and track campaign performance.
          </div>
        </div>
        
        <div class="cookie-option">
          <div class="cookie-option-header">
            <span class="cookie-option-title">Functional Cookies</span>
            <div class="cookie-toggle ${this.preferences.functional ? 'active' : ''}" data-type="functional">
            </div>
          </div>
          <div class="cookie-option-desc">
            Remember your preferences and settings for a better experience.
          </div>
        </div>
        
        <div class="cookie-actions">
          <button class="cookie-btn cookie-btn-secondary" id="cookie-reject-all">Reject All</button>
          <button class="cookie-btn cookie-btn-primary" id="cookie-save-prefs">Save Preferences</button>
          <button class="cookie-btn cookie-btn-primary" id="cookie-accept-all">Accept All</button>
        </div>
      </div>
    `;
    
    // Add to page
    document.body.appendChild(btn);
    document.body.appendChild(modal);
    
    // Event listeners
    btn.addEventListener('click', () => {
      modal.classList.add('show');
    });
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal || e.target.classList.contains('cookie-close')) {
        modal.classList.remove('show');
      }
    });
    
    // Toggle switches
    modal.querySelectorAll('.cookie-toggle').forEach(toggle => {
      toggle.addEventListener('click', () => {
        const type = toggle.dataset.type;
        if (type === 'necessary') return; // Can't disable necessary
        
        toggle.classList.toggle('active');
        this.preferences[type] = toggle.classList.contains('active');
      });
    });
    
    // Action buttons
    modal.querySelector('#cookie-accept-all').addEventListener('click', () => {
      this.preferences = {
        necessary: true,
        analytics: true,
        marketing: true,
        functional: true,
        timestamp: Date.now()
      };
      this.savePreferences();
      modal.classList.remove('show');
      this.showToast('All cookies accepted');
    });
    
    modal.querySelector('#cookie-reject-all').addEventListener('click', () => {
      this.preferences = {
        necessary: true,
        analytics: false,
        marketing: false,
        functional: false,
        timestamp: Date.now()
      };
      this.savePreferences();
      modal.classList.remove('show');
      this.showToast('Only necessary cookies enabled');
    });
    
    modal.querySelector('#cookie-save-prefs').addEventListener('click', () => {
      this.savePreferences();
      modal.classList.remove('show');
      this.showToast('Cookie preferences saved');
    });
  }

  showToast(message) {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      bottom: 100px;
      left: 20px;
      background: linear-gradient(135deg, #10b981, #34d399);
      color: white;
      padding: 12px 20px;
      border-radius: 10px;
      font-weight: 600;
      z-index: 10000;
      box-shadow: 0 8px 25px rgba(16, 185, 129, 0.3);
      transform: translateX(-100%);
      transition: transform 0.3s ease;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.style.transform = 'translateX(0)', 100);
    setTimeout(() => {
      toast.style.transform = 'translateX(-100%)';
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
  }
}

// Initialize cookie manager
document.addEventListener('DOMContentLoaded', () => {
  new CookieManager();
});