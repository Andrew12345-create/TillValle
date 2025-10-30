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
- [x] public/location.html - Replace hardcoded navbar with universal system
- [x] public/language.html - Replace hardcoded navbar with universal system
- [x] public/hero-animation.html - Replace hardcoded navbar with universal system
- [x] public/forgot-password.html - Replace hardcoded navbar with universal system
- [x] public/faq.html - Replace hardcoded navbar with universal system
- [x] public/contact.html - Replace hardcoded navbar with universal system
- [x] public/cart.html - Replace hardcoded navbar with universal system
- [x] public/admin.html - Replace hardcoded navbar with universal system
- [x] public/account.html - Replace hardcoded navbar with universal system
- [x] public/about.html - Replace hardcoded navbar with universal system

## Already Updated:
- [x] public/login.html - Already uses fetch + navbar-universal.js

## Process:
1. Replace `<nav class="navbar">...</nav>` with `<div id="navbar-container"></div>`
2. Add fetch script to load navbar.html
3. Include navbar-universal.js script
4. Remove any conflicting inline navbar scripts

## Next Steps:
- [x] Check remaining files that might need updates (theme.html, etc.)
- Test all pages to ensure navbar loads correctly
- Remove old hardcoded navbar code from navbar-universal.js if no longer needed
