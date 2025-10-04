# Fix Stock Function 500 Error

## Tasks
- [x] Update netlify/functions/stock.js to use database connection instead of external API
- [ ] Test the updated function locally or deploy and verify fix

## Details
The current stock.js function fetches data from an unreachable external API (ep-billowing-mode-adkbmnzk.neon.tech), causing 500 errors. Update it to connect directly to the Neon database using the NEON_DATABASE_URL environment variable, similar to api/index.js.

The function has been updated, but the NEON_DATABASE_URL environment variable needs to be set in Netlify for the function to connect to the database.
