# TODO: Fix Login Errors

## Issues Identified
1. **Local 404 Error**: Frontend fetches `/.netlify/functions/login` but local server has `/login` route.
2. **Netlify 500 Error**: Likely due to missing environment variables (NEON_DATABASE_URL, JWT_SECRET).
3. **SyntaxError**: Code tries to parse non-JSON response as JSON when 404 occurs.

## Fixes Needed
- [x] Update `public/login.html` to use correct URL for local vs Netlify.
- [x] Add response status check before parsing JSON in login.html.
- [ ] Ensure environment variables are set in Netlify dashboard.
- [x] Test local server with `node api/index.js`.
- [ ] Verify database connection and JWT secret.

## Steps
1. Edit `public/login.html` fetch URL to `/login` for local development.
2. Add `if (!response.ok) throw new Error('Network error');` before `response.json()`.
3. Set NEON_DATABASE_URL and JWT_SECRET in Netlify environment variables.
4. Run local server and test login.
5. Deploy to Netlify and test.
