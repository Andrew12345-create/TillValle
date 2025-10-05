# TODO: Fix Chatbot Stock Query Issue

## Problem
When asking the AI "What products do we have in stock?", it responds with "Sorry, I couldn't fetch the stock information right now."

## Root Cause
The Netlify chatbot function tries to fetch stock data from another Netlify function, but the fetch fails due to incorrect database URL or URL construction.

## Solution
- Update stock.js to use NEON_DATABASE_URL instead of STOCK_DB_URL for consistency.
- Modify chatbot.js to query the database directly instead of fetching from the stock function.

## Steps
- [x] Update netlify/functions/stock.js to use process.env.NEON_DATABASE_URL
- [x] Update netlify/functions/chatbot.js to include database query for stock
- [ ] Test the chatbot stock query
