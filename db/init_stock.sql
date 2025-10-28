-- SQL to create a product stock table for Neon database

CREATE TABLE product_stock (
    product_id VARCHAR(50) PRIMARY KEY,
    product_name VARCHAR(100) NOT NULL,
    stock_quantity INTEGER NOT NULL DEFAULT 100,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert initial products with stock quantity (default 100)
INSERT INTO product_stock (product_id, product_name, stock_quantity) VALUES
('milk', 'Milk', 100),
('eggs', 'Eggs', 100),
('eggs-kienyeji', 'Eggs (Kienyeji)', 100),
('egg-crate', 'Egg Crate (30 eggs)', 100),
('butter', 'Butter', 100),
('chicken', 'Chicken', 100),
('ghee', 'Ghee', 100),
('apples', 'Apples', 100),
('raw-bananas', 'Raw Bananas', 100),
('bananas-ripe', 'Bananas (ripe)', 100),
('soursop-fruit', 'Soursop Fruit', 100),
('blueberries', 'Blueberries', 100),
('macadamia', 'Macadamia', 100),
('dragonfruit', 'Dragonfruit', 100),
('mangoes', 'Mangoes', 100),
('lemon', 'Lemon', 100),
('pawpaw', 'Pawpaw', 100),
('pixies', 'Pixies', 100),
('avocadoes', 'Avocadoes', 100),
('yellow-passion', 'Yellow Passion', 100),
('kiwi', 'Kiwi', 100),
('basil', 'Basil', 100),
('coriander', 'Coriander', 100),
('mint', 'Mint', 100),
('parsley', 'Parsley', 100),
('soursop-leaves', 'Soursop Leaves', 100),
('kales', 'Kales (Sukuma Wiki)', 100),
('lettuce', 'Lettuce', 100),
('managu', 'Managu', 100),
('terere', 'Terere', 100),
('salgaa', 'Salgaa', 100),
('spinach', 'Spinach', 100),
('cauliflower', 'Cauliflower', 100),
('broccoli', 'Broccoli', 100),
('kunde', 'Kunde', 100),
('honey', 'Honey', 100);
