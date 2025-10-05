# TODO: Implement Quantity-Based Stock Control

## Database Changes
- [x] Update db/init_stock.sql to use stock_quantity INTEGER instead of in_stock BOOLEAN
- [x] Provide ALTER TABLE SQL for existing Neon database

## API Functions
- [x] Update netlify/functions/stock.js to handle stock_quantity
- [x] Update api/index.js to handle stock_quantity
- [x] Update netlify/functions/chatbot.js to report stock quantities

## Frontend Changes
- [x] Update public/admin.html to display and edit stock quantities
- [x] Update public/script.js to display stock quantities instead of in/out

## Testing
- [x] Test admin page stock updates
- [x] Test shop page displays quantities
- [x] Test chatbot reports quantities
