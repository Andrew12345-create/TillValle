// Shipping & Payment Widget
function createShippingWidget() {
  // Create floating button
  const btn = document.createElement('button');
  btn.className = 'shipping-widget-btn';
  btn.innerHTML = '🚚';
  btn.title = 'Shipping & Payment Info';
  
  // Create modal
  const modal = document.createElement('div');
  modal.className = 'shipping-widget-modal';
  modal.innerHTML = `
    <div class="shipping-widget-content">
      <button class="widget-close">&times;</button>
      <div class="widget-header">
        <h2>🚚 Shipping & Payment</h2>
        <p>Fast delivery and secure payment options</p>
      </div>
      
      <div class="widget-grid">
        <div class="widget-card">
          <div class="widget-card-header">
            <span class="widget-card-icon">🚛</span>
            <h3 class="widget-card-title">Delivery Zones</h3>
          </div>
          
          <div class="delivery-zone">
            <span class="zone-name">🏙️ Nairobi</span>
            <div class="zone-details">
              <div class="zone-price">KES 200</div>
              <div class="zone-time">Same day delivery</div>
            </div>
          </div>
          
          <div class="delivery-zone">
            <span class="zone-name">🌆 Kiambu</span>
            <div class="zone-details">
              <div class="zone-price">KES 150</div>
              <div class="zone-time">Next day delivery</div>
            </div>
          </div>
          
          <div class="delivery-zone">
            <span class="zone-name">🌍 Other Areas</span>
            <div class="zone-details">
              <div class="zone-price">KES 300</div>
              <div class="zone-time">2-3 days delivery</div>
            </div>
          </div>
          
          <div class="free-delivery">
            <p>🎉 Free delivery on orders over KES 2000!</p>
          </div>
        </div>
        
        <div class="widget-card">
          <div class="widget-card-header">
            <span class="widget-card-icon">💳</span>
            <h3 class="widget-card-title">Payment Methods</h3>
          </div>
          
          <div class="payment-method">
            <span class="payment-icon">📱</span>
            <div class="payment-details">
              <h4>M-Pesa</h4>
              <p>Pay with your mobile money</p>
            </div>
            <div class="payment-status">✓</div>
          </div>
          
          <div class="payment-method">
            <span class="payment-icon">💳</span>
            <div class="payment-details">
              <h4>Credit/Debit Card</h4>
              <p>Secure online payments</p>
            </div>
            <div class="payment-status">✓</div>
          </div>
          
          <div class="payment-method">
            <span class="payment-icon">🏦</span>
            <div class="payment-details">
              <h4>Bank Transfer</h4>
              <p>Direct bank payments</p>
            </div>
            <div class="payment-status">✓</div>
          </div>
        </div>
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
    if (e.target === modal || e.target.classList.contains('widget-close')) {
      modal.classList.remove('show');
    }
  });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', createShippingWidget);