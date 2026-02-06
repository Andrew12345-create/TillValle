# TillValle New Database Setup

## Database Connection
```
postgresql://neondb_owner:npg_StsfT1R6ZyNi@ep-bold-silence-aiue9xsj-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

## Tables Created

### 1. users
- id (SERIAL PRIMARY KEY)
- email (VARCHAR UNIQUE)
- password_hash (VARCHAR)
- **is_admin (BOOLEAN)** - Indicates if user is admin
- **is_superadmin (BOOLEAN)** - Indicates if user is superadmin
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

### 2. products
- id, name, price, category, description, stock
- created_at, updated_at

### 3. product_stock
- product_id, product_name, stock_quantity, in_stock
- last_updated

### 4. site_maintenance
- id, active, last_updated

### 5. maintenance_admins
- id, email, created_at

### 6. maintenance_logs
- id, admin_email, action, timestamp

### 7. orders
- id, user_id, total_amount, status, created_at

### 8. order_items
- id, order_id, product_id, quantity, price

## Default Admin Account
- **Email:** admin@tillvalle.com
- **Password:** coder123
- **Role:** Superadmin (is_admin=true, is_superadmin=true)

## Sample Products Loaded
- Fresh Milk (25 units)
- Farm Fresh Eggs (50 units)
- Apples (30 units)
- Bananas (15 units)
- Mangoes (20 units)
- Avocados (12 units)
- Kales (18 units)
- Spinach (22 units)
- Lettuce (8 units)
- Basil (10 units)
- Mint (14 units)
- Free-Range Chicken (5 units)

## Re-initialize Database
Run: `node scripts/init-new-database.js`
