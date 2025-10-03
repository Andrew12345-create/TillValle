-- SQL to create product_stock table for Neon REST API usage

CREATE TABLE product_stock (
    product_id VARCHAR(50) PRIMARY KEY,
    product_name VARCHAR(100) NOT NULL,
    in_stock BOOLEAN NOT NULL DEFAULT TRUE,
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Insert initial products with stock status (true = in stock, false = out of stock)
INSERT INTO product_stock (product_id, product_name, in_stock) VALUES
('milk', 'Milk', TRUE),
('eggs', 'Eggs', TRUE),
('eggs-kienyeji', 'Eggs (Kienyeji)', TRUE),
('egg-crate', 'Egg Crate (30 eggs)', TRUE),
('butter', 'Butter', TRUE),
('chicken', 'Chicken', TRUE),
('ghee', 'Ghee', TRUE),
('apples', 'Apples', TRUE),
('raw-bananas', 'Raw Bananas', TRUE),
('bananas-ripe', 'Bananas (ripe)', TRUE),
('soursop-fruit', 'Soursop Fruit', TRUE),
('blueberries', 'Blueberries', TRUE),
('macadamia', 'Macadamia', TRUE),
('dragonfruit', 'Dragonfruit', TRUE),
('mangoes', 'Mangoes', TRUE),
('lemon', 'Lemon', TRUE),
('pawpaw', 'Pawpaw', TRUE),
('pixies', 'Pixies', TRUE),
('avocadoes', 'Avocadoes', TRUE),
('yellow-passion', 'Yellow Passion', TRUE),
('kiwi', 'Kiwi', TRUE),
('basil', 'Basil', TRUE),
('coriander', 'Coriander', TRUE),
('mint', 'Mint', TRUE),
('parsley', 'Parsley', TRUE),
('soursop-leaves', 'Soursop Leaves', TRUE),
('kales', 'Kales (Sukuma Wiki)', TRUE),
('lettuce', 'Lettuce', TRUE),
('managu', 'Managu', TRUE),
('terere', 'Terere', TRUE),
('salgaa', 'Salgaa', TRUE),
('spinach', 'Spinach', TRUE);
