# Fix Duplicate Login Buttons in Navbar

## Tasks
- [x] Edit public/index.html: Remove hardcoded login link, ensure <span id="user-area"></span> in nav-right
- [x] Edit public/about.html: Remove hardcoded login link, add <span id="user-area"></span> in nav-right
- [x] Edit public/cart.html: Remove hardcoded login link, ensure <span id="user-area"></span> in nav-right
- [x] Edit public/contact.html: Remove hardcoded login link, ensure <span id="user-area"></span> in nav-right
- [x] Edit public/faq.html: Remove hardcoded login link, ensure <span id="user-area"></span> in nav-right
- [x] Edit public/language.html: Remove hardcoded login link, ensure <span id="user-area"></span> in nav-right
- [x] Edit public/orderhistory.html: Remove hardcoded login link, ensure <span id="user-area"></span> in nav-right
- [x] Edit public/profile.html: Remove hardcoded login link, ensure <span id="user-area"></span> in nav-right
- [x] Edit public/register.html: Remove hardcoded login link, ensure <span id="user-area"></span> in nav-right
- [x] Edit public/shop.html: Remove hardcoded login link from inside <span id="user-area"></span>
- [x] Edit public/account.html: Remove hardcoded login link, ensure <span id="user-area"></span> in nav-right
- [ ] Test the navbar on different pages to ensure no duplicates and proper functionality

## Notes
- Standardize navbar structure: nav-right should have <span id="user-area"></span> and cart link
- JavaScript in script.js will dynamically add login or user initials to #user-area
