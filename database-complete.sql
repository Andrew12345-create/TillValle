-- TillValle Complete Database Setup with Real Products
-- Execute this in your PostgreSQL database

-- 1. Drop and recreate products table with image support
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS product_stock CASCADE;

-- 2. Products table with image
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  category VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  image VARCHAR(255),
  stock INTEGER DEFAULT 50,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Product stock table
CREATE TABLE product_stock (
  product_id SERIAL PRIMARY KEY,
  product_name VARCHAR(255) NOT NULL,
  stock_quantity INTEGER DEFAULT 0,
  in_stock BOOLEAN DEFAULT true,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Orders table
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  total_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Order items table
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id),
  product_id INTEGER REFERENCES products(id),
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL
);

-- Insert all real products from shop
INSERT INTO products (name, price, category, description, image, stock) VALUES
-- Dairy
('Fresh Milk', 120, 'Dairy', 'Pure, fresh milk from our farm.', 'milk.png', 50),
('Farm Fresh Eggs', 25, 'Dairy', 'Fresh eggs from free-range chickens.', 'eggs.png', 100),
('Pure Ghee', 600, 'Dairy', 'Traditional clarified butter.', 'ghee.png', 20),
('Honey', 400, 'Dairy', 'Pure, natural honey from local beekeepers.', 'honey.png', 30),

-- Meat
('Free-Range Chicken', 800, 'Meat', 'Healthy, free-range chicken.', 'chicken.png', 15),

-- Fruits
('Bananas', 150, 'Fruits', 'Fresh bananas, perfect for snacking.', 'bananas-ripe.png', 60),
('Oranges', 200, 'Fruits', 'Juicy oranges, rich in vitamin C.', 'oranges.png', 40),
('Watermelon', 250, 'Fruits', 'Sweet watermelon, perfect for hot days.', 'watermelon.png', 25),
('Mangoes', 40, 'Fruits', 'Juicy mangoes, perfect for summer.', 'mangoes.png', 80),
('Lemon', 20, 'Fruits', 'Fresh lemons for cooking and drinks.', 'lemon.png', 100),
('Pawpaw', 120, 'Fruits', 'Sweet pawpaw fruit, rich in vitamins.', 'pawpaw.png', 35),
('Pixies', 35, 'Fruits', 'Mini sweet oranges, great for snacking.', 'pixies.png', 70),
('Avocadoes', 30, 'Fruits', 'Creamy avocados for healthy eating.', 'avocadoes.png', 90),
('Yellow Passion', 25, 'Fruits', 'Tangy passion fruit for juices.', 'yellow-passion.png', 60),
('Kiwi', 60, 'Fruits', 'Nutritious kiwi fruit, full of vitamin C.', 'kiwi.png', 40),
('Raw Bananas', 100, 'Fruits', 'Green bananas for cooking.', 'raw-bananas.png', 45),
('Dragon Fruit', 300, 'Fruits', 'Exotic dragon fruit, sweet and nutritious.', 'dragonfruit.png', 20),
('Soursop', 250, 'Fruits', 'Tropical soursop fruit, great for juices.', 'soursop.png', 15),

-- Herbs
('Basil', 50, 'Herbs', 'Fresh basil leaves for cooking.', 'basil.png', 50),
('Coriander', 30, 'Herbs', 'Aromatic coriander leaves and seeds.', 'coriander.png', 60),
('Mint', 40, 'Herbs', 'Fresh mint leaves for cooking and drinks.', 'mint.png', 55),
('Parsley', 35, 'Herbs', 'Fresh parsley leaves for cooking.', 'parsley.png', 50),
('Soursop Leaves', 200, 'Herbs', 'Medicinal soursop leaves.', 'soursop-herbs.png', 25),

-- Vegetables
('Kales (Sukuma Wiki)', 30, 'Vegetables', 'Nutritious kales, perfect for sukuma wiki.', 'kales.png', 80),
('Lettuce', 80, 'Vegetables', 'Fresh, crisp lettuce for salads.', 'lettuce.png', 40),
('Managu', 40, 'Vegetables', 'Traditional African vegetable.', 'managu.png', 50),
('Terere', 40, 'Vegetables', 'Fresh terere leaves for cooking.', 'terere.png', 50),
('Salgaa', 20, 'Vegetables', 'Fresh salgaa for traditional dishes.', 'salgaa.png', 60),
('Spinach', 30, 'Vegetables', 'Fresh spinach leaves, rich in iron.', 'spinach.png', 70),
('Cauliflower', 80, 'Vegetables', 'Fresh cauliflower, perfect for healthy meals.', 'cauliflower.png', 30),
('Broccoli', 70, 'Vegetables', 'Nutritious broccoli, rich in vitamins.', 'broccoli.png', 35),
('Kunde', 40, 'Vegetables', 'Fresh kunde leaves for traditional dishes.', 'kunde.png', 45);

-- Sync product_stock with products
INSERT INTO product_stock (product_name, stock_quantity, in_stock)
SELECT name, stock, (stock > 0) FROM products;

-- Update superadmin user
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

-- Insert default maintenance status
INSERT INTO site_maintenance (active)
SELECT false
WHERE NOT EXISTS (SELECT 1 FROM site_maintenance);
