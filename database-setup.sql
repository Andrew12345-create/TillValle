-- TillValle Database Setup SQL
-- Execute this in your PostgreSQL database

-- 1. Users table with admin roles
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  is_admin BOOLEAN DEFAULT false,
  is_superadmin BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Products table
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  category VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  stock INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Product stock table
CREATE TABLE IF NOT EXISTS product_stock (
  product_id SERIAL PRIMARY KEY,
  product_name VARCHAR(255) NOT NULL,
  stock_quantity INTEGER DEFAULT 0,
  in_stock BOOLEAN DEFAULT false,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Site maintenance table
CREATE TABLE IF NOT EXISTS site_maintenance (
  id SERIAL PRIMARY KEY,
  active BOOLEAN DEFAULT false,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Maintenance admins table
CREATE TABLE IF NOT EXISTS maintenance_admins (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Maintenance logs table
CREATE TABLE IF NOT EXISTS maintenance_logs (
  id SERIAL PRIMARY KEY,
  admin_email VARCHAR(255) NOT NULL,
  action VARCHAR(50) NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Orders table
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  total_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Order items table
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id),
  product_id INTEGER REFERENCES products(id),
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL
);

-- Insert default maintenance status
INSERT INTO site_maintenance (active)
SELECT false
WHERE NOT EXISTS (SELECT 1 FROM site_maintenance);

-- Insert sample products
INSERT INTO product_stock (product_name, stock_quantity, in_stock) 
SELECT * FROM (VALUES
  ('Fresh Milk', 25, true),
  ('Farm Fresh Eggs', 50, true),
  ('Apples', 30, true),
  ('Bananas', 15, true),
  ('Mangoes', 20, true),
  ('Avocados', 12, true),
  ('Kales', 18, true),
  ('Spinach', 22, true),
  ('Lettuce', 8, true),
  ('Basil', 10, true),
  ('Mint', 14, true),
  ('Free-Range Chicken', 5, true)
) AS v(product_name, stock_quantity, in_stock)
WHERE NOT EXISTS (SELECT 1 FROM product_stock WHERE product_name = v.product_name);

-- Insert superadmin user (password: coder123)
INSERT INTO users (email, password_hash, is_admin, is_superadmin)
VALUES ('admin@tillvalle.com', '$2a$10$1O5/Or5Py76IsMhSeUzYu.1.HGlkAJd/lO4uEHQl3Lo/8UT/375NG', true, true)
ON CONFLICT (email) DO UPDATE SET
  password_hash = '$2a$10$1O5/Or5Py76IsMhSeUzYu.1.HGlkAJd/lO4uEHQl3Lo/8UT/375NG',
  is_admin = true,
  is_superadmin = true;

-- Add to maintenance admins
INSERT INTO maintenance_admins (email)
VALUES ('admin@tillvalle.com')
ON CONFLICT (email) DO NOTHING;
