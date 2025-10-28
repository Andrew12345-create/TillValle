# TODO: Replace Hardcoded Navbars with Universal System

## Files to Update:
- [x] public/index.html - Replace hardcoded navbar with universal system
- [x] public/shop.html - Replace hardcoded navbar with universal system
- [x] public/signup.html - Replace hardcoded navbar with universal system
- [x] public/login.html - Replace hardcoded navbar with universal system
- [x] public/forgot-password.html - Replace hardcoded navbar with universal system
- [x] public/profile.html - Replace hardcoded navbar with universal system
- [x] public/payment.html - Replace hardcoded navbar with universal system
- [x] public/orderhistory.html - Replace hardcoded navbar with universal system
- [ ] public/location.html - Replace hardcoded navbar with universal system
- [ ] public/language.html - Replace hardcoded navbar with universal system
- [ ] public/hero-animation.html - Replace hardcoded navbar with universal system
- [ ] public/forgot-password.html - Replace hardcoded navbar with universal system
- [ ] public/faq.html - Replace hardcoded navbar with universal system
- [ ] public/contact.html - Replace hardcoded navbar with universal system
- [x] public/cart.html - Replace hardcoded navbar with universal system
- [ ] public/admin.html - Replace hardcoded navbar with universal system
- [ ] public/account.html - Replace hardcoded navbar with universal system
- [x] public/about.html - Replace hardcoded navbar with universal system

## Already Updated:
- [x] public/login.html - Already uses fetch + navbar-universal.js

## Process:
1. Replace `<nav class="navbar">...</nav>` with `<div id="navbar-container"></div>`
2. Add fetch script to load navbar.html
3. Include navbar-universal.js script
4. Remove any conflicting inline navbar scripts
