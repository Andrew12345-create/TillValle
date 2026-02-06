# TillValle Database Integration Summary

## ✅ All Tables Connected and Synced

### 1. **users** Table
**Fields:** id, email, password_hash, is_admin, is_superadmin, created_at, updated_at

**Connected Endpoints:**
- `POST /signup` - Creates new user with admin flags
- `POST /login` - Returns user with admin status
- `POST /api/admin/login` - Validates admin/superadmin access
- `DELETE /delete-account` - Removes user
- `POST /request-otp` - Password reset for users
- `POST /reset-password` - Updates user password

**Usage:** Authentication, admin access control, user management

---

### 2. **products** Table
**Fields:** id, name, price, category, description, stock, created_at, updated_at

**Connected Endpoints:**
- `GET /api/products` - List all products
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (syncs with product_stock)
- `PUT /api/products/:id` - Update product (syncs with product_stock)
- `DELETE /api/products/:id` - Delete product (removes from product_stock)

**Synced With:** product_stock table (automatic sync on create/update/delete)

---

### 3. **product_stock** Table
**Fields:** product_id, product_name, stock_quantity, in_stock, last_updated

**Connected Endpoints:**
- `GET /stock` - Get all stock info
- `POST /stock` - Update stock quantity
- `POST /chatbot` - Chatbot queries stock info

**Synced With:** products table (automatic updates)

---

### 4. **orders** Table
**Fields:** id, user_id, total_amount, status, created_at

**Connected Endpoints:**
- `POST /api/orders` - Create new order
- `GET /api/orders/:user_id` - Get user's orders
- `PUT /api/orders/:id/status` - Update order status

**Synced With:** 
- order_items table (creates items when order created)
- products table (reduces stock when order placed)
- users table (links to user_id)

---

### 5. **order_items** Table
**Fields:** id, order_id, product_id, quantity, price

**Connected Endpoints:**
- `POST /api/orders` - Creates order items
- `GET /api/orders/:user_id` - Returns items with order

**Synced With:**
- orders table (foreign key)
- products table (foreign key, stock reduction)

---

### 6. **site_maintenance** Table
**Fields:** id, active, last_updated

**Connected Endpoints:**
- `GET /maintenance` - Check maintenance status
- `POST /maintenance` - Toggle maintenance mode

**Usage:** Site-wide maintenance mode control

---

### 7. **maintenance_admins** Table
**Fields:** id, email, created_at

**Connected Endpoints:**
- `POST /maintenance` - Validates admin email
- Middleware: `checkMaintenance` - Allows admin access during maintenance

**Usage:** Whitelist of admins who can access site during maintenance

---

### 8. **maintenance_logs** Table
**Fields:** id, admin_email, action, timestamp

**Connected Endpoints:**
- `POST /maintenance` - Logs maintenance actions

**Usage:** Audit trail of maintenance mode changes

---

## 🔄 Data Flow Examples

### User Registration & Login
1. User signs up → `users` table (with is_admin=false)
2. User logs in → Returns user data with admin status
3. Admin logs in → Session stores admin/superadmin flags

### Product Management
1. Admin creates product → `products` + `product_stock` tables
2. Admin updates product → Both tables sync automatically
3. Admin deletes product → Removed from both tables
4. Chatbot queries stock → Reads from `product_stock`

### Order Processing
1. User places order → Creates record in `orders`
2. Order items added → Creates records in `order_items`
3. Stock reduced → Updates `products.stock`
4. Order status updated → Updates `orders.status`

### Maintenance Mode
1. Admin enables maintenance → `site_maintenance.active = true`
2. Action logged → New record in `maintenance_logs`
3. Non-admin users blocked → Middleware checks `maintenance_admins`
4. Admins can access → Email verified in `maintenance_admins`

---

## 🔐 Admin Access Levels

### Regular Admin (is_admin=true, is_superadmin=false)
- Can access admin panel
- Can manage products
- Can view orders
- Can toggle maintenance mode (if in maintenance_admins)

### Superadmin (is_admin=true, is_superadmin=true)
- All admin privileges
- Can manage other admins
- Full database access
- Default account: admin@tillvalle.com / coder123

---

## 📊 Database Connection
**Primary Pool:** All tables use the new database
```
postgresql://neondb_owner:npg_StsfT1R6ZyNi@ep-bold-silence-aiue9xsj-pooler.c-4.us-east-1.aws.neon.tech/neondb
```

**Status:** ✅ All tables created and populated
**Sync:** ✅ All cross-table operations working
**API:** ✅ All endpoints connected to correct tables
