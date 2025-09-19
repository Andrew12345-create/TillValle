# TODO List for Adding Mpesa Payment and Fixing Cart

## 1. Fix Cart Buttons and Text Fitting
- [x] Review cart.html for button styling issues
- [x] Fix text overflow and fitting problems
- [x] Ensure responsive design for cart elements
- [x] Update styles.css if needed for cart-specific fixes

## 2. Add Payment Options to Cart
- [x] Enhance payment section in cart.html
- [x] Add multiple payment options (Mpesa, Paybill)
- [x] Improve UI for payment selection
- [x] Add Mpesa STK Push integration

## 3. Implement Mpesa STK Push
- [x] Create netlify function for Mpesa API call
- [x] Use provided endpoint: https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest
- [x] Implement request body with dynamic values
- [x] Handle API response and errors
- [x] Create callback function for payment confirmation

## 4. Update Frontend Integration
- [x] Modify script.js to call Mpesa function
- [x] Add phone number input for Mpesa
- [x] Update checkout flow to include payment method selection
- [x] Handle success/failure responses

## 5. Test Payment Integration
- [ ] Test Mpesa STK Push with sandbox
- [ ] Verify payment flow
- [ ] Test error handling
- [ ] Ensure mobile compatibility
